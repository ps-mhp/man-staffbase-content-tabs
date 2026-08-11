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

import { BAR_CLASS } from "./tabs-transform";

/**
 * What a tab is called.
 *
 * Blocks render one after another, so a title can legitimately be missing for
 * a moment on first paint. A numbered label is shown until it arrives — an
 * empty tab would look like a defect.
 */
export function tabLabel(title: string | null, index: number): string {
  const trimmed = title?.trim() ?? "";
  return trimmed === "" ? `Tab ${index + 1}` : trimmed;
}

export interface TabsBarProps {
  readonly titles: readonly (string | null)[];
  readonly activeIndex: number;
  readonly panelIds: readonly string[];
  readonly tabIds: readonly string[];
  onSelect(index: number): void;
}

/**
 * The tab strip.
 *
 * Follows the ARIA tabs pattern: one `tablist`, a roving tabindex so the strip
 * is a single tab stop, and arrow keys to move within it. The panels are the
 * host's own column elements, which is why their ids are passed in rather than
 * rendered here.
 */
export function TabsBar({
  titles,
  activeIndex,
  panelIds,
  tabIds,
  onSelect,
}: TabsBarProps): React.JSX.Element {
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const last = titles.length - 1;
    const next: Record<string, number> = {
      ArrowRight: activeIndex === last ? 0 : activeIndex + 1,
      ArrowLeft: activeIndex === 0 ? last : activeIndex - 1,
      Home: 0,
      End: last,
    };

    if (!(event.key in next)) return;
    event.preventDefault();
    onSelect(next[event.key]);
  };

  return (
    <div className={`${BAR_CLASS}__list`} role="tablist" onKeyDown={onKeyDown}>
      {titles.map((title, index) => (
        <button
          key={tabIds[index]}
          id={tabIds[index]}
          type="button"
          role="tab"
          className="content-tabs-tab"
          aria-selected={index === activeIndex}
          aria-controls={panelIds[index]}
          tabIndex={index === activeIndex ? 0 : -1}
          onClick={() => onSelect(index)}
        >
          {tabLabel(title, index)}
        </button>
      ))}
    </div>
  );
}
