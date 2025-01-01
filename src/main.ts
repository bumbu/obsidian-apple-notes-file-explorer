import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  WorkspaceLeaf,
} from "obsidian";
import { RootView, VIEW_TYPE } from "./views/root-view";

enum OpenInType {
  newTab = "newTab",
  currentTab = "currentTab",
  auto = "auto",
}

interface FileExplorerSettings {
  maxFiles: number;
  supportedExtensions: string[];
  openInNewTab: OpenInType;
}

const DEFAULT_SETTINGS: FileExplorerSettings = {
  maxFiles: 200,
  supportedExtensions: ["md", "txt"],
  openInNewTab: OpenInType.auto,
};

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
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Max number of files")
      // .setDesc('It\'s a secret')
      .addText((text) =>
        text
          .setPlaceholder("200")
          .setValue(this.plugin.settings.maxFiles.toString())
          .onChange(async (value) => {
            this.plugin.settings.maxFiles = parseInt(value, 10);
            await this.plugin.saveSettings();
            await this.plugin.refreshView();
          })
      );

    new Setting(containerEl)
      .setName("Supported extensions")
      .setDesc("Separated by comma")
      .addText((text) =>
        text
          .setPlaceholder("md, txt")
          .setValue(this.plugin.settings.supportedExtensions.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.supportedExtensions = value
              .split(",")
              .map((ext) => ext.trim());
            await this.plugin.saveSettings();
            await this.plugin.refreshView();
          })
      );

    new Setting(containerEl)
      .setName("Open in new tab")
      .setDesc("auto will open in new tab if the file is not already opened")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            [OpenInType.newTab]: "New Tab",
            [OpenInType.currentTab]: "Current Tab",
            [OpenInType.auto]: "Auto",
          })
          .setValue(this.plugin.settings.openInNewTab)
          .onChange(async (value) => {
            this.plugin.settings.openInNewTab = value as OpenInType;
            await this.plugin.saveSettings();
            // No need to refresh the view as the settings is a refecence that is read on click
          })
      );
  }
}
