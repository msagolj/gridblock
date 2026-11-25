# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--gridblock--msagolj.aem.page/
- Live: https://main--gridblock--msagolj.aem.live/

## Documentation

Before using the aem-boilerplate, we recommend you to go through the documentation on [www.aem.live](https://www.aem.live/docs/), more specifically:
1. [AEM Authoring](https://www.aem.live/docs/aem-authoring)
2. [Universal Editor Tutorial](https://www.aem.live/developer/ue-tutorial)
3. [Component Model Definitions](https://www.aem.live/developer/component-model-definitions)
4. [Authoring Path Mapping](https://www.aem.live/developer/authoring-path-mapping)

## Prerequisites

- nodejs 20 or newer
- AEM Cloud Service release 2026.4 or newer

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Grid block runtime

The grid runtime is adapted from the [reference grid demo](https://main--abbvie-ie--aemsites.aem.page/science).
It keeps authored rows and cells in place, including Universal Editor instrumentation.
Each row becomes a grid item (`a`, `b`, ..., `aa`); its cells hold main/supporting content
or an image and content. No nested authored blocks are required.

The block reads one multi-sheet AEM spreadsheet at `/styles/grid.json`, matching the
reference demo. It contains two named sheets:

- `grid-styles`: `Slug`, `Template Areas`, `Template Areas Tablet`,
  `Template Areas Mobile`, `Color Preset`, `Overrides`, and `Font Size`.
- `color-presets`: `slug`, `Foreground Color`, `Emphasis Color`,
  `Cell Background Color`, `Cell Border`, and `Border Edges`.

Both named sheets must contain a `data` array. The reference `Background Color` column
is retained in the spreadsheet but, as in the original runtime, is not applied.
Column headings are normalized, so `Template Areas` and `template-areas` are equivalent.
The workbook is requested once per page, through the same code base path as the block.
Missing or malformed configuration raises an error through the standard block loader;
it is not silently replaced by an empty preset collection.

Select a layout with a matching block-option class, such as `grid spotlight-large`.
A matching section style is also supported; otherwise the `default` preset is used.
Templates use CSS Grid area names: `"a a b c" "a a d e"` places five items on four tracks.
Desktop starts at 1200px, tablet at 600px, and mobile defaults to one item per row.
An omitted tablet template inherits desktop. Items beyond a template are placed below it.
Only the content's visual placement changes; DOM, keyboard, and reading order stay unchanged.

The optional `Overrides` cell maps area names to color preset slugs, for example
`{"a":"light-blue-bg","f":"navy-bg"}`. Font size accepts `small`, `medium`, or `large`.
Style presets, templates, and CSS values are validated; invalid settings raise an error.
The DA-specific configuration-tool messaging is not included in this port.

### AEM spreadsheet

The native AEM Spreadsheet page is `/content/gridblock/styles/grid`, titled **Grid**.
Its sheets have independent columns:

| Sheet | Rows | Import backup |
|---|---|---|
| `grid-styles` | 6 | [grid-styles.csv](content/styles/grid-styles.csv) |
| `color-presets` | 8 | [color-presets.csv](content/styles/color-presets.csv) |

Select the appropriate sheet in AEM's spreadsheet editor before editing or importing
its CSV. Preview the **Grid** page and reload the consuming page to pick up changes.
The CSV backups preserve the initial column headings and values; they were imported
through AEM's [native CSV import API](https://www.aem.live/docs/authoring-tabular-data#importing-spreadsheet-data).
The workbook is previewed at `/styles/grid.json`, not published live.
No custom path mappings or AEM components were needed.

### Universal Editor authoring

The definitions, models, and filters are maintained in
[`blocks/grid/_grid.json`](blocks/grid/_grid.json). Grid is available in the section
add menu and accepts only these two child components:

| Component | Fields | Authored row |
|---|---|---|
| Grid Content Item | Main content, optional supporting content (both rich text) | Main content / supporting content |
| Grid Image Item | Image, alternative text, content (rich text) | Image / content |

Each child is a standard block item, not a nested block. `image` and `imageAlt`
collapse into one image cell. The Grid container has only a `classes` selector:
its layout preset becomes a block option, not an extra content row. Colors remain
configured by the selected preset's spreadsheet row.

The dropdown contains the six initial layout presets. Editing an existing preset
needs only a spreadsheet preview and page reload; exposing a new preset also requires
adding its slug to the model's options. After changing model partials, run
`npm run build:json` to regenerate the root definitions, models, and filters.

The updated code must be available to the AEM site's configured branch before the
components can be added in cloud Universal Editor. Local fixture pages validate
the runtime, but do not validate native AEM serialization or UE editing.

### AEM example

- [Edit grid-demo in Universal Editor](https://author-p130360-e1368254.adobeaemcloud.com/ui#/@sitesinternal/aem/universal-editor/canvas/author-p130360-e1368254.adobeaemcloud.com/content/gridblock/grid-demo.html)
- [Preview grid-demo](https://main--gridblock--msagolj.aem.page/grid-demo)

The AEM-authored page contains all six presets and 36 items, including both item
models. It uses standard AEM components and the Grid spreadsheet, without changing
Index. Use it to exercise adding a Grid to a section, adding/editing/reordering
items, changing layout presets, and editing image alternative text. Each item
serializes to one row with two cells; alternative text collapses into the image cell.
The example is previewed only, not published live.

### Local examples

```sh
aem up --no-open --no-stop-other --forward-browser-logs
```

- http://localhost:3000/docs/library/blocks/grid shows all six reference presets.
- http://localhost:3000/drafts/grid-edge covers optional cells, overflow items,
  section-level selection, and an empty grid.

The pages and CSV backups are under `content/`, excluded from Code Sync via `.hlxignore`.
The AEM CLI serves the HTML examples locally and proxies the workbook JSON from this
site's preview. There are no local JSON overrides, so previewed spreadsheet edits are
visible during development. The sample images also come from this site's preview,
not the reference demo.
