<template>
  <div class="disclaimer-footer">
    <div class="disclaimer-inner">
      <div class="disclaimer-title">⚠️ 重要声明</div>
      <ol class="disclaimer-list">
        <li>本产品仅为自选号码记录、格式校验管理工具，<strong>不存在任何开奖预测、号码推荐功能</strong>；彩票开奖结果完全随机。</li>
        <li>开通会员仅解锁工具增值功能，和彩票中奖没有任何关联，不存在任何中奖承诺。</li>
        <li>请理性购彩，量力而行，禁止未成年人参与购彩。</li>
        <li>付费服务为虚拟数字权益，开通后即时生效，非功能故障不支持无理由退款。</li>
      </ol>
    </div>
  </div>
</template>

<script setup>
// 纯展示组件，无需逻辑
</script>

<style scoped>
.disclaimer-footer {
  padding: 6px 12px 70px;
}

.disclaimer-inner {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 11px;
  color: #8c6d1e;
  line-height: 1.7;
}

.disclaimer-title {
  font-weight: 700;
  font-size: 12px;
  margin-bottom: 6px;
  color: #7a5e00;
}

.disclaimer-list {
  padding-left: 16px;
  margin: 0;
}

.disclaimer-list li {
  margin-bottom: 4px;
}

.disclaimer-list li strong {
  color: #c0392b;
}
</style>
