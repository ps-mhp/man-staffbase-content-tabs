# Paramètres

| Paramètre | Description |
| --- | --- |
| Titre de l'onglet | Le libellé sous lequel la colonne apparaît en tant qu'onglet. Champ obligatoire — sans titre, l'onglet reste sans libellé dans l'éditeur. |

Il s'agit du seul paramètre du widget. Le regroupement des onglets
résulte automatiquement de la disposition des colonnes :

1. Placez un bloc « Content Tabs » dans chaque colonne devant devenir un onglet et
   attribuez-lui un nom via « Titre de l'onglet ».
2. Les colonnes adjacentes contenant un bloc forment automatiquement un groupe — il suffit qu’elles
   soient simplement côte à côte.
3. Une colonne **sans** bloc clôt le groupe ; cette colonne reste
   inchangée.
