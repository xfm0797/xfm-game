/* ==========================================================
   board.js — 棋牌游戏 13 款
   ========================================================== */
(function () {
  "use strict";

  /* ================= 五子棋 ================= */
  function gomokuGame(id, name, vsAI) {
    GB.add({
      id, name, cat: "board", icon: "⚫",
      desc: vsAI ? "和 AI 对弈的五子棋" : "同屏双人对弈五子棋",
      tip: "轮流落子 · 五子连线获胜",
      w: 520, h: 600, colors: ["#3a2a1a", "#160f08"],
      init(api) {
        const ctx = api.ctx, N = 13, S = 38;
        const OX = (520 - N * S) / 2, OY = 100;
        let b, turn, over, winLine, aiT;
        function reset() {
          b = new Array(N * N).fill(0);
          turn = 1; over = false; winLine = null;
        }
        function lines(i, p) {
          const x = i % N, y = Math.floor(i / N);
          const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
          for (const [dx, dy] of dirs) {
            const cells = [];
            for (let k = -4; k <= 4; k++) {
              const nx = x + dx * k, ny = y + dy * k;
              if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
              cells.push({ i: ny * N + nx, v: b[ny * N + nx] === p ? 1 : 0 });
            }
            let run = 0;
            for (let j = 0; j <= cells.length; j++) {
              if (j < cells.length && cells[j].v) run++;
              else {
                if (run >= 5) return cells.filter((c) => c.v).slice(-5);
                run = 0;
              }
            }
          }
          return null;
        }
        function place(i) {
          if (over || b[i]) return;
          b[i] = turn;
          api.beep(460, 0.05, "sine", 0.045, 560);
          const w = lines(i, turn);
          if (w) {
            over = true;
            winLine = w.map((c) => c.i);
            if (vsAI && turn === 1) api.setScore(api.score + 100);
            api.over(turn === 1 ? "黑棋胜！" : vsAI ? "白棋（AI）胜" : "白棋胜！", vsAI && turn === 1 ? "漂亮" : "", turn === 1);
            return;
          }
          if (b.every((v) => v)) { over = true; api.over("平局", "棋盘满了"); return; }
          turn = 3 - turn;
          if (vsAI && turn === 2) aiT = 0.35;
        }
        function aiMove() {
          let best = -1, bestScore = -1e9;
          const cand = [];
          for (let i = 0; i < N * N; i++) {
            if (b[i]) continue;
            const x = i % N, y = Math.floor(i / N);
            let near = false;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && ny >= 0 && nx < N && ny < N && b[ny * N + nx]) near = true;
            }
            if (near || b.some((v) => v) === false) cand.push(i);
          }
          const pool = cand.length ? cand : [Math.floor(N * N / 2)];
          for (const i of pool) {
            let s = 0;
            const x = i % N, y = Math.floor(i / N);
            const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
            for (const p of [2, 1]) {
              for (const [dx, dy] of dirs) {
                let cnt = 0, open = 0;
                for (let k = 1; k <= 4; k++) {
                  const nx = x + dx * k, ny = y + dy * k;
                  if (nx < 0 || ny < 0 || nx >= N || ny >= N) break;
                  if (b[ny * N + nx] === p) cnt++;
                  else { if (!b[ny * N + nx]) open++; break; }
                }
                for (let k = 1; k <= 4; k++) {
                  const nx = x - dx * k, ny = y - dy * k;
                  if (nx < 0 || ny < 0 || nx >= N || ny >= N) break;
                  if (b[ny * N + nx] === p) cnt++;
                  else { if (!b[ny * N + nx]) open++; break; }
                }
                s += (p === 2 ? 1.05 : 1) * Math.pow(10, cnt) * (open > 0 ? 1 : 0.3);
              }
            }
            if (s > bestScore) { bestScore = s; best = i; }
          }
          if (best >= 0) place(best);
        }
        api.onDown((p) => {
          const cx = Math.round((p.x - OX) / S), cy = Math.round((p.y - OY) / S);
          if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
          place(cy * N + cx);
        });
        reset();
        api.loop((dt) => {
          if (vsAI && aiT > 0 && !over) {
            aiT -= dt;
            if (aiT <= 0) aiMove();
          }
          api.clear("#160f08");
          api.text(vsAI ? "你执黑先行" : "黑方先行 · 同屏对战", 24, 44, { size: 13.5, weight: 700, color: "#e8c9a8", align: "left" });
          api.text(turn === 1 ? "轮到黑棋" : "轮到白棋", 456, 44, { size: 13, color: "#8a6d3a", align: "right" });
          ctx.strokeStyle = "rgba(232,201,168,.25)"; ctx.lineWidth = 1;
          for (let i = 0; i < N; i++) {
            ctx.beginPath(); ctx.moveTo(OX + i * S, OY); ctx.lineTo(OX + i * S, OY + (N - 1) * S); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(OX, OY + i * S); ctx.lineTo(OX + (N - 1) * S, OY + i * S); ctx.stroke();
          }
          for (let i = 0; i < N * N; i++) {
            if (!b[i]) continue;
            const x = OX + (i % N) * S, y = OY + Math.floor(i / N) * S;
            ctx.beginPath(); ctx.arc(x, y, S * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = b[i] === 1 ? "#16181d" : "#e8e6df";
            ctx.fill();
            ctx.strokeStyle = b[i] === 1 ? "#3a3f4a" : "#a8a49a";
            ctx.lineWidth = 1; ctx.stroke();
          }
          if (winLine) {
            ctx.strokeStyle = "#ffd75e"; ctx.lineWidth = 3.5;
            ctx.beginPath();
            const a = winLine[0], z = winLine[winLine.length - 1];
            ctx.moveTo(OX + (a % N) * S, OY + Math.floor(a / N) * S);
            ctx.lineTo(OX + (z % N) * S, OY + Math.floor(z / N) * S);
            ctx.stroke();
          }
        });
      }
    });
  }
  gomokuGame("gomoku", "五子棋对战", true);
  gomokuGame("gomoku2p", "五子棋·双人", false);

  /* ================= 井字棋 ================= */
  GB.add({
    id: "tictactoe", name: "井字棋", cat: "board", icon: "⭕",
    desc: "和 AI 过招的经典三连棋", tip: "你执 X 先行 · AI 可不简单",
    w: 480, h: 560, colors: ["#2a3a4a", "#101820"],
    init(api) {
      const ctx = api.ctx, S = 110;
      const OX = (480 - 3 * S) / 2, OY = 120;
      let b, turn, over, wins, losses, draws;
      const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
      function winner(bb) {
        for (const l of LINES) {
          if (bb[l[0]] && bb[l[0]] === bb[l[1]] && bb[l[1]] === bb[l[2]]) return bb[l[0]];
        }
        return bb.every((v) => v) ? "D" : null;
      }
      function minimax(bb, player) {
        const w = winner(bb);
        if (w === 2) return { s: 10 };
        if (w === 1) return { s: -10 };
        if (w === "D") return { s: 0 };
        let best = null;
        for (let i = 0; i < 9; i++) {
          if (bb[i]) continue;
          bb[i] = player;
          const r = minimax(bb, 3 - player);
          bb[i] = 0;
          const s = r.s - Math.sign(r.s) * 0.1;
          if (!best || (player === 2 ? s > best.s : s < best.s)) best = { s, i };
        }
        return best;
      }
      function reset() {
        b = Array(9).fill(0); turn = 1; over = false;
      }
      api.onDown((p) => {
        if (over) return;
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx > 2 || cy > 2) return;
        const i = cy * 3 + cx;
        if (b[i]) return;
        b[i] = 1;
        api.beep(480, 0.05, "sine", 0.045);
        step();
      });
      function step() {
        let w = winner(b);
        if (w) { finish(w); return; }
        turn = 2;
        setTimeout(() => {
          if (over) return;
          const m = minimax(b.slice(), 2);
          if (m && m.i != null) { b[m.i] = 2; api.beep(340, 0.05, "sine", 0.04); }
          w = winner(b);
          if (w) { finish(w); return; }
          turn = 1;
        }, 380);
      }
      function finish(w) {
        over = true;
        if (w === 1) { wins++; api.setScore(api.score + 100); api.over("你赢了！", "战绩 " + wins + " 胜 " + losses + " 负 " + draws + " 平", true); }
        else if (w === 2) { losses++; api.over("AI 赢了", "战绩 " + wins + " 胜 " + losses + " 负 " + draws + " 平"); }
        else { draws++; api.setScore(api.score + 30); api.over("平局", "战绩 " + wins + " 胜 " + losses + " 负 " + draws + " 平", true); }
      }
      wins = 0; losses = 0; draws = 0;
      reset();
      api.loop(() => {
        api.clear("#101820");
        api.text("🏆 " + wins + " 胜 · " + losses + " 负 · " + draws + " 平", 24, 44, { size: 13.5, weight: 700, color: "#8fb8c9", align: "left" });
        for (let i = 0; i < 9; i++) {
          const x = OX + (i % 3) * S, y = OY + Math.floor(i / 3) * S;
          api.rr(x + 4, y + 4, S - 8, S - 8, 14);
          ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fill();
          if (b[i] === 1) api.text("✕", x + S / 2, y + S / 2, { size: 46, weight: 800, color: "#4fd1c5" });
          if (b[i] === 2) api.text("◯", x + S / 2, y + S / 2 + 4, { size: 40, weight: 800, color: "#ff8787" });
        }
      });
    }
  });

  /* ================= 黑白棋 ================= */
  GB.add({
    id: "othello", name: "黑白棋", cat: "board", icon: "⚪",
    desc: "翻转夹住的棋子，占满棋盘", tip: "你执黑 · 落子必须夹住白子",
    w: 480, h: 580, colors: ["#1a3a24", "#0a1610"],
    init(api) {
      const ctx = api.ctx, N = 8, S = 48;
      const OX = (480 - N * S) / 2, OY = 100;
      let b, turn, over, aiT;
      const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
      function reset() {
        b = Array(N * N).fill(0);
        b[27] = b[36] = 2; b[28] = b[35] = 1;
        turn = 1; over = false;
      }
      function flipsAt(i, p) {
        if (b[i]) return [];
        const x = i % N, y = Math.floor(i / N);
        const all = [];
        for (const [dx, dy] of DIRS) {
          const fl = [];
          let nx = x + dx, ny = y + dy;
          while (nx >= 0 && ny >= 0 && nx < N && ny < N && b[ny * N + nx] === 3 - p) {
            fl.push(ny * N + nx);
            nx += dx; ny += dy;
          }
          if (fl.length && nx >= 0 && ny >= 0 && nx < N && ny < N && b[ny * N + nx] === p) all.push(...fl);
        }
        return all;
      }
      function moves(p) {
        const m = [];
        for (let i = 0; i < N * N; i++) if (flipsAt(i, p).length) m.push(i);
        return m;
      }
      function place(i) {
        const fl = flipsAt(i, turn);
        if (!fl.length) return false;
        b[i] = turn;
        fl.forEach((j) => { b[j] = turn; });
        api.beep(440, 0.05, "sine", 0.04, 560);
        const opp = moves(3 - turn);
        const mine = moves(turn);
        if (!opp.length && !mine.length) {
          over = true;
          const black = b.filter((v) => v === 1).length;
          const white = b.filter((v) => v === 2).length;
          api.setScore(black * 10);
          api.over(black > white ? "黑棋获胜！" : black < white ? "白棋获胜" : "平局", black + " : " + white, black >= white);
          return true;
        }
        turn = opp.length ? 3 - turn : turn;
        if (turn === 2) aiT = 0.4;
        return true;
      }
      function aiMove() {
        const ms = moves(2);
        if (!ms.length) return;
        let best = ms[0], bs = -1;
        for (const i of ms) {
          let s = flipsAt(i, 2).length;
          const x = i % N, y = Math.floor(i / N);
          if ((x === 0 || x === 7) && (y === 0 || y === 7)) s += 25;
          else if (x === 0 || x === 7 || y === 0 || y === 7) s += 6;
          if (s > bs) { bs = s; best = i; }
        }
        place(best);
      }
      api.onDown((p) => {
        if (over) return;
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
        if (turn !== 1) return;
        place(cy * N + cx);
      });
      reset();
      api.loop((dt) => {
        if (aiT > 0 && !over) {
          aiT -= dt;
          if (aiT <= 0) aiMove();
        }
        api.clear("#0a1610");
        const black = b.filter((v) => v === 1).length, white = b.filter((v) => v === 2).length;
        api.text("⚫ " + black, 24, 44, { size: 16, weight: 800, color: "#e8e6df", align: "left" });
        api.text(white + " ⚪", 456, 44, { size: 16, weight: 800, color: "#c9cede", align: "right" });
        for (let i = 0; i < N * N; i++) {
          const x = OX + (i % N) * S, y = OY + Math.floor(i / N) * S;
          api.rr(x + 2, y + 2, S - 4, S - 4, 6);
          ctx.fillStyle = (i + Math.floor(i / N)) % 2 ? "#1d4a2c" : "#173e24";
          ctx.fill();
          if (b[i]) {
            ctx.beginPath(); ctx.arc(x + S / 2, y + S / 2, S * 0.36, 0, Math.PI * 2);
            ctx.fillStyle = b[i] === 1 ? "#16181d" : "#e8e6df";
            ctx.fill();
          }
          if (turn === 1 && !over && flipsAt(i, 1).length) {
            ctx.beginPath(); ctx.arc(x + S / 2, y + S / 2, 4, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,215,94,.55)"; ctx.fill();
          }
        }
      });
    }
  });

  /* ================= 连四 ================= */
  GB.add({
    id: "connect4", name: "连四棋", cat: "board", icon: "🔴",
    desc: "四子连线，横竖斜都可以", tip: "点击一列落下棋子 · 你执红先手",
    w: 480, h: 560, colors: ["#1a2a4a", "#0a101e"],
    init(api) {
      const ctx = api.ctx, C = 7, R = 6, S = 60;
      const OX = (480 - C * S) / 2, OY = 100;
      let b, turn, over, aiT, last;
      function drop(col, p) {
        for (let y = R - 1; y >= 0; y--) {
          if (!b[y * C + col]) {
            b[y * C + col] = p;
            last = { x: col, y };
            api.beep(320, 0.05, "sine", 0.04, 240);
            return y;
          }
        }
        return -1;
      }
      function winAt(p) {
        const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
        for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
          for (const [dx, dy] of dirs) {
            let c = 0;
            for (let k = 0; k < 4; k++) {
              const nx = x + dx * k, ny = y + dy * k;
              if (nx < 0 || ny < 0 || nx >= C || ny >= R || b[ny * C + nx] !== p) break;
              c++;
            }
            if (c === 4) return true;
          }
        }
        return false;
      }
      function after(p) {
        if (winAt(p)) {
          over = true;
          if (p === 1) { api.setScore(api.score + 100); api.over("你连成四子！", "漂亮", true); }
          else api.over("AI 连成四子", "再接再厉");
          return true;
        }
        if (b.every((v) => v)) { over = true; api.over("平局", "棋盘满了"); return true; }
        return false;
      }
      function aiMove() {
        // 先看能不能赢/必须堵
        for (const p of [2, 1]) {
          for (let c = 0; c < C; c++) {
            const save = b.slice();
            const y = drop(c, p);
            if (y < 0) { b = save; continue; }
            const won = winAt(p);
            b = save;
            if (won) { place(c, 2); return; }
          }
        }
        let col = api.ri(0, 6);
        for (let tries = 0; tries < 20 && drop(col, 2) === -1; tries++) col = api.ri(0, 6);
        b = b;
        if (drop(col, 2) === -1) return;
        after(2);
        turn = 1;
      }
      function place(col, p) {
        drop(col, p);
        if (!after(p)) turn = 3 - p;
        if (turn === 2) aiT = 0.4;
      }
      function reset() {
        b = Array(C * R).fill(0); turn = 1; over = false; aiT = 0;
      }
      api.onDown((p) => {
        if (over || turn !== 1) return;
        const col = Math.floor((p.x - OX) / S);
        if (col < 0 || col >= C) return;
        place(col, 1);
      });
      reset();
      api.loop((dt) => {
        if (aiT > 0 && !over) {
          aiT -= dt;
          if (aiT <= 0) { aiMove(); }
        }
        api.clear("#0a101e");
        api.text(turn === 1 ? "你的回合（红）" : "AI 思考中…", 240, 48, { size: 14, weight: 700, color: "#8fb8ef" });
        for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
          const px = OX + x * S, py = OY + y * S;
          api.rr(px + 3, py + 3, S - 6, S - 6, 12);
          ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fill();
          const v = b[y * C + x];
          if (v) {
            ctx.beginPath(); ctx.arc(px + S / 2, py + S / 2, S * 0.34, 0, Math.PI * 2);
            ctx.fillStyle = v === 1 ? "#ff6b6b" : "#ffd43b";
            ctx.fill();
          }
        }
        if (last && !over) {
          ctx.strokeStyle = "rgba(255,255,255,.5)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(OX + (last.x + 0.5) * S, OY + (last.y + 0.5) * S, S * 0.4, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    }
  });

  /* ================= 21 点 ================= */
  GB.add({
    id: "blackjack", name: "21 点", cat: "board", icon: "🂡",
    desc: "尽量接近 21 但不要爆掉", tip: "点击「要牌」或「停牌」 · A 算 1 或 11",
    w: 480, h: 600, colors: ["#0f3a2a", "#061a12"],
    init(api) {
      const ctx = api.ctx;
      let deck, player, dealer, phase, msg, chips, bet;
      const SUITS = ["♠", "♥", "♦", "♣"];
      function newDeck() {
        const d = [];
        for (const s of SUITS) for (let r = 1; r <= 13; r++) d.push({ s, r });
        return api.shuffle(d);
      }
      function val(hand) {
        let v = 0, aces = 0;
        for (const c of hand) {
          if (c.r === 1) { aces++; v += 11; }
          else v += Math.min(10, c.r);
        }
        while (v > 21 && aces > 0) { v -= 10; aces--; }
        return v;
      }
      function reset() {
        deck = newDeck();
        player = [deck.pop(), deck.pop()];
        dealer = [deck.pop(), deck.pop()];
        phase = "play";
        msg = "";
        chips = api.score || 1000;
        bet = 100;
        api.setScore(chips);
      }
      function chip(n) { return n; }
      function endRound() {
        phase = "done";
        const pv = val(player), dv = val(dealer);
        if (pv > 21) { msg = "爆了！输 " + bet; chips -= bet; api.beep(160, 0.2, "square", 0.05); }
        else if (dv > 21) { msg = "庄家爆了！赢 " + bet; chips += bet; api.beep(760, 0.15, "sine", 0.06); }
        else if (pv > dv) { msg = "你赢了 +" + bet; chips += bet; api.beep(760, 0.15, "sine", 0.06); }
        else if (pv < dv) { msg = "庄家胜 -" + bet; chips -= bet; api.beep(160, 0.2, "square", 0.05); }
        else { msg = "平局"; api.beep(400, 0.1, "sine", 0.04); }
        api.setScore(chips);
        if (chips < bet) { setTimeout(() => api.over("筹码输光了", "共坚持到 " + chips), 900); }
      }
      api.onDown((p) => {
        if (phase === "done") {
          if (p.y > 480) { reset(); }
          return;
        }
        if (p.x >= 40 && p.x <= 220 && p.y >= 480 && p.y <= 545) {
          player.push(deck.pop());
          api.beep(500, 0.05, "sine", 0.04);
          if (val(player) > 21) endRound();
        }
        if (p.x >= 260 && p.x <= 440 && p.y >= 480 && p.y <= 545) {
          while (val(dealer) < 17) dealer.push(deck.pop());
          endRound();
        }
      });
      reset();
      function drawCard(c, x, y, hidden) {
        api.rr(x, y, 64, 92, 9);
        ctx.fillStyle = hidden ? "#2a4a6a" : "#f4f6fa";
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,.4)"; ctx.lineWidth = 1.2; ctx.stroke();
        if (!hidden) {
          const red = c.s === "♥" || c.s === "♦";
          const label = c.r === 1 ? "A" : c.r === 11 ? "J" : c.r === 12 ? "Q" : c.r === 13 ? "K" : c.r;
          api.text(c.s, x + 32, y + 26, { size: 20, color: red ? "#e03131" : "#1a1a1a" });
          api.text(label, x + 32, y + 62, { size: 22, weight: 800, color: red ? "#e03131" : "#1a1a1a" });
        } else {
          api.text("🂠", x + 32, y + 46, { size: 24, color: "#7a9ab8" });
        }
      }
      api.loop(() => {
        api.clear("#061a12");
        api.text("筹码 " + chips, 24, 40, { size: 15, weight: 800, color: "#8fe3a8", align: "left" });
        api.text("底注 " + bet, 456, 40, { size: 12, color: "#4a7a5a", align: "right" });
        api.text("庄家 " + (phase === "play" ? "?" : val(dealer)), 240, 96, { size: 13, color: "#7aa88a" });
        dealer.forEach((c, i) => drawCard(c, 100 + i * 76, 116, phase === "play" && i === 1));
        api.text("你 " + val(player), 240, 300, { size: 13, color: "#7aa88a" });
        player.forEach((c, i) => drawCard(c, 100 + i * 76, 320, false));
        if (msg) api.text(msg, 240, 452, { size: 15, weight: 800, color: "#ffd75e" });
        const by = 480;
        api.rr(40, by, 180, 65, 12);
        ctx.fillStyle = phase === "play" ? "#69db7c" : "rgba(255,255,255,.1)"; ctx.fill();
        api.text("要牌", 130, by + 33, { size: 17, weight: 800, color: phase === "play" ? "#0a2416" : "#6a7a6a" });
        api.rr(260, by, 180, 65, 12);
        ctx.fillStyle = phase === "play" ? "#ffd43b" : "rgba(255,255,255,.1)"; ctx.fill();
        api.text("停牌", 350, by + 33, { size: 17, weight: 800, color: phase === "play" ? "#3a2a10" : "#6a7a6a" });
        if (phase === "done") api.text("点击下方任意按钮开局", 240, 570, { size: 11, color: "#4a7a5a" });
      });
    }
  });

  /* ================= 视频扑克 ================= */
  GB.add({
    id: "videopoker", name: "视频扑克", cat: "board", icon: "🃏",
    desc: "换牌凑牌型，牌型越好奖励越高", tip: "点击卡牌保留 → 点「换牌」结算",
    w: 560, h: 540, colors: ["#2a1a3a", "#120a1a"],
    init(api) {
      const ctx = api.ctx;
      const SUITS = ["♠", "♥", "♦", "♣"];
      const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
      const PAY = { "皇家同花顺": 500, "同花顺": 250, "四条": 125, "葫芦": 45, "同花": 30, "顺子": 20, "三条": 15, "两对": 8, "对J以上": 5 };
      let deck, hand, hold, phase, msg, coins, bet;
      function newDeck() {
        const d = [];
        for (const s of SUITS) for (let r = 1; r <= 13; r++) d.push({ s, r });
        return api.shuffle(d);
      }
      function evaluate(h) {
        const rs = h.map((c) => c.r).sort((a, b) => a - b);
        const flush = h.every((c) => c.s === h[0].s);
        const straight = rs.every((r, i) => i === 0 || r === rs[i - 1] + 1) ||
          (rs.join() === "1,10,11,12,13");
        const cnt = {};
        rs.forEach((r) => { cnt[r] = (cnt[r] || 0) + 1; });
        const counts = Object.values(cnt).sort((a, b) => b - a);
        if (flush && straight && rs[0] === 1) return "皇家同花顺";
        if (flush && straight) return "同花顺";
        if (counts[0] === 4) return "四条";
        if (counts[0] === 3 && counts[1] === 2) return "葫芦";
        if (flush) return "同花";
        if (straight) return "顺子";
        if (counts[0] === 3) return "三条";
        if (counts[0] === 2 && counts[1] === 2) return "两对";
        if (counts[0] === 2) {
          const pairRank = +Object.keys(cnt).find((k) => cnt[k] === 2);
          if (pairRank === 1 || pairRank >= 11) return "对J以上";
        }
        return null;
      }
      function reset() {
        deck = newDeck();
        hand = Array.from({ length: 5 }, () => deck.pop());
        hold = Array(5).fill(false);
        phase = "hold";
        msg = "";
        coins = api.score || 500;
        api.setScore(coins);
      }
      function draw2() {
        for (let i = 0; i < 5; i++) if (!hold[i]) hand[i] = deck.pop();
        const res = evaluate(hand);
        if (res) {
          const win = PAY[res];
          msg = res + "！赢得 " + win;
          coins += win;
          api.beep(880, 0.18, "sine", 0.06);
        } else {
          msg = "没有奖牌型";
          api.beep(180, 0.12, "square", 0.045);
        }
        api.setScore(coins);
        phase = "done";
      }
      api.onDown((p) => {
        if (phase === "hold") {
          for (let i = 0; i < 5; i++) {
            const x = 32 + i * 104;
            if (p.x >= x && p.x <= x + 92 && p.y >= 130 && p.y <= 260) {
              hold[i] = !hold[i];
              api.beep(500, 0.04, "sine", 0.04);
              return;
            }
          }
          if (p.y >= 300 && p.y <= 370 && p.x >= 100 && p.x <= 460) draw2();
        } else {
          if (p.y >= 300 && p.y <= 370 && p.x >= 100 && p.x <= 460) reset();
        }
      });
      reset();
      api.loop(() => {
        api.clear("#120a1a");
        api.text("金币 " + coins, 24, 40, { size: 15, weight: 800, color: "#ffd75e", align: "left" });
        let y0 = 60;
        for (const [k, v] of Object.entries(PAY)) {
          api.text(k + " … " + v, 288, y0, { size: 10, color: "#8a7a9a", align: "left" });
          y0 += 15;
        }
        hand.forEach((c, i) => {
          const x = 32 + i * 104, y = 130;
          api.rr(x, y, 92, 130, 10);
          ctx.fillStyle = "#f4f6fa"; ctx.fill();
          const red = c.s === "♥" || c.s === "♦";
          api.text(c.s, x + 46, y + 34, { size: 26, color: red ? "#e03131" : "#1a1a1a" });
          api.text(RANKS[c.r - 1], x + 46, y + 82, { size: 26, weight: 800, color: red ? "#e03131" : "#1a1a1a" });
          if (hold[i]) {
            api.text("保留", x + 46, y - 14, { size: 12, weight: 700, color: "#ffd75e" });
            ctx.strokeStyle = "#ffd75e"; ctx.lineWidth = 2.4; ctx.stroke();
          }
        });
        api.rr(100, 300, 360, 70, 14);
        ctx.fillStyle = phase === "hold" ? "#7c5cff" : "#4fd1c5"; ctx.fill();
        api.text(phase === "hold" ? "换牌" : "再来一局", 280, 336, { size: 19, weight: 800, color: phase === "hold" ? "#fff" : "#04211f" });
        if (msg) api.text(msg, 280, 410, { size: 16, weight: 800, color: "#ffd75e" });
        api.text("点击牌面切换保留", 280, 450, { size: 11, color: "#6a5a7a" });
      });
    }
  });

  /* ================= 猜数字 1A2B ================= */
  GB.add({
    id: "guessnum", name: "猜数字", cat: "board", icon: "🔢",
    desc: "破译 4 位不重复数字", tip: "A=数字位置都对 B=数字对位置错",
    w: 480, h: 620, colors: ["#1a2a4a", "#0a101e"],
    init(api) {
      const ctx = api.ctx;
      let secret, history, input, done;
      function gen() {
        const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        secret = [];
        for (let i = 0; i < 4; i++) secret.push(pool.splice(api.ri(0, pool.length - 1), 1)[0]);
        history = []; input = ""; done = false;
      }
      function judge() {
        if (input.length !== 4 || new Set(input).size !== 4) { api.beep(160, 0.08, "square", 0.04); return; }
        let a = 0, b = 0;
        for (let i = 0; i < 4; i++) {
          if (+input[i] === secret[i]) a++;
          else if (secret.includes(+input[i])) b++;
        }
        history.push({ g: input, a, b });
        api.beep(500, 0.05, "sine", 0.04);
        input = "";
        if (a === 4) {
          done = true;
          api.setScore(Math.max(100, 1200 - history.length * 60));
          api.over("破译成功！", history.length + " 次猜中", true);
        }
      }
      api.onKey((k) => {
        if (done) return;
        if (/^[0-9]$/.test(k) && input.length < 4) { input += k; api.beep(420, 0.03, "sine", 0.03); }
        else if (k === "Backspace") input = input.slice(0, -1);
        else if (k === "Enter") judge();
      });
      api.onDown((p) => {
        const ky = 430;
        for (let i = 0; i < 12; i++) {
          const x = 40 + (i % 3) * 140, y = ky + Math.floor(i / 3) * 56;
          if (p.x >= x && p.x <= x + 120 && p.y >= y && p.y <= y + 46) {
            const K = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "清除", "0", "猜"];
            if (K[i] === "猜") judge();
            else if (K[i] === "清除") input = "";
            else if (input.length < 4) { input += K[i]; api.beep(420, 0.03, "sine", 0.03); }
            return;
          }
        }
      });
      gen();
      api.loop(() => {
        api.clear("#0a101e");
        api.text("已猜 " + history.length + " 次", 24, 40, { size: 13.5, weight: 700, color: "#8fb8ef", align: "left" });
        history.slice(-6).forEach((h, i, arr) => {
          const y = 70 + i * 44;
          const alpha = i === arr.length - 1 ? 1 : 0.45;
          ctx.globalAlpha = alpha;
          api.rr(60, y, 220, 38, 8);
          ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fill();
          api.text(h.g.split("").join(" "), 100, y + 20, { size: 17, weight: 800 });
          api.text(h.a + "A" + h.b + "B", 220, y + 20, { size: 15, weight: 700, color: "#ffd75e" });
          ctx.globalAlpha = 1;
        });
        // 当前输入
        api.rr(60, 360, 220, 44, 10);
        ctx.fillStyle = "rgba(255,255,255,.09)"; ctx.fill();
        api.text(input.padEnd(4, "·").split("").join(" "), 170, 383, { size: 20, weight: 800, color: "#ffd75e" });
        const ky = 430;
        const K = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "清除", "0", "猜"];
        for (let i = 0; i < 12; i++) {
          const x = 40 + (i % 3) * 140, y = ky + Math.floor(i / 3) * 56;
          api.rr(x, y, 120, 46, 10);
          ctx.fillStyle = K[i] === "猜" ? "rgba(105,219,124,.35)" : K[i] === "清除" ? "rgba(255,107,107,.2)" : "rgba(255,255,255,.08)";
          ctx.fill();
          api.text(K[i], x + 60, y + 24, { size: 16, weight: 700 });
        }
      });
    }
  });

  /* ================= 猜拳大战 ================= */
  GB.add({
    id: "rps", name: "猜拳大战", cat: "board", icon: "✊",
    desc: "石头剪刀布，三局两胜", tip: "点击出拳 · 战胜 AI",
    w: 480, h: 520, colors: ["#2a2a3a", "#101018"],
    init(api) {
      const ctx = api.ctx;
      const G = ["✊", "✌️", "✋"];
      let ps, as, result, ai, me, t, matchOver, wins, losses;
      function reset() {
        ps = 0; as = 0; result = ""; ai = -1; me = -1; t = 0; matchOver = false;
        wins = 0; losses = 0;
      }
      function play(m) {
        if (matchOver) return;
        me = m;
        ai = api.ri(0, 2);
        if (me === ai) { result = "平局"; api.beep(400, 0.08, "sine", 0.04); }
        else if ((me - ai + 3) % 3 === 1) {
          result = "你赢了这局"; ps++;
          api.setScore(api.score + 50);
          api.beep(700, 0.08, "sine", 0.05);
        } else { result = "AI 赢了这局"; as++; api.beep(180, 0.1, "square", 0.045); }
        if (ps >= 3 || as >= 3) {
          matchOver = true;
          if (ps >= 3) { wins++; api.setScore(api.score + 200); setTimeout(() => api.over("比赛胜利！", "总战绩 " + wins + " 胜 " + losses + " 负", true), 700); }
          else { losses++; setTimeout(() => api.over("比赛失败", "总战绩 " + wins + " 胜 " + losses + " 负"), 700); }
        }
      }
      api.onDown((p) => {
        for (let i = 0; i < 3; i++) {
          const x = 40 + i * 140;
          if (p.x >= x && p.x <= x + 120 && p.y >= 330 && p.y <= 460) { play(i); return; }
        }
      });
      reset();
      api.loop((dt) => {
        t += dt;
        api.clear("#101018");
        api.text(ps + " : " + as, 240, 60, { size: 30, weight: 800, color: "#c9cede" });
        api.text("三局两胜", 240, 96, { size: 12, color: "#5a5a7a" });
        api.text(me >= 0 ? G[me] : "❔", 130, 210, { size: 58 });
        api.text("VS", 240, 210, { size: 20, weight: 800, color: "#5a5a7a" });
        api.text(ai >= 0 ? G[ai] : "❔", 350, 210, { size: 58 });
        if (result) api.text(result, 240, 290, { size: 16, weight: 700, color: "#ffd75e" });
        G.forEach((g, i) => {
          const x = 40 + i * 140;
          api.rr(x, 330, 120, 130, 16);
          ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fill();
          api.text(g, x + 60, 380, { size: 38 });
          api.text(["石头", "剪刀", "布"][i], x + 60, 435, { size: 12, color: "#8a8a9a" });
        });
      });
    }
  });

  /* ================= 骰子对决 ================= */
  GB.add({
    id: "dicebattle", name: "骰子对决", cat: "board", icon: "🎲",
    desc: "摇骰子比大小，五局三胜", tip: "点击摇骰 · 点数总和大的赢",
    w: 480, h: 520, colors: ["#3a2a1a", "#160f08"],
    init(api) {
      const ctx = api.ctx;
      let mine, yours, ps, as, rolling, t, round, wins, losses, done;
      function reset() {
        mine = [3, 3]; yours = [3, 3];
        ps = 0; as = 0; rolling = false; t = 0; round = 0; wins = 0; losses = 0; done = false;
      }
      function roll() {
        if (rolling || done) return;
        rolling = true; t = 0.9;
        api.beep(300, 0.3, "triangle", 0.04);
      }
      function settle() {
        mine = [api.ri(1, 6), api.ri(1, 6)];
        yours = [api.ri(1, 6), api.ri(1, 6)];
        const m = mine[0] + mine[1], y = yours[0] + yours[1];
        round++;
        if (m > y) { ps++; api.setScore(api.score + 60); api.beep(700, 0.1, "sine", 0.05); }
        else if (m < y) { as++; api.beep(180, 0.1, "square", 0.045); }
        else api.beep(400, 0.1, "sine", 0.04);
        if (ps >= 3 || as >= 3) {
          done = true;
          if (ps >= 3) { wins++; setTimeout(() => api.over("对决胜利！", "战绩 " + wins + " 胜 " + losses + " 负", true), 700); }
          else { losses++; setTimeout(() => api.over("对决失败", "战绩 " + wins + " 胜 " + losses + " 负"), 700); }
        }
      }
      api.onDown((p) => {
        if (p.y >= 380 && p.y <= 460 && Math.abs(p.x - 240) < 130) roll();
      });
      reset();
      api.loop((dt) => {
        if (rolling) {
          t -= dt;
          mine = [api.ri(1, 6), api.ri(1, 6)];
          yours = [api.ri(1, 6), api.ri(1, 6)];
          if (t <= 0) { rolling = false; settle(); }
        }
        api.clear("#160f08");
        api.text(ps + " : " + as, 240, 56, { size: 28, weight: 800, color: "#e8c9a8" });
        api.text("第 " + round + " 局 · 三胜制", 240, 92, { size: 12, color: "#8a6d3a" });
        function die(v, x, y, col) {
          api.rr(x - 34, y - 34, 68, 68, 14);
          ctx.fillStyle = "#f4f1e8"; ctx.fill();
          ctx.fillStyle = col;
          const pts = { 1: [[0, 0]], 2: [[-16, -16], [16, 16]], 3: [[-16, -16], [0, 0], [16, 16]], 4: [[-16, -16], [16, -16], [-16, 16], [16, 16]], 5: [[-16, -16], [16, -16], [0, 0], [-16, 16], [16, 16]], 6: [[-16, -16], [16, -16], [-16, 0], [16, 0], [-16, 16], [16, 16]] };
          for (const [dx, dy] of pts[v]) {
            ctx.beginPath(); ctx.arc(x + dx, y + dy, 6.5, 0, Math.PI * 2); ctx.fill();
          }
        }
        api.text("你", 120, 150, { size: 13, color: "#8a6d3a" });
        die(mine[0], 90, 220, "#3a2a1a");
        die(mine[1], 170, 220, "#3a2a1a");
        api.text(mine[0] + mine[1], 130, 285, { size: 18, weight: 800, color: "#ffd98a" });
        api.text("AI", 360, 150, { size: 13, color: "#8a6d3a" });
        die(yours[0], 330, 220, "#8a3a3a");
        die(yours[1], 410, 220, "#8a3a3a");
        api.text(yours[0] + yours[1], 370, 285, { size: 18, weight: 800, color: "#e8a8a8" });
        api.rr(110, 380, 260, 80, 18);
        ctx.fillStyle = rolling ? "rgba(255,255,255,.1)" : "#c9973a"; ctx.fill();
        api.text(rolling ? "摇骰中…" : "摇 骰", 240, 421, { size: 22, weight: 800, color: rolling ? "#8a7a5a" : "#2a1a08" });
      });
    }
  });

  /* ================= 凑十速配 ================= */
  GB.add({
    id: "make10", name: "凑十速配", cat: "board", icon: "🔟",
    desc: "翻开两张牌让点数相加等于 10", tip: "点击两张牌 · 1-9 点数相加为 10",
    w: 480, h: 560, colors: ["#1a3a4a", "#0a161e"],
    init(api) {
      const ctx = api.ctx, C = 6, R = 4;
      const S = 62, OX = (480 - C * S) / 2, OY = 110;
      let cards, open, found, moves, t0;
      function reset() {
        const pool = [];
        for (let i = 0; i < C * R / 2; i++) {
          const v = api.ri(1, 9);
          pool.push(v, 10 - v);
        }
        cards = api.shuffle(pool);
        open = []; found = new Set(); moves = 0; t0 = null;
      }
      api.onDown((p) => {
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx >= C || cy >= R) return;
        const i = cy * C + cx;
        if (found.has(i) || open.includes(i) || open.length >= 2) return;
        if (t0 === null) t0 = api.t;
        open.push(i);
        api.beep(460, 0.04, "sine", 0.04);
        if (open.length === 2) {
          moves++;
          const [a, b] = open.map((j) => cards[j]);
          if (a + b === 10) {
            open.forEach((j) => found.add(j));
            open = [];
            api.beep(760, 0.08, "sine", 0.05);
            api.setScore(found.size / 2 * 50);
            if (found.size === C * R) {
              const secs = api.t - t0;
              api.setScore(Math.max(200, Math.round(2000 - secs * 15)));
              api.over("全部配对！", "用时 " + secs.toFixed(1) + " 秒", true);
            }
          } else {
            setTimeout(() => { open = []; }, 550);
          }
        }
      });
      reset();
      api.loop(() => {
        api.clear("#0a161e");
        api.text("已配 " + found.size / 2 + " 对 · " + moves + " 次尝试", 24, 44, { size: 13.5, weight: 700, color: "#8fb8ef", align: "left" });
        for (let i = 0; i < C * R; i++) {
          const x = i % C, y = Math.floor(i / C);
          const px = OX + x * S, py = OY + y * S;
          const isOpen = open.includes(i) || found.has(i);
          api.rr(px + 3, py + 3, S - 6, S - 6, 9);
          if (isOpen) {
            ctx.fillStyle = found.has(i) ? "rgba(105,219,124,.25)" : "#2a5a7a";
            ctx.fill();
            api.text(cards[i], px + S / 2, py + S / 2 + 1, { size: 24, weight: 800, color: "#eaf6ff" });
          } else {
            ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill();
            api.text("★", px + S / 2, py + S / 2, { size: 18, color: "rgba(255,255,255,.14)" });
          }
        }
      });
    }
  });

  /* ================= 接龙七 ================= */
  GB.add({
    id: "sevens", name: "接龙七", cat: "board", icon: "♠️",
    desc: "从 7 开始按花色接龙出牌", tip: "必须从手中出可接的牌 · 出不了要弃",
    w: 560, h: 560, colors: ["#1a4a2a", "#0a1e12"],
    init(api) {
      const ctx = api.ctx;
      const SUITS = ["♠", "♥", "♦", "♣"];
      let hand, table, turn, passCount, over, msg;
      function reset() {
        const deck = [];
        for (const s of SUITS) for (let r = 1; r <= 13; r++) deck.push({ s, r });
        const sh = api.shuffle(deck);
        hand = sh.slice(0, 13);
        table = { "♠": null, "♥": null, "♦": null, "♣": null };
        table[sh[13].s] = sh[13].r === 7 ? sh[13].r : null;
        // 保证玩家至少有一张 7
        if (!hand.some((c) => c.r === 7)) {
          hand[0] = { s: SUITS[0], r: 7 };
        }
        turn = 1; passCount = 0; over = false; msg = "从 7 开始出牌";
      }
      function canPlay(c) {
        const cur = table[c.s];
        if (cur === null) return c.r === 7;
        return c.r === cur - 1 || c.r === cur + 1;
      }
      function aiTurn() {
        const aiCount = 3;
        for (let a = 0; a < aiCount; a++) {
          const opts = hand.filter(canPlay);
          if (opts.length) {
            const c = api.pick(opts);
            hand.splice(hand.indexOf(c), 1);
            table[c.s] = c.r;
            msg = "AI 出了 " + c.s + c.r;
          } else {
            msg = "AI 弃了一张";
          }
        }
      }
      api.onDown((p) => {
        if (over) return;
        for (let i = 0; i < hand.length; i++) {
          const x = 20 + (i % 13) * 40, y = 400 + Math.floor(i / 13) * 66;
          if (p.x >= x && p.x <= x + 36 && p.y >= y && p.y <= y + 58) {
            const c = hand[i];
            if (canPlay(c)) {
              hand.splice(i, 1);
              table[c.s] = c.r;
              msg = "你出了 " + c.s + c.r;
              api.beep(520, 0.05, "sine", 0.045);
              passCount = 0;
              aiTurn();
              if (!hand.length) {
                over = true;
                api.setScore(api.score + 500);
                api.over("你先出完了！", "大获全胜", true);
              }
            } else {
              msg = "这张接不上，试试别的";
              api.beep(180, 0.08, "square", 0.04);
            }
            return;
          }
        }
      });
      reset();
      api.loop(() => {
        api.clear("#0a1e12");
        api.text("中央牌桌 · " + msg, 24, 40, { size: 13, weight: 700, color: "#8fe3a8", align: "left" });
        api.text("手牌 " + hand.length, 536, 40, { size: 12, color: "#4a7a5a", align: "right" });
        SUITS.forEach((s, i) => {
          const x = 60 + i * 130;
          api.rr(x, 110, 100, 130, 12);
          ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.15)"; ctx.lineWidth = 1; ctx.stroke();
          const cur = table[s];
          if (cur != null) {
            api.text(s, x + 50, 150, { size: 24, color: (s === "♥" || s === "♦") ? "#ff8787" : "#c9cede" });
            api.text(cur, x + 50, 195, { size: 28, weight: 800, color: "#fff" });
          } else {
            api.text(s, x + 50, 175, { size: 24, color: "rgba(255,255,255,.2)" });
            api.text("等 7", x + 50, 215, { size: 12, color: "rgba(255,255,255,.2)" });
          }
        });
        hand.forEach((c, i) => {
          const x = 20 + (i % 13) * 40, y = 400 + Math.floor(i / 13) * 66;
          api.rr(x, y, 36, 58, 6);
          ctx.fillStyle = "#f4f6fa"; ctx.fill();
          const red = c.s === "♥" || c.s === "♦";
          api.text(c.s, x + 18, y + 20, { size: 15, color: red ? "#e03131" : "#1a1a1a" });
          api.text(c.r, x + 18, y + 44, { size: 15, weight: 800, color: red ? "#e03131" : "#1a1a1a" });
          ctx.strokeStyle = canPlay(c) ? "#69db7c" : "rgba(255,255,255,.15)";
          ctx.lineWidth = canPlay(c) ? 2 : 1;
          ctx.stroke();
        });
        api.text("绿框 = 现在能出的牌", 280, 545, { size: 11, color: "#4a7a5a" });
      });
    }
  });

  /* ================= 战争比大小 ================= */
  GB.add({
    id: "war", name: "战争比大小", cat: "board", icon: "⚔️",
    desc: "翻牌比大小，赢光对手的牌", tip: "点击翻牌 · 大者收走两张",
    w: 480, h: 520, colors: ["#3a1a1a", "#160a0a"],
    init(api) {
      const ctx = api.ctx;
      let mine, yours, mc, yc, msg, busy, t, rounds;
      const RN = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
      function reset() {
        const deck = api.shuffle(Array.from({ length: 52 }, (_, i) => i));
        mine = deck.slice(0, 26); yours = deck.slice(26);
        mc = yc = null; msg = "点击翻牌"; busy = false; rounds = 0;
        api.setScore(0);
      }
      api.onDown(() => {
        if (busy || !mine.length || !yours.length) return;
        mc = mine.shift(); yc = yours.shift();
        rounds++;
        const mv = mc % 13 + 1, yv = yc % 13 + 1;
        busy = true; t = 1.1;
        if (mv > yv) { mine.push(mc, yc); msg = "你赢了这轮 +" + (mv === yv ? 0 : 1); api.setScore(mine.length); api.beep(600, 0.08, "sine", 0.045); }
        else if (mv < yv) { yours.push(mc, yc); msg = "这轮输了"; api.beep(180, 0.1, "square", 0.045); }
        else { mine.push(mc); yours.push(yc); msg = "平局！"; api.beep(400, 0.1, "sine", 0.04); }
      });
      reset();
      api.loop((dt) => {
        if (busy) {
          t -= dt;
          if (t <= 0) {
            busy = false;
            if (!mine.length) api.over("牌输光了", "坚持了 " + rounds + " 轮");
            else if (!yours.length) api.over("对手没牌了！", rounds + " 轮获胜", true);
          }
        }
        api.clear("#160a0a");
        api.text("你 " + mine.length + " 张", 24, 40, { size: 14, weight: 800, color: "#e8a8a8", align: "left" });
        api.text(yours.length + " 张 对手", 456, 40, { size: 14, weight: 800, color: "#c9a8a8", align: "right" });
        function card(v, x, y) {
          api.rr(x - 40, y - 58, 80, 116, 10);
          ctx.fillStyle = "#f4f6fa"; ctx.fill();
          const suit = ["♠", "♥", "♦", "♣"][Math.floor(v / 13)];
          const red = suit === "♥" || suit === "♦";
          api.text(suit, x, y - 28, { size: 22, color: red ? "#e03131" : "#1a1a1a" });
          api.text(RN[v % 13 + 1], x, y + 22, { size: 30, weight: 800, color: red ? "#e03131" : "#1a1a1a" });
        }
        if (mc != null) card(mc, 140, 220);
        else { api.rr(100, 162, 80, 116, 10); ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fill(); }
        if (yc != null) card(yc, 340, 220);
        else { api.rr(300, 162, 80, 116, 10); ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fill(); }
        if (msg) api.text(msg, 240, 330, { size: 15, weight: 700, color: "#ffd75e" });
        api.rr(140, 380, 200, 64, 16);
        ctx.fillStyle = "#c0504d"; ctx.fill();
        api.text("翻 牌", 240, 413, { size: 20, weight: 800, color: "#fff" });
      });
    }
  });
})();
