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

import { GroupWidth, TabGroup } from "./section-scan";

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

export function transformGroup(group: TabGroup): MountedGroup | null {
  if (group.members.length === 0) return null;
  if (group.members.some(({ column }) => isTransformed(column))) return null;

  const first = group.members[0].column;
  if (first.parentElement !== group.section) return null;

  const originalStyles = group.members.map(({ column, widget }) => ({
    column: column.getAttribute("style"),
    widget: widget.getAttribute("style"),
    hidden: column.hidden,
  }));

  const container = document.createElement("div");
  container.className = GROUP_CLASS;
  applyWidth(container, group.width);

  const bar = document.createElement("div");
  bar.className = BAR_CLASS;
  container.appendChild(bar);

  group.section.insertBefore(container, first);

  group.members.forEach(({ column, widget }) => {
    column.setAttribute(GROUP_MARKER, "");
    column.classList.add(PANEL_CLASS);
    applyPanelGeometry(column);
    // The block is configuration, not content: it must not show up in the panel.
    widget.style.setProperty("display", "none", "important");
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
    group.members.forEach(({ column, widget }, index) => {
      const saved = originalStyles[index];
      column.removeAttribute(GROUP_MARKER);
      column.classList.remove(PANEL_CLASS);
      column.hidden = saved.hidden;
      if (saved.column === null) column.removeAttribute("style");
      else column.setAttribute("style", saved.column);
      if (saved.widget === null) widget.removeAttribute("style");
      else widget.setAttribute("style", saved.widget);
      group.section.insertBefore(column, container);
    });
    container.remove();
  };

  return { group, container, bar, setActive, revert };
}
