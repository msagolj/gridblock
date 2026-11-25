import { toClassName } from './aem.js';

export function baseColorStyle(layout) {
  return layout['color-preset'] ?? layout['grid-style'];
}

export const COLOR_PROPERTIES = {
  'foreground-color': ['--grid-foreground-color', 'color'],
  'emphasis-color': ['--grid-emphasis-color', 'color'],
  'cell-background-color': ['--grid-cell-background-color', 'color'],
  'cell-border': ['--grid-cell-border', 'border'],
};

export function normalizeStyle(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [toClassName(key), value]));
}

export function indexColorStyles(rows) {
  return new Map(rows.map(normalizeStyle).map((row) => [toClassName(row.slug), row])
    .filter(([slug]) => slug));
}

export const FACT_FONT_SIZES = ['small', 'medium', 'large'];

export function borderPlacement(value) {
  const placement = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return ['full', 'bottom'].includes(placement) ? placement : null;
}

export function factFontSizeValue(value) {
  const size = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return FACT_FONT_SIZES.includes(size) ? `var(--grid-fact-size-${size})` : null;
}

export function isNoColor(value) {
  return typeof value === 'string' && value.trim().toLowerCase() === 'none';
}

export function gridColorValue(key, value) {
  if (!isNoColor(value)) return value;
  return key.includes('background') ? 'transparent' : 'currentColor';
}

export function colorStyleValue(key, value) {
  const setting = String(value ?? '').trim();
  if (!setting) return '';
  if (key === 'border-edges') return borderPlacement(setting);
  if (key === 'cell-border' && setting.toLowerCase() === 'no-border') return 'none';
  const type = key === 'background-color' ? 'color' : COLOR_PROPERTIES[key][1];
  if (type === 'color' && isNoColor(setting)) return gridColorValue(key, setting);
  return CSS.supports(type, setting) ? setting : null;
}

export function getColorStyle(styles, slug) {
  if (slug == null || (typeof slug === 'string' && !slug.trim())) return {};
  const style = styles.get(toClassName(slug));
  if (!style) throw new Error(`Unknown color style: ${slug}`);
  return style;
}

export function mergeColorStyles(base, override = {}) {
  return Object.fromEntries([...Object.keys(COLOR_PROPERTIES), 'border-edges'].map((key) => {
    const value = String(override[key] ?? '').trim() ? override[key] : base[key];
    return [key, colorStyleValue(key, value)];
  }));
}

export function parseTemplate(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const input = value.trim().toLowerCase();
  const quoted = [...input.matchAll(/"([^"]+)"|'([^']+)'/g)];
  let rows;
  if (quoted.length) {
    if (input.replace(/"[^"]+"|'[^']+'/g, '').trim()) return null;
    rows = quoted.map((match) => match[1] || match[2]);
  } else if (/[\n;,]/.test(input)) {
    rows = input.split(/[\n;,]+/).filter((row) => row.trim());
  } else {
    const parts = input.split(/\s+/);
    rows = parts.every((part) => part.length === 1) ? [input] : parts;
  }
  const cells = rows.map((row) => {
    const trimmed = row.trim();
    return /\s/.test(trimmed) ? trimmed.split(/\s+/) : [...trimmed];
  });
  if (!cells.length || cells.some((row) => row.length !== cells[0].length
    || row.some((cell) => !/^(?:[a-z]+|\.)$/.test(cell)))) return null;
  const template = cells.map((row) => `"${row.join(' ')}"`).join(' ');
  if (!CSS.supports('grid-template-areas', template)) return null;
  const areas = new Set();
  const spanningAreas = new Set();
  const wideAreas = new Set();
  cells.forEach((row) => {
    const rowAreas = new Set();
    row.forEach((area) => {
      if (area !== '.' && rowAreas.has(area)) wideAreas.add(area);
      rowAreas.add(area);
    });
    rowAreas.forEach((area) => {
      if (area !== '.' && areas.has(area)) spanningAreas.add(area);
      areas.add(area);
    });
  });
  return {
    template,
    rows: cells.length,
    columns: cells[0].length,
    areas,
    stackAreas: new Set([...areas].filter((area) => (
      area !== '.' && (!wideAreas.has(area) || spanningAreas.has(area))
    ))),
  };
}

export function parseGridOverrides(value) {
  if (value == null || (typeof value === 'string' && !value.trim())) return {};
  if (typeof value !== 'string') throw new Error('Overrides must be a JSON object');
  let overrides;
  try {
    overrides = JSON.parse(value);
  } catch (error) {
    throw new Error(`Invalid overrides JSON: ${error.message}`);
  }
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new Error('Overrides must be a JSON object');
  }
  Object.entries(overrides).forEach(([area, slug]) => {
    if (!/^[a-z]+$/.test(area) || typeof slug !== 'string' || !toClassName(slug)) {
      throw new Error(`Invalid override for area ${area}`);
    }
  });
  return overrides;
}
