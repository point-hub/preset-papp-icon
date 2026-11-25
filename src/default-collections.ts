import { IIconCollection } from "src";

/**
 * Built-in default icon collections available out of the box.
 */
export const defaultCollections: Record<string, IIconCollection> = {
  fa: {
    baseUrl: 'https://assets.r2.lab.biz.id/icons/fontawesome',
    versions: ['7.3.1'],
    styles: ['solid', 'regular', 'light', 'thin',
      'duotone', 'duotone-regular', 'duotone-light', 'duotone-thin',
      'sharp-solid', 'sharp-regular', 'sharp-light', 'sharp-thin',
      'sharp-duotone-solid', 'sharp-duotone-regular', 'sharp-duotone-light', 'sharp-duotone-thin',
      'brands'],
  },
  mc: {
    baseUrl: 'https://assets.r2.lab.biz.id/icons/mingcute',
    versions: ['4.0.0'],
    styles: ['regular', 'filled'],
  },
  lucide: {
    baseUrl: 'https://assets.r2.lab.biz.id/icons/lucide',
    versions: ['1.79.0'],
    styles: [],
  },
  ph: {
    baseUrl: 'https://assets.r2.lab.biz.id/icons/phosphor',
    versions: ['2.1.0'],
    styles: ['bold', 'duotone', 'fill', 'light', 'regular', 'thin'],
  },
  hi: {
    baseUrl: 'https://assets.r2.lab.biz.id/icons/heroicons',
    versions: ['2.2.0'],
    styles: ['solid', 'outline'],
  },
  mdi: {
    baseUrl: 'https://assets.r2.lab.biz.id/icons/material-design-icons',
    versions: ['0.14.15'],
    styles: ['filled', 'outlined', 'round', 'sharp', 'two-tone'],
  },
  li: {
    baseUrl: 'https://assets.r2.lab.biz.id/icons/lineicons',
    versions: ['5.2'],
    styles: ['bulk', 'duotone', 'outlined', 'solid', 'stroke'],
  },
};