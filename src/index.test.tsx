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

import React from "react";
import { render, screen } from "@testing-library/react";

import { encodePayload } from "@shared/payload";
import { ContentTabsBlockView, readTabTitle, TAB_TITLE_ATTRIBUTE } from "./index";

// Static import above evaluates index.tsx before any spy can be installed, so
// the first console.error call (for the absent window.defineBlock) fires
// untrapped. The guard test below re-evaluates the module via require() after
// installing a fresh spy, which captures the call cleanly.
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
afterAll(() => consoleErrorSpy.mockRestore());

describe("window.defineBlock guard", () => {
  it("logs an error when defineBlock is absent (Jest/jsdom environment)", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    // Clear the module cache so require() re-runs the module body (and
    // therefore the defineBlock guard) with the spy active.
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("./index");
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("window.defineBlock is not available"),
    );
    spy.mockRestore();
    // Re-register the original cached module so the rest of the test file
    // continues to use the statically-imported exports.
    jest.resetModules();
  });
});

describe("TAB_TITLE_ATTRIBUTE", () => {
  it("is the hyphenated attribute the host writes", () => {
    expect(TAB_TITLE_ATTRIBUTE).toBe("tab-title");
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
});

describe("ContentTabsBlockView", () => {
  it("labels the tab for the author", () => {
    render(<ContentTabsBlockView title="Übersicht" index={0} />);

    expect(screen.getByText("Tab: Übersicht")).toBeInTheDocument();
  });
});
