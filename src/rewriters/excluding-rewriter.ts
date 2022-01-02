import { CheerioAPI } from "cheerio";
import { PageContentRewriter } from "../page-rewriter";

/**
 * Rewriter that removes unnecessary elements
 */
export class ExcludingRewriter implements PageContentRewriter {
  public description = "Excluding elements";
  private selectors: string[];

  /**
   * Creates instance with selectors
   * @param selectors The selectors to select unnecessary elements
   */
  public constructor(selectors: string[]) {
    this.selectors = selectors;
  }

  public async rewrite($: CheerioAPI): Promise<void> {
    this.selectors.forEach((selector) => $(selector).remove());
  }
}
