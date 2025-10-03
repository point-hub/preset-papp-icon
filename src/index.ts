import { presetIcons, PresetOrFactory } from 'unocss'

// Cache for dynamic import of ofetch
let ofetchFn: typeof import('ofetch').ofetch | null = null
const getOfetch = async () => {
  if (!ofetchFn) {
    const { ofetch } = await import('ofetch')
    ofetchFn = ofetch
  }
  return ofetchFn
}

// Cache per collection so we don’t re-fetch the same JSON multiple times
const collectionCache: Record<string, Promise<any>> = {}

/**
 * Fetch with retry using ofetch
 */
const fetchWithRetry = async (
  url: string,
  retries = 3,
  delay = 500
): Promise<any> => {
  const ofetch = await getOfetch()

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await ofetch(url) // auto JSON
    } catch (err) {
      if (attempt < retries) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`Retrying ${url} (attempt ${attempt})`, err)
        }
        await new Promise(res => setTimeout(res, delay))
      } else {
        console.error(`Failed to fetch ${url} after ${retries} attempts.`)
        return {
          icons: {},
          prefix: '',
        };
      }
    }
  }
}

export interface PappIconOptions {
  baseUrl?: string
  retries?: number
  delay?: number
  collections?: Record<string, string> // name → JSON URL
}

export const presetPappIcon = (
  options: PappIconOptions = {}
): PresetOrFactory => {
  const {
    baseUrl = 'https://icons.iap.my.id/fontawesome/6/json',
    retries = 3,
    delay = 500,
    collections: customCollections,
  } = options

  // Default FA collections
  const defaultCollections: Record<string, string> = {
    fab:  `${baseUrl}/fontawesome-brands.json`,
    fad:  `${baseUrl}/fontawesome-duotone.json`,
    fal:  `${baseUrl}/fontawesome-light.json`,
    far:  `${baseUrl}/fontawesome-regular.json`,
    fas:  `${baseUrl}/fontawesome-solid.json`,
    fat:  `${baseUrl}/fontawesome-thin.json`,
    fasl: `${baseUrl}/fontawesome-sharp-light.json`,
    fasr: `${baseUrl}/fontawesome-sharp-regular.json`,
    fass: `${baseUrl}/fontawesome-sharp-solid.json`,
    fast: `${baseUrl}/fontawesome-sharp-thin.json`,
  }

  const urls = { ...defaultCollections, ...customCollections }

  // Register lazy & cached loaders
  const collections: Record<string, () => Promise<any>> = {}
  for (const [name, url] of Object.entries(urls)) {
    collections[name] = async () => {
      if (!collectionCache[name]) {
        collectionCache[name] = fetchWithRetry(url, retries, delay)
      }
      return collectionCache[name]
    }
  }

  return presetIcons({
    cdn: 'https://esm.sh/',
    extraProperties: {
      display: 'inline-block',
      'vertical-align': 'middle',
    },
    collections,
    customizations: {
      transform(svg) {
        return svg.replace('path', 'path fill="currentColor"')
      },
    },
  })
}
