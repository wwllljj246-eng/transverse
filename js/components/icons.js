/* ============================================================
   SVG 图标库 — 线性风格，stroke 继承 currentColor
   ============================================================ */

const wrap = (d, extra = '') =>
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

export const ICONS = {
  home: wrap('<path d="M3 9.5 12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20Z"/><path d="M9.5 21.5v-7h5v7"/>'),
  globe: wrap('<circle cx="12" cy="12" r="9.2"/><path d="M2.8 12h18.4"/><path d="M12 2.8a13.8 13.8 0 0 1 3.6 9.2 13.8 13.8 0 0 1-3.6 9.2 13.8 13.8 0 0 1-3.6-9.2A13.8 13.8 0 0 1 12 2.8Z"/>'),
  mic: wrap('<rect x="9" y="2.5" width="6" height="11.5" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v3.5"/>'),
  history: wrap('<circle cx="12" cy="12" r="9.2"/><path d="M12 7v5l3.2 2"/>'),
  user: wrap('<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>'),
  bell: wrap('<path d="M18 8.5a6 6 0 0 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5"/><path d="M13.7 20.5a2 2 0 0 1-3.4 0"/>'),
  swap: wrap('<path d="M8 3.5 4.5 7 8 10.5"/><path d="M4.5 7H20"/><path d="M16 13.5 19.5 17 16 20.5"/><path d="M19.5 17H4"/>'),
  chevronLeft: wrap('<path d="M14.5 5.5 8 12l6.5 6.5"/>'),
  chevronRight: wrap('<path d="M9.5 5.5 16 12l-6.5 6.5"/>'),
  translate: wrap('<path d="m5 8 6 6"/><path d="m4 14 6-6 2.5-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>'),
  camera: wrap('<path d="M21.5 19a1.8 1.8 0 0 1-1.8 1.8H4.3A1.8 1.8 0 0 1 2.5 19V9a1.8 1.8 0 0 1 1.8-1.8h3l2-3h5.4l2 3h3A1.8 1.8 0 0 1 21.5 9Z"/><circle cx="12" cy="13.5" r="3.8"/>'),
  fileText: wrap('<path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8Z"/><path d="M14 2.5V8h5.5"/><path d="M9 13h6"/><path d="M9 17h6"/>'),
  chat: wrap('<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8Z"/>'),
  subtitle: wrap('<rect x="2.5" y="4.5" width="19" height="15" rx="3"/><path d="M7 15h4"/><path d="M14 15h3"/><path d="M7 10.5h.01"/><path d="M11 10.5h6"/>'),
  sparkles: wrap('<path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9L4.5 10.8 10.2 9Z"/><path d="M19 3.5v3"/><path d="M20.5 5h-3"/>'),
  volume: wrap('<path d="M11 5 6.5 9H3v6h3.5L11 19Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18 6a8.5 8.5 0 0 1 0 12"/>'),
  copy: wrap('<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M16 8.5V6.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
  star: wrap('<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9z"/>'),
  starFill: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9z"/></svg>`,
  share: wrap('<circle cx="6" cy="12" r="2.6"/><circle cx="17" cy="5.5" r="2.6"/><circle cx="17" cy="18.5" r="2.6"/><path d="M8.3 10.6 14.7 6.9M8.3 13.4l6.4 3.7"/>'),
  close: wrap('<path d="M6 6l12 12M18 6 6 18"/>'),
  clipboard: wrap('<rect x="5" y="4.5" width="14" height="17" rx="2.5"/><rect x="8.7" y="2.5" width="6.6" height="4.2" rx="1.4"/><path d="M9 12h6M9 16h4"/>'),
  search: wrap('<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.2-4.2"/>'),
  check: wrap('<path d="m4.5 12.5 5 5 10-11"/>'),
  trash: wrap('<path d="M4 6.5h16"/><path d="M9 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h3.4A1.3 1.3 0 0 1 15 4.8v1.7"/><path d="M6.5 6.5 7.3 20a1.5 1.5 0 0 0 1.5 1.4h6.4A1.5 1.5 0 0 0 16.7 20l.8-13.5"/>'),
  flashOff: wrap('<path d="M13 2.5 5 13h6l-1 8.5L18 11h-6l1-8.5z" opacity="0.4"/><path d="M9 4 3 13h6l-1 8.5" opacity="0.3"/>'),
  flashOn: wrap('<path d="M13 2.5 5 13h6l-1 8.5L18 11h-6l1-8.5z" fill="currentColor" stroke="none"/>'),
  image: wrap('<rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m3 17 5-5 4 4 3-3 6 6"/>'),
  play: wrap('<path d="M6 4.5 19 12 6 19.5Z" fill="currentColor" stroke="none"/>'),
  pause: wrap('<rect x="6" y="4.5" width="4.5" height="15" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.5" y="4.5" width="4.5" height="15" rx="1.2" fill="currentColor" stroke="none"/>'),
  stop: wrap('<rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" stroke="none"/>'),
  save: wrap('<path d="M5 4.5h11l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 19V6A1.5 1.5 0 0 1 5.5 4.5Z"/><path d="M8 4.5v4h6v-4"/><path d="M8 14h8v6.5H8z"/>'),
  maximize: wrap('<path d="M3 9V5a2 2 0 0 1 2-2h4"/><path d="M21 9V5a2 2 0 0 0-2-2h-4"/><path d="M3 15v4a2 2 0 0 0 2 2h4"/><path d="M21 15v4a2 2 0 0 1-2 2h-4"/>'),
  list: wrap('<path d="M8 6.5h12M8 12h12M8 17.5h12"/><circle cx="4" cy="6.5" r="1.3"/><circle cx="4" cy="12" r="1.3"/><circle cx="4" cy="17.5" r="1.3"/>'),
  checkSquare: wrap('<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="m8 12 3 3 5-6"/>'),
  flag: wrap('<path d="M5 3.5v17"/><path d="M5 4h11l-2 4 2 4H5"/>'),
  zap: wrap('<path d="M13 2 5 11h5l-1 9 8-9h-5l1-9z" fill="currentColor" stroke="none"/>'),
  // ---------- 第五阶段：我的 / 设置 ----------
  sun: wrap('<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/>'),
  moon: wrap('<path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5 8.6 8.6 0 1 0 20.5 14.2Z"/>'),
  autoTheme: wrap('<circle cx="12" cy="12" r="9.2"/><path d="M12 2.8v18.4"/><path d="M12 2.8a9.2 9.2 0 0 1 0 18.4Z" fill="currentColor" stroke="none"/>'),
  download: wrap('<path d="M12 3.5v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4.5 19.5h15"/>'),
  typeAa: wrap('<path d="M2.5 18 7 6l4.5 12"/><path d="M4 14.5h6"/><path d="M13.5 18h5.5a2.6 2.6 0 0 0 0-5.2h-3.4a2.6 2.6 0 0 1 0-5.2H21"/>'),
  info: wrap('<circle cx="12" cy="12" r="9.2"/><path d="M12 11v5.5"/><path d="M12 7.6h.01"/>'),
  plus: wrap('<path d="M12 5v14M5 12h14"/>'),
  clock: wrap('<circle cx="12" cy="12" r="9.2"/><path d="M12 7.2V12l3.4 2"/>'),
  shield: wrap('<path d="M12 2.8 4.5 6v6c0 4.4 3.1 7.9 7.5 9.2 4.4-1.3 7.5-4.8 7.5-9.2V6Z"/><path d="m9 12 2.2 2.2L15.4 10"/>'),
  message: wrap('<path d="M21 12a8.5 8.5 0 0 1-12.3 7.6L3.5 21l1.4-5.2A8.5 8.5 0 1 1 21 12Z"/>'),
};

/** 生成图标 HTML（尺寸可覆盖） */
export function icon(name, size = 24) {
  const svg = ICONS[name] || ICONS.sparkles;
  return svg.replace(/width="24" height="24"/, `width="${size}" height="${size}"`);
}
