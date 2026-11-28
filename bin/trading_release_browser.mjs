#!/usr/bin/env node
// Read-only publication QA. Reports and screenshots belong in a private directory.
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

class ConfigurationError extends Error {}
class CheckError extends Error {
  constructor(message, detail) {
    super(message);
    this.detail = detail;
  }
}
const ensure = (condition, message, detail) => {
  if (!condition) throw new CheckError(message, detail);
};
const usage =
  "node --preserve-symlinks --preserve-symlinks-main bin/trading_release_browser.mjs --spec <private.json> --output-dir <private-dir> [--playwright-module <absolute-module>] [--browser <executable>]";
const report = {
  schema_version: 1,
  started: new Date().toISOString(),
  success: false,
  states: [],
  navigation: [],
  errors: [],
  resource_failures: [],
  screenshots: [],
};
let outputDir;
let browser;
let activePage;
let spec;
let exitCode = 0;

function parseArguments(argv) {
  const result = {};
  const known = new Set(["--spec", "--output-dir", "--playwright-module", "--browser"]);
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    if (flag === "--help" || flag === "-h") return { help: true };
    if (!known.has(flag) || !argv[index + 1] || argv[index + 1].startsWith("--"))
      throw new ConfigurationError(`Invalid or incomplete argument: ${flag}`);
    if (Object.hasOwn(result, flag)) throw new ConfigurationError(`Repeated argument: ${flag}`);
    result[flag] = argv[++index];
  }
  if (!result["--spec"] || !result["--output-dir"]) throw new ConfigurationError("--spec and --output-dir are required");
  return result;
}

function canonicalRoute(value, label) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[?#\s"<>]/.test(value))
    throw new ConfigurationError(`${label} must be an absolute site path without query/fragment`);
  return value;
}

function validateSpecification(value) {
  if (!value || value.schema_version !== 1) throw new ConfigurationError("Expected schema_version: 1");
  let site;
  try {
    site = new URL(value.site_url);
  } catch {
    throw new ConfigurationError("Invalid site_url");
  }
  if (!["http:", "https:"].includes(site.protocol) || site.username || site.password || site.search || site.hash)
    throw new ConfigurationError("site_url must be a public HTTP(S) URL without credentials/query/fragment");
  if (!Array.isArray(value.articles) || !value.articles.length) throw new ConfigurationError("articles must contain at least one article");
  const seen = new Set();
  for (const [index, article] of value.articles.entries()) {
    canonicalRoute(article.route, `articles[${index}].route`);
    if (seen.has(article.route)) throw new ConfigurationError(`Duplicate article route: ${article.route}`);
    seen.add(article.route);
    for (const key of ["title", "title_zh", "description", "description_zh"]) {
      if (typeof article[key] !== "string" || !article[key].trim()) throw new ConfigurationError(`articles[${index}].${key} is required`);
    }
    for (const key of ["display_equations", "intuition_blocks"]) {
      if (key === "intuition_blocks" && article[key] == null) continue;
      if (!article[key] || ["en", "zh"].some((language) => !Number.isInteger(article[key][language]) || article[key][language] < 0))
        throw new ConfigurationError(`articles[${index}].${key} needs nonnegative en/zh counts`);
    }
  }
  if (!Array.isArray(value.assets)) throw new ConfigurationError("assets must be an array, including [] when no assets are expected");
  for (const [index, asset] of value.assets.entries()) {
    canonicalRoute(asset.public_path, `assets[${index}].public_path`);
    if (!/^[a-f\d]{64}$/i.test(asset.sha256 || "")) throw new ConfigurationError(`assets[${index}].sha256 must contain 64 hexadecimal characters`);
  }
  canonicalRoute(value.archive_route, "archive_route");
  canonicalRoute(value.projects_route, "projects_route");
  if (value.screenshots != null && typeof value.screenshots !== "boolean") throw new ConfigurationError("screenshots must be true or false");
  return { ...value, site_url: site.href, origin: site.origin };
}

async function exists(filename) {
  if (!filename) return false;
  try {
    return (await fs.stat(filename)).isFile();
  } catch {
    return false;
  }
}

async function resolvePlaywright(explicit) {
  const selected = explicit || process.env.TRADING_PLAYWRIGHT_MODULE;
  if (selected) {
    if (!path.isAbsolute(selected) || !(await exists(selected)))
      throw new ConfigurationError("The selected Playwright module must be an existing absolute file path");
    return path.resolve(selected);
  }
  const executableDirectory = path.dirname(process.execPath);
  const candidates = [
    path.join(executableDirectory, "node_modules", "playwright", "index.mjs"),
    path.resolve(executableDirectory, "..", "node_modules", "playwright", "index.mjs"),
    path.resolve(executableDirectory, "..", "..", "node_modules", "playwright", "index.mjs"),
    path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "node", "node_modules", "playwright", "index.mjs"),
  ];
  try {
    candidates.unshift(createRequire(import.meta.url).resolve("playwright"));
  } catch {}
  for (const candidate of candidates) if (await exists(candidate)) return candidate;
  throw new ConfigurationError("Playwright was not found. Set --playwright-module or TRADING_PLAYWRIGHT_MODULE; no dependency was installed");
}

async function resolveBrowser(explicit, chromium) {
  const selected = explicit || process.env.TRADING_BROWSER_EXECUTABLE;
  if (selected) {
    if (!path.isAbsolute(selected) || !(await exists(selected)))
      throw new ConfigurationError("The selected browser executable must be an existing absolute file path");
    return path.resolve(selected);
  }
  const candidates =
    process.platform === "win32"
      ? [process.env["ProgramFiles(x86)"], process.env.ProgramFiles]
          .filter(Boolean)
          .map((directory) => path.join(directory, "Microsoft", "Edge", "Application", "msedge.exe"))
      : ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"];
  try {
    candidates.push(chromium.executablePath());
  } catch {}
  for (const candidate of candidates) if (await exists(candidate)) return candidate;
  throw new ConfigurationError("No existing browser was found. Set --browser or TRADING_BROWSER_EXECUTABLE; no browser was installed");
}

function safeURL(value) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    for (const key of [...url.searchParams.keys()])
      if (/token|secret|password|authorization|^code$/i.test(key)) url.searchParams.set(key, "[redacted]");
    return url.href;
  } catch {
    return value;
  }
}

function observe(page, label) {
  page.on("pageerror", (error) => report.errors.push({ label, type: "pageerror", message: error.message }));
  page.on("console", (message) => {
    if (message.type() === "error")
      report.errors.push({ label, type: "console", message: message.text(), location: safeURL(message.location().url) });
  });
  page.on("response", (response) => {
    if (response.status() >= 400) report.resource_failures.push({ label, status: response.status(), url: safeURL(response.url()) });
  });
  page.on("requestfailed", (request) => {
    const error = request.failure()?.errorText || "Request failed";
    if (!error.includes("ERR_ABORTED")) report.resource_failures.push({ label, error, url: safeURL(request.url()) });
  });
}

function articleURL(route) {
  return new URL(route, spec.site_url).href;
}
const selectorValue = (value) => JSON.stringify(value);

async function ready(page, article, language) {
  await page.locator(".lang-switch").waitFor({ state: "visible", timeout: 30000 });
  // In the zero-equation case, still wait for any active MathJax startup first.
  await page.evaluate(async () => {
    let timer;
    try {
      await Promise.race([
        Promise.all([window.MathJax?.startup?.promise || Promise.resolve(), document.fonts.ready]),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("Mathematics/font startup timed out")), 45000);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  });
  await page.waitForFunction(
    ({ expected, language }) => {
      const body = document.querySelector(`.reflection-body[data-lang="${language}"]`);
      if (!body || body.hidden) return false;
      const rendered = [...body.querySelectorAll('mjx-container[display="true"]')].filter((element) => element.querySelector("mjx-math,svg"));
      return rendered.length === expected;
    },
    { expected: article.display_equations[language], language },
    { timeout: 45000 }
  );
  const images = page.locator(".reflection-body:not([hidden]) img");
  for (let index = 0; index < (await images.count()); index++) {
    const image = images.nth(index);
    await image.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
    const result = await image.evaluate(async (element) => {
      const src = () => element.currentSrc || element.getAttribute("src") || element.getAttribute("data-src");
      const lazyNodes = [element, ...(element.closest("picture")?.querySelectorAll("source") || [])];
      const pendingLazy = () =>
        lazyNodes.some((node) => {
          const deferred = node.getAttribute("data-src");
          let changed = false;
          if (deferred) {
            try {
              changed = new URL(deferred, document.baseURI).href !== new URL(node.getAttribute("src") || "", document.baseURI).href;
            } catch {
              changed = true;
            }
          }
          const srcset = node.getAttribute("data-srcset");
          return changed || (srcset && srcset.trim() !== (node.getAttribute("srcset") || "").trim());
        });
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (pendingLazy() || !element.complete || !element.naturalWidth) {
        const state = await new Promise((resolve) => {
          const finish = (value) => {
            clearTimeout(timer);
            observer.disconnect();
            element.removeEventListener("load", loaded);
            element.removeEventListener("error", failed);
            resolve(value);
          };
          const check = () => {
            if (pendingLazy() || !element.complete) return;
            if (element.naturalWidth) finish("loaded");
            else if (src()) finish("error");
          };
          const loaded = check,
            failed = () => finish("error");
          const observer = new MutationObserver(check);
          const timer = setTimeout(() => finish("timeout"), 30000);
          element.addEventListener("load", loaded);
          element.addEventListener("error", failed, { once: true });
          observer.observe(element.closest("picture") || element, {
            subtree: true,
            attributes: true,
            attributeFilter: ["src", "srcset", "data-src", "data-srcset"],
          });
          check();
        });
        if (state !== "loaded") return { src: src(), state };
      }
      if (!element.naturalWidth) return { src: src(), state: "error" };
      if (element.decode) {
        try {
          await element.decode();
        } catch {
          return { src: src(), state: "decode-error" };
        }
      }
      return { src: src(), state: "loaded" };
    });
    ensure(result.state === "loaded", "Article image did not load", result);
  }
}

async function setTheme(page, desired) {
  const toggle = page.locator("#light-toggle");
  let opened = false;
  if (!(await toggle.isVisible())) {
    await page.locator(".navbar-toggler").click();
    await toggle.waitFor({ state: "visible" });
    opened = true;
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    if (await page.evaluate((target) => localStorage.getItem("quant-theme") === target && document.documentElement.dataset.theme === target, desired))
      break;
    await toggle.click();
  }
  await page.waitForFunction((target) => document.documentElement.dataset.theme === target, desired);
  if (opened) {
    await page.locator(".navbar-toggler").click();
    await page.waitForFunction(
      () =>
        document.querySelector(".navbar-toggler").getAttribute("aria-expanded") === "false" &&
        !document.querySelector("#navbarNav").classList.contains("collapsing")
    );
  }
  await page.waitForFunction(() => !document.documentElement.classList.contains("transition"));
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.constructor.name === "CSSTransition")
        .map((animation) => animation.finished.catch(() => {}))
    );
  });
}

async function inspect(page) {
  return page.evaluate(() => {
    const visible = (element) => getComputedStyle(element).display !== "none" && element.getClientRects().length > 0;
    const bodies = [...document.querySelectorAll(".reflection-body")],
      body = bodies.find(visible);
    const rgba = (value) => {
      const match = value.match(/^rgba?\(([^)]+)\)$/);
      if (!match) return null;
      const values = match[1]
        .replace(/\//g, ",")
        .split(/[,\s]+/)
        .filter(Boolean)
        .map(Number);
      return [...values.slice(0, 3), values.length > 3 ? values[3] : 1];
    };
    const over = (front, back) => [...front.slice(0, 3).map((value, index) => value * front[3] + back[index] * (1 - front[3])), 1];
    const background = (element) => {
      const chain = [];
      for (let current = element; current; current = current.parentElement) chain.unshift(current);
      return chain.reduce((color, current) => over(rgba(getComputedStyle(current).backgroundColor) || [0, 0, 0, 0], color), [255, 255, 255, 1]);
    };
    const luminance = (color) =>
      color
        .slice(0, 3)
        .map((value) => value / 255)
        .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const contrast = (element) => {
      const foreground = rgba(getComputedStyle(element).color);
      if (!foreground) return null;
      const bg = background(element),
        a = luminance(over(foreground, bg)),
        b = luminance(bg);
      return +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2);
    };
    const formulas = [...(body?.querySelectorAll('mjx-container[display="true"]') || [])].filter((element) => element.querySelector("mjx-math,svg"));
    const bodyOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    const rawReferences = [...document.querySelectorAll(".reflection-body [src],.reflection-body [srcset],.reflection-body a[href]")]
      .flatMap((element) => [
        element.getAttribute("src"),
        element.getAttribute("href"),
        ...(element.getAttribute("srcset") || "").split(",").map((value) => value.trim().split(/\s+/)[0]),
      ])
      .filter(Boolean);
    const assetReferences = [
      ...new Set(
        rawReferences.flatMap((value) => {
          try {
            const url = new URL(value, location.href);
            return url.origin === location.origin ? [url.pathname] : [];
          } catch {
            return [];
          }
        })
      ),
    ];
    return {
      title: document.querySelector(".post-title")?.textContent?.trim(),
      description: document.querySelector(".post-description")?.textContent?.trim(),
      tabTitle: document.title,
      language: body?.dataset.lang,
      visibleBodies: bodies.filter(visible).length,
      hiddenBodiesReallyHidden: bodies.filter((element) => element.hidden).every((element) => !visible(element)),
      storageLanguage: localStorage.getItem("reflection-lang"),
      theme: document.documentElement.dataset.theme,
      displayEquations: formulas.length,
      mathErrors: body?.querySelectorAll('mjx-merror,[data-mml-node="merror"],.mjx-merror').length,
      formulaScroll: formulas.map((element) => {
        const previous = element.scrollLeft;
        element.scrollLeft = element.scrollWidth;
        const canScroll = Math.abs(element.scrollLeft) > 0;
        element.scrollLeft = previous;
        return { width: element.clientWidth, scrollWidth: element.scrollWidth, overflowX: getComputedStyle(element).overflowX, canScroll };
      }),
      intuitionBlocks: body?.querySelectorAll(".reflection-intuition").length,
      invisibleIntuition: [...(body?.querySelectorAll(".reflection-intuition") || [])].filter((element) => !visible(element)).length,
      bodyContrast: body ? contrast(body) : null,
      calloutColors: [...(body?.querySelectorAll(".reflection-intuition,.intuition-input,.intuition-effect,.intuition-limit") || [])].map(
        (element) => ({
          class: element.className,
          color: getComputedStyle(element).color,
          background: background(element).slice(0, 3),
          contrast: contrast(element),
        })
      ),
      bodyOverflow,
      overflowElements: bodyOverflow
        ? [...document.querySelectorAll("body *")]
            .filter((element) => visible(element) && element.getBoundingClientRect().right > innerWidth + 1)
            .slice(0, 18)
            .map((element) => ({
              tag: element.tagName,
              class: element.className?.baseVal ?? element.className,
              text: element.textContent.slice(0, 75),
              right: element.getBoundingClientRect().right,
            }))
        : [],
      assetReferences,
    };
  });
}

async function screenshot(page, filename) {
  await page.screenshot({ path: path.join(outputDir, filename) });
  report.screenshots.push(filename);
}

async function inspectArticles() {
  const references = new Set();
  for (const [device, viewport] of [
    ["desktop", { width: 1280, height: 960 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    for (const [index, article] of spec.articles.entries()) {
      const label = `${device}-article-${index + 1}`;
      const context = await browser.newContext({ viewport, colorScheme: "dark", reducedMotion: "reduce" });
      const page = await context.newPage();
      activePage = page;
      observe(page, label);
      try {
        const response = await page.goto(articleURL(article.route), { waitUntil: "load", timeout: 60000 });
        ensure(response?.status() === 200, "Article HTTP status is not 200", { route: article.route, status: response?.status() });
        await ready(page, article, "en");
        const initial = await inspect(page);
        ensure(
          initial.language === "en" &&
            initial.visibleBodies === 1 &&
            initial.hiddenBodiesReallyHidden &&
            initial.title === article.title.trim() &&
            initial.description === article.description.trim() &&
            initial.tabTitle.startsWith(article.title.trim()),
          "Fresh article does not default to the approved English version",
          { route: article.route, ...initial }
        );
        for (const language of ["en", "zh"]) {
          await page.locator(`.lang-switch button[data-set-lang="${language}"]`).click();
          await page.reload({ waitUntil: "load", timeout: 60000 });
          await ready(page, article, language);
          for (const theme of ["dark", "light"]) {
            await setTheme(page, theme);
            const state = await inspect(page);
            state.assetReferences.forEach((reference) => references.add(reference));
            report.states.push({ device, route: article.route, requestedLanguage: language, requestedTheme: theme, ...state });
            const title = article[language === "en" ? "title" : "title_zh"].trim();
            const description = article[language === "en" ? "description" : "description_zh"].trim();
            ensure(
              state.title === title && state.description === description && state.tabTitle.startsWith(title),
              "Localized heading, description, or tab title differs from the approved article",
              state
            );
            ensure(
              state.visibleBodies === 1 && state.language === language && state.hiddenBodiesReallyHidden && state.storageLanguage === language,
              "Language switch or refresh persistence failed",
              state
            );
            ensure(state.displayEquations === article.display_equations[language] && state.mathErrors === 0, "Rendered mathematics failed", state);
            if (article.intuition_blocks)
              ensure(state.intuitionBlocks === article.intuition_blocks[language], "Intuition block count differs", state);
            ensure(state.invisibleIntuition === 0, "An intuition block is hidden", state);
            ensure(!state.bodyOverflow, "Article causes horizontal page overflow", state);
            ensure(
              state.formulaScroll.every(
                (formula) => formula.scrollWidth <= formula.width + 1 || (["auto", "scroll"].includes(formula.overflowX) && formula.canScroll)
              ),
              "A long formula is clipped instead of horizontally scrollable",
              state
            );
            ensure(
              state.bodyContrast >= 4.5 && state.calloutColors.every((color) => color.contrast >= 4.5),
              "Body or callout text contrast is below 4.5",
              state
            );
            const keyShot =
              index === 0 && theme === "dark" && ((device === "desktop" && language === "en") || (device === "mobile" && language === "zh"));
            if (spec.screenshots || keyShot) {
              await page.evaluate(() => window.scrollTo(0, 0));
              if (!spec.screenshots && device === "mobile") {
                const target = page
                  .locator('.reflection-body:not([hidden]) mjx-container[display="true"],.reflection-body:not([hidden]) .reflection-intuition')
                  .first();
                if (await target.count()) await target.scrollIntoViewIfNeeded();
              }
              await screenshot(page, `${label}-${language}-${theme}.png`);
            }
          }
        }
        const links = await page
          .locator(".reflection-body a[href]")
          .evaluateAll((elements) =>
            elements.map((element) => ({ href: element.getAttribute("href"), language: element.closest(".reflection-body").dataset.lang }))
          );
        const companions = new Map();
        for (const link of links) {
          let url;
          try {
            url = new URL(link.href, articleURL(article.route));
          } catch {
            continue;
          }
          const target = spec.articles.find(
            (candidate) => candidate.route !== article.route && url.origin === spec.origin && candidate.route === url.pathname
          );
          if (target) companions.set(target.route, { target, language: link.language, href: link.href });
        }
        for (const { target, language, href } of companions.values()) {
          if (page.url() !== articleURL(article.route)) await page.goto(articleURL(article.route), { waitUntil: "load" });
          await page.locator(`.lang-switch button[data-set-lang="${language}"]`).click();
          await Promise.all([
            page.waitForURL((url) => url.origin === spec.origin && url.pathname === target.route),
            page
              .locator(`.reflection-body:not([hidden]) a[href=${selectorValue(href)}]`)
              .first()
              .click(),
          ]);
          await ready(page, target, language);
          report.navigation.push({ device, from: article.route, companion: target.route });
        }
        if (page.url() !== articleURL(article.route)) await page.goto(articleURL(article.route), { waitUntil: "load" });
        await Promise.all([
          page.waitForURL(articleURL(spec.archive_route)),
          page
            .locator(`.post article a[href=${selectorValue(spec.archive_route)}]:visible`)
            .first()
            .click(),
        ]);
        report.navigation.push({ device, from: article.route, archiveBackLink: true });
      } catch (error) {
        if (!page.isClosed()) await screenshot(page, `failure-${label}.png`).catch(() => {});
        throw error;
      } finally {
        await context.close();
        activePage = undefined;
      }
    }
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    activePage = page;
    observe(page, `${device}-indices`);
    try {
      await page.goto(articleURL(spec.archive_route), { waitUntil: "load", timeout: 60000 });
      const routes = await page
        .locator(".post article ol h3 a")
        .evaluateAll((elements) => elements.map((element) => new URL(element.getAttribute("href"), location.href).pathname));
      ensure(
        spec.articles.every((article) => routes.includes(article.route)),
        "Archive is missing an approved article",
        { routes }
      );
      await page.goto(articleURL(spec.projects_route), { waitUntil: "load", timeout: 60000 });
      const card = page.locator(".project-card").filter({ has: page.locator(`a.project-link[href=${selectorValue(spec.archive_route)}]`) });
      const latest = await card.locator(".project-resources a:has(.kind-article)").first().getAttribute("href");
      const latestURL = new URL(latest, page.url());
      ensure(
        latestURL.origin === spec.origin && routes.includes(latestURL.pathname),
        "Projects latest link does not identify a published archive article",
        { latest, routes }
      );
      const response = await context.request.get(latestURL.href, { failOnStatusCode: false });
      ensure(response.status() === 200, "Projects latest article returned an error", { latest, status: response.status() });
      report.navigation.push({ device, archiveRoutes: routes, latestProjectArticle: latestURL.pathname });
    } catch (error) {
      if (!page.isClosed()) await screenshot(page, `failure-${device}-indices.png`).catch(() => {});
      throw error;
    } finally {
      await context.close();
      activePage = undefined;
    }
  }
  report.asset_references = [...references].sort();
  const missing = spec.assets
    .filter((asset) => !references.has(new URL(asset.public_path, spec.site_url).pathname))
    .map((asset) => asset.public_path);
  ensure(missing.length === 0, "Approved assets are missing from article src/srcset/href references", { missing });
  report.assets = {
    expected: spec.assets.length,
    referenced: spec.assets.length - missing.length,
    binary_hash_verification: "Performed separately by the release CLI; browser QA checks references and image loading",
  };
  ensure(report.errors.length === 0 && report.resource_failures.length === 0, "Browser errors or failed resources occurred", {
    errors: report.errors,
    resources: report.resource_failures,
  });
}

try {
  const args = parseArguments(process.argv.slice(2));
  if (args.help) {
    console.log(JSON.stringify({ usage, schema_version: 1, exit_codes: { passed: 0, failed_checks: 1, invalid_configuration: 2 } }));
    process.exit(0);
  }
  outputDir = path.resolve(args["--output-dir"]);
  await fs.mkdir(outputDir, { recursive: true });
  try {
    spec = validateSpecification(JSON.parse(await fs.readFile(path.resolve(args["--spec"]), "utf8")));
  } catch (error) {
    throw error instanceof ConfigurationError ? error : new ConfigurationError(`Cannot read specification: ${error.message}`);
  }
  report.site_url = spec.site_url;
  report.articles = spec.articles.map((article) => article.route);
  const modulePath = await resolvePlaywright(args["--playwright-module"]);
  let playwright;
  try {
    playwright = await import(pathToFileURL(modulePath).href);
  } catch (error) {
    throw new ConfigurationError(`Cannot load existing Playwright: ${error.message}`);
  }
  const chromium = playwright.chromium || playwright.default?.chromium;
  if (!chromium) throw new ConfigurationError("The selected module does not export chromium");
  const executablePath = await resolveBrowser(args["--browser"], chromium);
  browser = await chromium.launch({ executablePath, headless: true, args: ["--disable-gpu", "--no-first-run"] });
  await inspectArticles();
  report.success = true;
} catch (error) {
  exitCode = error instanceof ConfigurationError ? 2 : 1;
  report.failure = { category: exitCode === 2 ? "configuration" : "verification", message: error.message, detail: error.detail };
  if (activePage && !activePage.isClosed()) await screenshot(activePage, "failure.png").catch(() => {});
} finally {
  if (browser) await browser.close().catch(() => {});
  report.finished = new Date().toISOString();
  if (outputDir) {
    try {
      await fs.writeFile(path.join(outputDir, "browser-checks.json"), JSON.stringify(report, null, 2) + "\n");
    } catch (error) {
      exitCode = 2;
      report.success = false;
      report.failure = { category: "configuration", message: `Cannot write report: ${error.message}` };
    }
  }
}
console.log(
  JSON.stringify({
    success: report.success,
    states: report.states.length,
    navigation_checks: report.navigation.length,
    expected_assets: spec?.assets.length,
    screenshots: report.screenshots.length,
    console_errors: report.errors.length,
    failed_resources: report.resource_failures.length,
    report: outputDir ? path.join(outputDir, "browser-checks.json") : undefined,
    failure: report.failure ? { category: report.failure.category, message: report.failure.message } : undefined,
    usage: exitCode === 2 ? usage : undefined,
  })
);
process.exitCode = exitCode;
