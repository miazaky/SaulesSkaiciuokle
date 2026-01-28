import React from "react";

type FormGridProps = {
  children: React.ReactNode;
  columns?: number;
};

export function FormGrid({ children, columns = 2 }: FormGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 24,
      }}
    >
      {children}
    </div>
  );
}
