import { CheerioAPI } from "cheerio";
import { PageContent, SidebarContent } from "../contents";
import { PageContentRewriter } from "../page-rewriter";
import { CATEGORY_TITLE_CSS_CLASS } from "./category-title-rewriter";

/** CSS class name of section number element */
export const SECTION_NUMBER_CLASS = "docusaurus-booklet-section-number";

/** Available delimiters */
export const AVAILABLE_DELIMITERS = {
  dot: ".",
  hyphen: "-",
};

/** Available delimiter types */
export type DelimiterType = keyof typeof AVAILABLE_DELIMITERS;

type NumberedHeading = {
  level: number;
  sectionNumbers: number[];
};

/**
 * Rewriter that prepend section number to headings
 *
 * e.g. '<h1>Heading</h1>' --> '<h1><span class="docusaurus-booklet-section-number">2.1.</span>Heading</h1>'
 */
export class SectionNumberingRewriter implements PageContentRewriter {
  public readonly description = "Numbering sections";

  /** Section numbers per page (e.g. 1-3-2 => [1,3,2]) */
  private sectionNumbersDictionary: Map<string, number[]> = new Map();

  private delimiter: string;

  public constructor(sidebarContents: SidebarContent[], delimiterName: DelimiterType = "dot") {
    this.initDictionary(sidebarContents, []);
    this.delimiter = AVAILABLE_DELIMITERS[delimiterName];
  }

  public async rewrite($: CheerioAPI, page: PageContent): Promise<void> {
    const sectionNumbers = this.sectionNumbersDictionary.get(page.path);
    if (!sectionNumbers) {
      return;
    }
    if (sectionNumbers.length > 1 && sectionNumbers.slice(-1)[0] === 1) {
      $(`.${CATEGORY_TITLE_CSS_CLASS}`).prepend(this.getSectionNumberLabel(sectionNumbers.slice(0, -1)));
    }
    $("h1").prepend(this.getSectionNumberLabel(sectionNumbers));

    let previousHeading: NumberedHeading = {
      level: 1,
      sectionNumbers: sectionNumbers,
    };
    $("h2,h3,h4,h5,h6").each((index, element) => {
      const currentLevel = parseInt(Array.from(element.tagName)[1], 10);
      let currentSectionNumbers: number[];

      if (previousHeading.level < currentLevel) {
        currentSectionNumbers = previousHeading.sectionNumbers.concat([1]);
      } else if (previousHeading.level > currentLevel) {
        currentSectionNumbers = previousHeading.sectionNumbers
          .slice(0, -2)
          .concat(previousHeading.sectionNumbers.slice(-1)[0] + 1);
      } else {
        currentSectionNumbers = previousHeading.sectionNumbers
          .slice(0, -1)
          .concat(previousHeading.sectionNumbers.slice(-1)[0] + 1);
      }
      $(element).prepend(this.getSectionNumberLabel(currentSectionNumbers));

      previousHeading = {
        level: currentLevel,
        sectionNumbers: currentSectionNumbers,
      };
    });
  }

  private initDictionary(contents: SidebarContent[], baseSectionNumbers: number[]) {
    contents.forEach((content, index) => {
      const sectionNumbers = baseSectionNumbers.concat([index + 1]);
      if (content.children.length > 0) {
        this.initDictionary(content.children, sectionNumbers);
      } else {
        this.sectionNumbersDictionary.set(content.link, sectionNumbers);
      }
    });
  }

  private getSectionNumberLabel(sectionNumbers: number[]): string {
    return `<span class="${SECTION_NUMBER_CLASS}">${sectionNumbers.join(this.delimiter) + this.delimiter}</span>`;
  }
}
