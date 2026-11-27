/**
 * 文件名：zou-dump.js
 * 作者：邹欣茹  学号：24002120217
 * 时间：2026-11-27
 * 说明：导出 SQLite 数据为 SQL 文件（建表语句 + 全部测试数据），
 *       导出结果保存为 24002120217-邹欣茹.sql，可用于重建数据库
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const db = new DatabaseSync(path.join(__dirname, 'video.sqlite'));
const tables = ['zou_user', 'zou_category', 'zou_video', 'zou_comment', 'zou_token'];

let out = `-- zou-video 数据库导出文件\n-- 课程：《高级网页设计I》三级项目（路径 A：Node.js + SQLite）\n-- 作者：邹欣茹 24002120217\n-- 导出时间：${new Date().toLocaleString('zh-CN')}\n-- 用法：node backend/zou-seed.js 可直接重建；本文件也可在 SQLite 中按顺序执行\n\n`;

for (const t of tables) {
  if (t === 'zou_token') continue; // token 表为运行时数据，不导出
  const ddl = db.prepare(`SELECT sql FROM sqlite_master WHERE name = ?`).get(t).sql;
  out += `-- ${t} 建表语句\n${ddl.replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS')};\n\n`;
  const rows = db.prepare(`SELECT * FROM ${t}`).all();
  out += `-- ${t} 测试数据（${rows.length} 条）\n`;
  for (const r of rows) {
    const cols = Object.keys(r);
    const vals = cols.map(c => {
      const v = r[c];
      return typeof v === 'number' ? v : `'${String(v).replace(/'/g, "''")}'`;
    });
    out += `INSERT INTO ${t} (${cols.join(', ')}) VALUES (${vals.join(', ')});\n`;
  }
  out += '\n';
}
fs.writeFileSync(path.join(__dirname, '..', '24002120217-邹欣茹.sql'), out, 'utf-8');
console.log('SQL 导出完成: 24002120217-邹欣茹.sql,', out.split('\n').length, '行');
