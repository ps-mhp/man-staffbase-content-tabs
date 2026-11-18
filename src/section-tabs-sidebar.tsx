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
 * Die Seitenleiste „Tabs im Abschnitt“: die Tabs der Leiste, zu der der
 * bearbeitete gehört – nummeriert, mit Spalte, der bearbeitete markiert.
 *
 * Nur zum Lesen. Anzahl und Reihenfolge sind die Spalten des Abschnitts;
 * die ändert das Studio, nicht dieses Fenster. Deshalb keine `ItemList`
 * (wählbar, sortierbar), sondern eine schlichte Liste in deren Zeilenmaß –
 * Auswahlfarbe und `aria-current` am bearbeiteten Tab.
 */

import * as React from "react";
import { Info, TriangleAlert } from "lucide-react";
import { Note } from "@man/config-ui/form/note";
import { SidebarFootnote } from "@man/config-ui/sidebar/sidebar-footnote";
import { SidebarPanel } from "@man/config-ui/sidebar/sidebar-panel";
import { cn } from "@man/config-ui/primitives/utils";

import type { EditedTab } from "./edited-tab";
import { TabEntry, entryDescription } from "./tab-overview";

export interface SectionTabsSidebarProps {
  edited: EditedTab;
  entries: readonly TabEntry[];
}

const TITLE = "Tabs im Abschnitt";

const FOOTER =
  "Die Tabs entstehen aus den Spalten dieses Abschnitts. Anzahl und Reihenfolge ändern Sie im Studio am Abschnitt.";

const LOOSE_NOTE =
  "Dieser Block steht in keiner Spalte eines Abschnitts und wird auf der Seite deshalb kein Tab. Legen Sie einen Abschnitt mit Spalten an und schieben Sie den Block in eine Spalte.";

const UNKNOWN_NOTE =
  "Welche Tabs zu diesem Abschnitt gehören, lässt sich hier nicht bestimmen – etwa weil ein anderer Tab genauso heißt. Der Titel wird trotzdem übernommen.";

function TabRow({ entry, number }: { entry: TabEntry; number: number }): React.ReactElement {
  return (
    <li
      aria-current={entry.current ? "true" : undefined}
      className={cn(
        "flex min-h-12 items-center gap-0.5 rounded-lg border border-transparent px-1 py-0.5",
        entry.current && "border-primary-soft-border bg-primary-soft",
      )}
    >
      {/* Platz des Griffs in sortierbaren Listen: so stehen die Nummern wie dort. */}
      <span className="w-6 shrink-0" aria-hidden />
      <span
        aria-hidden
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-[13px] font-bold text-secondary-foreground"
      >
        {number}
      </span>
      <span className="flex min-w-0 flex-1 flex-col pl-2.5">
        <span className="truncate text-sm font-semibold text-foreground">
          <span className="sr-only">{`Tab ${number}: `}</span>
          {entry.label}
        </span>
        <span className="truncate text-xs text-muted-foreground">{entryDescription(entry)}</span>
      </span>
    </li>
  );
}

export function SectionTabsSidebar({ edited, entries }: SectionTabsSidebarProps): React.ReactElement {
  const known = edited.kind === "section";
  return (
    <SidebarPanel
      title={TITLE}
      count={known ? entries.length : undefined}
      footer={
        <SidebarFootnote>
          <p>{FOOTER}</p>
        </SidebarFootnote>
      }
    >
      {known ? (
        <ul aria-label={`${TITLE}, nur lesen`} className="m-0 flex list-none flex-col gap-1 p-0">
          {entries.map((entry, index) => (
            <TabRow key={`${entry.column ?? "x"}-${index}`} entry={entry} number={index + 1} />
          ))}
        </ul>
      ) : (
        <Note
          icon={edited.kind === "loose" ? TriangleAlert : Info}
          tone={edited.kind === "loose" ? "warning" : "neutral"}
          className="mx-2"
        >
          {edited.kind === "loose" ? LOOSE_NOTE : UNKNOWN_NOTE}
        </Note>
      )}
    </SidebarPanel>
  );
}
