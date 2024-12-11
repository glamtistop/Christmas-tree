'use client';

import dynamic from 'next/dynamic';

const ChristmasApp = dynamic(
  () => import('../components/ChristmasApp'),
  { loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-green-900">
      <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )}
);

export default function Home() {
  return <ChristmasApp />;
}
