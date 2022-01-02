import prettier from "prettier";

/**
 * Utility that returns formatted source
 *
 * @param html source
 * @returns formatted source
 */
export function formatted(html: string): string {
  return prettier.format(html, { parser: "babel" });
}
