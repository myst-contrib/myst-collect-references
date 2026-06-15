# myst-ref-aggregate: Aggregate references in one place

MyST has nice support for labeling items that you can refer to later: glossaries, abbreviations, citations, etc.
However, it tends to be page-focused: references show up at the bottom of a page, but you can't build a bibliography across all pages in one spot.
Similarly with Glossaries.

This is a little MyST plugin that allows you to aggregate all of those references in one place.
It doesn't *generate* any new instances of those references, it only tracks them across all documents, de-duplicates and sorts them, and displays them all in one spot.

:::{note} Long term this probably belongs in mystmd!
[TODO: Find the issue tracking this]
:::