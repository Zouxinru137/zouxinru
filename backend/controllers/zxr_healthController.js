/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-20 | 大模型：GLM-5.3-Flash
  说明：健康检查控制器
*/
exports.zxrHealth = (req, res) => {
  res.json({
    code: 0,
    msg: '服务运行正常',
    data: {
      name: 'zouxinru-backend',
      time: new Date().toISOString()
    }
  });
};
