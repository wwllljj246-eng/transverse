/* ============================================================
   转写记录 Mock 数据 — 会议 / 课程 / 演讲
   每条记录包含：完整转写内容 + AI 总结 + 会议重点 + 待办事项
   第五阶段「记录系统」直接消费本数据
   分类元信息统一来自 data/type-meta.js（此处不再重复定义）
   ============================================================ */

import { TRANSCRIPT_CATEGORIES as CATEGORY_MAP } from './type-meta.js';

/**
 * @typedef {Object} TranscriptSeed
 * @property {string} category - meeting | class | speech
 * @property {string} source - 源语言 code
 * @property {string} title - 标题
 * @property {string} text - 完整转写内容
 * @property {string} summary - AI 总结
 * @property {{no:number,text:string}[]} highlights - 会议重点
 * @property {{text:string,done:boolean}[]} todos - 待办事项
 */
export const TRANSCRIPT_SEEDS = [
  {
    category: 'meeting',
    source: 'zh-CN',
    title: '产品方向讨论会',
    text: '今天我们主要讨论产品设计方向。\n首先，我们需要确定目标用户群体，目前数据显示主要用户集中在 25-35 岁。\n其次，针对产品首页，建议大家畅所欲言，交流想法。\n我们需要在下周完成首页改版方案，并进行用户测试。\n最后，关于上线节奏，建议分阶段灰度发布，先小范围验证再全量推开。',
    summary: '本次会议围绕产品方向展开，明确了目标用户画像（25-35 岁），确定下周完成首页改版并启动用户测试，上线采用灰度发布策略。',
    highlights: [
      { no: 1, text: '确定目标用户为 25-35 岁群体' },
      { no: 2, text: '下周完成首页改版方案' },
      { no: 3, text: '采用分阶段灰度发布上线' },
    ],
    todos: [
      { text: '完成首页 UI 修改', done: false },
      { text: '组织用户测试小组', done: false },
      { text: '输出灰度发布方案文档', done: true },
    ],
  },
  {
    category: 'class',
    source: 'zh-CN',
    title: '机器学习导论·第三讲',
    text: '本节课讲解监督学习的基本概念。\n监督学习通过标注数据训练模型，目标是学习输入到输出的映射函数。\n常见任务包括分类与回归。\n分类问题输出离散标签，例如垃圾邮件识别；回归问题输出连续值，例如房价预测。\n评价指标方面，分类常用准确率、精确率、召回率，回归常用 MSE、MAE。\n下节课将进入无监督学习部分。',
    summary: '课程介绍监督学习核心概念，区分分类与回归两类任务，并讲解常用评价指标（准确率/精确率/召回率/MSE/MAE），下节课转向无监督学习。',
    highlights: [
      { no: 1, text: '监督学习依赖标注数据' },
      { no: 2, text: '分类输出离散标签，回归输出连续值' },
      { no: 3, text: '分类指标：准确率/精确率/召回率' },
      { no: 4, text: '回归指标：MSE/MAE' },
    ],
    todos: [
      { text: '复习分类与回归例题', done: false },
      { text: '预习无监督学习章节', done: false },
    ],
  },
  {
    category: 'speech',
    source: 'zh-CN',
    title: '创业分享：从 0 到 1',
    text: '很高兴今天能和大家分享我的创业经历。\n创业的第一步是发现问题，而不是急着写代码。\n我们最初的点子来自一次旅行中的不便，发现语言障碍让深度交流变得很困难。\n于是我们开始做一个翻译工具，先做最小可用版本，找 100 个真实用户试用。\n用户反馈让我们意识到，技术不是关键，场景才是。\n于是我调整了方向，聚焦旅行场景，最终做出了今天大家看到的产品。\n给创业者的建议：保持耐心，倾听用户，不要害怕调整方向。',
    summary: '演讲者分享从旅行痛点出发的创业历程，强调"先发现问题再写代码""最小可用版本验证""聚焦场景而非技术"三个关键原则，建议创业者保持耐心、倾听用户、勇于调整方向。',
    highlights: [
      { no: 1, text: '创业第一步是发现问题，不是写代码' },
      { no: 2, text: '用最小可用版本验证假设' },
      { no: 3, text: '聚焦场景比追求技术更重要' },
    ],
    todos: [
      { text: '梳理自己产品的核心场景', done: false },
    ],
  },
];

/** 转写分类元信息（数组形式，便于遍历；定义源在 type-meta.js） */
export const TRANSCRIPT_CATEGORIES = Object.entries(CATEGORY_MAP)
  .map(([id, meta]) => ({ id, ...meta }));
