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

import { BAR_CLASS, GROUP_CLASS } from "./tabs-transform";

/** Id of the single style element, which is also how it is recognised again. */
export const STYLE_ELEMENT_ID = "content-tabs-styles";

/**
 * The widget's stylesheet.
 *
 * Colours are stated explicitly rather than inherited. The strip renders
 * inside a host page whose own button styling (dark fill, own text colour)
 * would otherwise win on specificity, and `var(--man-red)` is not guaranteed
 * to exist on every page. Every colour therefore has a literal value here,
 * exposed as a custom property on the group so a page can still override it
 * deliberately.
 *
 * A tab is a plain `<div role="tab">`, not a `<button>` — deliberately. The
 * MAN theme (`onetruck-css`) styles every bare `button` inside `.page` as a
 * full-width, uppercase, red call-to-action (`.page button:not(...)`), which
 * is meant for real CTAs elsewhere and has nothing to do with a tab strip.
 * Fighting that rule from here would mean guessing its exact properties and
 * repeating them with `!important`, which breaks again the moment that global
 * rule changes. Not being a `<button>` sidesteps it entirely, so none of
 * these declarations need `!important` to hold.
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

.${BAR_CLASS}__list .content-tabs-tab {
  flex: 1 0 auto;
  background: var(--content-tabs-tab-bg);
  border: 0;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  box-shadow: none;
  color: var(--content-tabs-tab-color);
  cursor: pointer;
  display: inline-block;
  font: inherit;
  margin: 0;
  opacity: 1;
  padding: 8px 16px;
  position: relative;
  text-shadow: none;
  text-transform: none;
  white-space: nowrap;
  width: auto;
}

.${BAR_CLASS}__list .content-tabs-tab:hover,
.${BAR_CLASS}__list .content-tabs-tab:focus,
.${BAR_CLASS}__list .content-tabs-tab:active {
  background: var(--content-tabs-tab-bg);
  color: var(--content-tabs-tab-hover-color);
  border-bottom-color: var(--content-tabs-accent);
}

.${BAR_CLASS}__list .content-tabs-tab[aria-selected="true"] {
  background: var(--content-tabs-tab-bg);
  color: var(--content-tabs-tab-active-color);
  border-bottom-color: var(--content-tabs-accent);
  font-weight: 600;
}

/* .page :focus-visible in the MAN theme sets its own outline colour with
 * !important; this is a legitimate, unrelated global concern (consistent
 * focus rings everywhere), not a button-reset fight, so it still has to be
 * matched at the same weight here. */
.${BAR_CLASS}__list .content-tabs-tab:focus-visible {
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
