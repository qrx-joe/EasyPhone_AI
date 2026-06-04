/**
 * 基于关键词规则的风险分类。
 *
 * 设计原则(来自 docs/05-project-standards.md §3 + docs/08 决策):
 * - 安全核心,不依赖 AI;AI 是后续增强,不是替代品(规则兜底原则)。
 * - 纯函数,无副作用,无 I/O,无状态;方便测试和未来在 Server Component 里调用。
 * - 命中多个关键词时,**永远取最高风险等级**(不能反过来,这是安全保险丝)。
 */

import { RISK_KEYWORDS, type RiskKeyword } from './risk-keywords.ts'
import {
  RISK_RANK,
  type RiskClassification,
  type RiskLevel,
} from './types.ts'

/**
 * 全角字符 → 半角。覆盖 ASCII 可打印区(! ~)和全角空格。
 *
 * 老人在手机输入法下经常出全角:全角数字「６」、全角字母「Ａ」、全角标点。
 * 不做归一化会让「验证码６６６６６６」匹配不到「验证码」(实际能匹配,因为
 * 「验证码」是中文连续子串),但会让「Apple ID」匹配不到「apple id」。
 */
function fullToHalf(text: string): string {
  return text
    .replace(/[！-～]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
    )
    .replace(/　/g, ' ')
}

/**
 * 输入文本归一化:
 * - 转半角(让 Apple/ＡＰＰＬＥ/ａｐｐｌｅ 走到同一形态)
 * - 转小写(英文关键词统一以小写存)
 * - trim
 *
 * 没有做:繁体转简体、移除中文标点。
 * 没做的理由:
 * - 繁体转简体需要额外字典,M1 阶段简体已经覆盖目标用户。
 * - 中文标点(,。!?)出现在文本中间不影响中文子串匹配。
 */
function normalize(text: string): string {
  return fullToHalf(text).toLowerCase().trim()
}

/**
 * 按规则给一段文本分类风险。
 *
 * 算法:
 *   1. 归一化输入。
 *   2. 遍历 RISK_KEYWORDS,用 includes 子串匹配(O(n),n≈110,日常输入无感)。
 *   3. 取所有命中关键词中 level 最大的若干条。
 *   4. 最终 level = 那个最大值;reason = 第一条 top hit 的 reason(给老人看的人话)。
 *   5. matchedKeywords = 所有命中关键词的字符串数组,去重保序。
 *
 * 未命中返回 `low` + 空数组 + 空 reason —— UI 层据此决定是否给空 reason 兜底文案。
 *
 * @param text 老人输入的原始文本(或语音转写后的文本)。
 */
export function classifyRiskByRules(text: string): RiskClassification {
  const normalized = normalize(text)

  if (!normalized) {
    return { level: 'low', matchedKeywords: [], reason: '' }
  }

  const hits: RiskKeyword[] = []
  for (const kw of RISK_KEYWORDS) {
    if (normalized.includes(kw.keyword)) {
      hits.push(kw)
    }
  }

  if (hits.length === 0) {
    return { level: 'low', matchedKeywords: [], reason: '' }
  }

  // 关键安全保险丝:多关键词命中取 MAX,不要平均、不要取第一个。
  const maxRank = Math.max(...hits.map((h) => RISK_RANK[h.level]))
  const topHits = hits.filter((h) => RISK_RANK[h.level] === maxRank)
  const level: RiskLevel = topHits[0].level

  // 去重保序(理论上 RISK_KEYWORDS 里每个 keyword 唯一,但留个保险)
  const matchedKeywords = Array.from(new Set(hits.map((h) => h.keyword)))

  return {
    level,
    matchedKeywords,
    reason: topHits[0].reason,
  }
}
