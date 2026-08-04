"use strict";

// Cloud Firestore 読み書きの共通ヘルパー
//
// users/{uid}                       … プロフィール・設定・移行フラグ
// users/{uid}/progress/{worldId}    … ワールドごとの進捗（worldId = "{mapIndex}-{worldIndex}"）
// users/{uid}/results/{resultId}    … 1プレイごとの記録（自動ID）
//
// login.html / index.html から import して使用します。

import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

// 旧localStorageのキー（移行元）。login.html / index.html の定義と合わせています。
const LEGACY_RECORD_KEY = "nikoriTypingRecord";
const LEGACY_LEVEL_RECORD_KEY = "nikoriTypingLevelRecord";
const LEGACY_SETTINGS_KEY = "nikoriTypingSettings";

// 通信失敗時にプレイ結果を一時保存しておくキュー（オフライン対応）
const PENDING_RESULTS_KEY = "nikoriTypingPendingResults";

// ---------------------------------------------------------------------------
// ユーザードキュメント
// ---------------------------------------------------------------------------

export async function createUserDocument(user, { displayName, avatarEmoji } = {}) {
  const ref = doc(db, "users", user.uid);
  await setDoc(ref, {
    uid: user.uid,
    displayName: (displayName || user.displayName || "ユーザー").slice(0, 40),
    email: user.email || "",
    avatarEmoji: avatarEmoji || "⌨️",
    settings: { lang: "ja", keyboard: true, kana: true },
    migration: { migratedFromLocalStorage: false, migratedAt: null },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp()
  });
}

export async function getUserDocument(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function touchLastLogin(uid) {
  await setDoc(
    doc(db, "users", uid),
    { lastLoginAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function saveSettings(uid, settings) {
  await setDoc(
    doc(db, "users", uid),
    { settings, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// ---------------------------------------------------------------------------
// 進捗（マップ・ワールド）
// ---------------------------------------------------------------------------

export function worldIdOf(mapIndex, worldIndex) {
  return `${mapIndex}-${worldIndex}`;
}

// users/{uid}/progress の全ドキュメントを1回読み込みます。
export async function loadAllProgress(uid) {
  const snap = await getDocs(collection(db, "users", uid, "progress"));
  const byWorldId = {};
  snap.forEach(docSnap => {
    byWorldId[docSnap.id] = docSnap.data();
  });
  return byWorldId;
}

export async function saveProgress(uid, mapIndex, worldIndex, patch) {
  const worldId = worldIdOf(mapIndex, worldIndex);
  const ref = doc(db, "users", uid, "progress", worldId);
  await setDoc(
    ref,
    {
      worldId,
      mapId: mapIndex,
      ...patch,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

// Firestoreのprogressドキュメント群から、既存UIが使う
// { unlockedMap, completed: boolean[10][10] } 形式を組み立てます。
export function buildLevelRecordFromProgress(progressByWorldId) {
  const completed = Array.from({ length: 10 }, () => Array(10).fill(false));
  Object.values(progressByWorldId || {}).forEach(entry => {
    const [mapIndex, worldIndex] = String(entry.worldId || "").split("-").map(Number);
    if (mapIndex >= 0 && mapIndex < 10 && worldIndex >= 0 && worldIndex < 10) {
      completed[mapIndex][worldIndex] = !!entry.isCleared;
    }
  });

  let unlockedMap = 0;
  for (let m = 0; m < 9; m++) {
    if (completed[m][9]) unlockedMap = Math.max(unlockedMap, m + 1);
  }
  return { unlockedMap, completed };
}

// ---------------------------------------------------------------------------
// プレイ結果
// ---------------------------------------------------------------------------

export async function saveResult(uid, result) {
  const ref = collection(db, "users", uid, "results");
  await addDoc(ref, {
    ...result,
    createdAt: serverTimestamp()
  });
}

// ---------------------------------------------------------------------------
// オフライン時の一時保存キュー
// ---------------------------------------------------------------------------

function readPendingQueue() {
  try {
    const raw = localStorage.getItem(PENDING_RESULTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writePendingQueue(queue) {
  localStorage.setItem(PENDING_RESULTS_KEY, JSON.stringify(queue));
}

export function queuePendingResult(result) {
  const queue = readPendingQueue();
  queue.push({ localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, result });
  writePendingQueue(queue);
}

export function getPendingResultCount() {
  return readPendingQueue().length;
}

// 保留中の結果をすべて再送します。1件でも失敗したら残りはキューに残したまま中断します。
export async function flushPendingResults(uid, onProgress) {
  const queue = readPendingQueue();
  if (!queue.length) return { sent: 0, remaining: 0 };

  let sent = 0;
  const remaining = [...queue];

  while (remaining.length) {
    const item = remaining[0];
    try {
      await saveResult(uid, item.result);
      remaining.shift();
      sent++;
      writePendingQueue(remaining);
      if (onProgress) onProgress({ sent, remaining: remaining.length });
    } catch (err) {
      console.warn("保留中の結果の再送に失敗しました。オンライン復帰後に再試行します。", err);
      break;
    }
  }

  return { sent, remaining: remaining.length };
}

// ---------------------------------------------------------------------------
// localStorage → Firestore 移行
// ---------------------------------------------------------------------------

export async function migrateLocalStorageIfNeeded(uid) {
  const userDoc = await getUserDocument(uid);
  if (userDoc && userDoc.migration && userDoc.migration.migratedFromLocalStorage) {
    return { migrated: false, reason: "already-migrated" };
  }

  const existingProgress = await loadAllProgress(uid);
  if (Object.keys(existingProgress).length > 0) {
    // Firestore側に既に進捗がある場合は勝手に上書きしない。
    // 移行済み扱いにして、次回以降は再試行しない。
    await setDoc(
      doc(db, "users", uid),
      { migration: { migratedFromLocalStorage: true, migratedAt: serverTimestamp() } },
      { merge: true }
    );
    return { migrated: false, reason: "cloud-data-exists" };
  }

  let legacyRecord = null;
  let legacyLevelRecord = null;
  let legacySettings = null;

  try {
    legacyRecord = JSON.parse(localStorage.getItem(LEGACY_RECORD_KEY) || "null");
  } catch { /* noop */ }
  try {
    legacyLevelRecord = JSON.parse(localStorage.getItem(LEGACY_LEVEL_RECORD_KEY) || "null");
  } catch { /* noop */ }
  try {
    legacySettings = JSON.parse(localStorage.getItem(LEGACY_SETTINGS_KEY) || "null");
  } catch { /* noop */ }

  if (!legacyRecord && !legacyLevelRecord && !legacySettings) {
    // 移行元データが無い場合も、移行試行済みとして記録する。
    await setDoc(
      doc(db, "users", uid),
      { migration: { migratedFromLocalStorage: true, migratedAt: serverTimestamp() } },
      { merge: true }
    );
    return { migrated: false, reason: "no-local-data" };
  }

  try {
    const writes = [];

    if (legacyLevelRecord && Array.isArray(legacyLevelRecord.completed)) {
      for (let mapIndex = 0; mapIndex < 10; mapIndex++) {
        for (let worldIndex = 0; worldIndex < 10; worldIndex++) {
          const isCleared = !!(legacyLevelRecord.completed[mapIndex] && legacyLevelRecord.completed[mapIndex][worldIndex]);
          const isUnlocked = mapIndex <= Number(legacyLevelRecord.unlockedMap || 0);
          if (!isCleared && !isUnlocked) continue;
          writes.push(
            saveProgress(uid, mapIndex, worldIndex, {
              isUnlocked,
              isCleared,
              bestScore: 0,
              bestAccuracy: 0,
              bestKpm: 0,
              bestWpm: 0,
              attemptCount: isCleared ? 1 : 0,
              clearCount: isCleared ? 1 : 0,
              lastPlayedAt: serverTimestamp()
            })
          );
        }
      }
    }

    await Promise.all(writes);

    const patch = { migration: { migratedFromLocalStorage: true, migratedAt: serverTimestamp() } };
    if (legacySettings) patch.settings = legacySettings;
    if (legacyRecord && typeof legacyRecord.bestScore === "number") {
      patch.legacyBestScore = legacyRecord.bestScore;
      patch.legacyExp = legacyRecord.exp || 0;
      patch.legacyLevel = legacyRecord.level || 1;
    }

    await setDoc(doc(db, "users", uid), patch, { merge: true });
    // localStorageは削除しない（バックアップとして残す）。
    return { migrated: true };
  } catch (err) {
    console.warn("localStorageからFirestoreへの移行に失敗しました。localStorageは保持します。", err);
    return { migrated: false, reason: "error", error: err };
  }
}
