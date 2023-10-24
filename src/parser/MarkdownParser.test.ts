import { splitIntoFrontMatterAndContents } from "./MarkdownParser";
import * as MarkdownParser from "./MarkdownParser";
import * as utils from "../utils/index";
jest.mock("obsidian", () => ({}), { virtual: true });

const spy = jest.spyOn(MarkdownParser, "convertObjToYaml");
const isObjectSpy = jest.spyOn(utils, "isObject");
const sortBySpy = jest.spyOn(utils, "sortBy");

spy.mockImplementation((obj) => {
	return MarkdownParser.convertObjToYaml(obj);
});
isObjectSpy.mockImplementation((obj) => {
	return utils.isObject(obj);
});
sortBySpy.mockImplementation((...args) => {
	return utils.sortBy(...args);
});

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
