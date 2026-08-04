# 現状分析メモ（フェーズ1）

「プログラミング教室で継続利用できるタイピング教材」への改修に向けた、現状調査の記録です。
フェーズ2以降の設計判断の根拠として残します。詳細な改修計画は各フェーズ実施時のPRで更新します。

> **更新（index.html化 + Firebase本実装）**：本メモ作成後に、`typing.html`は`index.html`へ正式移行し、
> Firebase Authentication（メール/パスワード）とCloud Firestore（`users/{uid}`構造）による認証ガード・
> 進捗同期・localStorage移行・オフライン一時保存・セキュリティルールを実装しました。旧`typing.html`
> という記述は`index.html`と読み替えてください。PR #1の匿名認証実装は置き換え済みです。
> カリキュラム自体の再構成（フェーズ2の内容）は引き続き未着手です。詳細は `README.md` を参照してください。

## 1. ファイル構成

```
nikori-typing/
├── login.html                 # ログイン画面（単一ファイル、CSS/JS埋め込み）
├── typing.html                 # メイン教材（単一ファイル、約3300行、CSS/JS埋め込み）
├── typing_words.js             # ⚠️ 未使用の孤立ファイル（後述）
├── romaji_rules.js             # ⚠️ 未使用の孤立ファイル（後述）
├── nikori-ocean-theme.css      # ⚠️ 未使用の孤立ファイル（後述）
├── ニコリヒト.png / つるつる君.png   # キャラクター画像（使用中）
├── firebase-config.js / firebase.js          # 匿名認証+Firestore簡易同期（PR #1、要作り直し）
├── firebase.json / .firebaserc / firestore.rules / firestore.indexes.json  # 同上
└── FIREBASE_SETUP.md
```

**旧サイトからの移行状況**：旧リポジトリ `nikorihito/koppyhtmls` の `typing/` フォルダ（削除前の最終コミット
`b0c94fc`）と現行ファイルを diff した結果、`typing.html` / `login.html` / `typing_words.js` /
`romaji_rules.js` / `nikori-ocean-theme.css` / 画像2点はすべて **完全一致**でした。移行済みで追加作業は不要です。

**未使用ファイルについて**：`typing_words.js`・`romaji_rules.js`・`nikori-ocean-theme.css` は
`login.html` / `typing.html` のどちらからも `<script>` / `<link>` で読み込まれていません
（参照ゼロを grep で確認）。`typing.html` は同じ内容（ローマ字変換テーブル `ROMA_SINGLE` /
`ROMA_DIGRAPH`、単語データ `NORMAL_WORDS`、レベルアップ用の `LEVEL_MAPS`）を**内部に丸ごと
再定義**しており、外部ファイル3点は死んでいます。フェーズ4のコード整理で、これらを実データとして
活用し重複を解消する方針です。

## 2. 現在の機能

- **3モード**：レベルアップ／ノーマル（60秒）／エンドレス（10秒制限×連続）
- **レベルアップモード**：10マップ×各10ワールド固定構成
  （ホームポジション→上段→下段→大文字/Shift→短語→記号→速度→長文→正確性→総仕上げ）。
  各ワールドは `targets`（4〜6個の文字列）を最低12回まで水増し反復するだけの出題
  （`buildWorldWords()`、`typing.html:2086`）。合格条件は `正解数>=8 && 正確率>=80%` の一律固定
  （`resolveLevelSuccess()`、`typing.html:2378`）。時間制限なし。上位マップは「飛び級テスト」で
  先取り解放可能。
- **設定**：日本語/英語切替、キーボードガイドON/OFF、ふりがなON/OFF
  （レベルモードは常時キーボードガイドON固定）
- **ローマ字入力**：`し`→`shi`/`si` など複数表記を許容する変換テーブルを `typing.html` 内に実装
  （`kanaToRomaOptions()`、`typing.html:1493`）。「ん」の語末/語中ルール
  （`romaji_rules.js` の `specialRules.finalN`）は typing.html 側に移植されておらず未実装。
- **キーボードガイド**：次に押すキー1つをハイライト（`highlightNextKey()`、`typing.html:2257`）。
  指の担当表示は無し。
- **結果表示**：スコア／正確率／打鍵数／最高コンボのみ
- **アカウント**：`login.html` でニックネーム・絵文字アイコン・自己申告IDをlocalStorageに保存する
  疑似ログイン（パスワードなし）
- **Firebase（PR #1、未マージ）**：匿名認証を使い、`accounts/{自己申告ID}` にプロフィール・記録を
  アップロード/手動復元。メール/パスワード認証ではなく、Firestore Rulesも「認証済みなら誰でもその
  IDを読み書き可」という緩い設計。

## 3. 問題点（教材化要件とのギャップ）

| 分類 | 現状 | 問題 |
|---|---|---|
| カリキュラム設計 | ワールドは `targets` 文字列配列のみ | `allowedKeys`/`newKeys`/学習目的/合格条件などのメタデータが無く、未学習キー検査の仕組みが存在しない。例：マップ1(ホームポジション)のワールドに `flash`(f,l,a,s,h) のように未学習の l,a,s,h が混在。 |
| マップ構成 | 10マップ固定だが内容が要求と不一致 | 数字マップ・プログラミング記号マップ・日本語ローマ字専用マップが無い。記号は「マリーナ」1マップに簡易的に含まれるのみ。 |
| 指使い | 次キーの位置ハイライトのみ | 指の担当（左右10本+親指）の概念自体が無い。 |
| 合格条件 | `正解数>=8 && 正確率>=80%` 固定 | ワールドごとの個別合格条件・段階的な速度条件・不合格理由の内訳表示が無い。 |
| 問題数/品質 | 各ワールド4〜6パターンを機械的に反復 | 「暗記でスコアが上がる」状態。プログラミング教室向けの `move forward` 等のフレーズも無い。 |
| 結果分析 | スコア/正確率/打鍵数/最高コンボのみ | KPM/WPM/苦手キー/前回比較/自己ベスト/挑戦回数/合格回数/最終練習日時が未記録・未表示。 |
| Firebase Auth | 匿名認証＋自己申告ID（PR #1） | メール/パスワード認証ではない。新規登録・パスワード再設定・表示名分離などが必要。 |
| Firestore構造 | `accounts/{自己申告ID}` に全部混在 | `users/{uid}` 構造でなく、IDを知っていれば誰でも読み書き可能（PR #1のルール）。 |
| localStorage移行 | 仕組み無し | 初回ログイン時の自動移行・競合解決・移行済みフラグが未実装。 |
| セキュリティルール | 「認証済みなら誰でも」 | 本人のuidのみ読み書き可能なルールになっていない。 |
| オフライン対応 | 無し | 通信失敗時はconsole.warnのみ、UI表示・再送機構が無い。 |
| 誤操作防止 | `confirm()` 一発でリセット | 二重確認・PIN・進捗削除とアカウント削除の分離が無い。 |
| アクセシビリティ | 基本的なTab移動は可能だがフォーカスリング/aria-live/モーダルのrole・フォーカストラップ・Esc・reduced-motion対応が無い | WCAG観点での対応が未整備。 |
| IME対応 | `keydown` のみ監視 | `compositionstart`/`compositionend` を一切見ておらず、日本語IME ONのまま入力すると誤動作しやすい。IME状態の案内も無い。 |
| コード構造 | `typing.html` 1ファイル約3300行（CSS+HTML+JS混在） | 保守困難。`typing_words.js`/`romaji_rules.js`が死んでいる二重管理。グローバル関数多数。 |

## 4. GitHub Pages

公開URL: `https://nikorihito.github.io/nikori-typing/`

- 全ファイルはリポジトリルート直下にフラット配置され、CSS/JS/画像の参照はすべて `./` 形式の
  相対パス（ルート絶対パス `/css/...` 等は使用されていない）。サブディレクトリ配信でも壊れない
  構成になっている。
- ルートに `index.html` が存在しない。現状は `login.html` を最初に開く前提。
  フェーズ2以降で `index.html`（`login.html`へのリダイレクト、または`login.html`を`index.html`に
  リネーム）の追加を検討する。

## 5. PR #1 との関係

PR #1（`claude/firebase-setup-completion-knam37` ブランチ、未マージ）で追加した匿名認証+Firestore
簡易同期は、今回の要件（メール/パスワード認証、`users/{uid}` ベースのFirestore構造、本人のみ
読み書き可能なセキュリティルール）と設計思想が異なるため、フェーズ3で作り直します。
ブランチとPRはそのまま継続利用します。

## 今後のフェーズ

- **フェーズ2**：カリキュラム再構築（allowedKeys/newKeys検証、指使い表示、合格条件明確化、
  問題数・品質改善）
- **フェーズ3**：Firebase本実装（メール/パスワード認証、`users/{uid}`構造でのFirestore保存、
  localStorage移行、セキュリティルール、オフライン一時保存）
- **フェーズ4**：品質仕上げ（結果分析、アクセシビリティ、IME対応、誤操作防止、コード構造整理、
  README更新）
