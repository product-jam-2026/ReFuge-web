"use client";

import { useRef } from "react";
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
  deleteText: string;
  hasDoc: boolean;
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
  deleteText,
  hasDoc,
  uploadAction,
  deleteAction,
}: DocumentRowClientProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const deleteFormId = `delete-${docKey}-${otherIndex ?? "single"}`;

  const onPickFile = () => {
    inputRef.current?.click();
  };

  const onFileChange = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <div className={intakeStyles.fieldGroup}>
      <div className={intakeStyles.label}>
        <span>{label}</span>
      </div>

      <form ref={formRef} action={uploadAction} className={styles.uploadForm}>
        <input type="hidden" name="docKey" value={docKey} />
        <input type="hidden" name="locale" value={locale} />
        {typeof otherIndex === "number" ? (
          <input type="hidden" name="otherIndex" value={otherIndex} />
        ) : null}
        <input
          ref={inputRef}
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

      <div
        className={`${intakeStyles.fileInputLabel} ${
          hasDoc ? intakeStyles.fileSelected : ""
        }`}
        role="button"
        tabIndex={0}
        onClick={onPickFile}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onPickFile();
          }
        }}
      >
        {hasDoc ? (
          <a
            className={intakeStyles.fileName}
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
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
      </div>
    </div>
  );
}
