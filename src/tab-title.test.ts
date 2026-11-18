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

import { encodePayload } from "@shared/payload";

import { parseTitleField, serializeTitle, titleChangesStatus } from "./tab-title";

describe("parseTitleField", () => {
  it("nimmt Klartext, wie er im Feld steht", () => {
    expect(parseTitleField("Termine")).toBe("Termine");
    expect(parseTitleField("")).toBe("");
  });

  it("öffnet den b64-Umschlag einer übersetzten Seite", () => {
    expect(parseTitleField(encodePayload("Übersicht"))).toBe("Übersicht");
  });

  it("liest einen kaputten Umschlag als leer statt als Base64", () => {
    expect(parseTitleField("b64:!!!")).toBe("");
  });
});

describe("serializeTitle", () => {
  it("schreibt Klartext ohne Ränder", () => {
    expect(serializeTitle("  Termine ")).toBe("Termine");
  });

  it("lässt einen ungeänderten Wert gleich – auch hinter einem Umschlag", () => {
    // Gleich serialisiert heißt für den Rahmen: nichts offen, nichts zu
    // schreiben. So bleibt ein `b64:`-Wert im Feld, solange niemand tippt.
    for (const raw of ["Termine", "  Termine  ", encodePayload("Übersicht"), ""]) {
      const once = serializeTitle(parseTitleField(raw));
      expect(serializeTitle(parseTitleField(once))).toBe(once);
    }
    expect(serializeTitle(parseTitleField(encodePayload("Übersicht")))).toBe(
      serializeTitle(parseTitleField("Übersicht")),
    );
  });
});

describe("titleChangesStatus", () => {
  it("meldet eine Änderung des Titels", () => {
    expect(titleChangesStatus("Kontakt", "Termine")).toBe("Titel geändert");
  });

  it("schweigt, wenn nur Leerraum dazukam", () => {
    expect(titleChangesStatus("Termine ", "Termine")).toBeUndefined();
  });
});
