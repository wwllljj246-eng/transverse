/* ============================================================
   拍照翻译 Mock 数据 — 模拟相机识别结果
   每条 item 包含：原文 / 译文 / 在画面中的相对位置（百分比）
   位置以相机预览容器为参照，left/top 为左上角，单位 %
   ============================================================ */

/**
 * 默认拍照识别场景：日文菜单
 * pos 为 AR 卡片左上角在画面中的相对位置（百分比）
 */
export const CAMERA_SCENES = [
  {
    id: 'menu-jp',
    title: '日式餐厅菜单',
    items: [
      { src: 'MENU',    dst: '菜单',     pos: { left: 12, top: 14,  width: 38 } },
      { src: 'RAMEN',   dst: '拉面',     pos: { left: 14, top: 30,  width: 42 } },
      { src: 'SUSHI',   dst: '寿司',     pos: { left: 16, top: 46,  width: 38 } },
      { src: 'TEMPURA', dst: '天妇罗',   pos: { left: 14, top: 62,  width: 52 } },
    ],
  },
];

/** 根据场景 id 获取识别数据；不传 id 返回首个场景 */
export function getCameraScene(id) {
  if (!id) return CAMERA_SCENES[0];
  return CAMERA_SCENES.find((s) => s.id === id) || CAMERA_SCENES[0];
}
