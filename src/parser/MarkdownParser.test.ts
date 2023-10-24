import { splitIntoFrontMatterAndContents } from "./MarkdownParser";
import * as MarkdownParser from "./MarkdownParser";

jest.mock("obsidian", () => ({}), { virtual: true });

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

describe("MarkdownParser basic parse operations", () => {
	const spy = jest.spyOn(MarkdownParser, "formatListToYaml");
	spy.mockImplementation((list, counter) => {
		return "";
	});
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

	it("should organize arrays well in front matter", () => {
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

describe("Markdown basic sorting operations", () => {
	it("should sort top level items even if they are arrays", () => {});
});
