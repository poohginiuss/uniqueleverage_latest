import { Button as EmailButton } from "@react-email/components";

export function Button({ children, href, className, ...props }: any) {
  return (
    <EmailButton
      href={href}
      style={{
        backgroundColor: "#2563EB",
        color: "#ffffff",
        padding: "14px 28px",
        textDecoration: "none",
        borderRadius: "8px",
        fontWeight: "600",
        display: "inline-block",
        fontSize: "16px",
        textAlign: "center",
        border: "none",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        width: "auto",
        ...props.style
      }}
      {...props}
    >
      {children}
    </EmailButton>
  );
}
