'use client';

import { useState } from 'react';
import Scene from './components/Scene';
import UploadPLY from './components/UploadPLY';

export default function Home() {
  const [plyURL, setPlyURL] = useState<string | null>(null);

  return (
    <main style={{ height: '100vh', background: '#000' }}>
      <UploadPLY onLoad={setPlyURL} />
      {plyURL && <Scene plyURL={plyURL} />}
    </main>
  );
}
