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
 * Die Hilfe des Fensters „Tab benennen“ in der Leiste des Rahmens. Tasten
 * und den Satz zu „Übernehmen“ ergänzt der Rahmen selbst.
 *
 * Kommt mit dem Editor nachgeladen: Text gehört nicht ins Seitenbündel,
 * das jede Leserin lädt.
 */

import * as React from "react";

interface HelpEntry {
  readonly title: string;
  readonly text: string;
}

const ENTRIES: readonly HelpEntry[] = [
  {
    title: "Ein Tab = eine Spalte",
    text: "Jede Spalte eines Abschnitts, in der ein Content-Tabs-Block liegt, wird auf der Seite zu einem Tab. Sein Inhalt ist alles, was in derselben Spalte unter dem Block steht.",
  },
  {
    title: "Titel",
    text: "Er steht als Reiter über dem Inhalt. Kurz halten – die Reiter stehen in einer Zeile. Leer gelassen zeigt die Seite ersatzweise „Tab 1“, „Tab 2“ usw.",
  },
  {
    title: "Anzahl und Reihenfolge",
    text: "Sie folgen den Spalten von links nach rechts. Spalten fügen Sie im Studio am Abschnitt hinzu oder verschieben sie dort. Eine Spalte ohne Block dazwischen trennt zwei Leisten.",
  },
  {
    title: "Im Editor",
    text: "Die Spalten bleiben nebeneinander stehen, mit gestricheltem Rahmen um die Gruppe. Die Leiste selbst zeigen erst die Vorschau des Studios und die veröffentlichte Seite.",
  },
  {
    title: "Übersetzung",
    text: "Der Titel wird mit der Seite übersetzt. Bleibt eine Übersetzung leer, steht der ursprüngliche Titel da.",
  },
];

export function TabTitleHelp(): React.ReactElement {
  return (
    <dl className="flex flex-col gap-3" data-testid="tab-title-help">
      {ENTRIES.map((entry) => (
        <div key={entry.title}>
          <dt className="font-semibold text-foreground">{entry.title}</dt>
          <dd className="text-muted-foreground">{entry.text}</dd>
        </div>
      ))}
    </dl>
  );
}
