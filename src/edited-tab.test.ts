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

import {
  describeEditedTab,
  locateEditedTab,
  pointedTab,
  sectionTabsOf,
  tabAt,
  trackPointedTab,
} from "./edited-tab";
import { clearTabsForTests, registerTab } from "./tab-registry";

/**
 * Ein Abschnitt wie im Studio: Spalten als direkte Kinder, in manchen ein
 * Block. Je Spalte: ein Text ist der Titel ihres Blocks, `null` ein Block
 * ohne Titel, `false` eine Spalte ohne Block.
 */
function buildSection(titles: readonly (string | null | false)[]): { section: HTMLElement; widgets: HTMLElement[] } {
  const section = document.createElement("div");
  section.className = "ui-commons__section__wrapper";
  const widgets: HTMLElement[] = [];
  for (const title of titles) {
    const column = document.createElement("div");
    column.className = "ui-commons__section__column column-25";
    if (title !== false) {
      const widget = document.createElement("content-tabs");
      // Wie im Inhalt der Spalte: der Block steht nicht allein darin.
      const content = document.createElement("p");
      content.textContent = "Inhalt";
      column.append(widget, content);
      registerTab(widget, title);
      widgets.push(widget);
    }
    section.appendChild(column);
  }
  document.body.appendChild(section);
  return { section, widgets };
}

/** Ein Klick, wie ihn der Editor sieht: von innen nach außen, durch Shadow Roots hindurch. */
function pointerDown(target: Element): void {
  target.dispatchEvent(new Event("pointerdown", { bubbles: true, composed: true }));
}

let stopTracking: (() => void) | null = null;

afterEach(() => {
  stopTracking?.();
  stopTracking = null;
  clearTabsForTests();
  document.body.innerHTML = "";
});

describe("tabAt", () => {
  it("findet den Block der Spalte, in die geklickt wurde", () => {
    const { section, widgets } = buildSection(["A", "B"]);
    const content = section.children[1].querySelector("p")!;

    expect(tabAt([content, section.children[1], section, document.body], widgets)).toBe(widgets[1]);
  });

  it("findet keinen, wenn der Klick neben allen Tab-Spalten lag", () => {
    const { section, widgets } = buildSection(["A", false]);

    expect(tabAt([section.children[1], section], widgets)).toBeNull();
    expect(tabAt([section], [])).toBeNull();
  });
});

describe("trackPointedTab", () => {
  it("merkt sich den Tab der zuletzt angeklickten Spalte", () => {
    const { section, widgets } = buildSection(["A", "B", "C"]);
    stopTracking = trackPointedTab(document);

    pointerDown(section.children[2].querySelector("p")!);
    expect(pointedTab()).toBe(widgets[2]);

    pointerDown(widgets[0]);
    expect(pointedTab()).toBe(widgets[0]);
  });

  it("vergisst nichts bei einem Klick außerhalb – der Knopf zum Dialog liegt oft daneben", () => {
    const { section, widgets } = buildSection(["A", "B"]);
    stopTracking = trackPointedTab(document);

    pointerDown(section.children[1]);
    pointerDown(document.body);

    expect(pointedTab()).toBe(widgets[1]);
  });

  it("sieht durch einen Shadow Root hindurch", () => {
    const { section, widgets } = buildSection(["A", "B"]);
    const host = document.createElement("div");
    section.children[0].appendChild(host);
    const inner = document.createElement("span");
    host.attachShadow({ mode: "open" }).appendChild(inner);
    stopTracking = trackPointedTab(document);

    pointerDown(inner);

    expect(pointedTab()).toBe(widgets[0]);
  });

  it("nennt einen abgemeldeten Block nicht mehr und vergisst beim Aufhören", () => {
    const { section, widgets } = buildSection(["A", "B"]);
    stopTracking = trackPointedTab(document);
    pointerDown(section.children[0]);

    expect(pointedTab(widgets.slice(1))).toBeNull();

    stopTracking();
    stopTracking = null;
    expect(pointedTab()).toBeNull();
  });
});

describe("locateEditedTab", () => {
  it("nimmt den einzigen Block mit diesem Titel", () => {
    const { widgets } = buildSection(["Überblick", "Termine", "Kontakt"]);

    expect(locateEditedTab("Termine", widgets, null)).toBe(widgets[1]);
    expect(locateEditedTab("  Termine ", widgets, null)).toBe(widgets[1]);
  });

  it("entscheidet bei gleichen Titeln nach dem angeklickten Block", () => {
    const { widgets } = buildSection([null, null, null]);

    expect(locateEditedTab("", widgets, widgets[2])).toBe(widgets[2]);
  });

  it("gibt bei gleichen Titeln ohne Klick keinen Block aus", () => {
    const { widgets } = buildSection([null, null]);

    expect(locateEditedTab("", widgets, null)).toBeNull();
  });

  it("lässt den Titel gewinnen, wenn der Klick einem anderen Block galt", () => {
    const { widgets } = buildSection(["Überblick", "Termine"]);

    expect(locateEditedTab("Termine", widgets, widgets[0])).toBe(widgets[1]);
  });

  it("folgt dem Klick, wenn kein Block den Titel trägt – etwa einen noch nicht gespeicherten", () => {
    const { widgets } = buildSection(["Überblick", "Termine"]);

    expect(locateEditedTab("Neu", widgets, widgets[1])).toBe(widgets[1]);
    expect(locateEditedTab("Neu", widgets, null)).toBeNull();
  });
});

describe("sectionTabsOf", () => {
  it("nennt die Tabs der Leiste mit ihrer Spalte und den bearbeiteten", () => {
    const { widgets } = buildSection(["Überblick", "Termine", null, "Kontakt"]);

    expect(sectionTabsOf(widgets[1], widgets)).toEqual({
      tabs: [
        { title: "Überblick", column: 1 },
        { title: "Termine", column: 2 },
        { title: null, column: 3 },
        { title: "Kontakt", column: 4 },
      ],
      current: 1,
    });
  });

  it("zählt nur die benachbarten Tab-Spalten zur Leiste, die Spaltennummer aber im ganzen Abschnitt", () => {
    const { widgets } = buildSection(["A", false, "B", "C"]);

    expect(sectionTabsOf(widgets[2], widgets)).toEqual({
      tabs: [
        { title: "B", column: 3 },
        { title: "C", column: 4 },
      ],
      current: 1,
    });
  });

  it("gibt nichts für einen Block außerhalb eines Abschnitts", () => {
    const loose = document.createElement("content-tabs");
    document.body.appendChild(loose);
    registerTab(loose, "Allein");

    expect(sectionTabsOf(loose, [loose])).toBeNull();
  });
});

describe("describeEditedTab", () => {
  it("verbindet Erkennen und Leiste über die angemeldeten Blöcke", () => {
    buildSection(["Überblick", "Termine"]);

    expect(describeEditedTab("Termine")).toEqual({
      kind: "section",
      section: {
        tabs: [
          { title: "Überblick", column: 1 },
          { title: "Termine", column: 2 },
        ],
        current: 1,
      },
    });
  });

  it("meldet einen erkannten Block, der in keiner Spalte steht und so kein Tab wird", () => {
    const loose = document.createElement("content-tabs");
    document.body.appendChild(loose);
    registerTab(loose, "Allein");

    expect(describeEditedTab("Allein")).toEqual({ kind: "loose" });
  });

  it("sagt „unbekannt“, statt zu raten, wenn sich der Block nicht bestimmen lässt", () => {
    buildSection(["Überblick", "Termine"]);

    expect(describeEditedTab("Unbekannt")).toEqual({ kind: "unknown" });
  });
});
