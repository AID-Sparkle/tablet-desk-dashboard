# 📱 Xiaomi Pad 5 スマートデスクダッシュボード

PCデスクシェルフの中央下に常設するタブレット（Xiaomi Pad 5 / 11インチ推奨）専用の、**iOS風リキッドガラスUI（Liquid Glassmorphism）** を採用した次世代スマートデスクコンソールWebアプリケーションです。

時計・天気・Spotify・ニュース・SwitchBot室内環境およびスマートホーム操作を1画面に美しく統合し、デスクの作業効率とデザイン性を最大限に高めます。

---

## ✨ 主な機能一覧

- **3つの画面モード（State Machine）**
  - **State A (統合ダッシュボード)**: デジタル時計（12h/24h・AM/PM表示）、アナログ時計、Spotifyミニプレイヤー、リアルタイム天気予報（都市名検索対応）、SwitchBot室内温湿度（特大表示）＆スマートデバイス操作、速報ニュース。
  - **State B (Spotify フルフォーカス)**: 特大アートワーク、イコライザーアニメーション、音楽再生コントロール、下部ミニ時計＆天気。
  - **State C (ニュース フルフォーカス)**: 4大メディア（ITmedia、GIZMODO、4Gamer、Google News）の記事一覧、下部ミニ時計＆天気。
- **インテリジェントな自動ローテーション**
  - 設定秒数（5〜300秒）ごとの自動画面切り替え（右下バッジで一時停止/再開可能）。
  - **Spotify未再生時**: Spotifyタブを自動スキップし「メイン ⇄ ニュース」のみ切り替え。
  - **Spotify再生検出時**: 強制割り込みジャンプをせず、設定秒数カウントダウンを維持してスムーズに切り替え。
- **リキッドガラスUI & 自由なカスタマイズ**
  - ガラス透過率スライダー（10%〜95%）、テーマカラー6色、時計表示形式、日/英言語切り替え。
  - **背景・壁紙設定**: アンビエントオーブ、Unsplash日替わり絶景写真、MP4動画ループ壁紙（`public/wallpapers/` からワンクリック選択）、カスタムURL。
- **ハードウェア保護 & スマートホーム連動**
  - **SwitchBot連携**: 室温・湿度のリアルタイム表示と、プラグや照明等のWeb上からのON/OFF操作。
  - **焼き付き防止（Pixel Shifter）**: 画面固定要素を微小移動させ、OLED/液晶を保護。
  - **PC連動（Fully Kiosk Browser）**: PCのログオン/ロック解除・スリープと画面ON/OFFを自動同期。

---

## 🚀 クイックスタート

### 動作環境
- Node.js 18.17.0 以上
- 推奨ブラウザ: Chrome, Edge, Safari, Fully Kiosk Browser（タブレット向け）

### インストールと起動

```bash
# 1. 依存パッケージのインストール (初回のみ)
npm install

# 2. 開発サーバーの起動
npm run dev
```

起動後、タブレットやPCのブラウザから以下を開きます：
- **ローカルアクセス**: [http://localhost:3000](http://localhost:3000)
- **タブレットからのアクセス**: `http://<PCのローカルIPアドレス>:3000`

---

## 📖 使い方ガイド

### 1. 画面の基本操作
| 操作 | 内容 |
| :--- | :--- |
| **画面下部タブのタップ** | 「DASHBOARD」「SPOTIFY」「NEWS」をタップすると、その画面へ即座に手動切り替えします。 |
| **右下の「○s 自動切換」バッジ** | タップすると自動切り替えの **一時停止 / 再開** をトグルできます。長文ニュースをじっくり読みたい時に便利です。 |
| **画面右上の「⚙️」ボタン** | 設定モーダルを開きます。 |
| **ミニプレイヤーのタップ** | 音楽再生中、画面左下のミニプレイヤー（または画面下部の曲情報）をタップすると、Spotify大画面へ直接ジャンプします。 |

### 2. SwitchBot デバイスの操作
メイン画面（State A）中央下の **SwitchBotウィジェット** に、登録されているスマートデバイスが表示されます。
- 右側の **トグルスイッチをタップ** すると、プラグの通電や照明のON/OFF、ボットのスイッチ押しを直接実行できます。
- 操作直後に画面上の状態が即時反映（楽観的UI更新）され、1秒後にデバイスの最新通信状態を取得します。

### 3. お好みの動画壁紙（MP4）を追加する方法
PCで使っている動画（Wallpaper Engine等のMP4ループ動画など）を背景に設定したい場合：
1. プロジェクト内の `public/wallpapers/` フォルダにお好きな `.mp4` 動画（または画像ファイル）を配置します。
2. アプリ右上の「⚙️」設定アイコンを開きます。
3. 「背景・壁紙スタイル」内の「**ローカル動画・壁紙（public/ 内のファイル）**」一覧に、追加したファイルが自動的にサムネイル付きで表示されます。
4. ファイルをクリックするだけで、即座に背景へ適用され、シームレスにループ再生されます。

### 4. 天気予報の地点変更
1. アプリ右上の「⚙️」設定アイコンを開きます。
2. 「天気の地域設定」欄にお住まいの市区町村名（例: `宇都宮`, `横浜`, `大阪`, `札幌` など）を入力します。
3. 「設定」ボタンを押すと、自動的に座標が検索され、現在の天気・週間予報が更新されます。

---

## ⚙️ 外部API連携設定（`.env.local`）

設定ファイル [`.env.local`](.env.local) を編集することで、SpotifyやSwitchBotの高度な機能を利用できます。  
※未設定の場合でも、時計、天気予報、ニュース、Unsplash壁紙、MP4動画壁紙などの主要機能はそのまま動作します。

```env
# ==============================================================================
# 1. Spotify 連携 (再生状況取得 & リモートコントロール)
# ==============================================================================
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REFRESH_TOKEN=your_spotify_refresh_token

# ==============================================================================
# 2. SwitchBot 連携 (室内温湿度計 & デバイス操作 & 給電制御)
# ==============================================================================
SWITCHBOT_TOKEN=your_switchbot_token
SWITCHBOT_SECRET=your_switchbot_secret
# 温湿度計のデバイスID（未設定の場合は登録済みデバイスから温湿度計を自動検出します）
SWITCHBOT_METER_DEVICE_ID=
# 給電用スマートプラグのデバイスID (自動充電制御を行う場合)
SWITCHBOT_DEVICE_ID=

# ==============================================================================
# 3. Fully Kiosk Browser 連携 (PC連動 画面ON/OFF)
# ==============================================================================
FULLY_KIOSK_IP=192.168.1.xxx
FULLY_KIOSK_PASSWORD=your_password
```

### Spotify Refresh Token の簡単取得手順
1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) でアプリを作成し、Redirect URI に `http://127.0.0.1:3000/api/spotify/callback` を登録します。（※Spotifyの仕様上 `localhost` は登録不可のため、必ず `127.0.0.1` を使用してください）
2. Client ID と Client Secret を `.env.local` に記載します。
3. アプリ起動後、ブラウザで [http://127.0.0.1:3000/api/spotify/login](http://127.0.0.1:3000/api/spotify/login) にアクセスしてSpotifyにログインします。
4. 画面上に表示された `SPOTIFY_REFRESH_TOKEN` をコピーして `.env.local` に貼り付け、サーバーを再起動するだけで完了です。

詳細なセットアップガイドは [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md) をご覧ください。

---

## 📂 プロジェクト構成

```text
tablet-desk-dashboard/
├── docs/                   # ドキュメント・詳細セットアップガイド
├── public/                 # 静的アセット（ファビコン、アイコン、動画壁紙など）
│   └── wallpapers/         # ユーザー追加のMP4動画・壁紙格納ディレクトリ
├── scripts/                # PC連動用タスクスケジューラ用スクリプト（PowerShell等）
├── src/
│   ├── app/
│   │   ├── api/            # バックエンドAPIルート
│   │   │   ├── rss/        # ニュースRSS並列取得API
│   │   │   ├── spotify/    # Spotify OAuth・再生中情報・操作API
│   │   │   ├── switchbot/  # SwitchBot温湿度取得・デバイス電源制御API
│   │   │   ├── unsplash-daily/ # Unsplash日替わり写真プロキシAPI
│   │   │   ├── wallpapers/ # public/ 内の動画・壁紙自動スキャンAPI
│   │   │   └── weather/    # Open-Meteo 天気予報＆都市検索API
│   │   ├── layout.tsx      # ルートレイアウト（PWA・フォント設定）
│   │   ├── page.tsx        # メインコントローラー（状態遷移・ローテーション・設定モーダル）
│   │   └── globals.css     # リキッドガラス・アニメーション・テーマ変数
│   ├── components/         # UIコンポーネント
│   │   ├── StateA_Dashboard.tsx   # 統合ダッシュボード（時計・天気・SwitchBot・ニュース）
│   │   ├── StateB_SpotifyFocus.tsx # Spotify大画面フォーカス
│   │   ├── StateC_NewsFocus.tsx    # ニュース大画面フォーカス
│   │   ├── SwitchBotWidget.tsx     # SwitchBot室内温湿度（特大表示）＆デバイス操作
│   │   ├── WeatherWidget.tsx       # 天気予報＆週間予報
│   │   ├── AnalogClock.tsx         # スムーズ秒針アナログ時計
│   │   └── PixelShifter.tsx        # 画面焼き付き防止コンポーネント
│   ├── config/             # 設定値（テーマカラー、壁紙プリセット、ポーリング間隔）
│   └── types/              # TypeScript型定義
└── .env.local              # 環境変数設定ファイル
```

---

## 🛡️ ライセンス & クレジット
- 本プロジェクトは個人利用・研究開発を目的として作成されています。
- 天気データ: [Open-Meteo API](https://open-meteo.com/) (商用・非商用フリー、APIキー不要)
- ニュースデータ: 各社公開RSSフィード（ITmedia, GIZMODO, 4Gamer, Google News）
