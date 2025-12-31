"use client";

import { useMemo, useState } from "react";

type DateParts = { y: string; m: string; d: string };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toISO({ y, m, d }: DateParts) {
  if (!y || !m || !d) return "";
  return `${y}-${m}-${d}`;
}

function compareISO(a: string, b: string) {
  // lexicographic works for YYYY-MM-DD
  if (!a || !b) return 0;
  return a < b ? -1 : a > b ? 1 : 0;
}

export default function Step2FormClient({
  labels,
  defaults,
  saveDraftAction,
  saveAndNextAction,
  saveDraftAndBackAction,
}: {
  labels: any;
  defaults: {
    residenceCountry: string;
    residenceCity: string;
    residenceAddress: string;
    visaType: string;
    visaStartDate: DateParts;
    visaEndDate: DateParts;
    entryDate: DateParts;
  };
  saveDraftAction: (formData: FormData) => Promise<void>;
  saveAndNextAction: (formData: FormData) => Promise<void>;
  saveDraftAndBackAction: (formData: FormData) => Promise<void>;
}) {
  const nowYear = new Date().getFullYear();

  const yearsEntry = useMemo(
    () => Array.from({ length: 40 }, (_, i) => String(nowYear - 10 + i)),
    [nowYear]
  );
  const yearsVisa = yearsEntry;
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => pad2(i + 1)), []);
  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => pad2(i + 1)), []);

  // Countries available right now (expand easily)
  const countryOptions = useMemo(
    () => [
      { value: "", label: labels.selectCountry },
      { value: "Sudan", label: labels.countries.sudan },
      { value: "Eritrea", label: labels.countries.eritrea },
      { value: "Israel", label: labels.countries.israel },
      { value: "Ukraine", label: labels.countries.ukraine },
      { value: "Russia", label: labels.countries.russia },
    ],
    [labels]
  );

  // Cities by country (dynamic)
  const citiesByCountry = useMemo(
    () => ({
      Sudan: [
        { value: "Khartoum", label: labels.cities.khKhartoum },
        { value: "Omdurman", label: labels.cities.khOmdurman },
        { value: "Port Sudan", label: labels.cities.portSudan },
      ],
      Eritrea: [
        { value: "Asmara", label: labels.cities.asmara },
        { value: "Keren", label: labels.cities.keren },
        { value: "Massawa", label: labels.cities.massawa },
      ],
      Israel: [
        { value: "Jerusalem", label: labels.cities.jerusalem },
        { value: "Tel Aviv", label: labels.cities.telAviv },
        { value: "Haifa", label: labels.cities.haifa },
      ],
      Ukraine: [],
      Russia: [],
    }),
    [labels]
  );

  const [country, setCountry] = useState<string>(defaults.residenceCountry || "");
  const [city, setCity] = useState<string>(defaults.residenceCity || "");

  // Visa date parts state for live validation
  const [visaStart, setVisaStart] = useState<DateParts>(defaults.visaStartDate);
  const [visaEnd, setVisaEnd] = useState<DateParts>(defaults.visaEndDate);

  const visaStartISO = toISO(visaStart);
  const visaEndISO = toISO(visaEnd);
  const visaRangeBad =
    Boolean(visaStartISO && visaEndISO) && compareISO(visaEndISO, visaStartISO) < 0;

  const availableCities = useMemo(() => {
    const list = (citiesByCountry as any)[country] || [];
    return [{ value: "", label: labels.selectCity }, ...list];
  }, [country, citiesByCountry, labels]);

  // If user changes country and current city not in list -> reset city
  function onCountryChange(next: string) {
    setCountry(next);
    const list = ((citiesByCountry as any)[next] || []).map((c: any) => c.value);
    if (next && list.length > 0 && !list.includes(city)) setCity("");
    if (!next) setCity("");
  }

  return (
    <>
      <h1 style={{ marginBottom: 4 }}>{labels.title}</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>{labels.subtitle}</p>

      <form action={saveAndNextAction} style={{ display: "grid", gap: 12, maxWidth: 460 }}>
        <h3 style={{ marginTop: 6 }}>{labels.sections.immigration}</h3>

        <label>
          {labels.fields.birthCountry}
          <select
            name="residenceCountry"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          >
            {countryOptions.map((opt: any) => (
              <option key={opt.value || "empty"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          {labels.fields.birthCity}
          <select
            name="residenceCity"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
            disabled={!country}
          >
            {availableCities.map((opt: any) => (
              <option key={opt.value || "empty"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          {labels.fields.purposeOfStay}
          <select
            name="residenceAddress"
            defaultValue={defaults.residenceAddress || ""}
            style={{ width: "100%", marginTop: 6 }}
          >
            <option value="">{labels.selectPurpose}</option>
            <option value="work">{labels.purpose.work}</option>
            <option value="study">{labels.purpose.study}</option>
            <option value="asylum">{labels.purpose.asylum}</option>
          </select>
        </label>

        <h3 style={{ marginTop: 10 }}>{labels.sections.visa}</h3>

        <label>
          {labels.fields.visaType}
          <select
            name="visaType"
            defaultValue={defaults.visaType || ""}
            style={{ width: "100%", marginTop: 6 }}
          >
            <option value="">{labels.selectVisaType}</option>
            <option value="tourist">{labels.visa.tourist}</option>
            <option value="b1">{labels.visa.b1}</option>
            <option value="a5">{labels.visa.a5}</option>
            <option value="unknown">{labels.visa.unknown}</option>
          </select>
        </label>

        <fieldset style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
          <legend style={{ padding: "0 6px" }}>{labels.fields.visaValidity}</legend>

          <div style={{ marginBottom: 10, fontSize: 12, opacity: 0.85 }}>{labels.date.from}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <select
              name="visaStartDate_y"
              value={visaStart.y}
              onChange={(e) => setVisaStart({ ...visaStart, y: e.target.value })}
            >
              <option value="">{labels.select}</option>
              {yearsVisa.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              name="visaStartDate_m"
              value={visaStart.m}
              onChange={(e) => setVisaStart({ ...visaStart, m: e.target.value })}
            >
              <option value="">{labels.select}</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              name="visaStartDate_d"
              value={visaStart.d}
              onChange={(e) => setVisaStart({ ...visaStart, d: e.target.value })}
            >
              <option value="">{labels.select}</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 14, marginBottom: 10, fontSize: 12, opacity: 0.85 }}>
            {labels.date.to}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <select
              name="visaEndDate_y"
              value={visaEnd.y}
              onChange={(e) => setVisaEnd({ ...visaEnd, y: e.target.value })}
            >
              <option value="">{labels.select}</option>
              {yearsVisa.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              name="visaEndDate_m"
              value={visaEnd.m}
              onChange={(e) => setVisaEnd({ ...visaEnd, m: e.target.value })}
            >
              <option value="">{labels.select}</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              name="visaEndDate_d"
              value={visaEnd.d}
              onChange={(e) => setVisaEnd({ ...visaEnd, d: e.target.value })}
            >
              <option value="">{labels.select}</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {visaRangeBad && (
            <p style={{ marginTop: 10, color: "crimson" }}>{labels.errors.visaRange}</p>
          )}
        </fieldset>

        <fieldset style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
          <legend style={{ padding: "0 6px" }}>{labels.fields.entryDate}</legend>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, opacity: 0.85 }}>
              {labels.date.year}
              <select
                name="entryDate_y"
                defaultValue={defaults.entryDate.y}
                style={{ width: "100%", marginTop: 6 }}
              >
                <option value="">{labels.select}</option>
                {yearsEntry.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ fontSize: 12, opacity: 0.85 }}>
              {labels.date.month}
              <select
                name="entryDate_m"
                defaultValue={defaults.entryDate.m}
                style={{ width: "100%", marginTop: 6 }}
              >
                <option value="">{labels.select}</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ fontSize: 12, opacity: 0.85 }}>
              {labels.date.day}
              <select
                name="entryDate_d"
                defaultValue={defaults.entryDate.d}
                style={{ width: "100%", marginTop: 6 }}
              >
                <option value="">{labels.select}</option>
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        {/* ✅ כאן ההוספה היחידה: כפתור חזרה ששומר טיוטה */}
        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          <button formAction={saveDraftAndBackAction} type="submit">
            {labels?.buttons?.saveDraftBack ?? "Save Draft & Back"}
          </button>

          <button formAction={saveDraftAction} type="submit">
            {labels.buttons.saveDraft}
          </button>

          <button type="submit" disabled={visaRangeBad}>
            {labels.buttons.saveContinue}
          </button>
        </div>
      </form>
    </>
  );
}
