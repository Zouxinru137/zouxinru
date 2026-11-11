/**
 * 作者：邹欣茹
 * 建立时间：2026-11-04
 * 使用大模型：GLM-5.3-Flash
 * 功能名称：可复用 Tab 选项卡
 * 说明：一个页面可多次调用 zxr_initTabs 初始化多个选项卡组；
 *       每个选项卡按钮使用 data-zxr-tab="xxx" 属性，
 *       对应内容面板的 id 为 "zxr_panel_xxx"。
 */

// 功能：初始化一个选项卡组。为容器内所有 .zxr_tab 按钮绑定点击监听事件，
//       点击时先清除所有选项卡及面板的选中状态，再设置当前元素及其面板的选中状态。
function zxr_initTabs(zxrContainer) {
    // 查询当前容器内的全部选项卡按钮
    var zxrTabs = zxrContainer.querySelectorAll('.zxr_tab');

    zxrTabs.forEach(function (zxrTab) {
        // 监听事件：为每个选项卡绑定点击处理
        zxrTab.addEventListener('click', function () {
            // 第一步：先清除所有选项卡的选中状态
            zxrTabs.forEach(function (zxrT) {
                zxrT.classList.remove('zxr_active');
                zxrT.setAttribute('aria-selected', 'false');
            });

            // 同时隐藏所有内容面板
            zxrContainer.querySelectorAll('.zxr_panel').forEach(function (zxrPanel) {
                zxrPanel.classList.remove('zxr_active');
            });

            // 第二步：设置当前元素的选中状态
            zxrTab.classList.add('zxr_active');
            zxrTab.setAttribute('aria-selected', 'true');

            // 显示当前选项卡对应的内容面板
            var zxrKey = zxrTab.getAttribute('data-zxr-tab');
            var zxrTarget = document.getElementById('zxr_panel_' + zxrKey);
            if (zxrTarget) {
                zxrTarget.classList.add('zxr_active');
            }
        });
    });
}

// 功能：页面加载完成后，初始化本页的新闻选项卡组件
document.addEventListener('DOMContentLoaded', function () {
    var zxrNewsTabs = document.getElementById('zxr_news_tabs');
    if (zxrNewsTabs) {
        zxr_initTabs(zxrNewsTabs);
    }
});
