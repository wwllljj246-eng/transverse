/* ============================================================
   通用 UI 片段 — 记录页 / 我的 / 设置子页共用
   统一间距、圆角、字体层级与按钮样式的唯一来源，避免各页面重复拼 HTML
   ============================================================ */

import { icon } from './icons.js';
import { escapeHtml } from '../utils/dom.js';

/** 顶部返回导航条（data-back 由 bindBack 统一接管） */
export function navBar(title, backTo = '#/') {
  return `
    <div class="nav-bar">
      <button class="nav-back" data-back="${backTo}" aria-label="返回">${icon('chevronLeft', 20)}</button>
      <span class="nav-title">${escapeHtml(title)}</span>
      <span class="nav-spacer"></span>
    </div>`;
}

/** 页面大标题 */
export function pageHead(title, sub = '') {
  return `
    <div class="page-head page-pad">
      <h2 class="page-title">${escapeHtml(title)}</h2>
      ${sub ? `<p class="page-sub">${escapeHtml(sub)}</p>` : ''}
    </div>`;
}

/**
 * 分段 Tab（记录页三个 Tab / 设置页选项组共用）
 * @param {{id:string,label:string,icon?:string}[]} items
 * @param {string} activeId
 * @param {string} attr data-* 属性名
 */
export function segTabs(items, activeId, attr = 'tab') {
  return `
    <div class="seg-tabs" role="tablist">
      ${items.map((it) => `
        <button class="seg-tab ${it.id === activeId ? 'is-active' : ''}"
                data-${attr}="${it.id}" role="tab"
                aria-selected="${it.id === activeId}">
          ${it.icon ? icon(it.icon, 15) : ''}<span>${escapeHtml(it.label)}</span>
        </button>`).join('')}
    </div>`;
}

/** 设置分组卡片 */
export function settingGroup(title, inner) {
  return `
    <section class="setting-group">
      ${title ? `<h3 class="group-title">${escapeHtml(title)}</h3>` : ''}
      <div class="setting-group-body">${inner}</div>
    </section>`;
}

/**
 * 设置行
 * @param {{id?:string, icon?:string, label:string, desc?:string, value?:string,
 *          control?:string, chevron?:boolean, danger?:boolean, tag?:string}} opt
 */
export function settingRow(opt) {
  const {
    id = '', icon: ico = '', label, desc = '',
    value = '', control = '', chevron = false, danger = false, tag = '',
  } = opt;

  const body = `
    <span class="setting-main">
      ${ico ? `<span class="setting-ico">${icon(ico, 18)}</span>` : ''}
      <span class="setting-text">
        <span class="setting-label">${escapeHtml(label)}</span>
        ${desc ? `<span class="setting-desc">${escapeHtml(desc)}</span>` : ''}
      </span>
    </span>
    <span class="setting-tail">
      ${tag ? `<span class="setting-tag">${escapeHtml(tag)}</span>` : ''}
      ${value ? `<span class="setting-value">${escapeHtml(value)}</span>` : ''}
      ${control}
      ${chevron ? `<span class="setting-arrow">${icon('chevronRight', 16)}</span>` : ''}
    </span>`;

  const cls = `setting-row ${danger ? 'danger' : ''} ${id || chevron ? 'row-btn' : ''}`.trim();
  const attr = id ? ` data-act="${id}"` : ' type="button"';
  const el = id || chevron || danger ? 'button' : 'div';
  return `<${el} class="${cls}"${attr}>${body}</${el}>`;
}

/** iOS 风格开关（带无障碍语义） */
export function switchEl({ id, checked, label }) {
  return `
    <button class="switch ${checked ? 'is-on' : ''}" data-switch="${id}"
            role="switch" aria-checked="${checked}" aria-label="${escapeHtml(label)}">
      <span class="switch-knob"></span>
    </button>`;
}

/** 空状态 */
export function emptyState({ icon: ico = 'history', title, sub = '' }) {
  return `
    <div class="empty-state">
      ${icon(ico, 34)}
      <p class="empty-title">${escapeHtml(title)}</p>
      ${sub ? `<p class="empty-sub">${escapeHtml(sub)}</p>` : ''}
    </div>`;
}

/** 进度条（离线语言包下载） */
export function progressBar(percent) {
  return `
    <div class="progress" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
      <div class="progress-fill" style="width:${percent}%"></div>
    </div>`;
}
