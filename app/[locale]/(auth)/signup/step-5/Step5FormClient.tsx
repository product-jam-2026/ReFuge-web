"use client";

import { useMemo, useState } from "react";

type Gender = "male" | "female" | "";
type MaritalStatus = "single" | "married" | "divorced" | "widowed" | "";

type DateParts = { y: string; m: string; d: string };

function pad2(n: string) {
  return n.length === "1".length ? `0${n}` : n;
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

  const dateLabels = labels?.date ?? { year: "Year", month: "Month", day: "Day" };

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 14, opacity: 0.85 }}>{label}</div>

      <div style={{ display: "flex", gap: 10 }}>
        <select value={p.y} onChange={(e) => setP((s) => ({ ...s, y: e.target.value }))}>
          {years.map((y) => (
            <option key={y || "empty"} value={y}>
              {y || dateLabels.year}
            </option>
          ))}
        </select>

        <select value={p.m} onChange={(e) => setP((s) => ({ ...s, m: e.target.value }))}>
          {months.map((m) => (
            <option key={m || "empty"} value={m}>
              {m || dateLabels.month}
            </option>
          ))}
        </select>

        <select value={p.d} onChange={(e) => setP((s) => ({ ...s, d: e.target.value }))}>
          {days.map((d) => (
            <option key={d || "empty"} value={d}>
              {d || dateLabels.day}
            </option>
          ))}
        </select>
      </div>

      <input type="hidden" name={name} value={iso} />
    </div>
  );
}

export default function Step5FormClient({
  labels,
  defaults,
  saveDraftAction,
  saveDraftAndBackAction,
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
  saveDraftAndBackAction: (formData: FormData) => Promise<void>;
  saveAndNextAction: (formData: FormData) => Promise<void>;
}) {
  const L = useMemo(() => labels ?? {}, [labels]);

  const [gender, setGender] = useState<Gender>((defaults.gender as Gender) || "");
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>(
    (defaults.maritalStatus as MaritalStatus) || ""
  );

  const nationalities = useMemo(() => {
    const nat = L.nationalityOptions ?? {};
    const selectLabel = L.select ?? "Select";
    return [
      { value: "", label: selectLabel },
      { value: "Israeli", label: nat.israeli ?? "Israeli" },
      { value: "Sudanese", label: nat.sudanese ?? "Sudanese" },
      { value: "Eritrean", label: nat.eritrean ?? "Eritrean" },
    ];
  }, [L]);

  const countries = useMemo(() => {
    const c = L.countryOptions ?? {};
    const selectLabel = L.select ?? "Select";
    return [
      { value: "", label: selectLabel },
      { value: "Israel", label: c.israel ?? "Israel" },
      { value: "Sudan", label: c.sudan ?? "Sudan" },
      { value: "Eritrea", label: c.eritrea ?? "Eritrea" },
    ];
  }, [L]);

  const maritalOptions = useMemo(() => {
    const m = L.maritalOptions ?? {};
    const selectLabel = L.select ?? "Select";
    return [
      { value: "", label: selectLabel },
      { value: "single", label: m.single ?? "Single" },
      { value: "married", label: m.married ?? "Married" },
      { value: "divorced", label: m.divorced ?? "Divorced" },
      { value: "widowed", label: m.widowed ?? "Widowed" },
    ];
  }, [L]);

  return (
    <>
      <h1 style={{ marginBottom: 4 }}>{L.title ?? "Step 5"}</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>{L.subtitle ?? ""}</p>

      <form action={saveDraftAction} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <h3 style={{ marginTop: 6 }}>{L.sections?.partner ?? "Partner / Guardian"}</h3>

        <label>
          {L.fields?.lastName ?? "Last name"}
          <input name="lastName" defaultValue={defaults.lastName} style={{ width: "100%", marginTop: 6 }} />
        </label>

        <label>
          {L.fields?.firstName ?? "First name"}
          <input name="firstName" defaultValue={defaults.firstName} style={{ width: "100%", marginTop: 6 }} />
        </label>

        <label>
          {L.fields?.oldLastName ?? "Previous last name"}
          <input name="oldLastName" defaultValue={defaults.oldLastName} style={{ width: "100%", marginTop: 6 }} />
        </label>

        <label>
          {L.fields?.oldFirstName ?? "Previous first name"}
          <input name="oldFirstName" defaultValue={defaults.oldFirstName} style={{ width: "100%", marginTop: 6 }} />
        </label>

        <div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>{L.fields?.gender ?? "Gender"}</div>
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
              {L.genderOptions?.male ?? "Male"}
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
              {L.genderOptions?.female ?? "Female"}
            </button>
          </div>

          <input type="hidden" name="gender" value={gender} />
        </div>

        <DateWheel label={L.fields?.birthDate ?? "Birth date"} name="birthDate" initialIso={defaults.birthDate} labels={L} />

        <label>
          {L.fields?.nationality ?? "Nationality"}
          <select name="nationality" defaultValue={defaults.nationality || ""} style={{ width: "100%", marginTop: 6 }}>
            {nationalities.map((opt) => (
              <option key={opt.value || "empty"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          {L.fields?.israeliId ?? "Israeli ID"}
          <input
            name="israeliId"
            inputMode="numeric"
            pattern="\d*"
            defaultValue={defaults.israeliId}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <h3 style={{ marginTop: 10 }}>{L.sections?.passport ?? "Passport"}</h3>

        <label>
          {L.fields?.passportNumber ?? "Passport number"}
          <input name="passportNumber" defaultValue={defaults.passportNumber} style={{ width: "100%", marginTop: 6 }} />
        </label>

        <DateWheel
          label={L.fields?.passportIssueDate ?? "Passport issue date"}
          name="passportIssueDate"
          initialIso={defaults.passportIssueDate}
          labels={L}
        />

        <DateWheel
          label={L.fields?.passportExpiryDate ?? "Passport expiry date"}
          name="passportExpiryDate"
          initialIso={defaults.passportExpiryDate}
          labels={L}
        />

        <label>
          {L.fields?.passportIssueCountry ?? "Passport issuing country"}
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

        <h3 style={{ marginTop: 10 }}>{L.sections?.status ?? "Marital status"}</h3>

        <label>
          {L.fields?.maritalStatus ?? "Marital status"}
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

        <DateWheel label={L.fields?.statusDate ?? "Wedding date"} name="statusDate" initialIso={defaults.statusDate} labels={L} />

        <h3 style={{ marginTop: 10 }}>{L.sections?.contact ?? "Contact"}</h3>

        <label>
          {L.fields?.phone ?? "Phone"}
          <input name="phone" inputMode="tel" defaultValue={defaults.phone} style={{ width: "100%", marginTop: 6 }} />
        </label>

        <label>
          {L.fields?.email ?? "Email"}
          <input name="email" inputMode="email" defaultValue={defaults.email} style={{ width: "100%", marginTop: 6 }} />
        </label>

        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          <button formAction={saveDraftAction} type="submit">
            {L.buttons?.saveDraft ?? "Save draft"}
          </button>

          {/* ✅ חדש: שמור וחזור */}
          <button formAction={saveDraftAndBackAction} type="submit">
            {L.buttons?.saveDraftBack ?? "Save & Back"}
          </button>

          <button formAction={saveAndNextAction} type="submit">
  {L.buttons?.saveContinue ?? "Save & Continue"}
</button>

        </div>
      </form>
    </>
  );
}
