"use client";

import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "remda-intro-seen";
const noopSubscribe = () => () => {};

// SSR結果とのハイドレーション不一致を避けるため、マウント判定はuseSyncExternalStoreで行う
// （useEffect内でのsetState呼び出しを避けるため）。フェード演出自体もReactの状態管理ではなく
// CSSアニメーション（globals.css）に任せ、アニメーション終了イベントでのみ状態を更新する。
function useHasMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function IntroOverlay() {
  const mounted = useHasMounted();
  const [dismissed, setDismissed] = useState(false);

  if (!mounted || dismissed) return null;
  if (window.localStorage.getItem(STORAGE_KEY) === "1") return null;

  return (
    <div
      aria-hidden="true"
      className="animate-intro-overlay fixed inset-0 z-50 flex items-center justify-center bg-background"
      onAnimationEnd={() => {
        window.localStorage.setItem(STORAGE_KEY, "1");
        setDismissed(true);
      }}
    >
      <span className="animate-intro-logo text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        REMDA
      </span>
    </div>
  );
}
