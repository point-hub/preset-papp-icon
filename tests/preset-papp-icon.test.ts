import { describe, it, expect } from "vitest"
import { presetPappIcon } from "../src"

describe("presetPappIcon", () => {
  it("fetches a collection from remote JSON", async () => {
    const preset = presetPappIcon({
      collections: {
        fas: "https://icons.iap.my.id/fontawesome/6/json/fontawesome-solid.json"
      }
    })

    // The preset returns lazy collection loaders
    const fas = (typeof preset === "function" ? preset() : preset).options!.collections!.fas
    const result = await fas()

    expect(result).toHaveProperty("icons")
    expect(Object.keys(result.icons).length).toBeGreaterThan(10)
  })

  it("returns cached result on second call", async () => {
    const preset = presetPappIcon()
    const fas = (typeof preset === "function" ? preset() : preset).options!.collections!.fas

    const first = await fas()
    const second = await fas()

    // Same reference, not re-fetched
    expect(first).toBe(second)
  })
})
