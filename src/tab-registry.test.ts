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

import {
  clearTabsForTests,
  onTabsChanged,
  registerTab,
  registeredTabs,
  setTabTitle,
  titleOf,
} from "./tab-registry";

const el = (): HTMLElement => document.createElement("content-tabs");

describe("tab registry", () => {
  afterEach(() => clearTabsForTests());

  it("keeps a registered element and its title", () => {
    const a = el();

    registerTab(a, "Übersicht");

    expect(registeredTabs()).toEqual([a]);
    expect(titleOf(a)).toBe("Übersicht");
  });

  it("forgets an element that unregistered", () => {
    const a = el();
    const off = registerTab(a, "Übersicht");

    off();

    expect(registeredTabs()).toEqual([]);
    expect(titleOf(a)).toBeNull();
  });

  it("updates a title without re-registering", () => {
    const a = el();
    registerTab(a, null);

    setTabTitle(a, "Details");

    expect(titleOf(a)).toBe("Details");
  });

  it("notifies listeners once for a burst of registrations", async () => {
    const listener = jest.fn();
    onTabsChanged(listener);

    registerTab(el(), "a");
    registerTab(el(), "b");
    registerTab(el(), "c");

    expect(listener).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("notifies again for a later change", async () => {
    const listener = jest.fn();
    const a = el();
    registerTab(a, "a");
    await Promise.resolve();
    onTabsChanged(listener);

    setTabTitle(a, "b");
    await Promise.resolve();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stops notifying a listener that unsubscribed", async () => {
    const listener = jest.fn();
    const off = onTabsChanged(listener);
    off();

    registerTab(el(), "a");
    await Promise.resolve();

    expect(listener).not.toHaveBeenCalled();
  });
});
