import fs from "fs";
import path from "path";
import prettier from "prettier";
import { collectContents, generateCoverPageContent, generateTOCPageContent, SidebarContent } from "../contents";

const buildDir = path.resolve(__dirname, "resources/built-files");

function formatted(source: string): string {
  return prettier.format(source, { parser: "babel" });
}

test("to collect contents from built files", async () => {
  const [sidebarContents, pageContents] = await collectContents({
    entryPoint: "/docs/intro",
    baseDirectory: buildDir,
    cover: { title: "Sample Docs" },
    output: "some/output/path",
  });
  expect(pageContents.length).toBe(7);

  const firstContentHTML = formatted(`
    <div class="docusaurus-booklet-page" data-path="/docs/intro">
      <article>
        <div class="theme-doc-markdown markdown">
          <header><h1>Introduction</h1></header>
          <p>This is a sample introduction page.</p>
        </div>
      </article>
    </div>
  `);
  expect(formatted(pageContents[0].html)).toBe(firstContentHTML);

  const secondContentHTML = formatted(`
    <div class="docusaurus-booklet-page" data-path="/docs/guides/getting-started">
      <article>
        <div class="theme-doc-markdown markdown">
          <header><h1>Getting Started</h1></header>
          <p>This is a sample getting-started page.</p>
        </div>
      </article>
    </div>
  `);
  expect(formatted(pageContents[1].html)).toBe(secondContentHTML);

  const fourthContentHTML = formatted(`
    <div class="docusaurus-booklet-page" data-path="/docs/guides/advanced/integration">
      <article>
        <div class="theme-doc-markdown markdown">
          <header><h1>Integration</h1></header>
          <p>This is a sample integration page.</p>
        </div>
      </article>
    </div>
  `);
  expect(formatted(pageContents[3].html)).toBe(fourthContentHTML);

  expect(sidebarContents.length).toBe(3);
  expect(sidebarContents[0].label).toBe("Introduction");
  expect(sidebarContents[0].link).toBe("/docs/intro");
  expect(sidebarContents[0].children.length).toBe(0);
  expect(sidebarContents[1].label).toBe("Guides");
  expect(sidebarContents[1].link).toBe("/docs/guides/getting-started");
  expect(sidebarContents[1].children.length).toBe(4);
  expect(sidebarContents[1].children[0].label).toBe("Getting Started");
  expect(sidebarContents[1].children[0].link).toBe("/docs/guides/getting-started");
  expect(sidebarContents[1].children[0].children.length).toBe(0);
  expect(sidebarContents[1].children[1].label).toBe("Configurations");
  expect(sidebarContents[1].children[1].link).toBe("/docs/guides/configurations");
  expect(sidebarContents[1].children[1].children.length).toBe(0);
  expect(sidebarContents[1].children[2].label).toBe("Advanced Guide");
  expect(sidebarContents[1].children[2].link).toBe("/docs/guides/advanced/integration");
  expect(sidebarContents[1].children[2].children.length).toBe(1);
  expect(sidebarContents[1].children[2].children[0].label).toBe("Integration");
  expect(sidebarContents[1].children[2].children[0].link).toBe("/docs/guides/advanced/integration");
  expect(sidebarContents[1].children[2].children[0].children.length).toBe(0);
  expect(sidebarContents[1].children[3].label).toBe("Troubleshooting");
  expect(sidebarContents[1].children[3].link).toBe("/docs/guides/troubleshooting");
  expect(sidebarContents[1].children[3].children.length).toBe(0);
  expect(sidebarContents[2].label).toBe("API");
  expect(sidebarContents[2].link).toBe("/docs/api/first-feature");
  expect(sidebarContents[2].children.length).toBe(2);
  expect(sidebarContents[2].children[0].label).toBe("First Feature");
  expect(sidebarContents[2].children[0].link).toBe("/docs/api/first-feature");
  expect(sidebarContents[2].children[0].children.length).toBe(0);
  expect(sidebarContents[2].children[1].label).toBe("Second Feature");
  expect(sidebarContents[2].children[1].link).toBe("/docs/api/second-feature");
  expect(sidebarContents[2].children[1].children.length).toBe(0);
});

test("to generate cover page content", () => {
  const content = generateCoverPageContent({ title: "Dummy Title" });
  const expectedHTML = formatted(`
    <div class="docusaurus-booklet-page">
      <div class="docusaurus-booklet-cover-content">
        <h1 class="title">Dummy Title</h1>
      </div>
    </div>
  `);

  expect(content.path).toBe("cover");
  expect(formatted(content.html)).toBe(expectedHTML);
});

test("to generate cover page content with subtitle", () => {
  const content = generateCoverPageContent({ title: "Dummy Title", subtitle: "Dummy Subtitle" });
  const expectedHTML = formatted(`
    <div class="docusaurus-booklet-page">
      <div class="docusaurus-booklet-cover-content">
        <h1 class="title">Dummy Title</h1>
        <h2 class="subtitle">Dummy Subtitle</h2>
      </div>
    </div>
  `);

  expect(content.path).toBe("cover");
  expect(formatted(content.html)).toBe(expectedHTML);
});

test("to generate cover page content with background image", () => {
  const coverImage = path.join(__dirname, "resources/cover.svg");
  const content = generateCoverPageContent({
    title: "Dummy Title",
    subtitle: "Dummy Subtitle",
    backgroundImage: coverImage,
  });
  const expectedBase64EncodedImage = fs.readFileSync(path.join(__dirname, "resources/cover.svg")).toString("base64");
  const expectedHTML = formatted(`
    <div class="docusaurus-booklet-page" style="background-image:url('data:image/svg+xml;base64,${expectedBase64EncodedImage}')">
      <div class="docusaurus-booklet-cover-content">
        <h1 class="title">Dummy Title</h1>
        <h2 class="subtitle">Dummy Subtitle</h2>
      </div>
    </div>
  `);

  expect(content.path).toBe("cover");
  expect(formatted(content.html)).toBe(expectedHTML);
});

test("to generate cover page content with version label", () => {
  process.env.npm_package_version = "1.2.3";
  const content = generateCoverPageContent({ title: "Dummy Title", subtitle: "Dummy Subtitle", version: true });
  const expectedHTML = formatted(`
    <div class="docusaurus-booklet-page">
      <div class="docusaurus-booklet-cover-content">
        <h1 class="title">Dummy Title</h1>
        <h2 class="subtitle">Dummy Subtitle</h2>
        <h3 class="version">1.2.3</h3>
      </div>
    </div>
  `);

  expect(content.path).toBe("cover");
  expect(formatted(content.html)).toBe(expectedHTML);
});

test("to generate table of contents page", () => {
  const sampleSidebarContents: SidebarContent[] = [
    {
      label: "Introduction",
      link: "/docs/intro",
      children: [],
    },
    {
      label: "Guide",
      link: "/docs/guides/getting-started",
      children: [
        {
          label: "Getting Started",
          link: "/docs/guides/getting-started",
          children: [],
        },
        {
          label: "Advanced Guide",
          link: "/docs/guides/advanced/integration",
          children: [
            {
              label: "Integration",
              link: "/docs/guides/advanced/integration",
              children: [],
            },
          ],
        },
        {
          label: "Configuration",
          link: "/docs/guides/configuration",
          children: [],
        },
      ],
    },
    {
      label: "API",
      link: "/docs/api/first-feature",
      children: [
        {
          label: "First Feature",
          link: "/docs/api/first-feature",
          children: [],
        },
        {
          label: "Second Feature",
          link: "/docs/api/second-feature",
          children: [],
        },
      ],
    },
  ];
  const content = generateTOCPageContent(sampleSidebarContents, { title: "Dummy Title" }, true);
  const expectedHTML = formatted(`
    <div class="docusaurus-booklet-page">
      <article>
        <h1>Dummy Title</h1>
        <div class="docusaurus-booklet-toc autonumbered">
          <ul class="docusaurus-booklet-toc-list level-1">
            <li class="docusaurus-booklet-toc-list-entry">
              <a href="/docs/intro"><span class="docusaurus-booklet-section-number">1.</span>Introduction</a>
            </li>
            <li class="docusaurus-booklet-toc-list-entry">
              <a href="/docs/guides/getting-started"><span class="docusaurus-booklet-section-number">2.</span>Guide</a>
              <ul class="docusaurus-booklet-toc-list level-2">
                <li class="docusaurus-booklet-toc-list-entry">
                  <a href="/docs/guides/getting-started"><span class="docusaurus-booklet-section-number">2.1.</span>Getting Started</a>
                </li>
                <li class="docusaurus-booklet-toc-list-entry">
                  <a href="/docs/guides/advanced/integration"><span class="docusaurus-booklet-section-number">2.2.</span>Advanced Guide</a>
                  <ul class="docusaurus-booklet-toc-list level-3">
                    <li class="docusaurus-booklet-toc-list-entry">
                      <a href="/docs/guides/advanced/integration"><span class="docusaurus-booklet-section-number">2.2.1.</span>Integration</a>
                    </li>
                  </ul>
                </li>
                <li class="docusaurus-booklet-toc-list-entry">
                  <a href="/docs/guides/configuration"><span class="docusaurus-booklet-section-number">2.3.</span>Configuration</a>
                </li>
              </ul>
            </li>
            <li class="docusaurus-booklet-toc-list-entry">
              <a href="/docs/api/first-feature"><span class="docusaurus-booklet-section-number">3.</span>API</a>
              <ul class="docusaurus-booklet-toc-list level-2">
                <li class="docusaurus-booklet-toc-list-entry">
                  <a href="/docs/api/first-feature"><span class="docusaurus-booklet-section-number">3.1.</span>First Feature</a>
                </li>
                <li class="docusaurus-booklet-toc-list-entry">
                  <a href="/docs/api/second-feature"><span class="docusaurus-booklet-section-number">3.2.</span>Second Feature</a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </article>
    </div>
  `);
  expect(formatted(content.html)).toBe(expectedHTML);
});

test("to generate table of contents page without section numbers", () => {
  const sampleSidebarContents: SidebarContent[] = [
    {
      label: "First Page",
      link: "/docs/first",
      children: [],
    },
    {
      label: "Second Page",
      link: "/docs/second",
      children: [],
    },
    {
      label: "Third Page",
      link: "/docs/third",
      children: [],
    },
  ];
  const content = generateTOCPageContent(sampleSidebarContents, { title: "Table of Contents" }, false);
  const expectedHTML = formatted(`
    <div class="docusaurus-booklet-page">
      <article>
        <h1>Table of Contents</h1>
        <div class="docusaurus-booklet-toc">
          <ul class="docusaurus-booklet-toc-list level-1">
            <li class="docusaurus-booklet-toc-list-entry">
              <a href="/docs/first">First Page</a>
            </li>
            <li class="docusaurus-booklet-toc-list-entry">
              <a href="/docs/second">Second Page</a>
            </li>
            <li class="docusaurus-booklet-toc-list-entry">
              <a href="/docs/third">Third Page</a>
            </li>
          </ul>
        </div>
      </article>
    </div>
  `);
  expect(formatted(content.html)).toBe(expectedHTML);
});
