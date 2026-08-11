# Content-Tabs Widget

Staffbase-Widget, das benachbarte Spalten einer Section zu einer Tab-Gruppe
zusammenfasst: Jede Spalte, in der ein `<content-tabs>`-Block liegt, wird zu
einem Tab. Spalten ohne Block bleiben eigenständig und trennen so zwei
Gruppen voneinander.

## Benutzung

1. In jede Spalte, die ein Tab werden soll, einen `content-tabs`-Block
   einfügen und ihm über das Attribut **Tab-Titel** (`tab-title`) einen Namen
   geben.
2. Benachbarte Spalten mit Block bilden automatisch eine Gruppe — sie müssen
   nur nebeneinander liegen.
3. Eine Spalte **ohne** Block dazwischen beendet die Gruppe; die Spalte selbst
   wird nicht verändert.

Im CMS-Editor wird keine Tab-Leiste angezeigt. Stattdessen zeichnet das Widget
einen gestrichelten Rahmen um die Gruppe und zeigt den jeweiligen Titel als
kleines Label an, damit der Inhalt jeder Spalte jederzeit erreichbar bleibt.

## Entwicklung

```bash
git clone https://github.com/ps-mhp/man-staffbase-cms-extensions.git
cd man-staffbase-cms-extensions
npm install
scripts/sync.sh content-tabs
```

Der Quellcode liegt danach unter `src/widgets/content-tabs/`.

```bash
npm run build -- --env widget=content-tabs
npm test -- src/widgets/content-tabs
scripts/release.sh content-tabs rc
scripts/install.sh content-tabs
```

## Auslieferung

Das Bundle wird pro Versionstag über jsDelivr ausgeliefert:

```
https://cdn.jsdelivr.net/gh/ps-mhp/man-staffbase-content-tabs@<version>/dist/content-tabs.js
```
