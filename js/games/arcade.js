/* ==========================================================
   arcade.js — 街机游戏 12 款
   ========================================================== */
(function () {
  "use strict";

  /* ================= 贪吃蛇 ================= */
  GB.add({
    id: "snake", name: "贪吃蛇", cat: "arcade", icon: "🐍",
    desc: "吃食物变长，别咬到自己", tip: "方向键 / WASD 控制 · 触屏用下方方向键",
    w: 480, h: 560, colors: ["#12331f", "#06140c"],
    init(api) {
      const ctx = api.ctx, N = 17, S = 28;
      const OX = (480 - N * S) / 2, OY = 84;
      let snake, dir, nd, food, t, speed, score, dead;
      function reset() {
        snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
        dir = [1, 0]; nd = [1, 0]; t = 0; speed = 7; score = 0; dead = false;
        place();
        api.setScore(0);
        api.dpad((d) => {
          const m = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] }[d];
          if (m[0] !== -dir[0] || m[1] !== -dir[1]) nd = m;
        });
      }
      function place() {
        do {
          food = { x: api.ri(0, N - 1), y: api.ri(0, N - 1) };
        } while (snake.some((s) => s.x === food.x && s.y === food.y));
      }
      api.onKey((k) => {
        const m = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] }[k];
        if (m && (m[0] !== -dir[0] || m[1] !== -dir[1])) nd = m;
      });
      reset();
      api.loop((dt) => {
        t += dt;
        const step = 1 / (speed + Math.min(6, score / 80));
        while (t > step) {
          t -= step;
          dir = nd;
          const h = { x: snake[0].x + dir[0], y: snake[0].y + dir[1] };
          if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || snake.some((s) => s.x === h.x && s.y === h.y)) {
            api.beep(140, 0.25, "square", 0.06, 60);
            api.over("撞车了", "长度 " + snake.length);
            dead = true;
            break;
          }
          snake.unshift(h);
          if (h.x === food.x && h.y === food.y) {
            score += 10;
            api.setScore(score);
            api.beep(700, 0.06, "sine", 0.05, 900);
            place();
          } else snake.pop();
        }
        if (dead) return;
        api.clear("#06140c");
        api.text("得分 " + score, 24, 40, { size: 15, weight: 800, color: "#8fe3a8", align: "left" });
        api.text("长度 " + snake.length, 456, 40, { size: 12, color: "#3f6a4a", align: "right" });
        api.rr(OX - 3, OY - 3, N * S + 6, N * S + 6, 10);
        ctx.strokeStyle = "rgba(143,227,168,.2)"; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath();
        ctx.arc(OX + (food.x + 0.5) * S, OY + (food.y + 0.5) * S, S * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = "#ff6b6b";
        ctx.shadowColor = "#ff6b6b"; ctx.shadowBlur = 10;
        ctx.fill(); ctx.shadowBlur = 0;
        snake.forEach((s, i) => {
          api.rr(OX + s.x * S + 2, OY + s.y * S + 2, S - 4, S - 4, 7);
          const k = 1 - i / (snake.length + 4);
          ctx.fillStyle = i === 0 ? "#6ee7a0" : "rgba(110,231,160," + (0.35 + k * 0.55) + ")";
          ctx.fill();
        });
      });
    }
  });

  /* ================= 俄罗斯方块 ================= */
  GB.add({
    id: "tetris", name: "俄罗斯方块", cat: "arcade", icon: "🧱",
    desc: "经典落块消行", tip: "← → 移动 · ↑ 旋转 · ↓ 加速 · 空格直落",
    w: 460, h: 580, colors: ["#1c2440", "#0a0e1c"],
    init(api) {
      const ctx = api.ctx, C = 10, R = 18, S = 28;
      const OX = (460 - C * S) / 2, OY = 76;
      const SHAPES = [
        { c: "#4dabf7", m: [[1, 1, 1, 1]] },
        { c: "#ffd43b", m: [[1, 1], [1, 1]] },
        { c: "#69db7c", m: [[0, 1, 1], [1, 1, 0]] },
        { c: "#ff8787", m: [[1, 1, 0], [0, 1, 1]] },
        { c: "#e599f7", m: [[1, 0, 0], [1, 1, 1]] },
        { c: "#ffa94d", m: [[0, 0, 1], [1, 1, 1]] },
        { c: "#66d9e8", m: [[0, 1, 0], [1, 1, 1]] }
      ];
      let grid, cur, next, drop, score, lines, over, softDropping;
      function newPiece() { const s = api.pick(SHAPES); return { c: s.c, m: s.m.map((r) => r.slice()) }; }
      function spawn() {
        cur = { m: next.m.map((r) => r.slice()), c: next.c, x: Math.floor((C - next.m[0].length) / 2), y: 0 };
        next = newPiece();
        if (hit(cur.x, cur.y)) {
          over = true;
          api.over("游戏结束", "消除了 " + lines + " 行");
        }
      }
      function hit(x, y) {
        for (let j = 0; j < cur.m.length; j++) for (let i = 0; i < cur.m[j].length; i++) {
          if (!cur.m[j][i]) continue;
          const gx = x + i, gy = y + j;
          if (gx < 0 || gx >= C || gy >= R) return true;
          if (gy >= 0 && grid[gy * C + gx]) return true;
        }
        return false;
      }
      function lock() {
        for (let j = 0; j < cur.m.length; j++) for (let i = 0; i < cur.m[j].length; i++) {
          if (cur.m[j][i] && cur.y + j >= 0) grid[(cur.y + j) * C + cur.x + i] = cur.c;
        }
        api.beep(220, 0.05, "triangle", 0.05);
        let cleared = 0;
        for (let y = R - 1; y >= 0; y--) {
          if (grid.slice(y * C, y * C + C).every((v) => v)) {
            grid.splice(y * C, C);
            grid.unshift(...Array(C).fill(0));
            cleared++; y++;
          }
        }
        if (cleared) {
          lines += cleared;
          score += [0, 100, 300, 500, 800][cleared];
          api.setScore(score);
          api.beep(700, 0.12, "sine", 0.06, 1000);
        }
        spawn();
      }
      function reset() {
        grid = Array(C * R).fill(0);
        next = newPiece();
        score = 0; lines = 0; over = false; drop = 0;
        api.setScore(0);
        spawn();
      }
      api.onKey((k, e) => {
        if (over) return;
        if (k === "ArrowLeft" || k === "a") { if (!hit(cur.x - 1, cur.y)) cur.x--; }
        else if (k === "ArrowRight" || k === "d") { if (!hit(cur.x + 1, cur.y)) cur.x++; }
        else if (k === "ArrowDown" || k === "s") drop = 1;
        else if (k === "ArrowUp" || k === "w") {
          const m = cur.m[0].map((_, i) => cur.m.map((r) => r[i]).reverse());
          const old = cur.m;
          cur.m = m;
          if (hit(cur.x, cur.y)) cur.m = old;
          else api.beep(480, 0.04, "sine", 0.04);
        } else if (k === " ") {
          while (!hit(cur.x, cur.y + 1)) cur.y++;
          lock();
        }
      });
      reset();
      api.loop((dt) => {
        if (!over) {
          drop += dt * (1.1 + lines * 0.06);
          if (drop >= 1) {
            drop = 0;
            if (!hit(cur.x, cur.y + 1)) cur.y++;
            else lock();
          }
        }
        api.clear("#0a0e1c");
        api.text("行 " + lines, 24, 40, { size: 14, weight: 700, color: "#8fa8e8", align: "left" });
        api.text("下一块 ▸", 436, 40, { size: 11, color: "#4a5a7a", align: "right" });
        next.m.forEach((row, j) => row.forEach((v, i) => {
          if (!v) return;
          api.rr(392 + i * 16, 56 + j * 16, 14, 14, 3);
          ctx.fillStyle = next.c; ctx.fill();
        }));
        api.rr(OX - 3, OY - 3, C * S + 6, R * S + 6, 8);
        ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.lineWidth = 2; ctx.stroke();
        for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
          const v = grid[y * C + x];
          if (!v) continue;
          api.rr(OX + x * S + 2, OY + y * S + 2, S - 4, S - 4, 5);
          ctx.fillStyle = v; ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.14)";
          ctx.fillRect(OX + x * S + 2, OY + y * S + 2, S - 4, 4);
        }
        if (!over) {
          cur.m.forEach((row, j) => row.forEach((v, i) => {
            if (!v || cur.y + j < 0) return;
            api.rr(OX + (cur.x + i) * S + 2, OY + (cur.y + j) * S + 2, S - 4, S - 4, 5);
            ctx.fillStyle = cur.c;
            ctx.shadowColor = cur.c; ctx.shadowBlur = 8;
            ctx.fill(); ctx.shadowBlur = 0;
          }));
        }
      });
    }
  });

  /* ================= 打砖块 ================= */
  GB.add({
    id: "breakout", name: "打砖块", cat: "arcade", icon: "🧨",
    desc: "弹球击碎所有砖块", tip: "移动鼠标 / 手指控制挡板 · 点击发球",
    w: 480, h: 560, colors: ["#12233d", "#060d18"],
    init(api) {
      const ctx = api.ctx, C = 8, ROWS = 5;
      const BW = 54, BH = 20, OX = (480 - C * BW) / 2, OY = 80;
      let bricks, ball, paddle, launched, score, level, lives;
      function build() {
        bricks = [];
        const cols = ["#ff6b6b", "#ffa94d", "#ffd43b", "#69db7c", "#4dabf7"];
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < C; c++) {
          bricks.push({ x: OX + c * BW, y: OY + r * (BH + 6), c: cols[r], alive: true });
        }
      }
      function reset(keepScore) {
        build();
        paddle = { x: 200, w: 90 };
        ball = { x: 240, y: 460, vx: 0, vy: 0, r: 7 };
        launched = false;
        if (!keepScore) { score = 0; level = 1; lives = 3; api.setScore(0); }
      }
      api.onMove((p) => { paddle.x = api.clamp(p.x - paddle.w / 2, 0, 480 - paddle.w); });
      api.onDown(() => {
        if (!launched) { launched = true; ball.vx = api.rand(-140, 140); ball.vy = -330; api.beep(600, 0.06, "sine", 0.05); }
      });
      api.onKey((k) => {
        if (k === "ArrowLeft" || k === "a") paddle.x = Math.max(0, paddle.x - 36);
        if (k === "ArrowRight" || k === "d") paddle.x = Math.min(480 - paddle.w, paddle.x + 36);
        if (k === " ") if (!launched) { launched = true; ball.vx = api.rand(-140, 140); ball.vy = -330; }
      });
      reset(false);
      api.loop((dt) => {
        if (launched) {
          ball.x += ball.vx * dt; ball.y += ball.vy * dt;
          if (ball.x < ball.r) { ball.x = ball.r; ball.vx *= -1; api.beep(300, 0.03, "sine", 0.03); }
          if (ball.x > 480 - ball.r) { ball.x = 480 - ball.r; ball.vx *= -1; api.beep(300, 0.03, "sine", 0.03); }
          if (ball.y < ball.r + 40) { ball.y = ball.r + 40; ball.vy *= -1; }
          const py = 530;
          if (ball.vy > 0 && ball.y + ball.r >= py && ball.y < py + 14 && ball.x > paddle.x && ball.x < paddle.x + paddle.w) {
            ball.vy = -Math.abs(ball.vy);
            ball.vx = ((ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2)) * 220;
            api.beep(440, 0.04, "sine", 0.04);
          }
          if (ball.y > 600) {
            lives--;
            api.beep(140, 0.2, "square", 0.06, 70);
            if (lives <= 0) { api.over("球掉了", "得分 " + score); }
            else reset(true);
          }
          for (const b of bricks) {
            if (!b.alive) continue;
            if (ball.x > b.x - ball.r && ball.x < b.x + BW + ball.r && ball.y > b.y - ball.r && ball.y < b.y + BH + ball.r) {
              b.alive = false;
              ball.vy *= -1;
              score += 10 * level;
              api.setScore(score);
              api.beep(660, 0.05, "sine", 0.05, 800);
              break;
            }
          }
          if (!bricks.some((b) => b.alive)) {
            level++;
            api.setScore(score);
            api.beep(800, 0.15, "sine", 0.06, 1200);
            reset(true);
          }
        }
        api.clear("#060d18");
        api.text("得分 " + score, 24, 40, { size: 14, weight: 700, color: "#8fb8ef", align: "left" });
        api.text("关卡 " + level + " · 球 ×" + lives, 456, 40, { size: 12, color: "#3f5a7a", align: "right" });
        for (const b of bricks) {
          if (!b.alive) continue;
          api.rr(b.x, b.y, BW - 4, BH, 5);
          ctx.fillStyle = b.c; ctx.fill();
        }
        api.rr(paddle.x, 530, paddle.w, 12, 7);
        ctx.fillStyle = "#e8eef8"; ctx.fill();
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fillStyle = "#ffd75e"; ctx.shadowColor = "#ffd75e"; ctx.shadowBlur = 12; ctx.fill();
        ctx.shadowBlur = 0;
        if (!launched) api.text("点击 / 空格发球", 240, 420, { size: 13, color: "#5a6a8a" });
      });
    }
  });

  /* ================= 像素鸟 ================= */
  GB.add({
    id: "flappy", name: "像素鸟", cat: "arcade", icon: "🐦",
    desc: "点按飞行，穿过管道缝隙", tip: "点击 / 空格 拍翅膀",
    w: 420, h: 600, colors: ["#1a3a4a", "#0a161c"],
    init(api) {
      const ctx = api.ctx;
      let y, vy, pipes, score, started, dead, t;
      function reset() {
        y = 280; vy = 0; pipes = []; score = 0; started = false; dead = false; t = 0;
        api.setScore(0);
      }
      function flap() {
        if (dead) return;
        started = true;
        vy = -300;
        api.beep(500, 0.06, "sine", 0.05, 700);
      }
      api.onDown(flap);
      api.onKey((k) => { if (k === " " || k === "ArrowUp" || k === "w") flap(); });
      reset();
      api.loop((dt) => {
        t += dt;
        if (started && !dead) {
          vy += 900 * dt;
          y += vy * dt;
          if (t > 1.35) {
            t = 0;
            const gapY = api.rand(120, 440);
            pipes.push({ x: 430, gap: gapY, passed: false });
          }
          for (const p of pipes) {
            p.x -= 170 * dt;
            if (!p.passed && p.x < 60) { p.passed = true; score++; api.setScore(score); api.beep(760, 0.05, "sine", 0.05); }
          }
          pipes = pipes.filter((p) => p.x > -70);
          if (y > 580 || y < 0) { dead = true; api.over("摔下来了", "穿过 " + score + " 根管道"); }
          for (const p of pipes) {
            if (60 + 14 > p.x && 60 - 14 < p.x + 56 && (y - 13 < p.gap - 70 || y + 13 > p.gap + 70)) {
              dead = true;
              api.over("撞到管道了", "穿过 " + score + " 根管道");
              break;
            }
          }
        }
        api.clear("#0a161c");
        // 管道
        for (const p of pipes) {
          ctx.fillStyle = "#4dabf7";
          ctx.fillRect(p.x, 0, 56, p.gap - 70);
          ctx.fillRect(p.x, p.gap + 70, 56, 600 - p.gap - 70);
          ctx.fillStyle = "rgba(255,255,255,.15)";
          ctx.fillRect(p.x, p.gap - 84, 56, 14);
          ctx.fillRect(p.x, p.gap + 70, 56, 14);
        }
        // 地面
        ctx.fillStyle = "#22303a";
        ctx.fillRect(0, 584, 420, 16);
        // 鸟
        ctx.save();
        ctx.translate(60, y);
        ctx.rotate(api.clamp(vy / 600, -0.5, 0.9));
        ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fillStyle = "#ffd43b"; ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(6, -4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#111";
        ctx.beginPath(); ctx.arc(7, -4, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ff922b";
        ctx.beginPath(); ctx.moveTo(12, 2); ctx.lineTo(22, 5); ctx.lineTo(12, 9); ctx.fill();
        ctx.restore();
        if (!started) api.text("点击开始", 210, 300, { size: 17, weight: 700, color: "#8fb8c9" });
      });
    }
  });

  /* ================= 乒乓对决 ================= */
  GB.add({
    id: "pong", name: "乒乓对决", cat: "arcade", icon: "🏓",
    desc: "和人机来一场乒乓赛", tip: "上下方向键 / 手指拖动控制球拍",
    w: 560, h: 420, colors: ["#1a2a3a", "#0a121a"],
    init(api) {
      const ctx = api.ctx;
      let py, ay, ball, ps, as, serveT;
      function reset(full) {
        py = 185; ay = 185;
        ball = { x: 280, y: 210, vx: 0, vy: 0 };
        serveT = 0.8;
        if (full) { ps = 0; as = 0; api.setScore(0); }
      }
      api.onMove((p) => { py = api.clamp(p.y - 40, 0, 420 - 80); });
      api.onKey((k) => {
        if (k === "ArrowUp" || k === "w") py = Math.max(0, py - 40);
        if (k === "ArrowDown" || k === "s") py = Math.min(340, py + 40);
      });
      reset(true);
      api.loop((dt) => {
        if (serveT > 0) serveT -= dt;
        else {
          ball.x += ball.vx * dt; ball.y += ball.vy * dt;
          if (ball.y < 8 || ball.y > 412) { ball.vy *= -1; api.beep(320, 0.03, "sine", 0.03); }
          // AI
          const target = ball.vx > 0 ? ball.y - 40 : 170;
          ay += api.clamp(target - ay, -220 * dt, 220 * dt);
          ay = api.clamp(ay, 0, 340);
          if (ball.x < 30 && ball.vx < 0 && ball.y > py && ball.y < py + 80) {
            ball.vx = Math.abs(ball.vx) * 1.05;
            ball.vy = ((ball.y - (py + 40)) / 40) * 200;
            api.beep(480, 0.04, "sine", 0.045);
          }
          if (ball.x > 530 && ball.vx > 0 && ball.y > ay && ball.y < ay + 80) {
            ball.vx = -Math.abs(ball.vx) * 1.05;
            ball.vy = ((ball.y - (ay + 40)) / 40) * 200;
            api.beep(380, 0.04, "sine", 0.045);
          }
          if (ball.x < -10) {
            as++; api.beep(160, 0.15, "square", 0.05);
            if (as >= 5) { api.over("输掉了比赛", as + " : " + ps); }
            reset(false);
          }
          if (ball.x > 570) {
            ps++; api.setScore(ps * 100);
            api.beep(700, 0.1, "sine", 0.05);
            if (ps >= 5) { api.over("你赢了！", ps + " : " + as, true); }
            reset(false);
          }
        }
        api.clear("#0a121a");
        ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 2;
        ctx.setLineDash([8, 10]);
        ctx.beginPath(); ctx.moveTo(280, 0); ctx.lineTo(280, 420); ctx.stroke();
        ctx.setLineDash([]);
        api.text(ps + "", 240, 40, { size: 30, weight: 800, color: "rgba(255,255,255,.25)" });
        api.text(as + "", 320, 40, { size: 30, weight: 800, color: "rgba(255,255,255,.25)" });
        api.rr(18, py, 10, 80, 5); ctx.fillStyle = "#4fd1c5"; ctx.fill();
        api.rr(532, ay, 10, 80, 5); ctx.fillStyle = "#ff8787"; ctx.fill();
        ctx.beginPath(); ctx.arc(ball.x, ball.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#fff"; ctx.fill();
        api.text("5 球定胜负", 280, 400, { size: 11, color: "#3f5a6a" });
      });
    }
  });

  /* ================= 太空侵略者 ================= */
  GB.add({
    id: "invaders", name: "太空侵略者", cat: "arcade", icon: "👾",
    desc: "击退成群的外星人", tip: "← → 移动 · 空格 / 点击 射击",
    w: 480, h: 600, colors: ["#1a1a3a", "#0a0a18"],
    init(api) {
      const ctx = api.ctx;
      let aliens, bullets, bombs, ship, dirT, t, score, over, wave, shootCD;
      function build() {
        aliens = [];
        for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) {
          aliens.push({ x: 60 + c * 48, y: 90 + r * 44, alive: true });
        }
      }
      function reset() {
        build();
        bullets = []; bombs = [];
        ship = 210; dirT = 1; t = 0; score = 0; over = false; wave = 1; shootCD = 0;
        api.setScore(0);
      }
      function shoot() {
        if (over || shootCD > 0) return;
        bullets.push({ x: ship + 18, y: 520 });
        shootCD = 0.3;
        api.beep(800, 0.05, "square", 0.035, 400);
      }
      api.onDown((p) => { if (p.y > 100) ship = api.clamp(p.x - 18, 0, 444); shoot(); });
      api.onKey((k, e) => {
        if (k === "ArrowLeft" || k === "a") ship = Math.max(0, ship - 34);
        if (k === "ArrowRight" || k === "d") ship = Math.min(444, ship + 34);
        if (k === " ") shoot();
      });
      reset();
      api.loop((dt) => {
        if (!over) {
          t += dt; shootCD -= dt;
          const alive = aliens.filter((a) => a.alive);
          const speed = 26 + wave * 8 + (32 - alive.length) * 2;
          let flip = false;
          for (const a of alive) {
            a.x += dirT * speed * dt;
            if (a.x < 16 || a.x > 448) flip = true;
          }
          if (flip) { dirT *= -1; for (const a of alive) a.y += 16; }
          if (Math.random() < dt * (1.4 + wave * 0.3) && alive.length) {
            const a = api.pick(alive);
            bombs.push({ x: a.x + 16, y: a.y + 30 });
          }
          bullets.forEach((b) => { b.y -= 460 * dt; });
          bombs.forEach((b) => { b.y += 210 * dt; });
          bullets = bullets.filter((b) => b.y > 40);
          bombs = bombs.filter((b) => b.y < 620);
          for (const b of bullets) {
            for (const a of aliens) {
              if (a.alive && Math.abs(a.x + 16 - b.x) < 20 && Math.abs(a.y + 14 - b.y) < 18) {
                a.alive = false;
                b.y = -10;
                score += 20;
                api.setScore(score);
                api.beep(600, 0.06, "square", 0.045, 300);
                break;
              }
            }
          }
          for (const b of bombs) {
            if (Math.abs(b.x - ship - 18) < 22 && b.y > 520 && b.y < 550) {
              over = true;
              api.over("飞船被击中", "得分 " + score);
            }
          }
          if (alive.some((a) => a.y > 500)) { over = true; api.over("敌人入侵成功", "得分 " + score); }
          if (!alive.length) {
            wave++;
            api.beep(880, 0.12, "sine", 0.06);
            build();
          }
        }
        api.clear("#0a0a18");
        api.text("得分 " + score + " · 第 " + wave + " 波", 24, 40, { size: 13, weight: 700, color: "#a8a8f2", align: "left" });
        for (const a of aliens) {
          if (!a.alive) continue;
          api.text("👾", a.x + 16, a.y + 14, { size: 26 });
        }
        ctx.fillStyle = "#ff6b6b";
        for (const b of bombs) ctx.fillRect(b.x - 2, b.y, 4, 10);
        ctx.fillStyle = "#4fd1c5";
        for (const b of bullets) ctx.fillRect(b.x - 2, b.y, 4, 12);
        ctx.fillStyle = "#e8eef8";
        api.rr(ship, 524, 36, 14, 4); ctx.fill();
        api.rr(ship + 14, 514, 8, 10, 3); ctx.fill();
      });
    }
  });

  /* ================= 纵版打飞机 ================= */
  GB.add({
    id: "shooter", name: "雷电战机", cat: "arcade", icon: "✈️",
    desc: "纵版射击，躲弹幕打敌机", tip: "拖动移动战机 · 自动开火",
    w: 420, h: 600, colors: ["#0e1a33", "#060b16"],
    init(api) {
      const ctx = api.ctx;
      let x, y, bullets, enemies, ebullets, score, t, dead, stars, hp;
      function reset() {
        x = 210; y = 520; bullets = []; enemies = []; ebullets = [];
        score = 0; t = 0; dead = false; hp = 3;
        stars = Array.from({ length: 40 }, () => ({ x: api.rand(0, 420), y: api.rand(0, 600), s: api.rand(20, 90) }));
        api.setScore(0);
      }
      api.onMove((p) => { x = api.clamp(p.x, 20, 400); y = api.clamp(p.y, 80, 580); });
      api.onDown((p) => { x = api.clamp(p.x, 20, 400); y = api.clamp(p.y, 80, 580); });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t += dt;
          for (const s of stars) { s.y += s.s * dt; if (s.y > 600) { s.y = -4; s.x = api.rand(0, 420); } }
          if (t > 0.16) {
            t = 0;
            bullets.push({ x: x, y: y - 18 });
            bullets.push({ x: x - 12, y: y - 6 });
            bullets.push({ x: x + 12, y: y - 6 });
            api.beep(900, 0.02, "square", 0.012);
          }
          if (Math.random() < dt * 1.6) {
            enemies.push({ x: api.rand(30, 390), y: -20, vx: api.rand(-40, 40), hp: 2, t: 0 });
          }
          bullets.forEach((b) => { b.y -= 520 * dt; });
          bullets = bullets.filter((b) => b.y > -10);
          for (const e of enemies) {
            e.y += 130 * dt; e.x += e.vx * dt; e.t += dt;
            if (e.t > 0.9) { e.t = 0; ebullets.push({ x: e.x, y: e.y + 14 }); }
          }
          enemies = enemies.filter((e) => e.y < 640);
          ebullets.forEach((b) => { b.y += 240 * dt; });
          ebullets = ebullets.filter((b) => b.y < 640 && b.x > -10 && b.x < 430);
          for (const b of bullets) {
            for (const e of enemies) {
              if (e.hp > 0 && Math.abs(e.x - b.x) < 20 && Math.abs(e.y - b.y) < 18) {
                e.hp--; b.y = -20;
                if (e.hp <= 0) { score += 25; api.setScore(score); api.beep(520, 0.05, "square", 0.04, 240); }
                break;
              }
            }
          }
          for (const b of ebullets) {
            if (Math.abs(b.x - x) < 16 && Math.abs(b.y - y) < 16) {
              b.y = 700; hp--;
              api.beep(150, 0.2, "square", 0.06, 60);
              if (hp <= 0) { dead = true; api.over("战机坠毁", "得分 " + score); }
            }
          }
          for (const e of enemies) {
            if (e.hp > 0 && Math.abs(e.x - x) < 24 && Math.abs(e.y - y) < 24) {
              e.hp = 0; hp--;
              api.beep(150, 0.2, "square", 0.06, 60);
              if (hp <= 0) { dead = true; api.over("战机坠毁", "得分 " + score); }
            }
          }
        }
        api.clear("#060b16");
        ctx.fillStyle = "rgba(255,255,255,.5)";
        for (const s of stars) ctx.fillRect(s.x, s.y, 2, 2);
        api.text("❤".repeat(Math.max(0, hp)), 24, 36, { size: 15, color: "#ff6b6b", align: "left" });
        ctx.fillStyle = "#ffd75e";
        for (const b of bullets) ctx.fillRect(b.x - 1.5, b.y - 8, 3, 12);
        ctx.fillStyle = "#ff8787";
        for (const b of ebullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 4.5, 0, Math.PI * 2); ctx.fill(); }
        for (const e of enemies) {
          if (e.hp <= 0) continue;
          api.text("🛸", e.x, e.y, { size: 28 });
        }
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = "#4fd1c5";
        ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(14, 14); ctx.lineTo(0, 7); ctx.lineTo(-14, 14); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#ffd75e";
        ctx.beginPath(); ctx.arc(0, -2, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
    }
  });

  /* ================= 躲避陨石 ================= */
  GB.add({
    id: "dodger", name: "陨石闪避", cat: "arcade", icon: "☄️",
    desc: "在陨石雨中活下去", tip: "← → 或拖动移动 · 存活时间越长分越高",
    w: 420, h: 600, colors: ["#2a1a10", "#100806"],
    init(api) {
      const ctx = api.ctx;
      let x, rocks, t, score, dead, speed;
      function reset() {
        x = 210; rocks = []; t = 0; score = 0; dead = false; speed = 180;
        api.setScore(0);
      }
      api.onMove((p) => { x = api.clamp(p.x, 20, 400); });
      api.onKey((k) => {
        if (k === "ArrowLeft" || k === "a") x = Math.max(20, x - 34);
        if (k === "ArrowRight" || k === "d") x = Math.min(400, x + 34);
      });
      api.onDown((p) => { x = api.clamp(p.x, 20, 400); });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t += dt;
          speed = 180 + t * 12;
          score = Math.floor(t * 10);
          api.setScore(score);
          if (Math.random() < dt * (1.8 + t * 0.06)) {
            rocks.push({ x: api.rand(14, 406), y: -16, r: api.rand(9, 20), vx: api.rand(-30, 30), sp: api.rand(0.7, 1.3) });
          }
          for (const r of rocks) { r.y += speed * r.sp * dt; r.x += r.vx * dt; }
          rocks = rocks.filter((r) => r.y < 640);
          for (const r of rocks) {
            if (Math.hypot(r.x - x, r.y - 540) < r.r + 13) {
              dead = true;
              api.beep(120, 0.3, "square", 0.07, 40);
              api.over("被陨石击中", "存活 " + t.toFixed(1) + " 秒");
              break;
            }
          }
        }
        api.clear("#100806");
        ctx.fillStyle = "rgba(255,255,255,.4)";
        for (let i = 0; i < 30; i++) ctx.fillRect((i * 97 + t * 30) % 420, (i * 61 + t * 60) % 600, 1.5, 1.5);
        for (const r of rocks) {
          ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
          ctx.fillStyle = "#8a6a4a";
          ctx.fill();
          ctx.fillStyle = "rgba(0,0,0,.3)";
          ctx.beginPath(); ctx.arc(r.x - r.r * 0.3, r.y - r.r * 0.2, r.r * 0.3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = "#4fd1c5";
        ctx.beginPath();
        ctx.moveTo(x, 524); ctx.lineTo(x + 13, 552); ctx.lineTo(x, 545); ctx.lineTo(x - 13, 552); ctx.closePath();
        ctx.fill();
        api.text(t.toFixed(1) + "s", 210, 36, { size: 15, weight: 800, color: "#e8c9a8" });
      });
    }
  });

  /* ================= 极速跑酷 ================= */
  GB.add({
    id: "runner", name: "极速跑酷", cat: "arcade", icon: "🏃",
    desc: "跳跃躲避障碍，越跑越快", tip: "空格 / 点击 跳跃 · 长按跳更高",
    w: 560, h: 360, colors: ["#2a1a3a", "#120a1a"],
    init(api) {
      const ctx = api.ctx, GY = 300;
      let y, vy, obstacles, t, score, dead, speed, holding;
      function reset() {
        y = GY; vy = 0; obstacles = []; t = 0; score = 0; dead = false; speed = 280; holding = false;
        api.setScore(0);
      }
      function jump() {
        if (dead) return;
        if (y >= GY - 1) { vy = -520; api.beep(420, 0.07, "sine", 0.045, 700); }
      }
      api.onDown(() => { jump(); holding = true; });
      api.onUp(() => { holding = false; });
      api.onKey((k) => { if (k === " " || k === "ArrowUp" || k === "w") jump(); });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t += dt;
          speed = 280 + t * 14;
          vy += 1500 * dt;
          y += vy * dt;
          if (y > GY) { y = GY; vy = 0; }
          if (t > api.rand(0.9, 1.7)) {
            t = 0;
            obstacles.push({ x: 570, w: api.pick([22, 22, 34]), h: api.pick([34, 50, 34]) });
          }
          for (const o of obstacles) o.x -= speed * dt;
          obstacles = obstacles.filter((o) => o.x > -50);
          score = Math.floor(api.score + speed * dt * 0.1);
          api.setScore(score);
          for (const o of obstacles) {
            if (o.x < 70 + 16 && o.x + o.w > 70 - 16 && y > GY - o.h + 4) {
              dead = true;
              api.beep(120, 0.3, "square", 0.07, 40);
              api.over("撞上了", "跑了 " + score + " 米");
            }
          }
        }
        api.clear("#120a1a");
        ctx.strokeStyle = "rgba(200,168,232,.5)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, GY + 2); ctx.lineTo(560, GY + 2); ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.06)";
        for (let i = 0; i < 8; i++) {
          const lx = (i * 90 - (api.t * speed * 0.4) % 720 + 720) % 720 - 80;
          ctx.fillRect(lx, GY + 10, 34, 3);
        }
        for (const o of obstacles) {
          api.rr(o.x, GY - o.h, o.w, o.h, 5);
          ctx.fillStyle = "#ff8787"; ctx.fill();
        }
        // 小人
        ctx.save();
        ctx.translate(70, y - 4);
        const leg = y >= GY - 1 ? Math.sin(api.t * 18) * 6 : 4;
        ctx.fillStyle = "#4fd1c5";
        ctx.beginPath(); ctx.arc(0, -30, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(-6, -22, 12, 18);
        ctx.fillStyle = "#2aa79c";
        ctx.fillRect(-7, -4, 5, leg + 4);
        ctx.fillRect(2, -4, 5, Math.max(2, 8 - leg) + 4);
        ctx.restore();
        api.text(score + " m", 520, 36, { size: 15, weight: 800, color: "#c8a8e8", align: "right" });
      });
    }
  });

  /* ================= 洞穴飞行 ================= */
  GB.add({
    id: "cave", name: "洞穴飞行", cat: "arcade", icon: "🚁",
    desc: "在收缩的洞穴中飞行", tip: "按住上升 · 松开下降",
    w: 560, h: 380, colors: ["#123324", "#060f0a"],
    init(api) {
      const ctx = api.ctx;
      let y, vy, t, score, dead, walls;
      function reset() {
        y = 190; vy = 0; t = 0; score = 0; dead = false;
        walls = [{ top: 60, bot: 320 }];
        api.setScore(0);
      }
      let holding = false;
      api.onDown(() => { holding = true; });
      api.onUp(() => { holding = false; });
      api.onKey((k) => { if (k === " ") holding = true; });
      api.onKeyUp((k) => { if (k === " ") holding = false; });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t += dt;
          vy += (holding ? -760 : 700) * dt;
          y = api.clamp(y + vy * dt, 6, 374);
          const last = walls[walls.length - 1];
          if (t > 0.028) {
            t = 0;
            const gap = Math.max(96, 210 - api.t * 6);
            let top = api.clamp(last.top + api.rand(-34, 34), 10, 380 - gap - 10);
            walls.push({ top, bot: top + gap });
            score++;
            api.setScore(Math.floor(score * 1.2));
          }
          if (walls.length > 200) walls.shift();
          const wi = Math.floor(90 / 24);
          const w = walls[walls.length - 1 - Math.max(0, walls.length - 1 - wi)];
          for (let i = 0; i < walls.length; i++) {
            const wx = i * 24 - ((api.t * 150) % 24) + 90 - 24;
          }
          const idx = Math.min(walls.length - 1, Math.floor((90 - 90 + 24) / 24));
          // 碰撞：以 x=90 处的墙判定
          const wHere = walls[Math.min(walls.length - 1, 3 + Math.floor((api.t * 150) / 24))];
          if (y - 9 < wHere.top || y + 9 > wHere.bot) {
            dead = true;
            api.beep(120, 0.3, "square", 0.07, 40);
            api.over("撞上洞壁", "飞行距离 " + score);
          }
        }
        api.clear("#060f0a");
        const shift = (api.t * 150) % 24;
        for (let i = 0; i < Math.ceil(560 / 24) + 2; i++) {
          const w = walls[Math.min(walls.length - 1, i + 3)];
          if (!w) continue;
          const wx = i * 24 - shift + 66;
          ctx.fillStyle = "#1d4a33";
          ctx.fillRect(wx, 0, 24, w.top);
          ctx.fillRect(wx, w.bot, 24, 380 - w.bot);
          ctx.fillStyle = "rgba(255,255,255,.08)";
          ctx.fillRect(wx, w.top - 4, 24, 4);
          ctx.fillRect(wx, w.bot, 24, 4);
        }
        ctx.fillStyle = "#ffd75e";
        ctx.beginPath(); ctx.arc(90, y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,215,94,.4)";
        ctx.beginPath(); ctx.arc(78, y, 5, 0, Math.PI * 2); ctx.fill();
        api.text(score + "", 520, 34, { size: 17, weight: 800, color: "#8fe3a8", align: "right" });
      });
    }
  });

  /* ================= 青蛙过河 ================= */
  GB.add({
    id: "frogger", name: "青蛙过河", cat: "arcade", icon: "🐸",
    desc: "跳过马路与河流到达对岸", tip: "方向键移动 · 小心车流，河上要踩浮木",
    w: 480, h: 560, colors: ["#1a3324", "#0a140d"],
    init(api) {
      const ctx = api.ctx, S = 40;
      let fx, fy, cars, logs, score, dead, t, onLog;
      const LANES = 10;
      function reset() {
        fx = 4; fy = LANES; cars = []; logs = []; score = 0; dead = false; t = 0; onLog = 0;
        for (let i = 0; i < 5; i++) {
          cars.push({ y: 9 - i, x: api.rand(0, 480), v: api.rand(90, 170) * (i % 2 ? 1 : -1), w: 56 });
          logs.push({ y: 4 - i, x: api.rand(0, 480), v: api.rand(50, 90) * (i % 2 ? -1 : 1), w: 92 });
        }
        api.setScore(0);
      }
      function move(dx, dy) {
        if (dead) return;
        const nx = api.clamp(fx + dx, 0, 11), ny = api.clamp(fy + dy, 0, LANES);
        if (nx === fx && ny === fy) return;
        fx = nx; fy = ny;
        api.beep(500, 0.05, "sine", 0.04, 640);
        if (fy === 0) {
          score += 200;
          api.setScore(score);
          api.beep(880, 0.15, "sine", 0.06);
          fx = 4; fy = LANES;
        }
      }
      api.onKey((k) => {
        if (k === "ArrowUp" || k === "w") move(0, -1);
        if (k === "ArrowDown" || k === "s") move(0, 1);
        if (k === "ArrowLeft" || k === "a") move(-1, 0);
        if (k === "ArrowRight" || k === "d") move(1, 0);
      });
      api.dpad((d) => {
        move({ U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] }[d][0], { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] }[d][1]);
      });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t += dt;
          for (const c of cars) { c.x += c.v * dt; if (c.x > 500) c.x = -70; if (c.x < -70) c.x = 500; }
          for (const l of logs) { l.x += l.v * dt; if (l.x > 500) l.x = -100; if (l.x < -100) l.x = 500; }
          const px = fx * S + 4, py = fy * S + 4;
          if (fy >= 5 && fy <= 9) {
            for (const c of cars) {
              if (c.y === fy && px + 30 > c.x && px < c.x + c.w) {
                dead = true; api.over("被车撞了", "得分 " + score);
              }
            }
          }
          if (fy >= 1 && fy <= 4) {
            const log = logs.find((l) => l.y === fy && px + 20 > l.x && px + 16 < l.x + l.w + 16);
            if (!log) { dead = true; api.over("掉进河里了", "得分 " + score); }
            else {
              fx += log.v * dt / S;
              if (fx < -0.5 || fx > 11.5) { dead = true; api.over("被冲走了", "得分 " + score); }
            }
          }
        }
        api.clear("#0a140d");
        // 河
        ctx.fillStyle = "#123048";
        ctx.fillRect(0, S, 480, S * 4);
        // 路
        ctx.fillStyle = "#1c1f26";
        ctx.fillRect(0, S * 5, 480, S * 5);
        for (const l of logs) {
          api.rr(l.x, l.y * S + 8, l.w, 24, 8);
          ctx.fillStyle = "#8a5a2c"; ctx.fill();
        }
        for (const c of cars) {
          api.rr(c.x, c.y * S + 6, c.w, 28, 7);
          ctx.fillStyle = c.v > 0 ? "#ff6b6b" : "#e599f7"; ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.3)";
          ctx.fillRect(c.x + (c.v > 0 ? c.w - 12 : 4), c.y * S + 12, 8, 8);
        }
        api.rr(0, 0, 480, S, 0);
        ctx.fillStyle = "#1d4a2c"; ctx.fillRect(0, 0, 480, S);
        api.text("🏁", 6.5 * S, S / 2, { size: 24 });
        api.text("🐸", (fx + 0.5) * S, (fy + 0.5) * S, { size: 26 });
      });
    }
  });

  /* ================= 小行星 ================= */
  GB.add({
    id: "asteroids", name: "小行星", cat: "arcade", icon: "🪐",
    desc: "驾驶飞船击碎漂浮陨石", tip: "← → 转向 · ↑ 推进 · 空格射击",
    w: 520, h: 520, colors: ["#1a1a2a", "#0a0a14"],
    init(api) {
      const ctx = api.ctx;
      let ship, rocks, bullets, score, t, cd, dead;
      function reset() {
        ship = { x: 260, y: 260, a: -Math.PI / 2, vx: 0, vy: 0 };
        rocks = []; bullets = []; score = 0; t = 0; cd = 0; dead = false;
        for (let i = 0; i < 5; i++) {
          const ang = api.rand(0, Math.PI * 2);
          const d = api.rand(140, 240);
          rocks.push({ x: 260 + Math.cos(ang) * d, y: 260 + Math.sin(ang) * d, vx: api.rand(-40, 40), vy: api.rand(-40, 40), r: 26 });
        }
        api.setScore(0);
      }
      api.onKey((k) => {
        if (k === " ") {
          if (cd <= 0) {
            bullets.push({ x: ship.x + Math.cos(ship.a) * 14, y: ship.y + Math.sin(ship.a) * 14, vx: Math.cos(ship.a) * 420 + ship.vx, vy: Math.sin(ship.a) * 420 + ship.vy });
            cd = 0.22;
            api.beep(700, 0.05, "square", 0.035, 300);
          }
        }
      });
      api.onDown(() => {
        if (cd <= 0) {
          bullets.push({ x: ship.x, y: ship.y, vx: Math.cos(ship.a) * 420, vy: Math.sin(ship.a) * 420 });
          cd = 0.22;
          api.beep(700, 0.05, "square", 0.035, 300);
        }
      });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t += dt; cd -= dt;
          if (api.keys.ArrowLeft || api.keys.a) ship.a -= 3.4 * dt;
          if (api.keys.ArrowRight || api.keys.d) ship.a += 3.4 * dt;
          if (api.keys.ArrowUp || api.keys.w) {
            ship.vx += Math.cos(ship.a) * 260 * dt;
            ship.vy += Math.sin(ship.a) * 260 * dt;
          }
          ship.x += ship.vx * dt; ship.y += ship.vy * dt;
          ship.vx *= 0.995; ship.vy *= 0.995;
          if (ship.x < 0) ship.x += 520; if (ship.x > 520) ship.x -= 520;
          if (ship.y < 0) ship.y += 520; if (ship.y > 520) ship.y -= 520;
          for (const r of rocks) {
            r.x += r.vx * dt; r.y += r.vy * dt;
            if (r.x < -30) r.x += 580; if (r.x > 550) r.x -= 580;
            if (r.y < -30) r.y += 580; if (r.y > 550) r.y -= 580;
          }
          bullets.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt; });
          bullets = bullets.filter((b) => b.x > -20 && b.x < 540 && b.y > -20 && b.y < 540);
          for (const b of bullets) {
            for (let i = rocks.length - 1; i >= 0; i--) {
              const r = rocks[i];
              if (Math.hypot(r.x - b.x, r.y - b.y) < r.r) {
                bullets.splice(bullets.indexOf(b), 1);
                rocks.splice(i, 1);
                score += r.r > 20 ? 20 : r.r > 12 ? 50 : 100;
                api.setScore(score);
                api.beep(400, 0.07, "square", 0.045, 150);
                if (r.r > 14) {
                  for (let k = 0; k < 2; k++) {
                    rocks.push({ x: r.x, y: r.y, vx: api.rand(-70, 70), vy: api.rand(-70, 70), r: r.r * 0.55 });
                  }
                }
                break;
              }
            }
          }
          for (const r of rocks) {
            if (Math.hypot(r.x - ship.x, r.y - ship.y) < r.r + 10) {
              dead = true;
              api.beep(110, 0.35, "square", 0.07, 40);
              api.over("飞船损毁", "得分 " + score);
              break;
            }
          }
          if (!rocks.length) {
            for (let i = 0; i < 6; i++) {
              const ang = api.rand(0, Math.PI * 2), d = api.rand(150, 240);
              rocks.push({ x: ship.x + Math.cos(ang) * d, y: ship.y + Math.sin(ang) * d, vx: api.rand(-50, 50), vy: api.rand(-50, 50), r: 24 });
            }
          }
        }
        api.clear("#0a0a14");
        ctx.strokeStyle = "#c9cede"; ctx.lineWidth = 1.6;
        for (const r of rocks) {
          ctx.beginPath();
          for (let i = 0; i <= 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const rr = r.r * (0.82 + 0.18 * Math.sin(i * 2.7 + r.x));
            const px = r.x + Math.cos(a) * rr, py = r.y + Math.sin(a) * rr;
            i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          }
          ctx.closePath(); ctx.stroke();
        }
        ctx.strokeStyle = "#4fd1c5"; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ship.x + Math.cos(ship.a) * 14, ship.y + Math.sin(ship.a) * 14);
        ctx.lineTo(ship.x + Math.cos(ship.a + 2.6) * 10, ship.y + Math.sin(ship.a + 2.6) * 10);
        ctx.lineTo(ship.x + Math.cos(ship.a - 2.6) * 10, ship.y + Math.sin(ship.a - 2.6) * 10);
        ctx.closePath(); ctx.stroke();
        ctx.fillStyle = "#ffd75e";
        for (const b of bullets) ctx.fillRect(b.x - 1.5, b.y - 1.5, 3, 3);
      });
    }
  });
})();
