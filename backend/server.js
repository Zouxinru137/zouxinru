/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-20 | 大模型：GLM-5.3-Flash
  说明：后端入口，Express + cors，静态托管 frontend，端口 8217
*/
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const zxrApp = express();

// 开放全部跨域（仅课程作业使用）
zxrApp.use(cors());

// 统一 JSON 响应中间件挂载在路由内部处理
zxrApp.use(express.json());

// 静态托管前端目录
zxrApp.use(express.static(path.join(__dirname, '../frontend')));

// /api 前缀路由
const zxrApiRouter = require('./routes/zxr_index');
zxrApp.use('/api', zxrApiRouter);

const zxrPort = 8217;
zxrApp.listen(zxrPort, () => {
  console.log(`Server is running at http://localhost:${zxrPort}`);
});
