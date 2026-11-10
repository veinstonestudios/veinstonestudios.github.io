/* ============================================================================
   THE FACILITY WIKI — MOTOR
   content/config.js içinde listelenen Markdown maddelerini yükler; maddeleri,
   kategorileri, aramayı ve özel sayfaları tamamen tarayıcıda oluşturur.
   İçerik eklemek veya değiştirmek için bu dosyayı düzenlemeniz gerekmez.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.WIKI_CONFIG || {};
  var CONTENT_DIR = 'content/articles/';
  var MAIN = 'Ana Sayfa';
  var MAIN_ALIASES = ['ana sayfa', 'main page'];

  /* Özel sayfalar: [Türkçe ad, İngilizce eski ad] */
  var SPECIAL = {
    search:     ['Özel:Ara', 'Special:Search'],
    allpages:   ['Özel:TümSayfalar', 'Special:AllPages'],
    categories: ['Özel:Kategoriler', 'Special:Categories'],
    recent:     ['Özel:SonDeğişiklikler', 'Special:RecentChanges'],
    random:     ['Özel:Rastgele', 'Special:Random']
  };
  var CAT_PREFIX = 'Kategori:';
  var AUTO_STUB = 'Taslaklar';
  var AUTO_SPOILER = 'Spoiler içeren maddeler';

  var pages = [];             // yüklenen tüm sayfalar
  var byKey = new Map();      // normalize edilmiş başlık / takma ad -> sayfa
  var categories = new Map(); // kategori adı -> [sayfalar]
  var app, sidebarEl, searchInput, suggestBox;

  /* ----------------------------------------------------------------------
     Yardımcılar
     -------------------------------------------------------------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function lower(s) {
    return String(s || '').replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr');
  }
  function fold(s) { // aksanları ve Türkçe harfleri sadeleştirir (arama ve çapalar için)
    return lower(s).replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function key(title) {
    return lower(String(title || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim());
  }
  function slugify(s) {
    return fold(String(s).replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ''))
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
  }
  function isMain(t) { return MAIN_ALIASES.indexOf(key(t)) >= 0; }
  function specialKind(t) {
    var k = key(t);
    for (var name in SPECIAL) {
      if (SPECIAL[name].some(function (s) { return key(s) === k; })) return name;
    }
    return null;
  }
  function isSpecial(t) { return /^(özel|special):/i.test(String(t).trim()); }
  function pageUrl(title, hash) {
    if (!title || isMain(title)) return './' + (hash ? '#' + hash : '');
    var t = encodeURIComponent(String(title).replace(/ /g, '_')).replace(/%3A/gi, ':').replace(/%2C/gi, ',');
    return '?page=' + t + (hash ? '#' + hash : '');
  }
  function findPage(title) { return byKey.get(key(title)) || null; }
  function isCategoryTitle(t) { return /^(kategori|category):/i.test(String(t).trim()); }
  function catName(t) { return String(t).replace(/^(kategori|category):/i, '').replace(/_/g, ' ').trim(); }
  var MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  function fmtDate(d) {
    if (!d) return '';
    var m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return esc(d);
    return parseInt(m[3], 10) + ' ' + MONTHS[parseInt(m[2], 10) - 1] + ' ' + m[1];
  }
  function list(v) {
    if (Array.isArray(v)) return v;
    if (!v) return [];
    return String(v).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function truthy(v) { return v === true || /^(true|yes|evet|1)$/i.test(String(v || '')); }
  function siteName() { return CFG.siteName || 'Wiki'; }

  /* ----------------------------------------------------------------------
     Ön bilgi (YAML'ın küçük bir alt kümesi)
     -------------------------------------------------------------------- */
  function parseFrontMatter(text) {
    text = text.replace(/\r\n?/g, '\n');
    var meta = {};
    if (text.slice(0, 4) !== '---\n') return { meta: meta, body: text };
    var end = text.indexOf('\n---', 4);
    if (end < 0) return { meta: meta, body: text };
    var head = text.slice(4, end);
    var body = text.slice(end + 4).replace(/^[^\n]*\n?/, '');
    var blockKey = null;
    head.split('\n').forEach(function (line) {
      if (!line.trim() || /^\s*#/.test(line)) return;
      if (/^\s/.test(line) && blockKey) {
        var t = line.trim();
        var arr = meta[blockKey];
        if (t.slice(0, 2) === '- ') { arr.push(t.slice(2).trim()); return; }
        var sec = t.match(/^\[(.+)\]$/);
        if (sec) { arr.push({ section: sec[1].trim() }); return; }
        var kv = t.match(/^([^:]+?):\s*(.*)$/);
        if (kv) arr.push({ label: kv[1].trim(), value: kv[2].trim() });
        return;
      }
      var m = line.match(/^([\w-]+):\s*(.*)$/);
      if (!m) return;
      var k = m[1].toLowerCase(), v = m[2].trim();
      if (v === '') { meta[k] = []; blockKey = k; }
      else { meta[k] = v.replace(/^(['"])(.*)\1$/, '$2'); blockKey = null; }
    });
    // "image:" sonrası boşsa bu "değer yok" demektir, boş liste değil
    Object.keys(meta).forEach(function (k) {
      if (Array.isArray(meta[k]) && !meta[k].length) meta[k] = '';
    });
    return { meta: meta, body: body };
  }

  /* ----------------------------------------------------------------------
     Satır içi Markdown + wiki sözdizimi
     -------------------------------------------------------------------- */
  var TAGS = {
    unknown:     '<span class="tag tag-unknown">Bilinmiyor</span>',
    unconfirmed: '<span class="tag tag-unknown">Doğrulanmadı</span>',
    confirmed:   '<span class="tag tag-confirmed">Doğrulandı</span>',
    tba:         '<span class="tag tag-tba">Henüz belgelenmedi</span>'
  };
  var TAG_ALIASES = { bilinmiyor: 'unknown', dogrulanmadi: 'unconfirmed', dogrulandi: 'confirmed', belgelenmedi: 'tba' };

  function inline(src) {
    var tokens = [];
    function hold(html) { tokens.push(html); return '\u0000' + (tokens.length - 1) + '\u0000'; }
    var s = esc(src);

    s = s.replace(/`([^`]+)`/g, function (_, c) { return hold('<code>' + c + '</code>'); });
    // [[Sayfa#Bölüm|Metin]]
    s = s.replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, function (_, target, label) {
      var raw = target.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      var parts = raw.split('#');
      var title = parts[0].trim(), hash = parts[1] ? slugify(parts[1]) : '';
      var text = label || esc(parts[0].trim() || parts[1]);
      if (!title) return hold('<a href="#' + hash + '">' + text + '</a>');
      var p = findPage(title);
      var exists = p || isCategoryTitle(title) || isSpecial(title) || isMain(title);
      return hold('<a href="' + esc(pageUrl(p ? p.title : title, hash)) + '" data-internal' +
        (exists ? '' : ' class="new" title="' + esc(title) + ' (sayfa mevcut değil)"') + '>' + text + '</a>');
    });
    // [metin](adres)
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, url) {
      var ext = /^https?:/i.test(url);
      return hold('<a href="' + url + '"' + (ext ? ' class="external" target="_blank" rel="noopener"' : '') + '>' + label + '</a>');
    });
    // Makrolar
    s = s.replace(/\{\{([a-zçğıöşü]+)\}\}/gi, function (all, name) {
      var n = fold(name);
      n = TAG_ALIASES[n] || n;
      return TAGS[n] ? hold(TAGS[n]) : all;
    });
    s = s.replace(/\[(REDACTED|SANSÜRLÜ)\]/g, function () { return hold('<span class="redacted" title="Sansürlü">SANSÜRLÜ</span>'); });
    // ||spoiler||
    s = s.replace(/\|\|(.+?)\|\|/g, function (_, t) {
      return hold('<span class="spoiler-inline" tabindex="0" role="button" title="Göstermek için tıklayın">' + t + '</span>');
    });
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^\w*])\*(?!\s)(.+?)\*(?!\w)/g, '$1<em>$2</em>');
    s = s.replace(/ -- /g, ' — ');
    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return tokens[+i]; });
  }

  /* ----------------------------------------------------------------------
     Blok Markdown
     -------------------------------------------------------------------- */
  var CALLOUTS = {
    unknown:   { label: 'Bilinmiyor',     icon: '?' },
    confirmed: { label: 'Doğrulandı',     icon: '✓' },
    note:      { label: 'Not',            icon: 'i' },
    spoiler:   { label: 'Spoiler',   icon: '!' },
    warning:   { label: 'Uyarı',          icon: '!' },
    source:    { label: 'Kaynak',         icon: '§' },
    dev:       { label: 'Geliştirme aşamasında', icon: '◐' }
  };
  var CALLOUT_ALIASES = { bilinmiyor: 'unknown', dogrulandi: 'confirmed', not: 'note', surprizbozan: 'spoiler',
    uyari: 'warning', kaynak: 'source', gelistirme: 'dev', galeri: 'gallery', alinti: 'quote', kronoloji: 'timeline' };

  function stripLinks(s) { return s.replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1'); }

  function renderGallery(lines) {
    var items = lines.filter(function (l) { return l.trim(); }).map(function (l) {
      var p = l.split('|');
      var src = p[0].trim(), cap = (p.slice(1).join('|') || '').trim();
      if (!src || src === '-' || /^(placeholder|yer tutucu)$/i.test(src)) {
        return '<figure class="gallery-item"><div class="img-placeholder"><span>GÖRSEL<br>YOK</span></div>' +
          (cap ? '<figcaption>' + inline(cap) + '</figcaption>' : '') + '</figure>';
      }
      var plain = stripLinks(cap);
      return '<figure class="gallery-item"><a href="' + esc(src) + '" class="lightbox-link" data-caption="' + esc(plain) + '">' +
        '<img src="' + esc(src) + '" alt="' + esc(plain) + '" loading="lazy"></a>' +
        (cap ? '<figcaption>' + inline(cap) + '</figcaption>' : '') + '</figure>';
    });
    return '<div class="gallery">' + items.join('') + '</div>';
  }

  /* ---------- Dikey zaman çizelgesi ----------
     :::kronoloji
     YIL | Başlık | Açıklama | tur=yangin; henry=43; mary=11; iplik=arthur
     :::
     tur: olay | donem | arthur | mary | yangin | tesis
     iplik: aynı iplikteki olaylar zaman çizelgesinde renkli bir hatla bağlanır. */
  var TL_KINDS = {
    olay:   'Olay',
    donem:  'Dönem',
    arthur: 'Arthur',
    mary:   'Mary',
    yangin: 'Yangın',
    tesis:  'Tesis'
  };
  function tlAge(v) { return /^\d+(\s*[–-]\s*\d+)?$/.test(v) ? v + ' yaşında' : v; }

  function renderTimeline(lines) {
    var items = lines.filter(function (l) { return l.trim(); }).map(function (l) {
      var p = l.trim().split(/\s\|\s/);
      var meta = {};
      (p[3] || '').split(';').forEach(function (kv) {
        var m = kv.split('=');
        if (m[0].trim()) meta[fold(m[0].trim())] = m.slice(1).join('=').trim();
      });
      var kind = fold(meta.tur || 'olay');
      return {
        year: p[0].trim(), start: parseInt(p[0], 10), title: p[1] || '', text: p[2] || '', meta: meta,
        kind: TL_KINDS[kind] ? kind : 'olay', thread: meta.iplik ? fold(meta.iplik) : ''
      };
    });

    var threads = [], range = {};
    items.forEach(function (it) { if (it.thread && threads.indexOf(it.thread) < 0) threads.push(it.thread); });
    threads.forEach(function (t) {
      var idx = [];
      items.forEach(function (it, i) { if (it.thread === t) idx.push(i); });
      range[t] = { first: idx[0], last: idx[idx.length - 1], idx: idx };
    });
    function threadLabel(t) { return TL_KINDS[t] || (t.charAt(0).toUpperCase() + t.slice(1)); }

    function lanes(i, isGap) {
      return threads.slice(0, 2).map(function (t, k) {
        var r = range[t], cls = '';
        if (r.first === r.last) return '';
        if (isGap) { if (r.first <= i - 1 && i <= r.last) cls = 'seg-full'; }
        else if (i === r.first) cls = 'seg-bot';
        else if (i === r.last) cls = 'seg-top';
        else if (i > r.first && i < r.last) cls = 'seg-full';
        if (!cls) return '';
        return '<span class="vtl-lane lane-' + k + ' th-' + esc(t) + ' ' + cls + '"></span>' +
          (!isGap && items[i].thread === t ? '<span class="vtl-node lane-' + k + ' th-' + esc(t) + '"></span>' : '');
      }).join('');
    }

    var kindsUsed = [];
    items.forEach(function (it) { if (kindsUsed.indexOf(it.kind) < 0) kindsUsed.push(it.kind); });
    var legend = '<div class="vtl-legend" aria-hidden="true">' +
      kindsUsed.map(function (k) { return '<span class="vtl-key k-' + k + '"><i></i>' + TL_KINDS[k] + '</span>'; }).join('') +
      threads.slice(0, 2).map(function (t) { return '<span class="vtl-key vtl-key-thread th-' + esc(t) + '"><i></i>' + esc(threadLabel(t)) + ' bağlantısı</span>'; }).join('') +
      '</div>';

    var html = '<div class="vtl-wrap">' + legend + '<ol class="vtl">';
    items.forEach(function (it, i) {
      if (i > 0) {
        var gap = it.start - items[i - 1].start;
        html += '<li class="vtl-gap" aria-hidden="true"><span class="vtl-year"></span><span class="vtl-rail">' + lanes(i, true) +
          '</span><span class="vtl-gap-label">' + (gap > 0 ? '↓ ' + gap + ' yıl' : '') + '</span></li>';
      }
      var chips = '';
      if (it.meta.henry) chips += '<span class="vtl-chip">Henry: ' + esc(tlAge(it.meta.henry)) + '</span>';
      if (it.meta.mary) chips += '<span class="vtl-chip vtl-chip-mary">Mary: ' + esc(tlAge(it.meta.mary)) + '</span>';
      var links = '';
      if (it.thread) {
        var r = range[it.thread], pos = r.idx.indexOf(i);
        var prev = pos > 0 ? items[r.idx[pos - 1]] : null, next = pos < r.idx.length - 1 ? items[r.idx[pos + 1]] : null;
        if (prev) links += '<div class="vtl-link th-' + esc(it.thread) + '">↑ ' + esc(prev.year) + ': ' + inline(prev.title) + ' <span>(' + (it.start - prev.start) + ' yıl önce)</span></div>';
        if (next) links += '<div class="vtl-link th-' + esc(it.thread) + '">↓ ' + esc(next.year) + ': ' + inline(next.title) + ' <span>(' + (next.start - it.start) + ' yıl sonra)</span></div>';
      }
      html += '<li class="vtl-item k-' + it.kind + (it.kind !== 'olay' ? ' vtl-key-event' : '') + '">' +
        '<span class="vtl-year">' + esc(it.year) + '</span>' +
        '<span class="vtl-rail">' + lanes(i, false) + '<span class="vtl-dot"></span></span>' +
        '<div class="vtl-card">' +
          '<div class="vtl-kind">' + TL_KINDS[it.kind] + '</div>' +
          '<div class="vtl-title">' + inline(it.title) + '</div>' +
          (it.text ? '<div class="vtl-text">' + inline(it.text) + '</div>' : '') +
          (chips ? '<div class="vtl-meta">' + chips + '</div>' : '') + links +
        '</div></li>';
    });
    return html + '</ol></div>';
  }

  function renderTable(rows) {
    function cells(r) { return r.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }); }
    var head = cells(rows[0]);
    var body = rows.slice(1).filter(function (r) { return !/^\|?\s*:?-{2,}/.test(r.trim()); });
    var h = '<div class="table-wrap"><table class="wikitable"><thead><tr>' +
      head.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
    body.forEach(function (r) { h += '<tr>' + cells(r).map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>'; });
    return h + '</tbody></table></div>';
  }

  function renderBlocks(md, headings) {
    var lines = md.replace(/\r\n?/g, '\n').split('\n');
    var out = [], para = [], i = 0;
    function flush() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }

    while (i < lines.length) {
      var line = lines[i], t = line.trim();

      if (!t) { flush(); i++; continue; }

      var c = t.match(/^:::\s*([a-zçğıöşü]+)\s*(.*)$/i);
      if (c) {
        flush();
        var type = fold(c[1]);
        type = CALLOUT_ALIASES[type] || type;
        var title = c[2], inner = [];
        i++;
        while (i < lines.length && lines[i].trim() !== ':::') { inner.push(lines[i]); i++; }
        i++;
        if (type === 'gallery') { out.push(renderGallery(inner)); continue; }
        if (type === 'timeline') { out.push(renderTimeline(inner)); continue; }
        if (type === 'quote') {
          var attr = '';
          inner = inner.filter(function (l) {
            if (/^\s*(—|--)\s*/.test(l)) { attr = l.replace(/^\s*(—|--)\s*/, ''); return false; }
            return true;
          });
          out.push('<blockquote class="wiki-quote"><div>' + renderBlocks(inner.join('\n'), null) + '</div>' +
            (attr ? '<cite>— ' + inline(attr) + '</cite>' : '') + '</blockquote>');
          continue;
        }
        var info = CALLOUTS[type] || CALLOUTS.note;
        out.push('<div class="callout callout-' + esc(CALLOUTS[type] ? type : 'note') + '"><div class="callout-icon" aria-hidden="true">' + info.icon + '</div><div class="callout-body">' +
          '<div class="callout-title">' + inline(title || info.label) + '</div>' + renderBlocks(inner.join('\n'), null) + '</div></div>');
        continue;
      }

      var h = t.match(/^(#{2,4})\s+(.+)$/);
      if (h) {
        flush();
        var level = h[1].length, text = h[2].replace(/\s+#+$/, '');
        var id = slugify(text) || 'bolum';
        if (headings) {
          var n = 2, base = id;
          while (headings.some(function (x) { return x.id === id; })) id = base + '-' + (n++);
          headings.push({ level: level, text: text, id: id });
        }
        out.push('<h' + level + ' id="' + id + '"><span class="h-text">' + inline(text) + '</span>' +
          (level === 2 ? '<a class="h-anchor" href="#' + id + '" aria-label="Bu bölümün bağlantısı">¶</a>' : '') + '</h' + level + '>');
        i++; continue;
      }

      if (/^-{3,}$/.test(t)) { flush(); out.push('<hr>'); i++; continue; }

      if (/^\{\{(missing|eksik)\}\}$/i.test(t)) {
        flush();
        out.push('<div class="missing"><span class="missing-stamp">KAYIT YOK</span> Bu bölüm henüz belgelenmedi. Bilgiler doğrulandıkça genişletilecek.</div>');
        i++; continue;
      }

      // tablo satırı "|" ile başlar; "||" ile başlayan satır spoiler içeren bir paragraftır
      if (t.charAt(0) === '|' && t.charAt(1) !== '|') {
        flush();
        var rows = [];
        while (i < lines.length && lines[i].trim().charAt(0) === '|' && lines[i].trim().charAt(1) !== '|') { rows.push(lines[i]); i++; }
        out.push(renderTable(rows));
        continue;
      }

      if (t.charAt(0) === '>') {
        flush();
        var q = [];
        while (i < lines.length && lines[i].trim().charAt(0) === '>') { q.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
        out.push('<blockquote>' + renderBlocks(q.join('\n'), null) + '</blockquote>');
        continue;
      }

      if (/^([-*]|\d+\.)\s+/.test(t)) {
        flush();
        var ordered = /^\d+\./.test(t);
        var items = [];
        while (i < lines.length) {
          var lt = lines[i];
          if (/^\s*([-*]|\d+\.)\s+/.test(lt) && !/^\s{2,}/.test(lt)) { items.push({ text: lt.trim().replace(/^([-*]|\d+\.)\s+/, ''), sub: [] }); i++; }
          else if (/^\s{2,}([-*])\s+/.test(lt) && items.length) { items[items.length - 1].sub.push(lt.trim().replace(/^[-*]\s+/, '')); i++; }
          else if (lt.trim() && /^\s{2,}/.test(lt) && items.length) { items[items.length - 1].text += ' ' + lt.trim(); i++; }
          else break;
        }
        var tag = ordered ? 'ol' : 'ul';
        out.push('<' + tag + '>' + items.map(function (it) {
          return '<li>' + inline(it.text) + (it.sub.length ? '<ul>' + it.sub.map(function (s) { return '<li>' + inline(s) + '</li>'; }).join('') + '</ul>' : '') + '</li>';
        }).join('') + '</' + tag + '>');
        continue;
      }

      para.push(t);
      i++;
    }
    flush();
    return out.join('\n');
  }

  function plainText(md) {
    return md
      .replace(/\|\|.+?\|\|/g, ' ') // spoiler'lar arama sonuçlarında görünmesin
      .replace(/\s(tur|henry|mary|iplik)=[^;\n]*;?/g, ' ') // zaman çizelgesi alanları
      .replace(/^:::.*$/gm, ' ')
      .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\{\{[^}]+\}\}/g, ' ')
      .replace(/^\s*\S+\.(jpg|png|gif|webp)\s*\|/gim, ' ')
      .replace(/[#*>|`_]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  /* ----------------------------------------------------------------------
     Yükleme
     -------------------------------------------------------------------- */
  function loadAll() {
    var files = CFG.articles || [];
    var v = encodeURIComponent(CFG.version || '1');
    return Promise.all(files.map(function (name, index) {
      return fetch(CONTENT_DIR + name + '.md?v=' + v)
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then(function (text) { return buildPage(name, text, index); })
        .catch(function (e) { console.warn('[wiki] "' + name + '" maddesi yüklenemedi:', e); return null; });
    })).then(function (list) {
      pages = list.filter(Boolean);
      indexPages();
    });
  }

  function buildPage(file, text, order) {
    var fm = parseFrontMatter(text);
    var m = fm.meta;
    var title = m.title || file;
    var p = {
      file: file, order: order, title: title, meta: m, body: fm.body,
      type: (m.type || (isCategoryTitle(title) ? 'category' : 'article')).toLowerCase(),
      categories: list(m.categories),
      aliases: list(m.aliases),
      summary: m.summary || '',
      image: typeof m.image === 'string' ? m.image : '',
      caption: m.caption || '',
      spoilers: truthy(m.spoilers),
      stub: truthy(m.stub),
      created: m.created || m.updated || '',
      updated: m.updated || m.created || '',
      infobox: Array.isArray(m.infobox) ? m.infobox : null
    };
    p.text = plainText(p.body);
    if (p.stub && p.categories.indexOf(AUTO_STUB) < 0) p.categories.push(AUTO_STUB);
    if (p.spoilers && p.categories.indexOf(AUTO_SPOILER) < 0) p.categories.push(AUTO_SPOILER);
    return p;
  }

  function indexPages() {
    byKey.clear(); categories.clear();
    pages.forEach(function (p) {
      byKey.set(key(p.title), p);
      p.aliases.forEach(function (a) { if (!byKey.has(key(a))) byKey.set(key(a), p); });
      // "Kategori:X" sayfalarına eski "Category:X" adresiyle de ulaşılabilsin
      if (p.type === 'category') byKey.set(key('Category:' + catName(p.title)), p);
    });
    pages.forEach(function (p) {
      if (p.type === 'category') return;
      p.categories.forEach(function (c) {
        if (!categories.has(c)) categories.set(c, []);
        categories.get(c).push(p);
      });
    });
    pages.forEach(function (p) {
      if (p.type === 'category' && !categories.has(catName(p.title))) categories.set(catName(p.title), []);
    });
  }

  function contentPages() {
    return pages.filter(function (p) { return p.type !== 'category' && p.type !== 'project'; });
  }
  function categoryPage(name) { return findPage(CAT_PREFIX + name); }
  function categoryParent(name) {
    var cp = categoryPage(name);
    return cp && cp.meta.parent ? cp.meta.parent : null;
  }
  function subcategories(name) {
    return pages.filter(function (p) {
      return p.type === 'category' && p.meta.parent && key(p.meta.parent) === key(name);
    }).map(function (p) { return catName(p.title); });
  }
  function membersDeep(name, seen) {
    seen = seen || {};
    if (seen[name]) return [];
    seen[name] = true;
    var set = (categories.get(name) || []).slice();
    subcategories(name).forEach(function (s) {
      membersDeep(s, seen).forEach(function (p) { if (set.indexOf(p) < 0) set.push(p); });
    });
    return set;
  }
  function byTitle(a, b) { return a.title.localeCompare(b.title, 'tr'); }

  /* ----------------------------------------------------------------------
     Ortak parçalar
     -------------------------------------------------------------------- */
  function link(title, label) {
    var p = findPage(title);
    var exists = p || isCategoryTitle(title) || isSpecial(title) || isMain(title);
    return '<a href="' + esc(pageUrl(p ? p.title : title)) + '" data-internal' + (exists ? '' : ' class="new"') + '>' + esc(label || title) + '</a>';
  }
  function catLink(name, label) { return link(CAT_PREFIX + name, label || name); }

  function breadcrumb(trail) {
    var items = ['<a href="./" data-internal>' + esc(siteName()) + '</a>'];
    trail.forEach(function (t, i) {
      if (i === trail.length - 1) items.push('<span aria-current="page">' + esc(t[0]) + '</span>');
      else items.push('<a href="' + esc(pageUrl(t[1])) + '" data-internal>' + esc(t[0]) + '</a>');
    });
    return '<nav class="breadcrumb" aria-label="Konum">' + items.join('<span class="sep" aria-hidden="true">›</span>') + '</nav>';
  }

  function categoryTrail(cat) {
    var chain = [], guard = 0;
    while (cat && guard++ < 6) { chain.unshift([cat, CAT_PREFIX + cat]); cat = categoryParent(cat); }
    return chain;
  }

  var TYPE_LABEL = {
    character: 'Karakter dosyası', location: 'Mekân kaydı', lore: 'Evren belgesi',
    game: 'Oyun bilgisi', world: 'Dünya kaydı', category: 'Kategori dizini',
    project: 'Wiki proje sayfası', article: 'Arşiv kaydı', timeline: 'Kronolojik kayıt'
  };

  function entryNo(p) { return ('000' + (p.order + 1)).slice(-3); }

  function placeholderImg(label) {
    return '<div class="img-placeholder"><span>' + (label || 'GÖRSEL<br>YOK') + '</span></div>';
  }

  function thumb(p) {
    return p.image
      ? '<img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy">'
      : placeholderImg('GÖRSEL<br>YOK');
  }

  function card(p) {
    return '<a class="card" href="' + esc(pageUrl(p.title)) + '" data-internal>' +
      '<div class="card-img' + (p.type === 'character' ? ' portrait' : '') + '">' + thumb(p) + '</div>' +
      '<div class="card-title">' + esc(p.title) + '</div>' +
      (p.meta.role ? '<div class="card-sub">' + esc(p.meta.role) + '</div>' : '') + '</a>';
  }

  function infobox(p) {
    var rows = p.infobox || [];
    var h = '<aside class="infobox" aria-label="Bilgi kutusu">' +
      '<div class="infobox-title">' + esc(p.meta['infobox-title'] || p.title) + '</div>';
    if (p.image) {
      h += '<figure class="infobox-image"><a href="' + esc(p.image) + '" class="lightbox-link" data-caption="' + esc(stripLinks(p.caption || p.title)) + '">' +
        '<img src="' + esc(p.image) + '" alt="' + esc(stripLinks(p.caption || p.title)) + '"></a>' +
        (p.caption ? '<figcaption>' + inline(p.caption) + '</figcaption>' : '') + '</figure>';
    } else {
      h += '<figure class="infobox-image">' + placeholderImg('GÖRSEL<br>BEKLENİYOR') +
        '<figcaption>' + (p.caption ? inline(p.caption) : 'Şu anda kayıtlı bir görsel yok.') + '</figcaption></figure>';
    }
    var open = false;
    rows.forEach(function (r) {
      if (r.section) {
        if (open) h += '</dl>';
        h += '<div class="infobox-section">' + esc(r.section) + '</div><dl>';
        open = true;
      } else if (r.label) {
        if (!open) { h += '<dl>'; open = true; }
        var val = r.value;
        var vh = /^(unknown|bilinmiyor|\?)$/i.test(val) ? TAGS.unknown
          : /^(tba|belgelenmedi|henüz belgelenmedi|-)$/i.test(val) ? TAGS.tba
          : val.split(/\s*;\s*/).map(inline).join('<br>');
        h += '<div class="infobox-row"><dt>' + esc(r.label) + '</dt><dd>' + vh + '</dd></div>';
      }
    });
    if (open) h += '</dl>';
    return h + '</aside>';
  }

  function toc(headings) {
    if (headings.length < 3) return '';
    var n2 = 0, n3 = 0;
    var items = headings.filter(function (x) { return x.level <= 3; }).map(function (x) {
      var num;
      if (x.level === 2) { n2++; n3 = 0; num = n2; } else { n3++; num = n2 + '.' + n3; }
      return '<li class="toc-l' + x.level + '"><a href="#' + x.id + '"><span class="toc-num">' + num + '</span> ' + inline(x.text) + '</a></li>';
    });
    return '<nav class="toc" aria-label="İçindekiler"><div class="toc-head"><span>İçindekiler</span>' +
      '<button type="button" class="toc-toggle" aria-expanded="true">gizle</button></div><ol>' + items.join('') + '</ol></nav>';
  }

  function categoryFooter(p) {
    if (!p.categories.length) return '';
    return '<div class="catlinks"><span class="catlinks-label">Kategoriler:</span> ' +
      p.categories.map(function (c) { return catLink(c); }).join('<span class="sep">|</span>') + '</div>';
  }

  /* ----------------------------------------------------------------------
     Sayfa oluşturucular
     -------------------------------------------------------------------- */
  function renderArticle(p) {
    var headings = [];
    var bodyHtml = renderBlocks(p.body, headings);
    var tocHtml = toc(headings);
    if (tocHtml) {
      var at = bodyHtml.search(/<h2[ >]/);
      bodyHtml = at >= 0 ? bodyHtml.slice(0, at) + tocHtml + bodyHtml.slice(at) : tocHtml + bodyHtml;
    }
    var primary = p.categories.filter(function (c) { return c !== AUTO_STUB && c !== AUTO_SPOILER; })[0];
    var trail = primary ? categoryTrail(primary) : [];
    if (p.type === 'project') trail = [];
    trail.push([p.title, p.title]);

    var notices = '';
    if (p.spoilers) {
      notices += '<div class="notice notice-spoiler" role="note"><div class="notice-stamp">Gizli</div><div>' +
        '<strong>Spoiler uyarısı.</strong> Bu madde <em>The Facility</em> oyununun hikâyesine dair ayrıntılar içerir. ' +
        (p.meta['spoiler-note'] ? inline(p.meta['spoiler-note']) : 'Okuma kararı size ait.') + '</div></div>';
    }
    if (p.stub) {
      notices += '<div class="notice notice-stub" role="note"><div class="notice-stamp">Eksik</div><div>' +
        '<strong>Bu madde bir taslaktır.</strong> Bu konu hakkında çok az bilgi doğrulanmıştır. ' +
        'Resmî bilgiler açıklandıkça genişletilecek.</div></div>';
    }

    document.title = p.title + ' | ' + siteName();

    return breadcrumb(trail) +
      '<article class="article page-' + esc(p.type) + '">' +
      '<header class="article-head">' +
        '<div class="file-strip"><span>' + esc(TYPE_LABEL[p.type] || TYPE_LABEL.article) + '</span><span>Madde No. ' + entryNo(p) + '</span></div>' +
        '<h1 class="page-title">' + esc(p.title) + '</h1>' +
        (p.meta.subtitle ? '<div class="page-subtitle">' + inline(p.meta.subtitle) + '</div>' : '') +
      '</header>' +
      notices +
      '<div class="article-body">' +
        (p.infobox || p.image ? infobox(p) : '') +
        '<div class="prose">' + bodyHtml + '</div>' +
      '</div>' +
      '<footer class="article-foot">' + categoryFooter(p) +
        '<div class="lastmod">Bu sayfa en son ' + fmtDate(p.updated) + ' tarihinde güncellendi.</div>' +
      '</footer>' +
      '</article>';
  }

  function renderCategory(name) {
    var cp = categoryPage(name);
    var members = (categories.get(name) || []).slice().sort(byTitle);
    var deep = membersDeep(name).sort(byTitle);
    var subs = subcategories(name);
    var trail = categoryTrail(name);
    document.title = CAT_PREFIX + name + ' | ' + siteName();

    var intro = cp ? renderBlocks(cp.body, null) : '<p>Bu kategori <strong>' + esc(name) + '</strong> başlığı altında dosyalanan tüm sayfaları listeler.</p>';
    var gallery = deep.length
      ? '<div class="card-grid">' + deep.map(card).join('') + '</div>'
      : '<div class="missing"><span class="missing-stamp">BOŞ</span> Bu kategoride şu anda hiç sayfa yok.</div>';

    var alpha = '';
    if (members.length) {
      var groups = {};
      members.forEach(function (p) {
        var L = p.title.charAt(0).toLocaleUpperCase('tr');
        (groups[L] = groups[L] || []).push(p);
      });
      alpha = '<h2 id="sayfalar">“' + esc(name) + '” kategorisindeki sayfalar</h2><p class="muted">Bu kategoride ' + members.length +
        ' sayfa bulunuyor.</p><div class="alpha-list">' +
        Object.keys(groups).sort(function (a, b) { return a.localeCompare(b, 'tr'); }).map(function (L) {
          return '<div class="alpha-group"><h3>' + esc(L) + '</h3><ul>' + groups[L].map(function (p) {
            return '<li>' + link(p.title) + '</li>';
          }).join('') + '</ul></div>';
        }).join('') + '</div>';
    }

    var subHtml = subs.length ? '<h2 id="alt-kategoriler">Alt kategoriler</h2><ul class="subcats">' + subs.map(function (s) {
      return '<li>' + catLink(s) + ' <span class="muted">(' + membersDeep(s).length + ' sayfa)</span></li>';
    }).join('') + '</ul>' : '';

    return breadcrumb(trail) +
      '<article class="article page-category">' +
      '<header class="article-head"><div class="file-strip"><span>Kategori dizini</span><span>' + deep.length + ' kayıt</span></div>' +
      '<h1 class="page-title"><span class="title-ns">' + CAT_PREFIX + '</span>' + esc(name) + '</h1></header>' +
      '<div class="prose">' + intro + '</div>' +
      gallery + subHtml + '<div class="prose">' + alpha + '</div>' +
      (cp && cp.meta.parent ? '<footer class="article-foot"><div class="catlinks"><span class="catlinks-label">Üst kategori:</span> ' +
        catLink(cp.meta.parent) + '</div></footer>' : '') +
      '</article>';
  }

  function excerpt(p, n) {
    var s = p.summary || p.text;
    n = n || 220;
    return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s;
  }

  function renderMain() {
    var M = CFG.mainPage || {};
    document.title = siteName();
    var feat = findPage(M.featuredArticle);
    var all = contentPages();
    var recent = all.slice().sort(function (a, b) {
      return (b.created || '').localeCompare(a.created || '') || b.order - a.order;
    }).slice(0, 8);

    function cards(titles) {
      return '<div class="card-grid">' + (titles || []).map(findPage).filter(Boolean).map(card).join('') + '</div>';
    }
    function loreList(titles) {
      return '<ul class="lore-list">' + (titles || []).map(findPage).filter(Boolean).map(function (p) {
        return '<li><a href="' + esc(pageUrl(p.title)) + '" data-internal class="lore-title">' + esc(p.title) + '</a>' +
          '<span class="lore-sum">' + esc(excerpt(p, 140)) + '</span></li>';
      }).join('') + '</ul>';
    }
    function box(title, body) { return '<section class="mp-box"><h2 class="mp-h">' + title + '</h2>' + body + '</section>'; }
    function more(target, label) { return '<p class="more">' + link(target, label) + '</p>'; }

    var stats = all.length + ' madde · ' + Array.from(categories.keys()).length + ' kategori';
    var L = CFG.links || {};

    return '<div class="mainpage">' +
      '<section class="mp-welcome">' +
        '<div class="mp-welcome-text">' +
          '<div class="file-strip"><span>Açık arşiv</span><span>' + esc(stats) + '</span></div>' +
          '<h1>Hoş geldiniz<span lang="en">' + esc(siteName()) + '</span></h1>' +
          (M.intro || []).map(function (t) { return '<p>' + inline(t) + '</p>'; }).join('') +
        '</div>' +
        '<nav class="mp-shortcuts" aria-label="Göz at">' + (M.shortcuts || []).map(function (s) {
          return '<a href="' + esc(pageUrl(s[1])) + '" data-internal>' + esc(s[0]) + '</a>';
        }).join('') + '</nav>' +
      '</section>' +
      '<div class="notice notice-spoiler mp-spoiler" role="note"><div class="notice-stamp">Duyuru</div><div>' +
        '<strong>Spoiler uyarısı.</strong> Bu wikideki bazı maddeler <em>The Facility</em> oyununun hikâyesine dair spoiler içerir. ' +
        'Bu maddeler sayfanın en üstünde işaretlenir ve ' + catLink(AUTO_SPOILER, 'bu kategoride') + ' listelenir.</div></div>' +
      '<div class="mp-columns">' +
        '<div class="mp-main">' +
          (feat ? box('Öne çıkan madde',
            '<div class="featured"><a class="featured-img" href="' + esc(pageUrl(feat.title)) + '" data-internal>' + thumb(feat) + '</a>' +
            '<div class="featured-text"><h3>' + link(feat.title) + '</h3><p>' + esc(excerpt(feat, 420)) + '</p>' +
            more(feat.title, 'Maddenin tamamını oku →') + '</div></div>') : '') +
          box('Öne çıkan karakterler', cards(M.featuredCharacters) + more(CAT_PREFIX + 'Karakterler', 'Tüm karakterler →')) +
          box('Önemli mekânlar', cards(M.importantLocations) + more(CAT_PREFIX + 'Mekânlar', 'Tüm mekânlar →')) +
          box('Evren ve dünya', loreList(M.lore) + more(CAT_PREFIX + 'Evren Bilgisi', 'Tüm evren maddeleri →')) +
        '</div>' +
        '<aside class="mp-side">' +
          box('Son eklenenler', '<ul class="recent">' + recent.map(function (p) {
            return '<li>' + link(p.title) + '<span class="muted">' + fmtDate(p.created) + '</span></li>';
          }).join('') + '</ul>' + more(SPECIAL.recent[0], 'Son değişiklikler →')) +
          box('Oyun bilgileri', '<ul class="plain">' + (M.gameInfo || []).map(function (t) { return '<li>' + link(t) + '</li>'; }).join('') + '</ul>') +
          '<section class="mp-box mp-legend"><h2 class="mp-h">Bu wiki nasıl okunur?</h2>' +
            '<p>Yalnızca geliştiriciler tarafından doğrulanan bilgiler gerçek olarak sunulur. Diğer her şey işaretlenir:</p>' +
            '<ul class="plain legend"><li>' + TAGS.unknown + ' kanonda belirlenmemiş</li>' +
            '<li>' + TAGS.tba + ' bilgi bekleniyor</li>' +
            '<li>' + TAGS.confirmed + ' geliştiriciler tarafından belirtilmiş</li></ul>' +
            more('The Facility Wiki:Hakkında', 'Bu wiki hakkında →') + '</section>' +
          box('Resmî bağlantılar', '<ul class="plain">' +
            (L.steam ? '<li><a class="external" href="' + esc(L.steam) + '" target="_blank" rel="noopener">Steam\'de The Facility</a></li>' : '') +
            (L.presskit ? '<li><a href="' + esc(L.presskit) + '">Basın kiti</a></li>' : '') +
            (L.studio ? '<li><a href="' + esc(L.studio) + '">Veinstone Studios</a></li>' : '') + '</ul>') +
        '</aside>' +
      '</div></div>';
  }

  /* ---------- Arama ---------- */
  function search(q, includeMeta) {
    var nq = fold(q).trim();
    if (!nq) return [];
    var terms = nq.split(/\s+/).filter(Boolean);
    var res = [];
    pages.forEach(function (p) {
      if (p.type === 'project' && !includeMeta) return;
      var t = fold(p.title), al = fold(p.aliases.join(' ')), sm = fold(p.summary),
          ct = fold(p.categories.join(' ')), bd = fold(p.text);
      var all = t + ' ' + al + ' ' + sm + ' ' + ct + ' ' + bd;
      if (!terms.every(function (x) { return all.indexOf(x) >= 0; })) return;
      var s = 0;
      if (t === nq) s += 200; else if (t.indexOf(nq) === 0) s += 90; else if (t.indexOf(nq) >= 0) s += 60;
      if (al.indexOf(nq) >= 0) s += 50;
      terms.forEach(function (x) {
        if (t.indexOf(x) >= 0) s += 20;
        if (al.indexOf(x) >= 0) s += 10;
        if (sm.indexOf(x) >= 0) s += 6;
        if (ct.indexOf(x) >= 0) s += 3;
        s += Math.min(bd.split(x).length - 1, 8);
      });
      if (p.type === 'category') s -= 5;
      res.push({ page: p, score: s });
    });
    return res.sort(function (a, b) { return b.score - a.score || byTitle(a.page, b.page); });
  }

  // fold() harf sayısını değiştirmediği için konumlar orijinal metinle eşleşir
  function highlight(text, q) {
    var terms = fold(q).split(/\s+/).filter(function (t) { return t.length > 1; });
    var f = fold(text), marks = new Array(text.length + 1).fill(0);
    if (f.length !== text.length) return esc(text);
    terms.forEach(function (t) {
      var at = f.indexOf(t);
      while (at >= 0) { for (var i = at; i < at + t.length; i++) marks[i] = 1; at = f.indexOf(t, at + t.length); }
    });
    var out = '', on = false;
    for (var i = 0; i < text.length; i++) {
      if (marks[i] && !on) { out += '<mark>'; on = true; }
      if (!marks[i] && on) { out += '</mark>'; on = false; }
      out += esc(text.charAt(i));
    }
    return out + (on ? '</mark>' : '');
  }

  function snippet(p, q) {
    var text = p.text, nt = fold(text);
    var first = fold(q).split(/\s+/).filter(Boolean)[0] || '';
    var at = first && nt.length === text.length ? nt.indexOf(first) : -1;
    if (at < 0) return excerpt(p, 200);
    var start = Math.max(0, at - 80);
    var s = text.slice(start, at + 140);
    return (start > 0 ? '…' + s.replace(/^\S*\s/, '') : s) + '…';
  }

  function specialPage(title, strip, heading, body) {
    return breadcrumb([[heading, title]]) +
      '<article class="article"><header class="article-head"><div class="file-strip"><span>' + strip[0] + '</span><span>' + strip[1] + '</span></div>' +
      '<h1 class="page-title">' + heading + '</h1></header>' + body + '</article>';
  }

  function renderSearch(q) {
    document.title = 'Arama sonuçları' + (q ? ': “' + q + '”' : '') + ' | ' + siteName();
    var results = search(q, true);
    var exact = findPage(q);
    var body;
    if (!q) body = '<p>Sayfanın üstündeki arama kutusuna bir terim yazın.</p>';
    else if (!results.length) body = '<div class="missing"><span class="missing-stamp">EŞLEŞME YOK</span> “' + esc(q) + '” ile eşleşen madde bulunamadı. ' +
      'Farklı bir yazım deneyin ya da ' + link(SPECIAL.allpages[0], 'tüm sayfalara') + ' göz atın.</div>';
    else body = '<p class="muted">“' + esc(q) + '” için ' + results.length + ' sonuç.</p>' +
      '<ol class="search-results">' + results.map(function (r) {
        var p = r.page;
        return '<li><div class="sr-title">' + link(p.title) + ' <span class="sr-type">' + esc(TYPE_LABEL[p.type] || '') + '</span></div>' +
          '<div class="sr-snippet">' + highlight(snippet(p, q), q) + '</div>' +
          '<div class="sr-cats muted">' + esc(p.categories.join(' · ')) + '</div></li>';
      }).join('') + '</ol>';
    return specialPage(SPECIAL.search[0], ['Arşiv sorgusu', 'Özel sayfa'], 'Arama sonuçları',
      '<form class="search-page-form" role="search" data-search-page><input type="search" name="q" value="' + esc(q) + '" aria-label="Wikide ara">' +
      '<button type="submit">Ara</button></form>' +
      (exact && q ? '<p class="exact">Bu wikide ' + link(exact.title) + ' adlı bir sayfa var.</p>' : '') + body);
  }

  function renderAllPages() {
    document.title = 'Tüm sayfalar | ' + siteName();
    var list = pages.slice().sort(byTitle);
    return specialPage(SPECIAL.allpages[0], ['Arşiv dizini', list.length + ' sayfa'], 'Tüm sayfalar',
      '<div class="prose"><ul class="columns">' + list.map(function (p) { return '<li>' + link(p.title) + '</li>'; }).join('') + '</ul></div>');
  }

  function renderCategories() {
    document.title = 'Kategoriler | ' + siteName();
    var names = Array.from(categories.keys()).sort(function (a, b) { return a.localeCompare(b, 'tr'); });
    return specialPage(SPECIAL.categories[0], ['Arşiv dizini', names.length + ' kategori'], 'Kategoriler',
      '<div class="prose"><ul class="columns">' + names.map(function (n) {
        return '<li>' + catLink(n) + ' <span class="muted">(' + membersDeep(n).length + ')</span></li>';
      }).join('') + '</ul></div>');
  }

  function renderRecent() {
    document.title = 'Son değişiklikler | ' + siteName();
    var list = pages.slice().sort(function (a, b) {
      return (b.updated || '').localeCompare(a.updated || '') || byTitle(a, b);
    });
    var groups = {};
    list.forEach(function (p) { (groups[p.updated || 'Tarihsiz'] = groups[p.updated || 'Tarihsiz'] || []).push(p); });
    return specialPage(SPECIAL.recent[0], ['Değişiklik kaydı', 'Özel sayfa'], 'Son değişiklikler',
      '<div class="prose">' + Object.keys(groups).sort().reverse().map(function (d) {
        return '<h2>' + fmtDate(d) + '</h2><ul>' + groups[d].map(function (p) {
          return '<li>' + link(p.title) + (p.created === p.updated ? ' <span class="tag tag-new">yeni</span>' : '') +
            (p.summary ? ' <span class="muted">— ' + esc(excerpt(p, 90)) + '</span>' : '') + '</li>';
        }).join('') + '</ul>';
      }).join('') + '</div>');
  }

  function renderNotFound(title) {
    document.title = 'Sayfa bulunamadı | ' + siteName();
    var results = search(title).slice(0, 6);
    return breadcrumb([[title, title]]) +
      '<article class="article page-404"><header class="article-head"><div class="file-strip"><span>Hata 404</span><span>Kayıt eksik</span></div>' +
      '<h1 class="page-title">' + esc(title) + '</h1></header>' +
      '<div class="notfound"><div class="stamp-big">DOSYA BULUNAMADI</div>' +
      '<p>Bu arşivde <strong>“' + esc(title) + '”</strong> başlıklı bir madde bulunmuyor. ' +
      'Kayıt taşınmış, yeniden adlandırılmış ya da hiç var olmamış olabilir.</p>' +
      (results.length ? '<p>Şunu mu arıyordunuz?</p><ul>' + results.map(function (r) { return '<li>' + link(r.page.title) + '</li>'; }).join('') + '</ul>' : '') +
      '<p>' + link(MAIN, 'Ana Sayfaya dön') + ' · ' + link(SPECIAL.allpages[0], 'Tüm sayfalara göz at') + ' · ' +
      '<a href="' + esc(pageUrl(SPECIAL.search[0]) + '&q=' + encodeURIComponent(title)) + '" data-internal>“' + esc(title) + '” için ara</a></p></div></article>';
  }

  /* ----------------------------------------------------------------------
     Yönlendirici
     -------------------------------------------------------------------- */
  function route() {
    var params = new URLSearchParams(location.search);
    var title = (params.get('page') || MAIN).replace(/_/g, ' ').trim();
    var q = params.get('q') || '';
    var kind = specialKind(title);
    var html;

    if (isMain(title)) html = renderMain();
    else if (kind === 'search') html = renderSearch(q);
    else if (kind === 'allpages') html = renderAllPages();
    else if (kind === 'categories') html = renderCategories();
    else if (kind === 'recent') html = renderRecent();
    else if (kind === 'random') {
      var pool = contentPages();
      var pick = pool[Math.floor(Math.random() * pool.length)];
      history.replaceState(null, '', pageUrl(pick.title));
      return route();
    }
    else if (isCategoryTitle(title)) {
      var name = catName(title);
      var cpAlias = categoryPage(name);
      if (cpAlias && !categories.has(name)) name = catName(cpAlias.title); // eski kategori adı (takma ad)
      var known = categories.has(name) || !!cpAlias;
      if (!known) {
        Array.from(categories.keys()).forEach(function (k) { if (key(k) === key(name)) { name = k; known = true; } });
      }
      if (!known) { var cp = findPage(title); if (cp && cp.type === 'category') { name = catName(cp.title); known = true; } }
      if (known && key(CAT_PREFIX + name) !== key(title)) history.replaceState(null, '', pageUrl(CAT_PREFIX + name) + location.hash);
      html = known ? renderCategory(name) : renderNotFound(title);
    } else {
      var p = findPage(title);
      if (p && key(p.title) !== key(title)) history.replaceState(null, '', pageUrl(p.title) + location.hash);
      html = p ? renderArticle(p) : renderNotFound(title);
    }

    app.innerHTML = html;
    app.removeAttribute('aria-busy');
    markActiveNav();
    if (searchInput) searchInput.value = kind === 'search' ? q : '';
    closeNav();

    if (location.hash) {
      var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) { el.scrollIntoView(); return; }
    }
    window.scrollTo(0, 0);
  }

  function go(url) {
    history.pushState(null, '', url);
    route();
  }

  /* ----------------------------------------------------------------------
     Kenar çubuğu
     -------------------------------------------------------------------- */
  function buildSidebar() {
    sidebarEl.innerHTML = (CFG.sidebar || []).map(function (g) {
      return '<details class="nav-group" open><summary>' + esc(g.heading) + '</summary><ul>' +
        g.links.map(function (l) {
          return '<li><a href="' + esc(pageUrl(l[1])) + '" data-internal data-target="' + esc(key(l[1])) + '">' + esc(l[0]) + '</a></li>';
        }).join('') + '</ul></details>';
    }).join('');
  }

  function markActiveNav() {
    var params = new URLSearchParams(location.search);
    var raw = params.get('page') || MAIN;
    var cur = isMain(raw) ? key(MAIN) : key(raw);
    var p = findPage(cur);
    if (p) cur = key(p.title);
    sidebarEl.querySelectorAll('a[data-target]').forEach(function (a) {
      var t = a.getAttribute('data-target');
      var tp = findPage(t);
      var match = t === cur || (tp && key(tp.title) === cur);
      a.classList.toggle('active', !!match);
      if (match) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function openNav() { document.body.classList.add('nav-open'); }
  function closeNav() { document.body.classList.remove('nav-open'); }

  /* ----------------------------------------------------------------------
     Arama önerileri
     -------------------------------------------------------------------- */
  var sel = -1, current = [];
  function renderSuggest() {
    var q = searchInput.value.trim();
    if (!q) { hideSuggest(); return; }
    current = search(q).slice(0, 8);
    sel = -1;
    var items = current.map(function (r, i) {
      var p = r.page;
      return '<li role="option" id="sugg-' + i + '"><a href="' + esc(pageUrl(p.title)) + '" data-internal tabindex="-1">' +
        '<span class="sugg-thumb">' + (p.image ? '<img src="' + esc(p.image) + '" alt="">' : '<span class="sugg-noimg"></span>') + '</span>' +
        '<span class="sugg-text"><span class="sugg-title">' + highlight(p.title, q) + '</span>' +
        '<span class="sugg-meta">' + esc(TYPE_LABEL[p.type] || '') + (p.summary ? ' — ' + esc(excerpt(p, 70)) : '') + '</span></span></a></li>';
    });
    items.push('<li role="option" class="sugg-all" id="sugg-' + current.length + '"><a href="' +
      esc(pageUrl(SPECIAL.search[0]) + '&q=' + encodeURIComponent(q)) + '" data-internal tabindex="-1"><strong>' + esc(q) + '</strong> içeren sayfaları ara</a></li>');
    suggestBox.innerHTML = items.join('');
    suggestBox.hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');
  }
  function hideSuggest() {
    suggestBox.hidden = true; suggestBox.innerHTML = ''; sel = -1;
    searchInput.setAttribute('aria-expanded', 'false');
    searchInput.removeAttribute('aria-activedescendant');
  }
  function moveSel(d) {
    var lis = suggestBox.querySelectorAll('li');
    if (!lis.length) return;
    sel = (sel + d + lis.length) % lis.length;
    lis.forEach(function (li, i) { li.classList.toggle('sel', i === sel); });
    searchInput.setAttribute('aria-activedescendant', 'sugg-' + sel);
  }
  function submitSearch(q) {
    q = q.trim();
    if (!q) return;
    hideSuggest();
    searchInput.blur();
    var exact = findPage(q);
    go(exact ? pageUrl(exact.title) : pageUrl(SPECIAL.search[0]) + '&q=' + encodeURIComponent(q));
  }

  /* ----------------------------------------------------------------------
     Görsel görüntüleyici
     -------------------------------------------------------------------- */
  var lb, lbImg, lbCap, lbSet = [], lbIndex = 0;
  function openLightbox(a) {
    var scope = a.closest('.gallery') || a.closest('.infobox') || document;
    lbSet = Array.prototype.slice.call(scope.querySelectorAll('.lightbox-link'));
    lbIndex = Math.max(0, lbSet.indexOf(a));
    showLb();
    lb.hidden = false;
    document.body.classList.add('lb-open');
    lb.querySelector('.lb-close').focus();
  }
  function showLb() {
    var a = lbSet[lbIndex];
    lbImg.src = a.getAttribute('href');
    lbImg.alt = a.getAttribute('data-caption') || '';
    lbCap.textContent = (a.getAttribute('data-caption') || '') + (lbSet.length > 1 ? ' (' + (lbIndex + 1) + ' / ' + lbSet.length + ')' : '');
    lb.classList.toggle('single', lbSet.length < 2);
  }
  function closeLightbox() { lb.hidden = true; lbImg.src = ''; document.body.classList.remove('lb-open'); }
  function stepLb(d) { lbIndex = (lbIndex + d + lbSet.length) % lbSet.length; showLb(); }

  /* ----------------------------------------------------------------------
     Olaylar
     -------------------------------------------------------------------- */
  function bind() {
    document.addEventListener('click', function (e) {
      var sp = e.target.closest('.spoiler-inline');
      if (sp) { sp.classList.add('revealed'); return; }

      var tt = e.target.closest('.toc-toggle');
      if (tt) {
        var hidden = tt.closest('.toc').classList.toggle('collapsed');
        tt.textContent = hidden ? 'göster' : 'gizle';
        tt.setAttribute('aria-expanded', String(!hidden));
        return;
      }

      var lbl = e.target.closest('.lightbox-link');
      if (lbl && !e.ctrlKey && !e.metaKey) { e.preventDefault(); openLightbox(lbl); return; }

      var a = e.target.closest('a[data-internal]');
      if (a && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
        var url = new URL(a.href, location.href);
        if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
        e.preventDefault();
        hideSuggest();
        go(url.pathname + url.search + url.hash);
        return;
      }

      if (!e.target.closest('.searchbox')) hideSuggest();
      if (document.body.classList.contains('nav-open') && !e.target.closest('#sidebar') && !e.target.closest('.nav-toggle')) closeNav();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('spoiler-inline')) e.target.classList.add('revealed');
      if (!lb.hidden) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') stepLb(1);
        if (e.key === 'ArrowLeft') stepLb(-1);
        return;
      }
      if (e.key === 'Escape') closeNav();
      if (e.key === '/' && document.activeElement === document.body) { e.preventDefault(); searchInput.focus(); }
    });

    document.addEventListener('submit', function (e) {
      if (e.target.matches('[data-search-page]')) { e.preventDefault(); submitSearch(e.target.q.value); }
    });

    window.addEventListener('popstate', route);

    document.getElementById('searchform').addEventListener('submit', function (e) {
      e.preventDefault();
      var lis = suggestBox.querySelectorAll('li');
      if (sel >= 0 && lis[sel]) { go(lis[sel].querySelector('a').getAttribute('href')); hideSuggest(); searchInput.blur(); return; }
      submitSearch(searchInput.value);
    });
    searchInput.addEventListener('input', renderSuggest);
    searchInput.addEventListener('focus', function () { if (searchInput.value.trim()) renderSuggest(); });
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (suggestBox.hidden) renderSuggest(); moveSel(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); }
      else if (e.key === 'Escape') { hideSuggest(); }
    });

    document.querySelector('.nav-toggle').addEventListener('click', function () {
      document.body.classList.contains('nav-open') ? closeNav() : openNav();
    });

    lb.addEventListener('click', function (e) {
      if (e.target.closest('.lb-next')) { stepLb(1); return; }
      if (e.target.closest('.lb-prev')) { stepLb(-1); return; }
      if (e.target === lb || e.target.closest('.lb-close')) closeLightbox();
    });
  }

  /* ----------------------------------------------------------------------
     Başlatma
     -------------------------------------------------------------------- */
  function boot() {
    app = document.getElementById('content');
    sidebarEl = document.getElementById('sidebar-nav');
    searchInput = document.getElementById('search-input');
    suggestBox = document.getElementById('search-suggest');
    lb = document.getElementById('lightbox');
    lbImg = lb.querySelector('img');
    lbCap = lb.querySelector('.lb-caption');

    buildSidebar();
    bind();

    if (location.protocol === 'file:') {
      app.innerHTML = '<div class="notice notice-spoiler"><div class="notice-stamp">Çevrimdışı</div><div><strong>Wiki bir web sunucusu gerektirir.</strong> ' +
        'Tarayıcılar madde dosyalarının doğrudan diskten yüklenmesini engeller. Wiki GitHub Pages üzerinde ya da yerelde bir statik sunucuyla ' +
        '(örneğin depo klasöründe <code>python -m http.server</code>) çalışır.</div></div>';
      return;
    }

    loadAll().then(function () {
      buildSidebar();
      var count = document.getElementById('article-count');
      if (count) count.textContent = contentPages().length;
      route();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
