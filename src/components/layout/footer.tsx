export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>データ出典: 国土交通省 不動産情報ライブラリ</p>
        <p>&copy; {new Date().getFullYear()} realestate-market-dashboard</p>
      </div>
    </footer>
  );
}
