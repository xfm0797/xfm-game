/* ==========================================================
   casual.js — 休闲游戏 18 款
   ========================================================== */
(function () {
  "use strict";

  /* ================= 打地鼠 ================= */
  GB.add({
    id: "whack", name: "打地鼠", cat: "casual", icon: "🔨",
    desc: "地鼠冒头就敲，限时 30 秒", tip: "点击冒头的地鼠",
    w: 480, h: 560, colors: ["#3a4a1a", "#141a08"],
    init(api) {
      const ctx = api.ctx, C = 3, R = 3;
      const S = 110, OX = (480 - C * S) / 2, OY = 130;
      let holes, t, score, misses, dead;
      function reset() {
        holes = Array.from({ length: C * R }, () => ({ up: 0, hit: 0 }));
        t = 30; score = 0; misses = 0; dead = false;
        api.setScore(0);
      }
      api.onDown((p) => {
        if (dead) return;
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx >= C || cy >= R) return;
        const h = holes[cy * C + cx];
        if (h.up > 0.1 && !h.hit) {
          h.hit = 1; h.up = 0.4;
          score += 10;
          api.setScore(score);
          api.beep(700, 0.06, "sine", 0.05, 900);
        } else {
          misses++;
          api.beep(180, 0.06, "square", 0.04);
        }
      });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t -= dt;
          if (t <= 0) { dead = true; api.over("时间到！", "命中 " + score / 10 + " 只 · 失误 " + misses + " 次"); }
          holes.forEach((h, i) => {
            if (h.up > 0) h.up -= dt;
            else if (Math.random() < dt * 0.9) { h.up = api.rand(0.7, 1.4); h.hit = 0; }
          });
        }
        api.clear("#141a08");
        api.text("时间 " + Math.max(0, t).toFixed(1) + "s", 24, 40, { size: 15, weight: 800, color: "#c8e88a", align: "left" });
        api.text("失误 " + misses, 456, 40, { size: 12, color: "#6a7a3a", align: "right" });
        for (let i = 0; i < C * R; i++) {
          const x = i % C, y = Math.floor(i / C);
          const px = OX + x * S + S / 2, py = OY + y * S + S - 18;
          ctx.fillStyle = "#2a3312";
          ctx.beginPath(); ctx.ellipse(px, py, S * 0.38, S * 0.13, 0, 0, Math.PI * 2); ctx.fill();
          const h = holes[i];
          if (h.up > 0) {
            const hh = Math.min(1, h.up * 2.5) * (h.hit ? 0.5 : 1);
            ctx.save();
            ctx.beginPath(); ctx.rect(px - S * 0.4, py - S * 0.75, S * 0.8, S * 0.75); ctx.clip();
            ctx.fillStyle = h.hit ? "#8a5a2c" : "#a06a38";
            ctx.beginPath(); ctx.ellipse(px, py - hh * 30, 26, 30 * hh + 6, 0, 0, Math.PI * 2); ctx.fill();
            if (!h.hit) {
              ctx.fillStyle = "#111";
              ctx.beginPath(); ctx.arc(px - 9, py - hh * 30 - 6, 3.4, 0, Math.PI * 2); ctx.fill();
              ctx.beginPath(); ctx.arc(px + 9, py - hh * 30 - 6, 3.4, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = "#e8a87a";
              ctx.beginPath(); ctx.ellipse(px, py - hh * 30 + 8, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
          }
        }
      });
    }
  });

  /* ================= 反应测试 ================= */
  GB.add({
    id: "reaction", name: "反应测试", cat: "casual", icon: "⚡",
    desc: "变绿的一瞬间点下去", tip: "红色等待 · 变绿立刻点击 · 抢跑失败",
    w: 480, h: 520, colors: ["#3a1a1a", "#160808"],
    init(api) {
      const ctx = api.ctx;
      let state, waitT, goT, best, times;
      function reset() {
        state = "wait"; waitT = api.rand(1.2, 3.2); goT = 0;
        best = api.best || 0; times = [];
      }
      api.onDown(() => {
        if (state === "wait") { state = "early"; api.beep(160, 0.15, "square", 0.05); }
        else if (state === "go") {
          const ms = Math.round(goT * 1000);
          times.push(ms);
          if (!best || ms < best) { best = ms; }
          api.setScore(1000 - Math.min(950, ms));
          state = "result";
          api.beep(700, 0.08, "sine", 0.05);
        } else if (state === "result" || state === "early") reset();
      });
      reset();
      api.loop((dt) => {
        if (state === "wait") {
          waitT -= dt;
          if (waitT <= 0) { state = "go"; goT = 0; api.beep(880, 0.08, "sine", 0.05); }
        } else if (state === "go") goT += dt;
        api.clear(state === "go" ? "#0a3a12" : "#160808");
        const msg = { wait: "等待变绿…", go: "点！点击！", early: "抢跑啦！点击重试", result: times[times.length - 1] + " ms\n点击再来" }[state];
        api.text(msg.split("\n")[0], 240, 230, { size: 26, weight: 800, color: state === "go" ? "#8fe3a8" : "#e8c9c9" });
        if (msg.includes("\n")) api.text(msg.split("\n")[1], 240, 280, { size: 14, color: "#8a7a7a" });
        if (best) api.text("最快纪录 " + best + " ms", 240, 460, { size: 13, color: "#c9a86a" });
        if (times.length) api.text("近几次：" + times.slice(-5).join(" / "), 240, 60, { size: 12, color: "#6a5a5a" });
      });
    }
  });

  /* ================= 点击速度 ================= */
  GB.add({
    id: "cps", name: "点击速度", cat: "casual", icon: "👆",
    desc: "10 秒内疯狂点击", tip: "点击屏幕计数 · 10 秒倒计时",
    w: 480, h: 520, colors: ["#1a2a4a", "#0a101e"],
    init(api) {
      const ctx = api.ctx;
      let t, clicks, dead, ripples;
      function reset() {
        t = 10; clicks = 0; dead = false; ripples = [];
        api.setScore(0);
      }
      api.onDown((p) => {
        if (dead) return;
        clicks++;
        api.setScore(clicks);
        ripples.push({ x: p.x, y: p.y, r: 6, life: 0.5 });
        api.beep(400 + Math.random() * 300, 0.03, "sine", 0.03);
      });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t -= dt;
          if (t <= 0) {
            dead = true;
            api.over("时间到！", clicks + " 次点击 · CPS " + (clicks / 10).toFixed(1));
          }
        }
        api.clear("#0a101e");
        api.text(Math.max(0, t).toFixed(1) + "s", 240, 110, { size: 44, weight: 800, color: "#8fb8ef" });
        api.text(clicks + " 次", 240, 250, { size: 60, weight: 800, color: "#fff" });
        api.text("疯狂点击屏幕！", 240, 330, { size: 14, color: "#4a5a7a" });
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.life -= dt; r.r += 180 * dt;
          if (r.life <= 0) { ripples.splice(i, 1); continue; }
          ctx.globalAlpha = r.life * 2;
          ctx.strokeStyle = "#4fd1c5"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });
    }
  });

  /* ================= 瞄准训练 ================= */
  GB.add({
    id: "aim", name: "瞄准训练", cat: "casual", icon: "🎯",
    desc: "快速点中不断移动的圆点", tip: "30 秒内点中尽可能多的目标",
    w: 480, h: 560, colors: ["#1a2a2a", "#0a1212"],
    init(api) {
      const ctx = api.ctx;
      let targets, t, score, dead, hits, shots;
      function spawn() {
        targets.push({ x: api.rand(50, 430), y: api.rand(90, 500), r: api.rand(14, 26), vx: api.pick([-1, 1]) * api.rand(60, 150), vy: api.pick([-1, 1]) * api.rand(60, 150) });
      }
      function reset() {
        targets = []; t = 30; score = 0; dead = false; hits = 0; shots = 0;
        for (let i = 0; i < 3; i++) spawn();
        api.setScore(0);
      }
      api.onDown((p) => {
        if (dead) return;
        shots++;
        let got = false;
        for (let i = targets.length - 1; i >= 0; i--) {
          if (Math.hypot(targets[i].x - p.x, targets[i].y - p.y) < targets[i].r + 5) {
            targets.splice(i, 1);
            hits++;
            score += 100;
            api.setScore(score);
            api.beep(700, 0.05, "sine", 0.045);
            spawn();
            got = true;
            break;
          }
        }
        if (!got) api.beep(160, 0.05, "square", 0.035);
      });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t -= dt;
          if (t <= 0) { dead = true; api.over("时间到！", "命中率 " + (shots ? Math.round(hits / shots * 100) : 0) + "%"); }
          for (const tg of targets) {
            tg.x += tg.vx * dt; tg.y += tg.vy * dt;
            if (tg.x < 40 || tg.x > 440) tg.vx *= -1;
            if (tg.y < 80 || tg.y > 520) tg.vy *= -1;
          }
        }
        api.clear("#0a1212");
        api.text("时间 " + Math.max(0, t).toFixed(1), 24, 40, { size: 15, weight: 800, color: "#8fe3d8", align: "left" });
        api.text("命中 " + hits, 456, 40, { size: 12, color: "#4a6a6a", align: "right" });
        for (const tg of targets) {
          ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(79,209,197,.25)"; ctx.fill();
          ctx.strokeStyle = "#4fd1c5"; ctx.lineWidth = 2; ctx.stroke();
          ctx.beginPath(); ctx.arc(tg.x, tg.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#4fd1c5"; ctx.fill();
        }
      });
    }
  });

  /* ================= 接水果 ================= */
  GB.add({
    id: "catch", name: "接水果", cat: "casual", icon: "🍑",
    desc: "用篮子接住掉落的水果", tip: "左右移动篮子 · 漏接 3 次结束",
    w: 480, h: 600, colors: ["#4a2a1a", "#1a0e08"],
    init(api) {
      const ctx = api.ctx;
      let bx, fruits, t, score, lives, dead, speed;
      const KIND = ["🍎", "🍊", "🍋", "🍇", "🍓", "🍑"];
      function reset() {
        bx = 220; fruits = []; t = 0; score = 0; lives = 3; dead = false; speed = 160;
        api.setScore(0);
      }
      api.onMove((p) => { bx = api.clamp(p.x - 40, 0, 400); });
      api.onKey((k) => {
        if (k === "ArrowLeft" || k === "a") bx = Math.max(0, bx - 40);
        if (k === "ArrowRight" || k === "d") bx = Math.min(400, bx + 40);
      });
      api.onDown((p) => { bx = api.clamp(p.x - 40, 0, 400); });
      api.dpad((d) => {
        if (d === "L") bx = Math.max(0, bx - 60);
        if (d === "R") bx = Math.min(400, bx + 60);
      });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t += dt;
          speed = 160 + t * 6;
          if (t > api.rand(0.5, 0.9)) {
            t = 0;
            fruits.push({ x: api.rand(30, 450), y: -24, k: api.ri(0, 5), sp: api.rand(0.85, 1.25) });
          }
          for (const f of fruits) f.y += speed * f.sp * dt;
          fruits = fruits.filter((f) => {
            if (f.y > 545 && f.y < 575 && f.x > bx - 10 && f.x < bx + 90) {
              score += 10;
              api.setScore(score);
              api.beep(600, 0.05, "sine", 0.045);
              return false;
            }
            if (f.y > 620) {
              lives--;
              api.beep(150, 0.12, "square", 0.05);
              if (lives <= 0) { dead = true; api.over("漏太多了", "得分 " + score); }
              return false;
            }
            return true;
          });
        }
        api.clear("#1a0e08");
        ctx.fillStyle = "#2a1a10";
        ctx.fillRect(0, 560, 480, 40);
        for (const f of fruits) api.text(KIND[f.k], f.x, f.y, { size: 30 });
        // 篮子
        ctx.fillStyle = "#8a5a2c";
        api.rr(bx, 545, 80, 34, 8); ctx.fill();
        ctx.strokeStyle = "#5a3a18"; ctx.lineWidth = 3; ctx.stroke();
        ctx.strokeStyle = "#5a3a18";
        for (let i = 1; i < 4; i++) {
          ctx.beginPath(); ctx.moveTo(bx + i * 20, 548); ctx.lineTo(bx + i * 20, 576); ctx.stroke();
        }
        api.text("❤".repeat(lives), 456, 34, { size: 15, color: "#ff8787", align: "right" });
        api.text("得分 " + score, 24, 34, { size: 14, weight: 700, color: "#e8c9a8", align: "left" });
      });
    }
  });

  /* ================= 记忆序列 ================= */
  GB.add({
    id: "simon", name: "记忆序列", cat: "casual", icon: "🎵",
    desc: "跟着灯光重复序列", tip: "看灯光顺序，依次点击重复",
    w: 480, h: 560, colors: ["#2a2a1a", "#121208"],
    init(api) {
      const ctx = api.ctx;
      const PADS = [
        { x: 70, y: 110, c: "#4dabf7", f: 330 },
        { x: 250, y: 110, c: "#ff6b6b", f: 392 },
        { x: 70, y: 290, c: "#69db7c", f: 494 },
        { x: 250, y: 290, c: "#ffd43b", f: 587 }
      ];
      let seq, input, show, showI, showT, level, dead, playing;
      function reset() {
        seq = []; input = []; show = -1; showI = 0; showT = 0; level = 0; dead = false; playing = true;
        next();
      }
      function next() {
        seq.push(api.ri(0, 3));
        input = []; showI = 0; showT = 0; playing = true;
      }
      api.onDown((p) => {
        if (dead || playing) return;
        for (let i = 0; i < 4; i++) {
          const d = PADS[i];
          if (p.x >= d.x && p.x <= d.x + 160 && p.y >= d.y && p.y <= d.y + 160) {
            flash(i);
            input.push(i);
            const k = input.length - 1;
            if (seq[k] !== i) {
              dead = true;
              api.over("记错了", "坚持到第 " + seq.length + " 步");
              return;
            }
            if (input.length === seq.length) {
              level = seq.length;
              api.setScore(level * 100);
              setTimeout(() => { if (!dead) next(); }, 600);
              playing = true;
            }
            return;
          }
        }
      });
      function flash(i) { show = i; showT = 0.3; api.beep(PADS[i].f, 0.22, "sine", 0.06); }
      reset();
      api.loop((dt) => {
        if (playing && !dead) {
          showT -= dt;
          if (showT <= 0) {
            show = -1;
            if (showT < -0.25) {
              if (showI < seq.length) { flash(seq[showI]); showI++; showT = 0.42; }
              else playing = false;
            }
          }
        } else if (show > 0 || show === 0) {
          showT -= dt;
          if (showT <= 0) show = -1;
        }
        api.clear("#121208");
        api.text("回合 " + seq.length, 240, 44, { size: 15, weight: 800, color: "#e8e0a8" });
        api.text(playing ? "看仔细…" : "跟着点一遍", 240, 68, { size: 12, color: "#7a7a4a" });
        PADS.forEach((d, i) => {
          api.rr(d.x, d.y, 160, 160, 22);
          const on = show === i;
          ctx.fillStyle = on ? d.c : d.c + "44";
          if (on) { ctx.shadowColor = d.c; ctx.shadowBlur = 30; }
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      });
    }
  });

  /* ================= 舒尔特方格 ================= */
  GB.add({
    id: "schulte", name: "舒尔特方格", cat: "casual", icon: "🔢",
    desc: "按 1→25 的顺序快速点击", tip: "按顺序点击数字 · 计算用时",
    w: 480, h: 560, colors: ["#2a2a3a", "#101018"],
    init(api) {
      const ctx = api.ctx, N = 5, S = 74;
      const OX = (480 - N * S) / 2, OY = 110;
      let cells, next, t0, done, best;
      function reset() {
        cells = api.shuffle(Array.from({ length: 25 }, (_, i) => i + 1));
        next = 1; t0 = null; done = false;
      }
      api.onDown((p) => {
        if (done) return;
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
        const v = cells[cy * N + cx];
        if (v === next) {
          if (next === 1) t0 = api.t;
          next++;
          api.beep(400 + next * 20, 0.04, "sine", 0.04);
          if (next > 25) {
            done = true;
            const secs = api.t - t0;
            api.setScore(Math.max(100, Math.round(3000 - secs * 50)));
            api.over("完成！", "用时 " + secs.toFixed(1) + " 秒", true);
          }
        } else {
          api.beep(180, 0.07, "square", 0.04);
        }
      });
      reset();
      api.loop(() => {
        api.clear("#101018");
        api.text("下一个：" + (next <= 25 ? next : "✓"), 24, 44, { size: 15, weight: 800, color: "#c4c8e8", align: "left" });
        api.text(t0 ? ((api.t - t0).toFixed(1) + "s") : "计时中", 456, 44, { size: 13, color: "#6a6a8a", align: "right" });
        for (let i = 0; i < 25; i++) {
          const x = i % N, y = Math.floor(i / N);
          const px = OX + x * S, py = OY + y * S;
          api.rr(px + 3, py + 3, S - 6, S - 6, 10);
          ctx.fillStyle = cells[i] < next ? "rgba(79,209,197,.14)" : "rgba(255,255,255,.06)";
          ctx.fill();
          api.text(cells[i], px + S / 2, py + S / 2 + 1, {
            size: 22, weight: 800,
            color: cells[i] < next ? "#4a6a6a" : "#e2e6f2"
          });
        }
      });
    }
  });

  /* ================= 叠叠乐 ================= */
  GB.add({
    id: "stack", name: "叠叠乐", cat: "casual", icon: "🏗️",
    desc: "看准时机叠方块，越高分越高", tip: "点击 / 空格 放下方块 · 没对齐会变窄",
    w: 420, h: 600, colors: ["#1a3a4a", "#0a161e"],
    init(api) {
      const ctx = api.ctx;
      let stack, cur, dir, speed, score, dead, hue;
      const GY = 560;
      function reset() {
        stack = [{ x: 90, w: 240, y: 0 }];
        cur = { x: 0, w: 240, y: 0 };
        dir = 1; speed = 220; score = 0; dead = false; hue = api.rand(0, 360);
        api.setScore(0);
      }
      function place() {
        const top = stack[stack.length - 1];
        const overlap = Math.min(top.x + top.w, cur.x + cur.w) - Math.max(top.x, cur.x);
        if (overlap <= 4) { dead = true; api.over("没叠上", "叠了 " + stack.length + " 层"); return; }
        const nx = Math.max(top.x, cur.x);
        stack.push({ x: nx, w: overlap, y: stack.length * 24 });
        cur = { x: dir > 0 ? -20 : 420 - cur.w + 20, w: overlap, y: stack.length * 24 };
        score = stack.length * 10;
        api.setScore(score);
        speed = Math.min(430, speed + 14);
        hue = (hue + 14) % 360;
        api.beep(420 + stack.length * 18, 0.06, "sine", 0.045);
      }
      api.onDown(place);
      api.onKey((k) => { if (k === " ") place(); });
      reset();
      api.loop((dt) => {
        if (!dead) {
          cur.x += dir * speed * dt;
          if (cur.x < 0) { cur.x = 0; dir = 1; }
          if (cur.x + cur.w > 420) { cur.x = 420 - cur.w; dir = -1; }
        }
        api.clear("#0a161e");
        const off = Math.max(0, stack.length * 24 - 380);
        stack.forEach((s, i) => {
          const y = GY - i * 24 + off - 24;
          if (y < -30 || y > 620) return;
          api.rr(s.x, y, s.w, 22, 4);
          ctx.fillStyle = "hsl(" + ((hue + i * 12) % 360) + ",58%,52%)";
          ctx.fill();
        });
        if (!dead) {
          const cy = GY - stack.length * 24 + off - 24;
          api.rr(cur.x, cy, cur.w, 22, 4);
          ctx.fillStyle = "hsl(" + ((hue + stack.length * 12) % 360) + ",62%,62%)";
          ctx.shadowColor = "rgba(255,255,255,.4)"; ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        api.text(stack.length + " 层", 24, 36, { size: 15, weight: 800, color: "#8fc7e8", align: "left" });
      });
    }
  });

  /* ================= 色字挑战 ================= */
  GB.add({
    id: "stroop", name: "色字挑战", cat: "casual", icon: "🌈",
    desc: "选出文字的颜色（不是含义）", tip: "点下方颜色块对应文字颜色",
    w: 480, h: 560, colors: ["#2a2a2a", "#101010"],
    init(api) {
      const ctx = api.ctx;
      const COLS = [["红", "#ff4d4d"], ["蓝", "#4da6ff"], ["绿", "#51cf66"], ["黄", "#ffd43b"]];
      let word, wcolor, opts, t, score, dead, round;
      function gen() {
        word = api.ri(0, 3);
        wcolor = api.ri(0, 3);
        opts = api.shuffle([0, 1, 2, 3]);
        round++;
      }
      function reset() {
        t = 30; score = 0; dead = false; round = 0;
        gen();
        api.setScore(0);
      }
      api.onDown((p) => {
        if (dead) return;
        for (let i = 0; i < 4; i++) {
          const y = 330 + i * 56;
          if (p.x >= 90 && p.x <= 390 && p.y >= y && p.y <= y + 46) {
            if (opts[i] === wcolor) {
              score += 100;
              api.setScore(score);
              api.beep(700, 0.05, "sine", 0.045);
            } else {
              score = Math.max(0, score - 50);
              api.setScore(score);
              api.beep(170, 0.1, "square", 0.045);
            }
            gen();
            return;
          }
        }
      });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t -= dt;
          if (t <= 0) { dead = true; api.over("时间到！", "得分 " + score); }
        }
        api.clear("#101010");
        api.text("文字的「颜色」是什么？", 240, 50, { size: 14, color: "#8a8a8a" });
        api.text(Math.max(0, t).toFixed(1) + "s", 240, 90, { size: 15, weight: 800, color: "#c9cede" });
        api.rr(90, 160, 300, 110, 18);
        ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fill();
        api.text(COLS[word][0], 240, 215, { size: 56, weight: 800, color: COLS[wcolor][1] });
        opts.forEach((o, i) => {
          const y = 330 + i * 56;
          api.rr(90, y, 300, 46, 12);
          ctx.fillStyle = COLS[o][1];
          ctx.fill();
          api.text(COLS[o][0], 240, y + 24, { size: 19, weight: 800, color: "rgba(0,0,0,.55)" });
        });
      });
    }
  });

  /* ================= 打气球 ================= */
  GB.add({
    id: "balloon", name: "打气球", cat: "casual", icon: "🎈",
    desc: "戳破上升的气球", tip: "点击气球戳破 · 黑气球不能戳",
    w: 480, h: 600, colors: ["#2a1a3a", "#120a1a"],
    init(api) {
      const ctx = api.ctx;
      let balls, t, score, dead, misses;
      const COLS = ["#ff6b6b", "#ffd43b", "#4dabf7", "#69db7c", "#e599f7"];
      function reset() {
        balls = []; t = 0; score = 0; dead = false; misses = 0;
        api.setScore(0);
      }
      api.onDown((p) => {
        if (dead) return;
        for (let i = balls.length - 1; i >= 0; i--) {
          const b = balls[i];
          if (Math.hypot(b.x - p.x, b.y - p.y) < b.r + 8) {
            balls.splice(i, 1);
            if (b.bad) {
              score = Math.max(0, score - 100);
              api.beep(140, 0.15, "square", 0.05);
            } else {
              score += 25;
              api.beep(500 + Math.random() * 300, 0.05, "sine", 0.045);
            }
            api.setScore(score);
            return;
          }
        }
      });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t += dt;
          if (t > api.rand(0.3, 0.7)) {
            t = 0;
            balls.push({
              x: api.rand(40, 440), y: 630, r: api.rand(20, 30),
              v: api.rand(70, 150), c: api.pick(COLS),
              bad: Math.random() < 0.16, sway: api.rand(0, 6)
            });
          }
          for (let i = balls.length - 1; i >= 0; i--) {
            const b = balls[i];
            b.y -= b.v * dt;
            b.x += Math.sin(api.t * 2 + b.sway) * 14 * dt;
            if (b.y < -40) {
              balls.splice(i, 1);
              if (!b.bad) { misses++; if (misses >= 8) { dead = true; api.over("漏掉太多", "得分 " + score); } }
            }
          }
        }
        api.clear("#120a1a");
        for (const b of balls) {
          const col = b.bad ? "#333a4a" : b.c;
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r * 0.82, b.r, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.3)";
          ctx.beginPath(); ctx.ellipse(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.22, b.r * 0.3, -0.5, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.4)";
          ctx.beginPath(); ctx.moveTo(b.x, b.y + b.r); ctx.lineTo(b.x, b.y + b.r + 12); ctx.stroke();
        }
        api.text("得分 " + score + " · 漏 " + misses + "/8", 24, 34, { size: 13, weight: 700, color: "#c8a8e8", align: "left" });
      });
    }
  });

  /* ================= 手速极限 ================= */
  GB.add({
    id: "taprush", name: "手速极限", cat: "casual", icon: "🖐️",
    desc: "按键和点击交替，冲击极限", tip: "点击屏幕或按任意键 · 15 秒",
    w: 480, h: 520, colors: ["#2a1a1a", "#120808"],
    init(api) {
      const ctx = api.ctx;
      let t, taps, dead, pulse;
      function reset() {
        t = 15; taps = 0; dead = false; pulse = 0;
        api.setScore(0);
      }
      function tap() {
        if (dead) return;
        taps++;
        api.setScore(taps);
        pulse = 0.15;
      }
      api.onDown(tap);
      api.onKey((k) => { if (k.length === 1 || k === "Space") tap(); });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t -= dt; pulse = Math.max(0, pulse - dt);
          if (t <= 0) { dead = true; api.over("时间到！", taps + " 次 · 每秒 " + (taps / 15).toFixed(1)); }
        }
        api.clear("#120808");
        const s = 1 + pulse * 0.6;
        api.rr(240 - 130 * s, 160 - 130 * s, 260 * s, 260 * s, 30 * s);
        ctx.fillStyle = pulse > 0 ? "rgba(255,107,107,.5)" : "rgba(255,107,107,.24)";
        ctx.fill();
        api.text(taps + "", 240, 210, { size: 52, weight: 800, color: "#fff" });
        api.text(Math.max(0, t).toFixed(1) + "s", 240, 80, { size: 17, weight: 800, color: "#e8c9c9" });
        api.text("拍打屏幕！", 240, 380, { size: 14, color: "#6a4a4a" });
      });
    }
  });

  /* ================= 弹跳接球 ================= */
  GB.add({
    id: "bounce", name: "弹跳接球", cat: "casual", icon: "🏀",
    desc: "移动挡板别让球落地", tip: "拖动挡板 · 球速会越来越快",
    w: 480, h: 560, colors: ["#1a3a2a", "#0a1610"],
    init(api) {
      const ctx = api.ctx;
      let px, ball, score, dead, spd;
      function reset() {
        px = 190;
        ball = { x: 240, y: 200, vx: 130, vy: 190 };
        score = 0; dead = false; spd = 1;
        api.setScore(0);
      }
      api.onMove((p) => { px = api.clamp(p.x - 50, 0, 380); });
      api.onKey((k) => {
        if (k === "ArrowLeft" || k === "a") px = Math.max(0, px - 44);
        if (k === "ArrowRight" || k === "d") px = Math.min(380, px + 44);
      });
      api.onDown((p) => { px = api.clamp(p.x - 50, 0, 380); });
      api.dpad((d) => {
        if (d === "L") px = Math.max(0, px - 70);
        if (d === "R") px = Math.min(380, px + 70);
      });
      reset();
      api.loop((dt) => {
        if (!dead) {
          ball.x += ball.vx * spd * dt;
          ball.y += ball.vy * spd * dt;
          if (ball.x < 12) { ball.x = 12; ball.vx = Math.abs(ball.vx); }
          if (ball.x > 468) { ball.x = 468; ball.vx = -Math.abs(ball.vx); }
          if (ball.y < 12) { ball.y = 12; ball.vy = Math.abs(ball.vy); }
          if (ball.vy > 0 && ball.y > 512 && ball.y < 534 && ball.x > px - 8 && ball.x < px + 108) {
            ball.vy = -Math.abs(ball.vy) * 1.03;
            ball.vx += (ball.x - (px + 50)) * 2.2;
            spd = Math.min(2.2, spd + 0.025);
            score += 10;
            api.setScore(score);
            api.beep(500, 0.05, "sine", 0.045);
          }
          if (ball.y > 600) { dead = true; api.over("球落地了", "接住 " + score / 10 + " 次"); }
        }
        api.clear("#0a1610");
        api.rr(px, 514, 100, 16, 9);
        ctx.fillStyle = "#69db7c"; ctx.fill();
        ctx.beginPath(); ctx.arc(ball.x, ball.y, 11, 0, Math.PI * 2);
        ctx.fillStyle = "#ffd43b"; ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ball.x, ball.y, 11, 0.4, 2.6); ctx.stroke();
        api.text("得分 " + score, 24, 36, { size: 14, weight: 700, color: "#8fe3a8", align: "left" });
      });
    }
  });

  /* ================= 躲避小怪 ================= */
  GB.add({
    id: "avoid", name: "躲避小怪", cat: "casual", icon: "👻",
    desc: "操控小球躲开追击的小怪", tip: "拖动移动 · 时间越长分越高",
    w: 480, h: 560, colors: ["#1a1a3a", "#0a0a18"],
    init(api) {
      const ctx = api.ctx;
      let x, y, ghosts, t, score, dead;
      function reset() {
        x = 240; y = 400; ghosts = []; t = 0; score = 0; dead = false;
        for (let i = 0; i < 3; i++) {
          ghosts.push({ x: api.rand(40, 440), y: api.rand(40, 200), v: api.rand(55, 85) });
        }
        api.setScore(0);
      }
      api.onMove((p) => { x = api.clamp(p.x, 16, 464); y = api.clamp(p.y, 16, 544); });
      api.onDown((p) => { x = api.clamp(p.x, 16, 464); y = api.clamp(p.y, 16, 544); });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t += dt;
          score = Math.floor(t * 15);
          api.setScore(score);
          if (t > 4 && ghosts.length < 3 + Math.floor(t / 5)) {
            ghosts.push({ x: api.rand(40, 440), y: 40, v: api.rand(55, 95) });
          }
          for (const g of ghosts) {
            const d = Math.hypot(x - g.x, y - g.y) || 1;
            g.x += (x - g.x) / d * g.v * dt;
            g.y += (y - g.y) / d * g.v * dt;
            if (d < 24) {
              dead = true;
              api.beep(110, 0.3, "square", 0.07, 40);
              api.over("被抓住了", "存活 " + t.toFixed(1) + " 秒");
              break;
            }
          }
        }
        api.clear("#0a0a18");
        for (const g of ghosts) {
          api.text("👻", g.x, g.y, { size: 30 });
        }
        ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = "#4fd1c5"; ctx.shadowColor = "#4fd1c5"; ctx.shadowBlur = 14; ctx.fill();
        ctx.shadowBlur = 0;
        api.text(t.toFixed(1) + "s", 240, 32, { size: 14, weight: 800, color: "#a8b8e8" });
      });
    }
  });

  /* ================= 记忆方格 ================= */
  GB.add({
    id: "gridmem", name: "记忆方格", cat: "casual", icon: "🧠",
    desc: "记住亮起的方格位置", tip: "记忆后点出所有亮过的格子",
    w: 480, h: 560, colors: ["#1a2a4a", "#0a101e"],
    init(api) {
      const ctx = api.ctx, N = 4, S = 88;
      const OX = (480 - N * S) / 2, OY = 130;
      let target, picked, phase, timer, level, wrongs;
      function gen() {
        target = new Set();
        const k = Math.min(3 + level, 9);
        while (target.size < k) target.add(api.ri(0, N * N - 1));
        picked = new Set();
        phase = "show"; timer = Math.max(1.2, 2.4 - level * 0.12);
        wrongs = 0;
      }
      api.onDown((p) => {
        if (phase !== "pick") return;
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
        const i = cy * N + cx;
        if (picked.has(i)) return;
        picked.add(i);
        if (target.has(i)) {
          api.beep(620, 0.05, "sine", 0.045);
          if (picked.size === target.size) {
            level++;
            api.setScore(level * 150);
            api.beep(880, 0.1, "sine", 0.05);
            setTimeout(() => { if (!api.over) gen(); }, 500);
            phase = "wait";
          }
        } else {
          wrongs++;
          api.beep(160, 0.12, "square", 0.05);
          if (wrongs >= 3) api.over("错 3 次了", "通过 " + level + " 关");
        }
      });
      level = 0; gen();
      api.loop((dt) => {
        if (phase === "show") {
          timer -= dt;
          if (timer <= 0) phase = "pick";
        }
        api.clear("#0a101e");
        api.text(phase === "show" ? "记住亮起的格子" : "点出亮过的格子（错 " + wrongs + "/3）", 240, 60, { size: 14, weight: 700, color: "#8fb8ef" });
        api.text("第 " + (level + 1) + " 关", 240, 90, { size: 12, color: "#4a5a7a" });
        for (let i = 0; i < N * N; i++) {
          const x = i % N, y = Math.floor(i / N);
          const px = OX + x * S, py = OY + y * S;
          api.rr(px + 4, py + 4, S - 8, S - 8, 12);
          const lit = phase === "show" && target.has(i);
          const pickedOn = picked.has(i);
          ctx.fillStyle = lit ? "#ffd75e" : pickedOn ? (target.has(i) ? "#69db7c" : "#ff8787") : "rgba(255,255,255,.06)";
          if (lit || pickedOn) { ctx.shadowColor = "rgba(255,255,255,.3)"; ctx.shadowBlur = 10; }
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
    }
  });

  /* ================= 拍蚊子 ================= */
  GB.add({
    id: "mosquito", name: "拍蚊子", cat: "casual", icon: "🦟",
    desc: "蚊子到处飞，手快有手慢无", tip: "点击蚊子拍死它 · 限时 25 秒",
    w: 480, h: 560, colors: ["#2a3a1a", "#101a08"],
    init(api) {
      const ctx = api.ctx;
      let bugs, t, score, dead, squashed;
      function reset() {
        bugs = []; t = 25; score = 0; dead = false; squashed = 0;
        for (let i = 0; i < 4; i++) spawn();
        api.setScore(0);
      }
      function spawn() {
        bugs.push({
          x: api.rand(40, 440), y: api.rand(80, 500),
          vx: api.pick([-1, 1]) * api.rand(60, 160),
          vy: api.pick([-1, 1]) * api.rand(60, 160),
          ph: api.rand(0, 9)
        });
      }
      api.onDown((p) => {
        if (dead) return;
        let got = false;
        for (let i = bugs.length - 1; i >= 0; i--) {
          if (Math.hypot(bugs[i].x - p.x, bugs[i].y - p.y) < 26) {
            bugs.splice(i, 1);
            squashed++;
            score += 40;
            api.setScore(score);
            api.beep(900, 0.04, "square", 0.04, 400);
            spawn();
            got = true;
            break;
          }
        }
        if (!got) api.beep(200, 0.05, "sine", 0.03);
      });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t -= dt;
          if (t <= 0) { dead = true; api.over("时间到！", "拍到 " + squashed + " 只蚊子"); }
          for (const b of bugs) {
            b.vx += api.rand(-260, 260) * dt;
            b.vy += api.rand(-260, 260) * dt;
            b.vx = api.clamp(b.vx, -200, 200);
            b.vy = api.clamp(b.vy, -200, 200);
            b.x = api.clamp(b.x + b.vx * dt, 24, 456);
            b.y = api.clamp(b.y + b.vy * dt, 60, 520);
          }
        }
        api.clear("#101a08");
        api.text("时间 " + Math.max(0, t).toFixed(1) + "s", 24, 36, { size: 14, weight: 800, color: "#c8e88a", align: "left" });
        api.text("🦵 " + squashed, 456, 36, { size: 13, color: "#6a7a3a", align: "right" });
        for (const b of bugs) {
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(Math.sin(api.t * 20 + b.ph) * 0.3);
          api.text("🦟", 0, 0, { size: 26 });
          ctx.restore();
        }
      });
    }
  });

  /* ================= 颜色反应 ================= */
  GB.add({
    id: "colortap", name: "颜色反应", cat: "casual", icon: "🔴",
    desc: "只在出现目标颜色时点击", tip: "看到「绿色」才点，其他颜色不点",
    w: 480, h: 520, colors: ["#1a1a2a", "#0a0a14"],
    init(api) {
      const ctx = api.ctx;
      const COLS = [["红", "#ff4d4d"], ["绿", "#51cf66"], ["蓝", "#4dabf7"], ["黄", "#ffd43b"]];
      let cur, wait, t, score, dead, misses, showT, targetIdx;
      function nextOne() {
        targetIdx = api.ri(0, 3);
        cur = api.ri(0, 3);
        showT = api.rand(0.5, 1.1);
        wait = true;
      }
      function reset() {
        t = 25; score = 0; dead = false; misses = 0;
        nextOne();
        api.setScore(0);
      }
      api.onDown(() => {
        if (dead) return;
        if (wait) {
          if (cur === targetIdx) {
            score += 100;
            api.setScore(score);
            api.beep(700, 0.05, "sine", 0.045);
            nextOne();
          } else {
            misses++;
            score = Math.max(0, score - 60);
            api.setScore(score);
            api.beep(150, 0.1, "square", 0.05);
          }
        }
      });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t -= dt;
          if (t <= 0) { dead = true; api.over("时间到！", "得分 " + score); }
          if (wait) {
            showT -= dt;
            if (showT <= 0) {
              if (cur === targetIdx) { misses++; score = Math.max(0, score - 40); api.setScore(score); }
              nextOne();
            }
          }
        }
        api.clear("#0a0a14");
        api.text("目标颜色：" + COLS[targetIdx][0], 240, 60, { size: 17, weight: 800, color: COLS[targetIdx][1] });
        api.text("看到它才点击 · " + Math.max(0, t).toFixed(1) + "s · 误触 " + misses, 240, 96, { size: 12, color: "#6a6a8a" });
        api.rr(120, 170, 240, 200, 24);
        ctx.fillStyle = wait ? COLS[cur][1] : "#202030";
        ctx.fill();
        api.text(COLS[cur][0], 240, 270, { size: 44, weight: 800, color: wait ? "rgba(0,0,0,.45)" : "#3a3a4a" });
      });
    }
  });

  /* ================= 抛接球 ================= */
  GB.add({
    id: "juggle", name: "指尖抛球", cat: "casual", icon: "🤹",
    desc: "托住不断下落的小球", tip: "移动手掌托球 · 球越来越多",
    w: 480, h: 560, colors: ["#3a2a1a", "#160f08"],
    init(api) {
      const ctx = api.ctx;
      let hx, balls, score, dead, spawnT;
      function reset() {
        hx = 240; balls = [{ x: 240, y: 200, vx: 60, vy: 0 }]; score = 0; dead = false; spawnT = 0;
        api.setScore(0);
      }
      api.onMove((p) => { hx = api.clamp(p.x, 30, 450); });
      api.onDown((p) => { hx = api.clamp(p.x, 30, 450); });
      reset();
      api.loop((dt) => {
        if (!dead) {
          spawnT -= dt;
          if (spawnT <= 0 && balls.length < 5) {
            spawnT = 8;
            balls.push({ x: api.rand(60, 420), y: 150, vx: api.rand(-90, 90), vy: 0 });
          }
          for (const b of balls) {
            b.vy += 700 * dt;
            b.x += b.vx * dt; b.y += b.vy * dt;
            if (b.x < 16) { b.x = 16; b.vx = Math.abs(b.vx); }
            if (b.x > 464) { b.x = 464; b.vx = -Math.abs(b.vx); }
            if (b.vy > 0 && b.y > 470 && b.y < 500 && Math.abs(b.x - hx) < 56) {
              b.vy = -Math.abs(b.vy) * 0.92 - 60;
              b.vx += (b.x - hx) * 1.6;
              score += 10;
              api.setScore(score);
              api.beep(500 + Math.random() * 200, 0.04, "sine", 0.04);
            }
            if (b.y > 600) { dead = true; api.over("球掉了", "托了 " + score / 10 + " 次"); }
          }
        }
        api.clear("#160f08");
        for (const b of balls) {
          ctx.beginPath(); ctx.arc(b.x, b.y, 12, 0, Math.PI * 2);
          ctx.fillStyle = "#ff922b"; ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.35)";
          ctx.beginPath(); ctx.arc(b.x - 4, b.y - 4, 4, 0, Math.PI * 2); ctx.fill();
        }
        // 手掌
        ctx.fillStyle = "#e8b88a";
        api.rr(hx - 50, 486, 100, 18, 9); ctx.fill();
        for (let i = 0; i < 4; i++) {
          api.rr(hx - 40 + i * 24, 470, 18, 20, 6);
          ctx.fill();
        }
        api.text(score + "", 240, 50, { size: 20, weight: 800, color: "#e8d8b8" });
      });
    }
  });
})();
