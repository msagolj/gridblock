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

When an item's content cells stack, text-only rows size to their content rather than
stretching to equal heights. Layout-driven image/text stacks keep equal internal rows so
their absolutely positioned images retain space.

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
| Grid Content Item | Main content, optional supporting content (both rich text) | Item type / main content / supporting content |
| Grid Fact | Presentation, optional image/alternative text, label, display value, description | Options / image / grouped fact content |
| Grid Link List | Label, heading/level, introduction, repeatable URL/link-text entries | Options / grouped introduction / links |
| Grid Image and Text | Image position, image/alternative text, label, heading/level, body text | Options / image / grouped text |

Each child is a standard block item, not a nested block. All item models produce an
initial item-type/options column through `classes` and, where applicable, `classes_layout`.
The `classes` fields are hidden and have no default type value. AEM automatically
includes the normalized item name (for example `grid-content-item` or
`grid-image-and-text`) in that first cell, alongside selected `classes_*` values.
Item definitions do not duplicate those names in a `classes` template value.
Native AEM HTML leaves the options in the cell; it does not apply them as row classes.
The renderer applies
those values as classes on the item row and removes only that configuration column,
leaving two content cells. It recognizes the options by the item-type token, rather
than treating every three-cell row as configuration. Legacy rows without an item-type
cell retain their content, including any empty trailing table-padding cell.
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
Structured text wraps within narrow grid areas, and link lists use width-based
columns rather than forcing two columns into a small cell.

The existing `grid-image-item` id and its `image`, `imageAlt`, and `text` properties
are preserved, so existing image items remain editable without content migration.
Its new fields are optional. Items without presentation options keep the original
layout-driven image/text reflow. The renderer also accepts the earlier
`grid-image-text` styling alias and `grid-image-item` name for existing content.

In Universal Editor, Grid labels include the selected layout, for example
`Grid: Spotlight large`, or `Grid: Default` when no layout option is set.
Item labels include an identifying content value, for example
`Grid Fact: Workshops`. The author-only editor support script selects the first
non-empty label field, heading, or fact value, in that order. When none is present,
the original component label remains. Labels update after authoring changes using
the same pattern as the xwalk [Column Layout example](https://github.com/adobe-rnd/aem-boilerplate-xwalk/pull/72).
These are dynamic `data-aue-label` values only: item names, saved properties, layout
options, and published markup are unchanged.

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

### Prefilled Grid definitions

The section add menu offers two starting points alongside the empty **Grid**:

| Definition | Selected layout | Initial items |
|---|---|---|
| Grid (Spotlight large) | `spotlight-large` | Six Facts (two with Image above selected) and one Link List |
| Grid (Facts right) | `facts-right` | One generic introduction and four Facts |

Both definitions use the same `grid` model, filter, and renderer. Nested template
nodes seed seven or five real child items in AEM, in area order, with editable example
text. Authors choose their own images for the image-enabled Facts; no asset path
is hardcoded in the definitions. Link List starts with two example links.
The initial text, values, and links are saved content, so replace them before
publishing a real page.

Templates apply only when adding a new Grid. Authors can still switch layouts,
edit item options, and add, remove, or reorder children. Changing the layout never
re-seeds or trims existing content.

Both definitions are demonstrated on the [prefilled example in UE](https://author-p130360-e1368254.adobeaemcloud.com/ui#/@sitesinternal/aem/universal-editor/canvas/author-p130360-e1368254.adobeaemcloud.com/content/gridblock/grid-prefilled.html)
and its [EDS preview](https://main--gridblock--msagolj.aem.page/grid-prefilled).
The examples were created through the UE Add menu and filled with workshop content.
They are previewed only, not live; the creation templates still seed editable placeholders.

### AEM example

- [Edit grid-demo in Universal Editor](https://author-p130360-e1368254.adobeaemcloud.com/ui#/@sitesinternal/aem/universal-editor/canvas/author-p130360-e1368254.adobeaemcloud.com/content/gridblock/grid-demo.html)
- [Preview grid-demo](https://main--gridblock--msagolj.aem.page/grid-demo)

The AEM-authored page contains all six presets and 36 items using the current Fact,
Link List, Image and Text, and generic Content models. It uses standard AEM components
and the Grid spreadsheet, without changing Index. Use it to exercise adding a Grid to a section, adding/editing/reordering
items, changing layout presets, and editing image alternative text. Each item
serializes to one row with an item-type/options cell and two content cells; decoration
removes only the options cell. Alternative text collapses into the image cell.
The example is previewed only, not published live.

The dedicated [structured example in UE](https://author-p130360-e1368254.adobeaemcloud.com/ui#/@sitesinternal/aem/universal-editor/canvas/author-p130360-e1368254.adobeaemcloud.com/content/gridblock/grid-structured.html)
and its [EDS preview](https://main--gridblock--msagolj.aem.page/grid-structured)
exercise all four models, the three Fact presentations, both Image and Text positions,
and a minimal Fact without a label or image.

The retained sample pages have distinct purposes:

| Page | Purpose |
|---|---|
| `/grid-demo` | General gallery of all six layout presets with current item models |
| `/grid-structured` | Every supported item model and presentation variation |
| `/grid-prefilled` | Both prefilled definitions filled with workshop content |

All three pages describe **Edge Workshop**, a fictional programme of hands-on
Edge Delivery Services sessions for authors and developers. The page copy reads
as workshop content, without disclaimers or instructions to replace placeholders.
Images reuse the existing DAM assets under `/content/dam/gridblock/`:
`headless-is-here.png`, `widen-the-talent-pool.png`, `peak-performance.png`,
`unmatched-speed.png`, and `low-code-way-to-developer-productivity.png`.
The image-enabled Facts on the prefilled Spotlight large page also have selected
images. The prefilled pages contain authored workshop content;
the component definitions retain their creation templates. These pages are previewed
only, not published live.

Upload images through the AEM Assets UI or the Cloud Service
[direct binary upload API](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/admin/developer-reference-material-apis#asset-upload).
Complete the upload and wait for asset processing before testing in UE. Preview can
read the original binary even when author-side image renditions are not yet available.

The dedicated `/grid-placeholderitems` page is no longer needed. To demonstrate the
separate placeholder experiment on any retained page in UE, append
`?ref=placeholderitems` to the canvas page URL, after its hash route. For example:
[structured page with the experimental branch](https://author-p130360-e1368254.adobeaemcloud.com/ui#/@sitesinternal/aem/universal-editor/canvas/author-p130360-e1368254.adobeaemcloud.com/content/gridblock/grid-structured.html?ref=placeholderitems).
The branch is not merged into main; a visual layout-selector extension remains
separate follow-up work.

### Local development

```sh
aem up --no-open --no-stop-other --forward-browser-logs
```

Open http://localhost:3000/grid-demo to view the AEM-authored example with local code.
The AEM CLI proxies the page content, images, and workbook JSON from this site's preview.
