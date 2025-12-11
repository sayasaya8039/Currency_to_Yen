/**
 * Service Worker - 為替レートAPI通信とキャッシュ管理
 */

import type {
  CurrencyCode,
  CachedRates,
  ExchangeRateResponse,
  ExtensionSettings,
  MessageResponse,
  DEFAULT_SETTINGS,
} from '../types/currency';

/** Frankfurter API エンドポイント */
const API_BASE = 'https://api.frankfurter.dev/v1';

/** キャッシュ有効期間（1時間） */
const CACHE_DURATION = 60 * 60 * 1000;

/** メモリキャッシュ（Service Worker内） */
let memoryCache: CachedRates | null = null;

/**
 * 為替レートを取得（キャッシュ優先）
 * JPYを基準として他の通貨のレートを取得
 */
async function getExchangeRates(): Promise<CachedRates> {
  // 1. メモリキャッシュ確認
  if (memoryCache && Date.now() - memoryCache.fetchedAt < CACHE_DURATION) {
    console.log('[Currency to Yen] メモリキャッシュから取得');
    return memoryCache;
  }

  // 2. chrome.storage.local からキャッシュ確認
  try {
    const stored = await chrome.storage.local.get('cachedRates');
    if (stored.cachedRates) {
      const cached = stored.cachedRates as CachedRates;
      if (Date.now() - cached.fetchedAt < CACHE_DURATION) {
        console.log('[Currency to Yen] ストレージキャッシュから取得');
        memoryCache = cached;
        return cached;
      }
    }
  } catch (err) {
    console.warn('[Currency to Yen] キャッシュ読み込みエラー:', err);
  }

  // 3. APIから取得
  console.log('[Currency to Yen] APIから為替レートを取得中...');

  const response = await fetch(`${API_BASE}/latest?base=JPY`);

  if (!response.ok) {
    throw new Error(`API エラー: ${response.status} ${response.statusText}`);
  }

  const data: ExchangeRateResponse = await response.json();

  // JPYを基準とした各通貨のレート（1通貨 = X円）を計算
  // Frankfurter APIは 1 JPY = X通貨 の形式で返すので、逆数を取る
  const rates: Record<CurrencyCode, number> = {} as Record<CurrencyCode, number>;

  for (const [code, rate] of Object.entries(data.rates)) {
    // 1通貨 = 何円かを計算
    rates[code as CurrencyCode] = 1 / rate;
  }

  // JPY自身のレートを追加
  rates['JPY' as CurrencyCode] = 1;

  const cachedRates: CachedRates = {
    rates,
    date: data.date,
    fetchedAt: Date.now(),
  };

  // 4. キャッシュに保存
  memoryCache = cachedRates;

  try {
    await chrome.storage.local.set({ cachedRates });
    console.log('[Currency to Yen] キャッシュを保存しました');
  } catch (err) {
    console.warn('[Currency to Yen] キャッシュ保存エラー:', err);
  }

  return cachedRates;
}

/**
 * 通貨を日本円に変換
 */
async function convertToYen(
  amount: number,
  fromCurrency: CurrencyCode
): Promise<{ yen: number; rate: number; date: string }> {
  const { rates, date } = await getExchangeRates();

  const rate = rates[fromCurrency];
  if (!rate) {
    throw new Error(`未対応の通貨: ${fromCurrency}`);
  }

  const yen = amount * rate;

  return { yen, rate, date };
}

/**
 * 設定を取得
 */
async function getSettings(): Promise<ExtensionSettings> {
  const DEFAULT_SETTINGS: ExtensionSettings = {
    enabled: true,
    showOriginalAmount: true,
    tooltipDelay: 200,
  };

  try {
    const stored = await chrome.storage.sync.get('settings');
    return { ...DEFAULT_SETTINGS, ...stored.settings };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * 設定を保存
 */
async function setSettings(
  settings: Partial<ExtensionSettings>
): Promise<ExtensionSettings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };

  await chrome.storage.sync.set({ settings: updated });

  return updated;
}

// メッセージリスナー
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handleMessage = async (): Promise<MessageResponse> => {
    try {
      switch (message.type) {
        case 'CONVERT_TO_YEN': {
          const { amount, currency } = message;
          const result = await convertToYen(amount, currency);
          return { success: true, data: result };
        }

        case 'GET_ALL_RATES': {
          const rates = await getExchangeRates();
          return { success: true, data: rates };
        }

        case 'GET_SETTINGS': {
          const settings = await getSettings();
          return { success: true, data: settings };
        }

        case 'SET_SETTINGS': {
          const settings = await setSettings(message.settings);
          return { success: true, data: settings };
        }

        default:
          return { success: false, error: '不明なメッセージタイプ' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : '不明なエラー';
      console.error('[Currency to Yen] エラー:', error);
      return { success: false, error };
    }
  };

  handleMessage().then(sendResponse);
  return true; // 非同期レスポンスを示す
});

// 拡張機能インストール時の初期化
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Currency to Yen] 拡張機能がインストールされました:', details.reason);

  // 初回インストール時に為替レートを事前取得
  if (details.reason === 'install') {
    try {
      await getExchangeRates();
      console.log('[Currency to Yen] 初期為替レートを取得しました');
    } catch (err) {
      console.warn('[Currency to Yen] 初期為替レート取得に失敗:', err);
    }
  }
});

console.log('[Currency to Yen] Service Worker が起動しました');
