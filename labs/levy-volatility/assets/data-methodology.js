"use strict";

const languageKey = "levy-lab-language";
const languageButton = document.getElementById("methodLanguage");
const localized = document.querySelectorAll("body [lang]");
let currentLanguage = "en";
const auditId = (id) => document.getElementById(id);
const auditText = (zh, en) => (currentLanguage === "en" ? en : zh);
const auditNumber = (value) => value.toLocaleString(currentLanguage);
const auditPageSize = 12;
const audit = { data: null, error: false, ticker: "AMD", frequency: "daily", stage: "all", page: 0 };
const auditCalendar = { sessions: null, scope: null, selections: new Map() };
const calendarStatuses = {
  available: ["✓", "有效", "Available"],
  missing: ["−", "缺失", "Missing"],
  excluded: ["!", "剔除", "Excluded"],
  warmup: ["·", "初始化", "Warm-up"],
  closed: ["×", "休市", "Market closed"],
  outside: ["○", "范围外", "Out of scope"],
};
const calendarMonth = (date) => date.slice(0, 7);
const calendarDate = (date) => new Date(`${date}T00:00:00Z`);
const calendarIso = (date) => date.toISOString().slice(0, 10);
const auditMonthName = (date) => new Intl.DateTimeFormat(currentLanguage, { month: "long", timeZone: "UTC" }).format(calendarDate(date));

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
  const savedLanguage = localStorage.getItem(languageKey);
  if (savedLanguage === "en" || savedLanguage === "zh") currentLanguage = savedLanguage === "zh" ? "zh-CN" : "en";
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

function auditReason(row, includeBins = true) {
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
    if (includeBins) {
      const observed = auditNumber(row.observed_5m_bars);
      const expected = auditNumber(row.expected_5m_bars);
      notes.push(auditText(`有效区间 ${observed}/${expected}。`, `${observed} of ${expected} bins available.`));
    }
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

function auditDay(date) {
  const { mode, records, daily } = auditCalendar.scope;
  const entries = records.get(date) ?? [];
  if (date < mode.start || date > mode.end) {
    return { status: entries.some((row) => row.stage === "pre-regime") ? "excluded" : "outside", entries };
  }
  if (!auditCalendar.sessions.has(date)) return { status: "closed", entries };
  if (daily) {
    if (entries.some((row) => row.stage === "prices")) return { status: "missing", entries };
    if (date === mode.warmup_date) return { status: "warmup", entries };
    return { status: entries.length ? "excluded" : "available", entries };
  }

  const counts = mode.session_count_overrides[date] ?? audit.data.default_minute_session_counts;
  let status = entries.length ? "excluded" : "available";
  if (counts[0] === 0) status = "missing";
  if (entries[0]?.reason === "warmup-no-prior-close") status = "warmup";
  return { status, entries, counts };
}

function auditCalendarLabel(status) {
  const [, zh, en] = calendarStatuses[status];
  return auditText(zh, en);
}

function auditCalendarMarker(status) {
  const icon = document.createElement("span");
  icon.className = "audit-day-marker";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = calendarStatuses[status][0];
  return icon;
}

function selectedAuditDate() {
  return auditCalendar.selections.get(auditCalendar.scope.key);
}

function renderAuditDayDetail(date, day) {
  const { daily } = auditCalendar.scope;
  const title = auditId("auditDayTitle");
  title.textContent = `${date} · ${auditCalendarLabel(day.status)}`;
  title.dataset.status = day.status;
  const reason = auditId("auditDayReason");
  if (day.status === "closed") {
    reason.textContent = auditText("XNYS 日历在这一天没有安排交易。", "The XNYS calendar has no trading session on this date.");
  } else if (day.status === "outside") {
    reason.textContent = auditText("这一天在选中数据的审计范围外。", "This date is outside the selected audit scope.");
  } else if (day.status === "available") {
    reason.textContent = daily
      ? auditText("当日和上一交易日的复权收盘价齐全，日收益可用。", "Both adjusted closes are present, so the daily return is usable.")
      : auditText(
          "常规交易时段和隔夜数据通过清洗规则，全日方差可用。",
          "Regular-session and overnight inputs pass the checks, so full-day variance is usable."
        );
  } else {
    const missingMinutes =
      !daily && day.status === "missing"
        ? [auditText("当天没有常规交易时段的原始分钟 K 线。", "No raw bars are present in the regular trading session.")]
        : [];
    reason.textContent = [...missingMinutes, ...day.entries.map((row) => auditReason(row, false))].join(" ");
  }

  const metrics = auditId("auditDayMetrics");
  metrics.hidden = !day.counts;
  const keys = ["regular_bars", "valid_regular_bars", "observed_5m_bars", "expected_5m_bars"];
  metrics.replaceChildren(...(day.counts ?? []).map((count, index) => auditMetric(keys[index], count)));
}

function auditDaysInMonth(month) {
  const first = calendarDate(`${month}-01`);
  const end = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return Array.from({ length: end }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
}

function monthShift(month, amount) {
  const date = calendarDate(`${month}-01`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return calendarMonth(calendarIso(date));
}

function auditMonthsInYear(year) {
  return Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`);
}

function auditMonthTile(month) {
  let inScope = false;
  const counts = { missing: 0, excluded: 0 };
  for (const date of auditDaysInMonth(month)) {
    const { status } = auditDay(date);
    if (status !== "outside") inScope = true;
    if (Object.hasOwn(counts, status)) counts[status] += 1;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "audit-year-month";
  button.dataset.month = month;
  button.disabled = !inScope;
  button.setAttribute("aria-controls", "auditCalendarDays");
  const name = document.createElement("strong");
  name.textContent = auditMonthName(`${month}-01`);
  button.append(name);
  if (!inScope) {
    const scope = document.createElement("span");
    scope.className = "audit-month-outside";
    scope.textContent = auditCalendarLabel("outside");
    button.append(scope);
    return button;
  }

  for (const [status, count] of Object.entries(counts)) {
    button.dataset[status] = String(count);
    const value = document.createElement("span");
    value.className = "audit-month-count";
    if (count) value.dataset.status = status;
    value.textContent = `${auditCalendarLabel(status)} ${auditNumber(count)}`;
    button.append(value);
  }
  return button;
}

function renderAuditYear(year, activeMonth) {
  const overview = auditId("auditYearMonths");
  const view = `${auditCalendar.scope.key}/${year}/${currentLanguage}`;
  if (overview.dataset.view !== view) {
    overview.replaceChildren(...auditMonthsInYear(year).map(auditMonthTile));
    overview.dataset.view = view;
  }
  for (const month of overview.children) month.setAttribute("aria-pressed", String(month.dataset.month === activeMonth && !month.disabled));
}

function renderAuditCalendar() {
  const { firstMonth, lastMonth } = auditCalendar.scope;
  const date = selectedAuditDate();
  const month = calendarMonth(date);
  const year = Number(month.slice(0, 4));
  const firstYear = Number(firstMonth.slice(0, 4));
  const lastYear = Number(lastMonth.slice(0, 4));
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => String(firstYear + index));
  const yearSelect = auditId("auditTimelineYear");
  yearSelect.replaceChildren(...years.map((value) => new Option(value, value)));
  yearSelect.value = String(year);
  renderAuditYear(year, month);
  const months = auditMonthsInYear(year).filter((value) => value >= firstMonth && value <= lastMonth);
  const monthSelect = auditId("auditTimelineMonth");
  monthSelect.replaceChildren(...months.map((value) => new Option(auditMonthName(`${value}-01`), String(Number(value.slice(5))))));
  monthSelect.value = String(Number(month.slice(5)));
  auditId("auditTimelinePrevious").disabled = month === firstMonth;
  auditId("auditTimelineNext").disabled = month === lastMonth;

  const weekdayNames = auditText(["一", "二", "三", "四", "五", "六", "日"], ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  auditId("auditCalendarWeekdays").replaceChildren(
    ...weekdayNames.map((name) => {
      const label = document.createElement("span");
      label.textContent = name;
      return label;
    })
  );

  const summary = { available: 0, missing: 0, excluded: 0, warmup: 0 };
  const padding = (calendarDate(`${month}-01`).getUTCDay() + 6) % 7;
  const cells = Array.from({ length: padding }, () => document.createElement("span"));
  for (const cell of cells) cell.setAttribute("aria-hidden", "true");
  for (const day of auditDaysInMonth(month)) {
    const { status } = auditDay(day);
    if (Object.hasOwn(summary, status)) summary[status] += 1;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "audit-calendar-day";
    button.dataset.date = day;
    button.dataset.status = status;
    button.setAttribute("aria-pressed", String(day === date));
    button.setAttribute("aria-label", `${day} · ${auditCalendarLabel(status)}`);
    button.title = auditCalendarLabel(status);
    const number = document.createElement("span");
    number.textContent = String(Number(day.slice(8)));
    button.append(number, auditCalendarMarker(status));
    cells.push(button);
  }
  auditId("auditCalendarDays").replaceChildren(...cells);
  auditId("auditTimelineLegend").replaceChildren(
    ...Object.keys(calendarStatuses).map((status) => {
      const item = document.createElement("span");
      item.dataset.status = status;
      item.append(auditCalendarMarker(status), auditCalendarLabel(status));
      return item;
    })
  );
  const bits = Object.entries(summary).map(([status, count]) => `${auditCalendarLabel(status)} ${auditNumber(count)}`);
  auditId("auditMonthSummary").textContent = bits.join(" · ");
  renderAuditDayDetail(date, auditDay(date));
}

function selectCalendarDate(date, focus = false) {
  auditCalendar.selections.set(auditCalendar.scope.key, date);
  renderAuditCalendar();
  if (focus) auditId("auditCalendarDays").querySelector(`[data-date="${date}"]`).focus();
}

function selectCalendarMonth(month, focus = false) {
  const { firstMonth, lastMonth } = auditCalendar.scope;
  const clamped = month < firstMonth ? firstMonth : month > lastMonth ? lastMonth : month;
  const days = auditDaysInMonth(clamped);
  const recentIssue = days.findLast((date) => ["missing", "excluded"].includes(auditDay(date).status));
  const recentSession = days.findLast((date) => ["available", "warmup"].includes(auditDay(date).status));
  selectCalendarDate(recentIssue ?? recentSession ?? days[0], focus);
}

function setupAuditCalendar(mode) {
  const status = auditId("auditTimelineStatus");
  const body = auditId("auditTimelineBody");
  const daily = audit.frequency === "daily";
  const ready = auditCalendar.sessions && (daily || mode.session_count_overrides);
  status.hidden = Boolean(ready);
  body.hidden = !ready;
  if (!ready) {
    status.textContent = auditText(
      "当前缓存缺少日历数据。刷新页面以加载逐日记录。",
      "Calendar data is unavailable in this snapshot. Reload for the latest audit."
    );
    return;
  }

  const records = new Map();
  for (const row of auditRows(mode)) {
    if (!records.has(row.date)) records.set(row.date, []);
    records.get(row.date).push(row);
  }
  const start = (!daily && mode.pre_regime_dates[0]?.date) || mode.start;
  const key = `${audit.ticker}/${audit.frequency}`;
  auditCalendar.scope = { mode, records, daily, key, firstMonth: calendarMonth(start), lastMonth: calendarMonth(mode.end) };
  if (!auditCalendar.selections.has(key)) {
    const latestIssue = [...records.keys()].sort().findLast((date) => date >= mode.start && ["missing", "excluded"].includes(auditDay(date).status));
    auditCalendar.selections.set(key, latestIssue ?? mode.end);
  }
  renderAuditCalendar();
}

function connectAuditCalendar() {
  auditId("auditTimelineYear").addEventListener("change", (event) => {
    selectCalendarMonth(`${event.target.value}-${calendarMonth(selectedAuditDate()).slice(5)}`);
  });
  auditId("auditTimelineMonth").addEventListener("change", (event) => {
    selectCalendarMonth(`${selectedAuditDate().slice(0, 4)}-${event.target.value.padStart(2, "0")}`);
  });
  auditId("auditYearMonths").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-month]");
    if (button && !button.disabled) selectCalendarMonth(button.dataset.month, true);
  });
  auditId("auditTimelinePrevious").addEventListener("click", () => selectCalendarMonth(monthShift(calendarMonth(selectedAuditDate()), -1)));
  auditId("auditTimelineNext").addEventListener("click", () => selectCalendarMonth(monthShift(calendarMonth(selectedAuditDate()), 1)));
  const grid = auditId("auditCalendarDays");
  grid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-date]");
    if (button) selectCalendarDate(button.dataset.date, true);
  });
  grid.addEventListener("keydown", (event) => {
    const increments = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const increment = increments[event.key];
    const button = event.target.closest("button[data-date]");
    if (!increment || !button) return;
    event.preventDefault();
    const day = calendarDate(button.dataset.date);
    day.setUTCDate(day.getUTCDate() + increment);
    const target = calendarIso(day);
    const month = calendarMonth(target);
    const { firstMonth, lastMonth } = auditCalendar.scope;
    if (month >= firstMonth && month <= lastMonth) selectCalendarDate(target, true);
  });
}

function auditMetric(metric, count) {
  const item = document.createElement("div");
  item.dataset.metric = metric;
  const label = document.createElement("dt");
  label.textContent = auditText(...auditMetrics[metric]);
  const value = document.createElement("dd");
  value.textContent = auditNumber(count);
  item.append(label, value);
  return item;
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
    list.append(...group.map((metric) => auditMetric(metric, mode[metric])));
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
  setupAuditCalendar(mode);
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
    if (data.session_dates?.length && data.default_minute_session_counts?.length === 4) auditCalendar.sessions = new Set(data.session_dates);
    renderAudit();
    connectAuditControls();
    connectAuditCalendar();
    const anchor = location.hash.slice(1);
    if (["cleaning-timeline", "cleaning-year"].includes(anchor)) auditId(anchor).scrollIntoView({ behavior: "instant" });
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
