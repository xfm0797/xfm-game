/* ==========================================================
   puzzle.js — 益智游戏 12 款
   ========================================================== */
(function () {
  "use strict";

  /* ================= 2048 ================= */
  GB.add({
    id: "g2048", name: "2048", cat: "puzzle", icon: "🔢",
    desc: "滑动合并数字，冲击 2048", tip: "方向键 / WASD 滑动 · 合并相同数字",
    w: 480, h: 560, colors: ["#5c4517", "#241a08"],
    init(api) {
      const ctx = api.ctx, S = 100, GAP = 10;
      let grid, score = 0;
      const C = { 2: "#eee4da", 4: "#ede0c8", 8: "#f2b179", 16: "#f59563", 32: "#f67c5f", 64: "#f65e3b", 128: "#edcf72", 256: "#edcc61", 512: "#edc850", 1024: "#edc53f", 2048: "#edc22e" };
      const OX = (480 - 4 * S - 3 * GAP) / 2, OY = 100;
      function add() {
        const e = [];
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (!grid[y][x]) e.push([x, y]);
        if (!e.length) return;
        const [x, y] = api.pick(e);
        grid[y][x] = Math.random() < 0.9 ? 2 : 4;
      }
      function reset() {
        grid = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
        score = 0; api.setScore(0); add(); add();
      }
      function move(dir) {
        const old = JSON.stringify(grid);
        for (let i = 0; i < 4; i++) {
          let col = [];
          for (let j = 0; j < 4; j++) {
            col.push(dir === "L" ? grid[i][j] : dir === "R" ? grid[i][3 - j] : dir === "U" ? grid[j][i] : grid[3 - j][i]);
          }
          const v = col.filter((n) => n);
          for (let k = 0; k < v.length - 1; k++) {
            if (v[k] === v[k + 1]) { v[k] *= 2; score += v[k]; v.splice(k + 1, 1); }
          }
          while (v.length < 4) v.push(0);
          for (let j = 0; j < 4; j++) {
            const n = v[j];
            if (dir === "L") grid[i][j] = n;
            else if (dir === "R") grid[i][3 - j] = n;
            else if (dir === "U") grid[j][i] = n;
            else grid[3 - j][i] = n;
          }
        }
        if (JSON.stringify(grid) === old) return;
        api.beep(320, 0.05, "sine", 0.04, 420);
        add();
        api.setScore(score);
        let full = true, can = false;
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
          if (!grid[y][x]) full = false;
          if (x < 3 && grid[y][x] === grid[y][x + 1]) can = true;
          if (y < 3 && grid[y][x] === grid[y + 1][x]) can = true;
        }
        if (full && !can) api.over("棋盘满了", "没有可合并的数字了");
      }
      api.onKey((k) => {
        const m = { ArrowLeft: "L", a: "L", ArrowRight: "R", d: "R", ArrowUp: "U", w: "U", ArrowDown: "D", s: "D" };
        if (m[k]) move(m[k]);
      });
      let swipe = null;
      api.onDown((p) => { swipe = p; });
      api.onUp((p) => {
        if (!swipe) return;
        const dx = p.x - swipe.x, dy = p.y - swipe.y;
        swipe = null;
        if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
        move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : (dy > 0 ? "D" : "U"));
      });
      reset();
      api.loop(() => {
        api.clear("#241a08");
        api.text("2048", 20, 42, { size: 26, weight: 800, color: "#f7d774", align: "left" });
        api.text("合并相同数字", 20, 68, { size: 11, color: "#9b8a5e", align: "left" });
        api.rr(OX - GAP, OY - GAP, 4 * S + 5 * GAP, 4 * S + 5 * GAP, 14);
        ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fill();
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
          const n = grid[y][x];
          const px = OX + x * (S + GAP), py = OY + y * (S + GAP);
          api.rr(px, py, S, S, 10);
          ctx.fillStyle = n ? C[n] || "#3c3a32" : "rgba(255,255,255,.05)";
          ctx.fill();
          if (n) api.text(n, px + S / 2, py + S / 2 + 1, {
            size: n > 512 ? 30 : n > 64 ? 36 : 42, weight: 800,
            color: n <= 4 ? "#776e65" : "#f9f6f2"
          });
        }
      });
    }
  });

  /* ================= 数字华容道 ================= */
  function slideGame(id, name, icon, N, S, bestBonus) {
    GB.add({
      id, name, cat: "puzzle", icon,
      desc: "把数字块滑回正确顺序", tip: "点击与空位相邻的数字块滑动",
      w: 480, h: 560, colors: ["#1c3a52", "#0a1a26"],
      init(api) {
        const ctx = api.ctx, GAP = 8;
        const OX = (480 - N * S - (N - 1) * GAP) / 2, OY = 110;
        let b, moves;
        const solved = () => b.every((v, i) => v === (i + 1) % (N * N));
        function reset() {
          do {
            b = Array.from({ length: N * N }, (_, i) => (i + 1) % (N * N));
            for (let i = 0; i < N * N * 60; i++) {
              const z = b.indexOf(0), zy = Math.floor(z / N), zx = z % N;
              const nb = [];
              if (zx > 0) nb.push(z - 1); if (zx < N - 1) nb.push(z + 1);
              if (zy > 0) nb.push(z - N); if (zy < N - 1) nb.push(z + N);
              const t = api.pick(nb); b[z] = b[t]; b[t] = 0;
            }
          } while (solved());
          moves = 0;
        }
        api.onDown((p) => {
          const cx = Math.floor((p.x - OX) / (S + GAP)), cy = Math.floor((p.y - OY) / (S + GAP));
          if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
          const z = b.indexOf(0), zy = Math.floor(z / N), zx = z % N;
          if (Math.abs(cx - zx) + Math.abs(cy - zy) !== 1) return;
          b[zy * N + zx] = b[cy * N + cx]; b[cy * N + cx] = 0;
          moves++;
          api.beep(400, 0.04, "sine", 0.04, 500);
          if (solved()) {
            api.setScore(bestBonus - moves * 3);
            api.over("复原成功！", moves + " 步", true);
          }
        });
        reset();
        api.loop(() => {
          api.clear("#0a1a26");
          api.text("步数 " + moves, 24, 44, { size: 15, weight: 700, color: "#9fc4dd", align: "left" });
          for (let i = 0; i < N * N; i++) {
            const x = i % N, y = Math.floor(i / N);
            const px = OX + x * (S + GAP), py = OY + y * (S + GAP);
            const v = b[i];
            api.rr(px, py, S, S, 12);
            if (v) {
              const g = ctx.createLinearGradient(px, py, px, py + S);
              g.addColorStop(0, "#2f89b5"); g.addColorStop(1, "#1b5f80");
              ctx.fillStyle = g; ctx.fill();
              api.text(v, px + S / 2, py + S / 2 + 1, { size: N === 3 ? 36 : N === 4 ? 30 : 24, weight: 800, color: "#eaf6ff" });
            } else {
              ctx.fillStyle = "rgba(255,255,255,.04)"; ctx.fill();
            }
          }
        });
      }
    });
  }
  slideGame("slide15", "数字华容道", "🀫", 4, 92, 900);
  slideGame("slide8", "迷你滑块", "🔹", 3, 124, 500);

  /* ================= 扫雷 ================= */
  GB.add({
    id: "mines", name: "扫雷", cat: "puzzle", icon: "💣",
    desc: "找出所有地雷，小心爆炸", tip: "点击翻开 · 长按插旗",
    w: 480, h: 560, colors: ["#3a3f4a", "#14161c"],
    init(api) {
      const ctx = api.ctx, N = 10, M = 14, S = 38;
      const OX = (480 - N * S) / 2, OY = 96;
      let mine, open, flag, dead, first;
      const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];
      let flagTimer = null;
      function reset() {
        mine = new Set(); open = new Set(); flag = new Set();
        dead = false; first = true;
      }
      function plant(sx, sy) {
        while (mine.size < M) {
          const x = api.ri(0, N - 1), y = api.ri(0, N - 1);
          if (Math.abs(x - sx) <= 1 && Math.abs(y - sy) <= 1) continue;
          mine.add(y * N + x);
        }
      }
      function cnt(x, y) {
        let c = 0;
        for (let d = 0; d < 8; d++) if (mine.has((y + DY[d]) * N + x + DX[d])) c++;
        return c;
      }
      function reveal(x, y) {
        const i = y * N + x;
        if (open.has(i) || flag.has(i)) return;
        open.add(i);
        if (cnt(x, y) === 0) {
          for (let d = 0; d < 8; d++) {
            const nx = x + DX[d], ny = y + DY[d];
            if (nx >= 0 && ny >= 0 && nx < N && ny < N) reveal(nx, ny);
          }
        }
      }
      function cellOf(p) {
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx >= N || cy >= N) return null;
        return { x: cx, y: cy, i: cy * N + cx };
      }
      api.onDown((p) => {
        const c = cellOf(p);
        if (!c || dead) return;
        flagTimer = setTimeout(() => {
          if (!open.has(c.i)) { flag.has(c.i) ? flag.delete(c.i) : flag.add(c.i); api.beep(660, 0.05, "triangle", 0.04); }
          flagTimer = null;
        }, 380);
      });
      api.onUp(() => {
        if (!flagTimer) return;
        clearTimeout(flagTimer); flagTimer = null;
      });
      api.onDown((p) => {
        const c = cellOf(p);
        if (!c || dead) return;
        if (first) { plant(c.x, c.y); first = false; }
        if (mine.has(c.i)) {
          dead = true;
          api.over("轰！踩到地雷", "共翻开 " + open.size + " 格");
          return;
        }
        reveal(c.x, c.y);
        api.beep(500, 0.04, "sine", 0.035);
        if (open.size >= N * N - M) {
          api.setScore(1000);
          api.over("扫雷成功！", "全部安全区域已翻开", true);
        }
      });
      api.onKey((k) => { if (k === "r" || k === "R") reset(); });
      reset();
      const FC = ["", "#6ea8fe", "#51cf66", "#ff922b", "#e599f7", "#ff6b6b", "#66d9e8", "#f1f3f5", "#adb5bd"];
      api.loop(() => {
        api.clear("#12141b");
        api.text("剩余雷数 " + (M - flag.size), 24, 44, { size: 14, weight: 700, color: "#c3cad8", align: "left" });
        api.text("点击翻开 · 长按插旗", 24, 68, { size: 10.5, color: "#6c7382", align: "left" });
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const i = y * N + x;
          const px = OX + x * S, py = OY + y * S;
          api.rr(px + 1, py + 1, S - 2, S - 2, 5);
          ctx.fillStyle = open.has(i) ? "rgba(255,255,255,.05)" : "#2b303c";
          ctx.fill();
          if (open.has(i)) {
            const c = cnt(x, y);
            if (c) api.text(c, px + S / 2, py + S / 2 + 1, { size: 16, weight: 800, color: FC[c] });
          } else if (flag.has(i)) {
            api.text("⚑", px + S / 2, py + S / 2 + 1, { size: 17, color: "#ff8787" });
          } else if (dead && mine.has(i)) {
            api.text("●", px + S / 2, py + S / 2 + 1, { size: 13, color: "#ff6b6b" });
          }
        }
      });
    }
  });

  /* ================= 点灯游戏 ================= */
  GB.add({
    id: "lights", name: "点灯游戏", cat: "puzzle", icon: "💡",
    desc: "十字翻转，点亮全部灯", tip: "点击格子，它与上下左右一起翻转",
    w: 480, h: 540, colors: ["#4c3a12", "#1c1508"],
    init(api) {
      const ctx = api.ctx, N = 5, S = 72, GAP = 8;
      const OX = (480 - N * S - (N - 1) * GAP) / 2, OY = 120;
      let b, steps;
      function flip(x, y) {
        [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < N && ny < N) b[ny * N + nx] ^= 1;
        });
      }
      function reset() {
        do {
          b = new Array(N * N).fill(0);
          for (let i = 0; i < 10; i++) flip(api.ri(0, N - 1), api.ri(0, N - 1));
        } while (b.every((v) => v));
        steps = 0;
      }
      api.onDown((p) => {
        const cx = Math.floor((p.x - OX) / (S + GAP)), cy = Math.floor((p.y - OY) / (S + GAP));
        if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
        flip(cx, cy); steps++;
        api.beep(520, 0.06, "sine", 0.045, 700);
        if (b.every((v) => v)) {
          api.setScore(Math.max(50, 500 - steps * 10));
          api.over("全部点亮！", steps + " 步完成", true);
        }
      });
      reset();
      api.loop(() => {
        api.clear("#161006");
        api.text("步数 " + steps, 24, 40, { size: 15, weight: 700, color: "#e8c96a", align: "left" });
        api.text("让 25 盏灯全部亮起", 24, 64, { size: 10.5, color: "#8a7440", align: "left" });
        for (let i = 0; i < N * N; i++) {
          const x = i % N, y = Math.floor(i / N);
          const px = OX + x * (S + GAP), py = OY + y * (S + GAP);
          api.rr(px, py, S, S, 14);
          if (b[i]) {
            ctx.shadowColor = "#ffd75e"; ctx.shadowBlur = 22;
            ctx.fillStyle = "#ffd75e"; ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 1; ctx.stroke();
          }
        }
      });
    }
  });

  /* ================= 汉诺塔 ================= */
  GB.add({
    id: "hanoi", name: "汉诺塔", cat: "puzzle", icon: "🗼",
    desc: "把塔搬到最右侧柱子", tip: "点击柱子取放圆盘 · 大盘不能压小盘",
    w: 520, h: 480, colors: ["#3d2a52", "#150e20"],
    init(api) {
      const ctx = api.ctx;
      let towers, sel, moves;
      const BY = 320, PH = 200, DISKS = 5;
      function reset() {
        towers = [[], [], []];
        for (let i = DISKS; i >= 1; i--) towers[0].push(i);
        sel = -1; moves = 0;
      }
      api.onDown((p) => {
        let t = -1;
        for (let i = 0; i < 3; i++) if (Math.abs(p.x - (90 + i * 170)) < 82) t = i;
        if (t < 0) return;
        if (sel < 0) {
          if (towers[t].length) { sel = t; api.beep(440, 0.05, "sine", 0.04); }
        } else {
          const from = towers[sel], to = towers[t];
          const v = from[from.length - 1];
          if (to.length && to[to.length - 1] < v) { api.beep(150, 0.1, "square", 0.05); sel = -1; return; }
          to.push(from.pop());
          moves++; sel = -1;
          api.beep(560, 0.05, "sine", 0.045, 680);
          if (towers[2].length === DISKS) {
            api.setScore(Math.max(100, 800 - moves * 20));
            api.over("成功搬完！", moves + " 步（最少 " + (Math.pow(2, DISKS) - 1) + " 步）", true);
          }
        }
      });
      reset();
      const COL = ["#ff6b6b", "#ffa94d", "#ffd43b", "#69db7c", "#4dabf7"];
      api.loop(() => {
        api.clear("#0e0a18");
        api.text("步数 " + moves + " · 最少 " + (Math.pow(2, DISKS) - 1) + " 步", 24, 38, { size: 13.5, weight: 700, color: "#c9b8ef", align: "left" });
        for (let i = 0; i < 3; i++) {
          const x = 90 + i * 170;
          ctx.fillStyle = "#2a2140";
          ctx.fillRect(x - 4, BY - PH, 8, PH);
          api.rr(x - 82, BY + 14, 164, 14, 6);
          ctx.fillStyle = "#2a2140"; ctx.fill();
          api.text("A B C"[i * 2], x, BY + 44, { size: 13, color: "#6b5f8a" });
          towers[i].forEach((v, j) => {
            const w = 34 + v * 24, h = 26;
            const grab = sel === i && j === towers[i].length - 1;
            const y = grab ? BY - towers[i].length * (h + 4) - h - 24 : BY - j * (h + 4) - h;
            api.rr(x - w / 2, y, w, h, h / 2);
            ctx.fillStyle = COL[v - 1];
            if (grab) { ctx.shadowColor = COL[v - 1]; ctx.shadowBlur = 18; }
            ctx.fill();
            ctx.shadowBlur = 0;
          });
        }
      });
    }
  });

  /* ================= 迷宫寻路 ================= */
  GB.add({
    id: "maze", name: "迷宫寻路", cat: "puzzle", icon: "🌀",
    desc: "随机生成的迷宫，走到右下角", tip: "方向键 / WASD 移动，触屏点击相邻格",
    w: 480, h: 520, colors: ["#173a2e", "#081511"],
    init(api) {
      const ctx = api.ctx, N = 13, S = 30;
      const OX = (480 - N * S) / 2, OY = 90;
      let wallV, wallH, px, py, steps;
      function gen() {
        wallV = Array.from({ length: N + 1 }, () => Array(N).fill(true));
        wallH = Array.from({ length: N + 1 }, () => Array(N).fill(true));
        const vis = Array.from({ length: N }, () => Array(N).fill(false));
        const st = [[0, 0]]; vis[0][0] = true;
        while (st.length) {
          const [x, y] = st[st.length - 1];
          const nb = [];
          if (x > 0 && !vis[y][x - 1]) nb.push([x - 1, y, "V", x, y]);
          if (x < N - 1 && !vis[y][x + 1]) nb.push([x + 1, y, "V", x + 1, y]);
          if (y > 0 && !vis[y - 1][x]) nb.push([x, y - 1, "H", x, y]);
          if (y < N - 1 && !vis[y + 1][x]) nb.push([x, y + 1, "H", x, y + 1]);
          if (!nb.length) { st.pop(); continue; }
          const [nx, ny, t, wx, wy] = api.pick(nb);
          if (t === "V") wallV[wy][wx] = false; else wallH[wy][wx] = false;
          vis[ny][nx] = true; st.push([nx, ny]);
        }
      }
      function tryMove(dx, dy) {
        if (dy === -1 && wallH[py][px]) return;
        if (dy === 1 && wallH[py + 1][px]) return;
        if (dx === -1 && wallV[py][px]) return;
        if (dx === 1 && wallV[py][px + 1]) return;
        px += dx; py += dy; steps++;
        api.beep(360, 0.03, "sine", 0.025);
        if (px === N - 1 && py === N - 1) {
          api.setScore(Math.max(100, 2000 - steps * 8));
          api.over("走出迷宫！", steps + " 步", true);
        }
      }
      api.onKey((k) => {
        const m = { ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0], ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1] };
        if (m[k]) tryMove(m[k][0], m[k][1]);
      });
      api.onDown((p) => {
        const cx = Math.round((p.x - OX - S / 2) / S), cy = Math.round((p.y - OY - S / 2) / S);
        if (Math.abs(cx - px) + Math.abs(cy - py) === 1) tryMove(cx - px, cy - py);
      });
      gen(); px = 0; py = 0; steps = 0;
      api.loop(() => {
        api.clear("#081511");
        api.text("步数 " + steps, 24, 40, { size: 14, weight: 700, color: "#8fd6ae", align: "left" });
        api.text("走到右下角 ◎", 456, 40, { size: 12, color: "#4f7a63", align: "right" });
        ctx.strokeStyle = "#2e5c46"; ctx.lineWidth = 2; ctx.lineCap = "round";
        for (let y = 0; y <= N; y++) for (let x = 0; x < N; x++) {
          if (wallH[y][x]) { ctx.beginPath(); ctx.moveTo(OX + x * S, OY + y * S); ctx.lineTo(OX + (x + 1) * S, OY + y * S); ctx.stroke(); }
        }
        for (let y = 0; y < N; y++) for (let x = 0; x <= N; x++) {
          if (wallV[y][x]) { ctx.beginPath(); ctx.moveTo(OX + x * S, OY + y * S); ctx.lineTo(OX + x * S, OY + (y + 1) * S); ctx.stroke(); }
        }
        api.rr(OX + (N - 1) * S + 5, OY + (N - 1) * S + 5, S - 10, S - 10, 6);
        ctx.fillStyle = "rgba(255,179,71,.45)"; ctx.fill();
        ctx.beginPath(); ctx.arc(OX + (px + 0.5) * S, OY + (py + 0.5) * S, S * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = "#4fd1c5"; ctx.shadowColor = "#4fd1c5"; ctx.shadowBlur = 12; ctx.fill();
        ctx.shadowBlur = 0;
      });
    }
  });

  /* ================= 记忆翻牌 ================= */
  GB.add({
    id: "memory", name: "记忆翻牌", cat: "puzzle", icon: "🃏",
    desc: "翻出两两相同的图案", tip: "点击卡片翻开，配对成功会保持翻开",
    w: 520, h: 560, colors: ["#4a1f52", "#1a0a20"],
    init(api) {
      const ctx = api.ctx, N = 4;
      const S = 100, GAP = 12;
      const OX = (520 - N * S - (N - 1) * GAP) / 2, OY = 110;
      const ICONS = ["🍒", "🍋", "🍉", "⭐", "🔔", "🍀", "💎", "🚀"];
      let deck, open, found, lock, moves;
      function reset() {
        deck = api.shuffle(ICONS.concat(ICONS));
        open = []; found = new Set(); lock = false; moves = 0;
      }
      api.onDown((p) => {
        if (lock) return;
        const cx = Math.floor((p.x - OX) / (S + GAP)), cy = Math.floor((p.y - OY) / (S + GAP));
        if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
        const i = cy * N + cx;
        if (found.has(i) || open.indexOf(i) >= 0) return;
        open.push(i);
        api.beep(480, 0.05, "sine", 0.04, 600);
        if (open.length === 2) {
          moves++;
          const [a, b] = open;
          if (deck[a] === deck[b]) {
            found.add(a); found.add(b); open = [];
            api.beep(760, 0.09, "sine", 0.05);
            if (found.size === N * N) {
              api.setScore(Math.max(100, 1200 - moves * 25));
              api.over("全部配对！", moves + " 步完成", true);
            }
          } else {
            lock = true;
            setTimeout(() => { open = []; lock = false; }, 620);
          }
        }
      });
      reset();
      api.loop(() => {
        api.clear("#14081a");
        api.text("步数 " + moves, 24, 44, { size: 14, weight: 700, color: "#d8a8e8", align: "left" });
        api.text("配对 " + found.size / 2 + " / " + (N * N / 2), 456, 44, { size: 12, color: "#7a5590", align: "right" });
        for (let i = 0; i < N * N; i++) {
          const x = i % N, y = Math.floor(i / N);
          const px = OX + x * (S + GAP), py = OY + y * (S + GAP);
          const isOpen = open.indexOf(i) >= 0 || found.has(i);
          api.rr(px, py, S, S, 12);
          if (isOpen) {
            ctx.fillStyle = found.has(i) ? "rgba(255,215,94,.16)" : "#4d2a5c";
            ctx.fill();
            api.text(deck[i], px + S / 2, py + S / 2, { size: 38 });
          } else {
            const g = ctx.createLinearGradient(px, py, px + S, py + S);
            g.addColorStop(0, "#5b2d7a"); g.addColorStop(1, "#3a1c50");
            ctx.fillStyle = g; ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.lineWidth = 1; ctx.stroke();
          }
        }
      });
    }
  });

  /* ================= 八皇后 ================= */
  GB.add({
    id: "queens", name: "八皇后", cat: "puzzle", icon: "♛",
    desc: "摆下 8 个皇后互不攻击", tip: "点击格子放 / 取皇后 · 同行列斜线会冲突",
    w: 480, h: 540, colors: ["#2a2a3d", "#0f0f1a"],
    init(api) {
      const ctx = api.ctx, N = 8, S = 50;
      const OX = (480 - N * S) / 2, OY = 100;
      let b;
      function conflictsOf(i) {
        const x = i % N, y = Math.floor(i / N);
        for (let j = 0; j < N * N; j++) {
          if (j === i || !b[j]) continue;
          const x2 = j % N, y2 = Math.floor(j / N);
          if (x === x2 || y === y2 || Math.abs(x - x2) === Math.abs(y - y2)) return true;
        }
        return false;
      }
      function reset() { b = new Array(N * N).fill(0); }
      api.onDown((p) => {
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
        const i = cy * N + cx;
        b[i] = b[i] ? 0 : 1;
        api.beep(b[i] ? 520 : 340, 0.05, "sine", 0.04);
        const n = b.filter((v) => v).length;
        const anyConflict = b.some((v, j) => v && conflictsOf(j));
        if (n === 8 && !anyConflict) {
          api.setScore(1000);
          api.over("八皇后达成！", "8 个皇后互不攻击", true);
        } else if (anyConflict) api.beep(180, 0.09, "square", 0.04);
      });
      reset();
      api.loop(() => {
        api.clear("#0f0f1a");
        const n = b.filter((v) => v).length;
        const anyConflict = b.some((v, j) => v && conflictsOf(j));
        api.text("皇后 " + n + " / 8", 24, 42, { size: 14, weight: 700, color: "#c4c8e8", align: "left" });
        api.text(anyConflict ? "存在冲突（红色）" : "暂无冲突", 456, 42, { size: 12, color: anyConflict ? "#ff8787" : "#5a6b8a", align: "right" });
        for (let i = 0; i < N * N; i++) {
          const x = i % N, y = Math.floor(i / N);
          const px = OX + x * S, py = OY + y * S;
          ctx.fillStyle = (x + y) % 2 ? "#232338" : "#1b1b2c";
          ctx.fillRect(px, py, S, S);
          if (b[i]) {
            api.text("♛", px + S / 2, py + S / 2 + 2, { size: 26, color: conflictsOf(i) ? "#ff6b6b" : "#ffd75e" });
          }
        }
        ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.lineWidth = 1;
        ctx.strokeRect(OX, OY, N * S, N * S);
      });
    }
  });

  /* ================= 数织 Nonogram ================= */
  GB.add({
    id: "nonogram", name: "数织", cat: "puzzle", icon: "🧵",
    desc: "按行列数字提示还原图案", tip: "点击格子：填色 → 标记 ✕ → 清除",
    w: 480, h: 520, colors: ["#2c4a6e", "#0d1a2a"],
    init(api) {
      const ctx = api.ctx, N = 5, S = 56;
      const OX = 140, OY = 150;
      let sol, mark;
      function gen() {
        do {
          sol = Array.from({ length: N * N }, () => (Math.random() < 0.5 ? 1 : 0));
        } while (sol.every((v) => !v) || sol.every((v) => v));
        mark = new Array(N * N).fill(0);
      }
      function runsOf(line) {
        const r = []; let c = 0;
        for (const v of line) { if (v) c++; else { if (c) r.push(c); c = 0; } }
        if (c) r.push(c);
        return r.length ? r : [0];
      }
      api.onDown((p) => {
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
        const i = cy * N + cx;
        mark[i] = (mark[i] + 1) % 3;
        api.beep(mark[i] === 1 ? 520 : 300, 0.04, "sine", 0.035);
        if (sol.every((v, j) => (v ? mark[j] === 1 : mark[j] !== 1))) {
          api.setScore(800);
          api.over("还原成功！", "图案完全一致", true);
        }
      });
      api.onKey((k) => { if (k === "r" || k === "R") gen(); });
      gen();
      api.loop(() => {
        api.clear("#0d1a2a");
        api.text("数织 5×5", 24, 40, { size: 15, weight: 700, color: "#8fc7ee", align: "left" });
        api.text("R 换一题", 456, 40, { size: 11, color: "#4d6d8a", align: "right" });
        for (let i = 0; i < N; i++) {
          const row = runsOf(Array.from({ length: N }, (__, j) => sol[i * N + j]));
          row.forEach((n, k) => api.text(n, OX + i * S + S / 2, OY - 20 - (row.length - 1 - k) * 16, { size: 12, color: "#9db9d8" }));
          const col = runsOf(Array.from({ length: N }, (__, j) => sol[j * N + i]));
          col.forEach((n, k) => api.text(n, OX - 20 - (col.length - 1 - k) * 16, OY + i * S + S / 2, { size: 12, color: "#9db9d8" }));
        }
        for (let i = 0; i < N * N; i++) {
          const x = i % N, y = Math.floor(i / N);
          const px = OX + x * S, py = OY + y * S;
          ctx.fillStyle = (x + y) % 2 ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.06)";
          ctx.fillRect(px + 1, py + 1, S - 2, S - 2);
          if (mark[i] === 1) {
            api.rr(px + 3, py + 3, S - 6, S - 6, 8);
            ctx.fillStyle = "#4dabf7"; ctx.fill();
          } else if (mark[i] === 2) {
            api.text("✕", px + S / 2, py + S / 2, { size: 20, color: "#5a7a94" });
          }
        }
      });
    }
  });

  /* ================= 倒水排序 ================= */
  GB.add({
    id: "watersort", name: "倒水排序", cat: "puzzle", icon: "🧪",
    desc: "把相同颜色的水归到同一根管", tip: "点管子选取，再点目标管倒水",
    w: 480, h: 560, colors: ["#0f4d4d", "#06181c"],
    init(api) {
      const ctx = api.ctx, CAP = 4, COLS = 4;
      const TW = 58, TH = 180, HTUBES = 3;
      const COLORS = ["#ff6b6b", "#4dabf7", "#69db7c", "#ffd43b"];
      let tubes, sel, steps;
      function geo(i) {
        const row = Math.floor(i / HTUBES), col = i % HTUBES;
        const per = row === 0 ? HTUBES : 3;
        const w = per * TW + (per - 1) * 44;
        return { x: (480 - w) / 2 + col * (TW + 44), y: 130 + row * (TH + 80) };
      }
      function reset() {
        const all = [];
        COLORS.forEach((c) => { for (let i = 0; i < CAP; i++) all.push(c); });
        const sh = api.shuffle(all);
        tubes = [];
        for (let i = 0; i < COLORS.length; i++) tubes.push(sh.slice(i * CAP, (i + 1) * CAP));
        tubes.push([]); tubes.push([]);
        sel = -1; steps = 0;
      }
      api.onDown((p) => {
        let t = -1;
        for (let i = 0; i < tubes.length; i++) {
          const g = geo(i);
          if (p.x >= g.x - 6 && p.x <= g.x + TW + 6 && p.y >= g.y - 6 && p.y <= g.y + TH + 6) t = i;
        }
        if (t < 0) return;
        if (sel < 0) {
          if (tubes[t].length) { sel = t; api.beep(460, 0.05, "sine", 0.04); }
        } else if (t === sel) {
          sel = -1;
        } else {
          const from = tubes[sel], to = tubes[t];
          if (to.length >= CAP) { api.beep(160, 0.08, "square", 0.04); sel = -1; return; }
          const top = from[from.length - 1];
          if (to.length && to[to.length - 1] !== top) { api.beep(160, 0.08, "square", 0.04); sel = -1; return; }
          while (from.length && from[from.length - 1] === top && to.length < CAP) to.push(from.pop());
          steps++; sel = -1;
          api.beep(620, 0.06, "sine", 0.04, 500);
          if (tubes.every((tb) => !tb.length || (tb.length === CAP && tb.every((c) => c === tb[0])))) {
            api.setScore(Math.max(200, 1200 - steps * 20));
            api.over("排序完成！", steps + " 步", true);
          }
        }
      });
      reset();
      api.loop(() => {
        api.clear("#06181c");
        api.text("步数 " + steps, 24, 40, { size: 14, weight: 700, color: "#7fd8d0", align: "left" });
        for (let i = 0; i < tubes.length; i++) {
          const g = geo(i);
          const isSel = sel === i;
          api.rr(g.x, g.y, TW, TH, 8);
          ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fill();
          ctx.strokeStyle = isSel ? "#7fd8d0" : "rgba(255,255,255,.2)";
          ctx.lineWidth = isSel ? 2.6 : 1.4; ctx.stroke();
          tubes[i].forEach((c, j) => {
            const segH = (TH - 8) / CAP;
            const cy = g.y + TH - 4 - (j + 1) * segH;
            ctx.fillStyle = c;
            ctx.fillRect(g.x + 4, cy + 1, TW - 8, segH - 2);
          });
        }
      });
    }
  });

  /* ================= 一笔画 ================= */
  GB.add({
    id: "onestroke", name: "一笔画", cat: "puzzle", icon: "✏️",
    desc: "一笔画过所有线段不重复", tip: "从 ● 出发，沿连线滑动手指 / 鼠标",
    w: 480, h: 540, colors: ["#5a3a10", "#1c1206"],
    init(api) {
      const ctx = api.ctx;
      const GRIDS = [
        { n: 3, e: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4], [2, 5]] },
        { n: 4, e: [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 7], [0, 4], [1, 5], [2, 6], [3, 7]] },
        { n: 3, e: [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5], [1, 3], [2, 4]] }
      ];
      let n, edges, path, OX, OY, S;
      function load(i) {
        const g = GRIDS[i % GRIDS.length];
        n = g.n;
        edges = g.e.map((e) => [e[0], e[1], 0]);
        OX = 90; OY = 150; S = n === 3 ? 150 : 100;
        if (n === 4) OX = 40, OY = 170;
        path = [0];
      }
      function nb(a) {
        const out = [];
        edges.forEach((e, idx) => {
          if (e[0] === a) out.push([e[1], idx]);
          if (e[1] === a) out.push([e[0], idx]);
        });
        return out;
      }
      let dragging = false;
      api.onDown((p) => {
        const cx = Math.round((p.x - OX) / S), cy = Math.round((p.y - OY) / S);
        if (cx === 0 && cy === 0) { load(GRIDS.indexOf(GRIDS[gi]) + 1); return; }
        dragging = true;
      });
      let gi = 0;
      api.onMove((p) => {
        if (!dragging) return;
        const cx = Math.round((p.x - OX) / S), cy = Math.round((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx >= n || cy >= n) return;
        const i = cy * n + cx;
        const last = path[path.length - 1];
        if (i === last) return;
        for (const [o, idx] of nb(last)) {
          if (o === i && !edges[idx][2]) {
            edges[idx][2] = 1;
            path.push(i);
            api.beep(420 + path.length * 22, 0.05, "sine", 0.04);
            if (edges.every((e) => e[2])) {
              dragging = false;
              api.setScore(600 + (gi % GRIDS.length) * 200);
              api.over("一笔画完成！", "所有线段都覆盖到了", true);
            } else if (nb(i).every(([, i2]) => edges[i2][2])) {
              dragging = false;
              setTimeout(() => api.over("卡住了", "没有可走的线了"), 250);
            }
          }
        }
      });
      api.onUp(() => { dragging = false; });
      load(0);
      api.loop(() => {
        api.clear("#1c1206");
        api.text("覆盖 " + edges.filter((e) => e[2]).length + " / " + edges.length + " 条线", 24, 42, { size: 13.5, weight: 700, color: "#ffd98a", align: "left" });
        api.text("回到 ● 重新开始", 456, 42, { size: 11, color: "#8a6d3a", align: "right" });
        for (const e of edges) {
          const [a, b, used] = e;
          ctx.strokeStyle = used ? "#ffb347" : "rgba(255,255,255,.22)";
          ctx.lineWidth = used ? 4 : 2;
          ctx.beginPath();
          ctx.moveTo(OX + (a % n) * S, OY + Math.floor(a / n) * S);
          ctx.lineTo(OX + (b % n) * S, OY + Math.floor(b / n) * S);
          ctx.stroke();
        }
        for (let i = 0; i < n * n; i++) {
          const x = OX + (i % n) * S, y = OY + Math.floor(i / n) * S;
          const inPath = path.indexOf(i) >= 0;
          ctx.beginPath(); ctx.arc(x, y, inPath ? 9 : 5, 0, Math.PI * 2);
          ctx.fillStyle = inPath ? "#ffb347" : "#4a3a20";
          ctx.fill();
        }
      });
    }
  });

  /* ================= 猜密码 Mastermind ================= */
  GB.add({
    id: "mastermind", name: "猜密码", cat: "puzzle", icon: "🔐",
    desc: "8 次机会破译 4 色密码", tip: "点击色板填入 → 提交 · ● 位置对 ○ 颜色对",
    w: 480, h: 640, colors: ["#4a1030", "#180610"],
    init(api) {
      const ctx = api.ctx;
      const COLS = ["#ff6b6b", "#4dabf7", "#69db7c", "#ffd43b", "#e599f7", "#ff922b"];
      const ROWS = 8, RH = 40;
      const OY0 = 110;
      let secret, board, cur, row;
      function judge(guess) {
        let black = 0, white = 0;
        const s = secret.slice(), g = guess.slice();
        for (let i = 3; i >= 0; i--) {
          if (g[i] === s[i]) { black++; s.splice(i, 1); g.splice(i, 1); }
        }
        g.forEach((c) => {
          const j = s.indexOf(c);
          if (j >= 0) { white++; s.splice(j, 1); }
        });
        return [black, white];
      }
      function reset() {
        secret = Array.from({ length: 4 }, () => api.ri(0, 5));
        board = []; cur = []; row = 0;
      }
      api.onDown((p) => {
        const palY = OY0 + ROWS * RH + 12;
        for (let i = 0; i < 6; i++) {
          const x = 24 + i * 46;
          if (p.x >= x - 4 && p.x <= x + 44 && p.y >= palY && p.y <= palY + 44) {
            if (row < ROWS && cur.length < 4) { cur.push(i); api.beep(420 + i * 40, 0.05, "sine", 0.04); }
            return;
          }
        }
        const bx = 24 + 6 * 46 + 8;
        if (p.x >= bx && p.x <= bx + 92) {
          if (p.y >= palY && p.y <= palY + 44) {
            if (cur.length === 4) {
              const [b, w] = judge(cur);
              board.push({ g: cur.slice(), b, w });
              cur = []; row++;
              api.beep(500, 0.06, "sine", 0.04);
              if (b === 4) {
                api.setScore(Math.max(100, (ROWS - row + 1) * 150));
                api.over("密码破译！", row + " 次猜中", true);
              } else if (row >= ROWS) {
                api.over("次数用完", "密码见最右列");
              }
            }
            return;
          }
          if (p.y >= palY + 54 && p.y <= palY + 98) { cur.pop(); return; }
        }
      });
      reset();
      api.loop(() => {
        api.clear("#180610");
        api.text("剩余 " + (ROWS - row) + " 次机会", 24, 44, { size: 14, weight: 700, color: "#f2a8c8", align: "left" });
        for (let r = 0; r < ROWS; r++) {
          const y = OY0 + r * RH;
          ctx.fillStyle = "rgba(255,255,255,.035)";
          api.rr(24, y, 268, RH - 6, 7); ctx.fill();
          const e = board[r];
          for (let i = 0; i < 4; i++) {
            ctx.beginPath(); ctx.arc(48 + i * 56, y + (RH - 6) / 2, 13, 0, Math.PI * 2);
            ctx.fillStyle = e ? COLS[e.g[i]] : "rgba(255,255,255,.08)";
            ctx.fill();
          }
          if (e) {
            let bx = 306;
            for (let i = 0; i < e.b; i++) { ctx.beginPath(); ctx.arc(bx, y + 12, 5.5, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); bx += 16; }
            for (let i = 0; i < e.w; i++) { ctx.beginPath(); ctx.arc(bx, y + 12, 5.5, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.fill(); bx += 16; }
          }
        }
        const palY = OY0 + ROWS * RH + 12;
        for (let i = 0; i < 6; i++) {
          const x = 24 + i * 46;
          ctx.beginPath(); ctx.arc(x + 20, palY + 22, 17, 0, Math.PI * 2);
          ctx.fillStyle = COLS[i]; ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1.5; ctx.stroke();
        }
        const bx = 24 + 6 * 46 + 8;
        api.rr(bx, palY, 92, 44, 9);
        ctx.fillStyle = "#7c5cff"; ctx.fill();
        api.text("提交", bx + 46, palY + 23, { size: 13, weight: 700 });
        api.rr(bx, palY + 54, 92, 44, 9);
        ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill();
        api.text("退格", bx + 46, palY + 77, { size: 13, color: "#c9cede" });
        // 当前输入
        const cy2 = palY + 118;
        api.text("当前输入：", 24, cy2, { size: 12, color: "#8a5f74", align: "left" });
        for (let i = 0; i < 4; i++) {
          ctx.beginPath(); ctx.arc(140 + i * 44, cy2, 14, 0, Math.PI * 2);
          ctx.fillStyle = cur[i] != null ? COLS[cur[i]] : "rgba(255,255,255,.08)";
          ctx.fill();
        }
        if (row >= ROWS && board.length === ROWS && board[ROWS - 1].b < 4) {
          for (let i = 0; i < 4; i++) {
            ctx.beginPath(); ctx.arc(360 + i * 26, cy2, 9, 0, Math.PI * 2);
            ctx.fillStyle = COLS[secret[i]]; ctx.fill();
          }
        }
      });
    }
  });

  /* ================= 拼图复原（3×3 彩色） ================= */
  GB.add({
    id: "photo15", name: "拼图复原", cat: "puzzle", icon: "🖼️",
    desc: "滑动方块，按颜色渐变拼回原样", tip: "点击与空位相邻的方块滑动",
    w: 480, h: 560, colors: ["#123a4a", "#06181f"],
    init(api) {
      const ctx = api.ctx, N = 3, S = 128, GAP = 6;
      const OX = (480 - N * S - (N - 1) * GAP) / 2, OY = 120;
      let b, moves, hue;
      const solved = () => b.every((v, i) => v === (i + 1) % (N * N));
      function reset() {
        hue = api.pick([200, 340, 130, 45, 270]);
        do {
          b = Array.from({ length: N * N }, (_, i) => (i + 1) % (N * N));
          for (let i = 0; i < 200; i++) {
            const z = b.indexOf(0), zy = Math.floor(z / N), zx = z % N;
            const nb = [];
            if (zx > 0) nb.push(z - 1); if (zx < N - 1) nb.push(z + 1);
            if (zy > 0) nb.push(z - N); if (zy < N - 1) nb.push(z + N);
            const t = api.pick(nb); b[z] = b[t]; b[t] = 0;
          }
        } while (solved());
        moves = 0;
      }
      api.onDown((p) => {
        const cx = Math.floor((p.x - OX) / (S + GAP)), cy = Math.floor((p.y - OY) / (S + GAP));
        if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
        const z = b.indexOf(0), zy = Math.floor(z / N), zx = z % N;
        if (Math.abs(cx - zx) + Math.abs(cy - zy) !== 1) return;
        b[zy * N + zx] = b[cy * N + cx]; b[cy * N + cx] = 0;
        moves++;
        api.beep(400, 0.04, "sine", 0.035, 500);
        if (solved()) {
          api.setScore(Math.max(100, 900 - moves * 8));
          api.over("拼图完成！", moves + " 步", true);
        }
      });
      reset();
      api.loop(() => {
        api.clear("#06181f");
        api.text("步数 " + moves, 24, 44, { size: 14, weight: 700, color: "#7fc9e8", align: "left" });
        api.text("参照左上角色相渐变", 24, 68, { size: 10.5, color: "#3f6a7e", align: "left" });
        for (let i = 0; i < N * N; i++) {
          const v = b[i];
          if (!v) continue;
          const x = i % N, y = Math.floor(i / N);
          const px = OX + x * (S + GAP), py = OY + y * (S + GAP);
          const tx = (v - 1) % N, ty = Math.floor((v - 1) / N);
          api.rr(px, py, S, S, 10);
          const g = ctx.createLinearGradient(px, py, px + S, py + S);
          const h2 = hue + tx * 18 + ty * 30;
          g.addColorStop(0, "hsl(" + h2 + ",62%,52%)");
          g.addColorStop(1, "hsl(" + (h2 + 18) + ",58%,36%)");
          ctx.fillStyle = g; ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = 1; ctx.stroke();
          api.text(v, px + 15, py + 21, { size: 13, weight: 800, color: "rgba(255,255,255,.9)", align: "left" });
        }
      });
    }
  });
})();
