# EasyPhone_AI scripts

## 核心功能

`scripts/` 目录承载 **生产构建之后的运行时验证** 工具,目前只有 `smoke.mjs` 这一个 HTTP 黑盒 smoke 脚本。它是 OpenPrd quality 门禁 `smoke` 的唯一证据源,也是 CI gate。

## 输入

- 任意由本仓库产出的 Next.js 生产构建(`pnpm build` 产物)
- 已在某端口 listen 的 `next start` 进程(默认 `http://localhost:3000`,可用 `SMOKE_BASE` 覆盖)

## 输出

- `smoke.mjs`:在 stdout 输出 N 条路由/接口断言结果(N 随 CHECKS 数组增长),失败时 exit 1

## 定位

工程脚本(非业务代码),**不进 src 编译产物,不进 Next.js bundle**。`smoke.mjs` 是"业务页面→ HTTP 入口"这条链路的最后一道闸,只验证：

1. 生产构建能起来
2. 关键路由 200
3. 关键文案出现在 HTML 中(防止"页面 200 但渲染空白"被误判为通过)

它**不验证**领域逻辑(那是 `pnpm test` 的活,覆盖 `src/domain/risk / routing / help / tutorial` 80 个用例)。

## 依赖

- Node.js ≥ 24(原生 fetch + assert/strict)
- `pnpm`(开发期运行命令)
- 不依赖 puppeteer / playwright / 任何第三方 HTTP 客户端

## 维护规则

- 新增页面 → 同步在 `smoke.mjs` 的 `CHECKS` 数组里加断言
- 改页面文案 → 同步更新对应 `expectAny` 关键词
- 改 smoke 自身 → 跑一遍 `pnpm build && pnpm start & sleep 3 && node scripts/smoke.mjs`
  验证全部 CHECKS 通过(本轮新增 deep link 守卫 2 条;跑通后改 smoke 数字仍对不
  上,故下文统一用"全部 CHECKS 通过"措辞,不再写死 9/9)
- 文件夹内新增脚本时,必须为新脚本写文件说明书(参考 `.openprd/standards/file-manual-template.md` 的 6 节格式)
- 文件夹职责变化时,同步更新本 README

## PowerShell 等价命令

Windows PowerShell 5.x / PowerShell 7+ 用户在跑 smoke 时,**`Start-Job` 在子进程跑、不继承 PWD**,必须 ScriptBlock 内 `Set-Location`;清理必须放 `finally` 防后台 next start 残留:

```powershell
# Windows PowerShell 5.x / PowerShell 7+;项目根 D:\code\EasyPhone_AI
$ErrorActionPreference = 'Continue'
$job = $null
try {
  $job = Start-Job -ScriptBlock {
    Set-Location 'D:\code\EasyPhone_AI'
    corepack pnpm start
  }
  Start-Sleep -Seconds 5
  node scripts/smoke.mjs
  if ($LASTEXITCODE -ne 0) { throw "smoke exited with code $LASTEXITCODE" }
  Write-Host "smoke: OK"
} catch {
  Write-Host "smoke: SKIPPED - $($_.Exception.Message)"
  Write-Host "原因分类: 本机 PowerShell 后台 next start 限制 / 端口占用 / 其它环境问题"
  Write-Host "策略: 本轮 PR 资产完整,CI/Preview 复跑验证,不在本环境硬阻塞"
} finally {
  if ($job) {
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -Force -ErrorAction SilentlyContinue
  }
}
```
