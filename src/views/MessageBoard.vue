<template>
  <div class="container">
    <h3 class="title">留言板</h3>

    <!-- 留言列表 -->
    <div v-if="messages.length === 0" class="empty-msg">
      暂无留言，来说点什么吧
    </div>
    <div v-else class="msg-list">
      <div v-for="(msg, i) in messages" :key="msg.id" class="msg-card">
        <div class="msg-header">
          <span class="msg-index">#{{ messages.length - i }}</span>
          <span class="msg-time">{{ msg.time }}</span>
          <van-icon name="delete-o" class="msg-del" @click="delMsg(i)" />
        </div>
        <div class="msg-body">{{ msg.content }}</div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="input-area">
      <van-field
        v-model="newMsg"
        rows="2"
        type="textarea"
        placeholder="输入留言内容..."
        maxlength="200"
        show-word-limit
        class="msg-input"
      />
      <van-button
        block
        type="primary"
        :disabled="!newMsg.trim()"
        @click="addMsg"
      >
        发布留言
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast, showDialog } from 'vant'

const STORAGE_KEY = 'lottery_messages'

const messages = ref([])
const newMsg = ref('')

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) messages.value = JSON.parse(raw)
  } catch { /* ignore */ }
})

function saveMsgs() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value))
  } catch { /* ignore */ }
}

function addMsg() {
  const text = newMsg.value.trim()
  if (!text) return
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  messages.value.unshift({
    id: Date.now(),
    content: text,
    time: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  })
  newMsg.value = ''
  saveMsgs()
  showToast('留言成功')
}

function delMsg(i) {
  showDialog({
    title: '删除留言',
    message: '确定删除这条留言吗？',
    showCancelButton: true
  }).then(() => {
    messages.value.splice(i, 1)
    saveMsgs()
    showToast('已删除')
  }).catch(() => {})
}
</script>

<style scoped>
.container {
  padding: 14px;
  padding-bottom: 20px;
}
.title {
  margin: 14px 0 16px;
  font-size: 20px;
  text-align: center;
  color: #323233;
}
.empty-msg {
  text-align: center;
  padding: 60px 0;
  color: #999;
  font-size: 14px;
}
.msg-list {
  margin-bottom: 16px;
}
.msg-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.msg-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}
.msg-index {
  font-size: 12px;
  color: #1989fa;
  font-weight: 600;
}
.msg-time {
  font-size: 12px;
  color: #999;
  flex: 1;
}
.msg-del {
  font-size: 16px;
  color: #999;
  cursor: pointer;
  padding: 2px;
}
.msg-del:active {
  color: #ee0a24;
}
.msg-body {
  font-size: 14px;
  color: #323233;
  line-height: 1.6;
  word-break: break-all;
}
.input-area {
  position: sticky;
  bottom: 0;
  background: #f6f7f9;
  padding-top: 8px;
}
.msg-input {
  border-radius: 10px;
  margin-bottom: 10px;
  background: #fff;
}
</style>
