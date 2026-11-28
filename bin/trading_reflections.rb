#!/usr/bin/env ruby
# frozen_string_literal: true

# Local drafting only: this program never commits, pushes, or deploys.
require "date"
require "digest"
require "json"
require "optparse"
require "pathname"
require "yaml"

ROOT = Pathname.new(__dir__).parent.realpath
DRAFTS = ROOT.parent.join(".work", "trading-reflections")
ARTICLES = ROOT.join("_trading_reflections")
TEMPLATE = ROOT.join("TRADING_REFLECTION_TEMPLATE.md")
SITE = "https://rexmiao.github.io/projects/trading-reflections/"
NAME = /\A(\d{4}-\d{2}-\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*\.md\z/

def read_article(path)
  text = path.read(encoding: "UTF-8").gsub("\r\n", "\n")
  match = text.match(/\A---\n(.*?)\n---\n(.*)\z/m)
  raise "Missing YAML front matter" unless match

  meta = YAML.safe_load(match[1], permitted_classes: [Date, Time], aliases: false)
  raise "Front matter must be a mapping" unless meta.is_a?(Hash)

  [meta, match[2]]
end

def serialize(meta, body)
  "#{YAML.dump(meta, line_width: -1)}---\n#{body}"
end

def write_new(path, text)
  path.parent.mkpath
  File.open(path, "wx:UTF-8", newline: :lf) { |file| file.write(text) }
end

def check_article(path)
  meta, body = read_article(path)
  name = path.basename.to_s.match(NAME)
  raise "Expected YYYY-MM-DD-lowercase-slug.md" unless name

  date = Date.iso8601(name[1])
  raw_date = meta["date"]
  article_date = case raw_date
                 when Time, Date then raw_date.to_date
                 when String then Date.iso8601(raw_date[0, 10])
                 else raise "Missing article date"
                 end
  raise "Filename date differs from article date" unless date == article_date

  %w[title description].each do |key|
    raise "Missing #{key}" unless meta[key].is_a?(String) && !meta[key].strip.empty?
  end
  raise "published must be true or false" unless [true, false].include?(meta["published"])
  %w[permalink layout project_parent].each do |key|
    raise "Use the collection's default #{key}" if meta.key?(key)
  end
  raise "Replace all TODO/template markers" if "#{meta.values.join("\n")}\n#{body}".match?(/\bTODO\b|\bTBD\b|填写复盘标题|用一句话概括这篇复盘的重点|待补充/i)

  bilingual = meta.key?("title_zh") || meta.key?("description_zh") || body.include?("reflection-body")
  if bilingual
    %w[title_zh description_zh].each do |key|
      raise "Missing #{key}" unless meta[key].is_a?(String) && !meta[key].strip.empty?
    end
    %w[en zh].each do |lang|
      blocks = body.scan(/<div\b([^>]*\bclass="reflection-body"[^>]*)>(.*?)<\/div>/m)
                   .select { |attrs, _| attrs.include?("data-lang=\"#{lang}\"") }
      raise "Expected one #{lang} body" unless blocks.length == 1

      attrs, content = blocks.first
      html_lang = lang == "en" ? "en" : "zh-CN"
      valid_lang = attrs.match?(/(?:\A|\s)lang="#{Regexp.escape(html_lang)}"(?:\s|\z)/)
      raise "Invalid #{lang} body attributes" unless valid_lang && attrs.include?('markdown="1"')
      hidden = attrs.match?(/\bhidden\b/)
      raise "English must be visible; Chinese must be hidden" unless hidden == (lang == "zh")
      prose = content.gsub(/<!--.*?-->/m, "").gsub(/^\s*\#{1,6} .*$|<[^>]+>/, "").strip
      raise "Empty #{lang} body" if prose.empty?
    end
  elsif body.gsub(/<!--.*?-->/m, "").gsub(/^\s*\#{1,6} .*$/, "").strip.empty?
    raise "Empty article body"
  end

  {
    path: path.to_s,
    sha256: Digest::SHA256.file(path).hexdigest,
    url: "#{SITE}#{path.basename('.md')}/",
    published: meta["published"],
    bilingual: bilingual
  }
end

begin
  command = ARGV.shift
  options = {}
  parser = OptionParser.new do |opts|
    opts.banner = "ruby bin/trading_reflections.rb new|check|prepare [draft.md] [options]"
    opts.on("--date YYYY-MM-DD") { |value| options[:date] = value }
    opts.on("--slug SLUG") { |value| options[:slug] = value }
    opts.on("--title TITLE") { |value| options[:title] = value }
    opts.on("--summary SUMMARY") { |value| options[:description] = value }
    opts.on("--title-zh TITLE") { |value| options[:title_zh] = value }
    opts.on("--summary-zh SUMMARY") { |value| options[:description_zh] = value }
    opts.on("--approved-sha256 HASH") { |value| options[:approved_sha256] = value }
    opts.on("-h", "--help") { puts opts; exit }
  end
  if %w[-h --help].include?(command)
    puts parser
    exit
  end
  parser.parse!(ARGV)

  case command
  when "new"
    raise "new accepts no positional arguments" unless ARGV.empty?
    date = options.fetch(:date) { raise "--date is required; do not infer a trading date" }
    raise "Use YYYY-MM-DD" unless date.match?(/\A\d{4}-\d{2}-\d{2}\z/)
    Date.iso8601(date)
    slug = options.fetch(:slug) { raise "--slug is required" }
    filename = "#{date}-#{slug}.md"
    raise "Use a lowercase ASCII slug separated by hyphens" unless filename.match?(NAME)
    raise "An article already uses this route" if ARTICLES.join(filename).exist?

    meta, body = read_article(TEMPLATE)
    %i[title description title_zh description_zh].each do |key|
      meta[key.to_s] = options.fetch(key, "TODO")
    end
    meta["date"] = date
    meta["published"] = false
    path = DRAFTS.join(filename)
    write_new(path, serialize(meta, body))
    puts JSON.generate(path: path.to_s, published: false, status: "local draft; fill TODOs before review")
  when "check", "prepare"
    raise "Specify exactly one draft/article path" unless ARGV.length == 1
    path = Pathname.new(ARGV.first).realpath
    report = check_article(path)
    if command == "prepare"
      raise "Prepare only a private draft under #{DRAFTS}" unless File.identical?(path.parent, DRAFTS)
      raise "Draft must have published: false" if report[:published]
      approved = options[:approved_sha256]
      raise "After user approval, pass the reviewed draft's full --approved-sha256" unless approved == report[:sha256]

      meta, body = read_article(path)
      raise "Draft changed; check and review again" unless Digest::SHA256.file(path).hexdigest == approved
      meta["published"] = true
      target = ARTICLES.join(path.basename)
      write_new(target, serialize(meta, body))
      report = check_article(target).merge(status: "prepared locally; not committed or deployed")
    end
    puts JSON.generate(report)
  else
    raise parser.to_s
  end
rescue StandardError => error
  warn JSON.generate(error: error.message)
  exit 1
end
