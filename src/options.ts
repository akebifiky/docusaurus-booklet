import { PaperFormat, PDFMargin } from "puppeteer";

/**
 * Options for PDF generation
 */
export type BookletOptions = {
  /** Entry point page path (e.g. /docs/intro) */
  entryPoint: string;

  /** User-custom puppeteer (chromium) launch arguments */
  puppeteerArgs?: string[];

  /** Output PDF path */
  output: string;

  /** Docusaurus build directory path */
  baseDirectory: string;

  /** Cover page options */
  cover: CoverOptions;

  /** TOC (Table of Contents) options */
  toc?: TableOfContentsOptions | false;

  /** PDF format (same as puppeteer option) */
  format?: PaperFormat;

  /** PDF content margin (same as puppeteer option) */
  margin?: PDFMargin;

  /** User-custom CSS file path */
  css?: string;

  /** PDF header options (disable if false) */
  header?: HeaderOptions | HTMLFragmentOption | false;

  /** PDF footer options (disable if false) */
  footer?: FooterOptions | HTMLFragmentOption | false;

  /** Enable/Disable section numbering */
  autonumber?: boolean;

  /** Content selectors */
  selectors?: {
    /** Main content selector */
    mainContent?: string;

    /** Next page link selector */
    pagination?: string;

    /** Sidebar content selector */
    sidebar?: string;

    /** Excluding content selectors */
    exclude?: string[];
  };
};

/**
 * Options for cover page
 */
export type CoverOptions = {
  /** Title */
  title: string;

  /** Subtitle */
  subtitle?: string;

  /** Background image path */
  backgroundImage?: string;

  /** PDF content margin for cover page (same as puppeteer option)  */
  margin?: PDFMargin;
};

/**
 * Options for table of contents
 */
export type TableOfContentsOptions = {
  title: string;
};

/**
 * Options for PDF header
 */
export type HeaderOptions = {
  /** Header text */
  text?: string;

  /** Show/Hide version */
  version?: boolean;

  /** Additional styles for header (such as 'font-size', 'color', etc.) */
  style?: string;
};

/**
 * Options for PDF footer
 */
export type FooterOptions = {
  /** Footer text */
  text?: string;

  /** Show/Hide page number, or text generator that generates from placeholders */
  pageNumber?: boolean | ((pageNumber: string, totalPages: string) => string);

  /** Additional styles for footer (such as 'font-size', 'color', etc.) */
  style?: string;
};

/**
 * Option to specify HTML source
 */
export type HTMLFragmentOption = {
  /** HTML source */
  html: string;
};

export function isHTMLFragmentOption(option: unknown): option is HTMLFragmentOption {
  if (option === null) {
    return false;
  }
  const record = option as Record<string, unknown>;
  return record.html !== null && typeof record.html === "string";
}
