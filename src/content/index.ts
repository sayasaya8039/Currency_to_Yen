/**
 * コンテンツスクリプト - エントリーポイント
 * マウスホバーで通貨を検出し、日本円に変換して表示
 */

import './styles.css';
import { detectCurrencyAtPoint } from './currencyDetector';
import { showTooltip, hideTooltip, cancelHideTooltip, destroyTooltip } from './tooltip';
import type { ExtensionSettings } from '../types/currency';

/** 拡張機能の有効/無効状態 */
let isEnabled = true;

/** 最後に検出した通貨情報 */
let lastDetectedCurrency: ReturnType<typeof detectCurrencyAtPoint> = null;

/** マウス移動のデバウンスタイマー */
let mouseMoveTimer: number | null = null;

/** デバウンス間隔（ミリ秒） */
const DEBOUNCE_DELAY = 50;

/**
 * 設定を取得して適用
 */
async function loadSettings(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    if (response.success) {
      const settings = response.data as ExtensionSettings;
      isEnabled = settings.enabled;
      console.log('[Currency to Yen] 設定を読み込みました:', settings);
    }
  } catch (err) {
    console.warn('[Currency to Yen] 設定の読み込みに失敗:', err);
  }
}

/**
 * マウス移動イベントハンドラ
 */
function handleMouseMove(event: MouseEvent): void {
  if (!isEnabled) return;

  // デバウンス処理
  if (mouseMoveTimer) {
    clearTimeout(mouseMoveTimer);
  }

  mouseMoveTimer = window.setTimeout(() => {
    processMousePosition(event);
    mouseMoveTimer = null;
  }, DEBOUNCE_DELAY);
}

/**
 * マウス位置を処理
 */
function processMousePosition(event: MouseEvent): void {
  const target = event.target as Element;

  // 自分自身のツールチップは無視
  if (target.closest('#currency-to-yen-tooltip')) {
    cancelHideTooltip();
    return;
  }

  // カーソル位置から通貨を検出
  const currency = detectCurrencyAtPoint(target, event.clientX, event.clientY);

  if (currency) {
    // 前回と同じ通貨なら何もしない
    if (
      lastDetectedCurrency &&
      lastDetectedCurrency.originalText === currency.originalText &&
      lastDetectedCurrency.startIndex === currency.startIndex
    ) {
      cancelHideTooltip();
      return;
    }

    lastDetectedCurrency = currency;
    showTooltip(currency, event.clientX, event.clientY);
  } else {
    // 通貨がなければツールチップを非表示
    if (lastDetectedCurrency) {
      lastDetectedCurrency = null;
      hideTooltip();
    }
  }
}

/**
 * マウスアウトイベントハンドラ
 */
function handleMouseOut(event: MouseEvent): void {
  // 関連ターゲットがツールチップ内ならキャンセル
  const relatedTarget = event.relatedTarget as Element;
  if (relatedTarget?.closest?.('#currency-to-yen-tooltip')) {
    return;
  }

  // ドキュメント外に出た場合
  if (!relatedTarget || !document.body.contains(relatedTarget)) {
    lastDetectedCurrency = null;
    hideTooltip();
  }
}

/**
 * 設定変更リスナー
 */
function setupSettingsListener(): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.settings) {
      const newSettings = changes.settings.newValue as ExtensionSettings;
      isEnabled = newSettings.enabled;
      console.log('[Currency to Yen] 設定が変更されました:', newSettings);

      if (!isEnabled) {
        hideTooltip();
      }
    }
  });
}

/**
 * イベントリスナーを設定
 */
function setupEventListeners(): void {
  // マウス移動イベント（パッシブモードで軽量化）
  document.addEventListener('mousemove', handleMouseMove, { passive: true });

  // マウスアウトイベント
  document.addEventListener('mouseout', handleMouseOut, { passive: true });

  // スクロール時にツールチップを非表示
  document.addEventListener('scroll', () => {
    lastDetectedCurrency = null;
    hideTooltip();
  }, { passive: true });

  // ページ遷移時のクリーンアップ
  window.addEventListener('beforeunload', () => {
    destroyTooltip();
  });
}

/**
 * 初期化
 */
async function initialize(): Promise<void> {
  // 設定を読み込み（エラーがあっても続行）
  try {
    await loadSettings();
  } catch {
    isEnabled = true; // デフォルトで有効
  }

  // 設定変更リスナーを設定
  try {
    setupSettingsListener();
  } catch {
    // 設定リスナーのエラーは無視
  }

  // イベントリスナーを設定
  setupEventListeners();
}

// 初期化を実行
initialize().catch(() => {
  // エラーがあってもイベントリスナーは設定する
  setupEventListeners();
});
