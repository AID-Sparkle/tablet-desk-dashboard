# 自作スマートダッシュボード 設定・運用完全ガイド

Xiaomi Pad 5（11インチ）常設用スマートコンソールWebアプリケーションの環境設定ガイドです。
各種APIキーを手動で設定する際の手順をまとめています。

---

## 1. 設定ファイル一覧

すべての設定値・APIキーはプロジェクト直下の [`.env.local`](file:///c:/school/tablet-desk-dashboard/.env.local) で管理します。
（見本テンプレート: [`.env.example`](file:///c:/school/tablet-desk-dashboard/.env.example)）

```bash
# 設定を編集後、以下のコマンドでWebアプリを起動します
npm run dev
# ブラウザで http://localhost:3000 にアクセス
```

---

## 2. 各種APIキーと設定手順

### ① 天気予報 (Open-Meteo) 【設定済み・APIキー不要】
- **状態:** **設定済み（栃木県宇都宮市）**
- **必要なAPIキー:** **不要**（完全無料で利用可能）
- **変更したい場合:**
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

### ③ SwitchBot API（給電制御 / プラグミニ連動） 【給電自動化時のみ】

Xiaomi Pad 5のバッテリー寿命保護のため、20%〜80%ヒステリシス充電を行う場合に使用します（未使用時は空欄のままで動作します）。

#### 取得手順:
1. スマートフォンの **SwitchBotアプリ** を開く。
2. **「プロフィール」>「設定」>「アプリバージョン」を10回連続タップ**（開発者オプションが有効化）。
3. 現れた **「開発者向けオプション」** を開く。
4. **トークン (token)** と **クライアントシークレット (secret)** をコピー。
5. プラグミニの「デバイス設定」>「デバイス情報」から **デバイスID (deviceId)** を確認。
6. `.env.local` に入力：
   ```env
   SWITCHBOT_TOKEN="取得したトークン"
   SWITCHBOT_SECRET="取得したシークレット"
   SWITCHBOT_DEVICE_ID="プラグミニのデバイスID"
   INTERNAL_SWITCHBOT_KEY="任意の推測されにくいパスワード（例: secret_desk_key_2026）"
   ```

#### タブレット（MacroDroid）側での給電ルール設定:
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

## 3. 画面モード・機能

1. **State A (統合ダッシュボード)**:
   - 巨大デジタル時計（オフライン時もローカルJSで正確に秒を刻みます）
   - 宇都宮のリアルタイム天気、体感温度、降水確率、湿度、時間別気温
   - Spotifyミニプレイヤー
   - 最新ニュース・トピックス（ITmedia、GIZMODO、4Gamer、Google News）
2. **State B (Spotify フルフォーカス)**:
   - 巨大アルバムアートワークとアンビエントグラデーション
   - 楽曲情報、イコライザー波形、シークバー、再生操作
   - 音楽再生開始時に自動でこの画面に割り込み遷移します。
3. **State C (ニュース フルフォーカス)**:
   - マルチカラムのグリッドで最新記事を快適に閲覧。
   - 「Tech」「Gadget」「Game」などのカテゴリ切り替え。
4. **焼き付き防止 (Anti-BurnIn Pixel Shifter)**:
   - 30秒の画面ローテーション毎に、固定要素を微小移動（±12px）させ、OLED/LCDの焼き付きを防止。
