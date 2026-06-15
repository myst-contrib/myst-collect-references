/**
 * myst-collect-references: directives that collect page-scoped references
 * (glossaries, abbreviations, footnotes) from every Markdown file in the
 * project and show them in one de-duplicated, sorted list.
 *
 * It does not create new references - it only gathers what already exists.
 * There's one exception to this:
 *   Citations are handled by creating a hidden block of "cite" nodes, one
 *   for each that's collected from other pages. This makes the "References"
 *   section at the bottom of a page show the citations from the whole project.
 *   TODO: This is very hacky, we should fix this upstream! See jupyter-book/mystmd#2951
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

// --- file discovery ---------------------------------------------------------

// hacky: naive recursive glob of *.md, skipping build/dep dirs. Swap for
// the project TOC if a file should ever be aggregated that the glob misses.
function mdFiles(root) {
  const out = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    if (entry.name === "_build") continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) out.push(...mdFiles(full));
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

// Map a source path to the page URL MyST will serve it at: drop the extension
// and a trailing /index. hacky: assumes default slug = filename.
export function pageUrl(root, file) {
  let slug = path.relative(root, file).replace(/\\/g, "/").replace(/\.md$/, "");
  slug = slug.replace(/(^|\/)index$/, "");
  return "/" + slug;
}

// --- AST helpers ------------------------------------------------------------

function walk(node, type, found = []) {
  if (!node || typeof node !== "object") return found;
  if (node.type === type) found.push(node);
  for (const child of node.children ?? []) walk(child, type, found);
  return found;
}

function plainText(node) {
  if (!node) return "";
  if (node.value) return node.value;
  return (node.children ?? []).map(plainText).join("");
}

// Pull a flat `abbreviations:` mapping out of the YAML frontmatter block.
// hacky: handles the common `KEY: expansion` form only; use a YAML
// parser if abbreviations ever need nested values.
export function frontmatterAbbreviations(text) {
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return [];
  const lines = fm[1].split("\n");
  const start = lines.findIndex((l) => /^abbreviations:\s*$/.test(l));
  if (start === -1) return [];
  const out = [];
  for (const line of lines.slice(start + 1)) {
    const m = line.match(/^\s+(['"]?)(.+?)\1:\s*(.+?)\s*$/);
    if (!m) break; // first non-indented line ends the block
    out.push([m[2], m[3]]);
  }
  return out;
}

// --- shared AST node builders -----------------------------------------------

const text = (value) => ({ type: "text", value });

// pairs: [[termNodes, descNodes], ...] - each side an array of AST nodes.
function definitionList(pairs) {
  const children = [];
  for (const [term, desc] of pairs) {
    children.push({ type: "definitionTerm", children: term });
    children.push({ type: "definitionDescription", children: desc });
  }
  return [{ type: "definitionList", children }];
}

// --- collection -------------------------------------------------------------

// Pages that use our own directives - parsing them would re-run this plugin
// and recurse forever, and they hold no source references anyway.
const SELF = /\{collect-[\w-]+\}/;

// Parse every project page once and hand each tree to `collect`.
function eachTree(vfile, ctx, collect) {
  const root = vfile?.cwd || process.cwd();
  for (const file of mdFiles(root)) {
    const raw = readFileSync(file, "utf8");
    if (SELF.test(raw)) continue;
    collect(ctx.parseMyst(raw), raw, pageUrl(root, file));
  }
}

// --- directives -------------------------------------------------------------

const glossaryList = {
  name: "collect-glossary",
  doc: "Collect all glossary terms across the project into one sorted list.",
  run(_data, vfile, ctx) {
    const byTerm = new Map();
    eachTree(vfile, ctx, (tree) => {
      // Only terms inside a `{glossary}` directive, not plain definition lists.
      for (const gloss of walk(tree, "glossary")) {
        const kids = walk(gloss, "definitionList")[0]?.children ?? [];
        for (let i = 0; i + 1 < kids.length; i += 2) {
          const term = kids[i];
          const desc = kids[i + 1];
          if (term.type !== "definitionTerm") continue;
          const key = plainText(term).trim().toLowerCase();
          if (key && !byTerm.has(key)) {
            byTerm.set(key, [term.children ?? [], desc.children ?? []]);
          }
        }
      }
    });
    const pairs = [...byTerm.keys()].sort().map((k) => byTerm.get(k));
    return pairs.length ? definitionList(pairs) : [];
  },
};

const abbreviationList = {
  name: "collect-abbreviations",
  doc: "Collect all abbreviations (from page frontmatter) into one sorted list.",
  run(_data, vfile, ctx) {
    const byAbbr = new Map();
    eachTree(vfile, ctx, (_tree, raw) => {
      for (const [abbr, expansion] of frontmatterAbbreviations(raw)) {
        if (!byAbbr.has(abbr)) byAbbr.set(abbr, expansion);
      }
    });
    const pairs = [...byAbbr.keys()]
      .sort()
      .map((k) => [[text(k)], [text(byAbbr.get(k))]]);
    return pairs.length ? definitionList(pairs) : [];
  },
};

const footnoteList = {
  name: "collect-footnotes",
  doc: "Collect every footnote across the project, with a link back to its page.",
  run(_data, vfile, ctx) {
    const notes = [];
    eachTree(vfile, ctx, (tree, _raw, url) => {
      for (const def of walk(tree, "footnoteDefinition")) {
        notes.push({ url, label: def.label ?? def.identifier, def });
      }
    });
    notes.sort((a, b) => a.url.localeCompare(b.url) || a.label.localeCompare(b.label));
    const items = notes.map(({ url, def }) => {
      const back = { type: "link", url, children: [text("(source)")] };
      // These parsed nodes are ours alone, so append the backlink in place.
      const body = def.children ?? [];
      const last = body[body.length - 1];
      if (last?.type === "paragraph") last.children.push(text(" "), back);
      else body.push({ type: "paragraph", children: [back] });
      return { type: "listItem", children: body };
    });
    return notes.length ? [{ type: "list", ordered: false, children: items }] : [];
  },
};

// At parse time a table's caption is already a `caption` node, but a figure's
// is still a plain trailing `paragraph` (MyST wraps it later). Handle both.
export function captionText(node) {
  const cap = walk(node, "caption")[0];
  if (cap) return plainText(cap).trim();
  const paras = (node.children ?? []).filter((c) => c.type === "paragraph");
  return plainText(paras[paras.length - 1]).trim();
}

// Figures and tables are both captioned `container` nodes - same collection
// logic, only the `kind` differs. A labelled entry links to the figure/table
// itself (MyST resolves `/page#label` into a numbered cross-reference);
// an unlabelled one links to its page.
function captionedList(vfile, ctx, kind) {
  const items = [];
  eachTree(vfile, ctx, (tree, _raw, url) => {
    for (const node of walk(tree, "container")) {
      if (node.kind !== kind) continue;
      const href = node.identifier ? `${url}#${node.identifier}` : url;
      items.push({ url, caption: captionText(node), href });
    }
  });
  items.sort((a, b) => a.url.localeCompare(b.url) || a.caption.localeCompare(b.caption));
  return items.map(({ caption, href }) => ({
    type: "listItem",
    children: [{ type: "paragraph", children: [
      { type: "link", url: href, children: [text(caption || "(untitled)")] },
    ] }],
  }));
}

const figureList = {
  name: "collect-figures",
  doc: "Collect every captioned figure across the project, linked to its page.",
  run(_data, vfile, ctx) {
    const items = captionedList(vfile, ctx, "figure");
    return items.length ? [{ type: "list", ordered: false, children: items }] : [];
  },
};

const tableList = {
  name: "collect-tables",
  doc: "Collect every captioned table across the project, linked to its page.",
  run(_data, vfile, ctx) {
    const items = captionedList(vfile, ctx, "table");
    return items.length ? [{ type: "list", ordered: false, children: items }] : [];
  },
};

// Unlike the others, this directive produces no visible content of its own. It
// emits one `cite` per key used anywhere in the project, hidden in a display:none
// div. MyST's citation transform scans every `cite` in the tree and displays
// them at the bottom of the page in a "References" section w/ formatting.
const citationList = {
  name: "collect-citations",
  doc: "Collect every cited work across the project into the page bibliography.",
  run(_data, vfile, ctx) {
    const cited = new Set();
    eachTree(vfile, ctx, (tree) => {
      for (const c of walk(tree, "cite")) if (c.label) cited.add(c.label);
    });
    if (!cited.size) return [];
    const cites = [...cited].sort().map((label) => ({
      type: "cite", kind: "narrative", label, identifier: label,
    }));
    return [{ type: "div", style: { display: "none" }, children: cites }];
  },
};

export default {
  name: "MyST Reference Collector",
  directives: [
    glossaryList, abbreviationList, footnoteList, figureList, tableList,
    citationList,
  ],
};
