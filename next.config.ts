/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * Next.js 16 的最小配置占位(typescript + App Router + Turbopack 全靠默认)。
 *
 * ## 输入
 * 无显式输入;构建期被 next dev / build / start 内部调用。
 *
 * ## 输出
 * NextConfig 对象(默认配置)。
 *
 * ## 定位
 * 项目级构建配置入口。当前是占位,等真要改 routing / images / env 时再扩。
 *
 * ## 依赖
 * `next` 的 NextConfig 类型。
 *
 * ## 维护规则
 * 改这个文件必过 `pnpm build` + `pnpm test`。
 * 加新 middleware / image domains / env 公开变量时同步更新 `docs/basic/backend-structure.md`。
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
