/* ==========================================================
   brain.js — 脑力游戏 18 款
   ========================================================== */
(function () {
  "use strict";

  /* 通用：限时问答骨架 */
  function quizGame(id, name, icon, desc, tip, makeQ, perQ, timeTotal, onAnswer) {
    GB.add({
      id, name, cat: "brain", icon, desc, tip,
      w: 480, h: 600, colors: ["#1a2a4a", "#0a101e"],
      init(api) {
        const ctx = api.ctx;
        let q, t, score, dead, streak, answered, round;
        function nextQ() {
          q = makeQ();
          t = perQ;
          answered = null;
          round++;
        }
        function reset() {
          t = timeTotal; score = 0; dead = false; streak = 0; round = 0;
          api.setScore(0);
          nextQ();
        }
        api.onDown((p) => {
          if (dead) return;
          for (let i = 0; i < q.a.length; i++) {
            const y = 360 + i * 58;
            if (p.x >= 40 && p.x <= 440 && p.y >= y && p.y <= y + 48) {
              answered = i;
              const ok = i === q.ans;
              if (ok) {
                streak++;
                score += 100 + streak * 20 + Math.round(t * 10);
                api.setScore(score);
                api.beep(700 + streak * 30, 0.07, "sine", 0.05);
              } else {
                streak = 0;
                api.beep(170, 0.12, "square", 0.05);
              }
              if (onAnswer) onAnswer(ok, api);
              setTimeout(() => { if (!dead) nextQ(); }, 420);
              return;
            }
          }
        });
        reset();
        api.loop((dt) => {
          if (!dead) {
            t -= dt;
            if (t <= 0) { dead = true; api.over("时间到！", "答对得分 " + score); }
          }
          api.clear("#0a101e");
          api.text("第 " + round + " 题 · 连对 ×" + streak, 24, 40, { size: 13, weight: 700, color: "#8fb8ef", align: "left" });
          api.text(Math.max(0, t).toFixed(1) + "s", 456, 40, { size: 14, weight: 800, color: t < 5 ? "#ff8787" : "#5a6a8a", align: "right" });
          // 题面（可多行）
          ctx.save();
          api.font(17, 700);
          ctx.fillStyle = "#eef1f8";
          ctx.textAlign = "center";
          const lines = [];
          let line = "";
          String(q.q).split("").forEach((ch) => {
            if (ctx.measureText(line + ch).width > 380) { lines.push(line); line = ch; }
            else line += ch;
          });
          lines.push(line);
          lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, 240, 170 + i * 40));
          ctx.restore();
          q.a.forEach((opt, i) => {
            const y = 360 + i * 58;
            api.rr(40, y, 400, 48, 12);
            if (answered == null) ctx.fillStyle = "rgba(255,255,255,.06)";
            else if (i === q.ans) ctx.fillStyle = "rgba(105,219,124,.3)";
            else if (i === answered) ctx.fillStyle = "rgba(255,107,107,.3)";
            else ctx.fillStyle = "rgba(255,255,255,.03)";
            ctx.fill();
            api.text(opt, 240, y + 25, { size: 17, weight: 700 });
          });
        });
      }
    });
  }

  /* ================= 算术冲刺 ================= */
  quizGame("mathrush", "算术冲刺", "➕", "加减乘口算抢答", "限时 6 秒/题 · 答对加分", () => {
    const ops = ["+", "-", "×"];
    const op = api_pick(ops);
    let a, b, ans;
    if (op === "+") { a = api_ri(11, 89); b = api_ri(11, 89); ans = a + b; }
    else if (op === "-") { a = api_ri(30, 99); b = api_ri(2, a - 1); ans = a - b; }
    else { a = api_ri(3, 12); b = api_ri(3, 12); ans = a * b; }
    const opts = [ans];
    while (opts.length < 3) {
      const d = ans + api_pick([-10, -1, 1, 2, 10, -2]) * api_ri(1, 3);
      if (d !== ans && !opts.includes(d) && d >= 0) opts.push(d);
    }
    return { q: a + " " + op + " " + b + " = ?", a: api_shuffleArr(opts), ans: opts.indexOf(ans) };
  }, 6, 6);

  function api_pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function api_ri(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
  function api_shuffleArr(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ================= 心算 24 点 ================= */
  GB.add({
    id: "math24", name: "心算 24 点", cat: "brain", icon: "🎲",
    desc: "用四则运算把 4 个数算出 24", tip: "点击两个数和运算符进行计算",
    w: 480, h: 600, colors: ["#3a2a1a", "#160f08"],
    init(api) {
      const ctx = api.ctx;
      let nums, sel, op, solved, round, won;
      function deal() {
        let n;
        do {
          n = Array.from({ length: 4 }, () => api.ri(1, 13));
          // 保证有解：随机生成表达式目标 24（简单起见，构造一个可行解再打散）
          const e = [n[0], n[1], n[2], n[3]];
          const ops = ["+", "-", "×", "÷"];
          let v = e[0];
          for (let i = 1; i < 4; i++) {
            const o = api_pick2(ops);
            const b = e[i];
            v = o === "+" ? v + b : o === "-" ? v - b : o === "×" ? v * b : b !== 0 && v % b === 0 ? v / b : v + b;
          }
        } while (false);
        nums = n.map((v) => ({ v, used: false }));
        sel = []; op = null; solved = false; won = false;
        round++;
      }
      function apply() {
        if (sel.length !== 2 || !op) return;
        const [a, b] = sel;
        let v;
        if (op === "+") v = a.v + b.v;
        else if (op === "-") v = a.v - b.v;
        else if (op === "×") v = a.v * b.v;
        else {
          if (b.v === 0 || a.v % b.v !== 0) { api.beep(160, 0.08, "square", 0.04); return; }
          v = a.v / b.v;
        }
        const rest = nums.filter((n) => !sel.includes(n));
        rest.push({ v, used: false });
        nums = rest;
        sel = []; op = null;
        api.beep(480, 0.05, "sine", 0.04);
        if (nums.length === 1) {
          if (nums[0].v === 24) {
            won = true;
            api.setScore(api.score + 200);
            api.beep(880, 0.14, "sine", 0.06);
            setTimeout(() => { if (!api.over) deal(); }, 900);
          } else {
            api.beep(180, 0.15, "square", 0.05);
            setTimeout(() => { if (!api.over) { api.over("算出 " + nums[0].v, "不是 24，再来一局"); } }, 600);
          }
        }
      }
      api.onDown((p) => {
        if (won) return;
        for (let i = 0; i < nums.length; i++) {
          const x = 60 + i * 100;
          if (p.x >= x && p.x <= x + 80 && p.y >= 200 && p.y <= 290) {
            if (sel.includes(nums[i])) { sel = sel.filter((s) => s !== nums[i]); return; }
            if (sel.length < 2) { sel.push(nums[i]); api.beep(420, 0.04, "sine", 0.04); }
            if (sel.length === 2) apply();
            return;
          }
        }
        const OPS = ["+", "-", "×", "÷"];
        for (let i = 0; i < 4; i++) {
          const x = 90 + i * 84;
          if (p.x >= x && p.x <= x + 68 && p.y >= 340 && p.y <= 408) { op = OPS[i]; api.beep(360, 0.04, "sine", 0.04); return; }
        }
        if (p.y >= 450 && p.y <= 510 && p.x >= 140 && p.x <= 340) deal();
      });
      round = 0;
      deal();
      api.setScore(0);
      api.loop(() => {
        api.clear("#160f08");
        api.text("把 4 个数算成 24", 24, 40, { size: 15, weight: 800, color: "#ffd98a", align: "left" });
        api.text("第 " + round + " 题", 456, 40, { size: 12, color: "#8a6d3a", align: "right" });
        nums.forEach((n, i) => {
          const x = 60 + i * 100;
          api.rr(x, 200, 80, 90, 14);
          const isSel = sel.includes(n);
          ctx.fillStyle = isSel ? "rgba(255,215,94,.35)" : "rgba(255,255,255,.07)";
          ctx.fill();
          ctx.strokeStyle = isSel ? "#ffd75e" : "rgba(255,255,255,.15)";
          ctx.lineWidth = isSel ? 2.4 : 1.2; ctx.stroke();
          api.text(n.v, x + 40, 245, { size: 30, weight: 800 });
        });
        const OPS = ["+", "-", "×", "÷"];
        OPS.forEach((o, i) => {
          const x = 90 + i * 84;
          api.rr(x, 340, 68, 68, 14);
          ctx.fillStyle = op === o ? "#ffd75e" : "rgba(255,255,255,.08)";
          ctx.fill();
          api.text(o, x + 34, 375, { size: 26, weight: 800, color: op === o ? "#3a2a10" : "#e8e2d0" });
        });
        api.rr(140, 450, 200, 60, 14);
        ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill();
        api.text("换一题", 240, 481, { size: 15, weight: 700, color: "#c9b88a" });
        if (won) api.text("24！点击换一题继续", 240, 550, { size: 15, weight: 700, color: "#8fe3a8" });
      });
    }
  });
  function api_pick2(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ================= 数字记忆 ================= */
  GB.add({
    id: "nummem", name: "数字记忆", cat: "brain", icon: "🧠",
    desc: "记住闪现的数字串", tip: "记忆后输入刚才的数字",
    w: 480, h: 560, colors: ["#2a1a4a", "#100a1e"],
    init(api) {
      const ctx = api.ctx;
      let digits, input, phase, timer, level;
      function gen() {
        const len = 2 + level;
        digits = Array.from({ length: len }, () => api.ri(0, 9)).join("");
        input = ""; phase = "show"; timer = Math.max(1.4, 3 - level * 0.15);
      }
      api.onKey((k) => {
        if (phase !== "input") return;
        if (/^[0-9]$/.test(k)) {
          input += k;
          api.beep(420, 0.03, "sine", 0.03);
          if (input.length === digits.length) check();
        } else if (k === "Backspace") input = input.slice(0, -1);
      });
      // 屏幕数字键盘
      api.onDown((p) => {
        if (phase !== "input") return;
        const ky = 380;
        for (let i = 0; i < 10; i++) {
          const x = 40 + (i % 5) * 82, y = ky + Math.floor(i / 5) * 62;
          if (p.x >= x && p.x <= x + 70 && p.y >= y && p.y <= y + 52) {
            input += i;
            api.beep(420, 0.03, "sine", 0.03);
            if (input.length === digits.length) check();
            return;
          }
        }
        if (p.y >= ky + 2 * 62 && p.y <= ky + 2 * 62 + 52 && p.x >= 40 && p.x <= 220) {
          if (input === digits) { good(); } else fail();
        }
      });
      function check() {
        if (input === digits) good(); else fail();
      }
      function good() {
        level++;
        api.setScore(level * 120);
        api.beep(760, 0.1, "sine", 0.05);
        setTimeout(() => { if (!api.over) gen(); }, 500);
        phase = "wait";
      }
      function fail() {
        api.beep(160, 0.14, "square", 0.05);
        api.over("记错了", "答对 " + level + " 题 · 数字是 " + digits);
      }
      level = 0; gen();
      api.loop((dt) => {
        if (phase === "show") {
          timer -= dt;
          if (timer <= 0) phase = "input";
        }
        api.clear("#100a1e");
        api.text("第 " + (level + 1) + " 题 · " + digits.length + " 位数", 240, 60, { size: 14, weight: 700, color: "#c8a8e8" });
        if (phase === "show") {
          api.text(digits, 240, 240, { size: 52, weight: 800, color: "#fff" });
          api.text(Math.ceil(timer) + "s", 240, 320, { size: 15, color: "#8a7a9a" });
        } else if (phase === "input") {
          api.text(input || "…", 240, 240, { size: 44, weight: 800, color: "#ffd75e" });
          const ky = 380;
          for (let i = 0; i < 10; i++) {
            const x = 40 + (i % 5) * 82, y = ky + Math.floor(i / 5) * 62;
            api.rr(x, y, 70, 52, 10);
            ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill();
            api.text(i, x + 35, y + 27, { size: 20, weight: 800 });
          }
          api.rr(40, ky + 124, 180, 52, 10);
          ctx.fillStyle = "rgba(105,219,124,.3)"; ctx.fill();
          api.text("确认", 130, ky + 151, { size: 16, weight: 700, color: "#8fe3a8" });
        } else {
          api.text("✓ 正确！", 240, 240, { size: 34, weight: 800, color: "#8fe3a8" });
        }
      });
    }
  });

  /* ================= 找规律 ================= */
  quizGame("pattern", "找规律", "🔍", "数列的下一项是什么", "限时 8 秒/题", () => {
    const type = api_ri3(0, 2);
    let seq, ans;
    if (type === 0) {
      const a0 = api_ri3(1, 6), d = api_ri3(2, 9);
      seq = [0, 1, 2, 3].map((i) => a0 + d * i);
      ans = a0 + d * 4;
    } else if (type === 1) {
      const a0 = api_ri3(1, 4), r = api_ri3(2, 3);
      seq = [0, 1, 2, 3].map((i) => a0 * Math.pow(r, i));
      ans = a0 * Math.pow(r, 4);
    } else {
      const a0 = api_ri3(1, 5);
      seq = [a0];
      for (let i = 1; i < 4; i++) seq.push(seq[i - 1] + i + 1);
      ans = seq[3] + 5;
    }
    const opts = [ans];
    while (opts.length < 3) {
      const d = ans + api_pick3([-4, -2, -1, 1, 2, 4, 5]) * api_ri3(1, 3);
      if (d !== ans && !opts.includes(d)) opts.push(d);
    }
    return { q: seq.join(", ") + ", ?", a: api_shuffleArr2(opts), ans: opts.indexOf(ans) };
  }, 8, 8);
  function api_ri3(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
  function api_pick3(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function api_shuffleArr2(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ================= 质数猎手 ================= */
  GB.add({
    id: "prime", name: "质数猎手", cat: "brain", icon: "🎯",
    desc: "在网格中点出所有质数", tip: "点击所有质数 · 点错扣分",
    w: 480, h: 560, colors: ["#1a3a3a", "#0a1616"],
    init(api) {
      const ctx = api.ctx, N = 4, S = 92;
      const OX = (480 - N * S) / 2, OY = 120;
      let nums, state, round, score, left;
      function isPrime(n) {
        if (n < 2) return false;
        for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
        return true;
      }
      function deal() {
        nums = [];
        const want = api_ri4(3, 6);
        while (nums.length < want) {
          const p = api_ri4(11, 97);
          if (isPrime(p) && !nums.includes(p)) nums.push(p);
        }
        while (nums.length < N * N) {
          const c = api_ri4(4, 99);
          if (!isPrime(c) && !nums.includes(c)) nums.push(c);
        }
        nums = api_shuffleArr3(nums);
        state = nums.map(() => 0);
        left = nums.filter(isPrime).length;
        round++;
      }
      api.onDown((p) => {
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
        const i = cy * N + cx;
        if (state[i]) return;
        if (isPrime(nums[i])) {
          state[i] = 1;
          score += 100;
          api.setScore(score);
          api.beep(700, 0.05, "sine", 0.045);
          left--;
          if (left === 0) {
            api.beep(880, 0.12, "sine", 0.06);
            setTimeout(() => { if (!api.over) deal(); }, 550);
          }
        } else {
          state[i] = 2;
          score = Math.max(0, score - 60);
          api.setScore(score);
          api.beep(160, 0.1, "square", 0.05);
        }
      });
      score = 0; round = 0;
      deal();
      api.setScore(0);
      api.loop(() => {
        api.clear("#0a1616");
        api.text("圈出所有质数 · 第 " + round + " 轮", 24, 44, { size: 14, weight: 700, color: "#8fe3d8", align: "left" });
        for (let i = 0; i < N * N; i++) {
          const x = i % N, y = Math.floor(i / N);
          const px = OX + x * S, py = OY + y * S;
          api.rr(px + 4, py + 4, S - 8, S - 8, 12);
          ctx.fillStyle = state[i] === 1 ? "rgba(105,219,124,.25)" : state[i] === 2 ? "rgba(255,107,107,.22)" : "rgba(255,255,255,.06)";
          ctx.fill();
          ctx.strokeStyle = state[i] === 1 ? "#69db7c" : state[i] === 2 ? "#ff8787" : "rgba(255,255,255,.1)";
          ctx.lineWidth = state[i] ? 2 : 1; ctx.stroke();
          api.text(nums[i], px + S / 2, py + S / 2 + 1, { size: 26, weight: 800 });
        }
        api.text("质数：只能被 1 和它自己整除", 240, 530, { size: 11, color: "#4a6a6a" });
      });
    }
  });
  function api_ri4(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
  function api_shuffleArr3(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ================= 二进制转换 ================= */
  quizGame("binary", "二进制大师", "💾", "把二进制换算成十进制", "限时 10 秒/题", () => {
    const n = api_ri5(3, 63);
    const bin = n.toString(2).padStart(4, "0").split("").reverse().map(Number);
    const opts = [n];
    while (opts.length < 3) {
      const d = n + api_pick5([-8, -4, -1, 1, 4, 8]);
      if (d > 0 && d !== n && !opts.includes(d)) opts.push(d);
    }
    return { q: bin.join("") + "₂ = ?", a: api_shuffleArr4(opts), ans: opts.indexOf(n) };
  }, 10, 10);
  function api_ri5(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
  function api_pick5(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function api_shuffleArr4(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ================= 单位换算 ================= */
  quizGame("unit", "单位换算", "📏", "快速完成单位换算", "限时 10 秒/题", () => {
    const qs = [
      () => { const m = api_ri6(2, 50); return { q: m + " 米 = ? 分米", a: [String(m * 10), String(m), String(m * 100)], ans: 0 }; },
      () => { const kg = api_ri6(2, 30); return { q: kg + " 千克 = ? 克", a: [String(kg * 1000), String(kg * 100), String(kg)], ans: 0 }; },
      () => { const h = api_ri6(2, 12); return { q: h + " 小时 = ? 分钟", a: [String(h * 60), String(h * 30), String(h * 100)], ans: 0 }; },
      () => { const km = api_ri6(2, 20); return { q: km + " 千米 = ? 米", a: [String(km * 1000), String(km * 100), String(km * 10)], ans: 0 }; },
      () => { const min = api_ri6(2, 9) * 10; return { q: min + " 分钟 = ? 秒", a: [String(min * 60), String(min * 10), String(min)], ans: 0 }; }
    ];
    const r = api_pick6(qs)();
    const opts = api_shuffleArr5(r.a.map(Number).map(String));
    return { q: r.q, a: opts, ans: opts.indexOf(r.a[r.ans]) };
  }, 10, 10);
  function api_ri6(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
  function api_pick6(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function api_shuffleArr5(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ================= 打字速度 ================= */
  GB.add({
    id: "typing", name: "打字速度", cat: "brain", icon: "⌨️",
    desc: "60 秒输入尽可能多的英文单词", tip: "输入单词后按空格提交",
    w: 480, h: 520, colors: ["#2a2a2a", "#101010"],
    init(api) {
      const ctx = api.ctx;
      const WORDS = ["cat", "dog", "sun", "run", "map", "key", "box", "jet", "fox", "owl", "cup", "hat", "pen", "arc", "bit", "code", "game", "fish", "tree", "star", "moon", "rain", "wind", "fire", "gold", "iron", "leaf", "road", "ship", "time"];
      let word, input, t, score, dead, done;
      function nextWord() {
        word = api_pick7(WORDS);
        input = "";
      }
      function reset() {
        t = 60; score = 0; dead = false; done = 0;
        api.setScore(0);
        nextWord();
      }
      function submit() {
        if (input === word) {
          done++;
          score += word.length * 10;
          api.setScore(score);
          api.beep(660, 0.05, "sine", 0.04);
          nextWord();
        } else {
          api.beep(170, 0.08, "square", 0.04);
        }
        input = "";
      }
      api.onKey((k) => {
        if (dead) return;
        if (/^[a-zA-Z]$/.test(k) && input.length < 12) input += k.toLowerCase();
        else if (k === "Backspace") input = input.slice(0, -1);
        else if (k === " ") submit();
        else if (k === "Enter") submit();
      });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t -= dt;
          if (t <= 0) { dead = true; api.over("时间到！", "完成 " + done + " 个单词"); }
        }
        api.clear("#101010");
        api.text(Math.max(0, Math.ceil(t)) + "s", 24, 40, { size: 16, weight: 800, color: "#c9cede", align: "left" });
        api.text(done + " 个", 456, 40, { size: 13, color: "#6a6a7a", align: "right" });
        api.rr(60, 150, 360, 110, 16);
        ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fill();
        api.text(word, 240, 190, { size: 36, weight: 800, color: "#8fb8ef" });
        // 已输入对比
        let shown = "";
        for (let i = 0; i < word.length; i++) {
          const c = input[i];
          if (!c) { shown += word[i]; continue; }
          shown += c === word[i] ? c : "␣";
        }
        api.text(shown, 240, 232, { size: 24, weight: 700, color: input === word ? "#8fe3a8" : "#e2e6f2" });
        api.rr(60, 300, 360, 60, 14);
        ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill();
        api.text(input + "▏", 240, 331, { size: 24, weight: 700, color: "#ffd75e" });
        api.text("输入后按 空格 / 回车 提交", 240, 420, { size: 12, color: "#5a5a6a" });
        if (done) api.text("速度：" + (done / Math.max(1, 60 - t) * 60).toFixed(0) + " 词/分钟", 240, 455, { size: 12, color: "#7a7a8a" });
      });
    }
  });
  function api_pick7(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ================= 数列填空 ================= */
  quizGame("sequence", "数列探秘", "📈", "斐波那契式数列填空", "限时 10 秒/题", () => {
    const a = api_ri8(1, 5), b = api_ri8(2, 7);
    const seq = [a, b, a + b, a + 2 * b, 2 * a + 3 * b];
    const opts = [seq[4]];
    while (opts.length < 3) {
      const d = seq[4] + api_pick8([-3, -1, 1, 2, 3, 5]);
      if (d !== seq[4] && !opts.includes(d)) opts.push(d);
    }
    return { q: seq[0] + ", " + seq[1] + ", " + seq[2] + ", " + seq[3] + ", ?", a: api_shuffleArr6(opts), ans: opts.indexOf(seq[4]) };
  }, 10, 10);
  function api_ri8(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
  function api_pick8(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function api_shuffleArr6(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ================= 异类识别 ================= */
  quizGame("oddone", "异类识别", "🧩", "找出不是同类的一项", "限时 8 秒/题", () => {
    const QS = [
      { q: "哪一个是水果？", a: ["胡萝卜", "苹果", "白菜"], ans: 1 },
      { q: "哪一个是交通工具？", a: ["飞机", "轮船", "香蕉"], ans: 2 },
      { q: "哪个不是哺乳动物？", a: ["鲸鱼", "蝙蝠", "鲨鱼"], ans: 2 },
      { q: "哪一个是乐器？", a: ["小提琴", "油画", "雕塑"], ans: 0 },
      { q: "哪个不是颜色？", a: ["金色", "银色", "金属"], ans: 2 },
      { q: "哪个是行星？", a: ["月球", "火星", "彗星"], ans: 1 },
      { q: "哪个不是语言？", a: ["Python", "英语", "法语"], ans: 1 },
      { q: "哪个是调味料？", a: ["食盐", "水杯", "毛巾"], ans: 0 },
      { q: "哪个不是形状？", a: ["三角形", "绿色", "圆形"], ans: 1 },
      { q: "哪个属于体育用品？", a: ["篮球", "钢琴", "画笔"], ans: 0 }
    ];
    const r = api_pick9(QS);
    return { q: r.q, a: r.a, ans: r.ans };
  }, 8, 8);
  function api_pick9(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ================= 快速计数 ================= */
  GB.add({
    id: "count", name: "快速计数", cat: "brain", icon: "🔢",
    desc: "瞬间闪过的方块有几个", tip: "看清方块数量后输入",
    w: 480, h: 560, colors: ["#1a2a3a", "#0a121a"],
    init(api) {
      const ctx = api.ctx, N = 5, S = 64;
      const OX = (480 - N * S) / 2, OY = 100;
      let target, phase, timer, level, flashT;
      function gen() {
        target = api_ri10(4, Math.min(6 + level, 16));
        flashT = Math.max(0.25, 0.6 - level * 0.03);
        phase = "flash";
        // 生成位置
        level += 0;
      }
      let cells;
      function makeCells() {
        cells = new Set();
        while (cells.size < target) cells.add(api_ri10(0, N * N - 1));
      }
      api.onDown((p) => {
        if (phase !== "pick") return;
        const ky = 330;
        for (let i = 0; i <= 16; i++) {
          const x = 40 + (i % 6) * 70, y = ky + Math.floor(i / 6) * 58;
          if (p.x >= x && p.x <= x + 60 && p.y >= y && p.y <= y + 48) {
            if (i === 16) return;
            if (i === target) {
              level++;
              api.setScore(level * 100);
              api.beep(760, 0.09, "sine", 0.05);
              setTimeout(() => { if (!api.over) { gen(); makeCells(); } }, 450);
              phase = "wait";
            } else {
              api.over("数错了", "是 " + target + " 个 · 到达第 " + level + " 关");
            }
            return;
          }
        }
      });
      level = 0; gen(); makeCells();
      api.loop((dt) => {
        if (phase === "flash") {
          flashT -= dt;
          if (flashT <= 0) phase = "pick";
        }
        api.clear("#0a121a");
        api.text("第 " + (level + 1) + " 关 · 有几个方块？", 240, 50, { size: 14, weight: 700, color: "#8fb8ef" });
        for (let i = 0; i < N * N; i++) {
          const x = i % N, y = Math.floor(i / N);
          const px = OX + x * S, py = OY + y * S;
          api.rr(px + 3, py + 3, S - 6, S - 6, 10);
          ctx.fillStyle = phase === "flash" && cells.has(i) ? "#4fd1c5" : "rgba(255,255,255,.05)";
          ctx.fill();
        }
        if (phase === "pick") {
          const ky = 330;
          for (let i = 0; i <= 16; i++) {
            const x = 40 + (i % 6) * 70, y = ky + Math.floor(i / 6) * 58;
            api.rr(x, y, 60, 48, 9);
            ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill();
            api.text(i, x + 30, y + 25, { size: 18, weight: 800 });
          }
        } else if (phase === "wait") {
          api.text("✓", 240, 260, { size: 40, weight: 800, color: "#8fe3a8" });
        }
      });
    }
  });
  function api_ri10(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }

  /* ================= 心算连击 ================= */
  GB.add({
    id: "combo", name: "心算连击", cat: "brain", icon: "⚡",
    desc: "连续答对累积倍率", tip: "答对涨倍率，答错归零 · 限时 45 秒",
    w: 480, h: 560, colors: ["#2a1a1a", "#120808"],
    init(api) {
      const ctx = api.ctx;
      let a, b, ans, t, score, streak, dead, input;
      function gen() {
        const r = api_ri11(0, 2);
        if (r === 0) { a = api_ri11(12, 79); b = api_ri11(12, 79); ans = a + b; }
        else if (r === 1) { a = api_ri11(40, 99); b = api_ri11(3, a - 5); ans = a - b; }
        else { a = api_ri11(3, 14); b = api_ri11(3, 14); ans = a * b; }
        input = "";
      }
      function reset() {
        t = 45; score = 0; streak = 0; dead = false;
        api.setScore(0);
        gen();
      }
      api.onKey((k) => {
        if (dead) return;
        if (/^[0-9]$/.test(k)) input += k;
        else if (k === "Backspace") input = input.slice(0, -1);
        else if (k === "Enter" || k === " ") {
          if (+input === ans) {
            streak++;
            score += 50 * Math.min(5, 1 + Math.floor(streak / 3));
            api.setScore(score);
            api.beep(600 + Math.min(600, streak * 40), 0.05, "sine", 0.045);
          } else {
            streak = 0;
            api.beep(160, 0.12, "square", 0.05);
          }
          gen();
        }
      });
      // 屏幕键盘
      api.onDown((p) => {
        if (dead) return;
        const ky = 330;
        const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "⌫", "✓"];
        for (let i = 0; i < 12; i++) {
          const x = 60 + (i % 3) * 126, y = ky + Math.floor(i / 3) * 56;
          if (p.x >= x && p.x <= x + 110 && p.y >= y && p.y <= y + 46) {
            const key = KEYS[i];
            if (key === "⌫") input = input.slice(0, -1);
            else if (key === "✓") {
              if (+input === ans) {
                streak++;
                score += 50 * Math.min(5, 1 + Math.floor(streak / 3));
                api.setScore(score);
                api.beep(600 + Math.min(600, streak * 40), 0.05, "sine", 0.045);
              } else { streak = 0; api.beep(160, 0.12, "square", 0.05); }
              gen();
            } else input += key;
            return;
          }
        }
      });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t -= dt;
          if (t <= 0) { dead = true; api.over("时间到！", "得分 " + score + " · 最高连击见倍率"); }
        }
        api.clear("#120808");
        api.text(Math.max(0, Math.ceil(t)) + "s · 连击 ×" + streak, 240, 46, { size: 15, weight: 800, color: "#e8c9c9" });
        api.rr(90, 90, 300, 130, 18);
        ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fill();
        api.text(a + " × " + b === "×" ? "" : "", 0, 0, { alpha: 0 });
        api.text((a) + " ? " + (b), 240, 140, { size: 15, color: "#8a6a6a" });
        api.text(input || "…", 240, 180, { size: 40, weight: 800, color: "#ffd75e" });
        api.text(a + " × " + b, 240, 110, { size: 26, weight: 800, color: "#fff" });
        const ky = 330;
        const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "⌫", "✓"];
        for (let i = 0; i < 12; i++) {
          const x = 60 + (i % 3) * 126, y = ky + Math.floor(i / 3) * 56;
          api.rr(x, y, 110, 46, 10);
          ctx.fillStyle = KEYS[i] === "✓" ? "rgba(105,219,124,.3)" : "rgba(255,255,255,.08)";
          ctx.fill();
          api.text(KEYS[i], x + 55, y + 24, { size: 19, weight: 800 });
        }
      });
    }
  });
  function api_ri11(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }

  /* ================= 图形序列 ================= */
  GB.add({
    id: "shapes", name: "图形序列", cat: "brain", icon: "🔷",
    desc: "观察图形变化规律选出下一个", tip: "形状和颜色都在变化",
    w: 480, h: 560, colors: ["#1a2a3a", "#0a121a"],
    init(api) {
      const ctx = api.ctx;
      const SHAPES = ["●", "▲", "■", "◆"];
      const COLS = ["#ff6b6b", "#4dabf7", "#69db7c", "#ffd43b"];
      let seq, ans, opts, round;
      function gen() {
        const si = api_ri12(0, 3), ci = api_ri12(0, 3);
        const sd = api_ri12(1, 3), cd = api_ri12(1, 3);
        seq = [];
        for (let i = 0; i < 4; i++) {
          seq.push({ s: (si + sd * i) % 4, c: (ci + cd * i) % 4 });
        }
        ans = { s: (si + sd * 4) % 4, c: (ci + cd * 4) % 4 };
        const set = new Set();
        opts = [];
        while (opts.length < 4) {
          const o = { s: api_ri12(0, 3), c: api_ri12(0, 3) };
          const k = o.s + "-" + o.c;
          if (set.has(k)) continue;
          set.add(k);
          opts.push(o);
        }
        if (!opts.some((o) => o.s === ans.s && o.c === ans.c)) opts[api_ri12(0, 3)] = { ...ans };
        round++;
      }
      api.onDown((p) => {
        for (let i = 0; i < 4; i++) {
          const x = 40 + i * 105;
          if (p.x >= x && p.x <= x + 90 && p.y >= 330 && p.y <= 430) {
            if (opts[i].s === ans.s && opts[i].c === ans.c) {
              api.setScore(api.score + 150);
              api.beep(760, 0.07, "sine", 0.05);
              setTimeout(() => { if (!api.over) gen(); }, 350);
            } else {
              api.beep(170, 0.12, "square", 0.05);
            }
            return;
          }
        }
      });
      round = 0;
      gen();
      api.setScore(0);
      api.loop(() => {
        api.clear("#0a121a");
        api.text("序列的下一项是？", 240, 60, { size: 15, weight: 700, color: "#8fb8ef" });
        seq.forEach((o, i) => {
          api.text(SHAPES[o.s], 90 + i * 100, 220, { size: 40, color: COLS[o.c] });
          if (i < 3) api.text("→", 140 + i * 100, 220, { size: 18, color: "#3a4a5a" });
        });
        api.text("?", 490, 220, { size: 34, weight: 800, color: "#ffd75e" });
        opts.forEach((o, i) => {
          const x = 40 + i * 105;
          api.rr(x, 330, 90, 100, 14);
          ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 1; ctx.stroke();
          api.text(SHAPES[o.s], x + 45, 380, { size: 34, color: COLS[o.c] });
        });
        api.text("第 " + round + " 题", 24, 36, { size: 12, color: "#4a5a6a", align: "left" });
      });
    }
  });
  function api_ri12(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }

  /* ================= 平衡天平 ================= */
  quizGame("balance", "平衡天平", "⚖️", "哪边更重？", "限时 8 秒/题", () => {
    const w1 = api_ri13(1, 9), w2 = api_ri13(1, 9);
    const opts = ["左边重", "右边重", "一样重"];
    const ans = w1 > w2 ? 0 : w2 > w1 ? 1 : 2;
    return { q: "左：■×" + w1 + "（每个 1kg）   右：■×" + w2, a: opts, ans };
  }, 8, 8);
  function api_ri13(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }

  /* ================= 常识问答 ================= */
  quizGame("trivia", "百科问答", "📚", "涵盖天文地理生活常识", "限时 8 秒/题", () => {
    const QS = [
      { q: "地球上最高的山峰是？", a: ["珠穆朗玛峰", "乞力马扎罗", "富士山"], ans: 0 },
      { q: "光速大约是每秒多少公里？", a: ["3 万", "30 万", "300 万"], ans: 1 },
      { q: "人体最大的器官是？", a: ["肝脏", "大脑", "皮肤"], ans: 2 },
      { q: "一年有多少天（平年）？", a: ["364", "365", "366"], ans: 1 },
      { q: "世界上最大的海洋是？", a: ["大西洋", "印度洋", "太平洋"], ans: 2 },
      { q: "水的化学式是？", a: ["H₂O", "CO₂", "O₂"], ans: 0 },
      { q: "中国最长的河流是？", a: ["黄河", "长江", "珠江"], ans: 1 },
      { q: "声音在哪种介质中传播最快？", a: ["空气", "水", "钢铁"], ans: 2 },
      { q: "太阳系中最大的行星是？", a: ["木星", "土星", "地球"], ans: 0 },
      { q: "蜜蜂通过什么方式交流？", a: ["跳舞", "唱歌", "气味"], ans: 0 },
      { q: "彩虹有几种颜色？", a: ["5", "6", "7"], ans: 2 },
      { q: "一小时有多少秒？", a: ["3600", "360", "6000"], ans: 0 }
    ];
    const r = api_pick14(QS);
    return { q: r.q, a: r.a, ans: r.ans };
  }, 8, 8);
  function api_pick14(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ================= 逆向记忆 ================= */
  GB.add({
    id: "reversemem", name: "逆向记忆", cat: "brain", icon: "🔄",
    desc: "按相反顺序点回灯光序列", tip: "看序列后倒着点回去",
    w: 480, h: 560, colors: ["#2a2a1a", "#121208"],
    init(api) {
      const ctx = api.ctx;
      const PADS = [
        { x: 70, y: 110, c: "#4dabf7", f: 330 },
        { x: 250, y: 110, c: "#ff6b6b", f: 392 },
        { x: 70, y: 290, c: "#69db7c", f: 494 },
        { x: 250, y: 290, c: "#ffd43b", f: 587 }
      ];
      let seq, input, show, showI, showT, level, playing;
      function next() {
        seq.push(api.ri(0, 3));
        input = []; showI = 0; showT = 0; playing = true;
      }
      function reset() { seq = []; level = 0; playing = true; next(); }
      function flash(i) { show = i; showT = 0.3; api.beep(PADS[i].f, 0.2, "sine", 0.055); }
      api.onDown((p) => {
        if (playing) return;
        for (let i = 0; i < 4; i++) {
          const d = PADS[i];
          if (p.x >= d.x && p.x <= d.x + 160 && p.y >= d.y && p.y <= d.y + 160) {
            flash(i);
            input.push(i);
            const k = input.length - 1;
            if (seq[seq.length - 1 - k] !== i) {
              api.over("顺序错了", "完成 " + (seq.length - 1) + " 步");
              return;
            }
            if (input.length === seq.length) {
              level = seq.length;
              api.setScore(level * 120);
              setTimeout(() => { if (!api.over) next(); }, 550);
              playing = true;
            }
            return;
          }
        }
      });
      reset();
      api.loop((dt) => {
        if (playing) {
          showT -= dt;
          if (showT <= 0) {
            show = -1;
            if (showT < -0.22) {
              if (showI < seq.length) { flash(seq[showI]); showI++; showT = 0.4; }
              else playing = false;
            }
          }
        } else if (show >= 0) {
          showT -= dt;
          if (showT <= 0) show = -1;
        }
        api.clear("#121208");
        api.text("长度 " + seq.length + " · 倒着点！", 240, 44, { size: 14, weight: 800, color: "#e8e0a8" });
        PADS.forEach((d, i) => {
          api.rr(d.x, d.y, 160, 160, 22);
          const on = show === i;
          ctx.fillStyle = on ? d.c : d.c + "44";
          if (on) { ctx.shadowColor = d.c; ctx.shadowBlur = 26; }
          ctx.fill();
          ctx.shadowBlur = 0;
        });
        api.text("↑ 先点最后一个亮起的灯", 240, 520, { size: 11, color: "#7a7a4a" });
      });
    }
  });
  function api_ri15(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }

  /* ================= 方向记忆 ================= */
  GB.add({
    id: "direction", name: "方向记忆", cat: "brain", icon: "🧭",
    desc: "记住箭头方向序列并复现", tip: "方向键 / 点箭头按顺序输入",
    w: 480, h: 560, colors: ["#1a2a4a", "#0a101e"],
    init(api) {
      const ctx = api.ctx;
      const ARROWS = ["↑", "→", "↓", "←"];
      const KEYS = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3, w: 0, d: 1, s: 2, a: 3 };
      let seq, input, phase, timer, level;
      function gen() {
        seq = Array.from({ length: Math.min(3 + level, 9) }, () => api_ri16(0, 3));
        input = []; phase = "show"; timer = Math.max(1.2, 2.6 - level * 0.12);
      }
      function good() {
        level++;
        api.setScore(level * 130);
        api.beep(760, 0.1, "sine", 0.05);
        setTimeout(() => { if (!api.over) gen(); }, 450);
        phase = "wait";
      }
      function check() {
        if (input.length === seq.length) {
          if (input.every((v, i) => v === seq[i])) good();
          else {
            api.beep(160, 0.14, "square", 0.05);
            api.over("记错了", "通过 " + level + " 关");
          }
        }
      }
      api.onKey((k) => {
        if (phase !== "input") return;
        if (KEYS[k] != null) { input.push(KEYS[k]); api.beep(440, 0.04, "sine", 0.04); check(); }
      });
      api.onDown((p) => {
        if (phase !== "input") return;
        for (let i = 0; i < 4; i++) {
          const x = 60 + i * 100;
          if (p.x >= x && p.x <= x + 80 && p.y >= 400 && p.y <= 480) {
            input.push(i);
            api.beep(440, 0.04, "sine", 0.04);
            check();
            return;
          }
        }
      });
      level = 0; gen();
      api.loop((dt) => {
        if (phase === "show") {
          timer -= dt;
          if (timer <= 0) phase = "input";
        }
        api.clear("#0a101e");
        api.text(phase === "show" ? "记住方向顺序" : "按顺序点击方向", 240, 56, { size: 15, weight: 700, color: "#8fb8ef" });
        api.text("第 " + (level + 1) + " 关 · " + seq.length + " 步", 240, 86, { size: 12, color: "#4a5a7a" });
        if (phase === "show") {
          const per = Math.min(70, 380 / seq.length);
          seq.forEach((v, i) => {
            api.text(ARROWS[v], 240 + (i - (seq.length - 1) / 2) * per, 220, { size: 38, weight: 800, color: "#ffd75e" });
          });
        } else if (phase === "input") {
          input.forEach((v, i) => {
            api.text(ARROWS[v], 240 + (i - (input.length - 1) / 2) * 44, 220, { size: 30, weight: 800, color: "#8fe3a8" });
          });
          for (let i = 0; i < 4; i++) {
            const x = 60 + i * 100;
            api.rr(x, 400, 80, 80, 14);
            ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill();
            api.text(ARROWS[i], x + 40, 441, { size: 30, weight: 800 });
          }
        } else {
          api.text("✓", 240, 220, { size: 44, weight: 800, color: "#8fe3a8" });
        }
      });
    }
  });
  function api_ri16(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }

  /* ================= 目测估算 ================= */
  quizGame("estimate", "目测估算", "👀", "估计有多少个圆点", "限时 7 秒/题", () => {
    const n = api_ri17(15, 80);
    return {
      q: "下图区域里大约有多少个圆点？（±15% 算对）",
      a: ["约 " + Math.round(n * 0.55), "约 " + n, "约 " + Math.round(n * 1.6)],
      ans: 1, _n: n
    };
  }, 7, 7, (ok, api) => {});
  function api_ri17(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }

  /* ================= 面积估算 ================= */
  GB.add({
    id: "areaeye", name: "面积眼力", cat: "brain", icon: "🟦",
    desc: "哪块彩色区域面积更大？", tip: "凭眼力判断 · 限时 30 秒",
    w: 480, h: 520, colors: ["#1a2a3a", "#0a121a"],
    init(api) {
      const ctx = api.ctx;
      let a1, a2, c1, c2, t, score, dead, answered;
      function gen() {
        a1 = api.rand(6000, 40000);
        a2 = a1 * api.rand(0.65, 1.5);
        c1 = "#4dabf7"; c2 = "#ff922b";
        answered = null;
      }
      api.onDown((p) => {
        if (dead || answered != null) return;
        if (p.y >= 330 && p.y <= 460) {
          if (p.x >= 50 && p.x <= 220) pick(0);
          else if (p.x >= 260 && p.x <= 430) pick(1);
        }
      });
      function pick(i) {
        answered = i;
        const correct = a1 > a2 ? 0 : 1;
        if (i === correct) {
          score += 150;
          api.setScore(score);
          api.beep(760, 0.08, "sine", 0.05);
        } else {
          api.beep(170, 0.12, "square", 0.05);
        }
        setTimeout(() => { if (!dead && !api.over) gen(); }, 550);
      }
      t = 30; score = 0; dead = false;
      gen();
      api.setScore(0);
      api.loop((dt) => {
        if (!dead) {
          t -= dt;
          if (t <= 0) { dead = true; api.over("时间到！", "得分 " + score); }
        }
        api.clear("#0a121a");
        api.text("哪块面积更大？" + Math.max(0, t).toFixed(1) + "s", 240, 50, { size: 15, weight: 700, color: "#8fb8ef" });
        drawShape(240, 200, Math.sqrt(a1 / Math.PI), c1);
        // 两块分开画
        ctx.clearRect(0, 90, 480, 220);
        const r1 = Math.sqrt(a1 / Math.PI) * 0.55, r2 = Math.sqrt(a2 / Math.PI) * 0.55;
        ctx.save();
        ctx.translate(130, 200);
        ctx.fillStyle = c1;
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const a = i / 24 * Math.PI * 2;
          const rr = r1 * (0.8 + 0.2 * Math.sin(i * 2.1));
          i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(350, 200);
        ctx.fillStyle = c2;
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const a = i / 24 * Math.PI * 2;
          const rr = r2 * (0.8 + 0.2 * Math.sin(i * 2.1 + 2));
          i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath(); ctx.fill();
        ctx.restore();
        [["左边", 50, 220], ["右边", 260, 430]].forEach(([txt, x, w]) => {
          api.rr(x, 330, w - x, 130, 16);
          ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fill();
          api.text(txt, (x + w) / 2, 395, { size: 19, weight: 700 });
        });
      });
      function drawShape() {}
    }
  });
})();
