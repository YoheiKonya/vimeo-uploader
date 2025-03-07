import VimeoUploader from './VimeoUploader';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-center mb-8">Vimeo動画アップローダー</h1>
        <VimeoUploader />
      </div>
    </main>
  );
}