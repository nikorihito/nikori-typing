"use strict";

// Firebase 共通初期化ファイル（モジュール版 SDK）
//
// login.html / index.html の両方から `import { app, auth, db } from "./firebase-config.js"`
// で読み込みます。Firebase App / Authentication / Cloud Firestore をここで一度だけ初期化します。
//
// サービスアカウントJSON・秘密鍵・Admin SDKの認証情報は絶対にこのファイルへ書かないでください。
// ここに書く firebaseConfig はブラウザに公開される「クライアント用の識別情報」であり、
// セキュリティは Firebase Authentication と firestore.rules で確保します。

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ▼▼▼ ここを Firebase Console の値に書き換えてください ▼▼▼
// Firebase Console > プロジェクトの設定（歯車アイコン）> 全般 >
// 「マイアプリ」> ウェブアプリの SDK の設定と構成 に表示される
// firebaseConfig オブジェクトの値をそのままコピーしてください。
// https://console.firebase.google.com/project/nikori-typing/settings/general
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "nikori-typing.firebaseapp.com",
  projectId: "nikori-typing",
  storageBucket: "nikori-typing.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
// ▲▲▲ ここまで ▲▲▲

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";
