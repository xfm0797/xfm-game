/* ==========================================================
   vol-b.js — 益智解谜扩展 28 款
   ========================================================== */
(function () {
  "use strict";

  const hit = (p, x, y, w, h) => p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;
  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

  /* ---------------- 滑块拼图工厂 ---------------- */
  function slideGame(id, name, icon, cols, rows, emoji, desc) {
    GB.add({
      id, name, cat: "puzzle", icon, desc, tags: ["new"],
      tip: "点击空格旁的方块移动", w: 480, h: 520, colors: ["#123f4a", "#07191f"],
      init(api) {
        const ctx = api.ctx, W = api.w, H = api.h;
        const n = cols * rows;
        let tiles, moves, size, ox, oy, sel;
        size = Math.min((W - 48) / cols, (H - 120) / rows);
        ox = (W - size * cols) / 2; oy = (H - size * rows) / 2 + 22;
        tiles = [];
        for (let i = 0; i < n - 1; i++) tiles.push(i + 1);
        tiles.push(0);
        let blank = n - 1;
        for (let i = 0; i < 400; i++) {
          const nb = [];
          const r = Math.floor(blank / cols), c = blank % cols;
          if (r > 0) nb.push(blank - cols);
          if (r < rows - 1) nb.push(blank + cols);
          if (c > 0) nb.push(blank - 1);
          if (c < cols - 1) nb.push(blank + 1);
          const pick = nb[Math.floor(Math.random() * nb.length)];
          tiles[blank] = tiles[pick]; tiles[pick] = 0; blank = pick;
        }
        moves = 0; sel = -1;
        api.onDown((p) => {
          const c = Math.floor((p.x - ox) / size), r = Math.floor((p.y - oy) / size);
          if (c < 0 || c >= cols || r < 0 || r >= rows) return;
          const i = r * cols + c;
          if (tiles[i] === 0) return;
          const br = Math.floor(blank / cols), bc = blank % cols;
          if (Math.abs(br - r) + Math.abs(bc - c) !== 1) return;
          tiles[blank] = tiles[i]; tiles[i] = 0; blank = i;
          moves++; api.beep(560, .04, "sine", .04);
          api.setScore(Math.max(0, n * 90 - moves * 6));
          if (tiles.every((v, k) => v === (k === n - 1 ? 0 : k + 1))) {
            api.over("拼好了！", "用了 " + moves + " 步", true);
          }
        });
        api.loop(() => {
          api.clear("#07191f");
          api.text("步数 " + moves + " · " + cols + "×" + rows, W / 2, 24, { size: 12, weight: 700, color: "#7dd3e8" });
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            const v = tiles[r * cols + c];
            const x = ox + c * size, y = oy + r * size;
            if (!v) { ctx.fillStyle = "rgba(255,255,255,.04)"; ctx.fillRect(x + 3, y + 3, size - 6, size - 6); continue; }
            api.rr(x + 3, y + 3, size - 6, size - 6, 8);
            const g = ctx.createLinearGradient(x, y, x, y + size);
            g.addColorStop(0, "#1b6b7d"); g.addColorStop(1, "#0e3a47");
            ctx.fillStyle = g; ctx.fill();
            ctx.strokeStyle = "rgba(34,211,238,.35)"; ctx.stroke();
            if (emoji) api.text(emoji[v - 1], x + size / 2, y + size / 2, { size: size * .5 });
            else api.text(String(v), x + size / 2, y + size / 2, { size: Math.min(22, size * .38), weight: 800, color: "#c8f4ff" });
          }
        });
      }
    });
  }
  slideGame("slide9", "数字华容 3×3", "🔢", 3, 3, null, "最经典的 8 格滑块");
  slideGame("slide12", "数字华容 3×4", "🔢", 3, 4, null, "12 格滑块，步数更紧张");
  slideGame("slide20", "数字华容 4×5", "🔢", 4, 5, null, "20 格大滑块，有点费脑");
  slideGame("slide24", "数字华容 5×5", "🔢", 5, 5, null, "25 格极限挑战");
  slideGame("slidepic", "方块拼图 15", "🖼️", 4, 4, "🍎🍊🍋🍇🍉🍓🍒🍑🥝🍍🥥🍌🍆🌽🥕", "把图案拼回原位");

  /* ---------------- 扫雷工厂 ---------------- */
  function minesGame(id, name, size, count, icon, desc) {
    GB.add({
      id, name, cat: "puzzle", icon, desc, tags: ["new"],
      tip: "点击挖开，右上角切换插旗", w: 520, h: 600, colors: ["#1a2440", "#080c14"],
      init(api) {
        const ctx = api.ctx, W = api.w, H = api.h;
        const top = 54, cell = Math.min((W - 24) / size, (H - top - 30) / size);
        const ox = (W - cell * size) / 2, oy = top;
        let grid, opened, flags, started, over, flagMode, t0;
        grid = []; opened = new Set(); flags = new Set(); started = false; over = false; flagMode = false; t0 = 0;
        function build(safe) {
          grid = Array.from({ length: size * size }, () => ({ m: false, n: 0, o: false }));
          let placed = 0;
          while (placed < count) {
            const i = Math.floor(Math.random() * size * size);
            if (i === safe || grid[i].m) continue;
            grid[i].m = true; placed++;
          }
          for (let i = 0; i < size * size; i++) {
            if (grid[i].m) continue;
            let n = 0;
            const r = Math.floor(i / size), c = i % size;
            for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
              const rr2 = r + dr, cc = c + dc;
              if (rr2 >= 0 && rr2 < size && cc >= 0 && cc < size && grid[rr2 * size + cc].m) n++;
            }
            grid[i].n = n;
          }
        }
        function flood(i) {
          const st = [i];
          while (st.length) {
            const k = st.pop();
            if (opened.has(k)) continue;
            const cell2 = grid[k];
            if (cell2.m) continue;
            opened.add(k); cell2.o = true;
            if (cell2.n === 0) {
              const r = Math.floor(k / size), c = k % size;
              for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
                const rr2 = r + dr, cc = c + dc;
                if (rr2 >= 0 && rr2 < size && cc >= 0 && cc < size) {
                  const nk = rr2 * size + cc;
                  if (!opened.has(nk) && !grid[nk].m) st.push(nk);
                }
              }
            }
          }
        }
        function cellAt(p) {
          const c = Math.floor((p.x - ox) / cell), r = Math.floor((p.y - oy) / cell);
          if (c < 0 || c >= size || r < 0 || r >= size) return -1;
          return r * size + c;
        }
        api.onDown((p) => {
          if (over) return;
          if (hit(p, W - 46, 12, 34, 30)) { flagMode = !flagMode; api.beep(500, .05, "sine", .04); return; }
          const i = cellAt(p);
          if (i < 0) return;
          if (!started) { started = true; build(i); t0 = api.t; }
          if (flagMode) {
            if (opened.has(i)) return;
            if (flags.has(i)) flags.delete(i); else flags.add(i);
            api.beep(420, .04, "square", .03);
            return;
          }
          if (flags.has(i) || opened.has(i)) return;
          if (grid[i].m) {
            over = true;
            grid.forEach((c2, k) => { if (c2.m) opened.add(k); });
            api.over("踩到地雷了", "还剩 " + (size * size - opened.size - flags.size) + " 格", false);
            return;
          }
          flood(i);
          if (opened.size >= size * size - count) {
            over = true;
            api.over("扫雷完成！", "用时 " + api.t.toFixed(1) + " 秒", true);
          }
          api.setScore(Math.max(0, (opened.size * 12 - flags.size * 2) * (size === 16 ? 1.6 : 1)));
        });
        api.loop(() => {
          api.clear("#080c14");
          api.text("剩余雷 " + (count - flags.size), 14, 26, { size: 12, weight: 700, color: "#8fb8ef", align: "left" });
          api.rr(W - 46, 12, 34, 30, 8);
          ctx.fillStyle = flagMode ? "rgba(255,92,138,.3)" : "rgba(255,255,255,.07)";
          ctx.fill(); api.text("🚩", W - 29, 28, { size: 14 });
          for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
            const i = r * size + c, x = ox + c * cell, y = oy + r * cell;
            api.rr(x + 1, y + 1, cell - 2, cell - 2, 3);
            if (opened.has(i)) {
              ctx.fillStyle = grid[i].m ? "rgba(255,92,138,.6)" : "rgba(255,255,255,.055)";
              ctx.fill();
              if (grid[i].n > 0 && !grid[i].m) {
                const cols = ["", "#7dd3e8", "#6ee7b7", "#fbbf24", "#fb923c", "#f472b6", "#a78bfa", "#e879f9", "#ff5c8a"];
                api.text(String(grid[i].n), x + cell / 2, y + cell / 2, { size: Math.min(15, cell * .52), weight: 800, color: cols[grid[i].n] });
              }
              if (grid[i].m) api.text("💥", x + cell / 2, y + cell / 2, { size: Math.min(15, cell * .5) });
            } else {
              ctx.fillStyle = flags.has(i) ? "rgba(255,92,138,.22)" : "rgba(255,255,255,.1)";
              ctx.fill();
              if (flags.has(i)) api.text("🚩", x + cell / 2, y + cell / 2, { size: Math.min(14, cell * .46) });
            }
          }
          if (!started) api.text("提示：先点一格开始", W / 2, H - 14, { size: 11, color: "#4f5b70" });
        });
      }
    });
  }
  minesGame("mines12", "扫雷 12×12", 12, 26, "💣", "12×12 场地，26 颗雷");
  minesGame("mines16", "扫雷 16×16", 16, 42, "💣", "16×16 专家级扫雷");

  /* ---------------- 数独 9×9 ---------------- */
  GB.add({
    id: "sudoku9", name: "数独 9×9", cat: "puzzle", icon: "🔲", tags: ["new"],
    desc: "经典九宫格数独，唯一解生成", tip: "选格子，再点数字填入", w: 480, h: 620,
    colors: ["#1b2a4a", "#080d16"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const sol = new Array(81).fill(0);
      const ok = (g, i, v) => {
        const r = Math.floor(i / 9), c = i % 9;
        for (let k = 0; k < 9; k++) if (g[r * 9 + k] === v || g[k * 9 + c] === v) return false;
        const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
        for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (g[(br + a) * 9 + bc + b] === v) return false;
        return true;
      };
      const solve = (g, i) => {
        if (i === 81) return true;
        if (g[i]) return solve(g, i + 1);
        for (const v of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
          if (ok(g, i, v)) { g[i] = v; if (solve(g, i + 1)) return true; g[i] = 0; }
        }
        return false;
      };
      const count = (g, lim) => {
        let best = -1, bestC = null;
        for (let i = 0; i < 81; i++) {
          if (g[i]) continue;
          const cand = [];
          for (let v = 1; v <= 9; v++) if (ok(g, i, v)) cand.push(v);
          if (!cand.length) return 0;
          if (!bestC || cand.length < bestC.length) { best = i; bestC = cand; if (cand.length === 1) break; }
        }
        if (best < 0) return 1;
        let n = 0;
        for (const v of bestC) {
          g[best] = v;
          n += count(g, lim - n);
          g[best] = 0;
          if (n >= lim) break;
        }
        return n;
      };
      solve(sol, 0);
      const puzzle = sol.slice();
      const idx = shuffle(Array.from({ length: 81 }, (_, i) => i));
      let removed = 0;
      for (const i of idx) {
        if (removed >= 46) break;
        const keep = puzzle[i];
        puzzle[i] = 0;
        if (count(puzzle.slice(), 2) !== 1) puzzle[i] = keep;
        else removed++;
      }
      const cell = 46, ox = (W - cell * 9) / 2, oy = 54;
      let sel = -1, errs = 0;
      const vals = puzzle.slice();
      const padY = oy + cell * 9 + 16;
      api.onDown((p) => {
        const c = Math.floor((p.x - ox) / cell), r = Math.floor((p.y - oy) / cell);
        if (c >= 0 && c < 9 && r >= 0 && r < 9) { sel = r * 9 + c; return; }
        if (p.y > padY) {
          const n = Math.floor((p.x - 16) / 46);
          if (n >= 0 && n < 10 && sel >= 0 && puzzle[sel] === 0) {
            const v = n === 9 ? 0 : n + 1;
            vals[sel] = v;
            if (v && v !== sol[sel]) { errs++; api.beep(180, .1, "square", .05); }
            else if (v) api.beep(760, .06, "sine", .05);
            if (vals.every((x, k) => x === sol[k])) api.over("数独完成！", errs ? "失误 " + errs + " 次" : "完美无失误", true);
          }
        }
      });
      api.onKey((k) => {
        if (sel < 0) return;
        if (/^[1-9]$/.test(k) && puzzle[sel] === 0) { vals[sel] = +k; if (+k !== sol[sel]) errs++; }
        if (k === "Backspace" || k === "0") if (puzzle[sel] === 0) vals[sel] = 0;
      });
      api.loop(() => {
        api.clear("#080d16");
        api.text("数独 · 已填 " + vals.filter(Boolean).length + "/81", W / 2, 26, { size: 12.5, weight: 700, color: "#93a4ff" });
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
          const i = r * 9 + c, x = ox + c * cell, y = oy + r * cell;
          ctx.fillStyle = puzzle[i] ? "rgba(124,92,255,.14)" : "rgba(255,255,255,.045)";
          ctx.fillRect(x, y, cell, cell);
          if (i === sel) { ctx.fillStyle = "rgba(34,211,238,.22)"; ctx.fillRect(x, y, cell, cell); }
          const v = vals[i];
          if (v) api.text(String(v), x + cell / 2, y + cell / 2, { size: 22, weight: 700, color: puzzle[i] ? "#dbe4ff" : (v === sol[i] ? "#6ee7b7" : "#ff5c8a") });
        }
        ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 1;
        for (let i = 0; i <= 9; i++) {
          ctx.beginPath(); ctx.moveTo(ox + i * cell, oy); ctx.lineTo(ox + i * cell, oy + cell * 9); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ox, oy + i * cell); ctx.lineTo(ox + cell * 9, oy + i * cell); ctx.stroke();
        }
        ctx.strokeStyle = "rgba(124,92,255,.65)"; ctx.lineWidth = 2;
        for (let i = 0; i <= 3; i++) {
          ctx.beginPath(); ctx.moveTo(ox + i * cell * 3, oy); ctx.lineTo(ox + i * cell * 3, oy + cell * 9); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ox, oy + i * cell * 3); ctx.lineTo(ox + cell * 9, oy + i * cell * 3); ctx.stroke();
        }
        ctx.lineWidth = 1;
        for (let n = 0; n < 10; n++) {
          const x = 16 + n * 46;
          api.rr(x, padY, 42, 48, 8);
          ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fill();
          api.text(n === 9 ? "×" : String(n + 1), x + 21, padY + 24, { size: 17, weight: 700, color: n === 9 ? "#ff8fa8" : "#dbe4ff" });
        }
      });
    }
  });

  /* ---------------- 单词路径 ---------------- */
  GB.add({
    id: "wordpath", name: "单词路径", cat: "puzzle", icon: "🔤", tags: ["new"],
    desc: "在字母阵中按顺序连出单词", tip: "依次点击相邻字母拼出单词", w: 480, h: 600,
    colors: ["#243b2f", "#08130f"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const N = 8, cell = 48, ox = (W - cell * N) / 2, oy = 132;
      const words = ["TIGER", "RIVER", "MUSIC", "LEMON", "CHAIR", "CLOUD", "HONEY", "PLANT"];
      let grid, found, path, cur;
      function build() {
        grid = Array.from({ length: N * N }, () => "");
        found = [];
        const picked = [];
        shuffle(words).slice(0, 6).forEach((w) => {
          for (let tries = 0; tries < 300; tries++) {
            const hor = Math.random() < .5;
            const r0 = Math.floor(Math.random() * (hor ? N : N - w.length + 1));
            const c0 = Math.floor(Math.random() * (hor ? N - w.length + 1 : N));
            const cells = [];
            let ok = true;
            for (let k = 0; k < w.length; k++) {
              const r = hor ? r0 : r0 + k, c = hor ? c0 + k : c0;
              const i = r * N + c;
              if (grid[i] && grid[i] !== w[k]) { ok = false; break; }
              cells.push(i);
            }
            if (!ok) continue;
            cells.forEach((i, k) => { grid[i] = w[k]; });
            picked.push(w);
            break;
          }
        });
        for (let i = 0; i < N * N; i++) if (!grid[i]) grid[i] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
        cur = picked;
      }
      build(); path = [];
      api.onDown((p) => {
        const c = Math.floor((p.x - ox) / cell), r = Math.floor((p.y - oy) / cell);
        if (c < 0 || c >= N || r < 0 || r >= N) { path = []; return; }
        const i = r * N + c;
        if (path.length) {
          const last = path[path.length - 1];
          if (last === i) { path.pop(); return; }
          const lr = Math.floor(last / N), lc = last % N;
          if (Math.abs(lr - r) > 1 || Math.abs(lc - c) > 1) { path = [i]; return; }
          if (path.indexOf(i) >= 0) { path = path.slice(0, path.indexOf(i) + 1); return; }
        }
        path.push(i);
        const str = path.map((k) => grid[k]).join("");
        if (cur.indexOf(str) >= 0 && found.indexOf(str) < 0) {
          found.push(str); path = [];
          api.addScore(20); api.beep(880, .08, "sine", .05);
          if (found.length === cur.length) api.over("全部找到！", "6 个单词全部命中", true);
        }
        api.beep(520, .03, "sine", .03);
      });
      api.loop(() => {
        api.clear("#08130f");
        api.text("单词路径 · " + found.length + "/" + cur.length, W / 2, 22, { size: 12.5, weight: 700, color: "#6ee7b7" });
        cur.forEach((w, i) => {
          const x = 20 + (i % 3) * 152, y = 46 + Math.floor(i / 3) * 28;
          api.text(w, x, y, { size: 13, weight: 700, color: found.indexOf(w) >= 0 ? "#34d399" : "#5d7186", align: "left" });
        });
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const i = r * N + c, x = ox + c * cell, y = oy + r * cell;
          const onPath = path.indexOf(i) >= 0;
          api.rr(x + 2, y + 2, cell - 4, cell - 4, 7);
          ctx.fillStyle = onPath ? "rgba(52,211,153,.35)" : "rgba(255,255,255,.055)";
          ctx.fill();
          if (onPath) { ctx.strokeStyle = "rgba(52,211,153,.8)"; ctx.stroke(); }
          api.text(grid[i], x + cell / 2, y + cell / 2, { size: 19, weight: 700, color: onPath ? "#eafff6" : "#b9c8c1" });
        }
        if (path.length) api.text(path.map((k) => grid[k]).join(""), W / 2, oy + cell * N + 26, { size: 16, weight: 800, color: "#6ee7b7" });
      });
    }
  });

  /* ---------------- 字母重排 ---------------- */
  GB.add({
    id: "anagram", name: "字母重排", cat: "puzzle", icon: "🅰️", tags: ["new"],
    desc: "把打乱的字母拼回英文单词", tip: "按顺序点击字母，拼错会重来", w: 480, h: 520,
    colors: ["#20304a", "#080d16"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const BANK = [
        ["APPLE", "苹果"], ["RIVER", "河流"], ["TIGER", "老虎"], ["CHAIR", "椅子"], ["MUSIC", "音乐"],
        ["CLOUD", "云"], ["HONEY", "蜂蜜"], ["PLANT", "植物"], ["STONE", "石头"], ["BREAD", "面包"],
        ["LIGHT", "光"], ["WATER", "水"], ["HOUSE", "房子"], ["SMILE", "微笑"], ["DREAM", "梦想"],
        ["GREEN", "绿色"], ["MONEY", "钱"], ["NIGHT", "夜晚"], ["OCEAN", "海洋"], ["PIANO", "钢琴"]
      ];
      let pool, word, hint, letters, picked, score, left, done;
      function next() {
        if (!pool.length) pool = shuffle(BANK.slice());
        const it = pool.pop();
        word = it[0]; hint = it[1];
        letters = shuffle(word.split(""));
        picked = [];
      }
      pool = shuffle(BANK.slice()); score = 0; left = 60; done = false;
      next();
      api.onDown((p) => {
        if (done) return;
        if (hit(p, W / 2 - 70, H - 62, 140, 40)) {
          if (picked.join("") === word) {
            score += Math.max(10, 40 - picked.length); api.setScore(score); api.beep(820, .08, "sine", .05);
            next();
          } else { api.beep(180, .12, "square", .05); picked = []; }
          return;
        }
        for (let i = 0; i < letters.length; i++) {
          const x = 24 + (i % 6) * 74, y = 250 + Math.floor(i / 6) * 74;
          if (picked.indexOf(i) >= 0) continue;
          if (hit(p, x, y, 64, 64)) { picked.push(i); api.beep(560, .04, "sine", .035); return; }
        }
        for (let i = 0; i < picked.length; i++) {
          const x = W / 2 - (word.length * 34) / 2 + i * 34;
          if (hit(p, x, 150, 32, 44)) { picked = picked.slice(0, i); return; }
        }
      });
      api.loop((dt) => {
        if (!done) {
          left -= dt;
          if (left <= 0) { done = true; api.over("时间到", "拼出 " + score + " 分", false); }
        }
        api.clear("#080d16");
        api.text("字母重排 · 提示：" + hint + "（" + word.length + " 个字母）", W / 2, 34, { size: 13, weight: 700, color: "#93a4ff" });
        api.text("得分 " + score + " · 剩余 " + Math.max(0, Math.ceil(left)) + "s", W / 2, 60, { size: 11.5, color: "#5f6a80" });
        for (let i = 0; i < word.length; i++) {
          const x = W / 2 - (word.length * 34) / 2 + i * 34;
          api.rr(x, 150, 32, 44, 7);
          ctx.fillStyle = i < picked.length ? "rgba(124,92,255,.5)" : "rgba(255,255,255,.06)";
          ctx.fill();
          if (i < picked.length) api.text(letters[picked[i]], x + 16, 172, { size: 19, weight: 800 });
          else { ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(x + 8, 180, 16, 2); }
        }
        for (let i = 0; i < letters.length; i++) {
          const x = 24 + (i % 6) * 74, y = 250 + Math.floor(i / 6) * 74;
          const used = picked.indexOf(i) >= 0;
          api.rr(x, y, 64, 64, 12);
          ctx.fillStyle = used ? "rgba(255,255,255,.03)" : "rgba(34,211,238,.14)";
          ctx.fill();
          if (!used) {
            ctx.strokeStyle = "rgba(34,211,238,.4)"; ctx.stroke();
            api.text(letters[i], x + 32, y + 33, { size: 26, weight: 800, color: "#d7f7ff" });
          }
        }
        api.rr(W / 2 - 70, H - 62, 140, 40, 12);
        const g = ctx.createLinearGradient(W / 2 - 70, 0, W / 2 + 70, 0);
        g.addColorStop(0, "#22d3ee"); g.addColorStop(1, "#0e7490");
        ctx.fillStyle = g; ctx.fill();
        api.text("提交", W / 2, H - 42, { size: 14, weight: 700, color: "#fff" });
      });
    }
  });

  /* ---------------- 激光镜像 ---------------- */
  GB.add({
    id: "mirrorlaser", name: "激光镜像", cat: "puzzle", icon: "🪞", tags: ["new"],
    desc: "放置反射镜把激光引到靶心", tip: "点击格子切换 / 与 \\ 镜面", w: 480, h: 520,
    colors: ["#2a1f45", "#0a0814"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const N = 7, cell = 54, ox = (W - cell * N) / 2, oy = 92;
      let mir, em, tgt, obstacles, beam, lit, moves;
      function level() {
        mir = {};
        em = { r: Math.floor(Math.random() * N), c: -1 };
        tgt = { r: Math.floor(Math.random() * N), c: N };
        obstacles = new Set();
        for (let i = 0; i < 5; i++) {
          const r = Math.floor(Math.random() * N), c = Math.floor(Math.random() * N);
          if (r === em.r || (r === tgt.r && c === N - 1)) continue;
          obstacles.add(r * N + c);
        }
        beam = []; lit = false; moves = 0;
      }
      level();
      function trace() {
        const out = [];
        let r = em.r, c = 0, dr = 0, dc = 1;
        for (let s = 0; s < 200; s++) {
          if (c < 0 || c >= N || r < 0 || r >= N) return { out: out, hit: c >= N && r === tgt.r };
          out.push({ r: r, c: c });
          if (obstacles.has(r * N + c)) return { out: out, hit: false };
          const m = mir[r * N + c];
          if (m === "/") { const t = dr; dr = -dc; dc = -t; }
          else if (m === "\\") { const t = dr; dr = dc; dc = t; }
          r += dr; c += dc;
        }
        return { out: out, hit: false };
      }
      api.onDown((p) => {
        const c = Math.floor((p.x - ox) / cell), r = Math.floor((p.y - oy) / cell);
        if (c < 0 || c >= N || r < 0 || r >= N) return;
        const k = r * N + c;
        if (obstacles.has(k)) return;
        const cur = mir[k];
        if (cur === "/") mir[k] = "\\";
        else if (cur === "\\") delete mir[k];
        else { mir[k] = "/"; moves++; }
        api.beep(620, .05, "square", .035);
        const res = trace();
        if (res.hit && !lit) { lit = true; api.addScore(100); api.beep(900, .1, "sine", .06); }
      });
      api.loop(() => {
        const res = trace();
        api.clear("#0a0814");
        api.text("激光镜像 · 用镜子把光束送到右侧靶心", W / 2, 30, { size: 12, weight: 700, color: "#c4b5fd" });
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const x = ox + c * cell, y = oy + r * cell, k = r * N + c;
          api.rr(x + 2, y + 2, cell - 4, cell - 4, 6);
          ctx.fillStyle = obstacles.has(k) ? "rgba(255,92,138,.22)" : "rgba(255,255,255,.045)";
          ctx.fill();
          if (obstacles.has(k)) api.text("▨", x + cell / 2, y + cell / 2, { size: 20, color: "#ff7a95" });
          if (mir[k]) api.text(mir[k] === "/" ? "／" : "＼", x + cell / 2, y + cell / 2, { size: 26, weight: 800, color: "#22d3ee" });
        }
        ctx.strokeStyle = "rgba(255,255,255,.09)";
        for (let i = 0; i <= N; i++) {
          ctx.beginPath(); ctx.moveTo(ox + i * cell, oy); ctx.lineTo(ox + i * cell, oy + N * cell); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ox, oy + i * cell); ctx.lineTo(ox + N * cell, oy + i * cell); ctx.stroke();
        }
        ctx.fillStyle = "#ff5c8a";
        ctx.beginPath(); ctx.arc(ox - 16, oy + em.r * cell + cell / 2, 8, 0, 7); ctx.fill();
        ctx.fillStyle = "#34d399";
        ctx.beginPath(); ctx.arc(ox + N * cell + 16, oy + tgt.r * cell + cell / 2, 10 + Math.sin(api.t * 5) * 2, 0, 7); ctx.fill();
        ctx.strokeStyle = "rgba(255,92,138,.9)"; ctx.lineWidth = 3;
        ctx.beginPath();
        res.out.forEach((o, i) => {
          const x = ox + o.c * cell + cell / 2, y = oy + o.r * cell + cell / 2;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        if (res.hit) {
          const last = res.out[res.out.length - 1];
          ctx.lineTo(ox + N * cell + 16, oy + last.r * cell + cell / 2);
          if (!lit) { lit = true; api.addScore(60); }
        }
        ctx.stroke();
        ctx.lineWidth = 1;
        if (res.hit) api.text("命中！再放几关试试 · 得分 " + api.score, W / 2, H - 18, { size: 12, weight: 700, color: "#6ee7b7" });
        else api.text("点击格子放置 / 切换镜面", W / 2, H - 18, { size: 11, color: "#5f6a80" });
        if (res.hit && !api._n && api.t > 1.2) { api._n = 1; setTimeout(() => { level(); api._n = 0; }, 900); }
      });
    }
  });

  /* ---------------- 数织 ---------------- */
  function nonogramGame(id, name, rows, icon) {
    const n = rows[0].length;
    GB.add({
      id, name, cat: "puzzle", icon, desc: n + "×" + n + " 逻辑填色", tags: ["new"],
      tip: "点击循环：填格 → 标记 → 空白", w: 480, h: 560, colors: ["#1d2b44", "#080d16"],
      init(api) {
        const ctx = api.ctx, W = api.w, H = api.h;
        const sol = rows.map((s) => s.split("").map((c) => c === "#"));
        const clue = (arr) => {
          const out = []; let run = 0;
          arr.forEach((v) => { if (v) run++; else if (run) { out.push(run); run = 0; } });
          if (run) out.push(run);
          return out.length ? out : [0];
        };
        const rowClues = sol.map((r) => clue(r));
        const colClues = [];
        for (let c = 0; c < n; c++) colClues.push(clue(sol.map((r) => r[c])));
        const cell = Math.min((W - 120) / n, (H - 140) / n);
        const ox = 104, oy = 100;
        const st = Array.from({ length: n * n }, () => 0);
        api.onDown((p) => {
          const c = Math.floor((p.x - ox) / cell), r = Math.floor((p.y - oy) / cell);
          if (c < 0 || c >= n || r < 0 || r >= n) return;
          const k = r * n + c;
          st[k] = (st[k] + 1) % 3;
          api.beep(500 + st[k] * 120, .04, "sine", .035);
          const okAll = st.every((v, i) => (v === 1) === sol[Math.floor(i / n)][i % n]);
          if (okAll) api.over("图案完成！", "解开 " + n + "×" + n + " 数织", true);
        });
        api.loop(() => {
          api.clear("#080d16");
          api.text("数织 " + n + "×" + n, W / 2, 26, { size: 12.5, weight: 700, color: "#93a4ff" });
          for (let r = 0; r < n; r++) {
            api.text(rowClues[r].join(" "), ox - 12, oy + r * cell + cell / 2, { size: 11, weight: 700, color: "#7d8ba5", align: "right" });
          }
          for (let c = 0; c < n; c++) {
            api.text(colClues[c].join(" "), ox + c * cell + cell / 2, oy - 12, { size: 11, weight: 700, color: "#7d8ba5" });
          }
          for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
            const k = r * n + c, x = ox + c * cell, y = oy + r * cell;
            api.rr(x + 1, y + 1, cell - 2, cell - 2, 4);
            ctx.fillStyle = st[k] === 1 ? "#7c5cff" : st[k] === 2 ? "rgba(255,92,138,.16)" : "rgba(255,255,255,.05)";
            ctx.fill();
            if (st[k] === 2) api.text("×", x + cell / 2, y + cell / 2, { size: cell * .42, color: "#ff7a95" });
          }
        });
      }
    });
  }
  nonogramGame("nonogram5", "数织 5×5", [
    ".#.#.",
    "#####",
    "#####",
    ".#.#.",
    "..#.."
  ], "🟪");
  nonogramGame("nonogram8", "数织 8×8", [
    "..####..",
    ".######.",
    "##.##.##",
    "########",
    "########",
    "##.##.##",
    ".######.",
    "..####.."
  ], "🟪");

  /* ---------------- 二进制谜题 ---------------- */
  GB.add({
    id: "binarypuz", name: "二进制谜题", cat: "puzzle", icon: "0️⃣", tags: ["new"],
    desc: "每行每列 0 与 1 数量相同且不能三连", tip: "点击单元格切换 空 → 0 → 1", w: 480, h: 540,
    colors: ["#1b3348", "#07121a"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const N = 6, cell = 56, ox = (W - cell * N) / 2, oy = 100;
      let sol, st, bad;
      function gen() {
        for (let attempt = 0; attempt < 500; attempt++) {
          const g = [];
          for (let r = 0; r < N; r++) g.push(shuffle([0, 0, 0, 1, 1, 1]));
          let ok = true;
          for (let r = 0; r < N && ok; r++) for (let c = 0; c < N; c++) {
            if (c >= 2 && g[r][c] === g[r][c - 1] && g[r][c] === g[r][c - 2]) ok = false;
          }
          for (let c = 0; c < N && ok; c++) {
            let ones = 0;
            for (let r = 0; r < N; r++) {
              ones += g[r][c];
              if (r >= 2 && g[r][c] === g[r - 1][c] && g[r][c] === g[r - 2][c]) ok = false;
            }
            if (ones !== 3) ok = false;
          }
          if (ok) return g;
        }
        return null;
      }
      sol = gen() || [[0, 1, 0, 1, 1, 0], [1, 0, 1, 0, 1, 0], [0, 1, 1, 0, 0, 1], [1, 1, 0, 0, 1, 0], [0, 0, 1, 1, 0, 1], [1, 0, 0, 1, 0, 1]];
      st = sol.map((r) => r.map((v) => Math.random() < .45 ? v : -1));
      bad = 0;
      api.onDown((p) => {
        const c = Math.floor((p.x - ox) / cell), r = Math.floor((p.y - oy) / cell);
        if (c < 0 || c >= N || r < 0 || r >= N) return;
        st[r][c] = st[r][c] === -1 ? 0 : st[r][c] === 0 ? 1 : -1;
        api.beep(480 + st[r][c] * 200, .04, "square", .035);
        const full = st.every((row, r2) => row.every((v, c2) => v === sol[r2][c2]));
        if (full) api.over("完美破解！", "二进制谜题完成", true);
      });
      api.loop(() => {
        api.clear("#07121a");
        api.text("二进制谜题 · 行列 0/1 各半，禁止三连", W / 2, 28, { size: 12, weight: 700, color: "#7dd3e8" });
        api.text("点击切换：空 → 0 → 1", W / 2, 52, { size: 11, color: "#57708a" });
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const x = ox + c * cell, y = oy + r * cell, v = st[r][c];
          api.rr(x + 2, y + 2, cell - 4, cell - 4, 8);
          ctx.fillStyle = v === -1 ? "rgba(255,255,255,.045)" : v === 0 ? "rgba(34,211,238,.2)" : "rgba(124,92,255,.28)";
          ctx.fill();
          if (v >= 0) {
            const wrong = v !== sol[r][c];
            api.text(String(v), x + cell / 2, y + cell / 2, { size: 26, weight: 800, color: wrong ? "#ff5c8a" : (v ? "#c4b5fd" : "#7dd3e8") });
          }
        }
      });
    }
  });

  /* ---------------- 汉诺塔工厂 ---------------- */
  function hanoiGame(id, name, pegs, disks, desc) {
    GB.add({
      id, name, cat: "puzzle", icon: "🗼", desc, tags: ["new"],
      tip: "先点塔柱拿起，再点目标柱放下", w: 480, h: 480, colors: ["#2b2438", "#0b0912"],
      init(api) {
        const ctx = api.ctx, W = api.w, H = api.h;
        const baseY = H - 70, pegH = 240;
        let towers, sel, moves;
        towers = Array.from({ length: pegs }, () => []);
        for (let d = disks; d >= 1; d--) towers[0].push(d);
        sel = -1; moves = 0;
        const px = (i) => (W / (pegs + 1)) * (i + 1);
        api.onDown((p) => {
          let idx = -1;
          for (let i = 0; i < pegs; i++) if (Math.abs(p.x - px(i)) < W / (pegs + 1) / 2) idx = i;
          if (idx < 0) return;
          if (sel < 0) {
            if (towers[idx].length) { sel = idx; api.beep(520, .05, "sine", .04); }
          } else if (sel === idx) { sel = -1; }
          else {
            const from = towers[sel], to = towers[idx];
            if (!from.length) { sel = -1; return; }
            if (!to.length || to[to.length - 1] > from[from.length - 1]) {
              to.push(from.pop()); moves++;
              api.beep(660, .06, "sine", .04);
              api.setScore(Math.max(0, 2000 - moves * 10));
              sel = -1;
              if (towers[pegs - 1].length === disks) api.over("通关！", "用了 " + moves + " 步", true);
            } else { api.bad(); sel = -1; }
          }
        });
        api.loop(() => {
          api.clear("#0b0912");
          api.text(disks + " 盘 / " + pegs + " 柱 · 步数 " + moves, W / 2, 26, { size: 12, weight: 700, color: "#c4b5fd" });
          for (let i = 0; i < pegs; i++) {
            const x = px(i);
            ctx.fillStyle = "#3b3350";
            ctx.fillRect(x - 5, baseY - pegH, 10, pegH);
            ctx.fillStyle = "#4b4166";
            ctx.fillRect(x - 46, baseY, 92, 8);
            const tw = towers[i];
            tw.forEach((d, k) => {
              const w = 26 + (d / disks) * 70;
              const y = baseY - 16 - k * 18;
              api.rr(x - w / 2, y - 16, w, 16, 6);
              const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
              const hue = 265 - (d / disks) * 110;
              g.addColorStop(0, "hsl(" + hue + ",75%,66%)");
              g.addColorStop(1, "hsl(" + hue + ",65%,46%)");
              ctx.fillStyle = i === sel && k === tw.length - 1 ? "#fbbf24" : g;
              ctx.fill();
            });
          }
          if (sel >= 0 && towers[sel].length) {
            const d = towers[sel][towers[sel].length - 1];
            const w = 26 + (d / disks) * 70;
            api.rr(px(sel) - w / 2, 70, w, 16, 6);
            ctx.fillStyle = "#fbbf24"; ctx.fill();
          }
        });
      }
    });
  }
  hanoiGame("hanoi4", "汉诺塔 4 柱", 4, 5, "四根柱子，五层圆盘");
  hanoiGame("hanoi6", "汉诺塔 6 盘", 3, 6, "经典三柱六盘挑战");
  hanoiGame("hanoi5p", "汉诺塔 5 柱", 5, 5, "五柱五盘，策略更重要");

  /* ---------------- 三角跳棋 ---------------- */
  GB.add({
    id: "pegtri", name: "三角跳棋", cat: "puzzle", icon: "🔺", tags: ["new"],
    desc: "隔子跳跃，最后只剩一颗", tip: "点棋子再点空位跳过相邻棋子", w: 480, h: 480,
    colors: ["#233a2f", "#08120e"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const N = 5, sp = 74, oy = 110;
      const holes = [];
      for (let r = 0; r < N; r++) for (let c = 0; c <= r; c++) holes.push({ r: r, c: c, x: W / 2 + (c - r / 2) * sp, y: oy + r * sp * .82, on: true });
      holes[0].on = false;
      let sel = null, moves = 0, dead = false;
      const at = (r, c) => holes.find((h) => h.r === r && h.c === c);
      const jumps = (h) => {
        const dirs = [[0, -2], [0, 2], [2, 0], [2, 1], [-2, -2], [-2, -1]];
        const out = [];
        dirs.forEach(([dr, dc]) => {
          const m = at(h.r + dr / 2, h.c + dc / 2), t = at(h.r + dr, h.c + dc);
          if (m && t && m.on && !t.on) out.push(t);
        });
        return out;
      };
      api.onDown((p) => {
        if (dead) return;
        let pick = null;
        holes.forEach((h) => { if (Math.hypot(p.x - h.x, p.y - h.y) < 26) pick = h; });
        if (!pick) return;
        if (sel) {
          if (pick.on) { sel = pick; return; }
          const m = at((sel.r + pick.r) / 2, (sel.c + pick.c) / 2);
          if (m && m.on && Math.abs(sel.r - pick.r) <= 2 && Math.abs(sel.c - pick.c) <= 2) {
            sel.on = false; m.on = false; pick.on = true;
            sel = pick; moves++; api.beep(700, .07, "sine", .04);
            api.setScore(moves * 10);
            const remain = holes.filter((h) => h.on).length;
            if (remain === 1) { dead = true; api.over("只剩一颗！", "用了 " + moves + " 步", true); return; }
            if (!holes.some((h) => h.on && jumps(h).length)) { dead = true; api.over("无路可走", "还剩 " + remain + " 颗棋子", false); }
          } else { api.bad(); sel = pick; }
        } else if (pick.on) sel = pick;
      });
      api.loop(() => {
        api.clear("#08120e");
        api.text("三角跳棋 · 步数 " + moves + " · 剩余 " + holes.filter((h) => h.on).length, W / 2, 30, { size: 12, weight: 700, color: "#6ee7b7" });
        holes.forEach((h) => {
          ctx.fillStyle = h.on ? (sel === h ? "#fbbf24" : "#34d399") : "rgba(255,255,255,.06)";
          ctx.beginPath(); ctx.arc(h.x, h.y, h.on ? 22 : 16, 0, 7); ctx.fill();
          if (h.on) {
            ctx.fillStyle = "rgba(255,255,255,.35)";
            ctx.beginPath(); ctx.arc(h.x - 6, h.y - 6, 6, 0, 7); ctx.fill();
          }
        });
        if (sel) {
          ctx.strokeStyle = "rgba(251,191,36,.6)"; ctx.lineWidth = 2;
          jumps(sel).forEach((t) => { ctx.beginPath(); ctx.moveTo(sel.x, sel.y); ctx.lineTo(t.x, t.y); ctx.stroke(); });
          ctx.lineWidth = 1;
        }
      });
    }
  });

  /* ---------------- 点灯工厂 ---------------- */
  function lightsGame(id, name, N, icon) {
    GB.add({
      id, name, cat: "puzzle", icon, desc: N + "×" + N + " 点灯，点亮全部格子", tags: ["new"],
      tip: "点击会翻转自身与上下左右", w: 480, h: 520, colors: ["#2a2a1f", "#0d0d08"],
      init(api) {
        const ctx = api.ctx, W = api.w, H = api.h;
        const cell = Math.min((W - 60) / N, (H - 120) / N), ox = (W - cell * N) / 2, oy = 80;
        let g, moves;
        g = Array.from({ length: N * N }, () => 1);
        for (let i = 0; i < N * N * 3; i++) {
          const k = Math.floor(Math.random() * N * N);
          toggle(k);
        }
        moves = 0;
        function toggle(k) {
          const r = Math.floor(k / N), c = k % N;
          [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
            const rr2 = r + dr, cc = c + dc;
            if (rr2 >= 0 && rr2 < N && cc >= 0 && cc < N) g[rr2 * N + cc] ^= 1;
          });
        }
        api.onDown((p) => {
          const c = Math.floor((p.x - ox) / cell), r = Math.floor((p.y - oy) / cell);
          if (c < 0 || c >= N || r < 0 || r >= N) return;
          toggle(r * N + c); moves++;
          api.beep(560, .05, "sine", .04);
          api.setScore(Math.max(0, N * N * 12 - moves * 5));
          if (g.every((v) => v === 1)) api.over("全部点亮！", "用了 " + moves + " 步", true);
        });
        api.loop(() => {
          api.clear("#0d0d08");
          api.text("点灯 " + N + "×" + N + " · 步数 " + moves, W / 2, 32, { size: 12.5, weight: 700, color: "#ffd166" });
          for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
            const k = r * N + c, x = ox + c * cell, y = oy + r * cell;
            api.rr(x + 4, y + 4, cell - 8, cell - 8, 10);
            if (g[k]) {
              const grd = ctx.createRadialGradient(x + cell / 2, y + cell / 2, 2, x + cell / 2, y + cell / 2, cell * .7);
              grd.addColorStop(0, "#fff3b0"); grd.addColorStop(.6, "#fbbf24"); grd.addColorStop(1, "#a16207");
              ctx.fillStyle = grd; ctx.fill();
            } else {
              ctx.fillStyle = "rgba(255,255,255,.055)"; ctx.fill();
              ctx.strokeStyle = "rgba(255,255,255,.09)"; ctx.stroke();
            }
          }
        });
      }
    });
  }
  lightsGame("lights7", "点灯 7×7", 7, "💡");
  lightsGame("lights9", "点灯 9×9", 9, "💡");

  /* ---------------- 水排序 2 ---------------- */
  GB.add({
    id: "watersort2", name: "水排序·进阶", cat: "puzzle", icon: "🧪", tags: ["new"],
    desc: "把同色液体倒进同一支试管", tip: "点试管拿起，再点另一支倒入", w: 480, h: 560,
    colors: ["#173a4a", "#08161c"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const COLORS = ["#ff5c8a", "#22d3ee", "#fbbf24", "#34d399", "#a78bfa", "#fb923c"];
      const TUBES = 8, CAP = 4, TW = 44, TH = 172;
      let tubes, sel, moves;
      tubes = COLORS.map((c) => [c, c, c, c]);
      tubes.push([], []);
      for (let i = 0; i < 300; i++) {
        const a = Math.floor(Math.random() * tubes.length), b = Math.floor(Math.random() * tubes.length);
        if (a === b || !tubes[a].length) continue;
        if (tubes[b].length < CAP) tubes[b].push(tubes[a].pop());
      }
      sel = -1; moves = 0;
      const gx = (i) => 42 + i * (TW + 10) + (i > 3 ? 8 : 0);
      const gy = 190;
      function top(t) { return t[t.length - 1]; }
      api.onDown((p) => {
        let idx = -1;
        for (let i = 0; i < tubes.length; i++) if (hit(p, gx(i) - 6, gy, TW + 12, TH + 20)) idx = i;
        if (idx < 0) return;
        if (sel < 0) { if (tubes[idx].length) { sel = idx; api.beep(480, .05, "sine", .04); } return; }
        if (sel === idx) { sel = -1; return; }
        const from = tubes[sel], to = tubes[idx];
        const c = top(from);
        if (to.length < CAP && (!to.length || top(to) === c)) {
          to.push(from.pop()); moves++;
          api.beep(620, .06, "sine", .04);
          sel = -1;
          api.setScore(Math.max(0, 2000 - moves * 10));
          if (tubes.every((t) => !t.length || (t.length === CAP && t.every((x) => x === t[0])))) {
            api.over("全部分好了！", "用了 " + moves + " 步", true);
          }
        } else { api.bad(); sel = -1; }
      });
      api.loop(() => {
        api.clear("#08161c");
        api.text("水排序进阶 · 步数 " + moves, W / 2, 34, { size: 12.5, weight: 700, color: "#7dd3e8" });
        tubes.forEach((t, i) => {
          const x = gx(i), y = gy;
          ctx.fillStyle = "rgba(255,255,255,.05)";
          ctx.fillRect(x, y, TW, TH);
          api.rr(x, y + TH - 4, TW, 18, 9); ctx.fill();
          ctx.strokeStyle = sel === i ? "rgba(251,191,36,.9)" : "rgba(255,255,255,.16)";
          ctx.lineWidth = sel === i ? 2 : 1.4;
          ctx.strokeRect(x, y, TW, TH);
          ctx.lineWidth = 1;
          t.forEach((col, k) => {
            const bh = (TH - 8) / CAP;
            const by = y + TH - (k + 1) * bh;
            api.rr(x + 3, by + 1, TW - 6, bh - 2, 5);
            ctx.fillStyle = col; ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,.18)";
            ctx.fillRect(x + 7, by + 4, 6, bh - 10);
          });
        });
        api.text("把同色倒在一起，每管 4 格", W / 2, 46, { size: 11, color: "#57708a" });
        api.text("已完成 " + tubes.filter((t) => t.length === CAP && t.every((x) => x === t[0])).length + "/6", W / 2, H - 24, { size: 12, weight: 700, color: "#6ee7b7" });
      });
    }
  });

  /* ---------------- 数字连线 ---------------- */
  GB.add({
    id: "numberlink", name: "数字连线", cat: "puzzle", icon: "🔗", tags: ["new"],
    desc: "把同色端点用路径连起来", tip: "从端点拖到另一个端点", w: 480, h: 560,
    colors: ["#26304a", "#090c16"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const N = 5, cell = 72, ox = (W - cell * N) / 2, oy = 108;
      const PAIRS = [
        { id: 0, color: "#ff5c8a", a: [0, 0], b: [4, 4] },
        { id: 1, color: "#22d3ee", a: [0, 4], b: [4, 0] },
        { id: 2, color: "#fbbf24", a: [4, 2], b: [0, 2] }
      ];
      let paths, dragging;
      paths = {}; dragging = null;
      const key = (r, c) => r * N + c;
      const owner = (r, c) => {
        for (const k in paths) if (paths[k].some((p) => p[0] === r && p[1] === c)) return +k;
        return -1;
      };
      const isEnd = (r, c) => PAIRS.find((p) => (p.a[0] === r && p.a[1] === c) || (p.b[0] === r && p.b[1] === c));
      function tryStart(p) {
        const c = Math.floor((p.x - ox) / cell), r = Math.floor((p.y - oy) / cell);
        if (c < 0 || c >= N || r < 0 || r >= N) return;
        for (const pr of PAIRS) {
          if ((pr.a[0] === r && pr.a[1] === c) || (pr.b[0] === r && pr.b[1] === c)) {
            paths[pr.id] = [[r, c]];
            dragging = pr.id;
            return;
          }
        }
        const own = owner(r, c);
        if (own >= 0) { paths[own] = [[r, c]]; dragging = own; }
      }
      function extend(p) {
        if (dragging == null) return;
        const c = Math.floor((p.x - ox) / cell), r = Math.floor((p.y - oy) / cell);
        if (c < 0 || c >= N || r < 0 || r >= N) return;
        const path = paths[dragging];
        const last = path[path.length - 1];
        if (last[0] === r && last[1] === c) return;
        if (Math.abs(last[0] - r) + Math.abs(last[1] - c) !== 1) return;
        const pr = PAIRS[dragging];
        const isTargetEnd = (pr.a[0] === r && pr.a[1] === c) || (pr.b[0] === r && pr.b[1] === c);
        const other = owner(r, c);
        if (other >= 0 && other !== dragging) return;
        if (!isTargetEnd && paths[dragging].some((q) => q[0] === r && q[1] === c)) return;
        path.push([r, c]);
        if (isTargetEnd && path.length > 1) {
          dragging = null;
          api.addScore(60); api.beep(820, .08, "sine", .05);
          if (PAIRS.every((p2) => connected(p2))) api.over("全部连通！", "三条路径全部完成", true);
        }
      }
      function connected(pr) {
        const path = paths[pr.id] || [];
        if (path.length < 2) return false;
        const a = path[0], b = path[path.length - 1];
        const e1 = pr.a, e2 = pr.b;
        return (a[0] === e1[0] && a[1] === e1[1] && b[0] === e2[0] && b[1] === e2[1]) ||
          (b[0] === e1[0] && b[1] === e1[1] && a[0] === e2[0] && a[1] === e2[1]);
      }
      api.onDown(tryStart);
      api.onMove(extend);
      api.onUp(() => { dragging = null; });
      api.loop(() => {
        api.clear("#090c16");
        api.text("数字连线 · 从端点拖到另一个端点", W / 2, 34, { size: 12, weight: 700, color: "#93a4ff" });
        api.text("路径不能交叉，已连 " + PAIRS.filter((p) => connected(p)).length + "/3", W / 2, 54, { size: 11, color: "#57708a" });
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const x = ox + c * cell, y = oy + r * cell;
          api.rr(x + 3, y + 3, cell - 6, cell - 6, 8);
          ctx.fillStyle = "rgba(255,255,255,.04)"; ctx.fill();
        }
        PAIRS.forEach((pr) => {
          const path = paths[pr.id] || [];
          ctx.strokeStyle = pr.color; ctx.lineWidth = 12; ctx.lineCap = "round"; ctx.lineJoin = "round";
          if (path.length > 1) {
            ctx.beginPath();
            path.forEach(([r, c], i) => {
              const x = ox + c * cell + cell / 2, y = oy + r * cell + cell / 2;
              if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.globalAlpha = .75; ctx.stroke(); ctx.globalAlpha = 1;
          }
          ctx.lineWidth = 1;
          [pr.a, pr.b].forEach(([r, c]) => {
            const x = ox + c * cell + cell / 2, y = oy + r * cell + cell / 2;
            ctx.fillStyle = pr.color;
            ctx.beginPath(); ctx.arc(x, y, 20, 0, 7); ctx.fill();
            ctx.fillStyle = "rgba(0,0,0,.35)";
            ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill();
          });
        });
      });
    }
  });

  /* ---------------- 随机迷宫 ---------------- */
  GB.add({
    id: "mazebig", name: "随机迷宫", cat: "puzzle", icon: "🌀", tags: ["new"],
    desc: "每次都是新迷宫，走到出口", tip: "方向键 / 摇杆移动", w: 560, h: 560,
    colors: ["#20303f", "#080f14"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const COLS = 17, ROWS = 17, top = 46;
      const cell = Math.min((W - 24) / COLS, (H - top - 74) / ROWS);
      const ox = (W - cell * COLS) / 2, oy = top;
      const walls = [];
      for (let i = 0; i < COLS * ROWS; i++) walls.push({ t: 1, r: 1, b: 1, l: 1, v: false });
      const at = (r, c) => (r < 0 || c < 0 || r >= ROWS || c >= COLS) ? null : walls[r * COLS + c];
      const stack = [[0, 0]];
      at(0, 0).v = true;
      while (stack.length) {
        const [r, c] = stack[stack.length - 1];
        const opts = [];
        [[0, 1, "r", "l"], [0, -1, "l", "r"], [1, 0, "b", "t"], [-1, 0, "t", "b"]].forEach(([dr, dc, w1, w2]) => {
          const n = at(r + dr, c + dc);
          if (n && !n.v) opts.push([r + dr, c + dc, w1, w2]);
        });
        if (!opts.length) { stack.pop(); continue; }
        const [nr, nc, w1, w2] = opts[Math.floor(Math.random() * opts.length)];
        at(r, c)[w1] = 0; at(nr, nc)[w2] = 0; at(nr, nc).v = true;
        stack.push([nr, nc]);
      }
      let pr = 0, pc = 0, t0 = 0, steps = 0, done = false;
      const move = (dr, dc) => {
        if (done) return;
        if (!t0) t0 = performance.now();
        const cur = at(pr, pc);
        if (dr === 1 && !cur.b) { pr++; } else if (dr === -1 && !cur.t) { pr--; }
        else if (dc === 1 && !cur.r) { pc++; } else if (dc === -1 && !cur.l) { pc--; }
        else return;
        steps++; api.beep(420, .03, "sine", .025);
        if (pr === ROWS - 1 && pc === COLS - 1) {
          done = true;
          const secs = (performance.now() - t0) / 1000;
          api.setScore(Math.max(50, Math.round(1400 - secs * 18 - steps * 2)));
          api.over("走出迷宫！", "用时 " + secs.toFixed(1) + " 秒 · " + steps + " 步", true);
        }
      };
      api.onKey((k) => {
        if (k === "ArrowUp" || k === "w") move(-1, 0);
        if (k === "ArrowDown" || k === "s") move(1, 0);
        if (k === "ArrowLeft" || k === "a") move(0, -1);
        if (k === "ArrowRight" || k === "d") move(0, 1);
      });
      api.dpad((d) => { if (d === "U") move(-1, 0); if (d === "D") move(1, 0); if (d === "L") move(0, -1); if (d === "R") move(0, 1); });
      api.loop(() => {
        api.clear("#080f14");
        api.text("随机迷宫 17×17 · 步数 " + steps, W / 2, 24, { size: 12, weight: 700, color: "#7dd3e8" });
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const w = at(r, c), x = ox + c * cell, y = oy + r * cell;
          if (r === ROWS - 1 && c === COLS - 1) { ctx.fillStyle = "rgba(52,211,153,.3)"; ctx.fillRect(x, y, cell, cell); }
          if (r === 0 && c === 0) { ctx.fillStyle = "rgba(124,92,255,.3)"; ctx.fillRect(x, y, cell, cell); }
          ctx.strokeStyle = "rgba(125,211,232,.55)"; ctx.lineWidth = 2;
          if (w.t) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cell, y); ctx.stroke(); }
          if (w.l) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cell); ctx.stroke(); }
          if (r === ROWS - 1 && w.b) { ctx.beginPath(); ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
          if (c === COLS - 1 && w.r) { ctx.beginPath(); ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
        }
        ctx.lineWidth = 1;
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath(); ctx.arc(ox + pc * cell + cell / 2, oy + pr * cell + cell / 2, cell * .28, 0, 7); ctx.fill();
        api.text("方向键 / 摇杆移动", W / 2, H - 18, { size: 11, color: "#4f5b70" });
      });
    }
  });

  /* ---------------- 色块填充 ---------------- */
  GB.add({
    id: "colorfill", name: "色块填充", cat: "puzzle", icon: "🎨", tags: ["new"],
    desc: "从左上角蔓延，把全图染成同色", tip: "点下方色块切换颜色", w: 480, h: 560,
    colors: ["#2f2340", "#0d0914"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const N = 8, COLS = ["#ff5c8a", "#22d3ee", "#fbbf24", "#34d399", "#a78bfa"];
      const cell = Math.min((W - 40) / N, (H - 170) / N), ox = (W - cell * N) / 2, oy = 64;
      let g, moves, left;
      g = Array.from({ length: N * N }, () => COLS[Math.floor(Math.random() * COLS.length)]);
      moves = 0; left = 24;
      function flood(col) {
        const start = g[0];
        if (start === col) return;
        const seen = new Set([0]);
        const st = [0];
        g[0] = col;
        while (st.length) {
          const k = st.pop();
          const r = Math.floor(k / N), c = k % N;
          [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
            const rr2 = r + dr, cc = c + dc;
            if (rr2 < 0 || rr2 >= N || cc < 0 || cc >= N) return;
            const nk = rr2 * N + cc;
            if (seen.has(nk) || g[nk] !== start) return;
            seen.add(nk); g[nk] = col; st.push(nk);
          });
        }
        moves++; left--;
        api.setScore(Math.max(0, left * 40 + 200));
        if (g.every((v) => v === col)) api.over("全图同色！", "用了 " + moves + " 步", true);
        else if (left <= 0) api.over("步数用尽", "还剩 " + (g.length - g.filter((v) => v === g[0]).length) + " 格", false);
      }
      api.onDown((p) => {
        for (let i = 0; i < COLS.length; i++) {
          const x = 26 + i * ((W - 52) / COLS.length), y = oy + cell * N + 26;
          if (hit(p, x, y, (W - 52) / COLS.length - 10, 54)) { flood(COLS[i]); api.beep(520 + i * 90, .05, "sine", .04); return; }
        }
      });
      api.loop(() => {
        api.clear("#0d0914");
        api.text("色块填充 · 剩余步数 " + left, W / 2, 30, { size: 12.5, weight: 700, color: "#c4b5fd" });
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          ctx.fillStyle = g[r * N + c];
          ctx.fillRect(ox + c * cell, oy + r * cell, cell - 1, cell - 1);
        }
        ctx.strokeStyle = "rgba(255,255,255,.12)";
        ctx.strokeRect(ox, oy, cell * N, cell * N);
        COLS.forEach((col, i) => {
          const bw = (W - 52) / COLS.length, x = 26 + i * bw, y = oy + cell * N + 26;
          api.rr(x, y, bw - 10, 54, 10);
          ctx.fillStyle = col; ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.stroke();
        });
      });
    }
  });

  /* ---------------- 球排序 ---------------- */
  GB.add({
    id: "ballsort", name: "球排序", cat: "puzzle", icon: "🔴", tags: ["new"],
    desc: "把同色球堆到同一支试管", tip: "点试管取球，再点另一支放下", w: 480, h: 560,
    colors: ["#1e2f44", "#080e16"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const COLS = ["#ff5c8a", "#22d3ee", "#fbbf24", "#34d399", "#a78bfa", "#fb923c"];
      const CAP = 4, TW = 44, TH = 170;
      let tubes, sel, moves;
      tubes = COLS.map((c) => [c, c, c, c]);
      tubes.push([], []);
      for (let i = 0; i < 400; i++) {
        const a = Math.floor(Math.random() * tubes.length), b = Math.floor(Math.random() * tubes.length);
        if (a === b || !tubes[a].length || tubes[b].length >= CAP) continue;
        tubes[b].push(tubes[a].pop());
      }
      sel = -1; moves = 0;
      const gx = (i) => (W / 4) * (i % 4 + .5) - TW / 2 + (i > 3 ? 0 : -3);
      const gy = (i) => (i > 3 ? 340 : 110);
      function done(t) { return t.length === CAP && t.every((x) => x === t[0]); }
      api.onDown((p) => {
        let idx = -1;
        for (let i = 0; i < tubes.length; i++) if (hit(p, gx(i) - 8, gy(i), TW + 16, TH + 16)) idx = i;
        if (idx < 0) return;
        if (sel < 0) { if (tubes[idx].length) { sel = idx; api.beep(500, .05, "sine", .04); } return; }
        if (sel === idx) { sel = -1; return; }
        const from = tubes[sel], to = tubes[idx], c = from[from.length - 1];
        if (to.length < CAP && (!to.length || to[to.length - 1] === c)) {
          to.push(from.pop()); moves++; sel = -1;
          api.beep(640, .06, "sine", .04);
          api.setScore(Math.max(0, 2400 - moves * 8));
          if (tubes.filter(done).length >= COLS.length) api.over("全部分好！", "用了 " + moves + " 步", true);
        } else { api.bad(); sel = -1; }
      });
      api.loop(() => {
        api.clear("#080e16");
        api.text("球排序 · 步数 " + moves, W / 2, 30, { size: 12.5, weight: 700, color: "#7dd3e8" });
        tubes.forEach((t, i) => {
          const x = gx(i), y = gy(i);
          api.rr(x, y, TW, TH, 10);
          ctx.fillStyle = "rgba(255,255,255,.045)"; ctx.fill();
          ctx.strokeStyle = sel === i ? "rgba(251,191,36,.9)" : "rgba(255,255,255,.14)";
          ctx.lineWidth = sel === i ? 2 : 1.3; ctx.stroke(); ctx.lineWidth = 1;
          t.forEach((col, k) => {
            const bh = (TH - 10) / CAP;
            const cy = y + TH - 6 - (k + .5) * bh;
            ctx.fillStyle = col;
            ctx.beginPath(); ctx.arc(x + TW / 2, cy, Math.min(TW / 2 - 5, bh / 2 - 2), 0, 7); ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,.35)";
            ctx.beginPath(); ctx.arc(x + TW / 2 - 5, cy - 5, 4, 0, 7); ctx.fill();
          });
        });
        api.text("完成 " + tubes.filter(done).length + "/6", W / 2, H - 26, { size: 12, weight: 700, color: "#6ee7b7" });
      });
    }
  });

  /* ---------------- 方块拼图 ---------------- */
  GB.add({
    id: "blockfit", name: "方块拼图", cat: "puzzle", icon: "🧩", tags: ["new"],
    desc: "把三块方块放进 8×8 棋盘并消行", tip: "点选方块，再点棋盘放置", w: 480, h: 620,
    colors: ["#2b2b46", "#0a0a14"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const N = 8, cell = 46, ox = (W - cell * N) / 2, oy = 64;
      const SHAPES = [
        [[1, 1], [1, 1]],
        [[1, 1, 1]],
        [[1], [1], [1]],
        [[1, 1, 1, 1]],
        [[1], [1], [1], [1]],
        [[1, 0], [1, 0], [1, 1]],
        [[0, 1], [0, 1], [1, 1]],
        [[1, 1, 1], [0, 1, 0]],
        [[1, 1, 0], [0, 1, 1]],
        [[0, 1, 1], [1, 1, 0]],
        [[1, 0], [1, 1]],
        [[1, 1], [1, 0]]
      ];
      let board, pieces, sel, over;
      function newPieces() {
        pieces = [];
        for (let i = 0; i < 3; i++) {
          const s = SHAPES[Math.floor(Math.random() * SHAPES.length)];
          pieces.push({ s: s, used: false, color: "hsl(" + Math.floor(Math.random() * 60 + 250) + ",70%,62%)" });
        }
        sel = 0;
      }
      board = Array.from({ length: N * N }, () => 0);
      newPieces(); over = false;
      function canPlace(shape, r0, c0) {
        for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          const rr2 = r0 + r, cc = c0 + c;
          if (rr2 >= N || cc >= N) return false;
          if (board[rr2 * N + cc]) return false;
        }
        return true;
      }
      function place(shape, r0, c0, col) {
        shape.forEach((row, r) => row.forEach((v, c) => { if (v) board[(r0 + r) * N + c0 + c] = col; }));
        let cleared = 0;
        for (let r = 0; r < N; r++) {
          if (Array.from({ length: N }, (_, c) => board[r * N + c]).every(Boolean)) {
            for (let c = 0; c < N; c++) board[r * N + c] = 0;
            cleared++;
          }
        }
        for (let c = 0; c < N; c++) {
          if (Array.from({ length: N }, (_, r) => board[r * N + c]).every(Boolean)) {
            for (let r = 0; r < N; r++) board[r * N + c] = 0;
            cleared++;
          }
        }
        api.addScore(4 + cleared * 25);
        if (cleared) { api.beep(880, .12, "triangle", .06); api.hint("消除 " + cleared + " 线 +" + cleared * 25); }
        else api.beep(420, .05, "sine", .03);
      }
      function anyMove() {
        return pieces.some((p) => !p.used && (() => {
          for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (canPlace(p.s, r, c)) return true;
          return false;
        })());
      }
      api.onDown((p) => {
        if (over) return;
        for (let i = 0; i < pieces.length; i++) {
          const px = 30 + i * 150, py = oy + cell * N + 26;
          if (hit(p, px, py, 128, 92) && !pieces[i].used) { sel = i; api.beep(520, .05, "sine", .035); return; }
        }
        if (sel < 0 || !pieces[sel] || pieces[sel].used) return;
        const c = Math.floor((p.x - ox) / cell), r = Math.floor((p.y - oy) / cell);
        if (r < 0 || c < 0 || r >= N || c >= N) return;
        if (!canPlace(pieces[sel].s, r, c)) { api.bad(); return; }
        place(pieces[sel].s, r, c, pieces[sel].color);
        pieces[sel].used = true;
        sel = pieces.findIndex((q) => !q.used);
        if (pieces.every((q) => q.used)) newPieces();
        if (!anyMove()) { over = true; api.over("放不下了", "得分 " + api.score, false); }
      });
      api.loop(() => {
        api.clear("#0a0a14");
        api.text("方块拼图 · 填满一行或一列即可消除", W / 2, 28, { size: 12, weight: 700, color: "#a99cf0" });
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const x = ox + c * cell, y = oy + r * cell;
          api.rr(x + 1, y + 1, cell - 2, cell - 2, 6);
          ctx.fillStyle = board[r * N + c] || "rgba(255,255,255,.04)";
          ctx.fill();
        }
        pieces.forEach((p, i) => {
          const px = 30 + i * 150, py = oy + cell * N + 26;
          api.rr(px, py, 128, 92, 12);
          ctx.fillStyle = p.used ? "rgba(255,255,255,.03)" : sel === i ? "rgba(124,92,255,.2)" : "rgba(255,255,255,.05)";
          ctx.fill();
          if (p.used) return;
          const s = p.s, cs = 20;
          const w = s[0].length * cs, h = s.length * cs;
          s.forEach((row, r) => row.forEach((v, c) => {
            if (!v) return;
            api.rr(px + 64 - w / 2 + c * cs, py + 46 - h / 2 + r * cs, cs - 2, cs - 2, 4);
            ctx.fillStyle = p.color; ctx.fill();
          }));
        });
      });
    }
  });

  /* ---------------- 2048 工厂 ---------------- */
  function game2048(id, name, N, icon, desc) {
    GB.add({
      id, name, cat: "puzzle", icon, desc, tags: ["new"],
      tip: "方向键 / 滑动移动合并相同数字", w: 480, h: 560, colors: ["#2a2436", "#0c0a12"],
      init(api) {
        const ctx = api.ctx, W = api.w, H = api.h;
        const cell = Math.min((W - 60) / N, (H - 150) / N), ox = (W - cell * N) / 2, oy = 70;
        let g, moved, won;
        g = Array.from({ length: N * N }, () => 0);
        won = false;
        function add() {
          const empty = g.map((v, i) => v ? -1 : i).filter((i) => i >= 0);
          if (!empty.length) return;
          g[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < .9 ? 2 : 4;
        }
        add(); add();
        function step(dir) {
          const before = g.join(",");
          const idx = (r, c) => r * N + c;
          const lines = [];
          for (let i = 0; i < N; i++) {
            const line = [];
            for (let j = 0; j < N; j++) {
              if (dir === 0) line.push(idx(j, i));
              if (dir === 1) line.push(idx(N - 1 - j, i));
              if (dir === 2) line.push(idx(i, j));
              if (dir === 3) line.push(idx(i, N - 1 - j));
            }
            lines.push(line);
          }
          lines.forEach((line) => {
            let vals = line.map((i) => g[i]).filter(Boolean);
            for (let i = 0; i < vals.length - 1; i++) {
              if (vals[i] === vals[i + 1]) { vals[i] *= 2; vals.splice(i + 1, 1); }
            }
            while (vals.length < N) vals.push(0);
            line.forEach((i, k) => { g[i] = vals[k]; });
          });
          if (g.join(",") !== before) { add(); api.beep(400, .04, "sine", .03); check(); }
        }
        function check() {
          const max = Math.max.apply(null, g);
          api.setScore(max);
          if (max >= 2048 && !won) { won = true; api.over("达成 2048！", "最大方块 " + max, true); return; }
          let can = g.some((v) => !v);
          if (!can) {
            for (let r = 0; r < N && !can; r++) for (let c = 0; c < N && !can; c++) {
              const v = g[r * N + c];
              if (r + 1 < N && g[(r + 1) * N + c] === v) can = true;
              if (c + 1 < N && g[r * N + c + 1] === v) can = true;
            }
          }
          if (!can) api.over("无处可动", "最大方块 " + max, false);
        }
        api.onKey((k) => {
          if (k === "ArrowUp" || k === "w") step(0);
          if (k === "ArrowDown" || k === "s") step(1);
          if (k === "ArrowLeft" || k === "a") step(2);
          if (k === "ArrowRight" || k === "d") step(3);
        });
        let sx = 0, sy = 0;
        api.onDown((p) => { sx = p.x; sy = p.y; });
        api.onUp((p) => {
          const dx = p.x - sx, dy = p.y - sy;
          if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
          if (Math.abs(dx) > Math.abs(dy)) step(dx > 0 ? 3 : 2); else step(dy > 0 ? 1 : 0);
        });
        api.loop(() => {
          api.clear("#0c0a12");
          api.text("最大 " + Math.max.apply(null, g) + " · " + N + "×" + N, W / 2, 30, { size: 12.5, weight: 700, color: "#d7c9ff" });
          for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
            const v = g[r * N + c], x = ox + c * cell, y = oy + r * cell;
            api.rr(x + 3, y + 3, cell - 6, cell - 6, 8);
            if (!v) ctx.fillStyle = "rgba(255,255,255,.045)";
            else {
              const k = Math.min(11, Math.log2(v));
              ctx.fillStyle = "hsl(" + (265 - k * 18) + ",70%," + (30 + k * 4) + "%)";
            }
            ctx.fill();
            if (v) api.text(String(v), x + cell / 2, y + cell / 2, { size: cell * (v > 999 ? .26 : .32), weight: 800, color: "#fff" });
          }
          api.text("方向键 / 滑动合并", W / 2, H - 22, { size: 11, color: "#5f6a80" });
        });
      }
    });
  }
  game2048("g2048big", "2048 五阶", 5, "🔢", "5×5 棋盘，上手更宽松");
  game2048("g2048tiny", "2048 三阶", 3, "🔢", "3×3 极限，几步就满");
})();
