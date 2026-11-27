# agents.md — 项目规则（邹欣茹 24002120217）

## 1. 命名约定
- 所有类名、变量名、函数名、CSS 类名、数据表名一律以本人姓的拼音 `zou` 开头。
- 示例：CSS 类 `zou-nav`、`zou-card`；JS 函数 `zouRenderList()`、`zouFetch()`；
  数据表 `zou_user`、`zou_video`、`zou_category`、`zou_comment`、`zou_token`。
- JS 局部变量与函数采用小驼峰（`zouCarouselTimer`），CSS 类采用小写中划线（`zou-detail-hero`）。
- 文件命名全部英文：页面 `index.html`，样式 `css/zouxinru.css`，脚本 `js/zou-xxx.js`。

## 2. 目录约定
```
zou-video/
├── index.html / list.html / detail.html / search.html
├── login.html / register.html / profile.html / rank.html
├── admin.html              # 后台管理（单页，含仪表盘）
├── css/zouxinru.css        # 全站唯一外部样式
├── js/                     # zou-common.js 公共脚本 + 各页面脚本
├── images/                 # 本地图片素材（禁止 CDN）
├── fonts/                  # 自制 iconfont 字体文件
├── backend/                # Node.js + SQLite 后端（路径 A）
└── docs/                   # 接口文档、数据库文档、提示词记录
```

## 3. 代码风格约定
- 每个 html/css/js 文件头注释必须包含：姓名（邹欣茹）、学号（24002120217）、编写时间。
- 原生 JavaScript（ES6+），禁止 Vue/React/jQuery/Bootstrap 及任何 CDN 引入。
- 所有接口响应统一格式：`{ code, message, data }`；`code === 0` 表示成功。
- 前端统一使用 `zouFetch()` 封装 fetch：自动携带 token，401 时跳转登录页。
- 密码使用 sha256 + 盐值加密存储（高阶功能），登录态使用 token 存 localStorage。
- 缩进 2 空格；字符串使用单引号；每完成一个功能 git commit 一次（feat/fix/docs 前缀）。

## 4. 技术选型
- 端：移动端（375px 设计稿，rem + Flex 布局，不做响应式）。
- 后端：路径 A —— Node.js（Express）+ SQLite（node:sqlite 内置模块）。
- 图表：ECharts（本地文件）；图标：自制 zou-iconfont 字体图标。
- LLM：后端调用大模型生成剧情简介与 AI 智能客服（密钥仅存后端环境变量）。
