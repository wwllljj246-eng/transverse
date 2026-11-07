/* ============================================================
   迷你国旗 — Windows 浏览器不渲染旗帜 Emoji，改用内联 SVG
   ============================================================ */

const FLAGS = {
  zh: `<svg viewBox="0 0 40 28" class="lang-flag" aria-label="中国国旗">
    <rect width="40" height="28" rx="5" fill="#DE2910"/>
    <path fill="#FFDE00" d="M7 5.5 8.1 9h3.6l-2.9 2.1 1.1 3.5L7 12.5l-2.9 2.1 1.1-3.5L2.3 9h3.6Z"/>
    <circle cx="14" cy="4.5" r="1" fill="#FFDE00"/><circle cx="16" cy="7.5" r="1" fill="#FFDE00"/>
    <circle cx="16" cy="11.5" r="1" fill="#FFDE00"/><circle cx="14" cy="14" r="1" fill="#FFDE00"/>
  </svg>`,
  us: `<svg viewBox="0 0 40 28" class="lang-flag" aria-label="美国国旗">
    <rect width="40" height="28" rx="5" fill="#F5F7FA"/>
    <g fill="#B22234"><rect y="0" width="40" height="2.8"/><rect y="5.6" width="40" height="2.8"/><rect y="11.2" width="40" height="2.8"/><rect y="16.8" width="40" height="2.8"/><rect y="22.4" width="40" height="2.8"/></g>
    <rect width="18" height="14" rx="2" fill="#3C3B6E"/>
    <g fill="#fff"><circle cx="4" cy="4" r="1"/><circle cx="9" cy="4" r="1"/><circle cx="14" cy="4" r="1"/><circle cx="6.5" cy="7" r="1"/><circle cx="11.5" cy="7" r="1"/><circle cx="4" cy="10" r="1"/><circle cx="9" cy="10" r="1"/><circle cx="14" cy="10" r="1"/></g>
  </svg>`,
  jp: `<svg viewBox="0 0 40 28" class="lang-flag" aria-label="日本国旗">
    <rect width="40" height="28" rx="5" fill="#fff"/>
    <circle cx="20" cy="14" r="7.5" fill="#BC002D"/>
  </svg>`,
  kr: `<svg viewBox="0 0 40 28" class="lang-flag" aria-label="韩国国旗">
    <rect width="40" height="28" rx="5" fill="#fff"/>
    <path d="M20 7.5a6.5 6.5 0 0 1 0 13 6.5 6.5 0 0 1 0-13Z" fill="#CD2E3A"/>
    <path d="M13.5 14a6.5 6.5 0 0 0 13 0 3.25 3.25 0 0 0-6.5 0 3.25 3.25 0 0 1-6.5 0Z" fill="#0047A0"/>
    <g stroke="#111" stroke-width="1.4" stroke-linecap="round">
      <path d="m7.5 6 3.2 3.2M6.3 7.2 9.5 10.4M25 18l3.2 3.2M23.8 19.2 27 22.4M28.2 6 25 9.2M29.4 7.2 26.2 10.4M10.5 18l-3.2 3.2M9.3 19.2 6.1 22.4"/>
    </g>
  </svg>`,
  th: `<svg viewBox="0 0 40 28" class="lang-flag" aria-label="泰国国旗">
    <rect width="40" height="28" rx="5" fill="#fff"/>
    <rect y="0" width="40" height="4.7" fill="#A51931"/>
    <rect y="23.3" width="40" height="4.7" fill="#A51931"/>
    <rect y="9.3" width="40" height="9.4" fill="#2D2A4A"/>
  </svg>`,
  id: `<svg viewBox="0 0 40 28" class="lang-flag" aria-label="印尼国旗">
    <rect width="40" height="28" rx="5" fill="#fff"/>
    <rect width="40" height="14" fill="#FF0000"/>
  </svg>`,
  my: `<svg viewBox="0 0 40 28" class="lang-flag" aria-label="马来西亚国旗">
    <rect width="40" height="28" rx="5" fill="#CC0001"/>
    <g fill="#fff">
      <rect y="4" width="40" height="2"/><rect y="8" width="40" height="2"/>
      <rect y="12" width="40" height="2"/><rect y="16" width="40" height="2"/>
      <rect y="20" width="40" height="2"/><rect y="24" width="40" height="2"/>
    </g>
    <rect width="22" height="14" rx="2" fill="#010066"/>
    <circle cx="10" cy="7" r="4.2" fill="#FFCC00"/>
    <circle cx="12" cy="7" r="3.4" fill="#010066"/>
    <g fill="#FFCC00">
      <circle cx="16.5" cy="5" r="0.7"/><circle cx="18" cy="6.5" r="0.7"/><circle cx="18.4" cy="8.3" r="0.7"/>
      <circle cx="17.5" cy="10" r="0.7"/><circle cx="15.9" cy="11" r="0.7"/><circle cx="14.2" cy="11" r="0.7"/>
    </g>
  </svg>`,
  ph: `<svg viewBox="0 0 40 28" class="lang-flag" aria-label="菲律宾国旗">
    <rect width="40" height="14" fill="#FCFCFC"/>
    <rect y="14" width="40" height="14" fill="#CE1126"/>
    <path d="M0 0 20 14 0 28 Z" fill="#0038A8"/>
    <circle cx="7.5" cy="14" r="2.4" fill="#FCD116"/>
    <g fill="#FCD116">
      <path d="M4 7.2v2.2M2.9 8.3h2.2" stroke="#FCD116" stroke-width="1" stroke-linecap="round"/>
      <path d="M4 18.6v2.2M2.9 19.7h2.2" stroke="#FCD116" stroke-width="1" stroke-linecap="round"/>
      <path d="M12.3 13.1l1.9 1.1-1.9 1.1" stroke="#FCD116" stroke-width="1" stroke-linecap="round"/>
    </g>
  </svg>`,
  fr: `<svg viewBox="0 0 40 28" class="lang-flag" aria-label="法国国旗">
    <rect width="40" height="28" rx="5" fill="#fff"/>
    <rect width="13.3" height="28" fill="#0055A4"/>
    <rect x="26.7" width="13.3" height="28" fill="#EF4135"/>
  </svg>`,
  de: `<svg viewBox="0 0 40 28" class="lang-flag" aria-label="德国国旗">
    <rect width="40" height="28" rx="5" fill="#fff"/>
    <rect width="40" height="9.4" fill="#0A0A0A"/>
    <rect y="9.3" width="40" height="9.4" fill="#DD0000"/>
    <rect y="18.6" width="40" height="9.4" fill="#FFCE00"/>
  </svg>`,
  es: `<svg viewBox="0 0 40 28" class="lang-flag" aria-label="西班牙国旗">
    <rect width="40" height="28" rx="5" fill="#AA151B"/>
    <rect y="7" width="40" height="14" fill="#F1BF00"/>
  </svg>`,
  it: `<svg viewBox="0 0 40 28" class="lang-flag" aria-label="意大利国旗">
    <rect width="40" height="28" rx="5" fill="#fff"/>
    <rect width="13.3" height="28" fill="#009246"/>
    <rect x="26.7" width="13.3" height="28" fill="#CE2B37"/>
  </svg>`,
};

export function flagSvg(key) {
  return FLAGS[key] || FLAGS.zh;
}
