import { Body as EmailBody } from "@react-email/components";

export function Body({ children, ...props }: any) {
  return (
    <EmailBody style={{ margin: 0, padding: 0, backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }} {...props}>
      {children}
    </EmailBody>
  );
}
