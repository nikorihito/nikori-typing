# Firebase 導入手順（本番環境は未接続）

ニコリタイピングは現在 `localStorage` にアカウント・ゲーム記録を保存しています。このPRでは設定手順と安全側のFirestoreルールだけを準備します。既存の画面・データ保存処理は変更しません。

## 管理者による初期設定

1. https://console.firebase.google.com/ で新規プロジェクトを作成する（候補表示名: `nikori-typing`）。
2. Google Analyticsは初期段階で不要。Sparkプランで開始し、課金の有効化はしない。
3. Webアプリ `nikori-typing-web` を登録する。GitHub Pagesを継続するためFirebase Hostingは不要。
4. Authentication → Sign-in methodでメール/パスワードを有効にする。Google認証などは現段階では有効化しない。
5. Authentication → Settings → Authorized domainsで公開ドメイン `nikorihito.github.io` を確認する（不要なドメインは追加しない）。
6. Cloud Firestoreを作成する。**テストモードで公開しない**。ルールタブでリポジトリの `firestore.rules` を貼り付けて公開する。ルールが適用されていることを確認するまでWebからの書き込みを実装しない。
7. プロジェクト設定からWebアプリ用 `firebaseConfig` を取得する。これはクライアント用識別設定で秘密鍵ではないが、サービスアカウントのJSON、管理APIキー、パスワード等は絶対にコミットしない。

## 連携実装時の守るべき仕様

- Firebase Authenticationの `uid` をFirestoreの `users/{uid}` パスに用い、任意のニックネームや見た目のIDを認可に使わない。
- 子どもの実名・生年月日・学校名を必須項目にしない。未成年者のメールアカウントと保護者同意の要件を公開前に確認する。
- ローカル進捗 `typingAcademiaRecord`、`nikoriTypingLevelRecord` 等は移行成功の検証まで削除しない。移行はユーザーの明示操作で一度だけ行い、既存クラウドデータの上書きを防ぐ。
- 現行 `typingAcademiaAccount` の「IDが一致するだけのログイン」は真正な本人認証ではない。Firebase連携後はサーバー認証状態によってログインを判定する。
- Cloud Firestoreのルールは後から公開ランキング・運営機能等を追加するまで全体拒否を基本とする。開発中はエミュレーターで他人のデータを閲覧・更新できないテストを行う。
- Firebaseに接続できない場合も、既存のゲスト練習を維持する。ただし同期成功と誤表示しない。
- スコアやコインを競争・報酬に利用する場合は、クライアントの自己申告値を不正防止済みと扱わない。

## 次の作業

Firebaseプロジェクト作成後、Webアプリの設定オブジェクト（秘密鍵は不要）を用いてFirebase SDK導入・ログイン画面変更・Firestore保存・移行テストを別PRで実施する。
