#!/usr/bin/env tsx
/**
 * One-off translation helper used to seed
 * `candidates/test-omega/versions/2027-11-01/aggregated.en.json`.
 *
 * Reads the FR canonical aggregated.json, applies a static EN
 * overrides map keyed by dot-path, and writes the result to
 * aggregated.en.json. Paths not in the overrides map keep their FR
 * value (parity-clean — the validator skips translatable string
 * leaves regardless of language).
 *
 * Run with:
 *   tsx scripts/_oneoff/translate-test-omega.ts
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const VERSION_DIR =
  "candidates/test-omega/versions/2027-11-01";

// EN translation overrides keyed by dot-path. Paths must be in the
// TRANSLATABLE_PATHS allowlist; the parity validator does not enforce
// that any particular path is translated, only that structure
// (numbers, IDs, array lengths) matches.
const OVERRIDES: Record<string, string> = {
  summary:
    "Omega Synthétique's program proposes an ecological, decentralizing techno-progressivism built around massive public investment (€50 bn/year) in the green transition, an unconditional universal safety net (UBI at €750/month), and an institutional break transferring 30% of the national budget to the regions. Financing relies on redistributive taxation (Climate Wealth Tax, removal of inefficient subsidies) and a 1.2%/year growth assumption, but the gap between announced expenditure and identified revenue is the central structural fragility. The three models converge on an interventionist, ecologist and progressive profile, but diverge on the intensity of the economic stance, the grade of certain dimensions, and the direction of the counterfactual.",

  // --- positioning ---
  "positioning.economic.anchor_narrative":
    "The program sits between Hollande 2012 and Mélenchon 2022 on the economic axis, combining nationalisations, massive public investment and an unconditional UBI with residual market mechanisms (tax credits, green-firm status, budgetary discipline via the green golden rule).",
  "positioning.economic.per_model.0.reasoning":
    "More interventionist than Hollande 2012 through the scale of public investment and nationalisation, but less so than Mélenchon 2022 thanks to retained market incentives and budgetary discipline via the green golden rule.",

  "positioning.social_cultural.anchor_narrative":
    "The program is clearly progressive, comparable to EELV 2022, combining unconditional UBI, legalisation of medical aid in dying, voting at 16, regularisation of undocumented workers and parity parental leave. The collective-obligation component (civic service, medical-posting duty) is republican rather than conservative.",
  "positioning.social_cultural.per_model.0.reasoning":
    "Comparable to EELV 2022 through the combination of UBI + end-of-life + voting at 16 + immigration regularisation.",

  "positioning.sovereignty.anchor_narrative":
    "The sovereignty profile is mixed and contested across models. The program combines European institutional federalism (end of unanimity, parliamentary initiative) with sectoral sovereigntism (NATO exit, energy nationalisation, customs shield). The tension between these orientations is not resolved in the sources.",
  "positioning.sovereignty.per_model.0.reasoning":
    "Federalist on institutions but sovereigntist on strategic capacities. The tension nets out to -1.",

  "positioning.institutional.anchor_narrative":
    "The program shifts power toward direct democracy (citizens' initiative referendum, blank-vote invalidation) while keeping institutional safeguards (majority bonus, transparency authority, whistleblower protection). The three models place it on the participatory/populist side of the axis, but at moderate intensity.",
  "positioning.institutional.per_model.0.reasoning":
    "Slight tilt toward the participatory/populist pole, offset by institutional safeguards (transparency authority, majority bonus).",

  "positioning.ecological.anchor_narrative":
    "The program is strongly ecological, close to EELV 2022, with binding constitutional targets (-60% GHG by 2035), bans (short flights, pesticides), and massive investments (rail freight, thermal renovation). The pro-nuclear choice (8 EPRs, 50/50 mix) distinguishes it from the classic EELV anchor.",
  "positioning.ecological.per_model.0.reasoning":
    "Strongly ecological in goals and means, moderated by the pro-nuclear choice that distinguishes it from EELV.",

  "positioning.overall_spectrum.anchor_narrative":
    "Two models place the program in the left band on the basis of economic interventionism, social progressivism and pronounced ecologism; a third model concludes the placement is unclassifiable because the combination of a heavily statist economic axis and an illiberal institutional axis does not fit the conventional left/right schema.",
  "positioning.overall_spectrum.per_model.0.reasoning":
    "Strong economic interventionism (-3) combined with a markedly progressive social/cultural axis (-3) and a pronounced ecological axis (+3) place the program in the left band; the slightly +1 institutional axis is not extreme and keeps the reading in the radical social-democratic register rather than the extreme.",
  "positioning.overall_spectrum.per_model.1.reasoning":
    "The weight of economic interventionism (-3), moderate social progressivism (-2) and pronounced ecologism (+4) tilts the program toward conventional left, with a slightly nationalist sovereignty axis (+1) insufficient to neutralise the left-ecological bloc on the primary axes.",
  "positioning.overall_spectrum.per_model.2.reasoning":
    "The extreme statist economic axis (-4) pushes hard left, but the sovereignty axis (+1) and especially the institutional axis (+2 illiberal) pull the other way, and the social-progressive axis (-3) is not enough to decide; the axes do not combine into a coherent left/right placement, so the program is reported as unclassifiable rather than forced onto the spectrum.",
  "positioning.overall_spectrum.dissent.0.reasoning":
    "The extreme statist economic axis (-4) pushes hard left, but the sovereignty axis (+1) and especially the institutional axis (+2 illiberal) pull the other way; the axes do not combine into a coherent left/right placement.",

  // --- dimensions: economic_fiscal ---
  "dimensions.economic_fiscal.headline.text":
    "€50 bn/year green investment, €750/month UBI, Climate Wealth Tax and subsidy review; revenue–expenditure gap unresolved.",
  "dimensions.economic_fiscal.headline.per_model.0.text":
    "€50 bn/year of public investment and a €750/month UBI financed by the Climate Wealth Tax, with an unresolved revenue–expenditure gap.",
  "dimensions.economic_fiscal.summary":
    "The three models agree on the central diagnosis: an economic program built around massive investment in green reindustrialisation (€50 bn/year), tax reform (Climate Wealth Tax, removal of inefficient subsidies, confiscatory inheritance tax), and a universal social floor (UBI €750/month). Budgetary discipline is sought via the green golden rule (2.5% of GDP). Consensus on high budget risk: identified revenue (~€23 bn/year) is insufficient against aggregated spending. The points-based pension reform (pivot age 63, minimum contributory benefit €1,200) is detailed but its transition cost is not quantified.",
  "dimensions.economic_fiscal.problems_addressed.0.problem":
    "Financing the ecological transition",
  "dimensions.economic_fiscal.problems_addressed.0.approach":
    "A dedicated €50 bn/year investment plan, conditioned on carbon-trajectory contracts, partly financed by the Climate Wealth Tax (€8 bn) and the review of business subsidies (€15 bn).",
  "dimensions.economic_fiscal.problems_addressed.0.reasoning":
    "Financing mechanism explicitly quantified but covering less than half of the announced envelope. The carbon conditionality is a concrete lever.",
  "dimensions.economic_fiscal.problems_addressed.1.problem":
    "Precarity in platform work",
  "dimensions.economic_fiscal.problems_addressed.1.approach":
    "Ban on exclusivity clauses and a presumption of employee status for couriers and ride-hail drivers.",
  "dimensions.economic_fiscal.problems_addressed.1.reasoning":
    "A direct, legally operational measure that reverses the burden of proof.",
  "dimensions.economic_fiscal.problems_addressed.2.problem":
    "Insufficient minimum pension and a fragmented system",
  "dimensions.economic_fiscal.problems_addressed.2.approach":
    "Universal points-based pension, pivot age 63, minimum contributory benefit at €1,200 net per month for a full minimum-wage career.",
  "dimensions.economic_fiscal.problems_addressed.2.reasoning":
    "Quantified, clear target. The cost of the upgrade and the transition from special schemes are not detailed.",
  "dimensions.economic_fiscal.problems_addressed.3.problem":
    "Shortage of social housing and energy-inefficient dwellings",
  "dimensions.economic_fiscal.problems_addressed.3.approach":
    "Construction of 200,000 eco-designed social housing units per year, rent freeze conditional on energy renovation, simplified expropriation of vacant buildings.",
  "dimensions.economic_fiscal.problems_addressed.3.reasoning":
    "Ambitious volume with clear conditionality. The sector's capacity to absorb 200,000 units/year remains an execution risk.",
  "dimensions.economic_fiscal.problems_ignored.0.problem":
    "Business competitiveness and capital flight under increased taxation",
  "dimensions.economic_fiscal.problems_ignored.0.significance":
    "The Climate Wealth Tax, the surtax on pay-gap excesses, and the confiscatory inheritance tax could trigger relocations. The program does not mention any compensating anti-evasion measure.",
  "dimensions.economic_fiscal.problems_ignored.1.problem":
    "Sensitivity of the debt trajectory to interest rates",
  "dimensions.economic_fiscal.problems_ignored.1.significance":
    "Stabilising debt at 110% of GDP by 2032 is presented without stress tests for higher refinancing costs.",
  "dimensions.economic_fiscal.problems_ignored.2.problem":
    "Net consolidated cost of the UBI combined with sectoral spending",
  "dimensions.economic_fiscal.problems_ignored.2.significance":
    "The program does not publish a unified dashboard linking recurring expenditure and recurring revenue.",
  "dimensions.economic_fiscal.problems_worsened.0.problem":
    "Imported inflation from customs barriers",
  "dimensions.economic_fiscal.problems_worsened.0.mechanism":
    "The kilometric tax, the external carbon tariff and the agricultural customs shield will mechanically raise the price of imported goods.",
  "dimensions.economic_fiscal.problems_worsened.0.reasoning":
    "The program acknowledges \"green inflation\" of 2.5% but does not separate the share due to trade barriers. Regressive effect without the UBI as a buffer.",
  "dimensions.economic_fiscal.problems_worsened.1.problem":
    "Constraints on labour supply (32-hour week + UBI)",
  "dimensions.economic_fiscal.problems_worsened.1.mechanism":
    "Reduced working time combined with the UBI may shrink labour supply in low-margin sectors.",
  "dimensions.economic_fiscal.problems_worsened.1.reasoning":
    "Mechanical reduction in labour volume without correspondingly documented productivity gains.",
  "dimensions.economic_fiscal.problems_worsened.2.problem":
    "Short-term budgetary exposure if growth underperforms",
  "dimensions.economic_fiscal.problems_worsened.2.mechanism":
    "Spending commitments are front-loaded while revenues from growth and reindustrialisation arrive more slowly.",
  "dimensions.economic_fiscal.problems_worsened.2.reasoning":
    "The macro framework assumes 1.2% growth and 5% structural unemployment; weaker delivery widens the financing gap.",
  "dimensions.economic_fiscal.execution_risks.0.risk":
    "Gap between identified revenue (~€23 bn/year) and announced spending (€50 bn/year + UBI)",
  "dimensions.economic_fiscal.execution_risks.0.reasoning":
    "All three models flag structural under-financing. The UBI alone exceeds €150 bn/year in gross cost. The 1.2% growth assumption does not generate sufficient revenue.",
  "dimensions.economic_fiscal.execution_risks.1.risk":
    "Negotiating exclusion of green spending from the 3% deficit at EU level",
  "dimensions.economic_fiscal.execution_risks.1.reasoning":
    "The change requires unanimity from the 27 member states. Historical resistance from frugal countries.",
  "dimensions.economic_fiscal.execution_risks.2.risk":
    "Savings from the business-subsidies review falling short of the €15 bn/year projection",
  "dimensions.economic_fiscal.execution_risks.2.reasoning":
    "The program does not specify which subsidy lines are removed or the associated legal challenges.",
  "dimensions.economic_fiscal.key_measures.0.measure":
    "Green golden rule: investment deficit capped at 2.5% of GDP",
  "dimensions.economic_fiscal.key_measures.0.magnitude":
    "2.5% of GDP",
  "dimensions.economic_fiscal.key_measures.1.measure":
    "Climate Wealth Tax on highly emitting assets",
  "dimensions.economic_fiscal.key_measures.1.magnitude":
    "€8 bn/year",
  "dimensions.economic_fiscal.key_measures.2.measure":
    "Green reindustrialisation plan",
  "dimensions.economic_fiscal.key_measures.2.magnitude":
    "€50 bn/year over the five-year term",
  "dimensions.economic_fiscal.key_measures.3.measure":
    "Universal points-based pension, pivot age 63, minimum €1,200 net",
  "dimensions.economic_fiscal.key_measures.3.magnitude":
    "Minimum contributory benefit €1,200 net, departure from age 60 with reduction",
  "dimensions.economic_fiscal.key_measures.4.measure":
    "Review of inefficient business subsidies",
  "dimensions.economic_fiscal.key_measures.4.magnitude":
    "€15 bn/year of estimated savings",
  "dimensions.economic_fiscal.risk_profile.budgetary.note":
    "Identified revenue (~€23 bn/year) covers less than half of expenditure. The UBI creates a rigid structural commitment.",
  "dimensions.economic_fiscal.risk_profile.budgetary.per_model.0.note":
    "Identified revenue covers less than half of announced investment, before the UBI.",
  "dimensions.economic_fiscal.risk_profile.implementation.note":
    "Pension reform, energy nationalisation, 200,000 housing units/year, subsidy review: a stack of heavy projects.",
  "dimensions.economic_fiscal.risk_profile.implementation.per_model.0.note":
    "Each project is heavy on its own: pensions, nationalisation, housing, abolition of departments.",
  "dimensions.economic_fiscal.risk_profile.dependency.note":
    "Excluding green spending from the deficit calculation and the external carbon tariff require unanimous EU agreement.",
  "dimensions.economic_fiscal.risk_profile.dependency.per_model.0.note":
    "Excluding green spending requires EU unanimity. Growth assumption of 1.2%/year.",
  "dimensions.economic_fiscal.risk_profile.reversibility.note":
    "Tax reforms reversible by finance bill, but the points-based pension system and housing expropriations are more durable.",
  "dimensions.economic_fiscal.risk_profile.reversibility.per_model.0.note":
    "Green golden rule, points system and Climate Wealth Tax reversible by simple parliamentary majority.",

  // --- dimensions: social_demographic ---
  "dimensions.social_demographic.headline.text":
    "€750/month UBI, mandatory medical service in underserved areas, +15% teacher pay raise, aggregate financing not consolidated.",
  "dimensions.social_demographic.headline.per_model.0.text":
    "Universal social floor (UBI €750/month) and massive investment in health, education and early childhood, with an unconsolidated aggregate cost.",
  "dimensions.social_demographic.summary":
    "The three models recognise a social program of exceptional scale: UBI at €750/month, three-year mandatory medical-service obligation, +15% teacher pay raise, 150,000 childcare places, mandatory civic service, parity parental leave. Gemini grades it A given the direct reach of the measures (UBI, medical posting), while Claude and GPT grade B, noting that aggregate financing is not consolidated and that the recruitment pipelines (teachers, caregivers, early childhood) are not detailed.",
  "dimensions.social_demographic.problems_addressed.0.problem": "Medical deserts",
  "dimensions.social_demographic.problems_addressed.0.approach":
    "Three-year mandatory medical service in underserved areas for every junior doctor, accompanied by a 5% real increase in the hospital budget.",
  "dimensions.social_demographic.problems_addressed.0.reasoning":
    "All three models flag this measure. Gemini emphasises its direct effectiveness; Claude and GPT flag the risk of resistance and emigration.",
  "dimensions.social_demographic.problems_addressed.1.problem":
    "Teacher pay and class size",
  "dimensions.social_demographic.problems_addressed.1.approach":
    "15% pay raise from year one, cap of 20 students per class in primary school.",
  "dimensions.social_demographic.problems_addressed.1.reasoning":
    "Quantified, immediate measure. Three-model consensus on its strength. GPT flags the need for large-scale recruitment that is not detailed.",
  "dimensions.social_demographic.problems_addressed.2.problem":
    "Poverty and income inequality",
  "dimensions.social_demographic.problems_addressed.2.approach":
    "UBI at €750/month merging RSA and prime d'activité, 1-to-20 pay-gap cap, confiscatory tax on inheritances above €10 m.",
  "dimensions.social_demographic.problems_addressed.2.reasoning":
    "Triple mechanism: floor (UBI), cap (pay gaps), transmission (inheritance). Gross UBI cost identified as the main fragility.",
  "dimensions.social_demographic.problems_addressed.3.problem":
    "Early-childhood care",
  "dimensions.social_demographic.problems_addressed.3.approach":
    "150,000 public childcare places by 2030, six-month parental leave (two non-transferable months) at 80% of salary.",
  "dimensions.social_demographic.problems_addressed.3.reasoning":
    "Quantified volume and mandatory-sharing mechanism. All three models flag the recruitment-capacity risk.",
  "dimensions.social_demographic.problems_ignored.0.problem":
    "Long-term care and ageing (the \"fifth risk\")",
  "dimensions.social_demographic.problems_ignored.0.significance":
    "The program does not mention a specific reform of long-term-care provision beyond the civic-service component.",
  "dimensions.social_demographic.problems_ignored.1.problem":
    "Recruitment pipelines for the expanded public services",
  "dimensions.social_demographic.problems_ignored.1.significance":
    "The program expands labour-intensive services without detailing training and recruitment capacity.",
  "dimensions.social_demographic.problems_worsened.0.problem":
    "Attractiveness of the medical profession",
  "dimensions.social_demographic.problems_worsened.0.mechanism":
    "The three-year posting obligation could deter vocations or encourage emigration.",
  "dimensions.social_demographic.problems_worsened.0.reasoning":
    "Coercive mechanism flagged by all three models. Gemini emphasises the risk of strikes and brain drain.",
  "dimensions.social_demographic.problems_worsened.1.problem":
    "Possible reduction of labour supply under the unconditional UBI",
  "dimensions.social_demographic.problems_worsened.1.mechanism":
    "A €750/month transfer can reduce labour supply at the extensive margin for low-paid jobs.",
  "dimensions.social_demographic.problems_worsened.1.reasoning":
    "The program provides no labour-supply estimates. Plausible mechanism but not demonstrated in the sources.",
  "dimensions.social_demographic.execution_risks.0.risk":
    "Gross UBI cost at €750/month for all adults",
  "dimensions.social_demographic.execution_risks.0.reasoning":
    "With ~52 million adults, gross cost exceeds €460 bn/year. After recycling RSA/prime d'activité (~€30 bn), the net balance remains substantial.",
  "dimensions.social_demographic.execution_risks.1.risk":
    "Resistance from junior doctors to the service obligation",
  "dimensions.social_demographic.execution_risks.1.reasoning":
    "Coercive posting historically triggers resistance and emigration. The program does not describe sanctions or compensation.",
  "dimensions.social_demographic.execution_risks.2.risk":
    "Recruiting for 150,000 childcare places in five years",
  "dimensions.social_demographic.execution_risks.2.reasoning":
    "The sector already faces shortages. The program details no specific recruitment plan.",
  "dimensions.social_demographic.key_measures.0.measure":
    "Universal Basic Income at €750/month from age 18",
  "dimensions.social_demographic.key_measures.0.magnitude":
    "€750/month per adult, no conditions",
  "dimensions.social_demographic.key_measures.1.measure":
    "Three-year medical-service obligation in medical deserts",
  "dimensions.social_demographic.key_measures.1.magnitude":
    "Three years for every junior doctor",
  "dimensions.social_demographic.key_measures.2.measure":
    "15% teacher pay raise",
  "dimensions.social_demographic.key_measures.2.magnitude":
    "+15% immediate",
  "dimensions.social_demographic.key_measures.3.measure":
    "150,000 public childcare places by 2030",
  "dimensions.social_demographic.key_measures.3.magnitude":
    "150,000 places in five years",
  "dimensions.social_demographic.risk_profile.budgetary.note":
    "UBI at €750/month (>€460 bn gross/year) plus sectoral commitments: aggregate financing not consolidated.",
  "dimensions.social_demographic.risk_profile.budgetary.per_model.0.note":
    "The UBI alone exceeds €460 bn gross/year. Aggregate financing is not consolidated.",
  "dimensions.social_demographic.risk_profile.implementation.note":
    "Simultaneous rollout of the UBI, 150,000 childcare places, civic service and medical reform: very high administrative load.",
  "dimensions.social_demographic.risk_profile.implementation.per_model.0.note":
    "Simultaneous rollout of UBI, childcare, civic service and medical reform.",
  "dimensions.social_demographic.risk_profile.dependency.note":
    "Mainly national social measures. Limited dependency on macroeconomic assumptions.",
  "dimensions.social_demographic.risk_profile.dependency.per_model.0.note":
    "Limited dependency on macro assumptions.",
  "dimensions.social_demographic.risk_profile.reversibility.note":
    "The UBI creates a political dependency that makes reversal socially costly. The points system is technically reversible.",
  "dimensions.social_demographic.risk_profile.reversibility.per_model.0.note":
    "UBI creates strong political dependency. Points system reversible.",

  // --- dimensions: security_sovereignty ---
  "dimensions.security_sovereignty.headline.text":
    "Community police, 8 EPRs, NATO exit by 2035, electricity nationalisation, six-month strategic reserves.",
  "dimensions.security_sovereignty.headline.per_model.0.text":
    "Security reorientation toward proximity and cyber, with progressive exit from integrated NATO command and energy nationalisation.",
  "dimensions.security_sovereignty.summary":
    "All three models agree on a B grade. The program is unusually broad on sovereignty: community police (10,000 officers), doubling of the justice budget, \"Transition Talents\" card (50,000/year), defence at 2.5% of GDP with a cyber/space pivot, nationalisation of the electricity fleet (8 EPRs + 50% renewables), six-month strategic reserves. Consensus rests on the program's coherence around strategic autonomy, but dependencies on European agreement (NATO, carbon tariff) and industrial risks (8 EPRs) limit the grade.",
  "dimensions.security_sovereignty.problems_addressed.0.problem":
    "Energy dependence on hydrocarbons",
  "dimensions.security_sovereignty.problems_addressed.0.approach":
    "Nationalisation of the electricity fleet, 50/50 nuclear/renewable mix (8 EPRs), ban on non-compliant LNG.",
  "dimensions.security_sovereignty.problems_addressed.0.reasoning":
    "The program articulates production, governance and a planning horizon. Identified by all three models as one of the most detailed strands.",
  "dimensions.security_sovereignty.problems_addressed.1.problem":
    "Distrust of the police and urban tensions",
  "dimensions.security_sovereignty.problems_addressed.1.approach":
    "10,000 community-police officers without lethal weapons, evaluation via victimisation surveys.",
  "dimensions.security_sovereignty.problems_addressed.1.reasoning":
    "Clear doctrinal change. Claude notes the absence of measures on terrorism and trafficking.",
  "dimensions.security_sovereignty.problems_addressed.2.problem":
    "Supply disruptions for rare metals and medicines",
  "dimensions.security_sovereignty.problems_addressed.2.approach":
    "Six-month national strategic reserves.",
  "dimensions.security_sovereignty.problems_addressed.2.reasoning":
    "Specific target. Storage cost and scope not detailed.",
  "dimensions.security_sovereignty.problems_ignored.0.problem":
    "Terrorism and radicalisation",
  "dimensions.security_sovereignty.problems_ignored.0.significance":
    "No specific measure targets prevention of or response to terrorism.",
  "dimensions.security_sovereignty.problems_ignored.1.problem":
    "Specialised nuclear workforce for 8 simultaneous EPRs",
  "dimensions.security_sovereignty.problems_ignored.1.significance":
    "The program does not detail a training strategy for the specialised engineers and welders required.",
  "dimensions.security_sovereignty.problems_worsened.0.problem":
    "Strategic positioning within NATO",
  "dimensions.security_sovereignty.problems_worsened.0.mechanism":
    "Progressive exit from integrated command reduces interoperability with allies without guarantee that the European Command will be operational.",
  "dimensions.security_sovereignty.problems_worsened.0.reasoning":
    "2027–2035 transition window with risk of capability gap. Three-model consensus.",
  "dimensions.security_sovereignty.execution_risks.0.risk":
    "Building 8 EPRs given the Flamanville track record (12 years late)",
  "dimensions.security_sovereignty.execution_risks.0.reasoning":
    "Systemic schedule and budget overruns on EPRs. Flagged by all three models.",
  "dimensions.security_sovereignty.execution_risks.1.risk":
    "European partners' adherence to a European Strategic Command",
  "dimensions.security_sovereignty.execution_risks.1.reasoning":
    "Several countries view NATO command as essential. Consensus difficult to reach.",
  "dimensions.security_sovereignty.key_measures.0.measure":
    "Community Police: 10,000 officers without lethal weapons",
  "dimensions.security_sovereignty.key_measures.0.magnitude":
    "10,000 officers",
  "dimensions.security_sovereignty.key_measures.1.measure":
    "\"Transition Talents\" card: 50,000/year",
  "dimensions.security_sovereignty.key_measures.1.magnitude":
    "50,000 per year",
  "dimensions.security_sovereignty.key_measures.2.measure":
    "Defence budget at 2.5% of GDP with cyber/space pivot",
  "dimensions.security_sovereignty.key_measures.2.magnitude":
    "2.5% of GDP",
  "dimensions.security_sovereignty.key_measures.3.measure":
    "Nationalisation of the electricity fleet and 8 EPRs",
  "dimensions.security_sovereignty.key_measures.3.magnitude":
    "8 EPR reactors",
  "dimensions.security_sovereignty.risk_profile.budgetary.note":
    "Defence at 2.5% of GDP, electricity nationalisation not quantified, strategic reserves: significant exposure.",
  "dimensions.security_sovereignty.risk_profile.budgetary.per_model.0.note":
    "Defence at 2.5% of GDP, nationalisation not quantified, six-month reserves.",
  "dimensions.security_sovereignty.risk_profile.implementation.note":
    "8 EPRs, nationalisation, NATO exit, police reform, doubled justice budget: a stack of heavy projects.",
  "dimensions.security_sovereignty.risk_profile.implementation.per_model.0.note":
    "Stack of heavy administrative and industrial projects.",
  "dimensions.security_sovereignty.risk_profile.dependency.note":
    "NATO exit, external carbon tariff and customs shield require an EU consensus.",
  "dimensions.security_sovereignty.risk_profile.dependency.per_model.0.note":
    "NATO exit requires partner buy-in. Customs shield requires EU consensus.",
  "dimensions.security_sovereignty.risk_profile.reversibility.note":
    "Nationalisation and EPR reactors create faits accomplis that are hard to reverse. Police and budget are reversible.",
  "dimensions.security_sovereignty.risk_profile.reversibility.per_model.0.note":
    "Nationalisation costly to reverse. NATO exit reversible but politically difficult.",

  // --- dimensions: institutional_democratic ---
  "dimensions.institutional_democratic.headline.text":
    "Girondist break (30% to regions), citizens' initiative referendum, full proportional, single seven-year term.",
  "dimensions.institutional_democratic.headline.per_model.0.text":
    "Girondist break (30% of budget to the regions) and direct democracy (citizens' initiative referendum, blank vote, full proportional representation).",
  "dimensions.institutional_democratic.summary":
    "All three models identify a deep institutional transformation: full proportional representation with a 15% bonus, single seven-year term, near-total removal of forced-passage clauses, citizens' initiative referendum, blank-vote invalidation, voting at 16, radical decentralisation (30% of budget to the regions), abolition of departments. Gemini grades A for the scope of reforms, while Claude and GPT grade B, flagging governability risks and the number of constitutional revisions required.",
  "dimensions.institutional_democratic.problems_addressed.0.problem":
    "Hyper-presidentialism and centralism",
  "dimensions.institutional_democratic.problems_addressed.0.approach":
    "Single seven-year term, removal of forced-passage clauses (except finance bills), full proportional representation, 30% of budget to the regions.",
  "dimensions.institutional_democratic.problems_addressed.0.reasoning":
    "Coherent architecture flagged by all three models. The combination of levers is both the main strength and the main risk.",
  "dimensions.institutional_democratic.problems_addressed.1.problem":
    "Crisis of representation",
  "dimensions.institutional_democratic.problems_addressed.1.approach":
    "Repeal and legislative citizens' initiative referendum at 1 million signatures, recognition of the invalidating blank vote, voting at 16.",
  "dimensions.institutional_democratic.problems_addressed.1.reasoning":
    "Direct response to demand for participation. Effect on abstention uncertain.",
  "dimensions.institutional_democratic.problems_ignored.0.problem":
    "Independence of the judiciary and reform of the prosecution service",
  "dimensions.institutional_democratic.problems_ignored.0.significance":
    "The justice budget is doubled but reform of the status of the prosecution service and the High Council of the Judiciary is not mentioned.",
  "dimensions.institutional_democratic.problems_ignored.1.problem":
    "Conflict-resolution mechanisms between strengthened regions and the central state",
  "dimensions.institutional_democratic.problems_ignored.1.significance":
    "The 30% budget transfer is not accompanied by detailed arbitration or equalisation mechanisms.",
  "dimensions.institutional_democratic.problems_worsened.0.problem":
    "Governability under full proportional representation",
  "dimensions.institutional_democratic.problems_worsened.0.mechanism":
    "Even with a 15% bonus, absolute majorities are highly improbable. Combined with the citizens' initiative referendum, the risk of institutional instability rises.",
  "dimensions.institutional_democratic.problems_worsened.0.reasoning":
    "Three-model consensus on this structural risk.",
  "dimensions.institutional_democratic.execution_risks.0.risk":
    "Number of constitutional revisions required",
  "dimensions.institutional_democratic.execution_risks.0.reasoning":
    "The Congress must reach 3/5 for each revision. Several measures will be actively opposed.",
  "dimensions.institutional_democratic.execution_risks.1.risk":
    "Abolition of departments against opposition from local elected officials",
  "dimensions.institutional_democratic.execution_risks.1.reasoning":
    "Attempted under Hollande and abandoned. Powerful opposition bloc of elected officials and local civil servants.",
  "dimensions.institutional_democratic.key_measures.0.measure":
    "Full proportional representation with a 15% majority bonus",
  "dimensions.institutional_democratic.key_measures.0.magnitude":
    "15% bonus",
  "dimensions.institutional_democratic.key_measures.1.measure":
    "Repeal and legislative citizens' initiative referendum at 1 million signatures",
  "dimensions.institutional_democratic.key_measures.1.magnitude":
    "1 million signatures",
  "dimensions.institutional_democratic.key_measures.2.measure":
    "Decentralisation: 30% of the national budget to the regions",
  "dimensions.institutional_democratic.key_measures.2.magnitude":
    "30% of the budget",
  "dimensions.institutional_democratic.risk_profile.budgetary.note":
    "Institutional reforms with low direct cost. Decentralisation is a fiscal transfer, not a net spend.",
  "dimensions.institutional_democratic.risk_profile.budgetary.per_model.0.note":
    "Low direct cost. Decentralisation = transfer, not net spend.",
  "dimensions.institutional_democratic.risk_profile.implementation.note":
    "At least four constitutional revisions, abolition of an administrative tier, transfer of 30% of the budget, relocation of 50% of central directorates.",
  "dimensions.institutional_democratic.risk_profile.implementation.per_model.0.note":
    "4+ constitutional revisions, abolition of departments, 30% transfer, 50% relocation of directorates.",
  "dimensions.institutional_democratic.risk_profile.dependency.note":
    "Substantial domestic reforms. EU proposals depend on agreement of the 26 other states.",
  "dimensions.institutional_democratic.risk_profile.dependency.per_model.0.note":
    "EU reforms require agreement of 26 other states. Revisions: 3/5 majority in Congress.",
  "dimensions.institutional_democratic.risk_profile.reversibility.note":
    "Seven-year term and citizens' initiative referendum reversible by constitutional revision, but budgetary decentralisation is hard to reverse.",
  "dimensions.institutional_democratic.risk_profile.reversibility.per_model.0.note":
    "Seven-year term and citizens' initiative reversible. Budgetary decentralisation hard to reverse.",

  // --- dimensions: environmental_long_term ---
  "dimensions.environmental_long_term.headline.text":
    "Constitutional -60% GHG by 2035 target, 30% of territory protected, 50% of farmland organic, 8 EPRs, €15 bn for rail freight.",
  "dimensions.environmental_long_term.headline.per_model.0.text":
    "Constitutional -60% GHG by 2035 target, carbon accounting in finance bills, 30% of territory under strong protection.",
  "dimensions.environmental_long_term.summary":
    "All three models unanimously agree on an A grade. The environmental program is the most detailed and binding: constitutional targets (-60% GHG by 2035), carbon accounting in finance bills with automatic provisioning, bans (short flights, glyphosate, neonicotinoids), massive investments (rail freight €15 bn, thermal renovation, organic conversion €5 bn/year), agricultural transformation (50% organic farmland by 2035). The main risk is technical feasibility: renovating ~5 million energy-inefficient dwellings in three years, 8 EPRs, organic conversion — all simultaneously.",
  "dimensions.environmental_long_term.problems_addressed.0.problem":
    "Greenhouse-gas emissions",
  "dimensions.environmental_long_term.problems_addressed.0.approach":
    "Constitutional -60% target by 2035, carbon accounting in finance bills, automatic budget provisioning when overshooting.",
  "dimensions.environmental_long_term.problems_addressed.0.reasoning":
    "Triple credibility mechanism (constitutional, institutional, financial). The -60% target in 8 years is extremely ambitious.",
  "dimensions.environmental_long_term.problems_addressed.1.problem":
    "Energy-inefficient dwellings and energy poverty",
  "dimensions.environmental_long_term.problems_addressed.1.approach":
    "Mandatory renovation of all F- and G-rated dwellings by 2030, 100% coverage for low-income households.",
  "dimensions.environmental_long_term.problems_addressed.1.reasoning":
    "Holistic renovation obligation (not piecemeal) with full financing for low-income households. Volume of ~5 million dwellings in three years.",
  "dimensions.environmental_long_term.problems_addressed.2.problem":
    "Loss of biodiversity and water pollution",
  "dimensions.environmental_long_term.problems_addressed.2.approach":
    "30% of the territory under strong protection, moratorium on mega-basins, ban on glyphosate and neonicotinoids from 2028.",
  "dimensions.environmental_long_term.problems_addressed.2.reasoning":
    "Aligned with the Kunming-Montréal global framework. Dated bans with a compensation fund.",
  "dimensions.environmental_long_term.problems_addressed.3.problem":
    "Agricultural transition",
  "dimensions.environmental_long_term.problems_addressed.3.approach":
    "50% organic farmland by 2035, 100,000 new farmers, €5 bn/year for conversion, reorientation of CAP toward agroecology.",
  "dimensions.environmental_long_term.problems_addressed.3.reasoning":
    "Quantified target with timeline, dedicated budget and installation plan. CAP reorientation requires European negotiation.",
  "dimensions.environmental_long_term.problems_ignored.0.problem":
    "Adaptation to climate change (heatwaves, floods, coastal submersion)",
  "dimensions.environmental_long_term.problems_ignored.0.significance":
    "The program centres on mitigation, not on adapting infrastructure and systems to unavoidable climate effects.",
  "dimensions.environmental_long_term.problems_ignored.1.problem":
    "Yield drop during the transition to organic farming",
  "dimensions.environmental_long_term.problems_ignored.1.significance":
    "The transition of 50% of farmland to organic will mechanically reduce gross output, affecting export balances.",
  "dimensions.environmental_long_term.problems_worsened.0.problem":
    "Cost of food",
  "dimensions.environmental_long_term.problems_worsened.0.mechanism":
    "Pesticide bans, customs shield, and large-scale organic conversion will mechanically raise agricultural and food prices.",
  "dimensions.environmental_long_term.problems_worsened.0.reasoning":
    "Cost passed to consumers. The UBI may serve as a buffer but is not explicitly framed as such.",
  "dimensions.environmental_long_term.problems_worsened.1.problem":
    "Construction and renovation bottlenecks",
  "dimensions.environmental_long_term.problems_worsened.1.mechanism":
    "Mandatory renovation, rail freight, charging stations, and simultaneous deployment of renewables and EPRs exceed current capacity.",
  "dimensions.environmental_long_term.problems_worsened.1.reasoning":
    "The program stacks several capital-intensive transitions on the same horizon.",
  "dimensions.environmental_long_term.execution_risks.0.risk":
    "Construction sector's capacity to renovate ~5 million energy-inefficient dwellings in three years",
  "dimensions.environmental_long_term.execution_risks.0.reasoning":
    "Requires multiplying current capacity by 15–20×. Training and recruitment exceed existing flows.",
  "dimensions.environmental_long_term.execution_risks.1.risk":
    "Social resistance to bans (flights, pesticides, motorway moratorium)",
  "dimensions.environmental_long_term.execution_risks.1.reasoning":
    "Sectors of employment directly affected. Sectoral mobilisations foreseeable.",
  "dimensions.environmental_long_term.key_measures.0.measure":
    "Constitutional -60% GHG by 2035 target",
  "dimensions.environmental_long_term.key_measures.0.magnitude":
    "-60% vs 1990",
  "dimensions.environmental_long_term.key_measures.1.measure":
    "30% of territory under strong protection",
  "dimensions.environmental_long_term.key_measures.1.magnitude":
    "30% of land and maritime area",
  "dimensions.environmental_long_term.key_measures.2.measure":
    "50% organic farmland by 2035, €5 bn/year for conversion",
  "dimensions.environmental_long_term.key_measures.2.magnitude":
    "50% of farmland, €5 bn/year",
  "dimensions.environmental_long_term.key_measures.3.measure":
    "Rail freight plan of €15 bn over 10 years",
  "dimensions.environmental_long_term.key_measures.3.magnitude":
    "€15 bn",
  "dimensions.environmental_long_term.risk_profile.budgetary.note":
    "Thermal renovation 100% for low-income, organic conversion €5 bn/year, freight €15 bn, EPRs: very heavy multi-year commitments.",
  "dimensions.environmental_long_term.risk_profile.budgetary.per_model.0.note":
    "Each item quantified but the total exceeds the €50 bn/year envelope.",
  "dimensions.environmental_long_term.risk_profile.implementation.note":
    "x15 renovation capacity, 50% organic farmland, 8 EPRs, freight: industrial capacity at the ceiling.",
  "dimensions.environmental_long_term.risk_profile.implementation.per_model.0.note":
    "x15 on renovation capacity, 50% organic, 8 EPRs, rail freight.",
  "dimensions.environmental_long_term.risk_profile.dependency.note":
    "CAP reorientation and carbon tariff require EU agreement. EPR technology depends on supply chains.",
  "dimensions.environmental_long_term.risk_profile.dependency.per_model.0.note":
    "CAP and carbon tariff require EU agreement. EPRs depend on global chains.",
  "dimensions.environmental_long_term.risk_profile.reversibility.note":
    "Constitutional target reversible by amendment, but bans, protected areas and infrastructure (EPRs, freight) create faits accomplis.",
  "dimensions.environmental_long_term.risk_profile.reversibility.per_model.0.note":
    "Bans and infrastructure create faits accomplis.",

  // --- intergenerational ---
  "intergenerational.reasoning":
    "All three models agree on the old_to_young direction, driven by partial de-indexation of pensions above €2,500 net, the UBI, the youth zero-rate loan, the Young Active lease, and the ring-fencing of Covid debt on the wealthiest 10%. The €500/person/year estimate is cited by the three models but comes from the program's own sources, without independent verification. Constitutional carbon accounting is identified as the mechanism that prevents deferral of ecological debt.",
  "intergenerational.magnitude_estimate.value":
    "~€500/person/year reallocated to those under 25 via partial de-indexation of pensions above €2,500 net",
  "intergenerational.magnitude_estimate.units":
    "€/person/year",
  "intergenerational.magnitude_estimate.caveats":
    "The €500/person/year figure derives from the de-indexation alone. The actual net transfer is broader through the UBI, zero-rate loan, Young Active lease and ring-fenced Covid debt. This figure is not a robust cardinal measure.",
  "intergenerational.impact_on_25yo_in_2027.fiscal.summary":
    "Net benefit through the €750/month UBI and ring-fencing of Covid debt on the wealthiest 10%.",
  "intergenerational.impact_on_25yo_in_2027.fiscal.quantified":
    "UBI: €9,000/year",
  "intergenerational.impact_on_25yo_in_2027.housing.summary":
    "Zero-rate loan with no down payment for first-time buyers under 35, Young Active lease capped 20% below median price.",
  "intergenerational.impact_on_25yo_in_2027.housing.quantified":
    "Rent capped at 80% of median price",
  "intergenerational.impact_on_25yo_in_2027.pension_outlook.summary":
    "Points-based system, possible departure from age 60, 43 contribution years for full rate, guaranteed 65% net replacement rate.",
  "intergenerational.impact_on_25yo_in_2027.pension_outlook.quantified":
    "65% net replacement rate",
  "intergenerational.impact_on_25yo_in_2027.labor_market.summary":
    "UBI, retraining every 10 years, 32-hour week, presumption of employee status for platform workers. Six-month mandatory civic service.",
  "intergenerational.impact_on_25yo_in_2027.labor_market.quantified":
    "€750/month from age 18",
  "intergenerational.impact_on_25yo_in_2027.environmental_debt.summary":
    "Constitutional carbon accounting with automatic provisioning. The -60% GHG target reduces deferral of ecological debt.",
  "intergenerational.impact_on_25yo_in_2027.environmental_debt.quantified":
    "Automatic provision in N+1",
  "intergenerational.impact_on_25yo_in_2027.narrative_summary":
    "For a 25-year-old French citizen in 2027, the program operates a net transfer in their favour: UBI, easier housing, guaranteed retraining, points-based pension from age 60, and reduction of ecological debt. In return, six months of civic service and a transition toward green jobs.",
  "intergenerational.impact_on_65yo_in_2027.fiscal.summary":
    "Partial de-indexation of pensions above €2,500 net. 1% capital contribution from the wealthiest 10% to ring-fence Covid debt.",
  "intergenerational.impact_on_65yo_in_2027.fiscal.quantified":
    "De-indexation threshold: €2,500 net/month",
  "intergenerational.impact_on_65yo_in_2027.pension.summary":
    "Current pensioners are not affected by the points system. Partial de-indexation above €2,500 is the only direct measure.",
  "intergenerational.impact_on_65yo_in_2027.pension.quantified":
    "Threshold: €2,500 net/month",
  "intergenerational.impact_on_65yo_in_2027.healthcare.summary":
    "Hospital budget +5% real. End-of-life legalisation. No specific long-term-care plan.",
  "intergenerational.impact_on_65yo_in_2027.healthcare.quantified":
    "+5% real hospital budget",
  "intergenerational.impact_on_65yo_in_2027.narrative_summary":
    "Mixed effects: improved care (+5% budget), but de-indexation of pensions above €2,500 net and capital contribution from the wealthiest 10%. No long-term-care plan.",

  "intergenerational.horizon_matrix.0.dimension_note":
    "Switch to a points-based system for new entrants; partial de-indexation of pensions above €2,500; minimum contributory benefit at €1,200.",
  "intergenerational.horizon_matrix.0.cells.h_2027_2030.note":
    "Technical transition. De-indexation above €2,500 begins. Effects mainly on new entrants.",
  "intergenerational.horizon_matrix.0.cells.h_2027_2030.per_model.0.note":
    "Technical transition, effects mainly on new entrants.",
  "intergenerational.horizon_matrix.0.cells.h_2031_2037.note":
    "Minimum contributory benefit at €1,200 benefits first-time retirees. First early departures at age 60.",
  "intergenerational.horizon_matrix.0.cells.h_2031_2037.per_model.0.note":
    "Minimum contributory benefit at €1,200 for full minimum-wage career. First retirements from age 60.",
  "intergenerational.horizon_matrix.0.cells.h_2038_2047.note":
    "Points system in steady state. 65% replacement rate for the 25-year-olds of 2027.",
  "intergenerational.horizon_matrix.0.cells.h_2038_2047.per_model.0.note":
    "System in steady state, replacement rate 65%.",

  "intergenerational.horizon_matrix.1.dimension_note":
    "Ring-fencing of Covid debt over 40 years. Green golden rule caps the investment deficit at 2.5% of GDP. Stabilisation targeted at 110% of GDP.",
  "intergenerational.horizon_matrix.1.cells.h_2027_2030.note":
    "Ring-fencing activates but the investment deficit is allowed and major spending commitments run. Stabilisation targeted at 110% of GDP by 2032.",
  "intergenerational.horizon_matrix.1.cells.h_2027_2030.per_model.0.note":
    "Ring-fencing offset by allowed investment deficit. Stabilisation targeted at 110% of GDP.",
  "intergenerational.horizon_matrix.1.cells.h_2031_2037.note":
    "If the 110% of GDP trajectory is reached, the stock stabilises. Covid ring-fencing produces its effects.",
  "intergenerational.horizon_matrix.1.cells.h_2031_2037.per_model.0.note":
    "110% of GDP trajectory reached, Covid ring-fencing produces its effects.",
  "intergenerational.horizon_matrix.1.cells.h_2038_2047.note":
    "Covid ring-fencing at midway. Green investments begin to generate returns.",
  "intergenerational.horizon_matrix.1.cells.h_2038_2047.per_model.0.note":
    "Covid ring-fencing midway, green-investment returns.",

  "intergenerational.horizon_matrix.2.dimension_note":
    "Constitutional -60% GHG by 2035 target, carbon accounting in finance bills, automatic provisioning.",
  "intergenerational.horizon_matrix.2.cells.h_2027_2030.note":
    "Acceleration phase: mandatory F/G renovation, ban on flights under 4 h, motorway moratorium, EPR launch.",
  "intergenerational.horizon_matrix.2.cells.h_2027_2030.per_model.0.note":
    "F/G renovation, flight ban, motorway moratorium, launch of 8 EPRs.",
  "intergenerational.horizon_matrix.2.cells.h_2031_2037.note":
    "-60% GHG target reached. 50% organic farmland. First EPRs operational. Cumulative renovation effects.",
  "intergenerational.horizon_matrix.2.cells.h_2031_2037.per_model.0.note":
    "First EPRs operational, 50% organic farmland, cumulative renovation effects.",
  "intergenerational.horizon_matrix.2.cells.h_2038_2047.note":
    "Steady state after the 2035 target. 8 EPRs operational. Carbon accounting constrains budgets.",
  "intergenerational.horizon_matrix.2.cells.h_2038_2047.per_model.0.note":
    "Steady state post-2035, 8 EPRs operational.",

  "intergenerational.horizon_matrix.3.dimension_note":
    "Hospital budget +5% real, three-year medical service obligation, end-of-life legalisation.",
  "intergenerational.horizon_matrix.3.cells.h_2027_2030.note":
    "Immediate +5% real hospital budget. First doctors in mandatory service.",
  "intergenerational.horizon_matrix.3.cells.h_2027_2030.per_model.0.note":
    "Immediate hospital budget rise and first doctors in mandatory service.",
  "intergenerational.horizon_matrix.3.cells.h_2031_2037.note":
    "Cumulative effects of medical service on coverage of underserved areas. Stabilisation of paramedic numbers.",
  "intergenerational.horizon_matrix.3.cells.h_2031_2037.per_model.0.note":
    "Cumulative effects of mandatory service, stabilisation of paramedics.",
  "intergenerational.horizon_matrix.3.cells.h_2038_2047.note":
    "No structural long-term measure beyond budget and service. No long-term-care plan.",
  "intergenerational.horizon_matrix.3.cells.h_2038_2047.per_model.0.note":
    "No long-term measures beyond budget and service. No long-term-care plan.",

  "intergenerational.horizon_matrix.4.dimension_note":
    "+15% teacher pay raise, classes capped at 20 students, AI and critical-thinking module.",
  "intergenerational.horizon_matrix.4.cells.h_2027_2030.note":
    "Immediate +15% pay raise. Progressive deployment of the 20-student cap. Introduction of AI module.",
  "intergenerational.horizon_matrix.4.cells.h_2027_2030.per_model.0.note":
    "15% pay raise, progressive deployment of 20-student cap, AI module.",
  "intergenerational.horizon_matrix.4.cells.h_2031_2037.note":
    "Full effect of the 20-student cap. AI-module cohorts enter the labour market.",
  "intergenerational.horizon_matrix.4.cells.h_2031_2037.per_model.0.note":
    "Full effect of 20-student cap, AI-module cohorts on the labour market.",
  "intergenerational.horizon_matrix.4.cells.h_2038_2047.note":
    "Long-term effects on human capital. No structural reform of higher education.",
  "intergenerational.horizon_matrix.4.cells.h_2038_2047.per_model.0.note":
    "Long-term effects, no higher-education reform.",

  "intergenerational.horizon_matrix.5.dimension_note":
    "200,000 eco-designed social housing units/year, zero-rate loan for under-35s, Young Active lease at -20%, rent freeze conditional on renovation.",
  "intergenerational.horizon_matrix.5.cells.h_2027_2030.note":
    "Youth zero-rate loan, Young Active lease, ramp-up of social housing toward 200,000/year.",
  "intergenerational.horizon_matrix.5.cells.h_2027_2030.per_model.0.note":
    "Launch of zero-rate loan and Young Active lease, ramp-up of construction.",
  "intergenerational.horizon_matrix.5.cells.h_2031_2037.note":
    "Cumulative effect: 600,000 to 1 million social housing units. Rent freeze + renovation upgrade the stock.",
  "intergenerational.horizon_matrix.5.cells.h_2031_2037.per_model.0.note":
    "600,000 to 1 million social housing units. Rent freeze + renovation.",
  "intergenerational.horizon_matrix.5.cells.h_2038_2047.note":
    "Increased stock. Effect on prices depends on continued pace beyond the term.",
  "intergenerational.horizon_matrix.5.cells.h_2038_2047.per_model.0.note":
    "Stock substantially increased, conditional price effect.",

  // --- counterfactual ---
  "counterfactual.status_quo_trajectory":
    "Without programmatic intervention, France continues a trajectory of rising debt (>110% of GDP), missed climate targets, housing tensions, ageing pressure on pensions, and erosion of institutional trust.",
  "counterfactual.reasoning":
    "The program changes the trajectory across all dimensions. The direction is 'mixed' because environmental and intergenerational improvements are offset by budgetary risks (financing not balanced), execution risks (multiplication of projects), and institutional stability risks (proportional representation, abolition of departments). Two of three models code 'mixed'; one model (GPT) codes 'improvement', emphasising the explicit mechanisms of change.",

  // --- top-level lists ---
  "unsolved_problems.0.problem":
    "Aggregate financing: unresolved gap between new revenue and total spending",
  "unsolved_problems.0.why_unsolved":
    "The program identifies ~€23 bn/year of new revenue against €50 bn/year of investment and a UBI whose gross cost exceeds €150 bn/year. No unified dashboard.",
  "unsolved_problems.1.problem":
    "Long-term care for the elderly (the \"fifth risk\")",
  "unsolved_problems.1.why_unsolved":
    "Demographic ageing makes long-term-care financing unavoidable. The program proposes no dedicated structural measure.",
  "unsolved_problems.2.problem":
    "Operational recruitment pipelines for the expanded public services",
  "unsolved_problems.2.why_unsolved":
    "The program expands labour-intensive services (teachers, caregivers, childcare, police, construction) without detailing recruitment channels.",
  "unsolved_problems.3.problem":
    "Adaptation to climate change (vs mitigation)",
  "unsolved_problems.3.why_unsolved":
    "The program centres on mitigation. Adaptation of infrastructure to unavoidable climate effects is not addressed.",
  "unsolved_problems.4.problem":
    "Specialised nuclear workforce for 8 EPRs",
  "unsolved_problems.4.why_unsolved":
    "The program immediately launches 8 EPRs without a training strategy for the required engineers and welders.",

  "downside_scenarios.0.scenario":
    "Capital flight and erosion of the tax base",
  "downside_scenarios.0.trigger":
    "Climate Wealth Tax, 90% confiscatory inheritance tax, 1-to-20 pay-gap cap and energy nationalisation trigger relocation of head offices and large fortunes.",
  "downside_scenarios.0.reasoning":
    "The French wealth-tax experience (abolished 2018) shows capital outflows. The Climate Wealth Tax is more targeted but the confiscatory tax adds further reasons to relocate. Flagged by all three models.",
  "downside_scenarios.1.scenario":
    "Institutional gridlock from inability to muster constitutional revisions",
  "downside_scenarios.1.trigger":
    "The Congress fails to reach 3/5 for the seven-year term, the citizens' initiative referendum, or constitutional carbon accounting. The program loses its binding levers.",
  "downside_scenarios.1.reasoning":
    "Senators would likely block abolition of departments and the citizens' initiative referendum. Flagged by all three models.",
  "downside_scenarios.2.scenario":
    "Macroeconomic underperformance opening a financing gap",
  "downside_scenarios.2.trigger":
    "Growth below 1.2% and unemployment above 5% while spending commitments are already active.",
  "downside_scenarios.2.reasoning":
    "Fiscal consistency rests on optimistic macro assumptions. Spending front-loaded, revenue back-loaded.",
  "downside_scenarios.3.scenario":
    "Supply crisis during the energy transition",
  "downside_scenarios.3.trigger":
    "LNG ban + EPR delays create an electricity-production deficit at peak hours.",
  "downside_scenarios.3.reasoning":
    "France was a net importer in 2022 during reactor outages. The LNG ban reduces options. Flamanville EPR: 12 years late.",

  // --- agreement_map.contested_claims.*.positions[].position ---
  "agreement_map.contested_claims.0.positions.0.position":
    "B — financing not consolidated",
  "agreement_map.contested_claims.0.positions.1.position":
    "A — direct reach of measures",
  "agreement_map.contested_claims.0.positions.2.position":
    "B — recruitment pipelines not detailed",
  "agreement_map.contested_claims.1.positions.0.position":
    "B — governability risk",
  "agreement_map.contested_claims.1.positions.1.position":
    "A — scope of reforms",
  "agreement_map.contested_claims.1.positions.2.position":
    "B — constitutional execution risks",

  // --- flagged_for_review ---
  "flagged_for_review.0.claim":
    "Gemini uses candidate_id 'omega-synthetique' and version_date '2026-04-20' instead of 'test-omega' and '2027-11-01'",
  "flagged_for_review.0.issue":
    "Metadata mismatch: Gemini's raw output uses different candidate_id and version_date than the canonical values",
  "flagged_for_review.0.suggested_action":
    "Verify that the Gemini analysis was run against the correct sources. The content appears consistent with the same program, so this may be a metadata error during manual ingestion.",
  "flagged_for_review.1.claim":
    "GPT codes counterfactual direction as 'improvement' while Claude and Gemini code 'mixed'",
  "flagged_for_review.1.issue":
    "Dissent on counterfactual direction: GPT emphasises explicit mechanisms of change, while Claude and Gemini weight downside risks more heavily",
  "flagged_for_review.1.suggested_action":
    "Review whether 'mixed' or 'improvement' best captures the aggregate view. Aggregation uses 'mixed' (2/3 majority) but the dissent is preserved in the counterfactual block.",
  "flagged_for_review.2.claim":
    "Magnitude estimate of ~€500/person/year intergenerational transfer",
  "flagged_for_review.2.issue":
    "All three models cite the program's own figure without independent verification. The actual transfer depends on demographic cohort sizes and pension distribution.",
  "flagged_for_review.2.suggested_action":
    "Flag for reviewer: this figure should be treated as program-claimed, not independently validated.",
};

type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

function applyOverrides(node: Json, path: string): Json {
  if (Array.isArray(node)) {
    return node.map((v, i) => applyOverrides(v, `${path}.${i}`));
  }
  if (node !== null && typeof node === "object") {
    const out: { [k: string]: Json } = {};
    for (const [k, v] of Object.entries(node)) {
      const childPath = path === "" ? k : `${path}.${k}`;
      out[k] = applyOverrides(v, childPath);
    }
    return out;
  }
  if (typeof node === "string") {
    const replacement = OVERRIDES[path];
    if (replacement !== undefined) return replacement;
  }
  return node;
}

async function main() {
  const fr = JSON.parse(
    await readFile(resolve(VERSION_DIR, "aggregated.json"), "utf-8"),
  );
  const en = applyOverrides(fr as Json, "");
  await writeFile(
    resolve(VERSION_DIR, "aggregated.en.json"),
    JSON.stringify(en, null, 2) + "\n",
    "utf-8",
  );
  // Count translated paths.
  // eslint-disable-next-line no-console
  console.log(
    `[translate-test-omega] wrote aggregated.en.json with ${Object.keys(OVERRIDES).length} translated paths`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
