'use client';

import { useState } from 'react';
import Scene from './components/Scene';
import UploadPLY from './components/UploadPLY';

export default function Home() {
  const [plyURL, setPlyURL] = useState<string | null>(null);

  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        background: 'black',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <UploadPLY onLoad={setPlyURL} />
      {plyURL && (
        <div style={{ width: '100%', height: '100%' }}>
          <Scene plyURL={plyURL} />
        </div>
      )}
    </main>
  );
}
