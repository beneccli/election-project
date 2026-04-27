#!/usr/bin/env node
/* Fix aggregated.draft.json length violations for nathalie-arthaud 2026-04-27. */
import fs from "node:fs";

const FILE =
  "candidates/nathalie-arthaud/versions/2026-04-27/aggregated.draft.json";
const j = JSON.parse(fs.readFileSync(FILE, "utf8"));

// summary <= 2000
j.summary =
  "Candidature de Lutte Ouvrière revendiquée comme « campagne de classe » et non comme programme de gouvernement : refus explicite de présenter une trajectoire applicable depuis l'Élysée et appel à la lutte collective des travailleurs comme seul levier transformateur. Les six modèles convergent unanimement sur un placement extrême-gauche (extreme_gauche=6) et sur un score économique au minimum de l'échelle (-5/-5 unanime) : expropriation sans rachat ni indemnité du grand capital, interdiction des licenciements dans les entreprises bénéficiaires, indexation automatique des salaires sur les prix réels, retraite à 60 ans avec 37,5 annuités, monopole public du commerce extérieur. Volet social-progressiste maximal : régularisation immédiate d'environ 700 000 sans-papiers, ouverture des frontières, droit de vote pour tous les résidents étrangers, abrogation des lois immigration. Volet international : sortie immédiate de l'OTAN, opposition à toute hausse du budget militaire, refus de toute taxe carbone pesant sur les ménages. Les modèles divergent sur la praticabilité et sur les axes : (i) grade économie C/D/F sans pluralité, (ii) souveraineté de -5 (gemini, lecture rupturiste) à 0 (claude, lecture internationaliste sans Frexit), (iii) institutionnel de 0 à +5, (iv) écologique tie 0/+2 entre lecture « refus écologie punitive = neutralité » et lecture « planification anti-gaspillage = orientation positive », (v) climat long terme avec inversion de signe par mistral. Mistral et qwen attribuent F à la dimension économique en raison de l'absence revendiquée de chiffrage et de la dépendance à un soulèvement révolutionnaire ; les autres gradent C ou D pour les mêmes raisons mais soulignent la cohérence interne et la crédibilité testimoniale du discours.";

// --- Dimension headlines (max 140) ---
const dims = j.dimensions;
dims.economic_fiscal.headline.text =
  "Expropriation sans rachat des grands groupes, retraite 60 ans / 37,5 annuités, indexation automatique salaires-prix ; pas de mécanisme actuariel.";
dims.social_demographic.headline.text =
  "Régularisation immédiate ~700 000 sans-papiers, ouverture frontières, droits sociaux maximaux financés par expropriation et 100 % Sécu.";
dims.security_sovereignty.headline.text =
  "Sortie immédiate OTAN, opposition au réarmement, internationalisme sans Frexit ; aucune doctrine de défense alternative articulée.";
dims.institutional_democratic.headline.text =
  "Refus du présidentialisme, démocratie directe en entreprise, mandats révocables ; aucune architecture institutionnelle post-rupture spécifiée.";
dims.environmental_long_term.headline.text =
  "Critique du capitalisme productiviste, transports gratuits, rénovation thermique ; aucune cible d'émissions, refus des taxes carbone.";

// --- risk_profile notes (max 180) ---
const setNote = (dim, key, txt) => {
  dims[dim].risk_profile[key].note = txt;
};

setNote("economic_fiscal", "budgetary",
  "Programme finançable seulement via expropriation et refus de la dette publique ; aucun chiffrage agrégé ni mécanisme de bouclage budgétaire fourni."); // 158
setNote("economic_fiscal", "implementation",
  "Expropriation sans rachat, indexation forcée et monopole du commerce extérieur supposent révision constitutionnelle et dispositifs juridiques inexistants."); // 162
setNote("economic_fiscal", "dependency",
  "Cohérence du dispositif suppose un soulèvement collectif et la capacité à contenir capitaux et marchés ; conditions hors contrôle d'un gouvernement seul."); // 156
setNote("economic_fiscal", "reversibility",
  "Expropriation sans rachat et défaut souverain produiraient des effets durables sur le capital privé et la confiance, peu réversibles à court-moyen terme."); // 158

setNote("social_demographic", "budgetary",
  "100 % Sécu, embauches massives, indexation et droit de vote universel pèsent sur les comptes sociaux ; financement renvoyé à la rupture systémique."); // 153
setNote("social_demographic", "implementation",
  "Plusieurs mesures requièrent une révision constitutionnelle (article 3) ou des dispositifs administratifs lourds ; régularisation 700 000 fiable seulement à grande échelle."); // 175
setNote("social_demographic", "dependency",
  "Effet net dépend de la capacité de l'administration à absorber régularisations, embauches massives et 100 % Sécu sans saturer les services."); // 145
setNote("social_demographic", "reversibility",
  "Une fois acquis, droits sociaux étendus difficiles à abroger politiquement ; régularisation produit des effets de statut peu réversibles."); // 137

setNote("security_sovereignty", "implementation",
  "Sortie OTAN sans doctrine alternative ; rejet UE actuelle sans cadre de remplacement ; outils de coopération laissés en suspens."); // 132
setNote("security_sovereignty", "dependency",
  "Dispositif (sortie OTAN + rejet UE + internationalisme) suppose une dynamique transnationale qui n'est pas dans le pouvoir d'un État seul."); // 142
setNote("security_sovereignty", "reversibility",
  "Sortie OTAN procéduralement réversible mais effets de réputation diplomatique durables pendant la période de rupture."); // 116

setNote("institutional_democratic", "implementation",
  "Plusieurs mesures supposent une révision constitutionnelle non envisagée ; architecture post-rupture non spécifiée ; démocratie directe sans cadre juridique."); // 161
setNote("institutional_democratic", "dependency",
  "Cohérence suppose une mobilisation populaire et auto-organisation des travailleurs hors du contrôle de l'État, dynamique non assurée."); // 138
setNote("institutional_democratic", "reversibility",
  "Révision constitutionnelle théoriquement réversible mais coûteuse politiquement ; démocratie directe instaurée par loi peut être abrogée par majorité."); // 156

setNote("environmental_long_term", "implementation",
  "Absence de cible chiffrée, de calendrier et de trajectoire énergétique ; mesures concrètes opérationnelles mais à grande échelle elles supposent la rupture."); // 162
setNote("environmental_long_term", "dependency",
  "Transition à l'ampleur revendiquée dépend de la socialisation des moyens de production ; mesures partielles moins dépendantes."); // 130
setNote("environmental_long_term", "reversibility",
  "Infrastructures (rénovation, ferroviaire) ont une certaine inertie ; sans cible juridique, la trajectoire reste défaisable par majorité ultérieure."); // 153

// --- horizon dimension_note (max 200) ---
const setDimNote = (i, txt) => { j.intergenerational.horizon_matrix[i].dimension_note = txt; };
setDimNote(0, "Retraite 60 ans / 37,5 annuités + indexation pleine + minimum vieillesse au SMIC : transferts pro-âgés massifs ; soutenabilité actuarielle non démontrée."); // 156
setDimNote(1, "Refus de remboursement de la dette + expropriation : transfert massif des créanciers vers les classes populaires ; dette implicite (retraites, climat) non traitée."); // 169
setDimNote(2, "Mesures concrètes (transports gratuits, fret rail, rénovation) avec effet net positif probable ; sans cibles d'émissions ni signal-prix dans les secteurs diffus."); // 170
setDimNote(3, "100 % Sécu, embauches massives à l'hôpital, gratuité des médicaments essentiels : effet positif fort attendu pour toutes les classes d'âge, en particulier seniors."); // 171
setDimNote(5, "Réquisition logements vacants, encadrement et gel des loyers, plan massif de logement social : transferts pro-jeunes massifs sur l'accès au logement."); // 156

// --- horizon cell notes (max 160) ---
const setCell = (i, key, txt) => { j.intergenerational.horizon_matrix[i].cells[key].note = txt; };
setCell(0, "h_2038_2047",
  "Long terme : engagements de retraite très généreux non couverts par mécanisme actuariel ; risque d'érosion réelle si la rupture revendiquée n'advient pas."); // 152
setCell(1, "h_2031_2037",
  "Moyen terme : effets du défaut souverain sur le crédit public ; jeunes actifs subissent la perte d'accès aux marchés mais bénéficient de l'absence de service de la dette."); // wait check
setCell(2, "h_2031_2037",
  "Moyen terme : absence de cibles et de signal-prix limite la portée systémique ; effet positif des infrastructures concrètes mais inertie diffuse persistante."); // 158

// recheck cell1 length
const c1 = j.intergenerational.horizon_matrix[1].cells.h_2031_2037.note;
if (c1.length > 160) {
  j.intergenerational.horizon_matrix[1].cells.h_2031_2037.note =
    "Moyen terme : effets du défaut souverain sur le crédit public ; perte d'accès aux marchés mais absence du service de la dette."; // 124
}

fs.writeFileSync(FILE, JSON.stringify(j, null, 2) + "\n");
console.log("patched");
