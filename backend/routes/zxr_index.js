/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-20 | 大模型：GLM-5.3-Flash
  说明：/api 总路由入口
*/
const zxrRouter = require('express').Router();

const zxrHealthController = require('../controllers/zxr_healthController');
const zxrDbController = require('../controllers/zxr_dbController');
const zxrNewsController = require('../controllers/zxr_newsController');
const zxrGalleryController = require('../controllers/zxr_galleryController');

// 健康检查
zxrRouter.get('/zxr_health', zxrHealthController.zxrHealth);

// 数据库连接测试
zxrRouter.post('/zxr_db_test', zxrDbController.zxrTestConnection);

// 科技新闻列表
zxrRouter.get('/zxr_tech_news', zxrNewsController.zxrListNews);

// 图文列表
zxrRouter.get('/zxr_gallery', zxrGalleryController.zxrListGallery);

module.exports = zxrRouter;
