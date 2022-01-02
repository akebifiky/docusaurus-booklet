import { collectContents, generateCoverPageContent, generateTOCPageContent, PageContent } from "./contents";
import { BookletOptions } from "./options";
import { PageContentRewriter, rewriteContents } from "./page-rewriter";
import { generatePDF } from "./pdf";
import { CategoryTitleRewriter } from "./rewriters/category-title-rewriter";
import { ExcludingRewriter } from "./rewriters/excluding-rewriter";
import { linkRewriter } from "./rewriters/link-rewriter";
import { SectionNumberingRewriter } from "./rewriters/section-numbering-rewriter";

/**
 * Entrypoint to generate booklet PDF
 *
 * @param options The options
 */
export async function generateBooklet(options: BookletOptions) {
  const [sidebarContents, pageContents] = await collectContents(options);
  const additionalPages: PageContent[] = [];
  additionalPages.push(generateCoverPageContent(options.cover));
  if (options.toc !== undefined && options.toc !== false) {
    additionalPages.push(generateTOCPageContent(sidebarContents, options.toc, options.autonumber));
  }
  pageContents.unshift(...additionalPages);

  const rewriters: PageContentRewriter[] = [
    new ExcludingRewriter(options.selectors?.exclude || []),
    new CategoryTitleRewriter(sidebarContents),
    linkRewriter,
  ];
  if (options.autonumber) {
    rewriters.push(new SectionNumberingRewriter(sidebarContents));
  }
  await rewriteContents(pageContents, rewriters);
  await generatePDF(pageContents, options);
}
