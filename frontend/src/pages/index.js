import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Home page component that redirects to Chat page
 * @returns {null} Renders nothing, redirects immediately
 */
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/Chat');
  }, [router]);
  return null;
}
