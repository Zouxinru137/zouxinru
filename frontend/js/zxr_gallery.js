/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-20 | 大模型：GLM-5.3-Flash
  说明：图文列表页逻辑（请求 /api/zxr_gallery）
*/
(function zxrInitGalleryPage() {
  var zxrList = document.getElementById('zxr_gallery_list');
  var zxrMsg = document.getElementById('zxr_gallery_message');

  function zxrShowMessage(text, zxrIsOk) {
    zxrMsg.textContent = text;
    zxrMsg.className = 'zxr_gallery_message ' + (zxrIsOk ? 'zxr_ok' : 'zxr_err');
  }

  function zxrFormatTime(zxrStr) {
    if (!zxrStr) return '';
    var d = new Date(zxrStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return zxrStr;
    function zxrPad(n) { return n < 10 ? '0' + n : '' + n; }
    return d.getFullYear() + '-' + zxrPad(d.getMonth() + 1) + '-' + zxrPad(d.getDate());
  }

  function zxrFormatPrice(zxrNum) {
    return Number(zxrNum).toFixed(2);
  }

  function zxrRenderGallery(zxrArr) {
    zxrList.innerHTML = '';
    if (!zxrArr || !zxrArr.length) {
      zxrShowMessage('暂无图文数据', false);
      return;
    }
    for (var i = 0; i < zxrArr.length; i++) {
      var item = zxrArr[i];

      var card = document.createElement('div');
      card.className = 'zxr_gallery_card';

      var img = document.createElement('img');
      img.className = 'zxr_gallery_img';
      img.src = item.zxr_image_url;
      img.alt = item.zxr_title;
      img.loading = 'lazy';

      var body = document.createElement('div');
      body.className = 'zxr_gallery_body';

      var title = document.createElement('div');
      title.className = 'zxr_gallery_item_title';
      title.textContent = item.zxr_title;

      var desc = document.createElement('div');
      desc.className = 'zxr_gallery_desc';
      desc.textContent = item.zxr_desc;

      var meta = document.createElement('div');
      meta.className = 'zxr_gallery_meta';

      var time = document.createElement('span');
      time.textContent = zxrFormatTime(item.zxr_published_at);

      var price = document.createElement('span');
      price.className = 'zxr_gallery_price';
      price.textContent = zxrFormatPrice(item.zxr_price);

      meta.appendChild(time);
      meta.appendChild(price);

      body.appendChild(title);
      body.appendChild(desc);
      body.appendChild(meta);

      card.appendChild(img);
      card.appendChild(body);
      zxrList.appendChild(card);
    }
    zxrShowMessage('共加载 ' + zxrArr.length + ' 条图文', true);
  }

  function zxrLoadGallery() {
    // 直接以 file:// 方式打开页面时，fetch 无法请求后端接口
    if (window.location.protocol === 'file:') {
      console.error('当前通过 file:// 打开页面，无法请求接口。请访问 http://localhost:8217/gallery.html');
      zxrShowMessage('✗ 请通过服务器访问页面：http://localhost:8217/gallery.html', false);
      return;
    }
    zxrShowMessage('加载中...', true);
    fetch('/api/zxr_gallery')
      .then(function (res) { return res.json(); })
      .then(function (result) {
        console.log('服务器返回数据：', result);
        if (result.code === 0) {
          zxrRenderGallery(result.data);
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

  document.getElementById('zxr_refresh_btn').addEventListener('click', zxrLoadGallery);
  zxrLoadGallery();
})();
