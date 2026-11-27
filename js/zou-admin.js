/**
 * 文件名：zou-admin.js
 * 作者：邹欣茹  学号：24002120217
 * 时间：2026-11-27
 * 说明：后台管理脚本 —— 管理员鉴权拦截（未登录/非管理员跳转登录页），
 *       仪表盘 ECharts（统计接口真实数据）、影片/分类/用户三实体
 *       列表（搜索 + 分页）与新增、编辑、删除（全部要求 token）
 */
'use strict';

/* ---------- 鉴权拦截：页面加载即校验 ---------- */
(async function zouAdminGuard() {
  const user = zouLoginUser();
  if (!user || user.role !== 'admin') {
    zouToast('请使用管理员账号登录');
    return setTimeout(() => (location.href = 'login.html'), 700);
  }
  const info = await zouFetch('/api/zou/user/info');
  if (info.code !== 0 || info.data.role !== 'admin') {
    localStorage.removeItem('zou_token');
    localStorage.removeItem('zou_user');
    return setTimeout(() => (location.href = 'login.html'), 700);
  }
  document.getElementById('zouAdminUser').textContent = `${info.data.nickname}（管理员）`;
  zouInitCharts();
  zouAdmin.load();
})();

document.getElementById('zouAdminLogout').addEventListener('click', async () => {
  await zouFetch('/api/zou/user/logout', { method: 'POST' });
  localStorage.removeItem('zou_token');
  localStorage.removeItem('zou_user');
  location.href = 'login.html';
});

/* ---------- 仪表盘图表（数据来自 /api/zou/admin/stat/overview） ---------- */
async function zouInitCharts() {
  const res = await zouFetch('/api/zou/admin/stat/overview');
  if (res.code !== 0) return;
  const s = res.data;
  document.getElementById('zouStatVideo').textContent = s.counts.video;
  document.getElementById('zouStatUser').textContent = s.counts.user;
  document.getElementById('zouStatCmt').textContent = s.counts.comment;
  document.getElementById('zouStatPlays').textContent = zouFmtPlays(s.counts.totalPlays);

  // 柱状图：各分类影片数量
  const chartCat = echarts.init(document.getElementById('zouChartCat'));
  chartCat.setOption({
    backgroundColor: 'transparent',
    grid: { left: 40, right: 16, top: 24, bottom: 28 },
    xAxis: { type: 'category', data: s.byCategory.map(c => c.name), axisLabel: { color: '#8b94a8' }, axisLine: { lineStyle: { color: '#232e45' } } },
    yAxis: { type: 'value', axisLabel: { color: '#8b94a8' }, splitLine: { lineStyle: { color: '#232e45' } } },
    series: [{
      type: 'bar', data: s.byCategory.map(c => c.value), barWidth: 18,
      itemStyle: { borderRadius: 6, color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#ff7f29' }, { offset: 1, color: '#ff5f1f' }]) }
    }],
    tooltip: { trigger: 'axis' }
  });

  // 折线图：近 7 天新增影片
  const chartDaily = echarts.init(document.getElementById('zouChartDaily'));
  chartDaily.setOption({
    backgroundColor: 'transparent',
    grid: { left: 40, right: 16, top: 24, bottom: 28 },
    xAxis: { type: 'category', data: s.daily.days, axisLabel: { color: '#8b94a8' }, axisLine: { lineStyle: { color: '#232e45' } } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#8b94a8' }, splitLine: { lineStyle: { color: '#232e45' } } },
    series: [{
      type: 'line', data: s.daily.values, smooth: true,
      lineStyle: { color: '#4f7cf0', width: 3 },
      itemStyle: { color: '#4f7cf0' },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(79,124,240,0.35)' }, { offset: 1, color: 'rgba(79,124,240,0)' }]) }
    }],
    tooltip: { trigger: 'axis' }
  });
  window.addEventListener('resize', () => { chartCat.resize(); chartDaily.resize(); });
}

/* ---------- 实体管理（video / category / user） ---------- */
const zouAdmin = {
  type: 'video',     // 当前实体
  page: 1,
  size: 8,
  kw: '',
  editing: null,     // 编辑中的行数据

  // 各实体的表单字段定义（用于新增/编辑弹窗）
  fields: {
    video: [
      { key: 'title', label: '片名', type: 'text' },
      { key: 'cid', label: '分类ID(1-5)', type: 'number' },
      { key: 'cover', label: '封面路径', type: 'text', placeholder: 'images/cover1.jpg' },
      { key: 'score', label: '评分(0-10)', type: 'number' },
      { key: 'actors', label: '主演', type: 'text' },
      { key: 'director', label: '导演', type: 'text' },
      { key: 'episodes', label: '集数', type: 'text' },
      { key: 'tags', label: '标签(逗号分隔)', type: 'text' },
      { key: 'plays', label: '播放量', type: 'number' },
      { key: 'summary', label: '简介', type: 'textarea' }
    ],
    category: [
      { key: 'name', label: '分类名称', type: 'text' },
      { key: 'sort', label: '排序权重', type: 'number' }
    ],
    user: [
      { key: 'username', label: '用户名', type: 'text' },
      { key: 'nickname', label: '昵称', type: 'text' },
      { key: 'password', label: '密码(明文提交，后端加密存储)', type: 'text' },
      { key: 'role', label: '角色(user/admin)', type: 'text' }
    ]
  },

  async load() {
    const res = await zouFetch(`/api/zou/admin/${this.type}/list?page=${this.page}&size=${this.size}&kw=${encodeURIComponent(this.kw)}`);
    if (res.code !== 0) return;
    this[`render_${this.type}`](res.data);
    this.renderPager(res.data.total);
  },

  /* 表格渲染：三个实体各自定义列 */
  render_video(d) {
    document.getElementById('zouAdminTable').innerHTML = `
      <tr><th>封面</th><th>片名</th><th>分类</th><th>评分</th><th>热度</th><th>更新时间</th><th>操作</th></tr>` +
      d.list.map(v => `
      <tr data-id="${v.id}">
        <td><img src="${v.cover}" alt="${v.title}"></td>
        <td><b>${v.title}</b><br><span style="color:var(--zou-sub)">${v.tags}</span></td>
        <td>${v.cid}</td>
        <td class="zou-score">${v.score}</td>
        <td>${zouFmtPlays(v.plays)}</td>
        <td style="color:var(--zou-sub)">${v.created_at}</td>
        <td><div class="zou-table__actions">
          <button class="zou-mini-btn zou-mini-btn--edit" data-act="edit"><span class="zou-icon zou-icon-edit"></span>编辑</button>
          <button class="zou-mini-btn zou-mini-btn--del" data-act="del"><span class="zou-icon zou-icon-trash"></span>删除</button>
        </div></td>
      </tr>`).join('');
    this.bindRows(d.list);
  },
  render_category(d) {
    document.getElementById('zouAdminTable').innerHTML = `
      <tr><th>ID</th><th>分类名称</th><th>排序</th><th>创建时间</th><th>操作</th></tr>` +
      d.list.map(v => `
      <tr data-id="${v.id}">
        <td>${v.id}</td>
        <td><b>${v.name}</b></td>
        <td>${v.sort}</td>
        <td style="color:var(--zou-sub)">${v.created_at}</td>
        <td><div class="zou-table__actions">
          <button class="zou-mini-btn zou-mini-btn--edit" data-act="edit"><span class="zou-icon zou-icon-edit"></span>编辑</button>
          <button class="zou-mini-btn zou-mini-btn--del" data-act="del"><span class="zou-icon zou-icon-trash"></span>删除</button>
        </div></td>
      </tr>`).join('');
    this.bindRows(d.list);
  },
  render_user(d) {
    document.getElementById('zouAdminTable').innerHTML = `
      <tr><th>ID</th><th>用户名</th><th>昵称</th><th>角色</th><th>注册时间</th><th>操作</th></tr>` +
      d.list.map(v => `
      <tr data-id="${v.id}">
        <td>${v.id}</td>
        <td><b>${v.username}</b></td>
        <td>${v.nickname}</td>
        <td>${v.role === 'admin' ? '<span class="zou-tag">管理员</span>' : '用户'}</td>
        <td style="color:var(--zou-sub)">${v.created_at}</td>
        <td><div class="zou-table__actions">
          <button class="zou-mini-btn zou-mini-btn--edit" data-act="edit"><span class="zou-icon zou-icon-edit"></span>编辑</button>
          <button class="zou-mini-btn zou-mini-btn--del" data-act="del"><span class="zou-icon zou-icon-trash"></span>删除</button>
        </div></td>
      </tr>`).join('');
    this.bindRows(d.list);
  },

  /* 行按钮事件（编辑 / 删除） */
  bindRows(list) {
    const table = document.getElementById('zouAdminTable');
    table.querySelectorAll('tr[data-id]').forEach(tr => {
      const id = +tr.dataset.id;
      const row = list.find(x => x.id === id);
      tr.querySelectorAll('[data-act]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const act = btn.dataset.act;
          if (act === 'edit') return this.openModal(row);
          // 删除：二次确认
          if (!confirm('确认删除该记录？')) return;
          const res = await zouFetch(`/api/zou/admin/${this.type}/${id}`, { method: 'DELETE' });
          zouToast(res.message);
          if (res.code === 0) this.load();
        });
      });
    });
  },

  renderPager(total) {
    const pages = Math.max(1, Math.ceil(total / this.size));
    const box = document.getElementById('zouAdminPager');
    box.innerHTML = `
      <button class="zou-pagination__btn${this.page <= 1 ? ' zou-pagination__btn--disabled' : ''}" id="zouAdmPrev">上一页</button>
      <span class="zou-pagination__num">第 <b>${this.page}</b> / ${pages} 页 · 共 ${total} 条</span>
      <button class="zou-pagination__btn${this.page >= pages ? ' zou-pagination__btn--disabled' : ''}" id="zouAdmNext">下一页</button>`;
    document.getElementById('zouAdmPrev').addEventListener('click', () => { if (this.page > 1) { this.page--; this.load(); } });
    document.getElementById('zouAdmNext').addEventListener('click', () => { if (this.page < pages) { this.page++; this.load(); } });
  },

  /* 新增 / 编辑弹窗 */
  openModal(row) {
    this.editing = row || null;
    document.getElementById('zouModalTitle').textContent = row ? '编辑' : '新增';
    document.getElementById('zouModalBody').innerHTML = this.fields[this.type].map(f => {
      const val = row ? (row[f.key] ?? '') : '';
      const ph = f.placeholder ? `placeholder="${f.placeholder}"` : '';
      if (f.type === 'textarea') {
        return `<div class="zou-form-item"><label class="zou-form-item__label">${f.label}</label>
          <textarea class="zou-input" id="zouField_${f.key}" rows="3" style="width:100%;padding:0.5rem;background:var(--zou-card2);border-radius:0.375rem">${val}</textarea></div>`;
      }
      return `<div class="zou-form-item"><label class="zou-form-item__label">${f.label}</label>
        <div class="zou-input-wrap"><input class="zou-input" id="zouField_${f.key}" type="${f.type}" ${ph} value="${String(val).replace(/"/g, '&quot;')}"></div></div>`;
    }).join('');
    document.getElementById('zouAdminModal').classList.add('zou-show');
  },

  /* 保存（区分新增与编辑） */
  async save() {
    const payload = {};
    for (const f of this.fields[this.type]) {
      const el = document.getElementById('zouField_' + f.key);
      let v = f.type === 'number' ? (parseFloat(el.value) || 0) : el.value;
      // 编辑用户时密码留空则不更新
      if (this.type === 'user' && f.key === 'password' && this.editing && !v) continue;
      payload[f.key] = v;
    }
    const url = this.editing
      ? `/api/zou/admin/${this.type}/${this.editing.id}`
      : `/api/zou/admin/${this.type}/add`;
    const res = await zouFetch(url, {
      method: this.editing ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    zouToast(res.message);
    if (res.code === 0) {
      document.getElementById('zouAdminModal').classList.remove('zou-show');
      this.load();
    }
  }
};

/* tab 切换 */
document.querySelectorAll('#zouAdminTabs .zou-tabs__item').forEach(btn => {
  btn.addEventListener('click', () => {
    zouAdmin.type = btn.dataset.t;
    zouAdmin.page = 1;
    zouAdmin.kw = '';
    document.getElementById('zouAdminKw').value = '';
    document.querySelectorAll('#zouAdminTabs .zou-tabs__item').forEach(b => b.classList.toggle('zou-tabs__item--active', b === btn));
    zouAdmin.load();
  });
});
document.getElementById('zouAdminSearch').addEventListener('click', () => {
  zouAdmin.kw = document.getElementById('zouAdminKw').value.trim();
  zouAdmin.page = 1;
  zouAdmin.load();
});
document.getElementById('zouAdminKw').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('zouAdminSearch').click();
});
document.getElementById('zouAdminAdd').addEventListener('click', () => zouAdmin.openModal(null));
document.getElementById('zouModalClose').addEventListener('click', () => document.getElementById('zouAdminModal').classList.remove('zou-show'));
document.getElementById('zouModalCancel').addEventListener('click', () => document.getElementById('zouAdminModal').classList.remove('zou-show'));
document.getElementById('zouModalSave').addEventListener('click', () => zouAdmin.save());
