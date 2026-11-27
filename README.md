# zou-video — 腾讯视频移动端模仿网站

《高级网页设计I》三级项目（大连东软信息学院）
姓名：邹欣茹　学号：24002120217

## 项目概况
以腾讯视频移动端（m.video.qq.com）为模仿对象的影视资讯网站，包含首页轮播推荐、频道列表、
视频详情、搜索、排行榜、登录注册、个人中心等 9 个前台页面，以及一个后台管理系统
（视频 / 分类 / 用户三实体的增删改查、搜索、分页 + ECharts 仪表盘）。

## 技术架构
- 前台：HTML5 + CSS3 + 原生 JavaScript（ES6+），移动端 rem + Flex 布局
- 后端：路径 A —— Node.js（Express）+ SQLite（node:sqlite 内置模块）
- 数据：接口返回统一 `{ code, message, data }` JSON，前端 fetch 数据驱动渲染
- 图标：自制 zou-iconfont 字体图标（fontTools 生成，本地 fonts/ 目录）
- 图表：ECharts（本地引入）
- LLM：后端接入大模型，实现"AI 剧情简介"与"AI 智能客服"功能
- 安全：密码 sha256 + 盐值加密存储；token 登录态保持；后台接口鉴权拦截

## 本地运行步骤
1. 安装 Node.js（≥22，需内置 node:sqlite 模块）
2. 在项目根目录执行：
   ```
   npm install
   node backend/zou-seed.js    # 首次运行：建库并写入测试数据
   node backend/server.js      # 启动服务，端口 3000
   ```
3. 浏览器访问 `http://localhost:3000/index.html`（建议 Chrome DevTools 手机模拟 375px）
4. 后台管理：`http://localhost:3000/admin.html`（管理员账号 admin / 密码 zou123456）
5. 测试账号：zoulin / 123456（普通用户，已注册）

## 页面清单
| 页面 | 文件 | 说明 |
| ---- | ---- | ---- |
| 首页 | index.html | 轮播图、频道导航、推荐列表、canvas 粒子 |
| 频道列表 | list.html | 分类 tab、卡片列表、分页 |
| 视频详情 | detail.html | URL 传参 id、播放区、AI 简介、评论 |
| 搜索 | search.html | 关键词搜索、搜索历史（localStorage） |
| 排行榜 | rank.html | 热播榜单 |
| 登录 | login.html | 表单校验、图形验证码（canvas）、token 保持 |
| 注册 | register.html | 正则校验、sha256 加密注册 |
| 个人中心 | profile.html | 用户信息、收藏、观看历史 |
| 后台管理 | admin.html | 三实体 CRUD、搜索、分页、仪表盘 |
