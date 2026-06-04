/*
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * PostCSS 配置 —— 启用 @tailwindcss/postcss 插件,让 Tailwind 4 在 Next.js 构建里跑。
 *
 * ## 输入
 * 无显式输入;PostCSS 内部读这个文件。
 *
 * ## 输出
 * PostCSS config 对象(plugins 列表)。
 *
 * ## 定位
 * Tailwind → PostCSS → Next.js 构建链的一环。当前只有 tailwind 插件,后续要加 autoprefixer / cssnano 时在这里扩。
 *
 * ## 依赖
 * - `@tailwindcss/postcss` (已在 package.json devDependencies)
 *
 * ## 维护规则
 * 改 plugins 必过 `pnpm build`(确保 CSS 能编译)。
 */
/* 上面 6 段是 OpenPrd 文件说明书(/** 风格),用 /* ... *​/ 注释是因为 .mjs */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
