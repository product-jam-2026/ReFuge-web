"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import styles from "@/lib/styles/IntakeForm.module.css"; 

const INTRO_IMAGE = "/images/step7-files.svg"; 

function BiInline({ ar, he }: { ar: string; he: string }) {
  return (
    <>
      <span>{ar}</span>
      <span>{he}</span>
    </>
  );
}

type Props = {
  locale: string;
  saved: boolean;
  defaults: any;
  childrenList: any[]; // הרשימה משלב 6
  saveDraftAction: (formData: FormData) => Promise<void>;
  finishAction: (formData: FormData) => Promise<void>;
  saveDraftAndBackAction: (formData: FormData) => Promise<void>;
};

export default function Step7FormClient({
  saved,
  defaults,
  childrenList = [], // ברירת מחדל
  saveDraftAction,
  finishAction,
  saveDraftAndBackAction,
}: Props) {
  const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;
  const [screen, setScreen] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftSaved, setShowDraftSaved] = useState(false);
  const [fileErrors, setFileErrors] = useState<Record<string, boolean>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const draftTimerRef = useRef<number | null>(null);
  
  const [fileNames, setFileNames] = useState<Record<string, string>>({
    passportCopy: defaults.passportCopy ? "קובץ קיים / ملف موجود" : "",
    familyStatusDoc: defaults.familyStatusDoc ? "קובץ קיים / ملف موجود" : "",
    secondParentStatusDoc: defaults.secondParentStatusDoc ? "קובץ קיים / ملف موجود" : "",
    rentalContract: defaults.rentalContract ? "קובץ קיים / ملف موجود" : "",
    propertyOwnership: defaults.propertyOwnership ? "קובץ קיים / ملف موجود" : "",
    childPassportPhoto: defaults.childPassportPhoto ? "קובץ קיים / ملف موجود" : "", // למקרה הגנרי
    otherDocs: defaults.otherDocs ? "קובץ קיים / ملف موجود" : "",
  });

  const goBack = () => setScreen(0);
  const startForm = () => setScreen(1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    const tooLarge = files.some((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (tooLarge) {
      setFileErrors((prev) => ({ ...prev, [fieldName]: true }));
      e.target.value = "";
      return;
    }

    setFileErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });

    const count = files.length;
    let displayText = files[0].name;
    if (count > 1) {
      displayText = `${count} קבצים נבחרו / ${count} ملفات`;
    }
    setFileNames((prev) => ({ ...prev, [fieldName]: displayText }));
  };

  const renderFileError = (fieldName: string) => {
    if (!fileErrors[fieldName]) return null;
    return (
      <div className={styles.uploadError}>
        <BiInline
          ar="الملف كبير جدًا ولا يمكن رفعه (حد أقصى 10MB)"
          he="הקובץ גדול מדי ולא ניתן להעלות אותו (מקסימום 10MB)"
        />
      </div>
    );
  };

  const handleSubmit = async (formData: FormData) => {
      setIsSubmitting(true);
      await finishAction(formData);
  };

  const handleSaveDraft = async () => {
    if (!formRef.current) return;
    const start = Date.now();
    setShowDraftSaved(true);
    try {
      const formData = new FormData(formRef.current);
      await saveDraftAction(formData);
    } catch (error) {
      console.error("Draft save error:", error);
    } finally {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 2000 - elapsed);
      if (draftTimerRef.current) {
        window.clearTimeout(draftTimerRef.current);
      }
      draftTimerRef.current = window.setTimeout(() => setShowDraftSaved(false), remaining);
    }
  };

  return (
    <div className={styles.pageContainer} dir="rtl">
      
      {isSubmitting && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText} style={{marginTop: 20}}>
             <p style={{fontSize: 18, fontWeight: 'bold'}}>שומר נתונים...</p>
             <p style={{fontSize: 14, color: '#666'}}>جاري الحفظ...</p>
          </div>
        </div>
      )}
      {showDraftSaved && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText} style={{marginTop: 20}}>
            <p style={{fontSize: 18, fontWeight: 'bold'}}>تم حفظ البيانات، ويمكن تعديلها في المنطقة الشخصية في أي وقت</p>
            <p style={{fontSize: 14, color: '#666'}}>הנתונים נשמרו, ניתן לערוך אותם תמיד באזור האישי</p>
          </div>
        </div>
      )}

      {/* Intro Screen */}
      {screen === 0 && (
        <div className={styles.stepSplashContainer}>
          <Image src={INTRO_IMAGE} alt="Files" width={280} height={200} className={styles.stepSplashImage} priority />
          <div className={styles.stepSplashContent}>
            <div className={styles.stepNumberTitle}><span>المرحلة 7</span><span>שלב 7</span></div>
            <div className={styles.stepMainTitle}><span>تحميل المستندات</span><span>העלאת מסמכים</span></div>
            <div className={styles.stepDescription}>
                <p dir="rtl">بهالمرحلة الأخيرة نرفع صور الهوية، الجوازات وأي مستندات تانية<br/>الوقت المتوقع للتعبئة: 3 دقائق</p>
                <br/>
                <p dir="rtl">בשלב אחרון זה נעלה צילומי תעודות זהות, דרכונים ומסמכים נוספים<br/>זמן מילוי משוער: 3 דקות</p>
            </div>
          </div>
          <button type="button" className={styles.btnDark} onClick={startForm}>
            <BiInline ar="ابدأ" he="התחל" />
          </button>
        </div>
      )}

      {/* Main Form Screen */}
      {screen === 1 && (
        <form className={styles.scrollableContent} ref={formRef} action={handleSubmit} encType="multipart/form-data">
          
          <div className={styles.topBar}>
            <div className={styles.topRow} style={{justifyContent: 'flex-start'}}>
               <button type="submit" formAction={saveDraftAndBackAction} className={styles.backBtn}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
               </button>
               <div className={styles.stepMeta} style={{marginRight: 10}}><span>المرحلة 7 من 7</span> <span>שלב 7 מתוך 7</span></div>
            </div>
            <div className={styles.progressBarTrack}><div className={styles.progressBarFill} style={{ width: '100%' }} /></div>
            
            <div className={styles.titleBlock}>
                <h1 className={styles.formTitle} style={{
                    flexDirection: 'column', 
                    alignItems: 'flex-start',
                    gap: '4px' 
                }}>
                    <span>تحميل المستندات</span>
                    <span>העלאת מסמכים</span>
                </h1>
            </div>
          </div>

          {/* 1. Passport Copy */}
          <div className={styles.fieldGroup}>
            <div className={styles.label} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
               <BiInline ar="نسخة من جواز السفر" he="צילום דרכון" />
            </div>
            {renderFileError("passportCopy")}
            <label className={`${styles.fileInputLabel} ${fileNames.passportCopy ? styles.fileSelected : ''}`}>
              {fileNames.passportCopy ? (
                  <span className={styles.fileName}>{fileNames.passportCopy}</span>
              ) : (
                  <span className={styles.filePlaceholder} style={{display: 'flex', gap: '8px'}}>
                    <BiInline ar="اضغط للرفع" he="לחץ להעלאה" />
                  </span>
              )}
              <span className={styles.plusIcon}>+</span>
              <input type="file" name="passportCopy" accept="image/*,.pdf" className={styles.hiddenInput} onChange={(e) => handleFileChange(e, 'passportCopy')} />
            </label>
          </div>

          {/* 2. Family Status Doc */}
          <div className={styles.fieldGroup}>
            <div className={styles.label} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
               <BiInline ar="توثيق الحالة العائلية" he="תיעוד מצב משפחתי" />
            </div>
            {renderFileError("familyStatusDoc")}
            <label className={`${styles.fileInputLabel} ${fileNames.familyStatusDoc ? styles.fileSelected : ''}`}>
              {fileNames.familyStatusDoc ? (
                  <span className={styles.fileName}>{fileNames.familyStatusDoc}</span>
              ) : (
                  <span className={styles.filePlaceholder} style={{display: 'flex', gap: '8px'}}>
                    <BiInline ar="اضغط للرفع" he="לחץ להעלאה" />
                  </span>
              )}
              <span className={styles.plusIcon}>+</span>
              <input type="file" name="familyStatusDoc" accept="image/*,.pdf" className={styles.hiddenInput} onChange={(e) => handleFileChange(e, 'familyStatusDoc')} />
            </label>
          </div>

          {/* 3. Second Parent Status Doc */}
          <div className={styles.fieldGroup}>
            <div className={styles.label} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
               <BiInline ar="توثيق الحالة العائلية للوالد الثاني" he="תיעוד מצב משפחתי של ההורה השני" />
            </div>
            {renderFileError("secondParentStatusDoc")}
            <label className={`${styles.fileInputLabel} ${fileNames.secondParentStatusDoc ? styles.fileSelected : ''}`}>
              {fileNames.secondParentStatusDoc ? (
                  <span className={styles.fileName}>{fileNames.secondParentStatusDoc}</span>
              ) : (
                  <span className={styles.filePlaceholder} style={{display: 'flex', gap: '8px'}}>
                    <BiInline ar="اضغط للرفع" he="לחץ להעלאה" />
                  </span>
              )}
              <span className={styles.plusIcon}>+</span>
              <input type="file" name="secondParentStatusDoc" accept="image/*,.pdf" className={styles.hiddenInput} onChange={(e) => handleFileChange(e, 'secondParentStatusDoc')} />
            </label>
          </div>

          {/* 4. Rental Contract */}
          <div className={styles.fieldGroup}>
            <div className={styles.label} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
               <BiInline ar="عقد إيجار" he="חוזה שכירות" />
            </div>
            {renderFileError("rentalContract")}
            <label className={`${styles.fileInputLabel} ${fileNames.rentalContract ? styles.fileSelected : ''}`}>
              {fileNames.rentalContract ? (
                  <span className={styles.fileName}>{fileNames.rentalContract}</span>
              ) : (
                  <span className={styles.filePlaceholder} style={{display: 'flex', gap: '8px'}}>
                    <BiInline ar="اضغط للرفع" he="לחץ להעלאה" />
                  </span>
              )}
              <span className={styles.plusIcon}>+</span>
              <input type="file" name="rentalContract" accept="image/*,.pdf" className={styles.hiddenInput} onChange={(e) => handleFileChange(e, 'rentalContract')} />
            </label>
          </div>

          {/* 5. Property Ownership */}
          <div className={styles.fieldGroup}>
            <div className={styles.label} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
               <BiInline ar="شهادة ملكية الممتلكات" he="אישור בעלות רכוש" />
            </div>
            {renderFileError("propertyOwnership")}
            <label className={`${styles.fileInputLabel} ${fileNames.propertyOwnership ? styles.fileSelected : ''}`}>
              {fileNames.propertyOwnership ? (
                  <span className={styles.fileName}>{fileNames.propertyOwnership}</span>
              ) : (
                  <span className={styles.filePlaceholder} style={{display: 'flex', gap: '8px'}}>
                    <BiInline ar="اضغط للرفع" he="לחץ להעלאה" />
                  </span>
              )}
              <span className={styles.plusIcon}>+</span>
              <input type="file" name="propertyOwnership" accept="image/*,.pdf" className={styles.hiddenInput} onChange={(e) => handleFileChange(e, 'propertyOwnership')} />
            </label>
          </div>

          {/* 6. Child Documents - Dynamic OR Generic Fallback */}
          {childrenList && childrenList.length > 0 ? (
             // --- אפשרות א': יש רשימת ילדים (מציג שורה לכל ילד) ---
             <>
               <div className={styles.sectionHead} style={{marginTop: 30}}>
                  <div className={styles.sectionTitle}>
                     <BiInline ar="جوازات سفر الأطفال" he="דרכונים/תמונות של הילדים" />
                  </div>
               </div>
               {childrenList.map((child: any, index: number) => {
                  const fieldKey = `child_doc_${index}`;
                  const displayName = child.firstName || `ילד ${index + 1}`;
                  return (
                    <div className={styles.fieldGroup} key={index}>
                      <div className={styles.label} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                         <span>{displayName}</span>
                         <span style={{fontSize: 13, opacity: 0.7}}>
                            <BiInline ar="صورة جواز السفر" he="תמונת דרכון" />
                         </span>
                      </div>
                      {renderFileError(fieldKey)}
                      <label className={`${styles.fileInputLabel} ${fileNames[fieldKey] ? styles.fileSelected : ''}`}>
                        {fileNames[fieldKey] ? (
                            <span className={styles.fileName}>{fileNames[fieldKey]}</span>
                        ) : (
                            <span className={styles.filePlaceholder} style={{display: 'flex', gap: '8px'}}>
                              <BiInline ar="اضغط للرفع" he="לחץ להעלאה" />
                            </span>
                        )}
                        <span className={styles.plusIcon}>+</span>
                        <input type="file" name={fieldKey} accept="image/*,.pdf" className={styles.hiddenInput} onChange={(e) => handleFileChange(e, fieldKey)} />
                        <input type="hidden" name={`child_id_${index}`} value={index} />
                      </label>
                    </div>
                  );
               })}
             </>
          ) : (
             // --- אפשרות ב': אין רשימת ילדים (מציג שדה גנרי כדי שלא יהיה ריק) ---
             <div className={styles.fieldGroup}>
                <div className={styles.label} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                   <BiInline ar="صورة جواز سفر الطفل/الطفلة" he="תמונת פספורט ילד.ה" />
                </div>
                {renderFileError("childPassportPhoto")}
                <label className={`${styles.fileInputLabel} ${fileNames.childPassportPhoto ? styles.fileSelected : ''}`}>
                  {fileNames.childPassportPhoto ? (
                      <span className={styles.fileName}>{fileNames.childPassportPhoto}</span>
                  ) : (
                      <span className={styles.filePlaceholder} style={{display: 'flex', gap: '8px'}}>
                        <BiInline ar="اضغط للرفع" he="לחץ להעלאה" />
                      </span>
                  )}
                  <span className={styles.plusIcon}>+</span>
                  <input type="file" name="childPassportPhoto" accept="image/*,.pdf" multiple className={styles.hiddenInput} onChange={(e) => handleFileChange(e, 'childPassportPhoto')} />
                </label>
                <div style={{fontSize: 13, color: '#6B7280', marginTop: 4, marginRight: 10}}>
                    ניתן לבחור מספר קבצים בבת אחת (يمكن اختيار عدة ملفات)
                </div>
             </div>
          )}

          {/* 7. Other Documents */}
          <div className={styles.fieldGroup} style={{marginTop: 20}}>
            <div className={styles.label}>
               <BiInline ar="وثائق إضافية" he="מסמכים נוספים" />
            </div>
            {renderFileError("otherDocs")}
            <label className={`${styles.fileInputLabel} ${fileNames.otherDocs ? styles.fileSelected : ''}`}>
              {fileNames.otherDocs ? (
                  <span className={styles.fileName}>{fileNames.otherDocs}</span>
              ) : (
                  <span className={styles.filePlaceholder} style={{display: 'flex', gap: '8px'}}>
                    <BiInline ar="اضغط للرفع" he="לחץ להעלאה" />
                  </span>
              )}
              <span className={styles.plusIcon}>+</span>
              <input type="file" name="otherDocs" accept="image/*,.pdf" multiple className={styles.hiddenInput} onChange={(e) => handleFileChange(e, 'otherDocs')} />
            </label>
          </div>

          <div className={styles.fixedFooter}>
            <button type="submit" className={styles.btnPrimary}>
              <BiInline ar="إنهاء التسجيل" he="סיום הרשמה" />
            </button>

            <button type="button" onClick={handleSaveDraft} className={styles.btnSecondary}>
              <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
