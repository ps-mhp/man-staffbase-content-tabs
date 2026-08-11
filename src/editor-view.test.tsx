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
import { TabLabel, markEditorGroups, EDITOR_MARKER } from "./editor-view";

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
    // The marker attribute must also be set, independently of the classes.
    expect(group.members[0].column.hasAttribute(EDITOR_MARKER)).toBe(true);
  });

  it("gives a group of one both ends", () => {
    const group = buildGroup(1);

    markEditorGroups([group]);

    const { classList } = group.members[0].column;
    expect(classList.contains("content-tabs-group-start")).toBe(true);
    expect(classList.contains("content-tabs-group-end")).toBe(true);
    expect(classList.contains("content-tabs-group-middle")).toBe(false);
    expect(group.members[0].column.hasAttribute(EDITOR_MARKER)).toBe(true);
  });

  it("removes every mark it made", () => {
    const group = buildGroup(2);
    // Capture the full body so marks applied outside the section are also caught.
    const before = document.body.innerHTML;

    const cleanup = markEditorGroups([group]);
    // While marked, every column carries EDITOR_MARKER.
    group.members.forEach(({ column }) => {
      expect(column.hasAttribute(EDITOR_MARKER)).toBe(true);
    });

    cleanup();

    // After cleanup no column should carry the marker.
    group.members.forEach(({ column }) => {
      expect(column.hasAttribute(EDITOR_MARKER)).toBe(false);
    });
    // The DOM must be byte-identical to what it was before any marking.
    expect(document.body.innerHTML).toBe(before);
  });

  it("is idempotent — calling twice then running either cleanup restores pristine markup", () => {
    const group = buildGroup(2);
    const before = document.body.innerHTML;

    // First call marks the columns.
    const cleanup1 = markEditorGroups([group]);
    // Second call finds all columns already marked — skips adding classes again.
    // Both cleanups iterate groups and guard on EDITOR_MARKER at cleanup time,
    // so whichever runs first does the work; the second is safely a no-op.
    const cleanup2 = markEditorGroups([group]);

    // Both calls agree: every column carries the marker.
    group.members.forEach(({ column }) => {
      expect(column.hasAttribute(EDITOR_MARKER)).toBe(true);
    });

    // Whichever cleanup runs first removes all marks.
    cleanup2();
    group.members.forEach(({ column }) => {
      expect(column.hasAttribute(EDITOR_MARKER)).toBe(false);
    });
    expect(document.body.innerHTML).toBe(before);

    // The second cleanup (cleanup1) sees no markers and does nothing — still pristine.
    cleanup1();
    group.members.forEach(({ column }) => {
      expect(column.hasAttribute(EDITOR_MARKER)).toBe(false);
    });
    expect(document.body.innerHTML).toBe(before);
  });

  it("is safe when the second cleanup is the only one kept — call twice, discard first cleanup", () => {
    const group = buildGroup(2);
    const before = document.body.innerHTML;

    // Simulate the React pattern: store only the latest returned cleanup.
    markEditorGroups([group]); // first cleanup discarded
    const cleanup2 = markEditorGroups([group]);

    // Marks are still in place (first call set them, second call is a no-op).
    group.members.forEach(({ column }) => {
      expect(column.hasAttribute(EDITOR_MARKER)).toBe(true);
    });

    // Running only the second cleanup must still produce fully pristine markup.
    cleanup2();

    group.members.forEach(({ column }) => {
      expect(column.hasAttribute(EDITOR_MARKER)).toBe(false);
    });
    expect(document.body.innerHTML).toBe(before);
  });

  it("removes the class attribute entirely when the column had no pre-existing classes", () => {
    // Build a column whose only classes are the ones this module adds.
    const section = document.createElement("div");
    section.className = "ui-commons__section__wrapper";
    const column = document.createElement("div");
    // No extra classes — classList is empty before marking.
    const widget = document.createElement("content-tabs");
    column.appendChild(widget);
    section.appendChild(column);
    document.body.appendChild(section);

    const group: TabGroup = { section, members: [{ column, widget }], width: { kind: "none" } };
    const before = document.body.innerHTML;

    const cleanup = markEditorGroups([group]);
    cleanup();

    // The class attribute must be completely absent — not present but empty.
    expect(column.hasAttribute("class")).toBe(false);
    // Markup is byte-identical to before marking.
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
