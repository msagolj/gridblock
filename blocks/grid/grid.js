import { toClassName } from '../../scripts/aem.js';
import {
  COLOR_PROPERTIES, baseColorStyle, factFontSizeValue, getColorStyle,
  indexColorStyles, mergeColorStyles, normalizeStyle, parseGridOverrides, parseTemplate,
} from '../../scripts/grid-overrides.js';

const TOKEN_URL = '/styles/grid.json';
const DEFAULT_DESKTOP = '"a b c d" "e f g h"';
let tokenRequest;

async function fetchTokens() {
  const url = `${window.hlx.codeBasePath}${TOKEN_URL}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load grid spreadsheet ${url}: HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload?.['grid-styles']?.data)
    || !Array.isArray(payload?.['color-presets']?.data)) {
    throw new Error(`Expected grid-styles and color-presets sheets at ${url}`);
  }
  return {
    layouts: payload['grid-styles'].data.map(normalizeStyle),
    colors: indexColorStyles(payload['color-presets'].data),
  };
}

function loadTokens() {
  if (!tokenRequest) tokenRequest = fetchTokens();
  return tokenRequest;
}

function areaName(index) {
  let name = '';
  let number = index + 1;
  while (number > 0) {
    number -= 1;
    name = String.fromCharCode(97 + (number % 26)) + name;
    number = Math.floor(number / 26);
  }
  return name;
}

function applyLayout(block, rows, layout, breakpoint, authoring = false) {
  const suffix = authoring ? `author-${breakpoint}` : breakpoint;
  block.style.setProperty(`--grid-template-areas-${suffix}`, layout.template);
  block.style.setProperty(`--grid-template-columns-${suffix}`, `repeat(${layout.columns}, minmax(0, 1fr))`);
  let unplaced = 0;
  rows.forEach((row, index) => {
    const name = row.dataset.gridPlaceholder || areaName(index);
    const placed = layout.areas.has(name);
    let placement = name;
    if (!placed) {
      placement = `${layout.rows + Math.floor(unplaced / layout.columns) + 1} / auto / auto / auto`;
      unplaced += 1;
    }
    row.style.setProperty(`--grid-placement-${suffix}`, placement);
    if (!authoring) {
      row.toggleAttribute(`data-stack-${breakpoint}`, !placed || layout.stackAreas.has(name));
    }
  });
}

function stackedLayout(names) {
  return {
    template: names.length ? names.map((name) => `"${name}"`).join(' ') : 'none',
    rows: names.length,
    columns: 1,
    areas: new Set(names),
    stackAreas: new Set(names),
  };
}

function renderPlaceholders(block, rows, desktop, tablet, mobile, mobileValue) {
  const names = rows.map((row, index) => areaName(index));
  const templates = mobileValue ? [desktop, tablet, mobile] : [desktop, tablet];
  const areas = new Set(templates.flatMap((layout) => [...layout.areas])
    .filter((name) => name !== '.'));
  const placeholders = [...areas].filter((name) => !names.includes(name)).map((name) => {
    const placeholder = document.createElement('div');
    placeholder.classList.add('grid-cell', 'grid-placeholder');
    placeholder.dataset.gridPlaceholder = name;
    placeholder.setAttribute('aria-hidden', 'true');
    return placeholder;
  });
  block.append(...placeholders);
  const previewRows = [...rows, ...placeholders];
  const previewNames = [...new Set([...names, ...areas])]
    .sort((a, b) => a.length - b.length || a.localeCompare(b));
  const previewMobile = mobileValue ? mobile : stackedLayout(previewNames);
  applyLayout(block, previewRows, desktop, 'desktop', true);
  applyLayout(block, previewRows, tablet, 'tablet', true);
  applyLayout(block, previewRows, previewMobile, 'mobile', true);
}

function applyStyle(block, style) {
  block.style.removeProperty('--grid-fact-font-size');
  const factSize = style['font-size'];
  if (typeof factSize === 'string' && factSize.trim()) {
    const size = factFontSizeValue(factSize);
    if (!size) throw new Error(`Invalid grid style font-size: ${factSize}`);
    block.style.setProperty('--grid-fact-font-size', size);
  }
}

function renderGrid(block, rows, { layouts, colors }, authoring) {
  const section = block.closest('.section');
  const matches = (classes) => layouts.find((token) => (
    token.slug && classes?.contains(toClassName(token.slug))
  ));
  const style = matches(block.classList)
    || matches(section?.classList)
    || layouts.find((token) => toClassName(token.slug || '') === 'default')
    || {};
  applyStyle(block, style);
  const overrides = parseGridOverrides(style.overrides);
  const base = getColorStyle(colors, baseColorStyle(style));
  rows.forEach((row, index) => {
    const area = areaName(index);
    const preset = getColorStyle(colors, Object.hasOwn(overrides, area) ? overrides[area] : '');
    const values = mergeColorStyles(base, preset);
    Object.entries(values).forEach(([key, value]) => {
      if (value === null) {
        throw new Error(`Invalid ${key} for grid style ${style.slug}, area ${area}`);
      }
    });
    row.dataset.borderPlacement = values['border-edges'] || 'full';
    Object.entries(COLOR_PROPERTIES).forEach(([key, [property]]) => {
      row.style.removeProperty(property);
      if (values[key]) row.style.setProperty(property, values[key]);
    });
  });

  const desktopValue = style['template-areas']?.trim();
  const tabletValue = style['template-areas-tablet']?.trim();
  const mobileValue = style['template-areas-mobile']?.trim();
  const desktop = parseTemplate(desktopValue || DEFAULT_DESKTOP);
  const tablet = tabletValue ? parseTemplate(tabletValue) : desktop;
  const names = rows.map((row, index) => areaName(index));
  const mobile = mobileValue ? parseTemplate(mobileValue) : stackedLayout(names);
  if (!desktop || !tablet || !mobile) {
    throw new Error(`Invalid grid template areas for preset ${style.slug || 'default'}`);
  }
  if (rows.length) {
    applyLayout(block, rows, desktop, 'desktop');
    applyLayout(block, rows, tablet, 'tablet');
    applyLayout(block, rows, mobile, 'mobile');
  }
  if (authoring) renderPlaceholders(block, rows, desktop, tablet, mobile, mobileValue);
}

export default async function decorate(block) {
  block.querySelectorAll(':scope > [data-grid-placeholder]').forEach((placeholder) => placeholder.remove());
  const rows = [...block.children];
  const authoring = block.hasAttribute('data-aue-resource')
    && !!document.querySelector('meta[name="urn:adobe:aue:system:aemconnection"]');
  block.toggleAttribute('data-grid-authoring', authoring);
  if (!rows.length && !authoring) return;
  rows.forEach((row, index) => {
    row.classList.add('grid-cell');
    [...row.children].forEach((column) => {
      const empty = !column.textContent.trim()
        && !column.querySelector('img, picture, video, audio, iframe, svg, canvas, object, embed, input, textarea, select, button, hr');
      column.classList.toggle('grid-empty-column', empty);
      column.classList.toggle('grid-image-column', !column.textContent.trim()
        && column.querySelectorAll('img').length === 1);
    });
    if (authoring && [...row.children].every((column) => column.classList.contains('grid-empty-column'))) {
      row.dataset.gridEmpty = areaName(index);
    } else {
      delete row.dataset.gridEmpty;
    }
  });

  renderGrid(block, rows, await loadTokens(), authoring);
}
