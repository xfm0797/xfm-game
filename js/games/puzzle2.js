/* ==========================================================
   puzzle2.js — 益智游戏 12 款
   ========================================================== */
(function () {
  "use strict";

  /* ================= 接水管 ================= */
  GB.add({
    id: "pipes", name: "接水管", cat: "puzzle", icon: "🚰",
    desc: "旋转管道，让水从源头流到终点", tip: "点击管段旋转 · 打通起点到终点",
    w: 480, h: 560, colors: ["#0f4a5c", "#071d24"],
    init(api) {
      const ctx = api.ctx, N = 5, S = 72;
      const OX = (480 - N * S) / 2, OY = 140;
      // 类型: 1 直 2 弯 3 T
      let cells, done;
      const CONN = { 1: [[1, 0, 1, 0], [0, 1, 0, 1]], 2: [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1], [1, 0, 0, 1]], 3: [[1, 1, 1, 0], [0, 1, 1, 1], [1, 0, 1, 1], [1, 1, 0, 1]] };
      function rot(c) {
        const t = CONN[c.t].length;
        c.r = (c.r + 1) % t;
      }
      function conn(c) {
        const arr = CONN[c.t][c.r];
        return { U: arr[0], R: arr[1], D: arr[2], L: arr[3] };
      }
      function gen() {
        // 随机生成一条从左上到右下的路径
        const path = [];
        let x = 0, y = 0;
        const target = [N - 1, N - 1];
        path.push([0, 0]);
        let guard = 0;
        while ((x !== target[0] || y !== target[1]) && guard++ < 200) {
          const opts = [];
          if (x < N - 1) opts.push([x + 1, y]);
          if (y < N - 1) opts.push([x, y + 1]);
          if (x > 0 && Math.random() < 0.2) opts.push([x - 1, y]);
          if (y > 0 && Math.random() < 0.2) opts.push([x, y - 1]);
          const [nx, ny] = api.pick(opts);
          path.push([nx, ny]); x = nx; y = ny;
        }
        cells = Array.from({ length: N * N }, () => null);
        const segs = {};
        path.forEach((p, i) => {
          const key = p[1] * N + p[0];
          segs[key] = segs[key] || [];
          if (i > 0) segs[key].push(path[i - 1]);
          if (i < path.length - 1) segs[key].push(path[i + 1]);
        });
        for (const key in segs) {
          const k = +key, x0 = k % N, y0 = Math.floor(k / N);
          const dirs = segs[key].map((p) => [p[0] - x0, p[1] - y0]);
          let t;
          if (dirs.length === 1) t = 1;
          else {
            const [dx1, dy1] = dirs[0], [dx2, dy2] = dirs[1];
            t = (dx1 === -dx2 && dy1 === -dy2) ? 1 : 2;
          }
          cells[k] = { t, r: api.ri(0, (t === 1 ? 1 : 3)) };
        }
        // 干扰管
        for (let i = 0; i < N * N; i++) {
          if (!cells[i]) cells[i] = (() => { const t = api.pick([1, 2]); return { t, r: api.ri(0, t === 1 ? 1 : 3) }; })();
        }
        cells[0].r = 0; // 源头朝右随意，玩家自己调
        done = false;
      }
      function flow() {
        const vis = new Set([0]);
        const st = [0];
        while (st.length) {
          const i = st.pop();
          const c = cells[i];
          if (!c) continue;
          const d = conn(c);
          const x = i % N, y = Math.floor(i / N);
          if (d.R && x < N - 1 && !vis.has(i + 1)) {
            const o = conn(cells[i + 1]);
            if (o.L) { vis.add(i + 1); st.push(i + 1); }
          }
          if (d.D && y < N - 1 && !vis.has(i + N)) {
            const o = conn(cells[i + N]);
            if (o.U) { vis.add(i + N); st.push(i + N); }
          }
          if (d.L && x > 0 && !vis.has(i - 1)) {
            const o = conn(cells[i - 1]);
            if (o.R) { vis.add(i - 1); st.push(i - 1); }
          }
          if (d.U && y > 0 && !vis.has(i - N)) {
            const o = conn(cells[i - N]);
            if (o.D) { vis.add(i - N); st.push(i - N); }
          }
        }
        return vis;
      }
      api.onDown((p) => {
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
        rot(cells[cy * N + cx]);
        api.beep(440, 0.05, "sine", 0.04);
        const vis = flow();
        if (vis.has(N * N - 1)) {
          done = true;
          api.setScore(700);
          api.over("水接通啦！", "管道全部连通", true);
        }
      });
      gen();
      api.loop(() => {
        api.clear("#071d24");
        api.text("源头 ● 左上 → 终点 ◎ 右下", 24, 44, { size: 13, weight: 700, color: "#7fd8e8", align: "left" });
        api.text("点击管段旋转", 456, 44, { size: 11, color: "#3f6d7e", align: "right" });
        const vis = done ? flow() : null;
        for (let i = 0; i < N * N; i++) {
          const x = i % N, y = Math.floor(i / N);
          const px = OX + x * S, py = OY + y * S;
          api.rr(px + 3, py + 3, S - 6, S - 6, 10);
          ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fill();
          const c = cells[i], d = conn(c);
          const cx = px + S / 2, cy = py + S / 2;
          const wet = done && vis.has(i);
          ctx.strokeStyle = wet ? "#4dd8e8" : "#3a6a7c";
          ctx.lineCap = "round";
          ctx.lineWidth = 12;
          if (c.t === 1) {
            const [u, r, dd, l] = [d.U, d.R, d.D, d.L];
            ctx.beginPath();
            if (r) { ctx.moveTo(cx, cy); ctx.lineTo(px + S, cy); }
            if (l) { ctx.moveTo(cx, cy); ctx.lineTo(px, cy); }
            if (u) { ctx.moveTo(cx, cy); ctx.lineTo(cx, py); }
            if (dd) { ctx.moveTo(cx, cy); ctx.lineTo(cx, py + S); }
            ctx.stroke();
          } else {
            if (d.U) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, py); ctx.stroke(); }
            if (d.D) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, py + S); ctx.stroke(); }
            if (d.L) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, cy); ctx.stroke(); }
            if (d.R) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px + S, cy); ctx.stroke(); }
          }
          if (i === 0) api.text("●", cx, cy, { size: 15, color: "#4dd8e8" });
          if (i === N * N - 1) api.text("◎", cx, cy, { size: 15, color: "#ffd75e" });
        }
      });
    }
  });

  /* ================= 消消乐 ================= */
  GB.add({
    id: "match3", name: "消消乐", cat: "puzzle", icon: "🍬",
    desc: "交换相邻糖果，三连消除", tip: "点击两颗相邻糖果交换 · 凑齐 3 个同色",
    w: 480, h: 560, colors: ["#5c1040", "#200818"],
    init(api) {
      const ctx = api.ctx, N = 7, S = 58;
      const OX = (480 - N * S) / 2, OY = 110;
      const COLS = ["#ff6b6b", "#ffd43b", "#69db7c", "#4dabf7", "#e599f7"];
      let g, score, sel, busy, steps;
      function reset() {
        g = Array.from({ length: N * N }, () => api.ri(0, 4));
        while (findMatches().length) {
          g = Array.from({ length: N * N }, () => api.ri(0, 4));
        }
        score = 0; sel = -1; busy = false; steps = 0;
        api.setScore(0);
      }
      function findMatches() {
        const out = new Set();
        for (let y = 0; y < N; y++) for (let x = 0; x < N - 2; x++) {
          const a = g[y * N + x];
          if (a === g[y * N + x + 1] && a === g[y * N + x + 2]) { out.add(y * N + x); out.add(y * N + x + 1); out.add(y * N + x + 2); }
        }
        for (let x = 0; x < N; x++) for (let y = 0; y < N - 2; y++) {
          const a = g[y * N + x];
          if (a === g[(y + 1) * N + x] && a === g[(y + 2) * N + x]) { out.add(y * N + x); out.add((y + 1) * N + x); out.add((y + 2) * N + x); }
        }
        return out;
      }
      function crush() {
        let total = 0, chains = 0;
        while (true) {
          const m = findMatches();
          if (!m.size) break;
          chains++;
          m.forEach((i) => { g[i] = -1; });
          total += m.size * 10 * chains;
          // 下落
          for (let x = 0; x < N; x++) {
            const col = [];
            for (let y = N - 1; y >= 0; y--) if (g[y * N + x] >= 0) col.push(g[y * N + x]);
            for (let y = N - 1; y >= 0; y--) {
              const k = N - 1 - y;
              g[y * N + x] = k < col.length ? col[k] : api.ri(0, 4);
            }
          }
        }
        return total;
      }
      api.onDown((p) => {
        if (busy) return;
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
        const i = cy * N + cx;
        if (sel < 0) { sel = i; api.beep(500, 0.04, "sine", 0.04); return; }
        const d = Math.abs(sel % N - cx) + Math.abs(Math.floor(sel / N) - cy);
        if (d !== 1) { sel = i; return; }
        const a = sel, b = i; sel = -1;
        [g[a], g[b]] = [g[b], g[a]];
        const gained = crush();
        if (!gained) {
          [g[a], g[b]] = [g[b], g[a]];
          api.beep(160, 0.08, "square", 0.04);
        } else {
          steps++;
          score += gained;
          api.setScore(score);
          api.beep(700, 0.08, "sine", 0.05, 900);
        }
      });
      reset();
      api.loop(() => {
        api.clear("#200818");
        api.text("得分 " + score, 24, 44, { size: 14, weight: 700, color: "#f2a8d8", align: "left" });
        api.text("交换相邻糖果凑 3 连", 456, 44, { size: 11, color: "#8a4a6e", align: "right" });
        for (let i = 0; i < N * N; i++) {
          const x = i % N, y = Math.floor(i / N);
          const px = OX + x * S, py = OY + y * S;
          api.rr(px + 3, py + 3, S - 6, S - 6, 12);
          ctx.fillStyle = sel === i ? "rgba(255,255,255,.28)" : "rgba(255,255,255,.07)";
          ctx.fill();
          if (g[i] >= 0) {
            ctx.beginPath();
            ctx.arc(px + S / 2, py + S / 2, S * 0.32, 0, Math.PI * 2);
            ctx.fillStyle = COLS[g[i]];
            ctx.shadowColor = COLS[g[i]]; ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      });
    }
  });

  /* ================= 连连看 ================= */
  GB.add({
    id: "linkup", name: "连连看", cat: "puzzle", icon: "🔗",
    desc: "连接相同图案，路径最多两个拐点", tip: "点击两枚相同图案 · 路径不超过 2 个拐点",
    w: 560, h: 560, colors: ["#1a3a5c", "#0a1626"],
    init(api) {
      const ctx = api.ctx, C = 8, R = 6, S = 58;
      const OX = 30, OY = 100;
      const ICONS = ["🍎", "🍐", "🍊", "🍋", "🍉", "🍇", "🍓", "🥝", "🍍", "🥑", "🍑", "🍒"];
      let b, sel, pairs;
      function reset() {
        const need = C * R / 2;
        const pool = [];
        for (let i = 0; i < need; i++) { const ic = ICONS[i % ICONS.length]; pool.push(ic, ic); }
        b = new Array(C * R);
        do {
          const sh = api.shuffle(pool);
          for (let i = 0; i < C * R; i++) b[i] = sh[i];
        } while (!hasAny());
        sel = -1; pairs = 0;
      }
      function get(x, y) {
        if (x < 0 || y < 0 || x >= C || y >= R) return null;
        return b[y * C + x];
      }
      function lineClear(x1, y1, x2, y2) {
        if (y1 === y2) {
          const [a, z] = [Math.min(x1, x2), Math.max(x1, x2)];
          for (let x = a + 1; x < z; x++) if (get(x, y1)) return false;
          return true;
        }
        if (x1 === x2) {
          const [a, z] = [Math.min(y1, y2), Math.max(y1, y2)];
          for (let y = a + 1; y < z; y++) if (get(x1, y)) return false;
          return true;
        }
        return false;
      }
      function connected(x1, y1, x2, y2) {
        if (get(x1, y1) !== get(x2, y2)) return false;
        if (lineClear(x1, y1, x2, y2)) return true;
        // 一个拐点
        if (!get(x2, y1) && lineClear(x1, y1, x2, y1) && lineClear(x2, y1, x2, y2)) return true;
        if (!get(x1, y2) && lineClear(x1, y1, x1, y2) && lineClear(x1, y2, x2, y2)) return true;
        // 两个拐点
        for (let x = -1; x <= C; x++) {
          if (x === x1 || x === x2) continue;
          if (!get(x, y1) && !get(x, y2) && lineClear(x1, y1, x, y1) && lineClear(x, y1, x, y2) && lineClear(x, y2, x2, y2)) return true;
        }
        for (let y = -1; y <= R; y++) {
          if (y === y1 || y === y2) continue;
          if (!get(x1, y) && !get(x2, y) && lineClear(x1, y1, x1, y) && lineClear(x1, y, x2, y) && lineClear(x2, y, x2, y2)) return true;
        }
        return false;
      }
      function hasAny() {
        const pos = [];
        for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) if (get(x, y)) pos.push([x, y]);
        for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
          if (connected(pos[i][0], pos[i][1], pos[j][0], pos[j][1])) return true;
        }
        return false;
      }
      let lastLine = null, lastLineT = 0;
      api.onDown((p) => {
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx >= C || cy >= R) return;
        if (!get(cx, cy)) return;
        const i = cy * C + cx;
        if (sel < 0) { sel = i; api.beep(500, 0.04, "sine", 0.04); return; }
        if (sel === i) { sel = -1; return; }
        const sx = sel % C, sy = Math.floor(sel / C);
        if (connected(sx, sy, cx, cy)) {
          b[sel] = null; b[i] = null;
          pairs++;
          lastLine = [[sx, sy], [cx, cy]]; lastLineT = api.t;
          sel = -1;
          api.beep(700, 0.08, "sine", 0.05, 900);
          api.setScore(pairs * 50);
          if (!b.some((v) => v)) api.over("全部消除！", pairs + " 对", true);
          else if (!hasAny()) { /* 死局洗牌 */ reset(); api.setScore(pairs * 50); }
        } else {
          sel = i;
          api.beep(200, 0.07, "square", 0.035);
        }
      });
      reset();
      api.loop(() => {
        api.clear("#0a1626");
        api.text("已消除 " + pairs + " / " + (C * R / 2) + " 对", 24, 44, { size: 14, weight: 700, color: "#8fc7ee", align: "left" });
        for (let i = 0; i < C * R; i++) {
          if (!b[i]) continue;
          const x = i % C, y = Math.floor(i / C);
          const px = OX + x * S, py = OY + y * S;
          api.rr(px + 2, py + 2, S - 4, S - 4, 9);
          ctx.fillStyle = sel === i ? "rgba(124,92,255,.45)" : "rgba(255,255,255,.07)";
          ctx.fill();
          ctx.strokeStyle = sel === i ? "#a78bfa" : "rgba(255,255,255,.1)";
          ctx.lineWidth = 1; ctx.stroke();
          api.text(b[i], px + S / 2, py + S / 2, { size: 26 });
        }
        if (lastLine && api.t - lastLineT < 0.4) {
          ctx.strokeStyle = "#4fd1c5"; ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(OX + (lastLine[0][0] + 0.5) * S, OY + (lastLine[0][1] + 0.5) * S);
          ctx.lineTo(OX + (lastLine[1][0] + 0.5) * S, OY + (lastLine[1][1] + 0.5) * S);
          ctx.stroke();
        }
      });
    }
  });

  /* ================= 猜单词 ================= */
  GB.add({
    id: "wordle", name: "猜单词", cat: "puzzle", icon: "🔤",
    desc: "6 次机会猜出 5 字母单词", tip: "输入字母回车提交 · 🟩位置对 🟨字母在词中",
    w: 480, h: 640, colors: ["#2a4234", "#0e1a12"],
    init(api) {
      const ctx = api.ctx;
      const WORDS = ["APPLE", "BEACH", "CHAIR", "DANCE", "EARTH", "FLAME", "GRACE", "HOUSE", "IVORY", "JOKER", "KOALA", "LEMON", "MUSIC", "NOBLE", "OCEAN", "PIANO", "QUEST", "RIVER", "SMILE", "TIGER", "ULTRA", "VIVID", "WATER", "YOUTH", "ZEBRA", "BRAVE", "CLOUD", "DREAM", "ENERGY", "FRESH"];
      const ROWS = 6, S = 62, GAP = 8;
      const OX = (480 - 5 * S - 4 * GAP) / 2, OY = 110;
      let word, rows, cur, row, done;
      function reset() {
        word = api.pick(WORDS);
        rows = []; cur = ""; row = 0; done = false;
      }
      function judge(g) {
        const res = Array(5).fill(0);
        const wc = {};
        for (const c of word) wc[c] = (wc[c] || 0) + 1;
        for (let i = 0; i < 5; i++) if (g[i] === word[i]) { res[i] = 2; wc[g[i]]--; }
        for (let i = 0; i < 5; i++) {
          if (res[i] === 2) continue;
          if (wc[g[i]] > 0) { res[i] = 1; wc[g[i]]--; }
        }
        return res;
      }
      function submit() {
        if (cur.length < 5) { api.beep(160, 0.08, "square", 0.04); return; }
        const res = judge(cur);
        rows.push({ g: cur, res });
        row++; cur = "";
        api.beep(520, 0.06, "sine", 0.045);
        if (res.every((r) => r === 2)) {
          api.setScore(Math.max(100, (ROWS - row + 1) * 200));
          api.over("猜中了！", word, true);
        } else if (row >= ROWS) {
          api.over("没猜出来", "答案是 " + word);
        }
      }
      api.onKey((k) => {
        if (done) return;
        if (/^[a-zA-Z]$/.test(k) && cur.length < 5) { cur += k.toUpperCase(); api.beep(400, 0.03, "sine", 0.03); }
        else if (k === "Backspace") cur = cur.slice(0, -1);
        else if (k === "Enter") submit();
      });
      // 虚拟键盘
      const KEYS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
      api.onDown((p) => {
        const ky = 420;
        for (let r = 0; r < 3; r++) {
          const line = KEYS[r];
          const kw = 40, n = line.length;
          const kx = (480 - n * (kw + 5)) / 2;
          for (let i = 0; i < n; i++) {
            const x = kx + i * (kw + 5), y = ky + r * 52;
            if (p.x >= x && p.x <= x + kw && p.y >= y && p.y <= y + 46) {
              if (!done && cur.length < 5) { cur += line[i]; api.beep(400, 0.03, "sine", 0.03); }
              return;
            }
          }
        }
        const ex = (480 - 2 * 80 - 10) / 2;
        if (p.x >= ex && p.x <= ex + 80 && p.y >= ky + 3 * 52 && p.y <= ky + 3 * 52 + 46) submit();
        if (p.x >= ex + 90 && p.x <= ex + 170 && p.y >= ky + 3 * 52 && p.y <= ky + 3 * 52 + 46) cur = cur.slice(0, -1);
      });
      reset();
      api.loop(() => {
        api.clear("#0e1a12");
        api.text("猜 5 字母单词", 24, 44, { size: 14, weight: 700, color: "#9fd8ae", align: "left" });
        for (let r = 0; r < ROWS; r++) {
          for (let i = 0; i < 5; i++) {
            const px = OX + i * (S + GAP), py = OY + r * (S + GAP);
            api.rr(px, py, S, S, 8);
            const e = rows[r];
            if (e) {
              ctx.fillStyle = e.res[i] === 2 ? "#5ba85f" : e.res[i] === 1 ? "#c9a84c" : "#3a3f3c";
              ctx.fill();
              api.text(e.g[i], px + S / 2, py + S / 2 + 1, { size: 27, weight: 800 });
            } else if (r === row) {
              ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1.5; ctx.stroke();
              const ch = cur[i];
              if (ch) api.text(ch, px + S / 2, py + S / 2 + 1, { size: 27, weight: 800 });
            } else {
              ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fill();
            }
          }
        }
        const ky = 420;
        for (let r = 0; r < 3; r++) {
          const line = KEYS[r];
          const kw = 40, n = line.length;
          const kx = (480 - n * (kw + 5)) / 2;
          for (let i = 0; i < n; i++) {
            const x = kx + i * (kw + 5), y = ky + r * 52;
            api.rr(x, y, kw, 46, 8);
            ctx.fillStyle = "rgba(255,255,255,.09)"; ctx.fill();
            api.text(line[i], x + kw / 2, y + 24, { size: 16, weight: 700 });
          }
        }
        const ex = (480 - 2 * 80 - 10) / 2, ey = ky + 3 * 52;
        api.rr(ex, ey, 80, 46, 8);
        ctx.fillStyle = "#5ba85f"; ctx.fill();
        api.text("提交", ex + 40, ey + 24, { size: 14, weight: 700 });
        api.rr(ex + 90, ey, 80, 46, 8);
        ctx.fillStyle = "rgba(255,255,255,.09)"; ctx.fill();
        api.text("退格", ex + 130, ey + 24, { size: 13 });
      });
    }
  });

  /* ================= 数独 6×6 ================= */
  GB.add({
    id: "sudoku6", name: "迷你数独", cat: "puzzle", icon: "🔟",
    desc: "6×6 数独，行列宫不重复", tip: "点击格子 → 点击数字填入 · 1~6",
    w: 480, h: 620, colors: ["#33415c", "#111827"],
    init(api) {
      const ctx = api.ctx, N = 6, S = 56;
      const OX = (480 - N * S) / 2, OY = 110;
      let sol, puzzle, cur, sel;
      function ok(b, i, v) {
        const x = i % N, y = Math.floor(i / N);
        for (let j = 0; j < N; j++) {
          if (j !== x && b[y * N + j] === v) return false;
          if (j !== y && b[j * N + x] === v) return false;
        }
        const bx = Math.floor(x / 3) * 3, by = Math.floor(y / 2) * 2;
        for (let yy = by; yy < by + 2; yy++) for (let xx = bx; xx < bx + 3; xx++) {
          if ((yy * N + xx) !== i && b[yy * N + xx] === v) return false;
        }
        return true;
      }
      function solve(b) {
        const i = b.indexOf(0);
        if (i < 0) return true;
        for (let v = 1; v <= 6; v++) {
          if (ok(b, i, v)) { b[i] = v; if (solve(b)) return true; b[i] = 0; }
        }
        return false;
      }
      function reset() {
        let base;
        do {
          base = new Array(N * N).fill(0);
          for (let k = 0; k < 7; k++) {
            const i = api.ri(0, N * N - 1), v = api.ri(1, 6);
            if (ok(base, i, v)) base[i] = v;
          }
        } while (!solve(base.slice()));
        sol = base.slice();
        puzzle = base.map((v) => (Math.random() < 0.55 ? 0 : v));
        cur = puzzle.slice();
        sel = -1;
      }
      api.onDown((p) => {
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx >= 0 && cy >= 0 && cx < N && cy < N) { sel = cy * N + cx; api.beep(420, 0.03, "sine", 0.03); return; }
        const ny = OY + N * S + 26;
        if (p.y >= ny && p.y <= ny + 48) {
          for (let v = 1; v <= 6; v++) {
            const x = OX + (v - 1) * (S + 8);
            if (p.x >= x && p.x <= x + S) {
              if (sel >= 0 && puzzle[sel] === 0) {
                cur[sel] = v;
                api.beep(480, 0.05, "sine", 0.04);
                if (cur.every((vv, i) => vv === sol[i])) {
                  api.setScore(900);
                  api.over("数独完成！", "全部填写正确", true);
                }
              }
              return;
            }
          }
          if (p.x >= OX + 6 * (S + 8) && p.x <= OX + 6 * (S + 8) + S) { if (sel >= 0 && puzzle[sel] === 0) cur[sel] = 0; }
        }
      });
      reset();
      api.loop(() => {
        api.clear("#111827");
        api.text("迷你数独 6×6", 24, 44, { size: 14, weight: 700, color: "#a5b8dd", align: "left" });
        api.text("行、列、宫内 1-6 不重复", 24, 66, { size: 10.5, color: "#5a6a85", align: "left" });
        for (let i = 0; i < N * N; i++) {
          const x = i % N, y = Math.floor(i / N);
          const px = OX + x * S, py = OY + y * S;
          ctx.fillStyle = sel === i ? "rgba(124,92,255,.3)" : "rgba(255,255,255,.045)";
          ctx.fillRect(px + 1, py + 1, S - 2, S - 2);
          const v = cur[i];
          if (v) api.text(v, px + S / 2, py + S / 2 + 1, { size: 24, weight: 800, color: puzzle[i] ? "#8fb8ef" : "#ffd75e" });
        }
        ctx.strokeStyle = "#48586f"; ctx.lineWidth = 1;
        for (let i = 0; i <= N; i++) {
          ctx.beginPath();
          if (i % 3 === 0) { ctx.lineWidth = 2.4; } else { ctx.lineWidth = 1; }
          ctx.moveTo(OX + i * S, OY); ctx.lineTo(OX + i * S, OY + N * S); ctx.stroke();
          ctx.beginPath();
          ctx.lineWidth = (i % 2 === 0) ? 2.4 : 1;
          ctx.moveTo(OX, OY + i * S); ctx.lineTo(OX + N * S, OY + i * S); ctx.stroke();
        }
        const ny = OY + N * S + 26;
        for (let v = 1; v <= 6; v++) {
          const x = OX + (v - 1) * (S + 8);
          api.rr(x, ny, S, 48, 9);
          ctx.fillStyle = "rgba(255,255,255,.09)"; ctx.fill();
          api.text(v, x + S / 2, ny + 25, { size: 20, weight: 800 });
        }
        const cx = OX + 6 * (S + 8);
        api.rr(cx, ny, S, 48, 9);
        ctx.fillStyle = "rgba(255,107,107,.25)"; ctx.fill();
        api.text("清除", cx + S / 2, ny + 25, { size: 14 });
      });
    }
  });

  /* ================= 找不同 ================= */
  GB.add({
    id: "spotdiff", name: "找不同", cat: "puzzle", icon: "🔍",
    desc: "两幅图有 3 处不同，找出来", tip: "点击下图中的不同之处",
    w: 520, h: 640, colors: ["#4a3a1a", "#1a1408"],
    init(api) {
      const ctx = api.ctx, G = 6, S = 60;
      const OY = 90;
      const W = G * S;
      const OX = (520 - W) / 2;
      let base, diffs, found, time;
      function gen() {
        base = Array.from({ length: G * G }, () => api.pick(["#ff6b6b", "#4dabf7", "#69db7c", "#ffd43b", "#e599f7", "#ff922b", "#74c0fc"]));
        diffs = [];
        while (diffs.length < 3) {
          const i = api.ri(0, G * G - 1);
          if (!diffs.some((d) => d.i === i)) {
            let c2;
            do { c2 = api.pick(["#ff6b6b", "#4dabf7", "#69db7c", "#ffd43b", "#e599f7", "#ff922b", "#74c0fc"]); } while (c2 === base[i]);
            diffs.push({ i, c: c2 });
          }
        }
        found = []; time = 0;
      }
      api.onDown((p) => {
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - (OY + W + 40)) / S);
        if (cx < 0 || cy < 0 || cx >= G || cy >= G) return;
        const i = cy * G + cx;
        const d = diffs.find((dd) => dd.i === i);
        if (d && !found.includes(i)) {
          found.push(i);
          api.beep(760, 0.09, "sine", 0.05);
          api.setScore(found.length * 200 + Math.max(0, Math.round(200 - time * 4)));
          if (found.length === 3) api.over("全部找到！", "用时 " + time.toFixed(1) + " 秒", true);
        } else {
          api.beep(180, 0.07, "square", 0.04);
          api.setScore(Math.max(0, api.score - 20));
        }
      });
      gen();
      api.loop((dt) => {
        time += dt;
        api.clear("#1a1408");
        api.text("已找到 " + found.length + " / 3 · " + time.toFixed(1) + "s", 24, 40, { size: 13.5, weight: 700, color: "#ffd98a", align: "left" });
        // 上图
        for (let i = 0; i < G * G; i++) {
          ctx.fillStyle = base[i];
          ctx.fillRect(OX + (i % G) * S + 2, OY + Math.floor(i / G) * S + 2, S - 4, S - 4);
        }
        // 下图
        const OY2 = OY + W + 40;
        for (let i = 0; i < G * G; i++) {
          const d = diffs.find((dd) => dd.i === i);
          ctx.fillStyle = d ? d.c : base[i];
          ctx.fillRect(OX + (i % G) * S + 2, OY2 + Math.floor(i / G) * S + 2, S - 4, S - 4);
          if (found.includes(i)) {
            ctx.strokeStyle = "#4fd1c5"; ctx.lineWidth = 3;
            ctx.strokeRect(OX + (i % G) * S + 4, OY2 + Math.floor(i / G) * S + 4, S - 8, S - 8);
          }
        }
        api.text("原图", OX + W, OY - 14, { size: 11, color: "#8a744a", align: "right" });
        api.text("找不同 ↓", OX + W, OY2 - 14, { size: 11, color: "#8a744a", align: "right" });
      });
    }
  });

  /* ================= 方块消除 Columns ================= */
  GB.add({
    id: "columns", name: "方块消除", cat: "puzzle", icon: "🧱",
    desc: "三连同色竖排消除", tip: "← → 移动 · ↑ 变换颜色 · ↓ 加速下落",
    w: 420, h: 560, colors: ["#3a1a4a", "#140818"],
    init(api) {
      const ctx = api.ctx, C = 7, R = 12, S = 44;
      const OX = (420 - C * S) / 2, OY = 90;
      const COLS = ["#ff6b6b", "#4dabf7", "#69db7c", "#ffd43b", "#e599f7"];
      let grid, cur, cx, cy, drop, score, over;
      function reset() {
        grid = Array.from({ length: R * C }, () => -1);
        score = 0; over = false; spawn();
        api.setScore(0);
      }
      function spawn() {
        cx = Math.floor(C / 2); cy = 0;
        cur = [api.ri(0, 4), api.ri(0, 4), api.ri(0, 4)];
        drop = 0;
        if (grid[cy * C + cx] >= 0 || grid[(cy + 1) * C + cx] >= 0) {
          over = true; api.over("堆到顶了", "得分 " + score);
        }
      }
      function land() {
        for (let i = 0; i < 3; i++) {
          const y = cy + 2 - i;
          if (y >= R) { over = true; api.over("堆到顶了", "得分 " + score); return; }
          grid[y * C + cx] = cur[2 - i];
        }
        api.beep(300, 0.05, "triangle", 0.04);
        let chain = 0, total = 0;
        while (true) {
          const clear = new Set();
          for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
            const v = grid[y * C + x];
            if (v < 0) continue;
            if (x < C - 2 && grid[y * C + x + 1] === v && grid[y * C + x + 2] === v) { clear.add(y * C + x); clear.add(y * C + x + 1); clear.add(y * C + x + 2); }
            if (y < R - 2 && grid[(y + 1) * C + x] === v && grid[(y + 2) * C + x] === v) { clear.add(y * C + x); clear.add((y + 1) * C + x); clear.add((y + 2) * C + x); }
            if (x < C - 2 && y < R - 2 && grid[(y + 1) * C + x + 1] === v && grid[(y + 2) * C + x + 2] === v) { clear.add(y * C + x); clear.add((y + 1) * C + x + 1); clear.add((y + 2) * C + x + 2); }
          }
          if (!clear.size) break;
          chain++;
          clear.forEach((i) => { grid[i] = -1; });
          total += clear.size * 10 * chain;
          api.beep(600 + chain * 120, 0.09, "sine", 0.05);
          for (let x = 0; x < C; x++) {
            const col = [];
            for (let y = R - 1; y >= 0; y--) if (grid[y * C + x] >= 0) col.push(grid[y * C + x]);
            for (let y = R - 1; y >= 0; y--) {
              const k = R - 1 - y;
              grid[y * C + x] = k < col.length ? col[k] : -1;
            }
          }
        }
        if (total) { score += total; api.setScore(score); }
        spawn();
      }
      api.onKey((k) => {
        if (over) return;
        if (k === "ArrowLeft" || k === "a") { if (cx > 0 && grid[(cy + 2) * C + cx - 1] < 0) cx--; }
        else if (k === "ArrowRight" || k === "d") { if (cx < C - 1 && grid[(cy + 2) * C + cx + 1] < 0) cx++; }
        else if (k === "ArrowUp" || k === "w") { cur = [cur[2], cur[0], cur[1]]; api.beep(500, 0.04, "sine", 0.04); }
        else if (k === "ArrowDown" || k === "s") drop = 20;
      });
      api.onDown((p) => {
        if (over) return;
        const col = Math.floor((p.x - OX) / S);
        if (col >= 0 && col < C) {
          if (col < cx) { if (grid[(cy + 2) * C + cx - 1] < 0) cx--; }
          else if (col > cx) { if (grid[(cy + 2) * C + cx + 1] < 0) cx++; }
          else drop = 20;
        }
      });
      reset();
      api.loop((dt) => {
        if (!over) {
          drop += dt * 60 * (1 + score / 1500);
          while (drop >= 24) {
            drop -= 24;
            const blocked = cy + 3 >= R || grid[(cy + 3) * C + cx] >= 0;
            if (blocked) { land(); break; }
            cy++;
          }
        }
        api.clear("#140818");
        api.text("得分 " + score, 24, 42, { size: 14, weight: 700, color: "#d8a8e8", align: "left" });
        api.rr(OX - 4, OY - 4, C * S + 8, R * S + 8, 10);
        ctx.fillStyle = "rgba(255,255,255,.04)"; ctx.fill();
        for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
          const v = grid[y * C + x];
          if (v < 0) continue;
          api.rr(OX + x * S + 3, OY + y * S + 3, S - 6, S - 6, 8);
          ctx.fillStyle = COLS[v]; ctx.fill();
        }
        if (!over) {
          for (let i = 0; i < 3; i++) {
            const y = cy + 2 - i;
            if (y < 0 || y >= R) continue;
            api.rr(OX + cx * S + 3, OY + y * S + 3, S - 6, S - 6, 8);
            ctx.fillStyle = COLS[cur[2 - i]];
            ctx.shadowColor = COLS[cur[2 - i]]; ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      });
    }
  });

  /* ================= 重力转球 ================= */
  GB.add({
    id: "rotate", name: "重力转球", cat: "puzzle", icon: "🧭",
    desc: "旋转整个迷宫，让球滚到出口", tip: "点击旋转按钮或按 R 键旋转 · 球沿重力滚落",
    w: 480, h: 560, colors: ["#3a3a1a", "#161408"],
    init(api) {
      const ctx = api.ctx, N = 7, S = 52;
      const OX = (480 - N * S) / 2, OY = 120;
      let walls, ball, dir, won, steps, anim;
      function gen() {
        walls = new Set();
        const pool = [];
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          if ((x === 0 && y === 0) || (x === N - 1 && y === N - 1)) continue;
          if (Math.random() < 0.32) pool.push(y * N + x);
        }
        // 保证起终点附近畅通
        pool.length = Math.floor(pool.length * 0.8);
        pool.forEach((i) => walls.add(i));
        if (walls.has(1)) walls.delete(1);
        if (walls.has(N)) walls.delete(N);
        if (walls.has(N * N - 2)) walls.delete(N * N - 2);
        if (walls.has(N * N - 1 - N)) walls.delete(N * N - 1 - N);
        ball = { x: 0, y: 0 };
        dir = "D"; won = false; steps = 0; anim = 0;
      }
      function solid(x, y) {
        if (x < 0 || y < 0 || x >= N || y >= N) return true;
        return walls.has(y * N + x);
      }
      function fall() {
        const D = { D: [0, 1], U: [0, -1], L: [-1, 0], R: [1, 0] }[dir];
        let guard = 0;
        while (guard++ < N * N) {
          const nx = ball.x + D[0], ny = ball.y + D[1];
          if (solid(nx, ny)) break;
          ball.x = nx; ball.y = ny;
        }
        if (ball.x === N - 1 && ball.y === N - 1) {
          won = true;
          api.setScore(Math.max(100, 800 - steps * 40));
          api.over("到达出口！", "旋转 " + steps + " 次", true);
        }
      }
      function rotate() {
        if (won) return;
        const dirs = ["D", "L", "U", "R"];
        dir = dirs[(dirs.indexOf(dir) + 1) % 4];
        steps++;
        api.beep(300, 0.08, "triangle", 0.04, 420);
        anim = 1;
        fall();
      }
      api.onKey((k) => { if (k === "r" || k === "R" || k === " ") rotate(); });
      api.onDown((p) => {
        const by = OY + N * S + 34;
        if (p.y >= by && p.y <= by + 50 && Math.abs(p.x - 240) < 110) rotate();
      });
      gen(); fall();
      api.loop((dt) => {
        if (anim > 0) anim = Math.max(0, anim - dt * 4);
        api.clear("#161408");
        api.text("旋转 " + steps + " 次 · 重力 " + ({ D: "↓", L: "←", U: "↑", R: "→" })[dir], 24, 44, { size: 13.5, weight: 700, color: "#ffe08a", align: "left" });
        for (let i = 0; i < N * N; i++) {
          const x = i % N, y = Math.floor(i / N);
          const px = OX + x * S, py = OY + y * S;
          api.rr(px + 2, py + 2, S - 4, S - 4, 9);
          ctx.fillStyle = walls.has(i) ? "#4a4423" : "rgba(255,255,255,.05)";
          ctx.fill();
        }
        api.rr(OX + (N - 1) * S + 5, OY + (N - 1) * S + 5, S - 10, S - 10, 8);
        ctx.fillStyle = "rgba(255,179,71,.4)"; ctx.fill();
        ctx.beginPath();
        ctx.arc(OX + (ball.x + 0.5) * S, OY + (ball.y + 0.5) * S, S * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = "#ffd75e";
        ctx.shadowColor = "#ffd75e"; ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
        const by = OY + N * S + 34;
        api.rr(130, by, 220, 50, 12);
        ctx.fillStyle = "rgba(255,255,255,.09)"; ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1; ctx.stroke();
        api.text("⟳ 旋转 90°（R）", 240, by + 26, { size: 15, weight: 700 });
      });
    }
  });

  /* ================= 记忆像素画 ================= */
  GB.add({
    id: "pixelcopy", name: "记忆像素画", cat: "puzzle", icon: "🎨",
    desc: "记住图案，然后凭记忆复现", tip: "记忆阶段过后点击格子填色 / 取消",
    w: 480, h: 600, colors: ["#1a4a3a", "#081a14"],
    init(api) {
      const ctx = api.ctx, N = 5, S = 66;
      const OX = (480 - N * S) / 2, OY = 140;
      let sol, cur, phase, timer, level;
      function gen() {
        sol = Array.from({ length: N * N }, () => Math.random() < 0.42);
        cur = new Array(N * N).fill(false);
        phase = "mem"; timer = 3 + level * 0.5;
      }
      function check() {
        return sol.every((v, i) => v === cur[i]);
      }
      api.onDown((p) => {
        if (phase !== "draw") return;
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
        const i = cy * N + cx;
        cur[i] = !cur[i];
        api.beep(cur[i] ? 520 : 300, 0.04, "sine", 0.035);
        if (check()) {
          level++;
          api.setScore(level * 200);
          api.beep(800, 0.1, "sine", 0.05);
          setTimeout(() => { if (!api.over) gen(); }, 500);
        }
      });
      level = 0; gen();
      api.loop((dt) => {
        if (phase === "mem") {
          timer -= dt;
          if (timer <= 0) phase = "draw";
        }
        api.clear("#081a14");
        api.text(phase === "mem" ? "记住这个图案！" : "凭记忆点出来", 240, 50, { size: 16, weight: 800, color: "#7fe3c0" });
        api.text("第 " + (level + 1) + " 幅 · 得分 " + api.score, 240, 78, { size: 12, color: "#4d7a66" });
        if (phase === "mem") api.text(Math.ceil(timer) + "s", 240, OY - 26, { size: 14, color: "#ffd75e" });
        for (let i = 0; i < N * N; i++) {
          const x = i % N, y = Math.floor(i / N);
          const px = OX + x * S, py = OY + y * S;
          api.rr(px + 2, py + 2, S - 4, S - 4, 10);
          const show = phase === "mem" ? sol[i] : cur[i];
          ctx.fillStyle = show ? "#4fd1a5" : "rgba(255,255,255,.05)";
          ctx.fill();
          if (phase === "draw" && sol[i] !== cur[i] && cur[i]) {
            ctx.strokeStyle = "#ff8787"; ctx.lineWidth = 2; ctx.stroke();
          }
        }
        if (phase === "draw") {
          api.text("完成后自动进入下一幅", 240, OY + N * S + 40, { size: 11.5, color: "#4d7a66" });
        }
      });
    }
  });

  /* ================= 逻辑推理 ================= */
  GB.add({
    id: "logicpuz", name: "逻辑推理", cat: "puzzle", icon: "🤔",
    desc: "阅读线索，选出唯一答案", tip: "点击选项作答 · 答错扣分",
    w: 480, h: 600, colors: ["#2a2a4a", "#101020"],
    init(api) {
      const ctx = api.ctx;
      const QS = [
        { q: "甲比乙高，丙比甲高，谁最矮？", a: ["甲", "乙", "丙"], ans: 1 },
        { q: "小红不是最年轻的，小兰比小红年轻，谁最年轻？", a: ["小红", "小兰", "一样"], ans: 1 },
        { q: "所有的猫都怕水，咪咪是猫，所以咪咪——", a: ["怕水", "不怕水", "不确定"], ans: 0 },
        { q: "1=5，2=15，3=215，4=2145，那么 5=?", a: ["21455", "1", "52145"], ans: 1 },
        { q: "一个数加 3 再乘 2 等于 14，这个数是？", a: ["4", "5", "3"], ans: 0 },
        { q: "今天星期三，100 天后是星期几？", a: ["星期五", "星期六", "星期日"], ans: 0 },
        { q: "3 只猫 3 分钟抓 3 只老鼠，9 只猫抓 9 只老鼠要几分钟？", a: ["9", "3", "6"], ans: 1 },
        { q: "一根木头锯成 3 段要 4 分钟（匀速），锯成 5 段要？", a: ["8 分钟", "10 分钟", "6 分钟"], ans: 0 },
        { q: "小明前面的第 3 个人是小刚，小明后面第 2 个人是小红，中间共几人？", a: ["4", "5", "6"], ans: 0 },
        { q: "钟表 3 点整，时针与分针的夹角是？", a: ["90°", "60°", "120°"], ans: 0 }
      ];
      let order, qi, answered, score;
      function reset() {
        order = api.shuffle(QS.map((_, i) => i));
        qi = 0; score = 0;
        api.setScore(0);
        answered = null;
      }
      api.onDown((p) => {
        if (answered != null) {
          if (p.y > 480) { qi++; answered = null; if (qi >= order.length) { api.over("全部答完", "答对得分 " + score, true); } }
          return;
        }
        const q = QS[order[qi]];
        for (let i = 0; i < q.a.length; i++) {
          const y = 330 + i * 62;
          if (p.y >= y && p.y <= y + 52 && p.x >= 40 && p.x <= 440) {
            answered = i;
            if (i === q.ans) { score += 150; api.setScore(score); api.beep(760, 0.1, "sine", 0.05); }
            else { api.beep(180, 0.12, "square", 0.05); }
            return;
          }
        }
      });
      reset();
      api.loop(() => {
        api.clear("#101020");
        if (qi >= order.length) return;
        const q = QS[order[qi]];
        api.text("第 " + (qi + 1) + " / " + order.length + " 题", 24, 44, { size: 12.5, weight: 700, color: "#8a8fd8", align: "left" });
        api.text("答对 +150", 456, 44, { size: 11, color: "#5a5a8a", align: "right" });
        // 题目
        ctx.save();
        api.font(16, 700);
        ctx.fillStyle = "#e8eaf6";
        ctx.textAlign = "center";
        const lines = [];
        let line = "";
        q.q.split("").forEach((ch) => {
          if (ctx.measureText(line + ch).width > 380) { lines.push(line); line = ch; }
          else line += ch;
        });
        lines.push(line);
        lines.forEach((l, i) => ctx.fillText(l, 240, 140 + i * 34));
        ctx.restore();
        q.a.forEach((opt, i) => {
          const y = 330 + i * 62;
          api.rr(40, y, 400, 52, 12);
          if (answered == null) ctx.fillStyle = "rgba(255,255,255,.06)";
          else if (i === q.ans) ctx.fillStyle = "rgba(105,219,124,.3)";
          else if (i === answered) ctx.fillStyle = "rgba(255,107,107,.3)";
          else ctx.fillStyle = "rgba(255,255,255,.03)";
          ctx.fill();
          ctx.strokeStyle = answered != null && i === q.ans ? "#69db7c" : "rgba(255,255,255,.1)";
          ctx.lineWidth = 1.2; ctx.stroke();
          api.text(opt, 240, y + 27, { size: 16, weight: 700 });
        });
        if (answered != null) {
          api.text(answered === q.ans ? "✓ 答对了，点击任意处继续" : "✗ 答错了，点击任意处继续",
            240, 545, { size: 13, color: answered === q.ans ? "#69db7c" : "#ff8787" });
        }
      });
    }
  });

  /* ================= 画线寻路 ================= */
  GB.add({
    id: "pathfinder", name: "画线寻路", cat: "puzzle", icon: "🧵‍",
    desc: "避开障碍，一笔画到终点", tip: "从起点按住滑到终点，不能碰障碍",
    w: 480, h: 560, colors: ["#2a1a3a", "#100a18"],
    init(api) {
      const ctx = api.ctx, C = 9, R = 9, S = 46;
      const OX = (480 - C * S) / 2, OY = 110;
      let obst, px, py, drawing, steps, won;
      function gen() {
        obst = new Set();
        while (obst.size < 22) {
          const i = api.ri(0, C * R - 1);
          if (i === 0 || i === C * R - 1) continue;
          obst.add(i);
        }
        px = 0; py = 0; drawing = false; steps = 0; won = false;
      }
      api.onDown((p) => {
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx === 0 && cy === 0) { drawing = true; return; }
      });
      api.onMove((p) => {
        if (!drawing || won) return;
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx >= C || cy >= R) return;
        if (Math.abs(cx - px) + Math.abs(cy - py) !== 1) return;
        if (obst.has(cy * C + cx)) {
          api.beep(160, 0.09, "square", 0.05);
          drawing = false;
          return;
        }
        px = cx; py = cy; steps++;
        api.beep(380 + steps * 6, 0.03, "sine", 0.025);
        if (px === C - 1 && py === R - 1) {
          won = true;
          drawing = false;
          api.setScore(Math.max(100, 1500 - steps * 10));
          api.over("到达终点！", steps + " 步", true);
        }
      });
      api.onUp(() => { drawing = false; });
      gen();
      api.loop(() => {
        api.clear("#100a18");
        api.text("从左上 ● 滑到右下 ◎", 24, 44, { size: 13.5, weight: 700, color: "#c8a8e8", align: "left" });
        for (let i = 0; i < C * R; i++) {
          const x = i % C, y = Math.floor(i / C);
          const pxs = OX + x * S, pys = OY + y * S;
          api.rr(pxs + 2, pys + 2, S - 4, S - 4, 7);
          ctx.fillStyle = obst.has(i) ? "#3d2a52" : "rgba(255,255,255,.04)";
          ctx.fill();
        }
        api.rr(OX + (C - 1) * S + 5, OY + (R - 1) * S + 5, S - 10, S - 10, 7);
        ctx.fillStyle = "rgba(255,179,71,.4)"; ctx.fill();
        ctx.beginPath(); ctx.arc(OX + (px + 0.5) * S, OY + (py + 0.5) * S, S * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = "#c8a8e8";
        ctx.shadowColor = "#c8a8e8"; ctx.shadowBlur = 12; ctx.fill();
        ctx.shadowBlur = 0;
      });
    }
  });

  /* ================= 孔明棋 ================= */
  GB.add({
    id: "peg", name: "孔明棋", cat: "puzzle", icon: "⚪",
    desc: "跳过相邻棋子吃掉它，剩一颗获胜", tip: "选一枚棋子，再点可跳到的空位",
    w: 480, h: 560, colors: ["#3a2a1a", "#140e08"],
    init(api) {
      const ctx = api.ctx, N = 7, S = 56;
      const OX = (480 - N * S) / 2, OY = 110;
      let b, sel, moves;
      const IN = (x, y) => (x >= 2 && x <= 4) || (y >= 2 && y <= 4);
      function reset() {
        b = [];
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) b.push(IN(x, y) && !(x === 3 && y === 3) ? 1 : 0);
        sel = -1; moves = 0;
      }
      function canJump(x, y) {
        const res = [];
        [[2, 0], [-2, 0], [0, 2], [0, -2]].forEach(([dx, dy]) => {
          const mx = x + dx / 2, my = y + dy / 2, tx = x + dx, ty = y + dy;
          if (tx < 0 || ty < 0 || tx >= N || ty >= N) return;
          if (b[ty * N + tx] === 0 && b[my * N + mx] === 1) res.push([tx, ty]);
        });
        return res;
      }
      api.onDown((p) => {
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
        const i = cy * N + cx;
        if (sel >= 0) {
          const sx = sel % N, sy = Math.floor(sel / N);
          const opts = canJump(sx, sy);
          const hit = opts.find(([tx, ty]) => tx === cx && ty === cy);
          if (hit) {
            b[(sy + (cy - sy) / 2) * N + (sx + (cx - sx) / 2)] = 0;
            b[sel] = 0; b[i] = 1;
            moves++;
            api.beep(520, 0.06, "sine", 0.045, 700);
            sel = -1;
            const total = b.reduce((s2, v) => s2 + v, 0);
            api.setScore(Math.max(50, (32 - total) * 100));
            if (total === 1) api.over("完美收局！", moves + " 步只剩 1 颗", true);
            else if (!b.some((v, j) => v && canJump(j % N, Math.floor(j / N)).length)) {
              api.over("无棋可走", "剩余 " + total + " 颗棋子");
            }
            return;
          }
        }
        if (b[i]) { sel = i; api.beep(440, 0.04, "sine", 0.04); }
        else sel = -1;
      });
      reset();
      api.loop(() => {
        api.clear("#140e08");
        const total = b.reduce((s2, v) => s2 + v, 0);
        api.text("剩余 " + total + " · 步数 " + moves, 24, 44, { size: 14, weight: 700, color: "#ffd98a", align: "left" });
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const i = y * N + x;
          if (!IN(x, y)) continue;
          const px = OX + x * S, py = OY + y * S;
          api.rr(px + 4, py + 4, S - 8, S - 8, 10);
          ctx.fillStyle = "rgba(255,255,255,.045)"; ctx.fill();
          if (b[i]) {
            ctx.beginPath();
            ctx.arc(px + S / 2, py + S / 2, S * 0.3, 0, Math.PI * 2);
            const g = ctx.createRadialGradient(px + S / 2 - 4, py + S / 2 - 4, 2, px + S / 2, py + S / 2, S * 0.3);
            g.addColorStop(0, "#fff2d8"); g.addColorStop(1, "#c9973a");
            ctx.fillStyle = g; ctx.fill();
          }
          if (sel >= 0) {
            const sx = sel % N, sy = Math.floor(sel / N);
            if (canJump(sx, sy).some(([tx, ty]) => tx === x && ty === y)) {
              ctx.strokeStyle = "#4fd1c5"; ctx.lineWidth = 2.4;
              ctx.beginPath(); ctx.arc(px + S / 2, py + S / 2, S * 0.34, 0, Math.PI * 2); ctx.stroke();
            }
          }
        }
      });
    }
  });
})();
