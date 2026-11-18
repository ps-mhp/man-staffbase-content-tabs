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
 * Legt das Fenster „Tab benennen“ vor das Feld `tab-title` des
 * Staffbase-Dialogs – im gemeinsamen Vollbild-Rahmen von `@man/config-ui`.
 *
 * Kein neues Attribut: Das Fenster liest und schreibt genau das Feld, das
 * bisher im Dialog stand. Alte Blöcke rendern deshalb unverändert, und wer
 * öffnet und ohne Änderung schließt, schreibt nichts – „Übernehmen“ bleibt
 * gesperrt, solange `serializeTitle` dasselbe ergibt wie beim Öffnen. Das
 * gilt auch für einen übersetzten Titel im `b64:`-Umschlag: Er steht im
 * Fenster als Klartext und bleibt im Feld, wie er ist, bis jemand tippt.
 *
 * Keine Prüfung: Ein leerer Titel ist erlaubt, die Seite zeigt dann
 * „Tab 2“ – wie bisher.
 */

import * as React from "react";
import { PanelTop } from "lucide-react";

import { FieldModalShellOptions, startFieldModalInjector } from "@shared/config-modal";
import { TAB_TITLE_ATTRIBUTE, parseTitleField, serializeTitle, titleChangesStatus } from "./tab-title";

/**
 * Der Editor kommt erst, wenn ein Dialog ihn zeigt: Er baut auf
 * `@man/config-ui` (Radix, react-aria, Tailwind), nichts davon gehört ins
 * Seitenbündel, das jede Leserin lädt. Hier bleibt nur, was der Rahmen
 * braucht, bevor der Editor da ist: Name, Icon, Status.
 */
const loadEditor = () => import("./tab-title-editor");

const LazyTabTitleEditor = React.lazy(() => loadEditor().then((module) => ({ default: module.TabTitleEditor })));

/** Die Hilfe aus demselben Teil wie der Editor. */
const LazyTabTitleHelp = React.lazy(() => loadEditor().then((module) => ({ default: module.TabTitleHelp })));

const LOADING = React.createElement("p", { className: "p-6 text-sm text-muted-foreground" }, "Editor wird geladen …");

const TITLE = "Tab benennen";

/** Was der gemeinsame Rahmen vom Widget wissen muss. Offengelegt für Tests. */
export const tabTitleShell: FieldModalShellOptions<string> = {
  widgetName: "Content-Tabs",
  title: TITLE,
  icon: PanelTop,
  help: React.createElement(React.Suspense, { fallback: null }, React.createElement(LazyTabTitleHelp)),
  statusText: titleChangesStatus,
};

/**
 * Beobachtet die Seite auf den Dialog des Widgets und legt das Fenster vor
 * sein Feld.
 *
 * @param root der beobachtete Teilbaum; das Dokument, in Tests ein Container.
 * @returns eine Funktion, die aufhört zu beobachten und das Fenster abbaut.
 */
export function startTabTitleInjector(root: ParentNode = document): () => void {
  return startFieldModalInjector<string>({
    fieldKey: TAB_TITLE_ATTRIBUTE,
    root,
    reopenLabel: TITLE,
    modalTestId: "tab-title-modal",
    reopenTestId: "tab-title-reopen",
    parse: parseTitleField,
    serialize: serializeTitle,
    shell: tabTitleShell,
    render: ({ value, onChange }) =>
      React.createElement(React.Suspense, { fallback: LOADING }, React.createElement(LazyTabTitleEditor, { value, onChange })),
  });
}
