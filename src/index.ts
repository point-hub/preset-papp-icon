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
    baseUrl = 'https://assets.r2.lab.biz.id/icons',
    retries = 3,
    delay = 500,
    collections: customCollections,
  } = options

  // Default FA collections
  const defaultCollections: Record<string, string> = {
    'fa7-brands': `${baseUrl}/fa7/fa7-brands.json`,
    'fa7-duotone': `${baseUrl}/fa7/fa7-duotone.json`,
    'fa7-duotone-light': `${baseUrl}/fa7/fa7-duotone-light.json`,
    'fa7-duotone-regular': `${baseUrl}/fa7/fa7-duotone-regular.json`,
    'fa7-duotone-thin': `${baseUrl}/fa7/fa7-duotone-thin.json`,
    'fa7-solid': `${baseUrl}/fa7/fa7-solid.json`,
    'fa7-light': `${baseUrl}/fa7/fa7-light.json`,
    'fa7-regular': `${baseUrl}/fa7/fa7-regular.json`,
    'fa7-thin': `${baseUrl}/fa7/fa7-thin.json`,
    'fa7-sharp-solid': `${baseUrl}/fa7/fa7-sharp-solid.json`,
    'fa7-sharp-light': `${baseUrl}/fa7/fa7-sharp-light.json`,
    'fa7-sharp-regular': `${baseUrl}/fa7/fa7-sharp-regular.json`,
    'fa7-sharp-thin': `${baseUrl}/fa7/fa7-sharp-thin.json`,
    'fa7-sharp-duotone-solid': `${baseUrl}/fa7/fa7-sharp-duotone-solid.json`,
    'fa7-sharp-duotone-light': `${baseUrl}/fa7/fa7-sharp-duotone-light.json`,
    'fa7-sharp-duotone-regular': `${baseUrl}/fa7/fa7-sharp-duotone-regular.json`,
    'fa7-sharp-duotone-thin': `${baseUrl}/fa7/fa7-sharp-duotone-thin.json`,
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
