import { PAGE_SELECTOR } from "../contents";
import { PageContentRewriter } from "../page-rewriter";

/**
 * Converts pathname of URL to element ID
 *
 * @param pathname The pathname of page URL
 * @returns  element ID
 */
function convertPathToID(pathname: string) {
  return pathname.replace(/^\//, "").replace("/", "__").replace("#", "--");
}

/**
 * Rewriter to rewrites all internal links to ID.
 */
export const linkRewriter: PageContentRewriter = {
  description: "Rewriting internal links",

  rewrite: async ($, page) => {
    const pageID = convertPathToID(page.path);

    // rewrite IDs
    $("[id]").each((index, element) => {
      const $element = $(element);
      const id = $element.attr("id");
      $element.attr("id", `${pageID}--${id}`);
    });

    // identify page content wrapper
    $(PAGE_SELECTOR).attr("id", pageID);

    // rewrite links
    $("a").each((index, element) => {
      const $element = $(element);
      const link = $element.attr("href");
      if (!link || /^https?:\/\/.*/.test(link)) {
        // ignore external link
        return;
      }
      $element.attr("href", "#" + convertPathToID(link.startsWith("#") ? pageID + link : link));
    });
  },
};
