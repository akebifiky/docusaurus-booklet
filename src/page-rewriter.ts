import chalk from "chalk";
import cheerio, { CheerioAPI } from "cheerio";
import { PageContent, PAGE_SELECTOR } from "./contents";
import { Loader } from "./loader";

/**
 * Page contents rewriter based on Cheerio API
 *
 * @see https://github.com/cheeriojs/cheerio
 */
export interface PageContentRewriter {
  /**
   * The description of this rewriter's process (logging purpose)
   */
  description: string;

  /**
   * Rewrites page content
   *
   * @param $ The loaded Cheerio API
   * @param page The rewriting page content
   * @param index The page index (equals to page number)
   */
  rewrite($: CheerioAPI, page: PageContent, index: number): Promise<void>;
}

/**
 * Rewrites content HTML with rewriters
 *
 * @param contents The page content
 * @param rewriters The rewriters
 */
export async function rewriteContents(contents: PageContent[], rewriters: PageContentRewriter[]): Promise<void> {
  const loader = new Loader("dots");
  loader.start(chalk.cyan("Rewriting contents"));
  try {
    for (const [index, content] of contents.entries()) {
      const $ = cheerio.load(content.html);
      for (const rewriter of rewriters) {
        loader.update(chalk.cyan(`Rewriting contents of '${content.path}': ${rewriter.description}`));
        await rewriter.rewrite($, content, index);
      }
      content.html = $(PAGE_SELECTOR).parent().html() || "";
    }
  } finally {
    loader.stop();
  }
  console.log(chalk.green("✓ Pre-processing for PDF generation is completed"));
}
