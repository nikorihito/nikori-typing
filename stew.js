"use strict";
(() => {
const $=id=>document.getElementById(id);
const p=new URLSearchParams(location.search);
const plus=p.get("mode")==="plus", tutorial=p.get("mode")!=="plus" && p.get("mode")!=="challenge";
const TUTORIAL="nikoriStewTutorialCompleted", PLUS_UNLOCK="nikoriStewPlusUnlocked", TITLE="nikoriTypingFarEndTitle";
const course=plus?["fresh ingredients","delicious beef stew","stew master challenge","accurate typing","the final masterpiece"]:tutorial?["beef","stew","yum"]:["beef","carrot","potato","onion","delicious","beef stew"];
const freshnessDelay=plus?1050:tutorial?18000:5500;
const decayMs=plus?1400:tutorial?10000:2300;
const speaker=plus?"./つるつる君.png":"./ニコリヒト.png";
$("speaker").src=speaker;
$("dialogue").textContent=plus?"つるつる君：ここからは＋モード！今度は僕の出番だよ。腐るのが速いし、長い言葉も出るよ！":tutorial?"ニコリヒト：まずはチュートリアルをやってみよう！":"ニコリヒト：今日はビーフシチューを作るよ。正確に、すばやく入力しよう！";
$("description").textContent=plus?"＋モード：厳しい鮮度制限と長い英語に挑戦。最後まで完成度90%以上で「最果てのタイパー」の称号を獲得できます。":tutorial?"レベル1：レトルトビーフシチュー。最初は簡単！タイピングで文字を鍋に入れて、おいしいシチューを作ろう。":"タイプした文字が鍋に入るよ。赤い文字が少ないほどおいしく完成するよ。";
let index=0,position=0,tainted=[],entered=[],startedAt=0,timer=null,finished=false,all=0,red=0;
const safeWrite=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){console.warn(e)}};
const safeRead=k=>{try{return localStorage.getItem(k)}catch{return null}};
if(plus && safeRead(PLUS_UNLOCK)!=="1"){ $("description").textContent="＋モードは通常モードの最終ワールドを条件達成すると解放されます。";$("start").disabled=true;}
function render(){
const w=course[index];if(!w)return;
const elapsed=performance.now()-startedAt;
for(let i=position;i<w.length;i++){if(elapsed>freshnessDelay+(i-position)*decayMs)tainted[i]=true;}
$("letters").innerHTML=Array.from(w).map((c,i)=>'<span class="'+(i<position?(entered[i]?"stale":"fresh"):tainted[i]?"stale":"pending")+'">'+(c===" "?"&nbsp;":c)+"</span>").join("");
const remaining=Math.max(0,100-Math.round(red/Math.max(1,all)*100));
$("quality").textContent="鮮度スコア（現時点の投入文字） "+remaining+"%";
$("freshBar").style.width=remaining+"%";
$("progress").textContent="食材 "+(index+1)+"/"+course.length+"： "+w;
}
function startWord(){position=0;tainted=[];entered=[];startedAt=performance.now();$("entry").value="";render();}
function splash(char,bad){const e=document.createElement("span");e.className="fall";e.textContent=char===" "?"·":char;e.style.color=bad?"#ce3044":"#008b6d";e.style.left=(35+Math.random()*35)+"%";$("falling").appendChild(e);setTimeout(()=>e.remove(),680);}
function finish(){
finished=true;clearInterval(timer);$("entry").disabled=true;$("game").hidden=true;$("result").hidden=false;
const score=Math.round((all-red)/Math.max(1,all)*100),perfect=red===0;
$("resultTitle").textContent=score>=90?"とてもおいしいビーフシチュー！":score>=70?"おいしいビーフシチュー！":score>=40?"ちょっと味が落ちちゃった":"ビーフシチュー作りに再挑戦！";
$("resultText").textContent="完成度 "+score+"% ／ 赤い文字 "+red+" ／ 全 "+all+" 文字";
$("achievement").textContent=perfect?"隠しメッセージ：君相当すごいんだね！":"";
if(tutorial){safeWrite(TUTORIAL,"1");$("dialogue").textContent="ニコリヒト：チュートリアル完了！次はレベルアップマップで練習しよう！";}
if(plus){if(score>=90){safeWrite(TITLE,"最果てのタイパー");$("achievement").textContent+=" 称号獲得：最果てのタイパー！";}$("dialogue").textContent="つるつる君：＋モードに挑戦してくれてありがとう！";}
}
$("start").addEventListener("click",()=>{
$("intro").hidden=true;$("game").hidden=false;$("entry").disabled=false;index=0;all=0;red=0;finished=false;startWord();$("entry").focus();timer=setInterval(()=>{if(!finished)render()},120);
});
$("entry").addEventListener("keydown",e=>{
if(finished||e.ctrlKey||e.metaKey||e.altKey||e.key.length!==1)return;
e.preventDefault();const expected=course[index][position];const char=e.key.toLowerCase();const mistake=char!==expected.toLowerCase();
all++;
if(mistake){tainted[position]=true;red++;render();return;}
const spoiled=!!tainted[position];if(spoiled)red++;
entered[position]=spoiled;position++;splash(expected,spoiled);$("entry").value="";
if(position>=course[index].length){index++;if(index>=course.length){finish();return;}startWord();}else render();
});
$("again").addEventListener("click",()=>location.reload());
window.addEventListener("pagehide",()=>clearInterval(timer));
})();