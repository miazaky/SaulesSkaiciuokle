import React from "react";

type FormGridProps = {
  children: React.ReactNode;
  columns?: number;
};

export function FormGrid({ children, columns = 2 }: FormGridProps) {
  return (
    <div
      className="form-grid"
      style={{
        "--form-grid-columns": columns,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
