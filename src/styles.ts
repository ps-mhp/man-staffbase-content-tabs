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
 * Colours are stated explicitly rather than inherited. The strip renders
 * inside a host page whose own button styling (dark fill, own text colour)
 * otherwise wins on specificity and turns a tab into an unreadable block, and
 * `var(--man-red)` is not guaranteed to exist on every page. Every colour
 * therefore has a literal value here, exposed as a custom property on the
 * group so a page can still override it deliberately.
 *
 * The rules that fight host button CSS are written as
 * `.content-tabs-bar__list button.content-tabs-tab` to outweigh the usual
 * `.some-wrapper button` selectors.
 *
 * Background, colour and geometry additionally carry `!important`. The
 * Staffbase stylesheet styles every `button` as a full-width call-to-action
 * (`width: 90%`, `display: block`, `margin: auto`, brand background) and the
 * MAN theme raises its `:focus` background to `!important`, which is what
 * painted the selected tab as a dark block with invisible text. Specificity
 * alone cannot beat an `!important` declaration, so these few properties have
 * to be stated at the same weight.
 *
 * The strip scrolls sideways rather than wrapping. On a narrow screen wrapped
 * tabs push the content down by an unpredictable amount, and the panel below
 * then jumps as the author switches tabs.
 */
export const CONTENT_TABS_CSS = `
.${GROUP_CLASS},
.${BAR_CLASS},
.${BAR_CLASS}__list {
  --content-tabs-accent: var(--man-red, #e40045);
  --content-tabs-tab-bg: transparent;
  --content-tabs-tab-color: #5a6874;
  --content-tabs-tab-hover-color: #1c2b39;
  --content-tabs-tab-active-color: #1c2b39;
  --content-tabs-strip-border: #d5d9dd;
}

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
  background: transparent;
  border-bottom: 1px solid var(--content-tabs-strip-border);
  margin-bottom: 30px;
}

.${BAR_CLASS}__list button.content-tabs-tab {
  flex: 1 0 auto;
  appearance: none;
  -webkit-appearance: none;
  background: var(--content-tabs-tab-bg) !important;
  background-image: none !important;
  border: 0 !important;
  border-bottom: 2px solid transparent !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  color: var(--content-tabs-tab-color) !important;
  cursor: pointer;
  display: inline-block !important;
  font: inherit;
  margin: 0 !important;
  min-height: 0 !important;
  opacity: 1;
  padding: 8px 16px !important;
  position: relative;
  text-shadow: none;
  white-space: nowrap;
  width: auto !important;
}

.${BAR_CLASS}__list button.content-tabs-tab:hover,
.${BAR_CLASS}__list button.content-tabs-tab:focus,
.${BAR_CLASS}__list button.content-tabs-tab:active {
  background: var(--content-tabs-tab-bg) !important;
  background-image: none !important;
  color: var(--content-tabs-tab-hover-color) !important;
  border-bottom-color: var(--content-tabs-accent) !important;
}

.${BAR_CLASS}__list button.content-tabs-tab[aria-selected="true"] {
  background: var(--content-tabs-tab-bg) !important;
  background-image: none !important;
  color: var(--content-tabs-tab-active-color) !important;
  border-bottom-color: var(--content-tabs-accent) !important;
  font-weight: 600;
}

/* The theme draws its own underline on tab-like buttons via ::after. */
.${BAR_CLASS}__list button.content-tabs-tab::after,
.${BAR_CLASS}__list button.content-tabs-tab::before {
  content: none !important;
}

.${BAR_CLASS}__list button.content-tabs-tab:focus-visible {
  outline: 2px solid var(--content-tabs-accent) !important;
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
  color: #5a6874;
  font-size: 12px;
  font-weight: 600;
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
