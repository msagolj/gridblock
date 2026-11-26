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

| Sheet | Rows |
|---|---|
| `grid-styles` | 6 |
| `color-presets` | 8 |

Select the appropriate sheet in AEM's spreadsheet editor before editing or importing
its CSV. Preview the **Grid** page and reload the consuming page to pick up changes.
For CSV import/export, use the spreadsheet editor's controls or AEM's
[native CSV import API](https://www.aem.live/docs/authoring-tabular-data#importing-spreadsheet-data).
The workbook is previewed at `/styles/grid.json`, not published live.
No custom path mappings or AEM components were needed.

### Universal Editor authoring

The definitions, models, and filters are maintained in
[`blocks/grid/_grid.json`](blocks/grid/_grid.json). Grid is available in the section
add menu and accepts these four child components:

| Component | Fields | Authored row |
|---|---|---|
| Grid Content Item | Main content, optional supporting content (both rich text) | Main content / supporting content |
| Grid Fact | Presentation, optional image/alternative text, label, display value, description | Options / image / grouped fact content |
| Grid Link List | Label, heading/level, introduction, repeatable URL/link-text entries | Options / grouped introduction / links |
| Grid Image and Text | Image position, image/alternative text, label, heading/level, body text | Options / image / grouped text |

Each child is a standard block item, not a nested block. Typed items produce an
initial options column through `classes` and `classes_layout`. The renderer applies
those values as classes on the item row and removes only that configuration column,
leaving two content cells. Generic content items retain their original two-cell model.
`image` and `imageAlt` collapse into one image cell. Grouped field names keep the
label, heading/value, and description together. Fact values render as emphasized
text, not headings or numeric-only fields.

Grid Fact offers **Fact only**, **Image above**, and **Image below**. Image and
alternative-text inputs are shown conditionally for the image variants. Switching
to Fact only hides the image in the rendered item without deleting its saved values.
Fact's conditional image fields use `factImage` and `factImageAlt`, separate from the
image/text item's unconditional `image` and `imageAlt` inputs. This prevents UE from
carrying hidden-field state between the two item types.
Grid Image and Text offers **Above text** and **Below text**.
Link List entries use a composite multi-field; this project's existing
`public.xwalk.multi-field.enabled` setting enables semantic list output.

The existing `grid-image-item` id and its `image`, `imageAlt`, and `text` properties
are preserved, so existing image items remain editable without content migration.
Its new fields are optional. Items without presentation options keep the original
layout-driven image/text reflow.

The Grid container has only a `classes` selector:
its layout preset becomes a block option, not an extra content row. Colors remain
configured by the selected preset's spreadsheet row.

The dropdown contains the six initial layout presets. Editing an existing preset
needs only a spreadsheet preview and page reload; exposing a new preset also requires
adding its slug to the model's options. After changing model partials, run
`npm run build:json` to regenerate the root definitions, models, and filters.

The updated code must be available to the AEM site's configured branch before the
components can be added in cloud Universal Editor. Use the AEM-authored example
below to validate native serialization and UE editing.

### AEM example

- [Edit grid-demo in Universal Editor](https://author-p130360-e1368254.adobeaemcloud.com/ui#/@sitesinternal/aem/universal-editor/canvas/author-p130360-e1368254.adobeaemcloud.com/content/gridblock/grid-demo.html)
- [Preview grid-demo](https://main--gridblock--msagolj.aem.page/grid-demo)

The AEM-authored page contains all six presets and 36 items using the original
generic content and image items. It uses standard AEM components and the Grid spreadsheet, without changing
Index. Use it to exercise adding a Grid to a section, adding/editing/reordering
items, changing layout presets, and editing image alternative text. Each item
serializes to one row with two cells; alternative text collapses into the image cell.
The example is previewed only, not published live.

The dedicated `/content/gridblock/grid-structured` page exercises the structured
models and presentation options without changing the existing demo. Prefilled Grid
definitions and a visual layout-selector extension are separate follow-up work.

### Local development

```sh
aem up --no-open --no-stop-other --forward-browser-logs
```

Open http://localhost:3000/grid-demo to view the AEM-authored example with local code.
The AEM CLI proxies the page content, images, and workbook JSON from this site's preview.
