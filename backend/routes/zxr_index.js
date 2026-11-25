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
const zxrAiController = require('../controllers/zxr_aiController');
const zxrKbController = require('../controllers/zxr_kbController');
const zxrVisionController = require('../controllers/zxr_visionController');
const zxrAsrController = require('../controllers/zxr_asrController');
const zxrKbModel = require('../models/zxr_kbModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 知识库文件上传存储目录
const zxrKbDir = path.join(__dirname, '../zxr_kb_files');
if (!fs.existsSync(zxrKbDir)) fs.mkdirSync(zxrKbDir, { recursive: true });
const zxrKbUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, zxrKbDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  }),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// 健康检查
zxrRouter.get('/zxr_health', zxrHealthController.zxrHealth);

// 数据库连接测试
zxrRouter.post('/zxr_db_test', zxrDbController.zxrTestConnection);

// 科技新闻列表
zxrRouter.get('/zxr_tech_news', zxrNewsController.zxrListNews);

// 图文列表
zxrRouter.get('/zxr_gallery', zxrGalleryController.zxrListGallery);

// AI 客服：服务商列表 + 对话
zxrRouter.get('/zxr_ai_providers', zxrAiController.zxrProviders);
zxrRouter.post('/zxr_ai_chat', zxrAiController.zxrChat);

// RAG 知识库：上传 / 列表 / 删除 / 问答
zxrKbModel.zxrInitTables().catch(err => console.error('[KB] 建表失败：', err.message));
zxrRouter.post('/zxr_kb_upload', zxrKbUpload.single('zxr_kb_file'), zxrKbController.zxrUpload);
zxrRouter.get('/zxr_kb_files', zxrKbController.zxrList);
zxrRouter.delete('/zxr_kb_files/:id', zxrKbController.zxrDelete);
zxrRouter.post('/zxr_kb_ask', zxrKbController.zxrAsk);

// 图像识别：上传图片返回描述（视觉模型）
const zxrVisionDir = path.join(__dirname, '../zxr_vision_tmp');
if (!fs.existsSync(zxrVisionDir)) fs.mkdirSync(zxrVisionDir, { recursive: true });
const zxrVisionUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, zxrVisionDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  }),
  limits: { fileSize: 8 * 1024 * 1024 } // 8MB
});
zxrRouter.post('/zxr_vision_describe', zxrVisionUpload.single('zxr_image_file'), zxrVisionController.zxrDescribe);

// 语音识别：上传/录制音频转文字（ASR）
const zxrAsrDir = path.join(__dirname, '../zxr_asr_tmp');
if (!fs.existsSync(zxrAsrDir)) fs.mkdirSync(zxrAsrDir, { recursive: true });
const zxrAsrUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, zxrAsrDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Buffer.from(file.originalname, 'latin1').toString('utf8'))
  }),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});
zxrRouter.post('/zxr_asr_transcribe', zxrAsrUpload.single('zxr_audio_file'), zxrAsrController.zxrTranscribe);

module.exports = zxrRouter;
