"use strict";

// Firebase Authentication のエラーコードを、児童・保護者にも分かりやすい
// 日本語メッセージへ変換する共通ヘルパーです。
// login.html / index.html から `import { mapAuthErrorToMessage } from "./firebase-errors.js"` で使用します。

const AUTH_ERROR_MESSAGES = {
  "auth/invalid-credential": "メールアドレスまたはパスワードが正しくありません。",
  "auth/invalid-email": "メールアドレスの形式が正しくありません。",
  "auth/user-disabled": "このアカウントは現在利用できません。",
  "auth/user-not-found": "メールアドレスまたはパスワードが正しくありません。",
  "auth/wrong-password": "メールアドレスまたはパスワードが正しくありません。",
  "auth/email-already-in-use": "このメールアドレスはすでに登録されています。",
  "auth/weak-password": "パスワードは6文字以上で入力してください。",
  "auth/too-many-requests": "短時間に操作が繰り返されました。しばらく待ってからお試しください。",
  "auth/network-request-failed": "通信に失敗しました。電波やWi-Fiの状態を確認して、もう一度お試しください。",
  "auth/missing-password": "パスワードを入力してください。",
  "auth/missing-email": "メールアドレスを入力してください。",
  "auth/operation-not-allowed": "現在この方法でのログインは利用できません。管理者にご連絡ください。",
  "auth/requires-recent-login": "セキュリティのため、もう一度ログインし直してください。"
};

const DEFAULT_MESSAGE = "エラーが発生しました。時間をおいてもう一度お試しください。";

export function mapAuthErrorToMessage(error) {
  const code = error && error.code ? String(error.code) : "";
  return AUTH_ERROR_MESSAGES[code] || DEFAULT_MESSAGE;
}
