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

import { TranslationProvider } from "@shared/translation/carriers";
import { decodePayload, encodePayload, isPayload } from "@shared/payload";

/** Marks the element carrying the title, so it can be found in any response shape. */
export const TAB_MARKER = "data-mhp-tab";

const unwrap = (stored: string | null): string =>
  stored === null ? "" : ((isPayload(stored) ? decodePayload(stored) : stored) ?? "");

/**
 * Escapes text for an HTML body.
 *
 * Hand-rolled rather than done through a detached element, because this runs
 * inside a `fetch` wrapper where creating DOM nodes is a needless dependency
 * on a live document.
 */
const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * How the tab title travels through Staffbase's content translation.
 *
 * The title lives in an attribute, and `POST /api/translations` translates text
 * nodes while leaving attributes alone. So it is sent as the text of a marked
 * paragraph — the text travels where the service will touch it, the marker
 * where it will not.
 *
 * What comes back is read as plain text: a tab label is a label, and any markup
 * the service decided to add would end up as literal characters on a button.
 */
export const contentTabsTranslationProvider: TranslationProvider = {
  id: "content-tabs",
  label: "Content-Tabs",
  ref: { tagName: "content-tabs", attribute: "tab-title" },

  toTranslatable: (stored) => {
    const title = unwrap(stored).trim();
    return title === "" ? null : `<p ${TAB_MARKER}="1">${escapeHtml(title)}</p>`;
  },

  acceptsTranslated: (html) => html.includes(TAB_MARKER),

  fromTranslated: (html, _stored) => {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
    const element = doc.body.querySelector(`[${TAB_MARKER}]`);
    const translated = element?.textContent?.trim() ?? "";

    // An empty result means the service lost the title rather than translated
    // it, and a title in the source language beats no title at all.
    if (translated === "") return null;

    return encodePayload(translated);
  },
};
