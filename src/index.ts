import { LoadContext, Plugin } from "@docusaurus/types";
import chalk from "chalk";
import { Command } from "commander";
import merge from "deepmerge";
import fs from "fs";
import path from "path";
import { generateBooklet } from "./generator";
import { BookletOptions } from "./options";

const moduleName = "docusaurus-booklet";

export type BookletPluginOptions = Omit<BookletOptions, "entryPoint" | "puppeteerArgs" | "output" | "baseDirectory">;
type CommandLineOptions = {
  output: string;
  puppeteerArgs: string[];
  coverTitle?: string;
  coverSubtitle?: string;
  coverBackground?: string;
};

const authorName = getPackageAuthorName();
const defaultCSS = path.resolve(__dirname, "../assets/default.css");
const defaultConfig: BookletPluginOptions = {
  cover: {
    title: process.env.npm_package_name || "Docusaurus Booklet",
  },
  toc: {
    title: "Table of Contents",
  },
  format: "a4",
  margin: {
    top: "0.7in",
    right: "0.4in",
    bottom: "0.7in",
    left: "0.4in",
  },
  css: defaultCSS,
  autonumber: true,
  selectors: {
    mainContent: "article",
    pagination: ".pagination-nav__item--next > a",
    sidebar: ".theme-doc-sidebar-menu",
    exclude: ["nav.navbar,footer.footer,.theme-doc-toc-mobile"],
  },
  footer: {
    text: authorName ? `Copyright ${new Date().getFullYear()} ${authorName} All Rights Reserved.` : "",
    pageNumber: true,
  },
};

/**
 * Get 'author' from package.json
 */
function getPackageAuthorName(): string | undefined {
  if (!process.env.npm_package_json) {
    return;
  }
  const packageJSON = fs.readFileSync(process.env.npm_package_json).toString("utf-8");
  const packageInfo = JSON.parse(packageJSON);
  return typeof packageInfo.author === "object" ? packageInfo.author.name : packageInfo.author;
}

/**
 * Entrypoint of docusaurus-booklet
 *
 * @returns result message
 */
async function main(
  entryPoint: string,
  cliOptions: CommandLineOptions,
  pluginOptions: BookletPluginOptions,
  docusaurusContext: LoadContext
): Promise<string> {
  const optionsFromCLI: Partial<BookletPluginOptions> = {
    cover: {
      title: cliOptions.coverTitle || pluginOptions.cover.title,
      subtitle: cliOptions.coverSubtitle || pluginOptions.cover.subtitle,
      backgroundImage: cliOptions.coverBackground || pluginOptions.cover.backgroundImage,
    },
  };
  const options = merge(defaultConfig, merge(pluginOptions, optionsFromCLI));

  // NOTE: default header is depending on dynamic options
  if (options.header === undefined) {
    const { title, subtitle } = options.cover;
    options.header = {
      text: `${title.replaceAll(/<br\s*\/?>/g, " ")}${subtitle ? " - " + subtitle : ""}`,
      version: true,
    };
  }

  // Generate PDF
  await generateBooklet({
    entryPoint: entryPoint,
    puppeteerArgs: cliOptions.puppeteerArgs,
    output: cliOptions.output,
    baseDirectory: docusaurusContext.outDir,
    ...options,
  });

  return `✓ PDF generated successfully >> ${cliOptions.output}`;
}

export default function plugin(context: LoadContext, pluginOptions: BookletPluginOptions): Plugin<void> {
  return {
    name: moduleName,
    extendCli: (commanderContext: Command) => {
      commanderContext
        .command("booklet <entry-point>")
        .description("Generate PDF starts with entry-point page")
        .option("-o, --output <file>", "Specify the output file path", `${moduleName}.pdf`)
        .option(
          "--puppeteer-args <args...>",
          "Specify additional chromium arguments, see details: https://peter.sh/experiments/chromium-command-line-switches/",
          (argument, previous) => [...previous, argument],
          ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=medium"]
        )
        .option("--cover-title [title]", "Title for cover page (this option overrides plugin options)")
        .option("--cover-subtitle [subtitle]", "Subtitle for cover page (this option overrides plugin options)")
        .option(
          "--cover-background [path]",
          "Background image path for cover page (this option overrides plugin options)"
        )
        .action((entryPoint: string, cliOptions: CommandLineOptions) => {
          main(entryPoint, cliOptions, pluginOptions, context)
            .then((message) => {
              console.log(chalk.green(message));
            })
            .catch((error) => {
              console.error(chalk.red(error));
              process.exit(1);
            });
        });
    },
  };
}
