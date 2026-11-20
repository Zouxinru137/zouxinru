/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-20 | 大模型：GLM-5.3-Flash
  说明：数据库连接测试控制器
*/
const mysql = require('mysql2/promise');

exports.zxrTestConnection = async (req, res) => {
  const zxrUsername = (req.body && req.body.username) || '';
  const zxrPassword = (req.body && req.body.password) || '';
  const zxrHost = process.env.DB_HOST || '127.0.0.1';
  const zxrPort = Number(process.env.DB_PORT || 3306);

  if (!zxrUsername) {
    return res.json({ code: 1, msg: '用户名不能为空', data: null });
  }

  let zxrConn = null;
  try {
    zxrConn = await mysql.createConnection({
      host: zxrHost,
      port: zxrPort,
      user: zxrUsername,
      password: zxrPassword,
      connectTimeout: 6000
    });
    const [zxrVerRows] = await zxrConn.query('SELECT VERSION() AS version');
    const [zxrDbRows] = await zxrConn.query('SHOW DATABASES');
    const zxrDbList = zxrDbRows.map(r => r.Database);

    res.json({
      code: 0,
      msg: '数据库连接成功',
      data: {
        host: zxrHost + ':' + zxrPort,
        user: zxrUsername,
        version: zxrVerRows[0].version,
        databases: zxrDbList
      }
    });
  } catch (err) {
    res.json({
      code: 1,
      msg: '数据库连接失败：' + err.message,
      data: null
    });
  } finally {
    if (zxrConn) {
      try { await zxrConn.end(); } catch (e) { /* 忽略关闭错误 */ }
    }
  }
};
