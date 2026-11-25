"use strict";

const en = {
  skip: "Skip to content",
  navForecast: "Forecast",
  navEvaluation: "Evaluation",
  navMethod: "Method",
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
  fanNote:
    "A step advances one published rate. The point forecast is the square root of conditional expected variance. Paths with no jump share the same decline, so some quantiles can coincide. The bands omit parameter uncertainty.",
  evaluationEyebrow: "Historical validation",
  evaluationTitle: "Out-of-sample performance",
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
  methodEyebrow: "Model notes",
  methodTitle: "Jumps and mean reversion",
  methodIntro: "Gamma–OU uses an observed daily variance proxy as its state. Positive jumps represent shocks, followed by exponential decay.",
  dynamics: "Variance dynamics",
  modelCopy:
    "J is a compound Poisson process with intensity λk and exponential jump sizes of mean θ. Between jumps, V decays at rate λ. The stationary distribution is Gamma with shape k and scale θ.",
  calibrationCopy:
    "The training sample estimates long-run variance m, persistence φ = exp(−λ), and the Gamma parameters by moments. At each evaluation origin, the latest known variance updates the state while all fitted parameters stay fixed.",
  limitations: "Interpreting the results",
  limitationsCopy:
    "The target is the annualized five-change volatility proxy at the terminal observation. The conditional mean is the same as a mean-reverting AR(1) with the same parameters. Use interval coverage and the no-jump floor to assess what the jump distribution adds. The experiment does not estimate leverage, changing parameters, or trading performance.",
  calibrated: "Parameters fitted on training data",
  longRunVol: "Long-run variance as volatility √m",
  dailyPersistence: "One-step persistence φ",
  halfLife: "Variance deviation half-life",
  shape: "Gamma shape k",
  jumpSize: "Mean variance jump θ",
  jumpIntensity: "Jump intensity λk",
  dataSources: "Data and reproducibility",
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
  navMethod: "方法",
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
  fanNote:
    "每一步对应一个有效参考汇率。点预测取条件期望方差的平方根。无跳跃路径具有相同的衰减值，因此若干分位数可能重合。区间不包含参数估计的不确定性。",
  evaluationEyebrow: "历史验证",
  evaluationTitle: "样本外表现",
  evaluationIntro: "按时间顺序固定训练与检验样本。三个预测窗口使用相同的检验目标日期，并在这些日期比较模型和两个基准。",
  persistence: "持久性",
  tableCaption: "共同检验日期上的预测误差，越低越好",
  modelLabel: "模型",
  rmseLabel: "波动率 RMSE",
  coverage: "90% 区间实测覆盖率",
  floorShare: "落在无跳跃下界以下的比例",
  diagnosticNote: "实际方差若常低于无跳跃下界，说明模型难以复现这些快速回落。可比较实测覆盖率与区间的名义覆盖率 90%。",
  methodEyebrow: "模型说明",
  methodTitle: "跳跃与均值回归",
  methodIntro: "Gamma–OU 把每日方差代理量作为可观测状态，用正向跳跃刻画冲击，再用指数衰减刻画冲击后的回落。",
  dynamics: "方差动态",
  modelCopy:
    "J 是强度为 λk 的复合 Poisson 过程。跳跃大小服从均值为 θ 的指数分布。在跳跃之间，V 以速率 λ 衰减。在平稳状态下，V 服从形状 k、尺度 θ 的 Gamma 分布。",
  calibrationCopy: "用训练样本和矩估计确定长期方差 m、持续性 φ = exp(−λ) 和 Gamma 参数。每个检验时点用当时已知的方差更新预测状态，模型参数保持固定。",
  limitations: "如何解读",
  limitationsCopy:
    "预测目标是窗口末端由最近五次汇率变化计算的年化波动率代理量。相同参数下，Gamma–OU 的条件均值与均值回归 AR(1) 一致。检验跳跃分布时，可重点看预测区间覆盖率和无跳跃下界。实验没有估计杠杆效应、参数变化或交易表现。",
  calibrated: "训练样本拟合参数",
  longRunVol: "长期方差对应波动率 √m",
  dailyPersistence: "单日持续性 φ",
  halfLife: "方差偏离半衰期",
  shape: "Gamma 形状 k",
  jumpSize: "平均方差跳幅 θ",
  jumpIntensity: "每日跳跃强度 λk",
  dataSources: "数据与复现",
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
  const buttons = Array.from(byId(id).querySelectorAll("button"));
  for (const button of buttons) {
    button.disabled = false;
    button.addEventListener("click", () => {
      for (const option of buttons) option.setAttribute("aria-pressed", String(option === button));
      onChange(Number(button.dataset.horizon));
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

byId("language").addEventListener("click", () => {
  language = language === "en" ? "zh" : "en";
  try {
    localStorage.setItem("levy-lab-language", language);
  } catch {
    /* Storage is optional. */
  }
  translatePage();
  if (state.data) render();
});

translatePage();
loadResults();
