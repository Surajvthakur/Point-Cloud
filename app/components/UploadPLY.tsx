'use client';

export default function UploadPLY({ onLoad }: { onLoad: (url: string) => void }) {
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    onLoad(url);
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 1)',
        padding: '10px',
        borderRadius: '5px',
      }}
    >
      <input
        type="file"
        accept=".ply"
        onChange={handleFile}
        style={{
          color: 'white',
          backgroundColor: 'transparent',
          border: '1px solid white',
          padding: '5px',
          borderRadius: '3px',
        }}
      />
    </div>
  );
}
