/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-20 | 大模型：GLM-5.3-Flash
  说明：图文列表控制器
*/
const zxrGalleryModel = require('../models/zxr_galleryModel');

// GET /api/zxr_gallery 图文列表
exports.zxrListGallery = async (req, res) => {
  try {
    const zxrRows = await zxrGalleryModel.zxrFindAllGallery();
    res.json({ code: 0, msg: '查询成功', data: zxrRows });
  } catch (err) {
    res.json({ code: 1, msg: '查询失败：' + err.message, data: null });
  }
};
