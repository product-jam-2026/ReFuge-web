"use client";

import { useRef, useState } from "react";
import intakeStyles from "@/lib/styles/IntakeForm.module.css";
import styles from "./DocumentsPage.module.css";

type UploadAction = (formData: FormData) => Promise<void>;
type DeleteAction = (formData: FormData) => Promise<void>;

type DocumentRowClientProps = {
  label: string;
  subLabel?: string;
  docKey: string;
  otherIndex?: number;
  locale: string;
  docName: string;
  publicUrl: string;
  emptyText: string;
  fileTooLargeText: string;
  uploadLoadingText: string;
  deleteLoadingText: string;
  deleteText: string;
  hasDoc: boolean;
  maxFileSizeBytes: number;
  uploadAction: UploadAction;
  deleteAction: DeleteAction;
};

export default function DocumentRowClient({
  label,
  subLabel,
  docKey,
  otherIndex,
  locale,
  docName,
  publicUrl,
  emptyText,
  fileTooLargeText,
  uploadLoadingText,
  deleteLoadingText,
  deleteText,
  hasDoc,
  maxFileSizeBytes,
  uploadAction,
  deleteAction,
}: DocumentRowClientProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const deleteFormId = `delete-${docKey}-${otherIndex ?? "single"}`;
  const inputId = `upload-${docKey}-${otherIndex ?? "single"}`;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"upload" | "delete" | null>(null);

  const submitForm = () => {
    if (formRef.current?.requestSubmit) {
      formRef.current.requestSubmit();
      return;
    }
    formRef.current?.submit();
  };

  const onFileChange = () => {
    const input = formRef.current?.querySelector<HTMLInputElement>(`#${inputId}`);
    const files = input?.files ? Array.from(input.files) : [];
    if (files.some((file) => file.size > maxFileSizeBytes)) {
      setError(fileTooLargeText);
      if (input) input.value = "";
      setLoading(null);
      return;
    }
    setError(null);
    setLoading("upload");
    submitForm();
  };

  return (
    <div className={intakeStyles.fieldGroup}>
      {loading ? (
        <div className={intakeStyles.loadingOverlay}>
          <div className={intakeStyles.spinner}></div>
          <div className={intakeStyles.loadingText} style={{ marginTop: 20 }}>
            <p style={{ fontSize: 18, fontWeight: "bold" }}>
              {loading === "upload" ? uploadLoadingText : deleteLoadingText}
            </p>
          </div>
        </div>
      ) : null}
      <div className={`${intakeStyles.label} ${styles.labelStack}`}>
        <span>{label}</span>
        {subLabel ? <span className={styles.labelSub}>{subLabel}</span> : null}
      </div>

      <form
        ref={formRef}
        action={uploadAction}
        className={styles.uploadForm}
        encType="multipart/form-data"
      >
        <input type="hidden" name="docKey" value={docKey} />
        <input type="hidden" name="locale" value={locale} />
        {typeof otherIndex === "number" ? (
          <input type="hidden" name="otherIndex" value={otherIndex} />
        ) : null}
        <label
          className={`${intakeStyles.fileInputLabel} ${
            hasDoc ? intakeStyles.fileSelected : ""
          }`}
        >
          <input
            id={inputId}
            type="file"
            name="file"
            accept="image/*,.pdf"
            className={intakeStyles.hiddenInput}
            onChange={onFileChange}
          />
          {hasDoc ? (
            <a
              className={`${intakeStyles.fileName} ${styles.docName}`}
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                window.open(publicUrl, "_blank", "noopener,noreferrer");
              }}
            >
              {docName}
            </a>
          ) : (
            <>
              <span className={intakeStyles.filePlaceholder}>{emptyText}</span>
              <span className={`${intakeStyles.plusIcon} ${styles.plusLeft}`}>+</span>
            </>
          )}

          {hasDoc ? (
            <div className={styles.actionSlot} onClick={(event) => event.stopPropagation()}>
              <button
                type="submit"
                form={deleteFormId}
                className={styles.docBtn}
                onClick={(event) => {
                  event.stopPropagation();
                  setLoading("delete");
                }}
              >
                {deleteText}
              </button>
            </div>
          ) : null}
        </label>
      </form>

      <form id={deleteFormId} action={deleteAction} className={styles.deleteForm}>
        <input type="hidden" name="docKey" value={docKey} />
        <input type="hidden" name="locale" value={locale} />
        {typeof otherIndex === "number" ? (
          <input type="hidden" name="otherIndex" value={otherIndex} />
        ) : null}
      </form>

      {error ? <div className={styles.errorText}>{error}</div> : null}
    </div>
  );
}
