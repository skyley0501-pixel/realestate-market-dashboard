// UseCaseが返すResult.errの中身。Route Handlerはcodeを見てHTTPステータスにマッピングする。
export class ApplicationError {
  constructor(
    readonly code: string,
    readonly message: string,
    readonly userMessage: string = message,
  ) {}
}
