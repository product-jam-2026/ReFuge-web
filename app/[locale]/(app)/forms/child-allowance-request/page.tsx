// "use client";

// import React, { useEffect, useMemo, useRef, useState } from "react";
// import demo from "@/public/demo/intake.demo.json";
// import { fieldMap } from "./fieldMap";
// import { intakeToPdfFields } from "./intakeToPdfFields";
// import { fillFieldsToNewPdfBytesClient } from "@/lib/pdf/fillPdfClient";
// import { useRouter } from "next/navigation";
// import emptyIntakeTemplate from "@/public/demo/intake.empty.json";

// type IntakeRecord = typeof demo;

// type ExtrasState = {
//   father: {
//     phoneHome: string;
//     emailPrefix: string;
//     emailPostfix: string;
//   };
//   allowanceRequester: {
//     phoneHome: string;
//     emailPrefix: string;
//     emailPostfix: string;
//   };
//   bankAccount: {
//     branchName: string;
//     branchNumber: string;
//     owner1: string;
//     owner2: string;
//   };
//   children: Array<{
//     firstEntryDate: string;
//     fileJoinDate: string;
//   }>;
// };

// type SubmitMode = "draft" | "final";

// function downloadJson(filename: string, data: unknown) {
//   const blob = new Blob([JSON.stringify(data, null, 2)], {
//     type: "application/json;charset=utf-8",
//   });
//   const url = URL.createObjectURL(blob);

//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   document.body.appendChild(a);
//   a.click();
//   a.remove();

//   URL.revokeObjectURL(url);
// }

// function safePart(s: string) {
//   return (
//     (s ?? "")
//       .toString()
//       .trim()
//       .replace(/[^a-zA-Z0-9_-]+/g, "_")
//       .slice(0, 40) || "unknown"
//   );
// }

// function splitEmail(email: string) {
//   const e = (email ?? "").trim();
//   const at = e.indexOf("@");
//   if (at === -1) return { prefix: e, postfix: "" };
//   return { prefix: e.slice(0, at), postfix: e.slice(at + 1) };
// }

// function fullName(first: string, last: string) {
//   return `${(first ?? "").trim()} ${(last ?? "").trim()}`.trim();
// }

// function emptyChildExtras(): ExtrasState["children"][number] {
//   return { firstEntryDate: "", fileJoinDate: "" };
// }

// function pickFieldMapKeys(
//   fields: Record<string, string>,
//   map: typeof fieldMap
// ) {
//   const out: Record<string, string> = {};
//   for (const k of Object.keys(map)) {
//     out[k] = fields[k] ?? "";
//   }
//   return out;
// }

// function deriveExtrasFromIntake(d: IntakeRecord): ExtrasState {
//   const fatherEmail = splitEmail(d.intake.step1.email);
//   const reqEmail = splitEmail(d.intake.step5.email);

//   const owners = {
//     owner1: fullName(d.intake.step1.firstName, d.intake.step1.lastName),
//     owner2: fullName(d.intake.step5.person.firstName, d.intake.step5.person.lastName),
//   };

//   const kids = d.intake.step6.children ?? [];
//   const kidsExtras = kids.map((k) => ({
//     firstEntryDate: k.entryDate ?? "",
//     fileJoinDate: "",
//   }));

//   while (kidsExtras.length < 3) kidsExtras.push(emptyChildExtras());

//   return {
//     father: {
//       phoneHome: "",
//       emailPrefix: fatherEmail.prefix,
//       emailPostfix: fatherEmail.postfix,
//     },
//     allowanceRequester: {
//       phoneHome: "",
//       emailPrefix: reqEmail.prefix,
//       emailPostfix: reqEmail.postfix,
//     },
//     bankAccount: {
//       branchName: "",
//       branchNumber: d.intake.step4.bank.branch ?? "",
//       owner1: owners.owner1,
//       owner2: owners.owner2,
//     },
//     children: kidsExtras,
//   };
// }

// function setDeep(obj: any, path: string, value: any) {
//   const parts = path.split(".");
//   let cur = obj;
//   for (let i = 0; i < parts.length - 1; i++) {
//     if (cur[parts[i]] == null) cur[parts[i]] = {};
//     cur = cur[parts[i]];
//   }
//   cur[parts[parts.length - 1]] = value;
// }

// function downloadDraftJson(
//   filename: string,
//   fieldsByPdfKey: Record<string, string>
// ) {
//   const blob = new Blob([JSON.stringify(fieldsByPdfKey, null, 2)], {
//     type: "application/json;charset=utf-8",
//   });
//   const url = URL.createObjectURL(blob);

//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   document.body.appendChild(a);
//   a.click();
//   a.remove();

//   URL.revokeObjectURL(url);
// }

// export default function ChildAllowanceRequestPage() {
//   const [draft, setDraft] = useState<IntakeRecord | null>(null);
//   const [extras, setExtras] = useState<ExtrasState | null>(null);
//   const [isSavingDraft, setIsSavingDraft] = useState(false);
//   const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

//   const router = useRouter();

//   // Hydrate ON PAGE LOAD from demo JSON
//   useEffect(() => {
//     const d = structuredClone(demo) as IntakeRecord;
//     setDraft(d);

//     const fatherEmail = splitEmail(d.intake.step1.email);
//     const reqEmail = splitEmail(d.intake.step5.email);

//     const owners = {
//       owner1: fullName(d.intake.step1.firstName, d.intake.step1.lastName),
//       owner2: fullName(
//         d.intake.step5.person.firstName,
//         d.intake.step5.person.lastName
//       ),
//     };

//     const kids = d.intake.step6.children ?? [];
//     const kidsExtras = kids.map((k) => ({
//       firstEntryDate: k.entryDate ?? "",
//       fileJoinDate: "",
//     }));

//     // Ensure at least 3 extras rows for convenience (PDF supports 3 kids)
//     while (kidsExtras.length < 3) kidsExtras.push(emptyChildExtras());

//     setExtras({
//       father: {
//         phoneHome: "",
//         emailPrefix: fatherEmail.prefix,
//         emailPostfix: fatherEmail.postfix,
//       },
//       allowanceRequester: {
//         phoneHome: "",
//         emailPrefix: reqEmail.prefix,
//         emailPostfix: reqEmail.postfix,
//       },
//       bankAccount: {
//         branchName: "",
//         branchNumber: d.intake.step4.bank.branch ?? "",
//         owner1: owners.owner1,
//         owner2: owners.owner2,
//       },
//       children: kidsExtras,
//     });
//   }, []);

//   function update(path: string, value: any) {
//     setDraft((prev) => {
//       if (!prev) return prev;
//       const next: any = structuredClone(prev);
//       const parts = path.split(".");
//       let cur: any = next;
//       for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
//       cur[parts[parts.length - 1]] = value;
//       return next;
//     });
//   }

//   function updateChild(
//     index: number,
//     key: keyof IntakeRecord["intake"]["step6"]["children"][number],
//     value: string
//   ) {
//     setDraft((prev) => {
//       if (!prev) return prev;
//       const next = structuredClone(prev);
//       if (!next.intake.step6.children[index]) return next;
//       (next.intake.step6.children[index] as any)[key] = value;
//       return next;
//     });
//   }

//   function addChildRow() {
//     setDraft((prev) => {
//       if (!prev) return prev;
//       const next = structuredClone(prev);
//       next.intake.step6.children.push({
//         lastName: "",
//         firstName: "",
//         gender: "",
//         birthDate: "",
//         nationality: "",
//         israeliId: "",
//         residenceCountry: "",
//         entryDate: "",
//       });
//       return next;
//     });

//     setExtras((prev) => {
//       if (!prev) return prev;
//       return { ...prev, children: [...prev.children, emptyChildExtras()] };
//     });
//   }

//   const payload = useMemo(() => {
//     if (!draft) return null;

//     // keep DB clean: remove empty children rows (optional)
//     const kids = (draft.intake.step6.children ?? []).filter(
//       (c) =>
//         (c.firstName ?? "").trim() ||
//         (c.lastName ?? "").trim() ||
//         (c.israeliId ?? "").trim() ||
//         (c.birthDate ?? "").trim()
//     );

//     const cleaned = structuredClone(draft);
//     cleaned.intake.step6.children = kids;
//     return cleaned;
//   }, [draft]);

//   function uint8ToBase64(u8: Uint8Array) {
//     // chunked to avoid call stack / memory issues
//     let binary = "";
//     const chunkSize = 0x8000;
//     for (let i = 0; i < u8.length; i += chunkSize) {
//       binary += String.fromCharCode(
//         ...Array.from(u8.subarray(i, i + chunkSize))
//       );
//     }
//     return btoa(binary);
//   }

//   function buildMergedFields(p: IntakeRecord, ex: ExtrasState) {
//     // Base mapping from DB intake -> PDF fields
//     const baseFields = intakeToPdfFields(p as any);

//     // Overlay "extras" (PDF-only fields / split email / missing DB fields)
//     const mergedFields: Record<string, string> = {
//       ...baseFields,

//       "father.phoneHome": ex.father.phoneHome ?? "",
//       "father.emailPrefix": ex.father.emailPrefix ?? "",
//       "father.emailPostfix": ex.father.emailPostfix ?? "",

//       "allowanceRequester.phoneHome": ex.allowanceRequester.phoneHome ?? "",
//       "allowanceRequester.emailPrefix": ex.allowanceRequester.emailPrefix ?? "",
//       "allowanceRequester.emailPostfix":
//         ex.allowanceRequester.emailPostfix ?? "",

//       "bankAccount.owner1": ex.bankAccount.owner1 ?? "",
//       "bankAccount.owner2": ex.bankAccount.owner2 ?? "",
//       "bankAccount.branchName": ex.bankAccount.branchName ?? "",
//       "bankAccount.branchNumber": ex.bankAccount.branchNumber ?? "",
//     };

//     // children extras (PDF supports up to 3)
//     for (let i = 0; i < 3; i++) {
//       const idx = i + 1;
//       mergedFields[`child${idx}.firstEntryDate`] =
//         ex.children[i]?.firstEntryDate ?? "";
//       mergedFields[`child${idx}.fileJoinDate`] =
//         ex.children[i]?.fileJoinDate ?? "";
//     }

//     return mergedFields;
//   }

// const fileInputRef = useRef<HTMLInputElement>(null);

// function openDraftPicker() {
//   fileInputRef.current?.click();
// }

// function applyPdfDraftToForm(fieldsByPdfKey: Record<string, string>) {
//   // start from current payload if exists, else demo
//   // const nextDraft = structuredClone((payload ?? demo) as IntakeRecord);

//   const nextDraft = structuredClone((emptyIntakeTemplate) as IntakeRecord);

//   const nextExtras = deriveExtrasFromIntake(nextDraft);

//   // Ensure we have up to 3 children rows if draft contains child fields
//   const maxChildIdx =
//     [1, 2, 3].findLast((i) =>
//       Object.keys(fieldsByPdfKey).some((k) => k.startsWith(`child${i}.`))
//     ) ?? 0;

//   while ((nextDraft.intake.step6.children?.length ?? 0) < maxChildIdx) {
//     nextDraft.intake.step6.children.push({
//       lastName: "",
//       firstName: "",
//       gender: "",
//       birthDate: "",
//       nationality: "",
//       israeliId: "",
//       residenceCountry: "",
//       entryDate: "",
//     });
//   }
//   while (nextExtras.children.length < 3) nextExtras.children.push(emptyChildExtras());

//   // ---- Map FieldMap keys -> your state (draft + extras) ----
//   // Father
//   if ("father.firstName" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step1.firstName", fieldsByPdfKey["father.firstName"] ?? "");
//   if ("father.familyName" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step1.lastName", fieldsByPdfKey["father.familyName"] ?? "");
//   if ("father.idNumber" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step1.israeliId", fieldsByPdfKey["father.idNumber"] ?? "");
//   if ("father.birthDate" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step1.birthDate", fieldsByPdfKey["father.birthDate"] ?? "");
//   if ("father.entryDate" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step2.entryDate", fieldsByPdfKey["father.entryDate"] ?? "");
//   if ("father.phoneMobile" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step1.phone", fieldsByPdfKey["father.phoneMobile"] ?? "");

//   // Father address (note: your intake uses registeredAddress.entry/apartment/zip)
//   if ("father.address.street" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step3.registeredAddress.street", fieldsByPdfKey["father.address.street"] ?? "");
//   if ("father.address.houseNumber" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step3.registeredAddress.houseNumber", fieldsByPdfKey["father.address.houseNumber"] ?? "");
//   if ("father.address.houseEntranceNumber" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step3.registeredAddress.entry", fieldsByPdfKey["father.address.houseEntranceNumber"] ?? "");
//   if ("father.address.apartmentNumber" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step3.registeredAddress.apartment", fieldsByPdfKey["father.address.apartmentNumber"] ?? "");
//   if ("father.address.city" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step3.registeredAddress.city", fieldsByPdfKey["father.address.city"] ?? "");
//   if ("father.address.zipcode" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step3.registeredAddress.zip", fieldsByPdfKey["father.address.zipcode"] ?? "");

//   // Father extras
//   if ("father.phoneHome" in fieldsByPdfKey) nextExtras.father.phoneHome = fieldsByPdfKey["father.phoneHome"] ?? "";
//   if ("father.emailPrefix" in fieldsByPdfKey) nextExtras.father.emailPrefix = fieldsByPdfKey["father.emailPrefix"] ?? "";
//   if ("father.emailPostfix" in fieldsByPdfKey) nextExtras.father.emailPostfix = fieldsByPdfKey["father.emailPostfix"] ?? "";

//   // Allowance requester
//   if ("allowanceRequester.firstName" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step5.person.firstName", fieldsByPdfKey["allowanceRequester.firstName"] ?? "");
//   if ("allowanceRequester.lastName" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step5.person.lastName", fieldsByPdfKey["allowanceRequester.lastName"] ?? "");
//   if ("allowanceRequester.idNumber" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step5.person.israeliId", fieldsByPdfKey["allowanceRequester.idNumber"] ?? "");
//   if ("allowanceRequester.phoneMobile" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step5.phone", fieldsByPdfKey["allowanceRequester.phoneMobile"] ?? "");

//   // Allowance requester extras
//   if ("allowanceRequester.phoneHome" in fieldsByPdfKey)
//     nextExtras.allowanceRequester.phoneHome = fieldsByPdfKey["allowanceRequester.phoneHome"] ?? "";
//   if ("allowanceRequester.emailPrefix" in fieldsByPdfKey)
//     nextExtras.allowanceRequester.emailPrefix = fieldsByPdfKey["allowanceRequester.emailPrefix"] ?? "";
//   if ("allowanceRequester.emailPostfix" in fieldsByPdfKey)
//     nextExtras.allowanceRequester.emailPostfix = fieldsByPdfKey["allowanceRequester.emailPostfix"] ?? "";

//   // Bank
//   if ("bankAccount.bankName" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step4.bank.bankName", fieldsByPdfKey["bankAccount.bankName"] ?? "");
//   if ("bankAccount.accountNumber" in fieldsByPdfKey)
//     setDeep(nextDraft, "intake.step4.bank.accountNumber", fieldsByPdfKey["bankAccount.accountNumber"] ?? "");

//   if ("bankAccount.owner1" in fieldsByPdfKey) nextExtras.bankAccount.owner1 = fieldsByPdfKey["bankAccount.owner1"] ?? "";
//   if ("bankAccount.owner2" in fieldsByPdfKey) nextExtras.bankAccount.owner2 = fieldsByPdfKey["bankAccount.owner2"] ?? "";
//   if ("bankAccount.branchName" in fieldsByPdfKey) nextExtras.bankAccount.branchName = fieldsByPdfKey["bankAccount.branchName"] ?? "";
//   if ("bankAccount.branchNumber" in fieldsByPdfKey) nextExtras.bankAccount.branchNumber = fieldsByPdfKey["bankAccount.branchNumber"] ?? "";

//   // Children (1..3)
//   for (let i = 1; i <= 3; i++) {
//     const idx = i - 1;
//     const child = nextDraft.intake.step6.children[idx];
//     if (!child) continue;

//     const idK = `child${i}.idNumber`;
//     const fnK = `child${i}.firstName`;
//     const lnK = `child${i}.lastName`;
//     const bdK = `child${i}.birthDate`;
//     const edK = `child${i}.entryDate`;
//     const fedK = `child${i}.firstEntryDate`;
//     const fjdK = `child${i}.fileJoinDate`;

//     if (idK in fieldsByPdfKey) child.israeliId = fieldsByPdfKey[idK] ?? "";
//     if (fnK in fieldsByPdfKey) child.firstName = fieldsByPdfKey[fnK] ?? "";
//     if (lnK in fieldsByPdfKey) child.lastName = fieldsByPdfKey[lnK] ?? "";
//     if (bdK in fieldsByPdfKey) child.birthDate = fieldsByPdfKey[bdK] ?? "";
//     if (edK in fieldsByPdfKey) child.entryDate = fieldsByPdfKey[edK] ?? "";

//     if (fedK in fieldsByPdfKey) nextExtras.children[idx]!.firstEntryDate = fieldsByPdfKey[fedK] ?? "";
//     if (fjdK in fieldsByPdfKey) nextExtras.children[idx]!.fileJoinDate = fieldsByPdfKey[fjdK] ?? "";
//   }

//   setDraft(nextDraft);
//   setExtras(nextExtras);
// }

// async function onDraftFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
//   const file = e.target.files?.[0];
//   if (!file) return;

//   try {
//     const text = await file.text();
//     const parsed = JSON.parse(text);

//     if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
//       throw new Error("Draft JSON must be an object of { fieldKey: value }");
//     }

//     // Ensure values are strings (your pipeline expects strings)
//     const fieldsByPdfKey: Record<string, string> = {};
//     for (const [k, v] of Object.entries(parsed)) {
//       fieldsByPdfKey[k] = v == null ? "" : String(v);
//     }

//     applyPdfDraftToForm(fieldsByPdfKey);
//   } catch (err: any) {
//     alert(`Failed to load draft: ${err?.message ?? String(err)}`);
//   } finally {
//     // allow selecting same file again
//     e.target.value = "";
//   }
// }

//   async function handleSubmit(mode: SubmitMode) {
//     if (!payload || !extras) return;

//     if (mode === "draft") setIsSavingDraft(true);
//     else setIsGeneratingPdf(true);

//     try {
//       const mergedFields = buildMergedFields(payload, extras);

//       if (mode === "draft") {
//         const fieldsByPdfKey = pickFieldMapKeys(mergedFields, fieldMap);

//         const s1 = payload.intake.step1;
//         const fileName = `draft_child_allowance_${safePart(
//           s1.israeliId ||
//             s1.passportNumber ||
//             s1.lastName ||
//             s1.email ||
//             "unknown"
//         )}_${new Date().toISOString().slice(0, 10)}.json`;

//         downloadDraftJson(fileName, fieldsByPdfKey);
//         return;
//       }
//       // ✅ Final: generate pdf (your existing logic)
//       const [tplRes, fontRes] = await Promise.all([
//         fetch("/forms/child-allowance-request.pdf"),
//         fetch("/fonts/SimplerPro-Regular.otf"),
//       ]);

//       if (!tplRes.ok) throw new Error("Failed to load template PDF");
//       if (!fontRes.ok) throw new Error("Failed to load font");

//       const templateBytes = new Uint8Array(await tplRes.arrayBuffer());
//       const fontBytes = new Uint8Array(await fontRes.arrayBuffer());

//       const outBytes = await fillFieldsToNewPdfBytesClient(
//         templateBytes,
//         mergedFields,
//         fieldMap,
//         {
//           fontBytes,
//           autoDetectRtl: true,
//           defaultRtlAlignRight: true,
//         }
//       );

//       const s1 = payload.intake.step1;
//       const fileName = `child_allowance_${safePart(
//         s1.israeliId || s1.passportNumber || s1.lastName || "unknown"
//       )}_${new Date().toISOString().slice(0, 10)}.pdf`;

//       // ✅ Store + redirect (instead of downloading here)
//       const key = `pdf_${Date.now()}_${Math.random().toString(16).slice(2)}`;
//       sessionStorage.setItem(
//         key,
//         JSON.stringify({
//           fileName,
//           bytesBase64: uint8ToBase64(outBytes),
//         })
//       );

//       router.push(
//         `/forms/child-allowance-request/download?key=${encodeURIComponent(key)}`
//       );
//     } finally {
//       setIsSavingDraft(false);
//       setIsGeneratingPdf(false);
//     }
//   }

//   async function onSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     await handleSubmit("final");
//   }

//   if (!draft || !payload || !extras) {
//     return (
//       <main style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
//         Loading…
//       </main>
//     );
//   }

//   const kids = draft.intake.step6.children ?? [];

//   return (
//     <main
//       style={{ maxWidth: 820, margin: "0 auto", padding: 24, direction: "rtl" }}
//     >
//       <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
//         טופס בקשה לקצבת ילדים
//       </h1>

//       <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
//         <SectionTitle>פרטי האב (DB: step1/step2/step3)</SectionTitle>

//         <Field label="שם פרטי">
//           <input
//             value={draft.intake.step1.firstName}
//             onChange={(e) => update("intake.step1.firstName", e.target.value)}
//             style={inputStyle}
//           />
//         </Field>

//         <Field label="שם משפחה">
//           <input
//             value={draft.intake.step1.lastName}
//             onChange={(e) => update("intake.step1.lastName", e.target.value)}
//             style={inputStyle}
//           />
//         </Field>

//         <Field label="מספר זהות">
//           <input
//             value={draft.intake.step1.israeliId}
//             onChange={(e) => update("intake.step1.israeliId", e.target.value)}
//             style={inputStyle}
//           />
//         </Field>

//         <Field label="תאריך לידה">
//           <input
//             type="date"
//             value={draft.intake.step1.birthDate}
//             onChange={(e) => update("intake.step1.birthDate", e.target.value)}
//             style={inputStyle}
//           />
//         </Field>

//         <Field label="תאריך כניסה לישראל (DB: step2.entryDate)">
//           <input
//             type="date"
//             value={draft.intake.step2.entryDate}
//             onChange={(e) => update("intake.step2.entryDate", e.target.value)}
//             style={inputStyle}
//           />
//         </Field>

//         <SectionTitle>כתובת האב (DB: step3.registeredAddress)</SectionTitle>

//         <Field label="רחוב">
//           <input
//             value={draft.intake.step3.registeredAddress.street}
//             onChange={(e) =>
//               update("intake.step3.registeredAddress.street", e.target.value)
//             }
//             style={inputStyle}
//           />
//         </Field>

//         <div
//           style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
//         >
//           <Field label="מספר בית">
//             <input
//               value={draft.intake.step3.registeredAddress.houseNumber}
//               onChange={(e) =>
//                 update(
//                   "intake.step3.registeredAddress.houseNumber",
//                   e.target.value
//                 )
//               }
//               style={inputStyle}
//             />
//           </Field>

//           <Field label="כניסה">
//             <input
//               value={draft.intake.step3.registeredAddress.entry}
//               onChange={(e) =>
//                 update("intake.step3.registeredAddress.entry", e.target.value)
//               }
//               style={inputStyle}
//             />
//           </Field>

//           <Field label="דירה">
//             <input
//               value={draft.intake.step3.registeredAddress.apartment}
//               onChange={(e) =>
//                 update(
//                   "intake.step3.registeredAddress.apartment",
//                   e.target.value
//                 )
//               }
//               style={inputStyle}
//             />
//           </Field>

//           <Field label="מיקוד">
//             <input
//               value={draft.intake.step3.registeredAddress.zip}
//               onChange={(e) =>
//                 update("intake.step3.registeredAddress.zip", e.target.value)
//               }
//               style={inputStyle}
//             />
//           </Field>
//         </div>

//         <Field label="עיר">
//           <input
//             value={draft.intake.step3.registeredAddress.city}
//             onChange={(e) =>
//               update("intake.step3.registeredAddress.city", e.target.value)
//             }
//             style={inputStyle}
//           />
//         </Field>

//         <SectionTitle>טלפון / אימייל האב</SectionTitle>

//         <Field label="טלפון נייד (DB: step1.phone)">
//           <input
//             value={draft.intake.step1.phone}
//             onChange={(e) => update("intake.step1.phone", e.target.value)}
//             style={inputStyle}
//             inputMode="tel"
//           />
//         </Field>

//         <Field label="טלפון בבית (PDF בלבד)">
//           <input
//             value={extras.father.phoneHome}
//             onChange={(e) =>
//               setExtras((p) =>
//                 p
//                   ? { ...p, father: { ...p.father, phoneHome: e.target.value } }
//                   : p
//               )
//             }
//             style={inputStyle}
//             inputMode="tel"
//           />
//         </Field>

//         <div
//           style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
//         >
//           <Field label="אימייל (לפני @) (PDF בלבד)">
//             <input
//               value={extras.father.emailPrefix}
//               onChange={(e) =>
//                 setExtras((p) =>
//                   p
//                     ? {
//                         ...p,
//                         father: { ...p.father, emailPrefix: e.target.value },
//                       }
//                     : p
//                 )
//               }
//               style={inputStyle}
//               dir="ltr"
//             />
//           </Field>

//           <Field label="אימייל (אחרי @) (PDF בלבד)">
//             <input
//               value={extras.father.emailPostfix}
//               onChange={(e) =>
//                 setExtras((p) =>
//                   p
//                     ? {
//                         ...p,
//                         father: { ...p.father, emailPostfix: e.target.value },
//                       }
//                     : p
//                 )
//               }
//               style={inputStyle}
//               dir="ltr"
//             />
//           </Field>
//         </div>

//         <SectionTitle>
//           פרטי מבקש הקצבה (DB: step5 + step3 mailing/registered)
//         </SectionTitle>

//         <Field label="שם פרטי (DB: step5.person.firstName)">
//           <input
//             value={draft.intake.step5.person.firstName}
//             onChange={(e) =>
//               update("intake.step5.person.firstName", e.target.value)
//             }
//             style={inputStyle}
//           />
//         </Field>

//         <Field label="שם משפחה (DB: step5.person.lastName)">
//           <input
//             value={draft.intake.step5.person.lastName}
//             onChange={(e) =>
//               update("intake.step5.person.lastName", e.target.value)
//             }
//             style={inputStyle}
//           />
//         </Field>

//         <Field label="מספר זהות (DB: step5.person.israeliId)">
//           <input
//             value={draft.intake.step5.person.israeliId}
//             onChange={(e) =>
//               update("intake.step5.person.israeliId", e.target.value)
//             }
//             style={inputStyle}
//           />
//         </Field>

//         <Field label="טלפון נייד (DB: step5.phone)">
//           <input
//             value={draft.intake.step5.phone}
//             onChange={(e) => update("intake.step5.phone", e.target.value)}
//             style={inputStyle}
//             inputMode="tel"
//           />
//         </Field>

//         <Field label="טלפון בבית (PDF בלבד)">
//           <input
//             value={extras.allowanceRequester.phoneHome}
//             onChange={(e) =>
//               setExtras((p) =>
//                 p
//                   ? {
//                       ...p,
//                       allowanceRequester: {
//                         ...p.allowanceRequester,
//                         phoneHome: e.target.value,
//                       },
//                     }
//                   : p
//               )
//             }
//             style={inputStyle}
//             inputMode="tel"
//           />
//         </Field>

//         <div
//           style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
//         >
//           <Field label="אימייל (לפני @) (PDF בלבד)">
//             <input
//               value={extras.allowanceRequester.emailPrefix}
//               onChange={(e) =>
//                 setExtras((p) =>
//                   p
//                     ? {
//                         ...p,
//                         allowanceRequester: {
//                           ...p.allowanceRequester,
//                           emailPrefix: e.target.value,
//                         },
//                       }
//                     : p
//                 )
//               }
//               style={inputStyle}
//               dir="ltr"
//             />
//           </Field>

//           <Field label="אימייל (אחרי @) (PDF בלבד)">
//             <input
//               value={extras.allowanceRequester.emailPostfix}
//               onChange={(e) =>
//                 setExtras((p) =>
//                   p
//                     ? {
//                         ...p,
//                         allowanceRequester: {
//                           ...p.allowanceRequester,
//                           emailPostfix: e.target.value,
//                         },
//                       }
//                     : p
//                 )
//               }
//               style={inputStyle}
//               dir="ltr"
//             />
//           </Field>
//         </div>

//         <SectionTitle>חשבון בנק (DB: step4.bank + PDF extras)</SectionTitle>

//         <Field label="בעל/ת חשבון 1 (PDF בלבד)">
//           <input
//             value={extras.bankAccount.owner1}
//             onChange={(e) =>
//               setExtras((p) =>
//                 p
//                   ? {
//                       ...p,
//                       bankAccount: { ...p.bankAccount, owner1: e.target.value },
//                     }
//                   : p
//               )
//             }
//             style={inputStyle}
//           />
//         </Field>

//         <Field label="בעל/ת חשבון 2 (PDF בלבד)">
//           <input
//             value={extras.bankAccount.owner2}
//             onChange={(e) =>
//               setExtras((p) =>
//                 p
//                   ? {
//                       ...p,
//                       bankAccount: { ...p.bankAccount, owner2: e.target.value },
//                     }
//                   : p
//               )
//             }
//             style={inputStyle}
//           />
//         </Field>

//         <Field label="שם הבנק (DB: step4.bank.bankName)">
//           <input
//             value={draft.intake.step4.bank.bankName}
//             onChange={(e) =>
//               update("intake.step4.bank.bankName", e.target.value)
//             }
//             style={inputStyle}
//           />
//         </Field>

//         <div
//           style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
//         >
//           <Field label="שם סניף (PDF בלבד)">
//             <input
//               value={extras.bankAccount.branchName}
//               onChange={(e) =>
//                 setExtras((p) =>
//                   p
//                     ? {
//                         ...p,
//                         bankAccount: {
//                           ...p.bankAccount,
//                           branchName: e.target.value,
//                         },
//                       }
//                     : p
//                 )
//               }
//               style={inputStyle}
//             />
//           </Field>

//           <Field label="מספר סניף (DB: step4.bank.branch)">
//             <input
//               value={extras.bankAccount.branchNumber}
//               onChange={(e) =>
//                 setExtras((p) =>
//                   p
//                     ? {
//                         ...p,
//                         bankAccount: {
//                           ...p.bankAccount,
//                           branchNumber: e.target.value,
//                         },
//                       }
//                     : p
//                 )
//               }
//               style={inputStyle}
//               dir="ltr"
//             />
//           </Field>
//         </div>

//         <Field label="מספר חשבון (DB: step4.bank.accountNumber)">
//           <input
//             value={draft.intake.step4.bank.accountNumber}
//             onChange={(e) =>
//               update("intake.step4.bank.accountNumber", e.target.value)
//             }
//             style={inputStyle}
//             dir="ltr"
//           />
//         </Field>

//         <SectionTitle>
//           פרטי הילדים (DB: step6.children) — ה-PDF תומך עד 3
//         </SectionTitle>

//         {kids.map((child, i) => (
//           <div
//             key={i}
//             style={{
//               border: "1px solid #ddd",
//               borderRadius: 12,
//               padding: 12,
//               display: "grid",
//               gap: 10,
//             }}
//           >
//             <div style={{ fontWeight: 700 }}>ילד/ה #{i + 1}</div>

//             <Field label="מספר זהות (DB: child.israeliId)">
//               <input
//                 value={child.israeliId}
//                 onChange={(e) => updateChild(i, "israeliId", e.target.value)}
//                 style={inputStyle}
//                 dir="ltr"
//               />
//             </Field>

//             <Field label="שם משפחה (DB: child.lastName)">
//               <input
//                 value={child.lastName}
//                 onChange={(e) => updateChild(i, "lastName", e.target.value)}
//                 style={inputStyle}
//               />
//             </Field>

//             <Field label="שם פרטי (DB: child.firstName)">
//               <input
//                 value={child.firstName}
//                 onChange={(e) => updateChild(i, "firstName", e.target.value)}
//                 style={inputStyle}
//               />
//             </Field>

//             <Field label="תאריך לידה (DB: child.birthDate)">
//               <input
//                 type="date"
//                 value={child.birthDate}
//                 onChange={(e) => updateChild(i, "birthDate", e.target.value)}
//                 style={inputStyle}
//               />
//             </Field>

//             <Field label="תאריך כניסה (DB: child.entryDate)">
//               <input
//                 type="date"
//                 value={child.entryDate}
//                 onChange={(e) => updateChild(i, "entryDate", e.target.value)}
//                 style={inputStyle}
//               />
//             </Field>

//             <Field label="תאריך כניסה ראשון (PDF בלבד)">
//               <input
//                 type="date"
//                 value={extras.children[i]?.firstEntryDate ?? ""}
//                 onChange={(e) =>
//                   setExtras((p) => {
//                     if (!p) return p;
//                     const next = structuredClone(p);
//                     if (!next.children[i])
//                       next.children[i] = emptyChildExtras();
//                     next.children[i]!.firstEntryDate = e.target.value;
//                     return next;
//                   })
//                 }
//                 style={inputStyle}
//               />
//             </Field>

//             <Field label="תאריך פתיחת תיק/הצטרפות (PDF בלבד)">
//               <input
//                 type="date"
//                 value={extras.children[i]?.fileJoinDate ?? ""}
//                 onChange={(e) =>
//                   setExtras((p) => {
//                     if (!p) return p;
//                     const next = structuredClone(p);
//                     if (!next.children[i])
//                       next.children[i] = emptyChildExtras();
//                     next.children[i]!.fileJoinDate = e.target.value;
//                     return next;
//                   })
//                 }
//                 style={inputStyle}
//               />
//             </Field>

//             {i >= 2 ? (
//               <div style={{ fontSize: 12, opacity: 0.75 }}>
//                 שים לב: ה-PDF תומך עד 3 ילדים. ילדים נוספים יוצגו כאן ב-UI, אבל
//                 לא ייכנסו ל-PDF.
//               </div>
//             ) : null}
//           </div>
//         ))}

//         <button
//           type="button"
//           onClick={addChildRow}
//           style={secondaryButtonStyle}
//         >
//           + הוסף ילד/ה נוסף/ת
//         </button>

//         <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
//           <button
//             type="button"
//             style={secondaryButtonStyle}
//             onClick={() =>
//               downloadJson(
//                 `intake_${safePart(
//                   draft.intake.step1.email ||
//                     draft.intake.step1.israeliId ||
//                     "demo"
//                 )}.json`,
//                 payload
//               )
//             }
//           >
//             הורד JSON (DB record)
//           </button>

//           {/* ✅ NEW: Save Draft */}
//           <button
//             type="button"
//             style={secondaryButtonStyle}
//             onClick={() => handleSubmit("draft")}
//             disabled={isSavingDraft || isGeneratingPdf}
//           >
//             {isSavingDraft ? "שומר טיוטה..." : "שמור טיוטה"}
//           </button>

//           <button
//             type="submit"
//             style={buttonStyle}
//             disabled={isSavingDraft || isGeneratingPdf}
//           >
//             {isGeneratingPdf ? "מייצר PDF..." : "הורד PDF"}
//           </button>

//           {/* Hidden file input */}
//           <input
//             ref={fileInputRef}
//             type="file"
//             accept="application/json"
//             style={{ display: "none" }}
//             onChange={onDraftFileSelected}
//           />

//           <button
//             type="button"
//             style={secondaryButtonStyle}
//             onClick={openDraftPicker}
//             disabled={isSavingDraft || isGeneratingPdf}
//           >
//             טען טיוטה (JSON)
//           </button>
//         </div>

//         <details style={{ marginTop: 8 }}>
//           <summary>תצוגה מקדימה של ה-JSON (DB record)</summary>
//           <pre
//             style={{
//               background: "#111",
//               color: "#eee",
//               padding: 12,
//               borderRadius: 8,
//               overflowX: "auto",
//             }}
//           >
//             {JSON.stringify(payload, null, 2)}
//           </pre>
//         </details>
//       </form>
//     </main>
//   );
// }

// function SectionTitle({ children }: { children: React.ReactNode }) {
//   return (
//     <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 10 }}>{children}</h2>
//   );
// }

// function Field({
//   label,
//   required,
//   children,
// }: {
//   label: string;
//   required?: boolean;
//   children: React.ReactNode;
// }) {
//   return (
//     <label style={{ display: "grid", gap: 6 }}>
//       <span>
//         {label} {required ? <span style={{ color: "crimson" }}>*</span> : null}
//       </span>
//       {children}
//     </label>
//   );
// }

// const inputStyle: React.CSSProperties = {
//   width: "100%",
//   padding: "10px 12px",
//   borderRadius: 10,
//   border: "1px solid #ccc",
//   fontSize: 16,
// };

// const buttonStyle: React.CSSProperties = {
//   marginTop: 8,
//   padding: "12px 14px",
//   borderRadius: 12,
//   border: "none",
//   fontSize: 16,
//   cursor: "pointer",
// };

// const secondaryButtonStyle: React.CSSProperties = {
//   padding: "10px 12px",
//   borderRadius: 12,
//   border: "1px solid #ccc",
//   background: "transparent",
//   fontSize: 15,
//   cursor: "pointer",
// };

// app/[locale]/(app)/forms/child-allowance-request/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import demo from "@/public/demo/intake.demo.json";
import { fieldMap } from "./fieldMap";
import { intakeToPdfFields } from "./intakeToPdfFields";
import { fillFieldsToNewPdfBytesClient } from "@/lib/pdf/fillPdfClient";
import { useRouter } from "next/navigation";
import emptyIntakeTemplate from "@/public/demo/intake.empty.json";
import styles from "./page.module.css";

import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";

type IntakeRecord = typeof demo;

type ExtrasState = {
  father: {
    phoneHome: string;
    emailPrefix: string;
    emailPostfix: string;
  };
  allowanceRequester: {
    phoneHome: string;
    emailPrefix: string;
    emailPostfix: string;
  };
  bankAccount: {
    branchName: string;
    branchNumber: string;
    owner1: string;
    owner2: string;
  };
  children: Array<{
    firstEntryDate: string;
    fileJoinDate: string;
  }>;
};

type SubmitMode = "draft" | "final";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function safeFileName(title: string) {
  return (
    (title ?? "")
      .toString()
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .slice(0, 60) || "Untitled"
  );
}

async function uploadPdf(
  outBytes: Uint8Array,
  instanceId: string,
  pdfTitle: string,
) {
  const supabase = createClient();

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const user = userRes.user;
  if (!user) throw new Error("Not logged in");

  // no timezone suffix: drop trailing Z from ISO
  const ts = new Date().toISOString().replace("Z", "").replace(/[:.]/g, "-");
  const base = safeFileName(pdfTitle);
  const fileName = `${base}_${ts}.pdf`;

  const path = `${user.id}/child-allowance-request/${instanceId}/${fileName}`;

  const bytes = new Uint8Array(outBytes);
  const blob = new Blob([bytes.buffer], { type: "application/pdf" });

  const { data, error } = await supabase.storage
    .from("generated-pdfs")
    .upload(path, blob, { contentType: "application/pdf", upsert: false });

  if (error) throw error;

  const { error: insErr } = await supabase.from("generated_pdfs").insert({
    user_id: user.id,
    bucket: "generated-pdfs",
    path: data.path,
    form_instance_id: instanceId,
    pdf_title: pdfTitle,
  });

  if (insErr) throw insErr;

  return data.path;
}

async function saveDraftToDb(args: {
  formSlug: string;
  title: string;
  draft: any;
  extras: any;
  existingInstanceId?: string;
}) {
  const { formSlug, title, draft, extras, existingInstanceId } = args;

  const supabase = createClient();
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const user = userRes.user;
  if (!user) throw new Error("Not logged in");

  if (!existingInstanceId) {
    const { data, error } = await supabase
      .from("form_instances")
      .insert({
        user_id: user.id,
        form_slug: formSlug,
        title,
        draft,
        extras,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id as string;
  } else {
    const { error } = await supabase
      .from("form_instances")
      .update({ title, draft, extras })
      .eq("id", existingInstanceId)
      .eq("user_id", user.id);

    if (error) throw error;
    return existingInstanceId;
  }
}

async function loadLatestDraftFromDb(formSlug: string) {
  const supabase = createClient();

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const uid = userRes.user?.id;
  if (!uid) throw new Error("Not logged in");

  // assumes you have updated_at; if not, use created_at only
  const { data: row, error } = await supabase
    .from("form_instances")
    .select("id, title, draft, extras, updated_at, created_at")
    .eq("user_id", uid)
    .eq("form_slug", formSlug)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!row) throw new Error("No saved draft found");

  return row as {
    id: string;
    draft: any;
    extras: any;
  };
}

async function downloadLatestPdfForCurrentUser(opts?: {
  instanceId?: string;
  formSlugPrefix?: string; // optional: extra filter by path prefix
}) {
  const supabase = createClient();

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const uid = userRes.user?.id;
  if (!uid) throw new Error("Not logged in");

  let q = supabase
    .from("generated_pdfs")
    .select("bucket, path, created_at, form_instance_id")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(1);

  if (opts?.instanceId) q = q.eq("form_instance_id", opts.instanceId);

  const { data: row, error: dbErr } = await q.maybeSingle();
  if (dbErr) throw dbErr;
  if (!row) throw new Error("No PDFs found for this user");

  // optional sanity filter by path prefix
  if (opts?.formSlugPrefix && !row.path.includes(opts.formSlugPrefix)) {
    throw new Error("Latest PDF is not for this form");
  }

  const { data: blob, error: dlErr } = await supabase.storage
    .from(row.bucket)
    .download(row.path);

  if (dlErr) throw dlErr;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = row.path.split("/").pop() || "document.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safePart(s: string) {
  return (
    (s ?? "")
      .toString()
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .slice(0, 40) || "unknown"
  );
}

function splitEmail(email: string) {
  const e = (email ?? "").trim();
  const at = e.indexOf("@");
  if (at === -1) return { prefix: e, postfix: "" };
  return { prefix: e.slice(0, at), postfix: e.slice(at + 1) };
}

function fullName(first: string, last: string) {
  return `${(first ?? "").trim()} ${(last ?? "").trim()}`.trim();
}

function emptyChildExtras(): ExtrasState["children"][number] {
  return { firstEntryDate: "", fileJoinDate: "" };
}

function pickFieldMapKeys(
  fields: Record<string, string>,
  map: typeof fieldMap,
) {
  const out: Record<string, string> = {};
  for (const k of Object.keys(map)) out[k] = fields[k] ?? "";
  return out;
}

function deriveExtrasFromIntake(d: IntakeRecord): ExtrasState {
  const fatherEmail = splitEmail(d.intake.step1.email);
  const reqEmail = splitEmail(d.intake.step5.email);

  const owners = {
    owner1: fullName(d.intake.step1.firstName, d.intake.step1.lastName),
    owner2: fullName(
      d.intake.step5.person.firstName,
      d.intake.step5.person.lastName,
    ),
  };

  const kids = d.intake.step6.children ?? [];
  const kidsExtras = kids.map((k) => ({
    firstEntryDate: k.entryDate ?? "",
    fileJoinDate: "",
  }));

  while (kidsExtras.length < 3) kidsExtras.push(emptyChildExtras());

  return {
    father: {
      phoneHome: "",
      emailPrefix: fatherEmail.prefix,
      emailPostfix: fatherEmail.postfix,
    },
    allowanceRequester: {
      phoneHome: "",
      emailPrefix: reqEmail.prefix,
      emailPostfix: reqEmail.postfix,
    },
    bankAccount: {
      branchName: "",
      branchNumber: d.intake.step4.bank.branch ?? "",
      owner1: owners.owner1,
      owner2: owners.owner2,
    },
    children: kidsExtras,
  };
}

function setDeep(obj: any, path: string, value: any) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function downloadDraftJson(
  filename: string,
  fieldsByPdfKey: Record<string, string>,
) {
  const blob = new Blob([JSON.stringify(fieldsByPdfKey, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

export default function ChildAllowanceRequestPage() {
  const [draft, setDraft] = useState<IntakeRecord | null>(null);
  const [extras, setExtras] = useState<ExtrasState | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const params = useParams();
  const locale = (params as any)?.locale as string | undefined;

  const [instanceId, setInstanceId] = useState<string | undefined>(undefined);

  const router = useRouter();

  useEffect(() => {
    const d = structuredClone(demo) as IntakeRecord;
    setDraft(d);
    setExtras(deriveExtrasFromIntake(d));
  }, []);

  function update(path: string, value: any) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next: any = structuredClone(prev);
      const parts = path.split(".");
      let cur: any = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  }

  function updateChild(
    index: number,
    key: keyof IntakeRecord["intake"]["step6"]["children"][number],
    value: string,
  ) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      if (!next.intake.step6.children[index]) return next;
      (next.intake.step6.children[index] as any)[key] = value;
      return next;
    });
  }

  function addChildRow() {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.intake.step6.children.push({
        lastName: "",
        firstName: "",
        gender: "",
        birthDate: "",
        nationality: "",
        israeliId: "",
        residenceCountry: "",
        entryDate: "",
      });
      return next;
    });

    setExtras((prev) => {
      if (!prev) return prev;
      return { ...prev, children: [...prev.children, emptyChildExtras()] };
    });
  }

  const payload = useMemo(() => {
    if (!draft) return null;
    const kids = (draft.intake.step6.children ?? []).filter(
      (c) =>
        (c.firstName ?? "").trim() ||
        (c.lastName ?? "").trim() ||
        (c.israeliId ?? "").trim() ||
        (c.birthDate ?? "").trim(),
    );
    const cleaned = structuredClone(draft);
    cleaned.intake.step6.children = kids;
    return cleaned;
  }, [draft]);

  function uint8ToBase64(u8: Uint8Array) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < u8.length; i += chunkSize) {
      binary += String.fromCharCode(
        ...Array.from(u8.subarray(i, i + chunkSize)),
      );
    }
    return btoa(binary);
  }

  function buildMergedFields(p: IntakeRecord, ex: ExtrasState) {
    const baseFields = intakeToPdfFields(p as any);

    const mergedFields: Record<string, string> = {
      ...baseFields,

      "father.phoneHome": ex.father.phoneHome ?? "",
      "father.emailPrefix": ex.father.emailPrefix ?? "",
      "father.emailPostfix": ex.father.emailPostfix ?? "",

      "allowanceRequester.phoneHome": ex.allowanceRequester.phoneHome ?? "",
      "allowanceRequester.emailPrefix": ex.allowanceRequester.emailPrefix ?? "",
      "allowanceRequester.emailPostfix":
        ex.allowanceRequester.emailPostfix ?? "",

      "bankAccount.owner1": ex.bankAccount.owner1 ?? "",
      "bankAccount.owner2": ex.bankAccount.owner2 ?? "",
      "bankAccount.branchName": ex.bankAccount.branchName ?? "",
      "bankAccount.branchNumber": ex.bankAccount.branchNumber ?? "",
    };

    for (let i = 0; i < 3; i++) {
      const idx = i + 1;
      mergedFields[`child${idx}.firstEntryDate`] =
        ex.children[i]?.firstEntryDate ?? "";
      mergedFields[`child${idx}.fileJoinDate`] =
        ex.children[i]?.fileJoinDate ?? "";
    }

    return mergedFields;
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  function openDraftPicker() {
    fileInputRef.current?.click();
  }

  function applyPdfDraftToForm(fieldsByPdfKey: Record<string, string>) {
    const nextDraft = structuredClone(
      emptyIntakeTemplate as any,
    ) as IntakeRecord;
    const nextExtras = deriveExtrasFromIntake(nextDraft);

    const maxChildIdx =
      [1, 2, 3].findLast((i) =>
        Object.keys(fieldsByPdfKey).some((k) => k.startsWith(`child${i}.`)),
      ) ?? 0;

    while ((nextDraft.intake.step6.children?.length ?? 0) < maxChildIdx) {
      nextDraft.intake.step6.children.push({
        lastName: "",
        firstName: "",
        gender: "",
        birthDate: "",
        nationality: "",
        israeliId: "",
        residenceCountry: "",
        entryDate: "",
      });
    }
    while (nextExtras.children.length < 3)
      nextExtras.children.push(emptyChildExtras());

    // Father
    if ("father.firstName" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step1.firstName",
        fieldsByPdfKey["father.firstName"] ?? "",
      );
    if ("father.familyName" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step1.lastName",
        fieldsByPdfKey["father.familyName"] ?? "",
      );
    if ("father.idNumber" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step1.israeliId",
        fieldsByPdfKey["father.idNumber"] ?? "",
      );
    if ("father.birthDate" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step1.birthDate",
        fieldsByPdfKey["father.birthDate"] ?? "",
      );
    if ("father.entryDate" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step2.entryDate",
        fieldsByPdfKey["father.entryDate"] ?? "",
      );
    if ("father.phoneMobile" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step1.phone",
        fieldsByPdfKey["father.phoneMobile"] ?? "",
      );

    // Father address
    if ("father.address.street" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step3.registeredAddress.street",
        fieldsByPdfKey["father.address.street"] ?? "",
      );
    if ("father.address.houseNumber" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step3.registeredAddress.houseNumber",
        fieldsByPdfKey["father.address.houseNumber"] ?? "",
      );
    if ("father.address.houseEntranceNumber" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step3.registeredAddress.entry",
        fieldsByPdfKey["father.address.houseEntranceNumber"] ?? "",
      );
    if ("father.address.apartmentNumber" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step3.registeredAddress.apartment",
        fieldsByPdfKey["father.address.apartmentNumber"] ?? "",
      );
    if ("father.address.city" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step3.registeredAddress.city",
        fieldsByPdfKey["father.address.city"] ?? "",
      );
    if ("father.address.zipcode" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step3.registeredAddress.zip",
        fieldsByPdfKey["father.address.zipcode"] ?? "",
      );

    // Father extras
    if ("father.phoneHome" in fieldsByPdfKey)
      nextExtras.father.phoneHome = fieldsByPdfKey["father.phoneHome"] ?? "";
    if ("father.emailPrefix" in fieldsByPdfKey)
      nextExtras.father.emailPrefix =
        fieldsByPdfKey["father.emailPrefix"] ?? "";
    if ("father.emailPostfix" in fieldsByPdfKey)
      nextExtras.father.emailPostfix =
        fieldsByPdfKey["father.emailPostfix"] ?? "";

    // Allowance requester
    if ("allowanceRequester.firstName" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step5.person.firstName",
        fieldsByPdfKey["allowanceRequester.firstName"] ?? "",
      );
    if ("allowanceRequester.lastName" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step5.person.lastName",
        fieldsByPdfKey["allowanceRequester.lastName"] ?? "",
      );
    if ("allowanceRequester.idNumber" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step5.person.israeliId",
        fieldsByPdfKey["allowanceRequester.idNumber"] ?? "",
      );
    if ("allowanceRequester.phoneMobile" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step5.phone",
        fieldsByPdfKey["allowanceRequester.phoneMobile"] ?? "",
      );

    // Allowance requester extras
    if ("allowanceRequester.phoneHome" in fieldsByPdfKey)
      nextExtras.allowanceRequester.phoneHome =
        fieldsByPdfKey["allowanceRequester.phoneHome"] ?? "";
    if ("allowanceRequester.emailPrefix" in fieldsByPdfKey)
      nextExtras.allowanceRequester.emailPrefix =
        fieldsByPdfKey["allowanceRequester.emailPrefix"] ?? "";
    if ("allowanceRequester.emailPostfix" in fieldsByPdfKey)
      nextExtras.allowanceRequester.emailPostfix =
        fieldsByPdfKey["allowanceRequester.emailPostfix"] ?? "";

    // Bank
    if ("bankAccount.bankName" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step4.bank.bankName",
        fieldsByPdfKey["bankAccount.bankName"] ?? "",
      );
    if ("bankAccount.accountNumber" in fieldsByPdfKey)
      setDeep(
        nextDraft,
        "intake.step4.bank.accountNumber",
        fieldsByPdfKey["bankAccount.accountNumber"] ?? "",
      );

    if ("bankAccount.owner1" in fieldsByPdfKey)
      nextExtras.bankAccount.owner1 =
        fieldsByPdfKey["bankAccount.owner1"] ?? "";
    if ("bankAccount.owner2" in fieldsByPdfKey)
      nextExtras.bankAccount.owner2 =
        fieldsByPdfKey["bankAccount.owner2"] ?? "";
    if ("bankAccount.branchName" in fieldsByPdfKey)
      nextExtras.bankAccount.branchName =
        fieldsByPdfKey["bankAccount.branchName"] ?? "";
    if ("bankAccount.branchNumber" in fieldsByPdfKey)
      nextExtras.bankAccount.branchNumber =
        fieldsByPdfKey["bankAccount.branchNumber"] ?? "";

    // Children (1..3)
    for (let i = 1; i <= 3; i++) {
      const idx = i - 1;
      const child = nextDraft.intake.step6.children[idx];
      if (!child) continue;

      const idK = `child${i}.idNumber`;
      const fnK = `child${i}.firstName`;
      const lnK = `child${i}.lastName`;
      const bdK = `child${i}.birthDate`;
      const edK = `child${i}.entryDate`;
      const fedK = `child${i}.firstEntryDate`;
      const fjdK = `child${i}.fileJoinDate`;

      if (idK in fieldsByPdfKey) child.israeliId = fieldsByPdfKey[idK] ?? "";
      if (fnK in fieldsByPdfKey) child.firstName = fieldsByPdfKey[fnK] ?? "";
      if (lnK in fieldsByPdfKey) child.lastName = fieldsByPdfKey[lnK] ?? "";
      if (bdK in fieldsByPdfKey) child.birthDate = fieldsByPdfKey[bdK] ?? "";
      if (edK in fieldsByPdfKey) child.entryDate = fieldsByPdfKey[edK] ?? "";

      if (fedK in fieldsByPdfKey)
        nextExtras.children[idx]!.firstEntryDate = fieldsByPdfKey[fedK] ?? "";
      if (fjdK in fieldsByPdfKey)
        nextExtras.children[idx]!.fileJoinDate = fieldsByPdfKey[fjdK] ?? "";
    }

    setDraft(nextDraft);
    setExtras(nextExtras);
  }

  async function onDraftFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Draft JSON must be an object of { fieldKey: value }");
      }

      const fieldsByPdfKey: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        fieldsByPdfKey[k] = v == null ? "" : String(v);
      }

      applyPdfDraftToForm(fieldsByPdfKey);
    } catch (err: any) {
      alert(`Failed to load draft: ${err?.message ?? String(err)}`);
    } finally {
      e.target.value = "";
    }
  }

  async function handleSubmit(mode: SubmitMode) {
    if (!payload || !extras) return;

    if (mode === "draft") setIsSavingDraft(true);
    else setIsGeneratingPdf(true);

    try {
      const mergedFields = buildMergedFields(payload, extras);

      // if (mode === "draft") {
      //   const fieldsByPdfKey = pickFieldMapKeys(mergedFields, fieldMap);

      //   const s1 = payload.intake.step1;
      //   const fileName = `draft_child_allowance_${safePart(
      //     s1.israeliId ||
      //       s1.passportNumber ||
      //       s1.lastName ||
      //       s1.email ||
      //       "unknown",
      //   )}_${new Date().toISOString().slice(0, 10)}.json`;

      //   downloadDraftJson(fileName, fieldsByPdfKey);
      //   return;
      // }

      if (mode === "draft") {
        // choose a human title like Step4
        const s1 = payload.intake.step1;
        const title =
          `${(s1.firstName ?? "").trim()} ${(s1.lastName ?? "").trim()}`.trim() ||
          s1.israeliId ||
          s1.email ||
          "Untitled";

        // save EXACTLY what you want to restore later
        const savedId = await saveDraftToDb({
          formSlug: "child-allowance-request",
          title,
          draft: payload,
          extras, // you can also strip things if you ever add images
          existingInstanceId: instanceId,
        });

        setInstanceId(savedId);
        return;
      }

      const [tplRes, fontRes] = await Promise.all([
        fetch("/forms/child-allowance-request.pdf"),
        fetch("/fonts/SimplerPro-Regular.otf"),
      ]);

      if (!tplRes.ok) throw new Error("Failed to load template PDF");
      if (!fontRes.ok) throw new Error("Failed to load font");

      const templateBytes = new Uint8Array(await tplRes.arrayBuffer());
      const fontBytes = new Uint8Array(await fontRes.arrayBuffer());

      const outBytes = await fillFieldsToNewPdfBytesClient(
        templateBytes,
        mergedFields,
        fieldMap,
        {
          fontBytes,
          autoDetectRtl: true,
          defaultRtlAlignRight: true,
        },
      );

      // const s1 = payload.intake.step1;
      // const fileName = `child_allowance_${safePart(
      //   s1.israeliId || s1.passportNumber || s1.lastName || "unknown",
      // )}_${new Date().toISOString().slice(0, 10)}.pdf`;

      // const key = `pdf_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      // sessionStorage.setItem(
      //   key,
      //   JSON.stringify({ fileName, bytesBase64: uint8ToBase64(outBytes) }),
      // );

      // router.push(
      //   `/forms/child-allowance-request/download?key=${encodeURIComponent(key)}`,
      // );

      const s1 = payload.intake.step1;
      const title =
        `${(s1.firstName ?? "").trim()} ${(s1.lastName ?? "").trim()}`.trim() ||
        s1.israeliId ||
        s1.email ||
        "Untitled";

      // 1) save/update the draft row (so the pdf is linked to an instance)
      const savedId = await saveDraftToDb({
        formSlug: "child-allowance-request",
        title,
        draft: payload,
        extras,
        existingInstanceId: instanceId,
      });
      setInstanceId(savedId);

      // 2) upload pdf + insert generated_pdfs row
      await uploadPdf(outBytes, savedId, title);

      // 3) (optional) immediately download the latest pdf for this instance
      await downloadLatestPdfForCurrentUser({
        instanceId: savedId,
        formSlugPrefix: "/child-allowance-request/",
      });
    } finally {
      setIsSavingDraft(false);
      setIsGeneratingPdf(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleSubmit("final");
  }

  if (!draft || !payload || !extras) {
    return <main className={styles.loading}>Loading…</main>;
  }

  const kids = draft.intake.step6.children ?? [];

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>טופס בקשה לקצבת ילדים</h1>

      <form onSubmit={onSubmit} className={styles.form}>
        <SectionTitle>פרטי האב (DB: step1/step2/step3)</SectionTitle>

        <Field label="שם פרטי">
          <input
            className={styles.input}
            value={draft.intake.step1.firstName}
            onChange={(e) => update("intake.step1.firstName", e.target.value)}
          />
        </Field>

        <Field label="שם משפחה">
          <input
            className={styles.input}
            value={draft.intake.step1.lastName}
            onChange={(e) => update("intake.step1.lastName", e.target.value)}
          />
        </Field>

        <Field label="מספר זהות">
          <input
            className={styles.input}
            value={draft.intake.step1.israeliId}
            onChange={(e) => update("intake.step1.israeliId", e.target.value)}
          />
        </Field>

        <Field label="תאריך לידה">
          <input
            className={styles.input}
            type="date"
            value={draft.intake.step1.birthDate}
            onChange={(e) => update("intake.step1.birthDate", e.target.value)}
          />
        </Field>

        <Field label="תאריך כניסה לישראל (DB: step2.entryDate)">
          <input
            className={styles.input}
            type="date"
            value={draft.intake.step2.entryDate}
            onChange={(e) => update("intake.step2.entryDate", e.target.value)}
          />
        </Field>

        <SectionTitle>כתובת האב (DB: step3.registeredAddress)</SectionTitle>

        <Field label="רחוב">
          <input
            className={styles.input}
            value={draft.intake.step3.registeredAddress.street}
            onChange={(e) =>
              update("intake.step3.registeredAddress.street", e.target.value)
            }
          />
        </Field>

        <div className={styles.row2}>
          <Field label="מספר בית">
            <input
              className={styles.input}
              value={draft.intake.step3.registeredAddress.houseNumber}
              onChange={(e) =>
                update(
                  "intake.step3.registeredAddress.houseNumber",
                  e.target.value,
                )
              }
            />
          </Field>

          <Field label="כניסה">
            <input
              className={styles.input}
              value={draft.intake.step3.registeredAddress.entry}
              onChange={(e) =>
                update("intake.step3.registeredAddress.entry", e.target.value)
              }
            />
          </Field>

          <Field label="דירה">
            <input
              className={styles.input}
              value={draft.intake.step3.registeredAddress.apartment}
              onChange={(e) =>
                update(
                  "intake.step3.registeredAddress.apartment",
                  e.target.value,
                )
              }
            />
          </Field>

          <Field label="מיקוד">
            <input
              className={styles.input}
              value={draft.intake.step3.registeredAddress.zip}
              onChange={(e) =>
                update("intake.step3.registeredAddress.zip", e.target.value)
              }
            />
          </Field>
        </div>

        <Field label="עיר">
          <input
            className={styles.input}
            value={draft.intake.step3.registeredAddress.city}
            onChange={(e) =>
              update("intake.step3.registeredAddress.city", e.target.value)
            }
          />
        </Field>

        <SectionTitle>טלפון / אימייל האב</SectionTitle>

        <Field label="טלפון נייד (DB: step1.phone)">
          <input
            className={styles.input}
            value={draft.intake.step1.phone}
            onChange={(e) => update("intake.step1.phone", e.target.value)}
            inputMode="tel"
          />
        </Field>

        <Field label="טלפון בבית (PDF בלבד)">
          <input
            className={styles.input}
            value={extras.father.phoneHome}
            onChange={(e) =>
              setExtras((p) =>
                p
                  ? { ...p, father: { ...p.father, phoneHome: e.target.value } }
                  : p,
              )
            }
            inputMode="tel"
          />
        </Field>

        <div className={styles.row2}>
          <Field label="אימייל (לפני @) (PDF בלבד)">
            <input
              className={styles.input}
              value={extras.father.emailPrefix}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        father: { ...p.father, emailPrefix: e.target.value },
                      }
                    : p,
                )
              }
              dir="ltr"
            />
          </Field>

          <Field label="אימייל (אחרי @) (PDF בלבד)">
            <input
              className={styles.input}
              value={extras.father.emailPostfix}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        father: { ...p.father, emailPostfix: e.target.value },
                      }
                    : p,
                )
              }
              dir="ltr"
            />
          </Field>
        </div>

        <SectionTitle>
          פרטי מבקש הקצבה (DB: step5 + step3 mailing/registered)
        </SectionTitle>

        <Field label="שם פרטי (DB: step5.person.firstName)">
          <input
            className={styles.input}
            value={draft.intake.step5.person.firstName}
            onChange={(e) =>
              update("intake.step5.person.firstName", e.target.value)
            }
          />
        </Field>

        <Field label="שם משפחה (DB: step5.person.lastName)">
          <input
            className={styles.input}
            value={draft.intake.step5.person.lastName}
            onChange={(e) =>
              update("intake.step5.person.lastName", e.target.value)
            }
          />
        </Field>

        <Field label="מספר זהות (DB: step5.person.israeliId)">
          <input
            className={styles.input}
            value={draft.intake.step5.person.israeliId}
            onChange={(e) =>
              update("intake.step5.person.israeliId", e.target.value)
            }
          />
        </Field>

        <Field label="טלפון נייד (DB: step5.phone)">
          <input
            className={styles.input}
            value={draft.intake.step5.phone}
            onChange={(e) => update("intake.step5.phone", e.target.value)}
            inputMode="tel"
          />
        </Field>

        <Field label="טלפון בבית (PDF בלבד)">
          <input
            className={styles.input}
            value={extras.allowanceRequester.phoneHome}
            onChange={(e) =>
              setExtras((p) =>
                p
                  ? {
                      ...p,
                      allowanceRequester: {
                        ...p.allowanceRequester,
                        phoneHome: e.target.value,
                      },
                    }
                  : p,
              )
            }
            inputMode="tel"
          />
        </Field>

        <div className={styles.row2}>
          <Field label="אימייל (לפני @) (PDF בלבד)">
            <input
              className={styles.input}
              value={extras.allowanceRequester.emailPrefix}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        allowanceRequester: {
                          ...p.allowanceRequester,
                          emailPrefix: e.target.value,
                        },
                      }
                    : p,
                )
              }
              dir="ltr"
            />
          </Field>

          <Field label="אימייל (אחרי @) (PDF בלבד)">
            <input
              className={styles.input}
              value={extras.allowanceRequester.emailPostfix}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        allowanceRequester: {
                          ...p.allowanceRequester,
                          emailPostfix: e.target.value,
                        },
                      }
                    : p,
                )
              }
              dir="ltr"
            />
          </Field>
        </div>

        <SectionTitle>חשבון בנק (DB: step4.bank + PDF extras)</SectionTitle>

        <Field label="בעל/ת חשבון 1 (PDF בלבד)">
          <input
            className={styles.input}
            value={extras.bankAccount.owner1}
            onChange={(e) =>
              setExtras((p) =>
                p
                  ? {
                      ...p,
                      bankAccount: { ...p.bankAccount, owner1: e.target.value },
                    }
                  : p,
              )
            }
          />
        </Field>

        <Field label="בעל/ת חשבון 2 (PDF בלבד)">
          <input
            className={styles.input}
            value={extras.bankAccount.owner2}
            onChange={(e) =>
              setExtras((p) =>
                p
                  ? {
                      ...p,
                      bankAccount: { ...p.bankAccount, owner2: e.target.value },
                    }
                  : p,
              )
            }
          />
        </Field>

        <Field label="שם הבנק (DB: step4.bank.bankName)">
          <input
            className={styles.input}
            value={draft.intake.step4.bank.bankName}
            onChange={(e) =>
              update("intake.step4.bank.bankName", e.target.value)
            }
          />
        </Field>

        <div className={styles.row2}>
          <Field label="שם סניף (PDF בלבד)">
            <input
              className={styles.input}
              value={extras.bankAccount.branchName}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        bankAccount: {
                          ...p.bankAccount,
                          branchName: e.target.value,
                        },
                      }
                    : p,
                )
              }
            />
          </Field>

          <Field label="מספר סניף (DB: step4.bank.branch)">
            <input
              className={styles.input}
              value={extras.bankAccount.branchNumber}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        bankAccount: {
                          ...p.bankAccount,
                          branchNumber: e.target.value,
                        },
                      }
                    : p,
                )
              }
              dir="ltr"
            />
          </Field>
        </div>

        <Field label="מספר חשבון (DB: step4.bank.accountNumber)">
          <input
            className={styles.input}
            value={draft.intake.step4.bank.accountNumber}
            onChange={(e) =>
              update("intake.step4.bank.accountNumber", e.target.value)
            }
            dir="ltr"
          />
        </Field>

        <SectionTitle>
          פרטי הילדים (DB: step6.children) — ה-PDF תומך עד 3
        </SectionTitle>

        {kids.map((child, i) => (
          <div key={i} className={styles.kidCard}>
            <div className={styles.kidHeader}>ילד/ה #{i + 1}</div>

            <Field label="מספר זהות (DB: child.israeliId)">
              <input
                className={styles.input}
                value={child.israeliId}
                onChange={(e) => updateChild(i, "israeliId", e.target.value)}
                dir="ltr"
              />
            </Field>

            <Field label="שם משפחה (DB: child.lastName)">
              <input
                className={styles.input}
                value={child.lastName}
                onChange={(e) => updateChild(i, "lastName", e.target.value)}
              />
            </Field>

            <Field label="שם פרטי (DB: child.firstName)">
              <input
                className={styles.input}
                value={child.firstName}
                onChange={(e) => updateChild(i, "firstName", e.target.value)}
              />
            </Field>

            <Field label="תאריך לידה (DB: child.birthDate)">
              <input
                className={styles.input}
                type="date"
                value={child.birthDate}
                onChange={(e) => updateChild(i, "birthDate", e.target.value)}
              />
            </Field>

            <Field label="תאריך כניסה (DB: child.entryDate)">
              <input
                className={styles.input}
                type="date"
                value={child.entryDate}
                onChange={(e) => updateChild(i, "entryDate", e.target.value)}
              />
            </Field>

            <Field label="תאריך כניסה ראשון (PDF בלבד)">
              <input
                className={styles.input}
                type="date"
                value={extras.children[i]?.firstEntryDate ?? ""}
                onChange={(e) =>
                  setExtras((p) => {
                    if (!p) return p;
                    const next = structuredClone(p);
                    if (!next.children[i])
                      next.children[i] = emptyChildExtras();
                    next.children[i]!.firstEntryDate = e.target.value;
                    return next;
                  })
                }
              />
            </Field>

            <Field label="תאריך פתיחת תיק/הצטרפות (PDF בלבד)">
              <input
                className={styles.input}
                type="date"
                value={extras.children[i]?.fileJoinDate ?? ""}
                onChange={(e) =>
                  setExtras((p) => {
                    if (!p) return p;
                    const next = structuredClone(p);
                    if (!next.children[i])
                      next.children[i] = emptyChildExtras();
                    next.children[i]!.fileJoinDate = e.target.value;
                    return next;
                  })
                }
              />
            </Field>

            {i >= 2 ? (
              <div className={styles.note}>
                שים לב: ה-PDF תומך עד 3 ילדים. ילדים נוספים יוצגו כאן ב-UI, אבל
                לא ייכנסו ל-PDF.
              </div>
            ) : null}
          </div>
        ))}

        <button
          type="button"
          onClick={addChildRow}
          className={styles.buttonSecondary}
        >
          + הוסף ילד/ה נוסף/ת
        </button>

        <div className={styles.actions}>
          {/* <button
            type="button"
            className={styles.buttonSecondary}
            onClick={() =>
              downloadJson(
                `intake_${safePart(
                  draft.intake.step1.email ||
                    draft.intake.step1.israeliId ||
                    "demo",
                )}.json`,
                payload,
              )
            }
          >
            הורד JSON (DB record)
          </button> */}

          {/* <button
            type="button"
            className={styles.buttonSecondary}
            onClick={() => handleSubmit("draft")}
            disabled={isSavingDraft || isGeneratingPdf}
          >
            {isSavingDraft ? "שומר טיוטה..." : "שמור טיוטה"}
          </button> */}

          <button
            type="submit"
            className={styles.buttonPrimary}
            disabled={isSavingDraft || isGeneratingPdf}
          >
            {isGeneratingPdf ? "מייצר PDF..." : "הורד PDF"}
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={onDraftFileSelected}
          />

          {/* <button
            type="button"
            className={styles.buttonSecondary}
            onClick={async () => {
              try {
                const row = await loadLatestDraftFromDb(
                  "child-allowance-request",
                );
                setInstanceId(row.id);
                setDraft(row.draft as IntakeRecord);
                // restore saved extras; if missing, derive from draft
                setExtras(
                  (row.extras ??
                    deriveExtrasFromIntake(row.draft)) as ExtrasState,
                );
              } catch (e: any) {
                alert(e?.message ?? String(e));
              }
            }}
            disabled={isSavingDraft || isGeneratingPdf}
          >
            טען טיוטה אחרונה
          </button> */}
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={async () => {
              try {
                await downloadLatestPdfForCurrentUser({
                  instanceId,
                  formSlugPrefix: "/child-allowance-request/",
                });
              } catch (e: any) {
                alert(e?.message ?? String(e));
              }
            }}
          >
            הורד PDF אחרון
          </button>
        </div>

        <details className={styles.preview}>
          <summary>תצוגה מקדימה של ה-JSON (DB record)</summary>
          <pre className={styles.previewPre}>
            {JSON.stringify(payload, null, 2)}
          </pre>
        </details>
      </form>
    </main>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className={styles.sectionTitle}>{children}</h2>;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span>
        {label} {required ? <span className={styles.required}>*</span> : null}
      </span>
      {children}
    </label>
  );
}
