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
        border: selected ? "2px solid #1f2937" : "1px solid #d1d5db",
        textAlign: "center",
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

      <p style={{ marginTop: 12 }}>{title}</p>
    </div>
  );
}
