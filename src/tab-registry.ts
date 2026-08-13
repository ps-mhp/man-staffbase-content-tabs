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

/**
 * Which `<content-tabs>` blocks are on the page, and what each is called.
 *
 * Deliberately *not* stored here: which section a block sits in, which column,
 * in what order, or which blocks are neighbours. An author can reorder columns
 * without any block re-registering, so a stored position would go quietly stale.
 * Everything positional is derived from the live DOM on each pass — see
 * `section-scan.ts`.
 *
 * Module-scoped rather than on `window`: every `<content-tabs>` comes from this
 * one bundle, so there is no bundle boundary to bridge. (The translation
 * registry is on `window` precisely because there is one.)
 */
const titles = new Map<HTMLElement, string | null>();
const listeners = new Set<() => void>();

let notifyScheduled = false;

/**
 * Coalesces a burst into one notification. On page load every block registers
 * within the same tick, and each one alone would trigger a full rescan.
 */
const scheduleNotify = (): void => {
  if (notifyScheduled) return;
  notifyScheduled = true;
  void Promise.resolve().then(() => {
    notifyScheduled = false;
    const snapshot = [...listeners];
    snapshot.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error("[tab-registry] listener threw", error);
      }
    });
  });
};

export function registerTab(element: HTMLElement, title: string | null): () => void {
  titles.set(element, title);
  scheduleNotify();
  return () => {
    titles.delete(element);
    scheduleNotify();
  };
}

export function setTabTitle(element: HTMLElement, title: string | null): void {
  if (!titles.has(element) || titles.get(element) === title) return;
  titles.set(element, title);
  scheduleNotify();
}

export function titleOf(element: HTMLElement): string | null {
  return titles.get(element) ?? null;
}

export function registeredTabs(): readonly HTMLElement[] {
  return [...titles.keys()];
}

export function onTabsChanged(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Test seam: drops all state so cases cannot leak into one another. */
export function clearTabsForTests(): void {
  titles.clear();
  listeners.clear();
  notifyScheduled = false;
}
