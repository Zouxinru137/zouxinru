# zxr_database.md（按执行顺序追加，仅凭此文件可在新机器完整重建数据库）

-- 2026-11-20 建库建表 zxr_tech_news 并插入测试数据（凭据见 backend/.env）

```sql
CREATE DATABASE IF NOT EXISTS zxr_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE zxr_db;

CREATE TABLE IF NOT EXISTS zxr_tech_news (
  zxr_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '新闻ID',
  zxr_title VARCHAR(200) NOT NULL COMMENT '新闻标题',
  zxr_category VARCHAR(50) NOT NULL DEFAULT '人工智能' COMMENT '新闻分类',
  zxr_source VARCHAR(100) NOT NULL COMMENT '新闻来源',
  zxr_summary VARCHAR(500) NOT NULL COMMENT '新闻摘要',
  zxr_published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='科技新闻表';

INSERT INTO zxr_tech_news (zxr_title, zxr_category, zxr_source, zxr_summary, zxr_published_at) VALUES
('国内首个千亿参数开源大模型发布，推理成本下降 40%', '人工智能', '科技日报', '国内研究团队正式开源千亿参数大模型，在多项权威评测中进入全球前三，推理成本较上一代下降 40%，助力中小企业 AI 应用落地。', '2026-11-18 09:30:00'),
('国产 3nm 制程芯片流片成功，预计明年一季度量产', '芯片半导体', '电子工业观察', '国产 3 纳米制程工艺芯片成功完成流片验证，良率达到行业主流水平，预计明年一季度实现小批量量产，主要面向移动终端与边缘计算。', '2026-11-17 14:05:00'),
('可折叠 OLED 面板出货量创历史新高', '消费电子', '显示产业网', '据最新统计，可折叠 OLED 面板本季度全球出货量同比增长 62%，创历史新高，多家厂商计划扩充柔性显示产线。', '2026-11-16 10:20:00'),
('固态电池中试线投产，续航有望突破 1500 公里', '新能源', '新能源汽车报', '国内首条固态电池中试生产线正式投产，能量密度达到 420Wh/kg，装车后纯电续航有望突破 1500 公里，计划 2027 年实现量产。', '2026-11-15 16:45:00'),
('低轨卫星互联网完成万星组网验证测试', '航天科技', '航天爱好者周刊', '低轨卫星互联网星座完成第一阶段万星组网验证，实测下行速率超过 500Mbps，下一步将开展商用牌照申请与终端小型化研发。', '2026-11-14 11:10:00'),
('量子计算原型机实现百比特纠错运行', '量子科技', '前沿科学网', '量子计算原型机首次实现百比特规模纠错稳定运行，逻辑门错误率降至 0.1% 以下，为通用量子计算机研制奠定工程基础。', '2026-11-13 09:00:00'),
('人形机器人量产工厂开工，年产能五千台', '机器人', '智能制造周刊', '国内首座人形机器人量产工厂正式开工，年规划产能五千台，首批商用机型将应用于工业巡检与商业接待场景。', '2026-11-12 15:30:00'),
('6G 现场试验网速率刷新纪录，峰值超 1Tbps', '通信技术', '通信世界', '6G 现场试验网完成第一阶段测试，实测峰值速率超过 1Tbps，时延低至 0.1 毫秒，全息通信等场景首次演示成功。', '2026-11-11 13:25:00'),
('AI 辅助新药研发进入二期临床，周期缩短一半', '生物科技', '医药创新观察', '借助 AI 大模型筛选的新药分子进入二期临床试验，研发周期较传统方式缩短约一半，成本下降近 60%。', '2026-11-10 08:40:00'),
('智能驾驶获准在 20 个城市开展全无人商业运营', '智能驾驶', '出行科技报', '多个城市发放智能驾驶全无人商业运营牌照，覆盖出租车与城配物流场景，标志着自动驾驶进入规模化商业落地阶段。', '2026-11-09 17:15:00');
```

-- 2026-11-20 建表 zxr_gallery（图文列表）并插入 8 条测试数据（图片使用网络图片地址）

```sql
USE zxr_db;

CREATE TABLE IF NOT EXISTS zxr_gallery (
  zxr_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '图文ID',
  zxr_title VARCHAR(200) NOT NULL COMMENT '标题',
  zxr_desc VARCHAR(500) NOT NULL COMMENT '描述',
  zxr_price DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '价格',
  zxr_image_url VARCHAR(500) NOT NULL COMMENT '图片地址',
  zxr_published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='拾光集市图文列表表';

INSERT INTO zxr_gallery (zxr_title, zxr_desc, zxr_price, zxr_image_url, zxr_published_at) VALUES
('95新轻薄笔记本 i5/16G', '学长毕业出售，办公学习流畅，电池循环 60 次，附原装充电器。', 3200.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=second-hand%20silver%20laptop%20on%20wooden%20desk%2C%20campus%20dorm%2C%20soft%20natural%20light%2C%20realistic%20product%20photo&image_size=landscape_4_3', '2026-11-19 10:00:00'),
('通勤自行车 骑行一年', '校内代步神器，前后刹车已调试，车况良好，附赠车锁一个。', 560.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=blue%20city%20bicycle%20parked%20near%20university%20library%2C%20sunny%20day%2C%20realistic%20photo&image_size=landscape_4_3', '2026-11-19 11:30:00'),
('胶片相机 复古款', '机械胶片相机成色不错，快门准确，适合摄影入门练习，附一卷新胶卷。', 899.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=vintage%20film%20camera%20on%20student%20desk%2C%20warm%20light%2C%20realistic%20product%20photo&image_size=landscape_4_3', '2026-11-19 13:15:00'),
('民谣吉他 41寸', '自学两年转卖，音准良好，面板无磕碰，附琴包与变调夹。', 480.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=acoustic%20guitar%20leaning%20against%20dorm%20wall%2C%20cozy%20room%2C%20realistic%20photo&image_size=landscape_4_3', '2026-11-19 15:40:00'),
('考研教材全套 9成新', '专业课教材与真题笔记打包出售，笔记工整齐全，限校内自提。', 120.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=stack%20of%20used%20textbooks%20on%20library%20table%2C%20soft%20light%2C%20realistic%20photo&image_size=landscape_4_3', '2026-11-19 16:25:00'),
('电动滑板车 续航25km', '代步通勤首选，速度三档可调，电池健康，附充电器与备用内胎。', 1299.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=white%20electric%20scooter%20on%20campus%20road%2C%20green%20trees%2C%20realistic%20photo&image_size=landscape_4_3', '2026-11-19 18:05:00'),
('护眼台灯 三档色温', '宿舍学习必备，无频闪，三档色温可调，使用半年，灯泡全新。', 89.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=minimal%20desk%20lamp%20glowing%20in%20student%20room%20at%20night%2C%20realistic%20photo&image_size=landscape_4_3', '2026-11-19 19:50:00'),
('篮球鞋 42码 白色', '室外场地实战两月，缓震完好，鞋面已清洗消毒，附原鞋盒。', 350.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/tool_text_to_image?prompt=pair%20of%20white%20basketball%20sneakers%20on%20campus%20court%2C%20sunny%2C%20realistic%20photo&image_size=landscape_4_3', '2026-11-19 20:30:00');
```

-- 2026-11-20 修正：文生图外链需 IDE 内部鉴权，浏览器无法加载；
-- 改为本地生成图片保存至 frontend/images/，数据库图片地址更新为本地路径

```sql
USE zxr_db;

UPDATE zxr_gallery SET zxr_image_url = '/images/zxr_laptop.jpg'   WHERE zxr_id = 1;
UPDATE zxr_gallery SET zxr_image_url = '/images/zxr_bicycle.jpg'  WHERE zxr_id = 2;
UPDATE zxr_gallery SET zxr_image_url = '/images/zxr_camera.jpg'   WHERE zxr_id = 3;
UPDATE zxr_gallery SET zxr_image_url = '/images/zxr_guitar.jpg'   WHERE zxr_id = 4;
UPDATE zxr_gallery SET zxr_image_url = '/images/zxr_books.jpg'    WHERE zxr_id = 5;
UPDATE zxr_gallery SET zxr_image_url = '/images/zxr_scooter.jpg'  WHERE zxr_id = 6;
UPDATE zxr_gallery SET zxr_image_url = '/images/zxr_lamp.jpg'     WHERE zxr_id = 7;
UPDATE zxr_gallery SET zxr_image_url = '/images/zxr_shoes.jpg'    WHERE zxr_id = 8;
```

-- 2026-11-25 RAG 知识库建表（服务启动时自动执行，此处留档以便新机器重建）
CREATE TABLE IF NOT EXISTS zxr_kb_files (
  zxr_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '文件ID',
  zxr_original_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
  zxr_ext VARCHAR(16) NOT NULL COMMENT '扩展名',
  zxr_size INT NOT NULL DEFAULT 0 COMMENT '文件字节大小',
  zxr_chunk_count INT NOT NULL DEFAULT 0 COMMENT '解析出的分块数',
  zxr_upload_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='RAG知识库文件表';

CREATE TABLE IF NOT EXISTS zxr_kb_chunks (
  zxr_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '分块ID',
  zxr_file_id INT NOT NULL COMMENT '所属文件ID',
  zxr_chunk_index INT NOT NULL DEFAULT 0 COMMENT '分块序号',
  zxr_content TEXT NOT NULL COMMENT '分块文本内容',
  KEY zxr_idx_file (zxr_file_id),
  CONSTRAINT zxr_fk_file FOREIGN KEY (zxr_file_id) REFERENCES zxr_kb_files(zxr_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='RAG知识库分块表';

-- 测试数据：通过 /api/zxr_kb_upload 上传以下 2 个文件自动插入（zxr_kb_files 2 行，zxr_kb_chunks 8 行，满足每表至少 8 行要求）
-- 文件1：backend/zxr_kb_seed/zxr_kb1_美食街营业与菜品.txt（521 字符 -> 4 个分块）
-- 文件2：backend/zxr_kb_seed/zxr_kb2_拾光集市平台规则.docx（369 字符 -> 4 个分块，由脚本 zxr_gen_docx.js 生成的 docx）
