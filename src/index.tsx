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
import { configurationSchema, uiSchema } from "./configuration-schema";
import icon from "../resources/content-tabs.svg";
import pkg from "../package.json";

/** Attributes handled by the widget; mirrored in the configuration schema. */
const widgetAttributes: string[] = [];

/**
 * Rendered inside the `<content-tabs>` element itself.
 *
 * The widget does its actual work on the *surrounding* section, not in its own
 * element — so this block stays deliberately unobtrusive. It exists to give
 * editors something to select and drag, and to mark the section as tab-enabled.
 */
export function ContentTabsPlaceholder(): React.JSX.Element {
  return <div data-testid="content-tabs-placeholder">Content-Tabs</div>;
}

const factory: BlockFactory = (BaseBlockClass, _widgetApi) => {
  return class ContentTabsBlock extends BaseBlockClass implements BaseBlock {
    private _root: ReactDOM.Root | null = null;

    public renderBlock(container: HTMLElement): void {
      this._root ??= ReactDOM.createRoot(container);
      this._root.render(<ContentTabsPlaceholder />);
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

// Guard lets the module load in Jest/jsdom where defineBlock is absent, while
// keeping the call unconditional in the real Staffbase host where it is always
// present (missing it there would silently skip widget registration).
if (typeof window.defineBlock === "function") {
  window.defineBlock(externalBlockDefinition);
}
