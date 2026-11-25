/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-25 | 大模型：GLM-5.3-Flash
  说明：RAG 知识库控制器
  - 上传解析：doc / docx / ppt / pptx / pdf / txt
  - 文本分块入库（zxr_kb_files + zxr_kb_chunks）
  - 检索增强问答：按关键词为分块打分取 Top4，拼入提示词发给大模型
  - 服务端控制台完整输出发送给大模型的数据和接收自大模型的数据
*/
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

const zxrPool = require('../config/zxr_db');

// ---------- 文本解析 ----------
async function zxrParseTxt(zxrBuf) {
  return zxrBuf.toString('utf8');
}

async function zxrParseDocx(zxrBuf) {
  const zxrMammoth = require('mammoth');
  const zxrResult = await zxrMammoth.extractRawText({ buffer: zxrBuf });
  return zxrResult.value;
}

// 旧版 .doc（OLE2 二进制）
async function zxrParseDoc(zxrBuf, zxrSavePath) {
  const zxrWordExtractor = require('word-extractor');
  const zxrExtractor = new zxrWordExtractor();
  const zxrDoc = await zxrExtractor.extract(zxrSavePath);
  return zxrDoc.getBody();
}

// 新版 .pptx（zip 内 ppt/slides/slideN.xml）；旧版 .ppt 走二进制粗提取
async function zxrParsePpt(zxrBuf, zxrExt) {
  if (zxrExt === 'pptx') {
    const zxrZip = new AdmZip(zxrBuf);
    const zxrEntries = zxrZip.getEntries()
      .filter(e => /^ppt\/slides\/slide\d+\.xml$/i.test(e.entryName))
      .sort((a, b) => (Number(a.entryName.match(/\d+/)[0]) - Number(b.entryName.match(/\d+/)[0])));
    const zxrParts = zxrEntries.map(e => {
      const zxrXml = e.getData().toString('utf8');
      // 按 <a:t> 文本节点提取
      const zxrRuns = [...zxrXml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map(m => m[1]);
      return zxrRuns.join('\n');
    });
    return zxrParts.join('\n');
  }
  // 旧版 .ppt：提取可读文本（ASCII 词 + UTF-16LE 中文串），精度有限仅作降级支持
  const zxrStr = zxrBuf.toString('latin1');
  const zxrAscii = zxrStr.match(/[\x20-\x7E]{4,}/g) || [];
  const zxrUtf16 = [...zxrBuf.toString('utf16le').matchAll(/[\u4e00-\u9fa5A-Za-z0-9，。：；！？、%.\-]{4,}/g)].map(m => m[0]);
  return [...zxrAscii, ...zxrUtf16].join('\n');
}

async function zxrParsePdf(zxrBuf) {
  // 直接引 lib 入口，避开 pdf-parse 的调试测试文件读取
  const zxrPdfParse = require('pdf-parse/lib/pdf-parse.js');
  const zxrData = await zxrPdfParse(zxrBuf);
  return zxrData.text;
}

// 按扩展名分发解析
async function zxrExtractText(zxrFilePath, zxrExt) {
  const zxrBuf = fs.readFileSync(zxrFilePath);
  switch (zxrExt) {
    case 'txt': return zxrParseTxt(zxrBuf);
    case 'docx': return zxrParseDocx(zxrBuf);
    case 'doc': return zxrParseDoc(zxrBuf, zxrFilePath);
    case 'pptx':
    case 'ppt': return zxrParsePpt(zxrBuf, zxrExt);
    case 'pdf': return zxrParsePdf(zxrBuf);
    default: throw new Error('暂不支持该格式');
  }
}

// ---------- 分块 ----------
function zxrSplitChunks(zxrText, zxrMaxLen = 150) {
  const zxrParas = zxrText.replace(/\r/g, '').split(/\n+/).map(s => s.trim()).filter(Boolean);
  const zxrChunks = [];
  let zxrCur = '';
  for (const p of zxrParas) {
    if ((zxrCur + '\n' + p).length > zxrMaxLen && zxrCur) {
      zxrChunks.push(zxrCur);
      zxrCur = p;
    } else {
      zxrCur = zxrCur ? zxrCur + '\n' + p : p;
    }
  }
  if (zxrCur) zxrChunks.push(zxrCur);
  return zxrChunks;
}

// ---------- 服务商配置（与 AI 客服一致，读取 .env） ----------
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

// ---------- 接口实现 ----------
// 上传并解析知识库文件
exports.zxrUpload = async (zxrReq, zxrRes) => {
  try {
    if (!zxrReq.file) {
      return zxrRes.json({ code: 1, msg: '请选择文件（支持 doc/docx/ppt/pptx/pdf/txt）', data: null });
    }
    // 修复中文文件名乱码：multer 默认按 latin1 解码，重编码为 utf8
    zxrReq.file.originalname = Buffer.from(zxrReq.file.originalname, 'latin1').toString('utf8');
    const zxrExt = path.extname(zxrReq.file.originalname).slice(1).toLowerCase();
    const zxrAllowed = ['doc', 'docx', 'ppt', 'pptx', 'pdf', 'txt'];
    if (!zxrAllowed.includes(zxrExt)) {
      fs.unlinkSync(zxrReq.file.path);
      return zxrRes.json({ code: 1, msg: `不支持的格式 .${zxrExt}，仅支持 doc/docx/ppt/pptx/pdf/txt`, data: null });
    }

    const zxrText = await zxrExtractText(zxrReq.file.path, zxrExt);
    const zxrChunks = zxrSplitChunks(zxrText);
    console.log(`[KB] 解析完成：${zxrReq.file.originalname} -> ${zxrText.length} 字符 -> ${zxrChunks.length} 个分块`);

    if (!zxrChunks.length) {
      fs.unlinkSync(zxrReq.file.path);
      return zxrRes.json({ code: 1, msg: '未能从文件中解析出文本内容', data: null });
    }

    const [zxrFileResult] = await zxrPool.query(
      'INSERT INTO zxr_kb_files (zxr_original_name, zxr_ext, zxr_size, zxr_chunk_count) VALUES (?,?,?,?)',
      [zxrReq.file.originalname, zxrExt, zxrReq.file.size, zxrChunks.length]
    );
    const zxrFileId = zxrFileResult.insertId;
    const zxrValues = zxrChunks.map((c, i) => [zxrFileId, i, c]);
    await zxrPool.query('INSERT INTO zxr_kb_chunks (zxr_file_id, zxr_chunk_index, zxr_content) VALUES ?', [zxrValues]);

    zxrRes.json({
      code: 0,
      msg: '上传解析成功',
      data: { fileId: zxrFileId, name: zxrReq.file.originalname, ext: zxrExt, chars: zxrText.length, chunks: zxrChunks.length }
    });
  } catch (zxrErr) {
    console.error('[KB] 上传解析失败：', zxrErr.message);
    zxrRes.json({ code: 1, msg: '解析失败：' + zxrErr.message, data: null });
  }
};

// 知识库文件列表（含前 2 个分块预览）
exports.zxrList = async (zxrReq, zxrRes) => {
  try {
    const [zxrFiles] = await zxrPool.query('SELECT * FROM zxr_kb_files ORDER BY zxr_id DESC');
    const [zxrPreviews] = await zxrPool.query(
      'SELECT zxr_file_id, zxr_content FROM zxr_kb_chunks WHERE zxr_chunk_index < 2 ORDER BY zxr_file_id, zxr_chunk_index'
    );
    const zxrData = zxrFiles.map(f => ({
      id: f.zxr_id,
      name: f.zxr_original_name,
      ext: f.zxr_ext,
      size: f.zxr_size,
      chunkCount: f.zxr_chunk_count,
      uploadTime: f.zxr_upload_time,
      preview: zxrPreviews.filter(p => p.zxr_file_id === f.zxr_id).map(p => p.zxr_content).join(' ')
    }));
    zxrRes.json({ code: 0, msg: 'ok', data: zxrData });
  } catch (zxrErr) {
    console.error('[KB] 列表查询失败：', zxrErr.message);
    zxrRes.json({ code: 1, msg: '查询失败', data: null });
  }
};

// 删除知识库文件（级联删除分块）
exports.zxrDelete = async (zxrReq, zxrRes) => {
  try {
    const [zxrResult] = await zxrPool.query('DELETE FROM zxr_kb_files WHERE zxr_id = ?', [zxrReq.params.id]);
    if (!zxrResult.affectedRows) {
      return zxrRes.json({ code: 1, msg: '文件不存在或已删除', data: null });
    }
    zxrRes.json({ code: 0, msg: '删除成功', data: { id: Number(zxrReq.params.id) } });
  } catch (zxrErr) {
    console.error('[KB] 删除失败：', zxrErr.message);
    zxrRes.json({ code: 1, msg: '删除失败', data: null });
  }
};

// 基于知识库的 RAG 问答
exports.zxrAsk = async (zxrReq, zxrRes) => {
  try {
    const zxrQuestion = (zxrReq.body.question || '').trim();
    const zxrProvider = zxrReq.body.provider || process.env.AI_PROVIDER || 'siliconflow';
    if (!zxrQuestion) {
      return zxrRes.json({ code: 1, msg: '请输入问题', data: null });
    }

    // 1) 检索：按问题 2-gram 关键词给每个分块打分，取 Top4
    const [zxrAllChunks] = await zxrPool.query(
      'SELECT c.zxr_id, c.zxr_file_id, c.zxr_content, f.zxr_original_name FROM zxr_kb_chunks c JOIN zxr_kb_files f ON c.zxr_file_id = f.zxr_id'
    );
    const zxrGrams = [];
    const zxrClean = zxrQuestion.replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '');
    for (let i = 0; i < zxrClean.length - 1; i++) zxrGrams.push(zxrClean.slice(i, i + 2));
    const zxrScored = zxrAllChunks.map(c => {
      let zxrScore = 0;
      for (const g of zxrGrams) {
        let zxrIdx = c.zxr_content.indexOf(g);
        while (zxrIdx !== -1) { zxrScore++; zxrIdx = c.zxr_content.indexOf(g, zxrIdx + 1); }
      }
      return { ...c, score: zxrScore };
    }).filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    if (!zxrScored.length) {
      return zxrRes.json({
        code: 0,
        msg: 'ok',
        data: { answer: '抱歉，知识库中暂无与该问题相关的内容，请先上传相关文件，或换个问法。', sources: [], retrieved: 0 }
      });
    }

    // 2) 组装 RAG 提示词
    const zxrContext = zxrScored
      .map((c, i) => `【片段${i + 1}｜来源：${c.zxr_original_name}】\n${c.zxr_content}`)
      .join('\n\n');
    const zxrMessages = [
      { role: 'system', content: '你是"中华美食街·拾光集市"的智能客服。请只依据下面提供的知识库片段回答用户问题；片段中没有的信息，直接回答"知识库中暂无相关内容"。回答用中文、简洁友好。' },
      { role: 'user', content: `知识库片段：\n${zxrContext}\n\n用户问题：${zxrQuestion}` }
    ];

    // 3) 控制台输出发送给大模型的数据
    console.log('\n[RAG] ========== 发送给大模型的数据 ==========');
    console.log(JSON.stringify(zxrMessages, null, 2));
    console.log(`[RAG] 检索命中 ${zxrScored.length} 个片段：`, zxrScored.map(s => `#${s.zxr_id}(score:${s.score})`).join(', '));

    // 4) 调用大模型
    const zxrCfg = zxrProviderConfig(zxrProvider);
    const zxrResp = await fetch(`${zxrCfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${zxrCfg.apiKey}` },
      body: JSON.stringify({ model: zxrCfg.model, messages: zxrMessages })
    });
    const zxrRaw = await zxrResp.text();

    // 5) 控制台输出接收自大模型的数据
    console.log('\n[RAG] ========== 接收自大模型的数据 ==========');
    console.log(zxrRaw);

    if (!zxrResp.ok) {
      const zxrFriendly = zxrResp.status === 401 ? 'API Key 无效，请检查后端 .env' : `AI 服务异常（上游 ${zxrResp.status}）`;
      return zxrRes.json({ code: 1, msg: zxrFriendly, data: null });
    }
    const zxrBody = JSON.parse(zxrRaw);
    const zxrAnswer = zxrBody.choices?.[0]?.message?.content;

    zxrRes.json({
      code: 0,
      msg: 'ok',
      data: {
        answer: zxrAnswer,
        sources: [...new Set(zxrScored.map(s => s.zxr_original_name))],
        retrieved: zxrScored.length
      }
    });
  } catch (zxrErr) {
    console.error('[RAG] 问答失败：', zxrErr.message);
    zxrRes.json({ code: 1, msg: '问答失败：' + zxrErr.message, data: null });
  }
};
