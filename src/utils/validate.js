/**
 * 组合数 C(n, k)：从 n 个元素中选取 k 个的组合数
 * 使用递推公式，避免阶乘溢出
 */
export function C(n, k) {
  if (k < 0 || k > n) return 0
  if (k === 0 || k === n) return 1
  // 取较小值减少计算次数: C(n,k) = C(n, n-k)
  if (k > n - k) k = n - k
  let result = 1
  for (let i = 1; i <= k; i++) {
    result = result * (n - k + i) / i
  }
  return Math.round(result)
}

/**
 * 复式投注上限配置
 * - maxFront/maxRed: 前区/红球最大可选数
 * - maxBack/maxBlue: 后区/蓝球最大可选数
 * - maxNumbers: KL8最大号码数
 */
export const COMPOUND_LIMITS = {
  ssq: { maxRed: 16, maxBlue: 8, maxCombos: 10000 },
  dlt: { maxFront: 13, maxBack: 6, maxCombos: 10000 },
  kl8: { maxNumbers: 14, maxCombos: 10000 }
}

/* ================================================================
   快乐8 十种玩法中奖规则（来源：中国福彩网 cwl.gov.cn）
   ================================================================ */

/**
 * 快乐8 选一到选十玩法的中奖规则
 * key: 玩法编号 (1=选一, 2=选二, ..., 10=选十)
 * pickCount: 该玩法需要选择的号码个数
 * levels: 命中k个号码对应的奖级名称
 * prizes: 命中k个号码对应的奖金（选十中十、选九中九为浮动奖，标注说明）
 */
export const KL8_PLAY_RULES = {
  1: { name: '选一', pickCount: 1, levels: { 1: '中1' }, prizes: { 1: '4.5元' } },
  2: { name: '选二', pickCount: 2, levels: { 2: '中2' }, prizes: { 2: '19元' } },
  3: { name: '选三', pickCount: 3, levels: { 3: '中3', 2: '中2' }, prizes: { 3: '52元', 2: '3元' } },
  4: { name: '选四', pickCount: 4, levels: { 4: '中4', 3: '中3', 2: '中2' }, prizes: { 4: '93元', 3: '5元', 2: '3元' } },
  5: { name: '选五', pickCount: 5, levels: { 5: '中5', 4: '中4', 3: '中3' }, prizes: { 5: '1000元', 4: '20元', 3: '3元' } },
  6: { name: '选六', pickCount: 6, levels: { 6: '中6', 5: '中5', 4: '中4', 3: '中3' }, prizes: { 6: '2880元', 5: '30元', 4: '10元', 3: '3元' } },
  7: { name: '选七', pickCount: 7, levels: { 7: '中7', 6: '中6', 5: '中5', 4: '中4', 0: '全不中' }, prizes: { 7: '8500元', 6: '300元', 5: '30元', 4: '4元', 0: '2元' } },
  8: { name: '选八', pickCount: 8, levels: { 8: '中8', 7: '中7', 6: '中6', 5: '中5', 4: '中4', 0: '全不中' }, prizes: { 8: '50000元', 7: '800元', 6: '80元', 5: '10元', 4: '3元', 0: '2元' } },
  9: { name: '选九', pickCount: 9, levels: { 9: '中9', 8: '中8', 7: '中7', 6: '中6', 5: '中5', 4: '中4', 0: '全不中' }, prizes: { 9: '最高25万(浮动)', 8: '2000元', 7: '225元', 6: '22元', 5: '5元', 4: '3元', 0: '2元' } },
  10: { name: '选十', pickCount: 10, levels: { 10: '一等奖', 9: '二等奖', 8: '三等奖', 7: '四等奖', 6: '五等奖', 5: '六等奖', 0: '全不中奖' }, prizes: { 10: '最高500万(浮动)', 9: '8000元', 8: '720元', 7: '80元', 6: '5元', 5: '3元', 0: '2元' } }
}

/** 快乐8所有玩法编号列表 */
export const KL8_PLAY_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

/**
 * 根据快乐8玩法和中奖号码命中个数，获取中奖信息
 * @param {number} playN - 玩法编号 (1-10)
 * @param {number} matchCount - 用户号码中命中开奖号码的个数
 * @returns {{ win: boolean, level: string, prize: string }}
 */
export function getKL8WinInfo(playN, matchCount) {
  const rule = KL8_PLAY_RULES[playN]
  if (!rule) return { win: false, level: '未中奖', prize: '' }
  const level = rule.levels[matchCount]
  const prize = rule.prizes[matchCount] || ''
  return {
    win: !!level,
    level: level || '未中奖',
    prize
  }
}

/* ================================================================
   双色球中奖规则（来源：中国福利彩票发行管理中心 cwl.gov.cn）
   一等奖、二等奖为浮动奖，三等奖~六等奖为固定奖
   ================================================================ */

/**
 * 双色球各奖级定义
 * key: 'redMatch-blueMatch' 如 '6-1' 表示6红1蓝
 */
export const SSQ_WIN_RULES = [
  { reds: 6, blue: true,  level: '一等奖', prize: '浮动奖金' },
  { reds: 6, blue: false, level: '二等奖', prize: '浮动奖金' },
  { reds: 5, blue: true,  level: '三等奖', prize: '3000元' },
  { reds: 5, blue: false, level: '四等奖', prize: '200元' },
  { reds: 4, blue: true,  level: '四等奖', prize: '200元' },
  { reds: 4, blue: false, level: '五等奖', prize: '10元' },
  { reds: 3, blue: true,  level: '五等奖', prize: '10元' },
  { reds: 0, blue: true,  level: '六等奖', prize: '5元' },
  { reds: 1, blue: true,  level: '六等奖', prize: '5元' },
  { reds: 2, blue: true,  level: '六等奖', prize: '5元' }
]

/**
 * 根据红球命中数和蓝球命中情况获取双色球中奖信息
 * @param {number} redMatch - 红球命中个数 (0-6)
 * @param {boolean} blueMatch - 蓝球是否命中
 * @returns {{ win: boolean, level: string, prize: string }}
 */
export function getSSQWinInfo(redMatch, blueMatch) {
  // 按规则顺序匹配（一等奖优先）
  for (const rule of SSQ_WIN_RULES) {
    if (rule.reds === redMatch && rule.blue === blueMatch) {
      return { win: true, level: rule.level, prize: rule.prize }
    }
    // 六等奖：0-2 红 + 蓝球中 统一归为六等奖
    // 规则表已覆盖，但用循环匹配更简洁
  }
  return { win: false, level: '未中奖', prize: '' }
}

/**
 * 检测号码类型：单式 / 复式
 * @returns {'single' | 'compound'}
 */
export function detectEntryType(type, nums) {
  const raw = normalizeInput(type, nums)
  if (!raw) return 'single'

  if (type === 'ssq') {
    if (!raw.includes('+')) return 'single'
    const [redStr, blueStr] = raw.split('+')
    const redCount = redStr.split(',').filter(Boolean).length
    const blueCount = blueStr.split(',').filter(Boolean).length
    return (redCount > 6 || blueCount > 1) ? 'compound' : 'single'
  }
  if (type === 'dlt') {
    if (!raw.includes('+')) return 'single'
    const [frontStr, backStr] = raw.split('+')
    const frontCount = frontStr.split(',').filter(Boolean).length
    const backCount = backStr.split(',').filter(Boolean).length
    return (frontCount > 5 || backCount > 2) ? 'compound' : 'single'
  }
  if (type === 'kl8') {
    const count = raw.split(',').filter(Boolean).length
    return count > 10 ? 'compound' : 'single'
  }
  // 注：kl8 的玩法 (选一到选十) 在 checkCompoundNum / KL8PlayN 中单独控制，
  // 此处仅判断基本单复式
  return 'single'
}

/**
 * 计算复式投注总注数
 */
export function getCompoundComboCount(type, nums, kl8PlayN = 10) {
  const raw = normalizeInput(type, nums)
  if (!raw) return 0

  if (type === 'ssq') {
    const [redStr, blueStr] = raw.split('+')
    const reds = redStr.split(',').filter(Boolean).length
    const blues = blueStr.split(',').filter(Boolean).length
    return C(reds, 6) * blues
  }
  if (type === 'dlt') {
    const [frontStr, backStr] = raw.split('+')
    const fronts = frontStr.split(',').filter(Boolean).length
    const backs = backStr.split(',').filter(Boolean).length
    return C(fronts, 5) * C(backs, 2)
  }
  if (type === 'kl8') {
    const nums_ = raw.split(',').filter(Boolean).length
    return C(nums_, kl8PlayN)
  }
  return 1
}

/**
 * 号码标准化：自动补零
 * @param {string} type 彩种类型
 * @param {string} nums 原始输入
 * @returns {string} 格式化后标准号码
 */
export function formatLotteryNums(type, nums) {
  const raw = normalizeInput(type, nums)
  if (!raw) return raw

  if (type === 'ssq') {
    const [redPart, bluePart] = raw.split('+')
    const redList = redPart.split(',').map(n => n.padStart(2, '0'))
    const blueList = bluePart.split(',').map(n => n.padStart(2, '0'))
    return `${redList.join(',')}+${blueList.join(',')}`
  }
  if (type === 'dlt') {
    const [frontPart, backPart] = raw.split('+')
    const frontList = frontPart.split(',').map(n => n.padStart(2, '0'))
    const backList = backPart.split(',').map(n => n.padStart(2, '0'))
    return `${frontList.join(',')}+${backList.join(',')}`
  }
  if (type === 'kl8') {
    const list = raw.split(',').map(n => n.padStart(2, '0'))
    return list.join(',')
  }
  return raw
}

/**
 * 智能容错输入标准化
 * 统一处理多种分隔符、非法字符、前导零
 * @param {string} type 彩种类型
 * @param {string} raw 原始输入
 * @returns {string} 标准化半成品（逗号分隔、无前导零校验的纯数字串）
 */
export function normalizeInput(type, raw) {
  let s = (raw || '').trim()
  if (!s) return s

  // === 数字彩（fc3d / pl3 / pl5 / qxc）：只保留数字 ===
  if (['fc3d', 'pl3', 'pl5', 'qxc'].includes(type)) {
    s = s.replace(/\D/g, '')
    return s
  }

  // === 乐透型（ssq / dlt / kl8）：统一分隔符 + 清洗 ===

  // 1. 提取 + 号前后的部分（ssq/dlt 需要前后区区分）
  let front = s
  let back = ''

  // 尝试识别 + 号（有的来源用 `/`、`|`、空格 代替）
  const plusMatch = s.match(/^(.+?)\s*[+|/]\s*(.+)$/)
  if (plusMatch) {
    front = plusMatch[1]
    back = plusMatch[2]
  }

  // 2. 统一分隔符：空格、顿号、分号、竖线、斜杠 → 逗号
  const unify = (str) => {
    return str
      .replace(/[\/;、\s|]+/g, ',')   // 分隔符统一为逗号
      .replace(/-/g, ',')              // 短横线也视为分隔
      .replace(/,,+/g, ',')            // 压缩连续逗号
      .replace(/^,|,$/g, '')           // 去掉首尾逗号
      .replace(/[^\d,]/g, '')          // 过滤其他非法字符
  }

  front = unify(front)
  if (back) back = unify(back)

  // 3. 重新组装
  if (back) {
    return `${front}+${back}`
  }

  return front
}

/**
 * 号码格式统一校验
 * @param {string} type 彩种类型
 * @param {string} nums 待校验号码
 * @returns {{ pass: boolean, msg?: string }}
 */
export function validateLotteryNums(type, nums) {
  const raw = (nums || '').trim()
  if (!raw) {
    return { pass: false, msg: '号码不能为空' }
  }

  const val = normalizeInput(type, raw)
  if (!val) {
    return { pass: false, msg: '处理后号码为空' }
  }

  const lim = COMPOUND_LIMITS[type] || {}

  switch (type) {
    case 'ssq': {
      // 匹配 6-16 个红球 + 1-8 个蓝球
      const regSingle = /^(\d{1,2},){5}\d{1,2}\+\d{1,2}$/
      const regCompound = /^(\d{1,2},){6,15}\d{1,2}\+(\d{1,2},){0,7}\d{1,2}$/
      if (!regSingle.test(val) && !regCompound.test(val)) {
        return { pass: false, msg: '格式错误！单式需6红+1蓝，复式需7~16红+1~8蓝，示例：03,08,12,18,25,31+07 或 03,08,12,18,25,31,07+05,12' }
      }
      const [redStr, blueStr] = val.split('+')
      const redList = redStr.split(',').map(Number)
      const blueList = blueStr.split(',').map(Number)
      const rCount = redList.length
      const bCount = blueList.length
      if (redList.some(n => n < 1 || n > 33)) return { pass: false, msg: '红球号码范围 01~33' }
      if (new Set(redList).size !== rCount) return { pass: false, msg: '红球不能存在重复号码' }
      if (blueList.some(n => n < 1 || n > 16)) return { pass: false, msg: '蓝球范围 01~16' }
      if (new Set(blueList).size !== bCount) return { pass: false, msg: '蓝球不能存在重复号码' }
      // 复式上限检查
      if (rCount > 6 || bCount > 1) {
        if (rCount > lim.maxRed) return { pass: false, msg: `复式红球最多${lim.maxRed}个` }
        if (bCount > lim.maxBlue) return { pass: false, msg: `复式蓝球最多${lim.maxBlue}个` }
        const combos = C(rCount, 6) * bCount
        if (combos > lim.maxCombos) return { pass: false, msg: `复式注数${combos}注超出上限${lim.maxCombos}注，请减少选号` }
      }
      return { pass: true }
    }
    case 'dlt': {
      // 匹配 5-13 个前区 + 2-6 个后区
      const regSingle = /^(\d{1,2},){4}\d{1,2}\+\d{1,2},\d{1,2}$/
      const regCompound = /^(\d{1,2},){4,12}\d{1,2}\+(\d{1,2},){1,5}\d{1,2}$/
      if (!regSingle.test(val) && !regCompound.test(val)) {
        return { pass: false, msg: '格式错误！单式需5前区+2后区，复式需5~13前区+2~6后区，示例：04,07,13,24,32+03,09 或 04,07,13,24,32,35+01,03,09' }
      }
      const [frontStr, backStr] = val.split('+')
      const frontList = frontStr.split(',').map(Number)
      const backList = backStr.split(',').map(Number)
      const fCount = frontList.length
      const bCount = backList.length
      if (frontList.some(n => n < 1 || n > 35)) return { pass: false, msg: '前区号码范围 01~35' }
      if (new Set(frontList).size !== fCount) return { pass: false, msg: '前区不能重复' }
      if (backList.some(n => n < 1 || n > 12)) return { pass: false, msg: '后区号码范围 01~12' }
      if (new Set(backList).size !== bCount) return { pass: false, msg: '后区不能重复' }
      // 复式上限检查
      if (fCount > 5 || bCount > 2) {
        if (fCount > lim.maxFront) return { pass: false, msg: `复式前区最多${lim.maxFront}个` }
        if (bCount > lim.maxBack) return { pass: false, msg: `复式后区最多${lim.maxBack}个` }
        const combos = C(fCount, 5) * C(bCount, 2)
        if (combos > lim.maxCombos) return { pass: false, msg: `复式注数${combos}注超出上限${lim.maxCombos}注，请减少选号` }
      }
      return { pass: true }
    }
    case 'fc3d':
    case 'pl3': {
      if (!/^\d{3}$/.test(val)) {
        return { pass: false, msg: '格式错误！必须3位数字，示例：123' }
      }
      return { pass: true }
    }
    case 'pl5': {
      if (!/^\d{5}$/.test(val)) {
        return { pass: false, msg: '格式错误！必须5位数字，示例：12345' }
      }
      return { pass: true }
    }
    case 'qxc': {
      if (!/^\d{7}$/.test(val)) {
        return { pass: false, msg: '格式错误！必须7位数字，示例：1234567' }
      }
      return { pass: true }
    }
    case 'kl8': {
      // 任意数量号码（1~14个），玩法选择器控制具体选几个
      const regBare = /^(\d{1,2},)*\d{1,2}$/
      if (!regBare.test(val)) {
        return { pass: false, msg: '格式错误！请输入逗号分隔的号码，示例：01,05,11,22,33' }
      }
      const numList = val.split(',').map(Number)
      const nCount = numList.length
      if (nCount < 1) return { pass: false, msg: '至少输入1个号码' }
      if (numList.some(n => n < 1 || n > 80)) return { pass: false, msg: '快乐8号码范围 01~80' }
      if (new Set(numList).size !== nCount) return { pass: false, msg: '必须不重复号码' }
      if (nCount > lim.maxNumbers) return { pass: false, msg: `最多选${lim.maxNumbers}个号码` }
      return { pass: true }
    }
    default:
      return { pass: false, msg: '未知彩种' }
  }
}

/**
 * 获取彩种名称映射
 */
export const LOTTERY_NAME_MAP = {
  ssq: '双色球',
  dlt: '超级大乐透',
  fc3d: '福彩3D',
  qxc: '七星彩',
  pl3: '排列3',
  pl5: '排列5',
  kl8: '快乐8'
}

/**
 * localStorage 持久化工具
 */
const STORAGE_KEY = 'lottery_save_data'

export function loadSaveData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    // 确保所有彩种 key 存在
    Object.keys(LOTTERY_NAME_MAP).forEach(key => {
      if (!data[key]) {
        data[key] = { name: LOTTERY_NAME_MAP[key], list: [] }
      }
    })
    return data
  } catch (e) {
    console.error('加载守号数据失败:', e)
    return null
  }
}

export function persistSaveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (e) {
    console.error('保存守号数据失败:', e)
    return false
  }
}

export function exportSaveData(data) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  return URL.createObjectURL(blob)
}

/* ================================================================
   复式号码智能核对（组合数学算法，非穷举展开）
   ================================================================ */

/**
 * 双色球复式核对
 * 使用组合数学公式直接计算各奖级中奖注数
 *
 * 算法核心：
 *   nPr(k) = C(m, k) × C(|R|-m, 6-k)  — 恰好命中 k 个红球的组合数
 *   蓝色匹配(1) / 不匹配(|B|-bm) 组合数与之相乘
 */
function checkCompoundSSQ(userRedList, userBlueList, drawRedList, drawBlue) {
  const m = userRedList.filter(r => drawRedList.includes(r)).length  // 红球命中数
  const bm = userBlueList.includes(drawBlue) ? 1 : 0                 // 蓝球是否命中
  const rCount = userRedList.length
  const bCount = userBlueList.length
  const totalCombos = C(rCount, 6) * bCount

  const nPr = (k) => C(m, k) * C(rCount - m, 6 - k)

  const breakdown = []

  // SSQ prize map for compound breakdown display
  const ssqPrizes = { '一等奖': '浮动奖金', '二等奖': '浮动奖金', '三等奖': '3000元', '四等奖': '200元', '五等奖': '10元', '六等奖': '5元' }

  // 各奖级公式（按照中奖规则定义）
  const l1 = nPr(6) * bm
  if (l1 > 0) breakdown.push({ level: '一等奖', count: l1, prize: ssqPrizes['一等奖'] })

  const l2 = nPr(6) * (bCount - bm)
  if (l2 > 0) breakdown.push({ level: '二等奖', count: l2, prize: ssqPrizes['二等奖'] })

  const l3 = nPr(5) * bm
  if (l3 > 0) breakdown.push({ level: '三等奖', count: l3, prize: ssqPrizes['三等奖'] })

  const l4 = nPr(5) * (bCount - bm) + nPr(4) * bm
  if (l4 > 0) breakdown.push({ level: '四等奖', count: l4, prize: ssqPrizes['四等奖'] })

  const l5 = nPr(4) * (bCount - bm) + nPr(3) * bm
  if (l5 > 0) breakdown.push({ level: '五等奖', count: l5, prize: ssqPrizes['五等奖'] })

  const l6 = (nPr(0) + nPr(1) + nPr(2)) * bm
  if (l6 > 0) breakdown.push({ level: '六等奖', count: l6, prize: ssqPrizes['六等奖'] })

  const win = breakdown.length > 0
  const bestLevel = win ? breakdown[0].level : null

  return {
    comboCount: totalCombos,
    win,
    bestLevel,
    breakdown,
    matchInfo: {
      redMatch: m,
      blueMatch: bm === 1,
      userRedCount: rCount,
      userBlueCount: bCount
    }
  }
}

/**
 * 大乐透复式核对
 *
 * 算法核心：
 *   nPr_f(k) = C(m_f, k) × C(|F|-m_f, 5-k)  — 恰好命中 k 个前区的组合数
 *   nPr_b(j) = C(m_b, j) × C(|B|-m_b, 2-j)  — 恰好命中 j 个后区的组合数
 *   总注数 = nPr_f(k) × nPr_b(j)
 */
function checkCompoundDLT(userFrontList, userBackList, drawFrontList, drawBackList) {
  const mf = userFrontList.filter(f => drawFrontList.includes(f)).length  // 0..5
  const mb = userBackList.filter(b => drawBackList.includes(b)).length   // 0..2
  const fCount = userFrontList.length
  const bCount = userBackList.length
  const totalCombos = C(fCount, 5) * C(bCount, 2)

  const nPr_f = (k) => C(mf, k) * C(fCount - mf, 5 - k)
  const nPr_b = (j) => C(mb, j) * C(bCount - mb, 2 - j)

  // 大乐透奖级映射（与 checkSingleNum 规则一致）
  const getLevel = (k, j) => {
    if (k === 5 && j === 2) return '一等奖'
    if (k === 5 && j === 1) return '二等奖'
    if (k === 5 || (k === 4 && j === 2)) return '三等奖'
    if (k === 4 && j === 1) return '四等奖'
    if (k === 3 && j === 2) return '五等奖'
    if (k === 4 || (k === 3 && j === 1) || (k === 2 && j === 2)) return '六等奖'
    if (k === 3 || (k === 1 && j === 2) || (k === 2 && j === 1) || j === 2) return '七等奖'
    if ((k === 1 && j === 1) || (k === 2) || j === 1) return '八等奖'
    return null
  }

  // 汇总每个 (k, j) 对应的注数，按奖级聚合
  const levelCount = {}
  for (let k = 0; k <= 5; k++) {
    const fc = nPr_f(k)
    if (fc === 0) continue
    for (let j = 0; j <= 2; j++) {
      const bc = nPr_b(j)
      if (bc === 0) continue
      const level = getLevel(k, j)
      if (level) {
        levelCount[level] = (levelCount[level] || 0) + fc * bc
      }
    }
  }

  // 按奖级从高到低排序
  const levelOrder = ['一等奖', '二等奖', '三等奖', '四等奖', '五等奖', '六等奖', '七等奖', '八等奖']
  const breakdown = levelOrder
    .filter(l => levelCount[l] > 0)
    .map(l => ({ level: l, count: levelCount[l] }))

  const win = breakdown.length > 0
  const bestLevel = win ? breakdown[0].level : null

  return {
    comboCount: totalCombos,
    win,
    bestLevel,
    breakdown,
    matchInfo: {
      frontMatch: mf,
      backMatch: mb,
      userFrontCount: fCount,
      userBackCount: bCount
    }
  }
}

/**
 * 快乐8复式核对
 *
 * @param {number[]} userNumList - 用户所选号码数组
 * @param {number[]} drawNumList - 开奖号码数组（20个）
 * @param {number} playN - 玩法编号（1=选一...10=选十），默认10
 *
 * 算法核心：
 *   nPr(k) = C(m, k) × C(|U|-m, playN-k)  — 恰好命中 k 个号码的组合数
 */
function checkCompoundKL8(userNumList, drawNumList, playN = 10) {
  const m = userNumList.filter(n => drawNumList.includes(n)).length
  const uCount = userNumList.length
  const totalCombos = C(uCount, playN)

  const nPr = (k) => C(m, k) * C(uCount - m, playN - k)

  const rule = KL8_PLAY_RULES[playN]
  const levelMap = rule ? rule.levels : {}
  const prizeMap = rule ? rule.prizes : {}

  const breakdown = []
  // 从命中最多到最少遍历
  for (let k = playN; k >= 0; k--) {
    const level = levelMap[k]
    if (level) {
      const count = nPr(k)
      if (count > 0) {
        breakdown.push({ level, count, match: k, prize: prizeMap[k] || '' })
      }
    }
  }

  // 是否有中奖（排除「全不中」命中0个但仍有两元的情况）
  const realWins = breakdown.filter(b => b.match > 0 || (b.match === 0 && levelMap[0]))
  const win = realWins.length > 0

  return {
    comboCount: totalCombos,
    playN,
    win,
    bestLevel: breakdown.length > 0 ? breakdown[0].level : null,
    breakdown,
    matchInfo: {
      matchCount: m,
      userCount: uCount,
      playN
    }
  }
}

/**
 * 复式号码核对（统一入口）
 * 根据彩种类型自动调用对应的核对逻辑
 *
 * @param {string} type - 彩种类型
 * @param {string} userCompoundNum - 复式号码字符串
 * @param {string} drawNum - 开奖号码字符串
 * @returns {{ comboCount: number, win: boolean, bestLevel: string|null, breakdown: Array, matchInfo: object }}
 */
export function checkCompoundNum(type, userCompoundNum, drawNum, kl8PlayN = 10) {
  const entryType = detectEntryType(type, userCompoundNum)
  if (entryType !== 'compound') {
    return null  // 非复式不做复式核对
  }

  const userRaw = normalizeInput(type, userCompoundNum)
  const drawRaw = normalizeInput(type, drawNum)
  if (!userRaw || !drawRaw) return null

  if (type === 'ssq') {
    const [uRedStr, uBlueStr] = userRaw.split('+')
    const [dRedStr, dBlueStr] = drawRaw.split('+')
    const userReds = uRedStr.split(',').map(n => n.padStart(2, '0'))
    const userBlues = uBlueStr.split(',').map(n => n.padStart(2, '0'))
    const drawReds = dRedStr.split(',').map(n => n.padStart(2, '0'))
    const drawBlue = dBlueStr.split(',')[0].padStart(2, '0')
    return checkCompoundSSQ(userReds, userBlues, drawReds, drawBlue)
  }

  if (type === 'dlt') {
    const [uFrontStr, uBackStr] = userRaw.split('+')
    const [dFrontStr, dBackStr] = drawRaw.split('+')
    const userFronts = uFrontStr.split(',').map(n => n.padStart(2, '0'))
    const userBacks = uBackStr.split(',').map(n => n.padStart(2, '0'))
    const drawFronts = dFrontStr.split(',').map(n => n.padStart(2, '0'))
    const drawBacks = dBackStr.split(',').map(n => n.padStart(2, '0'))
    return checkCompoundDLT(userFronts, userBacks, drawFronts, drawBacks)
  }

  if (type === 'kl8') {
    const userNums = userRaw.split(',').map(n => n.padStart(2, '0'))
    const drawNums = drawRaw.split(',').map(n => n.padStart(2, '0'))
    return checkCompoundKL8(userNums, drawNums, kl8PlayN)
  }

  return null
}
