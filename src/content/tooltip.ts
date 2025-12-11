/**
 * ツールチップ表示コンポーネント
 * 通貨変換結果を可愛らしいポップアップで表示
 */

import type { CurrencyCode, DetectedCurrency } from '../types/currency';
import { CURRENCY_NAMES } from '../types/currency';

/** ツールチップのID */
const TOOLTIP_ID = 'currency-to-yen-tooltip';

/** ツールチップ要素 */
let tooltipElement: HTMLElement | null = null;

/** 現在のツールチップ表示タイマー */
let showTimer: number | null = null;

/** 現在のツールチップ非表示タイマー */
let hideTimer: number | null = null;

/**
 * ツールチップ要素を作成
 */
function createTooltipElement(): HTMLElement {
  const tooltip = document.createElement('div');
  tooltip.id = TOOLTIP_ID;
  tooltip.className = 'cty-tooltip';
  tooltip.innerHTML = `
    <div class="cty-tooltip-arrow"></div>
    <div class="cty-tooltip-content">
      <div class="cty-tooltip-header">
        <span class="cty-currency-icon">💴</span>
        <span class="cty-original"></span>
      </div>
      <div class="cty-tooltip-body">
        <span class="cty-converted"></span>
      </div>
      <div class="cty-tooltip-footer">
        <span class="cty-rate-info"></span>
      </div>
    </div>
  `;
  tooltip.style.display = 'none';
  document.body.appendChild(tooltip);
  return tooltip;
}

/**
 * ツールチップ要素を取得（なければ作成）
 */
function getTooltipElement(): HTMLElement {
  if (!tooltipElement || !document.body.contains(tooltipElement)) {
    tooltipElement = createTooltipElement();
  }
  return tooltipElement;
}

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
 * 為替レートをフォーマット
 */
function formatRate(rate: number, code: CurrencyCode): string {
  const name = CURRENCY_NAMES[code] || code;
  return `1 ${code}（${name}）= ${formatYen(rate)}`;
}

/**
 * ツールチップを表示
 */
export async function showTooltip(
  currency: DetectedCurrency,
  x: number,
  y: number
): Promise<void> {
  // 既存のタイマーをクリア
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  // 遅延表示（200ms）
  showTimer = window.setTimeout(async () => {
    try {
      // Service Worker に変換リクエスト
      let response;
      try {
        response = await chrome.runtime.sendMessage({
          type: 'CONVERT_TO_YEN',
          amount: currency.amount,
          currency: currency.code,
        });
      } catch {
        return;
      }

      if (!response || !response.success) {
        return;
      }

      const { yen, rate, date } = response.data;

      // ツールチップ要素を取得
      const tooltip = getTooltipElement();

      // コンテンツを更新
      const originalEl = tooltip.querySelector('.cty-original');
      const convertedEl = tooltip.querySelector('.cty-converted');
      const rateInfoEl = tooltip.querySelector('.cty-rate-info');

      if (originalEl) {
        originalEl.textContent = currency.originalText;
      }
      if (convertedEl) {
        convertedEl.textContent = formatYen(yen);
      }
      if (rateInfoEl) {
        rateInfoEl.textContent = `${formatRate(rate, currency.code)}（${date}）`;
      }

      // 位置を計算
      positionTooltip(tooltip, x, y);

      // 表示
      tooltip.style.display = 'block';
      tooltip.classList.add('cty-tooltip-visible');
    } catch {
      // エラー時は何もしない
    }
  }, 200);
}

/**
 * ツールチップの位置を計算
 */
function positionTooltip(tooltip: HTMLElement, x: number, y: number): void {
  const padding = 10;
  const arrowSize = 8;

  // 一時的に表示して寸法を取得
  tooltip.style.visibility = 'hidden';
  tooltip.style.display = 'block';

  const rect = tooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // デフォルトはカーソルの上に表示
  let left = x - rect.width / 2;
  let top = y - rect.height - arrowSize - padding;
  let arrowPosition: 'bottom' | 'top' = 'bottom';

  // 画面上部に収まらない場合は下に表示
  if (top < padding) {
    top = y + arrowSize + padding;
    arrowPosition = 'top';
  }

  // 左端の調整
  if (left < padding) {
    left = padding;
  }

  // 右端の調整
  if (left + rect.width > viewportWidth - padding) {
    left = viewportWidth - rect.width - padding;
  }

  // 下端の調整
  if (top + rect.height > viewportHeight - padding) {
    top = viewportHeight - rect.height - padding;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  tooltip.style.visibility = 'visible';

  // 矢印の位置を更新
  const arrow = tooltip.querySelector('.cty-tooltip-arrow') as HTMLElement;
  if (arrow) {
    arrow.classList.remove('cty-arrow-top', 'cty-arrow-bottom');
    arrow.classList.add(`cty-arrow-${arrowPosition}`);

    // 矢印の水平位置を調整
    const arrowLeft = Math.max(20, Math.min(x - left, rect.width - 20));
    arrow.style.left = `${arrowLeft}px`;
  }
}

/**
 * ツールチップを非表示
 */
export function hideTooltip(): void {
  // 既存のタイマーをクリア
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }

  // 遅延非表示（100ms）
  hideTimer = window.setTimeout(() => {
    const tooltip = document.getElementById(TOOLTIP_ID);
    if (tooltip) {
      tooltip.classList.remove('cty-tooltip-visible');
      tooltip.style.display = 'none';
    }
    hideTimer = null;
  }, 100);
}

/**
 * ツールチップの非表示をキャンセル
 */
export function cancelHideTooltip(): void {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

/**
 * ツールチップ要素を削除（クリーンアップ用）
 */
export function destroyTooltip(): void {
  if (tooltipElement) {
    tooltipElement.remove();
    tooltipElement = null;
  }
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}
