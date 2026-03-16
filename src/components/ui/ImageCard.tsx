import React from "react";

type ImageCardProps = {
  title: string;
  image: string;
  selected?: boolean;
  onClick: () => void;
};

export function ImageCard({
  title,
  image,
  selected,
  onClick,
}: ImageCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 260,
        padding: 16,
        cursor: "pointer",
        border: selected
          ? "2px solid var(--color-accent)"
          : "1px solid var(--color-border)",
        borderRadius: 14,
        background: "rgba(255, 255, 255, 0.92)",
        boxShadow: selected
          ? "0 14px 28px rgba(18, 60, 90, 0.14)"
          : "0 10px 24px rgba(18, 60, 90, 0.06)",
        textAlign: "center",
        color: "var(--color-text)",
        transition: "transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease",
      }}
    >
      <img
        src={image}
        alt={title}
        style={{
          width: "100%",
          height: 200,
          objectFit: "cover",
          borderRadius: 6,
        }}
      />

      <p style={{ marginTop: 12, color: "var(--color-text)" }}>{title}</p>
    </div>
  );
}
