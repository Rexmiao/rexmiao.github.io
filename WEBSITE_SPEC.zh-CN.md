# Runtian Miao 网站规格

**简体中文** | [English](WEBSITE_SPEC.md)

更新日期：2026-11-28。

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
- `deploy.yml` 只在 `assets/**`、HTML、JS、Liquid、Markdown 或 YAML 文件变化时运行。只改 `_sass/` 的提交不会触发部署，需要在同一次推送中包含会触发部署的文件（例如本规格）。
- 生产环境的 Sass 输出经过压缩，会删除 `calc()` 中 `+`、`-` 两侧的空格，导致浏览器丢弃该声明。`_sass/` 规则中使用固定长度，或不含加减运算的 `clamp()`／`max()`。

保留现有网址、托管方式及主题。网站完成构建与验证后，才能声称改动已发布。每次源码更新后，同时核查部署结果和实际线上页面。

波动率实验室另有 Hugging Face Static HTML 发布目标 `Rexymiao/levy-volatility-lab`。`.github/workflows/publish-huggingface.yml` 只打包明确列出的公开文件。Trusted Publisher 在该 Space 内设定，匹配仓库 `Rexmiao/rexmiao.github.io`、分支 `master` 和工作流 `publish-huggingface.yml`。GitHub Actions 运行时获得短期上传凭据。Static Space 使用预计算结果。

## 内容基线

用户提供的 `Resume202611220310.docx` 是 Runtian Miao 的研究方向、教育经历、职业经历、技能、学术成果、同行评审、领导经历、大学服务及科研支持环境信息的来源。用户还提供了替换头像，保存在 `assets/img/runtian-miao.jpg`。

- 姓名：Runtian Miao。首页主标题：Rexy (Runtian) Miao。导航栏名称：Rexy Miao。
- 身份：宾夕法尼亚大学应用数学与计算科学博士候选人（Ph.D. Candidate, Applied Mathematics and Computational Science, University of Pennsylvania）。
- 首页邮箱链接：`rexmiao@sas.upenn.edu` 和 `miaoruntian1997@gmail.com`。
- Google Scholar ID：`A5aYtioAAAAJ`。
- ORCID：`0000-0002-2754-2630`。
- ResearchGate 个人资料设置：`Runtian_Miao2`。
- GitHub：`Rexmiao`。
- Hugging Face：`Rexymiao`，<https://huggingface.co/Rexymiao>，入口位于首页社交图标区。
- X：`@Rexy69492164`，<https://x.com/Rexy69492164>，由用户提供的截图确认。

首页采用量化研究作品集风格，深色网格首屏和 PCR Market Watch、Alpha Lab、Lévy Volatility Lab 三张项目卡片排在学术简介之前。头像下方保留小尺寸社交图标和两个可点击的邮箱链接，邮箱文本用大写 `AT` 和 `DOT` 显示分隔符。简介提及校队田径和多次半程马拉松经历。粗体名称分别链接到[宾大 AMCS 项目](https://amcs.upenn.edu/)、Quick Annotator 和 HistoQC 项目详情、[Sedeen Viewer 产品页](https://www.pathcore.com/products/sedeen-viewer)以及 [WRDS 官方介绍页](https://research-it.wharton.upenn.edu/data/wrds/)。

个人站通过共享 Jekyll 主题统一深蓝和薄荷青配色、网格、页头、导航及卡片。独立 Lévy 实验室及数据方法页使用对应的界面和图表配色。默认深色，主题按钮依次切换深色、浅色和跟随系统。本域名下的 Jekyll 和实验室页面用 `quant-theme` 共用用户主动选择的主题，继承旧版明确选择的浅色或深色。CV 打印采用浅色纸面配色。

字体使用 IBM Plex Sans（正文）与 IBM Plex Mono（标签、日期、类型标记），在 `_includes/head.liquid` 中从 Google Fonts 加载，通过 `--global-sans-font` 和 `--global-mono-font` 设置；中文回退到系统中文字体。两个 Lévy 页面加载同一套字体。内容区宽度为 1080 像素（`_config.yml` 的 `max_width`），Projects 网格在该宽度下为三列。

标题、短副标题、按钮文字和卡片链接标题使用英文标题式大写（例如 Quantitative Research and Projects），较长的描述性句子保持句首大写。薄荷青只用于可点击元素和数据：首页身份行、页头层级标签和标语竖线改用浅色文字色，卡片顶边平时为中性色，悬停时才变青。

共享界面组件位于 `_sass/_quant-site.scss`。页头标题上方可显示等宽字体的层级标签：项目概览显示 `Project overview · <分类>`，资料页显示 `Project resource` 或其 `layer` 设置，交易复盘文章显示 `Trading reflection · Article`。项目卡片显示 front matter 中的 `status` 状态标签和 **Overview** 入口；资料链接按 `resources[].kind`（`demo`、`data`、`article`、`code`、`site`）显示 Demo、Data & method、Article、Code、Project page 类型标签。Trading Reflections 卡片通过 `latest_entries_from: trading_reflections` 自动链接最新一篇已发布复盘。Projects 页提供标签图例，手机端隐藏。首页卡片通过 `_pages/about.md` 的 `status` 和 `resource_kind` 使用同一套标签。首页邮箱只在用户名与 `AT …` 域名之间换行；手机端头像与联系方式并排，使项目卡片进入首屏。

`assets/js/quant-hero.js` 在 `.quant-hero` 和 `.post-header` 背后绘制装饰性画布。首页首屏下方的预留条带绘制固定随机种子的均值回复带跳跃模拟路径（标注 **Simulated Lévy–OU path**），底层是一组漂移点构成的 Vietoris–Rips 复形，距离阈值像过滤（filtration）一样周期变化。页头通过 `_layouts/page.liquid` 的 `data-backdrop` 选择图形：列表页（News、Publications、Projects、CV）显示旋转的线框环面，并高亮经线与纬线两条生成元；项目、资料与复盘页显示波动路径。脚本测量页头文字的右边界，只在其右侧绘制；副标题过长时，路径改为页头底边的细线。路径上的跳跃和单点尖峰会触发短暂的火花迸发、竖直闪光与扩散圆环，尖峰顶端带小光点；Rips 复形的顶点会闪烁，环面两条生成元上各有一个带拖尾的光点循环移动。暖色辅助色 `--global-spark-color` 只用于这些动画：多数跳跃火花、跳跃闪光、一条生成元上的光点和部分闪烁；路径周围还有随机闪烁的光点。首页标注带小块实底，路径不会遮挡文字。宽度低于 600 像素时页头不绘制。News、Projects、Publications 的页头副标题使用英文标题式大写。画布设为 `aria-hidden`，跟随主题切换，离屏或标签页隐藏时暂停，`prefers-reduced-motion` 时只绘制静态帧，打印时隐藏。卡片与首屏内容有简短的进场和悬停动效，减少动态效果时同样关闭。所有 Jekyll 页面提供 **Skip to content** 跳转链接，当前导航项带下划线标记，文章正文链接带下划线，两种主题的文字对比度均达到 WCAG AA。独立 Lévy 页面的面包屑以链接首页的 **Rexy Miao** 开头。

不得推断缺失的学位日期、毕业情况、稿件录用状态、个人科研资助归属或投资业绩。保留 2026 年 npj Dementia 稿件的审稿中状态，以及 ISFTD 2026 海报的已接受状态。Quick Annotator 的期刊文章与预印本应视为同一工作的不同版本。

## 新闻与社交动态

通过 `_pages/about.md` 及 `_config.yml` 的 announcements 设置启用首页 News 栏目。导航中的 News 打开 `/news/`，该页面列出已发布的新闻集合，并链接到已确认的 X 账号。

首篇网站更新动态为 `_news/website-update.md`，发文日期按用户的 America/New_York 时区设为 2026-11-25。文章说明实际完成的 CV、学术成果及量化项目作品集更新，并链接到对应页面。继续排除模板公告，不得编造发文日期或研究里程碑。后续在 `_news/` 添加有明确日期的真实动态。首页最多展示最近五条，`/news/` 列出全部动态。已补入 CV 中 2018 至 2026 年的七条会议和报告记录，包括 CWRU SURES、瑞士病理学会年会、三次宾大 Pendergrass 研讨会及两次 ISFTD。2026 年 ISFTD 海报按会议议程及接收状态表述。仅核实到月份的条目使用 `date_label`，排序按月份处理。

News 于 2026 年 11 月 24 日记录 American Journal of Artificial Intelligence 的审稿人任命。任期至 2029 年 11 月 24 日，并链接至出版商公开审稿人名单。

ISFTD 2024 条目记录在阿姆斯特丹参会，并注明会议议程将用户列为 P159 海报报告人。2026 年 11 月 27 日的量化项目动态概述已验证的每日市场新闻邮件流程、期权持仓研究计划与本地原型，以及 Alpha Lab 的 beta 对照、本地五分钟回测和数据工作流页面。

## 受邀同行评审

首页突出显示各期刊名称、影响因子和 CV 记录的审稿次数，并链接到 `/cv/#peer-review`。36 次已完成审稿含修回轮次，稿件数量保留在 CV 中。另列为 _NeuroImage_ 完成的 1 次合作审稿及 _The Journal of Pathology: Clinical Research_ 审稿人库成员身份。保留稿件内容的保密性。所列影响因子为 2026 年发布的 Journal Citation Reports 的 2025 年数据，[公开表格](https://www.niic.nsc.ru/phocadownload/publications/2025/JCR_JournalImpactFactor_2026.pdf)按发布年份标注列名。

首页与 CV 的同行评审栏目使用相同的期刊或出版商官方链接。American Journal of Artificial Intelligence 的首页条目显示同行审稿人身份，CV 列出起止日期为 2026 年 11 月 24 日至 2029 年 11 月 24 日。News 动态记录任命期限。该条目暂不列审稿次数。

## 项目作品集

项目汇总页位于 `/projects/`，提供分类跳转与响应式项目卡片。卡片沿用项目名称原本的大小写，项目简介使用亮色和暗色主题各自的主要文字颜色。各项目拥有独立详情页及返回导航。

项目卡片链接至项目概览，并按 `resources` 设置显示常用资料的直达入口。面包屑依次显示 Projects、分类、项目和当前资料或文章，分类沿用已有锚点。Jekyll 子页用 `project_parent` 指定父项目，交易复盘文章从集合设置继承。独立的 Lévy 实验室和数据方法页提供同样层级的双语导航。

| 项目                                           | 详情页                           | 分类                  |
| ---------------------------------------------- | -------------------------------- | --------------------- |
| PCR Market Watch                               | `/projects/pcr-market-watch/`    | Quantitative Research |
| Alpha Lab                                      | `/projects/alpha-lab/`           | Quantitative Research |
| Volatility Modeling with Lévy and OU Processes | `/projects/volatility-modeling/` | Quantitative Research |
| Trading Reflections                            | `/projects/trading-reflections/` | Trading               |
| Quick Annotator                                | `/projects/quick-annotator/`     | Research Software     |
| HistoQC                                        | `/projects/histoqc/`             | Research Software     |

Trading Reflections 是用户的个人交易复盘栏目。归档按日期倒序列出已发布的复盘，可点击标题看全文。文章页提供返回归档的链接，归档提供返回 `/projects/#trading` 的链接。用 `TRADING_REFLECTION_TEMPLATE.md` 写作，未确认草稿在仓库外的 `../.work/trading-reflections/` 内按 `YYYY-MM-DD-short-title.md` 保存。用户确认具体版本后，才在 `_trading_reflections/` 内准备 `published: true` 的文章文件。原始笔记与未确认稿不进入公开仓库；`published: false` 只能阻止网页展示，不能隐藏 GitHub 原文。站点构建排除模板、草稿和未来日期的条目。

首篇经用户确认的个人复盘是《一笔标普 500 Put 对冲的仓位复盘》，发布日为纽约时间 2026 年 11 月 26 日，链接为 `/projects/trading-reflections/2026-11-26-sp500-put-hedge/`。

交易复盘以英文为主。双语文章的 `title` 和 `description` 写英文，另加 `title_zh` 和 `description_zh`；正文分别放进 `<div class="reflection-body" data-lang="en|zh" markdown="1">`，中文块设为 `hidden`。页面在日期旁显示 **English / 中文** 切换，同时切换正文、标题、摘要和标签页标题，并用 `reflection-lang` 记住选择。首篇文章现以英文标题 _Position Review of an S&P 500 Put Hedge_ 为主，保留用户原始中文全文。用户已于 2026-11-27 确认英文译文，按原样使用。以后的双语文章同样需要用户审阅英文后再发布。

本聊天专门维护 Trading Reflections，固定流程见 `bin/TRADING_REFLECTIONS.md`。在源码目录运行 `ruby bin/trading_reflections.rb new|check|prepare`，仅用 Ruby 标准库复用双语模板，不安装依赖、不调用 API。脚本以 UTF-8/LF 建稿，检查元数据、文件名与日期、占位符及双语容器，简洁输出文章链接与 SHA-256。用户明确确认后，`prepare` 用已审阅版本的哈希准备本地发布文件，拒绝覆盖；哈希只标识内容版本，不能替代用户批准。脚本不提交、不推送、不部署。日常建稿采用定向读取与轻量检查；真正发布时仍执行规定的格式、构建、链接、部署、线上归档与全文、头像及三种响应式资源检查。2026-11-28 的流程配置仅在本地完成，没有发布新文章。

`ruby bin/review_trading_reflections.rb draft.md [draft.md ...]` 使用已有 Kramdown 依赖生成离线双语图文预览。草稿图片保留未来发布时的 `/assets/img/trading-reflections/YYYY-MM-DD/` 路径，预览映射到草稿旁的私有 `YYYY-MM-DD-materials/assets/` 文件。批准后只复制经审阅的图片；原始工作簿、聊天截图、弃用版本和私有审计文件不进入发布内容。

交易复盘的公式用 LaTeX 排版：段内使用 Kramdown 的 `$$...$$`，显示公式的起止 `$$` 各占一行。本地预览使用私有 `.work/trading-reflections/.review-runtime/` 中校验哈希的 MathJax 3.2.0 SVG 缓存，按网站已有版本下载一次后离线加载。该私有运行库不进入发布素材；正式网页继续使用已有 MathJax 配置。公式、表格和图注须分别标明观察时间与合约到期日。

每个显示公式下补充双语直观解释，使用 `aside.reflection-intuition`。输入、影响和假设／限制分别用蓝、薄荷绿、琥珀色文字强调，并保留文字标签，避免只靠颜色理解。算例明确为假设，不能当作实际交易记录。共享组件样式与离线预览均提供解释块样式，并兼顾浅色和打印；发布批准的文章时同步发布其已批准样式依赖。

### 2026 年 11 月 28 日批准的复盘发布

用户已批准两篇标注 11 月 27 日的中英文笔记及其 17 张精选配图：

- `/projects/trading-reflections/2026-11-27-gex-max-pain-framework/`：多指数、多到期日和多观察时点框架，含有符号 GEX 与 Max Pain 公式、直观算例、GOOG 图表口径比较及已核验研究链接。
- `/projects/trading-reflections/2026-11-27-qqq-spy-0dte-execution/`：11 月 26 日晚计划与 11 月 27 日 QQQ／SPY 零日期权执行复盘，保留成交价格、下单时间、分批平仓及未扣费用的权利金收益。

配图按二进制原样保存在 `assets/img/trading-reflections/2026-11-27/`。英文图注明为标签本地化示意，中文原图作为数值依据；按批准保留合约张数，不发布聊天、原始 Excel、弃用图像版本和私有审计／运行库。方法稿每种语言各有四个公式直观解释块，执行稿每种语言各有一个。归档和项目卡片继续从原集合自动生成入口。发布沿用 `master` 至 `gh-pages` 的现有工作流，上线后核验公式、图片、语言切换、导航与头像资源。

发布外链检查中，原有首页 WRDS 根网址连续超时，现改用已核验可达的 WRDS 官方介绍页 `https://research-it.wharton.upenn.edu/data/wrds/`，检查规则不变。

手机线上核验发现长 MathJax 公式可能撑宽整页，交易复盘的显示公式现限制在自身 `mjx-container` 内横向滚动。由于 MathJax 元素在页面加载后才生成，使用仅包围该条样式且在压缩后保留的 PurgeCSS 注释，防止静态扫描删除必要规则。

PCR Market Watch 提供通往公开介绍页、个人源码仓库、最新 Release、默认英文 README／用户指南及独立中文 README 的链接。Alpha Lab 是正在开发的个人量化交易系统。首页简介链接到项目页，概述信号捕捉、人工交易决策、人工确认的半自动模拟执行和全自动模拟执行。项目页链接到公开项目仓库、Alpha Training Lab 教学指南和 Hugging Face 研究演示。回测收益按模拟结果表述，实盘成交或投资业绩需核实后才能加入。

`/projects/` 的 Alpha Lab 卡片保留数据工作流资料入口，并分别提供 **Launch Research Lab／进入研究平台**（<https://rexymiao-alpha-trading-lab.hf.space/>）和 **Hugging Face Project／Hugging Face 项目页**（<https://huggingface.co/spaces/Rexymiao/alpha-trading-lab>）两个直达链接。`/projects/alpha-lab/` 详情页同步提供并说明区别：独立网址直接打开研究界面，HF 项目页还提供 Space 文件与部署信息；它们指向同一套研究应用。

首页与 Alpha Lab 项目页均链接到 Data Sources & Research Workflow（`/projects/alpha-lab/data-workflow/`）。该页说明数据来源与验证状态、覆盖范围、复权、清洗、时点可用性和样本外对照。标普 500 put 对冲文章可在 Trading Reflections 查看。

波动率建模项目新增独立的 [Lévy 波动率实验室](labs/levy-volatility/)，并提供模型源码、数据说明和中英文复现指南。该网页以美联储 H.10 美元兑日元日度汇率为基础开展新的实证实验，与项目页面中的硕士研究是两项工作。五期波动率代理、训练区间、比较基准及模拟假设均见实验室说明。实验室位于 `labs/levy-volatility/`，随现有 GitHub Pages 工作流发布。 波动率项目详情页的 Lévy Volatility Lab 小节提供直达 [Hugging Face 演示](https://rexymiao-levy-volatility-lab.static.hf.space/) 的链接。

Projects 页卡片标出 Lévy Volatility Lab。首页的 Quantitative Research and Projects 小节将实验室与 PCR Market Watch、Alpha Lab 一同列为量化研究和交易工作流的项目实例，并提供项目详情及 Hugging Face 演示入口。

波动率项目详情页的导师姓名 Prof. Wojbor A. Woyczynski 链接到他的[波兰语维基百科条目](https://pl.wikipedia.org/wiki/Wojbor_A._Woyczy%C5%84ski)。

实验室在同一页面提供中英文[美股波动率对照](labs/levy-volatility/#equity-evaluation)，可选择 SPY、NVDA、JPM、AMD、QQQ、AVGO、MU、SNDK 或 NBIS、方差口径以及未来 1、5 或 22 个交易日。各视图列出可用的评估样本日期、相对训练期均值基准的 QLIKE 差值，以及以年化波动率百分点计的 RMSE。日线口径使用复权收盘到收盘的收益平方。分钟线口径用一分钟行情构造常规时段已实现方差，并加上隔夜收益平方。NBIS 的日线单独评估。SNDK 的两种口径与 NBIS 的分钟线口径显示样本不足。网页发布汇总结果，原始美股行情存于本地研究目录。

中英文[美股结果总结](labs/levy-volatility/#equity-findings)按数据口径和预测期限统计各标的的领先模型，并标明 Gamma–OU 同时优于 HAR 和 EWMA 的情形。汇总使用基准实验的完整精度分数，解读限于现有历史样本的点预测对照。

独立的[数据来源与清洗说明](labs/levy-volatility/data-methodology/)记录采集方式、时间范围、复权、缺失处理、常规交易时段与隔夜方差构造和质量筛选，并列出公开文件与汇率及美股输入快照的对应关系。实验室和波动率项目详情页均提供入口。

[美股逐标的清洗审计](labs/levy-volatility/data-methodology/#cleaning-audit)支持九个标的及日线、分钟线切换。按行情条数、采样区间数或交易日数列出各阶段的输入及有效观测，并展示缺少日线行情或收益端点、分钟方差质量检查未通过、早于研究起点的日期与原因。初始化及模型评估窗口单独说明。原始行情保存在本地研究项目。

审计页的可点击时间轴使用导出的 XNYS 交易日历、行情缺口与分钟线覆盖记录，随标的和数据频率切换。日期详情显示可用性、剔除原因和相关质量指标。有效、来源缺失、质量剔除、样本初始化、范围之外及休市日期分别标注。分钟线详情使用归档统计量，原始价格留在本地。

清洗时间轴按当前标的、频率和年份显示 12 个月的总览，各月的缺失与剔除天数沿用逐日日历状态。选择月份可打开对应日历。审计范围外的月份与有效范围内缺失和剔除均为零的月份分别标记。

实验室的中英文说明解释所选美股评分、QLIKE 最低次数、美股未来窗口平均方差和外汇窗口末端方差代理量。外汇扇形图说明参考报价、点预测、模拟分位数及固定拟合参数的解读。数据页说明各类行情为什么需要清洗，并链接 SHA-256 的官方定义及说明其文件核对用途。导航标签区分实验室首页、模型对比和总体结论位置。

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
