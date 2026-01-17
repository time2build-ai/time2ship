import { RegisterForm } from './components/register-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | Time2Ship',
  description: 'Create a new account',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
