'use client';

import { useState, useRef } from 'react';
import * as tus from 'tus-js-client';

export default function VimeoUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [videoId, setVideoId] = useState('');
  const [error, setError] = useState('');
  const uploadRef = useRef<tus.Upload | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('ファイルを選択してください');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      // サーバーサイドAPIからアップロードURLを取得
      const response = await fetch('/api/vimeo/create-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'アップロードURLの取得に失敗しました');
      }

      const { uploadUrl, videoId: vimeoVideoId } = await response.json();
      setVideoId(vimeoVideoId);

      // tusクライアントを使用してアップロード
      uploadRef.current = new tus.Upload(file, {
        uploadUrl,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          Accept: 'application/vnd.vimeo.*+json;version=3.4',
        },
        metadata: {
          filename: file.name,
          filetype: file.type
        },
        onError: (error) => {
          console.error('アップロードエラー:', error);
          setError(`アップロードエラー: ${error.message || '不明なエラー'}`);
          setUploading(false);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
          setProgress(parseFloat(percentage));
        },
        onSuccess: () => {
          console.log('アップロード成功!');
          setUploading(false);
          setProgress(100);
        }
      });

      // アップロード開始
      uploadRef.current.start();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('エラー:', error);
      setError(`エラー: ${error.message || '不明なエラー'}`);
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      setUploading(false);
      setProgress(0);
      setError('アップロードがキャンセルされました');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-xl font-bold mb-4">Vimeo動画アップローダー</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          動画ファイルを選択
        </label>
        <input 
          type="file" 
          accept="video/*" 
          onChange={handleFileChange} 
          disabled={uploading}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      
      {file && (
        <div className="mb-4 text-sm text-gray-600">
          <p>ファイル名: {file.name}</p>
          <p>サイズ: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
        </div>
      )}

      <div className="flex space-x-2 mb-4">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          アップロード
        </button>
        
        {uploading && (
          <button
            onClick={cancelUpload}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            キャンセル
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {uploading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">{progress.toFixed(1)}% アップロード完了</p>
        </div>
      )}

      {videoId && progress === 100 && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          <p className="font-semibold">アップロード完了！</p>
          <p className="mb-2">Vimeo動画ID: {videoId}</p>
          <a 
            href={`https://vimeo.com/${videoId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Vimeoで動画を見る →
          </a>
        </div>
      )}
    </div>
  );
}