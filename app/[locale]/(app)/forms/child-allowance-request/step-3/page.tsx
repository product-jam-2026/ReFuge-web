"use client";
// import React, { useMemo } from "react";


// import { useRouter } from "next/navigation";


// import styles from "./page.module.css";


// import { useWizard } from "../WizardProvider";





// function SectionTitle({ children }: { children: React.ReactNode }) {


//   return <h2 className={styles.sectionTitle}>{children}</h2>;


// }





// function Field({


//   label,


//   children,


// }: {


//   label: string;


//   children: React.ReactNode;


// }) {


//   return (


//     <label className={styles.field}>


//       <span className={styles.fieldLabel}>{label}</span>


//       {children}


//     </label>


//   );


// }





// function splitEmail(email: string) {


//   const e = (email ?? "").trim();


//   const at = e.indexOf("@");


//   if (at === -1) return { prefix: e, postfix: "" };


//   return { prefix: e.slice(0, at), postfix: e.slice(at + 1) };


// }





// function emptyChildExtras() {


//   return { firstEntryDate: "", fileJoinDate: "" };


// }





// export default function ChildAllowanceStep3() {


//   const router = useRouter();





//   const {


//     draft,


//     extras,


//     setExtras,


//     update,


//     updateChild,


//     addChildRow,


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





//   if (!isHydrated || !draft || !payload) {


//     return <main className={styles.page}>Loading…</main>;


//   }





//   const allKids = draft.intake.step6.children ?? [];


//   const nextUrl = instanceId


//     ? `./step-4?instanceId=${encodeURIComponent(instanceId)}`


//     : "./step-4";








//   return (


//     <main className={styles.page}>


//       {/* Header like your Step3 */}


//       <div className={styles.header}>


//         <div className={styles.headerText}>طلب مخصصات الأطفال</div>


//         <div className={styles.headerText}>טופס בקשה לקצבת ילדים</div>


//       </div>





//       <SectionTitle>بيانات مقدم الطلب פרטי האב</SectionTitle>





//       <Field label="الاسم الشخصي    שם פרטי">


//         <input


//           className={styles.input}


//           value={draft.intake.step5.person.firstName}


//           onChange={(e) =>


//             update("intake.step5.person.firstName", e.target.value)


//           }


//         />


//       </Field>





//       <Field label="اسم العائلة   שם משפחה">


//         <input


//           className={styles.input}


//           value={draft.intake.step5.person.lastName}


//           onChange={(e) =>


//             update("intake.step5.person.lastName", e.target.value)


//           }


//         />


//       </Field>





//       <Field label="رقم بطاقة الهوية الإسرائيلية    מספר תעודת זהות">


//         <input


//           className={styles.input}


//           value={draft.intake.step5.person.israeliId}


//           onChange={(e) =>


//             update("intake.step5.person.israeliId", e.target.value)


//           }


//           dir="ltr"


//         />


//       </Field>





//       <Field label="تاريخ الميلاد   תאריך לידה">


//         <input


//           className={styles.input}


//           type="date"


//           value={draft.intake.step5.person.birthDate}


//           onChange={(e) =>


//             update("intake.step5.person.birthDate", e.target.value)


//           }


//         />


//       </Field>





//       {/* ✅ step5 does NOT have entryDate, so store it in extras */}


//       <Field label="تاريخ الدخول إلى البلاد   תאריך כניסה לארץ">


//         <input


//           className={styles.input}


//           type="date"


//           value={(extras as any).requesterEntryDate ?? ""}


//           onChange={(e) =>


//             setExtras((p: any) => ({


//               ...p,


//               requesterEntryDate: e.target.value,


//             }))


//           }


//         />


//       </Field>





//       <SectionTitle>عنوان السكن כתובת מגורים</SectionTitle>


//       <SectionTitle>السجل في وزارة الداخلية הרשומה במשרד הפנים</SectionTitle>





//       <Field label="شارع   רחוב">


//         <input


//           className={styles.input}


//           value={draft.intake.step3.registeredAddress.street}


//           onChange={(e) =>


//             update("intake.step3.registeredAddress.street", e.target.value)


//           }


//         />


//       </Field>





//       <div className={styles.row2}>


//         <Field label="منزل  בניין">


//           <input


//             className={styles.input}


//             value={draft.intake.step3.registeredAddress.houseNumber}


//             onChange={(e) =>


//               update(


//                 "intake.step3.registeredAddress.houseNumber",


//                 e.target.value,


//               )


//             }


//             dir="ltr"


//           />


//         </Field>





//         <Field label="دخول   כניסה">


//           <input


//             className={styles.input}


//             value={draft.intake.step3.registeredAddress.entry}


//             onChange={(e) =>


//               update("intake.step3.registeredAddress.entry", e.target.value)


//             }


//             dir="ltr"


//           />


//         </Field>





//         <Field label="شقة   דירה">


//           <input


//             className={styles.input}


//             value={draft.intake.step3.registeredAddress.apartment}


//             onChange={(e) =>


//               update("intake.step3.registeredAddress.apartment", e.target.value)


//             }


//             dir="ltr"


//           />


//         </Field>





//         <Field label="الرمز البريدي   מיקוד">


//           <input


//             className={styles.input}


//             value={draft.intake.step3.registeredAddress.zip}


//             onChange={(e) =>


//               update("intake.step3.registeredAddress.zip", e.target.value)


//             }


//             dir="ltr"


//           />


//         </Field>


//       </div>





//       <Field label="مدينة   עיר">


//         <input


//           className={styles.input}


//           value={draft.intake.step3.registeredAddress.city}


//           onChange={(e) =>


//             update("intake.step3.registeredAddress.city", e.target.value)


//           }


//         />


//       </Field>





//       <SectionTitle> وسائل الاتصال</SectionTitle>


//       <SectionTitle> المسجَّلون في وزارة الداخلية </SectionTitle>


//       <SectionTitle> דרכי תקשורת</SectionTitle>


//       <SectionTitle> הרשומים במשרד הפנים</SectionTitle>





//       <Field label="هاتف   טלפון">


//         <input


//           className={styles.input}


//           value={draft.intake.step5.phone}


//           onChange={(e) => update("intake.step5.phone", e.target.value)}


//           inputMode="tel"


//           dir="ltr"


//         />


//       </Field>


//       <Field label="بريد إلكتروني   אימייל">


//         <input


//           className={styles.input}


//           dir="ltr"


//           inputMode="email"


//           placeholder="name@example.com"


//           value={


//             extras.father.emailPostfix


//               ? `${extras.father.emailPrefix}@${extras.father.emailPostfix}`


//               : extras.father.emailPrefix


//           }


//           onChange={(e) => {


//             const { prefix, postfix } = splitEmail(e.target.value);


//             setExtras((p) =>


//               p


//                 ? {


//                     ...p,


//                     father: {


//                       ...p.father,


//                       emailPrefix: prefix,


//                       emailPostfix: postfix,


//                     },


//                   }


//                 : p,


//             );


//           }}


//         />





//         {/* <input


//           className={styles.input}


//           dir="ltr"


//           inputMode="email"


//           placeholder="name@example.com"


//           value={draft.intake.step5.email}


//           onChange={(e) => update("intake.step5.email", e.target.value)}


//         /> */}


//       </Field>





//       <SectionTitle>بيانات مستفيد المعاش </SectionTitle>


//       <SectionTitle>פרטי מקבל הקצבה</SectionTitle>





//       <Field label="الاسم الشخصي    שם פרטי">


//         <input


//           className={styles.input}


//           value={draft.intake.step1.firstName}


//           onChange={(e) => update("intake.step1.firstName", e.target.value)}


//         />


//       </Field>





//       <Field label="اسم العائلة   שם משפחה">


//         <input


//           className={styles.input}


//           value={draft.intake.step1.lastName}


//           onChange={(e) => update("intake.step1.lastName", e.target.value)}


//         />


//       </Field>





//       <Field label="رقم بطاقة الهوية الإسرائيلية    מספר תעודת זהות   ">


//         <input


//           className={styles.input}


//           value={draft.intake.step1.israeliId}


//           onChange={(e) => update("intake.step1.israeliId", e.target.value)}


//           dir="ltr"


//         />


//       </Field>





//       <Field label="تاريخ الميلاد   תאריך לידה  ">


//         <input


//           className={styles.input}


//           type="date"


//           value={draft.intake.step1.birthDate}


//           onChange={(e) => update("intake.step1.birthDate", e.target.value)}


//         />


//       </Field>





//       <Field label="تاريخ الدخول إلى البلاد   תאריך כניסה לארץ">


//         <input


//           className={styles.input}


//           type="date"


//           value={draft.intake.step2.entryDate}


//           onChange={(e) => update("intake.step2.entryDate", e.target.value)}


//         />


//       </Field>





//       <SectionTitle>عنوان السكن כתובת מגורים</SectionTitle>


//       <SectionTitle>السجل في وزارة الداخلية הרשומה במשרד הפנים</SectionTitle>





//       <Field label="شارع   רחוב">


//         <input


//           className={styles.input}


//           value={draft.intake.step3.registeredAddress.street}


//           onChange={(e) =>


//             update("intake.step3.registeredAddress.street", e.target.value)


//           }


//         />


//       </Field>





//       <div className={styles.row2}>


//         <Field label="منزل  בניין">


//           <input


//             className={styles.input}


//             value={draft.intake.step3.registeredAddress.houseNumber}


//             onChange={(e) =>


//               update(


//                 "intake.step3.registeredAddress.houseNumber",


//                 e.target.value,


//               )


//             }


//             dir="ltr"


//           />


//         </Field>





//         <Field label="دخول   כניסה">


//           <input


//             className={styles.input}


//             value={draft.intake.step3.registeredAddress.entry}


//             onChange={(e) =>


//               update("intake.step3.registeredAddress.entry", e.target.value)


//             }


//             dir="ltr"


//           />


//         </Field>





//         <Field label="شقة   דירה">


//           <input


//             className={styles.input}


//             value={draft.intake.step3.registeredAddress.apartment}


//             onChange={(e) =>


//               update("intake.step3.registeredAddress.apartment", e.target.value)


//             }


//             dir="ltr"


//           />


//         </Field>





//         <Field label="الرمز البريدي   מיקוד">


//           <input


//             className={styles.input}


//             value={draft.intake.step3.registeredAddress.zip}


//             onChange={(e) =>


//               update("intake.step3.registeredAddress.zip", e.target.value)


//             }


//             dir="ltr"


//           />


//         </Field>


//       </div>





//       <Field label="مدينة   עיר">


//         <input


//           className={styles.input}


//           value={draft.intake.step3.registeredAddress.city}


//           onChange={(e) =>


//             update("intake.step3.registeredAddress.city", e.target.value)


//           }


//         />


//       </Field>





//       <SectionTitle> وسائل الاتصال</SectionTitle>


//       <SectionTitle> المسجَّلون في وزارة الداخلية </SectionTitle>


//       <SectionTitle> דרכי תקשורת</SectionTitle>


//       <SectionTitle> הרשומים במשרד הפנים</SectionTitle>





//       <Field label="هاتف   טלפון">


//         <input


//           className={styles.input}


//           value={draft.intake.step1.phone}


//           onChange={(e) => update("intake.step1.phone", e.target.value)}


//           inputMode="tel"


//           dir="ltr"


//         />


//       </Field>





//       <Field label="بريد إلكتروني   אימייל">


//         <input


//           className={styles.input}


//           dir="ltr"


//           inputMode="email"


//           placeholder="name@example.com"


//           value={


//             extras?.allowanceRequester?.emailPostfix


//               ? `${extras.allowanceRequester.emailPrefix}@${extras.allowanceRequester.emailPostfix}`


//               : (extras?.allowanceRequester?.emailPrefix ?? "")


//           }


//           onChange={(e) => {


//             const { prefix, postfix } = splitEmail(e.target.value);


//             setExtras((p) => {


//               if (!p) return p;


//               return {


//                 ...p,


//                 allowanceRequester: {


//                   ...p.allowanceRequester,


//                   emailPrefix: prefix,


//                   emailPostfix: postfix,


//                 },


//               };


//             });


//           }}


//         />


//       </Field>





//       <SectionTitle>تفاصيل حساب بنكي פרטי בנק</SectionTitle>





//       <Field label="اسم صاحب الحساب    שם בעל החשבון">


//         <input


//           className={styles.input}


//           value={extras.bankAccount.owner1}


//           onChange={(e) =>


//             setExtras((p) =>


//               p


//                 ? {


//                     ...p,


//                     bankAccount: { ...p.bankAccount, owner1: e.target.value },


//                   }


//                 : p,


//             )


//           }


//         />


//       </Field>





//       {/* <Field label="בעל/ת חשבון 2 (PDF בלבד)">


//         <input


//           className={styles.input}


//           value={extras.bankAccount.owner2}


//           onChange={(e) =>


//             setExtras((p) =>


//               p


//                 ? {


//                     ...p,


//                     bankAccount: { ...p.bankAccount, owner2: e.target.value },


//                   }


//                 : p,


//             )


//           }


//         />


//       </Field> */}





//       <Field label="بنك   בנק">


//         <input


//           className={styles.input}


//           value={draft.intake.step4.bank.bankName}


//           onChange={(e) => update("intake.step4.bank.bankName", e.target.value)}


//         />


//       </Field>





//       <div className={styles.row2}>


//         <Field label="اسم البنك   שם הבנק">


//           <input


//             className={styles.input}


//             value={extras.bankAccount.branchName}


//             onChange={(e) =>


//               setExtras((p) =>


//                 p


//                   ? {


//                       ...p,


//                       bankAccount: {


//                         ...p.bankAccount,


//                         branchName: e.target.value,


//                       },


//                     }


//                   : p,


//               )


//             }


//           />


//         </Field>





//         <Field label="رقم الفرع   מספר סניף  ">


//           <input


//             className={styles.input}


//             value={extras.bankAccount.branchNumber}


//             onChange={(e) =>


//               setExtras((p) =>


//                 p


//                   ? {


//                       ...p,


//                       bankAccount: {


//                         ...p.bankAccount,


//                         branchNumber: e.target.value,


//                       },


//                     }


//                   : p,


//               )


//             }


//             dir="ltr"


//           />


//         </Field>


//       </div>





//       <Field label="رقم الحساب  מספר חשבון">


//         <input


//           className={styles.input}


//           value={draft.intake.step4.bank.accountNumber}


//           onChange={(e) =>


//             update("intake.step4.bank.accountNumber", e.target.value)


//           }


//           dir="ltr"


//         />


//       </Field>





//       <SectionTitle>بيانات الأطفال المطلوب تسجيلهم</SectionTitle>


//       <SectionTitle>


//         بيانات الأطفال الذين لم يتمّوا 18 عامًا ولا يتلقّون مخصّصات الأطفال


//       </SectionTitle>


//       <SectionTitle>פרטי הילדים שרישמום מבוקש</SectionTitle>


//       <SectionTitle>


//         פרטי ילדים שטרם מלאו להם 18 שנה ואינם מקבלים קצבת ילדים


//       </SectionTitle>





//       <div className={styles.childrenGrid}>


//         {selectedKids.map(({ child, index }) => (


//           <div key={index} className={styles.childCard}>


//             <Field label="رقم الهوية   מספר זהות">


//               <input


//                 className={styles.input}


//                 value={child.israeliId}


//                 onChange={(e) => updateChild(index, "israeliId", e.target.value)}


//                 dir="ltr"


//               />


//             </Field>





//             <Field label="اسم العائلة   שם משפחה   ">


//               <input


//                 className={styles.input}


//                 value={child.lastName}


//                 onChange={(e) => updateChild(index, "lastName", e.target.value)}


//               />


//             </Field>





//             <Field label="الاسم الشخصي    שם פרטי">


//               <input


//                 className={styles.input}


//                 value={child.firstName}


//                 onChange={(e) => updateChild(index, "firstName", e.target.value)}


//               />


//             </Field>





//             <Field label="تاريخ الميلاد   תאריך לידה  ">


//               <input


//                 className={styles.input}


//                 type="date"


//                 value={child.birthDate}


//                 onChange={(e) => updateChild(index, "birthDate", e.target.value)}


//               />


//             </Field>





//             <Field label="تاريخ الهجرة إلى البلاد   תאריך עלייה לארץ">


//               <input


//                 className={styles.input}


//                 type="date"


//                 value={child.entryDate}


//                 onChange={(e) => updateChild(index, "entryDate", e.target.value)}


//               />


//             </Field>





//             <Field label="تاريخ الدخول إلى البلاد   תאריך כניסה לארץ">


//               <input


//                 className={styles.input}


//                 type="date"


//                 value={extras.children[index]?.firstEntryDate ?? ""}


//                 onChange={(e) =>


//                   setExtras((p) => {


//                     if (!p) return p;


//                     const next = structuredClone(p);


//                     if (!next.children[index])


//                       next.children[index] = emptyChildExtras();


//                     next.children[index]!.firstEntryDate = e.target.value;


//                     return next;


//                   })


//                 }


//               />


//             </Field>





//             <Field label="تاريخ انضمام الطفل/الطفلة إلى ملف التأمين الوطني  תאריך הצטרפות הילד.ה לתיק ביטוח לאומי">


//               <input


//                 className={styles.input}


//                 type="date"


//                 value={extras.children[index]?.fileJoinDate ?? ""}


//                 onChange={(e) =>


//                   setExtras((p) => {


//                     if (!p) return p;


//                     const next = structuredClone(p);


//                     if (!next.children[index])


//                       next.children[index] = emptyChildExtras();


//                     next.children[index]!.fileJoinDate = e.target.value;


//                     return next;


//                   })


//                 }


//               />


//             </Field>


//           </div>


//         ))}


//       </div>





//       {/* <button


//         type="button"


//         onClick={addChildRow}


//         className={styles.secondaryBtn}


//       >


//         + הוסף ילד/ה נוסף/ת


//       </button> */}





//       {/* Footer button like your Step3 */}


//       <div className={styles.footerRow}>


//         <button


//           type="button"


//           className={styles.primaryButton}


//           onClick={() => router.push(nextUrl)}


//         >


//           לחתימה ואישור


//         </button>


//       </div>





//       {/* Debug helper if you want */}


//       {/* <pre>{JSON.stringify(payload, null, 2)}</pre> */}


//     </main>


//   );


// }













import React, { useEffect, useMemo, useRef, useState } from "react";

import { useParams, useRouter } from "next/navigation";


import styles from "./page.module.css";


import { useWizard } from "../WizardProvider";





function SectionTitle({ children }: { children: React.ReactNode }) {


  return <h2 className={styles.sectionTitle}>{children}</h2>;


}





function Field({

  label,

  children,

}: {

  label: string;

  children: React.ReactNode;

}) {

  return (

    <label className={styles.field}>

      <span className={styles.fieldLabel}>{label}</span>

      {children}

    </label>

  );

}



type SelectOption = { value: string; labelAr: string; labelHe: string };



function CustomSelect({

  label,

  value,

  onChange,

  options,

  placeholder,

}: {

  label: string;

  value: string;

  onChange: (val: string) => void;

  options: SelectOption[];

  placeholder: string;

}) {

  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);



  useEffect(() => {

    function handleClickOutside(event: MouseEvent) {

      if (

        containerRef.current &&

        !containerRef.current.contains(event.target as Node)

      ) {

        setIsOpen(false);

      }

    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, []);



  const selectedOption = options.find((o) => o.value === value);



  return (

    <div className={styles.field} ref={containerRef}>

      <span className={styles.fieldLabel}>{label}</span>

      <div className={styles.comboboxWrap}>

        <div

          className={styles.selectButton}

          onClick={() => setIsOpen(!isOpen)}

          role="button"

          aria-haspopup="listbox"

          aria-expanded={isOpen}

        >

          {selectedOption ? (

            <div className={styles.selectValue}>

              <span>{selectedOption.labelAr}</span>

              <span className={styles.selectValueMuted}>

                {selectedOption.labelHe}

              </span>

            </div>

          ) : (

            <span className={styles.selectPlaceholder}>{placeholder}</span>

          )}

          <svg

            className={styles.arrowIcon}

            viewBox="0 0 12 12"

            aria-hidden="true"

          >

            <path

              d="M4 2L0 6L4 10"

              stroke="currentColor"

              fill="none"

              strokeWidth="1.5"

            />

          </svg>

        </div>



        {isOpen && (

          <ul className={styles.comboboxMenu} role="listbox">

            {options.map((opt) => (

              <li

                key={opt.value}

                className={styles.comboboxItem}

                onClick={() => {

                  onChange(opt.value);

                  setIsOpen(false);

                }}

              >

                <span>{opt.labelAr}</span>

                <span className={styles.selectValueMuted}>{opt.labelHe}</span>

              </li>

            ))}

          </ul>

        )}

      </div>

    </div>

  );

}



const BANKS: SelectOption[] = [
  { value: "10", labelAr: "بنك لئومي (10)", labelHe: "בנק לאומי (10)" },
  { value: "12", labelAr: "بنك هبوعليم (12)", labelHe: "בנק הפועלים (12)" },
  { value: "20", labelAr: "بنك مزراحي تفحوت (20)", labelHe: "בנק מזרחי טפחות (20)" },
  { value: "11", labelAr: "بنك ديسكونت (11)", labelHe: "בנק דיסקונט (11)" },
  { value: "31", labelAr: "البنك الدولي (31)", labelHe: "הבנק הבינלאומי (31)" },
  { value: "4", labelAr: "بنك ياهف (4)", labelHe: "בנק יהב (4)" },
  { value: "17", labelAr: "بنك مركنتيل ديسكونت (17)", labelHe: "בנק מרכנתיל דיסקונט (17)" },
  { value: "14", labelAr: "بنك أوتسار هحيال (14)", labelHe: "בנק אוצר החייל (14)" },
  { value: "46", labelAr: "بنك مساد (46)", labelHe: "בנק מסד (46)" },
  { value: "54", labelAr: "بنك يרושלים (54)", labelHe: "בנק ירושלים (54)" },
];


const MOBILE_PREFIXES = [

  { label: "ישראל (+972) – إسرائيل", value: "+972" },

  { label: "רשות פלסטינית (+970) – فلسطين", value: "+970" },

  { label: "ארה\"ב (+1) – الولايات المتحدة", value: "+1" },

];



function PhoneField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [prefix, setPrefix] = useState(MOBILE_PREFIXES[0].value);
  const [body, setBody] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!value) return;
    const match = MOBILE_PREFIXES.find((p) => value.startsWith(p.value));
    const nextPrefix = match ? match.value : MOBILE_PREFIXES[0].value;
    const nextBody = match ? value.slice(match.value.length) : value;
    setPrefix(nextPrefix);
    setBody(nextBody);
  }, [value]);

  const emit = (nextPrefix: string, nextBody: string) => {
    const cleanBody = nextBody.replace(/^0+/, "");
    onChange(`${nextPrefix}${cleanBody}`);
  };

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.phoneRow}>
        <div className={styles.prefixWrapper}>
          <button
            type="button"
            className={styles.prefixBtn}
            onClick={() => setIsOpen(!isOpen)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          >
            {prefix}
            <svg
              className={styles.arrowIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {isOpen && (
            <ul className={styles.comboboxMenu} style={{ width: 200 }}>
              {MOBILE_PREFIXES.map((p) => (
                <li
                  key={p.value}
                  className={styles.comboboxItem}
                  onMouseDown={() => {
                    setPrefix(p.value);
                    emit(p.value, body);
                    setIsOpen(false);
                  }}
                >
                  <span style={{ direction: "ltr" }}>{p.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={styles.phoneBodyWrapper}>
          <input
            type="tel"
            className={styles.phoneBodyInput}
            value={body}
            onChange={(e) => {
              const nextBody = e.target.value.replace(/\D/g, "");
              setBody(nextBody);
              emit(prefix, nextBody);
            }}
            placeholder="0500000000"
          />
        </div>
      </div>
    </div>
  );
}

function DateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className={styles.dateWrapper}>
      <img className={styles.calendarIcon} src="/images/calendar.svg" alt="" />
      <input
        className={`${styles.input} ${styles.dateInput}`}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function splitEmail(email: string) {
  const e = (email ?? "").trim();


  const at = e.indexOf("@");


  if (at === -1) return { prefix: e, postfix: "" };


  return { prefix: e.slice(0, at), postfix: e.slice(at + 1) };


}





function emptyChildExtras() {


  return { firstEntryDate: "", fileJoinDate: "" };


}





export default function ChildAllowanceStep3() {


  const router = useRouter();


  const params = useParams();


  const locale = params.locale as string;





  const {


    draft,


    extras,


    setExtras,


    update,


    updateChild,


    instanceId,


    isHydrated,


    saveNow,


    saveStatus,


  } = useWizard();





  // ✅ store which step we are on (so drafts resume correctly)


  useEffect(() => {


    setExtras((p: any) => ({ ...p, currentStep: 3 }));


  }, [setExtras]);





  // Optional: same “payload cleanup” logic you had


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





  if (!isHydrated || !draft || !payload) {


    return <main className={styles.page}>Loading…</main>;


  }





  const allKids = draft.intake.step6.children ?? [];

  const selectedIndices = Array.isArray((extras as any)?.step1SelectedChildren)
    ? ((extras as any).step1SelectedChildren as number[])
    : null;
  const selectedKids = selectedIndices
    ? selectedIndices
        .filter((i) => Number.isInteger(i) && allKids[i])
        .map((i) => ({ index: i, child: allKids[i] }))
    : allKids.map((child, index) => ({ index, child }));





  async function goNext() {
    router.push(`/${locale}/forms/child-allowance-request/step-5`);
  }





  async function saveDraftAndExit() {


    const id = await saveNow();


    if (id) {


      router.push(`/${locale}/forms/child-allowance-request`);


    }


  }





  return (


    <main className={styles.page}>


      <div className={styles.header}>


        <div className={styles.headerText}>طلب مخصصات الأطفال</div>


        <div className={styles.headerText}>טופס בקשה לקצבת ילדים</div>


      </div>





      <SectionTitle>بيانات مقدم الطلب פרטי האב</SectionTitle>





      <Field label="الاسم الشخصي    שם פרטי">


        <input


          className={styles.input}


          value={draft.intake.step5.spouse.firstName.he}


          onChange={(e) =>


            update("intake.step5.spouse.firstName.he", e.target.value)


          }


        />


      </Field>





      <Field label="اسم العائلة   שם משפחה">


        <input


          className={styles.input}


          value={draft.intake.step5.spouse.lastName.he}


          onChange={(e) => update("intake.step5.spouse.lastName.he", e.target.value)}


        />


      </Field>





      <Field label="رقم بطاقة الهوية الإسرائيلية    מספר תעודת זהות">


        <input


          className={styles.input}


          value={draft.intake.step5.spouse.israeliId}


          onChange={(e) => update("intake.step5.spouse.israeliId", e.target.value)}


          dir="ltr"


        />


      </Field>





      <Field label="تاريخ الميلاد   תאריך לידה">
        <DateInput
          value={draft.intake.step5.spouse.birthDate}
          onChange={(val) => update("intake.step5.spouse.birthDate", val)}
        />
      </Field>



      {/* step5 does NOT have entryDate -> store in extras */}


      <Field label="تاريخ الدخول إلى البلاد   תאריך כניסה לארץ">
        <DateInput
          value={(extras as any).requesterEntryDate ?? ""}
          onChange={(val) =>
            setExtras((p: any) => ({ ...p, requesterEntryDate: val }))
          }
        />
      </Field>



      <SectionTitle>عنوان السكن כתובת מגורים</SectionTitle>


      <SectionTitle>السجل في وزارة الداخلية הרשומה במשרד הפנים</SectionTitle>





      <Field label="شارع   רחוב">


        <input


          className={styles.input}


          value={draft.intake.step3.registeredAddress.street.he}


          onChange={(e) =>


            update("intake.step3.registeredAddress.street.he", e.target.value)


          }


        />


      </Field>





      <div className={styles.row2}>


        <Field label="منزل  בניין">


          <input


            className={styles.input}


            value={draft.intake.step3.registeredAddress.houseNumber}


            onChange={(e) =>


              update("intake.step3.registeredAddress.houseNumber", e.target.value)


            }


            dir="ltr"


          />


        </Field>





        <Field label="دخول   כניסה">


          <input


            className={styles.input}


            value={draft.intake.step3.registeredAddress.entry}


            onChange={(e) =>


              update("intake.step3.registeredAddress.entry", e.target.value)


            }


            dir="ltr"


          />


        </Field>





        <Field label="شقة   דירה">


          <input


            className={styles.input}


            value={draft.intake.step3.registeredAddress.apartment}


            onChange={(e) =>


              update("intake.step3.registeredAddress.apartment", e.target.value)


            }


            dir="ltr"


          />


        </Field>





        <Field label="الرمز البريدي   מיקוד">


          <input


            className={styles.input}


            value={draft.intake.step3.registeredAddress.zip}


            onChange={(e) =>


              update("intake.step3.registeredAddress.zip", e.target.value)


            }


            dir="ltr"


          />


        </Field>


      </div>





      <Field label="مدينة   עיר">


        <input


          className={styles.input}


          value={draft.intake.step3.registeredAddress.city}


          onChange={(e) => update("intake.step3.registeredAddress.city", e.target.value)}


        />


      </Field>





      <SectionTitle> وسائل الاتصال</SectionTitle>


      <SectionTitle> المسجَّلون في وزارة الداخلية </SectionTitle>


      <SectionTitle> דרכי תקשורת</SectionTitle>


      <SectionTitle> הרשומים במשרד הפנים</SectionTitle>
      <PhoneField
        label="هاتف   טלפון"
        value={draft.intake.step5.spouse.phone}
        onChange={(val) => update("intake.step5.spouse.phone", val)}
      />
      <Field label="بريد إلكتروني   אימייל">


        <input


          className={styles.input}


          dir="ltr"


          inputMode="email"


          placeholder="name@example.com"


          value={


            extras.father.emailPostfix


              ? `${extras.father.emailPrefix}@${extras.father.emailPostfix}`


              : extras.father.emailPrefix


          }


          onChange={(e) => {


            const { prefix, postfix } = splitEmail(e.target.value);


            setExtras((p: any) => ({


              ...p,


              father: { ...p.father, emailPrefix: prefix, emailPostfix: postfix },


            }));


          }}


        />


      </Field>





      <SectionTitle>بيانات مستفيد المعاش </SectionTitle>


      <SectionTitle>פרטי מקבל הקצבה</SectionTitle>





      <Field label="الاسم الشخصي    שם פרטי">


        <input


          className={styles.input}


          value={draft.intake.step1.firstName.he}


          onChange={(e) => update("intake.step1.firstName.he", e.target.value)}


        />


      </Field>





      <Field label="اسم العائلة   שם משפחה">


        <input


          className={styles.input}


          value={draft.intake.step1.lastName.he}


          onChange={(e) => update("intake.step1.lastName.he", e.target.value)}


        />


      </Field>





      <Field label="رقم بطاقة الهوية الإسرائيلية    מספר תעודת זהות   ">


        <input


          className={styles.input}


          value={draft.intake.step1.israeliId}


          onChange={(e) => update("intake.step1.israeliId", e.target.value)}


          dir="ltr"


        />


      </Field>





      <Field label="تاريخ الميلاد   תאריך לידה  ">
        <DateInput
          value={draft.intake.step1.birthDate}
          onChange={(val) => update("intake.step1.birthDate", val)}
        />
      </Field>



      <Field label="تاريخ الدخول إلى البلاد   תאריך כניסה לארץ">
        <DateInput
          value={draft.intake.step2.entryDate}
          onChange={(val) => update("intake.step2.entryDate", val)}
        />
      </Field>



      <SectionTitle>تفاصيل حساب بنكي פרטי בנק</SectionTitle>





      <Field label="اسم صاحب الحساب    שם בעל החשבון">


        <input


          className={styles.input}


          value={extras.bankAccount.owner1}


          onChange={(e) =>


            setExtras((p: any) => ({


              ...p,


              bankAccount: { ...p.bankAccount, owner1: e.target.value },


            }))


          }


        />


      </Field>

      <CustomSelect

        label="بنك   בנק"

        value={draft.intake.step4.bank.bankName}

        onChange={(val) => update("intake.step4.bank.bankName", val)}

        options={BANKS}

        placeholder="בחר בנק"
      />

      <div className={styles.row2}>


        <Field label="اسم البنك   שם הבנק">


          <input


            className={styles.input}


            value={extras.bankAccount.branchName}


            onChange={(e) =>


              setExtras((p: any) => ({


                ...p,


                bankAccount: { ...p.bankAccount, branchName: e.target.value },


              }))


            }


          />


        </Field>





        <Field label="رقم الفرع   שם ומספר סניף  ">


          <input


            className={styles.input}


            value={extras.bankAccount.branchNumber}


            onChange={(e) =>


              setExtras((p: any) => ({


                ...p,


                bankAccount: { ...p.bankAccount, branchNumber: e.target.value },


              }))


            }


            dir="ltr"


          />


        </Field>


      </div>





      <Field label="رقم الحساب  מספר חשבון">


        <input


          className={styles.input}


          value={draft.intake.step4.bank.accountNumber}


          onChange={(e) =>


            update("intake.step4.bank.accountNumber", e.target.value)


          }


          dir="ltr"


        />


      </Field>





      <SectionTitle>بيانات الأطفال المطلوب تسجيلهم</SectionTitle>


      <SectionTitle>


        بيانات الأطفال الذين لم يتمّوا 18 عامًا ولا يتلقّون مخصّصات الأطفال


      </SectionTitle>


      <SectionTitle>פרטי הילדים שרישמום מבוקש</SectionTitle>


      <SectionTitle>


        פרטי ילדים שטרם מלאו להם 18 שנה ואינם מקבלים קצבת ילדים


      </SectionTitle>





      <div className={styles.childrenGrid}>


        {selectedKids.map(({ child, index }) => (


          <div key={index} className={styles.childCard}>


            <Field label="رقم الهوية   מספר זהות">


              <input


                className={styles.input}


                value={child.israeliId}


                onChange={(e) => updateChild(index, "israeliId", e.target.value)}


                dir="ltr"


              />


            </Field>





            <Field label="اسم العائلة   שם משפחה   ">


              <input


                className={styles.input}


                value={child.lastName}


                onChange={(e) => updateChild(index, "lastName", e.target.value)}


              />


            </Field>





            <Field label="الاسم الشخصي    שם פרטי">


              <input


                className={styles.input}


                value={child.firstName}


                onChange={(e) => updateChild(index, "firstName", e.target.value)}


              />


            </Field>





            <Field label="تاريخ الميلاد   תאריך לידה  ">
              <DateInput
                value={child.birthDate}
                onChange={(val) => updateChild(index, "birthDate", val)}
              />
            </Field>



            <Field label="تاريخ الهجرة إلى البلاد   תאריך עלייה לארץ">
              <DateInput
                value={child.entryDate}
                onChange={(val) => updateChild(index, "entryDate", val)}
              />
            </Field>



            <Field label="تاريخ الدخول إلى البلاد   תאריך כניסה לארץ">
              <DateInput
                value={extras.children[index]?.firstEntryDate ?? ""}
                onChange={(val) =>
                  setExtras((p: any) => {
                    const next = structuredClone(p);
                    if (!next.children[index]) next.children[index] = emptyChildExtras();
                    next.children[index].firstEntryDate = val;
                    return next;
                  })
                }
              />
            </Field>



            <Field label="تاريخ انضمام الطفل/الطفلة إلى ملف التأمين الوطني  תאריך הצטרפות הילד.ה לתיק ביטוח לאומי">
              <DateInput
                value={extras.children[index]?.fileJoinDate ?? ""}
                onChange={(val) =>
                  setExtras((p: any) => {
                    const next = structuredClone(p);
                    if (!next.children[index]) next.children[index] = emptyChildExtras();
                    next.children[index].fileJoinDate = val;
                    return next;
                  })
                }
              />
            </Field>
          </div>


        ))}


      </div>





      <div className={styles.footer}>


        <button


          type="button"


          className={styles.primaryButton}


          onClick={goNext}




        >


          לחתימה ואישור


        </button>





        <button


          type="button"


          className={styles.secondaryButton}


          onClick={saveDraftAndExit}




        >


          שמור כטיוטה


        </button>


      </div>


    </main>


  );


}
