'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/shared/components/ui/button';
import { logoutAction } from '../actions';

function LogoutButtonInner() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      loading={pending}
      className="w-full"
    >
      Logout
    </Button>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <LogoutButtonInner />
    </form>
  );
}
