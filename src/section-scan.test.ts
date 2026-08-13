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
import { columnsOf, scanAll, scanSection } from "./section-scan";

/**
 * Builds a section whose columns match the real host markup: the columns are
 * direct children of the wrapper and carry both the semantic class and a
 * `column-<n>` width class (confirmed against a published page, see the spike
 * report). `spec` marks which columns hold a `<content-tabs>`.
 *
 * The `sectionstyle__*` hash classes are deliberate realism — they model the
 * actual Staffbase DOM where styled-components injects its own class alongside
 * the stable semantic ones. The dedicated "stable host classes" test below pins
 * that the implementation does not depend on them.
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

describe("stable-selector independence", () => {
  it("finds the group when only the stable host classes are present", () => {
    // Build a section with NO sectionstyle__ hashes — only the semantic selectors.
    const section = document.createElement("div");
    section.className = "ui-commons__section__wrapper";
    const col0 = document.createElement("div");
    col0.className = "column-33 ui-commons__section__column";
    const col1 = document.createElement("div");
    col1.className = "column-33 ui-commons__section__column";
    const col2 = document.createElement("div");
    col2.className = "column-33 ui-commons__section__column";
    col0.appendChild(document.createElement("content-tabs"));
    col1.appendChild(document.createElement("content-tabs"));
    section.appendChild(col0);
    section.appendChild(col1);
    section.appendChild(col2);
    document.body.appendChild(section);

    const groups = scanSection(section, widgetsIn(section));

    expect(groups).toHaveLength(1);
    expect(groups[0].members).toHaveLength(2);
    expect(groups[0].members[0].column).toBe(col0);
    expect(groups[0].width).toMatchObject({ kind: "percent" });
  });
});

describe("nested section isolation", () => {
  it("does not include an inner section's columns in the outer group", () => {
    // Outer section: two 50-wide columns, first holds a widget.
    const outer = document.createElement("div");
    outer.className = "ui-commons__section__wrapper";
    const outerCol0 = document.createElement("div");
    outerCol0.className = "column-50 ui-commons__section__column";
    const outerCol1 = document.createElement("div");
    outerCol1.className = "column-50 ui-commons__section__column";
    outerCol0.appendChild(document.createElement("content-tabs"));
    outer.appendChild(outerCol0);
    outer.appendChild(outerCol1);

    // Nested section inside outerCol1, with its own 100-wide column + widget.
    const inner = document.createElement("div");
    inner.className = "ui-commons__section__wrapper";
    const innerCol = document.createElement("div");
    innerCol.className = "column-100 ui-commons__section__column";
    const innerWidget = document.createElement("content-tabs");
    innerCol.appendChild(innerWidget);
    inner.appendChild(innerCol);
    outerCol1.appendChild(inner);

    document.body.appendChild(outer);

    // columnsOf must return only the two direct outer children, not innerCol.
    // If it used querySelectorAll, it would return 3 elements and the
    // assertions below (count and width) would both fail.
    expect(columnsOf(outer)).toHaveLength(2);

    // The outer group covers outerCol0 only (50 out of 50+50 = 50 %).
    // With querySelectorAll the total would be 50+50+100=200 → 25 %, not 50.
    const outerGroups = scanSection(outer, new Set([outerCol0.querySelector<HTMLElement>("content-tabs")!]));
    expect(outerGroups).toHaveLength(1);
    expect(outerGroups[0].members).toHaveLength(1);
    expect(outerGroups[0].members[0].column).toBe(outerCol0);
    expect(outerGroups[0].width).toEqual({ kind: "percent", percent: 50 });

    // scanAll routes innerWidget to the inner section, not the outer.
    const allGroups = scanAll([innerWidget]);
    expect(allGroups).toHaveLength(1);
    expect(allGroups[0].section).toBe(inner);
    expect(allGroups[0].members[0].column).toBe(innerCol);
  });
});
