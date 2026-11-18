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
 * Das Fenster „Tab benennen“ im Rahmen von `@man/config-ui`, aufgebaut wie
 * der Screen: links die Tabs des Abschnitts zum Ablesen, in der Mitte
 * „Tab 2 von 4“, der Abschnitt „Inhalt“ mit dem Titel und „So erscheint die
 * Leiste“ mit der kleinen Vorschau. Kein Inspektor, kein Vorschau-Umschalter.
 *
 * Bearbeitet wird genau ein Wert, der Titel – derselbe, den bisher das Feld
 * des Staffbase-Dialogs trug. Kopf, Übernehmen, Rückgängig und Rückfrage
 * kommen vom Rahmen.
 *
 * Nur im Studio nachgeladen (`tab-title-injector.ts`); die Hilfe liegt im
 * selben Teil.
 */

import * as React from "react";
import { ConfigWorkspace } from "@man/config-ui/layout/config-workspace";
import { Field } from "@man/config-ui/form/field";
import { FormSection } from "@man/config-ui/form/form-section";
import { Input } from "@man/config-ui/primitives/input";

import { EditedTab, describeEditedTab } from "./edited-tab";
import { SectionTabsSidebar } from "./section-tabs-sidebar";
import { emptyTitleHint, headingOf, tabEntries } from "./tab-overview";
import { TabStripPreview } from "./tab-strip-preview";
import { serializeTitle } from "./tab-title";

export { TabTitleHelp } from "./tab-title-help";

export interface TabTitleEditorProps {
  /** Der Titel im Entwurf, so wie getippt. */
  value: string;
  onChange: (value: string) => void;
  /** Wo der Tab steht; einmal beim Öffnen gefragt. Offengelegt für Tests. */
  locate?: (title: string) => EditedTab;
}

const TITLE_HINT = "Steht als Reiter über dem Inhalt dieser Spalte. Kurz halten: ein bis zwei Wörter.";

const STRIP_HINT =
  "Die volle Leiste zeigt die Vorschau des Studios; im Editor bleiben die Spalten nebeneinander stehen. Dieses Widget hat keinen eigenen Vorschau-Umschalter.";

function Heading({ edited }: { edited: EditedTab }): React.ReactElement {
  const { title, kicker } = headingOf(edited);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <span className="text-[13px] text-muted-foreground">{kicker}</span>
    </div>
  );
}

export function TabTitleEditor({ value, onChange, locate = describeEditedTab }: TabTitleEditorProps): React.ReactElement {
  // Einmal beim Öffnen, mit dem Titel von da: Die Seite hinter dem Dialog
  // ändert sich nicht, solange er offen ist, und was jemand tippt, darf den
  // Tab nicht einem anderen Block zuordnen, der zufällig so heißt.
  const [edited] = React.useState(() => locate(value));
  const entries = tabEntries(edited, value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Das eine Feld des Fensters: Wer es öffnet, will tippen.
  React.useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const hint = serializeTitle(value) === "" ? `${TITLE_HINT} ${emptyTitleHint(edited)}` : TITLE_HINT;

  return (
    <ConfigWorkspace sidebar={<SectionTabsSidebar edited={edited} entries={entries} />}>
      <div className="px-10 pt-6 pb-12 max-lg:px-6">
        <div className="flex max-w-[720px] flex-col gap-8" data-testid="tab-title-editor">
          <Heading edited={edited} />
          <FormSection title="Inhalt">
            <Field label="Titel des Tabs" hint={hint}>
              <Input
                ref={inputRef}
                type="text"
                className="h-10"
                data-testid="tab-title-input"
                value={value}
                onChange={(event) => onChange(event.target.value)}
              />
            </Field>
          </FormSection>
          <FormSection title="So erscheint die Leiste">
            <TabStripPreview entries={entries} />
            <p className="text-[13px] text-muted-foreground">{STRIP_HINT}</p>
          </FormSection>
        </div>
      </div>
    </ConfigWorkspace>
  );
}
