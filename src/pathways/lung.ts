import type { Pathway } from "../ontology/schema";

/**
 * Lung cancer pathway, encoded from docs/13-lung-pathway-sources.md.
 * Finland has no national lung criteria or step targets yet (roadmap 3.1.2,
 * 2.5.2), so Swedish SVF v1.4 is the backbone, with Danish and Finnish
 * regional criteria alongside. Patient self-report can only reach suspicion
 * level; a nurse confirms every case.
 */
export const lung = {
  id: "lung",
  version: "0.1.0",
  name: "Lung cancer (placeholder until Finland's national pathway exists)",
  sources: [
    {
      id: "SE-SVF",
      title: "RCC i samverkan, Standardiserat vårdförlopp lungcancer v1.4 (2024-11-05)",
      url: "https://kunskapsbanken.cancercentrum.se/diagnoser/lungcancer/vardforlopp/",
      verification: "read",
    },
    {
      id: "DK-SYD",
      title: "sundhed.dk, Region Syddanmark GP guidance: Lungecancer (2021-04-21)",
      url: "https://www.sundhed.dk/sundhedsfaglig/information-til-praksis/syddanmark/almen-praksis/patientbehandling/patientforloeb/kraeftpakker/lungecancer/",
      verification: "read",
    },
    {
      id: "FI-PIRHA",
      title: "Pirkanmaan hyvinvointialue, Keuhkosyöpäpotilaan hoitopolku (2026-08-19)",
      url: "https://www.pirha.fi/asiakkaalle/hoito-ja-palvelupolut/keuhkosyopapotilaan-hoitopolku",
      verification: "read",
    },
    {
      id: "POLKU",
      title: "Polku design choice (not from a published pathway)",
      url: "https://github.com/3nd3r1/polku/blob/main/docs/17-build-plan.md",
      verification: "design_choice",
    },
  ],
  criteria: [
    {
      id: "RF-112",
      level: "emergency",
      sourceId: "POLKU",
      quote: "Red-flag symptoms always return 'call 112', enforced in the engine.",
      gloss: "Heavy bleeding when coughing, severe breathlessness, or sudden severe chest pain",
      when: { anyOf: ["HAEMOPTYSIS_MASSIVE", "DYSPNOEA_SEVERE", "CHEST_PAIN_ACUTE_SEVERE"] },
    },
    {
      id: "SE-V3",
      level: "well_founded",
      sourceId: "SE-SVF",
      quote: "upprepad blodig hosta utan annan uppenbar orsak, även vid normal röntgen",
      gloss: "Repeated bloody cough without other obvious cause, even with a normal X-ray",
      when: { anyOf: ["HAEMOPTYSIS_REPEATED"], unexplained: true },
    },
    {
      id: "SE-M1",
      level: "suspicion",
      sourceId: "SE-SVF",
      quote:
        "nytillkomna luftvägssymtom (t.ex. hosta eller andnöd) med en varaktighet av 6 veckor hos rökare eller före detta rökare över 40 år",
      gloss: "New cough or breathlessness lasting 6 weeks in a smoker or ex-smoker over 40",
      when: {
        anyOf: ["COUGH_NEW", "DYSPNOEA_NEW"],
        minDays: 42,
        ageOver: 40,
        smoking: ["current", "former"],
      },
    },
    {
      id: "SE-M2",
      level: "suspicion",
      sourceId: "SE-SVF",
      quote: "bröst- eller skuldersmärta utan annan förklaring",
      gloss: "Chest or shoulder pain without other explanation",
      when: { anyOf: ["CHEST_PAIN", "SHOULDER_PAIN"], unexplained: true },
    },
    {
      id: "SE-M3",
      level: "suspicion",
      sourceId: "SE-SVF",
      quote: "blodig hosta",
      gloss: "Bloody cough",
      when: { anyOf: ["HAEMOPTYSIS", "HAEMOPTYSIS_REPEATED"] },
    },
    {
      id: "DK-1",
      level: "suspicion",
      sourceId: "DK-SYD",
      quote:
        "Diagnosen lungecancer skal overvejes hos personer over 40 år, specielt tidligere eller nuværende rygere, med uforklarlige luftvejssymptomer. Hoste af mere end 4-6 ugers varighed hos tidligere lungerask person",
      gloss: "Unexplained cough over 4-6 weeks in a person over 40 (lower bound of 4 weeks used)",
      when: { anyOf: ["COUGH_NEW"], minDays: 28, ageOver: 40, unexplained: true },
    },
    {
      id: "DK-4",
      level: "suspicion",
      sourceId: "DK-SYD",
      quote: "Hæmoptyse uanset alder og tobaksanamnese",
      gloss: "Haemoptysis regardless of age and smoking history",
      when: { anyOf: ["HAEMOPTYSIS", "HAEMOPTYSIS_REPEATED"] },
    },
    {
      id: "FI-P1-WEIGHT",
      level: "gp_advice",
      sourceId: "FI-PIRHA",
      quote: "selittämätön painon lasku",
      gloss: "Unexplained weight loss: see a doctor",
      when: { anyOf: ["WEIGHT_LOSS_UNEXPLAINED"] },
    },
    {
      id: "FI-P1-3WK",
      level: "gp_advice",
      sourceId: "FI-PIRHA",
      quote:
        "yskä tai yskän paheneminen yli kolmen viikon ajan · hengenahdistus yli kolmen viikon ajan · rintakehän tai hartian kipu yli kolmen viikon ajan · äänen käheys yli kolmen viikon ajan",
      gloss: "Cough, worsening cough, breathlessness, chest or shoulder pain, or hoarseness for over 3 weeks: see a doctor",
      when: {
        anyOf: ["COUGH_NEW", "COUGH_WORSENING", "DYSPNOEA_NEW", "CHEST_PAIN", "SHOULDER_PAIN", "HOARSENESS"],
        minDays: 22, // "yli kolmen viikon" = more than 21 days
      },
    },
  ],
  steps: [
    {
      id: "callback",
      name: "Nurse callback",
      clockStart: "Intake submitted",
      clockStop: "Callback logged",
      maxDays: 2,
      sourceId: "POLKU",
      note: "No Nordic source defines this. Nearest precedent: Pirha processes lung referrals in 1-2 working days.",
    },
    {
      id: "primary_assessment",
      name: "Primary-care assessment and imaging",
      clockStart: "Referral decision on suspicion",
      clockStop: "Decision on well-founded suspicion",
      maxDays: 10,
      sourceId: "SE-SVF",
      note: "1 + 5 + 1 + 3 days (referral, X-ray/CT, report, decision)",
    },
    {
      id: "referral",
      name: "Referral to specialist",
      clockStart: "Well-founded suspicion decided",
      clockStop: "Referral received and assessed",
      maxDays: 2,
      sourceId: "SE-SVF",
    },
    {
      id: "first_visit",
      name: "First specialist visit",
      clockStart: "Referral assessed",
      clockStop: "First visit",
      maxDays: 5,
      sourceId: "SE-SVF",
    },
    {
      id: "diagnostics",
      name: "Diagnostics to MDT",
      clockStart: "First visit",
      clockStop: "First MDT meeting",
      maxDays: 21,
      sourceId: "SE-SVF",
    },
    {
      id: "mdt_decision",
      name: "MDT decision",
      clockStart: "First MDT meeting",
      clockStop: "Treatment decision",
      maxDays: 2,
      sourceId: "SE-SVF",
    },
    {
      id: "treatment_start",
      name: "Treatment start",
      clockStart: "Treatment decision",
      clockStop: "First treatment",
      maxDays: 14,
      sourceId: "SE-SVF",
      note: "Surgery and radiotherapy 14 days; drug treatment 10 days.",
    },
  ],
} as const satisfies Pathway;
