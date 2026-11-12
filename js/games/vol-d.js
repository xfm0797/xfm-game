/* ==========================================================
   vol-d.js — 休闲反应扩展 18 款
   ========================================================== */
(function () {
  "use strict";

  const hit = (p, x, y, w, h) => p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;
  const bar = (api, x, y, w, pct, color) => {
    api.rr(x, y, w, 6, 3); api.ctx.fillStyle = "rgba(255,255,255,.1)"; api.ctx.fill();
    api.rr(x, y, Math.max(2, w * Math.max(0, Math.min(1, pct))), 6, 3);
    api.ctx.fillStyle = color || "#7c5cff"; api.ctx.fill();
  };

  /* 1. 戳泡泡纸 */
  GB.add({
    id: "bubblewrap", name: "戳泡泡纸", cat: "casual", icon: "🫧", tags: ["new"],
    desc: "把整版泡泡全部戳破，纯粹解压", tip: "点一个破一个，连戳加分", w: 480, h: 560,
    colors: ["#1f3b4a", "#08141a"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const COLS = 8, ROWS = 7, R = 23;
      const ox = (W - COLS * R * 2.1) / 2 + R, oy = 90;
      let cells, popped, combo, lastPop, score;
      cells = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        cells.push({ x: ox + c * R * 2.1, y: oy + r * R * 2.1, on: false, t: 0 });
      }
      popped = 0; combo = 0; lastPop = -9; score = 0;
      api.onDown((p) => {
        for (const c of cells) {
          if (c.on) continue;
          if (Math.hypot(p.x - c.x, p.y - c.y) < R) {
            c.on = true; c.t = .3; popped++;
            combo = (api.t - lastPop < .5) ? combo + 1 : 1;
            lastPop = api.t;
            score += 2 + Math.min(5, combo - 1);
            api.setScore(score);
            api.beep(600 + Math.min(8, combo) * 60, .04, "sine", .045);
            if (popped === cells.length) api.over("整版都戳完了！", "得分 " + score, true);
            return;
          }
        }
      });
      api.loop((dt) => {
        api.clear("#08141a");
        api.text("戳泡泡纸 · " + popped + "/" + cells.length, W / 2, 34, { size: 12.5, weight: 700, color: "#7dd3e8" });
        cells.forEach((c) => {
          if (c.t > 0) c.t -= dt;
          if (!c.on) {
            const g = ctx.createRadialGradient(c.x - 6, c.y - 7, 2, c.x, c.y, R);
            g.addColorStop(0, "rgba(190,240,255,.9)");
            g.addColorStop(.7, "rgba(80,170,205,.55)");
            g.addColorStop(1, "rgba(30,90,115,.75)");
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(c.x, c.y, R - 2, 0, 7); ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.stroke();
          } else {
            ctx.fillStyle = "rgba(255,255,255,.045)";
            ctx.beginPath(); ctx.arc(c.x, c.y, R - 6, 0, 7); ctx.fill();
            if (c.t > 0) {
              ctx.strokeStyle = "rgba(125,211,232," + (c.t / .3) + ")";
              ctx.lineWidth = 2;
              ctx.beginPath(); ctx.arc(c.x, c.y, R * (1.2 - c.t), 0, 7); ctx.stroke();
              ctx.lineWidth = 1;
            }
          }
        });
        if (combo > 1 && api.t - lastPop < .5) api.text("连戳 ×" + combo, W / 2, H - 26, { size: 13, weight: 800, color: "#fbbf24" });
      });
    }
  });

  /* 2. 钢琴块 */
  GB.add({
    id: "pianotiles", name: "钢琴块", cat: "casual", icon: "🎹", tags: ["new"],
    desc: "在方块落到底部时准确敲击", tip: "点对应列，或按 D F J K", w: 400, h: 600,
    colors: ["#1d2033", "#080a12"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const LANES = 4, LW = W / LANES, ZONE = H - 108;
      let tiles, acc, score, miss, speed, flash;
      tiles = []; acc = 0; score = 0; miss = 0; speed = 250; flash = [0, 0, 0, 0];
      function tap(lane) {
        flash[lane] = .12;
        let best = null;
        for (const t of tiles) {
          if (t.lane !== lane || t.dead) continue;
          if (t.y > ZONE - 40 && t.y < ZONE + 80) { if (!best || t.y > best.y) best = t; }
        }
        if (best) {
          best.dead = true; score += 10; api.setScore(score);
          api.beep([523, 587, 659, 784][lane], .09, "triangle", .07);
        } else { miss++; api.bad(); }
        if (miss >= 3) api.over("漏了三个音", "得分 " + score, false);
      }
      api.onDown((p) => tap(Math.min(LANES - 1, Math.floor(p.x / LW))));
      api.onKey((k) => {
        const map = { d: 0, f: 1, j: 2, k: 3 };
        if (map[k] !== undefined) tap(map[k]);
      });
      api.loop((dt, t) => {
        speed = 250 + t * 10;
        acc += dt;
        if (acc > .46) { acc = 0; tiles.push({ lane: api.ri(0, 3), y: -80, dead: false }); }
        tiles.forEach((o) => {
          o.y += speed * dt;
          if (!o.dead && o.y > ZONE + 84) { o.dead = true; miss++; api.bad(); }
        });
        tiles = tiles.filter((o) => o.y < H + 120);
        if (miss >= 3) return;
        api.clear("#080a12");
        for (let i = 0; i < LANES; i++) {
          ctx.fillStyle = i % 2 ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.055)";
          ctx.fillRect(i * LW, 0, LW, H);
          ctx.strokeStyle = "rgba(255,255,255,.09)";
          ctx.beginPath(); ctx.moveTo(i * LW, 0); ctx.lineTo(i * LW, H); ctx.stroke();
          if (flash[i] > 0) {
            flash[i] -= dt;
            ctx.fillStyle = "rgba(124,92,255,.25)";
            ctx.fillRect(i * LW, 0, LW, H);
          }
        }
        ctx.fillStyle = "rgba(34,211,238,.08)";
        ctx.fillRect(0, ZONE, W, 96);
        ctx.strokeStyle = "rgba(34,211,238,.5)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, ZONE + 90); ctx.lineTo(W, ZONE + 90); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, ZONE - 40); ctx.lineTo(W, ZONE - 40); ctx.stroke();
        ctx.lineWidth = 1;
        tiles.forEach((o) => {
          if (o.dead) return;
          api.rr(o.lane * LW + 5, o.y - 70, LW - 10, 76, 6);
          const g = ctx.createLinearGradient(0, o.y - 70, 0, o.y);
          g.addColorStop(0, "#a78bfa"); g.addColorStop(1, "#5b3ce0");
          ctx.fillStyle = g; ctx.fill();
        });
        api.text("♥♥♥".slice(0, Math.max(0, 3 - miss)), 14, 26, { size: 13, color: "#ff8fa8", align: "left" });
        api.text("得分 " + score, W - 14, 26, { size: 13, weight: 700, color: "#d7c9ff", align: "right" });
      });
    }
  });

  /* 3. 打鸭子 */
  GB.add({
    id: "duckshoot", name: "打鸭子", cat: "casual", icon: "🦆", tags: ["new"],
    desc: "30 秒内打下尽可能多的鸭子", tip: "点击鸭子射击，别浪费子弹", w: 480, h: 520,
    colors: ["#1e3a5c", "#08121c"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let ducks, acc, score, left, shots;
      ducks = []; acc = 0; score = 0; left = 30; shots = 0;
      api.onDown((p) => {
        shots++;
        let got = null;
        for (const d of ducks) if (!d.dead && Math.hypot(p.x - d.x, p.y - d.y) < 30) got = d;
        if (got) {
          got.dead = true; score += 10; api.setScore(score);
          api.beep(880, .06, "square", .05); api.noise(.1, .06, 2000);
        } else api.beep(200, .06, "sine", .03);
      });
      api.loop((dt, t) => {
        left -= dt;
        if (left <= 0) { api.over("时间到", "打下 " + score / 10 + " 只 · 命中率 " + (shots ? Math.round(score / 10 / shots * 100) : 0) + "%", true); return; }
        acc += dt;
        if (acc > .85) {
          acc = 0;
          const fromLeft = Math.random() < .5;
          ducks.push({
            x: fromLeft ? -30 : W + 30, y: api.rand(90, H - 130),
            vx: (fromLeft ? 1 : -1) * api.rand(60, 120), ph: api.rand(0, 6)
          });
        }
        ducks.forEach((d) => { d.x += d.vx * dt; d.y += Math.sin(t * 3 + d.ph) * 22 * dt; });
        ducks = ducks.filter((d) => !d.dead && d.x > -60 && d.x < W + 60);
        api.clear("#08121c");
        ctx.fillStyle = "#0e2a3f"; ctx.fillRect(0, H - 70, W, 70);
        ctx.fillStyle = "#123b56";
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.ellipse((i * 120 + t * 18) % (W + 120), H - 40, 60, 10, 0, 0, 7);
          ctx.fill();
        }
        ducks.forEach((d) => {
          ctx.save(); ctx.translate(d.x, d.y); ctx.scale(d.vx > 0 ? 1 : -1, 1);
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath(); ctx.ellipse(0, 0, 22, 14, 0, 0, 7); ctx.fill();
          ctx.fillStyle = "#fde68a";
          ctx.beginPath(); ctx.arc(16, -8, 9, 0, 7); ctx.fill();
          ctx.fillStyle = "#f97316";
          ctx.beginPath(); ctx.moveTo(24, -8); ctx.lineTo(34, -4); ctx.lineTo(24, -1); ctx.closePath(); ctx.fill();
          ctx.fillStyle = "#1b1b2b";
          ctx.beginPath(); ctx.arc(18, -10, 1.8, 0, 7); ctx.fill();
          ctx.restore();
        });
        const c = api.t;
        ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(W / 2 - 12, H - 6); ctx.lineTo(W / 2 - 12, H - 26); ctx.moveTo(W / 2 + 12, H - 6); ctx.lineTo(W / 2 + 12, H - 26); ctx.stroke();
        ctx.lineWidth = 1;
        bar(api, 14, 16, 130, left / 30, "#22d3ee");
        api.text("剩余 " + Math.ceil(left) + "s", 152, 19, { size: 10.5, color: "#7d8ba5", align: "left" });
        api.text("命中 " + score / 10 + " · 射击 " + shots, W - 14, 20, { size: 11.5, weight: 700, color: "#ffd166", align: "right" });
      });
    }
  });

  /* 4. 水果切割 */
  GB.add({
    id: "slice", name: "水果切割", cat: "casual", icon: "🍉", tags: ["new"],
    desc: "滑动切开水果，千万别碰炸弹", tip: "按住拖出刀光切水果", w: 480, h: 560,
    colors: ["#33203a", "#0e0714"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const FRUIT = ["🍉", "🍊", "🍎", "🍋", "🥝", "🍇", "🍓"];
      let items, trail, acc, score, slice, down;
      items = []; trail = []; acc = 0; score = 0; slice = 0; down = false;
      api.onDown((p) => { down = true; trail = [{ x: p.x, y: p.y, t: api.t }]; });
      api.onUp(() => { down = false; trail = []; });
      api.onMove((p) => {
        if (!down) return;
        trail.push({ x: p.x, y: p.y, t: api.t });
        if (trail.length > 10) trail.shift();
        for (const it of items) {
          if (it.dead) continue;
          for (let i = 1; i < trail.length; i++) {
            const a = trail[i - 1], b = trail[i];
            const vx = b.x - a.x, vy = b.y - a.y;
            const wx = it.x - a.x, wy = it.y - a.y;
            const len2 = vx * vx + vy * vy || 1;
            const tt = Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2));
            const px = a.x + vx * tt, py = a.y + vy * tt;
            if (Math.hypot(px - it.x, py - it.y) < it.r + 6) {
              if (it.bomb) { it.dead = true; api.over("切到炸弹了", "切了 " + slice + " 个水果", false); return; }
              it.dead = true; slice++; score += 10; api.setScore(score);
              api.beep(700 + Math.random() * 200, .05, "sine", .04);
              break;
            }
          }
        }
      });
      api.loop((dt, t) => {
        acc += dt;
        if (acc > Math.max(.5, 1.1 - t * .01)) {
          acc = 0;
          const bomb = Math.random() < .16;
          items.push({
            x: api.rand(60, W - 60), y: H + 40,
            vx: api.rand(-90, 90), vy: api.rand(-720, -600),
            r: 24, rot: 0, vr: api.rand(-3, 3),
            emoji: bomb ? "💣" : api.pick(FRUIT), bomb: bomb
          });
        }
        items.forEach((it) => {
          it.vy += 900 * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vr * dt;
        });
        items = items.filter((it) => !it.dead && it.y < H + 120);
        api.clear("#0e0714");
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = "rgba(255,255,255,.035)";
          ctx.beginPath(); ctx.arc((i * 97 + 40) % W, (i * 131) % H, 60, 0, 7); ctx.fill();
        }
        items.forEach((it) => {
          ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.rot);
          api.text(it.emoji, 0, 2, { size: 40 });
          ctx.restore();
        });
        if (trail.length > 1) {
          ctx.strokeStyle = "rgba(255,255,255,.7)";
          ctx.lineWidth = 3; ctx.lineCap = "round";
          ctx.beginPath();
          trail.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
          ctx.stroke();
          ctx.lineWidth = 1; ctx.lineCap = "butt";
        }
        api.text("已切 " + slice, 14, 24, { size: 12, weight: 700, color: "#ffd166", align: "left" });
      });
    }
  });

  /* 5. 水果老虎机 */
  GB.add({
    id: "slot", name: "水果老虎机", cat: "casual", icon: "🎰", tags: ["new"],
    desc: "转出三个相同图案拿大奖", tip: "点击开始转动，共 10 次机会", w: 480, h: 520,
    colors: ["#3a2438", "#100810"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const SYM = ["🍒", "🍋", "🍇", "⭐", "🔔", "💎"];
      let reels, spinning, tStop, result, spinLeft, score, msg, msgT;
      reels = [{ i: 0, pos: 0, stop: 0 }, { i: 0, pos: 0, stop: 0 }, { i: 0, pos: 0, stop: 0 }];
      spinning = false; tStop = [0, 0, 0]; result = null; spinLeft = 10; score = 0; msg = ""; msgT = 0;
      function spin() {
        if (spinning || spinLeft <= 0) return;
        spinLeft--; spinning = true;
        reels.forEach((r, i) => { r.stop = api.t + .7 + i * .35; r.result = api.ri(0, SYM.length - 1); });
        api.beep(420, .1, "square", .04, 700);
      }
      api.onDown(spin);
      api.onKey((k) => { if (k === " " || k === "Enter") spin(); });
      api.loop((dt) => {
        let allStopped = spinning;
        reels.forEach((r) => {
          if (spinning && api.t < r.stop) { r.pos += dt * 14; }
          else if (spinning) {
            r.pos += dt * Math.max(1, (r.stop - api.t) * 30);
            const target = r.result;
            r.i = target;
          }
          if (spinning && api.t < r.stop) allStopped = false;
        });
        if (spinning && allStopped) {
          spinning = false;
          const a = reels[0].result, b = reels[1].result, c = reels[2].result;
          if (a === b && b === c) {
            const win = a === 5 ? 300 : 150;
            score += win; msg = "★ 三连 " + SYM[a] + " +" + win; msgT = 1.6;
            api.beep(880, .12, "triangle", .08);
            setTimeout(() => api.beep(1200, .16, "triangle", .08), 110);
          } else if (a === b || b === c || a === c) {
            score += 20; msg = "两个相同 +20"; msgT = 1.2;
            api.beep(660, .08, "sine", .05);
          } else { msg = "没中，再来一次"; msgT = 1.2; api.beep(220, .1, "square", .035); }
          api.setScore(score);
          if (spinLeft <= 0) setTimeout(() => api.over("筹码用完了", "总分 " + score, score >= 300), 700);
        }
        api.clear("#100810");
        api.text("水果老虎机 · 剩余 " + spinLeft + " 次", W / 2, 32, { size: 12.5, weight: 700, color: "#ffd166" });
        const cw = 118, ch = 132, gap = 16;
        const startX = (W - (cw * 3 + gap * 2)) / 2;
        reels.forEach((r, i) => {
          const x = startX + i * (cw + gap), y = 110;
          api.rr(x, y, cw, ch, 14);
          ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fill();
          ctx.strokeStyle = "rgba(251,191,36,.35)"; ctx.stroke();
          const idx = spinning ? Math.floor(r.pos) % SYM.length : r.i;
          api.text(SYM[idx], x + cw / 2, y + ch / 2, { size: 50 });
        });
        if (msgT > 0) {
          msgT -= dt;
          api.text(msg, W / 2, 300, { size: 15, weight: 800, color: "#6ee7b7" });
        }
        api.text("累计 " + score, W / 2, 350, { size: 20, weight: 800, color: "#fbbf24" });
        api.rr(W / 2 - 80, 400, 160, 46, 14);
        const g = ctx.createLinearGradient(W / 2 - 80, 0, W / 2 + 80, 0);
        g.addColorStop(0, "#f59e0b"); g.addColorStop(1, "#b45309");
        ctx.fillStyle = g; ctx.fill();
        api.text(spinLeft > 0 ? "开始转动" : "已用完", W / 2, 424, { size: 15, weight: 800, color: "#fff" });
        api.text("三连 ⭐/💎 有超级奖励", W / 2, H - 18, { size: 10.5, color: "#5f6a80" });
      });
    }
  });

  /* 6. 钓鱼 */
  GB.add({
    id: "fishing", name: "钓鱼", cat: "casual", icon: "🎣", tags: ["new"],
    desc: "看准浮标下沉的一瞬间提竿", tip: "点击抛竿，浮标下沉时再点", w: 480, h: 560,
    colors: ["#123a48", "#06121a"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let state, waitT, bobY, score, casts, tipT, flash;
      state = "idle"; waitT = 0; bobY = 300; score = 0; casts = 8; tipT = 0; flash = 0;
      api.onDown(() => {
        if (state === "idle" || state === "result") {
          if (casts <= 0) return;
          casts--; state = "cast"; waitT = 0; bobY = 300;
          api.beep(520, .08, "sine", .04);
        } else if (state === "wait") {
          if (waitT > 0) { state = "result"; score += 30; flash = .5; api.setScore(score); api.beep(880, .12, "triangle", .07); }
          else { state = "result"; tipT = 1.2; api.bad(); }
        }
      });
      api.loop((dt) => {
        if (flash > 0) flash -= dt;
        if (state === "cast") {
          bobY += 320 * dt;
          if (bobY > H - 150) { bobY = H - 150; state = "wait"; waitT = api.rand(1, 3.4); }
        }
        if (state === "wait") {
          waitT -= dt;
          bobY += Math.sin(api.t * 2.4) * .6 + (waitT < .55 ? 26 * dt : 0);
          if (waitT < 0) { state = "result"; tipT = 1.2; api.bad(); }
        }
        if (tipT > 0) { tipT -= dt; if (tipT <= 0 && state === "result") state = "idle"; }
        api.clear("#06121a");
        const sky = ctx.createLinearGradient(0, 0, 0, H * .5);
        sky.addColorStop(0, "#1b4258"); sky.addColorStop(1, "#0d2a3a");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * .45);
        ctx.fillStyle = "#0a2233"; ctx.fillRect(0, H * .45, W, H * .55);
        for (let i = 0; i < 8; i++) {
          ctx.strokeStyle = "rgba(125,211,232,.12)";
          const y = H * .5 + i * 26 + Math.sin(api.t + i) * 3;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        // 小船
        ctx.fillStyle = "#6b4a2f";
        api.rr(60, H * .45 - 26, 110, 22, 8); ctx.fill();
        ctx.fillStyle = "#8b6a45";
        ctx.beginPath(); ctx.moveTo(96, H * .45 - 26); ctx.lineTo(96, H * .45 - 62); ctx.lineTo(150, H * .45 - 26); ctx.closePath(); ctx.fill();
        // 鱼线
        ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(160, H * .45 - 50); ctx.lineTo(160 + 40, bobY - 8); ctx.stroke();
        // 浮标
        ctx.fillStyle = "#ff5c8a";
        ctx.beginPath(); ctx.arc(200, bobY, 8, 0, 7); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillRect(196, bobY - 16, 8, 8);
        if (state === "wait" && waitT < .55) {
          ctx.strokeStyle = "rgba(251,191,36,.8)"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(200, bobY, 18 + Math.sin(api.t * 18) * 4, 0, 7); ctx.stroke();
          ctx.lineWidth = 1;
        }
        if (flash > 0) {
          api.text("上钩！+" + 30, W / 2, 120, { size: 26, weight: 800, color: "#fbbf24" });
        }
        if (tipT > 0) api.text("鱼跑了……", W / 2, 120, { size: 20, weight: 700, color: "#ff8fa8" });
        if (tips()) api.text("点击抛竿", W / 2, H - 50, { size: 13, color: "#7dd3e8" });
        api.text("剩余 " + casts + " 次 · 得分 " + score, W / 2, H - 20, { size: 12, weight: 700, color: "#8fb8ef" });
        if (casts <= 0 && state === "idle") { state = "done"; api.over("收竿回家", "总分 " + score, true); }
      });
      function tips() { return state === "idle" || state === "result"; }
    }
  });

  /* 7. 跳绳 */
  GB.add({
    id: "jumprope", name: "跳绳节奏", cat: "casual", icon: "🪢", tags: ["new"],
    desc: "绳子扫到脚下的瞬间起跳", tip: "点击起跳，节奏会越来越快", w: 480, h: 520,
    colors: ["#243a2e", "#07120e"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let phase, speed, score, miss, jumping, jumpT, ropeHit;
      phase = 0; speed = .9; score = 0; miss = 0; jumping = 0; jumpT = 0; ropeHit = false;
      api.onDown(() => {
        if (jumping > 0) return;
        const p = phase % 1;
        if (p > .82 || p < .1) {
          score += 5; api.setScore(score); api.beep(760, .07, "sine", .05);
          jumping = 1; jumpT = 0;
        } else {
          miss++; api.bad();
          api.beep(160, .14, "square", .06);
          if (miss >= 3) api.over("被绳子绊住", "跳了 " + score / 5 + " 下", false);
        }
      });
      api.loop((dt, t) => {
        phase += speed * dt;
        speed = .9 + Math.min(1.4, score / 220);
        if (jumping > 0) { jumpT += dt; if (jumpT > .28) jumping = 0; }
        api.clear("#07120e");
        const cx = W / 2, pivotY = 96;
        const ang = phase * Math.PI * 2;
        const ropeX = cx + Math.sin(ang) * 150, ropeY = pivotY + Math.cos(ang) * 250;
        ctx.strokeStyle = "rgba(255,255,255,.08)";
        ctx.fillStyle = "rgba(52,211,153,.06)";
        ctx.beginPath(); ctx.ellipse(cx, H - 60, 220, 40, 0, 0, 7); ctx.fill();
        // 手柄
        [cx - 170, cx + 170].forEach((hx) => {
          ctx.fillStyle = "#34d399";
          api.rr(hx - 5, pivotY - 6, 10, 26, 5); ctx.fill();
        });
        ctx.strokeStyle = "rgba(110,231,183,.85)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 170, pivotY);
        ctx.quadraticCurveTo(cx, pivotY + 2 * (ropeY - pivotY) * .5 + 120, cx + 170, pivotY);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = "#6ee7b7";
        ctx.beginPath(); ctx.arc(ropeX, ropeY, 5, 0, 7); ctx.fill();
        // 人
        const lift = jumping > 0 ? Math.sin((jumpT / .28) * Math.PI) * 30 : 0;
        const py = H - 96 - lift;
        ctx.fillStyle = "#fbbf24";
        api.rr(cx - 15, py - 46, 30, 34, 10); ctx.fill();
        ctx.fillStyle = "#3b2a00";
        ctx.fillRect(cx - 8, py - 38, 4, 4); ctx.fillRect(cx + 4, py - 38, 4, 4);
        ctx.fillStyle = "#22d3ee";
        ctx.fillRect(cx - 12, py - 8, 9, 34 - lift * .6);
        ctx.fillRect(cx + 3, py - 8, 9, 34 - lift * .6);
        api.text("♥♥♥".slice(0, Math.max(0, 3 - miss)), 16, 26, { size: 13, color: "#ff8fa8", align: "left" });
        api.text("跳了 " + score / 5 + " 下", W - 16, 26, { size: 13, weight: 700, color: "#6ee7b7", align: "right" });
        api.text("绳子到脚下时点击", W / 2, H - 22, { size: 11, color: "#4f6b60" });
      });
    }
  });

  /* 8. 快餐达人 */
  GB.add({
    id: "cook", name: "快餐达人", cat: "casual", icon: "🍔", tags: ["new"],
    desc: "快速选出顾客要的套餐", tip: "看清单，点对应餐盘", w: 480, h: 560,
    colors: ["#3a2a1c", "#120c07"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const FOOD = ["🍔", "🍟", "🌭", "🍗", "🥤", "🍕", "🌮", "🍩"];
      let order, plates, round, score, wait, lock, right, left;
      round = 0; score = 0; wait = 0; lock = 0; right = -1; left = 0;
      function make() {
        const pool = api.shuffle(FOOD.slice());
        order = pool.slice(0, 3);
        plates = [];
        plates.push(order.slice());
        while (plates.length < 4) {
          const p = api.shuffle(FOOD).slice(0, 3);
          if (p.join("") === order.join("")) continue;
          plates.push(p);
        }
        plates = api.shuffle(plates);
        right = plates.findIndex((p) => p.join("") === order.join(""));
        lock = 0; wait = 2.4;
      }
      make();
      api.onDown((p) => {
        if (lock) return;
        for (let i = 0; i < 4; i++) {
          const x = 30 + (i % 2) * 220, y = 330 + Math.floor(i / 2) * 96;
          if (hit(p, x, y, 200, 84)) {
            if (i === right) { score += 100; api.setScore(score); lock = 1; api.beep(820, .09, "sine", .06); }
            else { api.bad(); lock = 2; left = Math.max(0, left + 1); }
            return;
          }
        }
      });
      api.loop((dt) => {
        if (!lock) {
          wait -= dt;
          if (wait <= 0) {
            lock = 2; api.bad();
            left++;
          }
        } else {
          wait -= dt;
          if (wait <= -0.45) {
            round++;
            if (round >= 10) { api.over("打烊啦", "得分 " + score, score >= 700); return; }
            if (left >= 3) { api.over("顾客跑光了", "得分 " + score, false); return; }
            make();
          }
        }
        api.clear("#120c07");
        api.text("快餐达人 · 第 " + (round + 1) + "/10 单", W / 2, 32, { size: 12.5, weight: 700, color: "#ffd166" });
        api.rr(40, 66, W - 80, 120, 16);
        ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fill();
        api.text("顾客要：", W / 2, 92, { size: 11.5, color: "#8b7a63" });
        order.forEach((f, i) => api.text(f, W / 2 - 48 + i * 48, 138, { size: 34 }));
        bar(api, 40, 196, W - 80, lock ? 0 : wait / 2.4, "#fbbf24");
        api.text("上错 " + left + "/3 单", W - 40, 216, { size: 10.5, color: "#8b7a63", align: "right" });
        plates.forEach((p, i) => {
          const x = 30 + (i % 2) * 220, y = 330 + Math.floor(i / 2) * 96;
          api.rr(x, y, 200, 84, 14);
          ctx.fillStyle = lock === 1 && i === right ? "rgba(52,211,153,.25)" : "rgba(255,255,255,.055)";
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.09)"; ctx.stroke();
          p.forEach((f, k) => api.text(f, x + 60 + k * 40, y + 44, { size: 26 }));
        });
        api.text("得分 " + score, W / 2, H - 22, { size: 12, weight: 700, color: "#fbbf24" });
      });
    }
  });

  /* 9. 投篮 */
  GB.add({
    id: "basketball", name: "投篮", cat: "casual", icon: "🏀", tags: ["new"],
    desc: "控制力度把球投进篮筐", tip: "点击停止力度条并出手", w: 480, h: 520,
    colors: ["#3a2418", "#120a06"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let power, dir, ball, shots, score, msg, msgT, hoopY;
      power = 0; dir = 1; ball = null; shots = 8; score = 0; msg = ""; msgT = 0; hoopY = 190;
      const hoopX = W - 92;
      api.onDown(() => {
        if (ball) return;
        if (shots <= 0) return;
        shots--;
        ball = { x: 96, y: H - 90, vx: 160 + power * 340, vy: -300 - power * 300, r: 13, live: true };
        api.beep(520, .08, "sine", .05);
      });
      api.loop((dt) => {
        if (!ball) {
          power += dir * dt * .9;
          if (power > 1) { power = 1; dir = -1; }
          if (power < 0) { power = 0; dir = 1; }
        } else {
          ball.vy += 900 * dt;
          ball.x += ball.vx * dt; ball.y += ball.vy * dt;
          if (ball.live && ball.vy > 0 && Math.abs(ball.y - hoopY) < 16 && Math.abs(ball.x - hoopX) < 26) {
            ball.live = false; score += 100; msg = "空心入网 +100"; msgT = 1.2;
            api.setScore(score); api.beep(920, .12, "triangle", .07);
          }
          if (ball.y > H + 40 || ball.x > W + 40) {
            ball = null;
            if (shots <= 0) setTimeout(() => api.over("投完了", "得分 " + score, score >= 400), 350);
          }
        }
        if (msgT > 0) msgT -= dt;
        api.clear("#120a06");
        ctx.fillStyle = "#241a12";
        ctx.fillRect(0, H - 70, W, 70);
        ctx.fillStyle = "#2f2318";
        ctx.fillRect(hoopX - 40, 120, 10, 200);
        // 篮板
        ctx.fillStyle = "rgba(255,255,255,.14)";
        ctx.fillRect(hoopX + 6, 130, 12, 110);
        ctx.strokeStyle = "#f97316"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(hoopX - 18, hoopY); ctx.lineTo(hoopX + 22, hoopY); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255,255,255,.55)";
        for (let i = 0; i < 5; i++) {
          const x1 = hoopX - 18 + i * 10;
          ctx.beginPath(); ctx.moveTo(x1, hoopY); ctx.lineTo(x1 + i - 2, hoopY + 34); ctx.stroke();
        }
        // 球
        const bx = ball ? ball.x : 96, by = ball ? ball.y : H - 90;
        ctx.fillStyle = "#f97316";
        ctx.beginPath(); ctx.arc(bx, by, 13, 0, 7); ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,.35)";
        ctx.beginPath(); ctx.arc(bx, by, 13, 0, 7); ctx.moveTo(bx - 13, by); ctx.lineTo(bx + 13, by); ctx.stroke();
        // 力度条
        bar(api, 40, H - 42, 160, power, "#f97316");
        api.text("力度", 208, H - 39, { size: 10, color: "#8b7a63", align: "left" });
        api.text("剩余 " + shots + " 球 · 得分 " + score, W - 16, 26, { size: 12, weight: 700, color: "#ffd166", align: "right" });
        if (msgT > 0) api.text(msg, W / 2, 70, { size: 20, weight: 800, color: "#6ee7b7" });
      });
    }
  });

  /* 10. 飞镖 */
  GB.add({
    id: "darts", name: "飞镖", cat: "casual", icon: "🎯", tags: ["new"],
    desc: "瞄得越准，环数越高", tip: "准心移动时点击投掷", w: 480, h: 520,
    colors: ["#1c2a24", "#070d0a"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h, cx = W / 2, cy = 250, R = 130;
      let throws, score, ax, ay, thrown, msg, msgT;
      throws = 5; score = 0; ax = cx; ay = cy; thrown = false; msg = ""; msgT = 0;
      api.onDown(() => {
        if (thrown || throws <= 0) return;
        throws--; thrown = true;
        const d = Math.hypot(ax - cx, ay - cy);
        let pts = d < 14 ? 100 : d < 36 ? 60 : d < 70 ? 30 : d < 100 ? 15 : 5;
        score += pts; api.setScore(score);
        msg = (d < 14 ? "正中靶心！" : "得 " + pts + " 分"); msgT = 1.1;
        api.beep(600 + pts * 4, .1, "triangle", .06);
        setTimeout(() => {
          thrown = false;
          if (throws <= 0) api.over("投完 5 镖", "总分 " + score, score >= 180);
        }, 380);
      });
      api.loop((dt) => {
        ax = cx + Math.sin(api.t * 1.7) * 150;
        ay = cy + Math.cos(api.t * 2.3) * 110;
        api.clear("#070d0a");
        const rings = [[R, "#1f3b30"], [R * .82, "#e2e8f0"], [R * .64, "#0f2a22"], [R * .46, "#ff5c8a"], [R * .28, "#0f2a22"], [16, "#34d399"]];
        rings.forEach(([r, col]) => {
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
        });
        ctx.strokeStyle = "rgba(0,0,0,.25)";
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * Math.PI * 2;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
        }
        if (!thrown) {
          ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(ax, ay, 12, 0, 7); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ax - 20, ay); ctx.lineTo(ax - 8, ay); ctx.moveTo(ax + 8, ay); ctx.lineTo(ax + 20, ay); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ax, ay - 20); ctx.lineTo(ax, ay - 8); ctx.moveTo(ax, ay + 8); ctx.lineTo(ax, ay + 20); ctx.stroke();
          ctx.lineWidth = 1;
        }
        if (msgT > 0) {
          msgT -= dt;
          api.text(msg, W / 2, 60, { size: 20, weight: 800, color: "#6ee7b7" });
        }
        api.text("剩余 " + throws + " 镖 · 总分 " + score, W / 2, H - 26, { size: 12.5, weight: 700, color: "#ffd166" });
      });
    }
  });

  /* 11. 射箭 */
  GB.add({
    id: "archery", name: "射箭", cat: "casual", icon: "🏹", tags: ["new"],
    desc: "蓄力瞄准移动的靶子", tip: "按住蓄力，松手放箭", w: 480, h: 520,
    colors: ["#20301f", "#080f08"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let tx, tdir, power, charging, arrow, score, arrows, msg, msgT;
      tx = W / 2; tdir = 1; power = 0; charging = false; arrow = null; score = 0; arrows = 6; msg = ""; msgT = 0;
      api.onDown(() => { if (!arrow && arrows > 0) { charging = true; power = 0; } });
      api.onUp(() => {
        if (!charging) return;
        charging = false; arrows--;
        arrow = { x: 90, y: H - 140, vx: 300 + power * 420, r: 8 };
        api.beep(420, .1, "sine", .05, 760);
      });
      api.loop((dt, t) => {
        tx += tdir * (90 + t * 3) * dt;
        if (tx > W - 60) { tx = W - 60; tdir = -1; }
        if (tx < 60) { tx = 60; tdir = 1; }
        if (charging) power = Math.min(1, power + dt * .8);
        if (arrow) {
          arrow.x += arrow.vx * dt;
          arrow.y -= 20 * dt;
          if (Math.abs(arrow.x - tx) < 26 && Math.abs(arrow.y - 220) < 60) {
            const d = Math.abs(arrow.y - 220);
            const pts = d < 16 ? 100 : d < 34 ? 60 : 30;
            score += pts; api.setScore(score);
            msg = "命中 " + pts + " 分"; msgT = 1.1;
            api.beep(880, .1, "triangle", .06);
            arrow = null;
            if (arrows <= 0) setTimeout(() => api.over("箭用完了", "总分 " + score, score >= 250), 400);
          } else if (arrow.x > W + 40) {
            msg = "脱靶"; msgT = 1; api.bad(); arrow = null;
            if (arrows <= 0) setTimeout(() => api.over("箭用完了", "总分 " + score, score >= 250), 400);
          }
        }
        if (msgT > 0) msgT -= dt;
        api.clear("#080f08");
        ctx.fillStyle = "#132414"; ctx.fillRect(0, H - 90, W, 90);
        ctx.fillStyle = "#1d3a1e"; ctx.fillRect(0, H - 96, W, 8);
        // 靶
        ctx.fillStyle = "#f8fafc";
        api.rr(tx - 24, 160, 48, 120, 8); ctx.fill();
        [[48, "#ff5c8a"], [34, "#f8fafc"], [22, "#fbbf24"], [10, "#ff5c8a"]].forEach(([r, col]) => {
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(tx, 220, r, 0, 7); ctx.fill();
        });
        // 弓
        ctx.strokeStyle = "#a16207"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(80, H - 150, 46, -1.1, 1.1); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255,255,255,.6)";
        ctx.beginPath(); ctx.moveTo(80 + Math.cos(-1.1) * 46, H - 150 + Math.sin(-1.1) * 46); ctx.lineTo(80 + Math.cos(1.1) * 46, H - 150 + Math.sin(1.1) * 46); ctx.stroke();
        if (arrow) {
          ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(arrow.x - 26, arrow.y + 4); ctx.lineTo(arrow.x, arrow.y); ctx.stroke();
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath(); ctx.moveTo(arrow.x, arrow.y); ctx.lineTo(arrow.x - 10, arrow.y - 4); ctx.lineTo(arrow.x - 10, arrow.y + 4); ctx.closePath(); ctx.fill();
          ctx.lineWidth = 1;
        }
        bar(api, 24, H - 44, 150, power, "#34d399");
        api.text("力度", 182, H - 41, { size: 10, color: "#7f9a80", align: "left" });
        api.text("剩余 " + arrows + " 箭 · " + score + " 分", W - 16, 26, { size: 12.5, weight: 700, color: "#ffd166", align: "right" });
        if (msgT > 0) api.text(msg, W / 2, 62, { size: 20, weight: 800, color: "#6ee7b7" });
      });
    }
  });

  /* 12. 抓娃娃 */
  GB.add({
    id: "claw", name: "抓娃娃", cat: "casual", icon: "🧸", tags: ["new"],
    desc: "对准娃娃再放下爪子", tip: "点击放下爪子，共 5 次", w: 480, h: 560,
    colors: ["#2f2340", "#0d0814"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const PRIZE = ["🧸", "🐰", "🐼", "🦊", "🐸", "🍬"];
      let prizes, clawX, clawY, dir, state, tries, score, caught, msg, msgT;
      prizes = [];
      for (let i = 0; i < 6; i++) prizes.push({ x: 60 + i * 66, y: H - 92, e: PRIZE[i % PRIZE.length], got: false });
      clawX = 80; clawY = 70; dir = 1; state = "move"; tries = 5; score = 0; caught = null; msg = ""; msgT = 0;
      api.onDown(() => {
        if (state !== "move" || tries <= 0) return;
        tries--; state = "drop";
        api.beep(420, .08, "square", .04);
      });
      api.loop((dt) => {
        if (state === "move") {
          clawX += dir * 120 * dt;
          if (clawX > W - 60) { clawX = W - 60; dir = -1; }
          if (clawX < 60) { clawX = 60; dir = 1; }
        } else if (state === "drop") {
          clawY += 220 * dt;
          if (clawY > H - 150) {
            state = "grab";
            const p = prizes.find((q) => !q.got && Math.abs(q.x - clawX) < 26);
            if (p) { p.got = true; caught = p; score += 100; api.setScore(score); msg = "抓到了！+100"; }
            else { caught = null; msg = "抓空了"; }
            msgT = 1.2; api.beep(caught ? 880 : 180, .1, "sine", .05);
          }
        } else if (state === "grab") {
          clawY -= 200 * dt;
          if (clawY < 70) {
            clawY = 70;
            if (caught) { caught.x = clawX; caught.y = 80; }
            state = "move";
            if (tries <= 0) setTimeout(() => api.over("次数用完", "共抓到 " + score / 100 + " 个", score >= 200), 500);
          }
        }
        if (msgT > 0) msgT -= dt;
        api.clear("#0d0814");
        // 机器外壳
        ctx.fillStyle = "rgba(255,255,255,.04)";
        api.rr(20, 50, W - 40, H - 90, 18); ctx.fill();
        ctx.strokeStyle = "rgba(196,181,253,.3)"; ctx.stroke();
        ctx.fillStyle = "#1a1226";
        api.rr(28, H - 120, W - 56, 62, 10); ctx.fill();
        // 奖品
        prizes.forEach((p) => { if (!p.got) api.text(p.e, p.x, p.y, { size: 34 }); });
        if (caught) api.text(caught.e, clawX, clawY + 30, { size: 30 });
        // 爪子
        ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(clawX, 40); ctx.lineTo(clawX, clawY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(clawX, clawY); ctx.lineTo(clawX - 12, clawY + 16); ctx.moveTo(clawX, clawY); ctx.lineTo(clawX + 12, clawY + 16); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = "#94a3b8";
        api.rr(clawX - 12, 34, 24, 8, 4); ctx.fill();
        if (msgT > 0) api.text(msg, W / 2, H - 22, { size: 14, weight: 700, color: caught ? "#6ee7b7" : "#ff8fa8" });
        else api.text("剩余 " + tries + " 次 · 得分 " + score, W / 2, H - 22, { size: 12, weight: 700, color: "#c4b5fd" });
      });
    }
  });

  /* 13. 幸运大转盘 */
  GB.add({
    id: "wheel", name: "幸运大转盘", cat: "casual", icon: "🎡", tags: ["new"],
    desc: "六次机会，看运气能拿多少分", tip: "点击转动，指针停在哪个格子就拿多少分", w: 480, h: 520,
    colors: ["#33244a", "#0d0916"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h, cx = W / 2, cy = 262, R = 158;
      const VALS = [100, 10, 50, 5, 20, 0, 80, 30];
      const COLS = ["#a78bfa", "#1e293b", "#22d3ee", "#1e293b", "#34d399", "#1e293b", "#fbbf24", "#1e293b"];
      let ang, spinV, spinning, spins, score, result, msgT;
      ang = 0; spinV = 0; spinning = false; spins = 6; score = 0; result = null; msgT = 0;
      api.onDown(() => {
        if (spinning || spins <= 0) return;
        spins--; spinning = true; spinV = 9 + Math.random() * 4;
        api.beep(520, .1, "square", .04);
      });
      api.loop((dt) => {
        if (spinning) {
          ang += spinV * dt;
          spinV -= dt * 2.4;
          if (spinV <= 0) {
            spinning = false;
            const seg = Math.PI * 2 / VALS.length;
            let a = (-Math.PI / 2 - ang) % (Math.PI * 2);
            if (a < 0) a += Math.PI * 2;
            const idx = Math.floor(a / seg) % VALS.length;
            const v = VALS[idx];
            score += v; api.setScore(score); result = v; msgT = 1.6;
            api.beep(v >= 50 ? 900 : 420, .12, "triangle", .06);
            if (spins <= 0) setTimeout(() => api.over("机会用完", "总分 " + score, score >= 150), 900);
          }
        }
        api.clear("#0d0916");
        api.text("幸运大转盘 · 剩余 " + spins + " 次", W / 2, 32, { size: 12.5, weight: 700, color: "#c4b5fd" });
        const seg = Math.PI * 2 / VALS.length;
        for (let i = 0; i < VALS.length; i++) {
          const a0 = ang + i * seg - Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, R, a0, a0 + seg);
          ctx.closePath();
          ctx.fillStyle = COLS[i]; ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.stroke();
          const mid = a0 + seg / 2;
          ctx.save();
          ctx.translate(cx + Math.cos(mid) * R * .72, cy + Math.sin(mid) * R * .72);
          ctx.rotate(mid + Math.PI / 2);
          api.text(String(VALS[i]), 0, 0, { size: 20, weight: 800, color: i % 2 ? "#cbd5e1" : "#1b1430" });
          ctx.restore();
        }
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath(); ctx.arc(cx, cy, 16, 0, 7); ctx.fill();
        ctx.fillStyle = "#7c5cff";
        ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 7); ctx.fill();
        ctx.fillStyle = "#ff5c8a";
        ctx.beginPath(); ctx.moveTo(cx, cy - R - 22); ctx.lineTo(cx - 10, cy - R + 2); ctx.lineTo(cx + 10, cy - R + 2); ctx.closePath(); ctx.fill();
        if (msgT > 0) {
          msgT -= dt;
          api.text((result === 0 ? "空手而归…" : "+" + result + " 分"), W / 2, H - 46, { size: 20, weight: 800, color: result ? "#fbbf24" : "#ff8fa8" });
        }
        api.text("总分 " + score, W / 2, H - 18, { size: 12, weight: 700, color: "#8fb8ef" });
      });
    }
  });

  /* 14. 颜色打地鼠 */
  GB.add({
    id: "whackcolor", name: "颜色打地鼠", cat: "casual", icon: "🔨", tags: ["new"],
    desc: "只打指定颜色的地鼠", tip: "看顶部颜色，点对地鼠，点错扣时间", w: 480, h: 560,
    colors: ["#3a2b1e", "#100b06"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const COLORS = [{ n: "红", c: "#ef4444" }, { n: "绿", c: "#22c55e" }, { n: "蓝", c: "#3b82f6" }, { n: "黄", c: "#eab308" }];
      let holes, moles, acc, score, left, target, msgT;
      holes = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) holes.push({ x: W / 2 - 150 + c * 150, y: 200 + r * 118 });
      moles = []; acc = 0; score = 0; left = 30; msgT = 0;
      target = COLORS[1];
      function newTarget() { target = api.pick(COLORS); }
      newTarget();
      api.onDown((p) => {
        for (const m of moles) {
          if (m.hit) continue;
          if (Math.hypot(p.x - m.x, p.y - m.y) < 46) {
            m.hit = true;
            if (m.col.n === target.n) {
              score += 10; api.setScore(score); left = Math.min(30, left + .6);
              api.beep(820, .07, "sine", .05); msgT = .4;
            } else {
              left -= 2; api.bad();
            }
            return;
          }
        }
      });
      api.loop((dt, t) => {
        left -= dt;
        if (left <= 0) { api.over("时间到", "得分 " + score, score >= 150); return; }
        acc += dt;
        if (acc > Math.max(.5, .95 - t * .012)) {
          acc = 0;
          const h = api.pick(holes);
          if (!moles.some((m) => !m.hit && Math.abs(m.x - h.x) < 10 && Math.abs(m.y - h.y) < 10)) {
            moles.push({ x: h.x, y: h.y, col: api.pick(COLORS), hit: false, t: 0 });
          }
          if (Math.random() < .18) newTarget();
        }
        moles.forEach((m) => { m.t += dt; });
        moles = moles.filter((m) => !m.hit && m.t < 1.9);
        api.clear("#100b06");
        api.rr(30, 44, W - 60, 70, 16);
        ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fill();
        api.text("只打", 70, 79, { size: 13, color: "#8b7a63" });
        api.rr(112, 58, 96, 42, 12);
        ctx.fillStyle = target.c; ctx.fill();
        api.text(target.n + "色", 160, 79, { size: 16, weight: 800, color: "#12100c" });
        api.text("得分 " + score, W - 46, 79, { size: 13, weight: 700, color: "#ffd166", align: "right" });
        bar(api, 30, 126, W - 60, left / 30, "#fbbf24");
        holes.forEach((h) => {
          ctx.fillStyle = "#241a12";
          ctx.beginPath(); ctx.ellipse(h.x, h.y + 30, 52, 18, 0, 0, 7); ctx.fill();
        });
        moles.forEach((m) => {
          const k = Math.min(1, m.t * 6);
          ctx.save();
          ctx.translate(m.x, m.y + (1 - k) * 46);
          ctx.fillStyle = m.col.c;
          ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.85)";
          ctx.beginPath(); ctx.arc(-11, -8, 6, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.arc(11, -8, 6, 0, 7); ctx.fill();
          ctx.fillStyle = "rgba(0,0,0,.7)";
          ctx.beginPath(); ctx.arc(-11, -8, 3, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.arc(11, -8, 3, 0, 7); ctx.fill();
          ctx.restore();
        });
        if (msgT > 0) { msgT -= dt; api.text("+10", W / 2, 160, { size: 18, weight: 800, color: "#6ee7b7" }); }
      });
    }
  });

  /* 15. 爆米花 */
  GB.add({
    id: "popcorn", name: "爆米花", cat: "casual", icon: "🍿", tags: ["new"],
    desc: "在玉米花飞出锅时点住它", tip: "点击空中的爆米花，漏太多就结束", w: 480, h: 520,
    colors: ["#3a2c1a", "#110c06"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let pops, acc, score, left, missed, msgT;
      pops = []; acc = 0; score = 0; left = 30; missed = 0; msgT = 0;
      api.onDown((p) => {
        for (const o of pops) {
          if (o.dead) continue;
          if (Math.hypot(p.x - o.x, p.y - o.y) < 26) {
            o.dead = true; score += 10; api.setScore(score);
            api.beep(760 + Math.random() * 200, .05, "sine", .045); msgT = .3;
            return;
          }
        }
      });
      api.loop((dt) => {
        left -= dt;
        if (left <= 0) { api.over("时间到", "接到 " + score / 10 + " 颗", score >= 200); return; }
        acc += dt;
        if (acc > .4) {
          acc = 0;
          pops.push({ x: api.rand(60, W - 60), y: H - 70, vx: api.rand(-70, 70), vy: api.rand(-520, -420), r: 16, dead: false });
        }
        pops.forEach((o) => {
          o.vy += 780 * dt; o.x += o.vx * dt; o.y += o.vy * dt;
          if (o.y > H + 40 && !o.dead) { o.dead = true; missed++; if (missed >= 8) api.over("糊锅了", "得分 " + score, false); }
        });
        pops = pops.filter((o) => !o.dead && o.y < H + 60);
        api.clear("#110c06");
        ctx.fillStyle = "#241a10";
        api.rr(W / 2 - 90, H - 84, 180, 70, 12); ctx.fill();
        ctx.fillStyle = "#3a2a18";
        api.rr(W / 2 - 74, H - 92, 148, 22, 8); ctx.fill();
        pops.forEach((o) => {
          ctx.fillStyle = "#fef3c7";
          ctx.beginPath();
          for (let i = 0; i < 7; i++) {
            const a = i / 7 * Math.PI * 2;
            ctx.arc(o.x + Math.cos(a) * 10, o.y + Math.sin(a) * 9, 8, 0, 7);
          }
          ctx.fill();
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath(); ctx.arc(o.x, o.y, 4, 0, 7); ctx.fill();
        });
        bar(api, 30, 22, 150, left / 30, "#fbbf24");
        api.text("漏掉 " + missed + "/8", W - 30, 26, { size: 11.5, weight: 700, color: "#ff8fa8", align: "right" });
        api.text("得分 " + score, W / 2, 52, { size: 14, weight: 800, color: "#ffd166" });
        if (msgT > 0) {
          msgT -= dt;
          api.text("+10", W / 2, 84, { size: 16, weight: 800, color: "#6ee7b7" });
        }
      });
    }
  });

  /* 16. 滚雪球 */
  GB.add({
    id: "snowball", name: "滚雪球", cat: "casual", icon: "⛄", tags: ["new"],
    desc: "滚大雪球，跳过挡路的树", tip: "点击跳跃，撞树就结束", w: 480, h: 480,
    colors: ["#1c3350", "#070f1a"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let r, y, vy, dist, speed, trees, flakes, acc, score, jump;
      r = 20; y = H - 90; vy = 0; dist = 0; speed = 220; trees = []; flakes = []; acc = 0; score = 0; jump = false;
      const ground = H - 70;
      const doJump = () => { if (!jump) { vy = -520; jump = true; api.beep(560, .08, "sine", .04); } };
      api.onDown(doJump); api.onKey((k) => { if (k === " " || k === "Enter") doJump(); });
      api.loop((dt, t) => {
        speed = 220 + t * 10;
        dist += speed * dt;
        vy += 1200 * dt; y += vy * dt;
        if (y >= ground - r) { y = ground - r; vy = 0; jump = false; }
        acc += dt;
        if (acc > Math.max(.7, 1.5 - t * .02)) {
          acc = 0;
          trees.push({ x: W + 40, h: api.rand(50, 90) });
        }
        if (Math.random() < dt * 1.6) flakes.push({ x: W + 30, y: api.rand(120, ground - 120) });
        trees.forEach((o) => { o.x -= speed * dt; });
        flakes.forEach((o) => { o.x -= speed * dt; o.y += 30 * dt; });
        trees = trees.filter((o) => o.x > -60);
        flakes = flakes.filter((o) => o.x > -40 && o.y < ground);
        for (const o of trees) {
          if (o.x < 140 + r && o.x > 120 - r && y + r > ground - o.h) {
            api.over("撞上大树", "滚了 " + Math.floor(dist / 10) + " 米", false);
            return;
          }
        }
        for (const f of flakes) {
          if (Math.hypot(f.x - 130, f.y - y) < r + 12) {
            f.dead = true; r = Math.min(46, r + 2.4); score += 5; api.setScore(score);
            api.beep(880, .05, "sine", .035);
          }
        }
        flakes = flakes.filter((f) => !f.dead);
        api.clear("#070f1a");
        ctx.fillStyle = "#122a1c";
        ctx.fillRect(0, ground, W, H - ground);
        ctx.fillStyle = "#e8f4ff";
        ctx.fillRect(0, ground, W, 10);
        ctx.strokeStyle = "rgba(255,255,255,.1)";
        for (let i = 0; i < 12; i++) {
          const gx = ((i * 90 - dist * .4) % (W + 90) + W + 90) % (W + 90) - 45;
          ctx.beginPath(); ctx.moveTo(gx, ground + 20); ctx.lineTo(gx + 30, ground + 20); ctx.stroke();
        }
        trees.forEach((o) => {
          ctx.fillStyle = "#3b2b1c";
          ctx.fillRect(o.x - 6, ground - o.h + 40, 12, o.h - 40);
          ctx.fillStyle = "#1f5e3a";
          for (let k = 0; k < 3; k++) {
            ctx.beginPath();
            ctx.moveTo(o.x, ground - o.h - 30 + k * 26);
            ctx.lineTo(o.x - 26 + k * 4, ground - o.h + 44 + k * 10);
            ctx.lineTo(o.x + 26 - k * 4, ground - o.h + 44 + k * 10);
            ctx.closePath(); ctx.fill();
          }
        });
        flakes.forEach((f) => {
          ctx.fillStyle = "rgba(232,244,255,.85)";
          ctx.beginPath(); ctx.arc(f.x, f.y, 5, 0, 7); ctx.fill();
        });
        const sx = 130 - r * .2;
        const sg = ctx.createRadialGradient(130 - r * .3, y, 2, 130, y, r);
        sg.addColorStop(0, "#ffffff"); sg.addColorStop(1, "#a9c6e0");
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(130, y, r, 0, 7); ctx.fill();
        ctx.strokeStyle = "rgba(120,160,200,.4)";
        ctx.beginPath(); ctx.arc(130, y, r * .62, 0, 7); ctx.stroke();
        api.text("雪球 " + Math.round(r) + " · " + Math.floor(dist / 10) + " 米", 16, 26, { size: 12, weight: 700, color: "#bfe3ff", align: "left" });
      });
    }
  });

  /* 17. 交通管制 */
  GB.add({
    id: "traffic", name: "交通管制", cat: "casual", icon: "🚦", tags: ["new"],
    desc: "点击车辆叫停，别让它们相撞", tip: "点车切换停 / 走，相撞即结束", w: 480, h: 520,
    colors: ["#20293d", "#080b12"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h, cx = W / 2, cy = H / 2;
      let cars, acc, score, passed, t0;
      cars = []; acc = 0; score = 0; passed = 0; t0 = 0;
      const DIRS = [
        { dx: 1, dy: 0, sx: -40, sy: cy, rot: 0 },
        { dx: -1, dy: 0, sx: W + 40, sy: cy, rot: Math.PI },
        { dx: 0, dy: 1, sx: cx, sy: -40, rot: Math.PI / 2 },
        { dx: 0, dy: -1, sx: cx, sy: H + 40, rot: -Math.PI / 2 }
      ];
      function spawn() {
        const d = DIRS[api.ri(0, 3)];
        const off = api.rand(-18, 18);
        cars.push({
          d: d, x: d.sx + (d.dx === 0 ? off : 0), y: d.sy + (d.dy === 0 ? off : 0),
          stop: false, done: false, hue: api.rand(0, 360), v: 95
        });
      }
      api.onDown((p) => {
        for (const c of cars) {
          if (c.done) continue;
          if (Math.hypot(p.x - c.x, p.y - c.y) < 34) { c.stop = !c.stop; api.beep(c.stop ? 300 : 620, .05, "square", .04); return; }
        }
      });
      api.loop((dt, t) => {
        acc += dt;
        if (acc > Math.max(.75, 1.5 - t * .02)) { acc = 0; spawn(); }
        cars.forEach((c) => {
          if (c.done) return;
          const near = Math.hypot(c.x - cx, c.y - cy) < 46;
          if (!c.stop || !near) {
            c.x += c.d.dx * c.v * dt;
            c.y += c.d.dy * c.v * dt;
          }
          if (c.x < -80 || c.x > W + 80 || c.y < -80 || c.y > H + 80) {
            c.done = true; passed++; score += 5; api.setScore(score);
          }
        });
        // 碰撞检测：两辆都在中心且都在动
        for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) {
          const a = cars[i], b = cars[j];
          if (a.done || b.done) continue;
          if (a.d.dx === b.d.dx && a.d.dy === b.d.dy) continue;
          if (Math.hypot(a.x - b.x, a.y - b.y) < 34) {
            api.over("撞车了！", "安全放行 " + passed + " 辆", false);
            return;
          }
        }
        cars = cars.filter((c) => !c.done);
        api.clear("#080b12");
        ctx.fillStyle = "#141b28";
        ctx.fillRect(0, cy - 74, W, 148);
        ctx.fillRect(cx - 74, 0, 148, H);
        ctx.strokeStyle = "rgba(251,191,36,.5)";
        ctx.setLineDash([12, 12]);
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(cx - 80, cy); ctx.moveTo(cx + 80, cy); ctx.lineTo(W, cy);
        ctx.moveTo(cx, 0); ctx.lineTo(cx, cy - 80); ctx.moveTo(cx, cy + 80); ctx.lineTo(cx, H); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(52,211,153,.12)";
        ctx.beginPath(); ctx.arc(cx, cy, 74, 0, 7); ctx.fill();
        cars.forEach((c) => {
          ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.d.rot);
          ctx.fillStyle = c.stop ? "#ff5c8a" : "hsl(" + c.hue + ",70%,60%)";
          api.rr(-22, -12, 44, 24, 6); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.7)";
          ctx.fillRect(2, -8, 10, 16);
          ctx.fillStyle = "#0b0f16";
          ctx.fillRect(-16, -14, 8, 5); ctx.fillRect(8, -14, 8, 5);
          ctx.fillRect(-16, 9, 8, 5); ctx.fillRect(8, 9, 8, 5);
          ctx.restore();
        });
        api.text("通行 " + passed, 16, 26, { size: 12, weight: 700, color: "#6ee7b7", align: "left" });
        api.text("点击车辆可叫停", W - 16, 26, { size: 11, color: "#5f6a80", align: "right" });
      });
    }
  });

  /* 18. 捉萤火虫 */
  GB.add({
    id: "firefly", name: "捉萤火虫", cat: "casual", icon: "🪰", tags: ["new"],
    desc: "在夜色中捕捉飞舞的萤火虫", tip: "点击萤火虫，30 秒计时", w: 480, h: 520,
    colors: ["#101c2c", "#04070d"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let flies, score, left, msgT;
      flies = []; score = 0; left = 30; msgT = 0;
      for (let i = 0; i < 6; i++) flies.push({ x: api.rand(40, W - 40), y: api.rand(70, H - 60), a: api.rand(0, 6), s: api.rand(.6, 1.3), ph: api.rand(0, 6) });
      api.onDown((p) => {
        for (const f of flies) {
          if (Math.hypot(p.x - f.x, p.y - f.y) < 26) {
            score += 10; api.setScore(score);
            f.x = api.rand(40, W - 40); f.y = api.rand(70, H - 60);
            api.beep(1000, .06, "sine", .04); msgT = .3;
            return;
          }
        }
        left -= .5;
      });
      api.loop((dt, t) => {
        left -= dt;
        if (left <= 0) { api.over("夜深了", "捉到 " + score / 10 + " 只", score >= 120); return; }
        flies.forEach((f) => {
          f.a += (Math.random() - .5) * dt * 3;
          f.x += Math.cos(f.a) * 80 * f.s * dt;
          f.y += Math.sin(f.a * 1.3 + f.ph) * 60 * f.s * dt;
          if (f.x < 24) f.x = 24; if (f.x > W - 24) f.x = W - 24;
          if (f.y < 60) f.y = 60; if (f.y > H - 50) f.y = H - 50;
        });
        api.clear("#04070d");
        ctx.fillStyle = "rgba(16,32,54,.65)";
        ctx.beginPath(); ctx.arc(70, 90, 34, 0, 7); ctx.fill();
        for (let i = 0; i < 40; i++) {
          ctx.fillStyle = "rgba(255,255,255,.25)";
          ctx.fillRect((i * 97) % W, (i * 61) % (H - 40), 1.4, 1.4);
        }
        ctx.fillStyle = "#08170f";
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 30) ctx.lineTo(x, H - 26 - Math.sin(x * .05) * 14 - Math.cos(x * .02) * 10);
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
        flies.forEach((f) => {
          const pulse = .55 + Math.sin(t * 6 + f.ph) * .45;
          const g = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, 26);
          g.addColorStop(0, "rgba(250,240,140," + pulse + ")");
          g.addColorStop(.5, "rgba(200,230,80," + pulse * .35 + ")");
          g.addColorStop(1, "rgba(160,200,40,0)");
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(f.x, f.y, 26, 0, 7); ctx.fill();
          ctx.fillStyle = "rgba(255,255,200," + pulse + ")";
          ctx.beginPath(); ctx.arc(f.x, f.y, 3.4, 0, 7); ctx.fill();
        });
        bar(api, 24, 22, 150, left / 30, "#fbbf24");
        api.text("剩余 " + Math.ceil(left) + "s · 已捉 " + score / 10, W - 24, 26, { size: 11.5, weight: 700, color: "#ffd166", align: "right" });
        if (msgT > 0) { msgT -= dt; api.text("+10", W / 2, 60, { size: 16, weight: 800, color: "#facc15" }); }
      });
    }
  });
})();
