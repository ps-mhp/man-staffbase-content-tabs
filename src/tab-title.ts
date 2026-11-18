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
 * Der Titel des Tabs: wie er heißt, wie er gespeichert ist und wie das
 * Fenster „Tab benennen“ ihn liest und zurückschreibt.
 *
 * Eigenes Modul, weil Block (`index.tsx`) und Fenster
 * (`tab-title-injector.ts`) beide davon abhängen – über `index.tsx` liefe
 * das im Kreis.
 */

import { decodePayload, isPayload } from "@shared/payload";

/**
 * The one name the tab title goes by.
 *
 * Three places have to agree on it, and every one of them is load-bearing:
 * the key in the configuration schema, because the host saves a value under
 * its schema key verbatim; the attribute declared to the host, because it
 * drops an attribute it was never told about; and the name read back here.
 * They disagreed once — schema `tabTitle`, declared `tab-title` — and every
 * title fell on the floor between the dialog and the page, with nothing
 * anywhere to say so.
 *
 * It is also the attribute registered for this widget in the Staffbase
 * installation (see `widgets.json`), which is why the hyphenated spelling is
 * the one they all moved to: changing it would mean re-registering the widget.
 * Das Fenster „Tab benennen“ schreibt in genau dieses Feld; ein neues
 * Attribut gibt es nicht.
 */
export const TAB_TITLE_ATTRIBUTE = "tab-title";

/**
 * Names an already-saved title may sit under.
 *
 * A page configured by an earlier build may carry either of the older
 * spellings. Reading all of them costs nothing and keeps that content working.
 */
export const TITLE_KEYS = [TAB_TITLE_ATTRIBUTE, "tabtitle", "tabTitle"] as const;

/** Der Text hinter unserem `b64:`-Umschlag; ein kaputter Umschlag gilt als leer. */
const unwrap = (raw: string): string => (isPayload(raw) ? (decodePayload(raw) ?? "") : raw);

/**
 * The tab title, whatever shape it arrives in.
 *
 * The value has already passed the host's own decoding by the time it gets
 * here. What may still be wrapped is our own `b64:` envelope, which survives a
 * machine-translation pass — see `@shared/payload`.
 */
export function readTabTitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = unwrap(raw).trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Was das Fenster aus dem Feld des Staffbase-Dialogs liest: den Titel als
 * Text, den `b64:`-Umschlag einer übersetzten Seite schon geöffnet – im
 * Feld selbst stand dort bisher Base64.
 */
export function parseTitleField(raw: string): string {
  return unwrap(raw);
}

/**
 * Was das Fenster ins Feld zurückschreibt: den Titel ohne Ränder, als
 * Klartext wie bisher der Staffbase-Dialog.
 *
 * Geschrieben wird nur bei „Übernehmen“ mit echter Änderung: ungeändert
 * gleicht `serializeTitle(parseTitleField(raw))` dem Entwurf, der Rahmen
 * sieht nichts Offenes und lässt das Feld – auch einen `b64:`-Wert –
 * unberührt.
 */
export function serializeTitle(title: string): string {
  return title.trim();
}

/** Was im Kopf am Status steht, solange etwas offen ist. */
export function titleChangesStatus(draft: string, saved: string): string | undefined {
  return serializeTitle(draft) === serializeTitle(saved) ? undefined : "Titel geändert";
}
