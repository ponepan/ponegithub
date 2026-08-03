<template>
  <div class="app-wrap">
    <!-- 动态页面内容 -->
    <component
      :is="currentView"
      v-bind="viewProps"
      @change-type="onChangeType"
      @load-group="onLoadGroup"
      @back-to-home="onBackToHome"
    />

    <!-- 底部 Tab 导航 -->
    <van-tabbar v-model="activeTab" :placeholder="true" fixed>
      <van-tabbar-item icon="home-o" name="home">首页</van-tabbar-item>
      <van-tabbar-item icon="chat-o" name="message">留言板</van-tabbar-item>
      <van-tabbar-item icon="notes-o" name="group">我的守号</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showToast } from 'vant'
import Home from '@/views/Home.vue'
import Check from '@/views/Check.vue'
import Group from '@/views/Group.vue'
import MessageBoard from '@/views/MessageBoard.vue'
import { LOTTERY_NAME_MAP } from '@/utils/validate'

const activeTab = ref('home')
const lotteryType = ref('ssq')
const lotteryName = ref('双色球')

// 从守号页带入的号码列表
const loadedGroupList = ref(null)

// 是否显示核对页面（从首页/守号页跳入，不在 tabbar 中）
const showCheck = ref(false)

const currentView = computed(() => {
  if (showCheck.value) return Check
  if (activeTab.value === 'home') return Home
  if (activeTab.value === 'message') return MessageBoard
  return Group
})

const viewProps = computed(() => ({
  lotteryType: lotteryType.value,
  lotteryName: lotteryName.value,
  loadedGroupList: loadedGroupList.value
}))

/** 首页选中彩种 → 跳转核对页 */
function onChangeType(info) {
  lotteryType.value = info.type
  lotteryName.value = info.name
  showCheck.value = true
}

/** 守号页带入号码 → 跳转核对页 */
function onLoadGroup(data) {
  lotteryType.value = data.key
  lotteryName.value = LOTTERY_NAME_MAP[data.key] || data.key
  loadedGroupList.value = data.list
  showCheck.value = true
  showToast(`已导入${data.list.length}注守号到核对页`)
}

/** 核对页 → 返回首页 */
function onBackToHome() {
  showCheck.value = false
  activeTab.value = 'home'
  loadedGroupList.value = null
}
</script>

<style>
/* 全局重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #f6f7f9;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

#app {
  min-height: 100vh;
}

.app-wrap {
  min-height: 100vh;
  padding-bottom: 54px;
}

/* Vant 组件微调 */
.van-grid-item__content {
  padding: 12px 8px;
}

.van-cell {
  font-size: 14px;
}
</style>
