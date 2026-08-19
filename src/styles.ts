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

import styles from "./styles/content-tabs.scss";

/** Id of the single style element, which is also how it is recognised again. */
export const STYLE_ELEMENT_ID = "content-tabs-styles";

/**
 * The widget's stylesheet, compiled from `styles/content-tabs.scss`.
 *
 * See that file for the reasoning behind the literal colours, the
 * plain-`<div>` tab and the sideways-scrolling strip.
 */
export const CONTENT_TABS_CSS = styles;

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
