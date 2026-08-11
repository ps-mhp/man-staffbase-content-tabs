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

import { TabGroup } from "./section-scan";
import { tabLabel } from "./tabs-view";

/** Marks a column this module has decorated, so the marks can be taken back. */
export const EDITOR_MARKER = "data-content-tabs-editor";

/**
 * What the block shows in its own element while the author is editing.
 *
 * The section is left exactly as it is here — columns stay side by side and
 * every one of them stays editable. Rendering the real tab view would hide the
 * inactive panels, and their content would be out of the author's reach.
 */
export function TabLabel({ title, index }: { title: string | null; index: number }): React.JSX.Element {
  return <span className="content-tabs-editor-label">Tab: {tabLabel(title, index)}</span>;
}

/**
 * Draws a shared frame around each group of adjacent tab columns.
 *
 * Done with classes on the member columns — left edge, middle, right edge —
 * rather than an absolutely positioned overlay. The frame then lives in the
 * layout and follows any reflow without being re-measured.
 *
 * @returns a function taking every mark back.
 */
export function markEditorGroups(groups: readonly TabGroup[]): () => void {
  groups.forEach((group) => {
    group.members.forEach(({ column }, index) => {
      // Skip columns already marked — the cleanup iterates groups directly,
      // so skipping here prevents double-adding classes on a second call.
      if (column.hasAttribute(EDITOR_MARKER)) return;

      column.setAttribute(EDITOR_MARKER, "");
      // A group of one is simultaneously its own start and end.
      if (index === 0) column.classList.add("content-tabs-group-start");
      // A group of one is simultaneously its own start and end.
      if (index === group.members.length - 1) column.classList.add("content-tabs-group-end");
      if (index > 0 && index < group.members.length - 1) {
        column.classList.add("content-tabs-group-middle");
      }
    });
  });

  return () => {
    // Iterate over all columns in the groups. At cleanup time, only unmark
    // columns that still carry EDITOR_MARKER — if the marker is already gone
    // another cleanup has handled it and this one must not double-remove.
    // Using groups (not just a captured list) makes every cleanup independently
    // able to restore pristine markup regardless of which call's cleanup runs last.
    groups.forEach((group) => {
      group.members.forEach(({ column }) => {
        if (!column.hasAttribute(EDITOR_MARKER)) return;

        column.removeAttribute(EDITOR_MARKER);
        column.classList.remove(
          "content-tabs-group-start",
          "content-tabs-group-middle",
          "content-tabs-group-end",
        );
        // Restore byte-identical markup: drop the class attribute when empty.
        if (column.classList.length === 0) column.removeAttribute("class");
      });
    });
  };
}
