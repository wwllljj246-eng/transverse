/* ============================================================
   首页 — 欢迎语 / 语言卡片 / 六大功能 / 场景推荐
   ============================================================ */

import { FEATURES, SCENES } from '../data/mock.js';
import { icon } from '../components/icons.js';
import { LangCard } from '../components/langcard.js';

function Header() {
  const el = document.createElement('header');
  el.className = 'home-header';
  el.innerHTML = `
    <div>
      <p class="home-greeting">你好 👋</p>
      <h1 class="home-title">今天想翻译什么？</h1>
    </div>
    <button class="icon-btn" id="notify-btn" aria-label="通知">
      ${icon('bell', 21)}
      <span class="badge-dot"></span>
    </button>
  `;
  el.querySelector('#notify-btn').addEventListener('click', () => {
    location.hash = '#/notifications';
  });
  return el;
}

function FeatureGrid() {
  const grid = document.createElement('section');
  grid.className = 'feature-grid';
  grid.setAttribute('aria-label', '核心功能');

  grid.innerHTML = FEATURES.map(
    (f) => `
    <button class="feature-card" data-path="#/feature/${f.id}">
      <span class="feature-icon">${icon(f.icon, 22)}</span>
      <span>
        <span class="feature-name">${f.title}</span>
        <p class="feature-desc">${f.desc}</p>
      </span>
    </button>`
  ).join('');

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.feature-card');
    if (card) location.hash = card.dataset.path;
  });
  return grid;
}

function SceneScroll() {
  const wrap = document.createElement('section');
  wrap.className = 'scene-scroll';
  wrap.setAttribute('aria-label', '场景推荐');

  wrap.innerHTML = SCENES.map(
    (s) => `
    <button class="scene-card" data-path="#/scene/${s.id}">
      <span class="scene-emoji">${s.emoji}</span>
      <span class="scene-name">${s.title}</span>
      <p class="scene-desc">${s.desc}</p>
    </button>`
  ).join('');

  wrap.addEventListener('click', (e) => {
    const card = e.target.closest('.scene-card');
    if (card) location.hash = card.dataset.path;
  });
  return wrap;
}

export default function HomePage() {
  const page = document.createElement('div');
  page.className = 'page';
  page.appendChild(Header());
  page.appendChild(LangCard());

  const featureHead = document.createElement('div');
  featureHead.className = 'section-head';
  featureHead.innerHTML = `<h2 class="section-title">核心功能</h2>`;
  page.appendChild(featureHead);
  page.appendChild(FeatureGrid());

  const sceneHead = document.createElement('div');
  sceneHead.className = 'section-head';
  sceneHead.innerHTML = `
    <h2 class="section-title">你现在需要什么？</h2>
    <span class="section-more">全部 ${icon('chevronRight', 14)}</span>
  `;
  page.appendChild(sceneHead);
  page.appendChild(SceneScroll());

  return page;
}
