/* ============================================================
   设置 · 离线语言包  #/settings/offline
   ├─ 概览：已下载数量 / 占用空间
   ├─ 已下载：可删除
   └─ 未下载：点击下载，使用 Mock 进度（1.2s 内 0→100%）
   真实接入时把 mockDownload() 换成模型文件下载即可
   ============================================================ */

import { offlinePacks } from '../../data/offline-packs.js';
import { icon } from '../../components/icons.js';
import { flagSvg } from '../../components/flags.js';
import { showToast } from '../../components/toast.js';
import { navBar, settingGroup, progressBar } from '../../components/ui.js';
import { showConfirm } from '../../components/confirm.js';
import { escapeHtml, bindBack } from '../../utils/dom.js';

export default function OfflinePacksPage() {
  /** 正在下载的 code → 进度百分比 */
  const downloading = new Map();
  const timers = new Set();

  const page = document.createElement('div');
  page.className = 'page settings-page';

  page.innerHTML = `
    ${navBar('离线语言包', '#/profile')}
    <div class="page-pad settings-body" id="pack-body"></div>
  `;

  const body = page.querySelector('#pack-body');

  const packRow = (p) => `
    <div class="pack-row" data-code="${p.code}">
      ${flagSvg(p.flag)}
      <span class="pack-info">
        <span class="pack-name">${escapeHtml(p.name)}</span>
        <span class="pack-sub">${escapeHtml(p.native)} · ${p.size}</span>
      </span>
      ${p.downloaded ? `
        <span class="pack-state">
          <span class="pack-done">${icon('check', 13)} 已下载</span>
          <button class="star-btn" data-remove="${p.code}" aria-label="删除语言包">${icon('trash', 17)}</button>
        </span>`
      : `<button class="pack-btn" data-download="${p.code}">${icon('download', 15)} 下载</button>`}
    </div>`;

  /** 下载中：显示进度条 */
  const progressRow = (p, percent) => `
    <div class="pack-row" data-code="${p.code}">
      ${flagSvg(p.flag)}
      <span class="pack-info">
        <span class="pack-name">${escapeHtml(p.name)}</span>
        <span class="pack-sub">正在下载 ${percent}% · ${p.size}</span>
        ${progressBar(percent)}
      </span>
      <span class="pack-percent">${percent}%</span>
    </div>`;

  function render() {
    const done = offlinePacks.downloaded();
    const rest = offlinePacks.available();

    body.innerHTML = `
      <div class="pack-summary">
        <div class="pack-summary-ico">${icon('download', 22)}</div>
        <div class="pack-summary-info">
          <div class="pack-summary-title">已下载 ${done.length} 个语言包</div>
          <div class="pack-summary-sub">占用 ${offlinePacks.totalSizeText()}，离线也能翻译</div>
        </div>
      </div>

      ${done.length ? settingGroup('已下载', `
        <div class="lang-group-body">${done.map(packRow).join('')}</div>`) : ''}

      ${rest.length ? settingGroup('可下载', `
        <div class="lang-group-body">
          ${rest.map((p) => (downloading.has(p.code) ? progressRow(p, downloading.get(p.code)) : packRow(p))).join('')}
        </div>`) : '<p class="group-hint">全部语言包均已下载</p>'}
    `;
  }

  /** Mock 下载：120ms 一跳，累计到 100% 后标记完成 */
  function mockDownload(code) {
    if (downloading.has(code)) return;
    let percent = 0;
    downloading.set(code, 0);
    render();

    const timer = setInterval(() => {
      percent = Math.min(100, percent + 10);
      downloading.set(code, percent);
      render();
      if (percent >= 100) {
        clearInterval(timer);
        timers.delete(timer);
        downloading.delete(code);
        offlinePacks.markDownloaded(code);
        render();
        showToast('语言包下载完成，可离线使用');
      }
    }, 120);
    timers.add(timer);
  }

  body.addEventListener('click', (e) => {
    const dl = e.target.closest('[data-download]');
    if (dl) {
      mockDownload(dl.dataset.download);
      return;
    }

    const rm = e.target.closest('[data-remove]');
    if (rm) {
      const code = rm.dataset.remove;
      const pack = offlinePacks.all().find((p) => p.code === code);
      showConfirm({
        title: '删除离线语言包？',
        message: `删除「${pack?.name || code}」后将无法在无网络时翻译该语言，可随时重新下载。`,
        okText: '确认删除',
        onConfirm: () => {
          offlinePacks.remove(code);
          render();
          showToast('已删除语言包');
        },
      });
    }
  });

  bindBack(page, '#/profile');

  // 离开页面时清掉未完成的定时器
  page._onUnload = () => {
    timers.forEach((t) => clearInterval(t));
    timers.clear();
  };

  render();
  return page;
}
