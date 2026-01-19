"use client";

import { useRef, useState } from "react";
import intakeStyles from "@/lib/styles/IntakeForm.module.css";
import styles from "./DocumentsPage.module.css";

type UploadAction = (formData: FormData) => Promise<void>;
type DeleteAction = (formData: FormData) => Promise<void>;

type DocumentRowClientProps = {
  label: string;
  docKey: string;
  otherIndex?: number;
  locale: string;
  docName: string;
  publicUrl: string;
  emptyText: string;
  fileTooLargeText: string;
  deleteText: string;
  hasDoc: boolean;
  maxFileSizeBytes: number;
  uploadAction: UploadAction;
  deleteAction: DeleteAction;
};

export default function DocumentRowClient({
  label,
  docKey,
  otherIndex,
  locale,
  docName,
  publicUrl,
  emptyText,
  fileTooLargeText,
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

  const onFileChange = () => {
    const input = formRef.current?.querySelector<HTMLInputElement>(`#${inputId}`);
    const files = input?.files ? Array.from(input.files) : [];
    if (files.some((file) => file.size > maxFileSizeBytes)) {
      setError(fileTooLargeText);
      if (input) input.value = "";
      return;
    }
    setError(null);
    formRef.current?.requestSubmit();
  };

  return (
    <div className={intakeStyles.fieldGroup}>
      <div className={intakeStyles.label}>
        <span>{label}</span>
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
        <input
          id={inputId}
          type="file"
          name="file"
          accept="image/*,.pdf"
          className={intakeStyles.hiddenInput}
          onChange={onFileChange}
        />
      </form>

      <form id={deleteFormId} action={deleteAction} className={styles.deleteForm}>
        <input type="hidden" name="docKey" value={docKey} />
        <input type="hidden" name="locale" value={locale} />
        {typeof otherIndex === "number" ? (
          <input type="hidden" name="otherIndex" value={otherIndex} />
        ) : null}
      </form>

      <label
        htmlFor={inputId}
        className={`${intakeStyles.fileInputLabel} ${
          hasDoc ? intakeStyles.fileSelected : ""
        }`}
      >
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
          <span className={intakeStyles.filePlaceholder}>{emptyText}</span>
        )}

        <div className={styles.actionSlot} onClick={(event) => event.stopPropagation()}>
          {hasDoc ? (
            <button
              type="submit"
              form={deleteFormId}
              className={styles.docBtn}
              onClick={(event) => event.stopPropagation()}
            >
              {deleteText}
            </button>
          ) : (
            <img
              src="/icons/pin.svg"
              alt=""
              className={styles.pinIcon}
              aria-hidden="true"
            />
          )}
        </div>
      </label>
      {error ? <div className={styles.errorText}>{error}</div> : null}
    </div>
  );
}
