/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * `auditInputHash()` 单元测试 —— 审计日志里 `inputHash` 字段的来源函数。
 *
 * ## 输入
 * 任意字符串(空串 / 短串 / 中文 / 含 unicode / 长串)。
 *
 * ## 输出
 * node --test 跑过的 pass/fail 计数(本文件 5 个 case)。
 *
 * ## 定位
 * 锁住"审计去重 key"的基本属性:
 * 1. 确定性(同输入 → 同 hash,聚合端能去重)
 * 2. 区分性(不同输入 → 不同 hash,避免误去重)
 * 3. 形状稳定(总是 8 位 hex,日志 schema 不漂)
 *
 * ## 依赖
 * node:test + node:assert/strict;`./risk-recheck.ts` 的 `auditInputHash`。
 *
 * ## 维护规则
 * 改 hash 算法(由 sha256 改别的 / 改位数)要同步改 README 与日志聚合端。
 */

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { auditInputHash } from './risk-recheck.ts'

describe('auditInputHash — 形状', () => {
  test('空字符串也产出 8 位 hex', () => {
    const h = auditInputHash('')
    assert.equal(h.length, 8)
    assert.match(h, /^[0-9a-f]{8}$/)
  })

  test('短字符串产出 8 位 hex', () => {
    const h = auditInputHash('微信没声音')
    assert.equal(h.length, 8)
    assert.match(h, /^[0-9a-f]{8}$/)
  })

  test('长字符串(超过 200 字)也产出 8 位 hex', () => {
    const long = '啊'.repeat(500)
    const h = auditInputHash(long)
    assert.equal(h.length, 8)
    assert.match(h, /^[0-9a-f]{8}$/)
  })
})

describe('auditInputHash — 确定性', () => {
  test('同输入连续调用 → 同 hash', () => {
    const a = auditInputHash('我闺女让我帮她弄一下')
    const b = auditInputHash('我闺女让我帮她弄一下')
    assert.equal(a, b)
  })

  test('同输入跨多次调用稳定', () => {
    const text = 'screenshot+screen-share 共享屏幕 验证码'
    const first = auditInputHash(text)
    for (let i = 0; i < 5; i++) {
      assert.equal(auditInputHash(text), first)
    }
  })
})

describe('auditInputHash — 区分性(无明显碰撞)', () => {
  test('完全不同的输入产出不同 hash', () => {
    const a = auditInputHash('微信没声音')
    const b = auditInputHash('怎么发照片')
    assert.notEqual(a, b)
  })

  test('一字之差产出不同 hash', () => {
    const a = auditInputHash('微信没声音')
    const b = auditInputHash('微信没声音。') // 多一个句号
    assert.notEqual(a, b)
  })

  test('常见老人问句之间不冲突', () => {
    const inputs = [
      '微信没声音',
      '怎么发照片',
      '我闺女让我帮她弄一下',
      '短信里有个链接要不要点',
      '手机卡了',
      '我看不到字',
      '声音太小了',
      '怎么下载软件',
    ]
    const hashes = new Set(inputs.map((t) => auditInputHash(t)))
    // 8 条短文本不应有碰撞;若 set 长度 < inputs.length 就有碰撞
    assert.equal(hashes.size, inputs.length)
  })
})
