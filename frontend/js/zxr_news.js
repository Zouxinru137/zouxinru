/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-20 | 大模型：GLM-5.3-Flash
  说明：科技新闻列表页逻辑（请求 /api/zxr_tech_news）
*/
(function zxrInitNewsPage() {
  var zxrList = document.getElementById('zxr_news_list');
  var zxrMsg = document.getElementById('zxr_news_message');

  function zxrShowMessage(text, zxrIsOk) {
    zxrMsg.textContent = text;
    zxrMsg.className = 'zxr_news_message ' + (zxrIsOk ? 'zxr_ok' : 'zxr_err');
  }

  function zxrFormatTime(zxrStr) {
    if (!zxrStr) return '';
    var d = new Date(zxrStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return zxrStr;
    function zxrPad(n) { return n < 10 ? '0' + n : '' + n; }
    return d.getFullYear() + '-' + zxrPad(d.getMonth() + 1) + '-' + zxrPad(d.getDate())
      + ' ' + zxrPad(d.getHours()) + ':' + zxrPad(d.getMinutes());
  }

  function zxrRenderNews(zxrArr) {
    zxrList.innerHTML = '';
    if (!zxrArr || !zxrArr.length) {
      zxrShowMessage('暂无新闻数据', false);
      return;
    }
    for (var i = 0; i < zxrArr.length; i++) {
      var item = zxrArr[i];
      var div = document.createElement('div');
      div.className = 'zxr_news_item';

      var top = document.createElement('div');
      top.className = 'zxr_news_item_top';

      var tag = document.createElement('span');
      tag.className = 'zxr_news_tag';
      tag.textContent = item.zxr_category;

      var title = document.createElement('span');
      title.className = 'zxr_news_item_title';
      title.textContent = item.zxr_title;

      top.appendChild(tag);
      top.appendChild(title);

      var summary = document.createElement('div');
      summary.className = 'zxr_news_item_summary';
      summary.textContent = item.zxr_summary;

      var meta = document.createElement('div');
      meta.className = 'zxr_news_item_meta';
      meta.textContent = '来源：' + item.zxr_source + '　|　发布时间：' + zxrFormatTime(item.zxr_published_at);

      div.appendChild(top);
      div.appendChild(summary);
      div.appendChild(meta);
      zxrList.appendChild(div);
    }
    zxrShowMessage('共加载 ' + zxrArr.length + ' 条新闻', true);
  }

  function zxrLoadNews() {
    // 直接以 file:// 方式打开页面时，fetch 无法请求后端接口
    if (window.location.protocol === 'file:') {
      console.error('当前通过 file:// 打开页面，无法请求接口。请访问 http://localhost:8217/news.html');
      zxrShowMessage('✗ 请通过服务器访问页面：http://localhost:8217/news.html', false);
      return;
    }
    zxrShowMessage('加载中...', true);
    fetch('/api/zxr_tech_news')
      .then(function (res) { return res.json(); })
      .then(function (result) {
        console.log('服务器返回数据：', result);
        if (result.code === 0) {
          zxrRenderNews(result.data);
        } else {
          console.error('接口返回错误：', result.msg);
          zxrShowMessage('✗ ' + result.msg, false);
        }
      })
      .catch(function (err) {
        console.error('请求失败：', err);
        zxrShowMessage('✗ 请求失败：' + err.message, false);
      });
  }

  document.getElementById('zxr_refresh_btn').addEventListener('click', zxrLoadNews);
  zxrLoadNews();
})();
