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

import React from "react";
import ReactDOM from "react-dom/client";
import { flushSync } from "react-dom";

import { DocumentWatch, observeDocument, whenPageReady } from "@shared/dom";

import { markEditorGroups } from "./editor-view";
import { COLUMN_SELECTOR, SECTION_SELECTOR, TabGroup, scanAll } from "./section-scan";
import { ensureStyles } from "./styles";
import { onTabsChanged, registeredTabs, titleOf } from "./tab-registry";
import { isTransformed, transformGroup } from "./tabs-transform";
import { TabsBar } from "./tabs-view";

/**
 * The editor keeps its own state in this attribute. Nothing on a published
 * page carries it, which makes it a reliable way to tell the two apart —
 * and it needs no cooperation from the host.
 */
export const EDITOR_MARKER_SELECTOR = "[data-react-values]";

export const isEditorContext = (doc: Document = document): boolean =>
  doc.querySelector(EDITOR_MARKER_SELECTOR) !== null;

/** Which tab a group showed, so a rebuild can restore it. */
const chosen = new WeakMap<HTMLElement, number>();

let nextId = 0;

/**
 * Stable per-element numbers, so a layout can be written down as a string.
 *
 * A `WeakMap` rather than an attribute: the page is the host's, and marking its
 * elements just to recognise them again would be a change the host can see.
 */
let nextElementNumber = 0;
const elementNumbers = new WeakMap<Element, number>();
const numberOf = (element: Element): number => {
  const existing = elementNumbers.get(element);
  if (existing !== undefined) return existing;
  const assigned = (nextElementNumber += 1);
  elementNumbers.set(element, assigned);
  return assigned;
};

/**
 * Everything the built tabs depend on, read without disturbing the page.
 *
 * Taken from the registry and the widgets' own surroundings rather than from a
 * scan, because a scan only tells the truth about an untransformed page and
 * reverting the page just to ask a question would defeat the purpose.
 *
 * This is what keeps the widget quiet on a live page. The host's own content
 * keeps changing inside the columns and every one of those changes reaches the
 * observer. Rebuilding on each would not merely be wasteful: moving the host's
 * columns makes the host re-render, which mutates the DOM, which starts the
 * next pass — the page would never settle.
 *
 * A column reordered while the tabs stand would not be noticed. That is an
 * editor action, and in the editor nothing is ever transformed.
 */
const signatureOf = (widgets: readonly HTMLElement[]): string =>
  widgets
    .map((widget) => {
      const column = widget.closest<HTMLElement>(COLUMN_SELECTOR);
      const section = widget.closest<HTMLElement>(SECTION_SELECTOR);
      return `${numberOf(widget)}@${column ? numberOf(column) : "-"}/${
        section ? numberOf(section) : "-"
      }="${titleOf(widget)}"`;
    })
    .join("|");

interface Mount {
  /** Whether what was built is still standing, untouched by the host. */
  intact(): boolean;
  dispose(): void;
}

const mountGroup = (group: TabGroup): Mount | null => {
  const mounted = transformGroup(group);
  if (mounted === null) return null;

  const key = group.members[0].widget;
  const prefix = `content-tabs-${(nextId += 1)}`;
  const tabIds = group.members.map((_, index) => `${prefix}-tab-${index}`);
  const panelIds = group.members.map((_, index) => `${prefix}-panel-${index}`);

  // Kept so the columns can be handed back exactly as they were found. A
  // column may well already carry an id the host relies on.
  const previousIds = group.members.map(({ column }) => column.getAttribute("id"));

  group.members.forEach(({ column }, index) => {
    column.id = panelIds[index];
    column.setAttribute("role", "tabpanel");
    column.setAttribute("aria-labelledby", tabIds[index]);
  });

  const root = ReactDOM.createRoot(mounted.bar);
  const start = Math.min(chosen.get(key) ?? 0, group.members.length - 1);

  const draw = (activeIndex: number): void => {
    chosen.set(key, activeIndex);
    mounted.setActive(activeIndex);
    flushSync(() => {
      root.render(
        <TabsBar
          titles={group.members.map(({ widget }) => titleOf(widget))}
          activeIndex={activeIndex}
          tabIds={tabIds}
          panelIds={panelIds}
          onSelect={(index) => {
            draw(index);
            // The strip is a single tab stop, so the newly selected tab has to
            // take the focus with it — otherwise keyboard users lose their place.
            queueMicrotask(() => document.getElementById(tabIds[index])?.focus());
          }}
        />,
      );
    });
  };

  draw(start);

  return {
    intact: (): boolean =>
      mounted.container.isConnected && group.members.every(({ column }) => isTransformed(column)),

    dispose: (): void => {
      // React must let go of the bar before the bar is removed along with the
      // container, or it unmounts into a node that is no longer there.
      flushSync(() => root.unmount());
      group.members.forEach(({ column }, index) => {
        column.removeAttribute("role");
        column.removeAttribute("aria-labelledby");
        const previous = previousIds[index];
        if (previous === null) column.removeAttribute("id");
        else column.setAttribute("id", previous);
      });
      mounted.revert();
    },
  };
};

/**
 * Turns every group of adjacent tab columns on the page into tabs, and keeps
 * doing so as the page changes.
 *
 * Each pass tears the previous one down completely and builds it again from
 * what the DOM says right now. Nothing positional is remembered between
 * passes: an author may reorder columns without any block noticing, so any
 * cached notion of "which column is the second tab" would be wrong sooner or
 * later. Only the chosen tab survives a rebuild, keyed by the block element
 * rather than by an index.
 *
 * @returns a function that undoes everything and stops watching.
 */
export function runContentTabs(): () => void {
  ensureStyles();
  const editor = isEditorContext();
  let mounts: Mount[] = [];
  let unmark: (() => void) | null = null;

  const teardown = (): void => {
    mounts.forEach((mount) => mount.dispose());
    mounts = [];
    unmark?.();
    unmark = null;
    applied = null;
  };

  // The layout the current mounts were built from, or null while nothing is
  // built. Compared against every fresh scan to decide whether to touch the
  // page at all.
  let applied: string | null = null;

  const sync = (): void => {
    const widgets = registeredTabs();
    const signature = signatureOf(widgets);

    // Same layout, and what was built is still standing: leave the page alone.
    // Rebuilding identical tabs would throw away the host's state inside the
    // columns and, on a page that keeps changing, would never stop.
    if (signature === applied && mounts.every((mount) => mount.intact())) return;

    // Only now, with the page back as the host left it, can it be read.
    teardown();
    const groups = scanAll(widgets);
    if (editor) unmark = markEditorGroups(groups);
    else mounts = groups.map(mountGroup).filter((mount): mount is Mount => mount !== null);
    applied = signature;
  };

  // The registry signals changes too, and a pass started from there would
  // rewrite the page outside the observer's guarded window and immediately
  // trigger itself. Routing every pass through `ignoring` closes that loop.
  let watch: DocumentWatch | null = null;
  const guarded = (): void => {
    if (watch === null) sync();
    else watch.ignoring(sync);
  };

  guarded();

  const stopWatchingTabs = onTabsChanged(guarded);
  watch = observeDocument(sync);

  return (): void => {
    stopWatchingTabs();
    watch?.stop();
    watch = null;
    teardown();
  };
}

/**
 * Starts the widget once the host has finished wiring up its own elements.
 *
 * @returns a function that stops everything. Calling it before the page-ready
 *   callback fires prevents the run from ever starting. Calling it after fires
 *   the teardown returned by `runContentTabs`. Safe to call more than once.
 */
export function startContentTabs(): () => void {
  let stop: (() => void) | null = null;
  let stopped = false;

  // `whenPageReady` returns a cancel handle; store it so we can abort before
  // the callback ever runs. Using this cancel handle is cleaner than inventing
  // our own flag because `whenPageReady` already owns that guard internally.
  const cancel = whenPageReady(() => {
    if (stopped) return;
    stop = runContentTabs();
  });

  return (): void => {
    if (stopped) return;
    stopped = true;
    cancel(); // prevents the callback if it has not fired yet
    stop?.(); // tears down if the callback already ran
  };
}
