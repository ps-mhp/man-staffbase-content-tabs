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
 * Das Fenster „Tab benennen“ wie im Screen: links die Tabs des Abschnitts
 * (nur lesen), in der Mitte „Tab 2 von 4“, das Feld mit Hinweis und die
 * kleine Vorschau der Leiste. Gesteuert wie im Rahmen: `value` ist der
 * Entwurf, `onChange` setzt ihn.
 */

import * as React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import type { EditedTab } from "./edited-tab";
import { TabTitleEditor } from "./tab-title-editor";
import { TabTitleHelp } from "./tab-title-help";

const SECTION: EditedTab = {
  kind: "section",
  section: {
    tabs: [
      { title: "Überblick", column: 1 },
      { title: "Termine", column: 2 },
      { title: "Downloads", column: 3 },
      { title: "Kontakt", column: 4 },
    ],
    current: 1,
  },
};

interface HarnessProps {
  initial: string;
  edited: EditedTab;
  onChange?: (value: string) => void;
  locate?: jest.Mock;
}

/** Hält den Entwurf wie der Rahmen: der Editor ist gesteuert. */
function Harness({ initial, edited, onChange, locate }: HarnessProps): React.ReactElement {
  const [value, setValue] = React.useState(initial);
  return (
    <TabTitleEditor
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      locate={locate ?? (() => edited)}
    />
  );
}

const titleInput = (): HTMLInputElement => screen.getByLabelText("Titel des Tabs");

const sidebarList = (): HTMLElement => screen.getByRole("list", { name: "Tabs im Abschnitt, nur lesen" });

/** Was ein Screenreader von einer Zeile liest: ohne das, was `aria-hidden` ist. */
function spokenText(element: HTMLElement): string {
  const copy = element.cloneNode(true) as HTMLElement;
  copy.querySelectorAll("[aria-hidden]").forEach((hidden) => hidden.remove());
  return copy.textContent ?? "";
}

describe("TabTitleEditor", () => {
  it("zeigt links die Tabs des Abschnitts mit Spalte und markiert den bearbeiteten", () => {
    render(<Harness initial="Termine" edited={SECTION} />);

    const sidebar = screen.getByRole("complementary", { name: "Tabs im Abschnitt" });
    expect(within(sidebar).getByText("(4)")).toBeInTheDocument();
    const rows = within(sidebarList()).getAllByRole("listitem");
    expect(rows.map(spokenText)).toEqual([
      "Tab 1: ÜberblickSpalte 1",
      "Tab 2: TermineSpalte 2 · dieser Tab",
      "Tab 3: DownloadsSpalte 3",
      "Tab 4: KontaktSpalte 4",
    ]);
    expect(rows[1]).toHaveAttribute("aria-current", "true");
    expect(rows[0]).not.toHaveAttribute("aria-current");
    expect(
      within(sidebar).getByText(
        "Die Tabs entstehen aus den Spalten dieses Abschnitts. Anzahl und Reihenfolge ändern Sie im Studio am Abschnitt.",
      ),
    ).toBeInTheDocument();
  });

  it("überschreibt die Hauptfläche mit „Tab 2 von 4“ und der Spalte", () => {
    render(<Harness initial="Termine" edited={SECTION} />);

    expect(screen.getByRole("heading", { level: 2, name: "Tab 2 von 4" })).toBeInTheDocument();
    expect(screen.getByText("Spalte 2 des Abschnitts")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Inhalt" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "So erscheint die Leiste" })).toBeInTheDocument();
  });

  it("verbindet das Feld mit Label und Hinweis und setzt den Fokus hinein", () => {
    render(<Harness initial="Termine" edited={SECTION} />);

    const input = titleInput();
    expect(input).toHaveValue("Termine");
    expect(input).toHaveAccessibleDescription(
      "Steht als Reiter über dem Inhalt dieser Spalte. Kurz halten: ein bis zwei Wörter.",
    );
    expect(input).toHaveFocus();
  });

  it("gibt jede Eingabe als Entwurf weiter, Leerraum eingeschlossen", () => {
    const onChange = jest.fn();
    render(<Harness initial="Termine" edited={SECTION} onChange={onChange} />);

    fireEvent.change(titleInput(), { target: { value: "Termine 2026 " } });

    expect(onChange).toHaveBeenLastCalledWith("Termine 2026 ");
    expect(titleInput()).toHaveValue("Termine 2026 ");
  });

  it("lässt Seitenleiste und Vorschau dem Entwurf folgen, ohne Ränder", () => {
    render(<Harness initial="Termine" edited={SECTION} />);

    fireEvent.change(titleInput(), { target: { value: "  Fristen " } });

    expect(within(sidebarList()).getByText("Fristen")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Vorschau der Tab-Leiste: Überblick, Fristen (dieser Tab), Downloads, Kontakt" })).toBeInTheDocument();
  });

  it("nennt bei leerem Titel den Ersatz, den die Seite zeigt", () => {
    render(<Harness initial="" edited={SECTION} />);

    expect(titleInput()).toHaveAccessibleDescription(
      "Steht als Reiter über dem Inhalt dieser Spalte. Kurz halten: ein bis zwei Wörter. Ohne Titel zeigt die Seite „Tab 2“.",
    );
    expect(within(sidebarList()).getByText("Tab 2")).toBeInTheDocument();
  });

  it("fragt nur einmal beim Öffnen, wo der Tab steht – mit dem Titel von da", () => {
    const locate = jest.fn(() => SECTION);
    render(<Harness initial="Termine" edited={SECTION} locate={locate} />);

    fireEvent.change(titleInput(), { target: { value: "Neu" } });
    fireEvent.change(titleInput(), { target: { value: "Neuer" } });

    expect(locate).toHaveBeenCalledTimes(1);
    expect(locate).toHaveBeenCalledWith("Termine");
  });

  it("sagt, wenn der Abschnitt nicht zu erkennen war, statt zu raten", () => {
    render(<Harness initial="Termine" edited={{ kind: "unknown" }} />);

    expect(screen.queryByRole("list", { name: "Tabs im Abschnitt, nur lesen" })).toBeNull();
    expect(screen.getByText(/lässt sich hier nicht bestimmen/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Dieser Tab" })).toBeInTheDocument();
    expect(screen.getByText("Abschnitt nicht erkannt")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Vorschau der Tab-Leiste: Termine (dieser Tab)" })).toBeInTheDocument();
  });

  it("warnt, wenn der Block in keiner Spalte steht und so kein Tab wird", () => {
    render(<Harness initial="Termine" edited={{ kind: "loose" }} />);

    expect(screen.getByText(/steht in keiner Spalte eines Abschnitts/)).toBeInTheDocument();
    expect(screen.getByText("Steht in keiner Spalte eines Abschnitts")).toBeInTheDocument();
  });
});

describe("TabTitleHelp", () => {
  it("erklärt Tab und Spalte, Titel und Reihenfolge", () => {
    render(<TabTitleHelp />);

    const help = screen.getByTestId("tab-title-help");
    expect(help).toHaveTextContent("Ein Tab = eine Spalte");
    expect(help).toHaveTextContent("Tab 1");
    expect(help).toHaveTextContent("Reihenfolge");
  });
});
