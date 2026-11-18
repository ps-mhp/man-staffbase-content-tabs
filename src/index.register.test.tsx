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

// Ein Modul, kein Skript: sonst teilten sich die Testdateien aller Widgets
// einen Namensraum.
export {};

const mockStartWidget = jest.fn().mockResolvedValue(undefined);
const mockStopInjector = jest.fn();
const mockStartTabTitleInjector = jest.fn(() => mockStopInjector);
const mockStopTracking = jest.fn();
const mockTrackPointedTab = jest.fn(() => mockStopTracking);
const mockStartContentTabs = jest.fn(() => () => undefined);

jest.mock("@shared/dev-mode/start-widget", () => ({ startWidget: mockStartWidget }));
jest.mock("./tab-title-injector", () => ({ startTabTitleInjector: mockStartTabTitleInjector }));
jest.mock("./edited-tab", () => ({ trackPointedTab: mockTrackPointedTab }));
jest.mock("./bootstrap", () => ({ startContentTabs: mockStartContentTabs }));

interface Host {
  defineBlock?: jest.Mock;
}

afterEach(() => {
  delete (window as unknown as Host).defineBlock;
});

describe("Anmeldung des Widgets", () => {
  it("startet Fenster und Klick-Spur erst beim Anmelden, mit tab-title als einzigem Attribut", async () => {
    const host = window as unknown as Host;
    host.defineBlock = jest.fn();

    jest.resetModules();
    const { stopTabTitleEditor } = await import("./index");

    // Beim blossen Laden noch nicht: erst muss feststehen, ob ein lokaler
    // Entwicklungsserver übernimmt.
    expect(mockStartTabTitleInjector).not.toHaveBeenCalled();
    expect(mockTrackPointedTab).not.toHaveBeenCalled();

    const options = mockStartWidget.mock.calls[0][0] as { name: string; register: () => void };
    expect(options.name).toBe("content-tabs");
    options.register();

    expect(mockStartTabTitleInjector).toHaveBeenCalledTimes(1);
    expect(mockTrackPointedTab).toHaveBeenCalledTimes(1);
    expect(mockStartContentTabs).toHaveBeenCalledTimes(1);
    expect(host.defineBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        blockDefinition: expect.objectContaining({ name: "content-tabs", attributes: ["tab-title"] }),
      }),
    );

    stopTabTitleEditor();
    expect(mockStopInjector).toHaveBeenCalledTimes(1);
    expect(mockStopTracking).toHaveBeenCalledTimes(1);
  });
});

describe("Attributname", () => {
  it("teilt tab-title mit keinem anderen Widget", async () => {
    // Die Fenster finden ihr Feld über `root_<Attribut>`, ohne das Widget zu
    // kennen. Ein geteilter Name ließe dieses Fenster in fremde Dialoge.
    const { readdirSync, readFileSync, existsSync } = await import("fs");
    const { join } = await import("path");
    const widgetsRoot = join(__dirname, "..", "..");
    const others = readdirSync(widgetsRoot).filter((name) => name !== "content-tabs");
    const clashes = others.filter((name) => {
      const schema = join(widgetsRoot, name, "src", "configuration-schema.ts");
      return existsSync(schema) && /["'`]tab-title["'`]/.test(readFileSync(schema, "utf8"));
    });

    expect(others.length).toBeGreaterThan(0);
    expect(clashes).toEqual([]);
  });
});
