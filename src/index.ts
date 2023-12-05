import { type PresetFactory, presetIcons } from "unocss";

export default function presetPappIcon(iconsUrl = "https://icons.iap.my.id") {
  return presetIcons({
    cdn: "https://esm.sh/",
    extraProperties: {
      display: "inline-block",
      "vertical-align": "middle",
    },
    collections: {
      fab: async (iconName: string) =>
        await fetch(`${fontawesome(iconsUrl)}/brands/${iconName}.svg`).then(
          (res) => res.text()
        ),
      far: async (iconName: string) =>
        await fetch(`${fontawesome(iconsUrl)}/regular/${iconName}.svg`).then(
          (res) => res.text()
        ),
      fas: async (iconName: string) =>
        await fetch(`${fontawesome(iconsUrl)}/solid/${iconName}.svg`).then(
          (res) => res.text()
        ),
      fal: async (iconName: string) =>
        await fetch(`${fontawesome(iconsUrl)}/light/${iconName}.svg`).then(
          (res) => res.text()
        ),
      fat: async (iconName: string) =>
        await fetch(`${fontawesome(iconsUrl)}/thin/${iconName}.svg`).then(
          (res) => res.text()
        ),
      fad: async (iconName: string) =>
        await fetch(`${fontawesome(iconsUrl)}/duotone/${iconName}.svg`).then(
          (res) => res.text()
        ),
      fasr: async (iconName: string) =>
        await fetch(
          `${fontawesome(iconsUrl)}/sharp-regular/${iconName}.svg`
        ).then((res) => res.text()),
      fass: async (iconName: string) =>
        await fetch(
          `${fontawesome(iconsUrl)}/sharp-solid/${iconName}.svg`
        ).then((res) => res.text()),
      fasl: async (iconName: string) =>
        await fetch(
          `${fontawesome(iconsUrl)}/sharp-light/${iconName}.svg`
        ).then((res) => res.text()),
    },
    customizations: {
      transform(svg, collection) {
        if (
          [
            "fab",
            "far",
            "fas",
            "fal",
            "fat",
            "fad",
            "fasr",
            "fass",
            "fasl",
          ].includes(collection)
        )
          return svg.replace("path", 'path fill="currentColor"');

        return svg;
      },
    },
  }) as PresetFactory<any>;
}

function fontawesome(iconsUrl: string) {
  return `${iconsUrl}/fontawesome/6/svgs`;
}
