# All references in one place

This plugin collects page-scoped references (glossary terms, abbreviations, footnotes, figures, and tables) from every page into one de-duplicated, sorted list.
[Page one](./page-one.md) and [page two](./page-two.md) each define their own, and the lists below gather them.

:::{note} Prototyping behavior that should probably be in `myst-cli`
See this issue for tracking the upstream issues: [Improve cross-page aggregation for references etc](https://github.com/jupyter-book/mystmd/issues/2951).
:::

## Glossary

Word definitions are defined with the `{glossary}` directive ([MyST guide](xref:guide/glossaries-and-terms)).
```{myst:demo}
:::{collect-glossary}
:::
```

## Abbreviations

Defined in each page's `abbreviations:` frontmatter ([MyST guide](xref:guide#abbreviations)).
```{myst:demo}
:::{collect-abbreviations}
:::
```

## Footnotes

Footnotes are defined with `[^n]` syntax ([MyST guide](xref:guide#footnotes)).
```{myst:demo}
:::{collect-footnotes}
:::
```

## Figures

Figures are defined with the `{figure}` directive ([MyST guide](xref:guide/figures)).
```{myst:demo}
:::{collect-figures}
:::
```

## Tables

Tables are defined in many different ways ([MyST guide](xref:guide/tables)).
```{myst:demo}
:::{collect-tables}
:::
```

## Citations

MyST's built-in `{bibliography}` only lists the current page's citations, so a references page comes up empty. `{collect-citations}` re-cites every work used across the project so MyST renders the full list, formatted with its own citation styling.

It has no visible output of its own: the references appear in the **References** section at the bottom of this page (MyST's bibliography has no inline renderer yet, see [mystmd#2951](https://github.com/jupyter-book/mystmd/issues/2951)).

::::{myst:demo}
This will be empty! But look below for the references section...
:::{collect-citations}
:::
::::

## Things that are already aggregated in MyST

Indexes are already a great way to collect references across many pages in MyST.
However those are more about listing elements and back-linking to them.
This plugin is more about collecting the original definition content, and doing so in a grouped way.
For reference, here's what `{show-index}` creates for this website:

```{myst:demo}
:::{show-index}
:::
```
