'use client';

export default function UploadPLY({ onLoad }: { onLoad: (url: string) => void }) {
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    onLoad(url);
  }

  return (
    <div style={{ position: 'absolute', zIndex: 10, padding: 20}}>
      <input type="file" accept=".ply" onChange={handleFile} />
    </div>
  );
}
