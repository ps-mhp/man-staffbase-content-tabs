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

import React from "react";
import { render, screen } from "@testing-library/react";

import { encodePayload } from "@shared/payload";
import { ContentTabsBlockView, readTabTitle, TAB_TITLE_ATTRIBUTE } from "./index";
import { configurationSchema, uiSchema } from "./configuration-schema";

describe("TAB_TITLE_ATTRIBUTE", () => {
  it("is the very key the configuration schema stores under", () => {
    // The host writes the configuration value with the schema key verbatim and
    // the DOM lowercases it. A capital or a hyphen here and the value lands
    // under a name nothing reads — which is how the title went missing once.
    expect(Object.keys(configurationSchema.properties!)).toEqual([TAB_TITLE_ATTRIBUTE]);
    // Also lowercase, because the DOM lowercases attribute names on the way in
    // and the widget would then be reading a name the host never wrote.
    expect(TAB_TITLE_ATTRIBUTE).toBe(TAB_TITLE_ATTRIBUTE.toLowerCase());
  });

  it("is the key the dialog's ui hints are filed under", () => {
    // A ui hint filed under a key the schema does not have is simply ignored,
    // so the author would lose the help text without any sign of it.
    expect(Object.keys(uiSchema)).toEqual([TAB_TITLE_ATTRIBUTE]);
  });
});

describe("readTabTitle", () => {
  it("takes a plain string as it is", () => {
    expect(readTabTitle("Übersicht")).toBe("Übersicht");
  });

  it("unwraps our own base64 envelope", () => {
    expect(readTabTitle(encodePayload("Übersicht"))).toBe("Übersicht");
  });

  it("reports a missing title as null", () => {
    expect(readTabTitle(undefined)).toBeNull();
    expect(readTabTitle(null)).toBeNull();
    expect(readTabTitle("")).toBeNull();
    expect(readTabTitle("   ")).toBeNull();
  });

  it("ignores a value that is not text", () => {
    expect(readTabTitle(42)).toBeNull();
    expect(readTabTitle({})).toBeNull();
  });

  it("treats a corrupt b64: envelope as no title", () => {
    // isPayload is true (starts with "b64:") but decodePayload returns null
    // because the rest contains characters outside the base64 alphabet.
    const corrupt = "b64:!!!not-base64!!!";
    expect(readTabTitle(corrupt)).toBeNull();
  });
});

describe("ContentTabsBlockView", () => {
  it("labels the tab for the author", () => {
    render(<ContentTabsBlockView title="Übersicht" />);

    expect(screen.getByText("Tab: Übersicht")).toBeInTheDocument();
  });
});
