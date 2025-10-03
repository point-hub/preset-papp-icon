import { presetIcons, PresetOrFactory } from 'unocss'

const fetchWithRetry = async (url: string, retries = 3, delay = 500): Promise<any> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      console.warn(`Attempt ${attempt} failed for ${url}: ${err}`)
      if (attempt < retries) {
        await new Promise(res => setTimeout(res, delay))
      } else {
        console.error(`Failed to fetch ${url} after ${retries} attempts.`)
        return {} // fallback to empty collection
      }
    }
  }
}

export const presetPappIcon = async (): Promise<PresetOrFactory> => {
  const urls = {
    fab: 'https://icons.iap.my.id/fontawesome/6/json/fontawesome-brands.json',
    fad: 'https://icons.iap.my.id/fontawesome/6/json/fontawesome-duotone.json',
    fal: 'https://icons.iap.my.id/fontawesome/6/json/fontawesome-light.json',
    far: 'https://icons.iap.my.id/fontawesome/6/json/fontawesome-regular.json',
    fas: 'https://icons.iap.my.id/fontawesome/6/json/fontawesome-solid.json',
    fat: 'https://icons.iap.my.id/fontawesome/6/json/fontawesome-thin.json',
    fasl: 'https://icons.iap.my.id/fontawesome/6/json/fontawesome-sharp-light.json',
    fasr: 'https://icons.iap.my.id/fontawesome/6/json/fontawesome-sharp-regular.json',
    fass: 'https://icons.iap.my.id/fontawesome/6/json/fontawesome-sharp-solid.json',
    fast: 'https://icons.iap.my.id/fontawesome/6/json/fontawesome-sharp-thin.json',
  }

  const collections: Record<string, any> = {}

  await Promise.all(
    Object.entries(urls).map(async ([name, url]) => {
      collections[name] = await fetchWithRetry(url, 3, 500)
    })
  )

  return presetIcons({
    cdn: 'https://esm.sh/',
    extraProperties: {
      display: 'inline-block',
      'vertical-align': 'middle',
    },
    collections,
    customizations: {
      transform(svg, collection) {
        if (collection in collections) {
          return svg.replace('path', 'path fill="currentColor"')
        }
        return svg
      },
    },
  })
}
