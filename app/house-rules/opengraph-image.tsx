import { ImageResponse } from "next/og";

export const alt = "Campaign House Rules";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#eee6d4",
        color: "#25231e",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding: "72px",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          borderBottom: "2px solid #25231e",
          borderTop: "2px solid #25231e",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "104px",
            fontWeight: 400,
            letterSpacing: "-4px",
            lineHeight: 0.95,
            maxWidth: "920px",
          }}
        >
          CAMPAIGN HOUSE RULES
        </div>
      </div>
    </div>,
    size,
  );
}
