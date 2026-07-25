// UseCaseの成功/失敗を例外を使わずに表現する型。Presentation層はmatchで分岐するだけでよい。
export class Result<T, E> {
  private constructor(
    private readonly value: T | null,
    private readonly error: E | null,
  ) {}

  static ok<T, E = never>(value: T): Result<T, E> {
    return new Result<T, E>(value, null);
  }

  static err<T = never, E = unknown>(error: E): Result<T, E> {
    return new Result<T, E>(null, error);
  }

  get isOk(): boolean {
    return this.error === null;
  }

  match<R>(onOk: (value: T) => R, onErr: (error: E) => R): R {
    return this.error !== null ? onErr(this.error) : onOk(this.value as T);
  }
}
