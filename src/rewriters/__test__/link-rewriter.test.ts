import cheerio from "cheerio";
import { linkRewriter } from "../link-rewriter";
import { formatted } from "./utils";

test("to rewrite all internal links and IDs in page content", async () => {
  const path = "/some/page-content";
  const html = `
    <article class="docusaurus-booklet-page">
      <main class="main-content">
        <h1 id="page-title">Sample Page Content</h1>
        <ul id="some-list">
          <li>
            <a href="/another/page-content">Another page link</a>
          </li>
          <li>
            <a href="/some/page-content#some-section">Internal section link</a>
          </li>
          <li>
            <a href="#some-section">Section link</a>
          </li>
          <li>
            <a href="https://external.example.com/some/page">External Link</a>
          </li>
        </ul>
      </main>
    </article>
  `;
  const $input = cheerio.load(html);
  linkRewriter.rewrite($input, { html, path }, 0);

  const $expected = cheerio.load(`
    <article class="docusaurus-booklet-page" id="some__page-content">
      <main class="main-content">
        <h1 id="some__page-content--page-title">Sample Page Content</h1>
        <ul id="some__page-content--some-list">
          <li>
            <a href="#another__page-content">Another page link</a>
          </li>
          <li>
            <a href="#some__page-content--some-section">Internal section link</a>
          </li>
          <li>
            <a href="#some__page-content--some-section">Section link</a>
          </li>
          <li>
            <a href="https://external.example.com/some/page">External Link</a>
          </li>
        </ul>
      </main>
    </article>
  `);

  expect(formatted($input.html())).toBe(formatted($expected.html()));
});
