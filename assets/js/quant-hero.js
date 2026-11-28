// Geometric quant backdrop for page headers.
// Draws a lattice of grid nodes and a simulated mean-reverting path with
// occasional jumps (a Lévy-driven OU illustration) behind `.quant-hero` and
// `.post-header`. Purely decorative: aria-hidden, paused off-screen, and a
// single static frame when the visitor prefers reduced motion.
(function () {
  "use strict";

  var GRID = 24;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");

  function readColors() {
    var styles = getComputedStyle(document.documentElement);
    return {
      accent: styles.getPropertyValue("--global-theme-color").trim() || "#9cf0df",
      muted: styles.getPropertyValue("--global-text-color-light").trim() || "#adbdca",
      spark: styles.getPropertyValue("--global-spark-color").trim() || "#ffb27a",
      light: document.documentElement.getAttribute("data-theme") === "light",
    };
  }

  function hexToRgb(color) {
    var hex = color.replace("#", "");
    if (hex.length === 3) {
      hex = hex.replace(/(.)/g, "$1$1");
    }
    var value = parseInt(hex, 16);
    if (isNaN(value)) {
      return [156, 240, 223];
    }
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }

  function rgba(rgb, alpha) {
    return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + alpha + ")";
  }

  // Deterministic pseudo-random numbers so every visit starts from the same path.
  function makeRandom(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function makeNormal(random) {
    return function () {
      var u = Math.max(random(), 1e-9);
      var v = random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
  }

  function Backdrop(host, options) {
    this.host = host;
    this.compact = options.compact;
    // hero: homepage strip (OU path + Rips complex); path: header path;
    // torus: rotating wireframe torus in the header's free space.
    this.mode = options.mode;
    this.clearX = 0;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "quant-backdrop";
    this.canvas.setAttribute("aria-hidden", "true");
    host.insertBefore(this.canvas, host.firstChild);
    host.classList.add("has-quant-backdrop");
    this.ctx = this.canvas.getContext("2d");
    this.random = makeRandom(options.seed);
    this.normal = makeNormal(this.random);
    this.points = [];
    this.offset = 0;
    this.level = 0;
    this.visible = true;
    this.running = false;
    this.last = 0;
    this.colors = readColors();
    this.sparks = [];
    this.flashes = [];
    this.glints = [];
    this.geom = null;
    this.nodes = [];
    for (var k = 0; k < 18; k++) {
      this.nodes.push({
        x: this.random(),
        y: this.random(),
        vx: (this.random() - 0.5) * 0.00006,
        vy: (this.random() - 0.5) * 0.00009,
      });
    }
    this.resize();
  }

  // Right edge of the header's text, so compact drawings start after it.
  Backdrop.prototype.measureText = function () {
    var hostRect = this.host.getBoundingClientRect();
    var right = 0;
    var children = this.host.children;
    for (var i = 0; i < children.length; i++) {
      var el = children[i];
      if (el === this.canvas || !el.textContent.trim()) {
        continue;
      }
      var range = document.createRange();
      range.selectNodeContents(el);
      var rects = range.getClientRects();
      for (var r = 0; r < rects.length; r++) {
        right = Math.max(right, rects[r].right - hostRect.left);
      }
    }
    return right;
  };

  Backdrop.prototype.step = function () {
    // OU mean reversion toward zero, Gaussian diffusion, and rare jumps.
    var theta = 0.06;
    var sigma = this.compact ? 0.06 : 0.11;
    var jumpRate = this.compact ? 0.03 : 0.045;
    var jump = this.random() < jumpRate ? (this.random() < 0.5 ? -1 : 1) * (0.4 + this.random() * 0.5) : 0;
    this.level += -theta * this.level + sigma * this.normal() + jump;
    this.level = Math.max(-1.6, Math.min(1.6, this.level));
    // Spikes: one-sample needles that do not move the level (price prints).
    var spike = !jump && this.random() < (this.compact ? 0.04 : 0.07);
    var y = this.level;
    if (spike) {
      y = Math.max(-2.2, Math.min(2.2, this.level + (this.random() < 0.5 ? -1 : 1) * (0.7 + this.random() * 0.7)));
    }
    return { y: y, jump: jump !== 0, spike: spike, fired: false };
  };

  // Spark burst: short streaks flying out of an event point.
  Backdrop.prototype.burst = function (x, y, count, power, warm) {
    for (var i = 0; i < count; i++) {
      var angle = this.random() * Math.PI * 2;
      var speed = (0.04 + this.random() * 0.12) * power;
      this.sparks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        max: 420 + this.random() * 480,
        warm: this.random() < (warm ? 0.7 : 0.2),
      });
    }
    this.flashes.push({ x: x, y: y, age: 0, max: 560, power: power, warm: !!warm });
  };

  Backdrop.prototype.drawSparks = function (accent, strength) {
    var ctx = this.ctx;
    var h = this.height;
    var i;
    // On the homepage, keep every spark inside the chart strip.
    ctx.save();
    if (!this.compact) {
      ctx.beginPath();
      ctx.rect(0, h - 104, this.width, 104);
      ctx.clip();
    }
    for (i = 0; i < this.flashes.length; i++) {
      var f = this.flashes[i];
      var k = 1 - f.age / f.max;
      // Vertical spike flash through the event, plus an expanding ring.
      var reach = 26 + 34 * f.power;
      var g = ctx.createLinearGradient(0, f.y - reach, 0, f.y + reach);
      g.addColorStop(0, rgba(accent, 0));
      var fc = f.warm ? this.warmRgb : accent;
      g.addColorStop(0.5, rgba(fc, 0.8 * k * strength));
      g.addColorStop(1, rgba(accent, 0));
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(f.x, Math.max(0, f.y - reach));
      ctx.lineTo(f.x, Math.min(h, f.y + reach));
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(f.x, f.y, 3 + (1 - k) * 16 * f.power, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(fc, 0.55 * k * strength);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    for (i = 0; i < this.glints.length; i++) {
      var gl = this.glints[i];
      var ga = Math.sin((Math.PI * gl.age) / gl.max);
      this.glint(gl.x, gl.y, 1.5 + ga * 4.5, ga * 0.85 * strength, gl.warm ? this.warmRgb : accent);
    }
    for (i = 0; i < this.sparks.length; i++) {
      var s = this.sparks[i];
      var a = 1 - s.life / s.max;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 70, s.y - s.vy * 70);
      ctx.strokeStyle = rgba(s.warm ? this.warmRgb : accent, 0.9 * a * strength);
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
    ctx.restore();
  };

  // Four-point glint used for twinkles and travelling sparks.
  Backdrop.prototype.glint = function (x, y, size, alpha, accent) {
    var ctx = this.ctx;
    ctx.strokeStyle = rgba(accent, alpha);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1, size * 0.28), 0, Math.PI * 2);
    ctx.fillStyle = rgba(accent, Math.min(1, alpha * 1.2));
    ctx.fill();
  };

  Backdrop.prototype.resize = function () {
    var rect = this.host.getBoundingClientRect();
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.clearX = this.compact ? this.measureText() + 48 : 0;
    this.spacing = this.compact ? 8 : 6;
    var needed = Math.ceil(this.width / this.spacing) + 3;
    while (this.points.length < needed) {
      this.points.push(this.step());
    }
    if (this.points.length > needed) {
      this.points.splice(0, this.points.length - needed);
    }
    this.draw(0);
  };

  Backdrop.prototype.draw = function (time) {
    var ctx = this.ctx;
    var w = this.width;
    var h = this.height;
    var accent = hexToRgb(this.colors.accent);
    this.warmRgb = hexToRgb(this.colors.spark);
    var muted = hexToRgb(this.colors.muted);
    var strength = this.colors.light ? 0.75 : 1;
    ctx.clearRect(0, 0, w, h);
    // Keep header text unobstructed: draw only in the free space to its right.
    if (this.compact && !this.hasRoom()) {
      return;
    }
    if (this.mode === "torus") {
      this.drawTorus(time, accent, muted, strength);
      return;
    }
    var clearX = this.clearX;

    // The homepage hero reserves a chart strip at its bottom edge; compact
    // page headers draw the path through their (mostly empty) right side.
    var mid = this.compact ? h * 0.6 : h - 46;
    var amp = this.compact ? h * 0.17 : 24;
    // Long subtitles leave no room on the right: trace a thin baseline
    // along the header's bottom edge instead, below the text.
    var baseline = this.compact && w - clearX < 200;
    if (baseline) {
      clearX = w * 0.12;
      mid = h - 14;
      amp = 5;
    }
    var spacing = this.spacing;
    var shift = this.offset;
    var n = this.points.length;
    var xs = new Array(n);
    var ys = new Array(n);
    for (var i = 0; i < n; i++) {
      xs[i] = i * spacing - shift;
      ys[i] = mid - this.points[i].y * amp;
      // Keep spikes inside the reserved strip so they never touch the text.
      if (!this.compact) {
        ys[i] = Math.max(h - 92, Math.min(h - 10, ys[i]));
      }
    }
    var head = n - 3;
    var headX = xs[head];
    var headY = ys[head];

    // Lattice nodes on the 24px grid; nodes near the path light up.
    var cols = Math.ceil(w / GRID);
    var rows = Math.ceil(h / GRID);
    for (var c = 1; c < cols; c++) {
      var gx = c * GRID;
      var idx = Math.min(n - 1, Math.max(0, Math.round((gx + shift) / spacing)));
      var pathY = ys[idx];
      for (var r = 1; r < rows; r++) {
        var gy = r * GRID;
        if (baseline && gy < h - 30) {
          continue;
        }
        var d = Math.abs(gy - pathY);
        var glow = Math.max(0, 1 - d / (GRID * 2.2));
        var fade = this.compact ? Math.max(0, Math.min(1, (gx - clearX) / 120)) : Math.min(1, gx / (w * 0.35));
        if (!this.compact && gy < h - 100) {
          glow = 0;
        }
        var alpha = (0.07 + glow * 0.4) * fade * strength;
        if (alpha < 0.03) {
          continue;
        }
        ctx.fillStyle = glow > 0.05 ? rgba(accent, alpha) : rgba(muted, alpha * 0.8);
        var size = 1 + glow * 1.3;
        ctx.fillRect(gx - size / 2, gy - size / 2, size, size);
      }
    }

    if (!this.compact) {
      this.drawRips(time, accent, strength);
    }

    // Long-run mean the OU process reverts to.
    ctx.save();
    ctx.setLineDash([1, 5]);
    ctx.strokeStyle = rgba(muted, 0.28 * strength);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.compact ? clearX + 40 : w * 0.08, Math.round(mid) + 0.5);
    ctx.lineTo(w, Math.round(mid) + 0.5);
    ctx.stroke();
    ctx.restore();

    // Uncertainty band around the path (±σ envelope).
    var band = baseline ? 4 : this.compact ? 10 : 9;
    this.geom = { mid: mid, amp: amp, clearX: clearX, spread: baseline ? 6 : 34 };
    var gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, rgba(accent, 0));
    gradient.addColorStop(this.compact ? Math.min(0.95, (clearX + 80) / w) : 0.55, rgba(accent, 0.05 * strength));
    gradient.addColorStop(1, rgba(accent, 0.11 * strength));
    ctx.beginPath();
    for (var a = 0; a <= head; a++) {
      ctx[a === 0 ? "moveTo" : "lineTo"](xs[a], ys[a] - band);
    }
    for (var b = head; b >= 0; b--) {
      ctx.lineTo(xs[b], ys[b] + band);
    }
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Path line with a fading tail.
    // Compact headers keep the visible path clear of the title on the left.
    var tailStart = this.compact ? Math.min(0.9, clearX / Math.max(1, headX)) : 0;
    var line = ctx.createLinearGradient(0, 0, headX, 0);
    line.addColorStop(0, rgba(accent, 0));
    line.addColorStop(tailStart, rgba(accent, 0));
    line.addColorStop(tailStart + (1 - tailStart) * 0.35, rgba(accent, 0.4 * strength));
    line.addColorStop(1, rgba(accent, 0.95 * strength));
    ctx.beginPath();
    for (var p = 0; p <= head; p++) {
      ctx[p === 0 ? "moveTo" : "lineTo"](xs[p], ys[p]);
    }
    ctx.strokeStyle = line;
    ctx.lineWidth = this.compact ? 1.25 : 1.6;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Jump markers: small diamonds where the process jumped.
    for (var j = 1; j <= head; j++) {
      if (!this.points[j].jump || xs[j] < (this.compact ? clearX + 60 : w * 0.2)) {
        continue;
      }
      var s = 3;
      ctx.beginPath();
      ctx.moveTo(xs[j], ys[j] - s);
      ctx.lineTo(xs[j] + s, ys[j]);
      ctx.lineTo(xs[j], ys[j] + s);
      ctx.lineTo(xs[j] - s, ys[j]);
      ctx.closePath();
      ctx.strokeStyle = rgba(accent, 0.55 * strength);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Leading cursor: dashed crosshair and a pulsing node.
    ctx.save();
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = rgba(accent, 0.22 * strength);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(headX, baseline ? h - 28 : 0);
    ctx.lineTo(headX, h);
    ctx.moveTo(headX, headY);
    ctx.lineTo(w, headY);
    ctx.stroke();
    ctx.restore();

    var pulse = reduceMotion && reduceMotion.matches ? 0.5 : (Math.sin(time / 420) + 1) / 2;
    ctx.beginPath();
    ctx.arc(headX, headY, 5 + pulse * 5, 0, Math.PI * 2);
    ctx.fillStyle = rgba(accent, 0.12 * (1 - pulse) * strength);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headX, headY, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = rgba(accent, 0.95 * strength);
    ctx.fill();

    // Spike needles get a bright tip.
    for (var sp = 1; sp <= head; sp++) {
      if (this.points[sp].spike && xs[sp] > (this.compact ? clearX + 40 : w * 0.1)) {
        this.glint(xs[sp], ys[sp], baseline ? 2.5 : 3.5, 0.6 * strength, accent);
      }
    }

    // Fire a burst when a jump or spike reaches the leading edge.
    var event = this.points[head];
    if (this.running && event && (event.jump || event.spike) && !event.fired) {
      event.fired = true;
      var power = baseline ? 0.35 : this.compact ? 0.6 : event.jump ? 1 : 0.65;
      this.burst(headX, headY, event.jump ? 22 : 10, power, event.jump);
    }
    this.drawSparks(accent, strength);
  };

  Backdrop.prototype.hasRoom = function () {
    if (!this.compact) {
      return true;
    }
    if (this.mode === "path") {
      return this.width >= 600;
    }
    return this.width >= 600 && this.width - this.clearX >= 150;
  };

  // Vietoris–Rips complex on drifting points in the homepage chart strip.
  // The distance threshold breathes, so edges and 2-simplices appear and
  // vanish like a filtration in topological data analysis.
  Backdrop.prototype.drawRips = function (time, accent, strength) {
    var ctx = this.ctx;
    var w = this.width;
    var h = this.height;
    var left = w * 0.04;
    var top = h - 102;
    var spanX = w - left - 12;
    var spanY = 84;
    var eps = 64 + 26 * Math.sin(time / 2600);
    var pts = this.nodes.map(function (node) {
      return [left + node.x * spanX, top + node.y * spanY];
    });
    var n = pts.length;
    var dist = function (a, b) {
      var dx = pts[a][0] - pts[b][0];
      var dy = pts[a][1] - pts[b][1];
      return Math.sqrt(dx * dx + dy * dy);
    };
    var i;
    var j;
    var k;
    // 2-simplices (filled triangles).
    for (i = 0; i < n; i++) {
      for (j = i + 1; j < n; j++) {
        if (dist(i, j) > eps) {
          continue;
        }
        for (k = j + 1; k < n; k++) {
          if (dist(i, k) <= eps && dist(j, k) <= eps) {
            ctx.beginPath();
            ctx.moveTo(pts[i][0], pts[i][1]);
            ctx.lineTo(pts[j][0], pts[j][1]);
            ctx.lineTo(pts[k][0], pts[k][1]);
            ctx.closePath();
            ctx.fillStyle = rgba(accent, 0.05 * strength);
            ctx.fill();
          }
        }
      }
    }
    // 1-simplices (edges), fading as they approach the threshold.
    ctx.lineWidth = 0.8;
    for (i = 0; i < n; i++) {
      for (j = i + 1; j < n; j++) {
        var d = dist(i, j);
        if (d > eps) {
          continue;
        }
        ctx.beginPath();
        ctx.moveTo(pts[i][0], pts[i][1]);
        ctx.lineTo(pts[j][0], pts[j][1]);
        ctx.strokeStyle = rgba(accent, (1 - d / eps) * 0.32 * strength);
        ctx.stroke();
      }
    }
    // 0-simplices (vertices), each twinkling now and then.
    for (i = 0; i < n; i++) {
      ctx.fillStyle = rgba(accent, 0.45 * strength);
      ctx.fillRect(pts[i][0] - 1.5, pts[i][1] - 1.5, 3, 3);
      var tw = Math.pow(Math.max(0, Math.sin(time / 900 + i * 2.39)), 18);
      if (tw > 0.05) {
        this.glint(pts[i][0], pts[i][1], 2 + tw * 6, tw * 0.9 * strength, i % 3 === 0 ? this.warmRgb : accent);
      }
    }
  };

  // Wireframe torus with its two generating loops highlighted.
  Backdrop.prototype.drawTorus = function (time, accent, muted, strength) {
    var ctx = this.ctx;
    var w = this.width;
    var h = this.height;
    var free = w - this.clearX;
    var size = Math.min(free * 0.42, h * 0.6);
    var cx = w - size * 1.25 - 18;
    if (cx - size * 1.4 < this.clearX) {
      cx = this.clearX + free / 2;
    }
    var cy = h / 2;
    var scale = size / 1.4;
    var R = 1;
    var r = 0.42;
    var spin = time * 0.00016 + 0.4;
    var tilt = 1.08 + 0.18 * Math.sin(time * 0.0001);
    var cosT = Math.cos(tilt);
    var sinT = Math.sin(tilt);
    var TWO_PI = Math.PI * 2;

    var project = function (u, v) {
      var ring = R + r * Math.cos(v);
      var x = ring * Math.cos(u + spin);
      var y = ring * Math.sin(u + spin);
      var z = r * Math.sin(v);
      var y2 = y * cosT - z * sinT;
      var z2 = y * sinT + z * cosT;
      return [cx + x * scale, cy + y2 * scale, z2];
    };

    var strokeCurve = function (fixed, isMeridian, steps, base, width) {
      var prev = null;
      for (var s = 0; s <= steps; s++) {
        var t = (s / steps) * TWO_PI;
        var p = isMeridian ? project(fixed, t) : project(t, fixed);
        if (prev) {
          var depth = (p[2] + prev[2]) / 2;
          var a = (0.1 + (0.9 * (depth + 1.45)) / 2.9) * base * strength;
          ctx.beginPath();
          ctx.moveTo(prev[0], prev[1]);
          ctx.lineTo(p[0], p[1]);
          ctx.strokeStyle = rgba(accent, a);
          ctx.lineWidth = width;
          ctx.stroke();
        }
        prev = p;
      }
    };

    var meridians = 18;
    var parallels = 9;
    var m;
    for (m = 0; m < meridians; m++) {
      strokeCurve((m / meridians) * TWO_PI, true, 36, 0.32, 0.8);
    }
    for (m = 0; m < parallels; m++) {
      strokeCurve((m / parallels) * TWO_PI, false, 72, 0.26, 0.8);
    }
    // Generators of the torus's first homology: one meridian, one longitude.
    strokeCurve(0, true, 48, 0.95, 1.5);
    strokeCurve(0, false, 96, 0.8, 1.5);

    // Sparks travelling along both generator loops, with fading tails.
    var self = this;
    var travel = function (phase, isMeridian, color) {
      for (var tail = 12; tail >= 0; tail--) {
        var t = phase - tail * 0.07;
        var p = isMeridian ? project(0, t) : project(t, 0);
        var fade = 1 - tail / 13;
        var depthAlpha = 0.35 + 0.65 * ((p[2] + 1.45) / 2.9);
        if (tail === 0) {
          self.glint(p[0], p[1], 5, 0.95 * depthAlpha * strength, color);
        } else {
          ctx.fillStyle = rgba(color, 0.7 * fade * depthAlpha * strength);
          ctx.fillRect(p[0] - 1, p[1] - 1, 2, 2);
        }
      }
    };
    travel(time * 0.0011, true, accent);
    travel(time * 0.0006 + 2, false, this.warmRgb);

    // Lattice vertices where meridians meet parallels.
    for (m = 0; m < meridians; m++) {
      for (var q = 0; q < parallels; q++) {
        var v = project((m / meridians) * TWO_PI, (q / parallels) * TWO_PI);
        var alpha = (0.05 + (0.6 * (v[2] + 1.45)) / 2.9) * strength;
        ctx.fillStyle = rgba(muted, alpha);
        ctx.fillRect(v[0] - 1, v[1] - 1, 2, 2);
        // Occasional twinkles on the front-facing vertices.
        var tw = Math.pow(Math.max(0, Math.sin(time / 700 + m * 1.7 + q * 2.9)), 28);
        if (tw > 0.05 && v[2] > -0.2) {
          this.glint(v[0], v[1], 1.5 + tw * 4, tw * 0.9 * strength, (m + q) % 4 === 0 ? this.warmRgb : accent);
        }
      }
    }
  };

  Backdrop.prototype.tick = function (time) {
    if (!this.running) {
      return;
    }
    var dt = this.last ? Math.min(64, time - this.last) : 16;
    this.last = time;
    for (var nd = 0; nd < this.nodes.length; nd++) {
      var node = this.nodes[nd];
      node.x += node.vx * dt;
      node.y += node.vy * dt;
      if (node.x < 0 || node.x > 1) {
        node.vx = -node.vx;
        node.x = Math.max(0, Math.min(1, node.x));
      }
      if (node.y < 0 || node.y > 1) {
        node.vy = -node.vy;
        node.y = Math.max(0, Math.min(1, node.y));
      }
    }
    this.offset += dt * (this.compact ? 0.012 : 0.018);
    while (this.offset >= this.spacing) {
      this.offset -= this.spacing;
      this.points.shift();
      this.points.push(this.step());
    }
    var s;
    for (s = this.sparks.length - 1; s >= 0; s--) {
      var spark = this.sparks[s];
      spark.life += dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vy += 0.00012 * dt;
      spark.vx *= 0.985;
      if (spark.life >= spark.max) {
        this.sparks.splice(s, 1);
      }
    }
    for (s = this.flashes.length - 1; s >= 0; s--) {
      this.flashes[s].age += dt;
      if (this.flashes[s].age >= this.flashes[s].max) {
        this.flashes.splice(s, 1);
      }
    }
    // Ambient glints twinkling around the path.
    var geom = this.geom;
    if (geom && this.mode !== "torus" && this.random() < (this.compact ? 0.03 : 0.09)) {
      var gi = Math.floor(this.random() * Math.max(1, this.points.length - 4));
      var gx = gi * this.spacing - this.offset;
      if (gx > geom.clearX + 30) {
        this.glints.push({
          x: gx,
          y: geom.mid - this.points[gi].y * geom.amp + (this.random() - 0.5) * geom.spread,
          age: 0,
          max: 650 + this.random() * 450,
          warm: this.random() < 0.35,
        });
      }
    }
    for (s = this.glints.length - 1; s >= 0; s--) {
      this.glints[s].age += dt;
      if (this.glints[s].age >= this.glints[s].max) {
        this.glints.splice(s, 1);
      }
    }
    this.draw(time);
    var self = this;
    this.frame = requestAnimationFrame(function (t) {
      self.tick(t);
    });
  };

  Backdrop.prototype.start = function () {
    if (this.running || (reduceMotion && reduceMotion.matches) || !this.visible || document.hidden || !this.hasRoom()) {
      return;
    }
    this.running = true;
    this.last = 0;
    var self = this;
    this.frame = requestAnimationFrame(function (t) {
      self.tick(t);
    });
  };

  Backdrop.prototype.stop = function () {
    this.running = false;
    this.sparks = [];
    this.flashes = [];
    this.glints = [];
    if (this.frame) {
      cancelAnimationFrame(this.frame);
    }
    this.draw(0);
  };

  function init() {
    var hosts = document.querySelectorAll(".quant-hero, .post-header");
    if (!hosts.length || !document.createElement("canvas").getContext) {
      return;
    }
    var backdrops = [];
    for (var i = 0; i < hosts.length; i++) {
      backdrops.push(
        new Backdrop(hosts[i], {
          compact: !hosts[i].classList.contains("quant-hero"),
          mode: hosts[i].classList.contains("quant-hero") ? "hero" : hosts[i].getAttribute("data-backdrop") || "torus",
          seed: 20261127 + i * 7919,
        })
      );
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          backdrops.forEach(function (b) {
            if (b.host === entry.target) {
              b.visible = entry.isIntersecting;
              if (b.visible) {
                b.start();
              } else {
                b.stop();
              }
            }
          });
        });
      });
      backdrops.forEach(function (b) {
        io.observe(b.host);
      });
    }

    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(function () {
        backdrops.forEach(function (b) {
          b.resize();
          if (!b.hasRoom()) {
            b.stop();
          } else {
            b.start();
          }
        });
      });
      backdrops.forEach(function (b) {
        ro.observe(b.host);
      });
    }

    // Follow the dark / light / system theme switch.
    new MutationObserver(function () {
      var colors = readColors();
      backdrops.forEach(function (b) {
        b.colors = colors;
        if (!b.running) {
          b.draw(0);
        }
      });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    document.addEventListener("visibilitychange", function () {
      backdrops.forEach(function (b) {
        if (document.hidden) {
          b.stop();
        } else {
          b.start();
        }
      });
    });

    if (reduceMotion && reduceMotion.addEventListener) {
      reduceMotion.addEventListener("change", function () {
        backdrops.forEach(function (b) {
          if (reduceMotion.matches) {
            b.stop();
          } else {
            b.start();
          }
        });
      });
    }

    backdrops.forEach(function (b) {
      b.start();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
