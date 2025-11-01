import { Container, Text } from "@react-email/components";

export function LeftAligned() {
  return (
    <Container style={{ textAlign: "center", marginTop: "32px" }}>
      <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "32px 0" }} />
      <Text style={{ color: "#6b7280", margin: "0 0 8px 0", fontSize: "14px" }}>
        Still having issues? Please contact our friendly team:
      </Text>
      <a href="mailto:support@uniqueleverage.com" style={{ color: "#2563EB", textDecoration: "none", fontWeight: "500" }}>
        support@uniqueleverage.com
      </a>
    </Container>
  );
}
