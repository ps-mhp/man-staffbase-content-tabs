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
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TabsBar, tabLabel } from "./tabs-view";

const setup = (titles: readonly (string | null)[], activeIndex = 0) => {
  const onSelect = jest.fn();
  render(
    <TabsBar
      titles={titles}
      activeIndex={activeIndex}
      panelIds={titles.map((_, index) => `panel-${index}`)}
      tabIds={titles.map((_, index) => `tab-${index}`)}
      onSelect={onSelect}
    />,
  );
  return { onSelect };
};

describe("tabLabel", () => {
  it("uses the configured title", () => {
    expect(tabLabel("Übersicht", 0)).toBe("Übersicht");
  });

  it("falls back to a numbered label while a title is missing", () => {
    expect(tabLabel(null, 0)).toBe("Tab 1");
    expect(tabLabel("   ", 2)).toBe("Tab 3");
    expect(tabLabel("", 1)).toBe("Tab 2");
  });
});

describe("TabsBar", () => {
  it("renders one tab per title inside a tablist", () => {
    setup(["Übersicht", "Details"]);

    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tab", { name: "Übersicht" })).toBeInTheDocument();
  });

  it("marks only the active tab as selected", () => {
    setup(["Übersicht", "Details"], 1);

    expect(screen.getByRole("tab", { name: "Übersicht" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute("aria-selected", "true");
  });

  it("points each tab at its panel", () => {
    setup(["Übersicht", "Details"]);

    expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute("aria-controls", "panel-1");
  });

  it("keeps only the active tab in the tab order", () => {
    setup(["Übersicht", "Details"], 1);

    expect(screen.getByRole("tab", { name: "Übersicht" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute("tabindex", "0");
  });

  it("reports a click", async () => {
    const { onSelect } = setup(["Übersicht", "Details"]);

    await userEvent.click(screen.getByRole("tab", { name: "Details" }));

    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("moves with the arrow keys and wraps around", async () => {
    const { onSelect } = setup(["A", "B", "C"], 0);
    screen.getByRole("tab", { name: "A" }).focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(onSelect).toHaveBeenLastCalledWith(1);

    await userEvent.keyboard("{ArrowLeft}");
    expect(onSelect).toHaveBeenLastCalledWith(2);
  });

  it("jumps to the first and last tab", async () => {
    const { onSelect } = setup(["A", "B", "C"], 1);
    screen.getByRole("tab", { name: "B" }).focus();

    await userEvent.keyboard("{End}");
    expect(onSelect).toHaveBeenLastCalledWith(2);

    await userEvent.keyboard("{Home}");
    expect(onSelect).toHaveBeenLastCalledWith(0);
  });

  it("renders nothing when titles is empty and ignores keyboard events", () => {
    const onSelect = jest.fn();
    render(
      <TabsBar titles={[]} activeIndex={0} panelIds={[]} tabIds={[]} onSelect={onSelect} />,
    );

    expect(screen.queryAllByRole("tab")).toHaveLength(0);

    // fireEvent is used here intentionally: the tablist has no tabIndex, so
    // jsdom never moves focus to it and userEvent key events land on body.
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "End" });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders nothing when array lengths are mismatched and emits no console errors", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const onSelect = jest.fn();
    try {
      render(
        <TabsBar
          titles={["A", "B", "C"]}
          activeIndex={0}
          panelIds={["panel-0", "panel-1"]}
          tabIds={["tab-0", "tab-1", "tab-2"]}
          onSelect={onSelect}
        />,
      );

      expect(screen.queryAllByRole("tab")).toHaveLength(0);
      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });
});
