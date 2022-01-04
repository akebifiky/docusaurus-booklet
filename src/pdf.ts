import chalk from "chalk";
import fs from "fs";
import http from "http";
import { AddressInfo } from "net";
import { PDFDocument } from "pdf-lib";
import puppeteer from "puppeteer";
import serveHandler from "serve-handler";
import { PageContent } from "./contents";
import { Loader } from "./loader";
import { BookletOptions, isHTMLFragmentOption } from "./options";

/**
 * Generate PDF
 *
 * @param pageContents The page contents (must contain cover content as the first element)
 * @param options The options for generation
 * @param page The Puppeteer window
 */
export async function generatePDF(pageContents: PageContent[], options: BookletOptions): Promise<void> {
  const previewServer = http.createServer((request, response) =>
    serveHandler(request, response, {
      cleanUrls: true,
      public: options.baseDirectory,
    })
  );
  return new Promise((resolve, reject) => {
    previewServer.listen(0);
    previewServer.on("listening", () => {
      const addressInfo = previewServer.address() as AddressInfo;
      exportPDF(pageContents, options, addressInfo)
        .then(() => {
          resolve();
          previewServer.close();
        })
        .catch((error) => {
          previewServer.close();
          reject(error);
        });
    });
  });
}

/**
 * Scrapes and generate PDF with preview server
 *
 * @param pageContents The contents to export
 * @param options The booklet options
 * @param serverInfo The preview server info
 */
async function exportPDF(pageContents: PageContent[], options: BookletOptions, serverInfo: AddressInfo): Promise<void> {
  const basePageURL = `http://localhost:${serverInfo.port}${options.entryPoint}`;
  const coverHTML = pageContents[0].html;
  const contentsHTML = pageContents
    .slice(1)
    .map((content) => content.html)
    .join("");

  const loader = new Loader();
  const browser = await puppeteer.launch({
    headless: true,
    args: options.puppeteerArgs,
    ignoreDefaultArgs: process.platform === "win32" ? ["--disable-extensions"] : false,
  });
  loader.start();
  try {
    loader.update(chalk.cyan("PDF generation: Preparing page"));
    const page = await browser.newPage();
    await page.goto(basePageURL, {
      waitUntil: "networkidle0",
      timeout: 0,
    });
    if (options.css) {
      const customCSS = fs.readFileSync(options.css, { encoding: "utf-8" }).toString();
      await page.addStyleTag({ content: customCSS });
    }

    loader.update(chalk.cyan("PDF generation: Loading cover page contents"));
    await page.evaluate((html) => {
      document.body.innerHTML = html;
    }, coverHTML);
    await page.evaluateHandle("document.fonts.ready");
    await page.waitForNetworkIdle();

    loader.update(chalk.cyan("PDF generation: Generating cover PDF"));
    const coverData = await page.pdf({
      format: options.format,
      margin: options.cover.margin || options.margin,
      printBackground: true,
      omitBackground: true,
      displayHeaderFooter: false,
    });

    loader.update(chalk.cyan("PDF generation: Loading all contents"));
    await page.evaluate((html) => {
      document.body.innerHTML = html;
    }, contentsHTML);
    await page.evaluateHandle("document.fonts.ready");
    await page.waitForNetworkIdle();

    loader.update(chalk.cyan("PDF generation: Generating contents PDF"));
    const contentsData = await page.pdf({
      format: options.format,
      margin: options.margin,
      printBackground: true,
      omitBackground: true,
      displayHeaderFooter: true,
      headerTemplate: generateHeaderTemplate(options),
      footerTemplate: generateFooterTemplate(options),
    });

    loader.update(chalk.cyan("PDF generation: Generating merged PDF"));
    const coverPDF = await PDFDocument.load(coverData);
    const contentsPDF = await PDFDocument.load(contentsData);
    const [coverPage] = await contentsPDF.copyPages(coverPDF, [0]);
    contentsPDF.insertPage(0, coverPage);
    const mergedDocumentData = await contentsPDF.save();
    fs.writeFileSync(options.output, mergedDocumentData);
  } finally {
    await browser.close();
    loader.stop();
  }
}

/**
 * Generate header template
 *
 * @param options The options
 * @returns header template of puppeteer PDF
 */
function generateHeaderTemplate({ header, margin }: BookletOptions): string {
  if (!header) {
    return "<!-- EMPTY HEADER -->";
  }
  if (isHTMLFragmentOption(header)) {
    return header.html;
  }
  const versionText = `<div class="version">Ver. ${process.env.npm_package_version}</div>`;
  return `
    <style>
      .header {
        font-family: system-ui;
        font-size: 9px;
        color: #dcdcdc;
        width: calc(100% - ${margin?.right || "0px"});
        position: relative;
        margin: 0 auto;
        ${header.style || ""}
      }
      .document-title {
        position: absolute;
        left: 0;
        text-align: left;
      }
      .version {
        position: absolute;
        right: 0;
        text-align: right;
      }
    </style>
    <div class="header">
      <div class="document-title">${header.text}</div>
      ${header.version ? versionText : ""}
    </div>
  `;
}

/**
 * Generate footer template
 *
 * @param options The options
 * @returns footer template of puppeteer PDF
 */
function generateFooterTemplate({ footer, margin }: BookletOptions): string {
  if (!footer) {
    return "<!-- EMPTY FOOTER -->";
  }
  if (isHTMLFragmentOption(footer)) {
    return footer.html;
  }
  const pageNumberPlaceholder = '<span class="pageNumber"></span>';
  const totalPagesPlaceholder = '<span class="totalPages"></span>';
  let pageNumberText = "";
  if (footer.pageNumber) {
    pageNumberText =
      typeof footer.pageNumber === "boolean"
        ? pageNumberPlaceholder
        : footer.pageNumber(pageNumberPlaceholder, totalPagesPlaceholder);
  }
  return `
      <style>
        .footer {
          border-top: 1px solid #dcdcdc;
          font-family: system-ui;
          font-size: 9px;
          color: #dcdcdc;
          width: calc(100% - ${margin?.right || "0px"});
          position: relative;
          margin: 0 auto 0.1in auto;
          padding-top: 4px;
          ${footer.style || ""}
        }
        .copyright {
          position: absolute;
          left: 0;
          text-align: left;
        }
        .page-number {
          position: absolute;
          right: 0;
          text-align: right;
        }
      </style>
      <div class="footer">
        <div class="copyright">${footer.text}</div>
        ${footer.pageNumber ? '<div class="page-number">' + pageNumberText + "</div>" : ""}
      </div>
  `;
}
