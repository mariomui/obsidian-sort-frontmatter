import { splitIntoFrontMatterAndContents } from "./MarkdownParser";
import * as MarkdownParser from "./MarkdownParser";
import * as utils from "../utils/index";
import * as yaml from "yaml";

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

const markdown = `---
list: me
bird: two
---
poo
`;

const markdownWithArrays = `---
tabs:
  - 5
  - batman
cabs:
  - fiver
  - ten
---
content
`;

describe("MarkdownParser::splitIntoFrontMatterAndContents", () => {
	it("should split the frontmatter and content cleanly", () => {
		const frontmatter = `
list: me
bird: two
`;
		const content = `poo`;

		const actual = splitIntoFrontMatterAndContents(markdown);
		expect("\n" + actual.processedFrontMatter.frontMatter).toEqual(
			frontmatter
		);
		expect(actual.processedNonFrontMatter.content).toEqual(content);
	});

	it("should split up frontmatter and nonfm even with arrays", () => {
		const frontmatter = `
tabs:
  - 5
  - batman
cabs:
  - fiver
  - ten
`;
		const actual = splitIntoFrontMatterAndContents(markdownWithArrays);
		expect("\n" + actual.processedFrontMatter.frontMatter).toEqual(
			frontmatter
		);
		expect(actual.processedNonFrontMatter.content).toEqual("content");
	});
});

describe("MarkdownParser::replaceFileContentsWithSortedFrontMatter", () => {
	it("should sort simple literals", () => {
		const expected_markdown = `---
bird: two
list: me
---
poo`;
		const actual = splitIntoFrontMatterAndContents(markdown);

		const actual_markdown =
			MarkdownParser.replaceFileContentsWithSortedFrontMatter(
				actual.processedFrontMatter.frontMatter,
				actual.processedNonFrontMatter.content,
				utils.sortBy
			);

		// console.debug(inspect({ actual_markdown }, { colors: true }));
		expect(expected_markdown).toEqual(actual_markdown);
	});
	it("should sort arrays", () => {
		const expected_markdown = `---
cabs:
  - fiver
  - ten
tabs:
  - batman
  - 5
---
content`;
		const actual = splitIntoFrontMatterAndContents(markdownWithArrays);

		const actual_markdown =
			MarkdownParser.replaceFileContentsWithSortedFrontMatter(
				actual.processedFrontMatter.frontMatter,
				actual.processedNonFrontMatter.content,
				utils.sortBy
			);
		console.log({ actual_markdown });
		expect(expected_markdown).toEqual(actual_markdown);
	});
});
