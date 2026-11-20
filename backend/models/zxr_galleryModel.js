/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-20 | 大模型：GLM-5.3-Flash
  说明：图文列表（拾光集市二手好物）数据层
*/
const zxrPool = require('../config/zxr_db');

// 查询全部图文条目（按发布时间倒序）
exports.zxrFindAllGallery = async () => {
  const [rows] = await zxrPool.query(
    'SELECT zxr_id, zxr_title, zxr_desc, zxr_price, zxr_image_url, zxr_published_at FROM zxr_gallery ORDER BY zxr_published_at DESC'
  );
  return rows;
};
