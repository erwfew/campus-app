# 效园通 - 一站式校园生态综合平台

## 项目简介

效园通是一款面向大学生的校园生活服务平台，支持课程管理、校园导航、运动记录、排行榜等功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | uni-app (Vue 3) + HBuilderX |
| 桌面端 | Electron 28 |
| 后端 | Express (Node.js) + Puppeteer |
| 地图 | 高德地图 API |

## 项目结构

```
campus-app/
├── pages/              # uni-app 页面（16个）
├── components/         # 公共组件
├── admin/              # 教师管理后台
├── server/             # 后端服务
│   ├── config/         # 配置文件
│   ├── middleware/     # 中间件（错误处理、速率限制）
│   ├── routes/         # API 路由
│   ├── services/       # 业务逻辑
│   │   └── systems/    # 教务系统适配器（正方/青果/金智）
│   └── utils/          # 工具函数
├── electron.js         # Electron 入口
├── package.json        # 前端依赖
└── manifest.json       # uni-app 配置
```

## 快速开始

### 前端（HBuilderX）
1. 用 HBuilderX 打开项目
2. 运行 → 运行到浏览器 / 运行到小程序模拟器

### 桌面端（Electron）
```bash
npm install
npm start
```

### 后端
```bash
cd server
npm install
npm start
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/import/preview` | 预览课程导入 |
| POST | `/api/import/confirm` | 确认导入 |
| GET | `/api/homework` | 作业列表 |

详见 `server/README.md`

## 功能模块

- 🏠 首页 - 主入口
- 🗺️ 校园导航 - 高德地图智能导航
- 📚 学习中心 - 学习资源
- 📅 课程管理 - 4种导入方式（手动/教务系统/批量/单个）
- 🏃 运动 - 运动记录
- 🎨 创意 - 创意功能
- 🐱 虚拟吉祥物
- 🏆 排行榜
- 👤 个人中心
- ✅ 学信网认证
- 📢 校园公告

## 许可证

仅供学习交流使用。
