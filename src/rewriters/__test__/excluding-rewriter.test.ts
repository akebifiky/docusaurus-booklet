import cheerio from "cheerio";
import { PageContent } from "../../contents";
import { PageContentRewriter } from "../../page-rewriter";
import { ExcludingRewriter } from "../excluding-rewriter";
import { formatted } from "./utils";

test("to exclude elements that are selectable with the given selectors.", async () => {
  const rewriter: PageContentRewriter = new ExcludingRewriter([
    "#first-element",
    ".third-element,.fifth-element",
  ]);

  const content: PageContent = {
    html: `
      <div>
        <div id="first-element"></div>
        <ul>
          <li class="first-element">First Element</li>
          <li class="second-element">Second Element</li>
          <li class="third-element">Third Element</li>
          <li class="fourth-element">Fourth Element</li>
          <li class="fifth-element">
            Fifth Element
            <div class="item">Item</div>
          </li>
        </ul>
      </div>
    `,
    path: "https://example.com/some/page",
  };
  const $input = cheerio.load(content.html);
  rewriter.rewrite($input, content, 0);

  const $expected = cheerio.load(`
    <div>
      <ul>
        <li class="first-element">First Element</li>
        <li class="second-element">Second Element</li>
        
        <li class="fourth-element">Fourth Element</li>
      </ul>
    </div>
  `);
  expect(formatted($input.html())).toBe(formatted($expected.html()));
});
