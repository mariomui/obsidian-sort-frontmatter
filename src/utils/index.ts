import { Literal, Variant } from "src/parser/MarkdownParser.types";

export function isObject(variant: Variant): boolean {
	return Object.prototype.toString.call(variant) === "[object Object]";
}

export function sortBy(a: Literal, b: Literal) {
	// overly complicated code to ensure that if i ever change to a simpler parser, the parsing can still identify numbers.
	if ([a, b].every((item) => /[\d].*/.exec(String(item)))) {
		return Number(a as number) - Number(b as number);
	}
	if ([a, b].every((item) => typeof item === "string")) {
		const letterFore = (a as string).charCodeAt(0);
		const letterAft = (b as string).charCodeAt(0);
		return letterFore - letterAft;
	}
	return 0;
}
