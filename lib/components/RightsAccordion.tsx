"use client";

import { useState } from "react";
import styles from "./RightsAccordion.module.css";

export type RightItem = {
  id: string;
  title: string;
  body: string;
};

type Props = {
  items: RightItem[];
};

export function RightsAccordion({ items }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <div className={styles.wrapper}>
      {items.map((item) => {
        const isOpen = item.id === openId;
        return (
          <div key={item.id} className={styles.item}>
            <button
              className={styles.header}
              onClick={() => toggle(item.id)}
            >
              <span>{item.title}</span>
              <span className={styles.icon}>{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
              <div className={styles.body}>
                {item.body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
