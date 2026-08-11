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

import { BAR_CLASS, GROUP_CLASS } from "./tabs-transform";

/** Id of the single style element, which is also how it is recognised again. */
export const STYLE_ELEMENT_ID = "content-tabs-styles";

/**
 * The widget's stylesheet.
 *
 * Deliberately free of colours and fonts beyond `currentColor` and the
 * inherited family: the widget sits inside pages that already have a design,
 * and a tab strip that brings its own palette looks bolted on. Only layout,
 * spacing and the selected state are stated here.
 *
 * The strip scrolls sideways rather than wrapping. On a narrow screen wrapped
 * tabs push the content down by an unpredictable amount, and the panel below
 * then jumps as the author switches tabs.
 */
export const CONTENT_TABS_CSS = `
.${GROUP_CLASS} {
  box-sizing: border-box;
  display: block;
  min-width: 0;
}

.${BAR_CLASS}__list {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: thin;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  margin-bottom: 16px;
}

.content-tabs-tab {
  flex: 0 1 auto;
  appearance: none;
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 8px 16px;
  white-space: nowrap;
}

.content-tabs-tab:hover {
  border-bottom: 2px solid var(--man-red);
}

.content-tabs-tab[aria-selected="true"] {
  border-bottom: 2px solid var(--man-red);
  font-weight: 600;
}

.content-tabs-tab:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: -2px;
}

/* Editor only: one frame drawn across the columns of a group. */
.content-tabs-group-start,
.content-tabs-group-middle,
.content-tabs-group-end {
  border-top: 2px dashed rgba(0, 0, 0, 0.3);
  border-bottom: 2px dashed rgba(0, 0, 0, 0.3);
}

.content-tabs-group-start {
  border-left: 2px dashed rgba(0, 0, 0, 0.3);
}

.content-tabs-group-end {
  border-right: 2px dashed rgba(0, 0, 0, 0.3);
}

.content-tabs-editor-label {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  opacity: 0.7;
  padding: 2px 0;
}
`;

/**
 * Makes sure the stylesheet is on the page, exactly once.
 *
 * Several bundles may load and each will ask; the id is what keeps that from
 * piling up duplicates.
 */
export function ensureStyles(doc: Document = document): void {
  if (doc.getElementById(STYLE_ELEMENT_ID) !== null) return;
  const style = doc.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.textContent = CONTENT_TABS_CSS;
  doc.head.appendChild(style);
}
