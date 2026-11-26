"use strict";

const en = {
  skip: "Skip to content",
  navForecast: "Forecast",
  navEvaluation: "Evaluation",
  navEquity: "U.S. equities",
  navMethod: "Method",
  navData: "Data",
  heroEyebrow: "Quantitative research lab",
  heroLineA: "Modeling volatility",
  heroLineB: "with Lévy jumps",
  heroLede:
    "Volatility can surge after a market shock and recede gradually. Fit both of these behaviors to USD/JPY history and see how the model forecasts out of sample.",
  explore: "Explore forecasts",
  readMethod: "Read the method",
  historyTitle: "Historical volatility proxy",
  training: "Training",
  holdout: "Holdout",
  loading: "Loading the historical observations and fitted results…",
  loadError: "The model results could not be loaded. Open the site over HTTP and make sure data/results.json is present.",
  forecastEyebrow: "Forecast explorer",
  forecastTitle: "Start from an observation",
  forecastIntro:
    "Choose an observation date and a horizon. The shaded bands show where volatility can land after random jumps and gradual decay from the starting level.",
  forecastOrigin: "Observation date",
  forecastHorizon: "Forecast horizon",
  evaluationHorizon: "Evaluation horizon",
  h1: "1 day",
  h5: "5 days",
  h22: "22 days",
  volAxis: "Annualized volatility",
  innerBand: "Central 50%",
  outerBand: "Central 90%",
  pointForecast: "Point forecast",
  observed: "Observed",
  initialVol: "Starting volatility",
  simulatedMedian: "Simulated median",
  fanExplainTitle: "How to read the USD/JPY forecast",
  fanDataSummary:
    "The source is the Federal Reserve H.10 New York noon USD/JPY reference rate. The sample includes 2,720 valid fixes from 2016-01-04 through 2026-11-20. The model is fitted on the first 2,176 observations.",
  fanTargetNote:
    "At the origin, annualized variance is 252 times the mean of the latest five squared log rate changes. A step advances one published fix, skipping dates without quotes. At the fifth future fix, for example, the observed target uses the five changes ending at that fix.",
  fanEstimateNote:
    "The point forecast takes the square root of expected terminal variance. The simulated median is the 50th percentile of terminal volatility. Positive jumps can raise expected variance. All paths with no jumps decay to the same value, which can make quantiles coincide.",
  fanBandNote:
    "At each horizon, the central 50% and 90% bands span the 25th–75th and 5th–95th percentiles of the 20,000 simulated endpoints. These are per-horizon intervals for future shocks under fixed fitted parameters.",
  evaluationEyebrow: "Historical validation",
  evaluationTitle: "USD/JPY out-of-sample performance",
  evaluationIntro:
    "The training and holdout periods are fixed in chronological order. All three models are scored on the same holdout targets across the three horizons.",
  persistence: "Persistence",
  tableCaption: "Forecast errors on matched targets. Lower is better.",
  modelLabel: "Model",
  rmseLabel: "Volatility RMSE",
  coverage: "Observed coverage of 90% band",
  floorShare: "Observed below no-jump floor",
  diagnosticNote:
    "When observations regularly fall below the no-jump floor, model paths cannot reproduce those fast declines. Compare observed coverage against the nominal 90%.",
  equityTitle: "U.S. equity volatility models",
  equityIntro:
    "Choose a ticker, data frequency, and horizon. Models predict average daily variance over the next 1, 5, or 22 sessions, annualized using 252 trading days.",
  equityTicker: "Ticker",
  equityFrequency: "Data frequency",
  equityDaily: "Daily",
  equityIntraday: "1-minute data",
  equityDailyBasis: "Daily variance proxy from squared adjusted close-to-close log returns.",
  equityIntradayBasis:
    "Full-day variance proxy from 1-minute bars sampled at five-minute intervals. It adds regular-session realized variance and the squared overnight return.",
  equityCaption: "Lower errors are better. The lowest value in each column is highlighted.",
  equityQlike: "QLIKE difference",
  equityRmse: "Volatility RMSE (pp)",
  equitySample: "Out-of-sample evaluation",
  equityOriginCount: "Forecast origins",
  equityOriginDates: "Forecast origin range",
  equityTargetDates: "Target window end date range",
  equityMetricNote:
    "QLIKE differences are relative to the fixed training mean. Negative values beat that baseline. RMSE is in annualized volatility percentage points.",
  equityMethodNote: "Parameters are estimated on earlier data. Each frequency uses its own evaluation sample and variance measure.",
  equityDownload: "Download equity results",
  equityLoading: "Loading equity results…",
  equityLoadError: "Equity results could not be loaded. Reload the page to try again.",
  equityTrainingMean: "Fixed training mean",
  equityBest: "lowest error",
  equityFindingsLink: "See overall results",
  equityFindingsTitle: "Which models led out of sample?",
  equityFindingsCaption:
    "At each horizon, count each model that had the lowest out-of-sample QLIKE for a ticker. Daily estimates cover eight tickers per horizon. Minute-derived estimates cover seven.",
  equityFindingsWindow: "Data and horizon",
  equityFindingsWins: "Lowest QLIKE counts across all models",
  equityFindingsGamma: "Tickers where Gamma–OU beat both HAR and EWMA",
  equityFindingsReadingTitle: "How to read the all-model counts",
  equityFindingsReading:
    "Within each frequency and horizon, compare all available models for each ticker, including the fixed training mean. A model gets one count for the lowest QLIKE. Exact ties count for each tied model. For one-day forecasts with minute-derived data, HAR 4 means HAR had the lowest QLIKE for four of the seven tickers. The count shows how often a model led. Use the per-ticker results above to see the size of the differences.",
  equityGammaFindings:
    "The right column compares Gamma–OU with HAR and EWMA. For AMD with minute-derived data, Gamma–OU beat both at all three horizons, and the fixed training mean scored lower still. Gamma–OU led across all models on daily data for JPM at 5 days and for AMD and NBIS at 22 days. GARCH led on daily JPM at 1 day.",
  equityRmseFindings:
    "By volatility RMSE, Gamma–OU led on daily data for AVGO at 1 and 5 days, NBIS at 5 and 22 days, and AMD at 22 days. With minute-derived data, HAR led on 6 of 7 tickers at both 1 and 5 days and 5 of 7 at 22 days.",
  equityFindingsNote:
    "Daily and minute-derived estimates use separate historical holdouts. NBIS has its own shorter daily holdout. Gamma–OU point scores measure errors in the conditional mean.",
  methodEyebrow: "Model notes",
  methodTitle: "Jumps and mean reversion",
  methodIntro: "Gamma–OU uses an observed daily variance proxy as its state. Positive jumps represent shocks, followed by exponential decay.",
  dynamics: "Variance dynamics",
  modelCopy:
    "J is a compound Poisson process with intensity λk and exponential jump sizes of mean θ. Between jumps, V decays at rate λ. The stationary distribution is Gamma with shape k and scale θ.",
  calibrationCopy:
    "The training sample estimates long-run variance m, persistence φ = exp(−λ), and the Gamma parameters by moments. At each evaluation origin, the latest known variance updates the state while all fitted parameters stay fixed.",
  limitations: "Reading the USD/JPY results",
  limitationsCopy:
    "The target is the annualized five-change volatility proxy at the terminal observation. The conditional mean is the same as a mean-reverting AR(1) with the same parameters. Use interval coverage and the no-jump floor to assess what the jump distribution adds. The experiment does not estimate leverage, changing parameters, or trading performance.",
  equityMethodTitle: "Reading the U.S. equity results",
  equityMethodTarget:
    "Daily data use squared adjusted close-to-close log returns. The minute-derived measure adds regular-session realized variance and the squared overnight return. A five-day target, for example, averages daily variance over the five sessions after the origin and annualizes it by multiplying by 252. The square root expresses the target as annualized volatility.",
  equityMethodReading:
    "A positive Gamma–OU jump is a rise in variance. Both stock gains and losses contribute to variance. Gamma–OU point forecasts average conditional expected variance over the future sessions. An AR(1) with the same long-run mean and persistence gives the same point forecast. Equity QLIKE and RMSE measure historical point forecast errors. Testing the jump mechanism calls for a separate check of interval or tail-quantile calibration.",
  calibrated: "Parameters fitted on training data",
  longRunVol: "Long-run variance as volatility √m",
  dailyPersistence: "One-step persistence φ",
  halfLife: "Variance deviation half-life",
  shape: "Gamma shape k",
  jumpSize: "Mean variance jump θ",
  jumpIntensity: "Jump intensity λk",
  dataSources: "Data and reproducibility",
  dataMethodology: "Data sources and cleaning",
  sourceSummary:
    "USD/JPY comes from the Federal Reserve H.10 daily reference rate in yen per U.S. dollar. Annualized variance is 252 times the trailing mean of five squared changes in log rates. Its square root is the volatility proxy. One fixing per day leaves intraday moves unobserved.",
  sourceLink: "Federal Reserve H.10 data",
  downloadCsv: "Download observations CSV",
  downloadJson: "Download results JSON",
  dataNotes: "Download provenance record",
  sourceCode: "Project source code",
  reference: "Model reference",
  readPaper: "Read the paper",
  portfolio: "Runtian Miao’s personal site",
};

const zh = {
  skip: "跳到正文",
  navForecast: "预测",
  navEvaluation: "样本外检验",
  navEquity: "美股",
  navMethod: "方法",
  navData: "数据",
  heroEyebrow: "量化研究实验室",
  heroLineA: "用 Lévy 过程",
  heroLineB: "建模波动率",
  heroLede: "市场冲击可能使波动率跳升，随后逐步回落。这个实验用美元兑日元历史数据拟合这两种现象，再检验模型的样本外预测表现。",
  explore: "查看预测",
  readMethod: "阅读方法",
  historyTitle: "历史波动率代理量",
  training: "训练样本",
  holdout: "检验样本",
  loading: "正在加载历史数据和模型结果…",
  loadError: "无法加载模型结果。请通过 HTTP 打开页面，并确认 data/results.json 存在。",
  forecastEyebrow: "交互预测",
  forecastTitle: "从已知波动率出发",
  forecastIntro: "选择一个观察日期和预测窗口。色带显示从当日方差出发，经过随机跳跃与逐步衰减后的波动率分布。",
  forecastOrigin: "观察日期",
  forecastHorizon: "预测窗口",
  evaluationHorizon: "检验预测窗口",
  h1: "1 日",
  h5: "5 日",
  h22: "22 日",
  volAxis: "年化波动率",
  innerBand: "中央 50%",
  outerBand: "中央 90%",
  pointForecast: "点预测",
  observed: "实测",
  initialVol: "起始波动率",
  simulatedMedian: "模拟中位数",
  fanExplainTitle: "怎样读这张外汇预测图",
  fanDataSummary:
    "数据来自美联储 H.10 的 USD/JPY 纽约中午参考报价。样本包括 2016-01-04 至 2026-11-20 的 2,720 个有效报价，模型用最早的 2,176 个观测拟合。",
  fanTargetNote:
    "起点用最近五次对数汇率变化的平方均值乘以 252 得出年化方差。每一步对应下一个有效报价，跳过缺报价的日期。以之后第 5 个有效报价为例，该期限的实测按截至目标报价的最近五次变化计算。",
  fanEstimateNote:
    "点预测先求终点方差的条件期望，再开平方。模拟中位数是终点波动率的第 50 百分位。正向跳跃可以抬高平均方差，无跳跃的路径都沿同一轨迹衰减，因此部分分位数会重合。",
  fanBandNote:
    "每个期限分别取 20,000 条路径模拟终点的第 25 至 75 百分位和第 5 至 95 百分位，得到中央 50% 和 90% 色带。色带反映已拟合模型下的未来冲击，拟合参数保持固定。",
  evaluationEyebrow: "历史验证",
  evaluationTitle: "USD/JPY 样本外表现",
  evaluationIntro: "按时间顺序固定训练与检验样本。三个预测窗口使用相同的检验目标日期，并在这些日期比较模型和两个基准。",
  persistence: "持久性",
  tableCaption: "共同检验日期上的预测误差，越低越好",
  modelLabel: "模型",
  rmseLabel: "波动率 RMSE",
  coverage: "90% 区间实测覆盖率",
  floorShare: "落在无跳跃下界以下的比例",
  diagnosticNote: "实际方差若常低于无跳跃下界，说明模型难以复现这些快速回落。可比较实测覆盖率与区间的名义覆盖率 90%。",
  equityTitle: "美股波动率模型对比",
  equityIntro: "选择标的、数据频率和预测窗口。模型预测未来 1、5 或 22 个交易日的平均日度方差，再按 252 个交易日年化。",
  equityTicker: "标的",
  equityFrequency: "数据频率",
  equityDaily: "日线",
  equityIntraday: "分钟线",
  equityDailyBasis: "用复权收盘到收盘的对数收益平方作为日度方差代理量。",
  equityIntradayBasis: "将 1 分钟行情按 5 分钟区间取样，计算常规交易时段的已实现方差，再加上隔夜收益平方，得到全日方差代理量。",
  equityCaption: "两项误差指标均为越低越好，每列最低值高亮。",
  equityQlike: "QLIKE 差值",
  equityRmse: "波动率 RMSE（百分点）",
  equitySample: "样本外检验",
  equityOriginCount: "预测起点数",
  equityOriginDates: "预测起点范围",
  equityTargetDates: "目标窗口结束日期范围",
  equityMetricNote: "QLIKE 差值以固定训练均值为基准。负值表示误差低于基准。RMSE 使用年化波动率的百分点。",
  equityMethodNote: "模型参数由较早的训练样本估计。日线和分钟线各用自己的检验样本与方差口径。",
  equityDownload: "下载美股评估结果",
  equityLoading: "正在加载美股评估结果…",
  equityLoadError: "无法加载美股评估结果。请刷新页面重试。",
  equityTrainingMean: "固定训练均值",
  equityBest: "最低误差",
  equityFindingsLink: "查看总体结果",
  equityFindingsTitle: "哪些模型在样本外领先？",
  equityFindingsCaption: "在每个标的与预测期限上，样本外 QLIKE 最低的模型记 1 次。日线每个期限评估 8 个标的，分钟线评估 7 个。",
  equityFindingsWindow: "频率与期限",
  equityFindingsWins: "全模型 QLIKE 最低次数",
  equityFindingsGamma: "Gamma–OU 同时低于 HAR 与 EWMA 的标的",
  equityFindingsReadingTitle: "怎样理解「全模型 QLIKE 最低次数」",
  equityFindingsReading:
    "对固定的数据口径和期限，先逐个标的比较该行全部可用模型，含固定训练均值。QLIKE 最低的模型得到一次计数，精确并列则各计一次。比如分钟线 1 日的 HAR 4，表示 7 个标的中有 4 个由 HAR 得到最低 QLIKE。计数反映领先覆盖了多少标的。误差差距可在上方的逐标的结果中查看。",
  equityGammaFindings:
    "右栏只比较 Gamma–OU、HAR 和 EWMA。以 AMD 分钟线为例，Gamma–OU 在三个期限的 QLIKE 都低于 HAR 和 EWMA，同一组的固定训练均值更低。Gamma–OU 的全模型最低记录来自日线 JPM（5 日）及 AMD 和 NBIS（22 日）。 日线 JPM 的 1 日最低值来自 GARCH。",
  equityRmseFindings:
    "按波动率 RMSE 衡量，Gamma–OU 在日线 AVGO（1、5 日）、NBIS（5、22 日）和 AMD（22 日）上最低。HAR 在分钟线 1、5、22 日分别有 6/7、6/7、5/7 个标的的 RMSE 最低。",
  equityFindingsNote: "日线和分钟线使用各自的历史检验样本。NBIS 日线采用单独的较短样本。Gamma–OU 的点预测分数反映条件均值的误差。",
  methodEyebrow: "模型说明",
  methodTitle: "跳跃与均值回归",
  methodIntro: "Gamma–OU 把每日方差代理量作为可观测状态，用正向跳跃刻画冲击，再用指数衰减刻画冲击后的回落。",
  dynamics: "方差动态",
  modelCopy:
    "J 是强度为 λk 的复合 Poisson 过程。跳跃大小服从均值为 θ 的指数分布。在跳跃之间，V 以速率 λ 衰减。在平稳状态下，V 服从形状 k、尺度 θ 的 Gamma 分布。",
  calibrationCopy: "用训练样本和矩估计确定长期方差 m、持续性 φ = exp(−λ) 和 Gamma 参数。每个检验时点用当时已知的方差更新预测状态，模型参数保持固定。",
  limitations: "怎样解读外汇结果",
  limitationsCopy:
    "预测目标是窗口末端由最近五次汇率变化计算的年化波动率代理量。相同参数下，Gamma–OU 的条件均值与均值回归 AR(1) 一致。检验跳跃分布时，可重点看预测区间覆盖率和无跳跃下界。实验没有估计杠杆效应、参数变化或交易表现。",
  equityMethodTitle: "怎样解读美股结果",
  equityMethodTarget:
    "日线用相邻交易日的复权收盘对数收益平方。分钟线用常规时段已实现方差加隔夜收益平方。以 5 日为例，目标是起点之后五个交易日的日度方差取平均，再乘以 252 年化。对应的年化波动率取这个目标的平方根。",
  equityMethodReading:
    "Gamma–OU 的正向跳跃指方差上升，股票上涨或下跌都可能贡献方差。Gamma–OU 的点预测对未来每一步的条件期望方差取平均，与长期均值和持续性相同的 AR(1) 给出相同的点预测。美股表的 QLIKE 和 RMSE 比较这些点预测的历史误差。要检验跳跃机制，需要另外比较预测区间或尾部分位数的校准。",
  calibrated: "训练样本拟合参数",
  longRunVol: "长期方差对应波动率 √m",
  dailyPersistence: "单日持续性 φ",
  halfLife: "方差偏离半衰期",
  shape: "Gamma 形状 k",
  jumpSize: "平均方差跳幅 θ",
  jumpIntensity: "每日跳跃强度 λk",
  dataSources: "数据与复现",
  dataMethodology: "数据来源与清洗",
  sourceSummary:
    "美元兑日元来自美联储 H.10 日度参考汇率，单位为日元／美元。把最近五个对数汇率变化的平方取平均，乘以 252 得到年化方差代理量，再取平方根。每天只有一个定点报价，因此该代理量无法捕捉日内波动。",
  sourceLink: "美联储 H.10 原始数据",
  downloadCsv: "下载观测 CSV",
  downloadJson: "下载结果 JSON",
  dataNotes: "下载来源记录",
  sourceCode: "查看项目源代码",
  reference: "模型参考",
  readPaper: "阅读论文",
  portfolio: "Runtian Miao 的个人网站",
};

const byId = (id) => document.getElementById(id);
const text = (id, value) => {
  byId(id).textContent = value;
};
const percentage = (value, digits = 2) => (Number.isFinite(value) ? `${(100 * value).toFixed(digits)}%` : "—");
const fixed = (value, digits) => (Number.isFinite(value) ? value.toFixed(digits) : "—");
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

const colors = {
  actual: "#263731",
  levy: "#287850",
  ewma: "#a35332",
  persistence: "#5c6688",
  history: "#a8bd9c",
  holdout: "#c5e87e",
  innerBand: "#a8d2b2",
  outerBand: "#dfeedd",
  light: { grid: "#e0e7dc", label: "#52665a", cross: "#759181" },
  dark: { grid: "#66817060", label: "#cad6c8", cross: "#a9bea6" },
};

let language = "zh";
try {
  language = localStorage.getItem("levy-lab-language") === "en" ? "en" : "zh";
} catch {
  // Keep Chinese available when storage is disabled.
}

const translate = (key) => (language === "en" ? en : zh)[key];
const localText = (english, chinese) => (language === "en" ? english : chinese);
const countText = (value) => value.toLocaleString(language === "en" ? "en-US" : "zh-CN");
const horizons = [1, 5, 22];
const state = {
  data: null,
  observations: new Map(),
  fans: [],
  currentFan: 0,
  forecastHorizon: 5,
  evaluationHorizon: 5,
  visible: new Set(["levy", "ewma"]),
  hover: { history: null, fan: null, evaluation: null },
  plots: {},
};
const equity = {
  results: null,
  error: false,
  ticker: "AMD",
  frequency: "daily",
  horizon: 5,
};
const equityFrequencies = ["daily", "intraday"];
const equityModelNames = { ewma: "EWMA", har_direct: "HAR", gamma_ou: "Gamma–OU", garch: "GARCH(1,1)" };
const equityModelName = (model) => equityModelNames[model] ?? translate("equityTrainingMean");

function translatePage() {
  document.documentElement.lang = localText("en", "zh-CN");
  document.title = localText("Lévy Volatility Lab", "Lévy 波动率实验室");
  for (const el of document.querySelectorAll("[data-i18n]")) {
    el.textContent = translate(el.dataset.i18n);
  }
  for (const el of document.querySelectorAll("[data-aria]")) {
    el.setAttribute("aria-label", translate(el.dataset.aria));
  }
  text("language", localText("中文", "EN"));
  byId("language").setAttribute("aria-label", localText("切换至中文", "Switch to English"));
  if (byId("status").classList.contains("error")) text("status", translate("loadError"));
}

function applySummary() {
  const { data, model } = state.data;
  text("sampleRange", `${data.start.slice(0, 4)}–${data.end.slice(0, 4)} · N=${countText(data.count)}`);
  text("holdoutPeriod", `${translate("holdout")} ${data.test_start} – ${data.test_end}`);
  text("calibrationPeriod", `${data.train_start} – ${data.train_end} · N=${countText(data.train_count)}`);
  text("modelMean", percentage(model.mean_volatility));
  text("modelPhi", fixed(model.phi, 3));
  text("modelHalfLife", localText(`${fixed(model.half_life_sessions, 2)} sessions`, `${fixed(model.half_life_sessions, 2)} 日`));
  text("modelGamma", fixed(model.gamma_shape, 3));
  text("modelScale", fixed(model.gamma_scale, 5));
  text("modelIntensity", `${fixed(model.jump_intensity, 2)} / ${localText("session", "日")}`);
}

function populateOrigins() {
  const options = state.fans.map((fan, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = index === 0 ? localText(`${fan.as_of} (latest)`, `${fan.as_of}（最新）`) : fan.as_of;
    return option;
  });
  const select = byId("originSelect");
  select.replaceChildren(...options);
  select.value = String(state.currentFan);
}

function currentFan() {
  return state.fans[state.currentFan];
}

function currentEvaluation() {
  return state.data.evaluation.find((item) => item.horizon === state.evaluationHorizon);
}

function targetObserved(item) {
  return state.observations.get(item.target_date)?.volatility ?? null;
}

function range(lo, hi) {
  return `${percentage(lo)}–${percentage(hi)}`;
}

function updateForecastView() {
  const fan = currentFan();
  const item = fan.series.find((candidate) => candidate.horizon === state.forecastHorizon);
  const days = translate(`h${item.horizon}`);
  const forecastsAreHistorical = Boolean(item.target_date);
  text("fanCaption", localText(`${countText(fan.paths)} simulated paths`, `${countText(fan.paths)} 条模拟路径`));
  text("forecastAsOf", forecastsAreHistorical ? `${item.target_date} · +${days}` : `${fan.as_of} · +${days}`);
  text("pointForecast", percentage(item.mean));
  text("initialVol", percentage(fan.initial_volatility));
  text("observedVol", forecastsAreHistorical ? percentage(targetObserved(item)) : localText("Unavailable", "未观测"));
  text("fanMedian", percentage(item.q50));
  text("interval50", range(item.q25, item.q75));
  text("interval90", range(item.q05, item.q95));
  const observedReading = forecastsAreHistorical
    ? localText(
        `The observed proxy on ${item.target_date} was ${percentage(targetObserved(item))}.`,
        `${item.target_date} 的实测代理量为 ${percentage(targetObserved(item))}。`
      )
    : localText("The target lies beyond the stored sample, so the observed value is unavailable.", "目标报价在样本截止日之后，因此实测为空。");
  text(
    "fanReading",
    localText(
      `Starting from ${percentage(fan.initial_volatility)} on ${fan.as_of}, the forecast ${item.horizon} valid fixes ahead is ${percentage(
        item.mean
      )}. The simulated median is ${percentage(item.q50)} and the central 90% interval is ${range(item.q05, item.q95)}. ${observedReading}`,
      `从 ${fan.as_of} 的 ${percentage(fan.initial_volatility)} 出发，之后第 ${item.horizon} 个有效报价对应的波动率点预测为 ${percentage(
        item.mean
      )}，模拟中位数为 ${percentage(item.q50)}，中央 90% 区间为 ${range(item.q05, item.q95)}。${observedReading}`
    )
  );
  byId("fanReading").hidden = false;
  const label = localText(
    `Forecast distribution as of ${fan.as_of}. Horizon ${days}. The point forecast is ${percentage(
      item.mean
    )} and the central 90% interval is ${range(item.q05, item.q95)}. Use arrow keys to explore.`,
    `${fan.as_of} 观察点的预测区间。${days}后点预测 ${percentage(item.mean)}，中央 90% 区间 ${range(item.q05, item.q95)}。可用左右方向键查看。`
  );
  byId("fanChart").setAttribute("aria-label", label);
  drawFan();
}

function updateEvaluationView() {
  const evaluation = currentEvaluation();
  text("evaluationCount", localText(`${countText(evaluation.count)} matched targets`, `${countText(evaluation.count)} 个共同检验日期`));
  const models = Object.keys(evaluation.metrics);
  const bestQlike = Math.min(...models.map((key) => evaluation.metrics[key].qlike));
  const bestRmse = Math.min(...models.map((key) => evaluation.metrics[key].rmse_volatility));
  for (const key of models) {
    const metric = evaluation.metrics[key];
    text(`${key}Qlike`, fixed(metric.qlike, 4));
    text(`${key}Rmse`, localText(`${fixed(metric.rmse_volatility * 100, 2)} pp`, `${fixed(metric.rmse_volatility * 100, 2)} 个百分点`));
    byId(`${key}Qlike`).classList.toggle("best", metric.qlike === bestQlike);
    byId(`${key}Rmse`).classList.toggle("best", metric.rmse_volatility === bestRmse);
  }
  text("coverage", percentage(evaluation.coverage_90, 1));
  text("floorShare", percentage(evaluation.below_support_share, 1));
  const overlap = evaluation.overlap_returns ?? 0;
  const overlapNote =
    overlap > 0
      ? localText(
          `The origin and target share ${overlap} of their five squared returns. This overlap contributes to apparent persistence.`,
          `起点与目标的五次变化中有 ${overlap} 次重叠，重叠会增加序列的表观持续性。`
        )
      : localText("The origin and target five-return windows do not overlap.", "起点与目标的五次变化窗口不重叠。");
  text(
    "metricNote",
    localText(
      `QLIKE evaluates variance forecasts. RMSE evaluates volatility in percentage points. EWMA uses decay ${state.data.settings.ewma_decay}, and persistence carries forward the last known variance. ${overlapNote}`,
      `QLIKE 衡量方差预测，RMSE 则用波动率百分点计算。EWMA 的衰减系数为 ${state.data.settings.ewma_decay}，持久性基准沿用最近已知方差。${overlapNote}`
    )
  );
  byId("evaluationChart").setAttribute(
    "aria-label",
    localText(
      `Observed and forecast volatility on ${evaluation.count} holdout targets. Forecast horizon ${translate(
        `h${evaluation.horizon}`
      )}. Use arrow keys to explore.`,
      `${evaluation.count} 个检验日期的实测与预测波动率，预测窗口 ${translate(`h${evaluation.horizon}`)}。可用左右方向键查看。`
    )
  );
  drawEvaluation();
}

function axisScale(highest) {
  const raw = Math.max(highest * 1.05, 0.01) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const unit = [1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude >= raw);
  const step = unit * magnitude;
  return { step, upper: Math.ceil((highest * 1.05) / step) * step || step };
}

function setupPlot(canvas, highest, points, palette) {
  const bounds = canvas.getBoundingClientRect();
  const width = bounds.width;
  const height = bounds.height;
  if (width < 75 || height < 60) return null;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(width * ratio);
  const pixelHeight = Math.round(height * ratio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const box = { left: 43, right: width - 9, top: 12, bottom: height - 27 };
  const { step, upper } = axisScale(highest);
  const plot = {
    ctx,
    width,
    height,
    box,
    palette,
    x: (index) => box.left + (index * (box.right - box.left)) / Math.max(points - 1, 1),
    y: (value) => box.bottom - (value * (box.bottom - box.top)) / upper,
  };

  ctx.font = "11px Consolas, monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = palette.label;
  const decimals = step < 0.01 ? 1 : 0;
  for (let tick = 0; tick <= Math.round(upper / step); tick++) {
    const v = tick * step;
    const y = plot.y(v);
    line(plot, box.left, y, box.right, y, palette.grid);
    ctx.fillText(percentage(v, decimals), box.left - 7, y);
  }
  return plot;
}

function line(plot, x1, y1, x2, y2, color, dash = []) {
  const { ctx } = plot;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function dot(plot, index, value, color, radius = 3.5) {
  if (!Number.isFinite(value)) return;
  const { ctx, x, y } = plot;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x(index), y(value), radius, 0, Math.PI * 2);
  ctx.fill();
}

function seriesLine(plot, series, key, color, options = {}) {
  const { ctx, x, y } = plot;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = options.width ?? 1.65;
  ctx.setLineDash(options.dash ?? []);
  ctx.lineJoin = "round";
  ctx.beginPath();
  let started = false;
  series.forEach((item, index) => {
    if (!Number.isFinite(item[key])) {
      started = false;
      return;
    }
    const xi = x(index + (options.offset ?? 0));
    const yi = y(item[key]);
    if (started) ctx.lineTo(xi, yi);
    else ctx.moveTo(xi, yi);
    started = true;
  });
  ctx.stroke();
  ctx.restore();
}

function fillBand(plot, series, low, high, color) {
  const { ctx, x, y } = plot;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x(0), y(series[0][high]));
  for (let i = 1; i < series.length; i++) ctx.lineTo(x(i), y(series[i][high]));
  for (let i = series.length - 1; i >= 0; i--) ctx.lineTo(x(i), y(series[i][low]));
  ctx.closePath();
  ctx.fill();
}

function axisLabels(plot, labels) {
  const { ctx, box, x, palette } = plot;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = palette.label;
  for (const [index, label] of labels) {
    const halfLabel = ctx.measureText(label).width / 2;
    const pixel = x(index);
    line(plot, pixel, box.bottom, pixel, box.bottom + 4, palette.grid);
    ctx.fillText(label, clamp(pixel, box.left + halfLabel, box.right - halfLabel), box.bottom + 8);
  }
}

function evenDateLabels(series, plot, showYearOnly) {
  const steps = clamp(Math.floor((plot.box.right - plot.box.left) / 79), 2, 5);
  return Array.from({ length: steps + 1 }, (_, step) => {
    const index = Math.round((step * (series.length - 1)) / steps);
    const date = series[index].date;
    return [index, showYearOnly ? date.slice(0, 4) : date.slice(0, 7)];
  });
}

function setPlot(key, plot, points) {
  state.plots[key] = { left: plot.box.left, right: plot.box.right, points };
}

function crosshair(plot, index) {
  line(plot, plot.x(index), plot.box.top, plot.x(index), plot.box.bottom, plot.palette.cross, [3, 4]);
}

function drawHistory() {
  const { history, data } = state.data;
  const highest = Math.max(...history.map((point) => point.volatility));
  const plot = setupPlot(byId("historyChart"), highest, history.length, colors.dark);
  if (!plot) return;
  setPlot("history", plot, history.length);
  const { ctx, box, x } = plot;
  const split = data.train_count;
  const splitX = x(split - 0.5);
  ctx.fillStyle = "#c5e87e0e";
  ctx.fillRect(splitX, box.top, box.right - splitX, box.bottom - box.top);
  line(plot, splitX, box.top, splitX, box.bottom, "#a8bd9c88", [3, 5]);
  seriesLine(plot, history.slice(0, split), "volatility", colors.history, { width: 1.15 });
  seriesLine(plot, history.slice(split - 1), "volatility", colors.holdout, { offset: split - 1, width: 1.45 });
  axisLabels(plot, evenDateLabels(history, plot, true));

  const index = state.hover.history ?? history.length - 1;
  const item = history[index];
  if (state.hover.history !== null) {
    crosshair(plot, index);
    dot(plot, index, item.volatility, colors.holdout);
  }
  text("historyReadout", `${item.date} · ${percentage(item.volatility)} · ${translate(index < split ? "training" : "holdout")}`);
  byId("historyChart").setAttribute(
    "aria-label",
    localText(
      `USD/JPY historical annualized volatility proxy from ${data.start} to ${data.end}, with holdout from ${data.test_start}. Use arrow keys to explore.`,
      `美元兑日元历史年化波动率代理量，${data.start} 至 ${data.end}。检验样本从 ${data.test_start} 开始。可用左右方向键查看。`
    )
  );
}

function drawFan() {
  const fan = currentFan();
  const series = fan.series.map((point) => ({ ...point, observed: targetObserved(point) }));
  const highest = Math.max(...series.flatMap((point) => [point.q95, point.observed ?? 0, point.mean]));
  const plot = setupPlot(byId("fanChart"), highest, series.length, colors.light);
  if (!plot) return;
  setPlot("fan", plot, series.length);
  fillBand(plot, series, "q05", "q95", colors.outerBand);
  fillBand(plot, series, "q25", "q75", colors.innerBand);
  seriesLine(plot, series, "mean", colors.levy, { width: 2.5 });
  seriesLine(plot, series, "observed", colors.actual, { width: 1.8, dash: [4, 4] });
  const labelDays = plot.width < 360 ? [0, 5, 15, 22] : [0, 5, 10, 15, 22];
  axisLabels(
    plot,
    labelDays.map((index) => [index, localText(`+${index}d`, `+${index}日`)])
  );
  const index = state.hover.fan ?? state.forecastHorizon;
  const point = series[index];
  crosshair(plot, index);
  dot(plot, index, point.mean, colors.levy, 4.7);
  dot(plot, index, point.observed, colors.actual);
  const caption = localText(
    `+${index}d · Point ${percentage(point.mean)} · 90% band ${range(point.q05, point.q95)}`,
    `+${index}日 · 点预测 ${percentage(point.mean)} · 90% 区间 ${range(point.q05, point.q95)}`
  );
  text("fanReadout", caption);
}

function drawEvaluation() {
  const { series } = currentEvaluation();
  const visible = ["actual", ...state.visible];
  const highest = Math.max(...series.flatMap((item) => visible.map((key) => item[key])));
  const plot = setupPlot(byId("evaluationChart"), highest, series.length, colors.light);
  if (!plot) return;
  setPlot("evaluation", plot, series.length);
  seriesLine(plot, series, "actual", colors.actual, { width: 1.1 });
  for (const key of state.visible) seriesLine(plot, series, key, colors[key], { width: 1.8 });
  axisLabels(plot, evenDateLabels(series, plot, false));
  const index = state.hover.evaluation ?? series.length - 1;
  const item = series[index];
  if (state.hover.evaluation !== null) {
    crosshair(plot, index);
    for (const key of visible) dot(plot, index, item[key], colors[key]);
  }
  const detail = {
    actual: translate("observed"),
    levy: "Gamma–OU",
    ewma: "EWMA",
    persistence: translate("persistence"),
  };
  text("evaluationReadout", [item.date, ...visible.map((key) => `${detail[key]} ${percentage(item[key])}`)].join(" · "));
}

const painters = { history: drawHistory, fan: drawFan, evaluation: drawEvaluation };
const canvasIds = { history: "historyChart", fan: "fanChart", evaluation: "evaluationChart" };

function bindChartInteraction(key) {
  const canvas = byId(canvasIds[key]);
  const draw = painters[key];
  let frame;
  function changeSelection(index) {
    if (state.hover[key] === index) return;
    state.hover[key] = index;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(draw);
  }

  canvas.addEventListener("pointermove", (event) => {
    const plot = state.plots[key];
    if (!plot) return;
    const x = event.clientX - canvas.getBoundingClientRect().left;
    const index = Math.round(((x - plot.left) * (plot.points - 1)) / (plot.right - plot.left));
    changeSelection(clamp(index, 0, plot.points - 1));
  });
  canvas.addEventListener("pointerleave", () => {
    if (state.data) changeSelection(null);
  });
  canvas.addEventListener("blur", () => {
    if (state.data) changeSelection(null);
  });
  canvas.addEventListener("keydown", (event) => {
    const plot = state.plots[key];
    if (!plot || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = state.hover[key] ?? (key === "fan" ? state.forecastHorizon : plot.points - 1);
    if (event.key === "Home") changeSelection(0);
    else if (event.key === "End") changeSelection(plot.points - 1);
    else changeSelection(clamp(current + (event.key === "ArrowRight" ? 1 : -1), 0, plot.points - 1));
  });
}

function bindHorizon(id, onChange) {
  bindSegments(id, (button) => onChange(Number(button.dataset.horizon)));
}

function bindSegments(id, onChange) {
  const buttons = Array.from(byId(id).querySelectorAll("button"));
  for (const button of buttons) {
    button.disabled = false;
    button.addEventListener("click", () => {
      for (const option of buttons) option.setAttribute("aria-pressed", String(option === button));
      onChange(button);
    });
  }
}

function render() {
  applySummary();
  populateOrigins();
  updateForecastView();
  updateEvaluationView();
  drawHistory();
}

function connectControls() {
  byId("originSelect").disabled = false;
  byId("originSelect").addEventListener("change", (event) => {
    state.currentFan = Number(event.target.value);
    state.hover.fan = null;
    updateForecastView();
  });
  bindHorizon("forecastHorizon", (horizon) => {
    state.forecastHorizon = horizon;
    state.hover.fan = null;
    updateForecastView();
  });
  bindHorizon("evaluationHorizon", (horizon) => {
    state.evaluationHorizon = horizon;
    state.hover.evaluation = null;
    updateEvaluationView();
  });
  for (const checkbox of document.querySelectorAll(".evaluation-legend input")) {
    checkbox.addEventListener("change", (event) => {
      if (event.target.checked) state.visible.add(event.target.value);
      else state.visible.delete(event.target.value);
      drawEvaluation();
    });
  }
  const resizeObserver = new ResizeObserver(() => {
    for (const paint of Object.values(painters)) paint();
  });
  for (const key of Object.keys(painters)) {
    bindChartInteraction(key);
    resizeObserver.observe(byId(canvasIds[key]).parentElement);
  }
}

function assertResults(data) {
  const completeHistory = data.history?.length === data.data?.count && data.history.length > 0;
  const completeEvaluation = horizons.every((horizon) => data.evaluation?.some((item) => item.horizon === horizon && item.series?.length));
  const completeForecast = data.fan?.series?.length === 23 && data.fan.series[22].horizon === 22;
  if (data.schema_version !== 1 || !completeHistory || !completeEvaluation || !completeForecast) {
    throw new Error("Incomplete or incompatible results.json");
  }
}

async function loadResults() {
  try {
    const response = await fetch("data/results.json");
    if (!response.ok) throw new Error(`Results request returned ${response.status}`);
    const data = await response.json();
    assertResults(data);
    state.data = data;
    state.observations = new Map(data.history.map((row) => [row.date, row]));
    state.fans = [data.fan, ...(data.historical_fans ?? []).slice().reverse()];
    connectControls();
    render();
    byId("status").hidden = true;
  } catch (error) {
    byId("status").classList.add("error");
    text("status", translate("loadError"));
    console.error(error);
  }
}

function equityMetricLeaders(scores, metric) {
  const entries = Object.entries(scores);
  const value = Math.min(...entries.map(([, score]) => score[metric]));
  return { value, models: entries.filter(([, score]) => score[metric] === value).map(([model]) => model) };
}

function equityScoreText(metric, value) {
  const score = fixed(value, metric === "qlike" ? 4 : 2);
  return metric === "qlike" && value > 0 ? `+${score}` : score;
}

function equityScoreRows(scores, leaders) {
  return Object.entries(scores).map(([model, score]) => {
    const row = document.createElement("tr");
    const name = document.createElement("th");
    name.scope = "row";
    name.textContent = equityModelName(model);
    row.append(name);
    for (const [metric, leader] of Object.entries(leaders)) {
      const cell = document.createElement("td");
      cell.textContent = equityScoreText(metric, score[metric]);
      if (score[metric] === leader.value) {
        cell.className = "best";
        cell.setAttribute("aria-label", `${cell.textContent}, ${translate("equityBest")}`);
      }
      row.append(cell);
    }
    return row;
  });
}

function equityVerdict(selection, leaders) {
  const { qlike, rmse } = leaders;
  const names = new Intl.ListFormat(localText("en-US", "zh-CN"));
  const qlikeNames = names.format(qlike.models.map(equityModelName));
  const rmseNames = names.format(rmse.models.map(equityModelName));
  const qlikeValue = equityScoreText("qlike", qlike.value);
  const rmseValue = equityScoreText("rmse", rmse.value);
  const reading =
    qlikeNames === rmseNames
      ? localText(
          `In the ${selection} holdout, ${qlikeNames} had the lowest QLIKE difference (${qlikeValue}) and volatility RMSE (${rmseValue} pp).`,
          `在 ${selection} 的样本外检验中，${qlikeNames} 的 QLIKE 差值（${qlikeValue}）和波动率 RMSE（${rmseValue} 个百分点）均最低。`
        )
      : localText(
          `In the ${selection} holdout, ${qlikeNames} had the lowest QLIKE difference (${qlikeValue}), and ${rmseNames} had the lowest volatility RMSE (${rmseValue} pp).`,
          `在 ${selection} 的样本外检验中，${qlikeNames} 的 QLIKE 差值最低（${qlikeValue}），${rmseNames} 的波动率 RMSE 最低（${rmseValue} 个百分点）。`
        );
  return `${reading} ${localText(
    "Rankings can change with the ticker, data frequency, horizon, or holdout sample.",
    "换标的、数据口径、期限或检验样本，排名可能改变。"
  )}`;
}

function renderEquity() {
  const status = byId("equityStatus");
  if (!equity.results) {
    status.classList.toggle("error", equity.error);
    status.textContent = translate(equity.error ? "equityLoadError" : "equityLoading");
    return;
  }

  const daily = equity.frequency === "daily";
  const mode = equity.results[equity.ticker][equity.frequency];
  const selection = `${equity.ticker} · ${translate(daily ? "equityDaily" : "equityIntraday")}`;
  const evaluated = mode.status === "evaluated";
  text("equityTarget", translate(daily ? "equityDailyBasis" : "equityIntradayBasis"));
  byId("equityTarget").hidden = false;
  byId("equityResults").hidden = !evaluated;
  status.classList.toggle("equity-announcement", evaluated);
  if (!evaluated) {
    status.textContent = localText(
      `${selection} has insufficient history (${mode.start} to ${mode.end}) for the fixed split and all three horizons. The evaluation needs at least ${mode.required_training} training sessions and ${mode.required_test_origins} out-of-sample forecast origins.`,
      `${selection} 的历史区间（${mode.start} 至 ${mode.end}）不足以按固定规则划分训练与检验样本并覆盖三个预测窗口。评估至少需要 ${mode.required_training} 个训练交易日和 ${mode.required_test_origins} 个样本外预测起点。`
    );
    return;
  }

  const result = mode.horizons[equity.horizon];
  const selectedHorizon = `${selection} · ${translate(`h${equity.horizon}`)}`;
  status.textContent = `${selectedHorizon} · ${translate("equityOriginCount")} ${countText(mode.origins)}`;
  text("equityOrigins", countText(mode.origins));
  text("equityOriginRange", `${mode.first_origin} – ${mode.last_origin}`);
  text("equityTargetRange", `${result.target_start} – ${result.target_end}`);
  const leaders = { qlike: equityMetricLeaders(result.scores, "qlike"), rmse: equityMetricLeaders(result.scores, "rmse") };
  byId("equityScores").replaceChildren(...equityScoreRows(result.scores, leaders));
  text("equityVerdict", equityVerdict(selectedHorizon, leaders));
}

function equityFindingsRows() {
  return equityFrequencies.flatMap((frequency) => {
    const evaluated = Object.entries(equity.results).filter(([, modes]) => modes[frequency].status === "evaluated");
    const frequencyName = translate(frequency === "daily" ? "equityDaily" : "equityIntraday");
    return horizons.map((horizon) => {
      const wins = new Map();
      const gammaAhead = [];
      for (const [ticker, modes] of evaluated) {
        const { scores } = modes[frequency].horizons[horizon];
        for (const model of equityMetricLeaders(scores, "qlike").models) wins.set(model, (wins.get(model) ?? 0) + 1);
        if (scores.gamma_ou.qlike < Math.min(scores.har_direct.qlike, scores.ewma.qlike)) gammaAhead.push(ticker);
      }

      const row = document.createElement("tr");
      row.dataset.frequency = frequency;
      row.dataset.horizon = String(horizon);
      const heading = document.createElement("th");
      heading.scope = "row";
      heading.textContent = `${frequencyName} · ${translate(`h${horizon}`)}`;
      const counts = document.createElement("td");
      const chips = document.createElement("div");
      chips.className = "findings-counts";
      for (const [model, winsCount] of [...wins.entries()].sort((a, b) => b[1] - a[1])) {
        const chip = document.createElement("span");
        chip.dataset.model = model;
        chip.textContent = `${equityModelName(model)} ${winsCount}`;
        chips.append(chip);
      }
      counts.append(chips);
      const tickers = document.createElement("td");
      tickers.dataset.gammaAhead = "";
      tickers.textContent = gammaAhead.join(", ") || "—";
      row.append(heading, counts, tickers);
      return row;
    });
  });
}

function renderEquityFindings() {
  const status = byId("equityFindingsStatus");
  status.hidden = Boolean(equity.results);
  byId("equityFindingsContent").hidden = !equity.results;
  if (!equity.results) {
    status.textContent = translate(equity.error ? "equityLoadError" : "equityLoading");
    return;
  }
  byId("equityFindingsRows").replaceChildren(...equityFindingsRows());
}

function connectEquityControls(symbols) {
  const select = byId("equityTicker");
  select.replaceChildren(...symbols.map((symbol) => new Option(symbol, symbol)));
  equity.ticker = symbols.includes(equity.ticker) ? equity.ticker : symbols[0];
  select.value = equity.ticker;
  select.disabled = false;
  select.addEventListener("change", () => {
    equity.ticker = select.value;
    renderEquity();
  });
  bindSegments("equityFrequency", (button) => {
    equity.frequency = button.dataset.frequency;
    renderEquity();
  });
  bindHorizon("equityHorizon", (horizon) => {
    equity.horizon = horizon;
    renderEquity();
  });
}

function assertEquityResults(data) {
  const allModesReady =
    data.symbols?.length &&
    data.symbols.every((symbol) =>
      equityFrequencies.every((frequency) => {
        const mode = data.results?.[symbol]?.[frequency];
        if (mode?.status === "skipped") return mode.reason === "insufficient-span";
        return mode?.status === "evaluated" && horizons.every((horizon) => mode.horizons?.[horizon]?.scores);
      })
    );
  if (data.schema_version !== 1 || !allModesReady) throw new Error("Incomplete or incompatible equity-results.json");
}

async function loadEquityResults() {
  try {
    const response = await fetch("data/equity-results.json");
    if (!response.ok) throw new Error(`Equity results request returned ${response.status}`);
    const data = await response.json();
    assertEquityResults(data);
    equity.results = data.results;
    connectEquityControls(data.symbols);
    renderEquity();
    renderEquityFindings();
  } catch (error) {
    equity.results = null;
    equity.error = true;
    renderEquity();
    renderEquityFindings();
    console.error(error);
  }
}

byId("language").addEventListener("click", () => {
  language = language === "en" ? "zh" : "en";
  try {
    localStorage.setItem("levy-lab-language", language);
  } catch {
    /* Storage is optional. */
  }
  translatePage();
  if (state.data) render();
  renderEquity();
  renderEquityFindings();
});

translatePage();
loadResults();
renderEquity();
loadEquityResults();
