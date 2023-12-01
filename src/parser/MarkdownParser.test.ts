import { splitIntoFrontMatterAndContents } from "./MarkdownParser";
import * as MarkdownParser from "./MarkdownParser";
import * as utils from "../utils/index";
import * as yaml from "yaml";
import dedent from "dedent";
jest.mock(
  "obsidian",
  () => {
    return {
      parseYaml: (yaml_content: string) => {
        return yaml.parse(yaml_content);
      },
    };
  },
  { virtual: true }
);

const SIMPLE_MARKDOWN_FRONTMATTER = processDedent(`
	---
	list: me
	bird: two
	---
	poo
	`);

const MARKDOWN_ARRAYS = processDedent(`
  ---
  tabs:
    - 5
    - batman
  cabs:
    - fiver
    - ten
  ---
  content
  `);

describe("MarkdownParser::splitIntoFrontMatterAndContents", () => {
  const frontmatter = processDedent(`
    list: me
    bird: two
  `);
  it("should split the frontmatter and content cleanly", () => {
    const content = `poo\n`;

    const actual = splitIntoFrontMatterAndContents(SIMPLE_MARKDOWN_FRONTMATTER);

    expect(actual.processedFrontMatter.frontMatter).toEqual(frontmatter);
    expect(actual.processedNonFrontMatter.content).toEqual(content);
  });

  const shouldSplitUpEvenWithArraysSample = `
  tabs:
    - 5
    - batman
  cabs:
    - fiver
    - ten
  `;
  it("should split up frontmatter and nonfm even with arrays", () => {
    const expected_frontmatter = processDedent(
      shouldSplitUpEvenWithArraysSample
    );
    const actual = splitIntoFrontMatterAndContents(MARKDOWN_ARRAYS);
    expect(actual.processedFrontMatter.frontMatter).toEqual(
      expected_frontmatter
    );
    expect(actual.processedNonFrontMatter.content).toEqual("content\n");
  });

  const improperContentSample = `
  ---
  hi: dkfjdkfjdf
  ---BUG BUG
  `;
  it("should return null when formatted improperly", () => {
    // const expected_frontmatter = processDedent(improperContentSample);
    const actual = splitIntoFrontMatterAndContents(
      processDedent(improperContentSample)
    );
    expect(actual).toBe(null);
  });
});

describe("MarkdownParser::replaceFileContentsWithSortedFrontMatter", () => {
  const simpleLiteralSample = `---
  bird: two
  list: me
  ---
  poo
  `;

  it("should sort simple literals", () => {
    const expected_markdown = processDedent(simpleLiteralSample);

    const actual = splitIntoFrontMatterAndContents(SIMPLE_MARKDOWN_FRONTMATTER);
    const actual_markdown =
      MarkdownParser.replaceFileContentsWithSortedFrontMatter(
        actual.processedFrontMatter.frontMatter,
        actual.processedNonFrontMatter.content,
        utils.sortBy
      );

    //
    // console.log({ expected_markdown, actual, actual_markdown });
    expect(expected_markdown).toEqual(actual_markdown);
  });

  const shouldSortArraysSample = `---
    cabs:
      - fiver
      - ten
    tabs:
      - batman
      - 5
    ---
    content
    `;
  it("should sort arrays", () => {
    const expected_markdown = processDedent(shouldSortArraysSample);

    const actual = splitIntoFrontMatterAndContents(MARKDOWN_ARRAYS);

    const actual_markdown =
      MarkdownParser.replaceFileContentsWithSortedFrontMatter(
        actual.processedFrontMatter.frontMatter,
        actual.processedNonFrontMatter.content,
        utils.sortBy
      );

    expect(expected_markdown).toEqual(actual_markdown);
  });
});

function processDedent(markdown: string) {
  return dedent(markdown) + "\n";
}
