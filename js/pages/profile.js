/* ============================================================
   我的  #/profile
   ├─ 用户信息：头像 + 用户名（可编辑）+ 使用统计
   └─ 设置列表：我的语言 / 离线语言包 / 外观设置 / 字体大小 / 翻译设置 / 关于译境
                 数据：清空记录
   所有条目跳转到对应设置子页，子页统一返回本页
   ============================================================ */

import { settings, FONT_SIZES, THEMES } from '../data/settings.js';
import { offlinePacks } from '../data/offline-packs.js';
import { LANGUAGES } from '../data/languages.js';
import { APP_INFO } from '../data/app-info.js';
import { icon } from '../components/icons.js';
import { showToast } from '../components/toast.js';
import { settingGroup, settingRow } from '../components/ui.js';
import { showConfirm } from '../components/confirm.js';
import { openSheet } from '../components/sheet.js';
import { escapeHtml, bindBack } from '../utils/dom.js';

export default function ProfilePage() {
  const page = document.createElement('div');
  page.className = 'page profile-page';

  page.innerHTML = `
    <section class="user-card page-pad">
      <div class="user-avatar" aria-hidden="true">${escapeHtml(settings.userName.charAt(0).toUpperCase())}</div>
      <div class="user-info">
        <h2 class="user-name">${escapeHtml(settings.userName)}</h2>
        <p class="user-sub">${escapeHtml(APP_INFO.slogan)}</p>
      </div>
      <button class="profile-edit" data-act="edit-name" aria-label="修改用户名">
        ${icon('share', 17)}
      </button>
    </section>

    <div class="profile-stats page-pad" id="profile-stats"></div>

    <div class="page-pad settings-body" id="profile-body"></div>
  `;

  const body = page.querySelector('#profile-body');
  const statsEl = page.querySelector('#profile-stats');

  /** 统计条（清空记录后单独刷新，无需整页重建） */
  function renderStats() {
    statsEl.innerHTML = `
      <div class="stat-item">
        <span class="stat-num">${settings.historyCount()}</span>
        <span class="stat-label">翻译记录</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">${settings.favoriteCount()}</span>
        <span class="stat-label">收藏</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">${offlinePacks.downloaded().length}</span>
        <span class="stat-label">离线语言包</span>
      </div>`;
  }

  function render() {
    const themeName = THEMES.find((t) => t.id === settings.theme)?.name || '浅色模式';
    const fontName = FONT_SIZES.find((f) => f.id === settings.fontSize)?.name || '标准';
    const langName = LANGUAGES[settings.defaultLang]?.name || settings.defaultLang;

    body.innerHTML = `
      ${settingGroup('语言', `
        ${settingRow({ id: 'go-languages', icon: 'globe', label: '我的语言',
                       value: `${settings.recentLangs.length} 种常用`, chevron: true })}
        ${settingRow({ id: 'go-offline', icon: 'download', label: '离线语言包',
                       value: `已下载 ${offlinePacks.downloaded().length} 个`, chevron: true })}
      `)}

      ${settingGroup('显示', `
        ${settingRow({ id: 'go-appearance', icon: 'sun', label: '外观设置',
                       value: themeName, chevron: true })}
        ${settingRow({ id: 'go-font', icon: 'typeAa', label: '字体大小',
                       value: fontName, chevron: true })}
      `)}

      ${settingGroup('翻译', `
        ${settingRow({ id: 'go-translate', icon: 'translate', label: '翻译设置',
                       value: `默认 ${langName}`, chevron: true })}
      `)}

      ${settingGroup('关于', `
        ${settingRow({ id: 'go-about', icon: 'info', label: '关于译境',
                       value: `v${APP_INFO.version}`, chevron: true })}
      `)}

      ${settingGroup('数据', `
        ${settingRow({ id: 'clear-records', icon: 'trash', label: '清空记录',
                       desc: '删除本机全部翻译记录与收藏', danger: true })}
      `)}
    `;
  }

  /* ---------- 路由跳转 ---------- */
  const ROUTES = {
    'go-languages': '#/settings/languages',
    'go-offline': '#/settings/offline',
    'go-appearance': '#/settings/appearance',
    'go-font': '#/settings/font',
    'go-translate': '#/settings/translate',
    'go-about': '#/settings/about',
  };

  /* ---------- 修改用户名 ---------- */
  function openNameEditor() {
    const { body: sheetBody, close } = openSheet({
      title: '修改用户名',
      body: `
        <p class="sheet-meta">用户名仅保存在本机，用于「我的」页展示</p>
        <input class="sheet-input" type="text" maxlength="16"
               value="${escapeHtml(settings.userName)}" placeholder="输入用户名" />
        <button class="sheet-submit" data-act="save-name">保存</button>`,
    });

    const input = sheetBody.querySelector('.sheet-input');
    input?.focus();

    sheetBody.querySelector('[data-act="save-name"]').addEventListener('click', () => {
      const name = (input?.value || '').trim();
      if (!name) {
        showToast('用户名不能为空');
        return;
      }
      settings.setUserName(name);
      close();
      // 刷新头像首字母与用户名
      page.querySelector('.user-name').textContent = settings.userName;
      page.querySelector('.user-avatar').textContent = settings.userName.charAt(0).toUpperCase();
      showToast('用户名已更新');
    });
  }

  /* ---------- 清空记录 ---------- */
  function clearRecords() {
    const total = settings.totalRecords();
    if (!total) {
      showToast('当前没有可清空的记录');
      return;
    }
    showConfirm({
      title: '清空全部记录？',
      message: `将删除 ${settings.historyCount()} 条翻译记录与 ${settings.favoriteCount()} 条收藏，删除后无法恢复。`,
      okText: '确认清空',
      onConfirm: () => {
        settings.clearAll();
        renderStats();
        render();
        showToast('已清空全部记录');
      },
    });
  }

  body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    if (ROUTES[act]) {
      location.hash = ROUTES[act];
    } else if (act === 'clear-records') {
      clearRecords();
    }
  });

  page.querySelector('[data-act="edit-name"]')?.addEventListener('click', openNameEditor);

  bindBack(page, '#/');
  renderStats();
  render();
  return page;
}
