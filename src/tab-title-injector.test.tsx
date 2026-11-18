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
 * Das Fenster „Tab benennen“ vor dem echten Dialog-Feld: RJSF rendert das
 * Formular aus dem Schema des Widgets, der Injektor legt den Rahmen davor.
 * Geprüft wird vor allem, was alte Blöcke schützt – Öffnen und Schließen
 * ohne Änderung schreibt nichts, auch keinen `b64:`-Titel um.
 */

import React from "react";
import { render, act, fireEvent, waitFor } from "@testing-library/react";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

import { encodePayload } from "@shared/payload";
import { configurationSchema, uiSchema } from "./configuration-schema";
import { clearTabsForTests, registerTab } from "./tab-registry";
import { startTabTitleInjector, tabTitleShell } from "./tab-title-injector";
import { modalRoot, queryDeep, queryInModal, settleModal } from "@shared/ui/config-modal.testing";

const FIELD = "#root_tab-title";

/** Das Modal lädt nach, der Editor darin noch einmal: so oft warten, bis er da ist. */
async function settleEditor(): Promise<void> {
  for (let round = 0; round < 5 && queryInModal('[data-testid="tab-title-editor"]') === null; round += 1) {
    await settleModal();
  }
}

interface Opened {
  container: HTMLElement;
  onSubmit: jest.Mock;
  stop: () => void;
}

async function open(title?: string): Promise<Opened> {
  const onSubmit = jest.fn();
  const formData = title === undefined ? undefined : { "tab-title": title };
  const { container } = render(
    <Form schema={configurationSchema} uiSchema={uiSchema} validator={validator} formData={formData} onSubmit={onSubmit} />,
  );
  let stop = (): void => {};
  await act(async () => {
    stop = startTabTitleInjector(container);
  });
  await settleEditor();
  return { container, onSubmit, stop };
}

const titleInput = (): HTMLInputElement => queryInModal<HTMLInputElement>('[data-testid="tab-title-input"]')!;

const fieldValue = (container: HTMLElement): string => container.querySelector<HTMLInputElement>(FIELD)!.value;

async function type(value: string): Promise<void> {
  await act(async () => {
    fireEvent.change(titleInput(), { target: { value } });
  });
}

async function clickInModal(testId: string): Promise<void> {
  await act(async () => {
    queryInModal<HTMLButtonElement>(`[data-testid="${testId}"]`)!.click();
  });
}

async function submit(opened: Opened): Promise<Record<string, unknown>> {
  await act(async () => {
    opened.container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
  });
  await waitFor(() => expect(opened.onSubmit).toHaveBeenCalled());
  return opened.onSubmit.mock.calls[0][0].formData;
}

afterEach(() => {
  clearTabsForTests();
  document.body.innerHTML = "";
});

describe("startTabTitleInjector", () => {
  it("verbirgt das Feld des Dialogs und öffnet das Fenster im Rahmen", async () => {
    const { container, stop } = await open("Termine");

    expect(container.querySelector<HTMLInputElement>(FIELD)!.style.display).toBe("none");
    expect(queryInModal('[data-testid="config-shell"]')).not.toBeNull();
    expect(modalRoot()!.textContent).toContain("Content-Tabs");
    expect(modalRoot()!.textContent).toContain("Tab benennen");
    expect(titleInput()).toHaveValue("Termine");

    await act(async () => stop());
  });

  it("hat keinen Vorschau-Umschalter", async () => {
    const { stop } = await open("Termine");

    expect(queryInModal('[aria-label="Ansicht"]')).toBeNull();

    await act(async () => stop());
  });

  it("schreibt beim Übernehmen den Titel ohne Ränder ins Feld, wo RJSF ihn abgibt", async () => {
    const opened = await open("Termine");

    await type("  Fristen ");
    expect(queryInModal('[role="status"]')).toHaveTextContent("Titel geändert");
    await clickInModal("config-shell-apply");

    expect(fieldValue(opened.container)).toBe("Fristen");
    expect((await submit(opened))["tab-title"]).toBe("Fristen");

    await act(async () => opened.stop());
  });

  it("lässt „Übernehmen“ gesperrt, solange nichts geändert ist – auch bei nur neuem Leerraum", async () => {
    const opened = await open("Termine");

    const apply = queryInModal<HTMLButtonElement>('[data-testid="config-shell-apply"]')!;
    expect(apply).toBeDisabled();
    await type("Termine  ");
    expect(apply).toBeDisabled();

    await act(async () => opened.stop());
  });

  it("zeigt einen übersetzten Titel als Klartext und lässt ihn im Feld unberührt", async () => {
    const stored = encodePayload("Übersicht");
    const opened = await open(stored);

    expect(titleInput()).toHaveValue("Übersicht");
    expect(queryInModal('[data-testid="config-shell-apply"]')).toBeDisabled();
    await clickInModal("config-shell-close");

    expect(fieldValue(opened.container)).toBe(stored);
    expect((await submit(opened))["tab-title"]).toBe(stored);

    await act(async () => opened.stop());
  });

  it("lässt nach dem Schließen einen Knopf zum Wiederöffnen an der Stelle des Felds", async () => {
    const { container, stop } = await open("Termine");

    await clickInModal("config-shell-close");

    const reopen = queryDeep<HTMLButtonElement>(container, '[data-testid="tab-title-reopen"]');
    expect(reopen).toHaveTextContent("Tab benennen");

    await act(async () => stop());
  });

  it("zeigt die Tabs des Abschnitts, zu dem der Titel gehört", async () => {
    const section = document.createElement("div");
    section.className = "ui-commons__section__wrapper";
    for (const title of ["Überblick", "Termine"]) {
      const column = document.createElement("div");
      column.className = "ui-commons__section__column";
      const widget = document.createElement("content-tabs");
      column.appendChild(widget);
      section.appendChild(column);
      registerTab(widget, title);
    }
    document.body.appendChild(section);

    const { stop } = await open("Termine");

    expect(modalRoot()!.textContent).toContain("Tab 2 von 2");
    expect(queryInModal('ul[aria-label="Tabs im Abschnitt, nur lesen"]')).toHaveTextContent("Überblick");

    await act(async () => stop());
  });

  it("zeigt in der Hilfe des Rahmens die Hilfe des Widgets", async () => {
    const { stop } = await open("Termine");

    await clickInModal("config-shell-help");
    await settleModal();

    const help = queryInModal('aside[aria-label="Hilfe"]');
    expect(help).toHaveTextContent("Ein Tab = eine Spalte");
    expect(help).toHaveTextContent("Tasten");

    await act(async () => stop());
  });
});

describe("tabTitleShell", () => {
  it("nennt Widget und Fenster und zählt keine Vorschau", () => {
    expect(tabTitleShell.widgetName).toBe("Content-Tabs");
    expect(tabTitleShell.title).toBe("Tab benennen");
    expect(tabTitleShell.preview).toBeFalsy();
    expect(tabTitleShell.validate).toBeUndefined();
  });

  it("meldet nur echte Änderungen im Status", () => {
    expect(tabTitleShell.statusText?.("Fristen", "Termine")).toBe("Titel geändert");
    expect(tabTitleShell.statusText?.(" Termine", "Termine")).toBeUndefined();
  });
});
