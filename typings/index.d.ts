declare module "copy-newer" {
	function copyNewer(
		braced_target_files: string,
		dir: string,
		options: unknown
	): Promise<void>;
	export = copyNewer;
}

declare module "yaml" {
	export interface YamlConfig {
		[key: string]: unknown;
	}

	export function dump(
		obj: Record<string, unknown>,
		options?: YamlConfig
	): string;
}
