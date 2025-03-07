import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileSize } = await req.json();
    
    // Vimeo APIの認証情報
    const accessToken = process.env.VIMEO_ACCESS_TOKEN!;
    console.log('Vimeoアクセストークン:', accessToken);
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Vimeoアクセストークンが設定されていません' },
        { status: 500 }
      );
    }

    // Vimeo APIを使用してtusアップロードURLを取得
    const createUploadResponse = await fetch('https://api.vimeo.com/me/videos', {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.vimeo.*+json;version=3.4'
      },
      body: JSON.stringify({
        upload: {
          approach: 'tus',
          size: fileSize
        },
        privacy: {
          view: 'anybody',
        },
        name: fileName,
        description: 'Next.js App Routerからアップロードされた動画'
      })
    });

    if (!createUploadResponse.ok) {
      const errorData = await createUploadResponse.json();
      console.error('Vimeo API エラー:', errorData);
      return NextResponse.json(
        { error: `Vimeo API エラー: ${errorData.error || '不明なエラー'}` },
        { status: createUploadResponse.status }
      );
    }

    const uploadData = await createUploadResponse.json();
    
    // クライアント側に必要な情報だけを返す
    return NextResponse.json({
      uploadUrl: uploadData.upload.upload_link,
      videoUri: uploadData.uri,
      videoId: uploadData.uri.split('/').pop()
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('サーバーエラー:', error);
    return NextResponse.json(
      { error: `サーバーエラー: ${error.message || '不明なエラー'}` },
      { status: 500 }
    );
  }
}