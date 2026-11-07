/* ============================================================
   历史记录 Mock 种子数据 — 首次启动时灌入 saves + favorites
   包含：文本翻译 / 拍照翻译 / 同声传译 / 转写（会议·课程·演讲）
   类型定义见 data/type-meta.js，此处统一使用 'transcribe'
   第五阶段演示用，真实使用后用户操作产生的记录会叠加其上
   ============================================================ */

import { TRANSCRIPT_SEEDS } from './transcripts-mock.js';

const now = Date.now();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** 与 saves.js genId 保持同构：s + 时间戳(36) + 随机后缀（种子数据也要有稳定 id） */
function seedId(i) {
  return 's' + (now - i).toString(36) + Math.random().toString(36).slice(2, 6);
}

/** 文本翻译种子（type: 'text'） */
const TEXT_SEEDS = [
  {
    id: seedId(1),
    type: 'text',
    title: '文本翻译',
    payload: {
      from: 'zh-CN',
      to: 'en-US',
      tone: 'natural',
      sourceText: '很高兴认识你，希望我们合作愉快。',
      text: 'Nice to meet you. I hope we have a great collaboration.',
    },
    ts: now - 30 * MIN,
  },
  {
    id: seedId(2),
    type: 'text',
    title: '文本翻译',
    payload: {
      from: 'en-US',
      to: 'zh-CN',
      tone: 'business',
      sourceText: 'Could you please send me the report by Friday?',
      text: '能否请您在周五前把报告发给我？',
    },
    ts: now - 2 * HOUR,
  },
  {
    id: seedId(3),
    type: 'text',
    title: '文本翻译',
    payload: {
      from: 'ja-JP',
      to: 'zh-CN',
      tone: 'casual',
      sourceText: 'はじめまして、よろしくお願いします。',
      text: '初次见面，请多关照。',
    },
    ts: now - 1 * DAY,
  },
];

/** 拍照翻译种子 */
const PHOTO_SEEDS = [
  {
    id: seedId(4),
    type: 'photo',
    title: '拍照翻译',
    payload: {
      source: 'ja-JP',
      target: 'zh-CN',
      items: [
        { src: '出口',     dst: '出口' },
        { src: '非常口',   dst: '紧急出口' },
        { src: '禁煙',     dst: '禁止吸烟' },
      ],
    },
    ts: now - 3 * HOUR,
  },
  {
    id: seedId(5),
    type: 'photo',
    title: '拍照翻译',
    payload: {
      source: 'en-US',
      target: 'zh-CN',
      items: [
        { src: 'Boarding Gate 23', dst: '登机口 23' },
        { src: 'Now Boarding',     dst: '正在登机' },
      ],
    },
    ts: now - 2 * DAY,
  },
];

/** 同声传译种子 */
const INTERPRETER_SEEDS = [
  {
    id: seedId(6),
    type: 'interpreter',
    title: '同声传译',
    payload: {
      source: 'ja-JP',
      target: 'zh-CN',
      sourceText: 'こんにちは、皆さん。今日は製品の方向について意見を交流したいと思います。',
      targetText: '大家好，今天我们主要讨论产品设计方向，希望大家畅所欲言。',
    },
    ts: now - 5 * HOUR,
  },
];

/** 转写种子（type: 'transcribe'，含完整内容 + AI 整理） */
const TRANSCRIPT_RECORD_SEEDS = TRANSCRIPT_SEEDS.map((s, i) => ({
  id: seedId(10 + i),
  type: 'transcribe',
  title: s.title,
  payload: {
    category: s.category,
    source: s.source,
    text: s.text,
    summary: s.summary,
    highlights: s.highlights,
    todos: s.todos,
  },
  ts: now - (TRANSCRIPT_SEEDS.indexOf(s) + 1) * 6 * HOUR,
}));

/** 收藏种子 */
const FAVORITE_SEEDS = [
  {
    id: 'f' + 1001,
    from: 'en-US',
    to: 'zh-CN',
    tone: 'natural',
    sourceText: 'serendipity',
    text: '机缘巧合',
    ts: now - 4 * HOUR,
  },
  {
    id: 'f' + 1002,
    from: 'zh-CN',
    to: 'en-US',
    tone: 'business',
    sourceText: '请将会议纪要发送给所有与会人员。',
    text: 'Please send the meeting minutes to all attendees.',
    ts: now - 1 * DAY,
  },
  {
    id: 'f' + 1003,
    from: 'ja-JP',
    to: 'zh-CN',
    tone: 'casual',
    sourceText: 'お疲れ様',
    text: '辛苦了',
    ts: now - 3 * DAY,
  },
];

/** 全部种子记录（saves 用） */
export const SAVES_SEEDS = [
  ...TEXT_SEEDS,
  ...PHOTO_SEEDS,
  ...INTERPRETER_SEEDS,
  ...TRANSCRIPT_RECORD_SEEDS,
];

/** favorites 种子 */
export const FAVORITES_SEEDS = FAVORITE_SEEDS;
