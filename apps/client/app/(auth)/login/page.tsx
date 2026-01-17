import { LoginForm } from './components/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Time2Ship',
  description: 'Sign in to your account',
};

export default function LoginPage() {
  return <LoginForm />;
}
