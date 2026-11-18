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
 * Was das Fenster „Tab benennen“ über die Leiste anzeigt: die Tabs des
 * Abschnitts für die Seitenleiste und die kleine Vorschau, die Überschrift
 * „Tab 2 von 4“ und die Hinweise. Nur gerechnet, nichts gezeichnet – damit
 * Seitenleiste, Vorschau und Überschrift dieselben Namen und Nummern nennen.
 *
 * Der bearbeitete Tab zeigt den Entwurf, die übrigen ihren gespeicherten
 * Titel; ein fehlender Titel heißt wie auf der Seite „Tab 3“ (`tabLabel`).
 */

import type { EditedTab } from "./edited-tab";
import { serializeTitle } from "./tab-title";
import { tabLabel } from "./tabs-view";

/** Ein Tab, wie Seitenleiste und Vorschau ihn zeigen. */
export interface TabEntry {
  /** Was auf dem Reiter steht: der Titel oder ersatzweise „Tab 3“. */
  readonly label: string;
  /** Ob der Titel fehlt; dann ist `label` der Ersatz. */
  readonly untitled: boolean;
  /** Die Spalte im Abschnitt, ab 1; `null`, wo der Abschnitt nicht bekannt ist. */
  readonly column: number | null;
  /** Der Tab, dessen Titel das Fenster bearbeitet. */
  readonly current: boolean;
}

/** Überschrift der Hauptfläche und die Zeile daneben. */
export interface TabHeading {
  readonly title: string;
  readonly kicker: string;
}

/** Ersatz ohne bekannte Stelle: eine Nummer wäre geraten. */
const UNTITLED = "Ohne Titel";

/** Ein Titel ohne Ränder, `null` wenn leer – wie die Seite ihn liest. */
const titleOrNull = (title: string | null): string | null => {
  const trimmed = serializeTitle(title ?? "");
  return trimmed === "" ? null : trimmed;
};

/** Die Tabs der Leiste, der bearbeitete mit dem Entwurf als Titel. */
export function tabEntries(edited: EditedTab, draft: string): TabEntry[] {
  const draftTitle = titleOrNull(draft);
  if (edited.kind !== "section") {
    return [{ label: draftTitle ?? UNTITLED, untitled: draftTitle === null, column: null, current: true }];
  }
  const { tabs, current } = edited.section;
  return tabs.map((tab, index) => {
    const title = index === current ? draftTitle : titleOrNull(tab.title);
    return { label: tabLabel(title, index), untitled: title === null, column: tab.column, current: index === current };
  });
}

/** Die Unterzeile in der Seitenleiste: „Spalte 2 · dieser Tab“. */
export function entryDescription(entry: TabEntry): string {
  const parts: string[] = [];
  if (entry.column !== null) parts.push(`Spalte ${entry.column}`);
  if (entry.current) parts.push("dieser Tab");
  else if (entry.untitled) parts.push("noch ohne Titel");
  return parts.join(" · ");
}

/** „Tab 2 von 4“ über dem Formular – oder warum es keine Nummer gibt. */
export function headingOf(edited: EditedTab): TabHeading {
  switch (edited.kind) {
    case "section": {
      const { tabs, current } = edited.section;
      return { title: `Tab ${current + 1} von ${tabs.length}`, kicker: `Spalte ${tabs[current].column} des Abschnitts` };
    }
    case "loose":
      return { title: "Dieser Tab", kicker: "Steht in keiner Spalte eines Abschnitts" };
    default:
      return { title: "Dieser Tab", kicker: "Abschnitt nicht erkannt" };
  }
}

/** Was unter dem Feld steht, solange es leer ist. */
export function emptyTitleHint(edited: EditedTab): string {
  if (edited.kind !== "section") return "Ohne Titel zeigt die Seite ersatzweise „Tab“ mit der Nummer des Tabs.";
  return `Ohne Titel zeigt die Seite „${tabLabel(null, edited.section.current)}“.`;
}

/** Die kleine Vorschau als Satz: Sie ist ein Bild, Screenreader lesen nur diesen Text. */
export function stripLabel(entries: readonly TabEntry[]): string {
  const labels = entries.map((entry) => (entry.current ? `${entry.label} (dieser Tab)` : entry.label));
  return `Vorschau der Tab-Leiste: ${labels.join(", ")}`;
}
