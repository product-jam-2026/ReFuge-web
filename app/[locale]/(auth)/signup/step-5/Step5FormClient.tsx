"use client";

import { useMemo, useState } from "react";

type Gender = "male" | "female" | "";
type MaritalStatus = "single" | "married" | "divorced" | "widowed" | "";

type DateParts = { y: string; m: string; d: string };

function pad2(n: string) {
  return n.length === 1 ? `0${n}` : n;
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
  const arr: number[] = [];
  for (let i = from; i <= to; i++) arr.push(i);
  return arr;
}

function DateWheel({
  label,
  name,
  initialIso,
  labels,
}: {
  label: string;
  name: string; // hidden input name
  initialIso: string;
  labels: any;
}) {
  const init = isoToParts(initialIso);
  const [p, setP] = useState<DateParts>(init);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return ["", ...range(now - 90, now).reverse().map(String)];
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

      {/* זה מה שנשמר ל-DB: YYYY-MM-DD */}
      <input type="hidden" name={name} value={iso} />
    </div>
  );
}

export default function Step5FormClient({
  labels,
  defaults,
  saveDraftAction,
  saveAndNextAction,
}: {
  labels: any;
  defaults: {
    lastName: string;
    firstName: string;
    oldLastName: string;
    oldFirstName: string;
    gender: string;
    birthDate: string;
    nationality: string;
    israeliId: string;
    passportNumber: string;
    passportIssueDate: string;
    passportExpiryDate: string;
    passportIssueCountry: string;
    maritalStatus: string;
    statusDate: string;
    phone: string;
    email: string;
  };
  saveDraftAction: (formData: FormData) => Promise<void>;
  saveAndNextAction: (formData: FormData) => Promise<void>;
}) {
  const [gender, setGender] = useState<Gender>((defaults.gender as Gender) || "");
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>(
    (defaults.maritalStatus as MaritalStatus) || ""
  );

  const nationalities = useMemo(
    () => [
      { value: "", label: labels.select },
      { value: "Israeli", label: labels.nationalities.israeli },
      { value: "Sudanese", label: labels.nationalities.sudanese },
      { value: "Eritrean", label: labels.nationalities.eritrean },
    ],
    [labels]
  );

  const countries = useMemo(
    () => [
      { value: "", label: labels.select },
      { value: "Israel", label: labels.countries.israel },
      { value: "Sudan", label: labels.countries.sudan },
      { value: "Eritrea", label: labels.countries.eritrea },
    ],
    [labels]
  );

  const maritalOptions = useMemo(
    () => [
      { value: "", label: labels.select },
      { value: "single", label: labels.marital.single },
      { value: "married", label: labels.marital.married },
      { value: "divorced", label: labels.marital.divorced },
      { value: "widowed", label: labels.marital.widowed },
    ],
    [labels]
  );

  return (
    <>
      <h1 style={{ marginBottom: 4 }}>{labels.title}</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>{labels.subtitle}</p>

      <form action={saveAndNextAction} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <h3 style={{ marginTop: 6 }}>{labels.sections.partner}</h3>

        <label>
          {labels.fields.lastName}
          <input name="lastName" defaultValue={defaults.lastName} style={{ width: "100%", marginTop: 6 }} />
        </label>

        <label>
          {labels.fields.firstName}
          <input name="firstName" defaultValue={defaults.firstName} style={{ width: "100%", marginTop: 6 }} />
        </label>

        <label>
          {labels.fields.oldLastName}
          <input name="oldLastName" defaultValue={defaults.oldLastName} style={{ width: "100%", marginTop: 6 }} />
        </label>

        <label>
          {labels.fields.oldFirstName}
          <input name="oldFirstName" defaultValue={defaults.oldFirstName} style={{ width: "100%", marginTop: 6 }} />
        </label>

        <div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>{labels.fields.gender}</div>
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

          {/* נשמר ל-DB */}
          <input type="hidden" name="gender" value={gender} />
        </div>

        <DateWheel
          label={labels.fields.birthDate}
          name="birthDate"
          initialIso={defaults.birthDate}
          labels={labels}
        />

        <label>
          {labels.fields.nationality}
          <select
            name="nationality"
            defaultValue={defaults.nationality || ""}
            style={{ width: "100%", marginTop: 6 }}
          >
            {nationalities.map((opt) => (
              <option key={opt.value || "empty"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          {labels.fields.israeliId}
          <input
            name="israeliId"
            inputMode="numeric"
            pattern="\d*"
            defaultValue={defaults.israeliId}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <h3 style={{ marginTop: 10 }}>{labels.sections.passport}</h3>

        <label>
          {labels.fields.passportNumber}
          <input
            name="passportNumber"
            defaultValue={defaults.passportNumber}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <DateWheel
          label={labels.fields.passportIssueDate}
          name="passportIssueDate"
          initialIso={defaults.passportIssueDate}
          labels={labels}
        />

        <DateWheel
          label={labels.fields.passportExpiryDate}
          name="passportExpiryDate"
          initialIso={defaults.passportExpiryDate}
          labels={labels}
        />

        <label>
          {labels.fields.passportIssueCountry}
          <select
            name="passportIssueCountry"
            defaultValue={defaults.passportIssueCountry || ""}
            style={{ width: "100%", marginTop: 6 }}
          >
            {countries.map((opt) => (
              <option key={opt.value || "empty"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <h3 style={{ marginTop: 10 }}>{labels.sections.status}</h3>

        <label>
          {labels.fields.maritalStatus}
          <select
            name="maritalStatus"
            value={maritalStatus}
            onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)}
            style={{ width: "100%", marginTop: 6 }}
          >
            {maritalOptions.map((opt) => (
              <option key={opt.value || "empty"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <DateWheel
          label={labels.fields.statusDate}
          name="statusDate"
          initialIso={defaults.statusDate}
          labels={labels}
        />

        <h3 style={{ marginTop: 10 }}>{labels.sections.contact}</h3>

        <label>
          {labels.fields.phone}
          <input
            name="phone"
            inputMode="tel"
            defaultValue={defaults.phone}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <label>
          {labels.fields.email}
          <input
            name="email"
            inputMode="email"
            defaultValue={defaults.email}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          <button formAction={saveDraftAction} type="submit">
            {labels.buttons.saveDraft}
          </button>
          <button type="submit">{labels.buttons.saveContinue}</button>
        </div>
      </form>
    </>
  );
}
