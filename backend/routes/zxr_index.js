/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-20 | 大模型：GLM-5.3-Flash
  说明：/api 总路由入口
*/
const zxrRouter = require('express').Router();

const zxrHealthController = require('../controllers/zxr_healthController');

// 健康检查
zxrRouter.get('/zxr_health', zxrHealthController.zxrHealth);

module.exports = zxrRouter;
