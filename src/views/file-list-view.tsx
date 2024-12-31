import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { App, TFile, Menu } from "obsidian";

import Plugin from "../main";
import { RootView } from "./root-view";

const MAX_FILES = 200;
const SUPPORTED_EXTENSIONS = ["md", "txt"];
const OPEN_IN_NEW_TAB = true;

/*
 * TODO
 * If file is already opnened, open that one
 * Rename, publish
 */

export const FileListView = ({ rootView }: { rootView: RootView }) => {
  const isFirstRender = useRef(true);
  const app: App = rootView.app;
  // const plugin: Plugin = rootView.plugin;

  const [_, doRerender] = useState(0);
  const previewCache = useRef<WeakMap<TFile, string>>(new WeakMap());

  // Files list
  const [listOfFiles, setListOfFiles] = useState<TFile[]>(
    isFirstRender.current ? getListOfFiles(app) : []
  );
  useEffect(() => {
    const event1 = app.vault.on("delete", (file) => {
      // Maybe: optimize by only removing the file from the list
      setListOfFiles(getListOfFiles(app));
    });
    const event2 = app.vault.on("create", (file) => {
      // Maybe: optimize by only adding the new file to the list
      setListOfFiles(getListOfFiles(app));
    });
    const event3 = app.vault.on("modify", async (file) => {
      if (file instanceof TFile) {
        const fileContents = await app.vault.read(file);
        previewCache.current.set(file, parsePreviewText(fileContents));

        // Maybe: optimize by only adding the new file to the list
        setListOfFiles(getListOfFiles(app));
      }
    });
    const event4 = app.vault.on("rename", (file, oldPath) => {
      // Maybe: optimize by moving the file to the top of the list
      setListOfFiles(getListOfFiles(app));
    });
    return () => {
      app.workspace.offref(event1);
      app.workspace.offref(event2);
      app.workspace.offref(event3);
      app.workspace.offref(event4);
    };
  }, []);

  // On first render, load preview caches, and then rerender
  if (isFirstRender.current) {
    const promises = listOfFiles.map(async (file) => {
      const fileContents = await app.vault.read(file);
      previewCache.current.set(file, parsePreviewText(fileContents));
    });
    Promise.all(promises).then(() => {
      doRerender((prev) => prev + 1);
    });
  }

  // Current selected file
  const [currentFile, setCurrentFile] = useState<TFile | null>(
    app.workspace.getActiveFile()
  );
  const currentFileIndex = listOfFiles.findIndex(
    (file) => file.path === currentFile?.path
  );
  useEffect(() => {
    const event1 = app.workspace.on("file-open", (file) => {
      setCurrentFile(file);
    });
    // When a file is deleted, if it was the current one, we need to reset current file
    // If it is still the same file, no rerender will happen
    const event2 = app.vault.on("delete", (file) => {
      setCurrentFile(app.workspace.getActiveFile());
    });
    return () => {
      app.workspace.offref(event1);
      app.workspace.offref(event2);
    };
  }, []);

  isFirstRender.current = false;

  return (
    <div
      style={{
        // margin: `calc(var(--size-4-3) * -1) `,
        margin: `-12px -12px -32px`,
      }}
    >
      {listOfFiles.map((file, index) => {
        return (
          <ItemView
            file={file}
            preview={previewCache.current.get(file)}
            app={app}
            isSelected={index === currentFileIndex}
            key={file.path}
          />
        );
      })}
    </div>
  );
};

const ItemView = ({
  file,
  app,
  isSelected,
  preview,
}: {
  file: TFile;
  app: App;
  isSelected: boolean;
  preview?: string;
}) => {
  const folder = file.parent;
  return (
    <div
      className={
        isSelected
          ? "oanl__file-item oanl__file-item--active"
          : "oanl__file-item"
      }
      onClick={() => {
        app.workspace.openLinkText(file.path, "", OPEN_IN_NEW_TAB);
      }}
      onContextMenu={(event) => {
        // Actions
        const menu = new Menu();
        menu.addItem((item) =>
          item
            .setTitle("Delete")
            .setIcon("delete")
            .onClick((event) => {
              app.vault.delete(file);
            })
        );
        menu.showAtMouseEvent(event);
      }}
    >
      <div className="oanl__file-item-title">{file.basename}</div>
      <div className="oanl__file-item-secondary">
        <div className="oanl__file-item-secondary-datetime">
          {new Date(file.stat.mtime).toLocaleDateString("en-GB")}
        </div>
        <div className="oanl__file-item-secondary-preview">{preview ?? ""}</div>
      </div>
      <div className="oanl__file-item-third">
        <Icon />
        {folder != null ? folder.name : ""}
      </div>
    </div>
  );
};

const Icon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="svg-icon lucide-folder-closed"
    >
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>
      <path d="M2 10h20"></path>
    </svg>
  );
};

function getListOfFiles(app: App) {
  return app.vault
    .getFiles()
    .sort((a, b) => {
      return b.stat.mtime - a.stat.mtime;
    })
    .filter((file) => SUPPORTED_EXTENSIONS.includes(file.extension))
    .slice(0, MAX_FILES);
}

function parsePreviewText(rawText: string) {
  // TODO handle more use cases
  return rawText.replace(/(^---[\s\S]*?---\s*)/, "").substring(0, 40);
}
