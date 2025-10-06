import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { memo } from 'react';

/**
 * Home page component that redirects to Chat page
 * @returns {null} Renders nothing, redirects immediately
 */
const Home = memo(function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/Chat');
  }, [router]);
  
  return null;
});

export default Home;
