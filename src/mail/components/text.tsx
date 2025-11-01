import { Text as EmailText } from "@react-email/components";

export function Text({ children, className, ...props }: any) {
  // Handle Tailwind classes by converting to inline styles
  let style = {};
  
  if (className) {
    if (className.includes('text-md')) {
      style = { ...style, fontSize: '14px', lineHeight: '20px' };
    }
    if (className.includes('text-tertiary')) {
      style = { ...style, color: '#6B7280' };
    }
    if (className.includes('font-semibold')) {
      style = { ...style, fontWeight: '600' };
    }
  }

  return (
    <EmailText 
      style={{
        color: '#111827',
        fontSize: '14px',
        lineHeight: '20px',
        margin: '0',
        ...style,
        ...props.style
      }}
      {...props}
    >
      {children}
    </EmailText>
  );
}
