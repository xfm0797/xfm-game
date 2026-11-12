/* ==========================================================
   arcade2.js — 街机游戏 10 款
   ========================================================== */
(function () {
  "use strict";

  /* ================= 坦克大战 ================= */
  GB.add({
    id: "tank", name: "坦克大战", cat: "arcade", icon: "🛡️",
    desc: "击毁敌方坦克，守住阵地", tip: "← → ↑ ↓ 移动 · 空格 / 点击开炮",
    w: 480, h: 520, colors: ["#2a3320", "#10140a"],
    init(api) {
      const ctx = api.ctx, S = 40;
      let px, py, pa, bullets, ebullets, enemies, hp, score, cd, t, dead, walls;
      function reset() {
        px = 4; py = 11; pa = 0;
        bullets = []; ebullets = []; enemies = [];
        hp = 3; score = 0; cd = 0; t = 0; dead = false;
        walls = new Set();
        for (let i = 0; i < 26; i++) {
          const x = api.ri(1, 10), y = api.ri(1, 9);
          if (Math.abs(x - 4) <= 1 && y >= 10) continue;
          walls.add(y * 12 + x);
        }
        spawnEnemy();
        api.setScore(0);
      }
      function spawnEnemy() {
        const spots = [[0, 0], [11, 0], [6, 0]];
        const s = api.pick(spots);
        if (!enemies.some((e) => e.x === s[0] && e.y === s[1])) {
          enemies.push({ x: s[0], y: s[1], cd: api.rand(0.5, 1.5), dir: [0, 1] });
        }
      }
      function solid(x, y) {
        if (x < 0 || y < 0 || x >= 12 || y >= 13) return true;
        return walls.has(y * 12 + x);
      }
      function fire() {
        if (dead || cd > 0) return;
        cd = 0.4;
        const d = [[0, -1], [0, 1], [-1, 0], [1, 0]][pa];
        bullets.push({ x: px * S + 20 + d[0] * 18, y: py * S + 20 + d[1] * 18, dx: d[0], dy: d[1] });
        api.beep(600, 0.07, "square", 0.04, 200);
      }
      function tryMove(dx, dy) {
        pa = dx === 1 ? 3 : dx === -1 ? 2 : dy === -1 ? 0 : 1;
        const nx = px + dx, ny = py + dy;
        if (!solid(nx, ny) && !enemies.some((e) => e.x === nx && e.y === ny)) { px = nx; py = ny; }
      }
      api.onKey((k) => {
        if (k === "ArrowUp" || k === "w") tryMove(0, -1);
        if (k === "ArrowDown" || k === "s") tryMove(0, 1);
        if (k === "ArrowLeft" || k === "a") tryMove(-1, 0);
        if (k === "ArrowRight" || k === "d") tryMove(1, 0);
        if (k === " ") fire();
      });
      api.onDown((p) => {
        const gx = Math.floor(p.x / S), gy = Math.floor((p.y - 40) / S);
        if (Math.abs(gx - px) + Math.abs(gy - py) === 1) tryMove(gx - px, gy - py);
        else fire();
      });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t += dt; cd -= dt;
          for (const e of enemies) {
            e.cd -= dt;
            if (e.cd <= 0) {
              e.cd = api.rand(0.9, 2);
              const dx = Math.sign(px - e.x), dy = Math.sign(py - e.y);
              const d = Math.abs(px - e.x) > Math.abs(py - e.y) ? [dx, 0] : [0, dy];
              ebullets.push({ x: e.x * S + 20, y: e.y * S + 20, dx: d[0], dy: d[1] });
              api.beep(240, 0.06, "square", 0.03);
            }
            if (Math.random() < dt * 1.2) {
              const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]].filter(([dx, dy]) => !solid(e.x + dx, e.y + dy));
              if (dirs.length) {
                const [dx, dy] = api.pick(dirs);
                e.x += dx; e.y += dy;
              }
            }
          }
          if (enemies.length < 3 && Math.random() < dt * 0.5) spawnEnemy();
          bullets.forEach((b) => { b.x += b.dx * 380 * dt; b.y += b.dy * 380 * dt; });
          ebullets.forEach((b) => { b.x += b.dx * 260 * dt; b.y += b.dy * 260 * dt; });
          bullets = bullets.filter((b) => b.x > 0 && b.x < 480 && b.y > 0 && b.y < 520);
          ebullets = ebullets.filter((b) => b.x > 0 && b.x < 480 && b.y > 0 && b.y < 520);
          for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            const gx = Math.floor(b.x / S), gy = Math.floor((b.y - 0) / S);
            if (walls.has(gy * 12 + gx)) { bullets.splice(i, 1); continue; }
            const ei = enemies.findIndex((e) => Math.abs(e.x * S + 20 - b.x) < 20 && Math.abs(e.y * S + 20 - b.y) < 20);
            if (ei >= 0) {
              enemies.splice(ei, 1);
              bullets.splice(i, 1);
              score += 100;
              api.setScore(score);
              api.beep(500, 0.1, "square", 0.05, 150);
            }
          }
          for (let i = ebullets.length - 1; i >= 0; i--) {
            const b = ebullets[i];
            const gx = Math.floor(b.x / S), gy = Math.floor(b.y / S);
            if (walls.has(gy * 12 + gx)) { ebullets.splice(i, 1); continue; }
            if (Math.abs(px * S + 20 - b.x) < 18 && Math.abs(py * S + 20 - b.y) < 18) {
              ebullets.splice(i, 1);
              hp--;
              api.beep(130, 0.2, "square", 0.06, 60);
              if (hp <= 0) { dead = true; api.over("坦克被摧毁", "得分 " + score); }
            }
          }
          if (!enemies.length) spawnEnemy();
        }
        api.clear("#10140a");
        for (const w of walls) {
          api.rr((w % 12) * S + 3, Math.floor(w / 12) * S + 3, S - 6, S - 6, 6);
          ctx.fillStyle = "#4a5535"; ctx.fill();
        }
        api.text("❤".repeat(hp), 24, 24, { size: 14, color: "#ff8787", align: "left" });
        for (const e of enemies) {
          ctx.save();
          ctx.translate(e.x * S + 20, e.y * S + 20);
          ctx.fillStyle = "#ff8787";
          ctx.fillRect(-14, -14, 28, 28);
          ctx.fillStyle = "#5a2020";
          ctx.fillRect(-5, -18, 10, 34);
          ctx.restore();
        }
        ctx.save();
        ctx.translate(px * S + 20, py * S + 20);
        ctx.fillStyle = "#4fd1c5";
        ctx.fillRect(-14, -14, 28, 28);
        ctx.fillStyle = "#1a4a44";
        const d = [[0, -1], [0, 1], [-1, 0], [1, 0]][pa];
        ctx.fillRect(d[0] * 16 - 4, d[1] * 16 - 4, 8 + Math.abs(d[0]) * 12, 8 + Math.abs(d[1]) * 12);
        ctx.restore();
        ctx.fillStyle = "#ffd75e";
        for (const b of bullets) ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
        ctx.fillStyle = "#ff6b6b";
        for (const b of ebullets) ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
      });
    }
  });

  /* ================= 极速赛车 ================= */
  GB.add({
    id: "racer", name: "极速赛车", cat: "arcade", icon: "🏎️",
    desc: "三车道极速避车", tip: "← → 变道 · 速度越来越快",
    w: 380, h: 600, colors: ["#20262e", "#0c0f13"],
    init(api) {
      const ctx = api.ctx, LW = 110;
      let lane, cars, t, score, dead, speed, px;
      function reset() {
        lane = 1; cars = []; t = 0; score = 0; dead = false; speed = 300; px = 0;
        api.setScore(0);
      }
      api.onKey((k) => {
        if (k === "ArrowLeft" || k === "a") lane = Math.max(0, lane - 1);
        if (k === "ArrowRight" || k === "d") lane = Math.min(2, lane + 1);
      });
      api.onDown((p) => {
        const l = Math.floor(p.x / LW);
        if (l >= 0 && l <= 2) lane = l;
      });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t += dt;
          speed = 300 + t * 22;
          score = Math.floor(t * 12);
          api.setScore(score);
          if (t > api.rand(0.55, 1.1)) {
            t = 0;
            let l = api.ri(0, 2);
            if (cars.length && cars[cars.length - 1].lane === l && Math.random() < 0.7) l = (l + 1) % 3;
            cars.push({ lane: l, y: -80 });
          }
          for (const c of cars) c.y += speed * dt;
          cars = cars.filter((c) => c.y < 660);
          const cx = lane * LW + LW / 2;
          for (const c of cars) {
            const ox = c.lane * LW + LW / 2;
            if (Math.abs(ox - cx) < 70 && Math.abs(c.y - 480) < 80) {
              dead = true;
              api.beep(120, 0.3, "square", 0.07, 40);
              api.over("撞车了", "得分 " + score);
            }
          }
        }
        api.clear("#0c0f13");
        ctx.fillStyle = "#2a3138";
        for (let l = 0; l < 3; l++) ctx.fillRect(l * LW + 4, 0, LW - 8, 600);
        ctx.fillStyle = "rgba(255,255,255,.25)";
        for (let l = 1; l < 3; l++) {
          for (let y = -60 + (t * speed * 0.6 % 60); y < 600; y += 60) {
            ctx.fillRect(l * LW - 2, y, 4, 30);
          }
        }
        for (const c of cars) {
          const cx = c.lane * LW + LW / 2;
          api.rr(cx - 32, c.y - 44, 64, 88, 12);
          ctx.fillStyle = api.pick ? "#ff8787" : "#ff8787";
          ctx.fillStyle = "#ff8787"; ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.25)";
          ctx.fillRect(cx - 24, c.y - 24, 48, 22);
        }
        const cx = lane * LW + LW / 2;
        api.rr(cx - 32, 436, 64, 88, 12);
        ctx.fillStyle = "#4fd1c5"; ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.3)";
        ctx.fillRect(cx - 24, 456, 48, 22);
        api.text(score + "", 340, 40, { size: 16, weight: 800, color: "#8fb8c9", align: "right" });
      });
    }
  });

  /* ================= 弹跳小鸟 ================= */
  GB.add({
    id: "doodle", name: "一飞冲天", cat: "arcade", icon: "🚀",
    desc: "不断向上弹跳，爬得越高越好", tip: "← → 移动 · 自动落在平台上",
    w: 380, h: 600, colors: ["#1c2a4a", "#0a0f1e"],
    init(api) {
      const ctx = api.ctx;
      let x, y, vx, vy, plats, score, dead, bestY;
      function reset() {
        x = 190; y = 420; vx = 0; vy = -500;
        plats = [{ x: 120, y: 460 }, { x: 30, y: 380 }, { x: 240, y: 320 }, { x: 90, y: 250 }, { x: 220, y: 180 }];
        let yy = 110;
        while (plats.length < 14) {
          plats.push({ x: api.rand(10, 300), y: yy });
          yy -= api.rand(52, 76);
        }
        score = 0; dead = false; bestY = y;
        api.setScore(0);
      }
      api.onMove((p) => { vx = api.clamp((p.x - x) * 4, -260, 260); });
      api.onKey((k) => {
        if (k === "ArrowLeft" || k === "a") vx = -220;
        if (k === "ArrowRight" || k === "d") vx = 220;
      });
      api.onDown((p) => { vx = api.clamp((p.x - x) * 4, -260, 260); });
      reset();
      api.loop((dt) => {
        if (!dead) {
          vy += 1300 * dt;
          x += vx * dt; y += vy * dt;
          if (x < 16) x = 16; if (x > 364) x = 364;
          if (y < bestY - 0) {
            const dy = bestY - y;
            if (dy > 0) { score += Math.floor(dy); api.setScore(score); bestY = y; }
          }
          if (vy > 0) {
            for (const p of plats) {
              if (x > p.x - 14 && x < p.x + 74 && y + 14 > p.y && y + 14 < p.y + 18 + vy * dt) {
                vy = -560;
                api.beep(560, 0.05, "sine", 0.045, 760);
                break;
              }
            }
          }
          // 卷动
          if (y < 240) {
            const d = 240 - y;
            y = 240;
            for (const p of plats) p.y += d;
            plats = plats.filter((p) => p.y < 640);
            let max = Math.min(...plats.map((p) => p.y));
            while (max > 40) {
              max -= api.rand(52, 78);
              plats.push({ x: api.rand(10, 300), y: max });
            }
          }
          if (y > 620) { dead = true; api.over("掉下去了", "高度 " + score); }
        }
        api.clear("#0a0f1e");
        for (const p of plats) {
          api.rr(p.x, p.y, 76, 12, 6);
          ctx.fillStyle = "#5b8a5f"; ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.25)";
          ctx.fillRect(p.x, p.y, 76, 4);
        }
        ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fillStyle = "#ffd75e"; ctx.shadowColor = "#ffd75e"; ctx.shadowBlur = 14; ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#111";
        ctx.beginPath(); ctx.arc(x + 5, y - 4, 2.5, 0, Math.PI * 2); ctx.fill();
        api.text(score + " m", 340, 36, { size: 15, weight: 800, color: "#a8c8f2", align: "right" });
      });
    }
  });

  /* ================= 钩子摆荡 ================= */
  GB.add({
    id: "hook", name: "钩子摆荡", cat: "arcade", icon: "🪝",
    desc: "抓住钩点向前摆荡", tip: "点击 / 空格发射钩索 · 松手飞出",
    w: 560, h: 400, colors: ["#1a2a3a", "#0a121a"],
    init(api) {
      const ctx = api.ctx, GY = 360;
      let x, y, vx, vy, hook, t, dist, dead, cams;
      function reset() {
        x = 60; y = 300; vx = 0; vy = 0; hook = null; t = 0; dist = 0; dead = false;
        cams = [];
        for (let i = 0; i < 4; i++) cams.push({ x: 300 + i * 500, y: api.rand(60, 200), r: 26 });
        api.setScore(0);
      }
      function grab() {
        if (dead || hook) return;
        let best = null, bd = 1e9;
        for (const c of cams) {
          const d = Math.hypot(c.x - x, c.y - y);
          if (d < 260 && d > 40 && d < bd) { bd = d; best = c; }
        }
        if (best) {
          hook = { x: best.x, y: best.y, len: Math.hypot(best.x - x, best.y - y) };
          api.beep(600, 0.06, "sine", 0.045, 800);
        }
      }
      function release() {
        if (hook) {
          vx += (x - hook.x) / hook.len * 240;
          vy += (y - hook.y) / hook.len * 240;
          hook = null;
          api.beep(420, 0.05, "sine", 0.04, 600);
        }
      }
      api.onDown(() => grab());
      api.onUp(() => release());
      api.onKey((k) => { if (k === " ") grab(); });
      api.onKeyUp((k) => { if (k === " ") release(); });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t += dt;
          if (hook) {
            const dx = x - hook.x, dy = y - hook.y;
            const len = Math.hypot(dx, dy);
            // 摆动
            const nx = vx + (-dx / len) * (-300 * dt);
            vx += (-dx / len) * 0;
            // 简化钟摆：向心约束
            vx += (-hook.x + x) * 0;
            const ax = -(dx) / len * (vx * dx + vy * dy) / len;
            const ay = -(dy) / len * (vx * dx + vy * dy) / len;
            vx += ax * 1.02;
            vy += ay * 1.02 + 620 * dt;
            x += vx * dt; y += vy * dt;
            const ndx = x - hook.x, ndy = y - hook.y;
            const nlen = Math.hypot(ndx, ndy);
            if (nlen > hook.len) {
              x = hook.x + ndx / nlen * hook.len;
              y = hook.y + ndy / nlen * hook.len;
              const dot = (vx * ndx + vy * ndy) / (nlen * nlen);
              vx -= dot * ndx; vy -= dot * ndy;
            }
          } else {
            vy += 780 * dt;
            x += vx * dt; y += vy * dt;
          }
          dist = Math.floor(Math.max(dist, x / 10));
          api.setScore(dist);
          if (y > GY + 20) { dead = true; api.over("掉下去了", "距离 " + dist + "m"); }
          for (const c of cams) if (Math.hypot(c.x - x, c.y - y) < c.r + 10) { dead = true; api.over("撞上尖刺", "距离 " + dist + "m"); }
        }
        api.clear("#0a121a");
        ctx.fillStyle = "#1c2836";
        ctx.fillRect(0, GY, 560, 40);
        ctx.fillStyle = "#ff8787";
        for (const c of cams) {
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const rr = c.r * (i % 2 ? 0.7 : 1);
            i ? ctx.lineTo(c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr) : ctx.moveTo(c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr);
          }
          ctx.closePath(); ctx.fill();
        }
        if (hook) {
          ctx.strokeStyle = "#c9cede"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(hook.x, hook.y); ctx.lineTo(x, y); ctx.stroke();
          ctx.fillStyle = "#8fb8ef";
          ctx.beginPath(); ctx.arc(hook.x, hook.y, 7, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = "#4fd1c5";
        ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
        api.text(dist + " m", 520, 32, { size: 15, weight: 800, color: "#8fb8c9", align: "right" });
        api.text("点击抓住最近的钩点", 280, 30, { size: 11, color: "#3f5a6a" });
      });
    }
  });

  /* ================= 迷你高尔夫 ================= */
  GB.add({
    id: "golf", name: "迷你高尔夫", cat: "arcade", icon: "⛳",
    desc: "计算力度和角度，一杆进洞", tip: "从球拖拽出方向和力度，松手击球",
    w: 520, h: 480, colors: ["#1a3a24", "#0a1610"],
    init(api) {
      const ctx = api.ctx;
      let ball, hole, walls, strokes, level, dragging, drag, stopped;
      const LEVELS = [
        { ball: [70, 240], hole: [450, 240], walls: [[240, 100, 20, 280]] },
        { ball: [70, 400], hole: [450, 80], walls: [[180, 0, 20, 300], [320, 180, 20, 300]] },
        { ball: [70, 240], hole: [260, 240], walls: [[140, 60, 20, 200], [140, 300, 20, 180], [360, 100, 20, 280]] }
      ];
      function load(i) {
        const L = LEVELS[i % LEVELS.length];
        ball = { x: L.ball[0], y: L.ball[1], vx: 0, vy: 0 };
        hole = { x: L.hole[0], y: L.hole[1] };
        walls = L.walls;
        strokes = 0;
      }
      function reset() { level = 0; load(0); api.setScore(0); }
      function blocked(nx, ny) {
        for (const w of walls) {
          if (nx > w[0] - 8 && nx < w[0] + w[2] + 8 && ny > w[1] - 8 && ny < w[1] + w[3] + 8) return true;
        }
        return nx < 10 || nx > 510 || ny < 10 || ny > 470;
      }
      api.onDown((p) => {
        if (Math.hypot(p.x - ball.x, p.y - ball.y) < 40) { dragging = true; drag = p; }
      });
      api.onMove((p) => { if (dragging) drag = p; });
      api.onUp(() => {
        if (!dragging) return;
        dragging = false;
        const dx = ball.x - drag.x, dy = ball.y - drag.y;
        const d = Math.hypot(dx, dy);
        if (d < 12) return;
        const power = Math.min(d, 160) / 160 * 620;
        ball.vx = dx / d * power;
        ball.vy = dy / d * power;
        strokes++;
        api.setScore(api.score + 50);
        api.beep(500, 0.06, "sine", 0.04, 700);
      });
      reset();
      api.loop((dt) => {
        const sp = Math.hypot(ball.vx, ball.vy);
        if (sp > 4) {
          let nx = ball.x + ball.vx * dt, ny = ball.y + ball.vy * dt;
          if (blocked(nx, ball.y)) { ball.vx *= -0.6; api.beep(300, 0.04, "sine", 0.03); }
          if (blocked(ball.x, ny)) { ball.vy *= -0.6; api.beep(300, 0.04, "sine", 0.03); }
          if (!blocked(nx, ball.y)) ball.x = nx;
          if (!blocked(ball.x, ny)) ball.y = ny;
          ball.vx *= 0.985; ball.vy *= 0.985;
        } else { ball.vx = 0; ball.vy = 0; }
        if (Math.hypot(ball.x - hole.x, ball.y - hole.y) < 14 && sp < 300) {
          api.beep(880, 0.15, "sine", 0.06);
          level++;
          if (level >= LEVELS.length) { api.over("全部完成！", "总杆数 " + strokes * 1, true); reset(); }
          else load(level);
        }
        api.clear("#0a1610");
        api.rr(10, 10, 500, 460, 16);
        ctx.fillStyle = "rgba(105,219,124,.07)"; ctx.fill();
        ctx.strokeStyle = "rgba(105,219,124,.2)"; ctx.lineWidth = 1.4; ctx.stroke();
        for (const w of walls) {
          api.rr(w[0], w[1], w[2], w[3], 6);
          ctx.fillStyle = "#4a6a4a"; ctx.fill();
        }
        // 洞
        ctx.beginPath(); ctx.arc(hole.x, hole.y, 13, 0, Math.PI * 2);
        ctx.fillStyle = "#0c1410"; ctx.fill();
        ctx.strokeStyle = "#ffd75e"; ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,.3)";
        ctx.beginPath(); ctx.moveTo(hole.x, hole.y - 13); ctx.lineTo(hole.x, hole.y - 40); ctx.stroke();
        api.text("⛳", hole.x, hole.y - 46, { size: 17 });
        if (dragging) {
          ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 2.4;
          ctx.setLineDash([6, 6]);
          ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x * 2 - drag.x, ball.y * 2 - drag.y); ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.beginPath(); ctx.arc(ball.x, ball.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = "#fff"; ctx.fill();
        api.text("第 " + (level + 1) + " 洞 · " + strokes + " 杆", 24, 32, { size: 13, weight: 700, color: "#8fe3a8", align: "left" });
      });
    }
  });

  /* ================= 忍者跳跃 ================= */
  GB.add({
    id: "ninja", name: "忍者跳跃", cat: "arcade", icon: "🥷",
    desc: "在两墙之间来回跳跃上升", tip: "点击 / 空格 蹬墙跳",
    w: 420, h: 600, colors: ["#33202a", "#140a10"],
    init(api) {
      const ctx = api.ctx;
      let side, y, vy, score, dead, t, spikes;
      function reset() {
        side = 0; y = 500; vy = 0; score = 0; dead = false; t = 0;
        spikes = [];
        api.setScore(0);
      }
      function jump() {
        if (dead) return;
        vy = -640;
        side = 1 - side;
        score += 5;
        api.setScore(score);
        api.beep(520, 0.06, "sine", 0.045, 760);
      }
      api.onDown(jump);
      api.onKey((k) => { if (k === " " || k === "ArrowUp" || k === "w") jump(); });
      reset();
      api.loop((dt) => {
        if (!dead) {
          vy += 1500 * dt;
          y += vy * dt;
          t += dt;
          if (y > 560) { dead = true; api.over("坠落了", "高度 " + score); }
          const targetX = side ? 370 : 50;
          // 到墙停
          if ((side === 0 && y > 60) || true) {}
          if (y < 40) { vy = Math.max(vy, 0); }
          if (Math.random() < dt * 0.9) spikes.push({ side: api.ri(0, 1), y: -20 });
          for (const s of spikes) s.y += 130 * dt;
          spikes = spikes.filter((s) => s.y < 640);
          for (const s of spikes) {
            if (s.side === side && Math.abs(s.y - y) < 22) {
              dead = true;
              api.over("被尖刺击中", "高度 " + score);
              break;
            }
          }
          while (spikes.length && spikes[0].y < -40) spikes.shift();
        }
        api.clear("#140a10");
        ctx.fillStyle = "#2a1a24";
        ctx.fillRect(0, 0, 30, 600);
        ctx.fillRect(390, 0, 30, 600);
        ctx.fillStyle = "#ff6b6b";
        for (let yy = 0; yy < 600; yy += 34) {
          ctx.beginPath();
          ctx.moveTo(30, yy + (side === 0 && false ? 0 : 0));
          ctx.moveTo(30, yy); ctx.lineTo(30, yy + 20); ctx.lineTo(42, yy + 10); ctx.closePath();
          ctx.moveTo(390, yy); ctx.lineTo(390, yy + 20); ctx.lineTo(378, yy + 10); ctx.closePath();
          ctx.fill();
        }
        for (const s of spikes) {
          api.text("🔻", s.side ? 390 : 30, s.y, { size: 18 });
        }
        const nx = side ? 370 : 50;
        ctx.fillStyle = "#c8a8e8";
        ctx.beginPath(); ctx.arc(nx, y, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1a1020";
        ctx.fillRect(nx - 13, y - 4, 26, 5);
        api.text(score + "", 210, 40, { size: 18, weight: 800, color: "#e8d8f2" });
      });
    }
  });

  /* ================= 弹珠台 ================= */
  GB.add({
    id: "pinball", name: "弹珠台", cat: "arcade", icon: "🎱",
    desc: "左右挡板弹球得分", tip: "← → 或 A D 控制左右挡板",
    w: 400, h: 600, colors: ["#2a1a3a", "#120a1a"],
    init(api) {
      const ctx = api.ctx;
      let ball, fl, fr, score, dead, bumpers;
      function reset() {
        ball = { x: 200, y: 120, vx: api.rand(-60, 60), vy: 40 };
        fl = 0; fr = 0; score = 0; dead = false;
        bumpers = [
          { x: 130, y: 210, r: 22 }, { x: 270, y: 210, r: 22 },
          { x: 200, y: 140, r: 18 }, { x: 90, y: 300, r: 18 }, { x: 310, y: 300, r: 18 }
        ];
        api.setScore(0);
      }
      api.onKey((k) => {
        if (k === "ArrowLeft" || k === "a") fl = 1;
        if (k === "ArrowRight" || k === "d") fr = 1;
      });
      api.onKeyUp((k) => {
        if (k === "ArrowLeft" || k === "a") fl = 0;
        if (k === "ArrowRight" || k === "d") fr = 0;
      });
      api.onDown((p) => { if (p.x < 200) fl = 1; else fr = 1; });
      api.onUp((p) => { if (p.x < 200) fl = 0; else fr = 0; });
      reset();
      api.loop((dt) => {
        if (!dead) {
          ball.vy += 560 * dt;
          ball.x += ball.vx * dt; ball.y += ball.vy * dt;
          if (ball.x < 16) { ball.x = 16; ball.vx = Math.abs(ball.vx) * 0.9; api.beep(300, 0.03, "sine", 0.03); }
          if (ball.x > 384) { ball.x = 384; ball.vx = -Math.abs(ball.vx) * 0.9; api.beep(300, 0.03, "sine", 0.03); }
          if (ball.y < 16) { ball.y = 16; ball.vy = Math.abs(ball.vy) * 0.9; }
          for (const b of bumpers) {
            const d = Math.hypot(ball.x - b.x, ball.y - b.y);
            if (d < b.r + 9) {
              const nx = (ball.x - b.x) / d, ny = (ball.y - b.y) / d;
              ball.x = b.x + nx * (b.r + 9);
              ball.y = b.y + ny * (b.r + 9);
              const dot = ball.vx * nx + ball.vy * ny;
              ball.vx = (ball.vx - 2 * dot * nx) * 1.05;
              ball.vy = (ball.vy - 2 * dot * ny) * 1.05;
              score += 15;
              api.setScore(score);
              api.beep(700, 0.06, "sine", 0.05, 900);
            }
          }
          // 挡板
          if (ball.y > 520 && ball.y < 550) {
            if (ball.x > 40 && ball.x < 170 && fl) {
              ball.vy = -Math.abs(ball.vy) - 160; ball.vx += 120;
              api.beep(480, 0.05, "sine", 0.045);
            }
            if (ball.x > 230 && ball.x < 360 && fr) {
              ball.vy = -Math.abs(ball.vy) - 160; ball.vx -= 120;
              api.beep(480, 0.05, "sine", 0.045);
            }
          }
          if (ball.y > 620) { dead = true; api.over("掉出球道", "得分 " + score); }
        }
        api.clear("#120a1a");
        api.rr(8, 8, 384, 584, 14);
        ctx.strokeStyle = "rgba(200,168,232,.3)"; ctx.lineWidth = 3; ctx.stroke();
        for (const b of bumpers) {
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(124,92,255,.5)"; ctx.fill();
          ctx.strokeStyle = "rgba(167,139,250,.8)"; ctx.lineWidth = 1.6; ctx.stroke();
        }
        // 底部斜坡
        ctx.fillStyle = "#2a1a3a";
        ctx.beginPath(); ctx.moveTo(20, 560); ctx.lineTo(180, 500); ctx.lineTo(180, 560); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(380, 560); ctx.lineTo(220, 500); ctx.lineTo(220, 560); ctx.closePath(); ctx.fill();
        // 挡板
        ctx.strokeStyle = "#4fd1c5"; ctx.lineWidth = 7; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(40, 548); ctx.lineTo(40 + (fl ? 130 : 105), 548 - (fl ? 34 : 18)); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(360, 548); ctx.lineTo(360 - (fr ? 130 : 105), 548 - (fr ? 34 : 18)); ctx.stroke();
        ctx.beginPath(); ctx.arc(ball.x, ball.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = "#ffd75e"; ctx.shadowColor = "#ffd75e"; ctx.shadowBlur = 12; ctx.fill();
        ctx.shadowBlur = 0;
        api.text(score + "", 200, 36, { size: 16, weight: 800, color: "#c8a8e8" });
      });
    }
  });

  /* ================= 弹幕生存 ================= */
  GB.add({
    id: "bulletstorm", name: "弹幕生存", cat: "arcade", icon: "💥",
    desc: "在环形弹幕中极限生存", tip: "拖动移动 · 撞到弹幕就结束",
    w: 480, h: 480, colors: ["#2a1030", "#100616"],
    init(api) {
      const ctx = api.ctx;
      let x, y, bullets, t, score, dead, wave;
      function reset() {
        x = 240; y = 300; bullets = []; t = 0; score = 0; dead = false; wave = 0;
        api.setScore(0);
      }
      api.onMove((p) => { x = api.clamp(p.x, 14, 466); y = api.clamp(p.y, 14, 466); });
      api.onDown((p) => { x = api.clamp(p.x, 14, 466); y = api.clamp(p.y, 14, 466); });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t += dt;
          score = Math.floor(t * 20);
          api.setScore(score);
          if (t > wave + 1.2) {
            wave = t;
            const n = 10 + Math.floor(t / 6);
            const cx = api.rand(80, 400), cy = api.rand(80, 400);
            const off = api.rand(0, Math.PI * 2);
            for (let i = 0; i < n; i++) {
              const a = off + i / n * Math.PI * 2;
              bullets.push({ x: cx, y: cy, vx: Math.cos(a) * 130, vy: Math.sin(a) * 130 });
            }
            api.beep(220, 0.05, "triangle", 0.03);
          }
          for (const b of bullets) { b.x += b.vx * dt; b.y += b.vy * dt; }
          bullets = bullets.filter((b) => b.x > -20 && b.x < 500 && b.y > -20 && b.y < 500);
          for (const b of bullets) {
            if (Math.hypot(b.x - x, b.y - y) < 10) {
              dead = true;
              api.beep(110, 0.3, "square", 0.07, 40);
              api.over("被弹幕命中", "生存 " + t.toFixed(1) + " 秒");
              break;
            }
          }
        }
        api.clear("#100616");
        ctx.fillStyle = "#ff6b81";
        for (const b of bullets) {
          ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fillStyle = "#4fd1c5"; ctx.shadowColor = "#4fd1c5"; ctx.shadowBlur = 16; ctx.fill();
        ctx.shadowBlur = 0;
        api.text(t.toFixed(1) + "s", 240, 30, { size: 16, weight: 800, color: "#e8c9e0" });
      });
    }
  });

  /* ================= 打靶射击 ================= */
  GB.add({
    id: "targets", name: "打靶射击", cat: "arcade", icon: "🎯",
    desc: "限时射击移动靶心", tip: "点击靶心得分 · 30 秒内冲高分",
    w: 480, h: 560, colors: ["#2a2a1a", "#12120a"],
    init(api) {
      const ctx = api.ctx;
      let targets, t, score, combo, dead;
      function reset() {
        targets = [];
        for (let i = 0; i < 4; i++) spawn();
        t = 30; score = 0; combo = 0; dead = false;
        api.setScore(0);
      }
      function spawn() {
        targets.push({ x: api.rand(60, 420), y: api.rand(90, 500), r: api.rand(18, 30), vx: api.pick([-1, 1]) * api.rand(30, 90), born: api.t });
      }
      api.onDown((p) => {
        if (dead) return;
        let hit = false;
        for (let i = targets.length - 1; i >= 0; i--) {
          const tg = targets[i];
          if (Math.hypot(tg.x - p.x, tg.y - p.y) < tg.r + 6) {
            targets.splice(i, 1);
            combo++;
            score += Math.round(50 + combo * 10 + (30 - tg.r) * 3);
            api.setScore(score);
            api.beep(700 + combo * 40, 0.07, "sine", 0.05);
            spawn();
            hit = true;
            break;
          }
        }
        if (!hit) { combo = 0; api.beep(160, 0.07, "square", 0.04); }
      });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t -= dt;
          if (t <= 0) { dead = true; api.over("时间到！", "得分 " + score); }
          for (const tg of targets) {
            tg.x += tg.vx * dt;
            if (tg.x < 40 || tg.x > 440) tg.vx *= -1;
          }
        }
        api.clear("#12120a");
        api.text("时间 " + Math.max(0, t).toFixed(1) + "s", 24, 36, { size: 14, weight: 700, color: "#ffe08a", align: "left" });
        api.text("连击 ×" + combo, 456, 36, { size: 13, color: "#8a8a5a", align: "right" });
        for (const tg of targets) {
          ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r, 0, Math.PI * 2);
          ctx.fillStyle = "#ff6b6b"; ctx.fill();
          ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r * 0.66, 0, Math.PI * 2);
          ctx.fillStyle = "#fff"; ctx.fill();
          ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r * 0.33, 0, Math.PI * 2);
          ctx.fillStyle = "#ff6b6b"; ctx.fill();
        }
      });
    }
  });
})();
