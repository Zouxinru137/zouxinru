/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-25 | 大模型：GLM-5.3-Flash
  说明：RAG 知识库数据模型（文件表 + 分块表），一次执行完成建表
*/
const zxrPool = require('../config/zxr_db');

async function zxrInitTables() {
  await zxrPool.query(`
    CREATE TABLE IF NOT EXISTS zxr_kb_files (
      zxr_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '文件ID',
      zxr_original_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
      zxr_ext VARCHAR(16) NOT NULL COMMENT '扩展名',
      zxr_size INT NOT NULL DEFAULT 0 COMMENT '文件字节大小',
      zxr_chunk_count INT NOT NULL DEFAULT 0 COMMENT '解析出的分块数',
      zxr_upload_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='RAG知识库文件表'
  `);
  await zxrPool.query(`
    CREATE TABLE IF NOT EXISTS zxr_kb_chunks (
      zxr_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '分块ID',
      zxr_file_id INT NOT NULL COMMENT '所属文件ID',
      zxr_chunk_index INT NOT NULL DEFAULT 0 COMMENT '分块序号',
      zxr_content TEXT NOT NULL COMMENT '分块文本内容',
      KEY zxr_idx_file (zxr_file_id),
      CONSTRAINT zxr_fk_file FOREIGN KEY (zxr_file_id) REFERENCES zxr_kb_files(zxr_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='RAG知识库分块表'
  `);
  console.log('[KB] 数据表就绪（zxr_kb_files / zxr_kb_chunks）');
}
module.exports = { zxrInitTables };
