// preset-custom-icons.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('unocss', () => ({
  presetIcons: vi.fn((options: unknown) => options),
}));

type Loader = (icon: string) => Promise<string | undefined>;

interface CapturedOptions {
  collections: Record<string, Loader>;
  extraProperties: Record<string, string>;
  customizations: { transform: (svg: string) => string };
}

const BASE = 'https://assets.r2.lab.biz.id/icons';

const ok = (body = '<svg></svg>') => new Response(body, { status: 200 });
const notFound = () => new Response('', { status: 404 });
const serverError = () => new Response('', { status: 500 });

const fetchMock = vi.fn();

/**
 * Re-imports the module for every call so the module-level `iconCache`
 * never leaks between tests.
 */
const createPreset = async (options: Record<string, unknown> = {}) => {
  vi.resetModules();
  const { presetPappIcon } = await import('../src/index');

  return presetPappIcon({ delay: 0, ...options }) as unknown as CapturedOptions;
};

/** Makes `fetch` answer from a `url -> body` map; anything else is a 404. */
const serve = (files: Record<string, string>) => {
  fetchMock.mockImplementation(async (url: string) =>
    url in files ? ok(files[url]) : notFound());
};

const requestedUrls = () => fetchMock.mock.calls.map(([url]) => url as string);

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'warn').mockImplementation(() => { });
  vi.spyOn(console, 'error').mockImplementation(() => { });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('collection registration', () => {
  it('registers one loader per `<collection>-<style>`', async () => {
    const { collections } = await createPreset();

    expect(collections).toHaveProperty('fa7-solid');
    expect(collections).toHaveProperty('fa7-sharp-duotone-thin');
    expect(collections).toHaveProperty('ph2-bold');
    expect(collections).toHaveProperty('hi2-outline');
    expect(collections).toHaveProperty('mc4-filled');
  });

  it('does not register the bare name for collections with styles', async () => {
    const { collections } = await createPreset();

    expect(collections).not.toHaveProperty('fa7');
    expect(collections).not.toHaveProperty('ph2');
  });

  it('registers style-less collections under the bare name', async () => {
    const { collections } = await createPreset();

    expect(collections).toHaveProperty('lucide');
  });

  it('merges custom collections with the defaults', async () => {
    const { collections } = await createPreset({
      collections: {
        custom: { baseUrl: 'https://example.com/icons', styles: ['outline'] },
      },
    });

    expect(collections).toHaveProperty('custom-outline');
    expect(collections).toHaveProperty('fa7-solid');
  });

  it('lets a custom collection override a default one', async () => {
    const { collections } = await createPreset({
      collections: {
        hi2: { baseUrl: 'https://example.com/heroicons', styles: ['mini'] },
      },
    });

    expect(collections).toHaveProperty('hi2-mini');
    expect(collections).not.toHaveProperty('hi2-solid');
  });
});

describe('URL building', () => {
  it('builds `<baseUrl>/<version>/svgs/<style>/<icon>.svg`', async () => {
    serve({ [`${BASE}/fontawesome/7.3.1/svgs/solid/house.svg`]: '<svg id="house"/>' });
    const { collections } = await createPreset();

    await expect(collections['fa7-solid']('house')).resolves.toBe('<svg id="house"/>');
    expect(requestedUrls()).toEqual([`${BASE}/fontawesome/7.3.1/svgs/solid/house.svg`]);
  });

  it('omits the style segment for style-less collections', async () => {
    serve({ [`${BASE}/lucide/1.79.0/svgs/house.svg`]: '<svg id="lucide"/>' });
    const { collections } = await createPreset();

    await expect(collections.lucide('house')).resolves.toBe('<svg id="lucide"/>');
  });

  it('omits the version segment when no versions are configured', async () => {
    serve({ 'https://example.com/icons/svgs/logo.svg': '<svg id="logo"/>' });
    const { collections } = await createPreset({
      collections: { custom: { baseUrl: 'https://example.com/icons' } },
    });

    await expect(collections.custom('logo')).resolves.toBe('<svg id="logo"/>');
  });

  it('normalizes trailing slashes on baseUrl', async () => {
    serve({ 'https://example.com/icons/svgs/logo.svg': '<svg/>' });
    const { collections } = await createPreset({
      collections: { custom: { baseUrl: 'https://example.com/icons///' } },
    });

    await collections.custom('logo');

    expect(requestedUrls()).toEqual(['https://example.com/icons/svgs/logo.svg']);
  });
});

describe('filename fallback (`<icon>` then `<icon>-<style>`)', () => {
  const bold = (name: string) => `${BASE}/phosphor/2.1.0/svgs/bold/${name}.svg`;

  it('falls back to the suffixed name after a 404', async () => {
    serve({ [bold('acorn-bold')]: '<svg id="acorn-bold"/>' });
    const { collections } = await createPreset();

    await expect(collections['ph2-bold']('acorn')).resolves.toBe('<svg id="acorn-bold"/>');
    expect(requestedUrls()).toEqual([bold('acorn'), bold('acorn-bold')]);
  });

  it('does not try the suffixed name when the plain name exists', async () => {
    serve({ [bold('acorn')]: '<svg id="plain"/>' });
    const { collections } = await createPreset();

    await expect(collections['ph2-bold']('acorn')).resolves.toBe('<svg id="plain"/>');
    expect(requestedUrls()).toEqual([bold('acorn')]);
  });

  it('does not append the style when the icon already ends with it', async () => {
    serve({ [bold('acorn-bold')]: '<svg id="acorn-bold"/>' });
    const { collections } = await createPreset();

    await expect(collections['ph2-bold']('acorn-bold')).resolves.toBe('<svg id="acorn-bold"/>');
    expect(requestedUrls()).toEqual([bold('acorn-bold')]);
  });

  it('returns undefined when neither filename exists', async () => {
    serve({});
    const { collections } = await createPreset();

    await expect(collections['ph2-bold']('nope')).resolves.toBeUndefined();
    expect(requestedUrls()).toEqual([bold('nope'), bold('nope-bold')]);
  });

  it('does not try a suffix for style-less collections', async () => {
    serve({});
    const { collections } = await createPreset();

    await collections.lucide('nope');

    expect(requestedUrls()).toEqual([`${BASE}/lucide/1.79.0/svgs/nope.svg`]);
  });
});

describe('version fallback', () => {
  const config = {
    custom: {
      baseUrl: 'https://example.com/icons',
      versions: ['2.0.0', '1.0.0'],
      styles: ['solid'],
    },
  };

  it('tries versions in order and returns the first match', async () => {
    serve({ 'https://example.com/icons/1.0.0/svgs/solid/star.svg': '<svg id="v1"/>' });
    const { collections } = await createPreset({ collections: config });

    await expect(collections['custom-solid']('star')).resolves.toBe('<svg id="v1"/>');
    expect(requestedUrls()).toEqual([
      'https://example.com/icons/2.0.0/svgs/solid/star.svg',
      'https://example.com/icons/2.0.0/svgs/solid/star-solid.svg',
      'https://example.com/icons/1.0.0/svgs/solid/star.svg',
    ]);
  });

  it('prefers the first version when it has the icon', async () => {
    serve({
      'https://example.com/icons/2.0.0/svgs/solid/star.svg': '<svg id="v2"/>',
      'https://example.com/icons/1.0.0/svgs/solid/star.svg': '<svg id="v1"/>',
    });
    const { collections } = await createPreset({ collections: config });

    await expect(collections['custom-solid']('star')).resolves.toBe('<svg id="v2"/>');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('caching', () => {
  it('fetches a given URL only once', async () => {
    serve({ [`${BASE}/lucide/1.79.0/svgs/house.svg`]: '<svg/>' });
    const { collections } = await createPreset();

    await collections.lucide('house');
    await collections.lucide('house');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent requests for the same icon', async () => {
    serve({ [`${BASE}/lucide/1.79.0/svgs/house.svg`]: '<svg/>' });
    const { collections } = await createPreset();

    const results = await Promise.all([
      collections.lucide('house'),
      collections.lucide('house'),
      collections.lucide('house'),
    ]);

    expect(results).toEqual(['<svg/>', '<svg/>', '<svg/>']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('evicts failed lookups so they can be retried later', async () => {
    serve({});
    const { collections } = await createPreset();

    await collections.lucide('house');
    // Let the eviction `.then()` handler run.
    await Promise.resolve();

    serve({ [`${BASE}/lucide/1.79.0/svgs/house.svg`]: '<svg id="late"/>' });

    await expect(collections.lucide('house')).resolves.toBe('<svg id="late"/>');
  });
});

describe('retry handling', () => {
  it('does not retry on 404', async () => {
    fetchMock.mockImplementation(async () => notFound());
    const { collections } = await createPreset({ retries: 3 });

    await collections.lucide('house');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries on HTTP errors and succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce(serverError())
      .mockResolvedValueOnce(ok('<svg id="recovered"/>'));
    const { collections } = await createPreset({ retries: 3 });

    await expect(collections.lucide('house')).resolves.toBe('<svg id="recovered"/>');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries on network errors and succeeds', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('network down'))
      .mockResolvedValueOnce(ok('<svg id="recovered"/>'));
    const { collections } = await createPreset({ retries: 2 });

    await expect(collections.lucide('house')).resolves.toBe('<svg id="recovered"/>');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after the configured number of attempts', async () => {
    fetchMock.mockImplementation(async () => serverError());
    const { collections } = await createPreset({ retries: 3 });

    await expect(collections.lucide('house')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('defaults to 3 attempts', async () => {
    fetchMock.mockImplementation(async () => serverError());
    const { collections } = await createPreset();

    await collections.lucide('house');

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe('svg transform', () => {
  it('adds fill="currentColor" when the root has no fill', async () => {
    const { customizations } = await createPreset();

    expect(customizations.transform('<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>'))
      .toBe('<svg fill="currentColor" viewBox="0 0 24 24"><path d="M0 0"/></svg>');
  });

  it('keeps an existing root fill instead of duplicating it', async () => {
    const { customizations } = await createPreset();
    const svg = '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M0 0"/></svg>';
    const result = customizations.transform(svg);

    expect(result).toBe(svg);
    expect(result.match(/fill=/g)).toHaveLength(1);
  });

  it('leaves fills on child elements out of the check', async () => {
    const { customizations } = await createPreset();

    expect(customizations.transform('<svg viewBox="0 0 24 24"><path fill="red"/></svg>'))
      .toBe('<svg fill="currentColor" viewBox="0 0 24 24"><path fill="red"/></svg>');
  });
});

describe('preset options', () => {
  it('sets inline-block and vertical-align defaults', async () => {
    const { extraProperties } = await createPreset();

    expect(extraProperties).toEqual({
      display: 'inline-block',
      'vertical-align': 'middle',
    });
  });
});