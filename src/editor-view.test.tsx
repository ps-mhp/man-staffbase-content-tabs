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

import { TabGroup } from "./section-scan";
import { TabLabel, markEditorGroups } from "./editor-view";

const buildGroup = (size: number): TabGroup => {
  const section = document.createElement("div");
  section.className = "ui-commons__section__wrapper";
  const members = Array.from({ length: size }, () => {
    const column = document.createElement("div");
    column.className = "column-50 ui-commons__section__column";
    const widget = document.createElement("content-tabs");
    column.appendChild(widget);
    section.appendChild(column);
    return { column, widget };
  });
  document.body.appendChild(section);
  return { section, members, width: { kind: "none" } };
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("TabLabel", () => {
  it("names the tab", () => {
    render(<TabLabel title="Übersicht" index={0} />);

    expect(screen.getByText("Tab: Übersicht")).toBeInTheDocument();
  });

  it("falls back to a number while the title is missing", () => {
    render(<TabLabel title={null} index={1} />);

    expect(screen.getByText("Tab: Tab 2")).toBeInTheDocument();
  });
});

describe("markEditorGroups", () => {
  it("marks the ends of a group of three", () => {
    const group = buildGroup(3);

    markEditorGroups([group]);

    expect(group.members[0].column.classList.contains("content-tabs-group-start")).toBe(true);
    expect(group.members[1].column.classList.contains("content-tabs-group-middle")).toBe(true);
    expect(group.members[2].column.classList.contains("content-tabs-group-end")).toBe(true);
  });

  it("gives a group of one both ends", () => {
    const group = buildGroup(1);

    markEditorGroups([group]);

    const { classList } = group.members[0].column;
    expect(classList.contains("content-tabs-group-start")).toBe(true);
    expect(classList.contains("content-tabs-group-end")).toBe(true);
    expect(classList.contains("content-tabs-group-middle")).toBe(false);
  });

  it("removes every mark it made", () => {
    const group = buildGroup(2);
    // Capture the full body so marks applied outside the section are also caught.
    const before = document.body.innerHTML;

    const cleanup = markEditorGroups([group]);
    // While marked, every column carries EDITOR_MARKER.
    group.members.forEach(({ column }) => {
      expect(column.hasAttribute("data-content-tabs-editor")).toBe(true);
    });

    cleanup();

    // After cleanup no column should carry the marker.
    group.members.forEach(({ column }) => {
      expect(column.hasAttribute("data-content-tabs-editor")).toBe(false);
    });
    // The DOM must be byte-identical to what it was before any marking.
    expect(document.body.innerHTML).toBe(before);
  });

  it("is idempotent — calling twice then cleaning up the first call restores pristine markup", () => {
    const group = buildGroup(2);
    const before = document.body.innerHTML;

    // First call marks the columns and owns them.
    const cleanup1 = markEditorGroups([group]);
    // Second call finds all columns already marked and adds nothing to its own
    // `marked` list — its cleanup is therefore a no-op, but it must still be
    // a callable function (callers must not need to know call order).
    const cleanup2 = markEditorGroups([group]);

    // Both calls agree: every column carries the marker.
    group.members.forEach(({ column }) => {
      expect(column.hasAttribute("data-content-tabs-editor")).toBe(true);
    });

    // The second cleanup owns nothing — calling it must leave the marks intact.
    cleanup2();
    group.members.forEach(({ column }) => {
      expect(column.hasAttribute("data-content-tabs-editor")).toBe(true);
    });

    // The first cleanup owns all columns — after it runs the DOM is pristine.
    cleanup1();
    group.members.forEach(({ column }) => {
      expect(column.hasAttribute("data-content-tabs-editor")).toBe(false);
    });
    expect(document.body.innerHTML).toBe(before);
  });

  it("does not move or hide anything", () => {
    const group = buildGroup(2);

    markEditorGroups([group]);

    expect(group.section.children).toHaveLength(2);
    expect(group.members[0].column.hidden).toBe(false);
    expect(group.members[0].widget.style.display).toBe("");
  });
});
