<template>
  <van-popup v-model:show="popupVisible" position="center" round :close-on-click-overlay="true">
    <div class="pay-popup">
      <div class="pay-header">
        <h3>开通云同步会员</h3>
        <p class="pay-tips">
          本工具仅提供彩票自选号码管理服务，<strong>不提供号码预测、选号建议，无法提升中奖概率</strong>。
        </p>
      </div>

      <div class="pay-features">
        <div class="pay-feature">
          <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="#07c160" stroke-width="2"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="8" y1="20" x2="8.01" y2="20"/><line x1="12" y1="18" x2="12.01" y2="18"/><line x1="16" y1="16" x2="16.01" y2="16"/><path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/></svg>
          <span>号码云端存储，换机不丢失</span>
        </div>
        <div class="pay-feature">
          <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="#07c160" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <span>纯净无广告</span>
        </div>
        <div class="pay-feature">
          <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="#07c160" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <span>批量导入导出、号码分类管理</span>
        </div>
      </div>

      <van-radio-group v-model="payType" class="pay-options">
        <div class="pay-option" :class="{ 'pay-option-checked': payType === 'month' }" @click="payType = 'month'">
          <van-radio name="month" />
          <div class="pay-option-text">
            <span class="pay-option-title">月度会员</span>
            <span class="pay-option-price"><strong>¥9.9</strong>/月</span>
          </div>
        </div>
        <div class="pay-option pay-option-recommend" :class="{ 'pay-option-checked': payType === 'year' }" @click="payType = 'year'">
          <van-radio name="year" />
          <div class="pay-option-text">
            <span class="pay-option-title">年度会员 <van-tag type="danger" size="mini">推荐</van-tag></span>
            <span class="pay-option-price"><strong>¥68</strong>/年 <del>¥118.8</del></span>
          </div>
        </div>
      </van-radio-group>

      <van-button block type="primary" class="pay-btn" @click="handleMockPay">
        立即开通
      </van-button>
      <van-button block plain @click="popupVisible = false">稍后再说</van-button>

      <p class="pay-disclaimer">
        虚拟数字权益，无质量问题不支持退款；理性购彩，禁止未成年人购彩。
      </p>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'

const { showPayPopup, activateMember } = useUserStore()
const payType = ref('year')

const popupVisible = computed({
  get: () => showPayPopup.value,
  set: (v) => { showPayPopup.value = v }
})

function handleMockPay() {
  activateMember(payType.value)
  showPayPopup.value = false
  const label = payType.value === 'month' ? '月度会员' : '年度会员'
  showToast(`🎉 ${label}开通成功！云端同步已生效`)
}
</script>

<style scoped>
.pay-popup {
  width: 320px;
  padding: 24px 20px 20px;
}

.pay-header h3 {
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  color: #1a1a1a;
}

.pay-tips {
  margin-top: 10px;
  font-size: 12px;
  color: #888;
  line-height: 1.6;
  text-align: center;
}

.pay-tips strong {
  color: #e74c3c;
}

.pay-features {
  margin: 16px 0;
  background: #f6f8fa;
  border-radius: 10px;
  padding: 12px 14px;
}

.pay-feature {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #333;
  padding: 6px 0;
}

.feature-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.pay-options {
  margin-bottom: 4px;
}

.pay-option {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #ebedf0;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.pay-option-checked {
  border-color: #1989fa;
  background: #f0f8ff;
}

.pay-option-text {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-left: 8px;
}

.pay-option-title {
  font-size: 14px;
  font-weight: 500;
}

.pay-option-price {
  font-size: 13px;
  color: #666;
}

.pay-option-price strong {
  color: #e74c3c;
  font-size: 16px;
}

.pay-option-price del {
  font-size: 11px;
  color: #aaa;
  margin-left: 4px;
}

.pay-btn {
  margin: 16px 0 10px;
  border-radius: 8px;
  height: 44px;
  font-size: 15px;
}

.pay-disclaimer {
  margin-top: 14px;
  font-size: 11px;
  color: #aaa;
  line-height: 1.5;
  text-align: center;
}
</style>
