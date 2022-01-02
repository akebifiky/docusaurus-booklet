import { CheerioAPI } from "cheerio";
import { PageContent, PAGE_SELECTOR, SidebarContent } from "../contents";
import { PageContentRewriter } from "../page-rewriter";

export const CATEGORY_TITLE_CSS_CLASS = "docusaurus-booklet-category-title";

/**
 * Rewriter that prepends category title to the first page of the each category.
 */
export class CategoryTitleRewriter implements PageContentRewriter {
  private categoryMapping: Map<string, PageCategory>;
  public description = "Inserting category title";

  /**
   * Create instance with the contents
   * @param sidebarContents The contents containing category title
   */
  public constructor(sidebarContents: SidebarContent[]) {
    this.categoryMapping = new Map();
    PageCategory.listCategories(sidebarContents).forEach((category) =>
      this.categoryMapping.set(category.firstPageURL, category)
    );
  }

  public async rewrite($: CheerioAPI, page: PageContent): Promise<void> {
    const category = this.categoryMapping.get(page.path);
    if (!category) {
      return;
    }
    const element = $(
      `<div class="${CATEGORY_TITLE_CSS_CLASS}" data-category-level="${category.level}">${category.label}</div>`
    );
    $(PAGE_SELECTOR).prepend(element);
  }
}

/**
 * The page category based on sidebar content
 */
class PageCategory {
  private parent?: PageCategory;
  private _label: string;
  private _firstPageURL: string;
  private subCategories: PageCategory[];

  /**
   * Create instance with a sidebar content
   *
   * @param content The sidebar content (must have least one child content)
   * @param parent The parent category, or empty if this category is top level
   */
  public constructor(content: SidebarContent, parent?: PageCategory) {
    if (!content.children.length) {
      throw new Error("Invalid argument");
    }
    this.parent = parent;
    this._label = content.label;
    this._firstPageURL = content.link;
    this.subCategories = content.children
      .filter((childContent) => childContent.children.length > 0)
      .map((childContent) => new PageCategory(childContent, this));
  }

  /**
   * Returns category title
   */
  public get label(): string {
    return this._label;
  }

  /**
   * Returns URL of the first page of this category
   */
  public get firstPageURL(): string {
    return this._firstPageURL;
  }

  /**
   * Returns the level (depth) of this category (returns '1' if this category has no parent)
   */
  public get level(): number {
    let level = 1;
    let category = this.parent;
    while (category) {
      level++;
      category = category.parent;
    }
    return level;
  }

  /**
   * Returns the array of categories including this and all sub categories
   */
  public flatten(): PageCategory[] {
    return [this, ...this.subCategories.flatMap((child) => child.flatten())];
  }

  /**
   * List all page categories in the given contents
   * @param contents The base contents
   * @returns the list of categories in the contents
   */
  public static listCategories(contents: SidebarContent[]): PageCategory[] {
    return contents
      .filter((content) => content.children.length > 0)
      .map((content) => new PageCategory(content))
      .flatMap((content) => content.flatten());
  }
}
