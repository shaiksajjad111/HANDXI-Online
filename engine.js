// HANDXI game engine — pure rules, no DOM. Reusable in browser and Node (for the Socket.IO server later).
(function(root){
const LIVES={BATTER:2,"ALL-ROUNDER":1,BOWLER:0},SIXES={BATTER:8,"ALL-ROUNDER":5,BOWLER:2},MAXB=12;
const fail=s=>{throw new Error(s)};
function validateTeam(ps){if(!ps||ps.length!==5||new Set(ps.map(p=>p.id)).size!==5)return"Exactly 5 different players required";const c=r=>ps.filter(p=>p.role===r).length;return c("BATTER")===2&&c("ALL-ROUNDER")===1&&c("BOWLER")===2?null:"Need 2 batters, 1 all-rounder, 2 bowlers"}
function create(teams){if(teams.length!==2)fail("Two teams required");teams.forEach(t=>{const e=validateTeam(t.players);if(e)fail(t.name+": "+e)});const ids=teams.flatMap(t=>t.players.map(p=>p.id));if(new Set(ids).size!==10)fail("A player cannot be in both teams");
return{teams,status:"new",part:0,so:false,bat:0,career:{},results:[],stats:{},hist:[],runs:0,wk:0,balls:0,order:[],bi:0,batter:null,bowler:null,seq:0,target:null}}
const P=(m,id)=>m.teams.flatMap(t=>t.players).find(p=>p.id===id);
function startInnings(m,o){const st=m.status;if(!["new","innings_break","tie"].includes(st))fail("Cannot start an innings now");
if(st==="new"){m.part=1;m.so=false}else if(st==="innings_break"){m.part=2;if(o.bat!==1-m.firstBat)fail("Wrong batting team")}else{m.part=1;m.so=true;m.target=null}
if(o.bat!==0&&o.bat!==1)fail("Invalid batting team");const ids=m.teams[o.bat].players.map(p=>p.id),ord=o.order||[];
if(m.so){if(ord.length!==2||new Set(ord).size!==2||!ord.every(i=>ids.includes(i)))fail("Super Over needs 2 batters from the active 5")}
else if(ord.length!==5||new Set(ord).size!==5||!ord.every(i=>ids.includes(i)))fail("Batting order must contain all 5 active players");
m.bat=o.bat;m.order=[...ord];m.bi=0;m.batter=ord[0];m.bowler=null;m.runs=0;m.wk=0;m.balls=0;m.seq=0;m.hist=[];m.maxBalls=m.so?6:30;
m.stats={};m.teams.forEach(t=>t.players.forEach(p=>m.stats[p.id]={lives:LIVES[p.role],sixes:0,runs:0,faced:0,out:false,bowled:0,conceded:0,wkts:0}));m.status="play";return m}
const bowlTeam=m=>m.teams[1-m.bat].players;
function eligibleBowlers(m){return bowlTeam(m).filter(p=>m.stats[p.id].bowled<MAXB)}
function chooseBowler(m,id){if(m.status!=="play"||m.bowler!==null)fail("Bowler cannot be chosen now");if(!eligibleBowlers(m).some(p=>p.id===id))fail("Ineligible bowler (max 2 overs)");m.bowler=id;return m}
function legal(m){const b=P(m,m.batter),s=m.stats[m.batter];return{bat:[1,2,3,4,5,6].filter(n=>n!==6||s.sixes<SIXES[b.role]),bowl:[1,2,3,4,5,6]}}
function play(m,bn,wn,seq){if(m.status!=="play")fail("Match not in play");if(seq!==m.seq)fail("Duplicate or out-of-order ball");if(m.bowler===null)fail("Choose a bowler first");
if(!legal(m).bat.includes(bn))fail("Batter cannot select "+bn);if(!Number.isInteger(wn)||wn<1||wn>6)fail("Invalid bowler number");
const s=m.stats[m.batter],bs=m.stats[m.bowler],c=m.career;c[m.batter]=c[m.batter]||{runs:0,wkts:0};c[m.bowler]=c[m.bowler]||{runs:0,wkts:0};
m.seq++;m.balls++;s.faced++;bs.bowled++;const ev={n:m.balls,bat:bn,bowl:wn,batter:m.batter,bowler:m.bowler,runs:0,type:"run"};
if(bn===wn){s.lives=Math.max(0,s.lives-1);ev.type="life";if(s.lives<=0){s.out=true;ev.type="out";m.wk++;bs.wkts++;c[m.bowler].wkts++;m.bi++;if(m.bi<m.order.length)m.batter=m.order[m.bi]}}
else{ev.runs=bn;m.runs+=bn;s.runs+=bn;bs.conceded+=bn;c[m.batter].runs+=bn;if(bn===6)s.sixes++}
m.hist.push(ev);
const done=(m.part===2&&m.runs>=m.target)||m.balls>=m.maxBalls||m.wk>=m.order.length;
if(done)finish(m);else if(m.balls%6===0)m.bowler=null;return ev}
function finish(m){m.bowler=null;if(m.part===1){m.firstRuns=m.runs;m.firstBat=m.bat;m.target=m.runs+1;m.status="innings_break"}
else{m.secondRuns=m.runs;if(m.runs>=m.target)win(m,m.bat);else if(m.runs===m.target-1)m.status="tie";else win(m,m.firstBat)}}
function win(m,w){m.winner=w;m.status="done";m.results.push({so:m.so,first:m.firstRuns,second:m.secondRuns})}
function awards(m){const all=m.teams.flatMap(t=>t.players),c=id=>m.career[id]||{runs:0,wkts:0},mx=f=>all.reduce((a,b)=>f(b)>f(a)?b:a);
const team=p=>m.teams.findIndex(t=>t.players.includes(p));return{topScorer:mx(p=>c(p.id).runs),topWicketTaker:mx(p=>c(p.id).wkts),potm:mx(p=>c(p.id).runs+15*c(p.id).wkts+(team(p)===m.winner?10:0)),c}}
root.HandXIEngine={create,startInnings,chooseBowler,eligibleBowlers,legal,play,awards,validateTeam,LIVES,SIXES,P};
if(typeof module!=="undefined")module.exports=root.HandXIEngine;
})(typeof window!=="undefined"?window:globalThis);
