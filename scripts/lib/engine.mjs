/**
 * Template engine + markdown renderer shared by build.mjs.
 *
 * Template syntax: {{path}}, {{join path "sep"}}, {{#each x}}...{{/each}},
 * {{#if x}}...{{else}}...{{/if}}, with @index/@key/@first/@last/@odd meta
 * inside #each and `this` for the current item.
 */

export function resolvePath(scopes, path) {
  if (path === "this") {
    for (let i = scopes.length - 1; i >= 0; i--) {
      if (scopes[i] && "__value" in scopes[i]) return scopes[i].__value;
    }
    return undefined;
  }
  if (path.startsWith("@")) {
    for (let i = scopes.length - 1; i >= 0; i--) {
      const s = scopes[i];
      if (s && s.__meta && path in s.__meta) return s.__meta[path];
      if (s && path in s) return s[path];
    }
    return undefined;
  }
  const parts = path.split(".");
  for (let i = scopes.length - 1; i >= 0; i--) {
    let v = scopes[i];
    let ok = true;
    for (const part of parts) {
      if (v == null || !(part in Object(v))) { ok = false; break; }
      v = v[part];
    }
    if (ok) return v;
  }
  return undefined;
}

export function truthy(v) {
  if (v == null || v === false || v === "") return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

export function tokenize(tpl) {
  const tokens = [];
  const re = /\{\{([\s\S]*?)\}\}/g;
  let m, last = 0;
  while ((m = re.exec(tpl))) {
    if (m.index > last) tokens.push({ t: "text", v: tpl.slice(last, m.index) });
    const body = m[1].trim();
    if (body.startsWith("#each ")) tokens.push({ t: "each", path: body.slice(6).trim() });
    else if (body === "/each") tokens.push({ t: "closeEach" });
    else if (body.startsWith("#if ")) tokens.push({ t: "if", path: body.slice(4).trim() });
    else if (body === "/if") tokens.push({ t: "closeIf" });
    else if (body === "else") tokens.push({ t: "else" });
    else if (body.startsWith("join ")) {
      const mm = body.match(/^join\s+([\w.@]+)\s+"([^"]*)"$/);
      tokens.push({ t: "join", path: mm ? mm[1] : "", sep: mm ? mm[2] : " " });
    } else tokens.push({ t: "value", path: body });
    last = m.index + m[0].length;
  }
  if (last < tpl.length) tokens.push({ t: "text", v: tpl.slice(last, tpl.length) });
  return tokens;
}

export function parseBlocks(tokens, stop) {
  const nodes = [];
  while (tokens.length) {
    const tok = tokens.shift();
    if (tok.t === stop) return nodes;
    if (tok.t === "each") {
      const children = parseBlocks(tokens, "closeEach");
      nodes.push({ t: "each", path: tok.path, children });
    } else if (tok.t === "if") {
      const children = parseBlocks(tokens, "closeIf");
      const elseIdx = children.findIndex((c) => c.t === "else");
      const then = elseIdx === -1 ? children : children.slice(0, elseIdx);
      const els = elseIdx === -1 ? [] : children.slice(elseIdx + 1);
      nodes.push({ t: "if", path: tok.path, then, els });
    } else if (tok.t === "else") {
      nodes.push({ t: "else" });
    } else nodes.push(tok);
  }
  return nodes;
}

export function valueOr(v) { return v == null ? "" : String(v); }

export function renderNodes(nodes, scopes) {
  let out = "";
  for (const n of nodes) {
    if (n.t === "text") out += n.v;
    else if (n.t === "value") out += valueOr(resolvePath(scopes, n.path));
    else if (n.t === "join") {
      const v = resolvePath(scopes, n.path);
      out += Array.isArray(v) ? v.join(n.sep) : valueOr(v);
    } else if (n.t === "each") {
      const list = resolvePath(scopes, n.path);
      if (list == null) continue;
      const entries = Array.isArray(list)
        ? list.map((v, i) => ({ v, k: undefined, i }))
        : Object.entries(list).map(([k, v], i) => ({ v, k, i }));
      for (const { v, k, i } of entries) {
        const meta = { "@index": i, "@odd": i % 2 === 1, "@first": i === 0, "@last": i === entries.length - 1 };
        if (k !== undefined) meta["@key"] = k;
        const itemScope = typeof v === "object" && v !== null ? { ...v } : {};
        itemScope.__value = v;
        itemScope.__meta = meta;
        out += renderNodes(n.children, [...scopes, itemScope]);
      }
    } else if (n.t === "if") {
      out += renderNodes(truthy(resolvePath(scopes, n.path)) ? n.then : n.els, scopes);
    }
  }
  return out;
}

export function render(tpl, scopes) {
  const nodes = parseBlocks(tokenize(tpl));
  return renderNodes(nodes, scopes);
}

/* ------------------------------------------------------------------ */
/* Markdown → HTML (blog posts)                                        */
/* ------------------------------------------------------------------ */

export function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function inlineMd(s) {
  return s
    .replace(/`([^`]+)`/g, (_, c) => "<code>" + escHtml(c) + "</code>")
    .replace(/!\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<img src="${escHtml(u)}" alt="${t}" loading="lazy">`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
      const ext = /^https?:\/\//i.test(u);
      return '<a href="' + escHtml(u) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + t + "</a>";
    });
}

export function stripMd(s) {
  return s
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function mdToHtml(md) {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let i = 0;

  const para = () => {
    const buf = [];
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === "") break;
      if (/^(#{1,6}\s|\s*```|>\s?|[-*+]\s+|\d+[.)]\s+|\s*[-*_]\s*[-*_]\s*[-*_]+\s*$|\|)/.test(line)) break;
      buf.push(line.trim());
      i++;
    }
    if (buf.length) out.push("<p>" + inlineMd(escHtml(buf.join("\n"))).replace(/\n/g, "<br>\n") + "</p>");
  };

  const renderList = (items) => {
    let html = "";
    let j = 0;
    while (j < items.length) {
      const tag = items[j].type;
      const group = [];
      while (j < items.length && items[j].type === tag) group.push(items[j++]);
      const start = tag === "ol" && group[0].num !== undefined ? ` start="${group[0].num}"` : "";
      html += "<" + tag + start + ">" + group
        .map((it) => "<li>" + inlineMd(escHtml(it.text)) + (it.items.length ? renderList(it.items) : "") + "</li>")
        .join("") + "</" + tag + ">";
    }
    return html;
  };

  const list = () => {
    const root = [];
    const stack = [{ indent: -1, items: root }];
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === "") break;
      const m = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
      if (!m) break;
      const indent = m[1].length;
      const isOl = /^\d+[.)]$/.test(m[2]);
      const num = isOl ? parseInt(m[2], 10) : undefined;
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
      const item = { text: m[3], type: isOl ? "ol" : "ul", num, items: [] };
      stack[stack.length - 1].items.push(item);
      stack.push({ indent, items: item.items });
      i++;
    }
    out.push(renderList(root));
  };

  const table = () => {
    const rows = [];
    while (i < lines.length && lines[i].includes("|")) { rows.push(lines[i]); i++; }
    if (rows.length < 2) return;
    const split = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    const head = split(rows[0]);
    const body = rows.slice(1).filter((r) => !/^\s*\|?[\s:|-]+\|?\s*$/.test(r));
    let html = "<table><thead><tr>";
    head.forEach((c) => { html += "<th>" + inlineMd(escHtml(c)) + "</th>"; });
    html += "</tr></thead><tbody>";
    body.forEach((r) => {
      html += "<tr>";
      split(r).forEach((c) => { html += "<td>" + inlineMd(escHtml(c)) + "</td>"; });
      html += "</tr>";
    });
    out.push(html + "</tbody></table>");
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") { i++; continue; }

    const fence = line.match(/^\s*```(\w*)\s*$/);
    if (fence) {
      i++;
      const code = [];
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) code.push(lines[i++]);
      i++;
      const body = code.join("\n");
      const isDiagram = /[┌└├│─▼►]/.test(body);
      const lang = (fence[1] || "").toLowerCase();
      const label = !isDiagram ? ` data-lang="${escHtml(lang || "code")}"` : "";
      out.push(`<pre class="${isDiagram ? "diagram" : "code"}"${label}><code>${escHtml(body)}</code></pre>`);
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      out.push("<h" + h[1].length + ">" + inlineMd(escHtml(h[2])) + "</h" + h[1].length + ">");
      i++;
      continue;
    }

    if (/^\s*[-*_]\s*[-*_]\s*[-*_]+\s*$/.test(line)) { out.push("<hr>"); i++; continue; }

    const bq = line.match(/^>\s?(.*)$/);
    if (bq) {
      const q = [];
      while (i < lines.length && /^>\s?(.*)$/.test(lines[i])) q.push(lines[i++].match(/^>\s?(.*)$/)[1]);
      out.push("<blockquote>" + inlineMd(escHtml(q.join(" "))) + "</blockquote>");
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) { list(); continue; }
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])) { table(); continue; }

    const img = line.match(/^!\[([^\]]+)\]\(([^)\s]+)\)\s*$/);
    if (img) {
      out.push(`<img class="post-image" src="${escHtml(img[2])}" alt="${escHtml(img[1])}" loading="lazy">`);
      i++;
      continue;
    }

    para();
  }

  return out
    .join("\n")
    .replace(/\{\{/g, "&#123;&#123;")
    .replace(/\}\}/g, "&#125;&#125;");
}
