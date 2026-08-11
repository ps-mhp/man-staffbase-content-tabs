/*!
 * Copyright 2026, Staffbase SE and contributors.
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
import { getTranslationRegistry } from "@shared/translation/registry";
import { contentTabsTranslationProvider } from "./translation-provider";

// Must run before any dynamic `import()`, so that lazily loaded chunks come
// from the CDN the bundle was served from and not from the hosting page.
setPublicPathFromBundle("content-tabs.js");
import React from "react";
import ReactDOM from "react-dom/client";

import { BlockFactory, BlockDefinition, ExternalBlockDefinition, BaseBlock } from "widget-sdk";
import { decodePayload, isPayload } from "@shared/payload";
import { registerTab, setTabTitle } from "./tab-registry";
import { TabLabel } from "./editor-view";
import { startContentTabs } from "./bootstrap";
import { configurationSchema, uiSchema } from "./configuration-schema";
import icon from "../resources/content-tabs.svg";
import pkg from "../package.json";

/**
 * The one name the tab title goes by.
 *
 * Three places have to agree on it, and every one of them is load-bearing:
 * the key in the configuration schema, because the host saves a value under
 * its schema key verbatim; the attribute declared to the host, because it
 * drops an attribute it was never told about; and the name read back here.
 * They disagreed once — schema `tabTitle`, declared `tab-title` — and every
 * title fell on the floor between the dialog and the page, with nothing
 * anywhere to say so.
 *
 * It is also the attribute registered for this widget in the Staffbase
 * installation (see `widgets.json`), which is why the hyphenated spelling is
 * the one they all moved to: changing it would mean re-registering the widget.
 */
export const TAB_TITLE_ATTRIBUTE = "tab-title";

/**
 * Names an already-saved title may sit under.
 *
 * A page configured by an earlier build may carry either of the older
 * spellings. Reading all of them costs nothing and keeps that content working.
 */
const TITLE_KEYS = [TAB_TITLE_ATTRIBUTE, "tabtitle", "tabTitle"] as const;

/** Attributes handled by the widget; mirrored in the configuration schema. */
const widgetAttributes: string[] = [TAB_TITLE_ATTRIBUTE];

/**
 * The tab title, whatever shape it arrives in.
 *
 * The value has already passed the host's own decoding by the time it gets
 * here. What may still be wrapped is our own `b64:` envelope, which survives a
 * machine-translation pass — see `@shared/payload`.
 */
export function readTabTitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = isPayload(raw) ? (decodePayload(raw) ?? "") : raw;
  const trimmed = text.trim();
  return trimmed === "" ? null : trimmed;
}

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
// while keeping both calls unconditional in the real Staffbase host, where it
// is always present — on the editor and on a published page alike. The
// bootstrap is tied to it because it only has work to do where blocks exist.
if (typeof window.defineBlock === "function") {
  window.defineBlock(externalBlockDefinition);
  startContentTabs();
}
