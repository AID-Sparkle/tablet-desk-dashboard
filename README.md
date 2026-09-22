# Xiaomi Pad 5 スマートデスクダッシュボード

PCデスクシェルフ中央下に常設するXiaomi Pad 5（11インチ）専用のスマートコンソールWebアプリケーションです。

## 主な機能

- **State Machine 画面ローテーション**:
  - **State A (統合ダッシュボード)**: 巨大時計、リアルタイム天気、Spotifyミニプレイヤー、速報ニュース
  - **State B (Spotify フルフォーカス)**: 特大アートワーク、イコライザーアニメーション、音楽再生コントロール（曲再生時に自動割り込み）
  - **State C (ニュース フルフォーカス)**: ITmedia, GIZMODO, 4Gamer, Google News のグリッド閲覧 & カテゴリ切り替え
- **焼き付き防止 (Anti-BurnIn Pixel Shifter)**: 30秒毎に固定要素の位置を±12px微小移動
- **オフライン保護 (Offline-Safe Clock)**: ネットワーク断でも秒単位で正確に時刻を刻み続け、オフラインバッジを表示
- **フォールトトレラントRSS取得**: `Promise.allSettled()` による並列取得と画像なし自動フォールバックUI
- **給電自動化 (SwitchBot)**: 20%〜80%ヒステリシス充電プロキシAPI (`/api/switchbot`)
- **PC連動 (画面自動ON/OFF)**: Windowsログオン/ロック解除・ロック時にFully Kiosk BrowserをREST APIで制御

## クイックスタート

```bash
# 依存パッケージのインストール (初回のみ)
npm install

# 開発サーバー起動
npm run dev
```

起動後、ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## APIキー設定について

APIキーの設定方法やトークン取得手順の詳細は以下をご確認ください：
- 設定ファイル: [`.env.local`](.env.local)
- 設定テンプレート: [`.env.example`](.env.example)
- 詳細ガイド: [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md)

※天気予報（Open-Meteo: 宇都宮）は**APIキー不要**で最初から動作します。  
※SpotifyのRefresh Tokenは、アプリ起動後に [`/api/spotify/login`](http://localhost:3000/api/spotify/login) にアクセスするだけで簡単に取得できます。
