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
import { columnsOf, scanAll, scanSection } from "./section-scan";

/**
 * Builds a section whose columns match the real host markup: the columns are
 * direct children of the wrapper and carry both the semantic class and a
 * `column-<n>` width class (confirmed against a published page, see the spike
 * report). `spec` marks which columns hold a `<content-tabs>`.
 */
const buildSection = (widths: readonly number[], withWidget: readonly boolean[]): HTMLElement => {
  const section = document.createElement("div");
  section.className = "sectionstyle__SectionWrapper-sc-x ui-commons__section__wrapper";

  widths.forEach((width, index) => {
    const column = document.createElement("div");
    column.className = `sectionstyle__Column-sc-y column-${width} ui-commons__section__column`;
    if (withWidget[index]) column.appendChild(document.createElement("content-tabs"));
    section.appendChild(column);
  });

  document.body.appendChild(section);
  return section;
};

const widgetsIn = (section: HTMLElement): Set<HTMLElement> =>
  new Set(Array.from(section.querySelectorAll<HTMLElement>("content-tabs")));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("columnsOf", () => {
  it("returns only direct column children", () => {
    const section = buildSection([50, 50], [false, false]);
    const nested = document.createElement("div");
    nested.className = "ui-commons__section__column";
    section.firstElementChild!.appendChild(nested);

    expect(columnsOf(section)).toHaveLength(2);
  });
});

describe("scanSection — grouping", () => {
  it("groups two adjacent tab columns", () => {
    const section = buildSection([33, 33, 33], [true, true, false]);

    const groups = scanSection(section, widgetsIn(section));

    expect(groups).toHaveLength(1);
    expect(groups[0].members).toHaveLength(2);
    expect(groups[0].members[0].column).toBe(section.children[0]);
  });

  it("keeps non-adjacent tab columns in separate groups", () => {
    const section = buildSection([33, 33, 33], [true, false, true]);

    const groups = scanSection(section, widgetsIn(section));

    expect(groups).toHaveLength(2);
    expect(groups[0].members).toHaveLength(1);
    expect(groups[1].members).toHaveLength(1);
  });

  it("treats a single tab column as a group of one", () => {
    const section = buildSection([50, 50], [false, true]);

    const groups = scanSection(section, widgetsIn(section));

    expect(groups).toHaveLength(1);
    expect(groups[0].members[0].column).toBe(section.children[1]);
  });

  it("finds no group when no column holds a widget", () => {
    const section = buildSection([50, 50], [false, false]);

    expect(scanSection(section, widgetsIn(section))).toEqual([]);
  });

  it("groups every column when all of them hold a widget", () => {
    const section = buildSection([33, 33, 33], [true, true, true]);

    const groups = scanSection(section, widgetsIn(section));

    expect(groups).toHaveLength(1);
    expect(groups[0].members).toHaveLength(3);
  });

  it("ignores a widget that is not in the given set", () => {
    const section = buildSection([50, 50], [true, false]);

    expect(scanSection(section, new Set())).toEqual([]);
  });
});

describe("scanSection — width", () => {
  it("adds up the declared shares of its members", () => {
    const section = buildSection([50, 50], [true, false]);

    expect(scanSection(section, widgetsIn(section))[0].width).toEqual({
      kind: "percent",
      percent: 50,
    });
  });

  it("normalises shares that do not add up to a hundred", () => {
    const section = buildSection([33, 33, 33], [true, true, false]);

    const { width } = scanSection(section, widgetsIn(section))[0];

    expect(width.kind).toBe("percent");
    expect((width as { percent: number }).percent).toBeCloseTo(66.667, 2);
  });

  it("asks for a column span when the section is a grid", () => {
    const section = buildSection([33, 33, 33], [true, true, false]);
    section.style.display = "grid";

    expect(scanSection(section, widgetsIn(section))[0].width).toEqual({ kind: "grid", span: 2 });
  });

  it("claims no width when a column declares none and cannot be measured", () => {
    const section = buildSection([50, 50], [true, false]);
    section.children[1].className = "ui-commons__section__column";

    expect(scanSection(section, widgetsIn(section))[0].width).toEqual({ kind: "none" });
  });
});

describe("scanAll", () => {
  it("scans each section a widget belongs to, once", () => {
    const first = buildSection([50, 50], [true, false]);
    const second = buildSection([50, 50], [true, true]);
    const widgets = [
      ...Array.from(first.querySelectorAll<HTMLElement>("content-tabs")),
      ...Array.from(second.querySelectorAll<HTMLElement>("content-tabs")),
    ];

    const groups = scanAll(widgets);

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.members.length)).toEqual([1, 2]);
  });

  it("skips a widget that sits outside any section", () => {
    const orphan = document.createElement("content-tabs");
    document.body.appendChild(orphan);

    expect(scanAll([orphan])).toEqual([]);
  });
});
