# 彩票核对工具 (lottery-checker)

一个基于 **Vue 3 + Vant** 的移动端彩票中奖核对工具，支持多种中国主流彩票的自动中奖判断，内置官方规则对照表。

## ✨ 功能特性

- **7 种彩种支持**：双色球、福彩3D、超级大乐透、七星彩、排列三、排列五、快乐8
- **官方规则对照表**：每种彩票独立维护规则常量（`*_WIN_RULES` + `get*WinInfo()`），自动判断中奖等级与对应奖金
- **单式 / 复式投注**：支持双色球、大乐透、快乐8 等复式号码核对
- **开奖数据自动获取**：通过 Vercel 云函数（`fc-proxy` / `tc-proxy`）代理从福彩 / 体彩官网拉取最新开奖号码
- **移动端优先 UI**：采用 Vant 4 组件库，适配手机屏幕

## 🎯 支持的彩种与规则概览

| 彩种 | 代码 | 奖级说明 | 规则依据 |
|------|------|----------|----------|
| 双色球 | `ssq` | 6 个奖级（一~六等奖，浮动+固定） | 中彩网官方规则 |
| 福彩3D | `fc3d` | 直选 1040 / 组选三 346 / 组选六 173（固定） | lottery.gov.cn |
| 超级大乐透 | `dlt` | 9 个奖级（浮动+固定） | 体彩官方规则 |
| 七星彩 | `qxc` | 6 个奖级：一/二等奖浮动，三~六等奖固定（3000/500/30/5 元） | sporttery.cn |
| 排列三 | `pl3` | 直选 1040 / 组选三 346 / 组选六 173（固定） | sporttery.cn |
| 排列五 | `pl5` | 一等奖固定 100000 元 | sporttery.cn / gdlottery.cn |
| 快乐8 | `kl8` | 选十玩法，多奖级（浮动+固定） | 中彩网官方规则 |

> 规则均依据中国福利彩票 / 中国体育彩票官方网站公布的中奖办法整理，奖金以官方当期实际公布为准。

## 🛠 技术栈

- **Vue 3** + **Vite 5**
- **Vant 4** 移动端 UI 组件库
- 组件按需自动引入（`unplugin-vue-components` + `@vant/auto-import-resolver`）
- **Vercel** 云函数（`api/fc-proxy`、`api/tc-proxy`）代理开奖数据，解决跨域

## 🚀 本地运行

```bash
npm install        # 安装依赖
npm run dev        # 启动开发服务器（默认 http://localhost:5173）
npm run build      # 生产构建，产物输出到 dist/
npm run preview    # 本地预览构建产物
```

## ☁️ 部署

项目已包含 `vercel.json` 配置，推送到 GitHub 后可由 Vercel 自动部署。`api/` 目录下的云函数会在 Vercel 平台上作为 Serverless Functions 运行，负责代理开奖数据请求。

## 📁 目录结构

```
lottery-checker/
├── api/                  # Vercel 云函数（开奖数据代理，解决跨域）
│   ├── fc-proxy/         # 福彩开奖数据代理
│   └── tc-proxy/         # 体彩开奖数据代理
├── src/
│   ├── assets/           # 图标等静态资源（各彩种 svg）
│   ├── components/       # 通用组件
│   ├── stores/           # 状态管理
│   ├── utils/
│   │   ├── validate.js   # 各彩种中奖规则对照表与判断逻辑
│   │   └── lotteryApi.js # 开奖号码获取与解析
│   ├── views/            # 页面视图（Home / Check / Group 等）
│   ├── App.vue
│   └── main.js
├── index.html
├── vite.config.js
└── vercel.json
```

## ⚠️ 免责声明

本工具仅供个人学习与技术演示使用，所有中奖规则、奖级与奖金均以中国福利彩票、中国体育彩票官方公布的当期信息为准。本工具不构成任何购彩建议。请理性购彩，量力而行，未成年人不得购彩。
