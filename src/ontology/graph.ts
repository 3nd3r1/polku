import { lung } from "../pathways/lung";
import type { CallView } from "../server/calls";
import type { CaseView } from "../server/cases";
import type { Person } from "../sim/people";
import { key, type OntGraph, type OntLink, type OntObject } from "./meta";
import { SYMPTOM_LABEL } from "./labels";
import { SymptomCode } from "./schema";
import { CAPABILITIES, capabilityName, COUNTIES, countyByName, FACILITIES, facility, RESOURCES } from "./world";

const WEEKDAY = ["", "Mon", "Tue", "Wed", "Thu", "Fri"];
const stamp = (iso: string) => new Date(iso).toLocaleString("sv-SE", { timeZone: "Europe/Helsinki" }).slice(0, 16);

/** Builds the instance graph from the care data, the pathway definition and live cases. */
export function buildGraph(people: readonly Person[], calls: CallView[], cases: CaseView[]): OntGraph {
  const objects: OntObject[] = [];
  const links: OntLink[] = [];
  const link = (type: string, from: string, to: string) => links.push({ type, from, to });

  for (const c of COUNTIES) {
    objects.push({ key: key("County", c.id), type: "County", title: c.name, provenance: "real", sourceUrl: c.website, props: { website: c.website } });
  }
  for (const f of FACILITIES) {
    objects.push({
      key: key("Facility", f.id),
      type: "Facility",
      title: f.name,
      subtitle: f.city,
      provenance: "real",
      props: { city: f.city, kind: f.kind.replace("_", " ") },
    });
    link("facility_in", key("Facility", f.id), key("County", f.countyId));
  }
  for (const c of CAPABILITIES) {
    objects.push({ key: key("Capability", c.id), type: "Capability", title: c.name, provenance: "design", props: {} });
  }
  for (const r of RESOURCES) {
    const k = key("Resource", r.id);
    objects.push({
      key: k,
      type: "Resource",
      title: `${r.name}`,
      subtitle: `${facility(r.facilityId).name} · first free in ${r.leadDays} d`,
      provenance: "synthetic",
      props: {
        sessions: `${r.weekdays.map((d) => WEEKDAY[d]).join(" ")} · ${r.times.join(", ")}`,
        "first free": `in ${r.leadDays} days`,
        anchor: r.anchor ?? null,
      },
    });
    link("resource_at", k, key("Facility", r.facilityId));
    link("provides", k, key("Capability", r.capabilityId));
  }

  const p = key("Pathway", lung.id);
  objects.push({ key: p, type: "Pathway", title: "Lung cancer", subtitle: `v${lung.version}`, provenance: "design", props: { version: lung.version } });
  const sourceUrl = (id: string) => lung.sources.find((s) => s.id === id)?.url;
  for (const s of lung.sources) {
    objects.push({
      key: key("Source", s.id),
      type: "Source",
      title: s.id,
      subtitle: s.title,
      provenance: s.verification === "design_choice" ? "design" : "real",
      sourceUrl: s.url,
      props: { title: s.title, verification: s.verification.replace("_", " ") },
    });
  }
  lung.steps.forEach((s, i) => {
    const k = key("Step", s.id);
    objects.push({
      key: k,
      type: "Step",
      title: s.name,
      subtitle: `max ${s.maxDays} days`,
      provenance: s.sourceId === "POLKU" ? "design" : "real",
      sourceUrl: sourceUrl(s.sourceId),
      props: { "max days": s.maxDays, "clock starts": s.clockStart, "clock stops": s.clockStop, needs: "requires" in s ? capabilityName(s.requires) : null },
    });
    link("step_of", k, p);
    link("step_cites", k, key("Source", s.sourceId));
    if ("requires" in s) link("requires", k, key("Capability", s.requires));
    const next = lung.steps[i + 1];
    if (next) link("next_step", k, key("Step", next.id));
  });
  for (const code of SymptomCode.options) {
    objects.push({ key: key("Symptom", code), type: "Symptom", title: SYMPTOM_LABEL[code], provenance: "design", props: {} });
  }
  for (const c of lung.criteria) {
    const k = key("Criterion", c.id);
    objects.push({
      key: k,
      type: "Criterion",
      title: c.id,
      subtitle: c.gloss,
      provenance: c.sourceId === "POLKU" ? "design" : "real",
      sourceUrl: sourceUrl(c.sourceId),
      props: { level: c.level.replace("_", " "), rule: c.gloss },
    });
    link("criterion_of", k, p);
    link("cites", k, key("Source", c.sourceId));
    for (const code of c.when.anyOf) link("on_symptom", k, key("Symptom", code));
  }

  for (const person of people) {
    const k = key("Person", person.id);
    objects.push({ key: k, type: "Person", title: person.name, subtitle: person.county, provenance: "synthetic", props: { born: person.birthYear, phone: person.phone } });
    const county = countyByName(person.county);
    if (county) link("lives_in", k, key("County", county.id));
  }
  for (const call of calls) {
    const k = key("Call", call.id);
    objects.push({
      key: k,
      type: "Call",
      title: `Call ${stamp(call.startedAt)}`,
      subtitle: call.person?.name ?? "Not identified",
      provenance: "synthetic",
      props: { status: call.status, started: stamp(call.startedAt), identified: call.verifiedAt ? stamp(call.verifiedAt) : null, turns: call.transcript.length },
    });
    if (call.person) link("places", key("Person", call.person.id), k);
  }
  for (const c of cases) {
    const k = key("Case", c.id);
    objects.push({
      key: k,
      type: "Case",
      title: c.person?.name ?? "Unidentified caller",
      subtitle: c.status.replace("_", " "),
      provenance: "synthetic",
      props: { outcome: c.outcome.replace("_", " "), status: c.status.replace("_", " "), opened: stamp(c.createdAt), county: c.county },
    });
    if (c.callId && calls.some((x) => x.id === c.callId)) link("opens", key("Call", c.callId), k);
    for (const m of new Set(c.matches.map((x) => x.criterionId))) link("matched", k, key("Criterion", m));
    c.clocks.forEach((clock, i) => {
      const ck = key("Clock", `${c.id}-${i}`);
      const step = lung.steps.find((s) => s.id === clock.stepId);
      objects.push({
        key: ck,
        type: "Clock",
        title: `${step?.name ?? clock.stepId}`,
        subtitle: `${c.person?.name ?? "Case"} · ${clock.stoppedAt ? "stopped" : "running"}`,
        provenance: "synthetic",
        props: { started: stamp(clock.startedAt), due: stamp(clock.dueAt), stopped: clock.stoppedAt ? stamp(clock.stoppedAt) : null },
      });
      link("starts", k, ck);
      link("times", ck, key("Step", clock.stepId));
      if (!clock.scheduledAt) return;
      const ak = key("Appointment", `${c.id}-${i}`);
      const resource = RESOURCES.find(
        (r) => step && "requires" in step && r.capabilityId === step.requires && clock.unit?.startsWith(facility(r.facilityId).name),
      );
      objects.push({
        key: ak,
        type: "Appointment",
        title: `${resource?.name ?? step?.name ?? "Appointment"} ${stamp(clock.scheduledAt)}`,
        subtitle: `${c.person?.name ?? "Case"} · ${clock.unit ?? ""}`,
        provenance: "synthetic",
        props: { at: stamp(clock.scheduledAt), where: clock.unit, due: stamp(clock.dueAt), "within target": clock.scheduledAt <= clock.dueAt },
      });
      link("books", ck, ak);
      if (resource) link("on", ak, key("Resource", resource.id));
    });
  }
  return { objects, links };
}
