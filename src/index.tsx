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

/** The attribute the host writes for the `tabTitle` configuration field. */
export const TAB_TITLE_ATTRIBUTE = "tab-title";

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
export function ContentTabsBlockView({
  title,
  index,
}: {
  title: string | null;
  index: number;
}): React.JSX.Element {
  return (
    <div className="content-tabs-block" data-testid="content-tabs-block">
      <TabLabel title={title} index={index} />
    </div>
  );
}

const factory: BlockFactory = (BaseBlockClass, _widgetApi) => {
  return class ContentTabsBlock extends BaseBlockClass implements BaseBlock {
    private _root: ReactDOM.Root | null = null;
    private _unregister: (() => void) | null = null;

    private get tabTitle(): string | null {
      // The SDK's attribute-to-key mapping could not be verified from this
      // repo (widget-sdk ships types only, no runtime). The dev harness keys
      // by the raw DOM attribute name ("tab-title"), while camelCase
      // ("tabTitle") is the likely production mapping. Accept both so neither
      // environment silently yields undefined.
      const attrs = this.parseAttributes<{ tabTitle?: unknown; "tab-title"?: unknown }>();
      const raw = attrs.tabTitle ?? attrs[TAB_TITLE_ATTRIBUTE];
      return readTabTitle(raw);
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
      this._root.render(<ContentTabsBlockView title={title} index={0} />);
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

// The guard lets the module load in Jest/jsdom where defineBlock is absent,
// while keeping both calls unconditional in the real Staffbase host, where it
// is always present — on the editor and on a published page alike. The
// bootstrap is tied to it because it only has work to do where blocks exist.
if (typeof window.defineBlock === "function") {
  window.defineBlock(externalBlockDefinition);
  startContentTabs();
}
