// See docs/specs/website/nextjs-architecture.md §1
// See docs/specs/analysis/political-positioning.md "Canonical anchor sets"
//
// Anchors are FIXED across all candidate analyses (editorial requirement:
// symmetric scrutiny). Do not override per candidate.
import type { AxisKey } from "./derived/keys";
import type { I18nString } from "./i18n";

export interface Anchor {
  label: I18nString;
  /** Integer in [-5, +5]. */
  position: number;
  note: I18nString;
}

export interface AxisAnchors {
  axis: AxisKey;
  label: I18nString;
  polarLow: I18nString;
  polarHigh: I18nString;
  anchors: Anchor[];
}

export const AXES: AxisAnchors[] = [
  {
    axis: "economic",
    label: { fr: "Économique", en: "Economic" },
    polarLow: { fr: "Interventionniste", en: "Interventionist" },
    polarHigh: { fr: "Marché", en: "Market" },
    anchors: [
      {
        position: -4,
        label: { fr: "Mélenchon (LFI 2022)", en: "Mélenchon (LFI 2022)" },
        note: { fr: "Fortement interventionniste", en: "Strongly interventionist" },
      },
      {
        position: -2,
        label: { fr: "Hollande (2012)", en: "Hollande (2012)" },
        note: { fr: "Gauche modérée", en: "Moderate left" },
      },
      {
        position: 1,
        label: { fr: "Macron (2017)", en: "Macron (2017)" },
        note: { fr: "Centre libéral", en: "Centrist-liberal" },
      },
      {
        position: 3,
        label: { fr: "Fillon (2017)", en: "Fillon (2017)" },
        note: { fr: "Droite pro-marché", en: "Market-oriented right" },
      },
    ],
  },
  {
    axis: "social_cultural",
    label: { fr: "Social & culturel", en: "Social / Cultural" },
    polarLow: { fr: "Progressiste", en: "Progressive" },
    polarHigh: { fr: "Conservateur", en: "Conservative" },
    anchors: [
      {
        position: -3,
        label: { fr: "EELV (2022)", en: "EELV (2022)" },
        note: { fr: "Progressiste, laïcité inclusive", en: "Progressive, inclusive laicity" },
      },
      {
        position: -1,
        label: { fr: "Macron (2017)", en: "Macron (2017)" },
        note: { fr: "Centriste libéral-progressiste", en: "Liberal-progressive centrist" },
      },
      {
        position: 2,
        label: { fr: "LR (2022)", en: "LR (2022)" },
        note: { fr: "Conservateur traditionnel", en: "Traditional conservative" },
      },
      {
        position: 4,
        label: { fr: "Zemmour (2022)", en: "Zemmour (2022)" },
        note: { fr: "Identité culturelle forte", en: "Strong cultural-identity emphasis" },
      },
    ],
  },
  {
    axis: "sovereignty",
    label: { fr: "Souveraineté", en: "Sovereignty" },
    polarLow: { fr: "Europhile", en: "Pro-European" },
    polarHigh: { fr: "Souverainiste", en: "Sovereigntist" },
    anchors: [
      {
        position: -3,
        label: { fr: "Glucksmann / Place publique", en: "Glucksmann / Place publique" },
        note: { fr: "Fédéraliste européen", en: "EU-federalist" },
      },
      {
        position: -1,
        label: { fr: "Macron (2017)", en: "Macron (2017)" },
        note: { fr: "Pragmatique pro-intégration", en: "Pro-integration pragmatist" },
      },
      {
        position: 2,
        label: { fr: "LR (2022)", en: "LR (2022)" },
        note: { fr: "Souverainiste conservateur", en: "Sovereigntist conservative" },
      },
      {
        position: 4,
        label: { fr: "RN (2022)", en: "RN (2022)" },
        note: { fr: "Souveraineté nationale forte", en: "Strong national sovereignty" },
      },
    ],
  },
  {
    axis: "institutional",
    label: { fr: "Institutionnel", en: "Institutional" },
    polarLow: { fr: "Libéral-démocratique", en: "Liberal-democratic" },
    polarHigh: { fr: "Illibéral", en: "Illiberal" },
    anchors: [
      {
        position: -3,
        label: { fr: "Ve République (avant 2017)", en: "Fifth Republic consensus pre-2017" },
        note: { fr: "Contrepoids institutionnels forts", en: "Strong institutional checks" },
      },
      {
        position: -1,
        label: { fr: "Macron (2017)", en: "Macron (2017)" },
        note: { fr: "Exécutif fort dans les normes", en: "Executive-forward within norms" },
      },
      {
        position: 2,
        label: { fr: "LFI (référendums, contournement exécutif)", en: "LFI (referendum-heavy)" },
        note: { fr: "Tendances majoritaires-populistes", en: "Majoritarian populist tendencies" },
      },
      {
        position: 3,
        label: { fr: "RN (réforme judiciaire/médias)", en: "RN (judicial / media reform)" },
        note: { fr: "Tendances illibérales ciblées", en: "Illiberal tendencies on specific institutions" },
      },
    ],
  },
  {
    axis: "ecological",
    label: { fr: "Écologie", en: "Ecological" },
    polarLow: { fr: "Productiviste", en: "Productivist" },
    polarHigh: { fr: "Transition priorisée", en: "Transition-prioritized" },
    anchors: [
      {
        position: -3,
        label: { fr: "RN (2022, climat)", en: "RN (2022, climate)" },
        note: { fr: "Productiviste, sceptique", en: "Productivist, skeptical" },
      },
      {
        position: -1,
        label: { fr: "LR (2022)", en: "LR (2022)" },
        note: { fr: "Modéré, priorité à la croissance", en: "Moderate, growth-prioritized" },
      },
      {
        position: 1,
        label: { fr: "Macron (2017)", en: "Macron (2017)" },
        note: { fr: "Transition mainstream", en: "Mainstream transition commitments" },
      },
      {
        position: 4,
        label: { fr: "EELV (2022)", en: "EELV (2022)" },
        note: { fr: "Écologiste fort", en: "Strongly ecologist" },
      },
    ],
  },
];

export const ANCHORS_BY_AXIS: Record<AxisKey, AxisAnchors> = Object.fromEntries(
  AXES.map((a) => [a.axis, a]),
) as Record<AxisKey, AxisAnchors>;
