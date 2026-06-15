# myst-collect-references: Collect references in one place

MyST scopes most references to the page where they are defined: glossaries, abbreviations, citations, and footnotes all render at the bottom of the page that uses them.
There's no built-in way to gather them across an entire project.

This is a little MyST plugin that allows you to aggregate all of those references in one place.
It doesn't *generate* any new instances of those references, it only tracks them across all documents, de-duplicates and sorts them, and displays them all in one spot.

## Usage

Add the plugin to your `myst.yml`:

```yaml
project:
  plugins:
    - https://raw.githubusercontent.com/myst-contrib/myst-collect-references/main/src/aggregate-references.mjs
```

Put any of these directives on a page (e.g., a dedicated "references" page):

| Directive | Collects |
| --- | --- |
| `{collect-glossary}` | Every `{glossary}` term across the project |
| `{collect-abbreviations}` | Every `abbreviations:` entry in page frontmatter |
| `{collect-footnotes}` | Every footnote, each with a link back to its page |
| `{collect-citations}` | Every `{cite}`d work across the project, as one bibliography |
| `{collect-figures}` | Every captioned figure, linked to its page |
| `{collect-tables}` | Every captioned table, linked to its page |

Each list is gathered from all `.md` files, de-duplicated, and sorted. See `docs/` for a runnable example.

## Develop

```bash
nox -s docs        # build the example site once
nox -s docs-live   # live-reloading dev server
nox -s test        # tiny self-check, no dependencies
```