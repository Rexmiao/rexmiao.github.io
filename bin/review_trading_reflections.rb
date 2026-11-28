#!/usr/bin/env ruby
# frozen_string_literal: true

# Render local draft articles without building or publishing the website.
require "cgi"
require "date"
require "digest"
require "json"
require "kramdown"
require "kramdown-parser-gfm"
require "pathname"
require "yaml"

abort "Usage: ruby bin/review_trading_reflections.rb draft.md [draft.md ...]" if ARGV.empty?
paths = ARGV.map { |arg| Pathname.new(arg).realpath }
abort "All drafts must share a directory" unless paths.all? { |path| File.identical?(path.parent, paths.first.parent) }
output = paths.first.parent.join("trading-reflections-review.html")
esc = ->(text) { CGI.escapeHTML(text.to_s) }
runtime = Pathname.new(__dir__).parent.parent.join(".work", "trading-reflections", ".review-runtime", "mathjax-3.2.0-tex-svg.js")
runtime_sha256 = "241840cc338ce7352f16ce707f7291e96d6e01c5c08bd69469a1c8c9f2fa9d54"
abort "Missing local MathJax cache: #{runtime}" unless runtime.file?
abort "MathJax cache checksum mismatch: #{runtime}" unless Digest::SHA256.file(runtime).hexdigest == runtime_sha256
# Normalize Windows filesystem/ARGV encodings before computing the local URL.
runtime_url = Pathname.new(runtime.to_s.encode("UTF-8")).relative_path_from(Pathname.new(output.parent.to_s.encode("UTF-8"))).to_s.tr("\\", "/")
mathjax_config = {
  tex: {
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"], ["$$", "$$"]],
    packages: %w[base ams newcommand noundefined configmacros],
    tags: "ams"
  },
  svg: { fontCache: "none" },
  options: { enableMenu: false },
  startup: { typeset: false }
}.to_json
articles = paths.map do |path|
  match = path.read(encoding: "UTF-8").match(/\A---\r?\n(.*?)\r?\n---\r?\n(.*)\z/m)
  abort "Missing front matter: #{path}" unless match
  meta = YAML.safe_load(match[1], permitted_classes: [Date, Time], aliases: false)
  abort "Review accepts unpublished drafts only" unless meta["published"] == false
  # GFM consumes the backslashes in raw \(...\); protect those inline delimiters.
  # Native Kramdown $$...$$ remains supported both inline and on separate lines.
  markdown = match[2].gsub(/\\\((.+?)\\\)/m) do |math|
    "<span class=\"math-inline\" markdown=\"0\">#{esc.call(math)}</span>"
  end
  html = Kramdown::Document.new(markdown, input: "GFM", syntax_highlighter: nil).to_html
  # A draft keeps its final publication URLs; preview maps them to private assets.
  html = html.gsub(%r{(src|href)="/assets/img/trading-reflections/(\d{4}-\d{2}-\d{2})/}, '\1="\2-materials/assets/')
  paths.each_with_index do |other, index|
    route = "/projects/trading-reflections/#{other.basename('.md')}/"
    html = html.gsub("href=\"#{route}\"", "href=\"#entry-#{index}\"")
  end
  [meta, html]
end

navigation = articles.each_with_index.map do |(meta, _), index|
  "<button type=\"button\" data-entry=\"#{index}\" aria-pressed=\"#{index.zero?}\">#{esc.call(meta['title_zh'])}</button>"
end.join("\n")
content = articles.each_with_index.map do |(meta, html), index|
  attrs = %w[title description].flat_map do |key|
    %w[en zh].map do |lang|
      value = meta[lang == "en" ? key : "#{key}_zh"]
      "data-#{key}-#{lang}=\"#{esc.call(value)}\""
    end
  end.join(" ")
  "<article id=\"entry-#{index}\" #{attrs} #{'hidden' unless index.zero?}>#{html}</article>"
end.join("\n")

page = <<~HTML
  <!doctype html>
  <html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Trading Reflections 双语草稿</title>
    <script>window.MathJax = #{mathjax_config};</script>
    <script defer id="MathJax-script" src="#{esc.call(runtime_url)}"></script>
    <style>
      :root { color-scheme: dark; --bg:#0b1626; --panel:#101f32; --text:#e9f1f9; --muted:#a9bacd; --mint:#7ee7c7; --line:#294055; }
      * { box-sizing:border-box; } [hidden] { display:none !important; }
      body { margin:0; color:var(--text); background:var(--bg); font:17px/1.85 system-ui,"Microsoft YaHei",sans-serif; }
      main { max-width:1060px; margin:auto; padding:36px 28px 80px; }
      .eyebrow { color:var(--mint); font-size:14px; letter-spacing:.07em; }
      .status { color:var(--muted); font-size:15px; }
      nav { display:grid; gap:10px; margin:22px 0; }
      button { font:inherit; line-height:1.5; text-align:left; padding:12px 16px; border:1px solid var(--line); border-radius:8px; color:var(--text); background:var(--panel); cursor:pointer; }
      button[aria-pressed="true"] { border-color:var(--mint); color:var(--mint); }
      .language { display:flex; gap:10px; margin:18px 0; }
      .language button { min-width:100px; text-align:center; }
      h1 { font-size:clamp(27px,4.1vw,40px); line-height:1.35; margin:22px 0 14px; overflow-wrap:anywhere; }
      h2 { font-size:25px; line-height:1.5; margin:40px 0 14px; }
      h3 { font-size:21px; } p { margin:0 0 20px; } a { color:var(--mint); text-underline-offset:3px; }
      #description { color:var(--muted); padding-bottom:22px; border-bottom:1px solid var(--line); }
      img { display:block; max-width:100%; height:auto; margin:26px auto 12px; border:1px solid var(--line); border-radius:6px; }
      p:has(> em:only-child) { font-size:14px; color:var(--muted); line-height:1.7; }
      .table-scroll { overflow-x:auto; margin:24px 0; border:1px solid var(--line); border-radius:8px; }
      table { border-collapse:collapse; width:100%; font-size:14px; } th,td { padding:12px 14px; text-align:left; border-bottom:1px solid var(--line); white-space:nowrap; }
      th { background:var(--panel); color:var(--mint); } tbody tr:last-child td { border-bottom:0; }
      pre { overflow:auto; padding:18px; border:1px solid var(--line); border-radius:8px; font-size:14px; line-height:1.7; }
      code { color:#b4e9dc; font-size:.9em; overflow-wrap:anywhere; }
      article,.reflection-body { min-width:0; max-width:100%; }
      mjx-container[display="true"] { display:block; max-width:100%; overflow-x:auto; overflow-y:hidden; padding:8px 2px; }
      mjx-container[display="true"] > svg { max-width:none; }
      .reflection-intuition { --intuition-input:#91c8ff; --intuition-effect:#80e1c5; --intuition-limit:#f5cc8e; margin:22px 0 28px; padding:18px 22px; border:1px solid var(--line); border-left:3px solid var(--mint); border-radius:8px; background:var(--panel); line-height:1.8; }
      .reflection-intuition p:last-child { margin-bottom:0; }
      .intuition-input { color:var(--intuition-input); font-weight:600; }
      .intuition-effect { color:var(--intuition-effect); font-weight:600; }
      .intuition-limit { color:var(--intuition-limit); font-weight:600; }
      @media(max-width:600px) { main { padding:22px 16px 50px; } body { font-size:16px; } h2 { font-size:22px; } }
      @media print { :root { color-scheme:light; --text:#14283b; --muted:#435d71; --bg:#fff; --mint:#146c57; --line:#ccd6df; --panel:#eef3f7; } nav,.language { display:none; } main { max-width:none; padding:0; } }
      @media print { .reflection-intuition { --intuition-input:#226292; --intuition-effect:#166951; --intuition-limit:#885513; } }
    </style>
  </head>
  <body>
  <main>
    <div class="eyebrow">REXY MIAO · TRADING REFLECTIONS</div>
    <p class="status">本地待确认草稿 · 尚未发布 · 交易日期 2026/11/27</p>
    <nav aria-label="选择文章">#{navigation}</nav>
    <div class="language" role="group" aria-label="语言 Language">
      <button type="button" data-lang="zh" aria-pressed="true">中文</button>
      <button type="button" data-lang="en" aria-pressed="false">English</button>
    </div>
    <h1 id="title"></h1><p id="description"></p>
    #{content}
  </main>
  <script>
    let active = 0, language = 'zh';
    const entries = [...document.querySelectorAll('article')];
    let mathQueue = Promise.resolve();
    function typesetVisibleMath() {
      if (!window.MathJax || !MathJax.startup || !MathJax.startup.promise) return;
      mathQueue = mathQueue.then(() => MathJax.startup.promise).then(() => {
        const body = entries[active].querySelector('.reflection-body:not([hidden])');
        return MathJax.typesetPromise(body ? [body] : [entries[active]]);
      }).catch(error => console.error('MathJax typesetting failed', error));
    }
    function show() {
      entries.forEach((entry, index) => {
        entry.hidden = index !== active;
        entry.querySelectorAll('.reflection-body').forEach(body => { body.hidden = body.dataset.lang !== language; });
      });
      const entry = entries[active];
      document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
      document.getElementById('title').textContent = entry.dataset[language === 'zh' ? 'titleZh' : 'titleEn'];
      document.getElementById('description').textContent = entry.dataset[language === 'zh' ? 'descriptionZh' : 'descriptionEn'];
      document.querySelectorAll('[data-entry]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.entry) === active)));
      document.querySelectorAll('.language [data-lang]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === language)));
      typesetVisibleMath();
    }
    document.querySelectorAll('article table').forEach(table => { const wrap = document.createElement('div'); wrap.className = 'table-scroll'; table.before(wrap); wrap.appendChild(table); });
    document.addEventListener('click', event => {
      const entryButton = event.target.closest('[data-entry]');
      const langButton = event.target.closest('.language [data-lang]');
      const crossLink = event.target.closest('a[href^="#entry-"]');
      if (entryButton) { active = Number(entryButton.dataset.entry); show(); }
      if (langButton) { language = langButton.dataset.lang; show(); }
      if (crossLink) { event.preventDefault(); active = Number(crossLink.hash.slice(7)); show(); window.scrollTo(0,0); }
    });
    document.getElementById('MathJax-script').addEventListener('load', typesetVisibleMath);
    show();
  </script>
  </body></html>
HTML
File.open(output, "w:UTF-8", newline: :lf) { |file| file.write(page) }
puts JSON.generate(path: output.to_s, articles: articles.length, published: false)
