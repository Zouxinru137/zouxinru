# zxr_interface.md（追加写入，禁止覆盖已有内容）

/api/zxr_health | GET | 无请求参数 | 统一 JSON：{ "code": 0, "msg": "提示信息", "data": {...} }，示例响应：
{
  "code": 0,
  "msg": "服务运行正常",
  "data": { "name": "zouxinru-backend", "time": "2026-11-20T05:59:48.441Z" }
} | 2026-11-20

/api/zxr_db_test | POST | JSON body：{ "username": "root", "password": "Zxr66666617" } | 成功示例：
{
  "code": 0,
  "msg": "数据库连接成功",
  "data": { "host": "127.0.0.1:3306", "user": "root", "version": "8.0.40", "databases": ["information_schema", "mysql", "performance_schema", "sys"] }
}
失败示例：{ "code": 1, "msg": "数据库连接失败：Access denied for user ...", "data": null } | 2026-11-20

/api/zxr_tech_news | GET | 无请求参数 | 成功示例：
{
  "code": 0,
  "msg": "查询成功",
  "data": [
    {
      "zxr_id": 1,
      "zxr_title": "国内首个千亿参数开源大模型发布，推理成本下降 40%",
      "zxr_category": "人工智能",
      "zxr_source": "科技日报",
      "zxr_summary": "国内研究团队正式开源千亿参数大模型……",
      "zxr_published_at": "2026-11-18T01:30:00.000Z"
    }
  ]
}
失败示例：{ "code": 1, "msg": "查询失败：……", "data": null } | 2026-11-20

/api/zxr_gallery | GET | 无请求参数 | 成功示例：
{
  "code": 0,
  "msg": "查询成功",
  "data": [
    {
      "zxr_id": 1,
      "zxr_title": "95新轻薄笔记本 i5/16G",
      "zxr_desc": "学长毕业出售，办公学习流畅……",
      "zxr_price": "3200.00",
      "zxr_image_url": "https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=...&image_size=landscape_4_3",
      "zxr_published_at": "2026-11-19T02:00:00.000Z"
    }
  ]
}
失败示例：{ "code": 1, "msg": "查询失败：……", "data": null } | 2026-11-20

/api/zxr_ai_providers | GET | 无请求参数 | 返回服务商名称与默认项（绝不返回 Key），示例：
{ "code": 0, "msg": "ok", "data": { "providers": ["siliconflow", "qiniu"], "names": { "siliconflow": "硅基流动", "qiniu": "七牛" }, "default": "siliconflow" } } | 2026-11-25

/api/zxr_ai_chat | POST | JSON body：{ "provider": "siliconflow", "message": "你们几点营业？", "history": [{"role":"user","content":"..."},{"role":"assistant","content":"..."}] } | 成功示例：
{ "code": 0, "msg": "ok", "data": { "reply": "我们周一至周日10:00-22:00营业。", "provider": "siliconflow", "model": "Qwen/Qwen2.5-7B-Instruct" } }
Key 无效时友好报错：{ "code": 1, "msg": "API Key 无效或未授权，请检查后端 .env 中的 Key 配置", "data": null } | 2026-11-25
