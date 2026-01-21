// // "use client";

// // import React, { useEffect, useMemo, useState } from "react";
// // import { useRouter, useSearchParams } from "next/navigation";
// // import demo from "@/public/demo/intake.demo.json";

// // import { fillFieldsToNewPdfBytesClient } from "@/lib/pdf/fillPdfClient";
// // import { createClient } from "@/lib/supabase/client";

// // import { fieldMap } from "../fieldMap";
// // import { intakeToPdfFields } from "../intakeToPdfFields";
// // import styles from "./page.module.css";

// // type IntakeRecord = typeof demo;

// // type Trip = { startDate: string; endDate: string; purpose: string };

// // type ParentExtras = {
// //   firstNameHebrew: string;
// //   lastNameHebrew: string;
// //   firstNameEnglish: string;
// //   lastNameEnglish: string;
// //   idNumber: string;
// //   passportNumber: string;
// // };

// // type PartnerExtras = {
// //   firstNameEnglish: string;
// //   lastNameEnglish: string;
// // };

// // type ChildExtras = {
// //   firstEntryDate: string;
// //   fileJoinDate: string;
// // };

// // type ExtrasState = {
// //   // basic english names + previous name
// //   firstNameEnglish: string;
// //   lastNameEnglish: string;
// //   prevLastNameEnglish: string;

// //   // birth
// //   birthCountry: string;
// //   birthCity: string;

// //   // visa
// //   purposeOfStay: string;

// //   // address phone
// //   addressPhoneNumber: string;

// //   // parents
// //   father: ParentExtras;
// //   mother: ParentExtras;

// //   // partner + family
// //   partner: PartnerExtras;
// //   numberChildrenUnder18: string;

// //   // work/income
// //   employerName: string;
// //   employerAddress: string;
// //   selfEmploymentStartDate: string;
// //   unemployedWithIncomeStartDate: string;
// //   selfEmployedYearlyIncome: string;
// //   unemployedYearlyIncome: string;

// //   // trips
// //   trips: Trip[];

// //   // optional “extras-only” dates/fields you had in other pages
// //   requesterEntryDate?: string;

// //   // children extra dates (aligned with intake.step6.children)
// //   children: ChildExtras[];
// // };

// // function SectionTitle({ children }: { children: React.ReactNode }) {
// //   return <h2 className={styles.sectionTitle}>{children}</h2>;
// // }

// // function Field({
// //   label,
// //   required,
// //   children,
// // }: {
// //   label: string;
// //   required?: boolean;
// //   children: React.ReactNode;
// // }) {
// //   return (
// //     <label className={styles.field}>
// //       <span className={styles.fieldLabel}>
// //         {label}{" "}
// //         {required ? <span className={styles.requiredStar}>*</span> : null}
// //       </span>
// //       {children}
// //     </label>
// //   );
// // }

// // function safePart(title: string) {
// //   return (
// //     (title ?? "")
// //       .toString()
// //       .trim()
// //       .replace(/[^a-zA-Z0-9_-]+/g, "_")
// //       .slice(0, 60) || "Untitled"
// //   );
// // }

// // function downloadPdf(filename: string, pdfBytes: Uint8Array) {
// //   const bytes = new Uint8Array(pdfBytes);
// //   const blob = new Blob([bytes.buffer], { type: "application/pdf" });
// //   const url = URL.createObjectURL(blob);
// //   const a = document.createElement("a");
// //   a.href = url;
// //   a.download = filename;
// //   document.body.appendChild(a);
// //   a.click();
// //   a.remove();
// //   URL.revokeObjectURL(url);
// // }

// // function downloadJson(filename: string, data: unknown) {
// //   const blob = new Blob([JSON.stringify(data, null, 2)], {
// //     type: "application/json;charset=utf-8",
// //   });
// //   const url = URL.createObjectURL(blob);
// //   const a = document.createElement("a");
// //   a.href = url;
// //   a.download = filename;
// //   document.body.appendChild(a);
// //   a.click();
// //   a.remove();
// //   URL.revokeObjectURL(url);
// // }

// // function emptyTrip(): Trip {
// //   return { startDate: "", endDate: "", purpose: "" };
// // }

// // function emptyChildExtras(): ChildExtras {
// //   return { firstEntryDate: "", fileJoinDate: "" };
// // }

// // function deriveExtrasFromIntake(d: IntakeRecord): ExtrasState {
// //   const kids = d.intake.step6.children ?? [];
// //   const kidsExtras: ChildExtras[] = kids.map((k) => ({
// //     firstEntryDate: k.entryDate ?? "",
// //     fileJoinDate: "",
// //   }));

// //   return {
// //     firstNameEnglish: "",
// //     lastNameEnglish: "",
// //     prevLastNameEnglish: "",

// //     birthCountry: "",
// //     birthCity: "",

// //     purposeOfStay: d.intake.step2.visaType ?? "",

// //     addressPhoneNumber: d.intake.step1.phone ?? "",

// //     father: {
// //       firstNameHebrew: "",
// //       lastNameHebrew: "",
// //       firstNameEnglish: "",
// //       lastNameEnglish: "",
// //       idNumber: "",
// //       passportNumber: "",
// //     },

// //     mother: {
// //       firstNameHebrew: "",
// //       lastNameHebrew: "",
// //       firstNameEnglish: "",
// //       lastNameEnglish: "",
// //       idNumber: "",
// //       passportNumber: "",
// //     },

// //     partner: {
// //       firstNameEnglish: "",
// //       lastNameEnglish: "",
// //     },

// //     numberChildrenUnder18: String((kids.length ?? 0) || ""),

// //     employerName: "",
// //     employerAddress: "",
// //     selfEmploymentStartDate: "",
// //     unemployedWithIncomeStartDate: "",
// //     selfEmployedYearlyIncome: "",
// //     unemployedYearlyIncome: "",

// //     trips: [emptyTrip()],
// //     children: kidsExtras,
// //   };
// // }

// "use client";

// import React, { useMemo } from "react";
// import { useRouter } from "next/navigation";

// import { fillFieldsToNewPdfBytesClient } from "@/lib/pdf/fillPdfClient";
// import { createClient } from "@/lib/supabase/client";

// import { fieldMap } from "../fieldMap";
// import { intakeToPdfFields } from "../intakeToPdfFields";
// import styles from "./page.module.css";
// import { useWizard } from "../WizardProvider"; // ✅ use wizard

// function SectionTitle({ children }: { children: React.ReactNode }) {
//   return <h2 className={styles.sectionTitle}>{children}</h2>;
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
//     <label className={styles.field}>
//       <span className={styles.fieldLabel}>
//         {label}{" "}
//         {required ? <span className={styles.requiredStar}>*</span> : null}
//       </span>
//       {children}
//     </label>
//   );
// }

// function safePart(title: string) {
//   return (
//     (title ?? "")
//       .toString()
//       .trim()
//       .replace(/[^a-zA-Z0-9_-]+/g, "_")
//       .slice(0, 60) || "Untitled"
//   );
// }

// function downloadPdf(filename: string, pdfBytes: Uint8Array) {
//   const bytes = new Uint8Array(pdfBytes);
//   const blob = new Blob([bytes.buffer], { type: "application/pdf" });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   document.body.appendChild(a);
//   a.click();
//   a.remove();
//   URL.revokeObjectURL(url);
// }

// function emptyChildExtras() {
//   return { firstEntryDate: "", fileJoinDate: "" };
// }

// export default function PersonRegistrationPage() {
//   const router = useRouter();

//   const {
//     draft,
//     extras,
//     setExtras,
//     update,
//     updateChild, // ✅ must exist in this form’s WizardProvider
//     instanceId,
//     isHydrated,
//   } = useWizard();

//   const payload = useMemo(() => {
//     if (!draft) return null;

//     const kids = (draft.intake.step6.children ?? []).filter(
//       (c) =>
//         (c.firstName ?? "").trim() ||
//         (c.lastName ?? "").trim() ||
//         (c.israeliId ?? "").trim() ||
//         (c.birthDate ?? "").trim(),
//     );

//     const cleaned = structuredClone(draft);
//     cleaned.intake.step6.children = kids;
//     return cleaned;
//   }, [draft]);

//   if (!isHydrated || !draft || !payload || !extras) {
//     return <main className={styles.page}>Loading…</main>;
//   }

//   async function saveDraft(existingInstanceId?: string) {
//     const supabase = createClient();

//     const { data: userRes, error: userErr } = await supabase.auth.getUser();
//     if (userErr) throw userErr;

//     const user = userRes.user;
//     if (!user) throw new Error("Not logged in");

//     if (!draft) throw new Error("No draft to save");

//     const title =
//       `${draft.intake?.step1?.firstName ?? ""} ${draft.intake?.step1?.lastName ?? ""}`.trim() ||
//       draft.intake?.step1?.israeliId ||
//       "Untitled";

//     if (!existingInstanceId) {
//       const { data, error } = await supabase
//         .from("form_instances")
//         .insert({
//           user_id: user.id,
//           form_slug: "person-registration-request",
//           title,
//           draft: payload,
//           extras,
//         })
//         .select("id")
//         .single();

//       if (error) throw error;
//       return data.id as string;
//     } else {
//       const { error } = await supabase
//         .from("form_instances")
//         .update({
//           title,
//           draft: payload,
//           extras,
//         })
//         .eq("id", existingInstanceId)
//         .eq("user_id", user.id);

//       if (error) throw error;
//       return existingInstanceId;
//     }
//   }

//   async function onDownloadPdf(e: React.FormEvent) {
//     e.preventDefault();

//     // ensure draft is saved (so instanceId exists)
//     const savedId = await saveDraft(instanceId ?? undefined);

//     const fields = intakeToPdfFields(draft as any, extras as any);

//     const [tplRes, fontRes] = await Promise.all([
//       fetch("/forms/person-registration.pdf"),
//       fetch("/fonts/SimplerPro-Regular.otf"),
//     ]);

//     if (!tplRes.ok) {
//       throw new Error(
//         `Failed to load template PDF: ${tplRes.status} ${tplRes.statusText} url=${tplRes.url}`,
//       );
//     }
//     if (!fontRes.ok) {
//       throw new Error(
//         `Failed to load font: ${fontRes.status} ${fontRes.statusText} url=${fontRes.url}`,
//       );
//     }

//     const templateBytes = new Uint8Array(await tplRes.arrayBuffer());
//     const fontBytes = new Uint8Array(await fontRes.arrayBuffer());

//     const outBytes = await fillFieldsToNewPdfBytesClient(
//       templateBytes,
//       fields,
//       fieldMap,
//       {
//         fontBytes,
//         autoDetectRtl: true,
//         defaultRtlAlignRight: true,
//       },
//     );

//       if (!draft) return;

//     const s1 = draft.intake.step1;
//     const fileName = `person_registration_${safePart(
//       s1.israeliId || s1.passportNumber || s1.lastName || "unknown",
//     )}_${new Date().toISOString().slice(0, 10)}.pdf`;

//     downloadPdf(fileName, outBytes);

//     // optional: if you want to keep editing next steps with the saved instanceId
//     // router.push(savedId ? `./step-4?instanceId=${encodeURIComponent(savedId)}` : "./step-4");
//   }

//   const kids = draft.intake.step6.children ?? [];
//   const nextUrl = instanceId
//     ? `./step-4?instanceId=${encodeURIComponent(instanceId)}`
//     : "./step-4";

// // export default function PersonRegistrationPage() {
// //   const router = useRouter();

// //   const sp = useSearchParams();
// //   const instanceId = sp.get("instanceId") ?? undefined;

// //   const [draft, setDraft] = useState<IntakeRecord | null>(null);
// //   const [extras, setExtras] = useState<ExtrasState | null>(null);

// //   useEffect(() => {
// //     const d = structuredClone(demo) as IntakeRecord;
// //     setDraft(d);
// //     setExtras(deriveExtrasFromIntake(d));
// //   }, []);

// //   function update(path: string, value: any) {
// //     setDraft((prev) => {
// //       if (!prev) return prev;
// //       const next: any = structuredClone(prev);
// //       const parts = path.split(".");
// //       let cur: any = next;
// //       for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
// //       cur[parts[parts.length - 1]] = value;
// //       return next;
// //     });
// //   }

// //   function updateChild(
// //     index: number,
// //     key: keyof IntakeRecord["intake"]["step6"]["children"][number],
// //     value: string,
// //   ) {
// //     setDraft((prev) => {
// //       if (!prev) return prev;
// //       const next = structuredClone(prev);
// //       if (!next.intake.step6.children[index]) return next;
// //       (next.intake.step6.children[index] as any)[key] = value;
// //       return next;
// //     });
// //   }

// //   const payload = useMemo(() => {
// //     if (!draft) return null;

// //     const kids = (draft.intake.step6.children ?? []).filter(
// //       (c) =>
// //         (c.firstName ?? "").trim() ||
// //         (c.lastName ?? "").trim() ||
// //         (c.israeliId ?? "").trim() ||
// //         (c.birthDate ?? "").trim(),
// //     );

// //     const cleaned = structuredClone(draft);
// //     cleaned.intake.step6.children = kids;
// //     return cleaned;
// //   }, [draft]);

// //   async function saveDraft(existingInstanceId?: string) {
// //     const supabase = createClient();

// //     const { data: userRes, error: userErr } = await supabase.auth.getUser();
// //     if (userErr) throw userErr;
// //     const user = userRes.user;
// //     if (!user) throw new Error("Not logged in");
// //     if (!draft || !extras) throw new Error("No data to save");

// //     const title =
// //       `${draft.intake?.step1?.firstName ?? ""} ${draft.intake?.step1?.lastName ?? ""}`.trim() ||
// //       draft.intake?.step1?.israeliId ||
// //       "Untitled";

// //     if (!existingInstanceId) {
// //       const { data, error } = await supabase
// //         .from("form_instances")
// //         .insert({
// //           user_id: user.id,
// //           form_slug: "person-registration-request",
// //           title,
// //           draft: payload ?? draft,
// //           extras,
// //         })
// //         .select("id")
// //         .single();

// //       if (error) throw error;
// //       return data.id as string;
// //     } else {
// //       const { error } = await supabase
// //         .from("form_instances")
// //         .update({
// //           title,
// //           draft: payload ?? draft,
// //           extras,
// //         })
// //         .eq("id", existingInstanceId)
// //         .eq("user_id", user.id);

// //       if (error) throw error;
// //       return existingInstanceId;
// //     }
// //   }

// //   async function onDownloadPdf(e: React.FormEvent) {
// //     e.preventDefault();
// //     if (!draft || !extras) return;

// //     await saveDraft(instanceId);

// //     const fields = intakeToPdfFields(draft as any, extras as any);

// //     const [tplRes, fontRes] = await Promise.all([
// //       fetch("/forms/person-registration.pdf"),
// //       fetch("/fonts/SimplerPro-Regular.otf"),
// //     ]);

// //     if (!tplRes.ok) {
// //       throw new Error(
// //         `Failed to load template PDF: ${tplRes.status} ${tplRes.statusText} url=${tplRes.url}`,
// //       );
// //     }
// //     if (!fontRes.ok) {
// //       throw new Error(
// //         `Failed to load font: ${fontRes.status} ${fontRes.statusText} url=${fontRes.url}`,
// //       );
// //     }

// //     const templateBytes = new Uint8Array(await tplRes.arrayBuffer());
// //     const fontBytes = new Uint8Array(await fontRes.arrayBuffer());

// //     const outBytes = await fillFieldsToNewPdfBytesClient(
// //       templateBytes,
// //       fields,
// //       fieldMap,
// //       {
// //         fontBytes,
// //         autoDetectRtl: true,
// //         defaultRtlAlignRight: true,
// //       },
// //     );

// //     const s1 = draft.intake.step1;
// //     const fileName = `person_registration_${safePart(
// //       s1.israeliId || s1.passportNumber || s1.lastName || "unknown",
// //     )}_${new Date().toISOString().slice(0, 10)}.pdf`;

// //     downloadPdf(fileName, outBytes);
// //   }

// //   if (!draft || !payload || !extras) {
// //     return <main className={styles.page}>Loading…</main>;
// //   }

// //   const kids = draft.intake.step6.children ?? [];
// //   const nextUrl = instanceId
// //     ? `./step-4?instanceId=${encodeURIComponent(instanceId)}`
// //     : "./step-4";

//   return (
//     <main className={styles.page}>
//       {/* Match your “wizard-style” header */}
//       <div className={styles.header}>
//         <div className={styles.headerText}>استبيان تسجيل شخص</div>
//         <div className={styles.headerText}>שאלון לרישום נפש</div>
//       </div>

//       <form onSubmit={onDownloadPdf} className={styles.form}>
//         <SectionTitle>البيانات الشخصية פרטים אישיים </SectionTitle>
//         <SectionTitle>
//           كما هو مدوّن في جواز السفر כפי שרשומים בדרכון{" "}
//         </SectionTitle>

//         <Field label="الاسم الشخصي    שם פרטי">
//           <input
//             value={draft.intake.step1.firstName}
//             onChange={(e) => update("intake.step1.firstName", e.target.value)}
//             className={styles.input}
//           />
//         </Field>

//         {/* <Field label="שם פרטי (אנגלית) (PDF בלבד)">
//           <input
//             value={extras.firstNameEnglish}
//             onChange={(e) =>
//               setExtras((p) =>
//                 p ? { ...p, firstNameEnglish: e.target.value } : p,
//               )
//             }
//             className={styles.input}
//             dir="ltr"
//           />
//         </Field> */}

//         <Field label="اسم العائلة   שם משפחה   ">
//           <input
//             value={draft.intake.step1.lastName}
//             onChange={(e) => update("intake.step1.lastName", e.target.value)}
//             className={styles.input}
//           />
//         </Field>

//         {/* <Field label="שם משפחה (אנגלית) (PDF בלבד)">
//           <input
//             value={extras.lastNameEnglish}
//             onChange={(e) =>
//               setExtras((p) =>
//                 p ? { ...p, lastNameEnglish: e.target.value } : p,
//               )
//             }
//             className={styles.input}
//             dir="ltr"
//           />
//         </Field> */}

//         {/* <SectionTitle>שמות קודמים</SectionTitle> */}

//         {/* <Field label="שם פרטי קודם (עברית) (DB: step1.oldFirstName)">
//           <input
//             value={draft.intake.step1.oldFirstName}
//             onChange={(e) =>
//               update("intake.step1.oldFirstName", e.target.value)
//             }
//             className={styles.input}
//           />
//         </Field> */}

//         {/* <Field label="שם משפחה קודם (עברית) (DB: step1.oldLastName)">
//           <input
//             value={draft.intake.step1.oldLastName}
//             onChange={(e) => update("intake.step1.oldLastName", e.target.value)}
//             className={styles.input}
//           />
//         </Field> */}

//         {/* <Field label="שם משפחה קודם (אנגלית) (PDF בלבד)">
//           <input
//             value={extras.prevLastNameEnglish}
//             onChange={(e) =>
//               setExtras((p) =>
//                 p ? { ...p, prevLastNameEnglish: e.target.value } : p,
//               )
//             }
//             className={styles.input}
//             dir="ltr"
//           />
//         </Field> */}

//         {/* <SectionTitle>לידה ואזרחות</SectionTitle> */}

//         <Field label="تاريخ الميلاد   תאריך לידה  ">
//           <input
//             type="date"
//             value={draft.intake.step1.birthDate}
//             onChange={(e) => update("intake.step1.birthDate", e.target.value)}
//             className={styles.input}
//           />
//         </Field>

//         <Field label="بلد الميلاد   ארץ לידה">
//           <input
//             value={extras.birthCountry}
//             onChange={(e) =>
//               setExtras((p) => (p ? { ...p, birthCountry: e.target.value } : p))
//             }
//             className={styles.input}
//           />
//         </Field>

//         <Field label="مدينة الميلاد   עיר לידה">
//           <input
//             value={extras.birthCity}
//             onChange={(e) =>
//               setExtras((p) => (p ? { ...p, birthCity: e.target.value } : p))
//             }
//             className={styles.input}
//           />
//         </Field>

//         <Field label="الجنسية   אזרחות">
//           <input
//             value={draft.intake.step1.nationality}
//             onChange={(e) => update("intake.step1.nationality", e.target.value)}
//             className={styles.input}
//           />
//         </Field>

//         {/* <SectionTitle>דרכון</SectionTitle> */}

//         <Field label=" رقم جواز السفر מספר דרכון">
//           <input
//             value={draft.intake.step1.passportNumber}
//             onChange={(e) =>
//               update("intake.step1.passportNumber", e.target.value)
//             }
//             className={styles.input}
//             dir="ltr"
//           />
//         </Field>

//         <Field label=" بلد إصدار جواز السفر   ארץ הוצאת דרכון  ">
//           <input
//             value={draft.intake.step1.passportIssueCountry}
//             onChange={(e) =>
//               update("intake.step1.passportIssueCountry", e.target.value)
//             }
//             className={styles.input}
//           />
//         </Field>

//         <div className={styles.row2}>
//           <Field label=" تاريخ إصدار جواز السفر   תאריך הוצאת דרכון  ">
//             <input
//               type="date"
//               value={draft.intake.step1.passportIssueDate}
//               onChange={(e) =>
//                 update("intake.step1.passportIssueDate", e.target.value)
//               }
//               className={styles.input}
//             />
//           </Field>

//           <Field label=" تاريخ انتهاء جواز السفر   תאריך פקיעת דרכון  ">
//             <input
//               type="date"
//               value={draft.intake.step1.passportExpiryDate}
//               onChange={(e) =>
//                 update("intake.step1.passportExpiryDate", e.target.value)
//               }
//               className={styles.input}
//             />
//           </Field>
//         </div>

//         <SectionTitle>التأشيرة אשרה</SectionTitle>

//         <div className={styles.row2}>
//           <Field label=" بداية التأشيرة תחילת אשרה">
//             <input
//               type="date"
//               value={draft.intake.step2.visaStartDate}
//               onChange={(e) =>
//                 update("intake.step2.visaStartDate", e.target.value)
//               }
//               className={styles.input}
//             />
//           </Field>

//           <Field label=" انتهاء التأشيرة סיום אשרה">
//             <input
//               type="date"
//               value={draft.intake.step2.visaEndDate}
//               onChange={(e) =>
//                 update("intake.step2.visaEndDate", e.target.value)
//               }
//               className={styles.input}
//             />
//           </Field>
//         </div>

//         <Field label="تاريخ الدخول إلى البلاد   תאריך כניסה לארץ">
//           <input
//             type="date"
//             value={draft.intake.step2.entryDate}
//             onChange={(e) => update("intake.step2.entryDate", e.target.value)}
//             className={styles.input}
//           />
//         </Field>

//         <Field label="نوع التأشيرة   סוג אשרה">
//           <input
//             value={extras.purposeOfStay}
//             onChange={(e) =>
//               setExtras((p) =>
//                 p ? { ...p, purposeOfStay: e.target.value } : p,
//               )
//             }
//             className={styles.input}
//           />
//         </Field>

//         <SectionTitle> عنوان כתובת</SectionTitle>

//         <Field label="شارع רחוב">
//           <input
//             value={draft.intake.step3.registeredAddress.street}
//             onChange={(e) =>
//               update("intake.step3.registeredAddress.street", e.target.value)
//             }
//             className={styles.input}
//           />
//         </Field>

//         <div className={styles.row2}>
//           <Field label="رقم المنزل מספר בית">
//             <input
//               value={draft.intake.step3.registeredAddress.houseNumber}
//               onChange={(e) =>
//                 update(
//                   "intake.step3.registeredAddress.houseNumber",
//                   e.target.value,
//                 )
//               }
//               className={styles.input}
//               dir="ltr"
//             />
//           </Field>

//           <Field label=" دخول כניסה">
//             <input
//               value={draft.intake.step3.registeredAddress.entry}
//               onChange={(e) =>
//                 update("intake.step3.registeredAddress.entry", e.target.value)
//               }
//               className={styles.input}
//               dir="ltr"
//             />
//           </Field>

//           <Field label="شقة דירה ">
//             <input
//               value={draft.intake.step3.registeredAddress.apartment}
//               onChange={(e) =>
//                 update(
//                   "intake.step3.registeredAddress.apartment",
//                   e.target.value,
//                 )
//               }
//               className={styles.input}
//               dir="ltr"
//             />
//           </Field>

//           <Field label="  الرمز البريدي מיקוד">
//             <input
//               value={draft.intake.step3.registeredAddress.zip}
//               onChange={(e) =>
//                 update("intake.step3.registeredAddress.zip", e.target.value)
//               }
//               className={styles.input}
//               dir="ltr"
//             />
//           </Field>
//         </div>

//         <Field label="مدينة עיר ">
//           <input
//             value={draft.intake.step3.registeredAddress.city}
//             onChange={(e) =>
//               update("intake.step3.registeredAddress.city", e.target.value)
//             }
//             className={styles.input}
//           />
//         </Field>

//         <Field label="هاتف   טלפון ">
//           <input
//             value={extras.addressPhoneNumber}
//             onChange={(e) =>
//               setExtras((p) =>
//                 p ? { ...p, addressPhoneNumber: e.target.value } : p,
//               )
//             }
//             className={styles.input}
//             inputMode="tel"
//             dir="ltr"
//           />
//         </Field>

//         <SectionTitle> آباء הורים</SectionTitle>

//         <div className={styles.panel}>
//           <div className={styles.panelTitle}>אב</div>

//           <Field label="الاسم الشخصي    שם פרטי">
//             <input
//               value={extras.father.firstNameHebrew}
//               onChange={(e) =>
//                 setExtras((p) =>
//                   p
//                     ? {
//                         ...p,
//                         father: {
//                           ...p.father,
//                           firstNameHebrew: e.target.value,
//                         },
//                       }
//                     : p,
//                 )
//               }
//               className={styles.input}
//             />
//           </Field>

//           <Field label="اسم العائلة   שם משפחה">
//             <input
//               value={extras.father.lastNameHebrew}
//               onChange={(e) =>
//                 setExtras((p) =>
//                   p
//                     ? {
//                         ...p,
//                         father: { ...p.father, lastNameHebrew: e.target.value },
//                       }
//                     : p,
//                 )
//               }
//               className={styles.input}
//             />
//           </Field>

//           {/* <Field label="שם פרטי (אנגלית)">
//             <input
//               value={extras.father.firstNameEnglish}
//               onChange={(e) =>
//                 setExtras((p) =>
//                   p
//                     ? {
//                         ...p,
//                         father: {
//                           ...p.father,
//                           firstNameEnglish: e.target.value,
//                         },
//                       }
//                     : p,
//                 )
//               }
//               className={styles.input}
//               dir="ltr"
//             />
//           </Field>

//           <Field label="שם משפחה (אנגלית)">
//             <input
//               value={extras.father.lastNameEnglish}
//               onChange={(e) =>
//                 setExtras((p) =>
//                   p
//                     ? {
//                         ...p,
//                         father: {
//                           ...p.father,
//                           lastNameEnglish: e.target.value,
//                         },
//                       }
//                     : p,
//                 )
//               }
//               className={styles.input}
//               dir="ltr"
//             />
//           </Field> */}

//           <div className={styles.row2}>
//             <Field label="رقم بطاقة الهوية الإسرائيلية    מספר תעודת זהות   ">
//               <input
//                 value={extras.father.idNumber}
//                 onChange={(e) =>
//                   setExtras((p) =>
//                     p
//                       ? {
//                           ...p,
//                           father: { ...p.father, idNumber: e.target.value },
//                         }
//                       : p,
//                   )
//                 }
//                 className={styles.input}
//                 dir="ltr"
//               />
//             </Field>

//             <Field label="رقم جواز السفر מספר דרכון">
//               <input
//                 value={extras.father.passportNumber}
//                 onChange={(e) =>
//                   setExtras((p) =>
//                     p
//                       ? {
//                           ...p,
//                           father: {
//                             ...p.father,
//                             passportNumber: e.target.value,
//                           },
//                         }
//                       : p,
//                   )
//                 }
//                 className={styles.input}
//                 dir="ltr"
//               />
//             </Field>
//           </div>
//         </div>

//         <div className={styles.panel}>
//           <div className={styles.panelTitle}>אם</div>

//           <Field label="الاسم الشخصي    שם פרטי">
//             <input
//               value={extras.mother.firstNameHebrew}
//               onChange={(e) =>
//                 setExtras((p) =>
//                   p
//                     ? {
//                         ...p,
//                         mother: {
//                           ...p.mother,
//                           firstNameHebrew: e.target.value,
//                         },
//                       }
//                     : p,
//                 )
//               }
//               className={styles.input}
//             />
//           </Field>

//           <Field label="اسم العائلة   שם משפחה">
//             <input
//               value={extras.mother.lastNameHebrew}
//               onChange={(e) =>
//                 setExtras((p) =>
//                   p
//                     ? {
//                         ...p,
//                         mother: { ...p.mother, lastNameHebrew: e.target.value },
//                       }
//                     : p,
//                 )
//               }
//               className={styles.input}
//             />
//           </Field>

//           {/* <Field label="שם פרטי (אנגלית)">
//             <input
//               value={extras.mother.firstNameEnglish}
//               onChange={(e) =>
//                 setExtras((p) =>
//                   p
//                     ? {
//                         ...p,
//                         mother: {
//                           ...p.mother,
//                           firstNameEnglish: e.target.value,
//                         },
//                       }
//                     : p,
//                 )
//               }
//               className={styles.input}
//               dir="ltr"
//             />
//           </Field>

//           <Field label="שם משפחה (אנגלית)">
//             <input
//               value={extras.mother.lastNameEnglish}
//               onChange={(e) =>
//                 setExtras((p) =>
//                   p
//                     ? {
//                         ...p,
//                         mother: {
//                           ...p.mother,
//                           lastNameEnglish: e.target.value,
//                         },
//                       }
//                     : p,
//                 )
//               }
//               className={styles.input}
//               dir="ltr"
//             />
//           </Field> */}

//           <div className={styles.row2}>
//             <Field label="رقم بطاقة الهوية الإسرائيلية    מספר תעודת זהות   ">
//               <input
//                 value={extras.mother.idNumber}
//                 onChange={(e) =>
//                   setExtras((p) =>
//                     p
//                       ? {
//                           ...p,
//                           mother: { ...p.mother, idNumber: e.target.value },
//                         }
//                       : p,
//                   )
//                 }
//                 className={styles.input}
//                 dir="ltr"
//               />
//             </Field>

//             <Field label=" رقم جواز السفر מספר דרכון">
//               <input
//                 value={extras.mother.passportNumber}
//                 onChange={(e) =>
//                   setExtras((p) =>
//                     p
//                       ? {
//                           ...p,
//                           mother: {
//                             ...p.mother,
//                             passportNumber: e.target.value,
//                           },
//                         }
//                       : p,
//                   )
//                 }
//                 className={styles.input}
//                 dir="ltr"
//               />
//             </Field>
//           </div>
//         </div>

//         <SectionTitle>أطفال ילדים</SectionTitle>

//         <div className={styles.childrenGrid}>
//           {kids.map((child, i) => (
//             <div key={i} className={styles.childCard}>
//               <Field label="رقم بطاقة الهوية الإسرائيلية    מספר תעודת זהות   ">
//                 <input
//                   className={styles.input}
//                   value={child.israeliId}
//                   onChange={(e) => updateChild(i, "israeliId", e.target.value)}
//                   dir="ltr"
//                 />
//               </Field>

//               <Field label="اسم العائلة   שם משפחה">
//                 <input
//                   className={styles.input}
//                   value={child.lastName}
//                   onChange={(e) => updateChild(i, "lastName", e.target.value)}
//                 />
//               </Field>

//               <Field label="الاسم الشخصي    שם פרטי">
//                 <input
//                   className={styles.input}
//                   value={child.firstName}
//                   onChange={(e) => updateChild(i, "firstName", e.target.value)}
//                 />
//               </Field>

//               <Field label="تاريخ الميلاد   תאריך לידה">
//                 <input
//                   className={styles.input}
//                   type="date"
//                   value={child.birthDate}
//                   onChange={(e) => updateChild(i, "birthDate", e.target.value)}
//                 />
//               </Field>

//               <Field label="تاريخ الدخول إلى البلاد תאריך כניסה לארץ">
//                 <input
//                   className={styles.input}
//                   type="date"
//                   value={child.entryDate}
//                   onChange={(e) => updateChild(i, "entryDate", e.target.value)}
//                 />
//               </Field>

//               <Field label=" تاريخ الدخول الأول תאריך כניסה ראשון  ">
//                 <input
//                   className={styles.input}
//                   type="date"
//                   value={extras.children[i]?.firstEntryDate ?? ""}
//                   onChange={(e) =>
//                     setExtras((p) => {
//                       if (!p) return p;
//                       const next = structuredClone(p);
//                       if (!next.children[i])
//                         next.children[i] = emptyChildExtras();
//                       next.children[i]!.firstEntryDate = e.target.value;
//                       return next;
//                     })
//                   }
//                 />
//               </Field>

//               <Field label=" تاريخ الانضمام للملف תאריך הצטרפות לתיק">
//                 <input
//                   className={styles.input}
//                   type="date"
//                   value={extras.children[i]?.fileJoinDate ?? ""}
//                   onChange={(e) =>
//                     setExtras((p) => {
//                       if (!p) return p;
//                       const next = structuredClone(p);
//                       if (!next.children[i])
//                         next.children[i] = emptyChildExtras();
//                       next.children[i]!.fileJoinDate = e.target.value;
//                       return next;
//                     })
//                   }
//                 />
//               </Field>
//             </div>
//           ))}
//         </div>

//         <div className={styles.footerRow}>
//           <button
//             type="button"
//             className={styles.primaryButton}
//             onClick={() => router.push(nextUrl)}
//           >
//             לחתימה ואישור
//           </button>
//         </div>

//         {/* <div className={styles.actionsRow}> */}
//         {/* <button
//             type="button"
//             className={styles.buttonSecondary}
//             onClick={() =>
//               downloadJson(
//                 `intake_${safePart(
//                   draft.intake.step1.email ||
//                     draft.intake.step1.israeliId ||
//                     "demo",
//                 )}.json`,
//                 payload,
//               )
//             }
//           >
//             הורד JSON (DB record)
//           </button> */}

//         {/* <button type="submit" className={styles.buttonPrimary}>
//             הורד PDF
//           </button> */}
//         {/* </div> */}

//         {/* <details className={styles.details}>
//           <summary>תצוגה מקדימה של ה-JSON (DB record)</summary>
//           <pre className={styles.previewBox}>
//             {JSON.stringify(payload, null, 2)}
//           </pre>
//         </details> */}
//       </form>
//     </main>
//   );
// }

// "use client";

// import React, { useMemo } from "react";
// import { useRouter } from "next/navigation";

// import { fillFieldsToNewPdfBytesClient } from "@/lib/pdf/fillPdfClient";
// import { createClient } from "@/lib/supabase/client";

// import { fieldMap } from "../fieldMap";
// import { intakeToPdfFields } from "../intakeToPdfFields";
// import styles from "./page.module.css";
// import { useWizard } from "../WizardProvider";

// function SectionTitle({ children }: { children: React.ReactNode }) {
//   return <h2 className={styles.sectionTitle}>{children}</h2>;
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
//     <label className={styles.field}>
//       <span className={styles.fieldLabel}>
//         {label}{" "}
//         {required ? <span className={styles.requiredStar}>*</span> : null}
//       </span>
//       {children}
//     </label>
//   );
// }

// function safePart(title: string) {
//   return (
//     (title ?? "")
//       .toString()
//       .trim()
//       .replace(/[^a-zA-Z0-9_-]+/g, "_")
//       .slice(0, 60) || "Untitled"
//   );
// }

// function downloadPdf(filename: string, pdfBytes: Uint8Array) {
//   const bytes = new Uint8Array(pdfBytes);
//   const blob = new Blob([bytes.buffer], { type: "application/pdf" });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   document.body.appendChild(a);
//   a.click();
//   a.remove();
//   URL.revokeObjectURL(url);
// }

// function emptyChildExtras() {
//   return { firstEntryDate: "", fileJoinDate: "" };
// }

// function emptyTripRow() {
//   return { from: "", to: "", purpose: "" };
// }

// function ensureTripRow(
//   extras: any,
//   setExtras: (updater: (p: any) => any) => void,
//   index: number,
// ) {
//   setExtras((p: any) => {
//     const next = structuredClone(p);
//     if (!Array.isArray(next.abroadTrips)) next.abroadTrips = [];
//     while (next.abroadTrips.length <= index)
//       next.abroadTrips.push(emptyTripRow());
//     return next;
//   });
// }

// function updateTripField(
//   setExtras: (updater: (p: any) => any) => void,
//   index: number,
//   key: "from" | "to" | "purpose",
//   value: string,
// ) {
//   setExtras((p: any) => {
//     const next = structuredClone(p);
//     if (!Array.isArray(next.abroadTrips)) next.abroadTrips = [];
//     while (next.abroadTrips.length <= index)
//       next.abroadTrips.push(emptyTripRow());
//     next.abroadTrips[index][key] = value;
//     return next;
//   });
// }

// export default function PersonRegistrationPage() {
//   const router = useRouter();

//   const {
//     draft,
//     extras,
//     setExtras,
//     update,
//     updateChild,
//     instanceId,
//     isHydrated,
//   } = useWizard();

//   const payload = useMemo(() => {
//     if (!draft) return null;

//     const kids = (draft.intake.step6.children ?? []).filter(
//       (c) =>
//         (c.firstName ?? "").trim() ||
//         (c.lastName ?? "").trim() ||
//         (c.israeliId ?? "").trim() ||
//         (c.birthDate ?? "").trim(),
//     );

//     const cleaned = structuredClone(draft);
//     cleaned.intake.step6.children = kids;
//     return cleaned;
//   }, [draft]);

//   if (!isHydrated || !draft || !payload || !extras) {
//     return <main className={styles.page}>Loading…</main>;
//   }

//   async function saveDraft(existingInstanceId?: string) {
//     const supabase = createClient();

//     const { data: userRes, error: userErr } = await supabase.auth.getUser();
//     if (userErr) throw userErr;

//     const user = userRes.user;
//     if (!user) throw new Error("Not logged in");

//     if (!draft) return;

//     const title =
//       `${draft.intake?.step1?.firstName ?? ""} ${draft.intake?.step1?.lastName ?? ""}`.trim() ||
//       draft.intake?.step1?.israeliId ||
//       "Untitled";

//     if (!existingInstanceId) {
//       const { data, error } = await supabase
//         .from("form_instances")
//         .insert({
//           user_id: user.id,
//           form_slug: "person-registration-request",
//           title,
//           draft: payload,
//           extras,
//         })
//         .select("id")
//         .single();

//       if (error) throw error;
//       return data.id as string;
//     } else {
//       const { error } = await supabase
//         .from("form_instances")
//         .update({
//           title,
//           draft: payload,
//           extras,
//         })
//         .eq("id", existingInstanceId)
//         .eq("user_id", user.id);

//       if (error) throw error;
//       return existingInstanceId;
//     }
//   }

//   async function onDownloadPdf(e: React.FormEvent) {
//     e.preventDefault();

//     const savedId = await saveDraft(instanceId ?? undefined);

//     const fields = intakeToPdfFields(draft as any, extras as any);

//     const [tplRes, fontRes] = await Promise.all([
//       fetch("/forms/person-registration.pdf"),
//       fetch("/fonts/SimplerPro-Regular.otf"),
//     ]);

//     if (!tplRes.ok) {
//       throw new Error(
//         `Failed to load template PDF: ${tplRes.status} ${tplRes.statusText} url=${tplRes.url}`,
//       );
//     }
//     if (!fontRes.ok) {
//       throw new Error(
//         `Failed to load font: ${fontRes.status} ${fontRes.statusText} url=${fontRes.url}`,
//       );
//     }

//     const templateBytes = new Uint8Array(await tplRes.arrayBuffer());
//     const fontBytes = new Uint8Array(await fontRes.arrayBuffer());

//     const outBytes = await fillFieldsToNewPdfBytesClient(
//       templateBytes,
//       fields,
//       fieldMap,
//       {
//         fontBytes,
//         autoDetectRtl: true,
//         defaultRtlAlignRight: true,
//       },
//     );

//     if (!draft) return;

//     const s1 = draft.intake.step1;
//     const fileName = `person_registration_${safePart(
//       s1.israeliId || s1.passportNumber || s1.lastName || "unknown",
//     )}_${new Date().toISOString().slice(0, 10)}.pdf`;

//     downloadPdf(fileName, outBytes);

//     // If you want:
//     // router.push(savedId ? `./step-4?instanceId=${encodeURIComponent(savedId)}` : "./step-4");
//     void savedId;
//   }

//   const kids = draft.intake.step6.children ?? [];
//   const nextUrl = instanceId
//     ? `./step-4?instanceId=${encodeURIComponent(instanceId)}`
//     : "./step-4";

//   const trips = (extras as any).abroadTrips ?? [];
//   const trip0 = trips[0] ?? emptyTripRow();
//   const trip1 = trips[1] ?? emptyTripRow();
//   const trip2 = trips[2] ?? emptyTripRow();






"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { fillFieldsToNewPdfBytesClient } from "@/lib/pdf/fillPdfClient";
import { fieldMap } from "../fieldMap";
import { intakeToPdfFields } from "../intakeToPdfFields";
import styles from "./page.module.css";
import { useWizard } from "../WizardProvider";

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
      <span className={styles.fieldLabel}>
        {label}{" "}
        {required ? <span className={styles.requiredStar}>*</span> : null}
      </span>
      {children}
    </label>
  );
}

function safePart(title: string) {
  return (
    (title ?? "")
      .toString()
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .slice(0, 60) || "Untitled"
  );
}

function downloadPdf(filename: string, pdfBytes: Uint8Array) {
  const bytes = new Uint8Array(pdfBytes);
  const blob = new Blob([bytes.buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function emptyChildExtras() {
  return { firstEntryDate: "", fileJoinDate: "" };
}

function emptyTripRow() {
  return { from: "", to: "", purpose: "" };
}

function updateTripField(
  setExtras: (updater: (p: any) => any) => void,
  index: number,
  key: "from" | "to" | "purpose",
  value: string,
) {
  setExtras((p: any) => {
    const next = structuredClone(p);
    if (!Array.isArray(next.abroadTrips)) next.abroadTrips = [];
    while (next.abroadTrips.length <= index)
      next.abroadTrips.push(emptyTripRow());
    next.abroadTrips[index][key] = value;
    return next;
  });
}

export default function PersonRegistrationPage() {
  const router = useRouter();

  const {
    draft,
    extras,
    setExtras,
    update,
    updateChild,
    instanceId,
    isHydrated,

    // ✅ from WizardProvider.tsx-style
    saveNow,
    saveStatus,
    saveError,
  } = useWizard();

  // ✅ mark this step as current (this page navigates to step-4, so set currentStep=3 here)
  useEffect(() => {
    if (!isHydrated) return;
    setExtras((p: any) => (p.currentStep === 3 ? p : { ...p, currentStep: 3 }));
  }, [isHydrated, setExtras]);

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

  if (!isHydrated || !draft || !payload || !extras) {
    return <main className={styles.page}>Loading…</main>;
  }

  async function onSaveDraft() {
    // keep current step = 3
    setExtras((p: any) => ({ ...p, currentStep: 3 }));
    await saveNow();
  }

  async function onDownloadPdf(e: React.FormEvent) {
    e.preventDefault();

    // ✅ save first (so instanceId exists & draft/extras persist)
    setExtras((p: any) => ({ ...p, currentStep: 3 }));
    await saveNow();

    const fields = intakeToPdfFields(draft as any, extras as any);

    const [tplRes, fontRes] = await Promise.all([
      fetch("/forms/person-registration.pdf"),
      fetch("/fonts/SimplerPro-Regular.otf"),
    ]);

    if (!tplRes.ok) {
      throw new Error(
        `Failed to load template PDF: ${tplRes.status} ${tplRes.statusText} url=${tplRes.url}`,
      );
    }
    if (!fontRes.ok) {
      throw new Error(
        `Failed to load font: ${fontRes.status} ${fontRes.statusText} url=${fontRes.url}`,
      );
    }

    const templateBytes = new Uint8Array(await tplRes.arrayBuffer());
    const fontBytes = new Uint8Array(await fontRes.arrayBuffer());

    const outBytes = await fillFieldsToNewPdfBytesClient(
      templateBytes,
      fields,
      fieldMap,
      {
        fontBytes,
        autoDetectRtl: true,
        defaultRtlAlignRight: true,
      },
    );

    if (!draft) return;

    const s1 = draft.intake.step1;
    const fileName = `person_registration_${safePart(
      s1.israeliId || s1.passportNumber || s1.lastName.he || "unknown",
    )}_${new Date().toISOString().slice(0, 10)}.pdf`;

    downloadPdf(fileName, outBytes);
  }


    
  async function goNext() {
    // ✅ set next step + save before navigation
    setExtras((p: any) => ({ ...p, currentStep: 4 }));
    const savedId = await saveNow();

    const nextUrl = savedId
      ? `./step-4?instanceId=${encodeURIComponent(savedId)}`
      : instanceId
        ? `./step-4?instanceId=${encodeURIComponent(instanceId)}`
        : "./step-4";

    router.push(nextUrl);
  }

  const kids = draft.intake.step6.children ?? [];

  const trips = (extras as any).abroadTrips ?? [];
  const trip0 = trips[0] ?? emptyTripRow();
  const trip1 = trips[1] ?? emptyTripRow();
  const trip2 = trips[2] ?? emptyTripRow();
  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerText}>استبيان تسجيل شخص</div>
        <div className={styles.headerText}>שאלון לרישום נפש</div>
      </div>

      <form onSubmit={onDownloadPdf} className={styles.form}>
        <SectionTitle>البيانات الشخصية פרטים אישיים</SectionTitle>
        <SectionTitle>
          كما هو مدوّن في جواز السفر כפי שרשומים בדרכון
        </SectionTitle>
        <Field label="الاسم الشخصي    שם פרטי" required>
          <input
            value={draft.intake.step1.firstName.he}
            onChange={(e) => update("intake.step1.firstName.he", e.target.value)}
            className={styles.input}
          />
        </Field>
        <Field label="اسم العائلة   שם משפחה" required>
          <input
            value={draft.intake.step1.lastName.he}
            onChange={(e) => update("intake.step1.lastName.he", e.target.value)}
            className={styles.input}
          />
        </Field>
        {/* ✅ English names (mapped in intakeToPdfFields.ts) */}
        <Field label="First name (English) (PDF)">
          <input
            value={extras.firstNameEnglish}
            onChange={(e) =>
              setExtras((p) => ({ ...p, firstNameEnglish: e.target.value }))
            }
            className={styles.input}
            dir="ltr"
          />
        </Field>
        <Field label="Last name (English) (PDF)">
          <input
            value={extras.lastNameEnglish}
            onChange={(e) =>
              setExtras((p) => ({ ...p, lastNameEnglish: e.target.value }))
            }
            className={styles.input}
            dir="ltr"
          />
        </Field>
        <Field label="Previous last name (English) (PDF)">
          <input
            value={extras.prevLastNameEnglish}
            onChange={(e) =>
              setExtras((p) => ({ ...p, prevLastNameEnglish: e.target.value }))
            }
            className={styles.input}
            dir="ltr"
          />
        </Field>
        {/* ✅ Previous names (Hebrew) */}
        <SectionTitle>שמות קודמים</SectionTitle>
        <Field label="שם פרטי קודם (עברית)">
          <input
            value={draft.intake.step1.oldFirstName.he}
            onChange={(e) =>
              update("intake.step1.oldFirstName.he", e.target.value)
            }
            className={styles.input}
          />
        </Field>
        <Field label="שם משפחה קודם (עברית)">
          <input
            value={draft.intake.step1.oldLastName.he}
            onChange={(e) => update("intake.step1.oldLastName.he", e.target.value)}
            className={styles.input}
          />
        </Field>
        {/* ✅ ID */}
        <Field label="מספר תעודת זהות ישראלית (TZ)">
          <input
            value={draft.intake.step1.israeliId}
            onChange={(e) => update("intake.step1.israeliId", e.target.value)}
            className={styles.input}
            dir="ltr"
          />
        </Field>
        <Field label=" رقم جواز السفر מספר דרכון">
          <input
            value={draft.intake.step1.passportNumber}
            onChange={(e) =>
              update("intake.step1.passportNumber", e.target.value)
            }
            className={styles.input}
            dir="ltr"
          />
        </Field>
        {/* ✅ Gender (mapped to PDF checkboxes) */}
        <Field label="מין / الجنس" required>
          <select
            className={styles.input}
            value={draft.intake.step1.gender ?? ""}
            onChange={(e) => update("intake.step1.gender", e.target.value)}
            dir="ltr"
          >
            <option value="">Select…</option>
            <option value="male">זכר / ذكر</option>
            <option value="female">נקבה / أنثى</option>
            <option value="other">Other</option>
          </select>
        </Field>{" "}
        <Field label="تاريخ الميلاد   תאריך לידה" required>
          <input
            type="date"
            value={draft.intake.step1.birthDate}
            onChange={(e) => update("intake.step1.birthDate", e.target.value)}
            className={styles.input}
          />
        </Field>
        <Field label="بلد الميلاد   ארץ לידה">
          <input
            value={extras.birthCountry}
            onChange={(e) =>
              setExtras((p) => ({ ...p, birthCountry: e.target.value }))
            }
            className={styles.input}
          />
        </Field>
        <Field label="مدينة الميلاد   עיר לידה">
          <input
            value={extras.birthCity}
            onChange={(e) =>
              setExtras((p) => ({ ...p, birthCity: e.target.value }))
            }
            className={styles.input}
          />
        </Field>
        <Field label="الجنسية   אזרחות">
          <input
            value={draft.intake.step1.nationality}
            onChange={(e) => update("intake.step1.nationality", e.target.value)}
            className={styles.input}
          />
        </Field>
        <Field label=" بلد إصدار جواز السفر   ארץ הוצאת דרכון">
          <input
            value={draft.intake.step1.passportIssueCountry}
            onChange={(e) =>
              update("intake.step1.passportIssueCountry", e.target.value)
            }
            className={styles.input}
          />
        </Field>
        <div className={styles.row2}>
          <Field label=" تاريخ إصدار جواز السفر   תאריך הוצאת דרכון">
            <input
              type="date"
              value={draft.intake.step1.passportIssueDate}
              onChange={(e) =>
                update("intake.step1.passportIssueDate", e.target.value)
              }
              className={styles.input}
            />
          </Field>

          <Field label=" تاريخ انتهاء جواز السفر   תאריך פקיעת דרכון">
            <input
              type="date"
              value={draft.intake.step1.passportExpiryDate}
              onChange={(e) =>
                update("intake.step1.passportExpiryDate", e.target.value)
              }
              className={styles.input}
            />
          </Field>
        </div>
        {/* ✅ Visa */}
        <SectionTitle>التأشيرة אשרה</SectionTitle>
        <div className={styles.row2}>
          <Field label=" بداية التأشيرة תחילת אשרה">
            <input
              type="date"
              value={draft.intake.step2.visaStartDate}
              onChange={(e) =>
                update("intake.step2.visaStartDate", e.target.value)
              }
              className={styles.input}
            />
          </Field>

          <Field label=" انتهاء التأشيرة סיום אשרה">
            <input
              type="date"
              value={draft.intake.step2.visaEndDate}
              onChange={(e) =>
                update("intake.step2.visaEndDate", e.target.value)
              }
              className={styles.input}
            />
          </Field>
        </div>
        <Field label="تاريخ الدخول إلى البلاد   תאריך כניסה לארץ">
          <input
            type="date"
            value={draft.intake.step2.entryDate}
            onChange={(e) => update("intake.step2.entryDate", e.target.value)}
            className={styles.input}
          />
        </Field>
        {/* ✅ Visa type checkboxes (extras.*) */}
        <Field label="Visa type (DB: intake.step2.visaType)">
          <select
            className={styles.input}
            value={draft.intake.step2.visaType ?? ""}
            onChange={(e) => update("intake.step2.visaType", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="A/1">A/1</option>
            <option value="A/2">A/2</option>
            <option value="A/3">A/3</option>
            <option value="A/5">A/5</option>
            <option value="B/1">B/1</option>
            <option value="B/2">B/2</option>
            <option value="C/2">C/2</option>
            <option value="Other">Other</option>
          </select>
        </Field>{" "}
        {/* ✅ Visa purpose (IMPORTANT: mapper uses extras.visaPurpose) */}
        <Field label="מטרת השהייה / نوع التأشيرة (Purpose of stay)">
          <input
            value={extras.purposeOfStay}
            onChange={(e) =>
              setExtras((p) => ({ ...p, visaPurpose: e.target.value }))
            }
            className={styles.input}
          />
        </Field>
        {/* ✅ Address */}
        <SectionTitle> عنوان כתובת</SectionTitle>
        <Field label="شارع רחוב">
          <input
            value={draft.intake.step3.registeredAddress.street.he}
            onChange={(e) =>
              update("intake.step3.registeredAddress.street.he", e.target.value)
            }
            className={styles.input}
          />
        </Field>
        <div className={styles.row2}>
          <Field label="رقم المنزل מספר בית">
            <input
              value={draft.intake.step3.registeredAddress.houseNumber}
              onChange={(e) =>
                update(
                  "intake.step3.registeredAddress.houseNumber",
                  e.target.value,
                )
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <Field label=" دخول כניסה">
            <input
              value={draft.intake.step3.registeredAddress.entry}
              onChange={(e) =>
                update("intake.step3.registeredAddress.entry", e.target.value)
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <Field label="شقة דירה ">
            <input
              value={draft.intake.step3.registeredAddress.apartment}
              onChange={(e) =>
                update(
                  "intake.step3.registeredAddress.apartment",
                  e.target.value,
                )
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <Field label="  الرمز البريدي מיקוד">
            <input
              value={draft.intake.step3.registeredAddress.zip}
              onChange={(e) =>
                update("intake.step3.registeredAddress.zip", e.target.value)
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>
        </div>
        <Field label="مدينة עיר ">
          <input
            value={draft.intake.step3.registeredAddress.city}
            onChange={(e) =>
              update("intake.step3.registeredAddress.city", e.target.value)
            }
            className={styles.input}
          />
        </Field>
        <Field label="הטלפון הרשום לכתובת / هاتف">
          <input
            value={extras.addressPhoneNumber}
            onChange={(e) =>
              setExtras((p) => ({ ...p, addressPhoneNumber: e.target.value }))
            }
            className={styles.input}
            inputMode="tel"
            dir="ltr"
          />
        </Field>
        {/* ✅ Parents */}
        <SectionTitle> آباء הורים</SectionTitle>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>אב</div>

          <Field label="الاسم الشخصي    שם פרטי">
            <input
              value={extras.father.firstNameHebrew}
              onChange={(e) =>
                setExtras((p) => ({
                  ...p,
                  father: { ...p.father, firstNameHebrew: e.target.value },
                }))
              }
              className={styles.input}
            />
          </Field>

          <Field label="اسم العائلة   שם משפחה">
            <input
              value={extras.father.lastNameHebrew}
              onChange={(e) =>
                setExtras((p) => ({
                  ...p,
                  father: { ...p.father, lastNameHebrew: e.target.value },
                }))
              }
              className={styles.input}
            />
          </Field>

          <div className={styles.row2}>
            <Field label="رقم بطاقة الهوية الإسرائيلية / מספר תעודת זהות">
              <input
                value={extras.father.idNumber}
                onChange={(e) =>
                  setExtras((p) => ({
                    ...p,
                    father: { ...p.father, idNumber: e.target.value },
                  }))
                }
                className={styles.input}
                dir="ltr"
              />
            </Field>

            <Field label="رقم جواز السفر מספר דרכון">
              <input
                value={extras.father.passportNumber}
                onChange={(e) =>
                  setExtras((p) => ({
                    ...p,
                    father: { ...p.father, passportNumber: e.target.value },
                  }))
                }
                className={styles.input}
                dir="ltr"
              />
            </Field>
          </div>
        </div>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>אם</div>

          <Field label="الاسم الشخصي    שם פרטי">
            <input
              value={extras.mother.firstNameHebrew}
              onChange={(e) =>
                setExtras((p) => ({
                  ...p,
                  mother: { ...p.mother, firstNameHebrew: e.target.value },
                }))
              }
              className={styles.input}
            />
          </Field>

          <Field label="اسم العائلة   שם משפחה">
            <input
              value={extras.mother.lastNameHebrew}
              onChange={(e) =>
                setExtras((p) => ({
                  ...p,
                  mother: { ...p.mother, lastNameHebrew: e.target.value },
                }))
              }
              className={styles.input}
            />
          </Field>

          <div className={styles.row2}>
            <Field label="رقم بطاقة الهوية الإسرائيلية מספר תעודת זהות">
              <input
                value={extras.mother.idNumber}
                onChange={(e) =>
                  setExtras((p) => ({
                    ...p,
                    mother: { ...p.mother, idNumber: e.target.value },
                  }))
                }
                className={styles.input}
                dir="ltr"
              />
            </Field>

            <Field label=" رقم جواز السفر מספר דרכון">
              <input
                value={extras.mother.passportNumber}
                onChange={(e) =>
                  setExtras((p) => ({
                    ...p,
                    mother: { ...p.mother, passportNumber: e.target.value },
                  }))
                }
                className={styles.input}
                dir="ltr"
              />
            </Field>
          </div>
        </div>
        {/* ✅ Personal status + Partner (mapped) */}
        <SectionTitle>מצב אישי / الحالة الاجتماعية</SectionTitle>
        <Field label="מצב אישי">
          <select
            className={styles.input}
            value={draft.intake.step3.maritalStatus ?? ""}
            onChange={(e) =>
              update("intake.step3.maritalStatus", e.target.value)
            }
            dir="ltr"
          >
            <option value="">—</option>
            <option value="single">single</option>
            <option value="married">married</option>
            <option value="divorced">divorced</option>
            <option value="widowed">widowed</option>
            <option value="other">other</option>
          </select>
        </Field>
        <SectionTitle>בן/בת זוג / شريك</SectionTitle>
        <Field label="Partner first name (DB: intake.step5.person.firstName)">
          <input
            className={styles.input}
            value={draft.intake.step5.spouse.firstName.he}
            onChange={(e) =>
              update("intake.step5.spouse.firstName.he", e.target.value)
            }
          />
        </Field>
        <Field label="Partner last name (DB: intake.step5.person.lastName)">
          <input
            className={styles.input}
            value={draft.intake.step5.spouse.lastName.he}
            onChange={(e) =>
              update("intake.step5.spouse.lastName.he", e.target.value)
            }
          />
        </Field>
        <Field label="Partner Israeli ID (DB: intake.step5.person.israeliId)">
          <input
            className={styles.input}
            value={draft.intake.step5.spouse.israeliId}
            onChange={(e) =>
              update("intake.step5.spouse.israeliId", e.target.value)
            }
            dir="ltr"
          />
        </Field>
        <Field label="Partner passport number (DB: intake.step5.person.passportNumber)">
          <input
            className={styles.input}
            value={draft.intake.step5.spouse.passportNumber}
            onChange={(e) =>
              update("intake.step5.person.passportNumber", e.target.value)
            }
            dir="ltr"
          />
        </Field>
        <Field label="Partner birth date (DB: intake.step5.person.birthDate)">
          <input
            className={styles.input}
            type="date"
            value={draft.intake.step5.spouse.birthDate}
            onChange={(e) =>
              update("intake.step5.person.birthDate", e.target.value)
            }
          />
        </Field>
        <Field label="מספר ילדים מתחת לגיל 18 (PDF)">
          <input
            className={styles.input}
            dir="ltr"
            value={extras.numberChildrenUnder18}
            onChange={(e) =>
              setExtras((p) => ({
                ...p,
                numberChildrenUnder18: e.target.value,
              }))
            }
          />
        </Field>
        {/* ✅ Bank (mapped from intake.step4.bank.*) */}
        <SectionTitle>פרטי בנק / تفاصيل حساب بنكي</SectionTitle>
        <Field label="בנק / Bank name">
          <input
            className={styles.input}
            value={draft.intake.step4.bank.bankName}
            onChange={(e) =>
              update("intake.step4.bank.bankName", e.target.value)
            }
          />
        </Field>
        <Field label="סניף / Branch number">
          <input
            className={styles.input}
            value={draft.intake.step4.bank.branch}
            onChange={(e) => update("intake.step4.bank.branch", e.target.value)}
            dir="ltr"
          />
        </Field>
        <Field label="מספר חשבון / Account number">
          <input
            className={styles.input}
            value={draft.intake.step4.bank.accountNumber}
            onChange={(e) =>
              update("intake.step4.bank.accountNumber", e.target.value)
            }
            dir="ltr"
          />
        </Field>
        {/* ✅ Employment / income (mapped from intake.step4.*) */}
        <SectionTitle>עבודה והכנסה / عمل ودخل</SectionTitle>
        <Field label="שם מעסיק / Employer name">
          <input
            className={styles.input}
            value={(extras as any).employerName ?? ""}
            onChange={(e) =>
              setExtras((p: any) => ({ ...p, employerName: e.target.value }))
            }
          />
        </Field>
        <Field label="כתובת מעסיק / Employer address (PDF)">
          <input
            className={styles.input}
            value={(extras as any).employerAddress ?? ""}
            onChange={(e) =>
              setExtras((p: any) => ({ ...p, employerAddress: e.target.value }))
            }
          />
        </Field>
        {/* ✅ National Insurance (mapped from intake.step4.*) */}
        <SectionTitle>ביטוח לאומי / التأمين الوطني</SectionTitle>
        <Field label="Has NI file? (DB: intake.step4.nationalInsurance.hasFile)">
          <select
            className={styles.input}
            value={draft.intake.step4.nationalInsurance.hasFile ?? ""}
            onChange={(e) =>
              update("intake.step4.nationalInsurance.hasFile", e.target.value)
            }
          >
            <option value="">—</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>{" "}
        <Field label="Paid as (PDF)">
          <select
            className={styles.input}
            value={(extras as any).niPaidAs ?? ""}
            onChange={(e) =>
              setExtras((p: any) => ({ ...p, niPaidAs: e.target.value }))
            }
            dir="ltr"
          >
            <option value="">בחר</option>
            <option value="שכיר">Employee</option>
            <option value="עצמאי">Self-employed</option>
            <option value="מובטל">Unemployed</option>
          </select>
        </Field>
        <Field label="Payments status (PDF)">
          <select
            className={styles.input}
            value={(extras as any).niPaymentsStatus ?? ""}
            onChange={(e) =>
              setExtras((p: any) => ({
                ...p,
                niPaymentsStatus: e.target.value,
              }))
            }
            dir="ltr"
          >
            <option value="">— Select —</option>
            <option value="paid">Paid</option>
            <option value="notPaid">Not paid</option>
          </select>
        </Field>
        <Field label="NI file number (DB: intake.step4.nationalInsurance.fileNumber)">
          <input
            className={styles.input}
            value={draft.intake.step4.nationalInsurance.fileNumber}
            onChange={(e) =>
              update(
                "intake.step4.nationalInsurance.fileNumber",
                e.target.value,
              )
            }
            dir="ltr"
          />
        </Field>{" "}
        {/* ✅ Trips abroad (3 rows mapped) */}
        <SectionTitle>
          שהייה בחו״ל ב-24 חודשים האחרונים / الإقامة خارج البلاد
        </SectionTitle>
        <div className={styles.panel}>
          {[
            { i: 0, t: trip0 },
            { i: 1, t: trip1 },
            { i: 2, t: trip2 },
          ].map(({ i, t }) => (
            <div key={i} className={styles.row2}>
              <Field label={`From (row ${i + 1})`}>
                <input
                  className={styles.input}
                  type="date"
                  value={t.from}
                  onChange={(e) =>
                    updateTripField(setExtras as any, i, "from", e.target.value)
                  }
                />
              </Field>

              <Field label={`To (row ${i + 1})`}>
                <input
                  className={styles.input}
                  type="date"
                  value={t.to}
                  onChange={(e) =>
                    updateTripField(setExtras as any, i, "to", e.target.value)
                  }
                />
              </Field>

              <Field label={`Purpose (row ${i + 1})`}>
                <input
                  className={styles.input}
                  value={t.purpose}
                  onChange={(e) =>
                    updateTripField(
                      setExtras as any,
                      i,
                      "purpose",
                      e.target.value,
                    )
                  }
                />
              </Field>
            </div>
          ))}
        </div>
        <Field label="Gets allowance? (DB: intake.step4.nationalInsurance.getsAllowance)">
          <select
            className={styles.input}
            value={draft.intake.step4.nationalInsurance.getsAllowance ?? ""}
            onChange={(e) =>
              update(
                "intake.step4.nationalInsurance.getsAllowance",
                e.target.value,
              )
            }
          >
            <option value="">—</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>{" "}
        <Field label="Allowance type (DB: intake.step4.nationalInsurance.allowanceType)">
          <input
            className={styles.input}
            value={draft.intake.step4.nationalInsurance.allowanceType ?? ""}
            onChange={(e) =>
              update(
                "intake.step4.nationalInsurance.allowanceType",
                e.target.value,
              )
            }
            disabled={
              (draft.intake.step4.nationalInsurance.getsAllowance ?? "") !==
              "yes"
            }
            placeholder="Type allowance type…"
          />
        </Field>
        <Field label="Allowance file number (DB: intake.step4.nationalInsurance.allowanceFileNumber)">
          <input
            className={styles.input}
            value={draft.intake.step4.nationalInsurance.allowanceFileNumber}
            onChange={(e) =>
              update(
                "intake.step4.nationalInsurance.allowanceFileNumber",
                e.target.value,
              )
            }
            disabled={
              (draft.intake.step4.nationalInsurance.getsAllowance ?? "") !==
              "yes"
            }
            dir="ltr"
          />
        </Field>{" "}
        {/* ✅ Declaration (mapped from extras) */}
        <SectionTitle>הצהרה / تصريح</SectionTitle>
        <Field label="שם המצהיר/ה (PDF)">
          <input
            className={styles.input}
            value={(extras as any).declaration?.name ?? ""}
            onChange={(e) =>
              setExtras((p: any) => ({
                ...p,
                declaration: { ...(p.declaration ?? {}), name: e.target.value },
              }))
            }
          />
        </Field>
        {/* ✅ Children */}
        <SectionTitle>أطفال ילדים</SectionTitle>
        <div className={styles.childrenGrid}>
          {kids.map((child, i) => (
            <div key={i} className={styles.childCard}>
              <Field label="رقم بطاقة الهوية الإسرائيلية    מספר תעודת זהות">
                <input
                  className={styles.input}
                  value={child.israeliId}
                  onChange={(e) => updateChild(i, "israeliId", e.target.value)}
                  dir="ltr"
                />
              </Field>

              <Field label="اسم العائلة   שם משפחה">
                <input
                  className={styles.input}
                  value={child.lastName}
                  onChange={(e) => updateChild(i, "lastName", e.target.value)}
                />
              </Field>

              <Field label="الاسم الشخصي    שם פרטי">
                <input
                  className={styles.input}
                  value={child.firstName}
                  onChange={(e) => updateChild(i, "firstName", e.target.value)}
                />
              </Field>

              <Field label="تاريخ الميلاد   תאריך לידה">
                <input
                  className={styles.input}
                  type="date"
                  value={child.birthDate}
                  onChange={(e) => updateChild(i, "birthDate", e.target.value)}
                />
              </Field>

              <Field label="تاريخ الدخول إلى البلاد תאריך כניסה לארץ">
                <input
                  className={styles.input}
                  type="date"
                  value={child.entryDate}
                  onChange={(e) => updateChild(i, "entryDate", e.target.value)}
                />
              </Field>

              <Field label=" تاريخ الدخول الأول תאריך כניסה ראשון">
                <input
                  className={styles.input}
                  type="date"
                  value={extras.children[i]?.firstEntryDate ?? ""}
                  onChange={(e) =>
                    setExtras((p) => {
                      const next = structuredClone(p);
                      if (!next.children[i])
                        next.children[i] = emptyChildExtras();
                      next.children[i]!.firstEntryDate = e.target.value;
                      return next;
                    })
                  }
                />
              </Field>

              <Field label=" تاريخ الانضمام للملف תאריך הצטרפות לתיק">
                <input
                  className={styles.input}
                  type="date"
                  value={extras.children[i]?.fileJoinDate ?? ""}
                  onChange={(e) =>
                    setExtras((p) => {
                      const next = structuredClone(p);
                      if (!next.children[i])
                        next.children[i] = emptyChildExtras();
                      next.children[i]!.fileJoinDate = e.target.value;
                      return next;
                    })
                  }
                />
              </Field>
            </div>
          ))}
        </div>
        <div className={styles.footerRow}>
          <button
            type="button"
            onClick={goNext}
            className={styles.primaryButton}
            // disabled={disableNext || saveStatus === "saving"}
            // title={disableNext ? "בחר לפחות ילד אחד" : undefined}
          >
            המשך
          </button>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onSaveDraft}
            disabled={saveStatus === "saving" || !draft}
          >
            שמור כטיוטה
          </button>
        </div>
      </form>
    </main>
  );
}
