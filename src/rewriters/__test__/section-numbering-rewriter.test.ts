import cheerio from "cheerio";
import { PageContent, SidebarContent } from "../../contents";
import { PageContentRewriter } from "../../page-rewriter";
import { SectionNumberingRewriter } from "../section-numbering-rewriter";
import { formatted } from "./utils";

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

test("to numbering section headers", async () => {
  const rewriter: PageContentRewriter = new SectionNumberingRewriter(sampleSidebarContents);
  const introPage: PageContent = {
    path: "/docs/intro",
    html: `
      <div class="docusaurus-booklet-page">
        <article>
          <h1>Introduction</h1>
          <p>This is a sample page</p>
          <h2>Section 1</h2>
          <p>This is a sample content for section 1</p>
          <h2>Section 2</h2>
          <p>This is a sample content for section 2</p>
          <h3>Section 2-1</h3>
          <p>This is a sample content for section 2-1</p>
          <h3>Section 2-2</h3>
          <p>This is a sample content for section 2-2</p>
          <h2>Section 3</h2>
          <p>This is a sample content for section 3</p>
        </article>
      </div>
    `,
  };
  const $ = cheerio.load(introPage.html);
  await rewriter.rewrite($, introPage, 1);
  const rewrittenHTML = $.html(".docusaurus-booklet-page");
  const expectedHTML = formatted(`
    <div class="docusaurus-booklet-page">
      <article>
        <h1><span class="docusaurus-booklet-section-number">1.</span>Introduction</h1>
        <p>This is a sample page</p>
        <h2><span class="docusaurus-booklet-section-number">1.1.</span>Section 1</h2>
        <p>This is a sample content for section 1</p>
        <h2><span class="docusaurus-booklet-section-number">1.2.</span>Section 2</h2>
        <p>This is a sample content for section 2</p>
        <h3><span class="docusaurus-booklet-section-number">1.2.1.</span>Section 2-1</h3>
        <p>This is a sample content for section 2-1</p>
        <h3><span class="docusaurus-booklet-section-number">1.2.2.</span>Section 2-2</h3>
        <p>This is a sample content for section 2-2</p>
        <h2><span class="docusaurus-booklet-section-number">1.3.</span>Section 3</h2>
        <p>This is a sample content for section 3</p>
      </article>
    </div>
  `);
  expect(formatted(rewrittenHTML)).toBe(expectedHTML);
});

test("to numbering category top section header", async () => {
  const rewriter: PageContentRewriter = new SectionNumberingRewriter(sampleSidebarContents);
  const integrationPage: PageContent = {
    path: "/docs/guides/advanced/integration",
    html: `
      <div class="docusaurus-booklet-page">
        <div class="docusaurus-booklet-category-title" data-category-level="2">Advanced Guides</div>
        <article>
          <h1>Integration</h1>
          <p>This is a sample content</p>
          <section>
            <h2>Sample Section</h2>
            <p>This is a sample section content</p>
            <h2>Sample Section</h2>
            <p>This is a sample section content</p>
          </section>
        </article>
      </div>
    `,
  };

  const $ = cheerio.load(integrationPage.html);
  await rewriter.rewrite($, integrationPage, 3);
  const rewrittenHTML = $.html(".docusaurus-booklet-page");
  const expectedHTML = formatted(`
    <div class="docusaurus-booklet-page">
      <div class="docusaurus-booklet-category-title" data-category-level="2">
        <span class="docusaurus-booklet-section-number">2.2.</span>Advanced Guides
      </div>
      <article>
        <h1><span class="docusaurus-booklet-section-number">2.2.1.</span>Integration</h1>
        <p>This is a sample content</p>
        <section>
          <h2>
            <span class="docusaurus-booklet-section-number">2.2.1.1.</span>Sample Section
          </h2>
          <p>This is a sample section content</p>
          <h2>
            <span class="docusaurus-booklet-section-number">2.2.1.2.</span>Sample Section
          </h2>
          <p>This is a sample section content</p>
        </section>
      </article>
    </div>
  `);
  expect(formatted(rewrittenHTML)).toBe(expectedHTML);
});

test("to ignore page that not contained in sidebar", async () => {
  const singlePageSidebar: SidebarContent[] = [
    {
      label: "Dummy Page",
      link: "/docs/dummy",
      children: [],
    },
  ];
  const rewriter: PageContentRewriter = new SectionNumberingRewriter(singlePageSidebar);
  const notContainedPage: PageContent = {
    path: "/content/not-contained/page",
    html: `
      <div class="docusaurus-booklet-page">
        <article>
          <h1>Not Contained Page</h1>
          <p>This is a sample page</p>
        </article>
      </div>
    `,
  };
  const $ = cheerio.load(notContainedPage.html);
  await rewriter.rewrite($, notContainedPage, 1);
  const rewrittenHTML = $.html(".docusaurus-booklet-page");
  expect(formatted(rewrittenHTML)).toBe(formatted(notContainedPage.html));
});
