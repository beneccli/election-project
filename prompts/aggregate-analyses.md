---
version: "0.1"
status: placeholder
description: >
  Placeholder aggregation prompt for pipeline development.
  Will be replaced with the full editorial aggregation prompt in M_Aggregation.
---

# Multi-Model Analysis Aggregation

You are aggregating analyses of a French presidential candidate's program produced by multiple AI models.

Below you will find:
1. The original consolidated sources
2. Individual model analyses (as JSON)

Produce a JSON aggregation that:
- Identifies themes where models agree (consensus)
- Highlights themes where models disagree (dissent)
- Notes any claims not well-supported by the sources

Return a valid JSON object with this structure:

```json
{
  "candidate_id": "<candidate-id>",
  "model_count": <number>,
  "consensus_themes": [
    {
      "name": "Theme name",
      "summary": "Consensus position",
      "supporting_models": ["model-a", "model-b"]
    }
  ],
  "dissent_themes": [
    {
      "name": "Theme name",
      "positions": [
        { "model": "model-a", "position": "Position A" },
        { "model": "model-b", "position": "Position B" }
      ]
    }
  ],
  "flagged_claims": []
}
```

Respond ONLY with the JSON object, no surrounding text.
