"use client";

import { useMemo, useState } from "react";

type DateParts = { y: string; m: string; d: string };
type Gender = "male" | "female" | "";

function pad2(s: string) {
  return s.length === 1 ? `0${s}` : s;
}
function partsToIso(p: DateParts) {
  if (!p.y || !p.m || !p.d) return "";
  return `${p.y}-${pad2(p.m)}-${pad2(p.d)}`;
}
function isoToParts(iso: string): DateParts {
  if (!iso || typeof iso !== "string") return { y: "", m: "", d: "" };
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return { y: "", m: "", d: "" };
  return { y: m[1], m: String(Number(m[2])), d: String(Number(m[3])) };
}
function range(from: number, to: number) {
  const out: number[] = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
}

function DateWheel({
  label,
  name,
  initialIso,
  labels,
}: {
  label: string;
  name: string;
  initialIso: string;
  labels: any;
}) {
  const [p, setP] = useState<DateParts>(isoToParts(initialIso));

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return ["", ...range(now - 30, now).reverse().map(String)];
  }, []);
  const months = useMemo(() => ["", ...range(1, 12).map(String)], []);
  const days = useMemo(() => ["", ...range(1, 31).map(String)], []);

  const iso = partsToIso(p);

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 14, opacity: 0.85 }}>{label}</div>
      <div style={{ display: "flex", gap: 10 }}>
        <select value={p.y} onChange={(e) => setP((s) => ({ ...s, y: e.target.value }))}>
          {years.map((y) => (
            <option key={y || "empty"} value={y}>
              {y || labels.date.year}
            </option>
          ))}
        </select>
        <select value={p.m} onChange={(e) => setP((s) => ({ ...s, m: e.target.value }))}>
          {months.map((m) => (
            <option key={m || "empty"} value={m}>
              {m || labels.date.month}
            </option>
          ))}
        </select>
        <select value={p.d} onChange={(e) => setP((s) => ({ ...s, d: e.target.value }))}>
          {days.map((d) => (
            <option key={d || "empty"} value={d}>
              {d || labels.date.day}
            </option>
          ))}
        </select>
      </div>
      <input type="hidden" name={name} value={iso} />
    </div>
  );
}

export default function Step6FormClient({
  labels,
  defaults,
  saveDraftAction,
  finishAction,
}: {
  labels: any;
  defaults: Record<string, string>;
  saveDraftAction: (formData: FormData) => Promise<void>;
  finishAction: (formData: FormData) => Promise<void>;
}) {
  const [gender, setGender] = useState<Gender>((defaults.childGender as Gender) || "");
  const [birthCountry, setBirthCountry] = useState<string>(defaults.childResidenceCountry || "");

  const countries = useMemo(
    () => [
      { value: "", label: labels.select },
      { value: "Israel", label: labels.countryOptions.israel },
      { value: "Sudan", label: labels.countryOptions.sudan },
      { value: "Eritrea", label: labels.countryOptions.eritrea },
    ],
    [labels]
  );

  // דוגמה זמנית: ערים תלויות מדינה (כמו שעשינו ב-Step2)
  const citiesByCountry: Record<string, { value: string; label: string }[]> = useMemo(
    () => ({
      "": [{ value: "", label: labels.select }],
      Israel: [
        { value: "", label: labels.select },
        { value: "Jerusalem", label: labels.cityOptions.jerusalem },
        { value: "Tel Aviv", label: labels.cityOptions.telAviv },
        { value: "Haifa", label: labels.cityOptions.haifa },
      ],
      Sudan: [
        { value: "", label: labels.select },
        { value: "Khartoum", label: labels.cityOptions.khartoum },
        { value: "Omdurman", label: labels.cityOptions.omdurman },
      ],
      Eritrea: [
        { value: "", label: labels.select },
        { value: "Asmara", label: labels.cityOptions.asmara },
      ],
    }),
    [labels]
  );

  const birthCities = citiesByCountry[birthCountry] || citiesByCountry[""];

  const nationalities = useMemo(
    () => [
      { value: "", label: labels.select },
      { value: "Israeli", label: labels.nationalityOptions.israeli },
      { value: "Sudanese", label: labels.nationalityOptions.sudanese },
      { value: "Eritrean", label: labels.nationalityOptions.eritrean },
    ],
    [labels]
  );

  const reasons = useMemo(
    () => [
      { value: "", label: labels.select },
      { value: "safety", label: labels.arrivalReasons.safety },
      { value: "family", label: labels.arrivalReasons.family },
      { value: "other", label: labels.arrivalReasons.other },
    ],
    [labels]
  );

  return (
    <>
      <h1 style={{ marginBottom: 4 }}>{labels.title}</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>{labels.subtitle}</p>

      <form action={finishAction} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <h3 style={{ marginTop: 6 }}>{labels.sections.child}</h3>

        <label>
          {labels.fields.childLastName}
          <input name="childLastName" defaultValue={defaults.childLastName || ""} style={{ width: "100%", marginTop: 6 }} />
        </label>

        <label>
          {labels.fields.childFirstName}
          <input name="childFirstName" defaultValue={defaults.childFirstName || ""} style={{ width: "100%", marginTop: 6 }} />
        </label>

        <div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>{labels.fields.childGender}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setGender("male")}
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                border: "1px solid #ccc",
                background: gender === "male" ? "#0b1b2a" : "white",
                color: gender === "male" ? "white" : "#111",
              }}
            >
              {labels.genderOptions.male}
            </button>
            <button
              type="button"
              onClick={() => setGender("female")}
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                border: "1px solid #ccc",
                background: gender === "female" ? "#0b1b2a" : "white",
                color: gender === "female" ? "white" : "#111",
              }}
            >
              {labels.genderOptions.female}
            </button>
          </div>
          <input type="hidden" name="childGender" value={gender} />
        </div>

        <DateWheel
          label={labels.fields.childBirthDate}
          name="childBirthDate"
          initialIso={defaults.childBirthDate || ""}
          labels={labels}
        />

        <label>
          {labels.fields.childNationality}
          <select name="childNationality" defaultValue={defaults.childNationality || ""} style={{ width: "100%", marginTop: 6 }}>
            {nationalities.map((o) => (
              <option key={o.value || "empty"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          {labels.fields.childIsraeliId}
          <input
            name="childIsraeliId"
            inputMode="numeric"
            pattern="\d*"
            defaultValue={defaults.childIsraeliId || ""}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <label>
          {labels.fields.childResidenceCountry}
          <select
            name="childResidenceCountry"
            value={birthCountry}
            onChange={(e) => setBirthCountry(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          >
            {countries.map((o) => (
              <option key={o.value || "empty"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          {labels.fields.childBirthCity}
          <select name="childBirthCity" defaultValue={defaults.childBirthCity || ""} style={{ width: "100%", marginTop: 6 }}>
            {birthCities.map((o) => (
              <option key={o.value || "empty"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          {labels.fields.childResidenceCity}
          <select name="childResidenceCity" defaultValue={defaults.childResidenceCity || ""} style={{ width: "100%", marginTop: 6 }}>
            {/* כרגע משתמשים באותה רשימה — בהמשך אפשר לעשות תלוית-מדינה אחרת */}
            {birthCities.map((o) => (
              <option key={o.value || "empty"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <DateWheel
          label={labels.fields.childEntryDate}
          name="childEntryDate"
          initialIso={defaults.childEntryDate || ""}
          labels={labels}
        />

        <DateWheel
          label={labels.fields.childArrivalToIsraelDate}
          name="childArrivalToIsraelDate"
          initialIso={defaults.childArrivalToIsraelDate || ""}
          labels={labels}
        />

        <label>
          {labels.fields.childArrivalToIsraelReason}
          <select
            name="childArrivalToIsraelReason"
            defaultValue={defaults.childArrivalToIsraelReason || ""}
            style={{ width: "100%", marginTop: 6 }}
          >
            {reasons.map((o) => (
              <option key={o.value || "empty"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          <button formAction={saveDraftAction} type="submit">
            {labels.buttons.saveDraft}
          </button>
          <button type="submit">{labels.buttons.finish}</button>
        </div>
      </form>
    </>
  );
}
