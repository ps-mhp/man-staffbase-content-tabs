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

export interface MountedGroup {
  readonly group: TabGroup;
  readonly container: HTMLElement;
  /** Empty element the tab bar is rendered into. */
  readonly bar: HTMLElement;
  setActive(index: number): void;
  revert(): void;
}

export const isTransformed = (column: HTMLElement): boolean => column.hasAttribute(GROUP_MARKER);

const applyWidth = (container: HTMLElement, width: GroupWidth): void => {
  if (width.kind === "grid") {
    container.style.gridColumn = `span ${width.span}`;
    return;
  }
  if (width.kind === "percent") {
    // Both, because the section may lay its columns out with flex or as plain
    // blocks and only one of the two takes effect in either case.
    container.style.flex = `0 0 ${width.percent}%`;
    container.style.width = `${width.percent}%`;
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
    // The block is configuration, not content: it must not show up in the panel.
    widget.style.display = "none";
    container.appendChild(column);
  });

  const setActive = (index: number): void => {
    if (index < 0 || index >= group.members.length) return;
    group.members.forEach(({ column }, position) => {
      const active = position === index;
      column.hidden = !active;
      column.style.display = active ? "" : "none";
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
