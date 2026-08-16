"use client";

// ルートレイアウト自体がクラッシュした場合のフォールバック。html/bodyを自前で持つ必要があるため、
// globals.cssのCSS変数（テーマトークン）を読み込めない前提で最小限のインラインスタイルのみを使う。
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ja">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "sans-serif",
          backgroundColor: "#060b16",
          color: "#eff2f6",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>アプリケーションエラーが発生しました</h1>
        <p style={{ color: "#9199a5", maxWidth: "28rem" }}>
          しばらくしてから再度お試しください。問題が続く場合はページを再読み込みしてください。
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem 1.25rem",
            borderRadius: "0.875rem",
            backgroundColor: "#535cda",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
          }}
        >
          再試行する
        </button>
      </body>
    </html>
  );
}
