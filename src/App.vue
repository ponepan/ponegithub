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

    <!-- 左下浮动操作栏 -->
    <div class="float-actions">
      <div class="float-action-item" @click="handleLike">
        <svg class="float-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 22V11M2 13v7c0 1.1.9 2 2 2h12.4c.9 0 1.7-.6 1.9-1.5l1.6-7c.3-1.2-.6-2.3-1.9-2.3h-4.1l.6-3.5c.2-1-.3-1.9-1.1-2.3-1-.5-2.1 0-2.6.9L7 11"/>
        </svg>
        <span class="float-action-label">{{ likeCount }}</span>
      </div>
      <div class="float-action-item" :class="{ 'float-action-active': isFavorited }" @click="handleFavorite">
        <svg class="float-action-icon" viewBox="0 0 24 24" :fill="isFavorited ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <span class="float-action-label">收藏</span>
      </div>
      <div class="float-action-item" @click="handleShare">
        <svg class="float-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        <span class="float-action-label">转发</span>
      </div>
    </div>

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

// 浮动操作栏状态
const likeCount = ref(0)
const isFavorited = ref(false)

// 点赞 — 防重复快速连点
let likeTimer = null
function handleLike() {
  if (likeTimer) return
  likeCount.value++
  showToast('点赞成功 👍')
  likeTimer = setTimeout(() => { likeTimer = null }, 800)
}

// 收藏 — 切换状态
function handleFavorite() {
  isFavorited.value = !isFavorited.value
  showToast(isFavorited.value ? '已收藏 ⭐' : '已取消收藏')
}

// 转发 — 调起系统分享 / 复制链接
function handleShare() {
  const shareData = {
    title: '彩票自动核对工具',
    text: '双色球/大乐透/快乐8 等多种彩票自动核对，单式复式都支持~',
    url: location.href
  }
  if (navigator.share) {
    navigator.share(shareData).catch(() => {})
  } else {
    navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`).then(() => {
      showToast('链接已复制，去粘贴分享吧')
    }).catch(() => {
      showToast('分享链接：' + shareData.url)
    })
  }
}

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

/* 左下浮动操作栏 */
.float-actions {
  position: fixed;
  right: 12px;
  bottom: 80px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.float-action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: transparent;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s;
}

.float-action-item:active {
  transform: scale(0.9);
}

.float-action-icon {
  width: 18px;
  height: 18px;
  color: #888;
}

.float-action-active .float-action-icon {
  color: #ff6b00;
}

.float-action-label {
  font-size: 9px;
  color: #999;
  margin-top: 1px;
}

.float-action-active .float-action-label {
  color: #ff6b00;
}
</style>
