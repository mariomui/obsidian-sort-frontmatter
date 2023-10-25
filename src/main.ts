import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginManifest,
	PluginSettingTab,
	Setting,
	TFile,
	Vault,
	Workspace,
} from "obsidian";
import { MarkdownParser } from "./parser/MarkdownParser";
import { Variant } from "./parser/MarkdownParser.types";
import { sortBy } from "./utils";

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};
let workspace: Workspace,
	// fileManager: FileManager,
	vault: Vault;
export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

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
						err: new Error(
							"Frontmatter processing error occurred."
						),
					});
					return file_contents;
				}

				const { processedFrontMatter, processedNonFrontMatter } =
					processed;

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
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Sample Plugin",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice("This is a notice!");
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		this.addCommand({
			id: "sort frontmatter",
			name: "Sort frontmatter",
			callback: async (...args) => {
				await this.genSortFrontmatter(args);
			},
		});
		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Settings for my awesome plugin." });

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						console.log("Secret: " + value);
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
