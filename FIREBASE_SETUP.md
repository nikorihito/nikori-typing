# Firebase 設定ガイド

このリポジトリには Firebase 連携用のコード（Authentication / Firestore / Hosting）を
追加済みです。ただし、Firebase Console でのログイン・クリックが必要な手順は
コードだけでは完了できないため、以下を手動で行ってください。

## 1. SDK設定値を取得して貼り付ける

1. https://console.firebase.google.com/project/nikori-typing/settings/general を開く
2. 「マイアプリ」でウェブアプリが無ければ「アプリを追加」→ウェブ（`</>`）を選択して登録
3. 表示される `firebaseConfig` オブジェクトの値をコピー
4. `firebase-config.js` の `window.firebaseConfig` をその値で置き換える（`YOUR_API_KEY` などのプレースホルダーを削除）

## 2. Authentication で匿名ログインを有効化

1. Console左メニュー「Authentication」→「Sign-in method」
2. 「匿名」（Anonymous）プロバイダを有効化して保存

これがOFFのままだと、`firebase.js` は自動的にクラウド同期を無効化し、
アプリはlocalStorageのみで動作します（アプリ自体は壊れません）。

## 3. Firestore Database を作成

1. Console左メニュー「Firestore Database」→「データベースの作成」
2. 本番モード（デフォルトの`firestore.rules`をそのまま使う場合）を選択してリージョンを設定
3. デプロイ済みの `firestore.rules` を反映するには、Firebase CLI で以下を実行：
   ```
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules
   ```

## 4. Hosting へデプロイ（任意）

`firebase.json` / `.firebaserc` を追加済みです。デプロイする場合：

```
firebase login
firebase deploy --only hosting
```

`login.html` をトップページとして配信するよう `firebase.json` の `rewrites` を設定しています。

## 実装済みの内容

- `firebase-config.js` / `firebase.js`: Firebase初期化、匿名認証、Firestore読み書きの共通ヘルパー
- `login.html`: アカウント作成・保存時にプロフィール（名前・アイコン）をFirestoreへアップロード。ログイン時、ローカルに一致するアカウントが無ければFirestoreからIDで検索してログイン（別端末からの復元に対応）
- `typing.html`: 記録・レベル進行・設定を保存するたびにFirestoreへ自動アップロード。設定画面の「クラウドから復元する」ボタンで、他端末に保存したデータを取得して反映
- `firestore.rules`: `accounts/{accountId}` コレクションに対し、Firebase認証済み（匿名可）のみ読み書き可能に制限

## 既知の制約

- ログインはパスワード不要の「IDを知っていればログインできる」設計です（既存のlocalStorage版と同じ思想）。Firestoreのセキュリティルールも「認証済みなら誰でもそのIDのドキュメントを読み書きできる」形になっており、強固な個人認証ではありません。より強い保護が必要な場合は、Firebase Authenticationのメール/パスワードやメールリンク認証への切り替えを検討してください。
