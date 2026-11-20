/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-20 | 大模型：GLM-5.3-Flash
  说明：科技新闻数据层
*/
const zxrPool = require('../config/zxr_db');

// 查询全部科技新闻（按发布时间倒序）
exports.zxrFindAllNews = async () => {
  const [rows] = await zxrPool.query(
    'SELECT zxr_id, zxr_title, zxr_category, zxr_source, zxr_summary, zxr_published_at FROM zxr_tech_news ORDER BY zxr_published_at DESC'
  );
  return rows;
};
