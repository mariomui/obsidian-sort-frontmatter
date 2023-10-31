import { App, Plugin, PluginManifest, TFile, Vault, Workspace } from "obsidian";
import { MarkdownParser } from "./parser/MarkdownParser";
import { Variant } from "./parser/MarkdownParser.types";
import { sortBy } from "./utils";

let workspace: Workspace,
  // fileManager: FileManager,
  vault: Vault;
export default class Main extends Plugin {
  constructor(app: App, plugin: PluginManifest) {
    super(app, plugin);

    // fileManager = this.app.fileManager;
    workspace = this.app.workspace;
    vault = this.app.vault;
  }

  async #genSortFrontMatterWithinContents(
    tFile: TFile,
    sortBy: (a: Variant, b: Variant) => number
  ): Promise<{ data: string; err: Error | null }> {
    const app = this.app;
    return new Promise((res, rej) => {
      vault.process(tFile, (file_contents) => {
        // https://regex101.com/r/7s4zjQ/1
        const regexStart = /^---(\r?\n)/g;
        // https://regex101.com/r/nx0lIA/1
        const regexEnd = /---(\r?\n|$)/g;
        const parser = new MarkdownParser(app, tFile, file_contents);
        const processed = parser.splitIntoFrontMatterAndContents(
          parser.file_contents,
          regexStart,
          regexEnd
        );
        if (!processed) {
          res({
            data: parser.file_contents,
            err: new Error("Frontmatter processing error occurred."),
          });
          return file_contents;
        }

        const { processedFrontMatter, processedNonFrontMatter } = processed;

        const sorted_file_contents =
          parser.replaceFileContentsWithSortedFrontMatter(
            processedFrontMatter.frontMatter || "",
            processedNonFrontMatter.content || "",
            sortBy
          );

        res({ data: sorted_file_contents, err: null });
        return sorted_file_contents;
      });
    });
  }

  public async genSortFrontmatter(datums: unknown[]): Promise<void> {
    await this.#genSortFrontMatterWithinContents(
      workspace.getActiveFile(),
      sortBy
    );
  }
  async onload() {
    this.addCommand({
      id: "obsidian-sort-frontmatter:sort",
      name: "Sort frontmatter",
      callback: async (...args) => {
        await this.genSortFrontmatter(args);
      },
    });
  }

  onunload() {}
}
