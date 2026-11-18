/*!
 * Copyright 2026, MHP Management und IT-Beratung GmbH and contributors.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { setPublicPathFromBundle } from "@shared/public-path";
import { startWidget } from "@shared/dev-mode/start-widget";
import { getTranslationRegistry } from "@shared/translation/registry";
import { contentTabsTranslationProvider } from "./translation-provider";

// Must run before any dynamic `import()`, so that lazily loaded chunks come
// from the CDN the bundle was served from and not from the hosting page.
setPublicPathFromBundle("content-tabs.js");
import React from "react";
import ReactDOM from "react-dom/client";

import { BlockFactory, BlockDefinition, ExternalBlockDefinition, BaseBlock } from "widget-sdk";
import { registerTab, setTabTitle } from "./tab-registry";
import { TAB_TITLE_ATTRIBUTE, TITLE_KEYS, readTabTitle } from "./tab-title";
import { TabLabel } from "./editor-view";
import { startContentTabs } from "./bootstrap";
import { configurationSchema, uiSchema } from "./configuration-schema";
import icon from "../resources/content-tabs.svg";
import pkg from "../package.json";

// Bisher hier zu Hause; Tests und Aufrufer lesen sie weiter von hier.
export { TAB_TITLE_ATTRIBUTE, readTabTitle };

/** Attributes handled by the widget; mirrored in the configuration schema. */
const widgetAttributes: string[] = [TAB_TITLE_ATTRIBUTE];

/**
 * Rendered inside the `<content-tabs>` element itself.
 *
 * The widget does its work on the *surrounding* section, so its own element
 * only ever shows the author-facing label. In the frontend the transform hides
 * this element entirely.
 */
export function ContentTabsBlockView({ title }: { title: string | null }): React.JSX.Element {
  return (
    <div className="content-tabs-block" data-testid="content-tabs-block">
      <TabLabel title={title} />
    </div>
  );
}

const factory: BlockFactory = (BaseBlockClass, _widgetApi) => {
  return class ContentTabsBlock extends BaseBlockClass implements BaseBlock {
    private _root: ReactDOM.Root | null = null;
    private _unregister: (() => void) | null = null;

    private get tabTitle(): string | null {
      const attrs = this.parseAttributes<Record<string, unknown>>();
      for (const key of TITLE_KEYS) {
        const title = readTabTitle(attrs[key]);
        if (title !== null) return title;
      }
      return null;
    }

    public renderBlock(container: HTMLElement): void {
      const title = this.tabTitle;

      // First render announces the block; later ones only update the title, so
      // the block keeps its place in the registration order and tabs do not
      // reshuffle while the author types.
      if (this._unregister === null) this._unregister = registerTab(this, title);
      else setTabTitle(this, title);

      // The SDK is assumed to pass the same container for the life of the block.
      this._root ??= ReactDOM.createRoot(container);
      this._root.render(<ContentTabsBlockView title={title} />);
    }

    public unmountBlock(_container: HTMLElement): void {
      this._unregister?.();
      this._unregister = null;
      this._root?.unmount();
      this._root = null;
    }

    public static get observedAttributes(): string[] {
      return widgetAttributes;
    }

    public attributeChangedCallback(...args: [string, string | undefined, string | undefined]): void {
      super.attributeChangedCallback.apply(this, args);
    }
  };
};

const blockDefinition: BlockDefinition = {
  name: "content-tabs",
  factory: factory,
  attributes: widgetAttributes,
  blockLevel: "block",
  configurationSchema: configurationSchema,
  uiSchema: uiSchema,
  label: "ContentTabs",
  iconUrl: icon,
};

const externalBlockDefinition: ExternalBlockDefinition = {
  blockDefinition,
  author: pkg.author,
  version: pkg.version,
};

/**
 * Installed unconditionally at module load. The registry is shared by every
 * widget bundle and installs its `fetch` wrapper only once; whichever bundle
 * loads first does it, the rest just register. On a live content page the
 * translation endpoint is never called, so this costs nothing there.
 */
export const stopTranslationProvider = getTranslationRegistry().register(
  contentTabsTranslationProvider,
);

// The guard lets the module load in Jest/jsdom where defineBlock is absent,
// while keeping the call unconditional in the real Staffbase host, where it is
// always present — on the editor and on a published page alike.
//
// Registration now runs through `startWidget`, which first asks whether a
// local development server serves this widget. On virtually every browser the
// answer is no and this registers immediately; on the developer's machine the
// local bundle takes over and registers instead. Only ever one of the two, a
// block name cannot be claimed twice.
if (typeof window.defineBlock === "function") {
  void startWidget({
    name: "content-tabs",
    version: pkg.version,
    register: () => {
      window.defineBlock(externalBlockDefinition);
      startContentTabs();
    },
  });
}
