declare module "copy-newer" {
	function copyNewer(
		braced_target_files: string,
		dir: string,
		options: unknown
	): Promise<void>;
	export = copyNewer;
}

// {
// 	function copyNewer(
// 		braced_target_files: string,
// 		dir: string,
// 		options: unknown
// 	): Promise<void>;
// 	export = copyNewer;
// }

// "{main.js,styles.css,manifest.json}",
// pluginDir,
// {
//   verbose: true,
//   cwd: outDir,
// }
