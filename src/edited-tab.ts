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
 * Welcher Tab gerade bearbeitet wird – und mit welchen Tabs er eine Leiste
 * bildet. Daraus zeigt das Fenster „Tab benennen“ links die Tabs des
 * Abschnitts und oben „Tab 2 von 4“.
 *
 * Der Dialog von Staffbase sagt nicht, zu welchem Block er gehört; sein Feld
 * trägt nur den Titel. Zwei Spuren führen zum Block:
 *
 * 1. Der Titel im Feld, verglichen mit den angemeldeten Blöcken – eindeutig,
 *    solange kein anderer Tab genauso heißt.
 * 2. Die Spalte, in die zuletzt geklickt wurde: Wer einen Block einstellt,
 *    hat ihn vorher angeklickt. Sie entscheidet, wo der Titel mehrdeutig ist
 *    – frisch eingefügte Blöcke heißen alle noch nichts –, und sie hält die
 *    Spur, wenn der Titel im Feld schon ein neuer ist.
 *
 * Widersprechen sich beide, gilt der Titel; ist er mehrdeutig, gilt keiner.
 * Lieber „nicht zu erkennen“ als der falsche Tab markiert.
 *
 * Nur gelesen: Hier wird nichts an der Seite verändert.
 */

import { COLUMN_SELECTOR, anchorOf, columnsOf, scanAll } from "./section-scan";
import { registeredTabs, titleOf } from "./tab-registry";

/** Ein Tab der Leiste, wie das Fenster ihn zeigt. */
export interface SectionTab {
  /** Der gespeicherte Titel; `null`, solange er fehlt. */
  readonly title: string | null;
  /** Die Spalte im Abschnitt, ab 1 gezählt. */
  readonly column: number;
}

/** Die Leiste, zu der der bearbeitete Tab gehört. */
export interface SectionTabs {
  readonly tabs: readonly SectionTab[];
  /** Position des bearbeiteten Tabs in `tabs`. */
  readonly current: number;
}

/** Wo ein Block steht: seine Spalte, ohne Spalte er selbst. */
const columnOf = (widget: HTMLElement): HTMLElement => {
  const anchor = anchorOf(widget);
  return anchor.closest<HTMLElement>(COLUMN_SELECTOR) ?? anchor;
};

/**
 * Der Block, in dessen Spalte ein Ereignis mit diesem Pfad fiel.
 *
 * Über `composedPath`, weil der Content Designer die Seite – und je Block
 * noch einmal den Block – in Shadow Roots rendert; der Pfad führt durch
 * beide hindurch. Er beginnt innen: Liegt eine Tab-Spalte in einer anderen,
 * gewinnt die innere. Liegen zwei Blöcke in einer Spalte, zählt der erste –
 * wie beim Bauen der Leiste (`scanSection`).
 */
export function tabAt(path: readonly EventTarget[], widgets: readonly HTMLElement[]): HTMLElement | null {
  if (widgets.length === 0) return null;
  const byColumn = new Map<EventTarget, HTMLElement>();
  for (const widget of widgets) {
    const column = columnOf(widget);
    if (!byColumn.has(column)) byColumn.set(column, widget);
  }
  for (const node of path) {
    const widget = byColumn.get(node);
    if (widget !== undefined) return widget;
  }
  return null;
}

let lastPointed: HTMLElement | null = null;

/** Der Block, in dessen Spalte zuletzt geklickt wurde – solange er noch angemeldet ist. */
export function pointedTab(widgets: readonly HTMLElement[] = registeredTabs()): HTMLElement | null {
  return lastPointed !== null && widgets.includes(lastPointed) ? lastPointed : null;
}

/**
 * Merkt sich die Tab-Spalte jedes Klicks.
 *
 * In der Capture-Phase und passiv: Der Klick geht ungestört weiter, auch
 * wenn der Editor ihn unterwegs anhält. Ein Klick außerhalb aller
 * Tab-Spalten vergisst nichts – der Knopf, der den Dialog öffnet, liegt oft
 * neben dem Block.
 *
 * @param target wo gelauscht wird; das Dokument, in Tests ein Container.
 * @returns eine Funktion, die aufhört und das Gemerkte vergisst.
 */
export function trackPointedTab(target: Document | HTMLElement = document): () => void {
  const onPointerDown = (event: Event): void => {
    const hit = tabAt(event.composedPath(), registeredTabs());
    if (hit !== null) lastPointed = hit;
  };
  target.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });
  return () => {
    target.removeEventListener("pointerdown", onPointerDown, { capture: true });
    lastPointed = null;
  };
}

/**
 * Der Block, dessen Dialog offen ist; `null`, wenn er sich nicht sicher
 * bestimmen lässt. Regeln siehe Kopf der Datei.
 *
 * @param title der Titel im Feld des Dialogs, beim Öffnen des Fensters.
 */
export function locateEditedTab(
  title: string,
  widgets: readonly HTMLElement[] = registeredTabs(),
  pointed: HTMLElement | null = pointedTab(widgets),
): HTMLElement | null {
  const wanted = title.trim();
  const candidates = widgets.filter((widget) => (titleOf(widget) ?? "") === wanted);
  if (pointed !== null && widgets.includes(pointed) && (candidates.length === 0 || candidates.includes(pointed))) {
    return pointed;
  }
  return candidates.length === 1 ? candidates[0] : null;
}

/**
 * Die Leiste, zu der `widget` gehört: die benachbarten Tab-Spalten seines
 * Abschnitts, genau wie die Seite sie baut (`scanAll`). `null`, wenn der
 * Block in keiner Spalte eines Abschnitts steht und so auch kein Tab wird.
 */
export function sectionTabsOf(
  widget: HTMLElement,
  widgets: readonly HTMLElement[] = registeredTabs(),
): SectionTabs | null {
  const group = scanAll(widgets).find(({ members }) => members.some((member) => member.widget === widget));
  if (group === undefined) return null;
  const columns = columnsOf(group.section);
  return {
    tabs: group.members.map((member) => ({
      title: titleOf(member.widget),
      column: columns.indexOf(member.column) + 1,
    })),
    current: group.members.findIndex((member) => member.widget === widget),
  };
}

/**
 * Was das Fenster beim Öffnen über den bearbeiteten Tab weiß:
 *
 * - `section`: der Block und seine Leiste sind bekannt;
 * - `loose`: der Block ist erkannt, steht aber in keiner Spalte eines
 *   Abschnitts – auf der Seite wird aus ihm kein Tab;
 * - `unknown`: der Block lässt sich nicht sicher bestimmen.
 */
export type EditedTab =
  | { readonly kind: "section"; readonly section: SectionTabs }
  | { readonly kind: "loose" }
  | { readonly kind: "unknown" };

/** Beides zusammen, so wie das Fenster beim Öffnen fragt. */
export function describeEditedTab(
  title: string,
  widgets: readonly HTMLElement[] = registeredTabs(),
  pointed: HTMLElement | null = pointedTab(widgets),
): EditedTab {
  const widget = locateEditedTab(title, widgets, pointed);
  if (widget === null) return { kind: "unknown" };
  const section = sectionTabsOf(widget, widgets);
  return section === null ? { kind: "loose" } : { kind: "section", section };
}
