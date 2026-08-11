# content-tabs

Staffbase-Custom-Widget. Entwickelt, gebaut und released wird es aus dem
Meta-Repo [`ps-mhp/man-staffbase-cms-extensions`](https://github.com/ps-mhp/man-staffbase-cms-extensions);
dieses Repo enthält nur Quellcode und das ausgelieferte Bundle unter `dist/`.

```bash
scripts/sync.sh content-tabs
npm run build -- --env widget=content-tabs
npm test -- src/widgets/content-tabs
scripts/release.sh content-tabs
```
