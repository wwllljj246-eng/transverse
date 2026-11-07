/* ============================================================
   语言选择页
   - 搜索（名称 / 本地名 / 语言代码）
   - 最近使用 / 我的收藏（星标） / 常用 / 亚洲 / 欧洲
   - 选择后写回 store 并自动返回上一页
   @param {'source'|'target'} side
   ============================================================ */

import { store } from '../store.js';
import { icon } from '../components/icons.js';
import { flagSvg } from '../components/flags.js';
import { ALL_LANGUAGES, LANGUAGE_GROUPS, LANGUAGES } from '../data/languages.js';
import { escapeHtml } from '../utils/dom.js';

export default function LangSelectPage(side = 'source') {
  let keyword = '';

  const page = document.createElement('div');
  page.className = 'page lang-page';
  page.innerHTML = `
    <div class="nav-bar">
      <button class="nav-back" aria-label="返回">${icon('chevronLeft', 20)}</button>
      <span class="nav-title">语言选择</span>
      <span class="nav-spacer"></span>
    </div>

    <div class="page-pad">
      <div class="search-bar">
        <span class="search-ico">${icon('search', 18)}</span>
        <input class="search-input" type="text" placeholder="搜索语言，如 English / 日语" autocomplete="off" />
        <button class="search-clear" aria-label="清空搜索">${icon('close', 15)}</button>
      </div>
      <p class="select-hint">正在为${side === 'source' ? '源语言' : '目标语言'}选择</p>
    </div>

    <div class="lang-list"></div>
  `;

  const input = page.querySelector('.search-input');
  const clearBtn = page.querySelector('.search-clear');
  const list = page.querySelector('.lang-list');

  /* ---------- 返回 ---------- */
  page.querySelector('.nav-back').addEventListener('click', goBack);

  function goBack() {
    if (history.length > 1) history.back();
    else location.hash = '#/';
  }

  /* ---------- 搜索 ---------- */
  input.addEventListener('input', () => {
    keyword = input.value.trim().toLowerCase();
    clearBtn.style.display = keyword ? 'grid' : 'none';
    render();
  });
  clearBtn.addEventListener('click', () => {
    keyword = '';
    input.value = '';
    clearBtn.style.display = 'none';
    input.focus();
    render();
  });

  /* ---------- 列表渲染 ---------- */
  function render() {
    const snap = store.get();
    const currentCode = snap[side].code;

    // 搜索态：平铺结果
    if (keyword) {
      const hits = ALL_LANGUAGES.filter(
        (l) =>
          l.name.toLowerCase().includes(keyword) ||
          l.native.toLowerCase().includes(keyword) ||
          l.code.toLowerCase().includes(keyword)
      );
      list.innerHTML = hits.length
        ? sectionHTML('搜索结果', hits, snap, currentCode)
        : `<div class="lang-empty">未找到「${escapeHtml(input.value.trim())}」相关语言</div>`;
      bindRows(snap);
      return;
    }

    // 默认态：最近使用 → 我的收藏 → 常用/亚洲/欧洲
    const sections = [];

    if (snap.recent.length) {
      sections.push({ title: '🕘 最近使用', langs: snap.recent });
    }
    const favLangs = [...snap.langFavs].map((c) => LANGUAGES[c]).filter(Boolean);
    if (favLangs.length) {
      sections.push({ title: '⭐ 我的收藏', langs: dedupe(favLangs) });
    }
    LANGUAGE_GROUPS.forEach((g) => {
      sections.push({ title: g.title, langs: g.codes.map((c) => LANGUAGES[c]) });
    });

    list.innerHTML = sections
      .map((g) => sectionHTML(g.title, dedupe(g.langs), snap, currentCode))
      .join('');
    bindRows(snap);
  }

  function sectionHTML(title, langs, snap, currentCode) {
    return `
      <section class="lang-group">
        <h3 class="lang-group-title">${title}</h3>
        <div class="lang-group-body">
          ${langs
            .map(
              (l) => `
            <div class="lang-row" role="button" tabindex="0" data-code="${l.code}">
              ${flagSvg(l.flag)}
              <span class="lang-row-text">
                <span class="lang-row-name">${l.native}</span>
                <span class="lang-row-sub">${l.name}${l.native === l.name ? '' : ''}</span>
              </span>
              <button class="star-btn ${snap.langFavs.has(l.code) ? 'is-active' : ''}"
                      data-fav="${l.code}" aria-label="收藏语言">
                ${icon(snap.langFavs.has(l.code) ? 'starFill' : 'star', 19)}
              </button>
              ${l.code === currentCode ? `<span class="check-badge">${icon('check', 15)}</span>` : ''}
            </div>`
            )
            .join('')}
        </div>
      </section>`;
  }

  function bindRows(snap) {
    // 选择语言 → 写回 store → 返回
    list.querySelectorAll('.lang-row').forEach((row) => {
      const pick = () => {
        store.setLang(side, row.dataset.code);
        goBack();
      };
      row.addEventListener('click', (e) => {
        if (e.target.closest('.star-btn')) return;
        pick();
      });
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.target.closest('.star-btn')) pick();
      });
    });

    // 收藏 / 取消收藏（不离开页面）
    list.querySelectorAll('.star-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        store.toggleLangFav(btn.dataset.fav);
      });
    });
  }

  /* 语言收藏变化时即时刷新；语言选择变化（自己选择后即返回，影响可忽略） */
  const unsubscribe = store.subscribe((s, action) => {
    if (action === 'fav') render();
  });
  page._onUnload = unsubscribe;

  render();
  setTimeout(() => input.focus(), 250);

  return page;
}

function dedupe(langs) {
  const seen = new Set();
  return langs.filter((l) => {
    if (!l || seen.has(l.code)) return false;
    seen.add(l.code);
    return true;
  });
}
