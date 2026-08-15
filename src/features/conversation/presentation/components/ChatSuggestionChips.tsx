const SUGGESTIONS = [
  "渋谷区の相場を教えて",
  "港区の価格動向はどう？",
  "中央区は今後値上がりしそう？",
  "世田谷区の取引件数は多い？",
] as const;

// 初回表示時、何を聞けばいいか分からないユーザー向けの入力候補。クリックで送信フォームに入力される。
export function ChatSuggestionChips({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTIONS.map((text) => (
        <button
          key={text}
          type="button"
          onClick={() => onSelect(text)}
          className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
        >
          {text}
        </button>
      ))}
    </div>
  );
}
