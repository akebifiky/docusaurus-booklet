import { PageContent, SidebarContent } from "../../contents";
import { CategoryTitleRewriter } from "../category-title-rewriter";
import cheerio from "cheerio";
import { formatted } from "./utils";
import { PageContentRewriter } from "../../page-rewriter";

/** Dummy sidebar contents for testing */
const dummySidebarContents: SidebarContent[] = [
  {
    label: "Introduction",
    link: "https://example.com/docs/introduction",
    children: [],
  },
  {
    label: "Installation",
    link: "https://example.com/docs/installation",
    children: [],
  },
  {
    label: "Guides",
    link: "https://example.com/docs/guides/getting-started",
    children: [
      {
        label: "Getting Started",
        link: "https://example.com/docs/guides/getting-started",
        children: [],
      },
      {
        label: "Features",
        link: "https://example.com/docs/guides/features/introduction",
        children: [
          {
            label: "Introduction",
            link: "https://example.com/docs/guides/features/intorduction",
            children: [],
          },
          {
            label: "Creation",
            link: "https://example.com/docs/guides/features/creation",
            children: [],
          },
        ],
      },
    ],
  },
];

const rewriter: PageContentRewriter = new CategoryTitleRewriter(dummySidebarContents);

test("to do not insert category title in general page", async () => {
  const introductionPage: PageContent = {
    html: `
      <article class="docusaurus-booklet-page" data-url="https://example.com/docs/introduction">
        <main>
          <h1>Introduction</h1>
          <p>This is a sample content</p>
        </main>
      </article>
    `,
    path: "https://example.com/docs/introduction",
  };
  const $input = cheerio.load(introductionPage.html);
  rewriter.rewrite($input, introductionPage, 0);
  expect($input.html()).toBe($input.html());
});

test("to insert category title in the first page of the category", async () => {
  const gettingStartedGuidePage: PageContent = {
    html: `
      <article class="docusaurus-booklet-page" data-url="https://example.com/docs/guides/getting-started">
        <main>
          <h1>Getting Started</h1>
          <p>This is a sample content</p>
        </main>
      </article>
    `,
    path: "https://example.com/docs/guides/getting-started",
  };
  const $input = cheerio.load(gettingStartedGuidePage.html);
  rewriter.rewrite($input, gettingStartedGuidePage, 0);

  const $expected = cheerio.load(`
    <article class="docusaurus-booklet-page" data-url="https://example.com/docs/guides/getting-started">
      <div class="docusaurus-booklet-category-title" data-category-level="1">Guides</div>
      <main>
        <h1>Getting Started</h1>
        <p>This is a sample content</p>
      </main>
    </article>
  `);
  expect(formatted($input.html())).toBe(formatted($expected.html()));
});

test("to insert category title in the first page of the nested category", async () => {
  const featureIntroductionPage: PageContent = {
    html: `
      <article class="docusaurus-booklet-page" data-url="https://example.com/docs/guides/features/introduction">
        <main>
          <h1>Introduction of Features</h1>
          <p>This is a sample content</p>
        </main>
      </article>
    `,
    path: "https://example.com/docs/guides/features/introduction",
  };
  const $input = cheerio.load(featureIntroductionPage.html);
  rewriter.rewrite($input, featureIntroductionPage, 0);

  const $expected = cheerio.load(`
    <article class="docusaurus-booklet-page" data-url="https://example.com/docs/guides/features/introduction">
      <div class="docusaurus-booklet-category-title" data-category-level="2">Features</div>
      <main>
        <h1>Introduction of Features</h1>
        <p>This is a sample content</p>
      </main>
    </article>
  `);
  expect(formatted($input.html())).toBe(formatted($expected.html()));
});
