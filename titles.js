"use strict";
(function(global){
 const KEY="nikoriTypingAchievementsV1";
 const DEFINITIONS=[
  ["first_step","はじめの一打","タイピングゲームを1回終了する","bronze"],
  ["steady_learner","こつこつタイパー","累計5回プレイする","bronze"],
  ["persistent","継続の達人","累計30回プレイする","silver"],
  ["centurion","百戦錬磨","累計100回プレイする","gold"],
  ["precise","正確無比","通常のタイピングを正確率100%でクリアする","silver"],
  ["precision_master","精密機械","通常のタイピングを正確率98%以上で10回クリアする","gold"],
  ["combo_hero","コンボ職人","1回のプレイで20コンボを達成する","silver"],
  ["combo_king","コンボ王","1回のプレイで50コンボを達成する","gold"],
  ["map_beginner","冒険のはじまり","レベルアップのワールドを1つクリアする","bronze"],
  ["map_explorer","ワールド探検家","レベルアップのワールドを10個クリアする","silver"],
  ["map_master","百の試練を越えし者","レベルアップの100ワールドをすべてクリアする","legend"],
  ["tutorial_chef","見習いシェフ","ビーフシチューのチュートリアルを完成させる","bronze"],
  ["stew_chef","シチュー職人","ビーフシチューを完成度90%以上で仕上げる","silver"],
  ["perfect_stew","伝説の料理人","赤い文字0個でビーフシチューを完成させる","gold"],
  ["stew_regular","鍋の番人","ビーフシチューを累計10回完成させる","silver"],
  ["plus_challenger","限界への挑戦者","＋モードに1回挑戦する","gold"],
  ["far_end","最果てのタイパー","＋モードを完成度90%以上でクリアする","legend"]
 ];
 function load(){try{const o=JSON.parse(localStorage.getItem(KEY)||"{}");return {counts:{...o.counts},unlocked:{...o.unlocked}};}catch{return {counts:{},unlocked:{}}}}
 function save(data){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){console.warn("称号保存に失敗",e)}}
 function grant(d,id){if(!d.unlocked[id]){d.unlocked[id]=new Date().toISOString();return true;}return false}
 function record(type,details={}){
  const d=load(),c=d.counts,news=[];
  const award=id=>{if(grant(d,id))news.push(DEFINITIONS.find(v=>v[0]===id)?.[1]||id)};
  if(type==="game"){
   c.games=(c.games||0)+1;award("first_step");
   if(c.games>=5)award("steady_learner");
   if(c.games>=30)award("persistent");
   if(c.games>=100)award("centurion");
   if(details.accuracy===100)award("precise");
   if(details.accuracy>=98){c.preciseRuns=(c.preciseRuns||0)+1;if(c.preciseRuns>=10)award("precision_master")}
   if(details.combo>=20)award("combo_hero");
   if(details.combo>=50)award("combo_king");
   if(details.clearedWorlds>=1)award("map_beginner");
   if(details.clearedWorlds>=10)award("map_explorer");
   if(details.clearedWorlds>=100)award("map_master");
  }
  if(type==="stew"){
   c.stews=(c.stews||0)+1;
   if(details.tutorial)award("tutorial_chef");
   if(details.quality>=90)award("stew_chef");
   if(details.red===0)award("perfect_stew");
   if(c.stews>=10)award("stew_regular");
   if(details.plus){award("plus_challenger");if(details.quality>=90)award("far_end")}
  }
  save(d);return news;
 }
 function syncLegacy(){
  const d=load();
  try{
   if(localStorage.getItem("nikoriTypingFarEndTitle")==="最果てのタイパー")grant(d,"far_end");
   if(localStorage.getItem("nikoriStewTutorialCompleted")==="1")grant(d,"tutorial_chef");
   const progress=JSON.parse(localStorage.getItem("nikoriTypingLevelRecord")||"{}");
   const n=(progress.completed||[]).flat().filter(Boolean).length;
   if(n>=1)grant(d,"map_beginner");if(n>=10)grant(d,"map_explorer");if(n>=100)grant(d,"map_master");
  }catch{}
  save(d);return d;
 }
 global.NikoriTitles={definitions:DEFINITIONS,load,record,syncLegacy};
})(window);
