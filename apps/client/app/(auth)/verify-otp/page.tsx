import { Suspense } from 'react';
import { VerifyOTPForm } from './components/verify-otp-form';

export default function VerifyOTPPage(): React.ReactElement {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOTPForm />
    </Suspense>
  );
}
