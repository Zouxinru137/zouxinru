/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-25 | 大模型：GLM-5.3-Flash
  说明：一次性脚本（执行后删除）：用 adm-zip 生成最小可用 docx 知识库文件（拾光集市平台规则）
*/
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const zxrParagraphs = [
  '拾光集市平台规则知识库',
  '【平台简介】',
  '拾光集市是面向校园的二手交易平台，只允许在校学生发布闲置物品，包括数码产品、图书教材、生活用品、运动器材四大类目。发布商品需实名认证并绑定学号。',
  '【交易流程】',
  '买家下单后 15 分钟内付款，超时订单自动关闭。卖家须在 48 小时内发货或约定线下面交；面交建议在教学楼大厅或图书馆门口等公开场所。买家确认收货后 24 小时内可评价，超时默认好评。',
  '【纠纷与退款】',
  '商品与描述严重不符的，买家可在收货 72 小时内申请退款，平台客服 1 个工作日内介入仲裁。卖家恶意爽约 3 次将被冻结账号 7 天；刷单、售卖违禁品的账号永久封禁。',
  '【安全提醒】',
  '严禁在平台线下直接转账给陌生人；交易全程保留聊天记录与转账凭证，以便平台仲裁使用。高价值商品（超过 1000 元）建议选择平台担保交易。'
];

function zxrEsc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const zxrBody = zxrParagraphs
  .map(t => `<w:p><w:r><w:t xml:space="preserve">${zxrEsc(t)}</w:t></w:r></w:p>`)
  .join('');

const zxrDocumentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${zxrBody}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1800" w:bottom="1440" w:left="1800"/></w:sectPr></w:body></w:document>`;

const zxrContentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const zxrRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const zxrDocRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

const zxrZip = new AdmZip();
zxrZip.addFile('[Content_Types].xml', Buffer.from(zxrContentTypes));
zxrZip.addFile('_rels/.rels', Buffer.from(zxrRels));
zxrZip.addFile('word/document.xml', Buffer.from(zxrDocumentXml));
zxrZip.addFile('word/_rels/document.xml.rels', Buffer.from(zxrDocRels));

const zxrOut = path.join(__dirname, 'zxr_kb_seed', 'zxr_kb2_拾光集市平台规则.docx');
zxrZip.writeZip(zxrOut);
console.log('docx 生成成功：', zxrOut, fs.statSync(zxrOut).size, 'bytes');
