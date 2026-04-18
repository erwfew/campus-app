# 效园通 - 教师端 & 管理端规格文档

> 版本：v1.0  
> 说明：教师端和管理端为 Web 后台，通过浏览器访问

---

## 整体架构

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  学生端 App  │  │  教师端 Web  │  │  管理端 Web  │
│  (uni-app)  │  │  (Vue 3)    │  │  (Vue 3)    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
              ┌─────────▼─────────┐
              │   统一后端 API     │
              │  (Express/Node)   │
              └─────────┬─────────┘
                        │
              ┌─────────▼─────────┐
              │      数据库        │
              │  (MySQL/MongoDB)  │
              └───────────────────┘
```

---

## 一、教师端

> 访问地址：`https://admin.xiaoyuantong.com/teacher`

### 功能模块

#### 1. 我的课程
- 查看本学期所教课程列表
- 查看每门课的学生名单
- 发布课程公告（停课、调课通知）

#### 2. 课堂考勤
- 按课程、按节次点名
- 考勤方式：手动标记 / 扫码签到 / 蓝牙 proximity
- 查看考勤统计（缺勤率、迟到率）
- 导出考勤报表（Excel）

```
考勤状态：
  ✅ 出勤    ❌ 缺勤    ⏰ 迟到    📋 请假
```

#### 3. 作业管理
- 发布作业（标题、描述、附件、截止时间）
- 查看学生提交情况
- 批改作业 + 评分
- 批量导出作业

#### 4. 成绩录入
- 录入平时成绩、期中成绩、期末成绩
- 自动计算总评成绩
- 提交成绩到教务系统（对接后）

#### 5. 学生管理
- 查看选课学生信息
- 发送班级通知
- 查看学生考勤/成绩概览

### 教师端 API

```
GET    /api/teacher/courses              我的课程
GET    /api/teacher/courses/:id/students  学生名单
POST   /api/teacher/courses/:id/notice   发布课程公告

POST   /api/teacher/attendance           创建考勤
PUT    /api/teacher/attendance/:id       更新考勤记录
GET    /api/teacher/attendance/:id/stats  考勤统计

POST   /api/teacher/homework             发布作业
GET    /api/teacher/homework/:id/submissions  提交列表
PUT    /api/teacher/homework/:id/grade   批改评分

POST   /api/teacher/grades               录入成绩
POST   /api/teacher/grades/submit        提交成绩到教务
```

---

## 二、管理端（校方）

> 访问地址：`https://admin.xiaoyuantong.com/admin`

### 功能模块

#### 1. 数据看板
- 活跃用户数（日/周/月）
- 各功能使用率（课表、导航、跑步等）
- 教师端使用率
- 趋势图表

#### 2. 学校信息管理
- 校园建筑数据（增删改查）
- 教学楼、食堂、宿舍等坐标
- 建筑开放时间
- 楼层平面图上传

#### 3. 公告管理
- 发布全校公告
- 公告分类（教务、活动、通知、安全）
- 定时发布
- 置顶 / 标记重要
- 推送范围（全校 / 指定学院 / 指定年级）

#### 4. 用户管理
- 查看用户列表
- 按学院 / 年级筛选
- 禁用 / 启用账号
- 重置密码

#### 5. 教师管理
- 教师账号批量导入
- 分配教师到课程
- 查看教师活跃度

#### 6. 内容审核
- 审核学生提交的内容
- 举报处理
- 敏感词过滤规则

#### 7. 系统设置
- 学期设置（开学日期、周次计算）
- 课表节次时间配置
- 一卡通 / 图书馆接口配置
- Logo、主题色定制

### 管理端 API

```
GET    /api/admin/dashboard              数据看板
GET    /api/admin/dashboard/stats        详细统计

GET    /api/admin/buildings              校园建筑列表
POST   /api/admin/buildings              新增建筑
PUT    /api/admin/buildings/:id          修改建筑
DELETE /api/admin/buildings/:id          删除建筑

GET    /api/admin/notices                公告列表
POST   /api/admin/notices                发布公告
PUT    /api/admin/notices/:id            修改公告
DELETE /api/admin/notices/:id            删除公告
POST   /api/admin/notices/:id/push       推送通知

GET    /api/admin/users                  用户列表
PUT    /api/admin/users/:id/status       禁用/启用

GET    /api/admin/teachers               教师列表
POST   /api/admin/teachers/import        批量导入教师
POST   /api/admin/teachers/:id/courses   分配课程

GET    /api/admin/reports/content        内容审核列表
PUT    /api/admin/reports/:id            处理举报

GET    /api/admin/settings               系统设置
PUT    /api/admin/settings               更新设置
```

---

## 三、权限体系

| 角色 | 端 | 权限 |
|------|------|------|
| 学生 | App | 课表、考勤、作业、导航 |
| 教师 | Web | 课程管理、考勤、成绩录入 |
| 教务管理员 | Web | 公告、用户、成绩审核 |
| 超级管理员 | Web | 全部权限 + 系统设置 |

使用 **RBAC（基于角色的访问控制）**，权限可灵活配置。

---

## 四、技术选型建议

| 组件 | 推荐方案 |
|------|----------|
| 前端框架 | Vue 3 + Element Plus（管理端）|
| UI 组件库 | Element Plus（后台）/ uView（App）|
| 后端框架 | Express.js（现有）或升级 Nest.js |
| 数据库 | MySQL 8.0（结构化数据）|
| 缓存 | Redis（高频查询、Session）|
| 文件存储 | 腾讯云 COS / 阿里云 OSS |
| 消息推送 | 极光推送 / 腾讯信鸽 |
| 图表 | ECharts（数据看板）|
| 部署 | 腾讯云 / 阿里云服务器 |

---

## 五、开发排期建议

| 阶段 | 内容 | 周期 |
|------|------|------|
| Phase 1 | 教师端：课程 + 考勤 | 2 周 |
| Phase 2 | 教师端：作业 + 成绩 | 2 周 |
| Phase 3 | 管理端：数据看板 + 公告 | 2 周 |
| Phase 4 | 管理端：用户 + 内容审核 | 1 周 |
| Phase 5 | 对接学校官方接口 | 2 周 |

总计约 **9 周**，可并行开发缩短周期。
