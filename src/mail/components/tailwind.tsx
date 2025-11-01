import { Tailwind as EmailTailwind } from "@react-email/components";

export function Tailwind({ children, theme, ...props }: any) {
  return (
    <EmailTailwind {...props}>
      {children}
    </EmailTailwind>
  );
}
