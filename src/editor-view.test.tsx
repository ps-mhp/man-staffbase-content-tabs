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
    const before = group.section.innerHTML;

    markEditorGroups([group])();

    expect(group.section.innerHTML).toBe(before);
  });

  it("does not move or hide anything", () => {
    const group = buildGroup(2);

    markEditorGroups([group]);

    expect(group.section.children).toHaveLength(2);
    expect(group.members[0].column.hidden).toBe(false);
    expect(group.members[0].widget.style.display).toBe("");
  });
});
