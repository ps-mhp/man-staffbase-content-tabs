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

import { act, waitFor } from "@testing-library/react";
import { installDevHarness } from "dev/bootstrap";
import { configurationSchema, uiSchema } from "./configuration-schema";
import {
  registeredTabs,
  titleOf,
  onTabsChanged,
  clearTabsForTests,
} from "./tab-registry";

// TAB_TITLE_ATTRIBUTE must come from a dynamic import so that the static
// module-level guard in index.tsx (`if (window.defineBlock === "function")`)
// doesn't fire before the harness installs window.defineBlock.
let TAB_TITLE_ATTRIBUTE: string;

// Install the dev harness once before the module is loaded so that
// window.defineBlock exists when the widget calls it at module-evaluation time.
beforeAll(async () => {
  document.body.innerHTML = `<div id="preview"></div><div id="config"></div>`;
  // Install the dev harness directly (not inside act), matching the table-widget
  // idiom. The Config form's async state updates must settle before any test runs.
  installDevHarness({ configurationSchema, uiSchema });
  // Wrap the import in act so that window.defineBlock's root.render() call —
  // which happens synchronously during module evaluation — fires inside an
  // active act() scope and does not produce "not wrapped in act" warnings.
  let mod: typeof import("./index");
  await act(async () => {
    mod = await import("./index");
  });
  TAB_TITLE_ATTRIBUTE = mod!.TAB_TITLE_ATTRIBUTE;
  // Let rjsf Form's async effects (from @rjsf/mui) settle before tests start.
  await waitFor(() => {
    expect(document.querySelector("form")).not.toBeNull();
  });
  await act(async () => {});
});

beforeEach(() => {
  clearTabsForTests();
});

afterEach(async () => {
  // Wrap remove() in act so React processes the unmount state update cleanly.
  await act(async () => {
    document.querySelectorAll("content-tabs").forEach((el) => el.remove());
    await Promise.resolve();
  });
  clearTabsForTests();
});

// Helper: mount an element with a title; sets the attribute and appends
// inside act so attributeChangedCallback + connectedCallback both fire
// within React's test environment.
async function mount(el: HTMLElement, title: string): Promise<void> {
  await act(async () => {
    el.setAttribute(TAB_TITLE_ATTRIBUTE, title);
    document.body.appendChild(el);
  });
  await waitFor(() => { expect(registeredTabs()).toContain(el); });
}

// Helper: remove an element; waits for the registry to reflect the removal.
async function unmount(el: HTMLElement): Promise<void> {
  await act(async () => { el.remove(); });
  await waitFor(() => { expect(registeredTabs()).not.toContain(el); });
}

// Helper: flush the coalesced notification microtask.
async function flushMicrotasks(): Promise<void> {
  await act(async () => { await Promise.resolve(); });
}

function makeElement(): HTMLElement {
  return document.createElement("content-tabs");
}

describe("ContentTabsBlock lifecycle", () => {
  it("shows a title the dialog saved under its schema key", async () => {
    // The host writes a configuration value under the schema key verbatim, and
    // the DOM lowercases the name. Reading it back under any other spelling is
    // how every tab ended up nameless on a published page.
    const [schemaKey] = Object.keys(configurationSchema.properties!);
    const el = makeElement();

    await act(async () => {
      el.setAttribute(schemaKey, "Übersicht");
      document.body.appendChild(el);
    });
    await waitFor(() => {
      expect(registeredTabs()).toContain(el);
    });

    expect(titleOf(el)).toBe("Übersicht");
  });

  it("still reads a title an earlier build saved as tab-title", async () => {
    const el = makeElement();

    await act(async () => {
      el.setAttribute("tab-title", "Alt gespeichert");
      document.body.appendChild(el);
    });
    await waitFor(() => {
      expect(registeredTabs()).toContain(el);
    });

    expect(titleOf(el)).toBe("Alt gespeichert");
  });

  it("registers the element with the correct title when appended to the document", async () => {
    const el = makeElement();
    await mount(el, "Übersicht");

    expect(registeredTabs()).toContain(el);
    expect(titleOf(el)).toBe("Übersicht");
  });

  it("updates the title in-place without re-registering (position is stable)", async () => {
    const first = makeElement();
    const second = makeElement();
    await mount(first, "Erster");
    await mount(second, "Zweiter");

    // Capture identity: the element reference that was registered first.
    const orderBefore = registeredTabs().slice();
    expect(orderBefore[0]).toBe(first);
    expect(orderBefore[1]).toBe(second);

    // Update title of the first tab — must not change its position.
    await act(async () => { first.setAttribute(TAB_TITLE_ATTRIBUTE, "Geändert"); });
    await flushMicrotasks();

    expect(titleOf(first)).toBe("Geändert");
    // Identity unchanged — same element object, same slot.
    const orderAfter = registeredTabs();
    expect(orderAfter[0]).toBe(first);
    expect(orderAfter[1]).toBe(second);
    // Only two entries total — no duplicate.
    expect(orderAfter.length).toBe(2);
  });

  it("fires the change listener on registration", async () => {
    const changed = jest.fn();
    const stop = onTabsChanged(changed);
    try {
      await mount(makeElement(), "Neuer Tab");
      expect(changed).toHaveBeenCalledTimes(1);
    } finally {
      stop();
    }
  });

  it("unregisters on teardown and leaves no stale entry", async () => {
    const el = makeElement();
    await mount(el, "Weggehend");

    expect(registeredTabs()).toContain(el);

    await unmount(el);

    expect(registeredTabs()).not.toContain(el);
  });

  it("register → teardown → register again is clean", async () => {
    const el = makeElement();
    await mount(el, "Wieder da");
    expect(registeredTabs()).toContain(el);

    await unmount(el);
    expect(registeredTabs()).not.toContain(el);

    await mount(el, "Wieder da");
    expect(registeredTabs()).toContain(el);
    expect(titleOf(el)).toBe("Wieder da");
    // Exactly one entry — no duplicate from the re-registration.
    expect(registeredTabs().filter((t) => t === el)).toHaveLength(1);
  });
});
