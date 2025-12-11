# Currency to Yen

Web上の通貨テキスト（$100、€50等）にマウスカーソルを合わせると、日本円に変換してツールチップで表示するChrome拡張機能です。

## 機能

- **リアルタイム為替レート**: Frankfurter APIを使用して最新のレートを取得（1時間キャッシュ）
- **多通貨対応**: USD、EUR、GBP、CNY、KRW、AUD、CAD、CHF、HKD、SGD、TWD、THB、INR、PHP、MYR
- **様々なフォーマットに対応**:
  - `$100`、`€50`、`£30` - 記号前置
  - `100 USD`、`50 EUR` - コード後置
  - `US$100`、`HK$500` - 国コード付き
  - `$1,000.50` - 桁区切り対応
- **モダンなサイト対応**: X(Twitter)、Grok等のReactアプリやWeb Componentsにも対応
- **可愛らしいUI**: パステル水色系のデザイン、ダークモード対応

## スクリーンショット

通貨テキストにホバーすると、日本円でのツールチップが表示されます。

## インストール方法

### 開発者モードでインストール

1. このリポジトリをクローン

   ```bash
   git clone https://github.com/YOUR_USERNAME/Currency_to_Yen.git
   cd Currency_to_Yen
   ```

2. 依存関係をインストール

   ```bash
   npm install
   ```

3. ビルド

   ```bash
   npm run build
   ```

4. Chromeで `chrome://extensions/` を開く

5. 「デベロッパーモード」をON

6. 「パッケージ化されていない拡張機能を読み込む」をクリック

7. `dist` フォルダを選択

## 使い方

1. 拡張機能をインストール後、任意のWebページを開く
2. 通貨テキスト（$100、€50等）にマウスカーソルを合わせる
3. 日本円に変換されたツールチップが表示される

### ポップアップ設定

拡張機能アイコンをクリックすると設定画面が開きます：

- **ON/OFF切り替え**: 拡張機能の有効/無効を切り替え

## 技術スタック

| 項目 | 選定 |
|------|------|
| 言語 | TypeScript |
| ビルドツール | webpack |
| 為替API | [Frankfurter API](https://frankfurter.dev/) |
| マニフェスト | Manifest V3 |

## プロジェクト構成

```text
Currency_to_Yen/
├── src/
│   ├── manifest.json          # Chrome拡張マニフェスト
│   ├── background/
│   │   └── service-worker.ts  # API通信、キャッシュ管理
│   ├── content/
│   │   ├── index.ts           # エントリーポイント
│   │   ├── currencyDetector.ts # 通貨検出ロジック
│   │   ├── tooltip.ts         # ツールチップ表示
│   │   └── styles.css         # スタイル
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   ├── types/
│   │   └── currency.ts        # 型定義
│   └── assets/                # アイコン
├── dist/                      # ビルド出力
├── package.json
├── tsconfig.json
└── webpack.config.js
```

## 開発コマンド

```bash
# 依存関係のインストール
npm install

# 開発ビルド（ウォッチモード）
npm run dev

# 本番ビルド
npm run build

# 型チェック
npm run type-check
```

## 対応通貨一覧

| 通貨コード | 通貨名 | シンボル |
|-----------|--------|----------|
| USD | 米ドル | $ |
| EUR | ユーロ | € |
| GBP | 英ポンド | £ |
| CNY | 中国元 | - |
| KRW | 韓国ウォン | ₩ |
| AUD | 豪ドル | AU$, A$ |
| CAD | カナダドル | CA$, C$ |
| CHF | スイスフラン | CHF |
| HKD | 香港ドル | HK$ |
| SGD | シンガポールドル | SG$, S$ |
| TWD | 台湾ドル | NT$ |
| THB | タイバーツ | ฿ |
| INR | インドルピー | ₹ |
| PHP | フィリピンペソ | ₱ |
| MYR | マレーシアリンギット | RM |

## ライセンス

MIT License

## 謝辞

- 為替レートデータ: [Frankfurter API](https://frankfurter.dev/)
