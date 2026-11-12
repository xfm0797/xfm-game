/* ==========================================================
   extra.js — 补充游戏 10 款
   ========================================================== */
(function () {
  "use strict";

  /* ---------- 问答工厂（复用 brain.js 的模式） ---------- */
  function quiz(id, name, icon, desc, tip, questions, perQ) {
    GB.add({
      id, name, cat: "brain", icon, desc, tip,
      w: 480, h: 600, colors: ["#1a2a4a", "#0a101e"],
      init(api) {
        const ctx = api.ctx;
        let order, qi, score, dead, answered, streak;
        function reset() {
          order = api.shuffle(questions.map((_, i) => i));
          qi = 0; score = 0; dead = false; answered = null; streak = 0;
          api.setScore(0);
        }
        api.onDown((p) => {
          if (dead) return;
          const q = questions[order[qi % order.length]];
          for (let i = 0; i < q.a.length; i++) {
            const y = 350 + i * 60;
            if (p.x >= 40 && p.x <= 440 && p.y >= y && p.y <= y + 50) {
              answered = i;
              if (i === q.ans) { streak++; score += 100 + streak * 15; api.setScore(score); api.beep(720, 0.07, "sine", 0.05); }
              else { streak = 0; api.beep(170, 0.12, "square", 0.05); }
              setTimeout(() => {
                if (dead) return;
                qi++;
                if (qi >= order.length) { api.over("题库刷完！", "最终得分 " + score, true); }
                else answered = null;
              }, 450);
              return;
            }
          }
        });
        reset();
        api.loop(() => {
          api.clear("#0a101e");
          if (qi >= order.length) return;
          const q = questions[order[qi]];
          api.text("第 " + (qi + 1) + " / " + order.length + " 题 · 连对 ×" + streak, 24, 40, { size: 12.5, weight: 700, color: "#8fb8ef", align: "left" });
          ctx.save();
          api.font(16.5, 700);
          ctx.fillStyle = "#eef1f8";
          ctx.textAlign = "center";
          const lines = [];
          let line = "";
          String(q.q).split("").forEach((ch) => {
            if (ctx.measureText(line + ch).width > 380) { lines.push(line); line = ch; }
            else line += ch;
          });
          lines.push(line);
          lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, 240, 160 + i * 38));
          ctx.restore();
          q.a.forEach((opt, i) => {
            const y = 350 + i * 60;
            api.rr(40, y, 400, 50, 12);
            if (answered == null) ctx.fillStyle = "rgba(255,255,255,.06)";
            else if (i === q.ans) ctx.fillStyle = "rgba(105,219,124,.3)";
            else if (i === answered) ctx.fillStyle = "rgba(255,107,107,.3)";
            else ctx.fillStyle = "rgba(255,255,255,.03)";
            ctx.fill();
            api.text(opt, 240, y + 26, { size: 16, weight: 700 });
          });
        });
      }
    });
  }

  quiz("idiom", "成语达人", "📜", "成语填空题库 30 题", "选出正确的字", [
    { q: "画蛇添（ ）", a: ["足", "脚", "手"], ans: 0 },
    { q: "守株待（ ）", a: ["兔", "鹿", "鸟"], ans: 0 },
    { q: "亡羊补（ ）", a: ["牢", "圈", "栏"], ans: 0 },
    { q: "掩耳盗（ ）", a: ["铃", "钟", "鼓"], ans: 0 },
    { q: "井底之（ ）", a: ["蛙", "鱼", "龟"], ans: 0 },
    { q: "杯弓蛇（ ）", a: ["影", "形", "像"], ans: 0 },
    { q: "刻舟求（ ）", a: ["剑", "刀", "舟"], ans: 0 },
    { q: "狐假虎（ ）", a: ["威", "威风", "胆"], ans: 0 },
    { q: "一箭双（ ）", a: ["雕", "鸟", "鹰"], ans: 0 },
    { q: "对牛弹（ ）", a: ["琴", "歌", "曲"], ans: 0 },
    { q: "画龙点（ ）", a: ["睛", "眼", "头"], ans: 0 },
    { q: "水滴石（ ）", a: ["穿", "破", "碎"], ans: 0 },
    { q: "望梅止（ ）", a: ["渴", "饿", "馋"], ans: 0 },
    { q: "卧薪尝（ ）", a: ["胆", "苦", "药"], ans: 0 },
    { q: "破釜沉（ ）", a: ["舟", "船", "桥"], ans: 0 },
    { q: "四面楚（ ）", a: ["歌", "旗", "鼓"], ans: 0 },
    { q: "纸上谈（ ）", a: ["兵", "战", "武"], ans: 0 },
    { q: "负荆请（ ）", a: ["罪", "谅", "饶"], ans: 0 },
    { q: "完璧归（ ）", a: ["赵", "主", "国"], ans: 0 },
    { q: "三顾茅（ ）", a: ["庐", "屋", "房"], ans: 0 },
    { q: "草木皆（ ）", a: ["兵", "敌", "剑"], ans: 0 },
    { q: "指鹿为（ ）", a: ["马", "牛", "羊"], ans: 0 },
    { q: "悬梁刺（ ）", a: ["股", "手", "背"], ans: 0 },
    { q: "闻鸡起（ ）", a: ["舞", "床", "早"], ans: 0 },
    { q: "黄粱一（ ）", a: ["梦", "觉", "枕"], ans: 0 },
    { q: "班门弄（ ）", a: ["斧", "锤", "艺"], ans: 0 },
    { q: "囫囵吞（ ）", a: ["枣", "饭", "瓜"], ans: 0 },
    { q: "买椟还（ ）", a: ["珠", "宝", "玉"], ans: 0 },
    { q: "滥竽充（ ）", a: ["数", "样", "量"], ans: 0 },
    { q: "鹤立鸡（ ）", a: ["群", "群中", "堆"], ans: 0 }
  ], 10);

  quiz("geoquiz", "地理问答", "🗺️", "世界与中国地理常识", "限时作答", [
    { q: "世界上面积最大的国家是？", a: ["中国", "俄罗斯", "加拿大"], ans: 1 },
    { q: "中国面积最大的省级行政区是？", a: ["西藏", "新疆", "内蒙古"], ans: 1 },
    { q: "世界上最长的山脉是？", a: ["安第斯山", "喜马拉雅山", "阿尔卑斯山"], ans: 0 },
    { q: "埃及最著名的古迹是？", a: ["金字塔", "长城", "泰姬陵"], ans: 0 },
    { q: "中国最北的城市是？", a: ["漠河", "黑河", "满洲里"], ans: 0 },
    { q: "世界最大的沙漠是？", a: ["撒哈拉", "戈壁", "塔克拉玛干"], ans: 0 },
    { q: "珠穆朗玛峰位于中国和哪国边境？", a: ["尼泊尔", "印度", "不丹"], ans: 0 },
    { q: "日本的首都是？", a: ["大阪", "东京", "京都"], ans: 1 },
    { q: "长江注入哪个海？", a: ["东海", "南海", "黄海"], ans: 0 },
    { q: "世界上最深的湖是？", a: ["贝加尔湖", "里海", "苏必利尔湖"], ans: 0 },
    { q: "意大利的著名水城是？", a: ["威尼斯", "罗马", "佛罗伦萨"], ans: 0 },
    { q: "中国最大的岛屿是？", a: ["海南岛", "台湾岛", "崇明岛"], ans: 1 },
    { q: "赤道穿过的大洲不包括？", a: ["欧洲", "非洲", "南美洲"], ans: 0 },
    { q: "澳大利亚的首都是？", a: ["悉尼", "堪培拉", "墨尔本"], ans: 1 },
    { q: "世界最高高原是？", a: ["青藏高原", "巴西高原", "黄土高原"], ans: 0 }
  ], 10);

  quiz("sciquiz", "科学问答", "🔬", "物理化学生物小知识", "限时作答", [
    { q: "人体含水量最高的器官是？", a: ["大脑", "肺", "骨骼"], ans: 1 },
    { q: "地球上最早出现的生命是？", a: ["海洋微生物", "恐龙", "蕨类"], ans: 0 },
    { q: "血液中运输氧气的是？", a: ["白细胞", "红细胞", "血小板"], ans: 1 },
    { q: "声音不能在哪种介质传播？", a: ["真空", "水", "铁"], ans: 0 },
    { q: " DNA 的中文全称是？", a: ["脱氧核糖核酸", "核糖核酸", "蛋白质"], ans: 0 },
    { q: "植物进行光合作用主要靠？", a: ["叶绿体", "线粒体", "细胞核"], ans: 0 },
    { q: "彩虹形成是因为光的？", a: ["折射与反射", "衍射", "干涉"], ans: 0 },
    { q: "第一登月的人是？", a: ["阿姆斯特朗", "加加林", "奥尔德林"], ans: 0 },
    { q: "元素周期表中第一个元素是？", a: ["氢", "氦", "锂"], ans: 0 },
    { q: "冰水混合物的温度是？", a: ["0℃", "4℃", "-1℃"], ans: 0 },
    { q: "蝴蝶的幼虫是？", a: ["毛毛虫", "蛆", "蝌蚪"], ans: 0 },
    { q: "地球自转一圈约多久？", a: ["24 小时", "12 小时", "365 天"], ans: 0 },
    { q: "疫苗的作用是？", a: ["预防传染病", "直接杀菌", "止痛"], ans: 0 },
    { q: "万有引力定律由谁提出？", a: ["牛顿", "爱因斯坦", "伽利略"], ans: 0 },
    { q: "人体正常体温约是？", a: ["37℃", "35℃", "39℃"], ans: 0 }
  ], 10);

  /* ================= 4×4 数独 ================= */
  GB.add({
    id: "sudoku4", name: "萌新数独", cat: "puzzle", icon: "🧮",
    desc: "4×4 数独，最适合入门", tip: "每行每列每宫 1-4 不重复",
    w: 480, h: 560, colors: ["#33415c", "#111827"],
    init(api) {
      const ctx = api.ctx, N = 4, S = 84;
      const OX = (480 - N * S) / 2, OY = 110;
      let sol, cur, given, sel;
      function ok(b, i, v) {
        const x = i % N, y = Math.floor(i / N);
        for (let j = 0; j < N; j++) {
          if (j !== x && b[y * N + j] === v) return false;
          if (j !== y && b[j * N + x] === v) return false;
        }
        const bx = Math.floor(x / 2) * 2, by = Math.floor(y / 2) * 2;
        for (let yy = by; yy < by + 2; yy++) for (let xx = bx; xx < bx + 2; xx++) {
          if (yy * N + xx !== i && b[yy * N + xx] === v) return false;
        }
        return true;
      }
      function solve(b) {
        const i = b.indexOf(0);
        if (i < 0) return true;
        const vs = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
        for (const v of vs) {
          if (ok(b, i, v)) { b[i] = v; if (solve(b)) return true; b[i] = 0; }
        }
        return false;
      }
      function reset() {
        const base = Array(16).fill(0);
        solve(base);
        sol = base.slice();
        given = base.map((v) => (Math.random() < 0.45 ? v : 0));
        if (given.filter((v) => v).length < 6) given[0] = sol[0];
        cur = given.slice();
        sel = -1;
      }
      api.onDown((p) => {
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx >= 0 && cy >= 0 && cx < N && cy < N) { sel = cy * N + cx; api.beep(420, 0.03, "sine", 0.03); return; }
        const ny = OY + N * S + 24;
        if (p.y >= ny && p.y <= ny + 56) {
          for (let v = 1; v <= 4; v++) {
            const x = OX + (v - 1) * (S + 10);
            if (p.x >= x && p.x <= x + S) {
              if (sel >= 0 && given[sel] === 0) {
                cur[sel] = v;
                api.beep(480, 0.05, "sine", 0.04);
                if (cur.every((vv, i) => vv === sol[i])) {
                  api.setScore(600);
                  api.over("完成！", "全部正确", true);
                }
              }
              return;
            }
          }
          const cx2 = OX + 4 * (S + 10);
          if (p.x >= cx2 && p.x <= cx2 + S && sel >= 0 && given[sel] === 0) cur[sel] = 0;
        }
      });
      reset();
      api.loop(() => {
        api.clear("#111827");
        api.text("萌新数独 4×4", 24, 44, { size: 15, weight: 700, color: "#a5b8dd", align: "left" });
        for (let i = 0; i < 16; i++) {
          const x = i % N, y = Math.floor(i / N);
          const px = OX + x * S, py = OY + y * S;
          ctx.fillStyle = sel === i ? "rgba(124,92,255,.3)" : "rgba(255,255,255,.045)";
          ctx.fillRect(px + 1, py + 1, S - 2, S - 2);
          if (cur[i]) api.text(cur[i], px + S / 2, py + S / 2 + 1, { size: 34, weight: 800, color: given[i] ? "#8fb8ef" : "#ffd75e" });
        }
        ctx.strokeStyle = "#48586f";
        for (let i = 0; i <= N; i++) {
          ctx.lineWidth = i % 2 === 0 ? 2.6 : 1;
          ctx.beginPath(); ctx.moveTo(OX + i * S, OY); ctx.lineTo(OX + i * S, OY + N * S); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(OX, OY + i * S); ctx.lineTo(OX + N * S, OY + i * S); ctx.stroke();
        }
        const ny = OY + N * S + 24;
        for (let v = 1; v <= 4; v++) {
          const x = OX + (v - 1) * (S + 10);
          api.rr(x, ny, S, 56, 10);
          ctx.fillStyle = "rgba(255,255,255,.09)"; ctx.fill();
          api.text(v, x + S / 2, ny + 29, { size: 24, weight: 800 });
        }
        const cx = OX + 4 * (S + 10);
        api.rr(cx, ny, S, 56, 10);
        ctx.fillStyle = "rgba(255,107,107,.25)"; ctx.fill();
        api.text("清除", cx + S / 2, ny + 29, { size: 15 });
      });
    }
  });

  /* ================= 冰面滑行 ================= */
  GB.add({
    id: "ice", name: "冰面滑行", cat: "puzzle", icon: "🧊",
    desc: "在冰面上滑到终点，撞墙才停", tip: "方向键滑行 · 滑到 ◎ 才算过关",
    w: 480, h: 560, colors: ["#123a4a", "#06181f"],
    init(api) {
      const ctx = api.ctx, N = 9, S = 44;
      const OX = (480 - N * S) / 2, OY = 110;
      const MAPS = [
        {
          walls: [12, 13, 22, 31, 40, 49, 58, 67, 76, 14, 23, 32],
          start: 0, goal: 80
        },
        {
          walls: [10, 11, 19, 28, 37, 46, 25, 34, 43, 52, 61, 70],
          start: 4, goal: 76
        },
        {
          walls: [2, 11, 20, 29, 38, 47, 56, 65, 74, 30, 39, 48, 57],
          start: 0, goal: 78
        }
      ];
      let walls, px, py, goal, moves, level, won;
      function load(i) {
        const m = MAPS[i % MAPS.length];
        walls = new Set(m.walls);
        px = m.start % N; py = Math.floor(m.start / N);
        goal = m.goal;
        moves = 0; won = false;
      }
      function solid(x, y) {
        if (x < 0 || y < 0 || x >= N || y >= N) return true;
        return walls.has(y * N + x);
      }
      function slide(dx, dy) {
        if (won) return;
        let moved = false;
        while (!solid(px + dx, py + dy)) { px += dx; py += dy; moved = true; }
        if (moved) {
          moves++;
          api.beep(500, 0.06, "sine", 0.035, 700);
          if (py * N + px === goal) {
            won = true;
            api.setScore(400 - moves * 5);
            api.over("到达终点！", moves + " 步", true);
          }
        } else api.beep(180, 0.05, "square", 0.03);
      }
      api.onKey((k) => {
        const m = { ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0], ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1] };
        if (m[k]) slide(m[k][0], m[k][1]);
        if (k === "r" || k === "R") load(level);
      });
      api.onDown((p) => {
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (Math.abs(cx - px) + Math.abs(cy - py) === 1) slide(cx - px, cy - py);
      });
      level = 0; load(0);
      api.loop(() => {
        api.clear("#06181f");
        api.text("第 " + (level + 1) + " 关 · " + moves + " 步", 24, 44, { size: 14, weight: 700, color: "#8fc7ee", align: "left" });
        api.text("R 重开本关", 456, 44, { size: 11, color: "#3f6a7e", align: "right" });
        for (let i = 0; i < N * N; i++) {
          const x = i % N, y = Math.floor(i / N);
          const px2 = OX + x * S, py2 = OY + y * S;
          api.rr(px2 + 2, py2 + 2, S - 4, S - 4, 8);
          ctx.fillStyle = walls.has(i) ? "#2a5a7a" : "rgba(190,235,255,.06)";
          ctx.fill();
        }
        api.rr(OX + (goal % N) * S + 6, OY + Math.floor(goal / N) * S + 6, S - 12, S - 12, 8);
        ctx.fillStyle = "rgba(255,179,71,.45)"; ctx.fill();
        ctx.beginPath(); ctx.arc(OX + (px + 0.5) * S, OY + (py + 0.5) * S, S * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = "#4fd1c5"; ctx.shadowColor = "#4fd1c5"; ctx.shadowBlur = 12; ctx.fill();
        ctx.shadowBlur = 0;
      });
    }
  });

  /* ================= 节奏点击 ================= */
  GB.add({
    id: "rhythm", name: "节奏点击", cat: "casual", icon: "🎵",
    desc: "音符落到判定线时点击", tip: "四条轨道 · 音符到线时点击对应列",
    w: 480, h: 600, colors: ["#2a1a3a", "#120a1a"],
    init(api) {
      const ctx = api.ctx, LANES = 4, LW = 110;
      let notes, t, score, combo, dead, miss, hits, spawnT;
      const JUDGE_Y = 520;
      function reset() {
        notes = []; t = 0; score = 0; combo = 0; dead = false; miss = 0; hits = 0; spawnT = 0;
        api.setScore(0);
      }
      function hitLane(l) {
        let best = null, bd = 1e9;
        for (const n of notes) {
          if (n.l !== l || n.hit) continue;
          const d = Math.abs(n.y - JUDGE_Y);
          if (d < bd) { bd = d; best = n; }
        }
        if (best && bd < 60) {
          best.hit = true;
          notes.splice(notes.indexOf(best), 1);
          hits++;
          combo++;
          const pts = bd < 18 ? 300 : bd < 35 ? 150 : 60;
          score += pts + combo * 2;
          api.setScore(score);
          api.beep([520, 620, 720, 820][l], 0.08, "sine", 0.05);
        } else {
          combo = 0;
          api.beep(150, 0.06, "square", 0.035);
        }
      }
      api.onDown((p) => {
        if (dead) return;
        hitLane(api.clamp(Math.floor(p.x / LW), 0, 3));
      });
      api.onKey((k) => {
        const m = { d: 0, f: 1, j: 2, k: 3, D: 0, F: 1, J: 2, K: 3 };
        if (m[k] != null) hitLane(m[k]);
      });
      reset();
      api.loop((dt) => {
        if (!dead) {
          t += dt;
          spawnT -= dt;
          if (spawnT <= 0) {
            spawnT = api.rand(0.3, 0.75);
            notes.push({ l: api.ri(0, 3), y: -30, v: 320 });
            if (Math.random() < 0.3) notes.push({ l: api.ri(0, 3), y: -30, v: 320 });
          }
          for (const n of notes) n.y += n.v * dt;
          for (let i = notes.length - 1; i >= 0; i--) {
            if (notes[i].y > 620) {
              notes.splice(i, 1);
              miss++; combo = 0;
              if (miss >= 15) { dead = true; api.over("失误太多", "命中 " + hits + " 个音符"); }
            }
          }
        }
        api.clear("#120a1a");
        for (let l = 0; l < LANES; l++) {
          ctx.fillStyle = l % 2 ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.05)";
          ctx.fillRect(l * LW, 0, LW, 600);
          api.rr(l * LW + 8, JUDGE_Y - 6, LW - 16, 12, 6);
          ctx.fillStyle = "rgba(79,209,197,.5)"; ctx.fill();
          api.text(["D", "F", "J", "K"][l], l * LW + LW / 2, 575, { size: 13, color: "#4a3a5a" });
        }
        for (const n of notes) {
          api.rr(n.l * LW + 14, n.y - 16, LW - 28, 32, 9);
          ctx.fillStyle = ["#ff6b6b", "#ffd43b", "#69db7c", "#4dabf7"][n.l];
          ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        api.text("连击 ×" + combo, 240, 44, { size: 16, weight: 800, color: combo > 5 ? "#ffd75e" : "#8a7a9a" });
        api.text("失误 " + miss + "/15", 456, 70, { size: 11, color: "#6a5a7a", align: "right" });
      });
    }
  });

  /* ================= 点球大战 ================= */
  GB.add({
    id: "penalty", name: "点球大战", cat: "casual", icon: "⚽",
    desc: "把握时机射门，五轮定胜负", tip: "力量条到黄色区域时点击射门",
    w: 480, h: 600, colors: ["#1a3a24", "#0a1610"],
    init(api) {
      const ctx = api.ctx;
      let power, dirv, shot, round, ps, gs, msg, t, aimX, keeperX;
      function reset() {
        power = 0; dirv = 1; shot = false; round = 0; ps = 0; gs = 0; msg = ""; t = 0;
        aimX = 240; keeperX = 240;
      }
      function shoot() {
        if (shot) return;
        shot = true;
        const zone = power > 0.55 && power < 0.85;
        const corner = aimX < 150 || aimX > 330;
        const keeperTarget = api.pick([90, 240, 390]);
        keeperX = keeperTarget;
        const saved = Math.abs(keeperTarget - aimX) < 70 && power > 0.4;
        const onTarget = zone || corner;
        if (!onTarget) { msg = "打飞了！"; api.beep(160, 0.2, "square", 0.05); }
        else if (saved) { msg = "被扑出来了！"; api.beep(200, 0.15, "square", 0.05); }
        else { msg = "球进了！！"; ps++; api.setScore(api.score + 100); api.beep(760, 0.18, "sine", 0.06); }
        round++;
        if (!onTarget || saved) { /* 对手机会 */ }
        const aiScores = Math.random() < 0.6;
        if (aiScores) gs++;
        t = 1.3;
      }
      api.onDown(() => {
        if (t > 0) return;
        if (round >= 5) { reset(); return; }
        shoot();
      });
      reset();
      api.loop((dt) => {
        if (t > 0) {
          t -= dt;
          if (t <= 0) {
            shot = false; power = 0; dirv = 1; msg = round >= 5 ? "" : msg;
            if (round >= 5) {
              if (ps > gs) api.over("点球大战胜利！", ps + " : " + gs, true);
              else if (ps < gs) api.over("点球大战失利", ps + " : " + gs);
              else api.over("势均力敌", ps + " : " + gs);
            }
          }
        } else if (!shot) {
          power += dirv * dt * 1.4;
          if (power > 1) { power = 1; dirv = -1; }
          if (power < 0) { power = 0; dirv = 1; }
          aimX = 90 + power * 300;
        }
        api.clear("#0a1610");
        // 球门
        ctx.fillStyle = "#e8e6df";
        ctx.fillRect(70, 130, 340, 12);
        ctx.fillRect(70, 130, 12, 150);
        ctx.fillRect(398, 130, 12, 150);
        ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2;
        for (let i = 1; i < 8; i++) {
          ctx.beginPath(); ctx.moveTo(70 + i * 42, 142); ctx.lineTo(70 + i * 42, 280); ctx.stroke();
        }
        // 守门员
        ctx.fillStyle = "#ff8787";
        api.rr(keeperX - 24, 200, 48, 60, 12); ctx.fill();
        api.text("🧍", keeperX, 226, { size: 30 });
        // 球
        ctx.beginPath();
        const by = shot ? 380 - Math.min(1, (1.3 - t) * 2.2) * 220 : 380;
        ctx.arc(aimX, by, 13, 0, Math.PI * 2);
        ctx.fillStyle = "#fff"; ctx.fill();
        // 力量条
        api.rr(90, 460, 300, 24, 12);
        ctx.fillStyle = "rgba(255,255,255,.1)"; ctx.fill();
        api.rr(90 + 0.55 * 300, 460, 0.3 * 300, 24, 0);
        ctx.fillStyle = "rgba(105,219,124,.3)"; ctx.fill();
        api.rr(90, 460, power * 300, 24, 12);
        ctx.fillStyle = power > 0.55 && power < 0.85 ? "#69db7c" : "#ff922b"; ctx.fill();
        api.text("在绿色区域点击射门 · 力量决定角度", 240, 520, { size: 12, color: "#4a7a5a" });
        api.text("你 " + ps + " : " + gs + " AI（第 " + Math.min(5, round + 1) + " 轮）", 240, 70, { size: 15, weight: 800, color: "#8fe3a8" });
        if (msg) api.text(msg, 240, 560, { size: 16, weight: 800, color: "#ffd75e" });
      });
    }
  });

  /* ================= 火柴棒算式 ================= */
  GB.add({
    id: "matchstick", name: "火柴棒算式", cat: "brain", icon: "🔥",
    desc: "移动一根火柴让等式成立", tip: "点击你觉得移动哪根的方案",
    w: 480, h: 560, colors: ["#3a2a1a", "#160f08"],
    init(api) {
      const ctx = api.ctx;
      const QS = [
        { q: "6 + 4 = 3", fix: "把 6 的右上竖移走变成 5，5+4=9？不，正确：6+4=10（把 3 的火柴挪给等号？）", opts: ["6+4=10", "8+4=3→8-4=4"], ans: 1, shown: "8 + 4 = 3 → 8 − 4 = 4" },
        { q: "11 - 1 = 12", opts: ["把 11 变 12", "把 12 变 2"], ans: 1, shown: "11 − 1 = 12 → 11 − 1 = 2？ 正确：12−1=11" },
        { q: "9 + 3 = 5", opts: ["9 变 3", "5 变 8"], ans: 1, shown: "9+3=5 → 9+3=8？ 正确：3+3=6 或 5→8" },
        { q: "14 = 7 - 7", opts: ["等号变减号", "7-7 变 7+7"], ans: 1, shown: "14=7−7 → 14=7+7 错。正确：14=7×2 不行 → 7=7" },
        { q: "5 + 3 = 6", opts: ["5 变 6", "6 变 8"], ans: 1, shown: "5+3=6 → 5+3=8 ✓" },
        { q: "3 - 7 = 4", opts: ["3 变 9", "减号变加号"], ans: 0, shown: "3−7=4 → 9−7=2 错 → 3+7=10 错 → 11−7=4 ✓（3 变 11）" }
      ];
      let order, qi, score, answered;
      function reset() {
        order = api.shuffle(QS.map((_, i) => i));
        qi = 0; score = 0; answered = null;
        api.setScore(0);
      }
      api.onDown((p) => {
        const q = QS[order[qi % order.length]];
        if (answered != null) {
          if (p.y > 480) {
            qi++;
            if (qi >= order.length) api.over("全部完成！", "得分 " + score, true);
            else answered = null;
          }
          return;
        }
        for (let i = 0; i < q.opts.length; i++) {
          const y = 330 + i * 66;
          if (p.x >= 40 && p.x <= 440 && p.y >= y && p.y <= y + 56) {
            answered = i;
            if (i === q.ans) { score += 150; api.setScore(score); api.beep(760, 0.08, "sine", 0.05); }
            else api.beep(170, 0.12, "square", 0.05);
            return;
          }
        }
      });
      reset();
      api.loop(() => {
        api.clear("#160f08");
        if (qi >= order.length) return;
        const q = QS[order[qi]];
        api.text("移动一根火柴修正等式", 24, 40, { size: 13.5, weight: 700, color: "#ffd98a", align: "left" });
        api.rr(40, 110, 400, 130, 16);
        ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fill();
        api.text(q.q, 240, 165, { size: 40, weight: 800, color: "#fff" });
        api.text(q.shown, 240, 262, { size: 11, color: "#8a6d3a" });
        q.opts.forEach((opt, i) => {
          const y = 330 + i * 66;
          api.rr(40, y, 400, 56, 12);
          if (answered == null) ctx.fillStyle = "rgba(255,255,255,.06)";
          else if (i === q.ans) ctx.fillStyle = "rgba(105,219,124,.3)";
          else if (i === answered) ctx.fillStyle = "rgba(255,107,107,.3)";
          else ctx.fillStyle = "rgba(255,255,255,.03)";
          ctx.fill();
          api.text(opt, 240, y + 29, { size: 15, weight: 700 });
        });
        if (answered != null) {
          api.text(answered === q.ans ? "✓ 正确！" : "✗ 再想想", 240, 500, { size: 14, color: answered === q.ans ? "#8fe3a8" : "#ff8787" });
          api.text("点击继续", 240, 528, { size: 11, color: "#6a5a3a" });
        }
      });
    }
  });

  /* ================= 舒尔特进阶（6×6） ================= */
  GB.add({
    id: "schulte6", name: "舒尔特进阶", cat: "casual", icon: "🔠",
    desc: "6×6 大方格，36 个数字", tip: "按 1→36 顺序点击 · 挑战手速",
    w: 520, h: 600, colors: ["#2a2a3a", "#101018"],
    init(api) {
      const ctx = api.ctx, N = 6, S = 74;
      const OX = (520 - N * S) / 2, OY = 110;
      let cells, next, t0;
      function reset() {
        cells = api.shuffle(Array.from({ length: 36 }, (_, i) => i + 1));
        next = 1; t0 = null;
      }
      api.onDown((p) => {
        const cx = Math.floor((p.x - OX) / S), cy = Math.floor((p.y - OY) / S);
        if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
        const v = cells[cy * N + cx];
        if (v === next) {
          if (next === 1) t0 = api.t;
          next++;
          api.beep(400 + next * 12, 0.035, "sine", 0.035);
          if (next > 36) {
            const secs = api.t - t0;
            api.setScore(Math.max(200, Math.round(5000 - secs * 45)));
            api.over("完成！", "用时 " + secs.toFixed(1) + " 秒", true);
          }
        } else api.beep(180, 0.06, "square", 0.035);
      });
      reset();
      api.loop(() => {
        api.clear("#101018");
        api.text("下一个：" + (next <= 36 ? next : "✓"), 24, 44, { size: 15, weight: 800, color: "#c4c8e8", align: "left" });
        if (t0) api.text((api.t - t0).toFixed(1) + "s", 496, 44, { size: 13, color: "#6a6a8a", align: "right" });
        for (let i = 0; i < 36; i++) {
          const x = i % N, y = Math.floor(i / N);
          const px = OX + x * S, py = OY + y * S;
          api.rr(px + 3, py + 3, S - 6, S - 6, 9);
          ctx.fillStyle = cells[i] < next ? "rgba(79,209,197,.12)" : "rgba(255,255,255,.055)";
          ctx.fill();
          api.text(cells[i], px + S / 2, py + S / 2 + 1, {
            size: 19, weight: 800,
            color: cells[i] < next ? "#4a6a6a" : "#e2e6f2"
          });
        }
      });
    }
  });

  /* ================= 猜大小（连续押注） ================= */
  GB.add({
    id: "hilo", name: "猜大小", cat: "board", icon: "🎴",
    desc: "下一张牌比当前大还是小？", tip: "点击「大」或「小」 · 连对越多奖励越高",
    w: 480, h: 560, colors: ["#1a3a2a", "#0a1610"],
    init(api) {
      const ctx = api.ctx;
      let cur, streak, best, msg, busy;
      const RN = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
      function draw() {
        cur = api.ri(0, 12);
      }
      function guess(bigger) {
        if (busy) return;
        busy = true;
        const next = api.ri(0, 12);
        setTimeout(() => {
          const ok = bigger ? next > cur : next < cur;
          if (next === cur) msg = "相同！继续";
          else if (ok) {
            streak++;
            best = Math.max(best, streak);
            api.setScore(streak * 100);
            msg = "✓ 连对 ×" + streak;
            api.beep(700, 0.08, "sine", 0.05);
          } else {
            msg = "✗ 连击中断";
            api.beep(180, 0.12, "square", 0.05);
            streak = 0;
          }
          cur = next;
          busy = false;
        }, 350);
      }
      streak = 0; best = 0; msg = "猜下一张牌";
      draw();
      api.setScore(0);
      api.onDown((p) => {
        if (busy) return;
        if (p.y >= 380 && p.y <= 470) {
          if (p.x >= 50 && p.x <= 225) guess(true);
          else if (p.x >= 255 && p.x <= 430) guess(false);
        }
      });
      api.loop(() => {
        api.clear("#0a1610");
        api.text("当前牌", 240, 60, { size: 13, color: "#4a7a5a" });
        api.rr(190, 90, 100, 140, 12);
        ctx.fillStyle = "#f4f6fa"; ctx.fill();
        api.text(RN[cur], 240, 160, { size: 34, weight: 800, color: "#1a1a1a" });
        api.text("连对 " + streak + " · 最佳 " + best, 240, 270, { size: 14, weight: 700, color: "#8fe3a8" });
        if (msg) api.text(msg, 240, 305, { size: 15, weight: 700, color: "#ffd75e" });
        api.rr(50, 380, 175, 90, 16);
        ctx.fillStyle = "#ff922b"; ctx.fill();
        api.text("比它大 ▲", 137, 425, { size: 18, weight: 800, color: "#2a1408" });
        api.rr(255, 380, 175, 90, 16);
        ctx.fillStyle = "#4dabf7"; ctx.fill();
        api.text("比它小 ▼", 342, 425, { size: 18, weight: 800, color: "#0a1a2a" });
        api.text("A 最小 K 最大", 240, 505, { size: 11, color: "#4a7a5a" });
      });
    }
  });
})();
