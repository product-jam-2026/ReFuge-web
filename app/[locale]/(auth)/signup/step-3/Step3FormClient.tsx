"use client";

import { useMemo, useState } from "react";

type DateParts = { y: string; m: string; d: string };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export default function Step3FormClient({
  labels,
  defaults,
  saveDraftAction,
  saveDraftAndBackAction,
  saveAndNextAction,
}: {
  labels: any;
  defaults: {
    maritalStatus: string;
    weddingDate: DateParts;
    regCity: string;
    regStreet: string;
    regHouseNumber: string;
    regEntry: string;
    regApartment: string;
    regZip: string;
    housingType: "rented" | "other";
    employmentStatus: string;
    notWorkingReason: string;
    assets: string[];
    occupationText: string;
  };
  saveDraftAction: (formData: FormData) => Promise<void>;
  saveDraftAndBackAction: (formData: FormData) => Promise<void>;
  saveAndNextAction: (formData: FormData) => Promise<void>;
}) {
  const nowYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 80 }, (_, i) => String(nowYear - i)), [nowYear]);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => pad2(i + 1)), []);
  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => pad2(i + 1)), []);

  // Cities in Israel (starter list)
  const cityOptions = useMemo(
    () => [
      { value: "", label: labels.selectCity },
      { value: "Jerusalem", label: "Jerusalem" },
      { value: "Tel Aviv", label: "Tel Aviv" },
      { value: "Haifa", label: "Haifa" },
      { value: "Beer Sheva", label: "Beer Sheva" },
    ],
    [labels]
  );

  // Streets per city (starter list; expand later)
  const streetsByCity = useMemo(
    () => ({
      Jerusalem: [
        { value: "Jaffa", label: "Jaffa" },
        { value: "King George", label: "King George" },
        { value: "Ben Yehuda", label: "Ben Yehuda" },
      ],
      "Tel Aviv": [
        { value: "Dizengoff", label: "Dizengoff" },
        { value: "Ibn Gabirol", label: "Ibn Gabirol" },
        { value: "Rothschild", label: "Rothschild" },
      ],
      Haifa: [
        { value: "Herzl", label: "Herzl" },
        { value: "Hahistadrut", label: "Hahistadrut" },
        { value: "Ben Gurion", label: "Ben Gurion" },
      ],
      "Beer Sheva": [
        { value: "Rager", label: "Rager" },
        { value: "Hen", label: "Hen" },
        { value: "HaAtzmaut", label: "HaAtzmaut" },
      ],
    }),
    []
  );

  const [city, setCity] = useState<string>(defaults.regCity || "");
  const [street, setStreet] = useState<string>(defaults.regStreet || "");
  const [employmentStatus, setEmploymentStatus] = useState<string>(defaults.employmentStatus || "");

  const availableStreets = useMemo(() => {
    const list = (streetsByCity as any)[city] || [];
    return [{ value: "", label: labels.selectStreet }, ...list];
  }, [city, streetsByCity, labels]);

  function onCityChange(next: string) {
    setCity(next);
    const list = ((streetsByCity as any)[next] || []).map((s: any) => s.value);
    if (next && list.length > 0 && !list.includes(street)) setStreet("");
    if (!next) setStreet("");
  }

  const showNotWorking = employmentStatus === "notWorking";

  return (
    <>
      <h1 style={{ marginBottom: 4 }}>{labels.title}</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>{labels.subtitle}</p>

      <form action={saveAndNextAction} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <h3 style={{ marginTop: 6 }}>{labels.sections.lifeCenter}</h3>

        <label>
          {labels.fields.maritalStatus}
          <select
            name="maritalStatus"
            defaultValue={defaults.maritalStatus || ""}
            style={{ width: "100%", marginTop: 6 }}
          >
            <option value="">{labels.select}</option>
            <option value="single">{labels.marital.single}</option>
            <option value="married">{labels.marital.married}</option>
            <option value="divorced">{labels.marital.divorced}</option>
            <option value="widowed">{labels.marital.widowed}</option>
          </select>
        </label>

        {/* Wedding date (statusDate) */}
        <fieldset style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
          <legend style={{ padding: "0 6px" }}>{labels.fields.weddingDate}</legend>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, opacity: 0.85 }}>
              {labels.date.year}
              <select
                name="statusDate_y"
                defaultValue={defaults.weddingDate.y}
                style={{ width: "100%", marginTop: 6 }}
              >
                <option value="">{labels.select}</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 12, opacity: 0.85 }}>
              {labels.date.month}
              <select
                name="statusDate_m"
                defaultValue={defaults.weddingDate.m}
                style={{ width: "100%", marginTop: 6 }}
              >
                <option value="">{labels.select}</option>
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 12, opacity: 0.85 }}>
              {labels.date.day}
              <select
                name="statusDate_d"
                defaultValue={defaults.weddingDate.d}
                style={{ width: "100%", marginTop: 6 }}
              >
                <option value="">{labels.select}</option>
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <h3 style={{ marginTop: 10 }}>{labels.sections.address}</h3>

        <label>
          {labels.fields.city}
          <select
            name="regCity"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          >
            {cityOptions.map((opt: any) => (
              <option key={opt.value || "empty"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          {labels.fields.street}
          <select
            name="regStreet"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
            disabled={!city}
          >
            {availableStreets.map((opt: any) => (
              <option key={opt.value || "empty"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <label>
            {labels.fields.houseNumber}
            <input
              name="regHouseNumber"
              inputMode="numeric"
              pattern="\d*"
              defaultValue={defaults.regHouseNumber || ""}
              style={{ width: "100%", marginTop: 6 }}
            />
          </label>
          <label>
            {labels.fields.entry}
            <input
              name="regEntry"
              defaultValue={defaults.regEntry || ""}
              style={{ width: "100%", marginTop: 6 }}
            />
          </label>
          <label>
            {labels.fields.apartment}
            <input
              name="regApartment"
              inputMode="numeric"
              pattern="\d*"
              defaultValue={defaults.regApartment || ""}
              style={{ width: "100%", marginTop: 6 }}
            />
          </label>
        </div>

        <label>
          {labels.fields.zip}
          <input
            name="regZip"
            inputMode="numeric"
            pattern="\d*"
            defaultValue={defaults.regZip || ""}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <h3 style={{ marginTop: 10 }}>{labels.sections.housing}</h3>

        {/* housingType -> maps to mailingDifferent in server */}
        <label>
          {labels.fields.housingType}
          <select
            name="housingType"
            defaultValue={defaults.housingType}
            style={{ width: "100%", marginTop: 6 }}
          >
            <option value="rented">{labels.housing.rented}</option>
            <option value="other">{labels.housing.other}</option>
          </select>
        </label>

        <h3 style={{ marginTop: 10 }}>{labels.sections.employment}</h3>

        <label>
          {labels.fields.employmentStatus}
          <select
            name="employmentStatus"
            value={employmentStatus}
            onChange={(e) => setEmploymentStatus(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          >
            <option value="">{labels.select}</option>
            <option value="selfEmployed">{labels.employment.selfEmployed}</option>
            <option value="employee">{labels.employment.employee}</option>
            <option value="notWorking">{labels.employment.notWorking}</option>
          </select>
        </label>

        {/* Not working reason (currently empty list => keep as select with blank option) */}
        <label>
          {labels.fields.notWorkingReason}
          <select
            name="notWorkingReason"
            defaultValue={defaults.notWorkingReason || ""}
            style={{ width: "100%", marginTop: 6 }}
            disabled={!showNotWorking}
          >
            <option value="">{labels.select}</option>
            {/* כרגע ריק בכוונה */}
          </select>
        </label>

        {/* optional free text - stored inside occupation json to not lose info */}
        <input type="hidden" name="occupationText" value={defaults.occupationText || ""} />

        <h3 style={{ marginTop: 10 }}>{labels.sections.assets}</h3>

        <fieldset style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
          <legend style={{ padding: "0 6px" }}>{labels.fields.assets}</legend>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              name="assets"
              value="apartment"
              defaultChecked={defaults.assets.includes("apartment")}
            />
            {labels.assetsOptions.apartment}
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              name="assets"
              value="business"
              defaultChecked={defaults.assets.includes("business")}
            />
            {labels.assetsOptions.business}
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              name="assets"
              value="other"
              defaultChecked={defaults.assets.includes("other")}
            />
            {labels.assetsOptions.other}
          </label>
        </fieldset>

        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          {/* ✅ חדש: שמירה + חזרה */}
          <button formAction={saveDraftAndBackAction} type="submit">
            {labels.buttons?.saveDraftBack ?? "Save Draft & Back"}
          </button>

          <button formAction={saveDraftAction} type="submit">
            {labels.buttons.saveDraft}
          </button>

          <button type="submit">{labels.buttons.saveContinue}</button>
        </div>
      </form>
    </>
  );
}
