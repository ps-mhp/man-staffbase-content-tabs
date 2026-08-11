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

/**
 * Turns the live section DOM into the groups the transform should build.
 *
 * Pure with respect to the document: it reads, it never writes. That is what
 * makes the whole grouping and width policy testable without a real Staffbase
 * page.
 *
 * The selectors are the semantic `ui-commons__*` classes, confirmed against a
 * published page (see the spike report). Their styled-components siblings —
 * `sectionstyle__Column-sc-…` and the hash next to it — are regenerated on
 * every Staffbase build and must never be relied on.
 */

/** The section a `<content-tabs>` block belongs to. */
export const SECTION_SELECTOR = ".ui-commons__section__wrapper";

/** One column of a section. Columns are direct children of the section. */
export const COLUMN_SELECTOR = ".ui-commons__section__column";

/** Declared width share, e.g. `column-33`. */
const WIDTH_CLASS = /(?:^|\s)column-(\d+(?:\.\d+)?)(?:\s|$)/;

export interface TabMember {
  readonly column: HTMLElement;
  readonly widget: HTMLElement;
}

export type GroupWidth =
  | { readonly kind: "grid"; readonly span: number }
  | { readonly kind: "percent"; readonly percent: number }
  | { readonly kind: "none" };

export interface TabGroup {
  readonly section: HTMLElement;
  readonly members: readonly TabMember[];
  readonly width: GroupWidth;
}

/**
 * The section's columns, in document order.
 *
 * Direct children only. A `querySelectorAll` would also reach columns of a
 * section nested inside this one and mix two layouts into one group.
 */
export function columnsOf(section: HTMLElement): HTMLElement[] {
  return Array.from(section.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && child.matches(COLUMN_SELECTOR),
  );
}

/** The declared share of a column, or `null` when it declares none. */
const declaredShare = (column: HTMLElement): number | null => {
  const match = WIDTH_CLASS.exec(column.className);
  return match ? Number(match[1]) : null;
};

const isGrid = (section: HTMLElement): boolean => {
  const display = getComputedStyle(section).display;
  return display === "grid" || display === "inline-grid";
};

/**
 * How wide the group should be.
 *
 * A grid is asked for a column span rather than a width: there it is not the
 * child's width that decides, but how many tracks it occupies — and the
 * transform changes the section's child count, which shifts auto-placement.
 *
 * Otherwise the members' declared shares are added up and normalised against
 * the section total, because Staffbase writes `column-33` for a third and three
 * of them add up to 99, not 100.
 *
 * A column that declares no share at all is measured instead. Where that is not
 * possible either — a detached or unlaid-out section — no width is claimed and
 * the host layout keeps deciding.
 */
const widthOf = (
  section: HTMLElement,
  columns: readonly HTMLElement[],
  members: readonly TabMember[],
): GroupWidth => {
  if (isGrid(section)) return { kind: "grid", span: members.length };

  const shares = columns.map(declaredShare);
  if (shares.every((share): share is number => share !== null)) {
    const total = shares.reduce((sum, share) => sum + share, 0);
    if (total > 0) {
      const mine = members.reduce((sum, member) => sum + shares[columns.indexOf(member.column)], 0);
      return { kind: "percent", percent: (mine * 100) / total };
    }
  }

  const sectionWidth = section.clientWidth;
  if (sectionWidth > 0) {
    const mine = members.reduce((sum, member) => sum + member.column.offsetWidth, 0);
    if (mine > 0) return { kind: "percent", percent: (mine * 100) / sectionWidth };
  }

  return { kind: "none" };
};

/**
 * The tab groups of one section.
 *
 * Only *adjacent* tab columns form a group: `[tab][plain][tab]` yields two
 * groups of one, not one group of two. What the author laid out is what they
 * get — nothing jumps to another position behind their back.
 */
export function scanSection(
  section: HTMLElement,
  widgets: ReadonlySet<HTMLElement>,
): TabGroup[] {
  const columns = columnsOf(section);
  const groups: TabGroup[] = [];
  let run: TabMember[] = [];

  const flush = (): void => {
    if (run.length > 0) {
      groups.push({ section, members: run, width: widthOf(section, columns, run) });
    }
    run = [];
  };

  const widgetList = Array.from(widgets);
  for (const column of columns) {
    const widget = widgetList.find((candidate) => column.contains(candidate));
    if (widget) {
      run.push({ column, widget });
    } else {
      flush();
    }
  }
  flush();

  return groups;
}

/** Every group implied by the given blocks, section by section. */
export function scanAll(widgets: readonly HTMLElement[]): TabGroup[] {
  const bySection = new Map<HTMLElement, Set<HTMLElement>>();

  for (const widget of widgets) {
    const section = widget.closest<HTMLElement>(SECTION_SELECTOR);
    if (!section) continue;
    if (!bySection.has(section)) bySection.set(section, new Set());
    bySection.get(section)!.add(widget);
  }

  return [...bySection].flatMap(([section, own]) => scanSection(section, own));
}
