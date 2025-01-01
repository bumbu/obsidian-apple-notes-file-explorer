import { ItemView, TFile, WorkspaceLeaf } from "obsidian";

import * as React from "react";
import { FileListView } from "./file-list-view";
import { Root, createRoot } from "react-dom/client";
import TagsOverviewPlugin from "../main";

export const VIEW_TYPE = "apple-notes-file-explorer";

export class RootView extends ItemView {
  plugin: TagsOverviewPlugin;
  root: Root;
  cacheBust: number = 0;

  constructor(leaf: WorkspaceLeaf, plugin: TagsOverviewPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  refresh() {
    this.cacheBust++;
    this.render();
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return "File Explorer";
  }

  getIcon(): string {
    return "folder";
  }

  async onOpen() {
    this.root = createRoot(this.containerEl.children[1]);
    this.render();
  }

  render() {
    if (this.root) {
      this.root.render(<FileListView rootView={this} key={this.cacheBust} />);
    }
  }

  async onClose() {
    this.root.unmount();
  }
}
