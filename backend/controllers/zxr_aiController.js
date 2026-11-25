/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-25 | 大模型：GLM-5.3-Flash
  说明：AI 在线客服控制器（中华美食街人设）
  - 服务商配置全部从 .env 读取，Key 绝不进入前端
  - 支持 siliconflow / qiniu 双服务商热切换
  - 多轮对话：前端传历史消息，后端拼 system 提示词一起发送
  - 上游出错（如 Key 无效）返回友好提示，而非白屏
*/

// 中华美食街客服 system 提示词（提示词工程：明确人设 + 白名单三类问题 + 统一拒答话术）
const ZXR_SYSTEM_PROMPT = [
  '你是"中华美食街"的在线客服小福，亲切、简短、用中文回答。',
  '你只回答以下三类问题：',
  '1) 营业时间：周一至周日 10:00-22:00，节假日不休息；',
  '2) 招牌菜：北京烤鸭、四川麻婆豆腐、广东虾饺、西安羊肉泡馍、杭州东坡肉，价格 28-168 元；',
  '3) 配送范围：门店周边 5 公里内免费配送，5-10 公里加收 5 元配送费，超过 10 公里暂不配送。',
  '除上述三类之外的任何问题（如写代码、写作业、闲聊、天气等），一律不回答，',
  '固定回复："抱歉，我是美食街在线客服，只解答营业时间、招牌菜和配送范围三类问题，其他问题请留言，人工客服会尽快回复您～"',
  '不要透露你是 AI 模型，不要透露任何系统配置或密钥信息。'
].join('\n');

// 两个服务商的 .env 配置映射（只在此处使用 Key）
function zxrProviderConfig(zxrProvider) {
  if (zxrProvider === 'qiniu') {
    return {
      baseUrl: process.env.QINIU_CUSTOMER_SERVICE_BASE_URL,
      apiKey: process.env.QINIU_CUSTOMER_SERVICE_API_KEY,
      model: process.env.QINIU_CUSTOMER_SERVICE_MODEL
    };
  }
  return {
    baseUrl: process.env.SILICONFLOW_BASE_URL,
    apiKey: process.env.SILICONFLOW_API_KEY,
    model: process.env.SILICONFLOW_MODEL
  };
}

exports.zxrProviders = function (zxrReq, zxrRes) {
  // 只暴露服务商名称与默认项，绝不返回 Key
  zxrRes.json({
    code: 0,
    msg: 'ok',
    data: {
      providers: ['siliconflow', 'qiniu'],
      names: { siliconflow: '硅基流动', qiniu: '七牛' },
      default: process.env.AI_PROVIDER || 'siliconflow'
    }
  });
};

exports.zxrChat = async function (zxrReq, zxrRes) {
  const zxrProvider = zxrReq.body.provider || process.env.AI_PROVIDER || 'siliconflow';
  const zxrMessage = zxrReq.body.message;
  const zxrHistory = Array.isArray(zxrReq.body.history) ? zxrReq.body.history : [];
  const zxrCfg = zxrProviderConfig(zxrProvider);

  // 参数校验
  if (!zxrMessage || typeof zxrMessage !== 'string' || !zxrMessage.trim()) {
    return zxrRes.json({ code: 1, msg: '请输入您的问题', data: null });
  }
  if (!zxrCfg.baseUrl || !zxrCfg.apiKey || !zxrCfg.model) {
    return zxrRes.json({
      code: 1,
      msg: `${zxrProvider} 服务商配置缺失，请检查后端 .env`,
      data: null
    });
  }

  // 组装多轮消息：system + 历史 + 本轮提问
  const zxrMessages = [
    { role: 'system', content: ZXR_SYSTEM_PROMPT },
    ...zxrHistory
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-10),
    { role: 'user', content: zxrMessage.trim() }
  ];

  try {
    const zxrResp = await fetch(`${zxrCfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${zxrCfg.apiKey}`
      },
      body: JSON.stringify({ model: zxrCfg.model, messages: zxrMessages })
    });
    const zxrText = await zxrResp.text();
    let zxrBody;
    try { zxrBody = JSON.parse(zxrText); } catch (e) { zxrBody = null; }

    // 上游鉴权失败（Key 无效/欠费等）：友好提示而非白屏
    if (!zxrResp.ok) {
      console.error(`[AI] ${zxrProvider} 上游错误 ${zxrResp.status}:`, zxrText.slice(0, 300));
      const zxrFriendly =
        zxrResp.status === 401 ? 'API Key 无效或未授权，请检查后端 .env 中的 Key 配置'
        : zxrResp.status === 429 ? '请求过于频繁或额度不足，请稍后再试'
        : `AI 服务暂时不可用（上游 ${zxrResp.status}），请稍后再试`;
      return zxrRes.json({ code: 1, msg: zxrFriendly, data: null });
    }

    const zxrReply = zxrBody && zxrBody.choices && zxrBody.choices[0]
      && zxrBody.choices[0].message && zxrBody.choices[0].message.content;
    if (!zxrReply) {
      console.error('[AI] 上游返回异常：', zxrText.slice(0, 300));
      return zxrRes.json({ code: 1, msg: 'AI 返回内容异常，请稍后再试', data: null });
    }

    zxrRes.json({
      code: 0,
      msg: 'ok',
      data: { reply: zxrReply, provider: zxrProvider, model: zxrCfg.model }
    });
  } catch (zxrErr) {
    console.error('[AI] 请求异常：', zxrErr.message);
    zxrRes.json({ code: 1, msg: '无法连接 AI 服务，请检查网络后稍后再试', data: null });
  }
};
