import { Toast } from "@base-ui/react/toast";

// コンポーネント外（fetchのエラーハンドラ等）からもトーストを表示できるよう、
// アプリ全体で共有する単一のToastManagerインスタンス。<Toaster />（components/toaster.tsx）で
// このインスタンスをProviderに渡している。
export const toastManager = Toast.createToastManager();
