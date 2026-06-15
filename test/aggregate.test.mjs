// Run: node test/aggregate.test.mjs   (no dependencies, no framework)
import assert from "node:assert/strict";
import { frontmatterAbbreviations, pageUrl, captionText } from "../src/aggregate-references.mjs";

// frontmatter: reads the abbreviations block and stops at the next key.
const fm = `---
title: Hi
abbreviations:
  HTML: HyperText Markup Language
  "API": Application Programming Interface
other: ignored
---
body`;
assert.deepEqual(frontmatterAbbreviations(fm), [
  ["HTML", "HyperText Markup Language"],
  ["API", "Application Programming Interface"],
]);
assert.deepEqual(frontmatterAbbreviations("no frontmatter here"), []);

// page url: drop extension and trailing /index.
assert.equal(pageUrl("/proj", "/proj/page-one.md"), "/page-one");
assert.equal(pageUrl("/proj", "/proj/sub/index.md"), "/sub");
assert.equal(pageUrl("/proj", "/proj/index.md"), "/");

// caption: tables expose a `caption` node, figures a trailing `paragraph`.
const p = (s) => ({ type: "paragraph", children: [{ type: "text", value: s }] });
assert.equal(captionText({ children: [{ type: "caption", children: [p("a table")] }] }), "a table");
assert.equal(captionText({ children: [{ type: "image" }, p("a figure")] }), "a figure");

console.log("ok");
