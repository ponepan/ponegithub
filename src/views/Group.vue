<template>
  <div class="container">
    <!-- 说明 -->
    <van-notice-bar background="#e6f7ff" color="#0066b3" :scrollable="true">
      📌 守号数据自动保存到浏览器本地，换浏览器或清理缓存会丢失。可导出备份。
    </van-notice-bar>

    <!-- 免费用户公告广告（会员隐藏） -->
    <div v-if="!isMember" class="ad-banner" @click="handleAdClick">
      <div class="ad-banner-tag">公告</div>
      <div class="ad-banner-text">开通云同步会员 · 纯净无广告 · 批量导出 · ¥2/月</div>
      <div class="ad-banner-arrow">›</div>
    </div>

    <!-- 各彩种守号分组 -->
    <div class="block-card" v-for="(group, key) in saveData" :key="key">
      <van-cell :title="group.name" :value="`${group.list.length} 注`">
        <template #icon>
          <img :src="getIcon(key)" alt="" class="group-icon" />
        </template>
        <template #right-icon>
          <van-button size="mini" type="primary" @click="emit('load-group', { key, list: group.list })">
            带入核对
          </van-button>
        </template>
      </van-cell>

      <van-cell
        v-for="(item, idx) in group.list"
        :key="idx"
      >
        <template #title>{{ item.nums }}</template>
        <template #label>{{ item.remark }}</template>
        <template #right-icon>
          <van-button size="mini" type="danger" @click="removeNum(key, idx)">删除</van-button>
        </template>
      </van-cell>

      <van-cell v-if="group.list.length === 0" title="暂无守号" class="empty-cell" />

      <van-space style="padding: 10px 0;">
        <van-button size="small" @click="openPopup(key)">新增守号</van-button>
        <van-button size="small" @click="exportGroup(key)">导出备份</van-button>
        <van-button size="small" type="warning" @click="clearGroup(key)">清空本组</van-button>
      </van-space>
    </div>

    <!-- 底部操作 -->
    <div class="footer-actions">
      <van-button block type="primary" @click="exportAll">导出全部守号数据</van-button>
      <van-button block style="margin-top:8px" @click="importData">
        从备份文件导入
      </van-button>
    </div>

    <!-- 隐藏的文件导入 input -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileImport"
    />

    <!-- 新增守号弹窗 -->
    <van-popup v-model:show="popupShow" position="bottom" :style="{ borderRadius: '14px 14px 0 0' }" @closed="onPopupClosed">
      <div class="popup-wrap">
        <h3>新增守号号码 — {{ nameMap[activeKey] }}</h3>

        <!-- 号码球实时预览 + pending 待确认 + 区分符 -->
        <div class="input-balls-wrap">
          <span v-if="displayBalls.length === 0 && !pendingDigits" class="keypad-placeholder">{{ keypadHint }}</span>
          <template v-for="(ball, idx) in displayBalls" :key="idx">
            <span :class="['ball', ball.pending ? 'ball-pending' : ball.color]">{{ ball.num }}</span>
            <span v-if="ball.split" class="ball-split">+</span>
          </template>
        </div>

        <!-- 输入进度提示 -->
        <div v-if="keypadProgress" class="keypad-progress">{{ keypadProgress }}</div>

        <!-- 复式模式开关 -->
        <div v-if="supportsCompound" class="compound-toggle-row">
          <van-tag :type="isCompoundMode ? 'warning' : 'default'" size="large" plain @click="isCompoundMode = !isCompoundMode">
            {{ isCompoundMode ? '📊 复式选号' : '📋 单式选号' }}
          </van-tag>
          <template v-if="isCompoundMode && keypadConfig.hasSplit && keypadConfig.splitAfter === 'dynamic'">
            <van-button
              :type="compoundZone === 'front' ? 'primary' : 'default'"
              size="small"
              class="zone-toggle-btn"
              @click="compoundZone = compoundZone === 'front' ? 'back' : 'front'"
            >{{ compoundZone === 'front' ? zoneLabels.front : zoneLabels.back }}</van-button>
          </template>
        </div>

        <!-- 号码文本框（可粘贴/手动输入，容错解析） -->
        <van-field v-model="popNum" label="号码" :placeholder="popPlaceholder" @focus="onInputFocus" />
        <div v-if="inputError" class="input-error">{{ inputError }}</div>

        <!-- 九宫格小键盘 -->
        <div class="keypad-grid">
          <div v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n" class="key-btn" @click="tapDigit(n)">{{ n }}</div>
          <div class="key-btn key-del" @click="tapBackspace">⌫</div>
          <div class="key-btn" @click="tapDigit(0)">0</div>
          <div class="key-btn key-ok" @click="confirmBall">✓</div>
        </div>

        <van-field v-model="popRemark" label="备注" placeholder="长期守号" />

        <van-space style="margin-top: 20px; justify-content: center; width: 100%;">
          <van-button @click="popupShow = false">取消</van-button>
          <van-button type="primary" @click="confirmAdd">保存号码</van-button>
        </van-space>
      </div>
    </van-popup>

    <!-- 全局免责声明 -->
    <DisclaimerFooter />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import {
  validateLotteryNums,
  formatLotteryNums,
  normalizeInput,
  LOTTERY_NAME_MAP,
  loadSaveData,
  persistSaveData,
  exportSaveData,
  detectEntryType,
  getCompoundComboCount,
  COMPOUND_LIMITS
} from '@/utils/validate'
import { useUserStore } from '@/stores/user'
import DisclaimerFooter from '@/components/DisclaimerFooter.vue'

const { requireMember, isMember, showPayPopup } = useUserStore()

function handleAdClick() {
  showPayPopup.value = true
}

// 图标映射
import ssqIcon from '@/assets/icons/ssq.svg'
import fc3dIcon from '@/assets/icons/fc3d.svg'
import dltIcon from '@/assets/icons/dlt.svg'
import qxcIcon from '@/assets/icons/qxc.svg'
import pl3Icon from '@/assets/icons/pl3.svg'
import pl5Icon from '@/assets/icons/pl5.svg'
import kl8Icon from '@/assets/icons/kl8.svg'

const iconMap = { ssq: ssqIcon, fc3d: fc3dIcon, dlt: dltIcon, qxc: qxcIcon, pl3: pl3Icon, pl5: pl5Icon, kl8: kl8Icon }
function getIcon(key) {
  return iconMap[key] || ssqIcon
}

const emit = defineEmits(['load-group'])
const fileInputRef = ref(null)

// ========== 数据状态 ==========
const saveData = reactive(initSaveData())

function initSaveData() {
  const saved = loadSaveData()
  if (saved) return saved
  const data = {}
  Object.keys(LOTTERY_NAME_MAP).forEach(key => {
    data[key] = { name: LOTTERY_NAME_MAP[key], list: [] }
  })
  return data
}

// ========== localStorage 持久化 ==========
function syncToStorage() {
  const plainData = {}
  Object.keys(saveData).forEach(key => {
    plainData[key] = { ...saveData[key], list: [...saveData[key].list] }
  })
  const ok = persistSaveData(plainData)
  if (!ok) showToast('保存失败，请检查浏览器存储空间')
}

// 深度监听所有变化并自动保存（300ms 防抖）
let saveTimer = null
watch(
  () => {
    return Object.keys(saveData).map(key => ({
      key,
      listLen: saveData[key].list.length
    }))
  },
  () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(syncToStorage, 300)
  },
  { deep: true }
)

onMounted(() => {
  const saved = loadSaveData()
  if (saved) {
    Object.keys(saved).forEach(key => {
      saveData[key].name = saved[key].name || LOTTERY_NAME_MAP[key]
      saveData[key].list = saved[key].list || []
    })
  }
})

// ========== 弹窗状态 ==========
const popupShow = ref(false)
const popNum = ref('')
const popRemark = ref('')
const activeKey = ref('ssq')
const nameMap = LOTTERY_NAME_MAP

const popPlaceholderMap = {
  ssq: '03,08,12,18,25,31+07',
  dlt: '04,07,13,24,32+03,09',
  fc3d: '123',
  pl3: '123',
  pl5: '12345',
  qxc: '1234567',
  kl8: '01,05,11,22,33,44,55,66,70,77'
}

const popPlaceholder = computed(() => popPlaceholderMap[activeKey.value] || '输入号码')

// ========== 九宫格键盘逻辑 ==========

const isCompoundMode = ref(false)
const compoundZone = ref('front')
const compoundFrontCount = ref(0)

const supportsCompound = computed(() => ['ssq', 'dlt', 'kl8'].includes(activeKey.value))

const zoneLabels = computed(() => {
  if (activeKey.value === 'ssq') return { front: '🔴 红球区', back: '🔵 蓝球区' }
  return { front: '前区', back: '后区' }
})

watch(isCompoundMode, () => {
  popNum.value = ''
  pendingDigits.value = ''
  compoundZone.value = 'front'
  compoundFrontCount.value = 0
})

/** 键盘配置（根据当前选中彩种） */
const keypadConfig = computed(() => {
  const t = activeKey.value
  const lim = COMPOUND_LIMITS[t]

  if (t === 'fc3d' || t === 'pl3') return { groupSize: 1, totalCount: 3, separator: '', hasSplit: false, splitAfter: 0, frontCount: 0, backCount: 0, isCompound: false }
  if (t === 'pl5') return { groupSize: 1, totalCount: 5, separator: '', hasSplit: false, splitAfter: 0, frontCount: 0, backCount: 0, isCompound: false }
  if (t === 'qxc') return { groupSize: 1, totalCount: 7, separator: '', hasSplit: false, splitAfter: 0, frontCount: 0, backCount: 0, isCompound: false }

  if (isCompoundMode.value && supportsCompound.value && lim) {
    if (t === 'ssq') {
      return { groupSize: 2, totalCount: lim.maxRed + lim.maxBlue, separator: ',', hasSplit: true, splitAfter: 'dynamic',
        frontCount: lim.maxRed, backCount: lim.maxBlue, compoundMaxFront: lim.maxRed, compoundMaxBack: lim.maxBlue,
        frontMax: 33, backMax: 16, frontMin: 1, backMin: 1, isCompound: true }
    }
    if (t === 'dlt') {
      return { groupSize: 2, totalCount: lim.maxFront + lim.maxBack, separator: ',', hasSplit: true, splitAfter: 'dynamic',
        frontCount: lim.maxFront, backCount: lim.maxBack, compoundMaxFront: lim.maxFront, compoundMaxBack: lim.maxBack,
        frontMax: 35, backMax: 12, frontMin: 1, backMin: 1, isCompound: true }
    }
    if (t === 'kl8') {
      return { groupSize: 2, totalCount: lim.maxNumbers, separator: ',', hasSplit: false, splitAfter: 0, frontCount: 0, backCount: 0,
        compoundMaxFront: lim.maxNumbers, compoundMaxBack: 0, frontMax: 80, backMax: 0, frontMin: 1, backMin: 0, isCompound: true }
    }
  }

  if (t === 'ssq') return { groupSize: 2, totalCount: 7, separator: ',', hasSplit: true, splitAfter: 6, frontCount: 6, backCount: 1, frontMax: 33, backMax: 16, frontMin: 1, backMin: 1, isCompound: false }
  if (t === 'dlt') return { groupSize: 2, totalCount: 7, separator: ',', hasSplit: true, splitAfter: 5, frontCount: 5, backCount: 2, frontMax: 35, backMax: 12, frontMin: 1, backMin: 1, isCompound: false }
  if (t === 'kl8') return { groupSize: 2, totalCount: 10, separator: ',', hasSplit: false, splitAfter: 0, frontCount: 0, backCount: 0, frontMax: 80, backMax: 0, frontMin: 1, backMin: 0, isCompound: false }
  return { groupSize: 1, totalCount: 10, separator: '', hasSplit: false, splitAfter: 0, frontCount: 0, backCount: 0, isCompound: false }
})

/** 待确认数字缓冲区（SSQ/DLT/KL8 使用，每次 ✓ 确认一个球） */
const pendingDigits = ref('')

/** 将原始数字串按彩种规则格式化 */
function formatDigits(digits, cfg) {
  if (!digits) return ''
  const groups = []
  for (let i = 0; i < digits.length; i += cfg.groupSize) {
    groups.push(digits.slice(i, i + cfg.groupSize).padStart(cfg.groupSize, '0'))
  }
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

/** 解析号码为展示球列表 */
function parseBalls(type, raw) {
  const s = normalizeInput(type, raw)
  if (!s) return []

  if (type === 'ssq' && s.includes('+')) {
    const [redPart, bluePart] = s.split('+')
    const reds = redPart.split(',').filter(Boolean).map(n => ({ num: n, color: 'red' }))
    const blues = bluePart.split(',').filter(Boolean).map(n => ({ num: n, color: 'blue' }))
    return [...reds, ...blues]
  }
  if (type === 'dlt' && s.includes('+')) {
    const [front, back] = s.split('+')
    const fronts = front.split(',').filter(Boolean).map(n => ({ num: n, color: 'red' }))
    const backs = back.split(',').filter(Boolean).map(n => ({ num: n, color: 'blue' }))
    return [...fronts, ...backs]
  }
  if ((type === 'fc3d' || type === 'pl3') && /^\d{3}$/.test(s)) {
    return s.split('').map(n => ({ num: n, color: 'gray' }))
  }
  if (type === 'pl5' && /^\d{5}$/.test(s)) {
    return s.split('').map(n => ({ num: n, color: 'gray' }))
  }
  if (type === 'qxc' && /^\d{7}$/.test(s)) {
    return s.split('').map(n => ({ num: n, color: 'gray' }))
  }
  if (s.includes(',')) {
    return s.split(',').filter(Boolean).map(n => ({ num: n.trim(), color: 'red' }))
  }
  return [{ num: s, color: 'gray' }]
}

/** 展示球列表（已确认球 + pending 待确认 + 区分符） */
const displayBalls = computed(() => {
  const cfg = keypadConfig.value
  const confirmed = parseBalls(activeKey.value, popNum.value)

  if (cfg.groupSize === 1) return confirmed

  // 复式模式：动态插入 + 分隔符
  if (cfg.isCompound && cfg.hasSplit && cfg.splitAfter === 'dynamic') {
    const result = []
    const frontBalls = compoundFrontCount.value
    confirmed.forEach((b, i) => {
      if (i === frontBalls) result.push({ num: '+', color: 'split', pending: false, split: true })
      result.push(b)
    })
    if (pendingDigits.value && confirmed.length === frontBalls && frontBalls > 0) {
      result.push({ num: '+', color: 'split', pending: false, split: true })
    }
    if (pendingDigits.value) {
      result.push({ num: pendingDigits.value.padStart(cfg.groupSize, '0'), color: 'pending', pending: true })
    }
    return result
  }

  // 单式
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

/** 键盘操作提示 */
const keypadHint = computed(() => {
  const t = activeKey.value
  const cfg = keypadConfig.value
  if (cfg.isCompound) {
    if (t === 'ssq') return `复式：红球≤${cfg.compoundMaxFront}(1-33) 蓝球≤${cfg.compoundMaxBack}(1-16) | 当前：${compoundZone.value === 'front' ? '红球区' : '蓝球区'}`
    if (t === 'dlt') return `复式：前区≤${cfg.compoundMaxFront}(1-35) 后区≤${cfg.compoundMaxBack}(1-12) | 当前：${compoundZone.value === 'front' ? '前区' : '后区'}`
    if (t === 'kl8') return `复式：可选${cfg.compoundMaxFront}个号码(1-80)`
  }
  if (['fc3d', 'pl3'].includes(t)) return '点击数字输入（3位）'
  if (t === 'pl5') return '点击数字输入（5位）'
  if (t === 'qxc') return '点击数字输入（7位）'
  if (t === 'ssq') return '逐个输入号码：点击数字 + 按 ✓ 确认（红球6个 1-33，蓝球1个 1-16）'
  if (t === 'dlt') return '逐个输入号码：点击数字 + 按 ✓ 确认（前区5个 1-35，后区2个 1-12）'
  if (t === 'kl8') return '逐个输入号码：点击数字 + 按 ✓ 确认（选10个，1-80）'
  return '点击数字输入'
})

/** 输入进度提示 */
const keypadProgress = computed(() => {
  const cfg = keypadConfig.value
  if (cfg.isCompound && cfg.hasSplit && cfg.splitAfter === 'dynamic') {
    const frontDone = compoundFrontCount.value
    const backDone = Math.max(0, Math.floor(popNum.value.replace(/\D/g, '').length / cfg.groupSize) - frontDone)
    const pending = pendingDigits.value ? 1 : 0
    const zone = compoundZone.value === 'front' ? '前区' : '后区'
    let text = `前区 ${frontDone}/${cfg.compoundMaxFront}  后区 ${backDone}/${cfg.compoundMaxBack}`
    if (pending) text += `  (${zone}待确认)`
    return text
  }
  if (cfg.isCompound && !cfg.hasSplit) {
    const raw = popNum.value.replace(/\D/g, '')
    const entered = Math.floor(raw.length / cfg.groupSize)
    return `${entered}/${cfg.compoundMaxFront} 个号码`
  }
  const raw = popNum.value.replace(/\D/g, '')
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

/** 输入校验错误 */
const inputError = computed(() => {
  const val = popNum.value.trim()
  if (!val) return ''
  const check = validateLotteryNums(activeKey.value, val)
  return check.pass ? '' : check.msg
})

/** 获取当前待输入号码的合法范围 */
function getBallRange(cfg, confirmedCount) {
  if (!cfg.hasSplit) {
    return { min: cfg.frontMin || 1, max: cfg.frontMax || 99, label: '' }
  }
  if (cfg.isCompound) {
    if (compoundZone.value === 'front') {
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
  const raw = popNum.value.replace(/\D/g, '')
  const groups = []
  for (let i = 0; i < raw.length; i += cfg.groupSize) {
    groups.push(raw.slice(i, i + cfg.groupSize).padStart(cfg.groupSize, '0'))
  }
  if (cfg.isCompound && cfg.hasSplit && cfg.splitAfter === 'dynamic') {
    const splitIdx = compoundFrontCount.value
    if (compoundZone.value === 'front') {
      return groups.slice(0, Math.min(splitIdx, groups.length)).includes(num)
    }
    return groups.slice(splitIdx).includes(num)
  }
  if (cfg.hasSplit && confirmedCount >= cfg.splitAfter) {
    return groups.slice(cfg.splitAfter).includes(num)
  }
  return groups.includes(num)
}

/** 九宫格点击数字 */
function tapDigit(n) {
  const cfg = keypadConfig.value

  if (cfg.groupSize === 1) {
    let raw = popNum.value.replace(/\D/g, '')
    if (raw.length >= cfg.totalCount) return
    raw += String(n)
    popNum.value = formatDigits(raw, cfg)
    return
  }

  const raw = popNum.value.replace(/\D/g, '')
  const totalEntered = Math.floor(raw.length / cfg.groupSize)

  if (cfg.isCompound && cfg.hasSplit && cfg.splitAfter === 'dynamic') {
    if (compoundZone.value === 'front' && compoundFrontCount.value >= (cfg.compoundMaxFront || 99)) return
    if (compoundZone.value === 'back') {
      const backCount = totalEntered - compoundFrontCount.value
      if (backCount >= (cfg.compoundMaxBack || 99)) return
    }
  }
  if (cfg.isCompound && !cfg.hasSplit) {
    if (totalEntered >= (cfg.compoundMaxFront || 99)) return
  }
  if (!cfg.isCompound && totalEntered >= cfg.totalCount) return

  if (pendingDigits.value.length >= cfg.groupSize) return
  pendingDigits.value += String(n)
}

/** 九宫格删除 */
function tapBackspace() {
  const cfg = keypadConfig.value

  if (cfg.groupSize === 1) {
    let raw = popNum.value.replace(/\D/g, '')
    raw = raw.slice(0, -1)
    popNum.value = raw ? formatDigits(raw, cfg) : ''
    return
  }

  if (pendingDigits.value) {
    pendingDigits.value = pendingDigits.value.slice(0, -1)
    return
  }
  let raw = popNum.value.replace(/\D/g, '')
  if (raw.length >= cfg.groupSize) {
    const totalEntered = Math.floor(raw.length / cfg.groupSize)
    const isCompound = cfg.isCompound && cfg.hasSplit && cfg.splitAfter === 'dynamic'
    if (isCompound && totalEntered <= compoundFrontCount.value) {
      compoundFrontCount.value = Math.max(0, compoundFrontCount.value - 1)
      if (compoundFrontCount.value === 0) compoundZone.value = 'front'
    }
    raw = raw.slice(0, -cfg.groupSize)
    popNum.value = raw ? formatDigits(raw, cfg) : ''
  }
}

/** 文本框获得焦点时，清空 pending（用户准备粘贴或手动编辑） */
function onInputFocus() {
  pendingDigits.value = ''
}

/** ✓ 确认键：将 pending 中的号码确认到 popNum */
function confirmBall() {
  const cfg = keypadConfig.value

  // 数字彩 (groupSize=1)：不需要确认，数字已直接追加
  if (cfg.groupSize === 1) return

  // 乐透型 (groupSize=2)：确认 pending 中的球
  if (cfg.groupSize === 2 && pendingDigits.value) {
    const num = pendingDigits.value.padStart(cfg.groupSize, '0')
    const n = parseInt(num, 10)
    const raw = popNum.value.replace(/\D/g, '')
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

    // 复式模式：追踪前区球数
    if (isCompound && compoundZone.value === 'front') {
      compoundFrontCount.value++
    }

    const newRaw = raw + num.padStart(cfg.groupSize, '0')
    popNum.value = formatDigits(newRaw, cfg)
    return
  }
}

/** 弹窗关闭时清理 pending */
function onPopupClosed() {
  pendingDigits.value = ''
  compoundFrontCount.value = 0
  compoundZone.value = 'front'
}

// ========== 操作函数 ==========
function openPopup(key) {
  activeKey.value = key
  popNum.value = ''
  popRemark.value = ''
  isCompoundMode.value = false
  compoundZone.value = 'front'
  compoundFrontCount.value = 0
  popupShow.value = true
}

function confirmAdd() {
  const type = activeKey.value
  // 先清理未确认的 pending
  pendingDigits.value = ''
  if (!popNum.value.trim()) return showToast('请填写号码')
  const check = validateLotteryNums(type, popNum.value)
  if (!check.pass) return showToast(check.msg)

  const stdNum = formatLotteryNums(type, popNum.value)
  const entryType = detectEntryType(type, stdNum)
  const comboCount = entryType === 'compound' ? getCompoundComboCount(type, stdNum) : 1
  saveData[type].list.push({
    nums: stdNum,
    remark: popRemark.value || '长期守号',
    entryType,
    comboCount
  })
  popupShow.value = false
  syncToStorage()
  showToast(entryType === 'compound' ? `复式保存成功（${comboCount}注）` : '保存成功')
}

function removeNum(key, idx) {
  saveData[key].list.splice(idx, 1)
  syncToStorage()
  showToast('已删除')
}

async function clearGroup(key) {
  try {
    await showConfirmDialog({
      title: '确认清空',
      message: `确定要清空"${nameMap[key]}"全部守号吗？此操作不可恢复。`
    })
    saveData[key].list = []
    syncToStorage()
    showToast('已清空')
  } catch {
    // 用户取消
  }
}

function exportGroup(key) {
  if (!requireMember()) return
  const data = { [key]: saveData[key] }
  const url = exportSaveData(data)
  const a = document.createElement('a')
  a.href = url
  a.download = `守号备份-${nameMap[key]}-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast('导出成功')
}

function exportAll() {
  if (!requireMember()) return
  const plainData = {}
  Object.keys(saveData).forEach(key => {
    plainData[key] = { ...saveData[key], list: [...saveData[key].list] }
  })
  const url = exportSaveData(plainData)
  const a = document.createElement('a')
  a.href = url
  a.download = `全部守号备份-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast('全部导出成功')
}

function importData() {
  if (!requireMember()) return
  fileInputRef.value?.click()
}

async function handleFileImport(e) {
  const file = e.target.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)

    // 验证数据结构
    let valid = true
    Object.keys(nameMap).forEach(key => {
      if (!data[key] || !Array.isArray(data[key].list)) {
        valid = false
      }
    })

    if (!valid) {
      return showToast('文件格式不正确')
    }

    await showConfirmDialog({
      title: '确认导入',
      message: '导入将覆盖当前守号数据，是否继续？'
    })

    Object.keys(data).forEach(key => {
      if (saveData[key]) {
        saveData[key].name = data[key].name || nameMap[key]
        saveData[key].list = data[key].list || []
      }
    })
    syncToStorage()
    showToast('导入成功')
  } catch (err) {
    console.error('导入失败:', err)
    showToast('导入失败，请检查文件格式')
  } finally {
    // 重置 input 以便重复选择同一文件
    e.target.value = ''
  }
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
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.empty-cell {
  color: #999;
  font-style: italic;
}
.group-icon {
  width: 28px;
  height: 28px;
  margin-right: 8px;
  object-fit: contain;
}
.footer-actions {
  padding: 10px 0 20px;
}
.popup-wrap {
  padding: 20px;
  width: 100%;
  max-width: 440px;
}
.popup-wrap h3 {
  margin-bottom: 14px;
  font-size: 16px;
}

/* ===== 九宫格键盘样式 ===== */
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

/* 复式模式切换 */
.compound-toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0 8px;
  flex-wrap: wrap;
}
.compound-toggle-row .zone-toggle-btn {
  font-size: 11px;
  height: 26px;
  min-width: 80px;
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

/* 号码球展示 */
.input-balls-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 0 4px;
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
.input-error {
  color: #ee0a24;
  font-size: 12px;
  padding: 2px 0 6px;
}

/* 免费用户公告广告 */
.ad-banner {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 16px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}
.ad-banner:active {
  opacity: 0.9;
}
.ad-banner-tag {
  background: rgba(255,255,255,0.25);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  margin-right: 10px;
  white-space: nowrap;
}
.ad-banner-text {
  flex: 1;
  font-size: 13px;
  color: #fff;
  line-height: 1.4;
}
.ad-banner-arrow {
  font-size: 22px;
  color: rgba(255,255,255,0.7);
  margin-left: 6px;
}
</style>
