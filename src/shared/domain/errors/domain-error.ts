// ドメイン層で発生するエラーの基底クラス。Application層でResult.errへの変換に使う識別コードを持つ。
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
