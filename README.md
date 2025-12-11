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

## インストール方法

1. このリポジトリをクローンまたはダウンロード

   ```bash
   git clone https://github.com/sayasaya8039/Currency_to_Yen.git
   ```

2. Chromeで `chrome://extensions/` を開く

3. 「デベロッパーモード」をON

4. 「パッケージ化されていない拡張機能を読み込む」をクリック

5. ダウンロードした `Currency_to_Yen` フォルダを選択

## 使い方

1. 拡張機能をインストール後、任意のWebページを開く
2. 通貨テキスト（$100、€50等）にマウスカーソルを合わせる
3. 日本円に変換されたツールチップが表示される

### ポップアップ設定

拡張機能アイコンをクリックすると設定画面が開きます：

- **ON/OFF切り替え**: 拡張機能の有効/無効を切り替え

## プロジェクト構成

```text
Currency_to_Yen/
├── manifest.json          # Chrome拡張マニフェスト (Manifest V3)
├── assets/                # アイコン画像
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   ├── icon-128.png
│   └── icon.svg
├── background/
│   └── service-worker.js  # API通信、キャッシュ管理
├── content/
│   ├── index.js           # コンテンツスクリプト
│   └── styles.css         # ツールチップスタイル
├── popup/
│   ├── popup.html         # ポップアップUI
│   ├── popup.js           # ポップアップロジック
│   └── popup.css          # ポップアップスタイル
└── README.md
```

## 対応通貨一覧

| 通貨コード | 通貨名 | シンボル |
|-----------|--------|----------|
| USD | 米ドル | $ |
| EUR | ユーロ | € |
| GBP | 英ポンド | £ |
| CNY | 中国元 | ¥ |
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

## 技術仕様

| 項目 | 内容 |
|------|------|
| マニフェスト | Manifest V3 |
| 為替API | [Frankfurter API](https://frankfurter.dev/) |
| キャッシュ | 1時間 |

## ライセンス

MIT License

## 謝辞

- 為替レートデータ: [Frankfurter API](https://frankfurter.dev/)
