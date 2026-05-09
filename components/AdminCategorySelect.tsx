"use client";

import { useState } from "react";
import { productCategories } from "@/lib/categories";

export function AdminCategorySelect({
  defaultValue = "new",
  exclude = []
}: {
  defaultValue?: string;
  exclude?: string[];
}) {
  const options = productCategories.filter((category) => !exclude.includes(category.value));
  const safeDefault = options.some((category) => category.value === defaultValue) ? defaultValue : options[0]?.value ?? "mens";
  const [value, setValue] = useState(safeDefault);
  const [open, setOpen] = useState(false);
  const selected = options.find((category) => category.value === value) ?? options[0];

  return (
    <div className="custom-select">
      <input name="category" type="hidden" value={value} />
      <button className="custom-select-trigger" onClick={() => setOpen((current) => !current)} type="button">
        <span>{selected.label}</span>
        <span aria-hidden>⌄</span>
      </button>
      {open ? (
        <div className="custom-select-menu">
          {options.map((category) => (
            <button
              className={category.value === value ? "active" : ""}
              key={category.value}
              onClick={() => {
                setValue(category.value);
                setOpen(false);
              }}
              type="button"
            >
              {category.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
