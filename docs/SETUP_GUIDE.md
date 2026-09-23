# 自作スマートダッシュボード 設定・運用完全ガイド

Xiaomi Pad 5（11インチ）常設用スマートコンソールWebアプリケーションの環境設定・運用ガイドです。
各種APIキーや連携機能の設定手順、現在のアプリ仕様をまとめています。

---

## 1. 設定ファイル一覧

すべての設定値・APIキーはプロジェクト直下の [`.env.local`](../.env.local) で管理します。  
（見本テンプレート: [`.env.example`](../.env.example)）

```bash
# 設定を編集後、以下のコマンドでWebアプリを起動します
npm run dev
# ブラウザで http://localhost:3000 にアクセス
```

---

## 2. 各種機能と設定手順

### ① 天気予報 (Open-Meteo) 【設定済み・APIキー不要】
- **状態:** **設定済み（デフォルト: 栃木県宇都宮市）**
- **必要なAPIキー:** **不要**（完全無料で利用可能）
- **地点の変更方法（簡単）:**
  - Webアプリ画面右上の **「⚙️（設定）」アイコン** をクリックし、「天気の地域設定」欄にお住まいの都市名（例: `宇都宮`, `横浜`, `大阪`, `福岡` など）を入力して「設定」を押すだけで、即座に天気が切り替わります（ブラウザに自動保存されます）。
- **初期デフォルト値を変更したい場合（`.env.local`）:**
  ```env
  WEATHER_LATITUDE=36.5658
  WEATHER_LONGITUDE=139.8836
  WEATHER_CITY_NAME="宇都宮"
  ```

---

### ② Spotify Web API 連携 【手動設定】

#### 取得手順:
1. **[Spotify Developer Dashboard](https://developer.spotify.com/dashboard)** にアクセスし、Spotifyアカウントでログイン。
2. **「Create app」** をクリック。
   - App name: `Desk Dashboard`（任意）
   - App description: `Xiaomi Pad 5 Console`（任意）
   - Redirect URIs: `http://localhost:3000/api/spotify/callback` を入力して「Add」
     ※Vercel等にデプロイした後は、本番URL（例: `https://your-app.vercel.app/api/spotify/callback`）も追加してください。
   - Which API/SDKs are you planning to use?: **Web API** にチェック
   - 規約に同意して「Save」をクリック。
3. 作成したアプリの **「Settings」** を開く。
4. 画面に表示される **Client ID** と **Client secret** をコピーし、`.env.local` に貼り付けます：
   ```env
   SPOTIFY_CLIENT_ID="取得したClient ID"
   SPOTIFY_CLIENT_SECRET="取得したClient Secret"
   ```

#### Refresh Token の超簡単自動取得:
1. `npm run dev` でアプリを起動。
2. ブラウザで **`http://localhost:3000/api/spotify/login`** にアクセス。
3. Spotifyの同意画面が表示されるので「同意する」をクリック。
4. 自動的に画面に **`SPOTIFY_REFRESH_TOKEN`** が生成・表示され、ワンクリックでコピーできます！
5. コピーした値を `.env.local` の `SPOTIFY_REFRESH_TOKEN` に貼り付けて保存し、サーバーを再起動（`Ctrl + C` のあと `npm run dev`）すれば連携完了です。

---

### ③ SwitchBot API（温湿度計表示 ＆ デバイス操作 ＆ 給電制御）

室内の温度・湿度をリアルタイム表示し、登録デバイス（プラグミニ、ボット、照明等）をWebアプリ上からON/OFF操作できます。また、Xiaomi Pad 5のバッテリー寿命保護のための20%〜80%ヒステリシス充電制御にも対応しています（未使用時は空欄のままで動作します）。

#### 取得手順:
1. スマートフォンの **SwitchBotアプリ** を開く。
2. **「プロフィール」>「設定」>「アプリバージョン」を10回連続タップ**（開発者オプションが有効化）。
3. 現れた **「開発者向けオプション」** を開く。
4. **トークン (token)** と **クライアントシークレット (secret)** をコピー。
5. （任意）特定の温湿度計やプラグミニを指定したい場合、各機器の「デバイス設定」>「デバイス情報」から **デバイスID (deviceId)** を確認。
6. `.env.local` に入力：
   ```env
   SWITCHBOT_TOKEN="取得したトークン"
   SWITCHBOT_SECRET="取得したシークレット"

   # 温湿度計のデバイスID（※未入力の場合はアカウント内の温湿度計を自動検出します）
   SWITCHBOT_METER_DEVICE_ID=""

   # 給電制御用プラグミニのデバイスID（給電自動化を行う場合に入力）
   SWITCHBOT_DEVICE_ID=""
   INTERNAL_SWITCHBOT_KEY="任意の推測されにくいパスワード（例: secret_desk_key_2026）"
   ```

#### タブレット（MacroDroid）側での給電ルール設定（給電自動化時）:
- **トリガー 1:** バッテリー残量 80% 以上
  - **アクション:** HTTPリクエスト（POST）
  - **URL:** `https://[あなたのVercelドメイン]/api/switchbot?state=off`
  - **ヘッダー:** `x-api-key: [INTERNAL_SWITCHBOT_KEYに設定した文字列]`
- **トリガー 2:** バッテリー残量 20% 以下
  - **アクション:** HTTPリクエスト（POST）
  - **URL:** `https://[あなたのVercelドメイン]/api/switchbot?state=on`
  - **ヘッダー:** `x-api-key: [INTERNAL_SWITCHBOT_KEYに設定した文字列]`
- **ポイント:** 21%〜79%の間は何もしない（状態維持）ため、頻繁なON/OFFが発生せずバッテリーを最適保護できます。

---

### ④ PC連動（画面自動ON/OFF） 【Fully Kiosk連動】

Windows PCのログオン/ロック解除時にタブレット画面を点灯し、ロック時に消灯させます。

#### タブレット（Fully Kiosk Browser）の設定:
1. Xiaomi Pad 5に **Fully Kiosk Browser** をインストール。
2. 左メニューから「Settings」を開く。
3. **「Remote Administration」**:
   - `Enable Remote Administration`: **ON**
   - `Remote Admin Password`: パスワードを決めて設定
4. タブレットのWi-FiローカルIPアドレスを確認（例: `192.168.1.50`）。
5. PC側の `.env.local` に入力：
   ```env
   FULLY_KIOSK_IP="192.168.1.50"
   FULLY_KIOSK_PASSWORD="設定したパスワード"
   ```

#### Windowsタスクスケジューラへの自動登録:
プロジェクトフォルダ内の `scripts/setup-windows-task.bat` を右クリックして **「管理者として実行」** するだけで、ログオン時・ロック時の画面制御が自動登録されます。

---

## 3. 画面モード・最新機能の仕様

1. **State A (統合ダッシュボード)**:
   - **上段**: デジタル時計（12h/24h、12h時はAM/PM表記付き）＋スムーズ秒針アナログ時計 ｜ Spotifyミニプレイヤー（操作対応）
   - **下段**: リアルタイム天気＆週間予報 ｜ **SwitchBot室内環境（特大フォントの室温・湿度・快適度）＆デバイス操作カード** ｜ 速報ニュース（スリム・コンパクト化）
2. **State B (Spotify フルフォーカス)**:
   - 特大アルバムアートワーク、アンビエントグラデーション、楽曲情報、イコライザー波形、シークバー、再生操作。
   - 画面下部に邪魔にならないミニ時計＆天気アイコンを常時表示。
3. **State C (ニュース フルフォーカス)**:
   - 4大メディア（ITmedia、GIZMODO、4Gamer、Google News）の記事一覧グリッド表示。
   - 画面下部にミニ時計＆天気アイコンを常時表示。
4. **インテリジェントな自動ローテーション**:
   - 設定秒数（5〜300秒）ごとの自動画面切り替え（右下バッジタップで一時停止/再開可能）。
   - **Spotify未再生時**: Spotifyタブ（State B）を自動スキップし、「メイン（A） ⇄ ニュース（C）」のみが切り替わります。
   - **Spotify再生検出時**: 画面の強制割り込みジャンプは行わず、**設定された秒数カウントダウンを維持して自然に切り替わります**。
5. **リキッドガラスUI & 壁紙カスタマイズ（右上の⚙️設定から）**:
   - ガラス透過率スライダー（10%〜95%）、テーマカラー6色切り替え。
   - 背景モード: アンビエントオーブ、Unsplash日替わり絶景写真、**`public/wallpapers/` 内のMP4ループ動画・壁紙の一覧選択**、カスタムURL。
6. **焼き付き防止 (Anti-BurnIn Pixel Shifter)**:
   - 画面ローテーション毎に、固定要素を微小移動（±12px）させ、OLED/LCDの焼き付きを防止。
