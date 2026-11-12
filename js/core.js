/* ==========================================================
   core.js — 大厅、路由、游戏页
   ========================================================== */
(function () {
  "use strict";

  const STYLE = {
    arcade: { c1: "#3a2a72", c2: "#191231", glow: "#7c5cff" },
    puzzle: { c1: "#0f4c5c", c2: "#0a2028", glow: "#22d3ee" },
    board: { c1: "#1a4d33", c2: "#0c2319", glow: "#34d399" },
    casual: { c1: "#6b3410", c2: "#26130a", glow: "#fb923c" },
    brain: { c1: "#1e3a8a", c2: "#0d1733", glow: "#60a5fa" }
  };

  const Core = {
    state: { cat: "all", q: "" },
    games: [],
    view: null,

    init() {
      GS.load();
      Sound.on = GS.data.sound !== false;
      this.view = document.getElementById("view");
      this.games = GB.games.slice();
      document.getElementById("foot-count").textContent = this.games.length;
      document.getElementById("count-badge").textContent = this.games.length + " 款";

      const sBtn = document.getElementById("btn-sound");
      const syncSound = () => {
        sBtn.textContent = Sound.on ? "🔊" : "🔇";
        sBtn.classList.toggle("off", !Sound.on);
      };
      syncSound();
      sBtn.addEventListener("click", () => {
        Sound.on = !Sound.on;
        GS.data.sound = Sound.on;
        GS.save();
        syncSound();
        if (Sound.on) Sound.ok();
      });

      const search = document.getElementById("search");
      let timer = null;
      search.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          this.state.q = search.value.trim().toLowerCase();
          if (location.hash.indexOf("/play/") === 0) location.hash = "#/";
          else this.renderGrid();
        }, 120);
      });
      window.addEventListener("keydown", (e) => {
        if (e.key === "/" && document.activeElement !== search) {
          e.preventDefault();
          search.focus();
        }
        if (e.key === "Escape" && location.hash.indexOf("/play/") === 0) {
          location.hash = "#/";
        }
      });

      window.addEventListener("hashchange", () => this.route());
      this.route();
    },

    route() {
      const h = location.hash.replace(/^#/, "");
      Runner.stop();
      if (h.indexOf("/play/") === 0) {
        const id = h.slice(6);
        const g = GB.get(id);
        if (!g) { location.hash = "#/"; return; }
        this.play(g);
      } else {
        this.home();
      }
    },

    /* ---------------- 大厅 ---------------- */
    home() {
      document.body.classList.remove("playing");
      document.title = "XFM Games · " + this.games.length + " 款即点即玩小游戏";
      const recent = GS.data.recent.map((id) => GB.get(id)).filter(Boolean).slice(0, 1)[0];
      const total = this.games.length;
      const played = Object.keys(GS.data.best).length;

      this.view.innerHTML = `
      <section class="hero">
        <div class="hero-txt">
          <h1>打开就能玩的<b>${total} 款小游戏</b></h1>
          <p>无需下载、无需登录，键盘与触屏都顺手。经典街机、烧脑解谜、双人棋牌，随时点开一局。</p>
          <div class="hero-actions">
            <button class="btn-main" id="hero-random">🎲 随机来一局</button>
            ${recent ? `<a class="btn-ghost" href="#/play/${recent.id}">▶ 继续 ${recent.name}</a>` : ""}
            <a class="btn-ghost" href="#/play/sokoban">📦 推箱子 50 关</a>
          </div>
        </div>
        <div class="hero-art" aria-hidden="true">
          <span>🐍</span><span>🧩</span><span>🎯</span>
          <span>🕹️</span><span>♟️</span><span>🧠</span>
        </div>
      </section>

      <div class="section-head">
        <h2><i></i>全部游戏</h2>
        <span class="sub">已玩 ${played} 款 · 共 ${total} 款</span>
      </div>
      <div class="chips" id="chips"></div>
      <div class="grid-games" id="game-grid"></div>`;

      this.renderChips();
      this.renderGrid();

      const rnd = document.getElementById("hero-random");
      if (rnd) rnd.addEventListener("click", () => {
        const g = T.pick(this.games);
        location.hash = "#/play/" + g.id;
      });
    },

    renderChips() {
      const counts = {};
      this.games.forEach((g) => { counts[g.cat] = (counts[g.cat] || 0) + 1; });
      const items = [{ k: "all", n: "全部", c: this.games.length }]
        .concat(Object.keys(CATS).map((k) => ({ k, n: CATS[k].name, c: counts[k] || 0 })))
        .concat([{ k: "fav", n: "收藏", c: GS.data.fav.length }]);

      const el = document.getElementById("chips");
      el.innerHTML = items.map((it) =>
        `<button class="chip ${this.state.cat === it.k ? "on" : ""}" data-cat="${it.k}">
           ${it.n}<span class="n">${it.c}</span>
         </button>`).join("");

      el.querySelectorAll(".chip").forEach((b) => {
        b.addEventListener("click", () => {
          this.state.cat = b.dataset.cat;
          this.renderChips();
          this.renderGrid();
        });
      });
    },

    filtered() {
      const { cat, q } = this.state;
      return this.games.filter((g) => {
        if (cat === "fav" && !GS.isFav(g.id)) return false;
        if (cat !== "all" && cat !== "fav" && g.cat !== cat) return false;
        if (q) {
          const hay = (g.name + " " + g.desc + " " + g.id + " " + g.tags.join(" ")).toLowerCase();
          if (hay.indexOf(q) < 0) return false;
        }
        return true;
      });
    },

    renderGrid() {
      const grid = document.getElementById("game-grid");
      if (!grid) return;
      const list = this.filtered();
      if (!list.length) {
        grid.innerHTML = `<div class="empty">没有找到相关游戏，换个关键词试试</div>`;
        return;
      }
      grid.innerHTML = list.map((g) => {
        const s = STYLE[g.cat] || STYLE.casual;
        const best = GS.best(g.id);
        const isNew = GS.data.best[g.id] == null && g.tags.indexOf("new") >= 0;
        return `<a class="card" href="#/play/${g.id}" title="${g.desc}">
          <div class="thumb" style="--c1:${s.c1};--c2:${s.c2}">
            <span class="ico">${g.icon}</span>
            ${isNew ? '<span class="new-dot">NEW</span>' : ""}
          </div>
          <div class="card-body">
            <b>${g.name}</b>
            <div class="meta">
              <span class="cat" style="color:${s.glow}">${CATS[g.cat].name}</span>
              <span class="best">${best ? "★ " + T.fmt(best) : "未玩"}</span>
            </div>
          </div>
        </a>`;
      }).join("");
    },

    /* ---------------- 游戏页 ---------------- */
    play(g) {
      document.body.classList.add("playing");
      const s = STYLE[g.cat] || STYLE.casual;
      const best = GS.best(g.id);
      this.view.innerHTML = `
      <div class="play-wrap" style="--glow:${s.glow}">
        <div class="play-top">
          <a class="back" href="#/">← 返回</a>
          <div class="play-title">
            <b>${g.icon} ${g.name}</b>
            <span>${CATS[g.cat].name}${g.desc ? " · " + g.desc : ""}</span>
          </div>
          <div class="play-hud"${g.noScore ? ' style="display:none"' : ""}>
            <div class="hud-item"><span>得分</span><b id="hud-score">0</b></div>
            <div class="hud-item best"><span>最高</span><b id="hud-best">${best || 0}</b></div>
            <div class="play-tools">
              <button class="tool-btn" id="btn-restart" title="重新开始 (R)">⟳</button>
              <button class="tool-btn" id="btn-fav" title="收藏">${GS.isFav(g.id) ? "★" : "☆"}</button>
            </div>
          </div>
        </div>
        <div class="stage" id="stage"></div>
        <div class="play-foot" id="foot">${g.tip || "点击画面开始"}</div>
      </div>`;

      const stage = document.getElementById("stage");
      const scoreEl = document.getElementById("hud-score");
      const bestEl = document.getElementById("hud-best");

      Runner.mount(stage, g, {
        onScore(score, bestScore) {
          scoreEl.textContent = score;
          bestEl.textContent = Math.max(bestScore, score);
        },
        onHint(str) {
          document.getElementById("foot").innerHTML = str;
        }
      });

      document.getElementById("btn-restart").addEventListener("click", () => {
        if (Runner.cur) Runner.cur.restart();
      });
      const favBtn = document.getElementById("btn-fav");
      favBtn.addEventListener("click", () => {
        const on = GS.fav(g.id);
        favBtn.textContent = on ? "★" : "☆";
        favBtn.style.color = on ? "#fbbf24" : "";
      });
      if (GS.isFav(g.id)) favBtn.style.color = "#fbbf24";

      document.title = g.name + " · 小游戏站";
    }
  };

  window.addEventListener("DOMContentLoaded", () => Core.init());
  window.Core = Core;
})();
