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
- 保持启用 Prettier 检查；发布前使用工作流指定版本的 Prettier 和 Liquid 插件格式化修改过的 YAML、Markdown 及 Liquid 源文件。
- 源码链接检查排除 `_projects/3_project.md`，它是一个未发布的 al-folio Unsplash 跳转示例，Jekyll 已将其排除。继续检查真实作品集链接及其他源文件；不得全局放行 HTTP 401 响应。
- 主导航：About、Publications、Projects、CV。

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

不得推断缺失的学位日期、毕业情况、稿件录用状态、个人科研资助归属或投资业绩。保留 2026 年 npj Dementia 稿件的审稿中状态，以及 ISFTD 2026 海报的已接受状态。Quick Annotator 的期刊文章与预印本应视为同一工作的不同版本。

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

只有标记为 `portfolio: runtian` 的项目条目才出现在 Projects 页面。不得将模板项目、示例论文及示例 CV 数据展示为 Runtian Miao 的成果。

## 权限与维护

优先使用原生 GitHub 连接器和已有的个人 GitHub App 安装。仓库选择权限仅限实际需要的特定个人仓库。账号的 `permissions.push` 不代表集成工具已经取得写入权限。如果实际写入返回 HTTP 403，在改变授权方式前，先核查 GitHub App 安装所选的仓库。

不得扩大为所有仓库访问权限，不默认发起宽泛的 OAuth 登录，也不得请求访问 `ftdc-picsl` 组织。不得在仓库中保存凭证或验证码。

内容、导航或部署行为发生变更时，同时更新本规格及其英文版本，保持对应来源链接和限制说明一致。

## CI 验收

- 最终源码提交的 Prettier 和源码链接检查均成功完成。
- 该提交的部署构建成功完成，并生成三张头像 WebP 文件。
- 部署触发的编译后站点链接检查成功重新构建同一提交，并检查本地生成的链接。
- 线上首页和 PCR 项目页均可加载，且中英文 README 链接可用。
- 较早失败运行的邮件通知仅代表历史状态；判断当前状态时，以最新提交的 Actions 结果为准。

2026-11-25 的内容基线已通过生产 Jekyll 构建。部署结果保留在仓库的 Actions 历史中：<https://github.com/Rexmiao/rexmiao.github.io/actions/workflows/deploy.yml>。检查发布状态时，核对相应部署及实际线上站点。
