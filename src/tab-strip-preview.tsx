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
 * „So erscheint die Leiste“: die Reiter des Abschnitts in klein, der
 * bearbeitete hervorgehoben wie auf der Seite – fett, mit Linie in MAN-Rot.
 *
 * Ein Bild, keine echte Leiste: nichts darin ist bedienbar, Screenreader
 * lesen den Satz aus `stripLabel`. Die volle Leiste zeigt die Vorschau des
 * Studios; ein Vorschau-Umschalter im Kopf hätte nur diese eine Zeile zu
 * zeigen.
 *
 * Eine Zeile wie auf der Seite. Passen nicht alle Reiter hinein, rückt die
 * Leiste so, dass der bearbeitete sichtbar bleibt.
 */

import * as React from "react";
import { cn } from "@man/config-ui/primitives/utils";

import { TabEntry, stripLabel } from "./tab-overview";

/** Abstand, den ein hereingerückter Reiter zum Rand behält – das Polster der Leiste. */
const EDGE = 16;

/** Rückt `strip` so, dass `tab` ganz zu sehen ist; tut nichts, wenn er es schon ist. */
function keepVisible(strip: HTMLElement, tab: HTMLElement): void {
  const start = tab.offsetLeft;
  const end = start + tab.offsetWidth;
  if (start < strip.scrollLeft) strip.scrollLeft = Math.max(0, start - EDGE);
  else if (end > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = end - strip.clientWidth + EDGE;
}

export function TabStripPreview({ entries }: { entries: readonly TabEntry[] }): React.ReactElement {
  const stripRef = React.useRef<HTMLDivElement>(null);
  const currentRef = React.useRef<HTMLSpanElement>(null);

  React.useLayoutEffect(() => {
    if (stripRef.current !== null && currentRef.current !== null) keepVisible(stripRef.current, currentRef.current);
  });

  return (
    <div
      ref={stripRef}
      role="img"
      aria-label={stripLabel(entries)}
      data-testid="tab-strip-preview"
      // `relative`: Die Reiter messen `offsetLeft` an der Leiste selbst.
      className="relative flex gap-1 overflow-hidden border bg-background px-4"
    >
      {entries.map((entry, index) => (
        <span
          key={`${entry.column ?? "x"}-${index}`}
          ref={entry.current ? currentRef : undefined}
          className={cn(
            "shrink-0 px-3.5 py-3 text-sm whitespace-nowrap",
            entry.current
              ? "font-bold text-brand-ink shadow-[inset_0_-3px_0_var(--brand)]"
              : "text-muted-foreground",
          )}
        >
          {entry.label}
        </span>
      ))}
    </div>
  );
}
