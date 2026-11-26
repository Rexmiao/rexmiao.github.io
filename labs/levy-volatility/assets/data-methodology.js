"use strict";

const languageKey = "levy-lab-language";
const languageButton = document.getElementById("methodLanguage");
const localized = document.querySelectorAll("body [lang]");
let currentLanguage = "zh-CN";

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
