/**
 * ポップアップスクリプト
 * 拡張機能のON/OFFと為替レート表示
 */

import type { CurrencyCode, CachedRates, ExtensionSettings } from '../types/currency';
import { CURRENCY_NAMES } from '../types/currency';

/** 表示する主要通貨 */
const MAIN_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'CNY', 'KRW', 'AUD'];

/**
 * 金額をフォーマット（日本円）
 */
function formatYen(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * 為替レートを表示
 */
async function loadRates(): Promise<void> {
  const ratesListEl = document.getElementById('ratesList');
  const ratesDateEl = document.getElementById('ratesDate');

  if (!ratesListEl || !ratesDateEl) return;

  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_RATES' });

    if (!response.success) {
      ratesListEl.innerHTML = '<div class="rates-loading">エラーが発生しました</div>';
      return;
    }

    const { rates, date } = response.data as CachedRates;

    // レートリストを生成
    const ratesHtml = MAIN_CURRENCIES
      .filter((code) => rates[code])
      .map((code) => {
        const name = CURRENCY_NAMES[code] || code;
        const rate = rates[code];
        return `
          <div class="rate-item">
            <span class="rate-code">${code}</span>
            <span class="rate-value">${formatYen(rate)}</span>
          </div>
        `;
      })
      .join('');

    ratesListEl.innerHTML = ratesHtml || '<div class="rates-loading">データなし</div>';
    ratesDateEl.textContent = `更新日: ${date}`;
  } catch (err) {
    console.error('[Currency to Yen] レート取得エラー:', err);
    ratesListEl.innerHTML = '<div class="rates-loading">データを取得できませんでした</div>';
  }
}

/**
 * 設定を読み込んでUIに反映
 */
async function loadSettings(): Promise<void> {
  const enableToggle = document.getElementById('enableToggle') as HTMLInputElement;

  if (!enableToggle) return;

  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });

    if (response.success) {
      const settings = response.data as ExtensionSettings;
      enableToggle.checked = settings.enabled;
    }
  } catch (err) {
    console.error('[Currency to Yen] 設定取得エラー:', err);
  }
}

/**
 * 設定を保存
 */
async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  try {
    await chrome.runtime.sendMessage({
      type: 'SET_SETTINGS',
      settings,
    });
  } catch (err) {
    console.error('[Currency to Yen] 設定保存エラー:', err);
  }
}

/**
 * イベントリスナーを設定
 */
function setupEventListeners(): void {
  const enableToggle = document.getElementById('enableToggle') as HTMLInputElement;

  if (enableToggle) {
    enableToggle.addEventListener('change', () => {
      saveSettings({ enabled: enableToggle.checked });
    });
  }
}

/**
 * 初期化
 */
async function initialize(): Promise<void> {
  // 設定を読み込み
  await loadSettings();

  // 為替レートを読み込み
  await loadRates();

  // イベントリスナーを設定
  setupEventListeners();
}

// DOMContentLoaded で初期化
document.addEventListener('DOMContentLoaded', initialize);
