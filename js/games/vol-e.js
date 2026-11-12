/* ==========================================================
   vol-e.js — 棋牌对弈扩展 8 款
   ========================================================== */
(function () {
  "use strict";

  const hit = (p, x, y, w, h) => p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;

  /* ---------------- 1. 国际跳棋 ---------------- */
  GB.add({
    id: "checkers", name: "国际跳棋", cat: "board", icon: "⚪", tags: ["new"],
    desc: "斜走斜吃，走到对方底线成王", tip: "点自己的棋子，再点目标格", w: 520, h: 560,
    colors: ["#1a3a2c", "#08120d"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const N = 8, cell = 58, ox = (W - cell * N) / 2, oy = 64;
      let b, sel, turn, aiTimer, over;
      b = Array.from({ length: N }, () => Array(N).fill(0));
      for (let r = 0; r < 3; r++) for (let c = 0; c < N; c++) if ((r + c) % 2 === 1) b[r][c] = 2;
      for (let r = 5; r < 8; r++) for (let c = 0; c < N; c++) if ((r + c) % 2 === 1) b[r][c] = 1;
      sel = null; turn = 1; aiTimer = 0; over = false;
      const isP = (v) => v === 1 || v === 3;
      const isA = (v) => v === 2 || v === 4;
      function movesFor(r, c) {
        const v = b[r][c];
        if (!v) return [];
        const player = isP(v), king = v > 2;
        const dirs = [];
        if (player || king) dirs.push([-1, -1], [-1, 1]);
        if (!player || king) dirs.push([1, -1], [1, 1]);
        const out = [];
        for (const [dr, dc] of dirs) {
          const r1 = r + dr, c1 = c + dc, r2 = r + dr * 2, c2 = c + dc * 2;
          if (r1 >= 0 && r1 < N && c1 >= 0 && c1 < N) {
            const t = b[r1][c1];
            if (!t) out.push({ r: r1, c: c1, cap: null });
            else if ((player ? isA(t) : isP(t)) && r2 >= 0 && r2 < N && c2 >= 0 && c2 < N && !b[r2][c2]) {
              out.push({ r: r2, c: c2, cap: [r1, c1] });
            }
          }
        }
        return out;
      }
      function allMoves(player) {
        const list = [];
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const v = b[r][c];
          if (!v || (player ? !isP(v) : !isA(v))) continue;
          movesFor(r, c).forEach((m) => list.push({ from: [r, c], r: m.r, c: m.c, cap: m.cap }));
        }
        return list;
      }
      function apply(m) {
        const r = m.from[0], c = m.from[1], tr = m.r, tc = m.c;
        let v = b[r][c];
        b[r][c] = 0;
        if (m.cap) b[m.cap[0]][m.cap[1]] = 0;
        if (v === 1 && tr === 0) v = 3;
        if (v === 2 && tr === N - 1) v = 4;
        b[tr][tc] = v;
        api.beep(m.cap ? 620 : 480, .06, "sine", .04);
      }
      function endCheck() {
        const pMoves = allMoves(true), aMoves = allMoves(false);
        if (!aMoves.length) { over = true; api.over("你赢了！", "对手无棋可走", true); return true; }
        if (!pMoves.length) { over = true; api.over("你输了", "无棋可走", false); return true; }
        return false;
      }
      function aiMove() {
        if (over) return;
        const list = allMoves(false);
        if (!list.length) { endCheck(); return; }
        const caps = list.filter((m) => m.cap);
        const pick = caps.length ? api.pick(caps) : api.pick(list);
        apply(pick);
        turn = 1;
        endCheck();
      }
      api.onDown((p) => {
        if (over || turn !== 1) return;
        const c = Math.floor((p.x - ox) / cell), r = Math.floor((p.y - oy) / cell);
        if (c < 0 || c >= N || r < 0 || r >= N) return;
        if (sel) {
          const m = movesFor(sel[0], sel[1]).find((q) => q.r === r && q.c === c);
          if (m) {
            apply({ from: sel, r: m.r, c: m.c, cap: m.cap });
            sel = null;
            if (endCheck()) return;
            turn = 2; aiTimer = .42;
            return;
          }
        }
        if (isP(b[r][c])) sel = [r, c];
        else sel = null;
      });
      api.loop((dt) => {
        if (aiTimer > 0 && turn === 2) {
          aiTimer -= dt;
          if (aiTimer <= 0) aiMove();
        }
        api.clear("#08120d");
        api.text("国际跳棋 · 你执白 · 走到对方底线成王", W / 2, 30, { size: 12, weight: 700, color: "#6ee7b7" });
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const x = ox + c * cell, y = oy + r * cell;
          ctx.fillStyle = (r + c) % 2 ? "#16362a" : "#1f4a38";
          ctx.fillRect(x, y, cell, cell);
          if (sel && sel[0] === r && sel[1] === c) {
            ctx.fillStyle = "rgba(251,191,36,.35)"; ctx.fillRect(x, y, cell, cell);
          }
          const v = b[r][c];
          if (v) {
            ctx.fillStyle = v === 1 || v === 3 ? "#e8eef7" : "#2b2b33";
            ctx.beginPath(); ctx.arc(x + cell / 2, y + cell / 2, cell * .33, 0, 7); ctx.fill();
            ctx.strokeStyle = v === 1 || v === 3 ? "#94a3b8" : "#000";
            ctx.stroke();
            if (v > 2) api.text("♛", x + cell / 2, y + cell / 2 + 1, { size: 20, color: v === 3 ? "#7c5cff" : "#fbbf24" });
          }
        }
        if (sel) {
          movesFor(sel[0], sel[1]).forEach((m) => {
            ctx.fillStyle = "rgba(52,211,153,.5)";
            ctx.beginPath(); ctx.arc(ox + m.c * cell + cell / 2, oy + m.r * cell + cell / 2, 8, 0, 7); ctx.fill();
          });
        }
        api.text(turn === 1 ? "轮到你走" : "对手思考中…", W / 2, H - 20, { size: 11.5, color: "#5f7167" });
      });
    }
  });

  /* ---------------- 2. 点格棋 ---------------- */
  GB.add({
    id: "dotsboxes", name: "点格棋", cat: "board", icon: "▦", tags: ["new"],
    desc: "画线围格子，围到最多的获胜", tip: "点击两点之间的位置画线", w: 500, h: 580,
    colors: ["#22304a", "#080d16"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const D = 5, cell = 78, ox = (W - cell * (D - 1)) / 2, oy = 96;
      let hE, vE, box, turn, score, aiTimer, over;
      hE = Array.from({ length: D }, () => Array(D - 1).fill(false));
      vE = Array.from({ length: D - 1 }, () => Array(D).fill(false));
      box = Array.from({ length: D - 1 }, () => Array(D - 1).fill(0));
      turn = 1; score = [0, 0]; aiTimer = 0; over = false;
      function drawH(r, c) { if (hE[r][c]) return false; hE[r][c] = true; return claim(); }
      function drawV(r, c) { if (vE[r][c]) return false; vE[r][c] = true; return claim(); }
      function claim() {
        let got = 0;
        for (let r = 0; r < D - 1; r++) for (let c = 0; c < D - 1; c++) {
          if (box[r][c]) continue;
          if (hE[r][c] && hE[r + 1][c] && vE[r][c] && vE[r][c + 1]) {
            box[r][c] = turn; score[turn - 1]++; got++;
          }
        }
        if (got) api.beep(760, .1, "triangle", .06);
        else api.beep(420, .05, "sine", .035);
        api.setScore(score[0]);
        return got > 0;
      }
      function allDone() {
        return hE.every((row) => row.every(Boolean)) && vE.every((row) => row.every(Boolean));
      }
      function finish() {
        over = true;
        const win = score[0] > score[1];
        api.over(win ? "你赢了！" : score[0] === score[1] ? "平局" : "你输了", score[0] + " : " + score[1], win);
      }
      function aiTurn() {
        const opts = [];
        for (let r = 0; r < D; r++) for (let c = 0; c < D - 1; c++) if (!hE[r][c]) opts.push({ t: "h", r: r, c: c });
        for (let r = 0; r < D - 1; r++) for (let c = 0; c < D; c++) if (!vE[r][c]) opts.push({ t: "v", r: r, c: c });
        if (!opts.length) { finish(); return; }
        let pick = null;
        for (const o of opts) {
          if (o.t === "h") {
            const up = o.r > 0 && hE[o.r - 1][o.c] && vE[o.r - 1][o.c] && vE[o.r - 1][o.c + 1];
            const dn = o.r < D - 1 && hE[o.r + 1][o.c] && vE[o.r][o.c] && vE[o.r][o.c + 1];
            if (up || dn) { pick = o; break; }
          } else {
            const lf = o.c > 0 && vE[o.r][o.c - 1] && hE[o.r][o.c - 1] && hE[o.r + 1][o.c - 1];
            const rt = o.c < D - 1 && vE[o.r][o.c + 1] && hE[o.r][o.c] && hE[o.r + 1][o.c];
            if (lf || rt) { pick = o; break; }
          }
        }
        if (!pick) pick = api.pick(opts);
        const got = pick.t === "h" ? drawH(pick.r, pick.c) : drawV(pick.r, pick.c);
        if (!got) turn = 1;
        if (allDone()) finish();
        else if (!got) turn = 1; else aiTimer = .5;
      }
      api.onDown((p) => {
        if (over || turn !== 1) return;
        let best = null, bd = 26;
        for (let r = 0; r < D; r++) for (let c = 0; c < D - 1; c++) {
          if (hE[r][c]) continue;
          const d = Math.abs(p.x - (ox + (c + .5) * cell)) + Math.abs(p.y - (oy + r * cell));
          if (d < bd) { bd = d; best = { t: "h", r: r, c: c }; }
        }
        for (let r = 0; r < D - 1; r++) for (let c = 0; c < D; c++) {
          if (vE[r][c]) continue;
          const d = Math.abs(p.x - (ox + c * cell)) + Math.abs(p.y - (oy + (r + .5) * cell));
          if (d < bd) { bd = d; best = { t: "v", r: r, c: c }; }
        }
        if (!best) return;
        const got = best.t === "h" ? drawH(best.r, best.c) : drawV(best.r, best.c);
        if (allDone()) { finish(); return; }
        if (!got) { turn = 2; aiTimer = .5; }
      });
      api.loop((dt) => {
        if (turn === 2 && aiTimer > 0) {
          aiTimer -= dt;
          if (aiTimer <= 0) aiTurn();
        }
        api.clear("#080d16");
        api.text("点格棋 · 你 " + score[0] + " : " + score[1] + " 电脑", W / 2, 30, { size: 13, weight: 700, color: "#93a4ff" });
        api.text(turn === 1 ? "轮到你画线，围到格子可再走一次" : "电脑思考中…", W / 2, 56, { size: 11, color: "#5f6a80" });
        for (let r = 0; r < D - 1; r++) for (let c = 0; c < D - 1; c++) {
          if (!box[r][c]) continue;
          ctx.fillStyle = box[r][c] === 1 ? "rgba(124,92,255,.22)" : "rgba(255,92,138,.18)";
          ctx.fillRect(ox + c * cell + 4, oy + r * cell + 4, cell - 8, cell - 8);
        }
        ctx.strokeStyle = "rgba(255,255,255,.14)";
        for (let r = 0; r < D - 1; r++) for (let c = 0; c < D - 1; c++) {
          if (!box[r][c]) continue;
          api.text(box[r][c] === 1 ? "你" : "电", ox + c * cell + cell / 2, oy + r * cell + cell / 2, { size: 15, weight: 700, color: box[r][c] === 1 ? "#c4b5fd" : "#ff9db4" });
        }
        for (let r = 0; r < D; r++) for (let c = 0; c < D - 1; c++) {
          ctx.strokeStyle = hE[r][c] ? "#7c5cff" : "rgba(255,255,255,.1)";
          ctx.lineWidth = hE[r][c] ? 4 : 1;
          ctx.beginPath(); ctx.moveTo(ox + c * cell, oy + r * cell); ctx.lineTo(ox + (c + 1) * cell, oy + r * cell); ctx.stroke();
        }
        for (let r = 0; r < D - 1; r++) for (let c = 0; c < D; c++) {
          ctx.strokeStyle = vE[r][c] ? "#7c5cff" : "rgba(255,255,255,.1)";
          ctx.lineWidth = vE[r][c] ? 4 : 1;
          ctx.beginPath(); ctx.moveTo(ox + c * cell, oy + r * cell); ctx.lineTo(ox + c * cell, oy + (r + 1) * cell); ctx.stroke();
        }
        ctx.lineWidth = 1;
        for (let r = 0; r < D; r++) for (let c = 0; c < D; c++) {
          ctx.fillStyle = "#cbd5e1";
          ctx.beginPath(); ctx.arc(ox + c * cell, oy + r * cell, 4.5, 0, 7); ctx.fill();
        }
      });
    }
  });

  /* ---------------- 3. 播棋 ---------------- */
  GB.add({
    id: "mancala", name: "播棋", cat: "board", icon: "🫘", tags: ["new"],
    desc: "轮流播种石子，抢到更多的一方获胜", tip: "点自己这侧的坑位播种", w: 520, h: 520,
    colors: ["#3a2c1e", "#120d07"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let pits, turn, aiTimer, over, msg;
      pits = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0];
      turn = 1; aiTimer = 0; over = false; msg = "你的回合";
      function sow(i, side) {
        let n = pits[i];
        pits[i] = 0;
        const skip = side === 1 ? 13 : 12;
        let idx = i;
        while (n > 0) {
          idx = (idx + 1) % 14;
          if (idx === skip) continue;
          pits[idx]++; n--;
        }
        api.beep(520, .05, "sine", .035);
        // 落入自己空坑，抓取对面
        const own = side === 1 ? idx >= 0 && idx <= 5 : idx >= 6 && idx <= 11;
        if (own && pits[idx] === 1) {
          const opp = 12 - idx;
          if (pits[opp] > 0) {
            const store = side === 1 ? 12 : 13;
            pits[store] += pits[opp] + 1;
            pits[opp] = 0; pits[idx] = 0;
            api.beep(820, .09, "triangle", .05);
          }
        }
        const store = side === 1 ? 12 : 13;
        api.setScore(pits[12]);
        if (idx === store) { msg = "落入自己的仓库，再来一次！"; return true; }
        return false;
      }
      function empty(side) {
        if (side === 1) return pits.slice(0, 6).every((v) => !v);
        return pits.slice(6, 12).every((v) => !v);
      }
      function finish() {
        over = true;
        for (let i = 0; i < 6; i++) { pits[12] += pits[i]; pits[i] = 0; }
        for (let i = 6; i < 12; i++) { pits[13] += pits[i]; pits[i] = 0; }
        const win = pits[12] > pits[13];
        api.over(win ? "你赢了！" : pits[12] === pits[13] ? "平局" : "你输了", pits[12] + " : " + pits[13], win);
      }
      function aiTurn() {
        const opts = [];
        for (let i = 6; i < 12; i++) if (pits[i]) opts.push(i);
        if (!opts.length) { finish(); return; }
        const i = api.pick(opts);
        const again = sow(i, 2);
        if (empty(1) || empty(2)) finish();
        else if (!again) { turn = 1; msg = "你的回合"; }
        else aiTimer = .5;
      }
      api.onDown((p) => {
        if (over || turn !== 1) return;
        const c = Math.floor((p.x - 70) / 73);
        if (c < 0 || c > 5) return;
        if (!hit(p, 70 + c * 73, H - 230, 66, 120)) return;
        if (!pits[c]) return;
        const again = sow(c, 1);
        if (empty(1) || empty(2)) { finish(); return; }
        if (!again) { turn = 2; aiTimer = .55; msg = "电脑回合"; }
      });
      api.loop((dt) => {
        if (turn === 2 && aiTimer > 0) {
          aiTimer -= dt;
          if (aiTimer <= 0) aiTurn();
        }
        api.clear("#120d07");
        api.text("播棋 · 你 " + pits[12] + " : " + pits[13] + " 电脑", W / 2, 30, { size: 13, weight: 700, color: "#ffd166" });
        api.text(msg, W / 2, 54, { size: 11, color: "#8b7a63" });
        // 棋盘
        api.rr(30, 84, W - 60, H - 130, 22);
        ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fill();
        // 仓库
        api.rr(40, 100, 52, H - 160, 20);
        ctx.fillStyle = "rgba(124,92,255,.2)"; ctx.fill();
        api.rr(W - 92, 100, 52, H - 160, 20);
        ctx.fillStyle = "rgba(255,92,138,.18)"; ctx.fill();
        api.text(pits[12], 66, H / 2, { size: 22, weight: 800, color: "#c4b5fd" });
        api.text(pits[13], W - 66, H / 2, { size: 22, weight: 800, color: "#ff9db4" });
        const drawPit = (i, x, y) => {
          api.rr(x, y, 66, 120, 14);
          ctx.fillStyle = "rgba(255,255,255,.055)"; ctx.fill();
          ctx.strokeStyle = turn === 1 && i < 6 ? "rgba(251,191,36,.5)" : "rgba(255,255,255,.08)";
          ctx.stroke();
          const n = pits[i];
          for (let k = 0; k < Math.min(12, n); k++) {
            const bx = x + 16 + (k % 3) * 17, by = y + 24 + Math.floor(k / 3) * 22;
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath(); ctx.arc(bx, by, 6, 0, 7); ctx.fill();
          }
          if (n > 12) api.text("+" + (n - 12), x + 33, y + 104, { size: 10, color: "#fbbf24" });
        };
        for (let i = 0; i < 6; i++) drawPit(11 - i, 100 + i * 73 - 30, 100);
        for (let i = 0; i < 6; i++) drawPit(i, 100 + i * 73 - 30, H - 230);
        api.text("你", 108, H - 132, { size: 11, color: "#8b7a63", align: "left" });
        api.text("电脑", 108, 92, { size: 11, color: "#8b7a63", align: "left" });
      });
    }
  });

  /* ---------------- 4. 猜单词 ---------------- */
  GB.add({
    id: "hangman", name: "猜单词", cat: "board", icon: "🔡", tags: ["new"],
    desc: "六次机会猜出英文单词", tip: "点字母，猜错会画出绞架", w: 480, h: 560,
    colors: ["#1d2f44", "#070d15"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const BANK = [
        ["ELEPHANT", "大象"], ["PUMPKIN", "南瓜"], ["DIAMOND", "钻石"], ["KITCHEN", "厨房"],
        ["GIRAFFE", "长颈鹿"], ["HOLIDAY", "假期"], ["MONSTER", "怪物"], ["PENCIL", "铅笔"],
        ["BICYCLE", "自行车"], ["CANDLE", "蜡烛"], ["FOREST", "森林"], ["WINTER", "冬天"]
      ];
      let word, hint, guessed, wrong, over, msg;
      const pick = api.pick(BANK);
      word = pick[0]; hint = pick[1];
      guessed = []; wrong = 0; over = false; msg = "";
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
      api.onDown((p) => {
        if (over) return;
        for (let i = 0; i < letters.length; i++) {
          const x = 26 + (i % 7) * 62, y = 356 + Math.floor(i / 7) * 56;
          if (!hit(p, x, y, 54, 46)) continue;
          const L = letters[i];
          if (guessed.indexOf(L) >= 0) return;
          guessed.push(L);
          if (word.indexOf(L) >= 0) {
            msg = "猜对了：" + L; api.beep(760, .07, "sine", .05);
            if (word.split("").every((ch) => guessed.indexOf(ch) >= 0)) api.over("猜出来了！", "答案：" + word, true);
          } else {
            wrong++; msg = L + " 不在单词里"; api.bad();
            if (wrong >= 6) api.over("机会用完了", "答案是 " + word, false);
          }
          return;
        }
      });
      api.loop(() => {
        api.clear("#070d15");
        api.text("猜单词 · 提示：" + hint + "（" + word.length + " 个字母）", W / 2, 30, { size: 12.5, weight: 700, color: "#93a4ff" });
        // 绞架
        ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(70, 340); ctx.lineTo(150, 340);
        ctx.moveTo(95, 340); ctx.lineTo(95, 110);
        ctx.moveTo(95, 110); ctx.lineTo(190, 110); ctx.lineTo(190, 138);
        ctx.stroke();
        ctx.lineStyle = 1;
        if (wrong > 0) { ctx.beginPath(); ctx.arc(190, 158, 20, 0, 7); ctx.stroke(); }
        if (wrong > 1) { ctx.beginPath(); ctx.moveTo(190, 178); ctx.lineTo(190, 248); ctx.stroke(); }
        if (wrong > 2) { ctx.beginPath(); ctx.moveTo(190, 196); ctx.lineTo(160, 226); ctx.stroke(); }
        if (wrong > 3) { ctx.beginPath(); ctx.moveTo(190, 196); ctx.lineTo(220, 226); ctx.stroke(); }
        if (wrong > 4) { ctx.beginPath(); ctx.moveTo(190, 248); ctx.lineTo(164, 292); ctx.stroke(); }
        if (wrong > 5) { ctx.beginPath(); ctx.moveTo(190, 248); ctx.lineTo(216, 292); ctx.stroke(); }
        ctx.lineWidth = 1;
        const slotW = Math.min(46, (W - 60) / word.length);
        const sx = (W - slotW * word.length) / 2;
        for (let i = 0; i < word.length; i++) {
          const x = sx + i * slotW;
          ctx.strokeStyle = "rgba(255,255,255,.25)";
          ctx.beginPath(); ctx.moveTo(x + 4, 330); ctx.lineTo(x + slotW - 4, 330); ctx.stroke();
          if (guessed.indexOf(word[i]) >= 0) api.text(word[i], x + slotW / 2, 308, { size: 22, weight: 800, color: "#6ee7b7" });
        }
        letters.forEach((L, i) => {
          const x = 26 + (i % 7) * 62, y = 356 + Math.floor(i / 7) * 56;
          const used = guessed.indexOf(L) >= 0;
          const good = used && word.indexOf(L) >= 0;
          api.rr(x, y, 54, 46, 9);
          ctx.fillStyle = good ? "rgba(52,211,153,.25)" : used ? "rgba(255,92,138,.16)" : "rgba(255,255,255,.06)";
          ctx.fill();
          api.text(L, x + 27, y + 24, { size: 17, weight: 700, color: used ? (good ? "#6ee7b7" : "#ff8fa8") : "#dbe4ff" });
        });
        api.text(msg || ("剩余机会 " + (6 - wrong)), W / 2, H - 16, { size: 11.5, color: "#5f6a80" });
      });
    }
  });

  /* ---------------- 5. 海战棋 ---------------- */
  GB.add({
    id: "battleship", name: "海战棋", cat: "board", icon: "🚢", tags: ["new"],
    desc: "盲射对方舰队，先击沉者胜", tip: "点右侧敌方格射击", w: 500, h: 580,
    colors: ["#0f2c40", "#050d14"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const N = 8, CS = 24, gx1 = 22, gx2 = 258, gy = 118;
      let pGrid, aGrid, pShot, aShot, turn, aiTimer, over, msg;
      pGrid = Array.from({ length: N * N }, () => 0);
      aGrid = Array.from({ length: N * N }, () => 0);
      pShot = Array.from({ length: N * N }, () => 0);
      aShot = Array.from({ length: N * N }, () => 0);
      turn = 1; aiTimer = 0; over = false; msg = "轮到你开炮";
      function place(grid) {
        const sizes = [4, 3, 3, 2];
        for (const s of sizes) {
          for (let t = 0; t < 300; t++) {
            const hor = Math.random() < .5;
            const r0 = api.ri(0, hor ? N - 1 : N - s), c0 = api.ri(0, hor ? N - s : N - 1);
            const cells = [];
            let ok = true;
            for (let k = 0; k < s; k++) {
              const r = hor ? r0 : r0 + k, c = hor ? c0 + k : c0;
              const i = r * N + c;
              if (grid[i]) { ok = false; break; }
              // 周围不允许相邻
              for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
                const rr2 = r + dr, cc = c + dc;
                if (rr2 >= 0 && rr2 < N && cc >= 0 && cc < N && grid[rr2 * N + cc]) ok = false;
              }
              cells.push(i);
            }
            if (!ok) continue;
            cells.forEach((i) => { grid[i] = 1; });
            break;
          }
        }
      }
      place(pGrid); place(aGrid);
      function alive(grid, shots) {
        return grid.some((v, i) => v && !shots[i]);
      }
      function aiFire() {
        const opts = [];
        pGrid.forEach((v, i) => { if (!aShot[i]) opts.push(i); });
        if (!opts.length) return;
        // 简单策略：优先打上一发命中的邻格
        let pick = null;
        for (let i = 0; i < N * N; i++) {
          if (!aShot[i] || !pGrid[i]) continue;
          const r = Math.floor(i / N), c = i % N;
          [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
            const rr2 = r + dr, cc = c + dc;
            if (!pick && rr2 >= 0 && rr2 < N && cc >= 0 && cc < N && !aShot[rr2 * N + cc]) pick = rr2 * N + cc;
          });
          if (pick) break;
        }
        if (!pick) pick = api.pick(opts);
        aShot[pick] = pGrid[pick] ? 2 : 1;
        api.beep(pGrid[pick] ? 240 : 640, .08, "sine", .04);
        if (!alive(pGrid, aShot)) {
          over = true;
          api.over("舰队沉没了", "你击沉了 " + aGrid.filter((v, i) => v && pShot[i]).length + " 个目标", false);
        } else { turn = 1; msg = "轮到你开炮"; }
      }
      api.onDown((p) => {
        if (over || turn !== 1) return;
        const c = Math.floor((p.x - gx2) / CS), r = Math.floor((p.y - gy) / CS);
        if (c < 0 || c >= N || r < 0 || r >= N) return;
        const i = r * N + c;
        if (pShot[i]) return;
        pShot[i] = aGrid[i] ? 2 : 1;
        api.setScore(aGrid.filter((v, k) => v && pShot[k]).length * 25);
        api.beep(aGrid[i] ? 980 : 320, .08, "square", .045);
        if (!alive(aGrid, pShot)) {
          over = true;
          api.over("全歼敌舰！", "用 " + pShot.filter(Boolean).length + " 发炮弹", true);
          return;
        }
        turn = 2; aiTimer = .45; msg = "对手开炮中…";
      });
      api.loop((dt) => {
        if (turn === 2 && aiTimer > 0) {
          aiTimer -= dt;
          if (aiTimer <= 0) aiFire();
        }
        api.clear("#050d14");
        api.text("海战棋 · 命中 " + pShot.filter((v) => v === 2).length + " / 对手命中 " + aShot.filter((v) => v === 2).length, W / 2, 30, { size: 12.5, weight: 700, color: "#8fd3f4" });
        api.text("你的海域", gx1, 92, { size: 11, color: "#5f7c90", align: "left" });
        api.text("敌方海域", gx2, 92, { size: 11, color: "#5f7c90", align: "left" });
        const drawGrid = (x0, grid, shots, hide) => {
          for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
            const i = r * N + c, x = x0 + c * CS, y = gy + r * CS;
            ctx.fillStyle = "rgba(20,60,85,.55)";
            ctx.fillRect(x, y, CS - 2, CS - 2);
            if (!hide && grid[i]) { ctx.fillStyle = "rgba(148,163,184,.5)"; ctx.fillRect(x + 2, y + 2, CS - 6, CS - 6); }
            if (shots[i]) {
              const h = shots[i] === 2;
              ctx.fillStyle = h ? "rgba(255,92,138,.85)" : "rgba(255,255,255,.18)";
              ctx.beginPath(); ctx.arc(x + CS / 2 - 1, y + CS / 2 - 1, h ? 7 : 4, 0, 7); ctx.fill();
              if (h) {
                ctx.strokeStyle = "rgba(255,255,255,.8)";
                ctx.beginPath();
                ctx.moveTo(x + 5, y + 5); ctx.lineTo(x + CS - 7, y + CS - 7);
                ctx.moveTo(x + CS - 7, y + 5); ctx.lineTo(x + 5, y + CS - 7); ctx.stroke();
              }
            }
          }
          ctx.strokeStyle = "rgba(125,211,232,.18)";
          ctx.strokeRect(x0, gy, CS * N, CS * N);
        };
        drawGrid(gx1, pGrid, aShot, false);
        drawGrid(gx2, aGrid, pShot, true);
        api.text(msg, W / 2, H - 46, { size: 12, weight: 700, color: "#7dd3e8" });
        api.text("击沉全部 4 艘即获胜", W / 2, H - 22, { size: 10.5, color: "#4f6b7d" });
      });
    }
  });

  /* ---------------- 6. 取石子 ---------------- */
  GB.add({
    id: "nim", name: "取石子", cat: "board", icon: "🪨", tags: ["new"],
    desc: "每次取 1-3 颗，拿到最后一颗的人输", tip: "点数字取石子，想办法逼电脑拿最后一颗", w: 440, h: 520,
    colors: ["#2d3244", "#0a0c14"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let heap, turn, aiTimer, over, msg, last;
      heap = 21; turn = 1; aiTimer = 0; over = false; msg = "你先取"; last = 0;
      function take(n, who) {
        heap -= n;
        if (heap <= 0) {
          over = true;
          const win = who === 2;
          api.over(win ? "电脑拿到了最后一颗，你赢！" : "你拿到了最后一颗", "剩余 0 颗石子", win);
          return true;
        }
        api.beep(420 + n * 60, .06, "sine", .04);
        return false;
      }
      function aiTurn() {
        let n;
        const r = heap % 4;
        if (r === 1) n = api.ri(1, Math.min(3, heap));
        else n = Math.min(r - 1, 3);
        if (n < 1) n = 1;
        msg = "电脑取了 " + n + " 颗";
        if (take(n, 2)) return;
        turn = 1;
      }
      api.onDown((p) => {
        if (over || turn !== 1) return;
        for (let i = 0; i < 3; i++) {
          const x = W / 2 - 150 + i * 104, y = H - 90;
          if (hit(p, x, y, 96, 56)) {
            const n = i + 1;
            if (n > heap) return;
            msg = "你取了 " + n + " 颗";
            if (take(n, 1)) return;
            turn = 2; aiTimer = .6;
            return;
          }
        }
      });
      api.loop((dt) => {
        if (turn === 2 && aiTimer > 0) {
          aiTimer -= dt;
          if (aiTimer <= 0) aiTurn();
        }
        api.clear("#0a0c14");
        api.text("取石子 · 拿到最后一颗的人输", W / 2, 30, { size: 12.5, weight: 700, color: "#c4b5fd" });
        for (let i = 0; i < heap; i++) {
          const col = 7, per = 34;
          const x = W / 2 - (Math.min(heap, col) * per) / 2 + (i % col) * per;
          const y = 96 + Math.floor(i / col) * 34;
          ctx.fillStyle = "#94a3b8";
          ctx.beginPath(); ctx.arc(x + 12, y + 12, 11, 0, 7); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.28)";
          ctx.beginPath(); ctx.arc(x + 8, y + 8, 4, 0, 7); ctx.fill();
        }
        api.text("剩余 " + heap + " 颗", W / 2, 330, { size: 22, weight: 800, color: "#eef1f8" });
        api.text(msg, W / 2, 366, { size: 12, color: "#7d8ba5" });
        for (let i = 0; i < 3; i++) {
          const x = W / 2 - 150 + i * 104, y = H - 90;
          api.rr(x, y, 96, 56, 13);
          ctx.fillStyle = turn === 1 ? "rgba(124,92,255,.25)" : "rgba(255,255,255,.05)";
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.stroke();
          api.text("取 " + (i + 1), x + 48, y + 28, { size: 16, weight: 700 });
        }
        api.text("秘诀：尽量给对手留下 4 的倍数 + 1", W / 2, H - 20, { size: 10.5, color: "#4f5b70" });
      });
    }
  });

  /* ---------------- 7. 四子棋 5×5 ---------------- */
  GB.add({
    id: "ttt5", name: "四子棋 5×5", cat: "board", icon: "❌", tags: ["new"],
    desc: "在 5×5 棋盘上先连成四子", tip: "点击空位落子，电脑用白子", w: 480, h: 560,
    colors: ["#2c2a3f", "#0a0912"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const N = 5, cell = 76, ox = (W - cell * N) / 2, oy = 84;
      let g, turn, aiTimer, over, lastMove;
      g = Array.from({ length: N * N }, () => 0);
      turn = 1; aiTimer = 0; over = false; lastMove = -1;
      const LINES = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        if (c + 3 < N) LINES.push([r * N + c, r * N + c + 1, r * N + c + 2, r * N + c + 3]);
        if (r + 3 < N) LINES.push([r * N + c, (r + 1) * N + c, (r + 2) * N + c, (r + 3) * N + c]);
        if (r + 3 < N && c + 3 < N) LINES.push([r * N + c, (r + 1) * N + c + 1, (r + 2) * N + c + 2, (r + 3) * N + c + 3]);
        if (r + 3 < N && c - 3 >= 0) LINES.push([r * N + c, (r + 1) * N + c - 1, (r + 2) * N + c - 2, (r + 3) * N + c - 3]);
      }
      function winOf(side) {
        for (const L of LINES) if (L.every((i) => g[i] === side)) return L;
        return null;
      }
      function checkEnd() {
        const w1 = winOf(1), w2 = winOf(2);
        if (w1) { over = true; api.over("你连成四子！", "获胜", true); return true; }
        if (w2) { over = true; api.over("电脑连成四子", "再试一局", false); return true; }
        if (g.every(Boolean)) { over = true; api.over("平局", "棋盘下满了", false); return true; }
        return false;
      }
      function aiMove() {
        if (over) return;
        const empty = g.map((v, i) => v ? -1 : i).filter((i) => i >= 0);
        if (!empty.length) return;
        let pick = -1;
        for (const i of empty) { g[i] = 2; if (winOf(2)) pick = i; g[i] = 0; if (pick >= 0) break; }
        if (pick < 0) for (const i of empty) { g[i] = 1; if (winOf(1)) pick = i; g[i] = 0; if (pick >= 0) break; }
        if (pick < 0) {
          const mid = 12;
          pick = g[mid] ? api.pick(empty) : mid;
        }
        g[pick] = 2; lastMove = pick;
        if (checkEnd()) return;
        turn = 1;
      }
      api.onDown((p) => {
        if (over || turn !== 1) return;
        const c = Math.floor((p.x - ox) / cell), r = Math.floor((p.y - oy) / cell);
        if (c < 0 || c >= N || r < 0 || r >= N) return;
        const i = r * N + c;
        if (g[i]) return;
        g[i] = 1; lastMove = i; api.beep(620, .06, "sine", .045);
        if (checkEnd()) return;
        turn = 2; aiTimer = .45;
      });
      api.loop((dt) => {
        if (turn === 2 && aiTimer > 0) {
          aiTimer -= dt;
          if (aiTimer <= 0) aiMove();
        }
        api.clear("#0a0912");
        api.text("四子棋 5×5 · 连成四子获胜", W / 2, 34, { size: 12.5, weight: 700, color: "#c4b5fd" });
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const i = r * N + c, x = ox + c * cell, y = oy + r * cell;
          api.rr(x + 4, y + 4, cell - 8, cell - 8, 10);
          ctx.fillStyle = i === lastMove ? "rgba(124,92,255,.22)" : "rgba(255,255,255,.045)";
          ctx.fill();
          if (g[i] === 1) api.text("✕", x + cell / 2, y + cell / 2 + 2, { size: 38, weight: 800, color: "#7dd3e8" });
          if (g[i] === 2) api.text("○", x + cell / 2, y + cell / 2, { size: 38, weight: 800, color: "#ff8fa8" });
        }
        api.text(turn === 1 ? "你的回合（✕）" : "电脑思考中…", W / 2, H - 20, { size: 11.5, color: "#5f6a80" });
      });
    }
  });

  /* ---------------- 8. 黑白棋 6×6 ---------------- */
  GB.add({
    id: "reversi6", name: "黑白棋 6×6", cat: "board", icon: "⚫", tags: ["new"],
    desc: "夹住对方棋子把它翻成自己的颜色", tip: "点高亮格落子", w: 480, h: 580,
    colors: ["#1f3a2c", "#08120d"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const N = 6, cell = 70, ox = (W - cell * N) / 2, oy = 84;
      let g, turn, aiTimer, over, msg;
      g = Array.from({ length: N * N }, () => 0);
      g[2 * N + 2] = 2; g[3 * N + 3] = 2;
      g[2 * N + 3] = 1; g[3 * N + 2] = 1;
      turn = 1; aiTimer = 0; over = false; msg = "你执黑先行";
      const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
      function flips(i, side) {
        const r = Math.floor(i / N), c = i % N;
        if (g[i]) return [];
        const out = [];
        for (const [dr, dc] of DIRS) {
          const line = [];
          let rr2 = r + dr, cc = c + dc;
          while (rr2 >= 0 && rr2 < N && cc >= 0 && cc < N) {
            const k = rr2 * N + cc;
            if (!g[k]) break;
            if (g[k] === side) { if (line.length) out.push.apply(out, line); break; }
            line.push(k);
            rr2 += dr; cc += dc;
          }
        }
        return out;
      }
      function legal(side) {
        const out = [];
        for (let i = 0; i < N * N; i++) if (flips(i, side).length) out.push(i);
        return out;
      }
      function play(i, side) {
        const f = flips(i, side);
        if (!f.length) return false;
        g[i] = side;
        f.forEach((k) => { g[k] = side; });
        api.beep(520 + f.length * 30, .07, "sine", .045);
        api.setScore(g.filter((v) => v === 1).length);
        return true;
      }
      function count() {
        return [g.filter((v) => v === 1).length, g.filter((v) => v === 2).length];
      }
      function finish() {
        over = true;
        const [a, b] = count();
        api.over(a > b ? "你赢了！" : a === b ? "平局" : "你输了", a + " : " + b, a > b);
      }
      function aiMove() {
        if (over) return;
        const opts = legal(2);
        if (!opts.length) {
          if (!legal(1).length) { finish(); return; }
          turn = 1; msg = "电脑无法落子，你继续"; return;
        }
        let best = opts[0], bestV = -1;
        for (const i of opts) {
          const v = flips(i, 2).length + (i === 14 || i === 15 || i === 20 || i === 21 ? 2 : 0);
          if (v > bestV) { bestV = v; best = i; }
        }
        play(best, 2);
        if (!legal(1).length) { turn = 2; aiTimer = .5; msg = "你无法落子"; }
        else { turn = 1; msg = "你的回合"; }
        if (!legal(1).length && !legal(2).length) finish();
      }
      api.onDown((p) => {
        if (over || turn !== 1) return;
        const c = Math.floor((p.x - ox) / cell), r = Math.floor((p.y - oy) / cell);
        if (c < 0 || c >= N || r < 0 || r >= N) return;
        const i = r * N + c;
        if (!play(i, 1)) return;
        if (!legal(2).length) { turn = 1; msg = "电脑无法落子"; }
        else { turn = 2; aiTimer = .5; msg = "电脑思考中…"; }
        if (!legal(1).length && !legal(2).length) finish();
      });
      api.loop((dt) => {
        if (turn === 2 && aiTimer > 0) {
          aiTimer -= dt;
          if (aiTimer <= 0) aiMove();
        }
        const [a, b] = count();
        api.clear("#08120d");
        api.text("黑白棋 6×6 · 你 " + a + " : " + b + " 电脑", W / 2, 34, { size: 12.5, weight: 700, color: "#6ee7b7" });
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const i = r * N + c, x = ox + c * cell, y = oy + r * cell;
          ctx.fillStyle = "#17392b";
          ctx.fillRect(x, y, cell - 2, cell - 2);
          if (!g[i]) {
            if (turn === 1 && flips(i, 1).length) {
              ctx.fillStyle = "rgba(251,191,36,.22)";
              ctx.fillRect(x + 4, y + 4, cell - 10, cell - 10);
            }
            continue;
          }
          const cx = x + cell / 2 - 1, cy = y + cell / 2 - 1;
          ctx.fillStyle = g[i] === 1 ? "#111318" : "#f1f5f9";
          ctx.beginPath(); ctx.arc(cx, cy, cell * .36, 0, 7); ctx.fill();
          ctx.strokeStyle = g[i] === 1 ? "#3b4252" : "#94a3b8";
          ctx.stroke();
        }
        api.text(msg, W / 2, H - 20, { size: 11.5, color: "#5f7167" });
      });
    }
  });
})();
