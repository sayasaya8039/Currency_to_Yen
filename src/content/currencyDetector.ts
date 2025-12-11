/**
 * 通貨検出ロジック
 * テキスト内の通貨パターンを検出し、DetectedCurrency オブジェクトを返す
 */

import type { CurrencyCode, DetectedCurrency } from '../types/currency';

/** 通貨シンボルから通貨コードへのマッピング */
const SYMBOL_TO_CODE: Record<string, CurrencyCode> = {
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '₩': 'KRW',
  'US$': 'USD',
  'HK$': 'HKD',
  'AU$': 'AUD',
  'A$': 'AUD',
  'CA$': 'CAD',
  'C$': 'CAD',
  'SG$': 'SGD',
  'S$': 'SGD',
  'NT$': 'TWD',
  '฿': 'THB',
  '₹': 'INR',
  '₱': 'PHP',
  'RM': 'MYR',
  'CHF': 'CHF',
};

/** 最大金額（10億）- これを超える金額は無視 */
const MAX_AMOUNT = 1_000_000_000;

/**
 * 数値文字列をパースして数値に変換
 * カンマ区切り、ピリオド区切りに対応
 */
function parseAmount(amountStr: string): number {
  // 空白を削除
  let cleaned = amountStr.trim();

  // カンマを削除（桁区切り）
  cleaned = cleaned.replace(/,/g, '');

  // 数値に変換
  const amount = parseFloat(cleaned);

  // 異常な金額は除外
  if (isNaN(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return 0;
  }

  return amount;
}

/**
 * 通貨検出用の正規表現パターン
 * 注: 数字は最大12桁まで（兆単位）に制限
 */
const CURRENCY_PATTERNS: Array<{
  pattern: RegExp;
  getCode: (match: RegExpMatchArray) => CurrencyCode | null;
  getAmount: (match: RegExpMatchArray) => number;
}> = [
  // US$100, HK$100, AU$100, CA$100, SG$100, NT$100, A$100, C$100, S$100
  {
    pattern: /(?:US|HK|AU|CA|SG|NT|A|C|S)\$\s*([\d,]{1,15}(?:\.\d{1,2})?)\b/gi,
    getCode: (match) => {
      const prefix = match[0].match(/^(US|HK|AU|CA|SG|NT|A|C|S)\$/i)?.[1]?.toUpperCase();
      const mapping: Record<string, CurrencyCode> = {
        US: 'USD', HK: 'HKD', AU: 'AUD', A: 'AUD',
        CA: 'CAD', C: 'CAD', SG: 'SGD', S: 'SGD', NT: 'TWD',
      };
      return mapping[prefix || ''] || null;
    },
    getAmount: (match) => parseAmount(match[1]),
  },

  // $100, €100, £100, ₩100（数字は最大12桁）
  {
    pattern: /([$€£₩₹₱฿])\s*([\d,]{1,15}(?:\.\d{1,2})?)\b/g,
    getCode: (match) => SYMBOL_TO_CODE[match[1]] || null,
    getAmount: (match) => parseAmount(match[2]),
  },

  // 100 USD, 100 EUR, 100 GBP など（通貨コード後置）
  {
    pattern: /\b([\d,]{1,15}(?:\.\d{1,2})?)\s*(USD|EUR|GBP|CNY|KRW|AUD|CAD|CHF|HKD|SGD|TWD|THB|INR|PHP|MYR)\b/gi,
    getCode: (match) => match[2].toUpperCase() as CurrencyCode,
    getAmount: (match) => parseAmount(match[1]),
  },

  // USD 100, EUR 100 など（通貨コード前置）
  {
    pattern: /\b(USD|EUR|GBP|CNY|KRW|AUD|CAD|CHF|HKD|SGD|TWD|THB|INR|PHP|MYR)\s*([\d,]{1,15}(?:\.\d{1,2})?)\b/gi,
    getCode: (match) => match[1].toUpperCase() as CurrencyCode,
    getAmount: (match) => parseAmount(match[2]),
  },

  // RM100（マレーシアリンギット）
  {
    pattern: /RM\s*([\d,]{1,15}(?:\.\d{1,2})?)\b/gi,
    getCode: () => 'MYR',
    getAmount: (match) => parseAmount(match[1]),
  },

  // CHF 100, 100 CHF（スイスフラン - 特別対応）
  {
    pattern: /CHF\s*([\d,]{1,15}(?:\.\d{1,2})?)\b/gi,
    getCode: () => 'CHF',
    getAmount: (match) => parseAmount(match[1]),
  },
];

/**
 * テキストから通貨を検出
 */
export function detectCurrencies(text: string): DetectedCurrency[] {
  const results: DetectedCurrency[] = [];
  const foundRanges: Array<{ start: number; end: number }> = [];

  // 各パターンでマッチングを実行
  for (const { pattern, getCode, getAmount } of CURRENCY_PATTERNS) {
    // パターンをリセット
    pattern.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const code = getCode(match);
      const amount = getAmount(match);

      if (!code || amount <= 0) continue;

      // 日本円は除外
      if (code === 'JPY') continue;

      const startIndex = match.index;
      const endIndex = match.index + match[0].length;

      // 既に検出された範囲と重複していないか確認
      const isOverlapping = foundRanges.some(
        (range) =>
          (startIndex >= range.start && startIndex < range.end) ||
          (endIndex > range.start && endIndex <= range.end) ||
          (startIndex <= range.start && endIndex >= range.end)
      );

      if (!isOverlapping) {
        results.push({
          code,
          amount,
          originalText: match[0],
          startIndex,
          endIndex,
        });
        foundRanges.push({ start: startIndex, end: endIndex });
      }
    }
  }

  // 開始位置でソート
  return results.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * カーソル位置のテキストから通貨を検出
 * caretRangeFromPoint を使用して、カーソルが実際に通貨テキスト上にある場合のみ検出
 */
export function detectCurrencyAtPoint(
  element: Element,
  x: number,
  y: number
): DetectedCurrency | null {
  // 方法1: caretRangeFromPoint を使用して精密に検出
  const rangeResult = detectFromCaretRange(x, y);
  if (rangeResult) return rangeResult;

  // 方法2: React/Shadow DOM対応 - ターゲット要素から検出
  const elementResult = detectFromTargetElement(element, x, y);
  if (elementResult) return elementResult;

  // 方法3: 親要素を辿って検出（X/Twitter対応）
  const parentResult = detectFromParentElements(element, x, y);
  if (parentResult) return parentResult;

  return null;
}

/**
 * 親要素を辿って通貨を検出（X/Twitter、Grok対応）
 */
function detectFromParentElements(
  element: Element,
  x: number,
  y: number
): DetectedCurrency | null {
  let current: Element | null = element.parentElement;
  let depth = 0;
  const maxDepth = 15; // 深いネストに対応

  while (current && depth < maxDepth) {
    // body, html は除外
    const tagName = current.tagName?.toLowerCase();
    if (['body', 'html', 'head'].includes(tagName)) {
      break;
    }

    // number-flow-react などのカスタム要素を優先的に検出
    if (tagName.includes('-')) {
      const result = detectFromTargetElement(current, x, y);
      if (result) return result;
    }

    const result = detectFromTargetElement(current, x, y);
    if (result) return result;

    current = current.parentElement;
    depth++;
  }

  return null;
}

/**
 * ターゲット要素から通貨を検出（Reactアプリ対応）
 * 要素のバウンディングボックス内にカーソルがあり、かつ短いテキストの場合のみ検出
 */
function detectFromTargetElement(
  element: Element,
  x: number,
  y: number
): DetectedCurrency | null {
  // 入力要素やスクリプトは除外
  const tagName = element.tagName?.toLowerCase();
  if (['script', 'style', 'input', 'textarea', 'select', 'body', 'html', 'head'].includes(tagName)) {
    return null;
  }

  // カスタムWeb Component（number-flow-react等）の特別処理
  const isCustomElement = tagName.includes('-') || tagName === 'number-flow-react';

  // 要素のテキストを取得
  let text = element.textContent?.trim() || '';

  // カスタム要素の場合、innerTextも試す
  if (!text && isCustomElement) {
    text = (element as HTMLElement).innerText?.trim() || '';
  }

  // aria-label属性から通貨テキストを取得（number-flow-react等で使用）
  if (!text || text.length < 2) {
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      text = ariaLabel.trim();
    }
  }

  // title属性から通貨テキストを取得（ツールチップとして使用される場合）
  if (!text || text.length < 2) {
    const title = element.getAttribute('title');
    if (title) {
      text = title.trim();
    }
  }

  // data-value, data-amount属性から通貨テキストを取得（Reactアプリで使用）
  if (!text || text.length < 2) {
    const dataValue = element.getAttribute('data-value') ||
                      element.getAttribute('data-amount') ||
                      element.getAttribute('data-price');
    if (dataValue) {
      text = dataValue.trim();
    }
  }

  // テキストが短い場合のみ検出
  // カスタム要素は100文字まで許可（複数の子要素を含む場合がある）
  const maxLength = isCustomElement ? 100 : 50;
  if (text.length < 1 || text.length > maxLength) {
    return null;
  }

  // 要素のバウンディングボックスを確認
  const rect = element.getBoundingClientRect();
  const padding = 5;

  // 要素が大きすぎる場合はスキップ（誤検出防止）
  // 通貨テキストを含む要素は通常小さい
  const maxWidth = isCustomElement ? 200 : 150;
  const maxHeight = 60;
  if (rect.width > maxWidth || rect.height > maxHeight) {
    return null;
  }

  const isInBounds =
    x >= rect.left - padding &&
    x <= rect.right + padding &&
    y >= rect.top - padding &&
    y <= rect.bottom + padding;

  if (!isInBounds) {
    return null;
  }

  // 通貨を検出
  const currencies = detectCurrencies(text);

  return currencies.length > 0 ? currencies[0] : null;
}

/**
 * caretRangeFromPoint を使用して検出
 * カーソルが通貨テキストのバウンディングボックス内にあるかも確認
 */
function detectFromCaretRange(x: number, y: number): DetectedCurrency | null {
  try {
    const range = document.caretRangeFromPoint(x, y);
    if (!range) return null;

    const textNode = range.startContainer;
    if (textNode.nodeType !== Node.TEXT_NODE) return null;

    const text = textNode.textContent || '';
    const offset = range.startOffset;

    // カーソル周辺のテキストを取得（前後50文字）
    const start = Math.max(0, offset - 50);
    const end = Math.min(text.length, offset + 50);
    const surroundingText = text.substring(start, end);

    const currencies = detectCurrencies(surroundingText);
    const relativeOffset = offset - start;

    for (const currency of currencies) {
      if (relativeOffset >= currency.startIndex && relativeOffset <= currency.endIndex) {
        // 通貨テキストのバウンディングボックスを取得して、カーソルが実際にその上にあるか確認
        const actualStart = currency.startIndex + start;
        const actualEnd = currency.endIndex + start;

        if (isPointInTextRange(textNode, actualStart, actualEnd, x, y)) {
          return {
            ...currency,
            startIndex: actualStart,
            endIndex: actualEnd,
          };
        }
      }
    }
  } catch {
    // caretRangeFromPoint がサポートされていない場合
  }

  return null;
}

/**
 * 指定した座標がテキスト範囲のバウンディングボックス内にあるかチェック
 */
function isPointInTextRange(
  textNode: Node,
  startOffset: number,
  endOffset: number,
  x: number,
  y: number
): boolean {
  try {
    const range = document.createRange();
    range.setStart(textNode, startOffset);
    range.setEnd(textNode, endOffset);

    const rect = range.getBoundingClientRect();

    // 少し余裕を持たせる（5px）
    const padding = 5;

    return (
      x >= rect.left - padding &&
      x <= rect.right + padding &&
      y >= rect.top - padding &&
      y <= rect.bottom + padding
    );
  } catch {
    return false;
  }
}

/**
 * 要素内の通貨テキストをスキャン
 */
export function scanElement(element: Element): DetectedCurrency[] {
  const text = element.textContent || '';
  return detectCurrencies(text);
}
