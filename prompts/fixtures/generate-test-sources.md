---
name: generate-test-sources
version: "0.1"
status: stable
purpose: |
  Human-facing template: copy-paste this into a web-chat LLM to
  generate a fictional French presidential program for pipeline
  testing. This is NOT a pipeline prompt — the election-project
  code never loads this file.
target_models:
  - any web-chat LLM (ChatGPT, Claude.ai, Gemini, Mistral Chat, Grok)
---

# Generate a fictional presidential program (test fixture)

> **This is a fixture template, not a pipeline prompt.**
>
> Use this prompt to generate a synthetic `sources.md` for a `test-*`
> candidate created via `scripts/scaffold-candidate.ts --is-fictional`.
> See [`docs/specs/data-pipeline/analysis-modes.md`](../../docs/specs/data-pipeline/analysis-modes.md) § "Fictional candidates".

## How to use

1. Scaffold a fictional candidate first:

   ```
   npm run scaffold-candidate -- \
     --id test-<slug> \
     --name "<synthetic name>" \
     --party "<synthetic party>" \
     --is-fictional
   ```

2. Open your chosen web-chat LLM (ChatGPT, Claude.ai, Gemini…).
3. Copy the **prompt body** below (everything between the two
   horizontal rules) into the chat. Fill in the bracketed
   placeholders before sending.
4. The model will respond with a French-language program.
5. Paste the response into
   `candidates/test-<slug>/versions/<date>/sources.md.draft`,
   replacing the scaffolded stub. Verify the `⚠️ PROGRAMME FICTIF`
   banner is present and every section heading is tagged `(fictif)`.
6. Rename `sources.md.draft` → `sources.md` once you've reviewed it.
7. Proceed with any of the three analysis modes (api / manual-webchat
   / copilot-agent). The publish guard will prevent this candidate
   from becoming `current` without `--allow-fictional`.

## Why the fictional banner is mandatory

Every section must be tagged so that if the file ever leaks out of a
`test-` folder (via copy-paste, export, screenshot), it cannot be
mistaken for a real candidate's program. This is a guardrail against
laundering synthetic content into apparent reality.

---

## Prompt body (copy from here to the end of the file)

Tu vas produire un **programme politique fictif** pour une élection présidentielle française 2027, destiné **exclusivement** à tester un pipeline d'analyse éditoriale multi-modèles. Ce programme ne sera jamais publié comme analyse réelle et ne doit ressembler à aucune personne ou parti réel.

### Contraintes non négociables

1. **Bannière obligatoire** — le document commence **impérativement** par ces deux lignes, telles quelles :

   ```
   > ⚠️ PROGRAMME FICTIF — généré pour tests de pipeline.
   > Ne reflète pas les positions d'une personne réelle.
   ```

2. **Chaque titre de section** (tous niveaux) doit être suffixé `(fictif)`. Exemple : `## 1. Économie & finances publiques (fictif)`.

3. **Personnage fictif** — le programme est porté par :
   - Nom fictif : `[NOM DU CANDIDAT FICTIF — renseignez-le]`
   - Parti fictif : `[NOM DU PARTI FICTIF — renseignez-le]`
   - Positionnement **unique et cohérent** : `[POSITIONNEMENT CHOISI — ex: "écosocialiste décentralisateur", "libéral-souverainiste", "conservateur social", "centriste pragmatique"]`.
   Toutes les propositions doivent être cohérentes entre elles et avec ce positionnement.

4. **Aucun nom de personne réelle** comme porteur ou signataire. Les noms de figures publiques (Macron, Hollande, Sarkozy, Mélenchon, Le Pen, etc.) ne peuvent apparaître **que** comme points de repère historiques pour situer une proposition (ex : « position plus interventionniste que Macron 2017 »), et **uniquement** si c'est utile à la lecture.

5. **Langue** : français, registre politique sobre, ni parodique ni caricatural. On cherche un programme plausible, pas un canular.

### Couverture dimensionnelle obligatoire

Le document **doit traiter les six clusters suivants**, issus de la taxonomie d'analyse du projet (voir `docs/specs/analysis/dimensions.md`). Pour **chaque cluster**, produis au minimum :

- **3 mesures concrètes** (pas seulement des intentions),
- **1 chiffrage quantifié** (€/an, %, nombre de logements, tonnes CO₂eq, âge, taux de remplacement…).

Les six clusters :

1. **Économie & finances publiques (fictif)** — finances publiques (dette, déficit), structure de la fiscalité, modèle de croissance / réindustrialisation, marché du travail, retraites, logement, cadre budgétaire européen.
2. **Social & démographie (fictif)** — santé (déserts médicaux, hôpital), éducation, politique familiale et natalité, inégalités (régionales, de classe, générationnelles), cohésion sociale et laïcité.
3. **Sécurité & souveraineté (fictif)** — sécurité intérieure, immigration, défense (OTAN, dissuasion, autonomie européenne), souveraineté énergétique (nucléaire, renouvelables), souveraineté alimentaire et industrielle.
4. **Institutions & démocratie (fictif)** — réforme institutionnelle, référendum et système électoral, centralisation / décentralisation, relation à l'UE, capacité de l'État à exécuter.
5. **Environnement & long terme (fictif)** — climat (objectifs, réalisme, répartition des coûts), biodiversité et eau, transition agricole, infrastructures (rail, réseau énergétique, numérique).
6. **Intergénérationnel (fictif, transversal)** — transferts nets entre cohortes (€/personne/an), charge de la dette, accès au logement des moins de 35 ans, maths de la retraite pour une personne de 25 ans aujourd'hui (taux de remplacement, âge de départ, annuités), dette environnementale.

### Structure attendue du document

Utilise exactement cette ossature Markdown :

```
> ⚠️ PROGRAMME FICTIF — généré pour tests de pipeline.
> Ne reflète pas les positions d'une personne réelle.

# Programme de [NOM DU CANDIDAT FICTIF] — [NOM DU PARTI FICTIF] (fictif)

## Positionnement (fictif)

[2–4 paragraphes. Positionnement explicite, grille de lecture idéologique, priorités déclarées.]

## 1. Économie & finances publiques (fictif)

### 1.1 Finances publiques (fictif)
- Mesure 1 (chiffrée si pertinent)
- Mesure 2
- Mesure 3

### 1.2 Structure fiscale (fictif)
...

### 1.3 Croissance et réindustrialisation (fictif)
...

### 1.4 Marché du travail (fictif)
...

### 1.5 Retraites (fictif)
...

### 1.6 Logement (fictif)
...

### 1.7 Cadre budgétaire européen (fictif)
...

## 2. Social & démographie (fictif)

### 2.1 Santé (fictif)
...

### 2.2 Éducation (fictif)
...

### 2.3 Politique familiale (fictif)
...

### 2.4 Inégalités (fictif)
...

### 2.5 Cohésion sociale (fictif)
...

## 3. Sécurité & souveraineté (fictif)

### 3.1 Sécurité intérieure (fictif)
...

### 3.2 Immigration (fictif)
...

### 3.3 Défense (fictif)
...

### 3.4 Souveraineté énergétique (fictif)
...

### 3.5 Souveraineté alimentaire et industrielle (fictif)
...

## 4. Institutions & démocratie (fictif)

### 4.1 Réforme institutionnelle (fictif)
...

### 4.2 Référendum et système électoral (fictif)
...

### 4.3 Décentralisation (fictif)
...

### 4.4 Relation à l'UE (fictif)
...

### 4.5 Capacité exécutive de l'État (fictif)
...

## 5. Environnement & long terme (fictif)

### 5.1 Climat (fictif)
...

### 5.2 Biodiversité et eau (fictif)
...

### 5.3 Transition agricole (fictif)
...

### 5.4 Infrastructures (fictif)
...

## 6. Intergénérationnel (fictif, transversal)

### 6.1 Transferts nets entre cohortes (fictif)
[Au moins un chiffrage en €/personne/an ou équivalent.]

### 6.2 Service de la dette (fictif)
...

### 6.3 Accès au logement des moins de 35 ans (fictif)
...

### 6.4 Retraite pour un·e Français·e de 25 ans aujourd'hui (fictif)
[Taux de remplacement projeté, âge de départ, annuités, hypothèses.]

### 6.5 Dette environnementale (fictif)
...

## Sources internes au programme (fictif)

[Section libre : notes sur la cohérence interne, arbitrages explicites du candidat fictif, hypothèses macro sous-jacentes.]
```

### Ce que le document ne doit **pas** contenir

- Aucune analyse (pas de notes, pas de grades, pas de positionnement chiffré sur une échelle). Ce document est **le programme brut** ; l'analyse est une étape séparée du pipeline.
- Aucun verdict éditorial ("ce candidat est dangereux", "ce programme est irréaliste"). Le programme **décrit** ses propres positions ; c'est le rôle du pipeline d'analyse en aval de confronter ces positions aux faits.
- Aucune mention de personne réelle comme porteur de mesure.
- Aucun lien externe (pas de "voir tel article sur…"). Le document doit être auto-suffisant.

### Cohérence interne

Relis ton brouillon avant de l'envoyer et vérifie que :

- Les mesures fiscales, sociales et écologiques sont **mutuellement compatibles** (ex : une baisse massive de l'impôt sur les sociétés + une forte hausse des investissements publics sans contrepartie dessine un programme incohérent — corrige ou explicite l'arbitrage).
- Les chiffres affichés (€/an, % du PIB, nombre de logements) sont **internes** au programme et **approximativement réalistes** pour la France (ordre de grandeur PIB ≈ 2 800 Mds €, dépenses publiques ≈ 57 % du PIB, population ≈ 68 M).
- Chaque cluster a bien ≥ 3 mesures et ≥ 1 chiffrage.
- La bannière `⚠️ PROGRAMME FICTIF` est bien en toute première ligne.
- Chaque titre de section est bien suffixé `(fictif)`.

Produis maintenant le document complet.
