"use strict";

// Firebase初期化＆クラウド同期ヘルパー
//
// login.html / typing.html から共通で読み込みます。
// firebaseConfig がプレースホルダーのままの場合や、
// Authentication で匿名ログインが有効になっていない場合は、
// クラウド同期を無効化してlocalStorageのみで動作します（読み込みエラーにはしません）。
(function () {
  let readyPromise = null;
  let db = null;

  function ensureReady() {
    if (readyPromise) return readyPromise;

    readyPromise = new Promise(resolve => {
      try {
        if (!window.firebase || !window.firebaseConfig) {
          resolve(false);
          return;
        }
        if (window.firebaseConfig.apiKey === "YOUR_API_KEY") {
          console.info("firebase-config.js がプレースホルダーのままです。クラウド同期は無効です。");
          resolve(false);
          return;
        }

        firebase.initializeApp(window.firebaseConfig);
        const auth = firebase.auth();
        db = firebase.firestore();

        let settled = false;
        auth.onAuthStateChanged(user => {
          if (user && !settled) {
            settled = true;
            resolve(true);
          }
        });

        auth.signInAnonymously().catch(err => {
          console.warn("Firebase匿名ログインに失敗しました。クラウド同期は無効です。", err);
          if (!settled) {
            settled = true;
            resolve(false);
          }
        });
      } catch (err) {
        console.warn("Firebaseの初期化に失敗しました。クラウド同期は無効です。", err);
        resolve(false);
      }
    });

    return readyPromise;
  }

  async function pushAccountData(accountId, data) {
    if (!accountId || accountId === "guest") return false;
    const ok = await ensureReady();
    if (!ok) return false;
    try {
      await db.collection("accounts").doc(accountId).set(
        { ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.warn("クラウドへの保存に失敗しました。", err);
      return false;
    }
  }

  async function pullAccountData(accountId) {
    if (!accountId || accountId === "guest") return null;
    const ok = await ensureReady();
    if (!ok) return null;
    try {
      const snap = await db.collection("accounts").doc(accountId).get();
      return snap.exists ? snap.data() : null;
    } catch (err) {
      console.warn("クラウドからの読み込みに失敗しました。", err);
      return null;
    }
  }

  window.NikoriCloud = { ensureReady, pushAccountData, pullAccountData };
})();
