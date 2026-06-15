---
abbreviations:
  HTML: HyperText Markup Language
  AST: Abstract Syntax Tree
---

# Example page one

:::{glossary}
MyST
: A flavor of Markdown for technical writing.

Directive
: A block-level extension point in MyST.
:::

MyST documents compile to an {abbr}`AST` and render to {abbr}`HTML`.
Literate programming was introduced by {cite}`knuth1984`.

Footnotes are page-scoped by default.[^scoped]

[^scoped]: Which is exactly why aggregating them is useful.

:::{figure} ./placeholder.svg
:label: fig-one
A figure defined on page one.
:::

:::{table} A table defined on page one.
:label: tbl-one
| MyST | does |
| --- | --- |
| nice | tables |
:::
