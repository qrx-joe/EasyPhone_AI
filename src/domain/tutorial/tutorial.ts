/**
 * 教程领域 —— 类型 + 匹配函数 + 首批教程库。
 *
 * 设计原则(来自 docs/05 §3.3 + §8 反「教程步骤到处复制」):
 * 1. **白名单教程优先** —— 教程步骤必须由人工维护,AI 不自由编造。
 * 2. **教程是数据,不是组件** —— 步骤里只有 title + instruction 文本,
 *    按钮(好了/没看到/点错了)状态放 UI 层(避免数据泥团 + 冗余)。
 * 3. **匹配靠 keyword 子串,不靠正则** —— MVP 阶段关键词已覆盖 80%+ 真实场景,
 *    上正则会增加维护成本且不提升匹配率(同 docs/08 §1.3 决策)。
 * 4. **首个匹配的教程生效** —— 教程库按特异性排序,更具体的(关键字更长)放前面。
 */

import type { RiskLevel } from '../risk/types.ts'

// ─────────────────────────────────────────────────────────────────────
// 类型
// ─────────────────────────────────────────────────────────────────────

/**
 * 单个教程步骤。
 *
 * - title:       5-10 字,告诉老人「这一步要做什么」。
 * - instruction: 1-2 句,具体到按钮/菜单名称(用「微信」→「我」→「设置」这种导航描述)。
 * - alternative: 替代表达(可选)。当老人点了「没看到」按钮时展示 —— 用另一种说法
 *               解释同一操作,照顾理解力不同的老人。
 *
 * 设计取舍:alternative **应该** 放在数据层,不放 UI state。
 * 理由(反 docs/05 §8「教程步骤到处复制」):
 *   1. alternative 是教学内容,跟 instruction 同源,跟 step 强绑定 —— 放数据里更内聚
 *   2. 放 UI state 会导致每个客户端组件各自维护「这个步骤的替代表达」副本,
 *      多端(老年端 / 家人端 / 未来调试面板)要分别写,变冗余
 *   3. 之前 v0 注释里说「这是数据泥团」是判断错了:数据泥团是「无关数据捆一起」,
 *      而 instruction+alternative 是「同一概念的两个面向」,聚合反而更清晰
 *   4. 按钮(好了/没看到/点错了)的**显隐**才是 UI state,跟 alternative 内容无关
 *
 * 不放 step 里的东西:按钮状态(显示/隐藏/加载中)、语音播报进度、用户操作历史。
 */
export interface TutorialStep {
  readonly id: string
  readonly title: string
  readonly instruction: string
  readonly alternative?: string
}

export interface Tutorial {
  readonly id: string
  /** 给 UI 渲染的标题,如「让微信声音回来」 */
  readonly title: string
  /**
   * 匹配关键词(小写)。
   *
   * 匹配算法:对输入做归一化(toLowerCase + trim)后,任一关键词 includes 命中即匹配。
   * 多关键词的设计:同义词老人都会说(「微信没声音」「微信没有声音」「微信声音没了」),
   * 一次写全比正则覆盖率高。
   */
  readonly matchKeywords: readonly string[]
  /**
   * 该教程能服务的最高风险等级。
   * 风险等级 >= 教程 maxLevel 时,即使匹配上也不展示教程(必须走 risk-alert)。
   * 大多数教程 maxLevel = 'low';少数(如「清理手机空间」)= 'medium'。
   */
  readonly maxLevel: RiskLevel
  readonly steps: readonly TutorialStep[]
}

// ─────────────────────────────────────────────────────────────────────
// 匹配函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 从一段用户输入找到最合适的教程。
 *
 * 返回 null 的语义:**不是 bug,是设计**。意味着这段输入不应该进分步指导
 * (可能是高风险、可能是未知问题)。调用方拿到 null 应该:
 *   - 若 question.risk.level >= high: 已经分流到 /risk-alert 了,这里走不到
 *   - 若 question.risk.level == low/medium: 走「没有现成教程,转人工/AI 兜底」路径(M3 实现)
 *
 * 教程特异性排序:keywords 数量越多越具体,排前面;同数量按数组顺序。
 */
export function findTutorial(text: string): Tutorial | null {
  const normalized = text.toLowerCase().trim()
  if (!normalized) return null

  // 按关键词数量倒序 —— 关键词多的更具体
  const sorted = [...TUTORIALS].sort(
    (a, b) => b.matchKeywords.length - a.matchKeywords.length,
  )

  for (const tut of sorted) {
    if (tut.matchKeywords.some((kw) => normalized.includes(kw))) {
      return tut
    }
  }
  return null
}

/**
 * 给定风险等级,过滤出可以展示的教程。
 * 高/极高风险不进分步指导(用 shouldStopGuidance 已经把这条路由死了,
 * 这里加防御性过滤,避免 UI 误调)。
 */
export function safeTutorialsFor(level: RiskLevel): readonly Tutorial[] {
  if (level === 'high' || level === 'critical') return []
  return TUTORIALS.filter((t) => t.maxLevel !== 'critical' && t.maxLevel !== 'high')
}

// ─────────────────────────────────────────────────────────────────────
// 教程库 —— 首批 2 个(M2 验收用)。新增按 docs/07 §11 三道闸。
// ─────────────────────────────────────────────────────────────────────

const TUTORIAL_WEIXIN_NO_SOUND: Tutorial = {
  id: 'wechat-no-sound',
  title: '让微信声音回来',
  matchKeywords: [
    '微信没有声音',
    '微信没声音',
    '微信没声',
    '微信没有声音了',
    '微信没声音了',
    // 英文说法:年轻人帮忙时可能用,或老人用过英文输入法的场景
    'wechat',
    'weixin',
  ],
  maxLevel: 'low',
  steps: [
    {
      id: 'wechat-no-sound-1',
      title: '打开微信',
      instruction: '在桌面上找到绿色的微信图标,点一下。',
      alternative:
        '退回到手机最开始的页面(就是显示时间的那一页),然后找绿色方块图标,上面写着「微信」。',
    },
    {
      id: 'wechat-no-sound-2',
      title: '点右下角「我」',
      instruction: '微信最下面有一排按钮,最右边那个写着「我」。',
      alternative: '看微信屏幕最下面一行,有「微信」「通讯录」「发现」「我」,点最右边的「我」。',
    },
    {
      id: 'wechat-no-sound-3',
      title: '点「设置」',
      instruction: '在「我」的页面里,往下滑,找到「设置」两个字,点一下。',
      alternative: '「我」的页面最上面是头像和名字,中间是各种功能,最下面能找到「设置」,点它。',
    },
    {
      id: 'wechat-no-sound-4',
      title: '点「聊天」',
      instruction: '在「设置」里,找到「聊天」两个字,点一下。',
      alternative: '「设置」页面前几项是「账号与安全」「通用」「聊天」「隐私」之类,点「聊天」。',
    },
    {
      id: 'wechat-no-sound-5',
      title: '打开「通知」和「声音」',
      instruction:
        '在「聊天」里,找到「新消息通知」「语音和视频通话提醒」两项,后面的开关都打开。',
      alternative:
        '「聊天」里有「新消息通知」「语音和视频通话提醒」,每一项右边有个开关,点一下变成绿色就是打开了。',
    },
  ],
}

const TUTORIAL_FONT_TOO_SMALL: Tutorial = {
  id: 'font-too-small',
  title: '把手机字变大',
  matchKeywords: [
    '手机字太小',
    '字太小',
    '字体太小',
    '字太小看不清',
    '看不清字',
  ],
  maxLevel: 'low',
  steps: [
    {
      id: 'font-too-small-1',
      title: '打开手机的「设置」',
      instruction: '在桌面上找齿轮形状的图标,叫「设置」,点一下。',
      alternative: '退回到手机首页,往四周找,有个齿轮形状的图标,就是「设置」。',
    },
    {
      id: 'font-too-small-2',
      title: '找「显示」',
      instruction:
        '在「设置」里找「显示」或「显示与亮度」,点进去。每个手机名字可能稍有不同。',
      alternative: '「设置」里有一项叫「显示」或者「壁纸与显示」,点进去。',
    },
    {
      id: 'font-too-small-3',
      title: '找「字体大小」',
      instruction:
        '在「显示」里往下找,找到「字体大小」或「文字大小」,点进去。',
      alternative:
        '在「显示」里往下找,会有「字体大小」或「显示大小」,点进去。',
    },
    {
      id: 'font-too-small-4',
      title: '把滑块拉到最大',
      instruction: '页面下方有一个小滑块,把它从左拉到最右边,字就会变大了。',
      alternative: '下面有个拉条,把它从左拉到最右,或者点右边的「A 大」「A 最大」按钮,字就变大了。',
    },
  ],
}

export const TUTORIALS: readonly Tutorial[] = Object.freeze([
  TUTORIAL_WEIXIN_NO_SOUND,
  TUTORIAL_FONT_TOO_SMALL,
])
