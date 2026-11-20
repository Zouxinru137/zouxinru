/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-20 | 大模型：GLM-5.3-Flash
  说明：科技新闻控制器
*/
const zxrNewsModel = require('../models/zxr_newsModel');

// GET /api/zxr_tech_news 新闻列表
exports.zxrListNews = async (req, res) => {
  try {
    const zxrRows = await zxrNewsModel.zxrFindAllNews();
    res.json({ code: 0, msg: '查询成功', data: zxrRows });
  } catch (err) {
    res.json({ code: 1, msg: '查询失败：' + err.message, data: null });
  }
};
