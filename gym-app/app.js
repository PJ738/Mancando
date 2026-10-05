(function () {
  'use strict';

  var KEY = 'pjplan.v1';
  var DEFAULTS = { logs: {}, body: [], settings: { height: 174, startWeight: 94, goalWeight: 69 } };

  // ---------- helpers ----------
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { var p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function todayStr() { return fmt(new Date()); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function parseNum(v) {
    if (v === null || v === undefined) return null;
    var t = String(v).replace(',', '.').trim();
    if (t === '') return null;
    var n = parseFloat(t);
    return isFinite(n) ? n : null;
  }
  function $(sel) { return document.querySelector(sel); }
  function thaiDate(ds) {
    var d = parse(ds);
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + (d.getFullYear() + 543);
  }

  // ---------- state ----------
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULTS);
      var s = JSON.parse(raw);
      var out = Object.assign(clone(DEFAULTS), s);
      out.settings = Object.assign({}, DEFAULTS.settings, s.settings || {});
      if (!out.logs || typeof out.logs !== 'object') out.logs = {};
      if (!Array.isArray(out.body)) out.body = [];
      return out;
    } catch (e) {
      return clone(DEFAULTS);
    }
  }
  var state = load();
  var view = { tab: 'today', date: todayStr(), follow: true };

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      toast('บันทึกไม่สำเร็จ พื้นที่เก็บข้อมูลอาจเต็มหรือถูกปิด');
    }
  }
  function getLog(date) { return state.logs[date] || { sets: {}, weights: {}, meals: {}, checks: {} }; }
  function ensureLog(date) {
    var l = state.logs[date];
    if (!l) l = state.logs[date] = {};
    l.sets = l.sets || {};
    l.weights = l.weights || {};
    l.meals = l.meals || {};
    l.checks = l.checks || {};
    return l;
  }
  function hasActivity(date) {
    var l = state.logs[date];
    if (!l) return false;
    var any = function (o) { return Object.keys(o || {}).some(function (k) { return o[k]; }); };
    var sets = Object.keys(l.sets || {}).some(function (k) { return (l.sets[k] || []).some(Boolean); });
    return sets || any(l.meals) || any(l.checks);
  }
  function lastWeight(exId, beforeDate) {
    var dates = Object.keys(state.logs).filter(function (d) {
      return d < beforeDate && state.logs[d].weights && state.logs[d].weights[exId] != null;
    }).sort();
    return dates.length ? state.logs[dates[dates.length - 1]].weights[exId] : null;
  }
  function weekOf(ds) {
    var d = parse(ds);
    var dow = (d.getDay() + 6) % 7; // Monday = 0
    var out = [];
    for (var i = 0; i < 7; i++) out.push(fmt(addDays(d, i - dow)));
    return out;
  }

  // ---------- toast ----------
  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  // ---------- views ----------
  function renderToday() {
    var date = view.date, d = parse(date), dow = d.getDay();
    var log = getLog(date);
    var prog = PROGRAMS[dow];
    var isToday = date === todayStr();
    var total = 0, done = 0;
    var h = '';

    // week strip
    var week = weekOf(date);
    h += '<div class="weekbar"><button class="icon" data-act="week" data-dir="-1" aria-label="สัปดาห์ก่อน">‹</button><div class="chips">';
    week.forEach(function (ds) {
      var pd = parse(ds);
      h += '<button class="chip' + (ds === date ? ' sel' : '') + (ds === todayStr() ? ' today' : '') +
        '" data-act="pick" data-date="' + ds + '"><span>' + DAY_SHORT[pd.getDay()] + '</span><b>' + pd.getDate() +
        '</b><i class="dot' + (hasActivity(ds) ? ' on' : '') + '"></i></button>';
    });
    h += '</div><button class="icon" data-act="week" data-dir="1" aria-label="สัปดาห์ถัดไป">›</button></div>';

    var focus = prog ? prog.focus : REST_DAY.focus;
    var sub = prog ? prog.sub : REST_DAY.sub;
    h += '<header class="dayhead"><div><h1>' + DAY_NAMES[dow] + ' ' + thaiDate(date) + '</h1>' +
      '<p class="sub"><b>' + esc(focus) + '</b> · ' + esc(sub) + '</p></div>' +
      (isToday ? '<span class="badge">วันนี้</span>' : '<button class="btn small" data-act="today">กลับวันนี้</button>') +
      '</header>';

    var body = '';
    if (prog) {
      var wd = (log.checks && log.checks[WARMUP.id]) ? 1 : 0;
      total += 1; done += wd;
      body += '<button class="check' + (wd ? ' done' : '') + '" data-act="check" data-id="' + WARMUP.id + '">' +
        '<span class="box"></span><span class="ctext"><b>' + esc(WARMUP.title) + '</b><small>' + esc(WARMUP.detail) + '</small></span></button>';
      prog.exercises.forEach(function (ex) {
        var sets = log.sets[ex.id] || [];
        var w = log.weights[ex.id];
        var last = lastWeight(ex.id, date);
        var cnt = 0;
        var btns = '';
        for (var i = 0; i < ex.sets; i++) {
          if (sets[i]) cnt++;
          btns += '<button class="setbtn' + (sets[i] ? ' done' : '') + '" data-act="set" data-ex="' + ex.id +
            '" data-i="' + i + '" aria-label="เซ็ต ' + (i + 1) + '">' + (i + 1) + '</button>';
        }
        total += ex.sets; done += cnt;
        body += '<div class="card ex"><div class="ex-head"><div><div class="ex-name">' + esc(ex.name) + '</div>' +
          '<div class="ex-meta">' + ex.sets + ' เซ็ต × ' + esc(ex.reps) + '</div></div>';
        if (!ex.noWeight) {
          body += '<label class="wt"><input type="number" inputmode="decimal" step="0.5" min="0" data-weight="' + ex.id +
            '" value="' + (w != null ? w : '') + '" placeholder="' + (last != null ? last : '–') + '"><span>กก.</span></label>';
        }
        body += '</div><div class="sets">' + btns + '</div>';
        if (!ex.noWeight && w == null && last != null) body += '<div class="hint">ครั้งก่อน ' + last + ' กก.</div>';
        body += '</div>';
      });
      h += '<div class="banner">' + esc(SLEEP_NOTE) + ' · เทรน ~' + prog.minutes + ' นาที</div>';
    } else {
      REST_DAY.checks.forEach(function (c) {
        var on = !!(log.checks && log.checks[c.id]);
        total += 1; if (on) done += 1;
        body += '<button class="check' + (on ? ' done' : '') + '" data-act="check" data-id="' + c.id + '">' +
          '<span class="box"></span><span class="ctext"><b>' + esc(c.title) + '</b>' +
          (c.detail ? '<small>' + esc(c.detail) + '</small>' : '') + '</span></button>';
      });
    }

    var pct = total ? Math.round(done * 100 / total) : 0;
    h += '<div class="progress"><div class="bar"><i style="width:' + pct + '%"></i></div><span>' +
      (prog ? done + '/' + total + ' (เซ็ตและ warm-up)' : done + '/' + total + ' รายการ') + '</span></div>';

    h += '<h2>' + (prog ? 'โปรแกรมเวท' : 'กิจกรรมวันพัก') + '</h2>' + body;
    if (prog) h += '<p class="note">' + esc(TRAIN_NOTE) + '</p>';

    // meals
    var meals = prog ? MEALS_TRAIN : MEALS_REST;
    var mDone = 0;
    h += '<h2>อาหารวันนี้</h2><div class="targets">';
    TARGETS.forEach(function (t) { h += '<div><small>' + esc(t.label) + '</small><b>' + esc(t.value) + '</b></div>'; });
    h += '</div>';
    meals.forEach(function (m) {
      var on = !!(log.meals && log.meals[m.id]);
      if (on) mDone++;
      h += '<button class="check' + (on ? ' done' : '') + '" data-act="meal" data-id="' + m.id + '">' +
        '<span class="box"></span><span class="ctext"><b>' + (m.time ? esc(m.time) + ' · ' : '') + esc(m.title) +
        '</b><small>' + esc(m.detail) + '</small></span></button>';
    });
    h += '<p class="note">กินแล้ว ' + mDone + '/' + meals.length + ' มื้อ · มีนัดกินกับลูกค้า ดูกฎ 5 ข้อได้ในแท็บ "ข้อมูล"</p>';

    // sleep + note
    h += '<h2>บันทึกประจำวัน</h2><div class="card"><label class="field"><span>นอนเมื่อคืน (ชม.)</span>' +
      '<input type="number" inputmode="decimal" step="0.5" min="0" max="16" data-field="sleep" value="' +
      (log.sleep != null ? log.sleep : '') + '" placeholder="7.5"></label>' +
      '<label class="field"><span>โน้ต</span><textarea rows="2" data-field="note" placeholder="เช่น นอนดึกเพราะเลี้ยงลูกค้า เข่าเจ็บเล็กน้อย">' +
      esc(log.note || '') + '</textarea></label></div>';
    return h;
  }

  function renderBody() {
    var s = state.settings;
    var entries = state.body.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    var withW = entries.filter(function (e) { return e.weight != null; });
    var latest = withW.length ? withW[0].weight : null;
    var cur = latest != null ? latest : s.startWeight;
    var bmi = cur / Math.pow(s.height / 100, 2);
    var change = cur - s.startWeight;
    var toGoal = Math.max(0, cur - s.goalWeight);
    var span = s.startWeight - s.goalWeight;
    var pct = span > 0 ? Math.max(0, Math.min(100, Math.round((s.startWeight - cur) * 100 / span))) : 0;

    var h = '<header class="dayhead"><div><h1>น้ำหนักและรอบเอว</h1><p class="sub">เป้าหมาย ' + s.goalWeight + ' กก. (เริ่มที่ ' + s.startWeight + ' กก.)</p></div></header>';
    h += '<div class="tiles">' +
      '<div class="tile"><small>' + (latest != null ? 'ล่าสุด' : 'ค่าเริ่มต้น') + '</small><b>' + cur.toFixed(1) + '</b><em>กก.</em></div>' +
      '<div class="tile"><small>เปลี่ยนจากเริ่มต้น</small><b>' + (change > 0 ? '+' : '') + change.toFixed(1) + '</b><em>กก.</em></div>' +
      '<div class="tile"><small>BMI</small><b>' + bmi.toFixed(1) + '</b><em>เกณฑ์เอเชีย 18.5-22.9</em></div>' +
      '<div class="tile"><small>เหลือถึงเป้า</small><b>' + toGoal.toFixed(1) + '</b><em>กก.</em></div></div>';
    h += '<div class="progress"><div class="bar"><i style="width:' + pct + '%"></i></div><span>ถึงเป้าแล้ว ' + pct + '%</span></div>';

    h += '<h2>บันทึกใหม่</h2><div class="card"><div class="row2">' +
      '<label class="field"><span>วันที่</span><input type="date" id="b-date" value="' + todayStr() + '"></label>' +
      '<label class="field"><span>น้ำหนัก (กก.)</span><input type="number" inputmode="decimal" step="0.1" id="b-weight" placeholder="' + cur.toFixed(1) + '"></label>' +
      '<label class="field"><span>รอบเอว (ซม.)</span><input type="number" inputmode="decimal" step="0.1" id="b-waist" placeholder="เช่น 98"></label>' +
      '</div><button class="btn primary" data-act="body-save">บันทึก</button>' +
      '<p class="note">ชั่งตอนเช้า หลังเข้าห้องน้ำ ก่อนกินอะไร ดูแนวโน้มรายสัปดาห์ ไม่ต้องดูเลขรายวัน</p></div>';

    h += '<h2>ประวัติ</h2>';
    if (!entries.length) {
      h += '<p class="note">ยังไม่มีบันทึก</p>';
    } else {
      h += '<div class="card list">';
      entries.forEach(function (e) {
        h += '<div class="li"><div><b>' + thaiDate(e.date) + '</b></div><div class="li-vals">' +
          (e.weight != null ? e.weight.toFixed(1) + ' กก.' : '-') + ' · ' +
          (e.waist != null ? e.waist.toFixed(1) + ' ซม.' : '-') +
          '</div><button class="icon sm" data-act="body-del" data-date="' + e.date + '" aria-label="ลบ">✕</button></div>';
      });
      h += '</div>';
    }
    return h;
  }

  function renderMore() {
    var s = state.settings;
    var h = '<header class="dayhead"><div><h1>ข้อมูล</h1><p class="sub">ตั้งค่า สำรองข้อมูล และคำแนะนำ</p></div></header>';

    h += '<h2>คำแนะนำ</h2>';
    TIPS.forEach(function (t) {
      h += '<details class="card tip"><summary>' + esc(t.title) + '</summary><ul>';
      t.items.forEach(function (i) { h += '<li>' + esc(i) + '</li>'; });
      h += '</ul></details>';
    });

    h += '<h2>ตั้งค่า</h2><div class="card"><div class="row2">' +
      '<label class="field"><span>ส่วนสูง (ซม.)</span><input type="number" inputmode="decimal" data-setting="height" value="' + s.height + '"></label>' +
      '<label class="field"><span>น้ำหนักเริ่มต้น (กก.)</span><input type="number" inputmode="decimal" data-setting="startWeight" value="' + s.startWeight + '"></label>' +
      '<label class="field"><span>น้ำหนักเป้าหมาย (กก.)</span><input type="number" inputmode="decimal" data-setting="goalWeight" value="' + s.goalWeight + '"></label>' +
      '</div></div>';

    h += '<h2>สำรองและกู้ข้อมูล</h2><div class="card"><p class="note">ข้อมูลเก็บอยู่ในเครื่องนี้เท่านั้น ควรสำรองเป็นระยะ' +
      (state.lastBackup ? ' (สำรองล่าสุด ' + thaiDate(state.lastBackup) + ')' : ' (ยังไม่เคยสำรอง)') + '</p>' +
      '<div class="btnrow"><button class="btn" data-act="copy">คัดลอกข้อมูล</button><button class="btn" data-act="share">แชร์เป็นไฟล์</button></div>' +
      '<textarea id="backup-text" class="mono hidden" rows="4" readonly></textarea>' +
      '<label class="field"><span>วางข้อมูลสำรองเพื่อกู้คืน</span><textarea id="restore-text" class="mono" rows="3" placeholder="วางข้อความที่คัดลอกไว้ที่นี่"></textarea></label>' +
      '<div class="btnrow"><button class="btn" data-act="restore">กู้คืนข้อมูล</button><button class="btn danger" data-act="reset">ลบข้อมูลทั้งหมด</button></div></div>';
    h += '<p class="note center">The Man Can Do · เฟส 1</p>';
    return h;
  }

  function render(resetScroll) {
    var y = resetScroll ? 0 : window.scrollY;
    var body = view.tab === 'today' ? renderToday() : view.tab === 'body' ? renderBody() : renderMore();
    var tabs = [['today', 'วันนี้', '🏋️'], ['body', 'น้ำหนัก', '⚖️'], ['more', 'ข้อมูล', '☰']];
    var nav = tabs.map(function (t) {
      return '<button class="tab' + (view.tab === t[0] ? ' sel' : '') + '" data-act="tab" data-tab="' + t[0] + '"><i>' + t[2] + '</i><span>' + t[1] + '</span></button>';
    }).join('');
    $('#app').innerHTML = '<main class="wrap">' + body + '</main><nav class="tabbar">' + nav + '</nav>';
    window.scrollTo(0, y);
  }

  function setDate(ds) {
    view.date = ds;
    view.follow = ds === todayStr();
    render(true);
  }

  // ---------- actions ----------
  function saveBody() {
    var date = $('#b-date').value || todayStr();
    var w = parseNum($('#b-weight').value);
    var c = parseNum($('#b-waist').value);
    if (w == null && c == null) { toast('กรอกน้ำหนักหรือรอบเอวอย่างน้อยหนึ่งช่อง'); return; }
    if (w != null && (w < 30 || w > 250)) { toast('น้ำหนักไม่อยู่ในช่วงที่เป็นไปได้'); return; }
    if (c != null && (c < 40 || c > 200)) { toast('รอบเอวไม่อยู่ในช่วงที่เป็นไปได้'); return; }
    var e = state.body.filter(function (x) { return x.date === date; })[0];
    if (!e) { e = { date: date }; state.body.push(e); }
    if (w != null) e.weight = w;
    if (c != null) e.waist = c;
    save();
    render(false);
    toast('บันทึกแล้ว');
  }

  function exportText() {
    return JSON.stringify({ app: 'pjplan', version: 1, exportedAt: new Date().toISOString(), data: state });
  }
  function markBackup() { state.lastBackup = todayStr(); save(); }

  function copyBackup() {
    var text = exportText();
    var showFallback = function () {
      var ta = $('#backup-text');
      ta.value = text;
      ta.classList.remove('hidden');
      ta.focus();
      ta.select();
      toast('คัดลอกอัตโนมัติไม่ได้ กดค้างที่ช่องแล้วเลือกคัดลอก');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { markBackup(); render(false); toast('คัดลอกแล้ว นำไปวางเก็บไว้ในโน้ตหรืออีเมล'); }, showFallback);
    } else {
      showFallback();
    }
  }

  function shareBackup() {
    var text = exportText();
    try {
      var file = new File([text], 'pjplan-backup-' + todayStr() + '.json', { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'The Man Can Do backup' }).then(function () { markBackup(); render(false); }, function () {});
        return;
      }
    } catch (e) { /* fall through */ }
    copyBackup();
  }

  function restore() {
    var t = $('#restore-text').value.trim();
    if (!t) { toast('วางข้อมูลสำรองก่อน'); return; }
    var o;
    try { o = JSON.parse(t); } catch (e) { toast('ข้อมูลไม่ถูกต้อง'); return; }
    var data = o && o.data ? o.data : o;
    if (!data || typeof data.logs !== 'object' || !Array.isArray(data.body)) { toast('รูปแบบข้อมูลไม่ถูกต้อง'); return; }
    if (!confirm('แทนที่ข้อมูลปัจจุบันทั้งหมดด้วยข้อมูลสำรองนี้?')) return;
    var next = Object.assign(clone(DEFAULTS), data);
    next.settings = Object.assign({}, DEFAULTS.settings, data.settings || {});
    state = next;
    save();
    render(true);
    toast('กู้ข้อมูลแล้ว');
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var act = el.dataset.act;
    var log;
    switch (act) {
      case 'tab': view.tab = el.dataset.tab; render(true); break;
      case 'pick': setDate(el.dataset.date); break;
      case 'today': setDate(todayStr()); break;
      case 'week': setDate(fmt(addDays(parse(view.date), 7 * Number(el.dataset.dir)))); break;
      case 'set':
        log = ensureLog(view.date);
        var arr = log.sets[el.dataset.ex] || (log.sets[el.dataset.ex] = []);
        var i = Number(el.dataset.i);
        for (var k = 0; k < i; k++) if (arr[k] === undefined || arr[k] === null) arr[k] = false;
        arr[i] = !arr[i];
        save(); render(false);
        break;
      case 'meal':
        log = ensureLog(view.date);
        log.meals[el.dataset.id] = !log.meals[el.dataset.id];
        save(); render(false);
        break;
      case 'check':
        log = ensureLog(view.date);
        log.checks[el.dataset.id] = !log.checks[el.dataset.id];
        save(); render(false);
        break;
      case 'body-save': saveBody(); break;
      case 'body-del':
        if (confirm('ลบบันทึกของวันที่ ' + thaiDate(el.dataset.date) + '?')) {
          state.body = state.body.filter(function (x) { return x.date !== el.dataset.date; });
          save(); render(false);
        }
        break;
      case 'copy': copyBackup(); break;
      case 'share': shareBackup(); break;
      case 'restore': restore(); break;
      case 'reset':
        if (confirm('ลบข้อมูลทั้งหมด (บันทึกเวท น้ำหนัก ตั้งค่า)? ย้อนกลับไม่ได้') &&
            confirm('ยืนยันอีกครั้ง: ลบทั้งหมดจริงๆ?')) {
          state = clone(DEFAULTS); save(); render(true); toast('ลบข้อมูลแล้ว');
        }
        break;
    }
  });

  // typing in inputs: save without re-rendering (keeps keyboard focus)
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.dataset.weight) {
      var log = ensureLog(view.date);
      var v = parseNum(t.value);
      if (v == null) delete log.weights[t.dataset.weight]; else log.weights[t.dataset.weight] = v;
      save();
    } else if (t.dataset.field === 'sleep') {
      var l2 = ensureLog(view.date);
      var s = parseNum(t.value);
      if (s == null) delete l2.sleep; else l2.sleep = s;
      save();
    } else if (t.dataset.field === 'note') {
      var l3 = ensureLog(view.date);
      if (t.value) l3.note = t.value; else delete l3.note;
      save();
    }
  });

  document.addEventListener('change', function (e) {
    var key = e.target.dataset.setting;
    if (!key) return;
    var v = parseNum(e.target.value);
    if (v != null && v > 0) {
      state.settings[key] = v;
      save();
      toast('บันทึกแล้ว');
    } else {
      e.target.value = state.settings[key];
    }
  });

  // if the app stays open past midnight, follow the new day
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && view.follow && view.date !== todayStr()) {
      view.date = todayStr();
      render(true);
    }
  });

  render(true);

  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* optional */ }
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('./sw.js').catch(function () {}); });
  }
})();
