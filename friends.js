import {firebaseConfig} from "./firebase-config.js";
const $=id=>document.getElementById(id);
const status=s=>{$("status").textContent=s};
if(!firebaseConfig?.apiKey||!firebaseConfig?.projectId||!firebaseConfig?.appId){
 status("Firebaseは未接続です。管理者による設定後、ログインすると利用できます。");
}else{
 try{
 const base="https://www.gstatic.com/firebasejs/13.1.0/";
 const [{initializeApp},{getAuth,onAuthStateChanged},{getFirestore,doc,getDoc,setDoc,updateDoc,serverTimestamp,query,collection,where,getDocs}] = await Promise.all([
 import(base+"firebase-app.js"),import(base+"firebase-auth.js"),import(base+"firebase-firestore.js")]);
 const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
 let uid=null,myCode=null;const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
 const error=e=>status("処理できませんでした（"+(e?.code||"unknown")+"）。Firestoreルールと接続設定を確認してください。");
 const codeRef=c=>doc(db,"friendCodes",c);
 const requestRef=(to,from)=>doc(db,"friendRequests",to+"_"+from);
 const makeCode=()=>{const bytes=new Uint8Array(12);crypto.getRandomValues(bytes);return Array.from(bytes,b=>chars[b%chars.length]).join("")};
 const enable=(active)=>{for(const id of ["generate","send","refresh"])$(id).disabled=!active;};
 function item(ul,text,actions=[]){const li=document.createElement("li");const span=document.createElement("span");span.textContent=text;li.appendChild(span);for(const [name,fn] of actions){const button=document.createElement("button");button.textContent=name;button.addEventListener("click",fn);li.appendChild(button)}ul.appendChild(li)}
 async function reload(){
 if(!uid)return;
 $("incoming").replaceChildren();$("friends").replaceChildren();
 const received=await getDocs(query(collection(db,"friendRequests"),where("to","==",uid)));
 const sent=await getDocs(query(collection(db,"friendRequests"),where("from","==",uid)));
 const friends=new Set();
 for(const row of [...received.docs,...sent.docs]){const data=row.data();if(data.status==="accepted")friends.add(data.from===uid?data.to:data.from)}
 for(const row of received.docs){const data=row.data();if(data.status==="pending")item($("incoming"),"申請元："+data.from.slice(0,8)+"…",[["承認",async()=>{try{await updateDoc(row.ref,{status:"accepted"});await reload();status("フレンドになりました。")}catch(e){error(e)}}],["拒否",async()=>{try{await updateDoc(row.ref,{status:"rejected"});await reload()}catch(e){error(e)}}]])}
 if(!$("incoming").children.length)item($("incoming"),"申請はありません");
 for(const fid of friends)item($("friends"),"フレンド："+fid.slice(0,8)+"…");
 if(!friends.size)item($("friends"),"まだフレンドはいません");
 }
 onAuthStateChanged(auth,async user=>{
 uid=user?.uid||null;enable(!!uid);if(!uid){status("クラウドアカウントにログインしてください。");return;}
 try{const snap=await getDoc(doc(db,"users",uid));myCode=snap.data()?.friendCode||null;$("code").textContent=myCode||"未発行";$("generate").disabled=!!myCode;$("copy").disabled=!myCode;status("ログインしています。フレンドコードを発行できます。");await reload()}catch(e){error(e)}
 },error);
 $("generate").addEventListener("click",async()=>{
 if(!uid||myCode)return;$("generate").disabled=true;
 try{
  const code=makeCode();await setDoc(codeRef(code),{uid});
  await setDoc(doc(db,"users",uid),{friendCode:code},{merge:true});
  myCode=code;$("code").textContent=code;$("copy").disabled=false;status("フレンドコードを発行しました。");
 }catch(e){error(e);$("generate").disabled=false}
 });
 $("copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(myCode);status("コピーしました。")}catch{status("コピーできませんでした。コードを手動で選択してください。")}});
 $("requestForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!uid)return;const code=$("friendCode").value.trim().toUpperCase().replace(/[^A-Z2-9]/g,"");
 if(code.length!==12){status("12文字のコードを入力してください。");return}
 $("send").disabled=true;try{
 const snap=await getDoc(codeRef(code));
 if(!snap.exists()){status("コードが見つかりません。");return;}
 const to=snap.data().uid;
 if(to===uid){status("自分自身には申請できません。");return;}
 await setDoc(requestRef(to,uid),{from:uid,to,status:"pending",createdAt:serverTimestamp()});
 status("フレンド申請を送りました。");await reload();
 }catch(e){error(e)}finally{$("send").disabled=false}
 });
 $("refresh").addEventListener("click",()=>reload().catch(error));
 }catch(e){status("Firebaseの読み込みに失敗しました。");console.error(e)}
}
