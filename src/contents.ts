import chalk from "chalk";
import cheerio, { Cheerio, CheerioAPI, Node } from "cheerio";
import fs from "fs";
import mimeTypes from "mime-types";
import path from "path";
import slash from "slash";
import { Loader } from "./loader";
import { BookletOptions, CoverOptions, TableOfContentsOptions } from "./options";
import { AVAILABLE_DELIMITERS, DelimiterType, SECTION_NUMBER_CLASS } from "./rewriters/section-numbering-rewriter";

/** Common class for each page wrapper */
export const PAGE_CLASS = "docusaurus-booklet-page";

/** Common selector to select the element contains page content */
export const PAGE_SELECTOR = `.${PAGE_CLASS}`;

/** Cover page ID */
export const COVER_PAGE_ID = "cover";

/** Table of Contents page ID */
export const TOC_PAGE_ID = "table-of-contents";

/**
 * Type indicating the extracted page
 */
export type PageContent = {
  /** HTML source */
  html: string;

  /** Page path */
  path: string;
};

/**
 * Type indicating the extracted sidebar elements
 */
export type SidebarContent = {
  /** Label in sidebar */
  label: string;

  /** Link path */
  link: string;

  /** Child pages, or empty if this content is not a category */
  children: SidebarContent[];
};

/**
 * Scrapes pages and collects contents
 *
 * @param options The options for generation
 * @returns page contents
 */
export async function collectContents(options: BookletOptions): Promise<[SidebarContent[], PageContent[]]> {
  const { entryPoint, selectors } = options;
  const pageContents: PageContent[] = [];
  let sidebarContents: SidebarContent[] = [];

  const loader = new Loader();
  loader.start();
  try {
    let currentPagePath: string | undefined = entryPoint.replace("/index.html", "").replace(/\/$/g, "");

    while (currentPagePath) {
      const filePath = slash(path.join(options.baseDirectory, currentPagePath, "index.html"));
      if (!fs.existsSync(filePath)) {
        throw new Error(`Page ${currentPagePath} does not exist.`);
      }

      loader.update(chalk.cyan(`Collecting page (${pageContents.length + 1}): ${currentPagePath}`));
      const pageHTML = fs.readFileSync(filePath).toString("utf-8");
      const $ = cheerio.load(pageHTML);

      // extract page content
      const contentHTML = $.html(selectors?.mainContent || "article");
      pageContents.push({
        html: `<div class="${PAGE_CLASS}" data-path="${currentPagePath}">${contentHTML}</div>`,
        path: currentPagePath,
      });

      // extract sidebar contents
      const sidebarElement = $(selectors?.sidebar || ".theme-doc-sidebar-menu");
      const currentPageSidebarContents = sidebarElement
        .first()
        .children()
        .toArray()
        .map((item) => getSidebarItem($(item), $));
      if (sidebarContents.length === currentPageSidebarContents.length) {
        sidebarContents = sidebarContents.map((content, index) => merge(content, currentPageSidebarContents[index]));
      } else {
        sidebarContents =
          sidebarContents.length > currentPageSidebarContents.length ? sidebarContents : currentPageSidebarContents;
      }

      currentPagePath = $(selectors?.pagination || ".pagination-nav__item--next > a").attr("href");
    }
  } finally {
    loader.stop();
  }
  console.log(chalk.green(`✓ ${pageContents.length} pages are collected`));

  return [sidebarContents, pageContents];
}

function getSidebarItem(sidebarItem: Cheerio<Node>, $: CheerioAPI): SidebarContent {
  const link = sidebarItem.find("a").first();
  const childList = sidebarItem.find("ul,ol")[0];
  const children = childList ? childList.children.map((child) => getSidebarItem($(child), $)) : [];
  return {
    label: link.text(),
    link: children.length ? children[0].link : link.attr("href") || "#",
    children: children,
  };
}

function merge(destination: SidebarContent, source: SidebarContent): SidebarContent {
  if (destination.children.length === source.children.length) {
    return {
      label: source.label,
      link: source.link,
      children: destination.children.map((destChild, index) => merge(destChild, source.children[index])),
    };
  }
  return {
    label: source.label,
    link: source.link,
    children: destination.children.length > source.children.length ? destination.children : source.children,
  };
}

/**
 * Generates cover page content
 *
 * @param options The cover options
 * @returns cover page content
 */
export function generateCoverPageContent({ title, subtitle, version, backgroundImage }: CoverOptions): PageContent {
  const styleAttribute = backgroundImage ? ` style="background-image:url('${encodeImage(backgroundImage)}')"` : "";
  return {
    html: `
      <div class="${PAGE_CLASS}"${styleAttribute}>
        <div class="docusaurus-booklet-cover-content">
          <h1 class="title">${title}</h1>
          ${subtitle ? '<h2 class="subtitle">' + subtitle + "</h2>" : ""}
          ${version ? '<h3 class="version">' + process.env.npm_package_version + "</h3>" : ""}
        </div>
      </div>
    `,
    path: COVER_PAGE_ID,
  };
}

/**
 * Encode image file to Base64 url
 */
function encodeImage(imagePath: string): string {
  const mimeType = mimeTypes.lookup(imagePath);
  if (mimeType === false) {
    return "";
  }
  const base64EncodedFile = fs.readFileSync(path.resolve(imagePath)).toString("base64");
  return `data:${mimeType};base64,${base64EncodedFile}`;
}

/**
 * Generate table of contents page
 *
 * @param options The table of contents options
 * @param sidebarContents The sidebar contents
 */
export function generateTOCPageContent(
  sidebarContents: SidebarContent[],
  { title }: TableOfContentsOptions,
  autonumber?: boolean
): PageContent {
  const delimiterType = autonumber ? "dot" : undefined;
  const itemHTML = sidebarContents
    .map((content, index) => `${generateTOCEntry(content, [index + 1], delimiterType)}`)
    .join("\n");
  const html = `
    <div class="${PAGE_CLASS}">
      <article>
        <h1>${title}</h1>
        <div class="docusaurus-booklet-toc${autonumber ? " autonumbered" : ""}">
          <ul class="docusaurus-booklet-toc-list level-1">
            ${itemHTML}
          </ul>
        </div>
      </article>
    </div>
  `;
  return {
    html: html,
    path: TOC_PAGE_ID,
  };
}

function generateTOCEntry(
  sidebarContent: SidebarContent,
  sectionNumbers: number[],
  delimiterType?: DelimiterType
): string {
  const sectionNumbersLabel = delimiterType
    ? `<span class="${SECTION_NUMBER_CLASS}">${
        sectionNumbers.join(AVAILABLE_DELIMITERS[delimiterType]) + AVAILABLE_DELIMITERS[delimiterType]
      }</span>`
    : "";
  let childListHTML = "";
  if (sidebarContent.children.length) {
    childListHTML = `<ul class="docusaurus-booklet-toc-list level-${sectionNumbers.length + 1}">
        ${sidebarContent.children
          .map((child, index) => generateTOCEntry(child, sectionNumbers.concat(index + 1), delimiterType))
          .join("\n")}
      </ul>
    `;
  }
  return `<li class="docusaurus-booklet-toc-list-entry">
      <a href="${sidebarContent.link}">${sectionNumbersLabel}${sidebarContent.label}</a>
      ${childListHTML}
    </li>`;
}
