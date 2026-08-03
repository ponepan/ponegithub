/**
 * 彩票开奖号码查询 API
 *
 * 数据来源：
 * - 中国福利彩票官网 (cwl.gov.cn): 双色球、福彩3D、快乐8
 * - 中国体育彩票官网 (sporttery.cn): 大乐透、七星彩、排列三、排列五
 */

// 福彩彩种 name 参数映射
const FUCAI_NAME_MAP = {
  ssq: 'ssq',
  fc3d: 'fc3d',
  kl8: 'kl8'
}

// 体彩彩种 gameNo 参数映射
const TICAI_GAMENO_MAP = {
  dlt: 85,      // 超级大乐透
  qxc: 350133,  // 七星彩
  pl3: 350133,  // 排列三 (与七星彩同 gameNo，通过号码格式区分)
  pl5: 350133   // 排列五 (与七星彩同 gameNo，通过号码格式区分)
}

// 体彩 gameNo=350133 返回混合数据，实际的各彩种识别方式
// 排列三 lotteryDrawNum 以特定 pattern 出现，号码格式为3位数字
// 排列五 lotteryDrawNum 格式为5位数字

/** 体彩 gameNo 完整映射（使用独立的 gameNo） */
const TICAI_GAMENO_ACTUAL = {
  dlt: 85,
  qxc: 350133,
  pl3: 350133,
  pl5: 350133
}

/**
 * 从福彩官网获取开奖号码
 * @param {'ssq'|'fc3d'|'kl8'} type - 彩种
 * @param {string} issue - 期号，如 '2026090'
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function fetchFucaiResult(type, issue) {
  const name = FUCAI_NAME_MAP[type]
  if (!name) return { success: false, error: `不支持的福彩类型: ${type}` }

  const params = new URLSearchParams({
    name,
    issueStart: issue,
    issueEnd: issue,
    pageNo: '1',
    pageSize: '1',
    systemType: 'PC'
  })

  try {
    const res = await fetch(`/fc-api/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?${params}`)
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
    const json = await res.json()
    const results = json?.result || []

    if (results.length === 0) {
      return { success: false, error: '未找到该期号，请检查输入' }
    }

    const item = results[0]
    return {
      success: true,
      data: {
        issue: item.code,
        date: item.date,
        red: item.red || '',
        blue: item.blue || '',
        result: item.red && item.blue
          ? `${item.red}+${item.blue}`
          : (item.red || item.blue || '')
      }
    }
  } catch (e) {
    return { success: false, error: `网络错误: ${e.message}` }
  }
}

/**
 * 从体彩官网获取超级大乐透开奖号码
 * @param {string} issue - 期号，如 '2026090'
 */
async function fetchDltResult(issue) {
  // 大乐透 pageSize 设大一些覆盖更多期
  for (let page = 1; page <= 5; page++) {
    try {
      const params = new URLSearchParams({
        gameNo: '85',
        provinceId: '0',
        pageSize: '100',
        isVerify: '1',
        pageNo: String(page)
      })
      const res = await fetch(`/tc-api/gateway/lottery/getHistoryPageListV1.qry?${params}`)
      if (!res.ok) continue
      const json = await res.json()
      const list = json?.value?.list || []

      // 期号可能有多种格式，尝试匹配
      const found = list.find(item => {
        const drawNum = item.lotteryDrawNum || ''
        // 大乐透期号格式可能为 '24001' 或 '2024001'
        return drawNum === issue ||
          drawNum === issue.slice(-5) ||
          `20${drawNum}` === issue ||
          issue === `20${drawNum}` ||
          `2024${drawNum}` === issue
      })

      if (found) {
        return {
          success: true,
          data: {
            issue: found.lotteryDrawNum,
            date: found.lotteryDrawTime || found.lotterySaleEndtime || '',
            result: found.lotteryDrawResult || found.lotteryUnsortDrawresult || ''
          }
        }
      }

      const totalPages = json?.value?.pages || 0
      if (page >= totalPages) break
    } catch (e) {
      // 继续尝试下一页
    }
  }
  return { success: false, error: '未找到该期号，请检查输入' }
}

/**
 * 从体彩官网获取七星彩/排列三/排列五开奖号码
 * gameNo=350133 返回混合七星彩+排列三+排列五数据
 * @param {'qxc'|'pl3'|'pl5'} type - 彩种
 * @param {string} issue - 期号
 */
async function fetchPlResult(type, issue) {
  for (let page = 1; page <= 5; page++) {
    try {
      const params = new URLSearchParams({
        gameNo: '350133',
        provinceId: '0',
        pageSize: '100',
        isVerify: '1',
        pageNo: String(page)
      })
      const res = await fetch(`/tc-api/gateway/lottery/getHistoryPageListV1.qry?${params}`)
      if (!res.ok) continue
      const json = await res.json()
      const list = json?.value?.list || []

      const found = list.find(item => {
        const drawNum = item.lotteryDrawNum || ''
        // 七星彩期号格式如 '2024090'，排列三/五如 '24090'
        return drawNum === issue ||
          drawNum === issue.slice(-5) ||
          `20${drawNum}` === issue
      })

      if (found) {
        return {
          success: true,
          data: {
            issue: found.lotteryDrawNum,
            date: found.lotteryDrawTime || found.lotterySaleEndtime || '',
            result: found.lotteryDrawResult || found.lotteryUnsortDrawresult || ''
          }
        }
      }

      const totalPages = json?.value?.pages || 0
      if (page >= totalPages) break
    } catch (e) {
      // 继续尝试下一页
    }
  }
  return { success: false, error: '未找到该期号，请检查输入' }
}

/**
 * 获取体彩开奖号码
 * @param {'dlt'|'qxc'|'pl3'|'pl5'} type - 彩种
 * @param {string} issue - 期号
 */
async function fetchTicaiResult(type, issue) {
  if (type === 'dlt') {
    return fetchDltResult(issue)
  }
  return fetchPlResult(type, issue)
}

/**
 * 开奖号码格式标准化
 * @param {string} type - 彩种
 * @param {string} raw - 原始号码字符串
 * @returns {string} - 格式化后的号码
 */
function normalizeDrawResult(type, raw) {
  if (!raw) return ''

  // 福彩双色球: "01,02,03,04,05,06+07" 格式来自 cwl.gov.cn
  if (type === 'ssq' && raw.includes('+')) {
    return raw
  }
  if (type === 'ssq' && raw.includes(',')) {
    // "01,02,03,04,05,06 07" 格式 -> "01,02,03,04,05,06+07"
    const parts = raw.split(/\s+/)
    if (parts.length === 2) {
      return `${parts[0]}+${parts[1]}`
    }
  }

  // 体彩大乐透
  if (type === 'dlt') {
    // sporttery API returns "01 02 03 04 05 06 07" (前5后2空格分隔)
    const nums = raw.replace(/,/g, ' ').split(/\s+/).filter(Boolean)
    if (nums.length === 7) {
      const front = nums.slice(0, 5).join(',')
      const back = nums.slice(5, 7).join(',')
      return `${front}+${back}`
    }
    if (raw.includes('+')) return raw
  }

  // 福彩3D / 排列三: 3位数字连续
  if (type === 'fc3d' || type === 'pl3') {
    const nums = raw.replace(/[,\s]+/g, '')
    if (nums.length === 3) return nums
  }

  // 排列五: 5位数字连续
  if (type === 'pl5') {
    const nums = raw.replace(/[,\s]+/g, '')
    if (nums.length === 5) return nums
  }

  // 七星彩: 7位数字连续
  if (type === 'qxc') {
    const nums = raw.replace(/[,\s]+/g, '')
    if (nums.length === 7) return nums
  }

  // 快乐8: 20个数字逗号分隔
  if (type === 'kl8') {
    if (raw.includes(',')) return raw
    const nums = raw.split(/\s+/).filter(Boolean)
    if (nums.length >= 10) return nums.join(',')
  }

  // 兜底：去除空格
  return raw.replace(/\s+/g, ',')
}

/**
 * 期号格式标准化
 * "26086" (5位短格式) → { full: "2026086", short: "26086" }
 * "2026086" (7位长格式) → { full: "2026086", short: "26086" }
 * @param {string} issue - 原始期号输入
 * @returns {{full: string, short: string}} 两种格式
 */
function normalizeIssue(issue) {
  const trimmed = String(issue).trim()
  if (trimmed.length === 5 && /^\d{5}$/.test(trimmed)) {
    return { full: `20${trimmed}`, short: trimmed }
  }
  if (trimmed.length === 7 && /^\d{7}$/.test(trimmed) && trimmed.startsWith('20')) {
    return { full: trimmed, short: trimmed.slice(2) }
  }
  // 其他位数直接当原文传递
  return { full: trimmed, short: trimmed }
}

/**
 * 主查询函数：根据彩种和期号获取开奖号码
 * 支持 "2026086"（7位长格式）和 "26086"（5位短格式）两种输入
 * @param {string} type - 彩种 ('ssq'|'dlt'|'fc3d'|'pl3'|'pl5'|'qxc'|'kl8')
 * @param {string} issue - 期号
 * @returns {Promise<{success: boolean, data?: {issue: string, date: string, result: string}, error?: string}>}
 */
export async function queryDrawResult(type, issue) {
  if (!issue || !issue.trim()) {
    return { success: false, error: '请输入期号' }
  }

  const trimmedIssue = issue.trim()
  const { full, short } = normalizeIssue(trimmedIssue)

  let result
  if (['ssq', 'fc3d', 'kl8'].includes(type)) {
    // 福彩：用7位长格式查询，失败则尝试短格式
    result = await fetchFucaiResult(type, full)
    if (!result.success && short !== full) {
      result = await fetchFucaiResult(type, short)
    }
  } else if (['dlt', 'qxc', 'pl3', 'pl5'].includes(type)) {
    // 体彩：先尝试原始输入格式
    if (full !== short) {
      // 同时尝试两种格式
      result = await fetchTicaiResult(type, short)
      if (!result.success) {
        const alt = await fetchTicaiResult(type, full)
        if (alt.success) result = alt
      }
    } else {
      result = await fetchTicaiResult(type, full)
    }
  } else {
    return { success: false, error: `不支持的彩种: ${type}` }
  }

  // 标准化号码格式
  if (result.success && result.data?.result) {
    result.data.result = normalizeDrawResult(type, result.data.result)
  }

  return result
}
