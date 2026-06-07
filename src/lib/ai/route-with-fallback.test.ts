/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * `routeWithFallback` 单元测试 —— 验证:
 *   1. 成功路径 → router.push(AI 兜底后的 href)
 *   2. 失败路径 → 降级到 routeToInput()(纯关键词保险丝)
 *   3. 竞态守卫 → 旧请求被 abort 后不再 push、也不再降级
 *   4. 日志标签 → console.warn 输出的前缀用 source 参数
 *
 * ## 输入
 * - 文件内造的 `MinimalRouter` spy(记 push 调用)
 * - 可控的 `fetchRouteImpl`(用 setTimeout 模拟异步 + AbortController 模拟 abort)
 * - `source` 标签字符串('home' / 'voice' / 'other')
 *
 * ## 输出
 * node --test 跑过的 pass/fail 计数(本文件 9+ case,4 个 suite)
 *
 * ## 定位
 * 锁住"客户端提交 wrapper"的安全 UX 行为 —— 任何闪烁 / 错跳 / 漏降级都是安全 bug。
 *
 * ## 关键不变量
 * - 连点 / 连按只允许最后一次 push 生效(避免闪烁/错跳)
 * - abort 之后**绝不**调 routeToInput(否则会出现两次跳转)
 *
 * ## 依赖
 * node:test + node:assert/strict;`./client-route.ts` 的 `routeWithFallback`;
 * `../../domain/routing/user-routing.ts` 的 `buildRouteForInput` + `routeToInput`(用于对比降级路径)。
 *
 * ## 维护规则
 * 改 abort / 降级行为 = 改安全 UX 边界,需 review。漏一个 case = 可能闪烁/错跳。
 */

import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'

import {
  buildRouteForInput,
  type MinimalRouter,
  type RouteDecision,
} from '../../domain/routing/user-routing.ts'
import { routeWithFallback } from './client-route.ts'

/**
 * 收集 router.push 调用的 spy。
 */
function makeRouterSpy(): MinimalRouter & { calls: string[] } {
  const calls: string[] = []
  return {
    push: (href: string) => {
      calls.push(href)
    },
    calls,
  }
}

/**
 * 假的 fetchRoute 工厂 —— 行为可控:成功 / 抛错 / 慢/快 / 是否响应 abort。
 *
 * 用 Promise + setTimeout 实现可配置 delay;
 * 监听 signal,被 abort 时立刻 reject 一个 AbortError,让 helper 走「abort 静默」分支。
 */
function makeFakeFetchRoute(opts: {
  delayMs?: number
  result?: RouteDecision
  shouldThrow?: unknown
}) {
  const { delayMs = 10, result, shouldThrow } = opts
  return async (text: string, signal?: AbortSignal): Promise<RouteDecision> => {
    return new Promise<RouteDecision>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }
      const timer = setTimeout(() => {
        if (shouldThrow !== undefined) {
          reject(shouldThrow)
        } else if (result) {
          resolve(result)
        } else {
          resolve({
            href: `/confirm?text=${encodeURIComponent(text)}`,
            level: 'low',
          })
        }
      }, delayMs)
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer)
          reject(new DOMException('Aborted', 'AbortError'))
        },
        { once: true },
      )
    })
  }
}

/** 临时劫持 console.warn(降级路径会打 warn),用 dispose 还原 */
function captureWarn(): { messages: string[]; dispose: () => void } {
  const original = console.warn
  const messages: string[] = []
  console.warn = (...rest: unknown[]) => {
    if (typeof rest[0] === 'string') messages.push(rest[0])
  }
  return {
    messages,
    dispose: () => {
      console.warn = original
    },
  }
}

describe('routeWithFallback — 成功路径', () => {
  test('fetchRoute 成功 → router.push 调到 AI 兜底后的 href', async () => {
    const router = makeRouterSpy()
    const aiHref = '/risk-alert?text=%E5%85%85%E5%80%BC%E7%A0%81&level=critical'
    const fetchRouteImpl = makeFakeFetchRoute({
      result: { href: aiHref, level: 'critical' },
    })

    await routeWithFallback(router, '收到验证码', 'home', { fetchRouteImpl })

    assert.deepEqual(router.calls, [aiHref])
  })
})

describe('routeWithFallback — 失败降级', () => {
  test('fetchRoute 抛错 → 降级到 routeToInput()(关键词保险丝)', async () => {
    const router = makeRouterSpy()
    const fetchRouteImpl = makeFakeFetchRoute({
      shouldThrow: new Error('HTTP 500'),
    })
    const text = '微信没有声音了'
    const expectedFallback = buildRouteForInput(text).href

    await routeWithFallback(router, text, 'home', { fetchRouteImpl })

    assert.equal(router.calls.length, 1)
    assert.equal(router.calls[0], expectedFallback)
  })

  test('fetchRoute 抛非 Error 异常也降级', async () => {
    const router = makeRouterSpy()
    const fetchRouteImpl = makeFakeFetchRoute({
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      shouldThrow: 'weird string error',
    })
    const text = '手机字太小'
    const expectedFallback = buildRouteForInput(text).href

    await routeWithFallback(router, text, 'home', { fetchRouteImpl })

    assert.deepEqual(router.calls, [expectedFallback])
  })
})

describe('routeWithFallback — abort / 竞态守卫', () => {
  const disposers: Array<() => void> = []
  afterEach(() => {
    while (disposers.length) disposers.pop()!()
  })

  test('连点:旧 controller 在 resolve 前被 abort → 旧路径不 push', async () => {
    const router = makeRouterSpy()
    const warnCapture = captureWarn()
    disposers.push(warnCapture.dispose)

    // 不用固定 result —— 用 text 编码,这样 first / second 会返回不同 href
    // (避免「fake 返回同一 href 蒙混过关」导致假阳性)
    const slowFetch = makeFakeFetchRoute({ delayMs: 50 })

    // 第一次提交:慢请求
    const ctrl1 = new AbortController()
    const p1 = routeWithFallback(router, 'first', 'home', {
      signal: ctrl1.signal,
      fetchRouteImpl: slowFetch,
    })

    // 立刻发起第二次提交 + abort 旧 controller(模拟连点)
    ctrl1.abort()
    const ctrl2 = new AbortController()
    const p2 = routeWithFallback(router, 'second', 'home', {
      signal: ctrl2.signal,
      fetchRouteImpl: slowFetch,
    })

    await Promise.all([p1, p2])

    // 只有第二次的 href 真的被 push —— 旧请求 aborted 后静默退出
    assert.deepEqual(router.calls, ['/confirm?text=second'])
    // 关键不变量:abort 路径**不**打降级 warn(避免被误判为失败)
    assert.equal(warnCapture.messages.length, 0)
  })

  test('连说:旧 promise 的 catch 也不降级(abort 走 fetch reject 路径)', async () => {
    // 双保险测试:即使 abort 让 fetch 抛 AbortError,helper 也不调 routeToInput。
    const router = makeRouterSpy()
    const warnCapture = captureWarn()
    disposers.push(warnCapture.dispose)

    const slowFetch = makeFakeFetchRoute({
      delayMs: 30,
    })

    const ctrl1 = new AbortController()
    const p1 = routeWithFallback(router, 'first', 'home', {
      signal: ctrl1.signal,
      fetchRouteImpl: slowFetch,
    })

    // micro-task 之后 abort(模拟 fetch 还在 in-flight)
    setTimeout(() => ctrl1.abort(), 5)
    const ctrl2 = new AbortController()
    const p2 = routeWithFallback(router, 'second', 'home', {
      signal: ctrl2.signal,
      fetchRouteImpl: slowFetch,
    })

    await Promise.all([p1, p2])

    // 旧请求 abort 后绝**不**降级到 routeToInput
    assert.equal(router.calls.length, 1)
    assert.match(router.calls[0], /text=second/)
    // 不打 warn(abort 不算失败)
    assert.equal(warnCapture.messages.length, 0)
  })

  test('请求完成后才 abort(晚了) → 仍然 push 成功', async () => {
    // 边界:请求已经 resolve、helper 已经在 push 之后才 abort → 不影响 push。
    const router = makeRouterSpy()
    const fetchRouteImpl = makeFakeFetchRoute({
      delayMs: 5,
      result: { href: '/confirm?text=only', level: 'low' },
    })
    const ctrl = new AbortController()

    const p = routeWithFallback(router, 'only', 'home', {
      signal: ctrl.signal,
      fetchRouteImpl,
    })
    await p
    // 这时再 abort(晚了)
    ctrl.abort()

    assert.deepEqual(router.calls, ['/confirm?text=only'])
  })

  test('signal 被原样转发给 fetchRouteImpl(防御 signal 未传递回归)', async () => {
    // Finding #1 回归测试:routeWithFallback 必须把 options.signal 透传给 fetchRouteImpl,
    // 否则默认 fetchRoute 永远拿不到 AbortSignal,网络层不会真取消,in-flight guard 半失效。
    const router = makeRouterSpy()
    let capturedSignal: AbortSignal | undefined
    const fetchRouteImpl: (
      text: string,
      signal?: AbortSignal,
    ) => Promise<RouteDecision> = (text, signal) => {
      capturedSignal = signal
      return Promise.resolve({
        href: `/confirm?text=${encodeURIComponent(text)}`,
        level: 'low',
      })
    }
    const ctrl = new AbortController()

    await routeWithFallback(router, 'hi', 'home', {
      signal: ctrl.signal,
      fetchRouteImpl,
    })

    // 关键断言:传进来的 signal **就是** options.signal(同一个对象)
    assert.ok(capturedSignal, 'fetchRouteImpl 必须收到 AbortSignal 参数')
    assert.equal(capturedSignal, ctrl.signal, 'signal 必须是原对象(非 undefined / 包装后)')
  })

  test('signal 已 abort → 转发后 fetchRouteImpl 拿到的就是已 abort 的 signal', async () => {
    // 进一步证明:helper 转发的是同一个 signal 对象,不是拷贝。
    // 转发后立刻 abort,fetchRouteImpl 内看到的 signal 应当 .aborted === true。
    const router = makeRouterSpy()
    let capturedAborted: boolean | undefined
    const fetchRouteImpl: (
      text: string,
      signal?: AbortSignal,
    ) => Promise<RouteDecision> = (_text, signal) => {
      capturedAborted = signal?.aborted
      return Promise.resolve({ href: '/confirm?text=hi', level: 'low' })
    }
    const ctrl = new AbortController()
    // 在调用 helper **前**就先 abort(模拟「连点」时 controller 已 dispose)
    ctrl.abort()

    await routeWithFallback(router, 'hi', 'home', {
      signal: ctrl.signal,
      fetchRouteImpl,
    })

    // fetchRouteImpl 必须看到 aborted === true;否则说明 helper 没把 signal 传过去
    assert.equal(capturedAborted, true, 'fetchRouteImpl 应当观察到已 abort 的 signal')
    // helper 在 await 之后也必须自己再 guard 一次(避免旧路径 push)
    assert.deepEqual(router.calls, [], 'abort 后不应该 push 任何路径')
  })
})

describe('routeWithFallback — 日志标签', () => {
  const disposers: Array<() => void> = []
  afterEach(() => {
    while (disposers.length) disposers.pop()!()
  })

  test('console.warn 输出前缀包含 source 参数', async () => {
    const router = makeRouterSpy()
    const fetchRouteImpl = makeFakeFetchRoute({
      shouldThrow: new Error('boom'),
    })
    const warnCapture = captureWarn()
    disposers.push(warnCapture.dispose)

    await routeWithFallback(router, 'text', 'voice', { fetchRouteImpl })

    assert.equal(warnCapture.messages.length, 1)
    assert.match(
      warnCapture.messages[0],
      /\[voice\]/,
      `实际日志前缀 = ${warnCapture.messages[0]}`,
    )
  })

  test('不同 source 参数 → 不同日志前缀', async () => {
    const fetchRouteImpl = makeFakeFetchRoute({
      shouldThrow: new Error('boom'),
    })
    const warnCapture = captureWarn()
    disposers.push(warnCapture.dispose)

    const router = makeRouterSpy()
    await routeWithFallback(router, 'a', 'home', { fetchRouteImpl })
    await routeWithFallback(router, 'b', 'voice', { fetchRouteImpl })

    assert.ok(
      warnCapture.messages[0]?.includes('[home]'),
      `home 实际: ${warnCapture.messages[0]}`,
    )
    assert.ok(
      warnCapture.messages[1]?.includes('[voice]'),
      `voice 实际: ${warnCapture.messages[1]}`,
    )
  })
})
