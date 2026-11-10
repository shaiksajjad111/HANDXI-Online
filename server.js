const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const players = require('./players');
const E = require('./engine');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : true } });
const PORT = process.env.PORT || 3000;
const rooms = new Map();
app.use(express.static(__dirname));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'HANDXI multiplayer', rooms: rooms.size }));
const roster = players;
const code = () => Math.random().toString(36).slice(2, 7).toUpperCase();
const clean = r => ({ code:r.code, phase:r.phase, players:r.seats.map(s=>s?{name:s.name,ready:s.team.length===5}:null), draftFirst:r.draftFirst, draftTurn:r.draftTurn, draftRole:r.draftRoles?.[r.draftTurn]||null, drafted:r.seats.map(s=>s?s.team.map(p=>p.id):[]), teams:r.game?.teams.map(t=>({name:t.name,players:t.players.map(p=>({id:p.id,name:p.name,role:p.role,r:p.r,a:p.a,n:p.n,bat:p.bat,bowl:p.bowl,kit:p.kit,skin:p.skin,hair:p.hair,hs:p.hs,beard:p.beard,t1:p.t1,t2:p.t2,team:p.team}))})), tossWinner:r.tossWinner, batFirst:r.batFirst, state:r.game?{status:r.game.status,part:r.game.part,firstBat:r.game.firstBat,bat:r.game.bat,runs:r.game.runs,wk:r.game.wk,balls:r.game.balls,target:r.game.target,batter:r.game.batter,bowler:r.game.bowler,seq:r.game.seq,hist:r.game.hist,firstRuns:r.game.firstRuns,secondRuns:r.game.secondRuns,winner:r.game.winner,stats:r.game.stats}:null, lastBall:r.lastBall });
function broadcast(r,event='room:update'){io.to(r.code).emit(event,clean(r));}
function err(socket,msg){socket.emit('room:error',msg);}
function playerById(id){return roster.find(p=>p.id===Number(id));}
function startFirst(r,bat){r.batFirst=bat;r.game=E.create(r.seats.map((s,i)=>({name:s.name,players:s.team.map(p=>({...p,id:`${i}-${p.id}`}))})));E.startInnings(r.game,{bat,order:r.game.teams[bat].players.map(p=>p.id)});r.phase='playing';r.lastBall=null;broadcast(r);}
function chooseBowler(r){const m=r.game;if(m.bowler!==null)return;const eligible=E.eligibleBowlers(m).sort((a,b)=>b.bowl-a.bowl);if(!eligible.length)throw Error('No eligible bowler remains');E.chooseBowler(m,eligible[0].id);}
function finishBall(r,ball){const m=r.game;const battingSeat=m.bat;const bn=battingSeat===0?ball[0]:ball[1];const wn=battingSeat===0?ball[1]:ball[0];const ev=E.play(m,bn,wn,m.seq);r.lastBall={...ev,choices:ball};if(m.status==='innings_break')r.phase='innings-break';else if(m.status==='done')r.phase='finished';else if(m.status==='tie')r.phase='tie';broadcast(r,'ball:result');}
io.on('connection',socket=>{
 socket.on('room:create',({name})=>{let c;do{c=code()}while(rooms.has(c));const r={code:c,phase:'lobby',seats:[{id:socket.id,name:String(name||'Player 1').slice(0,20),team:[]},null],tossWinner:null,draftFirst:null,draftTurn:0,draftRoles:['BATTER','BATTER','BATTER','BATTER','ALL-ROUNDER','ALL-ROUNDER','BOWLER','BOWLER','BOWLER','BOWLER'],batFirst:null,game:null,picks:{},lastBall:null};rooms.set(c,r);socket.join(c);socket.data.room=c;socket.data.seat=0;socket.emit('room:joined',{code:c,seat:0});broadcast(r);});
 socket.on('room:join',({code:c,name})=>{const r=rooms.get(String(c||'').toUpperCase());if(!r)return err(socket,'Room not found. Check the code.');if(r.seats[1])return err(socket,'This room already has two players.');r.seats[1]={id:socket.id,name:String(name||'Player 2').slice(0,20),team:[]};socket.join(r.code);socket.data.room=r.code;socket.data.seat=1;socket.emit('room:joined',{code:r.code,seat:1});r.draftFirst=Math.random()<.5?0:1;r.phase='draft';broadcast(r);});
 socket.on('team:select',ids=>err(socket,'Squads are drafted one player at a time after the draft toss.'));
 socket.on('draft:pick',id=>{
  const r=rooms.get(socket.data.room),seat=socket.data.seat;
  if(!r||seat===undefined)return err(socket,'Join a room first.');
  if(r.phase!=='draft')return err(socket,'The player draft is not active.');
  const expected=r.draftTurn%2===0?r.draftFirst:1-r.draftFirst;
  if(seat!==expected)return err(socket,'Wait for your turn to pick.');
  const role=r.draftRoles[r.draftTurn],p=playerById(id);
  if(!p||p.role!==role)return err(socket,`Choose a ${role.toLowerCase()} for this pick.`);
  if(r.seats.some(s=>s.team.some(x=>x.id===p.id)))return err(socket,'That player has already been drafted.');
  r.seats[seat].team.push(p);r.draftTurn++;
  if(r.draftTurn>=r.draftRoles.length){r.tossWinner=Math.random()<.5?0:1;r.phase='match-toss';}
  broadcast(r);
 });
 socket.on('toss:choose',choice=>{const r=rooms.get(socket.data.room);if(!r||r.phase!=='match-toss')return err(socket,'Match toss is not ready.');if(socket.data.seat!==r.tossWinner)return err(socket,'Only the toss winner can choose.');if(!['bat','bowl'].includes(choice))return err(socket,'Choose bat or bowl.');startFirst(r,choice==='bat'?r.tossWinner:1-r.tossWinner);});
 socket.on('number:lock',n=>{const r=rooms.get(socket.data.room);if(!r||r.phase!=='playing')return err(socket,'The match is not accepting numbers now.');if(!Number.isInteger(n)||n<1||n>6)return err(socket,'Choose a number from 1 to 6.');const m=r.game,seat=socket.data.seat;if(seat===undefined)return err(socket,'Join a room first.');if(m.bat===seat){if(!E.legal(m).bat.includes(n))return err(socket,'You have reached your six limit.');}if(r.picks[seat]!==undefined)return err(socket,'Your number is already locked.');r.picks[seat]=n;io.to(r.code).emit('number:locked',{seat});if(r.picks[0]!==undefined&&r.picks[1]!==undefined){const picks=[r.picks[0],r.picks[1]];r.picks={};try{chooseBowler(r);finishBall(r,picks);}catch(e){err(socket,e.message);}}});
 socket.on('innings:continue',()=>{const r=rooms.get(socket.data.room);if(!r||r.phase!=='innings-break')return;try{const bat=1-r.game.firstBat;E.startInnings(r.game,{bat,order:r.game.teams[bat].players.map(p=>p.id)});r.phase='playing';r.lastBall=null;broadcast(r);}catch(e){err(socket,e.message);}});
 socket.on('disconnect',()=>{const r=rooms.get(socket.data.room);if(!r)return;const seat=socket.data.seat;if(r.seats[seat]&&r.seats[seat].id===socket.id){r.seats[seat].connected=false;io.to(r.code).emit('room:opponent-left');}});
});
server.listen(PORT,()=>console.log(`HANDXI server listening on ${PORT}`));
