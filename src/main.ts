import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	WorkspaceLeaf,
} from "obsidian";
import { RootView, VIEW_TYPE } from "./views/root-view";

// Remember to rename these classes and interfaces!

interface FileExplorerSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: FileExplorerSettings = {
	mySetting: 'default'
}

export default class FileExplorer extends Plugin {
	settings: FileExplorerSettings;

	async onload() {
		await this.loadSettings();

		// Add the view
		this.registerView(VIEW_TYPE, (leaf) => new RootView(leaf, this));
		this.addRibbonIcon("folder", "Apple Notes File Explorer", () => {
			this.activateView();
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	async activateView() {
		let leaf: WorkspaceLeaf | null = this.getLeaf();
		if (!leaf) {
			leaf = this.app.workspace.getLeftLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE,
					active: true,
				});
			}
		}

		leaf && this.app.workspace.revealLeaf(leaf);
	}

	async refreshView() {
		const leaf = this.getLeaf();
		if (leaf?.view) {
			(leaf.view as RootView).refresh();
		}
	}

	getLeaf(): WorkspaceLeaf | null {
		return this.app.workspace.getLeavesOfType(VIEW_TYPE).first() || null;
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

class SampleSettingTab extends PluginSettingTab {
	plugin: FileExplorer;

	constructor(app: App, plugin: FileExplorer) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
