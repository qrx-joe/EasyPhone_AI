#!/usr/bin/env node
/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * 验证 Vercel 必需的 native binding 装上了。
 * 跑 `pnpm install` 后必须存在,否则 Vercel build 必失败。
 *
 * ## 输入
 * 无显式参数;读 `node_modules/.pnpm/` 目录结构。
 *
 * ## 输出
 * stdout "✓ linux-x64-gnu binding present" + exit 0;否则 stderr + exit 1。
 *
 * ## 定位
 * P0 修复的回归守卫。`@tailwindcss/oxide` 在 Tailwind v4 PostCSS 编译时被
 * 动态 require 它的 native binding;Vercel 是 linux x64 glibc,所以必须装
 * `@tailwindcss/oxide-linux-x64-gnu@4.3.0`。
 * pnpm-workspace.yaml 的 `supportedArchitectures` 控制 optional deps 过滤;
 * 配置错(或 Vercel 缓存不一致)就会导致装不上 → Turbopack build 失败。
 *
 * ## 依赖
 * - Node 内置 `node:fs` (`existsSync`) + `node:path` (`join`)
 * - 无第三方依赖;无需 `package.json` 修改
 * - 不读 `.env.local`、不打印任何 secret;不写产物
 *
 * ## 维护规则
 * - 改 Vercel 目标架构(比如改用 arm64)时同步更新本文件的检查项。
 * - Tailwind 升级到 v5 或换 oxide 版本时同步更新 @4.3.0 字面量。
 * - 不要在这里 echo key 或敏感 env。
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'

const REQUIRED_BINDINGS = [
  // 路径:pnpm 9+ 的 .pnpm 命名约定 `@scope+name@version` / 无 scope 的 `@name@version`
  // 当前包名有 scope 吗?——@tailwindcss/oxide-linux-x64-gnu 没 scope,pnpm 转成 `@tailwindcss+oxide-linux-x64-gnu@4.3.0`
  '.pnpm/@tailwindcss+oxide-linux-x64-gnu@4.3.0',
]

let failed = false
for (const rel of REQUIRED_BINDINGS) {
  const abs = join(process.cwd(), 'node_modules', rel)
  if (existsSync(abs)) {
    console.log(`✓ ${rel}`)
  } else {
    console.error(
      `::error::missing required native binding: ${rel}\n` +
        `Vercel build (linux/x64/glibc) will fail because @tailwindcss/oxide\n` +
        `can't load its linux-x64-gnu native binary. 检查 pnpm-workspace.yaml\n` +
        `的 supportedArchitectures,或重新 pnpm install --frozen-lockfile。`,
    )
    failed = true
  }
}

process.exit(failed ? 1 : 0)
