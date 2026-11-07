/* ============================================================
   面对面对话 Mock 剧本
   模拟双人跨语言实时交流：A 说 → 翻译 → B 答 → 翻译 → A 再问
   turn 顺序：A 原文 → A 译文 → B 原文 → B 译文
   ============================================================ */

/**
 * 默认对话剧本（中 ↔ 日）
 * langA / langB 为语言 code
 * turns 数组每 4 个为一轮：A 说、A 的译文、B 答、B 的译文
 */
export const DIALOGUE_SCRIPT = {
  langA: 'zh-CN',
  langB: 'ja-JP',
  turns: [
    // 第一轮
    { speaker: 'A', text: '你好，很高兴认识你。',      translated: 'はじめまして、よろしくお願いします。' },
    { speaker: 'B', text: 'はじめまして。',           translated: '你好。' },
    // 第二轮
    { speaker: 'A', text: '请问这里怎么走？',         translated: 'こちらへはどう行けばよろしいでしょうか？' },
    { speaker: 'B', text: 'まっすぐ行って、右に曲がります。', translated: '直走，然后右转。' },
    // 第三轮
    { speaker: 'A', text: '谢谢你的帮助。',            translated: '助けてくれてありがとうございます。' },
    { speaker: 'B', text: 'どういたしまして。',        translated: '不客气。' },
  ],
};

/**
 * 悬浮字幕 Mock 剧本
 * 模拟外部音频源逐句产出，原文 + 译文
 */
export const SUBTITLE_SCRIPT = [
  { src: 'こんにちは、皆さん。',          dst: '大家好。',           lang: 'ja-JP' },
  { src: '今日は製品の方向について話します。', dst: '今天我们讨论产品方向。', lang: 'ja-JP' },
  { src: 'まず、ターゲットユーザーを明確にします。', dst: '首先，我们确定目标用户。', lang: 'ja-JP' },
  { src: 'そして、ホームページを改善します。',     dst: '然后，我们改进首页。',     lang: 'ja-JP' },
  { src: '最後に、ユーザーテストを行います。',     dst: '最后，我们进行用户测试。', lang: 'ja-JP' },
];
