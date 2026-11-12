/* ==========================================================
   engine.js — 小游戏通用引擎
   每个游戏只需实现 init(api)，其余交给引擎
   ========================================================== */
(function () {
  "use strict";

  const CATS = {
    arcade: { name: "街机", color: "#a78bfa", icon: "🕹️" },
    puzzle: { name: "益智", color: "#22d3ee", icon: "🧩" },
    board: { name: "棋牌", color: "#34d399", icon: "♟️" },
    casual: { name: "休闲", color: "#fb923c", icon: "🎈" },
    brain: { name: "脑力", color: "#60a5fa", icon: "🧠" }
  };

  const GB = {
    games: [],
    add(cfg) {
      cfg.cat = cfg.cat || "casual";
      cfg.tags = cfg.tags || [];
      cfg.w = cfg.w || 480;
      cfg.h = cfg.h || 480;
      cfg.colors = cfg.colors || ["#2b2350", "#131020"];
      cfg.icon = cfg.icon || "🎮";
      cfg.desc = cfg.desc || "";
      cfg.tip = cfg.tip || "";
      if (this.games.some((g) => g.id === cfg.id)) {
        console.warn("duplicate game id:", cfg.id);
        return;
      }
      this.games.push(cfg);
    },
    get(id) { return this.games.find((g) => g.id === id); }
  };

  /* ---------------- 本地存储 ---------------- */
  const GS = {
    KEY: "gamesite.v1",
    data: { best: {}, recent: [], fav: [], plays: 0, sound: true, seen: {} },
    load() {
      try {
        const raw = localStorage.getItem(this.KEY);
        if (raw) Object.assign(this.data, JSON.parse(raw));
      } catch (e) {}
      return this.data;
    },
    save() {
      try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) {}
    },
    best(id) { return this.data.best[id] || 0; },
    submit(id, score) {
      const prev = this.best(id);
      if (score > prev) {
        this.data.best[id] = score;
        this.save();
        return true;
      }
      return false;
    },
    touch(id) {
      const r = this.data.recent.filter((x) => x !== id);
      r.unshift(id);
      this.data.recent = r.slice(0, 10);
      this.save();
    },
    fav(id) {
      const i = this.data.fav.indexOf(id);
      if (i >= 0) this.data.fav.splice(i, 1);
      else this.data.fav.unshift(id);
      this.save();
      return i < 0;
    },
    isFav(id) { return this.data.fav.indexOf(id) >= 0; }
  };

  /* ---------------- 音效 ---------------- */
  const Sound = {
    ctx: null,
    on: true,
    init() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },
    play(freq, dur, type, vol, slide) {
      if (!this.on) return;
      const ctx = this.init();
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol == null ? 0.07 : vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    noise(dur, vol, cutoff) {
      if (!this.on) return;
      const ctx = this.init();
      if (!ctx) return;
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = cutoff || 900;
      const g = ctx.createGain(); g.gain.value = vol == null ? 0.1 : vol;
      src.connect(f).connect(g).connect(ctx.destination);
      src.start(ctx.currentTime);
    },
    ok() { this.play(660, 0.09, "sine", 0.06, 880); },
    bad() { this.play(160, 0.16, "square", 0.06, 90); },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.play(f, 0.28, "triangle", 0.075), i * 90));
    }
  };

  /* ---------------- 工具 ---------------- */
  const T = {
    rand(a, b) { return a + Math.random() * (b - a); },
    ri(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    clamp(v, a, b) { return v < a ? a : v > b ? b : v; },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    rr(ctx, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },
    fmt(n) { return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n); }
  };

  /* ---------------- 运行器 ---------------- */
  const Runner = {
    cur: null,

    mount(stage, game, hooks) {
      this.stop();
      hooks = hooks || {};
      const canvas = document.createElement("canvas");
      stage.appendChild(canvas);
      const ctx = canvas.getContext("2d");
      const W = game.w, H = game.h;

      const st = {
        score: 0, over: false, win: false, t: 0, dead: false,
        keys: {}, handlers: { key: [], keyup: [], down: [], move: [], up: [] },
        loops: [], snap: null, btn: null, dpadCb: null, dpadRects: [],
        overlayTitle: "", overlaySub: ""
      };

      let best = GS.best(game.id);
      const report = () => hooks.onScore && hooks.onScore(st.score, Math.max(best, st.score));

      /* 自适应尺寸（逻辑坐标 W×H 不变） */
      function fit() {
        const aw = stage.clientWidth, ah = stage.clientHeight;
        if (!aw || !ah) return;
        const s = Math.min(aw / W, ah / H);
        const cw = Math.max(80, Math.floor(W * s));
        const ch = Math.max(80, Math.floor(H * s));
        canvas.style.width = cw + "px";
        canvas.style.height = ch + "px";
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
        ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
        st.snap = null;
      }

      const ro = window.ResizeObserver ? new ResizeObserver(fit) : null;
      if (ro) ro.observe(stage);

      /* ---------- api ---------- */
      const api = {
        ctx, w: W, h: H, canvas, game,
        get score() { return st.score; },
        get best() { return best; },
        get over() { return st.over; },
        get keys() { return st.keys; },
        get t() { return st.t; },
        rand: T.rand, ri: T.ri, pick: T.pick, clamp: T.clamp, shuffle: T.shuffle,
        rr: (x, y, w, h, r) => T.rr(ctx, x, y, w, h, r),
        beep: (f, d, ty, v, s) => Sound.play(f, d, ty, v, s),
        noise: (d, v, c) => Sound.noise(d, v, c),
        ok: () => Sound.ok(),
        bad: () => Sound.bad(),
        win: () => Sound.win(),

        setScore(n) {
          st.score = Math.max(0, Math.round(n));
          if (st.score > best) { best = st.score; }
          report();
        },
        addScore(n) { api.setScore(st.score + n); },

        loop(fn) { st.loops.push(fn); },

        onKey(fn) { st.handlers.key.push(fn); },
        onKeyUp(fn) { st.handlers.keyup.push(fn); },
        onDown(fn) { st.handlers.down.push(fn); },
        onMove(fn) { st.handlers.move.push(fn); },
        onUp(fn) { st.handlers.up.push(fn); },

        dpad(cb) { st.dpadCb = cb; },

        font(size, weight) {
          ctx.font = (weight || 600) + " " + size + "px system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif";
        },
        text(str, x, y, o) {
          o = o || {};
          ctx.save();
          api.font(o.size || 16, o.weight);
          ctx.fillStyle = o.color || "#eef1f8";
          ctx.textAlign = o.align || "center";
          ctx.textBaseline = o.baseline || "middle";
          if (o.alpha != null) ctx.globalAlpha = o.alpha;
          ctx.fillText(str, x, y);
          ctx.restore();
        },
        clear(color) {
          ctx.clearRect(0, 0, W, H);
          if (color) { ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); }
        },

        over(title, sub, isWin) {
          if (st.over) return;
          st.over = true;
          st.win = !!isWin;
          st.overlayTitle = title || "游戏结束";
          st.overlaySub = sub || "";
          if (st.score > best) { best = st.score; }
          GS.submit(game.id, st.score);
          report();
          if (isWin) Sound.win(); else Sound.bad();
        },

        restart() { restart(); },
        destroy() { destroy(); },
        hint(str) { hooks.onHint && hooks.onHint(str); }
      };

      /* ---------- 循环 ---------- */
      let last = performance.now();
      let raf = 0;

      function frame(ts) {
        if (st.dead) return;
        const dt = Math.min((ts - last) / 1000, 0.05);
        last = ts;
        if (!st.over) {
          st.t += dt;
          for (let i = 0; i < st.loops.length; i++) st.loops[i](dt, st.t);
        }
        if (st.over) {
          if (!st.snap) {
            const s = document.createElement("canvas");
            s.width = canvas.width; s.height = canvas.height;
            s.getContext("2d").drawImage(canvas, 0, 0);
            st.snap = s;
          } else {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(st.snap, 0, 0);
            ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
          }
          drawOverlay();
        } else if (st.dpadCb) {
          drawDpad();
        }
        raf = requestAnimationFrame(frame);
      }

      function drawOverlay() {
        ctx.save();
        ctx.fillStyle = "rgba(5,6,11,.76)";
        ctx.fillRect(0, 0, W, H);
        const pw = Math.min(W * 0.84, 340), ph = 250;
        const px = (W - pw) / 2, py = (H - ph) / 2;
        ctx.shadowColor = "rgba(0,0,0,.7)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
        T.rr(ctx, px, py, pw, ph, 20);
        ctx.fillStyle = "#151a26";
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = st.win ? "rgba(52,211,153,.45)" : "rgba(255,255,255,.13)";
        ctx.lineWidth = 1.4; ctx.stroke();

        api.text(st.overlayTitle, W / 2, py + 62, { size: 25, weight: 800, color: st.win ? "#6ee7b7" : "#fff" });
        if (st.overlaySub) {
          api.text(st.overlaySub, W / 2, py + 96, { size: 13, color: "#8b94a8" });
        }
        api.text("本局得分", W / 2, py + 132, { size: 11, color: "#5f6a80" });
        api.text(String(st.score), W / 2, py + 160, { size: 30, weight: 800, color: "#fbbf24" });
        api.text("最高 " + Math.max(best, st.score), W / 2, py + 186, { size: 11.5, color: "#7c879b" });

        const bw = 168, bh = 42, bx = (W - bw) / 2, by = py + ph - 58;
        T.rr(ctx, bx, by, bw, bh, 12);
        const g = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
        g.addColorStop(0, "#7c5cff"); g.addColorStop(1, "#5b3ce0");
        ctx.fillStyle = g; ctx.fill();
        api.text("再来一局", W / 2, by + bh / 2 + 1, { size: 14, weight: 700, color: "#fff" });
        st.btn = { x: bx, y: by, w: bw, h: bh };
        ctx.restore();
      }

      function drawDpad() {
        const size = Math.min(W, H) * 0.13;
        const gap = 4;
        const cx = W / 2, cy = H - size * 0.95;
        const rects = [
          { d: "U", x: cx - size / 2, y: cy - size - gap, s: size, t: "▲" },
          { d: "L", x: cx - size * 1.5 - gap, y: cy, s: size, t: "◀" },
          { d: "D", x: cx - size / 2, y: cy, s: size, t: "▼" },
          { d: "R", x: cx + size / 2 + gap, y: cy, s: size, t: "▶" }
        ];
        st.dpadRects = rects;
        ctx.save();
        for (const r of rects) {
          const pressed = st.pressedDir === r.d;
          ctx.globalAlpha = pressed ? 0.85 : 0.5;
          T.rr(ctx, r.x, r.y, r.s, r.s, r.s * 0.22);
          ctx.fillStyle = pressed ? "rgba(124,92,255,.9)" : "rgba(16,19,28,.85)";
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.16)";
          ctx.lineWidth = 1;
          ctx.stroke();
          api.text(r.t, r.x + r.s / 2, r.y + r.s / 2, { size: r.s * 0.42, color: "#dfe5f2" });
        }
        ctx.restore();
      }

      /* ---------- 输入 ---------- */
      function onKeyDown(e) {
        const k = e.key;
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Spacebar"].indexOf(k) >= 0) e.preventDefault();
        st.keys[k] = true;
        if (st.over) {
          if (k === "r" || k === "R" || k === " " || k === "Enter") restart();
          return;
        }
        for (const fn of st.handlers.key) fn(k, e);
      }
      function onKeyUp(e) {
        st.keys[e.key] = false;
        for (const fn of st.handlers.keyup) fn(e.key, e);
      }
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);

      function local(e) {
        const r = canvas.getBoundingClientRect();
        return {
          x: (e.clientX - r.left) / r.width * W,
          y: (e.clientY - r.top) / r.height * H
        };
      }
      function pd(e) {
        e.preventDefault();
        Sound.init();
        const p = local(e);
        if (st.over) {
          const b = st.btn;
          if (b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) restart();
          return;
        }
        if (st.dpadCb) {
          for (const r of st.dpadRects) {
            if (p.x >= r.x && p.x <= r.x + r.s && p.y >= r.y && p.y <= r.y + r.s) {
              st.pressedDir = r.d;
              st.dpadCb(r.d);
              setTimeout(() => { st.pressedDir = null; }, 110);
              return;
            }
          }
        }
        for (const fn of st.handlers.down) fn(p, e);
      }
      function pm(e) {
        if (st.over) return;
        const p = local(e);
        for (const fn of st.handlers.move) fn(p, e);
      }
      function pu(e) {
        if (st.over) return;
        const p = local(e);
        for (const fn of st.handlers.up) fn(p, e);
      }
      canvas.addEventListener("pointerdown", pd);
      canvas.addEventListener("pointermove", pm);
      canvas.addEventListener("pointerup", pu);
      canvas.addEventListener("pointercancel", pu);

      /* ---------- 生命周期 ---------- */
      function restart() {
        st.over = false; st.win = false; st.snap = null; st.score = 0;
        st.t = 0; st.loops.length = 0;
        st.handlers = { key: [], keyup: [], down: [], move: [], up: [] };
        st.dpadCb = null; st.btn = null;
        ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
        ctx.clearRect(0, 0, W, H);
        report();
        try { game.init(api); } catch (err) { console.error(err); }
      }

      function destroy() {
        st.dead = true;
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        if (ro) ro.disconnect();
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        if (hooks.onEnd) hooks.onEnd(st.score);
      }

      this.cur = { destroy, restart, api, state: st, canvas };
      fit();
      report();
      GS.touch(game.id);
      GS.data.plays = (GS.data.plays || 0) + 1;
      GS.save();
      try { game.init(api); } catch (err) {
        console.error("game init failed:", game.id, err);
        ctx.fillStyle = "#151a26"; ctx.fillRect(0, 0, W, H);
        api.text("加载失败", W / 2, H / 2, { size: 18, color: "#ff7a7a" });
      }
      requestAnimationFrame(frame);
      // 延迟一拍再 fit，保证 stage 已完成布局
      setTimeout(fit, 0);
      return this.cur;
    },

    stop() {
      if (this.cur) {
        try { this.cur.destroy(); } catch (e) {}
        this.cur = null;
      }
    }
  };

  window.GB = GB;
  window.CATS = CATS;
  window.GS = GS;
  window.Sound = Sound;
  window.Runner = Runner;
  window.T = T;
})();
