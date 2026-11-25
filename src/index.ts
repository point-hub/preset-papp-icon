import { presetIcons, type PresetOrFactory } from 'unocss';

/**
 * Configuration for a single remote SVG icon collection.
 */
export interface IIconCollection {
  /** Base URL hosting the icon assets (trailing slashes are normalized automatically). */
  baseUrl: string;
  /**
   * Ordered list of version segments to try when resolving an icon.
   * When omitted or empty, icons are fetched directly under `baseUrl/svgs/...`.
   */
  versions?: string[];
  /**
   * Style subdirectories (e.g., `'solid'`, `'regular'`, `'brands'`).
   * Each style is registered as `<collectionName>-<style>`.
   * If omitted or empty, the collection is registered directly as `<collectionName>`.
   */
  styles?: string[];
}

/**
 * Options for configuring {@link presetPappIcon}.
 */
export interface PappIconOptions {
  /** Custom or overridden icon collections keyed by collection name. */
  collections?: Record<string, IIconCollection>;
  /** Maximum number of fetch attempts per icon URL before giving up. Defaults to `3`. */
  retries?: number;
  /** Delay in milliseconds between retry attempts. Defaults to `500`. */
  delay?: number;
}

/**
 * Built-in default icon collections available out of the box.
 */
const defaultCollections: Record<string, IIconCollection> = {
  fa7: {
    baseUrl: 'https://assets.r2.lab.biz.id/icons/fontawesome',
    versions: ['7.3.1'],
    styles: ['solid', 'regular', 'light', 'thin',
      'duotone', 'duotone-regular', 'duotone-light', 'duotone-thin',
      'sharp-solid', 'sharp-regular', 'sharp-light', 'sharp-thin',
      'sharp-duotone-solid', 'sharp-duotone-regular', 'sharp-duotone-light', 'sharp-duotone-thin',
      'brands'],
  },
  mc4: {
    baseUrl: 'https://assets.r2.lab.biz.id/icons/mingcute',
    versions: ['4.0.0'],
    styles: ['regular', 'filled'],
  },
  lucide: {
    baseUrl: 'https://assets.r2.lab.biz.id/icons/lucide',
    versions: ['1.79.0'],
    styles: [],
  },
  ph2: {
    baseUrl: 'https://assets.r2.lab.biz.id/icons/phosphor',
    versions: ['2.1.0'],
    styles: ['bold', 'duotone', 'fill', 'light', 'regular', 'thin'],
  },
  hi2: {
    baseUrl: 'https://assets.r2.lab.biz.id/icons/heroicons',
    versions: ['2.2.0'],
    styles: ['solid', 'outline'],
  },
};

/**
 * In-flight and resolved SVG fetch promises keyed by full icon URL.
 * Failed (`undefined`) responses are evicted so subsequent builds/requests can retry.
 */
const iconCache: Record<string, Promise<string | undefined>> = {};

/**
 * Fetches an SVG from `url` with retry support for transient network or HTTP errors.
 *
 * @param url - Full URL of the target SVG file.
 * @param retries - Total number of attempts to make before returning `undefined`.
 * @param delay - Backoff pause in milliseconds between failed attempts.
 * @returns The raw SVG markup string, or `undefined` if not found (404) or all retries fail.
 */
const fetchWithRetry = async (
  url: string,
  retries: number,
  delay: number,
): Promise<string | undefined> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);

      // Missing icons are expected during multi-version/style probing; do not retry.
      if (response.status === 404) {
        return undefined;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      if (attempt === retries) {
        console.error(
          `Failed to load icon after ${retries} attempts: ${url}`,
          error,
        );

        return undefined;
      }

      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Retrying icon request (attempt ${attempt}): ${url}`,
          error,
        );
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return undefined;
};

/**
 * Resolves and loads an SVG icon across configured `versions` in priority order.
 *
 * Expected URL format: `<baseUrl>/[version]/svgs/[style]/<icon>.svg`
 *
 * @param config - Collection configuration (`baseUrl`, `versions`, `styles`).
 * @param style - Optional style subfolder name.
 * @param icon - Icon name without the `.svg` extension.
 * @param retries - Retry count forwarded to {@link fetchWithRetry}.
 * @param delay - Retry delay in milliseconds forwarded to {@link fetchWithRetry}.
 * @returns The first matching SVG string found across versions, or `undefined` if none match.
 */
const loadIcon = async (
  config: IIconCollection,
  style: string | undefined,
  icon: string,
  retries: number,
  delay: number,
): Promise<string | undefined> => {
  const versions = config.versions?.length ? config.versions : [''];

  // Try the plain name first, then `<icon>-<style>` (e.g. Phosphor's `bold/acorn-bold.svg`).
  const fileNames = style && !icon.endsWith(`-${style}`)
    ? [icon, `${icon}-${style}`]
    : [icon];

  for (const version of versions) {
    for (const fileName of fileNames) {
      const url = [
        config.baseUrl.replace(/\/+$/, ''),
        version,
        'svgs',
        style,
        `${fileName}.svg`,
      ]
        .filter(Boolean)
        .join('/');

      if (!iconCache[url]) {
        const request = fetchWithRetry(url, retries, delay);

        iconCache[url] = request;

        // Clear failed lookups so transient outages don't poison the cache permanently.
        request.then((svg) => {
          if (svg === undefined) {
            delete iconCache[url];
          }
        });
      }

      const svg = await iconCache[url];

      if (svg !== undefined) {
        return svg;
      }
    }
  }

  return undefined;
};

/**
 * Creates a UnoCSS icon preset backed by remote SVG collections with version fallback,
 * request deduplication/caching, retry handling, and `currentColor` inheritance.
 *
 * @example
 * ```ts
 * // uno.config.ts
 * import { defineConfig } from 'unocss';
 * import { presetPappIcon } from './preset-custom-icons';
 *
 * export default defineConfig({
 *   presets: [
 *     presetPappIcon({
 *       retries: 2,
 *       delay: 300,
 *       collections: {
 *         mc4: {
 *           baseUrl: 'https://assets.r2.lab.biz.id/icons/mingcute',
 *           versions: ['4.0.0'],
 *           styles: ['regular', 'filled'],
 *         },
 *       },
 *     }),
 *   ],
 * });
 * ```
 *
 * @param options - Optional configuration for collections and retry behavior.
 * @returns A UnoCSS preset configured with `presetIcons`.
 */
export const presetPappIcon = (
  options: PappIconOptions = {},
): PresetOrFactory => {
  const {
    retries = 3,
    delay = 500,
  } = options;

  const configuredCollections: Record<string, IIconCollection> = {
    ...defaultCollections,
    ...options.collections,
  };

  // Expand each collection into collection-level or `<collection>-<style>` loaders.
  const collections = Object.fromEntries(
    Object.entries(configuredCollections).flatMap(([name, config]) => {
      if (!config.styles?.length) {
        return [[
          name,
          (icon: string) => loadIcon(
            config,
            undefined,
            icon,
            retries,
            delay,
          ),
        ]];
      }

      return config.styles.map(style => [
        `${name}-${style}`,
        (icon: string) => loadIcon(
          config,
          style,
          icon,
          retries,
          delay,
        ),
      ]);
    }),
  );

  return presetIcons({
    collections,

    extraProperties: {
      display: 'inline-block',
      'vertical-align': 'middle',
    },

    customizations: {
      transform(svg) {
        // Add `fill="currentColor"` to the root <svg> only if it doesn't already declare a fill.
        return svg.replace(/<svg\b([^>]*)>/, (match, attrs: string) =>
          /\sfill=/.test(attrs)
            ? match
            : `<svg fill="currentColor"${attrs}>`);
      },
    },
  });
};