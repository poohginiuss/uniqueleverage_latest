import { redirect } from 'next/navigation';
import { validateSession } from '@/lib/auth-utils';

export async function ServerAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = await validateSession();

  if (!isAuthenticated) {
    redirect('/signup');
  }

  return <>{children}</>;
}
