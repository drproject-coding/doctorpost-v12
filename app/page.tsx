import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to dashboard
  redirect('/dashboard');
  
  // This won't be rendered, but it's here as a fallback
  return null;
}