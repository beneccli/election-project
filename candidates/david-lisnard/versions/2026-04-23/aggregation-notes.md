
## Flagged item resolutions

- **approved** — Le fichier raw `deepseek-manual.json` indique dans son champ `model` les valeurs `provider: "anthropic"` et `version: "claude-opus-4-7"`, qui contredisent le nom de fichier et le contenu (signé DeepSeek-V3 dans `analyst_meta`). L'agrégation a utilisé l'identifiant dérivé du nom de fichier (`deepseek-v3`) dans tous les champs `supported_by`/`dissenters`/`per_model`, mais l'incohérence des métadonnées doit être corrigée à la source avant publication. (reviewer: benoit, at: 2026-04-23T16:54:39.965Z)
- **approved** — L'axe `positioning.institutional` n'a pas de mode unique : 2× +1 (gemini, grok), 2× -1 (deepseek, qwen), 1× 0 (claude). `modal_score` est positionné à `null` conformément au schéma. (reviewer: benoit, at: 2026-04-23T16:54:40.933Z)
- **approved** — La cellule horizon `education.h_2031_2037` n'a pas de mode unique (3× score 1, 2× score 2). `modal_score` est positionné à `null`. (reviewer: benoit, at: 2026-04-23T16:54:42.076Z)
- **approved** — La cellule horizon `housing.h_2027_2030` n'a pas de mode unique (2× -1, 2× +1, 1× 0). `modal_score` est positionné à `null`. (reviewer: benoit, at: 2026-04-23T16:54:42.710Z)
- **approved** — L'identifiant de modèle 'qwen3.6' contient un point ; les autres identifiants utilisent des tirets (`claude-opus-4-7`, `deepseek-v3`, `gemini-2.5-pro`, `grok-4`). (reviewer: benoit, at: 2026-04-23T16:54:43.402Z)
