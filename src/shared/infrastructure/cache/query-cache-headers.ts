// バッチ集計等リアルタイム性が不要なレスポンス向けのCache-Controlヘッダ。
// maxAgeSeconds経過後もstaleWhileRevalidateSecondsの間はCDN/ブラウザが古い値を即座に返しつつ裏側で再検証する。
export function cacheHeaders(maxAgeSeconds: number, staleWhileRevalidateSeconds: number): HeadersInit {
  return {
    "Cache-Control": `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`,
  };
}
