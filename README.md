# ニコリタイピング

海をテーマにしたブラウザ型タイピング練習サイトです。レベルアップモード（10マップ×各10ワールド）・ノーマルモード（60秒）・エンドレスモード（連続10秒制限）の3モードを搭載し、日本語（ローマ字）／英語の切り替え、ふりがな表示、キーボードガイドに対応しています。

## 公開URL

https://nikorihito.github.io/nikori-typing/

GitHub Pages（`main`ブランチ・リポジトリ直下）で公開しています。**Firebase Hostingは使用していません。**

## 主な機能

- レベルアップモード（10マップ×各10ワールド、飛び級テストあり）
- ノーマルモード／エンドレスモード
- 日本語（ローマ字入力・複数表記対応）／英語の切り替え
- ふりがな表示のON/OFF、キーボードガイドのON/OFF
- スコア／正確率／打鍵数／コンボ
- Firebase Authentication（メールアドレス／パスワード）によるログイン
- Cloud Firestoreへの進捗・プレイ結果の保存、別端末での引き継ぎ
- オフライン時の一時保存と再同期

## ファイル構成

```
index.html              タイピングゲーム本体（旧 typing.html）。認証ガード付き
login.html               ログイン・新規登録・パスワード再設定
firebase-config.js       Firebase App/Authentication/Firestoreの共通初期化（要設定）
firebase-errors.js       Firebase Authenticationのエラーを日本語メッセージへ変換
firestore-service.js     Firestoreの読み書き・localStorage移行・オフラインキュー
nikori-ocean-theme.css   海テーマの共通スタイル（現状は各HTMLに内包、参考用）
typing_words.js          単語データ（参考用、現状は index.html に内包）
romaji_rules.js          ローマ字変換ルール（参考用、現状は index.html に内包）
ニコリヒト.png / つるつる君.png  キャラクター画像
firebase.json             Firestore Rules/Indexesのデプロイ設定（Hosting設定は含みません）
.firebaserc                Firebaseプロジェクトのエイリアス設定
firestore.rules            Firestoreセキュリティルール
firestore.indexes.json     Firestore複合インデックス設定
docs/CURRENT_STATE.md      開発時の現状分析メモ
```

## ローカルでの実行方法

Firebaseを使わない画面確認だけであれば、リポジトリ直下で簡易サーバーを立てて開くだけで動作します。

```
python3 -m http.server 8000
```

`http://localhost:8000/login.html` を開いてください。ただし `firebase-config.js` が未設定（プレースホルダーのまま）だとログイン・データ保存はできません（下記の設定後に動作します）。

## Firebase設定方法

### 1. Webアプリの登録とfirebaseConfigの取得

1. [Firebase Console](https://console.firebase.google.com/project/nikori-typing/settings/general) を開く
2. 「マイアプリ」にウェブアプリが無ければ「アプリを追加」→ウェブ（`</>`）で登録
3. 表示される `firebaseConfig` オブジェクトの値をコピー
4. **`firebase-config.js`** を開き、`firebaseConfig` の値を貼り付ける（`YOUR_API_KEY` などのプレースホルダーを置き換える）

### 2. メール/パスワード認証の有効化

Firebase Console > Authentication > Sign-in method で「メール/パスワード」を有効化してください。

### 3. Cloud Firestoreの作成

Firebase Console > Firestore Database > 「データベースの作成」（本番モード、任意のリージョン）。

### 4. Firestore Security Rulesの反映

このリポジトリの `firestore.rules` をデプロイしてください。

```
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

Firebase CLIを使わない場合は、Console の Firestore > ルール タブへ `firestore.rules` の内容を直接貼り付けても構いません。

### 5. 承認済みドメインの追加

Authentication > Settings > 承認済みドメイン に `nikorihito.github.io` を追加してください（`localhost` は標準で許可されています）。

### 6. インデックス

現状の読み取りクエリ（`progress`/`results`サブコレクションの単純読み取り）では複合インデックスは不要です。今後、並び替えや絞り込みを追加した場合は `firestore.indexes.json` に追記してください。

## GitHub Pagesの公開方法

1. リポジトリの Settings > Pages を開く
2. Source を「Deploy from a branch」、Branch を `main` / `/(root)` に設定
3. `https://nikorihito.github.io/nikori-typing/` でアクセスできることを確認

すべてのCSS・JavaScript・画像パスは `./` から始まる相対パスにしてあるため、サブディレクトリ配信でもそのまま動作します。

## データ構造（Cloud Firestore）

```
users/{uid}
  - uid, displayName, email, avatarEmoji
  - settings: { lang, keyboard, kana }
  - migration: { migratedFromLocalStorage, migratedAt }
  - createdAt, updatedAt, lastLoginAt   … サーバー時刻

users/{uid}/progress/{worldId}          … worldId = "{mapIndex}-{worldIndex}"
  - worldId, mapId, isUnlocked, isCleared
  - bestScore, bestAccuracy, bestKpm, bestWpm
  - attemptCount, clearCount, lastPlayedAt, updatedAt

users/{uid}/results/{resultId}          … 1プレイごとの記録（自動ID、作成のみ・更新削除不可）
  - mode, worldId, score, accuracy
  - correctKeys, mistakeKeys, totalKeys, kpm, wpm, maxCombo, playTime
  - keyMistakes: { "r": 2, "t": 1, ... }
  - startedAt, finishedAt, createdAt
```

同じFirebaseアカウントでログインすれば、別端末・別ブラウザでも同じ進捗が読み込まれます。

## localStorageからの移行仕様

このアプリは以前、進捗をブラウザのlocalStorageのみに保存していました。初回ログイン時に、以下の条件で自動移行します。

- Firestore側にまだ進捗が無い場合のみ、localStorageの記録（`nikoriTypingRecord` / `nikoriTypingLevelRecord` / `nikoriTypingSettings`）をFirestoreへコピーします
- Firestore側に既に進捗がある場合は、自動上書きしません
- 移行が成功すると `users/{uid}.migration.migratedFromLocalStorage` が `true` になり、以後は再実行されません
- 移行に失敗してもlocalStorageのデータは削除されません（バックアップとして残ります）
- 旧ログイン方式（自己申告のアカウントID）はFirebaseログインには使用しません

## 既知の制限

- レベルアップモードのカリキュラム内容（マップ・ワールドの並び）自体の見直しは、このFirebase移行の対象外です
- KPM/WPMなどの詳細な結果分析画面（苦手キー表示・前回比較など）は今後の対応予定です
- Firestoreのセキュリティルールは「本人のuidのみアクセス可」を基本としていますが、講師用の閲覧機能などは未実装です

## 注意事項（個人情報・秘密鍵）

- `firebase-config.js` に書く `firebaseConfig` はクライアント向けの識別情報であり公開されて問題ありませんが、**サービスアカウントJSON・秘密鍵・Admin SDKの認証情報は絶対にこのリポジトリへコミットしないでください**
- メールアドレスは画面上に表示されません（表示にはニックネームを使用します）が、Firestoreの `users/{uid}.email` には保存されます。個人情報の取り扱いにはご注意ください
- 児童が利用することを想定し、パスワードは他サービスと使い回さないようご案内ください
