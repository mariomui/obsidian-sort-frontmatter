export type Literal = number | string | object | unknown;
export type PluralLiteral<T> = T[] | Record<string, T>;
export type Variant = Literal | PluralLiteral<Literal>;

export type RecurseVariant =
	| PluralLiteral<Variant>
	| Record<string, Variant>
	| Literal;
