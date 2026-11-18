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

import type { EditedTab } from "./edited-tab";
import { emptyTitleHint, entryDescription, headingOf, stripLabel, tabEntries } from "./tab-overview";

/** Vier Tabs wie im Screen; bearbeitet wird der zweite. */
const SECTION: EditedTab = {
  kind: "section",
  section: {
    tabs: [
      { title: "Überblick", column: 1 },
      { title: "Termine", column: 2 },
      { title: null, column: 3 },
      { title: "Kontakt", column: 4 },
    ],
    current: 1,
  },
};

describe("tabEntries", () => {
  it("zeigt am bearbeiteten Tab den Entwurf, an den übrigen den gespeicherten Titel", () => {
    expect(tabEntries(SECTION, "Termine 2026")).toEqual([
      { label: "Überblick", untitled: false, column: 1, current: false },
      { label: "Termine 2026", untitled: false, column: 2, current: true },
      { label: "Tab 3", untitled: true, column: 3, current: false },
      { label: "Kontakt", untitled: false, column: 4, current: false },
    ]);
  });

  it("nimmt für einen leeren Entwurf den Ersatz der Seite, nach der Stelle in der Leiste", () => {
    const [, current] = tabEntries(SECTION, "   ");

    expect(current).toEqual({ label: "Tab 2", untitled: true, column: 2, current: true });
  });

  it("zeigt den Entwurf ohne Ränder, wie er gespeichert wird", () => {
    expect(tabEntries(SECTION, "  Termine ")[1].label).toBe("Termine");
  });

  it("kennt ohne Abschnitt nur den bearbeiteten Tab", () => {
    expect(tabEntries({ kind: "unknown" }, "Termine")).toEqual([
      { label: "Termine", untitled: false, column: null, current: true },
    ]);
    expect(tabEntries({ kind: "loose" }, "")).toEqual([
      { label: "Ohne Titel", untitled: true, column: null, current: true },
    ]);
  });
});

describe("entryDescription", () => {
  it("nennt die Spalte und markiert den bearbeiteten Tab", () => {
    const entries = tabEntries(SECTION, "Termine");

    expect(entries.map(entryDescription)).toEqual([
      "Spalte 1",
      "Spalte 2 · dieser Tab",
      "Spalte 3 · noch ohne Titel",
      "Spalte 4",
    ]);
  });

  it("kommt ohne bekannte Spalte aus", () => {
    expect(entryDescription({ label: "X", untitled: false, column: null, current: true })).toBe("dieser Tab");
  });
});

describe("headingOf", () => {
  it("zählt wie der Screen: „Tab 2 von 4“, darunter die Spalte", () => {
    expect(headingOf(SECTION)).toEqual({ title: "Tab 2 von 4", kicker: "Spalte 2 des Abschnitts" });
  });

  it("sagt, wenn der Block in keiner Spalte steht", () => {
    expect(headingOf({ kind: "loose" })).toEqual({
      title: "Dieser Tab",
      kicker: "Steht in keiner Spalte eines Abschnitts",
    });
  });

  it("sagt, wenn der Abschnitt nicht zu erkennen war", () => {
    expect(headingOf({ kind: "unknown" })).toEqual({ title: "Dieser Tab", kicker: "Abschnitt nicht erkannt" });
  });
});

describe("emptyTitleHint", () => {
  it("nennt den Ersatz, den die Seite zeigt", () => {
    expect(emptyTitleHint(SECTION)).toBe("Ohne Titel zeigt die Seite „Tab 2“.");
  });

  it("nennt ihn allgemein, wo die Stelle nicht bekannt ist", () => {
    expect(emptyTitleHint({ kind: "unknown" })).toBe(
      "Ohne Titel zeigt die Seite ersatzweise „Tab“ mit der Nummer des Tabs.",
    );
  });
});

describe("stripLabel", () => {
  it("liest die Leiste für Screenreader vor, den bearbeiteten Tab benannt", () => {
    expect(stripLabel(tabEntries(SECTION, "Termine"))).toBe(
      "Vorschau der Tab-Leiste: Überblick, Termine (dieser Tab), Tab 3, Kontakt",
    );
  });
});
