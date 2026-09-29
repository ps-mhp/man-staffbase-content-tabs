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

import { GroupWidth, TabGroup, columnsOf } from "./section-scan";

/**
 * Rewrites a section so one group of columns becomes a tab panel.
 *
 * The one rule that governs everything here: **whole column elements are
 * moved, never their children.** A column may hold any other Staffbase widget,
 * and those widgets have already mounted and bound their handlers. Moving the
 * element keeps them intact; rebuilding the markup around them would silently
 * break every one of them.
 *
 * Visibility is switched with the `hidden` attribute *and* an inline
 * `display: none`, not with a class. Inline styles win against whatever the
 * host's stylesheet says about a column, so no specificity fight can leave a
 * panel half visible. The original `style` attribute is kept verbatim so
 * `revert` puts it back exactly.
 */
export const GROUP_CLASS = "content-tabs-group";
export const BAR_CLASS = "content-tabs-bar";
export const PANEL_CLASS = "content-tabs-panel";

/** Marks a column that already belongs to a transformed group. */
export const GROUP_MARKER = "data-content-tabs";

/**
 * The column geometry the host gave a column, undone.
 *
 * A panel is still one of the host's column elements: it carries the class
 * that makes it a quarter of a row, and whatever the host's stylesheet says
 * about positioning or grid placement. Inside our container that is all wrong
 * — the panels no longer sit side by side, they stack, and each one has to
 * fill the width the whole group was given.
 *
 * Written inline and `!important`, not as a stylesheet rule. The host styles
 * these columns with generated classes whose selectors are at least as
 * specific as anything we can write without naming them, and they are injected
 * at runtime, so on a tie the host is simply the later rule and wins. The
 * container's own width is set inline for the same reason, and that is the one
 * part of the layout that was observed to work.
 */
const PANEL_GEOMETRY: readonly (readonly [string, string])[] = [
  ["box-sizing", "border-box"],
  ["width", "100%"],
  ["max-width", "100%"],
  ["min-width", "0"],
  ["flex", "1 1 auto"],
  ["position", "static"],
  ["float", "none"],
  ["grid-column", "auto"],
  ["grid-row", "auto"],
  ["margin-left", "0"],
  ["margin-right", "0"],
  ["transform", "none"],
];

const applyPanelGeometry = (column: HTMLElement): void => {
  PANEL_GEOMETRY.forEach(([property, value]) => {
    column.style.setProperty(property, value, "important");
  });
};

export interface MountedGroup {
  readonly group: TabGroup;
  readonly container: HTMLElement;
  /** Empty element the tab bar is rendered into. */
  readonly bar: HTMLElement;
  setActive(index: number): void;
  revert(): void;
}

export const isTransformed = (column: HTMLElement): boolean => column.hasAttribute(GROUP_MARKER);

/**
 * What to hide so the block leaves no trace in its panel.
 *
 * In the Content Designer the element sits in a `custom-block` region that
 * carries its own margin and shadow; hiding only the element left an empty
 * framed box above the panel content.
 */
const blockOf = (widget: HTMLElement, column: HTMLElement): HTMLElement => {
  const region = widget.closest<HTMLElement>('[data-c13y-region="custom-block"]');
  return region !== null && column.contains(region) ? region : widget;
};

/**
 * Claims the space the replaced columns occupied.
 *
 * The share is asked for as flex *growth*, not as a fixed basis. A section may
 * put a gap between its columns and size the columns themselves around it
 * (`calc(25% - …)`). Three such columns plus the two gaps between them come to
 * slightly less than their three shares add up to, so a container of exactly
 * 75% is wider than the space that was freed — and the column left beside it
 * no longer fits on the line and drops below.
 *
 * With a zero basis and a growth proportional to the share, the container asks
 * for no space of its own and then takes what is left over once the remaining
 * columns and every gap have had theirs. That is the freed space by
 * definition, at any viewport width, whatever the section's gutters are. Two
 * groups in one section still divide it in the ratio of their shares.
 *
 * The percentage is stated as a width as well, for a section that lays its
 * columns out as plain blocks: there `flex` means nothing, and in a flex
 * container the basis takes precedence over the width anyway.
 */
const applyWidth = (container: HTMLElement, width: GroupWidth): void => {
  if (width.kind === "grid") {
    container.style.setProperty("grid-column", `span ${width.span}`, "important");
    return;
  }
  if (width.kind === "percent") {
    container.style.setProperty("flex", `${width.percent} 1 0%`, "important");
    container.style.setProperty("width", `${width.percent}%`, "important");
    container.style.setProperty("max-width", `${width.percent}%`, "important");
    container.style.setProperty("min-width", "0", "important");
  }
};

/** A Content Designer row, see `section-scan.ts`. */
const isDesignerSection = (section: HTMLElement): boolean =>
  section.matches('[data-c13y-component="container-block"]');

export function transformGroup(group: TabGroup): MountedGroup | null {
  if (group.members.length === 0) return null;
  if (group.members.some(({ column }) => isTransformed(column))) return null;

  const first = group.members[0].column;
  if (first.parentElement !== group.section) return null;
  if (isDesignerSection(group.section)) return transformInPlace(group);

  const blocks = group.members.map(({ column, widget }) => blockOf(widget, column));
  const originalStyles = group.members.map(({ column }, index) => ({
    column: column.getAttribute("style"),
    block: blocks[index].getAttribute("style"),
    hidden: column.hidden,
  }));

  const container = document.createElement("div");
  container.className = GROUP_CLASS;
  applyWidth(container, group.width);

  const bar = document.createElement("div");
  bar.className = BAR_CLASS;
  container.appendChild(bar);

  group.section.insertBefore(container, first);

  group.members.forEach(({ column }, index) => {
    column.setAttribute(GROUP_MARKER, "");
    column.classList.add(PANEL_CLASS);
    applyPanelGeometry(column);
    // The block is configuration, not content: it must not show up in the panel.
    blocks[index].style.setProperty("display", "none", "important");
    container.appendChild(column);
  });

  const setActive = (index: number): void => {
    if (index < 0 || index >= group.members.length) return;
    group.members.forEach(({ column }, position) => {
      const active = position === index;
      column.hidden = !active;
      if (active) column.style.removeProperty("display");
      else column.style.setProperty("display", "none", "important");
    });
  };

  setActive(0);

  const revert = (): void => {
    group.members.forEach(({ column }, index) => {
      const saved = originalStyles[index];
      const block = blocks[index];
      column.removeAttribute(GROUP_MARKER);
      column.classList.remove(PANEL_CLASS);
      column.hidden = saved.hidden;
      if (saved.column === null) column.removeAttribute("style");
      else column.setAttribute("style", saved.column);
      if (saved.block === null) block.removeAttribute("style");
      else block.setAttribute("style", saved.block);
      // Put back only where our container still stands. Has the host removed
      // it in a re-render, it has placed its columns anew as well, and
      // reaching for the lost container would throw.
      if (container.parentNode === group.section) group.section.insertBefore(column, container);
    });
    container.remove();
  };

  return { group, container, bar, setActive, revert };
}

/** How many tracks the grid lays out right now; 0 when it is none. */
const trackCount = (section: HTMLElement): number => {
  const template = getComputedStyle(section).gridTemplateColumns.trim();
  if (template === "" || template === "none") return 0;
  // Computed values are resolved lengths; line names in brackets are no track.
  return template.replace(/\[[^\]]*\]/g, " ").trim().split(/\s+/).length;
};

/** How many tracks a column spans; the designer writes `span n`. */
const spanOf = (column: HTMLElement): number => {
  const match = /span\s+(\d+)/.exec(getComputedStyle(column).gridColumnEnd || "");
  return match ? Number(match[1]) : 1;
};

/**
 * The same group, built without moving a single column.
 *
 * Needed for the Content Designer: moving a column detaches the
 * `sb-custom-block` elements inside it, and the designer does not recreate
 * their widgets when they are attached again — the tabs' own blocks vanished,
 * and with them any widget sitting in a panel (seen live on 29.09.2026).
 *
 * The bar is inserted as a grid item of its own in front of the first member.
 * On a multi-track grid it takes the members' tracks in the first row, the
 * panels take the same tracks in the second, and every other column spans
 * both rows. On a single track — the designer's narrow layout — document
 * order already stacks bar and panel, so nothing is placed.
 */
function transformInPlace(group: TabGroup): MountedGroup {
  const { section, members } = group;
  const first = members[0].column;
  const blocks = members.map(({ column, widget }) => blockOf(widget, column));
  const originalStyles = members.map(({ column }, index) => ({
    column: column.getAttribute("style"),
    block: blocks[index].getAttribute("style"),
    hidden: column.hidden,
  }));

  const container = document.createElement("div");
  container.className = GROUP_CLASS;
  const bar = document.createElement("div");
  bar.className = BAR_CLASS;
  container.appendChild(bar);
  section.insertBefore(container, first);

  members.forEach(({ column }, index) => {
    column.setAttribute(GROUP_MARKER, "");
    column.classList.add(PANEL_CLASS);
    blocks[index].style.setProperty("display", "none", "important");
  });

  // Columns outside the group that were stretched over both rows, so revert
  // takes back exactly that and nothing a second group may have set.
  const stretched = new Set<HTMLElement>();
  const unstretch = (column: HTMLElement): void => {
    column.style.removeProperty("grid-row");
    // A column the host rendered without a style attribute gets none back.
    if (column.getAttribute("style") === "") column.removeAttribute("style");
  };
  const memberColumns = new Set(members.map(({ column }) => column));

  const clearPlacement = (): void => {
    [container, ...memberColumns].forEach((element) => {
      element.style.removeProperty("grid-column");
      element.style.removeProperty("grid-row");
    });
    stretched.forEach(unstretch);
    stretched.clear();
  };

  const place = (): void => {
    clearPlacement();
    if (trackCount(section) <= 1) return;

    let line = 1;
    let start = 1;
    let span = 0;
    for (const column of columnsOf(section)) {
      const own = spanOf(column);
      if (column === first) start = line;
      if (memberColumns.has(column)) span += own;
      line += own;
    }

    const tracks = `${start} / span ${span}`;
    container.style.setProperty("grid-column", tracks, "important");
    container.style.setProperty("grid-row", "1", "important");
    memberColumns.forEach((column) => {
      column.style.setProperty("grid-column", tracks, "important");
      column.style.setProperty("grid-row", "2", "important");
    });
    for (const column of columnsOf(section)) {
      if (memberColumns.has(column) || isTransformed(column)) continue;
      column.style.setProperty("grid-row", "1 / span 2", "important");
      stretched.add(column);
    }
  };

  place();
  // The designer switches to a single track through a container query, so
  // the placement has to follow the row's width, not only the first pass.
  const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place);
  resize?.observe(section);

  const setActive = (index: number): void => {
    if (index < 0 || index >= members.length) return;
    members.forEach(({ column }, position) => {
      const active = position === index;
      column.hidden = !active;
      if (active) column.style.removeProperty("display");
      else column.style.setProperty("display", "none", "important");
    });
  };

  setActive(0);

  const revert = (): void => {
    resize?.disconnect();
    stretched.forEach(unstretch);
    members.forEach(({ column }, index) => {
      const saved = originalStyles[index];
      const block = blocks[index];
      column.removeAttribute(GROUP_MARKER);
      column.classList.remove(PANEL_CLASS);
      column.hidden = saved.hidden;
      if (saved.column === null) column.removeAttribute("style");
      else column.setAttribute("style", saved.column);
      if (saved.block === null) block.removeAttribute("style");
      else block.setAttribute("style", saved.block);
    });
    container.remove();
  };

  return { group, container, bar, setActive, revert };
}
