import { describe, it, expect } from "vitest"
import { presetPappIcon } from "../src"

// --- Helper function to get the collection loader ---
// This is a common pattern for unocss presets that can return a function or an object
const getCollectionLoader = (preset: any, collectionName: string) => {
  const options = typeof preset === "function" ? preset() : preset
  return options.options?.collections?.[collectionName]
}

describe("presetPappIcon", () => {
  // Use a known collection key from the preset's defaults, like 'fa7-solid'
  const collectionKey = 'fa7-solid'

  it("fetches a collection from remote JSON", async () => {
    const preset = presetPappIcon()

    // Use the correct collection key: 'fa7-solid' instead of 'fas'
    const loader = getCollectionLoader(preset, collectionKey)

    // Ensure the loader exists before attempting to call it
    expect(loader).toBeTypeOf('function')

    const result = await loader()

    expect(result).toHaveProperty("icons")
    // Use the same threshold or a more appropriate one
    expect(Object.keys(result.icons).length).toBeGreaterThan(10)
  })

  it("returns cached result on second call", async () => {
    const preset = presetPappIcon()

    // Use the correct collection key: 'fa7-solid' instead of 'fas'
    const loader = getCollectionLoader(preset, collectionKey)

    // Ensure the loader exists before attempting to call it
    expect(loader).toBeTypeOf('function')

    const first = await loader()
    const second = await loader()

    // Same reference, not re-fetched
    expect(first).toBe(second)
  })
})