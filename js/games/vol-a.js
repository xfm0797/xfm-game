/* ==========================================================
   vol-a.js — 街机动作扩展 18 款
   ========================================================== */
(function () {
  "use strict";

  const hit = (p, x, y, w, h) => p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;

  /* ---------------- 1. 陨石躲避 ---------------- */
  GB.add({
    id: "meteor", name: "陨石躲避", cat: "arcade", icon: "☄️", tags: ["new"],
    desc: "驾驶飞船左右闪避坠落的陨石", tip: "← → 移动，也可直接拖动飞船", w: 460, h: 560,
    colors: ["#2a1b4d", "#0e0a1c"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let px = W / 2, rocks = [], acc = 0, stars = [], top = 0;
      for (let i = 0; i < 46; i++) stars.push({ x: api.rand(0, W), y: api.rand(0, H), r: api.rand(.4, 1.5) });
      api.onMove((p) => { px = p.x; });
      api.onDown((p) => { px = p.x; });
      api.loop((dt, t) => {
        if (api.keys.ArrowLeft) px -= 320 * dt;
        if (api.keys.ArrowRight) px += 320 * dt;
        px = api.clamp(px, 18, W - 18);
        acc += dt * (1.1 + t * .045);
        while (acc > 1) {
          acc -= 1;
          rocks.push({ x: api.rand(16, W - 16), y: -24, r: api.rand(8, 19), v: api.rand(110, 190) + t * 5, s: api.rand(-1, 1) });
        }
        api.setScore(Math.floor(t * 10));
        api.clear("#0b0918");
        stars.forEach((s) => {
          s.y += 26 * dt; if (s.y > H) { s.y = 0; s.x = api.rand(0, W); }
          ctx.globalAlpha = .55; ctx.fillStyle = "#9db2ff";
          ctx.fillRect(s.x, s.y, s.r, s.r * 2.4);
        });
        ctx.globalAlpha = 1;
        rocks.forEach((o) => {
          o.y += o.v * dt; o.x += o.s * 12 * dt;
          const g = ctx.createRadialGradient(o.x - o.r * .3, o.y - o.r * .3, 1, o.x, o.y, o.r);
          g.addColorStop(0, "#ffd9a0"); g.addColorStop(.5, "#ff8a3d"); g.addColorStop(1, "#7a2c0c");
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 7); ctx.fill();
          if (Math.hypot(o.x - px, o.y - (H - 62)) < o.r + 13) api.over("飞船被击中", "坚持了 " + t.toFixed(1) + " 秒", false);
        });
        rocks = rocks.filter((o) => o.y < H + 40);
        ctx.save();
        ctx.translate(px, H - 58);
        ctx.fillStyle = "#7c5cff";
        ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(14, 14); ctx.lineTo(0, 7); ctx.lineTo(-14, 14); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#22d3ee";
        ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = .5 + Math.sin(t * 20) * .3;
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath(); ctx.moveTo(-4, 8); ctx.lineTo(0, 22 + Math.sin(t * 30) * 4); ctx.lineTo(4, 8); ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
        api.text("陨石 " + top, W - 14, 22, { size: 11, color: "#8b7bd8", align: "right" });
        top = Math.floor(t);
      });
    }
  });

  /* ---------------- 2. 叠叠高 ---------------- */
  GB.add({
    id: "stacker", name: "叠叠高", cat: "arcade", icon: "🧱", tags: ["new"],
    desc: "在移动的方块对准下方叠起来", tip: "点击 / 空格落下方块，越准越高", w: 420, h: 560,
    colors: ["#3a2a72", "#131020"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let blocks, cur, wait, speed, off;
      function spawn() {
        const top = blocks[blocks.length - 1];
        const w = Math.max(26, top.w);
        cur = { w: w, x: Math.random() < .5 ? 0 : W - w, dir: Math.random() < .5 ? 1 : -1, y: top.y - 30 };
        speed = 150 + blocks.length * 9;
      }
      function drop() {
        if (!cur) return;
        const top = blocks[blocks.length - 1];
        const l = Math.max(cur.x, top.x), r = Math.min(cur.x + cur.w, top.x + top.w);
        const ow = Math.round(r - l);
        if (ow <= 8) { cur = null; api.over("没叠上！", "共叠 " + blocks.length + " 层", false); return; }
        const perfect = Math.abs(ow - cur.w) <= 4;
        blocks.push({ x: perfect ? cur.x : l, w: perfect ? cur.w : ow, y: cur.y, h: 30 });
        api.addScore(perfect ? 25 : 10);
        api.beep(perfect ? 880 : 520, .07, "triangle", .05);
        if (perfect) api.hint("完美对齐 +25");
        cur = null; wait = .16;
      }
      api.onDown(drop);
      api.onKey((k) => { if (k === " " || k === "Enter") drop(); });
      blocks = [{ x: (W - 200) / 2, w: 200, y: H - 74, h: 30 }];
      off = 0; wait = 0; speed = 150; spawn();
      api.loop((dt) => {
        if (wait > 0) { wait -= dt; if (wait <= 0 && blocks.length) spawn(); }
        if (cur) {
          cur.x += cur.dir * speed * dt;
          if (cur.x <= 0) { cur.x = 0; cur.dir = 1; }
          if (cur.x + cur.w >= W) { cur.x = W - cur.w; cur.dir = -1; }
        }
        const topY = (cur || blocks[blocks.length - 1]).y;
        const target = Math.max(0, 110 - topY);
        off += (target - off) * Math.min(1, dt * 6);
        api.clear("#0d0c1a");
        ctx.fillStyle = "rgba(255,255,255,.05)";
        for (let y = 0; y < H; y += 30) ctx.fillRect(0, y, W, 1);
        const draw = (b, c1, c2) => {
          api.rr(b.x, b.y + off, b.w, b.h - 4, 6);
          const g = ctx.createLinearGradient(b.x, 0, b.x + b.w, 0);
          g.addColorStop(0, c1); g.addColorStop(1, c2);
          ctx.fillStyle = g; ctx.fill();
        };
        blocks.slice(-14).forEach((b, i) => {
          const k = i / Math.max(1, Math.min(14, blocks.length));
          draw(b, "hsl(" + (250 - k * 90) + ",72%,62%)", "hsl(" + (268 - k * 90) + ",64%,44%)");
        });
        if (cur) draw({ x: cur.x, y: cur.y, w: cur.w, h: 30 }, "#ffd166", "#f0932b");
        api.text("层数 " + blocks.length, 14, 24, { size: 12, weight: 700, color: "#a99cf0", align: "left" });
      });
    }
  });

  /* ---------------- 3. 蓄力跳 ---------------- */
  GB.add({
    id: "jumpto", name: "蓄力跳", cat: "arcade", icon: "🦘", tags: ["new"],
    desc: "长按蓄力，跳到下一块平台", tip: "按住蓄力，松手起跳", w: 460, h: 560,
    colors: ["#12324d", "#08131f"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let plats, px, cam, state, t0, power, jump, score, camX;
      function gen(fromX) {
        const gap = api.rand(70, 190);
        const w = api.rand(56, 104);
        plats.push({ x: fromX + gap, w: w });
      }
      plats = [{ x: 40, w: 120 }];
      for (let i = 0; i < 8; i++) gen(plats[plats.length - 1].x + plats[plats.length - 1].w);
      px = plats[0].x + plats[0].w / 2; camX = 0; state = "idle"; t0 = 0; power = 0; jump = null; score = 0; cam = 0;
      api.onDown(() => { if (state === "idle") { state = "charge"; t0 = performance.now(); } });
      api.onUp(() => { if (state === "charge") doJump(); });
      api.onKey((k) => { if ((k === " " || k === "Enter") && state === "idle") { state = "charge"; t0 = performance.now(); } });
      api.onKeyUp((k) => { if ((k === " " || k === "Enter") && state === "charge") doJump(); });
      function doJump() {
        const held = Math.min(1, (performance.now() - t0) / 1100);
        const dist = 50 + held * 320;
        jump = { from: px, to: px + dist, t: 0, dur: .52 };
        state = "fly"; power = held;
        api.beep(420, .1, "sine", .05, 720);
      }
      api.loop((dt) => {
        if (state === "charge") power = Math.min(1, (performance.now() - t0) / 1100);
        if (state === "fly") {
          jump.t += dt;
          const k = Math.min(1, jump.t / jump.dur);
          px = jump.from + (jump.to - jump.from) * k;
          if (k >= 1) {
            const p = plats.find((q) => px >= q.x - 4 && px <= q.x + q.w + 4);
            if (p) {
              score++; api.setScore(score);
              api.beep(660, .08, "sine", .06);
              while (plats[plats.length - 1].x < px + 700) gen(plats[plats.length - 1].x + plats[plats.length - 1].w);
              state = "idle"; jump = null;
            } else {
              state = "dead";
              api.over("掉下去了", "跳过 " + score + " 块平台", false);
            }
          }
        }
        camX += (Math.max(0, px - 130) - camX) * Math.min(1, dt * 8);
        api.clear("#08131f");
        for (let i = 0; i < 6; i++) {
          const gx = ((i * 220 - camX * .3) % (W + 220)) - 110;
          ctx.fillStyle = "rgba(34,211,238,.07)";
          ctx.fillRect(gx, 0, 90, H);
        }
        plats.forEach((p) => {
          const sx = p.x - camX;
          if (sx > W + 20 || sx < -160) return;
          api.rr(sx, H - 150, p.w, 90, 8);
          const g = ctx.createLinearGradient(sx, H - 150, sx, H);
          g.addColorStop(0, "#2b7a9b"); g.addColorStop(1, "#10394d");
          ctx.fillStyle = g; ctx.fill();
          ctx.fillStyle = "rgba(34,211,238,.55)";
          ctx.fillRect(sx + 6, H - 152, p.w - 12, 4);
        });
        const baseY = state === "fly" ? H - 150 - Math.sin(Math.min(1, jump.t / jump.dur) * Math.PI) * 110 : H - 150;
        ctx.save();
        ctx.translate(px - camX, baseY);
        ctx.fillStyle = "#ffd166";
        api.rr(-11, -26, 22, 26, 7); ctx.fill();
        ctx.fillStyle = "#1b1b2b";
        ctx.fillRect(-5, -20, 3, 4); ctx.fillRect(3, -20, 3, 4);
        ctx.restore();
        if (state === "charge") {
          const bw = 150 * power;
          api.rr(W / 2 - 75, H - 46, 150, 9, 4);
          ctx.fillStyle = "rgba(255,255,255,.1)"; ctx.fill();
          api.rr(W / 2 - 75, H - 46, Math.max(3, bw), 9, 4);
          const g2 = ctx.createLinearGradient(W / 2 - 75, 0, W / 2 + 75, 0);
          g2.addColorStop(0, "#22d3ee"); g2.addColorStop(1, "#fbbf24");
          ctx.fillStyle = g2; ctx.fill();
        } else {
          api.text("按住蓄力 · 松手起跳", W / 2, H - 34, { size: 11.5, color: "#5d7186" });
        }
        api.text("已跳 " + score, 14, 24, { size: 12, weight: 700, color: "#7dd3e8", align: "left" });
      });
    }
  });

  /* ---------------- 4. 隧道飞行 ---------------- */
  GB.add({
    id: "tunnel", name: "隧道飞行", cat: "arcade", icon: "🚀", tags: ["new"],
    desc: "穿过不断收窄的隧道缝隙", tip: "点击 / 空格上升", w: 460, h: 560,
    colors: ["#1f2a5c", "#0a0d1e"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let y, vy, walls, acc, score, gap;
      y = H / 2; vy = 0; walls = []; acc = 0; score = 0; gap = 168;
      const flap = () => { vy = -300; api.beep(560, .06, "sine", .04, 700); };
      api.onDown(flap); api.onKey((k) => { if (k === " " || k === "Enter") flap(); });
      api.loop((dt, t) => {
        vy += 760 * dt;
        y += vy * dt;
        if (y < 14 || y > H - 14) api.over("撞上隧道壁", "通过 " + score + " 个缝隙", false);
        acc += dt;
        if (acc > Math.max(.85, 1.5 - t * .02)) {
          acc = 0;
          gap = Math.max(110, 168 - t * 1.4);
          walls.push({ x: W + 40, gy: api.rand(70, H - 70 - gap), gh: gap, p: false });
        }
        walls.forEach((w) => { w.x -= 150 * dt; if (!w.p && w.x < 70) { w.p = true; score++; api.setScore(score); api.beep(900, .05, "sine", .04); } });
        walls = walls.filter((w) => w.x > -70);
        api.clear("#080b1a");
        ctx.fillStyle = "rgba(124,92,255,.09)";
        for (let i = 0; i < 10; i++) ctx.fillRect(0, 60 + i * 46, W, 1);
        walls.forEach((w) => {
          const g = ctx.createLinearGradient(w.x, 0, w.x + 46, 0);
          g.addColorStop(0, "#4c3ba8"); g.addColorStop(1, "#241a52");
          ctx.fillStyle = g;
          ctx.fillRect(w.x, 0, 46, w.gy);
          ctx.fillRect(w.x, w.gy + w.gh, 46, H - w.gy - w.gh);
          ctx.fillStyle = "rgba(34,211,238,.35)";
          ctx.fillRect(w.x, w.gy - 4, 46, 4);
          ctx.fillRect(w.x, w.gy + w.gh, 46, 4);
        });
        ctx.save();
        ctx.translate(70, y);
        ctx.fillStyle = "#22d3ee";
        ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-10, -11); ctx.lineTo(-4, 0); ctx.lineTo(-10, 11); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "rgba(251,191,36,.85)";
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-22 - Math.random() * 8, 0); ctx.lineTo(-8, 5); ctx.closePath(); ctx.fill();
        ctx.restore();
        api.text("缝隙 " + score, W - 14, 24, { size: 12, weight: 700, color: "#7dd3e8", align: "right" });
      });
    }
  });

  /* ---------------- 5. 彩砖狂潮 ---------------- */
  GB.add({
    id: "brickx", name: "彩砖狂潮", cat: "arcade", icon: "🧨", tags: ["new"],
    desc: "多层砖块，连击加分", tip: "移动挡板接球，砖块带血量", w: 480, h: 560,
    colors: ["#20304f", "#0a101c"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const COLS = 7, ROWS = 5, PAD = 12, TOP = 84;
      let bricks, ball, px, lives, combo, lvl;
      function grid() {
        bricks = [];
        const bw = (W - PAD * 2) / COLS;
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const hp = 1 + ((r + c + lvl) % 2);
          bricks.push({ x: PAD + c * bw, y: TOP + r * 26, w: bw - 4, h: 22, hp: hp });
        }
      }
      function resetBall() {
        ball = { x: W / 2, y: H - 90, vx: api.rand(-120, 120) || 90, vy: -230, r: 8 };
      }
      lvl = 1; lives = 3; combo = 0; px = W / 2; grid(); resetBall();
      api.onMove((p) => { px = p.x; });
      api.onDown((p) => { px = p.x; });
      api.loop((dt) => {
        if (api.keys.ArrowLeft) px -= 340 * dt;
        if (api.keys.ArrowRight) px += 340 * dt;
        px = api.clamp(px, 52, W - 52);
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); api.beep(500, .04, "sine", .03); }
        if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); api.beep(500, .04, "sine", .03); }
        if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }
        if (ball.y > H - 56 && ball.y < H - 40 && ball.x > px - 52 && ball.x < px + 52) {
          ball.y = H - 56;
          const sp = Math.hypot(ball.vx, ball.vy) * 1.02;
          const ang = ((ball.x - px) / 52) * 1.05;
          ball.vx = Math.sin(ang) * sp; ball.vy = -Math.abs(Math.cos(ang) * sp);
          combo = 0; api.beep(620, .05, "triangle", .04);
        }
        if (ball.y > H + 20) {
          lives--;
          if (lives <= 0) api.over("球掉光了", "第 " + lvl + " 关", false);
          else { resetBall(); combo = 0; api.bad(); }
        }
        for (const b of bricks) {
          if (b.hp <= 0) continue;
          if (ball.x > b.x - ball.r && ball.x < b.x + b.w + ball.r && ball.y > b.y - ball.r && ball.y < b.y + b.h + ball.r) {
            const fromSide = Math.abs(ball.x - (b.x + b.w / 2)) > Math.abs(ball.y - (b.y + b.h / 2));
            if (fromSide) ball.vx *= -1; else ball.vy *= -1;
            b.hp--;
            combo++;
            api.addScore(5 + combo);
            api.beep(300 + b.hp * 120, .05, "square", .035);
            break;
          }
        }
        if (bricks.every((b) => b.hp <= 0)) {
          lvl++; api.addScore(50); grid(); resetBall();
          api.hint("第 " + lvl + " 关！");
        }
        api.clear("#0a101c");
        bricks.forEach((b) => {
          if (b.hp <= 0) return;
          api.rr(b.x, b.y, b.w, b.h, 5);
          ctx.fillStyle = b.hp > 1 ? "#f472b6" : "#38bdf8";
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.25)";
          ctx.fillRect(b.x + 4, b.y + 3, b.w - 8, 2);
        });
        api.rr(px - 52, H - 52, 104, 10, 5);
        const pg = ctx.createLinearGradient(px - 52, 0, px + 52, 0);
        pg.addColorStop(0, "#7c5cff"); pg.addColorStop(1, "#22d3ee");
        ctx.fillStyle = pg; ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.fill();
        api.text("♥".repeat(Math.max(0, lives)) + "  Lv" + lvl, 14, 24, { size: 12, weight: 700, color: "#8fb8ef", align: "left" });
      });
    }
  });

  /* ---------------- 6. 激光冲刺 ---------------- */
  GB.add({
    id: "laserrun", name: "激光冲刺", cat: "arcade", icon: "⚡", tags: ["new"],
    desc: "跳跃躲开不断逼近的激光", tip: "点击 / 空格跳跃，可二段跳", w: 480, h: 500,
    colors: ["#3a1b3f", "#120a18"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let y, vy, jumps, beams, acc, score, speed, ground;
      y = 0; vy = 0; jumps = 0; beams = []; acc = 0; score = 0; speed = 210; ground = H - 64;
      const jump = () => {
        if (jumps < 2) { vy = -420; jumps++; api.beep(520 + jumps * 120, .06, "sine", .04); }
      };
      api.onDown(jump); api.onKey((k) => { if (k === " " || k === "Enter") jump(); });
      api.loop((dt, t) => {
        speed = 210 + t * 9;
        vy += 1250 * dt; y += vy * dt;
        if (y >= ground) { y = ground; vy = 0; jumps = 0; }
        acc += dt;
        if (acc > Math.max(.5, 1.1 - t * .012)) {
          acc = 0;
          beams.push({ x: W + 30, h: api.rand(26, 62), w: api.rand(20, 34) });
        }
        beams.forEach((b) => { b.x -= speed * dt; });
        beams = beams.filter((b) => b.x > -60);
        api.setScore(Math.floor(t * 12));
        for (const b of beams) {
          if (b.x < 96 && b.x + b.w > 58 && y + 40 > ground - b.h) {
            api.over("被激光烧到", "跑了 " + Math.floor(t * 12) + " 米", false);
          }
        }
        api.clear("#120a18");
        ctx.fillStyle = "#241336";
        for (let i = 0; i < 8; i++) {
          const gx = ((i * 160 - (t * speed) % 160) + W) % (W + 160) - 80;
          ctx.fillRect(gx, 0, 60, H);
        }
        ctx.fillStyle = "#2b1b45"; ctx.fillRect(0, ground + 40, W, H);
        ctx.fillStyle = "#3d2a63"; ctx.fillRect(0, ground + 40, W, 4);
        beams.forEach((b) => {
          const g = ctx.createLinearGradient(0, ground - b.h, 0, ground + 40);
          g.addColorStop(0, "#ff8a3d"); g.addColorStop(.5, "#ff2e63"); g.addColorStop(1, "#7a0f33");
          ctx.fillStyle = g;
          ctx.fillRect(b.x, ground - b.h, b.w, b.h + 40);
          ctx.globalAlpha = .35; ctx.fillStyle = "#ff5c8a";
          ctx.fillRect(b.x - 4, ground - b.h, b.w + 8, 6);
          ctx.globalAlpha = 1;
        });
        ctx.save();
        ctx.translate(76, y);
        ctx.fillStyle = "#22d3ee";
        api.rr(-14, -40, 28, 40, 9); ctx.fill();
        ctx.fillStyle = "#0a2230";
        ctx.fillRect(-6, -32, 5, 5); ctx.fillRect(4, -32, 5, 5);
        ctx.fillStyle = "rgba(34,211,238,.6)";
        ctx.fillRect(-20, -18, 6, 12);
        ctx.restore();
        api.text("米数 " + Math.floor(t * 12), W - 14, 24, { size: 12, weight: 700, color: "#ff9db4", align: "right" });
      });
    }
  });

  /* ---------------- 7. 环绕突围 ---------------- */
  GB.add({
    id: "orbiter", name: "环绕突围", cat: "arcade", icon: "🛸", tags: ["new"],
    desc: "绕核心飞行，点击反向躲避尖刺", tip: "点击切换旋转方向", w: 480, h: 520,
    colors: ["#2b2a5e", "#0b0b1c"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h, cx = W / 2, cy = H / 2, R = 132;
      let ang, dir, spikes, score, acc;
      ang = 0; dir = 1; score = 0; acc = 0;
      spikes = [];
      for (let i = 0; i < 5; i++) spikes.push({ a: api.rand(0, 6.28), r: api.rand(88, 120), s: api.rand(.5, 1.4) * (Math.random() < .5 ? 1 : -1), len: api.rand(18, 34) });
      api.onDown(() => { dir *= -1; api.beep(700, .05, "square", .035); });
      api.onKey((k) => { if (k === " " || k === "Enter") { dir *= -1; api.beep(700, .05, "square", .035); } });
      api.loop((dt, t) => {
        ang += dir * (1.5 + t * .03) * dt;
        spikes.forEach((s) => { s.a += s.s * dt; });
        const px = cx + Math.cos(ang) * R, py = cy + Math.sin(ang) * R;
        for (const s of spikes) {
          const sx = cx + Math.cos(s.a) * s.r, sy = cy + Math.sin(s.a) * s.r;
          if (Math.hypot(px - sx, py - sy) < s.len * .55 + 9) api.over("被尖刺击中", "绕行 " + (Math.abs(ang) / 6.283).toFixed(1) + " 圈", false);
        }
        score = Math.floor(Math.abs(ang) / 6.283 * 100);
        api.setScore(score);
        api.clear("#0b0b1c");
        ctx.strokeStyle = "rgba(124,92,255,.18)"; ctx.lineWidth = 1;
        [70, 100, R, 160].forEach((r) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); });
        spikes.forEach((s) => {
          const sx = cx + Math.cos(s.a) * s.r, sy = cy + Math.sin(s.a) * s.r;
          ctx.save(); ctx.translate(sx, sy); ctx.rotate(s.a + Math.PI / 2);
          ctx.fillStyle = "#ff5c8a";
          ctx.beginPath(); ctx.moveTo(0, -s.len / 2); ctx.lineTo(5, s.len / 2); ctx.lineTo(-5, s.len / 2); ctx.closePath(); ctx.fill();
          ctx.restore();
        });
        ctx.fillStyle = "#7c5cff";
        ctx.beginPath(); ctx.arc(cx, cy, 24 + Math.sin(t * 3) * 2, 0, 7); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.45)";
        ctx.beginPath(); ctx.arc(cx - 6, cy - 6, 7, 0, 7); ctx.fill();
        ctx.save(); ctx.translate(px, py); ctx.rotate(ang + Math.PI / 2);
        ctx.fillStyle = "#22d3ee";
        ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, 9); ctx.lineTo(0, 5); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill();
        ctx.restore();
        api.text("圈数 " + (Math.abs(ang) / 6.283).toFixed(1), 14, 24, { size: 12, weight: 700, color: "#93a4ff", align: "left" });
      });
    }
  });

  /* ---------------- 8. 旋转护盾 ---------------- */
  GB.add({
    id: "shield", name: "旋转护盾", cat: "arcade", icon: "🛡️", tags: ["new"],
    desc: "转动护盾挡住撞向核心的陨石", tip: "用指针瞄准护盾方向", w: 480, h: 520,
    colors: ["#1c3a4a", "#08141a"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h, cx = W / 2, cy = H / 2 + 10, CR = 26, SR = 86;
      let sa, rocks, lives, acc, score, mx, my;
      sa = -Math.PI / 2; rocks = []; lives = 3; acc = 0; score = 0; mx = cx; my = 0;
      api.onMove((p) => { mx = p.x; my = p.y; });
      api.onDown((p) => { mx = p.x; my = p.y; });
      api.loop((dt, t) => {
        const target = Math.atan2(my - cy, mx - cx);
        let d = ((target - sa + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        sa += d * Math.min(1, dt * 12);
        acc += dt * (1 + t * .05);
        while (acc > 1) {
          acc -= 1;
          const a = api.rand(0, 6.283);
          rocks.push({ x: cx + Math.cos(a) * 330, y: cy + Math.sin(a) * 330, vx: -Math.cos(a) * 90, vy: -Math.sin(a) * 90, r: api.rand(8, 15) });
        }
        for (const r of rocks) {
          r.x += r.vx * dt; r.y += r.vy * dt;
          const dist = Math.hypot(r.x - cx, r.y - cy);
          const ang = Math.atan2(r.y - cy, r.x - cx);
          let diff = Math.abs(((ang - sa + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          if (dist < SR + 8 && dist > SR - 16 && diff > Math.PI - .62) {
            r.dead = true; score += 10; api.setScore(score);
            api.beep(760, .06, "square", .04);
          } else if (dist < CR + r.r) {
            r.dead = true; lives--;
            api.noise(.2, .12, 500); api.bad();
            if (lives <= 0) api.over("核心被摧毁", "挡住 " + score / 10 + " 块陨石", false);
          }
        }
        rocks = rocks.filter((r) => !r.dead && Math.hypot(r.x - cx, r.y - cy) < 400);
        api.clear("#08141a");
        ctx.strokeStyle = "rgba(34,211,238,.12)";
        [SR - 22, SR + 20].forEach((r) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); });
        ctx.fillStyle = "#0f2b36";
        ctx.beginPath(); ctx.arc(cx, cy, CR + 8, 0, 7); ctx.fill();
        const cg = ctx.createRadialGradient(cx - 8, cy - 8, 2, cx, cy, CR);
        cg.addColorStop(0, "#a7f3d0"); cg.addColorStop(1, "#0e7490");
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(cx, cy, CR, 0, 7); ctx.fill();
        rocks.forEach((r) => {
          ctx.fillStyle = "#ff8a3d";
          ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 7); ctx.fill();
        });
        ctx.strokeStyle = "#34d399"; ctx.lineWidth = 9; ctx.lineCap = "round";
        ctx.beginPath(); ctx.arc(cx, cy, SR, sa - .62, sa + .62); ctx.stroke();
        ctx.lineWidth = 1;
        api.text("♥".repeat(lives), 14, 24, { size: 13, color: "#ff7a95", align: "left" });
        api.text(String(score), W - 14, 24, { size: 13, weight: 700, color: "#6ee7b7", align: "right" });
      });
    }
  });

  /* ---------------- 9. 月面着陆 ---------------- */
  GB.add({
    id: "lander", name: "月面着陆", cat: "arcade", icon: "🌙", tags: ["new"],
    desc: "控制推力，稳稳落在平台上", tip: "按住推进，← → 微调横向", w: 480, h: 520,
    colors: ["#20233f", "#080a12"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let x, y, vx, vy, fuel, pad, level, hold, landed, stars;
      level = 1; stars = [];
      for (let i = 0; i < 40; i++) stars.push({ x: api.rand(0, W), y: api.rand(0, H * .7), r: api.rand(.5, 1.4) });
      function start() {
        x = api.rand(60, W - 60); y = 60; vx = api.rand(-30, 30); vy = 10; fuel = 100;
        pad = { x: api.rand(40, W - 160), w: api.rand(90, 130) };
        landed = false; hold = false;
      }
      start();
      api.onDown(() => { hold = true; }); api.onUp(() => { hold = false; });
      api.onKey((k) => { if (k === " " || k === "Enter") hold = true; });
      api.onKeyUp((k) => { if (k === " " || k === "Enter") hold = false; });
      api.loop((dt) => {
        const thrust = hold && fuel > 0;
        vy += (thrust ? -110 : 130) * dt;
        if (thrust) fuel = Math.max(0, fuel - 22 * dt);
        if (api.keys.ArrowLeft) vx -= 70 * dt;
        if (api.keys.ArrowRight) vx += 70 * dt;
        vy = api.clamp(vy, -180, 240);
        vx = api.clamp(vx, -140, 140);
        x += vx * dt; y += vy * dt;
        if (x < 14) { x = 14; vx = Math.abs(vx) * .4; }
        if (x > W - 14) { x = W - 14; vx = -Math.abs(vx) * .4; }
        if (y < 12) { y = 12; vy = Math.abs(vy) * .3; }
        const gy = H - 78;
        if (y >= gy && vy > 0) {
          const onPad = x > pad.x && x < pad.x + pad.w;
          if (onPad && vy < 95 && Math.abs(vx) < 45) {
            if (!landed) {
              landed = true;
              api.addScore(Math.max(50, Math.round(260 - vy) + 40));
              api.beep(780, .1, "sine", .07);
              setTimeout(() => { level++; api.hint("第 " + level + " 次着陆准备"); start(); }, 420);
            }
          } else {
            api.over("坠毁了", "着陆速度 " + Math.round(vy) + " · 到达第 " + level + " 次", false);
          }
        }
        api.clear("#080a12");
        stars.forEach((s) => { ctx.fillStyle = "rgba(220,230,255,.7)"; ctx.fillRect(s.x, s.y, s.r, s.r); });
        ctx.fillStyle = "#1b2136";
        ctx.beginPath();
        ctx.moveTo(0, H - 60);
        for (let i = 0; i <= W; i += 40) ctx.lineTo(i, H - 60 + Math.sin(i * .03) * 9);
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
        api.rr(pad.x, H - 66, pad.w, 10, 4);
        ctx.fillStyle = "#34d399"; ctx.fill();
        api.text("PAD", pad.x + pad.w / 2, H - 92, { size: 9, weight: 800, color: "#34d399" });
        if (!landed) {
          ctx.save(); ctx.translate(x, y);
          ctx.fillStyle = "#cbd5e1";
          api.rr(-9, -12, 18, 16, 4); ctx.fill();
          ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-7, 4); ctx.lineTo(-11, 12); ctx.moveTo(7, 4); ctx.lineTo(11, 12); ctx.stroke();
          if (hold && fuel > 0) {
            ctx.fillStyle = "rgba(251,191,36,.9)";
            ctx.beginPath(); ctx.moveTo(-5, 5); ctx.lineTo(0, 18 + Math.random() * 10); ctx.lineTo(5, 5); ctx.closePath(); ctx.fill();
          }
          ctx.restore();
        }
        api.rr(14, H - 30, 120, 8, 4); ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fill();
        api.rr(14, H - 30, 120 * fuel / 100, 8, 4); ctx.fillStyle = fuel < 25 ? "#ff5c8a" : "#22d3ee"; ctx.fill();
        api.text("燃料", 144, H - 26, { size: 10, color: "#5c6d80", align: "left" });
        api.text("速度 " + Math.round(vy), W - 14, H - 26, { size: 11, weight: 700, color: "#8fb8ef", align: "right" });
      });
    }
  });

  /* ---------------- 10. 纸飞机 ---------------- */
  GB.add({
    id: "plane", name: "纸飞机", cat: "arcade", icon: "✈️", tags: ["new"],
    desc: "穿过空中的圆环收集气流", tip: "点击抬升机头", w: 480, h: 520,
    colors: ["#1d3b52", "#08121c"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let y, vy, rings, acc, score, t0;
      y = H / 2; vy = 0; rings = []; acc = 0; score = 0; t0 = 0;
      const lift = () => { vy = -150; t0 = .12; };
      api.onDown(lift); api.onKey((k) => { if (k === " " || k === "Enter") lift(); });
      api.loop((dt, t) => {
        vy += 300 * dt;
        y += vy * dt;
        if (t0 > 0) t0 -= dt;
        if (y < 26 || y > H - 26) api.over("撞到边界", "穿过 " + score + " 个圆环", false);
        acc += dt;
        if (acc > Math.max(.55, 1.05 - t * .012)) {
          acc = 0;
          rings.push({ x: W + 30, y: api.rand(70, H - 70), r: api.rand(30, 44), p: false });
        }
        rings.forEach((r) => {
          r.x -= 165 * dt;
          if (!r.p && r.x < 120) {
            r.p = true;
            if (Math.hypot(r.x - 120, r.y - y) < r.r) { score++; api.addScore(10); api.beep(880, .07, "sine", .05); }
          }
        });
        rings = rings.filter((r) => r.x > -70);
        api.clear("#08121c");
        ctx.fillStyle = "rgba(255,255,255,.05)";
        for (let i = 0; i < 5; i++) {
          const cy2 = H * .2 + i * H * .16;
          ctx.beginPath(); ctx.ellipse((i * 140 + t * 20) % (W + 200) - 100, cy2, 70, 14, 0, 0, 7); ctx.fill();
        }
        rings.forEach((r) => {
          ctx.strokeStyle = r.p ? "rgba(52,211,153,.35)" : "#fbbf24";
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 7); ctx.stroke();
          ctx.lineWidth = 1;
        });
        ctx.save(); ctx.translate(120, y);
        ctx.rotate(api.clamp(vy / 500, -.5, .5));
        ctx.fillStyle = "#e8eefc";
        ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(-18, -10); ctx.lineTo(-8, 0); ctx.lineTo(-18, 10); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#9aa8c7";
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-18, 10); ctx.lineTo(-2, 2); ctx.closePath(); ctx.fill();
        ctx.restore();
        api.text("圆环 " + score, W - 14, 24, { size: 12, weight: 700, color: "#ffd166", align: "right" });
      });
    }
  });

  /* ---------------- 11. 三线疾跑 ---------------- */
  GB.add({
    id: "lanerun", name: "三线疾跑", cat: "arcade", icon: "🏃", tags: ["new"],
    desc: "三条跑道躲避路障收集金币", tip: "点击左 / 右半屏换道", w: 440, h: 600,
    colors: ["#1c2b4a", "#080d18"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const lanes = [W * .2, W * .5, W * .8];
      let lane, items, acc, score, speed, py;
      lane = 1; items = []; acc = 0; score = 0; speed = 200; py = H - 110;
      api.onDown((p) => { lane = api.clamp(lane + (p.x < lanes[lane] ? -1 : 1), 0, 2); api.beep(600, .04, "sine", .03); });
      api.onKey((k) => {
        if (k === "ArrowLeft" || k === "a") lane = api.clamp(lane - 1, 0, 2);
        if (k === "ArrowRight" || k === "d") lane = api.clamp(lane + 1, 0, 2);
      });
      api.loop((dt, t) => {
        speed = 200 + t * 12;
        acc += dt;
        if (acc > Math.max(.4, .85 - t * .012)) {
          acc = 0;
          const l = api.ri(0, 2);
          if (Math.random() < .6) items.push({ lane: l, y: -40, type: Math.random() < .45 ? "coin" : "block" });
          else items.push({ lane: l, y: -40, type: "block" }, { lane: api.ri(0, 2), y: -140, type: "coin" });
        }
        items.forEach((it) => { it.y += speed * dt; });
        items = items.filter((it) => {
          if (it.hit) return false;
          if (it.y > py - 30 && it.y < py + 34 && it.lane === lane) {
            if (it.type === "coin") { it.hit = true; score += 5; api.addScore(5); api.beep(980, .05, "sine", .04); return false; }
            api.over("撞上路障", "跑了 " + Math.floor(t) + " 秒", false);
          }
          return it.y < H + 50;
        });
        api.setScore(score + Math.floor(t * 4));
        api.clear("#080d18");
        lanes.forEach((lx) => {
          ctx.fillStyle = "rgba(255,255,255,.06)";
          ctx.fillRect(lx - 46, 0, 92, H);
          ctx.strokeStyle = "rgba(124,92,255,.25)";
          ctx.beginPath(); ctx.moveTo(lx - 46, 0); ctx.lineTo(lx - 46, H); ctx.stroke();
        });
        ctx.fillStyle = "rgba(255,255,255,.14)";
        for (let i = 0; i < 14; i++) {
          const y2 = ((i * 60 + t * speed) % (H + 60)) - 60;
          lanes.forEach((lx) => ctx.fillRect(lx - 1.5, y2, 3, 22));
        }
        items.forEach((it) => {
          const lx = lanes[it.lane];
          if (it.type === "coin") {
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath(); ctx.ellipse(lx, it.y, 11, 13, 0, 0, 7); ctx.fill();
            ctx.fillStyle = "#fff7d6";
            ctx.beginPath(); ctx.ellipse(lx - 3, it.y - 4, 3, 4, 0, 0, 7); ctx.fill();
          } else {
            api.rr(lx - 20, it.y - 14, 40, 28, 6);
            ctx.fillStyle = "#ff5c8a"; ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,.5)";
            ctx.fillRect(lx - 16, it.y - 5, 32, 3);
            ctx.fillRect(lx - 16, it.y + 2, 32, 3);
          }
        });
        ctx.save(); ctx.translate(lanes[lane], py);
        ctx.fillStyle = "#22d3ee";
        api.rr(-12, -26, 24, 30, 8); ctx.fill();
        ctx.fillStyle = "#062330";
        ctx.fillRect(-6, -18, 4, 4); ctx.fillRect(2, -18, 4, 4);
        ctx.fillStyle = "#0e7490";
        ctx.fillRect(-10, 6, 7, 14); ctx.fillRect(3, 6, 7, 14);
        ctx.restore();
        api.text("金币 " + Math.floor(score / 5), 14, 24, { size: 12, weight: 700, color: "#ffd166", align: "left" });
      });
    }
  });

  /* ---------------- 12. 洞穴直升机 ---------------- */
  GB.add({
    id: "heli", name: "洞穴直升机", cat: "arcade", icon: "🚁", tags: ["new"],
    desc: "在忽宽忽窄的洞穴中穿行", tip: "按住上升，松手下降", w: 480, h: 520,
    colors: ["#2a2340", "#0b0912"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let y, vy, dist, hold, speed;
      y = H / 2; vy = 0; dist = 0; hold = false; speed = 150;
      api.onDown(() => { hold = true; }); api.onUp(() => { hold = false; });
      api.onKey((k) => { if (k === " " || k === "Enter" || k === "ArrowUp") hold = true; });
      api.onKeyUp((k) => { if (k === " " || k === "Enter" || k === "ArrowUp") hold = false; });
      const ceil = (wx) => H * .26 + Math.sin(wx * .009) * 52 + Math.sin(wx * .0031) * 26;
      const flor = (wx) => H * .78 + Math.sin(wx * .0072 + 1.7) * 46 + Math.sin(wx * .0041) * 22;
      api.loop((dt, t) => {
        speed = 150 + t * 6;
        dist += speed * dt;
        vy += (hold ? -260 : 420) * dt;
        vy = api.clamp(vy, -260, 300);
        y += vy * dt;
        if (y < ceil(dist + 90) + 12 || y > flor(dist + 90) - 12) api.over("撞上岩壁", "飞行 " + Math.floor(dist / 10) + " 米", false);
        api.setScore(Math.floor(dist / 10));
        api.clear("#0b0912");
        ctx.fillStyle = "rgba(255,255,255,.18)";
        for (let i = 0; i < 18; i++) {
          const sy = (i * 37 + t * 14) % H;
          ctx.fillRect((i * 97) % W, sy, 2, 2);
        }
        ctx.fillStyle = "#241c38";
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0);
        for (let sx = W; sx >= 0; sx -= 10) ctx.lineTo(sx, ceil(dist + sx));
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(W, H);
        for (let sx = W; sx >= 0; sx -= 10) ctx.lineTo(sx, flor(dist + sx));
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(124,92,255,.45)";
        ctx.beginPath();
        for (let sx = 0; sx <= W; sx += 10) sx === 0 ? ctx.moveTo(sx, ceil(dist + sx)) : ctx.lineTo(sx, ceil(dist + sx));
        ctx.stroke();
        ctx.beginPath();
        for (let sx = 0; sx <= W; sx += 10) sx === 0 ? ctx.moveTo(sx, flor(dist + sx)) : ctx.lineTo(sx, flor(dist + sx));
        ctx.stroke();
        ctx.save(); ctx.translate(90, y);
        ctx.fillStyle = "#22d3ee";
        api.rr(-16, -9, 32, 14, 6); ctx.fill();
        ctx.fillStyle = "#0b3b4d";
        ctx.beginPath(); ctx.arc(6, -2, 6, 0, 7); ctx.fill();
        ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-14, -9); ctx.lineTo(-14, -17); ctx.lineTo(4, -17); ctx.stroke();
        ctx.globalAlpha = .6;
        ctx.beginPath(); ctx.moveTo(-10, -18); ctx.lineTo(10, -18); ctx.stroke();
        ctx.globalAlpha = 1; ctx.lineWidth = 1;
        ctx.fillStyle = "#94a3b8"; ctx.fillRect(-18, -2, 8, 3);
        ctx.restore();
        api.text("米 " + Math.floor(dist / 10), W - 14, 24, { size: 12, weight: 700, color: "#a99cf0", align: "right" });
      });
    }
  });

  /* ---------------- 13. 反弹球 ---------------- */
  GB.add({
    id: "rally", name: "反弹球", cat: "arcade", icon: "🏓", tags: ["new"],
    desc: "用挡板不停接球，越快分越高", tip: "左右移动挡板", w: 480, h: 500,
    colors: ["#1e3a2e", "#08130f"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let ball, px, hits, trail;
      hits = 0; trail = [];
      ball = { x: W / 2, y: 200, vx: 150, vy: 200, r: 9 };
      px = W / 2;
      api.onMove((p) => { px = p.x; }); api.onDown((p) => { px = p.x; });
      api.loop((dt) => {
        if (api.keys.ArrowLeft) px -= 360 * dt;
        if (api.keys.ArrowRight) px += 360 * dt;
        px = api.clamp(px, 50, W - 50);
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        trail.push({ x: ball.x, y: ball.y }); if (trail.length > 12) trail.shift();
        if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); api.beep(480, .04, "sine", .03); }
        if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); api.beep(480, .04, "sine", .03); }
        if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); api.beep(480, .04, "sine", .03); }
        if (ball.vy > 0 && ball.y > H - 64 && ball.y < H - 44 && Math.abs(ball.x - px) < 52) {
          ball.y = H - 64;
          hits++;
          const sp = Math.min(760, 300 + hits * 14);
          const ang = ((ball.x - px) / 52) * 1.0;
          ball.vx = Math.sin(ang) * sp; ball.vy = -Math.cos(ang) * sp;
          api.setScore(hits * 10);
          api.beep(560 + hits * 10, .05, "triangle", .045);
        }
        if (ball.y > H + 30) api.over("没接住", "连续接球 " + hits + " 次", false);
        api.clear("#08130f");
        ctx.strokeStyle = "rgba(52,211,153,.18)";
        ctx.beginPath(); ctx.moveTo(0, H - 54); ctx.lineTo(W, H - 54); ctx.stroke();
        trail.forEach((p, i) => {
          ctx.globalAlpha = i / trail.length * .5;
          ctx.fillStyle = "#34d399";
          ctx.beginPath(); ctx.arc(p.x, p.y, ball.r * (i / trail.length), 0, 7); ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#eafff6";
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.fill();
        api.rr(px - 52, H - 54, 104, 10, 5);
        const g = ctx.createLinearGradient(px - 52, 0, px + 52, 0);
        g.addColorStop(0, "#34d399"); g.addColorStop(1, "#22d3ee");
        ctx.fillStyle = g; ctx.fill();
        api.text("连击 " + hits, 14, 24, { size: 12, weight: 700, color: "#6ee7b7", align: "left" });
      });
    }
  });

  /* ---------------- 14. 重力翻转 ---------------- */
  GB.add({
    id: "flipgrav", name: "重力翻转", cat: "arcade", icon: "🔄", tags: ["new"],
    desc: "在地面与天花板之间翻转躲刺", tip: "点击翻转重力", w: 480, h: 500,
    colors: ["#2b1f4d", "#0a0814"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let side, y, targetY, obs, acc, score, x;
      side = 1; y = H - 70; targetY = H - 70; obs = []; acc = 0; score = 0; x = 96;
      api.onDown(() => { side *= -1; targetY = side > 0 ? H - 70 : 70; api.beep(600 * side, .06, "square", .04); });
      api.onKey((k) => { if (k === " " || k === "Enter") { side *= -1; targetY = side > 0 ? H - 70 : 70; api.beep(600 * side, .06, "square", .04); } });
      api.loop((dt, t) => {
        y += (targetY - y) * Math.min(1, dt * 14);
        acc += dt;
        if (acc > Math.max(.45, .95 - t * .012)) {
          acc = 0;
          obs.push({ x: W + 40, side: Math.random() < .5 ? 1 : -1, w: api.rand(30, 56), h: api.rand(34, 62) });
        }
        obs.forEach((o) => { o.x -= (240 + t * 10) * dt; });
        obs = obs.filter((o) => {
          if (o.x < x + 16 && o.x + o.w > x - 16) {
            if (o.side === side && (side > 0 ? y + 20 > H - 70 - o.h : y - 20 < 70 + o.h)) {
              api.over("被尖刺扎到", "跑了 " + Math.floor(t * 8) + " 米", false);
            }
          }
          return o.x > -80;
        });
        api.setScore(Math.floor(t * 8));
        api.clear("#0a0814");
        ctx.fillStyle = "#1b1330";
        ctx.fillRect(0, 0, W, 70);
        ctx.fillRect(0, H - 70, W, 70);
        ctx.fillStyle = "rgba(255,255,255,.12)";
        ctx.fillRect(0, 70, W, 2); ctx.fillRect(0, H - 72, W, 2);
        obs.forEach((o) => {
          ctx.fillStyle = "#ff5c8a";
          if (o.side > 0) {
            ctx.beginPath(); ctx.moveTo(o.x, H - 70); ctx.lineTo(o.x + o.w / 2, H - 70 - o.h); ctx.lineTo(o.x + o.w, H - 70); ctx.closePath(); ctx.fill();
          } else {
            ctx.beginPath(); ctx.moveTo(o.x, 70); ctx.lineTo(o.x + o.w / 2, 70 + o.h); ctx.lineTo(o.x + o.w, 70); ctx.closePath(); ctx.fill();
          }
        });
        ctx.save(); ctx.translate(x, y); ctx.rotate(side > 0 ? 0 : Math.PI);
        ctx.fillStyle = "#fbbf24";
        api.rr(-13, -20, 26, 26, 7); ctx.fill();
        ctx.fillStyle = "#3b2a00";
        ctx.fillRect(-6, -13, 4, 4); ctx.fillRect(3, -13, 4, 4);
        ctx.fillStyle = "#22d3ee";
        ctx.fillRect(-11, 8, 8, 12); ctx.fillRect(3, 8, 8, 12);
        ctx.restore();
        api.text("距离 " + Math.floor(t * 8), W - 14, 24, { size: 12, weight: 700, color: "#a99cf0", align: "right" });
      });
    }
  });

  /* ---------------- 15. 黑洞吞噬 ---------------- */
  GB.add({
    id: "blackhole", name: "黑洞吞噬", cat: "arcade", icon: "🕳️", tags: ["new"],
    desc: "吞掉比你小的天体，避开更大的", tip: "拖动黑洞移动，越大越强", w: 480, h: 520,
    colors: ["#131a33", "#05060c"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let r, objs, mx, my, acc, score, spawnT;
      r = 18; objs = []; mx = W / 2; my = H / 2; acc = 0; score = 0; spawnT = 0;
      api.onMove((p) => { mx = p.x; my = p.y; }); api.onDown((p) => { mx = p.x; my = p.y; });
      api.loop((dt, t) => {
        mx = api.clamp(mx, r, W - r); my = api.clamp(my, r, H - r);
        spawnT += dt;
        while (spawnT > Math.max(.28, .9 - t * .02)) {
          spawnT = 0;
          const a = api.rand(0, 6.283), d = Math.max(W, H) * .62;
          const sz = api.rand(8, 26);
          objs.push({ x: W / 2 + Math.cos(a) * d, y: H / 2 + Math.sin(a) * d, r: sz, vx: -Math.cos(a) * api.rand(30, 80), vy: -Math.sin(a) * api.rand(30, 80), hue: api.rand(160, 320) });
        }
        for (const o of objs) {
          const dx = mx - o.x, dy = my - o.y, d = Math.hypot(dx, dy) || 1;
          if (d < 190) { o.x += (dx / d) * 40 * dt; o.y += (dy / d) * 40 * dt; }
          o.x += o.vx * dt; o.y += o.vy * dt;
          if (o.dead) continue;
          if (d < r - o.r * .4 && o.r < r * 1.05) {
            o.dead = true; r = Math.min(74, r + o.r * .16); score += Math.ceil(o.r);
            api.setScore(score); api.beep(240 + o.r * 8, .07, "sine", .04);
          } else if (d < r + o.r * .6 && o.r > r * 1.15) {
            api.over("被更大的天体撞上", "吞噬质量 " + score, false);
          }
        }
        objs = objs.filter((o) => !o.dead && o.x > -80 && o.x < W + 80 && o.y > -80 && o.y < H + 80);
        api.clear("#05060c");
        ctx.fillStyle = "rgba(255,255,255,.25)";
        for (let i = 0; i < 40; i++) ctx.fillRect((i * 157) % W, (i * 91 + t * 12) % H, 1.6, 1.6);
        objs.forEach((o) => {
          const g = ctx.createRadialGradient(o.x - o.r * .3, o.y - o.r * .3, 1, o.x, o.y, o.r);
          g.addColorStop(0, "hsl(" + o.hue + ",90%,78%)");
          g.addColorStop(1, "hsl(" + o.hue + ",75%,42%)");
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 7); ctx.fill();
        });
        const pg = ctx.createRadialGradient(mx, my, r * .2, mx, my, r * 1.6);
        pg.addColorStop(0, "rgba(124,92,255,.95)"); pg.addColorStop(.6, "rgba(124,92,255,.25)"); pg.addColorStop(1, "rgba(124,92,255,0)");
        ctx.fillStyle = pg;
        ctx.beginPath(); ctx.arc(mx, my, r * 1.6, 0, 7); ctx.fill();
        ctx.fillStyle = "#080611";
        ctx.beginPath(); ctx.arc(mx, my, r, 0, 7); ctx.fill();
        ctx.strokeStyle = "rgba(167,139,250,.85)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(mx, my, r + 2, 0, 7); ctx.stroke(); ctx.lineWidth = 1;
        api.text("质量 " + score, 14, 24, { size: 12, weight: 700, color: "#a99cf0", align: "left" });
      });
    }
  });

  /* ---------------- 16. 炮台防守 ---------------- */
  GB.add({
    id: "turret", name: "炮台防守", cat: "arcade", icon: "🔫", tags: ["new"],
    desc: "转动炮口消灭两侧涌来的敌人", tip: "指针瞄准，按住开火", w: 480, h: 520,
    colors: ["#3a2333", "#0d070c"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const bx = W / 2, by = H - 70;
      let ang, aim, bullets, foes, acc, score, cd, hp, firing;
      ang = -Math.PI / 2; aim = -Math.PI / 2; bullets = []; foes = []; acc = 0; score = 0; cd = 0; hp = 5; firing = false;
      api.onMove((p) => { aim = Math.atan2(p.y - by, p.x - bx); });
      api.onDown((p) => { firing = true; aim = Math.atan2(p.y - by, p.x - bx); });
      api.onUp(() => { firing = false; });
      api.loop((dt, t) => {
        let d = ((aim - ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        ang += d * Math.min(1, dt * 14);
        cd -= dt;
        if (firing && cd <= 0) {
          cd = .16;
          bullets.push({ x: bx + Math.cos(ang) * 26, y: by + Math.sin(ang) * 26, vx: Math.cos(ang) * 520, vy: Math.sin(ang) * 520 });
          api.beep(880, .05, "square", .03, 420);
        }
        acc += dt;
        if (acc > Math.max(.42, 1.0 - t * .018)) {
          acc = 0;
          const left = Math.random() < .5;
          foes.push({ x: left ? -30 : W + 30, y: api.rand(60, H - 140), r: api.rand(11, 17), hp: 1 + Math.floor(t / 22), v: api.rand(34, 58) + t * .6 });
        }
        foes.forEach((f) => {
          const dx = bx - f.x, dy = by - f.y, dd = Math.hypot(dx, dy) || 1;
          f.x += (dx / dd) * f.v * dt; f.y += (dy / dd) * f.v * dt;
          if (Math.hypot(f.x - bx, f.y - by) < 40) {
            f.dead = true; hp--;
            api.noise(.25, .14, 400);
            if (hp <= 0) api.over("炮台失守", "击杀 " + score + " 个敌人", false);
          }
        });
        bullets.forEach((b) => {
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) b.dead = true;
          for (const f of foes) {
            if (!f.dead && Math.hypot(b.x - f.x, b.y - f.y) < f.r + 4) {
              b.dead = true; f.hp--;
              if (f.hp <= 0) { f.dead = true; score += 10; api.setScore(score); api.beep(300, .06, "square", .04); }
              break;
            }
          }
        });
        bullets = bullets.filter((b) => !b.dead);
        foes = foes.filter((f) => !f.dead);
        api.clear("#0d070c");
        ctx.strokeStyle = "rgba(255,92,138,.25)";
        [120, 190].forEach((r) => { ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.stroke(); });
        foes.forEach((f) => {
          ctx.fillStyle = "#ff5c8a";
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill();
          ctx.fillStyle = "#2a0b17";
          ctx.beginPath(); ctx.arc(f.x - f.r * .3, f.y - f.r * .2, f.r * .25, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.arc(f.x + f.r * .3, f.y - f.r * .2, f.r * .25, 0, 7); ctx.fill();
        });
        bullets.forEach((b) => {
          ctx.fillStyle = "#fbbf24";
          ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
        });
        ctx.save(); ctx.translate(bx, by); ctx.rotate(ang);
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(0, -6, 30, 12);
        ctx.restore();
        ctx.fillStyle = "#7c5cff";
        ctx.beginPath(); ctx.arc(bx, by, 22, 0, 7); ctx.fill();
        ctx.fillStyle = "#c4b5fd";
        ctx.beginPath(); ctx.arc(bx, by, 10, 0, 7); ctx.fill();
        api.text("♥".repeat(Math.max(0, hp)), 14, 24, { size: 13, color: "#ff7a95", align: "left" });
        api.text(String(score), W - 14, 24, { size: 13, weight: 700, color: "#ffd166", align: "right" });
      });
    }
  });

  /* ---------------- 17. 引力收集 ---------------- */
  GB.add({
    id: "gravitywell", name: "引力收集", cat: "arcade", icon: "🌌", tags: ["new"],
    desc: "在黑洞引力中收集能量球", tip: "指针移动飞船，别掉进黑洞", w: 480, h: 520,
    colors: ["#1a2350", "#06070f"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h, cx = W / 2, cy = H / 2, BH = 44;
      let x, y, vx, vy, orbs, score, tx, ty, tacc;
      x = W * .5; y = H * .2; vx = 0; vy = 0; orbs = []; score = 0; tx = x; ty = y; tacc = 0;
      api.onMove((p) => { tx = p.x; ty = p.y; }); api.onDown((p) => { tx = p.x; ty = p.y; });
      api.loop((dt, t) => {
        const dx = cx - x, dy = cy - y, d = Math.hypot(dx, dy) || 1;
        const pull = 26000 / (d * d) * 40;
        vx += (dx / d) * pull * dt + (tx - x) * 2.2 * dt;
        vy += (dy / d) * pull * dt + (ty - y) * 2.2 * dt;
        vx *= .985; vy *= .985;
        x += vx * dt; y += vy * dt;
        if (x < 12) { x = 12; vx = Math.abs(vx) * .5; }
        if (x > W - 12) { x = W - 12; vx = -Math.abs(vx) * .5; }
        if (y < 12) { y = 12; vy = Math.abs(vy) * .5; }
        if (y > H - 12) { y = H - 12; vy = -Math.abs(vy) * .5; }
        if (Math.hypot(x - cx, y - cy) < BH - 4) api.over("被黑洞吞没", "收集 " + score / 10 + " 个能量球", false);
        tacc += dt;
        if (tacc > .95 && orbs.length < 9) {
          tacc = 0;
          const a = api.rand(0, 6.283), rr = api.rand(BH + 50, Math.min(W, H) * .46);
          orbs.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr, a: a, r: rr, p: api.rand(0, 6.283) });
        }
        orbs = orbs.filter((o) => {
          o.a += .5 * dt;
          o.x = cx + Math.cos(o.a) * o.r; o.y = cy + Math.sin(o.a) * o.r;
          if (Math.hypot(o.x - x, o.y - y) < 20) { score += 10; api.setScore(score); api.beep(920, .06, "sine", .04); return false; }
          return true;
        });
        api.clear("#06070f");
        ctx.fillStyle = "rgba(255,255,255,.3)";
        for (let i = 0; i < 50; i++) ctx.fillRect((i * 89) % W, (i * 61) % H, 1.4, 1.4);
        const g = ctx.createRadialGradient(cx, cy, BH * .6, cx, cy, BH * 3.4);
        g.addColorStop(0, "rgba(124,92,255,.55)"); g.addColorStop(1, "rgba(124,92,255,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, BH * 3.4, 0, 7); ctx.fill();
        ctx.fillStyle = "#050409";
        ctx.beginPath(); ctx.arc(cx, cy, BH, 0, 7); ctx.fill();
        ctx.strokeStyle = "rgba(167,139,250,.7)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, BH + 1, 0, 7); ctx.stroke(); ctx.lineWidth = 1;
        orbs.forEach((o) => {
          const og = ctx.createRadialGradient(o.x, o.y, 1, o.x, o.y, 9);
          og.addColorStop(0, "#e0fbff"); og.addColorStop(1, "#22d3ee");
          ctx.fillStyle = og;
          ctx.beginPath(); ctx.arc(o.x, o.y, 8, 0, 7); ctx.fill();
        });
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(vy, vx));
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-9, -8); ctx.lineTo(-5, 0); ctx.lineTo(-9, 8); ctx.closePath(); ctx.fill();
        ctx.restore();
        api.text("能量 " + score / 10, 14, 24, { size: 12, weight: 700, color: "#7dd3e8", align: "left" });
      });
    }
  });

  /* ---------------- 18. 墙跳攀登 ---------------- */
  GB.add({
    id: "walljump", name: "墙跳攀登", cat: "arcade", icon: "🧗", tags: ["new"],
    desc: "在两面墙之间反复蹬跳向上", tip: "点击起跳，贴墙时可蹬墙", w: 440, h: 560,
    colors: ["#2d2a4a", "#0a0913"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      const L = 96, R = W - 96;
      let x, y, vx, vy, dir, height, cam, spikes, score;
      x = L + 20; y = H - 90; vx = 0; vy = 0; dir = 1; height = 0; cam = 0; spikes = []; score = 0;
      for (let i = 0; i < 12; i++) spikes.push({ y: -160 - i * 110, side: Math.random() < .5 ? -1 : 1 });
      function boost() {
        const onL = x < L + 26, onR = x > R - 26;
        if (onL) { vx = 300; vy = -400; dir = 1; }
        else if (onR) { vx = -300; vy = -400; dir = -1; }
        else { vy = Math.max(vy, -220); vy -= 120; }
        api.beep(520, .06, "sine", .035);
      }
      api.onDown(boost);
      api.onKey((k) => { if (k === " " || k === "Enter" || k === "ArrowUp") boost(); });
      api.loop((dt) => {
        vy += 900 * dt;
        x += vx * dt; y += vy * dt;
        if (x < L + 14) { x = L + 14; vx = Math.abs(vx) * .1; }
        if (x > R - 14) { x = R - 14; vx = -Math.abs(vx) * .1; }
        if (y < height - 300) { height = y; }
        cam += ((y - H * .55) - cam) * Math.min(1, dt * 5);
        for (const s of spikes) {
          const sy = s.y, sx = s.side < 0 ? L : R;
          if (Math.abs(y - sy) < 26 && Math.abs(x - sx) < 26) api.over("撞上墙刺", "爬升 " + Math.floor(-height / 10) + " 米", false);
        }
        while (spikes.length && spikes[spikes.length - 1].y > y - 1400) {
          spikes.push({ y: spikes[spikes.length - 1].y - api.rand(80, 130), side: Math.random() < .5 ? -1 : 1 });
        }
        if (y > cam + H + 40) api.over("掉到底部", "爬升 " + Math.floor(-height / 10) + " 米", false);
        score = Math.floor(-height / 10);
        api.setScore(score);
        const oy = -cam;
        api.clear("#0a0913");
        ctx.fillStyle = "#191630";
        ctx.fillRect(0, 0, L, H);
        ctx.fillRect(R, 0, W - R, H);
        ctx.fillStyle = "#241f42";
        for (let i = 0; i < 40; i++) {
          const by = ((i * 90 + cam * .6) % (H + 90)) - 45;
          ctx.fillRect(4, by, L - 8, 4);
          ctx.fillRect(R + 4, by, W - R - 8, 4);
        }
        ctx.strokeStyle = "rgba(124,92,255,.5)";
        ctx.beginPath(); ctx.moveTo(L, 0); ctx.lineTo(L, H); ctx.moveTo(R, 0); ctx.lineTo(R, H); ctx.stroke();
        spikes.forEach((s) => {
          const sy = s.y + oy;
          if (sy < -40 || sy > H + 40) return;
          ctx.fillStyle = "#ff5c8a";
          if (s.side < 0) {
            ctx.beginPath(); ctx.moveTo(L, sy - 16); ctx.lineTo(L + 26, sy); ctx.lineTo(L, sy + 16); ctx.closePath(); ctx.fill();
          } else {
            ctx.beginPath(); ctx.moveTo(R, sy - 16); ctx.lineTo(R - 26, sy); ctx.lineTo(R, sy + 16); ctx.closePath(); ctx.fill();
          }
        });
        ctx.save(); ctx.translate(x, y + oy);
        ctx.fillStyle = "#fbbf24";
        api.rr(-12, -20, 24, 28, 8); ctx.fill();
        ctx.fillStyle = "#3b2a00";
        ctx.fillRect(-7, -13, 4, 4); ctx.fillRect(3, -13, 4, 4);
        ctx.fillStyle = "#22d3ee";
        ctx.fillRect(-9, 8, 7, 12 - Math.abs(vx) * .004); ctx.fillRect(2, 8, 7, 12 - Math.abs(vx) * .004);
        ctx.restore();
        api.text("高度 " + score + " m", 14, 24, { size: 12, weight: 700, color: "#a99cf0", align: "left" });
      });
    }
  });
})();
