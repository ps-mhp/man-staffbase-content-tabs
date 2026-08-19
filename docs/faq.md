# FAQ

**Frage:** Ich habe das Widget eingefügt, aber es entsteht kein Tab.

Antwort: Das Widget muss **in einer Spalte eines Abschnitts** liegen. Steht es
direkt in der Seite (ohne Spaltenlayout), gibt es nichts, was zum Tab werden
könnte. Abschnitt einfügen, Spaltenlayout wählen, Widget in die Spalte
schieben.

**Frage:** Ich sehe im Editor keine Tab-Leiste, nur einen gestrichelten
Rahmen — ist das ein Fehler?

Antwort: Nein, das ist Absicht. Im Editor bleiben alle Spalten sichtbar und
einzeln bearbeitbar; sonst käme man an den Inhalt der nicht aktiven Tabs nicht
heran. Die Tab-Leiste erscheint in der Vorschau und auf der veröffentlichten
Seite.

**Frage:** Wo trage ich den Inhalt eines Tabs ein?

Antwort: Nicht im Widget. Der Inhalt ist alles, was **in derselben Spalte**
unter dem Content-Tabs-Widget liegt — beliebige Texte, Bilder und andere
Widgets.

**Frage:** Ich habe nur eine Spalte mit dem Widget. Warum sehe ich einen
einzelnen Tab?

Antwort: Weil jede markierte Spalte ein Tab ist, auch wenn es nur eine gibt.
Für eine echte Tab-Leiste braucht es mindestens zwei Spalten mit je einem
Content-Tabs-Widget.

**Frage:** Zwei Tab-Gruppen wurden versehentlich zu einer zusammengefasst.

Antwort: Alle direkt benachbarten Spalten mit Content-Tabs-Widget bilden
automatisch eine gemeinsame Gruppe. Die zweite Gruppe in einen **eigenen
Abschnitt** legen — oder mindestens eine Spalte **ohne** Widget dazwischen
lassen.

**Frage:** Ich habe zwei Content-Tabs-Widgets in dieselbe Spalte gelegt und
bekomme trotzdem nur einen Tab.

Antwort: Richtig — pro Spalte zählt genau ein Tab. Für einen zweiten Tab
braucht es eine zweite Spalte.

**Frage:** Kann ich die Reihenfolge der Tabs nachträglich ändern?

Antwort: Ja, durch Verschieben der Spalten im Editor. Die Tab-Reihenfolge
folgt der Spaltenreihenfolge von links nach rechts.

**Frage:** Kann ich auf einen bestimmten Tab verlinken oder festlegen, welcher
Tab zuerst offen ist?

Antwort: Nein. Beim Öffnen der Seite ist immer der erste Tab aktiv, und die
Auswahl wird beim Neuladen nicht gemerkt. Der wichtigste Inhalt gehört daher
in die erste Spalte.

**Frage:** Funktioniert das auch mit Tabs innerhalb eines Tabs?

Antwort: Nein. Es werden nur die Spalten desselben Abschnitts betrachtet;
Abschnitte innerhalb einer Tab-Spalte werden nicht zu weiteren Tab-Gruppen.

**Frage:** Lässt sich die Tab-Leiste per Tastatur bedienen?

Antwort: Ja. Mit Tab in die Leiste springen, mit den Pfeiltasten links/rechts
zwischen den Tabs wechseln, mit Pos1/Ende zum ersten bzw. letzten Tab.
