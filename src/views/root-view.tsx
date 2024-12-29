import { ItemView, TFile, WorkspaceLeaf } from "obsidian";

import * as React from "react";
import { FileListView } from "./file-list-view";
import { Root, createRoot } from "react-dom/client";
import TagsOverviewPlugin from "../main";

export const VIEW_TYPE = "apple-notes-file-explorer";

export class RootView extends ItemView {
	plugin: TagsOverviewPlugin;
	root: Root;

	constructor(leaf: WorkspaceLeaf, plugin: TagsOverviewPlugin) {
		super(leaf);
		this.plugin = plugin;

		// Listen on file changes and update the list of tagged files
		plugin.registerEvent(
			this.app.metadataCache.on("changed", (modifiedFile: TFile) => {
				this.render();
			})
		);

		// Remove deleted files from the list
		plugin.registerEvent(
			this.app.vault.on("delete", (deletedFile: TFile) => {
				this.render();
			})
		);
	}

	refresh() {
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
			this.root.render(
				<FileListView
					rootView={this}
				/>
			);
		}
	}

	async onClose() {
		this.root.unmount();
	}
}
