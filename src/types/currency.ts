/**
 * 通貨関連の型定義
 */

/** サポートする通貨コード */
export type CurrencyCode =
  | 'USD' | 'EUR' | 'GBP' | 'CNY' | 'KRW'
  | 'AUD' | 'CAD' | 'CHF' | 'HKD' | 'SGD'
  | 'TWD' | 'THB' | 'INR' | 'PHP' | 'MYR'
  | 'JPY';

/** 通貨シンボル情報 */
export interface CurrencySymbol {
  symbol: string;
  code: CurrencyCode;
  position: 'prefix' | 'suffix';
}

/** 検出された通貨情報 */
export interface DetectedCurrency {
  code: CurrencyCode;
  amount: number;
  originalText: string;
  startIndex: number;
  endIndex: number;
}

/** 為替レートレスポンス */
export interface ExchangeRateResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

/** キャッシュされた為替レート */
export interface CachedRates {
  rates: Record<CurrencyCode, number>;
  date: string;
  fetchedAt: number;
}

/** 拡張機能の設定 */
export interface ExtensionSettings {
  enabled: boolean;
  showOriginalAmount: boolean;
  tooltipDelay: number;
}

/** メッセージタイプ */
export type MessageType =
  | { type: 'GET_EXCHANGE_RATE'; currency: CurrencyCode }
  | { type: 'GET_ALL_RATES' }
  | { type: 'GET_SETTINGS' }
  | { type: 'SET_SETTINGS'; settings: Partial<ExtensionSettings> };

/** メッセージレスポンス */
export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** 通貨シンボルマッピング */
export const CURRENCY_SYMBOLS: CurrencySymbol[] = [
  { symbol: '$', code: 'USD', position: 'prefix' },
  { symbol: '€', code: 'EUR', position: 'prefix' },
  { symbol: '£', code: 'GBP', position: 'prefix' },
  { symbol: '¥', code: 'CNY', position: 'prefix' },
  { symbol: '₩', code: 'KRW', position: 'prefix' },
  { symbol: 'US$', code: 'USD', position: 'prefix' },
  { symbol: 'HK$', code: 'HKD', position: 'prefix' },
  { symbol: 'AU$', code: 'AUD', position: 'prefix' },
  { symbol: 'CA$', code: 'CAD', position: 'prefix' },
  { symbol: 'SG$', code: 'SGD', position: 'prefix' },
  { symbol: 'A$', code: 'AUD', position: 'prefix' },
  { symbol: 'C$', code: 'CAD', position: 'prefix' },
];

/** 通貨コード表示名（日本語） */
export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  USD: '米ドル',
  EUR: 'ユーロ',
  GBP: '英ポンド',
  CNY: '中国元',
  KRW: '韓国ウォン',
  AUD: '豪ドル',
  CAD: 'カナダドル',
  CHF: 'スイスフラン',
  HKD: '香港ドル',
  SGD: 'シンガポールドル',
  TWD: '台湾ドル',
  THB: 'タイバーツ',
  INR: 'インドルピー',
  PHP: 'フィリピンペソ',
  MYR: 'マレーシアリンギット',
  JPY: '日本円',
};

/** デフォルト設定 */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  showOriginalAmount: true,
  tooltipDelay: 200,
};
