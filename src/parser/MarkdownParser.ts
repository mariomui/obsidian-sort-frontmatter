import { App, TFile, parseYaml } from "obsidian";
import { ProcessFrontMatterSpec } from "src/utils/types";
import * as yaml from "js-yaml";
import { isObject, sortBy } from "src/utils";
import { RecurseVariant, Variant } from "./MarkdownParser.types";

interface MarkdownParserImpl {
	splitIntoFrontMatterAndContents: (
		file_contents: string,
		regexStart: RegExp,
		regexEnd: RegExp
	) => {
		processedFrontMatter: ProcessFrontMatterSpec;
		processedNonFrontMatter: { content: string; from: number; to: number };
	} | null;
	replaceFileContentsWithSortedFrontMatter: (
		frontMatter: string,
		content: string,
		sortBy: (a: string, b: string) => number
	) => string;
}
export class MarkdownParser implements MarkdownParserImpl {
	convertObjToYaml: (
		obj: Record<string, unknown>,
		yamlConfig?: { flowLevel: number; styles: { "!!null": string } }
	) => string;
	public replaceFileContentsWithSortedFrontMatter(
		frontMatter: string,
		content: string,
		sortBy: (a: string, b: string) => number
	): ReturnType<typeof replaceFileContentsWithSortedFrontMatter> {
		throw new Error("Method not implemented.");
	}

	public splitIntoFrontMatterAndContents(
		file_contents: string,
		regexStart: RegExp,
		regexEnd: RegExp
	): ReturnType<typeof splitIntoFrontMatterAndContents> {
		throw new Error("Method not implemented.");
	}
	app: App;
	virtualFile: TFile;
	file_contents: string;

	constructor(app: App, virtualFile: TFile, file_contents: string) {
		this.app = app;
		this.virtualFile = virtualFile;
		this.file_contents = file_contents;
	}
}

MarkdownParser.prototype.splitIntoFrontMatterAndContents =
	splitIntoFrontMatterAndContents;
MarkdownParser.prototype.replaceFileContentsWithSortedFrontMatter =
	replaceFileContentsWithSortedFrontMatter;
MarkdownParser.prototype.convertObjToYaml = convertObjToYaml;

export const manuYamlConfig = () => {
	const yamlConfig = {
		flowLevel: 3,
		styles: {
			"!!null": "camelcase",
		},
	};
	return yamlConfig;
};

export function convertObjToYaml(
	obj: Record<string, unknown>,
	yamlConfig = manuYamlConfig()
) {
	const dumped = yaml.dump(obj, yamlConfig);

	return dumped;
}

export function replaceFileContentsWithSortedFrontMatter(
	frontMatter: string,
	content: string,
	sortBy: (a: string, b: string) => number
): string {
	const parsedFm = parseYaml(frontMatter);

	const sortedObj = recurseVariant(parsedFm);
	const sorted_yaml = this.convertObjToYaml(sortedObj);
	console.log({ sortedObj, sorted_yaml, parsedFm });
	const sorted_file_contents = "---\n" + sorted_yaml + "\n---\n" + content;
	console.log({ sorted_file_contents });
	return sorted_file_contents;
}
export function splitIntoFrontMatterAndContents(
	file_contents: string,
	regexStart = /^---(\r?\n)/g,
	regexEnd = /---(\r?\n|$)/g
) {
	// indicate that the index to start the next match is the start of the supplied string
	regexStart.lastIndex = 0;
	const startMatch: RegExpExecArray = regexStart.exec(file_contents);

	// after execution the last index on regexStart is updated to the the position of whatever is after ---;
	if (!startMatch) return null;

	// The 0-based index of the match in the string.
	// n
	const startingStartIndex = startMatch.index;

	// i
	const endingStartIndex = regexStart.lastIndex;
	// regexEnd.lastIndex = i;
	let endMatch: RegExpExecArray = null;

	// overly fancy run once.
	for (
		endMatch = regexEnd.exec(file_contents);
		endMatch && "\n" !== file_contents.charAt(endMatch.index - 1); // a new line is always going to not be the char at -1 because "" is at -1 for a match or UNMATCH.

	) {
		endMatch = regexEnd.exec(file_contents);
	}

	if (!endMatch) return null;

	const startingEndMatchIdx = endMatch.index;

	const fileEndIdx = file_contents.length - 1;

	// the last --- position.
	const endingEndMatchIdx = regexEnd.lastIndex;

	const processedFrontMatter: ProcessFrontMatterSpec = {
		frontMatter: file_contents.slice(endingStartIndex, startingEndMatchIdx),
		from: endingStartIndex,
		to: startingEndMatchIdx,
		blockFrom: startingStartIndex,
		blockTo: endingEndMatchIdx,
	};
	const processedNonFrontMatter = {
		content: file_contents.slice(endingEndMatchIdx, fileEndIdx),
		from: endingEndMatchIdx,
		to: fileEndIdx,
	};

	return { processedFrontMatter, processedNonFrontMatter };
}

function recurseVariant(variant: Variant, thresh = 8): RecurseVariant {
	// if obj
	if (thresh < 0) return variant;

	if (isObject(variant as Record<string, Variant>)) {
		const temp: RecurseVariant = {};
		const sortedKeys = Object.keys(variant).sort(sortBy);
		for (const key of sortedKeys) {
			const variantVal = (variant as Record<string, Variant>)[key];
			(temp as Record<string, Variant>)[key] = recurseVariant(
				variantVal,
				--thresh
			);
		}
		return temp as Record<string, Variant>;
	}
	if (Array.isArray(variant)) {
		return [].concat(
			variant
				.filter((v) => typeof v === "string")
				.filter(Boolean)
				.sort(sortBy),
			variant
				.filter((v) => typeof v === "number")
				.filter(Boolean)
				.sort(sortBy),
			variant
				.filter((v) => !["number", "string"].includes(typeof v))
				.filter(Boolean)
				.map((v) => recurseVariant(v, --thresh))
		);
	}
	return variant as Variant;
	// loop through obj
	// sort through keys
	// create new object, from keys
	// loop through obj
	// sort through keys
	// if array
	// sort
}
