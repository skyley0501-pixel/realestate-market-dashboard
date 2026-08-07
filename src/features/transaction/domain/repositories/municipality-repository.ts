export interface MunicipalityOption {
  code: string;
  name: string;
}

// 取引検索フォームの市区町村プルダウン用の軽量なマスタ参照Port。統計データは扱わない。
export interface MunicipalityRepository {
  findByPrefectureCode(prefectureCode: string): Promise<MunicipalityOption[]>;
}
