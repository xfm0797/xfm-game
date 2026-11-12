/* ==========================================================
   vol-c.js — 脑力问答扩展 32 款
   ========================================================== */
(function () {
  "use strict";

  const hit = (p, x, y, w, h) => p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;

  /* ---------------- 通用选择题引擎 ----------------
     题库格式：{ q:"题干", a:["正确答案","干扰1","干扰2"] }
     选项在运行时打乱，答案位置随机会变化
  ------------------------------------------------ */
  function mcqGame(id, name, icon, desc, bank, cfg) {
    cfg = cfg || {};
    const total = cfg.total || bank.length;
    const optCount = cfg.opts || bank[0].a.length;
    GB.add({
      id, name, cat: "brain", icon, desc, tags: ["new"],
      tip: cfg.tip || "点击选项，答对连击加分", w: 480, h: 600,
      colors: ["#1a2a4a", "#0a101e"],
      init(api) {
        const ctx = api.ctx, W = api.w, H = api.h;
        let order, qi, labels, answer, plain, streak, score, wrong, lock, wait;
        function load() {
          const src = bank[order[qi % bank.length]];
          const idx = api.shuffle(src.a.map((_, i) => i));
          const picked = idx.slice(0, optCount);
          labels = picked.map((i) => src.a[i]);
          answer = picked.indexOf(0);
          if (answer < 0) answer = 0;
          plain = src.q;
          lock = 0; wait = 0;
        }
        order = api.shuffle(bank.map((_, i) => i));
        qi = 0; streak = 0; score = 0; wrong = 0; load();
        api.setScore(0);
        const by = 310, bh = 54, gap = 12;
        api.onDown((p) => {
          if (lock) return;
          for (let i = 0; i < labels.length; i++) {
            const y = by + i * (bh + gap);
            if (hit(p, 40, y, 400, bh)) {
              if (i === answer) {
                streak++;
                score += 100 + streak * 15;
                api.setScore(score);
                api.beep(760, .07, "sine", .05);
                lock = 1;
              } else {
                streak = 0; wrong++;
                api.beep(180, .12, "square", .05);
                lock = 2;
              }
              wait = .5;
              return;
            }
          }
        });
        api.onKey((k) => {
          if (lock) return;
          const n = parseInt(k, 10);
          if (n >= 1 && n <= labels.length) {
            const i = n - 1;
            if (i === answer) { streak++; score += 100 + streak * 15; api.setScore(score); lock = 1; }
            else { streak = 0; wrong++; lock = 2; }
            wait = .5;
          }
        });
        api.loop((dt) => {
          if (wait > 0) {
            wait -= dt;
            if (wait <= 0) {
              qi++;
              if (qi >= total) { api.over("全部答完！", "答对 " + (total - wrong) + " / " + total, wrong <= 3); return; }
              load();
            }
          }
          api.clear("#0a101e");
          api.text((cfg.catName || "脑力挑战") + " · 第 " + Math.min(qi + 1, total) + "/" + total + " 题", 24, 34, { size: 11.5, weight: 700, color: "#7d8ba5", align: "left" });
          api.text("连对 ×" + streak, W - 24, 34, { size: 12, weight: 700, color: "#fbbf24", align: "right" });
          api.rr(24, 50, W - 48, 5, 3);
          ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill();
          api.rr(24, 50, (W - 48) * (qi / total), 5, 3);
          ctx.fillStyle = "#7c5cff"; ctx.fill();
          ctx.save();
          api.font(17, 700);
          ctx.fillStyle = "#eef1f8";
          ctx.textAlign = "center";
          const lines = [];
          let line = "";
          String(plain).split("").forEach((ch) => {
            if (ctx.measureText(line + ch).width > 392) { lines.push(line); line = ch; }
            else line += ch;
          });
          lines.push(line);
          lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, 170 + i * 34));
          ctx.restore();
          labels.forEach((opt, i) => {
            const y = by + i * (bh + gap);
            api.rr(40, y, 400, bh, 13);
            let bg = "rgba(255,255,255,.055)";
            if (lock && i === answer) bg = "rgba(52,211,153,.32)";
            else if (lock && lock === 2 && i !== answer) bg = "rgba(255,92,138,.14)";
            ctx.fillStyle = bg; ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,.09)"; ctx.stroke();
            ctx.fillStyle = "rgba(255,255,255,.12)";
            ctx.beginPath(); ctx.arc(70, y + bh / 2, 13, 0, 7); ctx.fill();
            api.text(String(i + 1), 70, y + bh / 2, { size: 12, weight: 700, color: "#9aa3b5" });
            api.text(opt, 94, y + bh / 2, { size: 15, weight: 600, color: "#e7ecf7", align: "left" });
          });
          api.text(cfg.foot || "答对连击越高，分数越多", W / 2, H - 20, { size: 10.5, color: "#4f5b70" });
        });
      }
    });
  }

  /* ================= 1-15 知识问答 ================= */
  mcqGame("historyquiz", "历史问答", "🏛️", "中国与世界历史常识", [
    { q: "中国历史上第一个统一的中央集权王朝是？", a: ["秦朝", "汉朝", "周朝"] },
    { q: "第二次世界大战结束于哪一年？", a: ["1945 年", "1943 年", "1949 年"] },
    { q: "秦始皇统一六国是在公元前？", a: ["221 年", "206 年", "202 年"] },
    { q: "唐朝的开国皇帝是？", a: ["李渊", "李世民", "李隆基"] },
    { q: "法国大革命爆发于哪一年？", a: ["1789 年", "1776 年", "1815 年"] },
    { q: "改进造纸术的是？", a: ["蔡伦", "张衡", "毕昇"] },
    { q: "甲午战争发生在哪一年？", a: ["1894 年", "1900 年", "1884 年"] },
    { q: "丝绸之路开通于哪个朝代？", a: ["汉朝", "唐朝", "秦朝"] },
    { q: "美国《独立宣言》发表于？", a: ["1776 年", "1789 年", "1812 年"] },
    { q: "哥伦布到达美洲是在？", a: ["1492 年", "1519 年", "1453 年"] },
    { q: "古罗马帝国的首都是？", a: ["罗马", "雅典", "亚历山大"] },
    { q: "中国科举制度始于哪个朝代？", a: ["隋朝", "汉朝", "唐朝"] }
  ], { catName: "历史问答" });

  mcqGame("chemquiz", "化学问答", "⚗️", "化学基础与生活常识", [
    { q: "水的化学式是？", a: ["H₂O", "CO₂", "H₂O₂"] },
    { q: "空气中含量最多的气体是？", a: ["氮气", "氧气", "二氧化碳"] },
    { q: "元素符号 Fe 表示？", a: ["铁", "氟", "铅"] },
    { q: "食盐的主要成分是？", a: ["氯化钠", "碳酸钙", "硫酸钠"] },
    { q: "干冰是哪种物质？", a: ["固态二氧化碳", "固态水", "固态氮"] },
    { q: "金刚石由什么元素组成？", a: ["碳", "硅", "铝"] },
    { q: "pH 值等于 7 表示？", a: ["中性", "酸性", "碱性"] },
    { q: "天然气的主要成分是？", a: ["甲烷", "乙烷", "丙烷"] },
    { q: "人体中含量最多的元素是？", a: ["氧", "碳", "钙"] },
    { q: "酸碱指示剂常用的是？", a: ["石蕊", "明矾", "活性炭"] },
    { q: "铁生锈主要需要？", a: ["氧气和水", "氮气", "二氧化碳"] },
    { q: "化学中 1 摩尔约含多少个粒子？", a: ["6.02×10²³", "3.14×10²³", "9.8×10²³"] }
  ], { catName: "化学问答" });

  mcqGame("physquiz", "物理问答", "🧲", "物理量与自然现象", [
    { q: "光在真空中的速度约为？", a: ["3×10⁸ m/s", "3×10⁶ m/s", "1×10⁸ m/s"] },
    { q: "力的国际单位是？", a: ["牛顿", "焦耳", "瓦特"] },
    { q: "声音在空气中的速度约为？", a: ["340 m/s", "3400 m/s", "34 m/s"] },
    { q: "电流的单位是？", a: ["安培", "伏特", "欧姆"] },
    { q: "标准大气压约为？", a: ["101 kPa", "10 kPa", "1010 kPa"] },
    { q: "标准大气压下水沸腾的温度是？", a: ["100 ℃", "90 ℃", "120 ℃"] },
    { q: "电功率的单位是？", a: ["瓦特", "千瓦时", "库仑"] },
    { q: "彩虹的形成主要由于？", a: ["折射与色散", "反射", "衍射"] },
    { q: "中国民用交流电频率是？", a: ["50 Hz", "60 Hz", "100 Hz"] },
    { q: "万有引力定律的提出者是？", a: ["牛顿", "爱因斯坦", "伽利略"] },
    { q: "声音不能在什么中传播？", a: ["真空", "空气", "水"] },
    { q: "电阻的单位是？", a: ["欧姆", "安培", "特斯拉"] }
  ], { catName: "物理问答" });

  mcqGame("bioquiz", "生物问答", "🧬", "人体与生命的奥秘", [
    { q: "人体最大的器官是？", a: ["皮肤", "肝脏", "肺"] },
    { q: "血红蛋白中含有的金属元素是？", a: ["铁", "锌", "钙"] },
    { q: "植物光合作用会释放？", a: ["氧气", "氮气", "氢气"] },
    { q: "被称为细胞「能量工厂」的是？", a: ["线粒体", "细胞核", "核糖体"] },
    { q: "人类体细胞有多少对染色体？", a: ["23 对", "22 对", "24 对"] },
    { q: "胰岛素由哪个器官分泌？", a: ["胰腺", "肝脏", "肾脏"] },
    { q: "DNA 双螺旋结构的发现者是？", a: ["沃森与克里克", "达尔文", "孟德尔"] },
    { q: "人体最长的骨头是？", a: ["股骨", "胫骨", "肱骨"] },
    { q: "血液中运输氧气的细胞是？", a: ["红细胞", "白细胞", "血小板"] },
    { q: "成年人的心脏有几个心房？", a: ["2 个", "1 个", "3 个"] },
    { q: "遗传信息的主要载体是？", a: ["DNA", "蛋白质", "脂肪"] },
    { q: "人体正常体温约为？", a: ["37 ℃", "35 ℃", "39 ℃"] }
  ], { catName: "生物问答" });

  mcqGame("astroquiz", "天文问答", "🔭", "星空、行星与宇宙", [
    { q: "太阳系中最大的行星是？", a: ["木星", "土星", "海王星"] },
    { q: "离太阳最近的行星是？", a: ["水星", "金星", "地球"] },
    { q: "月球绕地球一周约需？", a: ["27.3 天", "7 天", "365 天"] },
    { q: "银河系属于哪种星系？", a: ["螺旋星系", "椭圆星系", "不规则星系"] },
    { q: "火星有几颗天然卫星？", a: ["2 颗", "1 颗", "0 颗"] },
    { q: "光年是什么单位？", a: ["距离", "时间", "亮度"] },
    { q: "太阳的主要成分是？", a: ["氢", "氧", "氦"] },
    { q: "以壮观光环著称的行星是？", a: ["土星", "火星", "金星"] },
    { q: "一年中北半球白昼最长的节气是？", a: ["夏至", "冬至", "春分"] },
    { q: "黑洞的边界称为？", a: ["事件视界", "柯伊伯带", "日冕"] },
    { q: "北极星位于哪个星座？", a: ["小熊座", "大熊座", "猎户座"] },
    { q: "月全食时月亮常呈现什么颜色？", a: ["红铜色", "蓝色", "绿色"] }
  ], { catName: "天文问答" });

  mcqGame("sportquiz", "体育问答", "🏅", "规则、纪录与赛事常识", [
    { q: "足球比赛中每队场上球员人数是？", a: ["11 人", "10 人", "12 人"] },
    { q: "马拉松全程约为？", a: ["42.195 公里", "40 公里", "45 公里"] },
    { q: "NBA 每节比赛时长是？", a: ["12 分钟", "10 分钟", "15 分钟"] },
    { q: "乒乓球单打一局多少分制？", a: ["11 分", "21 分", "15 分"] },
    { q: "羽毛球一局多少分制？", a: ["21 分", "11 分", "15 分"] },
    { q: "足球世界杯几年举办一届？", a: ["4 年", "2 年", "5 年"] },
    { q: "标准围棋棋盘是？", a: ["19×19", "17×17", "21×21"] },
    { q: "排球比赛每队场上有几人？", a: ["6 人", "5 人", "7 人"] },
    { q: "奥运会五环不包含哪种颜色？", a: ["紫色", "蓝色", "黄色"] },
    { q: "游泳比赛中速度最快的泳姿通常是？", a: ["自由泳", "蛙泳", "仰泳"] },
    { q: "斯诺克台球中黑球分值是？", a: ["7 分", "5 分", "10 分"] },
    { q: "现代奥运会每几年举办一次？", a: ["4 年", "3 年", "2 年"] }
  ], { catName: "体育问答" });

  mcqGame("musicquiz", "音乐问答", "🎼", "乐理、乐器与音乐家", [
    { q: "标准钢琴有多少个琴键？", a: ["88 个", "76 个", "96 个"] },
    { q: "二胡有几根弦？", a: ["2 根", "3 根", "4 根"] },
    { q: "标准吉他有几根弦？", a: ["6 根", "4 根", "8 根"] },
    { q: "贝多芬《命运交响曲》是他的第几交响曲？", a: ["第五", "第三", "第九"] },
    { q: "音乐术语 piano 表示？", a: ["弱", "强", "渐快"] },
    { q: "常见古筝有多少根弦？", a: ["21 根", "16 根", "25 根"] },
    { q: "中国国歌《义勇军进行曲》的作曲者是？", a: ["聂耳", "冼星海", "刘天华"] },
    { q: "中央 C 的频率约为？", a: ["261 Hz", "440 Hz", "512 Hz"] },
    { q: "三拍子节奏的强弱规律是？", a: ["强 弱 弱", "强 弱", "强 强 弱"] },
    { q: "五线谱高音谱号又称？", a: ["G 谱号", "F 谱号", "C 谱号"] },
    { q: "《茉莉花》是哪个国家的民歌？", a: ["中国", "日本", "意大利"] },
    { q: "交响乐团中通常负责定音的是？", a: ["双簧管", "小号", "大提琴"] }
  ], { catName: "音乐问答" });

  mcqGame("moviequiz", "影视问答", "🎬", "电影、动画与幕后常识", [
    { q: "《泰坦尼克号》的导演是？", a: ["詹姆斯·卡梅隆", "斯皮尔伯格", "诺兰"] },
    { q: "《千与千寻》的导演是？", a: ["宫崎骏", "新海诚", "高畑勋"] },
    { q: "《教父》的导演是？", a: ["科波拉", "斯科塞斯", "库布里克"] },
    { q: "电影标准的放映帧率通常是？", a: ["24 帧/秒", "30 帧/秒", "60 帧/秒"] },
    { q: "好莱坞位于哪座城市？", a: ["洛杉矶", "纽约", "芝加哥"] },
    { q: "中国第一部动画长片是？", a: ["《铁扇公主》", "《大闹天宫》", "《哪吒闹海》"] },
    { q: "卓别林以哪种表演风格闻名？", a: ["喜剧默片", "歌舞片", "西部片"] },
    { q: "奥斯卡金像奖由哪个机构颁发？", a: ["美国电影艺术与科学学院", "戛纳电影节", "金球奖组委会"] },
    { q: "IMAX 主要指的是一种？", a: ["巨幕电影格式", "剪辑手法", "音效标准"] },
    { q: "“蒙太奇”一词源自哪种语言？", a: ["法语", "德语", "意大利语"] },
    { q: "《星球大战》中的武器光剑英文是？", a: ["Lightsaber", "Blaster", "Phaser"] },
    { q: "动画中的“定格动画”指？", a: ["逐帧拍摄实物", "电脑建模", "手绘赛璐璐"] }
  ], { catName: "影视问答" });

  mcqGame("poemquiz", "诗词问答", "📖", "古诗词名句接龙", [
    { q: "“床前明月光”的下一句是？", a: ["疑是地上霜", "低头思故乡", "举头望明月"] },
    { q: "《静夜思》的作者是？", a: ["李白", "杜甫", "王维"] },
    { q: "“春眠不觉晓”的作者是？", a: ["孟浩然", "白居易", "柳宗元"] },
    { q: "“欲穷千里目”的下一句是？", a: ["更上一层楼", "黄河入海流", "白日依山尽"] },
    { q: "《水调歌头·明月几时有》的作者是？", a: ["苏轼", "辛弃疾", "李清照"] },
    { q: "“大江东去，浪淘尽”出自？", a: ["《念奴娇·赤壁怀古》", "《满江红》", "《浪淘沙》"] },
    { q: "被后人尊称为“诗圣”的是？", a: ["杜甫", "李白", "王维"] },
    { q: "“独在异乡为异客”的作者是？", a: ["王维", "孟浩然", "岑参"] },
    { q: "“天生我材必有用”的下一句是？", a: ["千金散尽还复来", "长风破浪会有时", "直挂云帆济沧海"] },
    { q: "《木兰诗》属于？", a: ["北朝民歌", "唐诗", "宋词"] },
    { q: "“停车坐爱枫林晚”写的是哪个季节？", a: ["秋天", "春天", "冬天"] },
    { q: "“不知细叶谁裁出”的下一句是？", a: ["二月春风似剪刀", "万条垂下绿丝绦", "碧玉妆成一树高"] }
  ], { catName: "诗词问答" });

  mcqGame("xiehouyu", "歇后语", "🗯️", "补全民间歇后语", [
    { q: "泥菩萨过江 —— ？", a: ["自身难保", "稳如泰山", "有去无回"] },
    { q: "外甥打灯笼 —— ？", a: ["照旧（舅）", "一片光明", "走个过场"] },
    { q: "芝麻开花 —— ？", a: ["节节高", "粒粒香", "满地撒"] },
    { q: "哑巴吃黄连 —— ？", a: ["有苦说不出", "自讨苦吃", "甜在心头"] },
    { q: "猪八戒照镜子 —— ？", a: ["里外不是人", "美得很", "越看越丑"] },
    { q: "姜太公钓鱼 —— ？", a: ["愿者上钩", "一无所获", "守株待兔"] },
    { q: "十五个吊桶打水 —— ？", a: ["七上八下", "井井有条", "一场空"] },
    { q: "黄鼠狼给鸡拜年 —— ？", a: ["没安好心", "礼多人不怪", "诚意十足"] },
    { q: "小葱拌豆腐 —— ？", a: ["一清二白", "越拌越乱", "味道寡淡"] },
    { q: "竹篮打水 —— ？", a: ["一场空", "满满当当", "滴水不漏"] },
    { q: "周瑜打黄盖 —— ？", a: ["一个愿打一个愿挨", "两败俱伤", "各怀鬼胎"] },
    { q: "老鼠钻风箱 —— ？", a: ["两头受气", "如鱼得水", "来去自如"] }
  ], { catName: "歇后语" });

  mcqGame("engquiz", "英语词汇", "🔠", "常用单词与短语", [
    { q: "“苹果”的英文是？", a: ["apple", "orange", "banana"] },
    { q: "“图书馆”的英文是？", a: ["library", "bookstore", "laboratory"] },
    { q: "“美丽的”的英文是？", a: ["beautiful", "difficult", "careful"] },
    { q: "“昨天”的英文是？", a: ["yesterday", "tomorrow", "today"] },
    { q: "“difficult”的意思是？", a: ["困难的", "不同的", "美味的"] },
    { q: "“weather”的意思是？", a: ["天气", "水", "道路"] },
    { q: "“我每天早上跑步”的英文是？", a: ["I run every morning.", "I run every evening.", "I ran yesterday."] },
    { q: "“谢谢你的帮助”的英文是？", a: ["Thanks for your help.", "Thanks for your time.", "Sorry for the trouble."] },
    { q: "“博物馆”的英文是？", a: ["museum", "market", "machine"] },
    { q: "“important”的反义词是？", a: ["unimportant", "impossible", "interesting"] },
    { q: "“How old are you?” 是在问？", a: ["年龄", "姓名", "住址"] },
    { q: "“breakfast”指哪一餐？", a: ["早餐", "午餐", "晚餐"] }
  ], { catName: "英语词汇" });

  mcqGame("techquiz", "计算机常识", "💻", "软硬件与网络基础", [
    { q: "CPU 的中文名称是？", a: ["中央处理器", "内存条", "显卡"] },
    { q: "HTTP 默认使用的端口是？", a: ["80", "443", "8080"] },
    { q: "1 字节等于多少位？", a: ["8 位", "4 位", "16 位"] },
    { q: "二进制 1010 转成十进制是？", a: ["10", "8", "12"] },
    { q: "HTML 是一种？", a: ["标记语言", "编程语言", "数据库"] },
    { q: "断电后数据会丢失的是？", a: ["内存", "硬盘", "U 盘"] },
    { q: "SQL 主要用于？", a: ["数据库查询", "图形渲染", "音频编码"] },
    { q: "Android 系统基于哪个内核？", a: ["Linux", "Windows", "Unix"] },
    { q: "1920×1080 分辨率通常简称？", a: ["1080p", "720p", "4K"] },
    { q: "Wi-Fi 主要依靠什么传输数据？", a: ["无线电波", "红外线", "激光"] },
    { q: "IP 地址 127.0.0.1 通常表示？", a: ["本机", "网关", "公网地址"] },
    { q: "“开源”软件指？", a: ["源代码公开", "完全免费", "无版权"] }
  ], { catName: "计算机常识" });

  mcqGame("animalquiz", "动物世界", "🐾", "动物习性与纪录", [
    { q: "现存最大的陆地动物是？", a: ["非洲象", "长颈鹿", "犀牛"] },
    { q: "蓝鲸属于哪类动物？", a: ["哺乳动物", "鱼类", "爬行动物"] },
    { q: "蜜蜂通过什么方式传递蜜源方向？", a: ["摆尾舞", "鸣叫", "触碰"] },
    { q: "陆地上奔跑最快的动物是？", a: ["猎豹", "羚羊", "马"] },
    { q: "大熊猫的主要食物是？", a: ["竹子", "水果", "鱼"] },
    { q: "蝙蝠主要依靠什么定位？", a: ["回声定位", "视觉", "嗅觉"] },
    { q: "章鱼有几颗心脏？", a: ["3 颗", "1 颗", "2 颗"] },
    { q: "鸵鸟会飞吗？", a: ["不会飞", "会短距离飞", "会长途飞行"] },
    { q: "蚂蚁主要依靠什么沟通？", a: ["信息素", "声音", "触角电信号"] },
    { q: "企鹅主要生活在？", a: ["南半球", "北半球", "赤道"] },
    { q: "变色龙改变体色主要用于？", a: ["调节体温与交流", "伪装捕食", "吸引雨水"] },
    { q: "世界上最小的鸟类是？", a: ["蜂鸟", "麻雀", "燕子"] }
  ], { catName: "动物世界" });

  mcqGame("capitalquiz", "首都问答", "🏙️", "世界各国首都", [
    { q: "法国的首都是？", a: ["巴黎", "里昂", "马赛"] },
    { q: "澳大利亚的首都是？", a: ["堪培拉", "悉尼", "墨尔本"] },
    { q: "加拿大的首都是？", a: ["渥太华", "多伦多", "温哥华"] },
    { q: "巴西的首都是？", a: ["巴西利亚", "里约热内卢", "圣保罗"] },
    { q: "土耳其的首都是？", a: ["安卡拉", "伊斯坦布尔", "伊兹密尔"] },
    { q: "瑞士的首都是？", a: ["伯尔尼", "苏黎世", "日内瓦"] },
    { q: "印度的首都是？", a: ["新德里", "孟买", "加尔各答"] },
    { q: "越南的首都是？", a: ["河内", "胡志明市", "岘港"] },
    { q: "埃及的首都是？", a: ["开罗", "亚历山大", "卢克索"] },
    { q: "德国的首都是？", a: ["柏林", "慕尼黑", "法兰克福"] },
    { q: "美国的首都是？", a: ["华盛顿", "纽约", "洛杉矶"] },
    { q: "韩国的首都是？", a: ["首尔", "釜山", "仁川"] }
  ], { catName: "首都问答" });

  mcqGame("analogy", "类比推理", "🔗", "找出相同的逻辑关系", [
    { q: "医生 : 医院 = 教师 : ？", a: ["学校", "学生", "课本"] },
    { q: "书 : 阅读 = 音乐 : ？", a: ["聆听", "乐器", "歌曲"] },
    { q: "鸟 : 天空 = 鱼 : ？", a: ["水", "鳍", "河"] },
    { q: "树 : 森林 = 星 : ？", a: ["星空", "月亮", "夜"] },
    { q: "钢笔 : 写字 = 剪刀 : ？", a: ["裁剪", "锋利", "纸张"] },
    { q: "冬 : 冷 = 夏 : ？", a: ["热", "雨", "风"] },
    { q: "眼睛 : 看 = 耳朵 : ？", a: ["听", "闻", "说"] },
    { q: "方向盘 : 汽车 = 舵 : ？", a: ["轮船", "飞机", "火车"] },
    { q: "蜜蜂 : 蜂蜜 = 奶牛 : ？", a: ["牛奶", "草地", "牛角"] },
    { q: "眼镜 : 近视 = 拐杖 : ？", a: ["腿脚不便", "年老", "走路"] },
    { q: "种子 : 大树 = 鸡蛋 : ？", a: ["小鸡", "蛋壳", "早餐"] },
    { q: "字典 : 查字 = 地图 : ？", a: ["找路", "画画", "折纸"] }
  ], { catName: "类比推理" });

  mcqGame("oddword", "找出异类", "🎯", "四项中挑出不同类的一项", [
    { q: "下面哪个不属于同一类？", a: ["白菜", "苹果", "香蕉", "橘子"] },
    { q: "下面哪个不属于同一类？", a: ["篮球", "钢琴", "吉他", "小提琴"] },
    { q: "下面哪个不属于同一类？", a: ["圆形", "红色", "蓝色", "绿色"] },
    { q: "下面哪个不属于同一类？", a: ["泰山", "长江", "黄河", "珠江"] },
    { q: "下面哪个不属于同一类？", a: ["白天", "春天", "夏天", "秋天"] },
    { q: "下面哪个不属于同一类？", a: ["分数", "加法", "减法", "乘法"] },
    { q: "下面哪个不属于同一类？", a: ["麻雀", "狮子", "老虎", "豹子"] },
    { q: "下面哪个不属于同一类？", a: ["冰箱", "电脑", "手机", "平板"] },
    { q: "下面哪个不属于同一类？", a: ["牛奶", "米饭", "面条", "馒头"] },
    { q: "下面哪个不属于同一类？", a: ["生气", "高兴", "愉快", "开心"] },
    { q: "下面哪个不属于同一类？", a: ["橡皮", "铅笔", "尺子", "面包"] },
    { q: "下面哪个不属于同一类？", a: ["高铁", "汽车", "轮船", "自行车"] }
  ], { catName: "找出异类", opts: 4 });

  mcqGame("idiomchain", "成语接龙", "🀄", "选出以上句末字开头的成语", [
    { q: "一心一意 → ？", a: ["意味深长", "情投意合", "三心二意"] },
    { q: "画蛇添足 → ？", a: ["足智多谋", "画龙点睛", "多此一举"] },
    { q: "守株待兔 → ？", a: ["兔死狐悲", "守口如瓶", "待价而沽"] },
    { q: "亡羊补牢 → ？", a: ["牢不可破", "羊肠小道", "补天浴日"] },
    { q: "刻舟求剑 → ？", a: ["剑拔弩张", "舟车劳顿", "求同存异"] },
    { q: "对牛弹琴 → ？", a: ["琴瑟和鸣", "牛刀小试", "弹无虚发"] },
    { q: "四面楚歌 → ？", a: ["歌舞升平", "面面俱到", "楚河汉界"] },
    { q: "纸上谈兵 → ？", a: ["兵荒马乱", "上下一心", "谈笑风生"] },
    { q: "草木皆兵 → ？", a: ["兵临城下", "木已成舟", "皆大欢喜"] },
    { q: "指鹿为马 → ？", a: ["马到成功", "鹿死谁手", "为所欲为"] },
    { q: "杯弓蛇影 → ？", a: ["影影绰绰", "弓马娴熟", "蛇口蜂针"] },
    { q: "井底之蛙 → ？", a: ["蛙鸣蝉噪", "底细全无", "之乎者也"] }
  ], { catName: "成语接龙" });

  /* ================= 16-24 速算训练 ================= */
  function drillGame(id, name, icon, desc, gen, catName) {
    GB.add({
      id, name, cat: "brain", icon, desc, tags: ["new"],
      tip: "选对答案，12 题看总分", w: 480, h: 600, colors: ["#1d2b4a", "#080f1c"],
      init(api) {
        const ctx = api.ctx, W = api.w, H = api.h;
        let qi, cur, labels, answer, score, streak, wrong, lock, wait;
        function load() {
          cur = gen();
          const idx = api.shuffle(cur.a.map((_, i) => i));
          labels = idx.map((i) => cur.a[i]);
          answer = idx.indexOf(0);
          lock = 0; wait = 0;
        }
        qi = 0; score = 0; streak = 0; wrong = 0; load();
        const by = 300, bh = 60, bw = 190;
        api.onDown((p) => {
          if (lock) return;
          for (let i = 0; i < labels.length; i++) {
            const x = 40 + (i % 2) * (bw + 20), y = by + Math.floor(i / 2) * (bh + 16);
            if (hit(p, x, y, bw, bh)) {
              if (i === answer) { streak++; score += 100 + streak * 20; api.setScore(score); lock = 1; api.beep(780, .07, "sine", .05); }
              else { streak = 0; wrong++; lock = 2; api.beep(180, .12, "square", .05); }
              wait = .45; return;
            }
          }
        });
        api.onKey((k) => {
          if (lock) return;
          const n = parseInt(k, 10);
          if (n >= 1 && n <= 4) {
            const i = n - 1;
            if (i === answer) { streak++; score += 100 + streak * 20; api.setScore(score); lock = 1; }
            else { streak = 0; wrong++; lock = 2; }
            wait = .45;
          }
        });
        api.loop((dt) => {
          if (wait > 0) {
            wait -= dt;
            if (wait <= 0) {
              qi++;
              if (qi >= 12) { api.over("速算结束", "答对 " + (12 - wrong) + " / 12", wrong <= 2); return; }
              load();
            }
          }
          api.clear("#080f1c");
          api.text(catName + " · 第 " + (qi + 1) + "/12 题", 24, 34, { size: 11.5, weight: 700, color: "#7d8ba5", align: "left" });
          api.text("连对 ×" + streak, W - 24, 34, { size: 12, weight: 700, color: "#fbbf24", align: "right" });
          api.rr(24, 50, W - 48, 5, 3);
          ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill();
          api.rr(24, 50, (W - 48) * (qi / 12), 5, 3);
          ctx.fillStyle = "#22d3ee"; ctx.fill();
          api.text(cur.q, W / 2, 160, { size: 40, weight: 800, color: "#eef1f8" });
          if (cur.sub) api.text(cur.sub, W / 2, 210, { size: 12, color: "#5f6a80" });
          labels.forEach((opt, i) => {
            const x = 40 + (i % 2) * (bw + 20), y = by + Math.floor(i / 2) * (bh + 16);
            api.rr(x, y, bw, bh, 14);
            let bg = "rgba(255,255,255,.06)";
            if (lock && i === answer) bg = "rgba(52,211,153,.32)";
            else if (lock === 2 && i !== answer) bg = "rgba(255,92,138,.12)";
            ctx.fillStyle = bg; ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.stroke();
            api.text(opt, x + bw / 2, y + bh / 2, { size: 22, weight: 800, color: "#e7ecf7" });
          });
          api.text("数字键 1-4 也可以作答", W / 2, H - 22, { size: 10.5, color: "#4f5b70" });
        });
      }
    });
  }

  drillGame("addfast", "加法闪电战", "➕", "两位数以内快速相加", () => {
    const a = 2 + Math.floor(Math.random() * 19), b = 2 + Math.floor(Math.random() * 19);
    const r = a + b;
    const opts = [r, r + 1, r - 1, r + 10];
    return { q: a + " + " + b + " = ?", a: opts.map(String) };
  }, "加法闪电战");

  drillGame("subfast", "减法闪电战", "➖", "快速做减法", () => {
    const a = 10 + Math.floor(Math.random() * 40), b = 2 + Math.floor(Math.random() * (a - 1));
    const r = a - b;
    return { q: a + " − " + b + " = ?", a: [r, r + 1, r - 2, r + 9].map(String) };
  }, "减法闪电战");

  drillGame("mulfast", "乘法口诀", "✖️", "九九乘法快速反应", () => {
    const a = 2 + Math.floor(Math.random() * 8), b = 2 + Math.floor(Math.random() * 8);
    const r = a * b;
    return { q: a + " × " + b + " = ?", a: [r, r + a, r - b, r + 1].map(String) };
  }, "乘法口诀");

  drillGame("divfast", "除法速算", "➗", "整除范围内的除法", () => {
    const b = 2 + Math.floor(Math.random() * 8), r = 2 + Math.floor(Math.random() * 9);
    const a = b * r;
    return { q: a + " ÷ " + b + " = ?", a: [r, r + 1, r - 1, r + 2].map(String) };
  }, "除法速算");

  drillGame("mixedmath", "四则混合", "🧮", "加减乘混合运算", () => {
    const a = 2 + Math.floor(Math.random() * 12), b = 2 + Math.floor(Math.random() * 9), c = 2 + Math.floor(Math.random() * 15);
    const r = a * b + c;
    return { q: a + " × " + b + " + " + c + " = ?", a: [r, r + b, r - c, r + 10].map(String), sub: "先乘后加" };
  }, "四则混合");

  drillGame("percentquiz", "百分比心算", "％", "生活里的百分比计算", () => {
    const pct = [10, 20, 25, 50, 75][Math.floor(Math.random() * 5)];
    const base = [40, 60, 80, 120, 200, 240][Math.floor(Math.random() * 6)];
    const r = base * pct / 100;
    return { q: base + " 的 " + pct + "% 是？", a: [r, r + base / 10, r - 2, r * 2].map((v) => String(v)), sub: "百分数 = 分母 100" };
  }, "百分比心算");

  drillGame("squarequiz", "平方速算", "²", "11 到 25 的平方", () => {
    const n = 11 + Math.floor(Math.random() * 15);
    const r = n * n;
    return { q: n + "² = ?", a: [r, r + n, r - n, r + 10].map(String) };
  }, "平方速算");

  drillGame("fracquiz", "分数化简", "½", "把分数化成最简形式", () => {
    const base = ["1/2", "1/3", "2/3", "3/4", "2/5", "3/5", "5/6", "7/8"][Math.floor(Math.random() * 8)];
    const k = 2 + Math.floor(Math.random() * 4);
    const [p, q] = base.split("/").map(Number);
    const opts = [base, (p * k + 1) + "/" + (q * k), p + "/" + (q * k), (p * k) + "/" + (q * k + 1)];
    return { q: (p * k) + "/" + (q * k) + " 化简为？", a: opts };
  }, "分数化简");

  drillGame("estquiz", "估算达人", "📐", "快速估算乘积", () => {
    const a = 90 + Math.floor(Math.random() * 900), b = 2 + Math.floor(Math.random() * 18);
    const r = Math.round(a / 10) * 10 * b;
    return { q: a + " × " + b + " ≈ ?", a: [r, r * 2, r + 1000, Math.round(r / 10)].map(String), sub: "先把数字凑整再乘" };
  }, "估算达人");

  /* ================= 25-29 专项脑力 ================= */

  /* 数字规律 */
  GB.add({
    id: "nextnum", name: "数字规律", cat: "brain", icon: "🔢", tags: ["new"],
    desc: "找出数列规律并选出下一项", tip: "先看差值或倍数", w: 480, h: 560,
    colors: ["#232a4a", "#0a0d18"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let seq, ans, labels, score, streak, lock, wait, made;
      function make() {
        const type = Math.floor(Math.random() * 4);
        let arr = [];
        if (type === 0) {
          const a = 2 + Math.floor(Math.random() * 8), d = 2 + Math.floor(Math.random() * 8);
          for (let i = 0; i < 5; i++) arr.push(a + d * i);
        } else if (type === 1) {
          const a = 2 + Math.floor(Math.random() * 4), r = 2 + Math.floor(Math.random() * 2);
          for (let i = 0; i < 5; i++) arr.push(a * Math.pow(r, i));
        } else if (type === 2) {
          const s = 2 + Math.floor(Math.random() * 6);
          for (let i = 0; i < 5; i++) arr.push((s + i) * (s + i));
        } else {
          let a = 1 + Math.floor(Math.random() * 3), b = a + 1 + Math.floor(Math.random() * 3);
          arr = [a, b];
          while (arr.length < 5) arr.push(arr[arr.length - 1] + arr[arr.length - 2]);
        }
        ans = arr.pop();
        seq = arr;
        const opts = [ans, ans + 2, ans - 3, ans + Math.max(4, Math.round(ans * .2))];
        labels = api.shuffle(opts.filter((v, i, s) => s.indexOf(v) === i).map(String));
        if (labels.length < 4) labels.push(String(ans + 7));
        lock = 0; wait = 0;
      }
      score = 0; streak = 0; made = 0; make();
      api.setScore(0);
      api.onDown((p) => {
        if (lock) return;
        for (let i = 0; i < labels.length; i++) {
          const x = 40 + (i % 2) * 210, y = 330 + Math.floor(i / 2) * 66;
          if (hit(p, x, y, 190, 56)) {
            if (+labels[i] === ans) { streak++; score += 100 + streak * 15; api.setScore(score); lock = 1; api.beep(760, .07, "sine", .05); }
            else { streak = 0; lock = 2; api.beep(180, .12, "square", .05); }
            wait = .5; return;
          }
        }
      });
      api.loop((dt) => {
        if (wait > 0) {
          wait -= dt;
          if (wait <= 0) {
            made++;
            if (made >= 10) { api.over("规律全解", "得分 " + score, true); return; }
            make();
          }
        }
        api.clear("#0a0d18");
        api.text("数字规律 · 第 " + (made + 1) + "/10 题", W / 2, 34, { size: 12, weight: 700, color: "#93a4ff" });
        api.text(seq.join("  ,  ") + "  ,  ?", W / 2, 170, { size: 28, weight: 800, color: "#eef1f8" });
        labels.forEach((opt, i) => {
          const x = 40 + (i % 2) * 210, y = 330 + Math.floor(i / 2) * 66;
          api.rr(x, y, 190, 56, 13);
          ctx.fillStyle = lock && +opt === ans ? "rgba(52,211,153,.3)" : "rgba(255,255,255,.06)";
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.stroke();
          api.text(opt, x + 95, y + 28, { size: 21, weight: 800 });
        });
      });
    }
  });

  /* 认钟表 */
  GB.add({
    id: "clockread", name: "认钟表", cat: "brain", icon: "🕐", tags: ["new"],
    desc: "看指针读出正确时间", tip: "注意短针是小时", w: 480, h: 560,
    colors: ["#223349", "#080e16"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h, cx = W / 2, cy = 210, R = 108;
      let hh, mm, labels, ansIdx, score, made, lock, wait;
      score = 0; made = 0; lock = 0; wait = 0;
      function make() {
        hh = 1 + Math.floor(Math.random() * 12);
        mm = Math.floor(Math.random() * 12) * 5;
        ansIdx = Math.floor(Math.random() * 4);
        labels = [];
        for (let i = 0; i < 4; i++) {
          if (i === ansIdx) labels.push(hh + ":" + String(mm).padStart(2, "0"));
          else {
            const dh = (hh + (Math.random() < .5 ? 1 : 11)) % 12 || 12;
            const dm = (mm + 5 * (1 + Math.floor(Math.random() * 3))) % 60;
            labels.push(dh + ":" + String(dm).padStart(2, "0"));
          }
        }
      }
      make();
      api.onDown((p) => {
        if (lock) return;
        for (let i = 0; i < 4; i++) {
          const x = 40 + (i % 2) * 210, y = 380 + Math.floor(i / 2) * 62;
          if (hit(p, x, y, 190, 52)) {
            if (i === ansIdx) { score += 100; api.setScore(score); lock = 1; api.beep(780, .07, "sine", .05); }
            else { lock = 2; api.beep(180, .12, "square", .05); }
            wait = .55; return;
          }
        }
      });
      api.loop((dt) => {
        if (wait > 0) {
          wait -= dt;
          if (wait <= 0) {
            made++;
            if (made >= 10) { api.over("时间全对", "得分 " + score, true); return; }
            lock = 0; make();
          }
        }
        api.clear("#080e16");
        api.text("认钟表 · 第 " + (made + 1) + "/10 题", W / 2, 32, { size: 12, weight: 700, color: "#7dd3e8" });
        ctx.fillStyle = "#0f2230";
        ctx.beginPath(); ctx.arc(cx, cy, R + 12, 0, 7); ctx.fill();
        ctx.strokeStyle = "rgba(34,211,238,.4)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, R + 6, 0, 7); ctx.stroke(); ctx.lineWidth = 1;
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * Math.PI * 2 - Math.PI / 2;
          const x1 = cx + Math.cos(a) * (R - 6), y1 = cy + Math.sin(a) * (R - 6);
          const x2 = cx + Math.cos(a) * R, y2 = cy + Math.sin(a) * R;
          ctx.strokeStyle = i % 3 === 0 ? "#7dd3e8" : "rgba(125,211,232,.35)";
          ctx.lineWidth = i % 3 === 0 ? 3 : 1.4;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
        ctx.lineWidth = 1;
        for (let i = 1; i <= 12; i++) {
          const a = i / 12 * Math.PI * 2 - Math.PI / 2;
          api.text(String(i), cx + Math.cos(a) * (R - 26), cy + Math.sin(a) * (R - 26), { size: 13, weight: 700, color: "#8fb8ef" });
        }
        const ha = ((hh % 12) + mm / 60) / 12 * Math.PI * 2 - Math.PI / 2;
        const ma = mm / 60 * Math.PI * 2 - Math.PI / 2;
        ctx.strokeStyle = "#eef1f8"; ctx.lineCap = "round";
        ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ha) * (R * .5), cy + Math.sin(ha) * (R * .5)); ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = "#22d3ee";
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ma) * (R * .78), cy + Math.sin(ma) * (R * .78)); ctx.stroke();
        ctx.fillStyle = "#7c5cff";
        ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 7); ctx.fill();
        ctx.lineCap = "butt"; ctx.lineWidth = 1;
        labels.forEach((opt, i) => {
          const x = 40 + (i % 2) * 210, y = 380 + Math.floor(i / 2) * 62;
          api.rr(x, y, 190, 52, 12);
          ctx.fillStyle = lock === 1 && i === ansIdx ? "rgba(52,211,153,.3)" : "rgba(255,255,255,.06)";
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.stroke();
          api.text(opt, x + 95, y + 26, { size: 19, weight: 700 });
        });
      });
    }
  });

  /* 解方程 */
  GB.add({
    id: "equation", name: "解方程", cat: "brain", icon: "🧾", tags: ["new"],
    desc: "心算一元一次方程的解", tip: "先移项，再除以系数", w: 480, h: 560,
    colors: ["#2a2440", "#0c0a16"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let q, ans, labels, score, made, lock, wait;
      score = 0; made = 0; lock = 0; wait = 0;
      function make() {
        const a = 2 + Math.floor(Math.random() * 8), x = 1 + Math.floor(Math.random() * 12), b = Math.floor(Math.random() * 20);
        const c = a * x + b;
        q = a + "x + " + b + " = " + c;
        ans = x;
        labels = api.shuffle([x, x + 1, x - 1, x + 2].map(String));
        lock = 0;
      }
      make();
      api.onDown((p) => {
        if (lock) return;
        for (let i = 0; i < 4; i++) {
          const x = 40 + (i % 2) * 210, y = 320 + Math.floor(i / 2) * 66;
          if (hit(p, x, y, 190, 56)) {
            if (+labels[i] === ans) { score += 100; api.setScore(score); lock = 1; api.beep(780, .07, "sine", .05); }
            else { lock = 2; api.beep(180, .12, "square", .05); }
            wait = .5; return;
          }
        }
      });
      api.loop((dt) => {
        if (wait > 0) {
          wait -= dt;
          if (wait <= 0) {
            made++;
            if (made >= 10) { api.over("方程通关", "得分 " + score, true); return; }
            make();
          }
        }
        api.clear("#0c0a16");
        api.text("解方程 · 第 " + (made + 1) + "/10 题", W / 2, 34, { size: 12, weight: 700, color: "#c4b5fd" });
        api.text(q, W / 2, 170, { size: 36, weight: 800, color: "#eef1f8" });
        api.text("求 x 的值", W / 2, 214, { size: 12, color: "#5f6a80" });
        labels.forEach((opt, i) => {
          const x = 40 + (i % 2) * 210, y = 320 + Math.floor(i / 2) * 66;
          api.rr(x, y, 190, 56, 13);
          ctx.fillStyle = lock === 1 && +opt === ans ? "rgba(52,211,153,.3)" : "rgba(255,255,255,.06)";
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.stroke();
          api.text("x = " + opt, x + 95, y + 28, { size: 21, weight: 800 });
        });
      });
    }
  });

  /* 大数比拼 */
  GB.add({
    id: "bignum", name: "大数比拼", cat: "brain", icon: "⚖️", tags: ["new"],
    desc: "心算两组算式，选出更大的", tip: "先估算再细算", w: 480, h: 520,
    colors: ["#1f3a3a", "#08120f"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let A, B, va, vb, labels, ansIdx, score, made, lock, wait;
      score = 0; made = 0; lock = 0; wait = 0;
      function make() {
        const p = 12 + Math.floor(Math.random() * 60), q2 = 3 + Math.floor(Math.random() * 9);
        const r = 12 + Math.floor(Math.random() * 60), s = 3 + Math.floor(Math.random() * 9);
        va = p * q2;
        vb = (r * s === va) ? va + 1 : r * s;
        A = p + " × " + q2;
        B = r + " × " + s;
        ansIdx = va > vb ? 0 : va < vb ? 1 : 2;
        labels = ["A 更大", "B 更大", "一样大"];
        lock = 0;
      }
      make();
      api.onDown((p) => {
        if (lock) return;
        for (let i = 0; i < 3; i++) {
          const x = 40 + i * 138, y = 340;
          if (hit(p, x, y, 124, 56)) {
            if (i === ansIdx) { score += 100; api.setScore(score); lock = 1; api.beep(780, .07, "sine", .05); }
            else { lock = 2; api.beep(180, .12, "square", .05); }
            wait = .55; return;
          }
        }
      });
      api.loop((dt) => {
        if (wait > 0) {
          wait -= dt;
          if (wait <= 0) {
            made++;
            if (made >= 10) { api.over("算得真快", "得分 " + score, true); return; }
            make();
          }
        }
        api.clear("#08120f");
        api.text("大数比拼 · 第 " + (made + 1) + "/10 题", W / 2, 32, { size: 12, weight: 700, color: "#6ee7b7" });
        api.rr(40, 120, 180, 150, 16);
        ctx.fillStyle = "rgba(34,211,238,.1)"; ctx.fill();
        api.text("A", 130, 152, { size: 13, weight: 800, color: "#7dd3e8" });
        api.text(A, 130, 206, { size: 24, weight: 800 });
        api.rr(260, 120, 180, 150, 16);
        ctx.fillStyle = "rgba(251,191,36,.1)"; ctx.fill();
        api.text("B", 350, 152, { size: 13, weight: 800, color: "#fbbf24" });
        api.text(B, 350, 206, { size: 24, weight: 800 });
        labels.forEach((lab, i) => {
          const x = 40 + i * 138, y = 340;
          api.rr(x, y, 124, 56, 12);
          let bg = "rgba(255,255,255,.06)";
          if (lock && i === ansIdx) bg = "rgba(52,211,153,.3)";
          ctx.fillStyle = bg; ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.stroke();
          api.text(lab, x + 62, y + 28, { size: 14, weight: 700 });
        });
      });
    }
  });

  /* 数方块 */
  GB.add({
    id: "countblocks", name: "数方块", cat: "brain", icon: "🧊", tags: ["new"],
    desc: "数出图中一共有多少个小方块", tip: "别忘了被挡住的下层", w: 480, h: 520,
    colors: ["#2c2a44", "#0a0913"],
    init(api) {
      const ctx = api.ctx, W = api.w, H = api.h;
      let cols, ans, labels, score, made, lock, wait, t0;
      score = 0; made = 0; lock = 0; wait = 0; t0 = 0;
      const S = 34;
      function make() {
        const n = 3 + Math.floor(Math.random() * 2);
        cols = [];
        for (let i = 0; i < n; i++) cols.push(1 + Math.floor(Math.random() * 4));
        ans = cols.reduce((a, b) => a + b, 0);
        const opts = [ans, ans + 1, ans - 1, ans + 2];
        labels = api.shuffle(opts.filter((v, i, s) => s.indexOf(v) === i && v > 0).map(String));
        while (labels.length < 4) labels.push(String(ans + labels.length));
        lock = 0;
      }
      make();
      api.onDown((p) => {
        if (lock) return;
        for (let i = 0; i < 4; i++) {
          const x = 40 + (i % 2) * 210, y = 360 + Math.floor(i / 2) * 62;
          if (hit(p, x, y, 190, 52)) {
            if (+labels[i] === ans) { score += 100; api.setScore(score); lock = 1; api.beep(780, .07, "sine", .05); }
            else { lock = 2; api.beep(180, .12, "square", .05); }
            wait = .55; return;
          }
        }
      });
      api.loop((dt) => {
        if (wait > 0) {
          wait -= dt;
          if (wait <= 0) {
            made++;
            if (made >= 10) { api.over("数得真准", "得分 " + score, true); return; }
            make();
          }
        }
        api.clear("#0a0913");
        api.text("数方块 · 第 " + (made + 1) + "/10 题", W / 2, 32, { size: 12, weight: 700, color: "#a99cf0" });
        const baseX = W / 2 - cols.length * S * .5, baseY = 300;
        cols.forEach((h, i) => {
          const x = baseX + i * S, y0 = baseY;
          for (let k = 0; k < h; k++) {
            const y = y0 - k * S;
            ctx.fillStyle = "hsl(" + (255 - k * 12) + ",55%," + (48 - k * 4) + "%)";
            ctx.fillRect(x, y - S, S - 2, S - 2);
            ctx.fillStyle = "hsl(" + (255 - k * 12) + ",55%," + (62 - k * 4) + "%)";
            ctx.beginPath(); ctx.moveTo(x, y - S); ctx.lineTo(x + 8, y - S - 8); ctx.lineTo(x + S + 6, y - S - 8); ctx.lineTo(x + S - 2, y - S); ctx.closePath(); ctx.fill();
            ctx.fillStyle = "hsl(" + (255 - k * 12) + ",45%," + (34 - k * 3) + "%)";
            ctx.beginPath(); ctx.moveTo(x + S - 2, y - S); ctx.lineTo(x + S + 6, y - S - 8); ctx.lineTo(x + S + 6, y - 8); ctx.lineTo(x + S - 2, y - 2); ctx.closePath(); ctx.fill();
          }
        });
        labels.forEach((opt, i) => {
          const x = 40 + (i % 2) * 210, y = 360 + Math.floor(i / 2) * 62;
          api.rr(x, y, 190, 52, 12);
          ctx.fillStyle = lock && +opt === ans ? "rgba(52,211,153,.3)" : "rgba(255,255,255,.06)";
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.stroke();
          api.text(opt + " 个", x + 95, y + 26, { size: 18, weight: 700 });
        });
      });
    }
  });
})();
