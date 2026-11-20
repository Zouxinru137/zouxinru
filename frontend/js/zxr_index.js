/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-20 | 大模型：GLM-5.3-Flash
  说明：首页 canvas 粒子连线背景动画
*/
(function zxrInitBackground() {
  var canvas = document.getElementById('zxr_canvas_bg');
  var ctx = canvas.getContext('2d');

  var zxrParticles = [];
  var zxrMouse = { x: null, y: null };

  function zxrResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function zxrCreateParticles() {
    var count = Math.min(120, Math.floor((canvas.width * canvas.height) / 12000));
    zxrParticles = [];
    for (var i = 0; i < count; i++) {
      zxrParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: Math.random() * 1.8 + 0.8
      });
    }
  }

  function zxrStep() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < zxrParticles.length; i++) {
      var p = zxrParticles[i];
      p.x += p.vx;
      p.y += p.vy;

      // 边界反弹
      if (p.x < 0 || p.x > canvas.width) p.vx = -p.vx;
      if (p.y < 0 || p.y > canvas.height) p.vy = -p.vy;

      // 鼠标轻微吸引
      if (zxrMouse.x !== null) {
        var dx = zxrMouse.x - p.x;
        var dy = zxrMouse.y - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 160 && dist > 0.001) {
          p.x += dx / dist * 0.25;
          p.y += dy / dist * 0.25;
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(159, 192, 255, 0.75)';
      ctx.fill();

      // 粒子连线
      for (var j = i + 1; j < zxrParticles.length; j++) {
        var q = zxrParticles[j];
        var ddx = p.x - q.x;
        var ddy = p.y - q.y;
        var d = ddx * ddx + ddy * ddy;
        if (d < 130 * 130) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = 'rgba(159, 192, 255,' + (0.16 * (1 - d / 16900)).toFixed(3) + ')';
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(zxrStep);
  }

  window.addEventListener('resize', function () {
    zxrResize();
    zxrCreateParticles();
  });

  window.addEventListener('mousemove', function (e) {
    zxrMouse.x = e.clientX;
    zxrMouse.y = e.clientY;
  });

  window.addEventListener('mouseout', function () {
    zxrMouse.x = null;
    zxrMouse.y = null;
  });

  zxrResize();
  zxrCreateParticles();
  zxrStep();
})();
