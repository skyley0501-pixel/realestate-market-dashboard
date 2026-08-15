export interface MunicipalityOption {
  code: string;
  name: string;
}

// 取引検索フォームの市区町村プルダウン用の軽量なマスタ参照Port。統計データは扱わない。
export interface MunicipalityRepository {
  findByPrefectureCode(prefectureCode: string): Promise<MunicipalityOption[]>;
  // 自然言語検索（Day38）で市区町村名からコードを引くために使用。同名市区町村が複数県にまたがる場合は
  // いずれか1件を返す（自然文には都道府県の言及が無いことが多いため、曖昧さの解消は今回のスコープ外）
  findByName(name: string): Promise<MunicipalityOption | null>;
}
