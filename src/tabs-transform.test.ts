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

import { TabGroup } from "./section-scan";
import { GROUP_CLASS, transformGroup } from "./tabs-transform";

const build = (count: number, memberIndexes: readonly number[]): TabGroup => {
  const section = document.createElement("div");
  section.className = "ui-commons__section__wrapper";

  const columns = Array.from({ length: count }, (_, index) => {
    const column = document.createElement("div");
    column.className = `column-50 ui-commons__section__column`;
    column.dataset.index = String(index);
    const inner = document.createElement("p");
    inner.textContent = `content ${index}`;
    column.appendChild(inner);
    column.appendChild(document.createElement("content-tabs"));
    section.appendChild(column);
    return column;
  });

  document.body.appendChild(section);

  return {
    section,
    members: memberIndexes.map((index) => ({
      column: columns[index],
      widget: columns[index].querySelector<HTMLElement>("content-tabs")!,
    })),
    width: { kind: "percent", percent: 50 },
  };
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("transformGroup", () => {
  it("puts the member columns into one container at their old position", () => {
    const group = build(3, [0, 1]);

    const mounted = transformGroup(group)!;

    expect(mounted.container.classList.contains(GROUP_CLASS)).toBe(true);
    expect(group.section.children[0]).toBe(mounted.container);
    expect(group.section.children[1]).toBe(group.section.querySelector('[data-index="2"]'));
    expect(mounted.container.contains(group.members[0].column)).toBe(true);
    expect(mounted.container.contains(group.members[1].column)).toBe(true);
  });

  it("moves the very same column nodes rather than copies", () => {
    const group = build(2, [0, 1]);
    const original = group.members[0].column;
    const child = original.firstElementChild;

    transformGroup(group);

    expect(original.isConnected).toBe(true);
    expect(original.firstElementChild).toBe(child);
  });

  it("shows the first member and hides the rest", () => {
    const group = build(3, [0, 1, 2]);

    transformGroup(group);

    expect(group.members[0].column.hidden).toBe(false);
    expect(group.members[1].column.hidden).toBe(true);
    expect(group.members[2].column.hidden).toBe(true);
  });

  it("switches the active member", () => {
    const group = build(2, [0, 1]);
    const mounted = transformGroup(group)!;

    mounted.setActive(1);

    expect(group.members[0].column.hidden).toBe(true);
    expect(group.members[1].column.hidden).toBe(false);
  });

  it("hides the configuration blocks themselves", () => {
    const group = build(2, [0, 1]);

    transformGroup(group);

    expect(group.members[0].widget.style.display).toBe("none");
  });

  it("claims the added share as a percentage", () => {
    const group = build(2, [0, 1]);

    const mounted = transformGroup(group)!;

    expect(mounted.container.style.width).toBe("50%");
    expect(mounted.container.style.flex).toContain("50%");
  });

  it("claims a column span when the group asks for one", () => {
    const group = { ...build(3, [0, 1]), width: { kind: "grid", span: 2 } as const };

    const mounted = transformGroup(group)!;

    expect(mounted.container.style.gridColumn).toBe("span 2");
    expect(mounted.container.style.width).toBe("");
  });

  it("claims no width when the group has none", () => {
    const group = { ...build(2, [0, 1]), width: { kind: "none" } as const };

    const mounted = transformGroup(group)!;

    expect(mounted.container.style.width).toBe("");
    expect(mounted.container.style.flex).toBe("");
  });

  it("restores the section exactly on revert", () => {
    const group = build(3, [0, 1]);
    const before = group.section.innerHTML;

    transformGroup(group)!.revert();

    expect(group.section.innerHTML).toBe(before);
  });

  it("refuses to transform a group it already transformed", () => {
    const group = build(2, [0, 1]);
    transformGroup(group);

    expect(transformGroup(group)).toBeNull();
  });

  it("gives the tab bar as the container's first child", () => {
    const group = build(2, [0, 1]);

    const mounted = transformGroup(group)!;

    expect(mounted.container.firstElementChild).toBe(mounted.bar);
    expect(mounted.bar.childElementCount).toBe(0);
  });

  it("setActive with an out-of-range index (>= length) leaves the current panel visible", () => {
    const group = build(2, [0, 1]);
    const mounted = transformGroup(group)!;
    // panel 0 is active after transform
    mounted.setActive(group.members.length); // out of range

    const visibleCount = group.members.filter(({ column }) => !column.hidden).length;
    expect(visibleCount).toBe(1);
    expect(group.members[0].column.hidden).toBe(false);
  });

  it("setActive with a negative index leaves the current panel visible", () => {
    const group = build(2, [0, 1]);
    const mounted = transformGroup(group)!;
    mounted.setActive(1); // activate panel 1 first
    mounted.setActive(-1); // out of range

    const visibleCount = group.members.filter(({ column }) => !column.hidden).length;
    expect(visibleCount).toBe(1);
    expect(group.members[1].column.hidden).toBe(false);
  });

  it("restores the section exactly when members are in the middle of non-member columns", () => {
    // columns 0 and 3 are non-members; 1 and 2 are members
    const group = build(4, [1, 2]);
    const col1 = group.members[0].column;
    const col2 = group.members[1].column;
    const before = group.section.innerHTML;

    transformGroup(group)!.revert();

    expect(group.section.innerHTML).toBe(before);
    // node identity: same objects are back in place
    expect(group.section.children[1]).toBe(col1);
    expect(group.section.children[2]).toBe(col2);
  });

  it("restores a column that was hidden before the transform", () => {
    const group = build(2, [0, 1]);
    group.members[0].column.hidden = true; // pre-existing hidden state

    transformGroup(group)!.revert();

    expect(group.members[0].column.hidden).toBe(true);
  });
});
