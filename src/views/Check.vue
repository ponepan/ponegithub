<template>
  <div class="container">
    <div class="block-card">
      <van-notice-bar background="#fff7cc" color="#d48806" :scrollable="true">
        最多批量核对20注；号码保存在本地浏览器，清理缓存数据会丢失
      </van-notice-bar>
      <h3 class="title">
        <van-icon name="arrow-left" class="back-btn" @click="$emit('back-to-home')" />
        <img :src="lotteryIcon" alt="" class="title-icon" />
        {{ lotteryName }} 号码核对
      </h3>

      <!-- 开奖信息 -->
      <van-field
        v-model="issue"
        label="开奖期号"
        placeholder="例如：2026090 或 26090"
        :right-icon="fetching ? '' : 'search'"
        @click-right-icon="manualQuery"
        @blur="onIssueBlur"
      >
        <template v-if="fetching" #button>
          <van-loading size="18" />
        </template>
      </van-field>
      <div class="draw-section">
        <div class="draw-label">开奖号码</div>
        <div v-if="fetching" class="draw-loading">
          <van-loading size="18" /><span>查询中...</span>
        </div>
        <div v-else-if="drawNums" class="draw-balls-wrap">
          <span
            v-for="(ball, idx) in drawBalls"
            :key="idx"
            :class="['ball', ball.color]"
          >{{ ball.num }}</span>
        </div>
        <div v-else class="draw-placeholder">{{ fetchError || '输入期号后自动获取' }}</div>
      </div>
      <div v-if="drawNums" class="draw-info-bar">
        <van-tag type="primary" size="medium">{{ drawDate }}</van-tag>
        <span class="source-tip">数据来源：官方开奖</span>
      </div>
      <div v-if="fetchError" class="error-bar">
        <span>{{ fetchError }}</span>
        <van-button size="mini" type="primary" @click="manualQuery">手动查询</van-button>
      </div>

      <!-- 待核对号码列表 -->
      <van-cell-group>
        <van-cell title="待核对号码列表" />
        <van-cell v-for="(item, i) in batchList" :key="i">
          <template #title>
            <span class="batch-balls">{{ item.nums }}</span>
            <van-tag
              v-if="item.entryType === 'compound'"
              type="warning"
              size="small"
              plain
              style="margin-left: 6px"
            >复式 {{ item.comboCount }}注</van-tag>
          </template>
          <template #label>{{ item.remark }}</template>
          <template #right-icon>
            <van-button size="mini" type="danger" @click="batchList.splice(i, 1)">移除</van-button>
          </template>
        </van-cell>
        <van-cell v-if="batchList.length === 0" title="暂无号码，请在下方添加" class="empty-cell" />
      </van-cell-group>

      <!-- 一键批量核对 -->
      <van-button block type="success" style="margin: 10px 0" @click="batchCheck">
        一键批量核对
      </van-button>

      <!-- 添加号码 -->
      <van-divider>临时添加号码</van-divider>
      <div class="add-section">
        <!-- 号码球实时预览 + pending 待确认 + 区分符 -->
        <div class="input-balls-wrap">
          <span v-if="displayBalls.length === 0 && !pendingDigits" class="keypad-placeholder">{{ keypadHint }}</span>
          <template v-for="(ball, idx) in displayBalls" :key="idx">
            <span
              :class="['ball', ball.pending ? 'ball-pending' : ball.color]"
            >{{ ball.num }}</span>
            <!-- 前区/后区分隔符 -->
            <span
              v-if="ball.split"
              class="ball-split"
            >+</span>
          </template>
        </div>

        <!-- 输入进度提示 -->
        <div v-if="keypadProgress" class="keypad-progress">{{ keypadProgress }}</div>

        <!-- 单式/复式模式并列切换（仅 SSQ/DLT/KL8 可用） -->
        <div v-if="supportsCompound" class="compound-toggle-row">
          <span
            :class="['mode-tab', { 'mode-active': !isCompoundMode }]"
            @click="switchToMode(false)"
          >单式模式</span>
          <span
            :class="['mode-tab', { 'mode-active': isCompoundMode }]"
            @click="switchToMode(true)"
          >复式模式</span>
          <!-- 前/后区切换（复式 SSQ/DLT 时显示） -->
          <template v-if="isCompoundMode && keypadConfig.hasSplit && keypadConfig.splitAfter === 'dynamic'">
            <van-button
              :type="compoundZone === 'front' ? 'primary' : 'default'"
              size="small"
              class="zone-toggle-btn"
              @click="compoundZone = compoundZone === 'front' ? 'back' : 'front'"
            >
              {{ compoundZone === 'front' ? zoneLabels.front : zoneLabels.back }}
            </van-button>
          </template>
        </div>

        <!-- 文本框（可粘贴/手动输入，容错解析） -->
        <van-field
          v-model="inputNum"
          :placeholder="inputPlaceholder"
          @keyup.enter="addTemp"
          @focus="onInputFocus"
        />
        <div v-if="inputError" class="input-error">{{ inputError }}</div>

        <!-- 九宫格小键盘（所有彩种通用） -->
        <div class="keypad-grid">
          <div
            v-for="n in [1,2,3,4,5,6,7,8,9]"
            :key="n"
            class="key-btn"
            @click="tapDigit(n)"
          >{{ n }}</div>
          <div class="key-btn key-del" @click="tapBackspace">⌫</div>
          <div class="key-btn" @click="tapDigit(0)">0</div>
          <div class="key-btn key-ok" @click="handleAdd">✓</div>
        </div>
      </div>

      <van-button block type="primary" style="margin: 10px 0" @click="handleAdd">
        添加到列表（{{ batchList.length }}/{{ MAX_COUNT }}）
      </van-button>

      <!-- 核对结果弹窗 -->
      <div v-if="showResultPopup" class="result-overlay" @click.self="showResultPopup = false">
        <div class="result-popup">
          <!-- 彩带飘落动画（中奖时） -->
          <div v-if="hasWin" class="confetti-container">
            <div v-for="c in confettiDots" :key="c.id"
              class="confetti-dot"
              :style="c.style"
            ></div>
          </div>

          <!-- 情绪大标题 -->
          <div :class="['emotion-hero', hasWin ? 'hero-win' : 'hero-lose']">
            <div class="emotion-emoji">{{ emotion.emoji }}</div>
            <div class="emotion-title">{{ emotion.title }}</div>
            <div class="emotion-subtitle">{{ emotion.subtitle }}</div>
          </div>

          <!-- 统计卡片 -->
          <div class="stats-row">
            <div class="stat-card stat-total">
              <div class="stat-num">{{ resultList.length }}</div>
              <div class="stat-label">核对注数</div>
            </div>
            <div class="stat-card stat-win">
              <div class="stat-num">{{ winCount }}</div>
              <div class="stat-label">中奖注数</div>
            </div>
            <div v-if="bestLevel" class="stat-card stat-best">
              <div class="stat-num">{{ bestLevel }}</div>
              <div class="stat-label">最高奖项</div>
            </div>
          </div>

          <!-- 结果列表 -->
          <div class="result-list">
            <div
              v-for="(res, i) in resultList"
              :key="i"
              :class="['result-card', res.win ? 'card-win' : 'card-lose']"
            >
              <div class="result-left">
                <div class="result-nums">
                  {{ res.nums }}
                  <van-tag v-if="res.entryType === 'compound'" type="warning" size="mini" plain>复式{{ res.comboCount }}注</van-tag>
                </div>
                <div class="result-remark">{{ res.remark }}</div>
                <!-- 复式中奖细项 -->
                <div v-if="res.entryType === 'compound' && res.breakdown && res.breakdown.length > 0" class="compound-breakdown">
                  <div class="breakdown-title">中奖明细：</div>
                  <div v-for="b in res.breakdown" :key="b.level" class="breakdown-item">
                    <span class="breakdown-level">{{ b.level }}</span>
                    <span class="breakdown-count">{{ b.count }} 注</span>
                  </div>
                </div>
              </div>
              <div class="result-right">
                <span :class="['result-badge', res.win ? 'badge-win' : 'badge-lose']">
                  {{ res.win ? '🎯 ' : '' }}{{ res.level }}
                </span>
              </div>
            </div>
          </div>

          <!-- 关闭按钮 -->
          <van-button block type="primary" round size="large" @click="showResultPopup = false">
            {{ hasWin ? '🎉 开心收下好运' : '💪 继续努力' }}
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { showToast } from 'vant'
import {
  validateLotteryNums, formatLotteryNums, normalizeInput,
  checkCompoundNum, detectEntryType, getCompoundComboCount, COMPOUND_LIMITS
} from '@/utils/validate'
import { queryDrawResult } from '@/utils/lotteryApi'

// 彩种图标映射
import ssqIcon from '@/assets/icons/ssq.svg'
import fc3dIcon from '@/assets/icons/fc3d.svg'
import dltIcon from '@/assets/icons/dlt.svg'
import qxcIcon from '@/assets/icons/qxc.svg'
import pl3Icon from '@/assets/icons/pl3.svg'
import pl5Icon from '@/assets/icons/pl5.svg'
import kl8Icon from '@/assets/icons/kl8.svg'

const iconMap = { ssq: ssqIcon, fc3d: fc3dIcon, dlt: dltIcon, qxc: qxcIcon, pl3: pl3Icon, pl5: pl5Icon, kl8: kl8Icon }

const props = defineProps({
  lotteryType: { type: String, default: 'ssq' },
  lotteryName: { type: String, default: '双色球' },
  loadedGroupList: { type: Array, default: null }
})
const emit = defineEmits(['back-to-home'])

const lotteryIcon = computed(() => iconMap[props.lotteryType] || ssqIcon)

/**
 * 通用号码球解析函数
 * 双色球：前6红球(red) + 后1蓝球(blue)
 * 大乐透：前5球(red) + 后2球(blue)
 * 排列三/五、福彩3D、七星彩：灰色球
 * 快乐8：红色球
 * @returns {Array<{num: string, color: string}>}
 */
function parseBalls(type, raw) {
  const s = normalizeInput(type, raw)
  if (!s) return []

  // 双色球 "01,02,03,04,05,06+07"
  if (type === 'ssq' && s.includes('+')) {
    const [redPart, bluePart] = s.split('+')
    const reds = redPart.split(',').filter(Boolean).map(n => ({ num: n, color: 'red' }))
    const blues = bluePart.split(',').filter(Boolean).map(n => ({ num: n, color: 'blue' }))
    return [...reds, ...blues]
  }

  // 大乐透 "01,02,03,04,05+06,07"
  if (type === 'dlt' && s.includes('+')) {
    const [front, back] = s.split('+')
    const fronts = front.split(',').filter(Boolean).map(n => ({ num: n, color: 'red' }))
    const backs = back.split(',').filter(Boolean).map(n => ({ num: n, color: 'blue' }))
    return [...fronts, ...backs]
  }

  // 福彩3D、排列三 "123"
  if ((type === 'fc3d' || type === 'pl3') && /^\d{3}$/.test(s)) {
    return s.split('').map(n => ({ num: n, color: 'gray' }))
  }

  // 排列五 "12345"
  if (type === 'pl5' && /^\d{5}$/.test(s)) {
    return s.split('').map(n => ({ num: n, color: 'gray' }))
  }

  // 七星彩 "1234567"
  if (type === 'qxc' && /^\d{7}$/.test(s)) {
    return s.split('').map(n => ({ num: n, color: 'gray' }))
  }

  // 快乐8 或其他逗号分隔
  if (s.includes(',')) {
    return s.split(',').filter(Boolean).map(n => ({ num: n.trim(), color: 'red' }))
  }

  // 兜底
  return [{ num: s, color: 'gray' }]
}

/** 开奖号码球 */
const drawBalls = computed(() => parseBalls(props.lotteryType, drawNums.value))

/** 临时输入号码实时预览球 */
const inputBalls = computed(() => {
  const val = inputNum.value.trim()
  if (!val) return []
  return parseBalls(props.lotteryType, val)
})

/**
 * 九宫格键盘配置（所有彩种通用）
 * - groupSize: 每个号码占几位数字（数字彩=1位, 乐透型=2位）
 * - totalCount: 复式模式下等于前+后上限之和
 * - hasSplit: 是否有前后区分离
 * - splitAfter: 前区号码个数（复式模式下为 'dynamic'）
 * - isCompound: 是否复式键盘模式
 */
const isCompoundMode = ref(false)
const compoundZone = ref('front')  // 复式键盘当前区域
const compoundFrontCount = ref(0)   // 复式键盘前区已确认球数

// 可复式彩种判断
const supportsCompound = computed(() => ['ssq', 'dlt', 'kl8'].includes(props.lotteryType))

const zoneLabels = computed(() => {
  if (props.lotteryType === 'ssq') return { front: '🔴 红球区', back: '🔵 蓝球区' }
  return { front: '前区', back: '后区' }
})

// 切换单式/复式模式
function switchToMode(compound) {
  if (isCompoundMode.value === compound) return
  isCompoundMode.value = compound
  inputNum.value = ''
  pendingDigits.value = ''
  compoundZone.value = 'front'
  compoundFrontCount.value = 0
}

const keypadConfig = computed(() => {
  const t = props.lotteryType
  const lim = COMPOUND_LIMITS[t]

  // 数字彩（不支持复式）
  if (t === 'fc3d' || t === 'pl3') return { groupSize: 1, totalCount: 3, separator: '', hasSplit: false, splitAfter: 0, frontCount: 0, backCount: 0, isCompound: false }
  if (t === 'pl5') return { groupSize: 1, totalCount: 5, separator: '', hasSplit: false, splitAfter: 0, frontCount: 0, backCount: 0, isCompound: false }
  if (t === 'qxc') return { groupSize: 1, totalCount: 7, separator: '', hasSplit: false, splitAfter: 0, frontCount: 0, backCount: 0, isCompound: false }

  // 乐透型 & 快乐8
  if (isCompoundMode.value && supportsCompound.value && lim) {
    if (t === 'ssq') {
      return {
        groupSize: 2, totalCount: lim.maxRed + lim.maxBlue, separator: ',',
        hasSplit: true, splitAfter: 'dynamic',
        frontCount: lim.maxRed, backCount: lim.maxBlue,
        compoundMaxFront: lim.maxRed, compoundMaxBack: lim.maxBlue,
        frontMax: 33, backMax: 16, frontMin: 1, backMin: 1,
        isCompound: true
      }
    }
    if (t === 'dlt') {
      return {
        groupSize: 2, totalCount: lim.maxFront + lim.maxBack, separator: ',',
        hasSplit: true, splitAfter: 'dynamic',
        frontCount: lim.maxFront, backCount: lim.maxBack,
        compoundMaxFront: lim.maxFront, compoundMaxBack: lim.maxBack,
        frontMax: 35, backMax: 12, frontMin: 1, backMin: 1,
        isCompound: true
      }
    }
    if (t === 'kl8') {
      return {
        groupSize: 2, totalCount: lim.maxNumbers, separator: ',',
        hasSplit: false, splitAfter: 0, frontCount: 0, backCount: 0,
        compoundMaxFront: lim.maxNumbers, compoundMaxBack: 0,
        frontMax: 80, backMax: 0, frontMin: 1, backMin: 0,
        isCompound: true
      }
    }
  }

  // 单式模式
  if (t === 'ssq') return { groupSize: 2, totalCount: 7, separator: ',', hasSplit: true, splitAfter: 6, frontCount: 6, backCount: 1, frontMax: 33, backMax: 16, frontMin: 1, backMin: 1, isCompound: false }
  if (t === 'dlt') return { groupSize: 2, totalCount: 7, separator: ',', hasSplit: true, splitAfter: 5, frontCount: 5, backCount: 2, frontMax: 35, backMax: 12, frontMin: 1, backMin: 1, isCompound: false }
  if (t === 'kl8') return { groupSize: 2, totalCount: 10, separator: ',', hasSplit: false, splitAfter: 0, frontCount: 0, backCount: 0, frontMax: 80, backMax: 0, frontMin: 1, backMin: 0, isCompound: false }
  return { groupSize: 1, totalCount: 10, separator: '', hasSplit: false, splitAfter: 0, frontCount: 0, backCount: 0, isCompound: false }
})

/** 将原始数字串按彩种规则格式化 */
function formatDigits(digits, cfg) {
  if (!digits) return ''
  const groups = []
  for (let i = 0; i < digits.length; i += cfg.groupSize) {
    groups.push(digits.slice(i, i + cfg.groupSize).padStart(cfg.groupSize, '0'))
  }
  // 复式动态分割：不做分割格式化，由 displayBalls 处理 "+" 位置
  if (cfg.isCompound && cfg.hasSplit && cfg.splitAfter === 'dynamic') {
    return groups.join(cfg.separator)
  }
  if (cfg.hasSplit && groups.length > cfg.splitAfter) {
    const front = groups.slice(0, cfg.splitAfter).join(cfg.separator)
    const back = groups.slice(cfg.splitAfter).join(cfg.separator)
    return `${front}+${back}`
  }
  return groups.join(cfg.separator)
}

/** 待确认数字缓冲区（SSQ/DLT/KL8 使用，每次 ✓ 确认一个球） */
const pendingDigits = ref('')

/**
 * 完整展示球列表（已确认球 + pending 待确认 + 区分符）
 * 数字彩 (groupSize=1)：不显示 pending，数字直接就是球
 * 乐透型 (groupSize=2)：显示已确认球 + pending 幽灵球 + 前后区 + 分隔符
 */
const displayBalls = computed(() => {
  const cfg = keypadConfig.value
  const confirmed = parseBalls(props.lotteryType, inputNum.value)

  // 数字彩：直接返回
  if (cfg.groupSize === 1) return confirmed

  // 复式模式：动态插入 + 分隔符
  if (cfg.isCompound && cfg.hasSplit && cfg.splitAfter === 'dynamic') {
    const result = []
    const frontBalls = compoundFrontCount.value
    confirmed.forEach((b, i) => {
      if (i === frontBalls) result.push({ num: '+', color: 'split', pending: false, split: true })
      result.push(b)
    })
    // 如果 pending 在后区且前区已满（或没有confirmed），插入分隔符
    if (pendingDigits.value && confirmed.length === 0) {
      // 没有确认球，pending 在前区
    } else if (pendingDigits.value && confirmed.length === frontBalls && frontBalls > 0) {
      // pending 在后区，需要插入分隔符
      result.push({ num: '+', color: 'split', pending: false, split: true })
    }
    if (pendingDigits.value) {
      result.push({ num: pendingDigits.value.padStart(cfg.groupSize, '0'), color: 'pending', pending: true })
    }
    return result
  }

  // 乐透型单式：在已确认球和 pending 之间插入 + 分隔符
  const result = [...confirmed]
  const confirmedCount = confirmed.length

  if (cfg.hasSplit && confirmedCount >= cfg.splitAfter && pendingDigits.value) {
    result.push({ num: '+', color: 'split', pending: false, split: true })
  }

  if (pendingDigits.value) {
    result.push({ num: pendingDigits.value.padStart(cfg.groupSize, '0'), color: 'pending', pending: true })
  }

  return result
})

/** 输入号码实时校验错误 */
const inputError = computed(() => {
  const val = inputNum.value.trim()
  if (!val) return ''
  const check = validateLotteryNums(props.lotteryType, val)
  return check.pass ? '' : check.msg
})

/** 输入进度提示 */
const keypadHint = computed(() => {
  const t = props.lotteryType
  const cfg = keypadConfig.value
  if (cfg.isCompound) {
    if (t === 'ssq') return `复式模式：红球≤${cfg.compoundMaxFront}个(1-33) / 蓝球≤${cfg.compoundMaxBack}个(1-16)  |  当前：${compoundZone.value === 'front' ? '红球区' : '蓝球区'}`
    if (t === 'dlt') return `复式模式：前区≤${cfg.compoundMaxFront}个(1-35) / 后区≤${cfg.compoundMaxBack}个(1-12)  |  当前：${compoundZone.value === 'front' ? '前区' : '后区'}`
    if (t === 'kl8') return `复式模式：可选${cfg.compoundMaxFront}个号码(1-80)，选出10个为一组`
  }
  if (['fc3d', 'pl3'].includes(t)) return '点击数字输入（3位）'
  if (t === 'pl5') return '点击数字输入（5位）'
  if (t === 'qxc') return '点击数字输入（7位）'
  if (t === 'ssq') return '逐个输入号码：点击数字 + 按 ✓ 确认（红球6个 1-33，蓝球1个 1-16）'
  if (t === 'dlt') return '逐个输入号码：点击数字 + 按 ✓ 确认（前区5个 1-35，后区2个 1-12）'
  if (t === 'kl8') return '逐个输入号码：点击数字 + 按 ✓ 确认（选10个，1-80）'
  return '点击数字输入'
})

const keypadProgress = computed(() => {
  const cfg = keypadConfig.value
  if (cfg.isCompound && cfg.hasSplit && cfg.splitAfter === 'dynamic') {
    const frontDone = compoundFrontCount.value
    const backDone = Math.max(0, Math.floor(inputNum.value.replace(/\D/g, '').length / cfg.groupSize) - frontDone)
    const pending = pendingDigits.value ? 1 : 0
    const zone = compoundZone.value === 'front' ? '前区' : '后区'
    let text = `前区 ${frontDone}/${cfg.compoundMaxFront}  后区 ${backDone}/${cfg.compoundMaxBack}`
    if (pending) text += `  (${zone}待确认)`
    return text
  }
  if (cfg.isCompound && !cfg.hasSplit) {
    // KL8 复式
    const raw = inputNum.value.replace(/\D/g, '')
    const entered = Math.floor(raw.length / cfg.groupSize)
    return `${entered}/${cfg.compoundMaxFront} 个号码`
  }
  const raw = inputNum.value.replace(/\D/g, '')
  const entered = Math.min(Math.floor(raw.length / cfg.groupSize), cfg.totalCount)
  const pending = pendingDigits.value ? 1 : 0
  if (cfg.hasSplit) {
    const frontDone = Math.min(entered, cfg.frontCount)
    const backDone = Math.max(0, entered - cfg.frontCount)
    const pendingZone = (entered + pending) > cfg.frontCount || (entered >= cfg.frontCount && pending) ? '后区' : '前区'
    let text = `前区 ${frontDone}/${cfg.frontCount}  后区 ${backDone}/${cfg.backCount}`
    if (pending) text += `  (${pendingZone}待确认)`
    return text
  }
  let text = `${entered}/${cfg.totalCount} 个号码`
  if (pending) text += ' (待确认)'
  return text
})

/** 获取当前待输入号码的合法范围 */
function getBallRange(cfg, confirmedCount) {
  if (!cfg.hasSplit) {
    return { min: cfg.frontMin || 1, max: cfg.frontMax || 99, label: '' }
  }
  // 复式模式：根据当前选区判断
  if (cfg.isCompound) {
    if (compoundZone.value === 'front') {
      // 前区满了自动切后区
      if (compoundFrontCount.value >= (cfg.compoundMaxFront || 99)) {
        return { min: cfg.backMin, max: cfg.backMax, label: '后区' }
      }
      return { min: cfg.frontMin, max: cfg.frontMax, label: '前区' }
    }
    return { min: cfg.backMin, max: cfg.backMax, label: '后区' }
  }
  if (confirmedCount < cfg.splitAfter) {
    return { min: cfg.frontMin, max: cfg.frontMax, label: '前区' }
  }
  return { min: cfg.backMin, max: cfg.backMax, label: '后区' }
}

/** 检查号码是否与已确认号码重复 */
function isDuplicate(num, confirmedCount) {
  const cfg = keypadConfig.value
  const raw = inputNum.value.replace(/\D/g, '')
  const groups = []
  for (let i = 0; i < raw.length; i += cfg.groupSize) {
    groups.push(raw.slice(i, i + cfg.groupSize).padStart(cfg.groupSize, '0'))
  }
  // 复式：仅同区去重
  if (cfg.isCompound && cfg.hasSplit && cfg.splitAfter === 'dynamic') {
    const splitIdx = compoundFrontCount.value
    if (compoundZone.value === 'front') {
      return groups.slice(0, Math.min(splitIdx, groups.length)).includes(num)
    }
    return groups.slice(splitIdx).includes(num)
  }
  if (cfg.hasSplit && confirmedCount >= cfg.splitAfter) {
    const backStart = parseInt(cfg.splitAfter) * cfg.groupSize
    return groups.slice(parseInt(cfg.splitAfter)).includes(num)
  }
  return groups.includes(num)
}

/** 九宫格点击数字 */
function tapDigit(n) {
  const cfg = keypadConfig.value

  // 数字彩：直接追加
  if (cfg.groupSize === 1) {
    let raw = inputNum.value.replace(/\D/g, '')
    if (raw.length >= cfg.totalCount) return
    raw += String(n)
    inputNum.value = formatDigits(raw, cfg)
    return
  }

  // SSQ/DLT/KL8：累积到 pending 缓冲区
  const raw = inputNum.value.replace(/\D/g, '')
  const totalEntered = Math.floor(raw.length / cfg.groupSize)

  // 复式模式：检查当前区是否已满
  if (cfg.isCompound && cfg.hasSplit && cfg.splitAfter === 'dynamic') {
    if (compoundZone.value === 'front' && compoundFrontCount.value >= (cfg.compoundMaxFront || 99)) return
    if (compoundZone.value === 'back') {
      const backCount = totalEntered - compoundFrontCount.value
      if (backCount >= (cfg.compoundMaxBack || 99)) return
    }
  }
  // 复式 KL8
  if (cfg.isCompound && !cfg.hasSplit) {
    if (totalEntered >= (cfg.compoundMaxFront || 99)) return
  }
  // 单式
  if (!cfg.isCompound && totalEntered >= cfg.totalCount) return

  if (pendingDigits.value.length >= cfg.groupSize) return
  pendingDigits.value += String(n)
}

/** 九宫格删除 */
function tapBackspace() {
  const cfg = keypadConfig.value

  // 数字彩：直接退格
  if (cfg.groupSize === 1) {
    let raw = inputNum.value.replace(/\D/g, '')
    raw = raw.slice(0, -1)
    inputNum.value = raw ? formatDigits(raw, cfg) : ''
    return
  }

  // SSQ/DLT/KL8：先清 pending，再删已确认球
  if (pendingDigits.value) {
    pendingDigits.value = pendingDigits.value.slice(0, -1)
    return
  }
  let raw = inputNum.value.replace(/\D/g, '')
  if (raw.length >= cfg.groupSize) {
    const totalEntered = Math.floor(raw.length / cfg.groupSize)
    // 复式模式：追踪 front count 减少
    const isCompound = cfg.isCompound && cfg.hasSplit && cfg.splitAfter === 'dynamic'
    if (isCompound && totalEntered <= compoundFrontCount.value) {
      compoundFrontCount.value = Math.max(0, compoundFrontCount.value - 1)
      if (compoundFrontCount.value === 0) {
        compoundZone.value = 'front'
      }
    }
    raw = raw.slice(0, -cfg.groupSize)
    inputNum.value = raw ? formatDigits(raw, cfg) : ''
  }
}

/** 文本框获得焦点时，清空 pending（用户准备粘贴或手动编辑） */
function onInputFocus() {
  pendingDigits.value = ''
}

/** ✓ 确认键：数字彩直接校验添加，乐透型先确认 pending 球 */
function handleAdd() {
  const cfg = keypadConfig.value

  // 乐透型 (groupSize=2)：先确认 pending 中的球
  if (cfg.groupSize === 2 && pendingDigits.value) {
    const num = pendingDigits.value.padStart(cfg.groupSize, '0')
    const n = parseInt(num, 10)
    const raw = inputNum.value.replace(/\D/g, '')
    const confirmedCount = Math.floor(raw.length / cfg.groupSize)
    const isCompound = cfg.isCompound && cfg.hasSplit && cfg.splitAfter === 'dynamic'

    // 范围校验
    const range = getBallRange(cfg, confirmedCount)
    if (n < range.min || n > range.max) {
      return showToast(`${range.label}号码范围 ${range.min}~${range.max}，${num} 超出范围`)
    }

    // 重复校验
    if (isDuplicate(num, confirmedCount)) {
      return showToast(`号码 ${num} 与已有号码重复`)
    }

    pendingDigits.value = ''
    const newRaw = raw + num.padStart(cfg.groupSize, '0')
    inputNum.value = formatDigits(newRaw, cfg)

    // 复式模式：追踪前区球数
    if (isCompound && compoundZone.value === 'front') {
      compoundFrontCount.value++
    }

    const newCount = Math.floor(newRaw.length / cfg.groupSize)

    // 复式 SSQ/DLT：前区满了自动切后区
    if (isCompound && compoundZone.value === 'front' && compoundFrontCount.value >= (cfg.compoundMaxFront || 99)) {
      compoundZone.value = 'back'
      return
    }

    // 单式模式：满则自动添加
    if (!cfg.isCompound && newCount >= cfg.totalCount) {
      setTimeout(() => addTemp(), 150)
    }
    return
  }

  // 数字彩：校验位数
  if (cfg.groupSize === 1) {
    const raw = inputNum.value.replace(/\D/g, '')
    if (raw.length < cfg.totalCount) {
      return showToast(`请输满 ${cfg.totalCount} 位数字（当前 ${raw.length} 位）`)
    }
  }

  // 最终添加
  addTemp()
}

const issue = ref('')
const drawNums = ref('')
const inputNum = ref('')
const batchList = ref([])
const resultList = ref([])
const MAX_COUNT = 20
const fetching = ref(false)
const fetchError = ref('')
const drawDate = ref('')

let debounceTimer = null

/** 自动查询开奖号码 */
async function doQuery(issueNum) {
  if (!issueNum || issueNum.trim().length < 3) {
    fetchError.value = ''
    return
  }

  fetching.value = true
  fetchError.value = ''

  const result = await queryDrawResult(props.lotteryType, issueNum.trim())

  fetching.value = false

  if (result.success) {
    drawNums.value = result.data.result
    drawDate.value = result.data.date || ''
    fetchError.value = ''
  } else {
    drawNums.value = ''
    drawDate.value = ''
    fetchError.value = result.error || '查询失败'
  }
}

/** 输入框失焦时触发查询 */
function onIssueBlur() {
  const val = issue.value.trim()
  if (val && val.length >= 5) {
    doQuery(val)
  }
}

/** 手动查询 */
function manualQuery() {
  const val = issue.value.trim()
  if (!val) return showToast('请先输入期号')
  doQuery(val)
}

/** 监听期号输入变化，自动查询（防抖 800ms） */
watch(issue, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer)

  // 清空旧结果
  if (!newVal || !newVal.trim()) {
    drawNums.value = ''
    drawDate.value = ''
    fetchError.value = ''
    return
  }

  const val = newVal.trim()

  // 最小长度要求
  const minLenMap = {
    ssq: 5, dlt: 5, fc3d: 5, pl3: 5, pl5: 5, qxc: 5, kl8: 5
  }
  const minLen = minLenMap[props.lotteryType] || 5

  if (val.length < minLen) {
    drawNums.value = ''
    drawDate.value = ''
    fetchError.value = ''
    return
  }

  debounceTimer = setTimeout(() => {
    doQuery(val)
  }, 800)
})

/** 监听守号导入：将守号数据加载到待核对列表 */
watch(() => props.loadedGroupList, (list) => {
  if (!list || !Array.isArray(list) || list.length === 0) return
  batchList.value = list.map(item => ({
    nums: formatLotteryNums(props.lotteryType, item.nums),
    remark: item.remark || '守号号码',
    entryType: item.entryType || 'single',
    comboCount: item.comboCount || 1
  }))
}, { immediate: true })

// 输入框占位提示
const inputPlaceholderMap = {
  ssq: '粘贴号码，例如：03,08,12,18,25,31+07',
  dlt: '粘贴号码，例如：04,07,13,24,32+03,09',
  fc3d: '粘贴号码，例如：123',
  pl3: '粘贴号码，例如：123',
  pl5: '粘贴号码，例如：12345',
  qxc: '粘贴号码，例如：1234567',
  kl8: '粘贴号码，例如：01,05,11,22,33,44,55,66,70,77'
}

const inputPlaceholder = inputPlaceholderMap[props.lotteryType] || '输入号码'

// ========== 核对结果弹窗 ==========
const showResultPopup = ref(false)

/** 是否有中奖 */
const hasWin = computed(() => resultList.value.some(r => r.win))

/** 中奖注数 */
const winCount = computed(() => resultList.value.filter(r => r.win).length)

/** 最高奖项（取最小的等级数字） */
const bestLevel = computed(() => {
  const winResults = resultList.value.filter(r => r.win)
  if (winResults.length === 0) return ''
  // 按奖项等级排序（一等奖最优先）
  const order = ['一等奖', '二等奖', '三等奖', '四等奖', '五等奖', '六等奖', '七等奖', '八等奖',
    '直选', '组选', '全不中奖']
  const sorted = [...winResults].sort((a, b) => {
    const ai = order.indexOf(a.level), bi = order.indexOf(b.level)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
  return sorted[0].level
})

/** 情绪文案 */
const emotion = computed(() => {
  const total = resultList.value.length
  const wins = winCount.value
  const best = bestLevel.value

  if (total === 0) {
    return { emoji: '🤔', title: '还没有核对结果', subtitle: '请先添加号码并核对' }
  }

  // 全中
  if (wins === total && wins > 0) {
    if (best === '一等奖') {
      return { emoji: '🏆', title: '天选之子！一等奖！', subtitle: '建议立即去买彩票压压惊（开玩笑的，快领奖！）' }
    }
    if (['二等奖', '三等奖'].includes(best)) {
      return { emoji: '🎊', title: '全员中奖！运气爆棚！', subtitle: `最高${best}，今天的锦鲤非你莫属` }
    }
    return { emoji: '🎉', title: '全部命中！太强了！', subtitle: '这个准确率可以出书了' }
  }

  // 一等奖
  if (best === '一等奖') {
    return { emoji: '🏆', title: '一等奖！梦想成真！', subtitle: '快看看是不是看错了，真的是头奖！' }
  }

  // 有高奖
  if (['二等奖', '三等奖'].includes(best) && wins > 0) {
    return { emoji: '🔥', title: `中了${best}！`, subtitle: `${wins}/${total} 注中奖，财运亨通！` }
  }

  // 大部分中奖
  if (wins > total * 0.5 && wins > 1) {
    return { emoji: '🎉', title: `${wins}注中奖！运势不错！`, subtitle: '继续保持，好运连连' }
  }

  // 小中
  if (wins === 1) {
    return { emoji: '🍀', title: '中了一注！小幸运！', subtitle: '虽然金额不多，但谁不喜欢惊喜呢？' }
  }
  if (wins > 0) {
    return { emoji: '✨', title: `${wins}注中奖！`, subtitle: '每一份小幸运都值得庆祝' }
  }

  // 没中
  if (wins === 0) {
    const msgs = [
      { emoji: '💪', title: '再接再厉！', subtitle: '好运总在下一次，坚持就是胜利' },
      { emoji: '🍀', title: '差一点点！', subtitle: '幸运女神已经在路上了' },
      { emoji: '😤', title: '这次不算！', subtitle: '下次一定！心态要稳' },
      { emoji: '🎯', title: '距离中奖只差一步', subtitle: '继续守号，该来的总会来' }
    ]
    return msgs[Math.floor(Math.random() * msgs.length)]
  }

  return { emoji: '📊', title: '核对完成', subtitle: `${wins}/${total} 注中奖` }
})

/** 彩带粒子 */
const confettiDots = computed(() => {
  if (!hasWin.value) return []
  const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#845ef7', '#ff6eb4']
  return Array.from({ length: 40 }, (_, i) => {
    const color = colors[i % colors.length]
    const left = Math.random() * 100
    const delay = Math.random() * 3
    const duration = 2 + Math.random() * 3
    const size = 5 + Math.random() * 8
    const shape = Math.random() > 0.5 ? '50%' : '0%'
    return {
      id: i,
      style: {
        left: `${left}%`,
        backgroundColor: color,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: shape,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }
    }
  })
})

function addTemp() {
  if (!inputNum.value.trim()) return showToast('请输入号码')
  pendingDigits.value = ''
  const check = validateLotteryNums(props.lotteryType, inputNum.value)
  if (!check.pass) return showToast(check.msg)
  if (batchList.value.length >= MAX_COUNT) return showToast(`最多${MAX_COUNT}注`)

  const stdNum = formatLotteryNums(props.lotteryType, inputNum.value)
  const entryType = detectEntryType(props.lotteryType, stdNum)
  const comboCount = entryType === 'compound' ? getCompoundComboCount(props.lotteryType, stdNum) : 1
  batchList.value.push({ nums: stdNum, remark: '临时号码', entryType, comboCount })
  inputNum.value = ''
  compoundFrontCount.value = 0
  showToast(entryType === 'compound' ? `复式添加成功（${comboCount}注）` : '添加成功')
}

/**
 * 简单的号码比对逻辑（基础版）
 */
function checkSingleNum(userNum, drawNum) {
  // 针对不同彩种做简单比对
  const type = props.lotteryType

  if (type === 'ssq') {
    const [uRed, uBlue] = userNum.split('+')
    const [dRed, dBlue] = (drawNum || '').split('+')
    if (!dRed || !dBlue) return { win: false, level: '未开奖' }
    const uRedArr = uRed.split(',')
    const dRedArr = dRed.split(',')
    const redMatch = uRedArr.filter(r => dRedArr.includes(r)).length
    const blueMatch = uBlue === dBlue
    if (redMatch === 6 && blueMatch) return { win: true, level: '一等奖' }
    if (redMatch === 6) return { win: true, level: '二等奖' }
    if (redMatch === 5 && blueMatch) return { win: true, level: '三等奖' }
    if (redMatch === 5 || (redMatch === 4 && blueMatch)) return { win: true, level: '四等奖' }
    if (redMatch === 4 || (redMatch === 3 && blueMatch)) return { win: true, level: '五等奖' }
    if (blueMatch) return { win: true, level: '六等奖' }
    return { win: false, level: '未中奖' }
  }

  if (type === 'dlt') {
    const [uFront, uBack] = userNum.split('+')
    const [dFront, dBack] = (drawNum || '').split('+')
    if (!dFront || !dBack) return { win: false, level: '未开奖' }
    const uFArr = uFront.split(',')
    const dFArr = dFront.split(',')
    const uBArr = uBack.split(',')
    const dBArr = dBack.split(',')
    const fMatch = uFArr.filter(f => dFArr.includes(f)).length
    const bMatch = uBArr.filter(b => dBArr.includes(b)).length
    if (fMatch === 5 && bMatch === 2) return { win: true, level: '一等奖' }
    if (fMatch === 5 && bMatch === 1) return { win: true, level: '二等奖' }
    if (fMatch === 5 || (fMatch === 4 && bMatch === 2)) return { win: true, level: '三等奖' }
    if (fMatch === 4 && bMatch === 1) return { win: true, level: '四等奖' }
    if (fMatch === 3 && bMatch === 2) return { win: true, level: '五等奖' }
    if (fMatch === 4 || (fMatch === 3 && bMatch === 1) || (fMatch === 2 && bMatch === 2)) return { win: true, level: '六等奖' }
    if (fMatch === 3 || (fMatch === 1 && bMatch === 2) || (fMatch === 2 && bMatch === 1) || bMatch === 2) return { win: true, level: '七等奖' }
    if ((fMatch === 1 && bMatch === 1) || (fMatch === 2) || bMatch === 1) return { win: true, level: '八等奖' }
    return { win: false, level: '未中奖' }
  }

  if (type === 'fc3d' || type === 'pl3') {
    if (!drawNum) return { win: false, level: '未开奖' }
    if (userNum === drawNum) return { win: true, level: '直选' }
    const uArr = userNum.split('').sort()
    const dArr = drawNum.split('').sort()
    if (uArr.join('') === dArr.join('')) return { win: true, level: '组选' }
    return { win: false, level: '未中奖' }
  }

  if (type === 'pl5' || type === 'qxc') {
    if (!drawNum) return { win: false, level: '未开奖' }
    return userNum === drawNum
      ? { win: true, level: '一等奖' }
      : { win: false, level: '未中奖' }
  }

  if (type === 'kl8') {
    if (!drawNum) return { win: false, level: '未开奖' }
    const uArr = userNum.split(',')
    const dArr = drawNum.split(',')
    const match = uArr.filter(n => dArr.includes(n)).length
    if (match === 10) return { win: true, level: '一等奖' }
    if (match === 9) return { win: true, level: '二等奖' }
    if (match === 8) return { win: true, level: '三等奖' }
    if (match === 7) return { win: true, level: '四等奖' }
    if (match === 6) return { win: true, level: '五等奖' }
    if (match === 5) return { win: true, level: '六等奖' }
    if (match === 0) return { win: true, level: '全不中奖' }
    return { win: false, level: '未中奖' }
  }

  return { win: false, level: '未开奖' }
}

function batchCheck() {
  const draw = drawNums.value.trim()
  if (!draw) return showToast('请输入开奖号码')

  // 校验开奖号码格式
  const drawCheck = validateLotteryNums(props.lotteryType, draw)
  if (!drawCheck.pass) return showToast(`开奖号码${drawCheck.msg}`)

  if (batchList.value.length === 0) return showToast('请先添加待核对号码')

  const stdDraw = formatLotteryNums(props.lotteryType, draw)
  resultList.value = batchList.value.map(item => {
    const isCompound = item.entryType === 'compound'

    if (isCompound) {
      const compoundResult = checkCompoundNum(props.lotteryType, item.nums, stdDraw)
      if (!compoundResult) {
        // 降级为单式核对
        const singleResult = checkSingleNum(item.nums, stdDraw)
        return {
          nums: item.nums,
          remark: item.remark,
          entryType: 'compound',
          comboCount: item.comboCount || 1,
          win: singleResult.win,
          level: singleResult.level,
          breakdown: []
        }
      }
      return {
        nums: item.nums,
        remark: item.remark,
        entryType: 'compound',
        comboCount: compoundResult.comboCount,
        win: compoundResult.win,
        level: compoundResult.bestLevel || '未中奖',
        breakdown: compoundResult.breakdown || [],
        matchInfo: compoundResult.matchInfo
      }
    }

    // 单式
    const result = checkSingleNum(item.nums, stdDraw)
    return {
      nums: item.nums,
      remark: item.remark,
      entryType: 'single',
      comboCount: 1,
      win: result.win,
      level: result.level,
      breakdown: []
    }
  })

  showResultPopup.value = true
}
</script>

<style scoped>
.container {
  padding: 14px;
}
.block-card {
  background: #fff;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.title {
  margin: 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.title-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  margin-left: 6px;
}
.back-btn {
  font-size: 20px;
  color: #1989fa;
  cursor: pointer;
  padding: 4px;
}
.empty-cell {
  color: #999;
  font-style: italic;
}
.win-text {
  color: #f53f3f;
  font-weight: bold;
}
.normal-text {
  color: #666;
}
.draw-info-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  font-size: 13px;
}
.source-tip {
  color: #999;
  font-size: 12px;
}
.error-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  color: #f53f3f;
  font-size: 13px;
  background: #fff2f0;
  border-radius: 6px;
  margin: 0 12px;
}
.draw-section {
  padding: 10px 16px;
  border-bottom: 1px solid #ebedf0;
}
.draw-label {
  font-size: 14px;
  color: #323233;
  margin-bottom: 8px;
}
.draw-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #999;
  padding: 4px 0;
}
.draw-placeholder {
  font-size: 13px;
  color: #999;
  padding: 4px 0;
}
.draw-balls-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  row-gap: 8px;
  align-items: center;
}
.ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.ball.red {
  background: linear-gradient(135deg, #ee0a24, #f55);
  box-shadow: 0 2px 4px rgba(238, 10, 36, 0.3);
}
.ball.blue {
  background: linear-gradient(135deg, #1989fa, #4fa6ff);
  box-shadow: 0 2px 4px rgba(25, 137, 250, 0.3);
}
.ball.gray {
  background: linear-gradient(135deg, #666, #888);
  box-shadow: 0 2px 4px rgba(100, 100, 100, 0.3);
}
.ball-pending {
  background: linear-gradient(135deg, #999, #bbb);
  box-shadow: 0 2px 4px rgba(150, 150, 150, 0.25);
  animation: pending-blink 0.6s ease-in-out infinite alternate;
}
@keyframes pending-blink {
  from { opacity: 0.5; }
  to { opacity: 1; }
}
.ball-split {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #999;
  width: 20px;
  flex-shrink: 0;
}
.add-section {
  padding: 0 16px;
}
.input-balls-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 0 4px;
}
.input-error {
  color: #ee0a24;
  font-size: 12px;
  padding: 2px 0 6px;
}
.batch-balls {
  font-family: 'Courier New', Consolas, monospace;
  font-size: 13px;
  letter-spacing: 2px;
}

/* ===== 九宫格小键盘样式 ===== */
.keypad-placeholder {
  font-size: 13px;
  color: #999;
  padding: 6px 0;
}
.keypad-progress {
  font-size: 12px;
  color: #1989fa;
  padding: 2px 0 8px;
  font-weight: 500;
}

/* 单式/复式模式并列切换 */
.compound-toggle-row {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 8px 0 12px;
  flex-wrap: wrap;
}
.mode-tab {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  border: 1px solid #dcdee0;
  color: #666;
  background: #f7f8fa;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.mode-tab:first-child {
  border-radius: 8px 0 0 8px;
}
.mode-tab:last-child {
  border-radius: 0 8px 8px 0;
  border-left: none;
}
.mode-tab.mode-active {
  color: #fff;
  background: linear-gradient(135deg, #1989fa, #07c160);
  border-color: #1989fa;
}
.mode-tab:active {
  opacity: 0.85;
}
.compound-toggle-row .zone-toggle-btn {
  font-size: 11px;
  height: 26px;
  min-width: 80px;
  margin-left: 8px;
}

/* 复式中奖明细 */
.compound-breakdown {
  margin-top: 6px;
  padding: 6px 8px;
  background: rgba(255, 246, 207, 0.6);
  border-radius: 6px;
  font-size: 12px;
}
.breakdown-title {
  color: #d48806;
  font-weight: 600;
  margin-bottom: 4px;
}
.breakdown-item {
  display: flex;
  justify-content: space-between;
  padding: 2px 4px;
  color: #666;
}
.breakdown-level {
  color: #d48806;
  font-weight: 500;
}
.breakdown-count {
  color: #999;
}
.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 4px 0 12px;
  max-width: 280px;
  margin: 0 auto;
}
.key-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  border-radius: 12px;
  font-size: 22px;
  font-weight: 600;
  background: #f5f6f8;
  color: #323233;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.key-btn:active {
  background: #e4e5e9;
}
.key-del {
  font-size: 20px;
  color: #ee0a24;
  background: #fff0f1;
}
.key-del:active {
  background: #fdd;
}
.key-ok {
  font-size: 20px;
  color: #fff;
  background: linear-gradient(135deg, #1989fa, #07c160);
}
.key-ok:active {
  opacity: 0.85;
}
.key-btn.ball {
  min-width: unset;
}

/* ===== 核对结果弹窗 ===== */
.result-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: overlay-in 0.3s ease;
  overflow-y: auto;
  padding: 20px 0;
}
@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.result-popup {
  position: relative;
  width: 92%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 20px;
  padding: 0 0 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  animation: popup-bounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes popup-bounce {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* 情绪大标题区 */
.emotion-hero {
  border-radius: 20px 20px 0 0;
  padding: 32px 20px 28px;
  text-align: center;
  color: #fff;
}
.hero-win {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee0a24 30%, #ff922b 70%, #ffd93d 100%);
}
.hero-lose {
  background: linear-gradient(135deg, #4d96ff 0%, #1989fa 50%, #845ef7 100%);
}
.emotion-emoji {
  font-size: 52px;
  line-height: 1.2;
  margin-bottom: 8px;
  animation: emoji-pop 0.5s ease;
}
@keyframes emoji-pop {
  0% { transform: scale(0); }
  60% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
.emotion-title {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 6px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}
.emotion-subtitle {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.9;
  line-height: 1.4;
}

/* 统计卡片 */
.stats-row {
  display: flex;
  gap: 10px;
  padding: 16px 16px 4px;
  margin-top: -12px;
}
.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 12px 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.stat-num {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
}
.stat-label {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}
.stat-total .stat-num { color: #323233; }
.stat-win .stat-num { color: #ee0a24; }
.stat-best .stat-num { color: #ff922b; }

/* 结果列表 */
.result-list {
  padding: 12px 16px;
}
.result-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 10px;
  margin-bottom: 8px;
  transition: transform 0.15s;
}
.result-card:active {
  transform: scale(0.98);
}
.card-win {
  background: linear-gradient(135deg, #fff5f5 0%, #fff0f1 100%);
  border: 1px solid #ffccc7;
}
.card-lose {
  background: #f8f9fa;
  border: 1px solid #ebedf0;
}
.result-left {
  flex: 1;
  min-width: 0;
}
.result-nums {
  font-family: 'Courier New', Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
  color: #323233;
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.result-remark {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}
.result-right {
  flex-shrink: 0;
  margin-left: 10px;
}
.result-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.badge-win {
  background: linear-gradient(135deg, #fff2e8, #fff7e6);
  color: #fa541c;
  border: 1px solid #ffbb96;
}
.badge-lose {
  background: #f5f5f5;
  color: #bbb;
  border: 1px solid #e8e8e8;
}

/* 弹窗内按钮 */
.result-popup .van-button {
  margin: 8px 16px 0;
  font-size: 16px;
  font-weight: 700;
  height: 48px;
}

/* ===== 彩带飘落动画 ===== */
.confetti-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}
.confetti-dot {
  position: absolute;
  top: -10px;
  opacity: 0.9;
  animation: confetti-fall linear infinite;
}
@keyframes confetti-fall {
  0% {
    transform: translateY(-10px) rotate(0deg) scale(1);
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(calc(100vh + 10px)) rotate(720deg) scale(0.3);
    opacity: 0;
  }
}
</style>
