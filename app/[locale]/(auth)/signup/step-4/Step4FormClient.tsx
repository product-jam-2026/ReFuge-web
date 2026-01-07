"use client";

import { useMemo, useState } from "react";

type HasYesNo = "yes" | "no" | "";

export default function Step4FormClient({
  labels,
  defaults,
  saveDraftAction,
  saveDraftAndBackAction,
  saveAndNextAction,
}: {
  labels: any;
  defaults: {
    healthFund: string;
    bankName: string;
    branch: string;
    branchNumber: string; // מסך בלבד
    accountNumber: string;
    hasFile: HasYesNo;
    fileNumber: string;
    getsAllowance: HasYesNo;
    allowanceType: string;
    allowanceFileNumber: string;
  };
  saveDraftAction: (formData: FormData) => Promise<void>;
  saveDraftAndBackAction: (formData: FormData) => Promise<void>;
  saveAndNextAction: (formData: FormData) => Promise<void>;
}) {
  // Health funds (starter list)
  const healthFunds = useMemo(
    () => [
      { value: "", label: labels.select },
      { value: "Clalit", label: "Clalit" },
      { value: "Maccabi", label: "Maccabi" },
      { value: "Meuhedet", label: "Meuhedet" },
      { value: "Leumit", label: "Leumit" },
    ],
    [labels]
  );

  // Banks + branches (starter list - extend later)
  const banks = useMemo(
    () => [
      { value: "", label: labels.select },
      { value: "Bank Hapoalim", label: "Bank Hapoalim" },
      { value: "Bank Leumi", label: "Bank Leumi" },
      { value: "Discount Bank", label: "Discount Bank" },
      { value: "Mizrahi-Tefahot", label: "Mizrahi-Tefahot" },
    ],
    [labels]
  );

  const branchesByBank = useMemo(
    () => ({
      "Bank Hapoalim": [
        { value: "Jerusalem - 123", label: "Jerusalem (123)" },
        { value: "Tel Aviv - 456", label: "Tel Aviv (456)" },
      ],
      "Bank Leumi": [
        { value: "Jerusalem - 701", label: "Jerusalem (701)" },
        { value: "Haifa - 311", label: "Haifa (311)" },
      ],
      "Discount Bank": [
        { value: "Tel Aviv - 901", label: "Tel Aviv (901)" },
        { value: "Beer Sheva - 144", label: "Beer Sheva (144)" },
      ],
      "Mizrahi-Tefahot": [
        { value: "Jerusalem - 212", label: "Jerusalem (212)" },
        { value: "Haifa - 818", label: "Haifa (818)" },
      ],
    }),
    []
  );

  const allowanceTypes = useMemo(
    () => [
      { value: "", label: labels.select },
      { value: "Income support", label: "Income support" },
      { value: "Disability", label: "Disability" },
      { value: "Child allowance", label: "Child allowance" },
      { value: "Other", label: "Other" },
    ],
    [labels]
  );

  const [bankName, setBankName] = useState(defaults.bankName || "");
  const [branch, setBranch] = useState(defaults.branch || "");
  const [hasFile, setHasFile] = useState<HasYesNo>(defaults.hasFile || "");
  const [getsAllowance, setGetsAllowance] = useState<HasYesNo>(
    defaults.getsAllowance || ""
  );

  const branchOptions = useMemo(() => {
    const list = (branchesByBank as any)[bankName] || [];
    return [{ value: "", label: labels.select }, ...list];
  }, [bankName, branchesByBank, labels]);

  function onBankChange(next: string) {
    setBankName(next);
    const list = ((branchesByBank as any)[next] || []).map((b: any) => b.value);
    if (next && list.length > 0 && !list.includes(branch)) setBranch("");
    if (!next) setBranch("");
  }

  // נוחות: אם בוחרים branch כמו "Jerusalem - 123", נציג את ה"מספר סניף" אוטומטית
  const derivedBranchNumber = useMemo(() => {
    const m = String(branch || "").match(/(\d{2,6})\s*$/);
    return m ? m[1] : "";
  }, [branch]);

  const showNiFileNumber = hasFile === "yes";
  const showAllowanceFields = getsAllowance === "yes";

  return (
    <>
      <h1 style={{ marginBottom: 4 }}>{labels.title}</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>{labels.subtitle}</p>

      {/* נשאיר action ברירת מחדל "שמור/י והמשך/י" */}
      <form
        action={saveAndNextAction}
        style={{ display: "grid", gap: 12, maxWidth: 520 }}
      >
        <h3 style={{ marginTop: 6 }}>{labels.sections.health}</h3>
        <label>
          {labels.fields.healthFund}
          <select
            name="healthFund"
            defaultValue={defaults.healthFund || ""}
            style={{ width: "100%", marginTop: 6 }}
          >
            {healthFunds.map((opt) => (
              <option key={opt.value || "empty"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <h3 style={{ marginTop: 10 }}>{labels.sections.bank}</h3>

        <label>
          {labels.fields.bankName}
          <select
            name="bankName"
            value={bankName}
            onChange={(e) => onBankChange(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          >
            {banks.map((opt) => (
              <option key={opt.value || "empty"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          {labels.fields.branch}
          <select
            name="branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            disabled={!bankName}
            style={{ width: "100%", marginTop: 6 }}
          >
            {branchOptions.map((opt: any) => (
              <option key={opt.value || "empty"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        {/* "מספר סניף" — אין לך שדה נפרד בסכמה. כרגע:
            1) מציגים derivedBranchNumber לקריאה בלבד
            2) אם תרצי בעתיד שדה נפרד, נוסיף ל-DB ואז נכתוב ל-patch
        */}
        <label>
          {labels.fields.branchNumber}
          <input
            value={derivedBranchNumber}
            readOnly
            style={{ width: "100%", marginTop: 6, opacity: 0.85 }}
            placeholder="—"
          />
        </label>

        <label>
          {labels.fields.accountNumber}
          <input
            name="accountNumber"
            inputMode="numeric"
            pattern="\d*"
            defaultValue={defaults.accountNumber || ""}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <h3 style={{ marginTop: 10 }}>{labels.sections.ni}</h3>

        <label>
          {labels.fields.hasFile}
          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="radio"
                name="hasFile"
                value="yes"
                defaultChecked={defaults.hasFile === "yes"}
                onChange={() => setHasFile("yes")}
              />
              {labels.niOptions.yes}
            </label>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="radio"
                name="hasFile"
                value="no"
                defaultChecked={defaults.hasFile === "no"}
                onChange={() => setHasFile("no")}
              />
              {labels.niOptions.no}
            </label>
          </div>
        </label>

        <label>
          {labels.fields.fileNumber}
          <input
            name="fileNumber"
            inputMode="numeric"
            pattern="\d*"
            defaultValue={defaults.fileNumber || ""}
            disabled={!showNiFileNumber}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <label>
          {labels.fields.getsAllowance}
          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="radio"
                name="getsAllowance"
                value="yes"
                defaultChecked={defaults.getsAllowance === "yes"}
                onChange={() => setGetsAllowance("yes")}
              />
              {labels.allowanceOptions.yes}
            </label>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="radio"
                name="getsAllowance"
                value="no"
                defaultChecked={defaults.getsAllowance === "no"}
                onChange={() => setGetsAllowance("no")}
              />
              {labels.allowanceOptions.no}
            </label>
          </div>
        </label>

        <label>
          {labels.fields.allowanceType}
          <select
            name="allowanceType"
            defaultValue={defaults.allowanceType || ""}
            disabled={!showAllowanceFields}
            style={{ width: "100%", marginTop: 6 }}
          >
            {allowanceTypes.map((opt) => (
              <option key={opt.value || "empty"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          {labels.fields.allowanceFileNumber}
          <input
            name="allowanceFileNumber"
            inputMode="numeric"
            pattern="\d*"
            defaultValue={defaults.allowanceFileNumber || ""}
            disabled={!showAllowanceFields}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          <button formAction={saveDraftAction} type="submit">
            {labels.buttons.saveDraft}
          </button>

          <button formAction={saveDraftAndBackAction} type="submit">
            {labels.buttons.saveDraftBack}
          </button>

          <button type="submit">{labels.buttons.saveContinue}</button>
        </div>
      </form>
    </>
  );
}
