/* ============================================================================
   THE FACILITY WIKI — ENGINE
   Loads the Markdown articles listed in content/config.js, renders pages,
   categories, search and special pages entirely in the browser.
   You should not need to edit this file to add or change content.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.WIKI_CONFIG || {};
  var CONTENT_DIR = 'content/articles/';
  var MAIN = 'Main Page';

  var pages = [];            // every loaded page object
  var byKey = new Map();     // normalised title / alias -> page
  var categories = new Map();// category name -> [pages]
  var app, sidebarEl, searchInput, suggestBox;

  /* ----------------------------------------------------------------------
     Utilities
     -------------------------------------------------------------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function key(title) {
    return String(title || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function slugify(s) {
    return String(s).toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
  }
  function pageUrl(title, hash) {
    if (!title || key(title) === key(MAIN)) return './' + (hash ? '#' + hash : '');
    var t = encodeURIComponent(String(title).replace(/ /g, '_'))
      .replace(/%3A/gi, ':').replace(/%2C/gi, ',').replace(/%26/gi, '%26');
    return '?page=' + t + (hash ? '#' + hash : '');
  }
  function findPage(title) { return byKey.get(key(title)) || null; }
  function isCategoryTitle(t) { return /^category:/i.test(String(t).trim()); }
  function catName(t) { return String(t).replace(/^category:/i, '').replace(/_/g, ' ').trim(); }
  function fmtDate(d) {
    if (!d) return '';
    var m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return esc(d);
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return parseInt(m[3], 10) + ' ' + months[parseInt(m[2], 10) - 1] + ' ' + m[1];
  }
  function list(v) {
    if (Array.isArray(v)) return v;
    if (!v) return [];
    return String(v).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function truthy(v) { return v === true || /^(true|yes|1)$/i.test(String(v || '')); }

  /* ----------------------------------------------------------------------
     Front matter (a small YAML subset)
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
    // "image:" with nothing after it means "no value", not an empty list
    Object.keys(meta).forEach(function (k) {
      if (Array.isArray(meta[k]) && !meta[k].length) meta[k] = '';
    });
    return { meta: meta, body: body };
  }

  /* ----------------------------------------------------------------------
     Inline Markdown + wiki syntax
     -------------------------------------------------------------------- */
  function inline(src) {
    var tokens = [];
    function hold(html) { tokens.push(html); return '\u0000' + (tokens.length - 1) + '\u0000'; }
    var s = esc(src);

    // `code`
    s = s.replace(/`([^`]+)`/g, function (_, c) { return hold('<code>' + c + '</code>'); });
    // [[Page#Section|Label]]
    s = s.replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, function (_, target, label) {
      var raw = target.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      var parts = raw.split('#');
      var title = parts[0].trim(), hash = parts[1] ? slugify(parts[1]) : '';
      var text = label || esc(parts[0].trim() || parts[1]);
      if (!title) return hold('<a href="#' + hash + '">' + text + '</a>');
      var exists = findPage(title) || isCategoryTitle(title) || /^special:/i.test(title) || key(title) === key(MAIN);
      return hold('<a href="' + esc(pageUrl(exists && findPage(title) ? findPage(title).title : title, hash)) +
        '" data-internal' + (exists ? '' : ' class="new" title="' + esc(title) + ' (page does not exist)"') + '>' + text + '</a>');
    });
    // [label](url)
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, url) {
      var ext = /^https?:/i.test(url);
      return hold('<a href="' + url + '"' + (ext ? ' class="external" target="_blank" rel="noopener"' : '') + '>' + label + '</a>');
    });
    // Macros
    s = s.replace(/\{\{unknown\}\}/gi, function () { return hold('<span class="tag tag-unknown">Unknown</span>'); });
    s = s.replace(/\{\{unconfirmed\}\}/gi, function () { return hold('<span class="tag tag-unknown">Unconfirmed</span>'); });
    s = s.replace(/\{\{confirmed\}\}/gi, function () { return hold('<span class="tag tag-confirmed">Confirmed</span>'); });
    s = s.replace(/\{\{tba\}\}/gi, function () { return hold('<span class="tag tag-tba">Not yet documented</span>'); });
    s = s.replace(/\[REDACTED\]/g, function () { return hold('<span class="redacted" title="Redacted">REDACTED</span>'); });
    // ||spoiler||
    s = s.replace(/\|\|(.+?)\|\|/g, function (_, t) {
      return hold('<span class="spoiler-inline" tabindex="0" role="button" title="Click to reveal spoiler">' + t + '</span>');
    });
    // Emphasis
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^\w*])\*(?!\s)(.+?)\*(?!\w)/g, '$1<em>$2</em>');
    s = s.replace(/ -- /g, ' — ');
    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return tokens[+i]; });
  }

  /* ----------------------------------------------------------------------
     Block Markdown
     -------------------------------------------------------------------- */
  var CALLOUTS = {
    unknown:   { label: 'Unknown',            icon: '?' },
    confirmed: { label: 'Confirmed',          icon: '✓' },
    note:      { label: 'Note',               icon: 'i' },
    spoiler:   { label: 'Spoiler',            icon: '!' },
    warning:   { label: 'Warning',            icon: '!' },
    source:    { label: 'Source',             icon: '§' },
    dev:       { label: 'In development',     icon: '◐' }
  };

  function renderGallery(lines) {
    var items = lines.filter(function (l) { return l.trim(); }).map(function (l) {
      var p = l.split('|');
      var src = p[0].trim(), cap = (p.slice(1).join('|') || '').trim();
      if (!src || src === '-' || src.toLowerCase() === 'placeholder') {
        return '<figure class="gallery-item"><div class="img-placeholder"><span>NO IMAGE<br>ON FILE</span></div>' +
          (cap ? '<figcaption>' + inline(cap) + '</figcaption>' : '') + '</figure>';
      }
      return '<figure class="gallery-item"><a href="' + esc(src) + '" class="lightbox-link" data-caption="' + esc(cap.replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1')) + '">' +
        '<img src="' + esc(src) + '" alt="' + esc(cap.replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1')) + '" loading="lazy"></a>' +
        (cap ? '<figcaption>' + inline(cap) + '</figcaption>' : '') + '</figure>';
    });
    return '<div class="gallery">' + items.join('') + '</div>';
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

      // ::: containers
      var c = t.match(/^:::\s*([a-z]+)\s*(.*)$/i);
      if (c) {
        flush();
        var type = c[1].toLowerCase(), title = c[2], inner = [];
        i++;
        while (i < lines.length && lines[i].trim() !== ':::') { inner.push(lines[i]); i++; }
        i++;
        if (type === 'gallery') { out.push(renderGallery(inner)); continue; }
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
        out.push('<div class="callout callout-' + esc(type) + '"><div class="callout-icon" aria-hidden="true">' + info.icon + '</div><div class="callout-body">' +
          '<div class="callout-title">' + inline(title || info.label) + '</div>' + renderBlocks(inner.join('\n'), null) + '</div></div>');
        continue;
      }

      // headings
      var h = t.match(/^(#{2,4})\s+(.+)$/);
      if (h) {
        flush();
        var level = h[1].length, text = h[2].replace(/\s+#+$/, '');
        var id = slugify(text) || 'section';
        if (headings) {
          var n = 2; var base = id;
          while (headings.some(function (x) { return x.id === id; })) id = base + '-' + (n++);
          headings.push({ level: level, text: text, id: id });
        }
        out.push('<h' + level + ' id="' + id + '"><span class="h-text">' + inline(text) + '</span>' +
          (level === 2 ? '<a class="h-anchor" href="#' + id + '" aria-label="Link to this section">¶</a>' : '') + '</h' + level + '>');
        i++; continue;
      }

      // horizontal rule
      if (/^-{3,}$/.test(t)) { flush(); out.push('<hr>'); i++; continue; }

      // macros on their own line
      if (/^\{\{missing\}\}$/i.test(t)) {
        flush();
        out.push('<div class="missing"><span class="missing-stamp">NO RECORD</span> This section has not been documented yet. It will be expanded as information is confirmed.</div>');
        i++; continue;
      }

      // tables
      if (t.charAt(0) === '|') {
        flush();
        var rows = [];
        while (i < lines.length && lines[i].trim().charAt(0) === '|') { rows.push(lines[i]); i++; }
        out.push(renderTable(rows));
        continue;
      }

      // block quote
      if (t.charAt(0) === '>') {
        flush();
        var q = [];
        while (i < lines.length && lines[i].trim().charAt(0) === '>') { q.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
        out.push('<blockquote>' + renderBlocks(q.join('\n'), null) + '</blockquote>');
        continue;
      }

      // lists
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
      .replace(/^:::.*$/gm, ' ')
      .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\{\{[^}]+\}\}/g, ' ')
      .replace(/^\s*\S+\.(jpg|png|gif|webp)\s*\|/gim, ' ')
      .replace(/[#*>|`_]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  /* ----------------------------------------------------------------------
     Loading
     -------------------------------------------------------------------- */
  function loadAll() {
    var files = CFG.articles || [];
    var v = encodeURIComponent(CFG.version || '1');
    return Promise.all(files.map(function (name, index) {
      return fetch(CONTENT_DIR + name + '.md?v=' + v)
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then(function (text) { return buildPage(name, text, index); })
        .catch(function (e) { console.warn('[wiki] Could not load article "' + name + '":', e); return null; });
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
      image: m.image || '',
      caption: m.caption || '',
      spoilers: truthy(m.spoilers),
      stub: truthy(m.stub),
      created: m.created || m.updated || '',
      updated: m.updated || m.created || '',
      infobox: Array.isArray(m.infobox) ? m.infobox : null
    };
    p.text = plainText(p.body);
    if (p.stub && p.categories.indexOf('Stubs') < 0) p.categories.push('Stubs');
    if (p.spoilers && p.categories.indexOf('Articles with spoilers') < 0) p.categories.push('Articles with spoilers');
    return p;
  }

  function indexPages() {
    byKey.clear(); categories.clear();
    pages.forEach(function (p) {
      byKey.set(key(p.title), p);
      p.aliases.forEach(function (a) { if (!byKey.has(key(a))) byKey.set(key(a), p); });
    });
    pages.forEach(function (p) {
      if (p.type === 'category') return;
      p.categories.forEach(function (c) {
        if (!categories.has(c)) categories.set(c, []);
        categories.get(c).push(p);
      });
    });
    // categories that only exist as subcategories still need to be known
    pages.forEach(function (p) {
      if (p.type === 'category' && !categories.has(catName(p.title))) categories.set(catName(p.title), []);
    });
  }

  function contentPages() {
    return pages.filter(function (p) { return p.type !== 'category' && p.type !== 'project'; });
  }
  function categoryPage(name) { return findPage('Category:' + name); }
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

  /* ----------------------------------------------------------------------
     Shared fragments
     -------------------------------------------------------------------- */
  function link(title, label) {
    var p = findPage(title);
    var exists = p || isCategoryTitle(title) || /^special:/i.test(title) || key(title) === key(MAIN);
    return '<a href="' + esc(pageUrl(p ? p.title : title)) + '" data-internal' + (exists ? '' : ' class="new"') + '>' + esc(label || title) + '</a>';
  }

  function breadcrumb(trail) {
    var items = ['<a href="./" data-internal>' + esc(CFG.siteName || 'Wiki') + '</a>'];
    trail.forEach(function (t, i) {
      if (i === trail.length - 1) items.push('<span aria-current="page">' + esc(t[0]) + '</span>');
      else items.push('<a href="' + esc(pageUrl(t[1])) + '" data-internal>' + esc(t[0]) + '</a>');
    });
    return '<nav class="breadcrumb" aria-label="Breadcrumb">' + items.join('<span class="sep" aria-hidden="true">›</span>') + '</nav>';
  }

  function categoryTrail(cat) {
    var chain = [], guard = 0;
    while (cat && guard++ < 6) { chain.unshift([cat, 'Category:' + cat]); cat = categoryParent(cat); }
    return chain;
  }

  var TYPE_LABEL = {
    character: 'Character file', location: 'Location record', lore: 'Lore document',
    game: 'Game information', world: 'World record', category: 'Category index',
    project: 'Wiki project page', article: 'Archive entry', timeline: 'Chronological record'
  };

  function entryNo(p) { return ('000' + (p.order + 1)).slice(-3); }

  function placeholderImg(label) {
    return '<div class="img-placeholder"><span>' + (label || 'NO IMAGE<br>ON FILE') + '</span></div>';
  }

  function thumb(p) {
    return p.image
      ? '<img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy">'
      : placeholderImg('NO IMAGE<br>ON FILE');
  }

  function card(p) {
    return '<a class="card" href="' + esc(pageUrl(p.title)) + '" data-internal>' +
      '<div class="card-img' + (p.type === 'character' ? ' portrait' : '') + '">' + thumb(p) + '</div>' +
      '<div class="card-title">' + esc(p.title) + '</div>' +
      (p.meta.role ? '<div class="card-sub">' + esc(p.meta.role) + '</div>' : '') + '</a>';
  }

  function infobox(p) {
    var rows = p.infobox || [];
    var h = '<aside class="infobox" aria-label="Information box">' +
      '<div class="infobox-title">' + esc(p.meta['infobox-title'] || p.title) + '</div>';
    if (p.image) {
      h += '<figure class="infobox-image"><a href="' + esc(p.image) + '" class="lightbox-link" data-caption="' + esc(p.caption || p.title) + '">' +
        '<img src="' + esc(p.image) + '" alt="' + esc(p.caption || p.title) + '"></a>' +
        (p.caption ? '<figcaption>' + inline(p.caption) + '</figcaption>' : '') + '</figure>';
    } else {
      h += '<figure class="infobox-image">' + placeholderImg('IMAGE<br>PENDING') +
        '<figcaption>' + (p.caption ? inline(p.caption) : 'No image is currently on file.') + '</figcaption></figure>';
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
        var vh = /^(unknown|\?)$/i.test(val) ? '<span class="tag tag-unknown">Unknown</span>'
          : /^(tba|not yet documented|-)$/i.test(val) ? '<span class="tag tag-tba">Not yet documented</span>'
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
    return '<nav class="toc" aria-label="Contents"><div class="toc-head"><span>Contents</span>' +
      '<button type="button" class="toc-toggle" aria-expanded="true">hide</button></div><ol>' + items.join('') + '</ol></nav>';
  }

  function categoryFooter(p) {
    if (!p.categories.length) return '';
    return '<div class="catlinks"><span class="catlinks-label">Categories:</span> ' +
      p.categories.map(function (c) { return link('Category:' + c, c); }).join('<span class="sep">|</span>') + '</div>';
  }

  /* ----------------------------------------------------------------------
     Page renderers
     -------------------------------------------------------------------- */
  function renderArticle(p) {
    var headings = [];
    var bodyHtml = renderBlocks(p.body, headings);
    var tocHtml = toc(headings);
    if (tocHtml) {
      var at = bodyHtml.search(/<h2[ >]/);
      bodyHtml = at >= 0 ? bodyHtml.slice(0, at) + tocHtml + bodyHtml.slice(at) : tocHtml + bodyHtml;
    }
    var primary = p.categories.filter(function (c) { return c !== 'Stubs' && c !== 'Articles with spoilers'; })[0];
    var trail = primary ? categoryTrail(primary) : [];
    if (p.type === 'project') trail = [];
    trail.push([p.title, p.title]);

    var notices = '';
    if (p.spoilers) {
      notices += '<div class="notice notice-spoiler" role="note"><div class="notice-stamp">Classified</div><div>' +
        '<strong>Spoiler warning.</strong> This article contains plot details about <em>The Facility</em>. ' +
        (p.meta['spoiler-note'] ? inline(p.meta['spoiler-note']) : 'Read at your own discretion.') + '</div></div>';
    }
    if (p.stub) {
      notices += '<div class="notice notice-stub" role="note"><div class="notice-stamp">Incomplete</div><div>' +
        '<strong>This article is a stub.</strong> Very little about this subject has been confirmed. ' +
        'It will be expanded as official information becomes available.</div></div>';
    }

    var typeLabel = TYPE_LABEL[p.type] || TYPE_LABEL.article;
    document.title = p.title + ' | ' + (CFG.siteName || 'Wiki');

    return breadcrumb(trail) +
      '<article class="article page-' + esc(p.type) + '">' +
      '<header class="article-head">' +
        '<div class="file-strip"><span>' + esc(typeLabel) + '</span><span>Wiki entry No. ' + entryNo(p) + '</span></div>' +
        '<h1 class="page-title">' + esc(p.title) + '</h1>' +
        (p.meta.subtitle ? '<div class="page-subtitle">' + inline(p.meta.subtitle) + '</div>' : '') +
      '</header>' +
      notices +
      '<div class="article-body">' +
        (p.infobox || p.image ? infobox(p) : '') +
        '<div class="prose">' + bodyHtml + '</div>' +
      '</div>' +
      '<footer class="article-foot">' + categoryFooter(p) +
        '<div class="lastmod">This page was last updated on ' + fmtDate(p.updated) + '.</div>' +
      '</footer>' +
      '</article>';
  }

  function renderCategory(name) {
    var cp = categoryPage(name);
    var members = (categories.get(name) || []).slice().sort(function (a, b) { return a.title.localeCompare(b.title); });
    var deep = membersDeep(name).sort(function (a, b) { return a.title.localeCompare(b.title); });
    var subs = subcategories(name);
    var trail = categoryTrail(name);
    document.title = 'Category:' + name + ' | ' + (CFG.siteName || 'Wiki');

    var intro = cp ? renderBlocks(cp.body, null) : '<p>This category lists all pages filed under <strong>' + esc(name) + '</strong>.</p>';
    var gallery = deep.length
      ? '<div class="card-grid">' + deep.map(card).join('') + '</div>'
      : '<div class="missing"><span class="missing-stamp">EMPTY</span> There are currently no pages in this category.</div>';

    var alpha = '';
    if (members.length) {
      var groups = {};
      members.forEach(function (p) {
        var L = p.title.charAt(0).toUpperCase();
        (groups[L] = groups[L] || []).push(p);
      });
      alpha = '<h2 id="pages">Pages in category “' + esc(name) + '”</h2><p class="muted">The following ' + members.length +
        ' page' + (members.length === 1 ? ' is' : 's are') + ' in this category.</p><div class="alpha-list">' +
        Object.keys(groups).sort().map(function (L) {
          return '<div class="alpha-group"><h3>' + esc(L) + '</h3><ul>' + groups[L].map(function (p) {
            return '<li>' + link(p.title) + '</li>';
          }).join('') + '</ul></div>';
        }).join('') + '</div>';
    }

    var subHtml = subs.length ? '<h2 id="subcategories">Subcategories</h2><ul class="subcats">' + subs.map(function (s) {
      var n = membersDeep(s).length;
      return '<li>' + link('Category:' + s, s) + ' <span class="muted">(' + n + (n === 1 ? ' page' : ' pages') + ')</span></li>';
    }).join('') + '</ul>' : '';

    return breadcrumb(trail) +
      '<article class="article page-category">' +
      '<header class="article-head"><div class="file-strip"><span>Category index</span><span>' + deep.length + ' entries</span></div>' +
      '<h1 class="page-title"><span class="title-ns">Category:</span>' + esc(name) + '</h1></header>' +
      '<div class="prose">' + intro + '</div>' +
      gallery + subHtml + '<div class="prose">' + alpha + '</div>' +
      (cp && cp.meta.parent ? '<footer class="article-foot"><div class="catlinks"><span class="catlinks-label">Parent category:</span> ' +
        link('Category:' + cp.meta.parent, cp.meta.parent) + '</div></footer>' : '') +
      '</article>';
  }

  function excerpt(p, n) {
    var s = p.summary || p.text;
    n = n || 220;
    return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s;
  }

  function renderMain() {
    var M = CFG.mainPage || {};
    document.title = (CFG.siteName || 'Wiki');
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

    var stats = all.length + ' articles · ' + Array.from(categories.keys()).length + ' categories';

    return '<div class="mainpage">' +
      '<section class="mp-welcome">' +
        '<div class="mp-welcome-text">' +
          '<div class="file-strip"><span>Public archive</span><span>' + esc(stats) + '</span></div>' +
          '<h1>Welcome to <span>' + esc(CFG.siteName || 'the Wiki') + '</span></h1>' +
          (M.intro || []).map(function (t) { return '<p>' + inline(t) + '</p>'; }).join('') +
        '</div>' +
        '<nav class="mp-shortcuts" aria-label="Browse">' + (M.shortcuts || []).map(function (s) {
          return '<a href="' + esc(pageUrl(s[1])) + '" data-internal>' + esc(s[0]) + '</a>';
        }).join('') + '</nav>' +
      '</section>' +
      '<div class="notice notice-spoiler mp-spoiler" role="note"><div class="notice-stamp">Notice</div><div>' +
        '<strong>Spoiler warning.</strong> Some articles on this wiki contain story spoilers for <em>The Facility</em>. ' +
        'Articles with spoilers are marked at the top of the page and listed in ' + link('Category:Articles with spoilers', 'this category') + '.</div></div>' +
      '<div class="mp-columns">' +
        '<div class="mp-main">' +
          (feat ? '<section class="mp-box"><h2 class="mp-h">Featured article</h2>' +
            '<div class="featured"><a class="featured-img" href="' + esc(pageUrl(feat.title)) + '" data-internal>' + thumb(feat) + '</a>' +
            '<div class="featured-text"><h3>' + link(feat.title) + '</h3><p>' + esc(excerpt(feat, 420)) + '</p>' +
            '<p class="more">' + link(feat.title, 'Read the full article →') + '</p></div></div></section>' : '') +
          '<section class="mp-box"><h2 class="mp-h">Featured characters</h2>' + cards(M.featuredCharacters) +
            '<p class="more">' + link('Category:Characters', 'All characters →') + '</p></section>' +
          '<section class="mp-box"><h2 class="mp-h">Important locations</h2>' + cards(M.importantLocations) +
            '<p class="more">' + link('Category:Locations', 'All locations →') + '</p></section>' +
          '<section class="mp-box"><h2 class="mp-h">Lore &amp; the world</h2>' + loreList(M.lore) +
            '<p class="more">' + link('Category:Lore', 'All lore articles →') + '</p></section>' +
        '</div>' +
        '<aside class="mp-side">' +
          '<section class="mp-box"><h2 class="mp-h">Latest additions</h2><ul class="recent">' + recent.map(function (p) {
            return '<li>' + link(p.title) + '<span class="muted">' + fmtDate(p.created) + '</span></li>';
          }).join('') + '</ul><p class="more">' + link('Special:RecentChanges', 'Recent changes →') + '</p></section>' +
          '<section class="mp-box"><h2 class="mp-h">Game information</h2><ul class="plain">' +
            ['Gameplay', 'Assignments', 'Tests & Detection Methods', 'Night Events', 'Endings'].map(function (t) { return '<li>' + link(t) + '</li>'; }).join('') +
          '</ul></section>' +
          '<section class="mp-box mp-legend"><h2 class="mp-h">Reading this wiki</h2>' +
            '<p>Only information confirmed by the developers is presented as fact. Everything else is marked:</p>' +
            '<ul class="plain legend"><li><span class="tag tag-unknown">Unknown</span> not established in canon</li>' +
            '<li><span class="tag tag-tba">Not yet documented</span> awaiting information</li>' +
            '<li><span class="tag tag-confirmed">Confirmed</span> stated by the developers</li></ul>' +
            '<p class="more">' + link('The Facility Wiki:About', 'About this wiki →') + '</p></section>' +
          '<section class="mp-box"><h2 class="mp-h">Official links</h2><ul class="plain">' +
            (CFG.links && CFG.links.steam ? '<li><a class="external" href="' + esc(CFG.links.steam) + '" target="_blank" rel="noopener">The Facility on Steam</a></li>' : '') +
            (CFG.links && CFG.links.presskit ? '<li><a href="' + esc(CFG.links.presskit) + '">Press kit</a></li>' : '') +
            (CFG.links && CFG.links.studio ? '<li><a href="' + esc(CFG.links.studio) + '">Veinstone Studios</a></li>' : '') +
          '</ul></section>' +
        '</aside>' +
      '</div></div>';
  }

  /* ---------- Search ---------- */
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function search(q, includeMeta) {
    var nq = norm(q).trim();
    if (!nq) return [];
    var terms = nq.split(/\s+/).filter(Boolean);
    var res = [];
    pages.forEach(function (p) {
      if (p.type === 'project' && !includeMeta) return;
      var t = norm(p.title), al = norm(p.aliases.join(' ')), sm = norm(p.summary),
          ct = norm(p.categories.join(' ')), bd = norm(p.text);
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
        var c = bd.split(x).length - 1; s += Math.min(c, 8);
      });
      if (p.type === 'category') s -= 5;
      res.push({ page: p, score: s });
    });
    return res.sort(function (a, b) { return b.score - a.score || a.page.title.localeCompare(b.page.title); });
  }

  function highlight(text, q) {
    var terms = norm(q).split(/\s+/).filter(function (t) { return t.length > 1; });
    var h = esc(text);
    terms.forEach(function (t) {
      h = h.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>');
    });
    return h;
  }

  function snippet(p, q) {
    var text = p.text, nt = norm(text);
    var first = norm(q).split(/\s+/).filter(Boolean)[0] || '';
    var at = first ? nt.indexOf(first) : -1;
    if (at < 0) return excerpt(p, 200);
    var start = Math.max(0, at - 80);
    var s = text.slice(start, at + 140);
    return (start > 0 ? '…' : '') + s.replace(/^\S*\s/, start > 0 ? '' : '$&') + '…';
  }

  function renderSearch(q) {
    document.title = 'Search results' + (q ? ' for “' + q + '”' : '') + ' | ' + (CFG.siteName || 'Wiki');
    var results = search(q, true);
    var exact = findPage(q);
    var body;
    if (!q) body = '<p>Enter a term in the search box at the top of the page.</p>';
    else if (!results.length) body = '<div class="missing"><span class="missing-stamp">NO MATCH</span> No articles match “' + esc(q) + '”. ' +
      'Try a different spelling, or browse ' + link('Special:AllPages', 'all pages') + '.</div>';
    else body = '<p class="muted">' + results.length + ' result' + (results.length === 1 ? '' : 's') + ' for “' + esc(q) + '”.</p>' +
      '<ol class="search-results">' + results.map(function (r) {
        var p = r.page;
        return '<li><div class="sr-title">' + link(p.title) + ' <span class="sr-type">' + esc(TYPE_LABEL[p.type] || '') + '</span></div>' +
          '<div class="sr-snippet">' + highlight(snippet(p, q), q) + '</div>' +
          '<div class="sr-cats muted">' + esc(p.categories.join(' · ')) + '</div></li>';
      }).join('') + '</ol>';
    return breadcrumb([['Search', 'Special:Search']]) +
      '<article class="article"><header class="article-head"><div class="file-strip"><span>Archive query</span><span>Special page</span></div>' +
      '<h1 class="page-title">Search results</h1></header>' +
      '<form class="search-page-form" role="search" data-search-page><input type="search" name="q" value="' + esc(q) + '" aria-label="Search the wiki">' +
      '<button type="submit">Search</button></form>' +
      (exact && q ? '<p class="exact">There is a page named ' + link(exact.title) + ' on this wiki.</p>' : '') +
      body + '</article>';
  }

  function renderAllPages() {
    document.title = 'All pages | ' + (CFG.siteName || 'Wiki');
    var list = pages.slice().sort(function (a, b) { return a.title.localeCompare(b.title); });
    return breadcrumb([['All pages', 'Special:AllPages']]) +
      '<article class="article"><header class="article-head"><div class="file-strip"><span>Archive index</span><span>' + list.length + ' pages</span></div>' +
      '<h1 class="page-title">All pages</h1></header><div class="prose"><ul class="columns">' +
      list.map(function (p) { return '<li>' + link(p.title) + '</li>'; }).join('') + '</ul></div></article>';
  }

  function renderCategories() {
    document.title = 'Categories | ' + (CFG.siteName || 'Wiki');
    var names = Array.from(categories.keys()).sort();
    return breadcrumb([['Categories', 'Special:Categories']]) +
      '<article class="article"><header class="article-head"><div class="file-strip"><span>Archive index</span><span>' + names.length + ' categories</span></div>' +
      '<h1 class="page-title">Categories</h1></header><div class="prose"><ul class="columns">' +
      names.map(function (n) { return '<li>' + link('Category:' + n, n) + ' <span class="muted">(' + membersDeep(n).length + ')</span></li>'; }).join('') +
      '</ul></div></article>';
  }

  function renderRecent() {
    document.title = 'Recent changes | ' + (CFG.siteName || 'Wiki');
    var list = pages.slice().sort(function (a, b) {
      return (b.updated || '').localeCompare(a.updated || '') || a.title.localeCompare(b.title);
    });
    var groups = {};
    list.forEach(function (p) { (groups[p.updated || 'Undated'] = groups[p.updated || 'Undated'] || []).push(p); });
    return breadcrumb([['Recent changes', 'Special:RecentChanges']]) +
      '<article class="article"><header class="article-head"><div class="file-strip"><span>Revision log</span><span>Special page</span></div>' +
      '<h1 class="page-title">Recent changes</h1></header><div class="prose">' +
      Object.keys(groups).sort().reverse().map(function (d) {
        return '<h2>' + fmtDate(d) + '</h2><ul>' + groups[d].map(function (p) {
          return '<li>' + link(p.title) + (p.created === p.updated ? ' <span class="tag tag-new">new</span>' : '') +
            (p.summary ? ' <span class="muted">— ' + esc(excerpt(p, 90)) + '</span>' : '') + '</li>';
        }).join('') + '</ul>';
      }).join('') + '</div></article>';
  }

  function renderNotFound(title) {
    document.title = 'Page not found | ' + (CFG.siteName || 'Wiki');
    var results = search(title).slice(0, 6);
    return breadcrumb([[title, title]]) +
      '<article class="article page-404"><header class="article-head"><div class="file-strip"><span>Error 404</span><span>Record missing</span></div>' +
      '<h1 class="page-title">' + esc(title) + '</h1></header>' +
      '<div class="notfound"><div class="stamp-big">FILE NOT FOUND</div>' +
      '<p>There is currently no article titled <strong>“' + esc(title) + '”</strong> in this archive. ' +
      'The record may have been moved, renamed, or never existed.</p>' +
      (results.length ? '<p>Perhaps you were looking for:</p><ul>' + results.map(function (r) { return '<li>' + link(r.page.title) + '</li>'; }).join('') + '</ul>' : '') +
      '<p>' + link(MAIN, 'Return to the Main Page') + ' · ' + link('Special:AllPages', 'Browse all pages') + ' · ' +
      '<a href="' + esc(pageUrl('Special:Search') + '&q=' + encodeURIComponent(title)) + '" data-internal>Search for “' + esc(title) + '”</a></p></div></article>';
  }

  /* ----------------------------------------------------------------------
     Router
     -------------------------------------------------------------------- */
  function route() {
    var params = new URLSearchParams(location.search);
    var title = (params.get('page') || MAIN).replace(/_/g, ' ').trim();
    var q = params.get('q') || '';
    var html;

    if (key(title) === key(MAIN)) html = renderMain();
    else if (/^special:search$/i.test(title)) html = renderSearch(q);
    else if (/^special:allpages$/i.test(title)) html = renderAllPages();
    else if (/^special:categories$/i.test(title)) html = renderCategories();
    else if (/^special:recentchanges$/i.test(title)) html = renderRecent();
    else if (/^special:random$/i.test(title)) {
      var pool = contentPages();
      var pick = pool[Math.floor(Math.random() * pool.length)];
      history.replaceState(null, '', pageUrl(pick.title));
      return route();
    }
    else if (isCategoryTitle(title)) {
      var name = catName(title);
      var known = categories.has(name) || categoryPage(name);
      if (!known) {
        // case-insensitive match
        Array.from(categories.keys()).forEach(function (k) { if (key(k) === key(name)) { name = k; known = true; } });
      }
      html = known ? renderCategory(name) : renderNotFound(title);
    } else {
      var p = findPage(title);
      if (p && key(p.title) !== key(title)) {
        // alias: update the address bar to the canonical title
        history.replaceState(null, '', pageUrl(p.title) + location.hash);
      }
      html = p ? renderArticle(p) : renderNotFound(title);
    }

    app.innerHTML = html;
    app.removeAttribute('aria-busy');
    markActiveNav();
    if (searchInput && !/^special:search$/i.test(title)) searchInput.value = '';
    if (searchInput && /^special:search$/i.test(title)) searchInput.value = q;
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
     Sidebar
     -------------------------------------------------------------------- */
  function buildSidebar() {
    var groups = CFG.sidebar || [];
    sidebarEl.innerHTML = groups.map(function (g, gi) {
      return '<details class="nav-group" open><summary>' + esc(g.heading) + '</summary><ul>' +
        g.links.map(function (l) {
          return '<li><a href="' + esc(pageUrl(l[1])) + '" data-internal data-target="' + esc(key(l[1])) + '">' + esc(l[0]) + '</a></li>';
        }).join('') + '</ul></details>';
    }).join('');
  }

  function markActiveNav() {
    var params = new URLSearchParams(location.search);
    var cur = key(params.get('page') || MAIN);
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
     Search suggestions
     -------------------------------------------------------------------- */
  var sel = -1, current = [];
  function renderSuggest() {
    var q = searchInput.value.trim();
    if (!q) { hideSuggest(); return; }
    current = search(q).slice(0, 8);
    sel = -1;
    var items = current.map(function (r, i) {
      var p = r.page;
      return '<li role="option" id="sugg-' + i + '" data-i="' + i + '"><a href="' + esc(pageUrl(p.title)) + '" data-internal tabindex="-1">' +
        '<span class="sugg-thumb">' + (p.image ? '<img src="' + esc(p.image) + '" alt="">' : '<span class="sugg-noimg"></span>') + '</span>' +
        '<span class="sugg-text"><span class="sugg-title">' + highlight(p.title, q) + '</span>' +
        '<span class="sugg-meta">' + esc(TYPE_LABEL[p.type] || '') + (p.summary ? ' — ' + esc(excerpt(p, 70)) : '') + '</span></span></a></li>';
    });
    items.push('<li role="option" class="sugg-all" id="sugg-' + current.length + '" data-i="' + current.length + '"><a href="' +
      esc(pageUrl('Special:Search') + '&q=' + encodeURIComponent(q)) + '" data-internal tabindex="-1">Search for pages containing <strong>' + esc(q) + '</strong></a></li>');
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
    go(exact ? pageUrl(exact.title) : pageUrl('Special:Search') + '&q=' + encodeURIComponent(q));
  }

  /* ----------------------------------------------------------------------
     Lightbox
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
    lbCap.textContent = (a.getAttribute('data-caption') || '') + (lbSet.length > 1 ? ' (' +(lbIndex + 1) + ' / ' + lbSet.length + ')' : '');
    lb.classList.toggle('single', lbSet.length < 2);
  }
  function closeLightbox() { lb.hidden = true; lbImg.src = ''; document.body.classList.remove('lb-open'); }

  /* ----------------------------------------------------------------------
     Events
     -------------------------------------------------------------------- */
  function bind() {
    document.addEventListener('click', function (e) {
      var sp = e.target.closest('.spoiler-inline');
      if (sp) { sp.classList.add('revealed'); return; }

      var tt = e.target.closest('.toc-toggle');
      if (tt) {
        var tocEl = tt.closest('.toc');
        var hidden = tocEl.classList.toggle('collapsed');
        tt.textContent = hidden ? 'show' : 'hide';
        tt.setAttribute('aria-expanded', String(!hidden));
        return;
      }

      var lbl = e.target.closest('.lightbox-link');
      if (lbl && !e.ctrlKey && !e.metaKey) { e.preventDefault(); openLightbox(lbl); return; }

      var a = e.target.closest('a[data-internal]');
      if (a && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
        var url = new URL(a.href, location.href);
        if (url.pathname === location.pathname && url.search === location.search && url.hash) return; // in-page anchor
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
        if (e.key === 'ArrowRight') { lbIndex = (lbIndex + 1) % lbSet.length; showLb(); }
        if (e.key === 'ArrowLeft') { lbIndex = (lbIndex - 1 + lbSet.length) % lbSet.length; showLb(); }
        return;
      }
      if (e.key === 'Escape') closeNav();
      if (e.key === '/' && document.activeElement === document.body) { e.preventDefault(); searchInput.focus(); }
    });

    document.addEventListener('submit', function (e) {
      var f = e.target;
      if (f.matches('[data-search-page]')) { e.preventDefault(); submitSearch(f.q.value); }
    });

    window.addEventListener('popstate', route);

    // Header search
    var form = document.getElementById('searchform');
    form.addEventListener('submit', function (e) {
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
      if (e.target.closest('.lb-next')) { lbIndex = (lbIndex + 1) % lbSet.length; showLb(); return; }
      if (e.target.closest('.lb-prev')) { lbIndex = (lbIndex - 1 + lbSet.length) % lbSet.length; showLb(); return; }
      if (e.target === lb || e.target.closest('.lb-close')) closeLightbox();
    });
  }

  /* ----------------------------------------------------------------------
     Boot
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
      app.innerHTML = '<div class="notice notice-spoiler"><div class="notice-stamp">Offline</div><div><strong>The wiki needs a web server.</strong> ' +
        'Browsers block loading article files directly from disk. It works on GitHub Pages, or locally with a static server ' +
        '(for example <code>npx serve</code> or <code>python -m http.server</code> in the repository folder).</div></div>';
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
