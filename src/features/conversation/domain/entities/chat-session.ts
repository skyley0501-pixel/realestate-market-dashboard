export interface ChatSessionProps {
  id: string;
  // Phase5でSupabase Authを導入するまでは常にnull（匿名セッションとして扱う）
  userId: string | null;
  title: string | null;
  createdAt: Date;
}

// AIチャットの1会話セッション。id同一性を持つEntity。メッセージ本体はChatMessageとして別管理する。
export class ChatSession {
  private constructor(private readonly props: ChatSessionProps) {}

  static create(props: ChatSessionProps): ChatSession {
    return new ChatSession(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string | null {
    return this.props.userId;
  }

  get title(): string | null {
    return this.props.title;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
