import { presetIcons } from "unocss";

export default function presetPappIcon(iconsUrl = "https://icons.iap.my.id") {
  return {
    name: "preset-papp-icon",
    presets: [
      presetIcons({
        cdn: "https://esm.sh/",
        extraProperties: {
          display: "block",
        },
        collections: {
          fab: async (iconName: string) =>
            await fetch(
              `${iconsUrl}/fontawesome/6/svgs/brands/${iconName}.svg`
            ).then((res) => res.text()),
          far: async (iconName: string) =>
            await fetch(
              `${iconsUrl}/fontawesome/6/svgs/regular/${iconName}.svg`
            ).then((res) => res.text()),
          fas: async (iconName: string) =>
            await fetch(
              `${iconsUrl}/fontawesome/6/svgs/solid/${iconName}.svg`
            ).then((res) => res.text()),
          fal: async (iconName: string) =>
            await fetch(
              `${iconsUrl}/fontawesome/6/svgs/light/${iconName}.svg`
            ).then((res) => res.text()),
          fat: async (iconName: string) =>
            await fetch(
              `${iconsUrl}/fontawesome/6/svgs/thin/${iconName}.svg`
            ).then((res) => res.text()),
          fad: async (iconName: string) =>
            await fetch(
              `${iconsUrl}/fontawesome/6/svgs/duotone/${iconName}.svg`
            ).then((res) => res.text()),
          fasr: async (iconName: string) =>
            await fetch(
              `${iconsUrl}/fontawesome/6/svgs/sharp-regular/${iconName}.svg`
            ).then((res) => res.text()),
          fass: async (iconName: string) =>
            await fetch(
              `${iconsUrl}/fontawesome/6/svgs/sharp-solid/${iconName}.svg`
            ).then((res) => res.text()),
          fasl: async (iconName: string) =>
            await fetch(
              `${iconsUrl}/fontawesome/6/svgs/sharp-light/${iconName}.svg`
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
      }),
    ],
  };
}
