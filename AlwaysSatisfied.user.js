// ==UserScript==
// @name         树维教务系统量化评价 - 自动“很满意”助手
// @namespace    https://github.com/c1rcle-xy/AlwaysSatisfied/
// @version      1.0
// @description  在评教页面添加控制面板，一键全选"很满意"，可选自动提交
// @author       c1rcle
// @match        *://*/eams/homeExt.action*
// @match        *://*/eams/quality/stdEvaluate!answer.action*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ============================================================
    // 公共：创建浮动控制面板
    // ============================================================
    function createPanel(opts) {
        var panel = document.createElement('div');
        panel.id = 'auto-eval-panel';
        panel.innerHTML =
            '<div style="' +
            'position:fixed;top:10px;right:10px;z-index:2147483647;' +
            'background:#fff;border:2px solid #1890ff;border-radius:8px;' +
            'box-shadow:0 4px 16px rgba(0,0,0,0.2);' +
            'font-family:"Microsoft YaHei",sans-serif;' +
            'min-width:230px;user-select:none;' +
            '">' +
            // 标题栏
            '  <div style="' +
            'background:#1890ff;color:#fff;' +
            'padding:8px 14px;font-size:14px;font-weight:bold;' +
            'border-radius:6px 6px 0 0;' +
            'display:flex;justify-content:space-between;align-items:center;' +
            '">' +
            '    <span>' + (opts.title || '🎓 评教助手') + '</span>' +
            '    <span id="ae-close" style="cursor:pointer;font-size:20px;line-height:1;">&times;</span>' +
            '  </div>' +
            // 内容区
            '  <div style="padding:14px;">' +
            opts.body +
            '  </div>' +
            '</div>';
        document.body.appendChild(panel);

        document.getElementById('ae-close').onclick = function () {
            panel.style.display = 'none';
        };

        return panel;
    }

    // ============================================================
    // 首页：显示提示面板
    // ============================================================
    if (location.href.indexOf('homeExt.action') !== -1) {
        function initHome() {
            createPanel({
                title: '🎓 评教助手',
                body:
                    '<p style="color:#666;font-size:13px;margin:0 0 10px 0;">' +
                    '请在浏览器中打开评教页面后，<br>使用浮动面板进行操作。' +
                    '</p>' +
                    '<p style="color:#999;font-size:12px;margin:0;">' +
                    '进入评教页面后会自动显示控制面板。' +
                    '</p>'
            });
        }

        if (document.readyState === 'complete') initHome();
        else window.addEventListener('load', initHome);
    }

    // ============================================================
    // 评教页面：核心功能
    // ============================================================
    if (location.href.indexOf('stdEvaluate!answer.action') !== -1) {

        function setStatus(msg, color) {
            var el = document.getElementById('ae-status');
            if (el) {
                el.textContent = msg;
                el.style.color = color || '#666';
            }
            console.log('[评教助手] ' + msg);
        }

        // 等待 Backbone 渲染完成
        function waitForRender(callback) {
            var start = Date.now();
            var timer = setInterval(function () {
                if (document.querySelectorAll('.option-radio').length > 0) {
                    clearInterval(timer);
                    setTimeout(callback, 300);
                } else if (Date.now() - start > 10000) {
                    clearInterval(timer);
                    setStatus('页面加载超时，请刷新', 'red');
                }
            }, 200);
        }

        // 全选"很满意"
        function fillAll() {
            var radios = document.querySelectorAll('.option-radio[value="0"]');
            if (radios.length === 0) {
                setStatus('未找到选项，请刷新页面', 'red');
                return false;
            }
            radios.forEach(function (r) {
                r.checked = true;
                r.dispatchEvent(new Event('change', { bubbles: true }));
            });
            setStatus('✅ 已全选 ' + radios.length + ' 个"很满意"', '#52c41a');
            return true;
        }

        // 提交
        function doSubmit() {
            var origConfirm = window.confirm;
            window.confirm = function () { return true; };

            var subBtn = document.getElementById('sub');
            if (subBtn) subBtn.disabled = false;

            setStatus('正在提交...', '#1890ff');

            // 方法1：通过 jQuery 事件触发（Backbone events hash 用 jQuery delegate）
            if (typeof jQuery !== 'undefined') {
                var $sub = jQuery('#sub');
                if ($sub.length) {
                    $sub.trigger('click');
                    setTimeout(function () { window.confirm = origConfirm; }, 1000);
                    setStatus('✅ 提交已触发！', '#52c41a');
                    return;
                }
            }

            // 方法2：原生 click
            if (subBtn) {
                subBtn.click();
                setTimeout(function () { window.confirm = origConfirm; }, 1000);
                setStatus('✅ 提交已触发！', '#52c41a');
                return;
            }

            setStatus('❌ 未找到提交按钮', 'red');
            window.confirm = origConfirm;
        }

        // 一键执行
        function runAll() {
            if (!fillAll()) return;
            var autoSubmit = document.getElementById('ae-autosubmit').checked;
            if (autoSubmit) {
                setTimeout(doSubmit, 600);
            } else {
                setStatus('已全选，请手动点击页面底部的"提交"按钮', '#faad14');
            }
        }

        // 初始化面板
        function initEval() {
            waitForRender(function () {
                createPanel({
                    title: '🎓 评教助手',
                    body:
                        '<div style="margin-bottom:10px;">' +
                        '  <button id="ae-fill" style="' +
                        'width:100%;padding:9px;' +
                        'background:#52c41a;color:#fff;' +
                        'border:none;border-radius:4px;' +
                        'cursor:pointer;font-size:14px;font-weight:bold;' +
                        '">' +
                        '  一键全选"很满意"' +
                        '  </button>' +
                        '</div>' +
                        '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;margin-bottom:10px;">' +
                        '  <input type="checkbox" id="ae-autosubmit" checked style="width:16px;height:16px;">' +
                        '  <span>自动提交</span>' +
                        '</label>' +
                        '<div id="ae-status" style="font-size:12px;color:#888;text-align:center;"></div>'
                });

                document.getElementById('ae-fill').onclick = runAll;
            });
        }

        if (document.readyState === 'complete') initEval();
        else window.addEventListener('load', initEval);
    }
})();
