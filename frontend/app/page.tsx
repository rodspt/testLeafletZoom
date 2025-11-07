'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-screen flex items-center justify-center">Carregando mapa...</div>
});

export default function Home() {
  return <Map />;
}