import { ref } from 'vue'

// 会员状态管理（阶段1：内存存储，刷新丢失）
export function useUserStore() {
  const isMember = ref(false)
  const memberExpire = ref('')
  const memberType = ref('') // 'month' | 'year'
  const showPayPopup = ref(false)

  /** 权限拦截：需会员的功能调用此方法 */
  function requireMember() {
    if (!isMember.value) {
      showPayPopup.value = true
      return false
    }
    return true
  }

  /** 阶段1 Mock 开通会员 */
  function activateMember(type) {
    isMember.value = true
    memberType.value = type
    const now = new Date()
    if (type === 'month') {
      now.setMonth(now.getMonth() + 1)
    } else {
      now.setFullYear(now.getFullYear() + 1)
    }
    memberExpire.value = now.toISOString().slice(0, 10)
  }

  /** 退出登录 / 清除会员状态 */
  function clearMember() {
    isMember.value = false
    memberExpire.value = ''
    memberType.value = ''
  }

  return {
    isMember,
    memberExpire,
    memberType,
    showPayPopup,
    requireMember,
    activateMember,
    clearMember
  }
}
