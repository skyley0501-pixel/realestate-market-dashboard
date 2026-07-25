// Route Handlerの入口で発行し、ログ・エラーレスポンスに一貫して付与するリクエストID
export function createRequestId(): string {
  return crypto.randomUUID();
}
