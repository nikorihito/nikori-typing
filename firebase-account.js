import { firebaseConfig } from "./firebase-config.js";
const $ = id => document.getElementById(id);
const status = text => { $("status").textContent = text; };
const keys = ["nikoriTypingRecord","nikoriTypingLevelRecord","nikoriTypingSettings"];
const readLocal = () => Object.fromEntries(keys.map(k => {try { return [k, JSON.parse(localStorage.getItem(k) || "null")]; } catch {return [k,null];}}));
if (!firebaseConfig || !firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  status("Firebaseの接続設定はまだありません。管理者がプロジェクトを作成し、firebase-config.jsを設定するとログインできます。\n現在のタイピング記録は端末内に残っています。");
} else {
  try {
    const base = "https://www.gstatic.com/firebasejs/13.1.0/";
    const [{initializeApp},{getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,sendPasswordResetEmail},{getFirestore,doc,getDoc,setDoc}] = await Promise.all([
      import(base+"firebase-app.js"),import(base+"firebase-auth.js"),import(base+"firebase-firestore.js")
    ]);
    const app = initializeApp(firebaseConfig), auth = getAuth(app), db = getFirestore(app);
    const ref = () => doc(db,"users",auth.currentUser.uid);
    const failure = e => {
      const code = e?.code || "unknown";
      const messages = {"auth/invalid-credential":"メールアドレスまたはパスワードを確認してください。","auth/email-already-in-use":"このメールアドレスは登録済みです。","auth/weak-password":"パスワードが短すぎます。","permission-denied":"Firestoreのアクセス権限を確認してください。"};
      status(messages[code] || "処理に失敗しました（"+code+"）。");
    };
    $("login").disabled=false;$("register").disabled=false;$("resetPassword").disabled=false;
    $("register").addEventListener("pointerdown",()=>{$("password").setAttribute("autocomplete","new-password")});
    $("login").addEventListener("pointerdown",()=>{$("password").setAttribute("autocomplete","current-password")});
    $("resetPassword").addEventListener("click",async()=>{if(!$("email").reportValidity())return;try{await sendPasswordResetEmail(auth,$("email").value);status("登録済みの場合、パスワード再設定メールを送信します。")}catch(e){failure(e)}});
    onAuthStateChanged(auth,user=>{
      $("authForm").hidden=!!user;$("logout").hidden=!user;$("sync").hidden=!user;
      status(user?"ログイン中: "+user.email+"\nクラウド同期は手動操作です。":"ログインしていません。");
    },failure);
    $("authForm").addEventListener("submit",async e=>{e.preventDefault();try{await signInWithEmailAndPassword(auth,$("email").value,$("password").value)}catch(e){failure(e)}});
    $("register").addEventListener("click",async()=>{if(!$("authForm").reportValidity())return;try{await createUserWithEmailAndPassword(auth,$("email").value,$("password").value)}catch(e){failure(e)}});
    $("logout").addEventListener("click",async()=>{try{await signOut(auth)}catch(e){failure(e)}});
    $("upload").addEventListener("click",async()=>{
      if(!auth.currentUser)return;
      if(!confirm("この端末の学習記録を初めてクラウドに保存しますか？"))return;
      $("upload").disabled=true;
      try {
        const snapshot=await getDoc(ref());
        if(snapshot.exists()){status("クラウドに既存データがあります。上書きを防止するため保存を中止しました。");return;}
        await setDoc(ref(),{progress:readLocal(),createdAt:new Date().toISOString(),schemaVersion:1});
        status("クラウドに初回保存しました。");
      }catch(e){failure(e)}finally{$("upload").disabled=false}
    });
    $("download").addEventListener("click",async()=>{
      if(!auth.currentUser)return;
      $("download").disabled=true;
      try{
        const snapshot=await getDoc(ref());
        if(!snapshot.exists()){status("クラウドに記録がありません。");return;}
        const data=snapshot.data().progress||{};
        if(!confirm("クラウドの学習記録をこの端末へ復元します。現在の端末内の記録は上書きされます。実行しますか？"))return;
        const backup={};
        for(const k of keys) backup[k]=localStorage.getItem(k);
        const backupKey="nikoriTypingBackupBeforeCloudImport_"+Date.now();
        localStorage.setItem(backupKey,JSON.stringify(backup));
        for(const k of keys){if(data[k]!==undefined&&data[k]!==null)localStorage.setItem(k,JSON.stringify(data[k]));}
        status("復元しました。タイピング画面を開き直すと反映されます。復元前のデータはこのブラウザ内にバックアップしました。");
      }catch(e){failure(e)}finally{$("download").disabled=false}
    });
  }catch(e){status("Firebaseの初期化に失敗しました。管理者に接続設定を確認してください。");console.error(e)}
}
