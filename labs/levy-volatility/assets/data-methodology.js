"use strict";

const languageKey = "levy-lab-language";
const languageButton = document.getElementById("methodLanguage");
const localized = document.querySelectorAll("body [lang]");
let currentLanguage = "zh-CN";
const auditId = (id) => document.getElementById(id);
const auditText = (zh, en) => (currentLanguage === "en" ? en : zh);
const auditNumber = (value) => value.toLocaleString(currentLanguage);
const auditPageSize = 12;
const audit = { data: null, error: false, ticker: "AMD", frequency: "daily", stage: "all", page: 0 };

const auditMetrics = {
  provider_rows: ["来源日线记录", "Provider daily rows"],
  provider_ohlc_rows: ["有效日线 K 线", "Usable daily bars"],
  calendar_sessions: ["交易日历天数", "Exchange sessions"],
  return_candidates: ["待计算的日收益", "Candidate daily returns"],
  valid_returns: ["有效日收益", "Usable daily returns"],
  archive_bars: ["归档 1 分钟 K 线", "Archived 1-minute bars"],
  regime_bars: ["起始日后 K 线", "Bars in study regime"],
  regular_bars: ["常规时段 K 线", "Regular-session bars"],
  valid_regular_bars: ["有效常规时段 K 线", "Usable regular-session bars"],
  expected_5m_bars: ["应有 5 分钟区间", "Expected five-minute bins"],
  observed_5m_bars: ["有效 5 分钟区间", "Observed five-minute bins"],
  complete_intraday_days: ["有效盘中方差日", "Usable intraday variance days"],
  complete_full_days: ["有效全日方差日", "Usable full-day variance days"],
};
const auditMetricGroups = {
  daily: [["provider_rows", "provider_ohlc_rows", "calendar_sessions", "return_candidates", "valid_returns"]],
  intraday: [
    ["archive_bars", "regime_bars", "regular_bars", "valid_regular_bars"],
    ["expected_5m_bars", "observed_5m_bars", "calendar_sessions", "complete_intraday_days", "complete_full_days"],
  ],
};
const auditStageNames = {
  all: ["全部环节", "All stages"],
  prices: ["日线报价", "Daily quotes"],
  returns: ["日收益", "Daily returns"],
  sessions: ["方差观测", "Variance days"],
  "pre-regime": ["研究起始日前", "Before study start"],
};
const auditReasons = {
  "null-provider-row": ["来源记录有空值，剔除该报价。", "The provider row has at least one null field."],
  "missing-provider-row": ["交易日历有该日，来源缺少报价记录。", "The provider has no row for this exchange session."],
  "missing-current-close": ["缺少当日复权收盘价。", "The current session's adjusted close is missing."],
  "missing-previous-close": ["缺少上一交易日的复权收盘价。", "The prior session's adjusted close is missing."],
  "missing-both-closes": ["当日及上一交易日的复权收盘价均缺失。", "The current and prior adjusted closes are missing."],
  "warmup-no-prior-close": ["样本起始日缺少前一日复权收盘价。", "The first sample date has no prior adjusted close."],
  missing_5m_bins: ["至少一个 5 分钟区间没有有效 K 线。", "At least one five-minute bin has no usable bar."],
  missing_opening_bar: ["缺少有效的开盘整分钟 K 线。", "The exact opening minute has no usable bar."],
  missing_adjusted_daily_endpoints: ["构造隔夜收益所需的复权日线端点缺失。", "An adjusted endpoint for the overnight return is missing."],
  daily_and_minute_session_return_disagree: [
    "日线和分钟线的盘中收益相差超过 50 个基点。",
    "Daily and minute open-to-close returns differ by more than 50 basis points.",
  ],
};

try {
  if (localStorage.getItem(languageKey) === "en") currentLanguage = "en";
} catch {
  // Keep the default language when storage is unavailable.
}

function renderLanguage() {
  const english = currentLanguage === "en";
  document.documentElement.lang = currentLanguage;
  document.title = english ? "Data sources and cleaning · Lévy Volatility Lab" : "数据来源与清洗 · Lévy 波动率实验室";
  languageButton.textContent = english ? "中文" : "EN";
  languageButton.setAttribute("aria-label", english ? "切换至中文" : "Switch to English");
  for (const element of localized) element.hidden = element.lang !== currentLanguage;
  auditId("auditFrequencyGroup").setAttribute("aria-label", auditText("数据频率", "Data frequency"));
  renderAudit();
}

function auditRows(mode) {
  const withStage = (rows, stage) => rows.map((row) => ({ ...row, stage }));
  if (audit.frequency === "daily") {
    const rows = [...withStage(mode.excluded_prices, "prices"), ...withStage(mode.excluded_returns, "returns")];
    if (mode.warmup_date) rows.push({ date: mode.warmup_date, stage: "returns", reason: "warmup-no-prior-close" });
    return rows;
  }
  return [...withStage(mode.excluded_sessions, "sessions"), ...withStage(mode.pre_regime_dates, "pre-regime")];
}

function auditReason(row) {
  if (row.stage === "pre-regime") {
    const count = auditNumber(row.bars);
    return auditText(`早于研究起始日，未纳入该日的 ${count} 根 K 线。`, `${count} archived bars precede the study start date.`);
  }
  if (row.stage === "returns" && row.reason === "warmup-no-prior-close") {
    return auditText(
      "首日收盘价用于计算下一笔收益。首日本身缺少前一日收盘价，因此不计入日收益候选数。",
      "The first close seeds the next return. This date is outside the candidate-return count because no prior close is available."
    );
  }
  const reason = auditReasons[row.reason];
  const detail = reason ? auditText(...reason) : row.reason;
  const notes = [detail];
  if (row.missing_dates?.length) {
    const dates = row.missing_dates.join(auditText("、", ", "));
    notes.push(auditText(`缺失端点日期 ${dates}。`, `Missing endpoint dates ${dates}.`));
  }
  if (row.stage === "sessions") {
    const observed = auditNumber(row.observed_5m_bars);
    const expected = auditNumber(row.expected_5m_bars);
    notes.push(auditText(`有效区间 ${observed}/${expected}。`, `${observed} of ${expected} bins available.`));
    if (Number.isFinite(row.minute_minus_daily_return_bps)) {
      const gap = Math.abs(row.minute_minus_daily_return_bps).toLocaleString(currentLanguage, { maximumFractionDigits: 2 });
      notes.push(auditText(`两者相差 ${gap} 个基点。`, `The absolute gap was ${gap} basis points.`));
    }
    if (row.intraday_available) notes.push(auditText("盘中方差已保留。", "Intraday variance retained."));
  }
  return notes.join(" ");
}

function renderAuditRows() {
  const mode = audit.data.results[audit.ticker][audit.frequency];
  const rows = auditRows(mode)
    .filter((row) => audit.stage === "all" || row.stage === audit.stage)
    .sort((a, b) => b.date.localeCompare(a.date));
  const empty = rows.length === 0;
  auditId("auditEmpty").hidden = !empty;
  auditId("auditTable").hidden = empty;
  auditId("auditEmpty").textContent = auditText("这个环节没有剔除记录。", "No exclusions at this stage.");
  const start = audit.page * auditPageSize;
  const end = Math.min(start + auditPageSize, rows.length);
  const tableRows = rows.slice(start, end).map((row) => {
    const tr = document.createElement("tr");
    tr.dataset.stage = row.stage;
    tr.dataset.date = row.date;
    tr.dataset.reason = row.reason ?? "before-study-start";
    const dateCell = document.createElement("th");
    dateCell.scope = "row";
    const date = document.createElement("time");
    date.dateTime = row.date;
    date.textContent = row.date;
    dateCell.append(date);
    const stage = document.createElement("td");
    stage.textContent = auditText(...auditStageNames[row.stage]);
    const reason = document.createElement("td");
    reason.textContent = auditReason(row);
    tr.append(dateCell, stage, reason);
    return tr;
  });
  auditId("auditExcluded").replaceChildren(...tableRows);
  auditId("auditPrevious").disabled = start === 0;
  auditId("auditNext").disabled = end === rows.length;
  if (!empty) {
    const [first, last, total] = [start + 1, end, rows.length].map(auditNumber);
    auditId("auditPageSummary").textContent = auditText(`第 ${first}–${last} 条，共 ${total} 条`, `Entries ${first}–${last} of ${total}`);
  }
}

function renderAudit() {
  const status = auditId("auditStatus");
  if (!audit.data) {
    status.textContent = audit.error
      ? auditText("无法加载清洗审计。请刷新页面重试。", "The cleaning audit could not load. Reload to try again.")
      : auditText("正在加载清洗审计…", "Loading the cleaning audit…");
    return;
  }

  status.hidden = true;
  auditId("auditContent").hidden = false;
  const daily = audit.frequency === "daily";
  const mode = audit.data.results[audit.ticker][audit.frequency];
  const frequencyName = daily ? auditText("日线", "Daily") : auditText("分钟线", "1-minute data");
  auditId("auditRange").textContent = `${audit.ticker} · ${frequencyName} · ${mode.start} – ${mode.end}`;
  const groups = auditMetricGroups[audit.frequency].map((group) => {
    const list = document.createElement("dl");
    list.className = "audit-metric-group";
    for (const metric of group) {
      const item = document.createElement("div");
      item.dataset.metric = metric;
      const label = document.createElement("dt");
      label.textContent = auditText(...auditMetrics[metric]);
      const value = document.createElement("dd");
      value.textContent = auditNumber(mode[metric]);
      item.append(label, value);
      list.append(item);
    }
    return list;
  });
  auditId("auditCounts").replaceChildren(...groups);
  auditId("auditCountNote").textContent = daily
    ? auditText(
        "首个保留收盘价用于计算下一次收益。日收益候选数从下一交易日起算。同一日期在不同环节可能各有一条记录。",
        "The first retained close seeds the next return. Candidate returns start on the following session. A date can appear at more than one stage."
      )
    : auditText(
        "K 线、5 分钟区间和方差交易日分别计数。分钟 K 线有效要求开盘、收盘价格与成交量均为有限正值。",
        "Minute bars, five-minute bins, and variance days are counted separately. A usable minute bar has finite positive open, close, and volume."
      );
  const stages = daily ? ["all", "prices", "returns"] : ["all", "sessions", "pre-regime"];
  const select = auditId("auditStage");
  select.replaceChildren(...stages.map((stage) => new Option(auditText(...auditStageNames[stage]), stage)));
  select.value = audit.stage;
  renderAuditRows();
}

function connectAuditControls() {
  const ticker = auditId("auditTicker");
  ticker.replaceChildren(...audit.data.symbols.map((symbol) => new Option(symbol, symbol)));
  ticker.value = audit.ticker;
  ticker.disabled = false;
  const select = () => {
    audit.stage = "all";
    audit.page = 0;
    renderAudit();
  };
  ticker.addEventListener("change", () => {
    audit.ticker = ticker.value;
    select();
  });
  const buttons = [...auditId("auditFrequency").querySelectorAll("button")];
  for (const button of buttons) {
    button.disabled = false;
    button.addEventListener("click", () => {
      audit.frequency = button.dataset.auditFrequency;
      for (const option of buttons) option.setAttribute("aria-pressed", String(option === button));
      select();
    });
  }
  auditId("auditStage").addEventListener("change", (event) => {
    audit.stage = event.target.value;
    audit.page = 0;
    renderAuditRows();
  });
  for (const [id, increment] of [
    ["auditPrevious", -1],
    ["auditNext", 1],
  ]) {
    auditId(id).addEventListener("click", () => {
      audit.page += increment;
      renderAuditRows();
    });
  }
}

async function loadAudit() {
  try {
    const response = await fetch("../data/equity-cleaning.json");
    if (!response.ok) throw new Error(`Cleaning audit request returned ${response.status}`);
    const data = await response.json();
    if (data.schema_version !== 1 || !data.symbols?.includes(audit.ticker) || !data.results) throw new Error("Incompatible cleaning audit");
    audit.data = data;
    renderAudit();
    connectAuditControls();
  } catch (error) {
    audit.data = null;
    audit.error = true;
    auditId("auditStatus").hidden = false;
    auditId("auditContent").hidden = true;
    renderAudit();
    console.error(error);
  }
}

languageButton.addEventListener("click", () => {
  currentLanguage = currentLanguage === "en" ? "zh-CN" : "en";
  try {
    localStorage.setItem(languageKey, currentLanguage === "en" ? "en" : "zh");
  } catch {
    // The language can still change for this page.
  }
  renderLanguage();
});

renderLanguage();
loadAudit();
