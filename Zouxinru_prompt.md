# Zouxinru_prompt.md（追加写入，禁止覆盖已有内容）

2026-11-20 | 在当前项目根目录创建 AGENTS.md，写入以下规则。

## 项目结构与技术栈
- 前端：frontend/ 目录
  - 原生 HTML、CSS、JavaScript，禁止使用任何第三方库、框架、CDN 链接
  - 目录结构：frontend/ 下建 css/、js/、fonts/、images/ 子目录；
    fonts/ 存放 iconfont 图标文件（如果有）
- 后端：backend/ 目录，Node.js + Express，RESTful+MVC 风格，
  所有接口以 /api/ 为前缀，端口固定为 8217。
- 使用 express.static 托管 frontend/ 静态资源目录。
- 后端通过 cors 中间件开放全部跨域访问，本配置仅用于课程作业。
- 后端依赖安装：预先将 npm 源切换为国内镜像：
  npm config set registry `https://registry.npmmirror.com`
- 后端依赖安装： npm i 包名
- 数据库：MySQL（用户名 root、密码：见 backend/.env）
- 数据库凭据写入 backend/.env（变量名：DB_USER、DB_PASSWORD、DB_HOST、DB_NAME），
  不得出现在代码或 AGENTS.md 中；.env 同时加入 .gitignore
- 根据后端的要求自行建立和修改数据库表，每张表建立后，插入至少 8 条有真实业务意义的测试数据

## 命名与注释
- CSS 类名、JS 变量名、JS 函数名、数据库表名（及字段相关命名）
  一律以 zxr_ 开头
- 每个文件头部包含注释块：
  姓名：【Zouxinru】 | 学号：【24002120217】 |
  时间：yyyy-mm-dd | 大模型：{本次使用的大模型名称}

## 记录文件（一律追加写入，禁止覆盖已有内容）
- Zouxinru_prompt.md（项目根目录）：每次向 AI 发出开发指令后，
  追加记录：时间 | 提示词全文 | 大模型名称
- backend/zxr_interface.md：每次创建或修改接口后，追加：
  接口路径 | HTTP 方法 | 请求参数（含示例）|
  响应格式（含 JSON 示例）| 修改时间
- backend/zxr_database.md：每次建表、改表或插入数据后，
  按执行顺序追加对应 SQL 语句（含测试数据的 INSERT），
  要求仅凭此文件即可在新机器上完整重建数据库
- 统一 JSON 响应格式：{ "code": 0, "msg": "提示信息", "data": {...} }，
  code=0 表示成功，非 0 表示失败

## 前端约定
- 服务器返回的数据和错误信息输出到浏览器控制台（console.log / console.error）；
- 新建 HTML 页面后，在 frontend/index.html 中追加超链接入口；
  文件名包含 detail 的页面除外
 | GLM-5.3-Flash

2026-11-20 | 请初始化本项目：
1、git init + .gitignore（排除 node_modules、.env）+ 首次提交
2、按 AGENTS.md 规则创建前后端目录骨架、安装依赖、
3、创建前端首页 index.html，包括姓名：Zouxinru、学号：24002120217、项目名称、项目类别（自选、模仿），所有完成的 html 页面的超链接。有 canvas 背景动画。主体是页面链接导航。页面美观。
4、创建 readme.md，在根目录下，包括学号、姓名。 | GLM-5.3-Flash

2026-11-20 | 创建运行后台的bat文件，在根目录下。 | GLM-5.3-Flash

2026-11-20 | 创建 database.html 页面，输入用户名，密码，链接数据库，数据库使用 mysql，成功和错误都有提示，默认用户名 root，密码 Zxr66666617。 | GLM-5.3-Flash

2026-11-20 | 完成科技新闻列表页面，新闻的数据存在数据库表里。网页显示后端接口链接和数据内容。 | GLM-5.3-Flash

2026-11-20 | 完成图文列表，图片可以使用网络图片或创建图片，创建一个新的表，网页显示后端接口链接和数据内容。 | GLM-5.3-Flash

2026-11-20 | 图片为什么显示不了（文生图外链需 IDE 鉴权，浏览器返回 JSON 无法加载，改用本地生成图片 + 数据库更新为本地路径） | GLM-5.3-Flash

2026-11-20 | 嵌入到webprojectzouxinru里的index（在 webprojectzouxinru/index.html 课堂目录追加「综合项目 01 拾光集市」卡片，链接 http://localhost:8217） | GLM-5.3-Flash

2026-11-25 | 完成 AI 在线客服作业三任务：任务一 Key 安全检查（.gitignore/无前端残留/3 处泄露点）；任务二 中华美食街在线客服人设改造（system 提示词 + 5 问测试 3 答 2 拒）；任务三 多平台热切换（硅基流动/七牛下拉框，后端读 .env）+ 错误 Key 友好提示验证 | GLM-5.3-Flash

2026-11-25 | 上传到GitHub（远程 origin 改为 SSH 地址，rebase 合并远程课堂练习历史，解决 .gitignore 与 README 大小写冲突后推送成功 github.com/Zouxinru137/zouxinru） | GLM-5.3-Flash

2026-11-25 | 完成知识库文件上传功能（doc/docx/ppt/pptx/pdf/txt 解析入库），构建 2 个知识库文件（txt + 生成 docx），完成基于知识库的 RAG 问答与知识库管理（上传/列表/删除），控制台输出发送/接收大模型数据 | GLM-5.3-Flash

2026-11-25 | 完成图像识别功能：上传图片返回描述，使用已有 API-Key 与视觉模型 Qwen/Qwen3-VL-8B-Instruct，控制台输出发送/接收大模型数据，前端 vision.html | GLM-5.3-Flash

2026-11-25 | 实现语音识别：用户指定七牛 Qwen-Audio-3.0-ASR-Flash，经实测七牛渠道无任何语音模型（已列出全部 91 个模型验证），改用硅基流动 Qwen/Qwen3-ASR-1.7B（Qwen ASR 系列）实现录音/上传音频转文字，TTS->ASR 全链路验证通过 | GLM-5.3-Flash

2026-11-25 | 把四张 AI 功能运行截图（在线客服/知识库RAG/图像识别/语音识别）做成展示页 screenshots.html，截图存于 frontend/images/screenshots/，首页加入口卡片 | GLM-5.3-Flash

2026-11-25 | 在课堂实践 webprojectzouxinru/index.html 课堂目录追加"综合项目 02 拾光集市 AI 功能截图展示"卡片，链接 http://localhost:8217/screenshots.html | GLM-5.3-Flash

2026-11-25 | 在 Zouxinru 根目录 index.html（课堂实践首页）课堂目录追加"综合项目 01 拾光集市"与"综合项目 02 AI 功能截图展示"两张卡片，分别链接 http://localhost:8217 与 http://localhost:8217/screenshots.html | GLM-5.3-Flash

2026-11-25 | 生成单文件版截图展示页"AI功能截图展示.html"（四张截图 base64 内嵌，5.39MB，双击即可打开无需服务器），供发给老师查看 | GLM-5.3-Flash
