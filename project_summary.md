**项目概况与进度总结（基于 Sentinel — Section-by-Section Build Guide）**

本文件以中文概述当前代码库相对于构建指南的完成度、发现的证据、关键风险与可执行的优化建议。

**一、总体结论**
- 状态：部分完成，后端与前端骨架已建立，业务逻辑与控制器有大量实现；若要达到完整的可交付物（包含数据库迁移、seed、测试覆盖与部署脚本），仍需完成若干关键步骤。
- 证据示例：存在后端控制器与服务：[Sentinel.Api/Controllers](Sentinel.Api/Controllers)、认证/异常中间件文件（[Sentinel.Api/Program.cs](Sentinel.Api/Program.cs)、[Sentinel.Api/Middleware/ExceptionHandlingMiddleware.cs](Sentinel.Api/Middleware/ExceptionHandlingMiddleware.cs)）；存在实体定义：[Sentinel.Core/Entities/Complaint.cs](Sentinel.Core/Entities/Complaint.cs)；前端为 Vite + React：[sentinel-web/vite.config.ts](sentinel-web/vite.config.ts)、tailwind.config.js。

**二、按构建指南分项进度（0–11 节）**
- Section 0（环境）：假定已完成（需要开发机验证 `dotnet`/`node`/`npm`/`git`）。
- Section 1（解决方案和脚手架）：大体完成 —— 存在 `Sentinel.sln`、`Sentinel.Api`、`Sentinel.Core`、`Sentinel.Tests` 与 `sentinel-web`。
- Section 2（数据层与 EF Core）：部分完成/不确定 —— `Sentinel.Core` 含实体（[Entities](Sentinel.Core/Entities)），但仓库结构未明确显示 `Sentinel.Data` 项目或 `DbContext` 文件位置，需要确认是否存在独立 `Sentinel.Data`、迁移脚本或 `sentinel.db` 文件。
- Section 3（认证 + JWT）：部分完成 —— 代码库包含 `AuthController.cs` 与 `JwtTokenService.cs`（[Sentinel.Api/Services/JwtTokenService.cs](Sentinel.Api/Services/JwtTokenService.cs)），存在 `appsettings.json`，但需确认 JWT 签名密钥是否通过环境变量配置并且 CORS 配置已限制为前端 origin。
- Section 4（Web API 控制器、DTO、验证、错误处理中间件）：大量已实现 —— 多个 controllers（Auth/Complaints/Caseworker/Resources/Tracking）与 `ApiExceptions`、中间件存在；需检查 DTO 是否与前端 types 对应并补充服务器端验证测试。
- Section 5（前端脚手架与 Tailwind）：完成骨架 —— `sentinel-web` 含 `tailwind.config.js`、`postcss.config.js`、`index.css`。
- Section 6（前端—后端连接）：部分完成 —— 需要核实 `src/api` 是否有统一 API 客户端、`context` 中是否实现了 token 保存（sessionStorage）与受保护路由组件。
- Section 7（页面实现）：不确定/部分完成 —— 项目结构含 `src/pages`、`components` 目录，但需要逐页核对五步向导、申诉页、caseworker 仪表盘是否完成并响应式。
- Section 8（增强与安全特性）：未完全实现 —— Quick-exit、匿名举报、分析图表、可访问性修正需手动确认并补足。
- Section 9（测试与运行）：部分完成 —— 存在 `Sentinel.Tests`（含单元测试文件），但需要运行全部测试并检查覆盖率与关键逻辑测试（如状态转换、引用编码生成）。
- Section 10（Azure 部署）：未开始/部分准备 —— 项目有准备部署的结构，但需增加 CI/CD（例如 GitHub Actions）、Azure 配置与机密注入说明。
- Section 11（Android 包装，可选）：未开始。

**三、关键风险与待确认项**
- 是否存在独立的 `Sentinel.Data` 项目与 `SentinelDbContext`？若没有，建议将 DbContext 与 EF Core 相关迁移移入单独项目以保持分层清晰。
- JWT 签名密钥是否在代码中（风险：泄漏）或已经迁移至环境变量/机密存储？
- 是否已创建并应用 EF Core 迁移（`sentinel.db` 或 Azure SQL）？
- 前端 auth token 存储位置与自动附加逻辑（sessionStorage + fetch 拦截器）是否已实现？
- 自动化测试是否覆盖核心业务规则（引用码生成、状态转换、权限检查）？

**四、短期优先优化建议（可立刻采取）**
1. 确认并整理数据层：
   - 若没有，新增 `Sentinel.Data` 项目并将 `SentinelDbContext` 与 EF 配置放入其中；若已存在，请提交其路径并核对迁移状态。
   - 运行并提交迁移：
     ```powershell
     cd Sentinel.Api
     dotnet ef migrations add InitialCreate --project ../Sentinel.Data
     dotnet ef database update --project ../Sentinel.Data
     ```
2. 安全与配置硬化：
   - 将 JWT 签名密钥、数据库连接串等移到环境变量或 Azure App Service 配置（不要提交到 Git）。
   - 在 `appsettings.Development.json` 使用 SQLite、本地 dev 环境限定 CORS，仅允许 `http://localhost:5173`（或前端实际端口）。
3. 前端—后端契约与认证：
   - 在 `sentinel-web/src/api` 实现统一 API 客户端，自动在请求中附加 token，并处理 401 → 重定向到登录。
   - 在 `sentinel-web/src/context` 使用 `sessionStorage` 存储 token，并在页面刷新恢复（不要用 `localStorage` 存长期 token）。
4. 测试覆盖率提升：
   - 在 `Sentinel.Tests` 中增加针对 `ReferenceCodeGenerator`、`StatusTransition`、`Auth` 的单元测试；使用 EF InMemory provider 测试 Data 操作。
5. CI / 代码质量：
   - 添加 GitHub Actions：.NET build & test、前端 `npm ci && npm run build`，以及安全检查（例如 `dotnet format`、ESLint）。

**五、中期与可选改进（提高可交付性与评分）**
- 快速出口（Quick-exit）与双击 Esc：在前端全局组件实现并绑定键盘事件，使用 `history.replaceState` 避免回退回 Sentinel 页面。
- 匿名举报流程：后端支持无用户关联的投诉并返回 reference code；前端在提交后提示用户保存 code。
- 可访问性修正：执行一次 A11y 扫描（axe-core 或 Lighthouse），修复对比度、键盘导航与 ARIA 标签。
- 分析图表：在 caseworker 仪表盘加入轻量图表库（推荐 Recharts），并确保数据从后端分页/聚合接口获取。
- PWA manifest 与 service worker：为可选 Android 包装做准备（TWA 或 PWA）。

**六、验收检查清单（短列表）**
- `dotnet build` 在解决方案根目录成功通过。
- 后端启动并能响应：`cd Sentinel.Api && dotnet run`，Swagger 可调用 `register` / `login`，并返回 JWT。
- EF Core 已生成 `sentinel.db`（或已应用到 Azure SQL）；表与 seed 数据存在。
- 前端 `npm run dev` 可运行并且登录后能访问受保护 API。
- 所有单元测试通过：`dotnet test`。

---
如需我继续：我可以（选择其一）
- 运行仓库内的单元测试并上传结果；
- 在仓库中查找/确认 `Sentinel.Data` 与迁移状态并修复分层；
- 为前端创建统一的 API 客户端与 auth context 示例实现。

请告诉我你想让我接着做哪一步，我会继续执行并把进度记录回 TODO 列表。
