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

import { encodePayload, decodePayload } from "@shared/payload";
import { TAB_MARKER, contentTabsTranslationProvider as provider } from "./translation-provider";

describe("contentTabsTranslationProvider", () => {
  it("points at the widget's own attribute", () => {
    expect(provider.ref).toEqual({ tagName: "content-tabs", attribute: "tabtitle" });
  });

  it("sends the title as a marked element", () => {
    const html = provider.toTranslatable("Übersicht")!;

    expect(html).toContain(TAB_MARKER);
    expect(html).toContain("Übersicht");
  });

  it("unwraps a stored title before sending it", () => {
    expect(provider.toTranslatable(encodePayload("Übersicht"))).toContain("Übersicht");
  });

  it("escapes markup in the title", () => {
    const html = provider.toTranslatable('<b>A</b> & "B" \'C\'')!;

    expect(html).toContain("&lt;b&gt;");
    expect(html).toContain("&amp;");
    expect(html).toContain("&quot;");
    expect(html).toContain("&#39;");
  });

  it("has nothing to send for an empty title", () => {
    expect(provider.toTranslatable(null)).toBeNull();
    expect(provider.toTranslatable("")).toBeNull();
    expect(provider.toTranslatable("   ")).toBeNull();
  });

  it("recognises its own response", () => {
    expect(provider.acceptsTranslated(provider.toTranslatable("Übersicht")!)).toBe(true);
    expect(provider.acceptsTranslated("<p>something else</p>")).toBe(false);
  });

  it("stores the translation wrapped again", () => {
    const stored = provider.fromTranslated(`<p ${TAB_MARKER}="1">Overview</p>`, "Übersicht")!;

    expect(decodePayload(stored)).toBe("Overview");
  });

  it("takes the title as plain text, not as markup", () => {
    const stored = provider.fromTranslated(`<p ${TAB_MARKER}="1">A <b>bold</b> title</p>`, "x")!;

    expect(decodePayload(stored)).toBe("A bold title");
  });

  // Defect 1 resolution: the implementation returns null when the translated text
  // is empty, meaning "write nothing — the stored value stays untouched".
  it("writes nothing when the translation lost the title, so the source title stands", () => {
    expect(provider.fromTranslated(`<p ${TAB_MARKER}="1">  </p>`, "Übersicht")).toBeNull();
  });

  it("keeps the source title when the response holds nothing of ours", () => {
    expect(provider.fromTranslated("<p>unrelated</p>", "Übersicht")).toBeNull();
  });
});
