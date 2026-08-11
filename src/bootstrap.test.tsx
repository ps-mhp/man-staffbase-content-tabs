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

import { clearTabsForTests, registerTab } from "./tab-registry";
import { GROUP_CLASS } from "./tabs-transform";
import { isEditorContext, runContentTabs } from "./bootstrap";

const buildSection = (columnCount: number): HTMLElement[] => {
  const section = document.createElement("div");
  section.className = "ui-commons__section__wrapper";
  const columns = Array.from({ length: columnCount }, () => {
    const column = document.createElement("div");
    column.className = "column-50 ui-commons__section__column";
    section.appendChild(column);
    return column;
  });
  document.body.appendChild(section);
  return columns;
};

const addWidget = (column: HTMLElement, title: string | null): HTMLElement => {
  const widget = document.createElement("content-tabs");
  column.appendChild(widget);
  registerTab(widget, title);
  return widget;
};

/**
 * The registry coalesces registrations into one microtask, so a test that
 * registers a block has to let that microtask run before looking.
 */
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  clearTabsForTests();
  document.body.innerHTML = "";
});

describe("isEditorContext", () => {
  it("recognises the editor by its own state container", () => {
    document.body.innerHTML = `<div data-react-values="{}"></div>`;

    expect(isEditorContext()).toBe(true);
  });

  it("treats a page without it as the frontend", () => {
    expect(isEditorContext()).toBe(false);
  });
});

describe("runContentTabs in the frontend", () => {
  it("turns a group into tabs", () => {
    const columns = buildSection(2);
    addWidget(columns[0], "Übersicht");
    addWidget(columns[1], "Details");

    const stop = runContentTabs();

    const container = document.querySelector(`.${GROUP_CLASS}`);
    expect(container).not.toBeNull();
    expect(container!.querySelectorAll('[role="tab"]')).toHaveLength(2);
    stop();
  });

  it("labels the tabs with the registered titles", () => {
    const columns = buildSection(2);
    addWidget(columns[0], "Übersicht");
    addWidget(columns[1], "Details");

    const stop = runContentTabs();

    const labels = Array.from(document.querySelectorAll('[role="tab"]'), (tab) => tab.textContent);
    expect(labels).toEqual(["Übersicht", "Details"]);
    stop();
  });

  it("leaves a section without any block alone", () => {
    buildSection(2);

    const stop = runContentTabs();

    expect(document.querySelector(`.${GROUP_CLASS}`)).toBeNull();
    stop();
  });

  it("puts the page back when it stops", () => {
    const columns = buildSection(2);
    addWidget(columns[0], "Übersicht");
    addWidget(columns[1], "Details");
    const before = document.body.innerHTML;

    runContentTabs()();

    expect(document.body.innerHTML).toBe(before);
  });

  it("picks up a block that registers later", async () => {
    const columns = buildSection(2);
    addWidget(columns[0], "Übersicht");

    const stop = runContentTabs();
    expect(document.querySelectorAll('[role="tab"]')).toHaveLength(1);

    addWidget(columns[1], "Details");
    await flush();

    expect(document.querySelectorAll('[role="tab"]')).toHaveLength(2);
    stop();
  });

  it("keeps the chosen tab across a rebuild", async () => {
    const columns = buildSection(3);
    addWidget(columns[0], "A");
    addWidget(columns[1], "B");

    const stop = runContentTabs();
    document.querySelectorAll<HTMLElement>('[role="tab"]')[1].click();
    expect(columns[1].hidden).toBe(false);

    addWidget(columns[2], "C");
    await flush();

    expect(columns[1].hidden).toBe(false);
    expect(columns[0].hidden).toBe(true);
    stop();
  });

  it("does not rebuild itself in a loop", async () => {
    const columns = buildSection(2);
    addWidget(columns[0], "Übersicht");
    addWidget(columns[1], "Details");

    const stop = runContentTabs();
    // One rebuild is expected right after the start: the blocks registered
    // before the run began and their notification is still on its way.
    await flush();
    const container = document.querySelector(`.${GROUP_CLASS}`);

    await flush();
    await flush();

    // Still the very same element: another rebuild would have replaced it.
    expect(document.querySelector(`.${GROUP_CLASS}`)).toBe(container);
    stop();
  });
});

describe("runContentTabs in the editor", () => {
  beforeEach(() => {
    const state = document.createElement("div");
    state.setAttribute("data-react-values", "{}");
    document.body.appendChild(state);
  });

  it("does not move or hide anything", () => {
    const columns = buildSection(2);
    addWidget(columns[0], "Übersicht");
    addWidget(columns[1], "Details");

    const stop = runContentTabs();

    expect(document.querySelector(`.${GROUP_CLASS}`)).toBeNull();
    expect(columns[0].hidden).toBe(false);
    expect(columns[1].hidden).toBe(false);
    stop();
  });

  it("frames the group instead", () => {
    const columns = buildSection(2);
    addWidget(columns[0], "Übersicht");
    addWidget(columns[1], "Details");

    const stop = runContentTabs();

    expect(columns[0].classList.contains("content-tabs-group-start")).toBe(true);
    expect(columns[1].classList.contains("content-tabs-group-end")).toBe(true);
    stop();
  });
});
