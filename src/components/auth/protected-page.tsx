import { redirect } from 'next/navigation';
import { validateSession } from '@/lib/auth-utils';

export default async function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = await validateSession();

  if (!isAuthenticated) {
    redirect('/login');
  }

  return <>{children}</>;
}
