<template>
  <div class="container">
    <van-notice-bar color="#fff" background="#ff4d4f" style="border-radius:10px;" :scrollable="true">
      ⚠️ 本工具仅号码比对娱乐，无法核验纸质彩票，理性购彩！禁止未成年人购彩
    </van-notice-bar>
    <h2 class="page-title">🎫 彩票自动核对工具</h2>

    <!-- 福利彩票板块 -->
    <div class="block-card">
      <div class="section-header fc-text">
        <img
          :src="fcLogo"
          alt="福彩logo"
          class="brand-logo"
        />
        中国福利彩票
      </div>
      <van-grid :column-num="2" :gutter="12">
        <van-grid-item class="grid-item fc-text" @click="selectLottery('ssq')">
          <img
            :src="ssqIcon"
            alt="双色球"
            class="lottery-icon"
          />
          <span>双色球</span>
        </van-grid-item>
        <van-grid-item class="grid-item fc-text" @click="selectLottery('fc3d')">
          <img
            :src="fc3dIcon"
            alt="福彩3D"
            class="lottery-icon"
          />
          <span>福彩3D</span>
        </van-grid-item>
        <van-grid-item class="grid-item fc-text" :span="2" @click="selectLottery('kl8')">
          <img
            :src="kl8Icon"
            alt="快乐8"
            class="lottery-icon"
          />
          <span>快乐8</span>
        </van-grid-item>
      </van-grid>
    </div>

    <!-- 体育彩票板块 -->
    <div class="block-card">
      <div class="section-header tc-text">
        <img
          :src="tcLogo"
          alt="体彩logo"
          class="brand-logo"
        />
        中国体育彩票
      </div>
      <van-grid :column-num="2" :gutter="12">
        <van-grid-item class="grid-item tc-text" @click="selectLottery('dlt')">
          <img
            :src="dltIcon"
            alt="大乐透"
            class="lottery-icon"
          />
          <span>超级大乐透</span>
        </van-grid-item>
        <van-grid-item class="grid-item tc-text" @click="selectLottery('qxc')">
          <img
            :src="qxcIcon"
            alt="七星彩"
            class="lottery-icon"
          />
          <span>七星彩</span>
        </van-grid-item>
        <van-grid-item class="grid-item tc-text" @click="selectLottery('pl3')">
          <img
            :src="pl3Icon"
            alt="排列3"
            class="lottery-icon"
          />
          <span>排列3</span>
        </van-grid-item>
        <van-grid-item class="grid-item tc-text" @click="selectLottery('pl5')">
          <img
            :src="pl5Icon"
            alt="排列5"
            class="lottery-icon"
          />
          <span>排列5</span>
        </van-grid-item>
      </van-grid>
    </div>

    <!-- 底部提示 -->
    <div class="footer-tip">
      <p>🎨 本工具所有图标均为原创矢量设计</p>
      <p>🔒 数据仅保存在您的浏览器本地</p>
    </div>

    <!-- 全局免责声明 -->
    <DisclaimerFooter />
  </div>
</template>

<script setup>
import { LOTTERY_NAME_MAP } from '@/utils/validate'
import DisclaimerFooter from '@/components/DisclaimerFooter.vue'

// 品牌 logo
import fcLogo from '@/assets/icons/fc-logo.svg'
import tcLogo from '@/assets/icons/tc-logo.svg'

// 福彩彩种图标
import ssqIcon from '@/assets/icons/ssq.svg'
import fc3dIcon from '@/assets/icons/fc3d.svg'
import kl8Icon from '@/assets/icons/kl8.svg'

// 体彩彩种图标
import dltIcon from '@/assets/icons/dlt.svg'
import qxcIcon from '@/assets/icons/qxc.svg'
import pl3Icon from '@/assets/icons/pl3.svg'
import pl5Icon from '@/assets/icons/pl5.svg'

const emit = defineEmits(['change-type'])

function selectLottery(type) {
  emit('change-type', { type, name: LOTTERY_NAME_MAP[type] })
}
</script>

<style scoped>
.container {
  padding: 14px;
  padding-bottom: 20px;
}
.page-title {
  margin: 18px 0 14px;
  font-size: 22px;
  text-align: center;
}
.block-card {
  background: #fff;
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 14px;
}
.brand-logo {
  height: 26px;
  object-fit: contain;
}
.grid-item {
  height: 90px !important;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
}
.lottery-icon {
  height: 36px;
  object-fit: contain;
}
.fc-text {
  color: #e6212a;
}
.tc-text {
  color: #0066b3;
}
.footer-tip {
  text-align: center;
  color: #999;
  font-size: 12px;
  line-height: 1.8;
  margin-top: 20px;
}
</style>
