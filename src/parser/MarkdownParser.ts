import { App, TFile, parseYaml, stringifyYaml } from "obsidian";
import { ProcessFrontMatterSpec } from "src/utils/types";

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

export function formatListToYaml(
	list: unknown[],
	res: unknown[],
	counter: number
): void {
	if (counter < 0) {
		return;
	}
	for (const li of list) {
		if (Array.isArray(li)) {
			formatListToYaml(li, res, --counter);
			continue;
		}
		if (isObject(li as Record<string, unknown>)) {
			res.push(
				formatObjectToYaml<Record<string, unknown>>(
					li as Record<string, unknown>,
					counter
				)
			);
			continue;
		}
		res.push(li);
	}
}
export function formatObjectToYaml<O>(obj: O, counter: number): unknown[][] {
	if (counter > 3) {
		return;
	}
	const res = Object.entries(obj).map((entry) => {
		const [k, v] = entry;
		if (isObject(v)) {
			return [k, formatObjectToYaml(v as O, --counter)];
		}
		if (Array.isArray(v)) {
			const res = [] as unknown;
			formatListToYaml(v, res as unknown[], counter);
			console.log({ res }, "arr");
			return [k, res];
		}
		return [k, v];
	});
	return res;
}
function isObject(v: Record<string, unknown>) {
	return Object.prototype.toString.call(v) === "[object Object]";
}
export function replaceFileContentsWithSortedFrontMatter(
	frontMatter: string,
	content: string,
	sortBy: (a: string, b: string) => number
): string {
	const parsedFm = parseYaml(frontMatter);

	const sortedTuples = Object.entries(parsedFm).sort(([k, v], [ak, av]) => {
		return sortBy(k, ak);
	});
	const sorted_frontmatter = sortedTuples.reduce((chain, [k, v]) => {
		if (Array.isArray(v)) {
			const res: unknown[] = [];
			formatListToYaml(v, res, 10);
			console.log({ res }, "mainFn");
			return (chain += `${k}: ${JSON.stringify(v)}\n`);
		}
		if (isObject(v as Record<string, unknown>)) {
			return (chain += `${k}: ${JSON.stringify(v)}\n`);
		}
		return (chain += `${k}: ${v}\n`);
	}, "");
	const sorted_file_contents =
		"---\n" + sorted_frontmatter + "\n---\n" + content;
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
