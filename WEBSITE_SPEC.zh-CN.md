# Runtian Miao 网站规格

**简体中文** | [English](WEBSITE_SPEC.md)

更新日期：2026-11-25。

## 网站与部署

- 网址：<https://rexmiao.github.io/>。
- 仓库：`Rexmiao/rexmiao.github.io`。
- 框架／主题：沿用现有 al-folio／Jekyll。
- 源码分支：`master`；生成的发布分支：`gh-pages`。
- 部署工作流：`.github/workflows/deploy.yml`。
- Ruby 环境使用 `3.2` 系列的最新补丁版本，使较新的 GitHub runner 镜像可以使用现有构建，而不依赖已停用的 `3.2.2` 二进制包。
- 构建前安装 ImageMagick，并验证三张响应式头像 WebP 文件均非空。即使缺少 `convert` 可执行文件，图片插件也可能报告成功，因此仅凭构建显示成功不足以确认图片生成正常。
- 编译后站点的链接检查工作流与部署使用相同的 Ruby `3.2` 系列、ImageMagick 前置依赖及响应式图片断言。重新构建前，必须检出触发该检查的部署所对应的准确源码 SHA。
- 保持启用 Prettier 检查。使用 Node.js `22`，通过 `npm ci --ignore-scripts` 安装已提交的 `package-lock.json` 中锁定的 Prettier `3.1.1` 和 `@shopify/prettier-plugin-liquid` `1.4.0`，不得在 CI 中升级格式化工具。发布前使用这些版本格式化修改过的 YAML、Markdown 及 Liquid 源文件。
- 源码链接检查依据 Jekyll 配置的 `include`、`exclude` 和输出集合选择 Markdown 与 HTML 文件，排除依赖目录和未发布的模板内容。`_projects/3_project.md` 的 Unsplash 跳转示例也通过 Jekyll 配置排除，而非仅为这一个文件设置跳过规则。检查所选文件中的 HTTP、HTTPS 外部链接，不得全局放行 HTTP 401 响应。
- 独立的编译后站点检查以 `_site/` 为明确的基准目录，离线验证生成后的内部路由。源码检查负责外部网址，编译后站点检查则在构建结果中解析本地链接。
- 主导航：About、News、Publications、Projects、CV。

保留现有网址、托管方式及主题。网站完成构建与验证后，才能声称改动已发布。每次源码更新后，同时核查部署结果和实际线上页面。

## 内容基线

用户提供的 `Resume202611220310.docx` 是 Runtian Miao 的研究方向、教育经历、职业经历、技能、学术成果、同行评审、领导经历、大学服务及科研支持环境信息的来源。用户还提供了替换头像，保存在 `assets/img/runtian-miao.jpg`。

- 姓名：Runtian Miao。
- 身份：宾夕法尼亚大学应用数学与计算科学博士候选人（Ph.D. Candidate, Applied Mathematics and Computational Science, University of Pennsylvania）。
- 邮箱：`rexmiao@sas.upenn.edu`。
- Google Scholar ID：`A5aYtioAAAAJ`。
- ORCID：`0000-0002-2754-2630`。
- ResearchGate 个人资料设置：`Runtian_Miao2`。
- GitHub：`Rexmiao`。
- X：`@Rexy69492164`，<https://x.com/Rexy69492164>，由用户提供的截图确认。

不得推断缺失的学位日期、毕业情况、稿件录用状态、个人科研资助归属或投资业绩。保留 2026 年 npj Dementia 稿件的审稿中状态，以及 ISFTD 2026 海报的已接受状态。Quick Annotator 的期刊文章与预印本应视为同一工作的不同版本。

## 新闻与社交动态

通过 `_pages/about.md` 及 `_config.yml` 的 announcements 设置启用首页 News 栏目。导航中的 News 打开 `/news/`，该页面列出已发布的新闻集合，并链接到已确认的 X 账号。

首篇当前动态为 `_news/website-update.md`，发文日期按用户的 America/New_York 时区设为 2026-11-25。文章说明实际完成的 CV、学术成果及量化项目作品集更新，并链接到对应页面。继续排除模板公告，不得编造发文日期或研究里程碑。

## 受邀同行评审

首页概述 CV 中有记录的期刊同行评审服务，并链接到 `/cv/#peer-review`。分别说明直接审稿、为 _NeuroImage_ 合作审稿及加入 _The Journal of Pathology: Clinical Research_ 审稿人库。保留稿件内容的保密性。

## 项目作品集

项目汇总页位于 `/projects/`，各项目拥有独立详情页及返回导航：

| 项目                                           | 详情页                           | 分类                  |
| ---------------------------------------------- | -------------------------------- | --------------------- |
| PCR Market Watch                               | `/projects/pcr-market-watch/`    | Quantitative Research |
| Alpha Lab                                      | `/projects/alpha-lab/`           | Quantitative Research |
| Volatility Modeling with Lévy and OU Processes | `/projects/volatility-modeling/` | Quantitative Research |
| Quick Annotator                                | `/projects/quick-annotator/`     | Research Software     |
| HistoQC                                        | `/projects/histoqc/`             | Research Software     |

PCR Market Watch 提供通往公开介绍页、个人源码仓库、最新 Release、默认英文 README／用户指南及独立中文 README 的链接。Alpha Lab 是本机研究原型，并有独立公开的 Alpha Training Lab 教学指南；不得暗示其已公开源码或已投入生产交易。保留已经核实的项目链接与实际状态。

波动率建模项目新增独立的 [Lévy 波动率实验室](labs/levy-volatility/)，并提供模型源码、数据说明和中英文复现指南。该网页以美联储 H.10 美元兑日元日度汇率为基础开展新的实证实验，与项目页面中的硕士研究是两项工作。五期波动率代理、训练区间、比较基准及模拟假设均见实验室说明。实验室位于 `labs/levy-volatility/`，随现有 GitHub Pages 工作流发布。

实验室在同一页面提供中英文[美股波动率对照](labs/levy-volatility/#equity-evaluation)，可选择 SPY、NVDA、JPM、AMD、QQQ、AVGO、MU、SNDK 或 NBIS、方差口径以及未来 1、5 或 22 个交易日。各视图列出可用的评估样本日期、相对训练期均值基准的 QLIKE 差值，以及以年化波动率百分点计的 RMSE。日线口径使用复权收盘到收盘的收益平方。分钟线口径用一分钟行情构造常规时段已实现方差，并加上隔夜收益平方。NBIS 的日线单独评估。SNDK 的两种口径与 NBIS 的分钟线口径显示样本不足。网页发布汇总结果，原始美股行情存于本地研究目录。

中英文[美股结果总结](labs/levy-volatility/#equity-findings)按数据口径和预测期限统计各标的的领先模型，并标明 Gamma–OU 同时优于 HAR 和 EWMA 的情形。汇总使用基准实验的完整精度分数，解读限于现有历史样本的点预测对照。

独立的[数据来源与清洗说明](labs/levy-volatility/data-methodology/)记录采集方式、时间范围、复权、缺失处理、常规交易时段与隔夜方差构造和质量筛选，并列出公开文件与汇率及美股输入快照的对应关系。实验室和波动率项目详情页均提供入口。

只有标记为 `portfolio: runtian` 的项目条目才出现在 Projects 页面。不得将模板项目、示例论文及示例 CV 数据展示为 Runtian Miao 的成果。

## 权限与维护

优先使用原生 GitHub 连接器和已有的个人 GitHub App 安装。仓库选择权限仅限实际需要的特定个人仓库。账号的 `permissions.push` 不代表集成工具已经取得写入权限。如果实际写入返回 HTTP 403，在改变授权方式前，先核查 GitHub App 安装所选的仓库。

不得扩大为所有仓库访问权限，不默认发起宽泛的 OAuth 登录，也不得请求访问 `ftdc-picsl` 组织。不得在仓库中保存凭证或验证码。

内容、导航或部署行为发生变更时，同时更新本规格及其英文版本，保持对应来源链接和限制说明一致。

## CI 验收

- 最终源码提交使用锁定版本的 Prettier 检查，以及按 Jekyll 配置选择文件的 HTTP／HTTPS 源码链接检查，均成功完成。
- 该提交的部署构建成功完成，并生成三张头像 WebP 文件。
- 部署触发的编译后站点链接检查检出该部署的准确源码 SHA，使用 Ruby `3.2` 和 ImageMagick 成功重新构建该提交，并以 `_site/` 为基准目录离线检查本地生成的链接。
- 线上首页、News 页面和 PCR 项目页均可加载；五项主导航、首页新闻动态、已确认的 X 链接及中英文 README 链接均可用。
- 较早失败运行的邮件通知仅代表历史状态；判断当前状态时，以最新提交的 Actions 结果为准。

2026-11-25 的内容基线已通过生产 Jekyll 构建。部署结果保留在仓库的 Actions 历史中：<https://github.com/Rexmiao/rexmiao.github.io/actions/workflows/deploy.yml>。检查发布状态时，核对相应部署及实际线上站点。
