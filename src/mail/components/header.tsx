import { Container, Img, Text } from "@react-email/components";

// Your actual logo from public/mini_2nd.png
const LOGO_URL = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/mini_2nd.png`;

export function LeftAligned() {
  return (
    <Container style={{ marginBottom: "32px" }}>
      <Container style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Img
          src={LOGO_URL}
          alt="Unique Leverage"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            display: "block"
          }}
        />
        <Text style={{
          fontSize: "18px",
          fontWeight: "600",
          color: "#1f2937",
          margin: "0",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
          Unique Leverage
        </Text>
      </Container>
    </Container>
  );
}
