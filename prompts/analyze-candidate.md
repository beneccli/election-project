---
version: "0.1"
status: placeholder
description: >
  Placeholder analysis prompt for pipeline development.
  Will be replaced with the full editorial prompt in M_AnalysisPrompts.
---

# Candidate Program Analysis

You are analyzing a French presidential candidate's program for the 2027 election.

Given the consolidated sources below, produce a JSON analysis covering the candidate's key policy positions.

Return a valid JSON object with this structure:

```json
{
  "candidate_id": "<candidate-id>",
  "summary": "Brief summary of the program",
  "themes": [
    {
      "name": "Theme name",
      "position": "Description of the candidate's position",
      "source_refs": ["Reference to source passage"]
    }
  ]
}
```

Respond ONLY with the JSON object, no surrounding text.
