import React from "react";

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

export function InputField({ label, children }: FieldProps) {
  return (
    <div style={{ marginTop: 16 }}>
      <label style={{ display: "block", marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
