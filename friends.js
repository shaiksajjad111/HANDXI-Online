(()=>{
const $=id=>document.getElementById(id),socket=io();
let seat=null,room=null,latest=null,locked=false;
const panels=['connectPanel','lobbyPanel','draftPanel','tossPanel','matchPanel'];
function show(id){panels.forEach(x=>$(x).classList.toggle('hidden',x!==id));}
function status(t){$('globalStatus').textContent=t;}
function err(t){status(t);}
socket.on('connect',()=>status('Connected to HANDXI server. Create or join a room.'));
socket.on('connect_error',()=>status('Cannot connect to game server. Check server and refresh.'));
socket.on('room:error',err);
socket.on('room:joined',d=>{room=d.code;seat=d.seat;$('codeView').textContent=room;show('lobbyPanel');status(`Joined room ${room} as Player ${seat+1}.`);});
socket.on('room:update',renderRoom);
socket.on('ball:result',r=>{renderRoom(r);if(r.lastBall){const b=r.lastBall;$('lastBall').textContent=b.type==='out'?`WICKET! Both chose ${b.bat}.`:b.type==='life'?`LIFE LOST — both chose ${b.bat}.`:`${playerName(r,b.batter)} scored ${b.runs}.`;}});
socket.on('number:locked',d=>{$('matchStatus').textContent=d.seat!==seat?'Opponent locked. Waiting for your move…':'Your number is locked. Waiting for opponent…';locked=true;disableNumbers();});
socket.on('room:opponent-left',()=>status('Your opponent disconnected.'));
function playerName(r,id){for(const t of (r.teams||[]))for(const p of t.players)if(p.id===id)return p.name;return 'Batter';}
$('createRoom').onclick=()=>socket.emit('room:create',{name:$('playerName').value.trim()||'Player'});
$('joinRoom').onclick=()=>socket.emit('room:join',{code:$('roomCode').value.trim().toUpperCase(),name:$('playerName').value.trim()||'Player'});
function renderRoom(r){
 latest=r;
 if(r.phase==='lobby'){
  show('lobbyPanel');const joined=r.players.filter(Boolean).length;
  $('lobbyStatus').textContent=`Room ${r.code}: ${joined}/2 players connected. Share the code and wait for your friend.`;
  return;
 }
 if(r.phase==='draft'){
  show('draftPanel');
  const first=r.draftFirst,turn=r.draftTurn,expected=turn%2===0?first:1-first,role=r.draftRole;
  $('draftTitle').textContent=`${r.players[first].name} won the draft toss`;
  $('draftInfo').textContent='Draft order: batters first (2 each), then all-rounders (1 each), then bowlers (2 each). Picks alternate one at a time.';
  $('draftTurn').textContent=turn>=10?'Draft complete':`${r.players[expected].name}'s turn · Pick ${turn+1}/10 · ${role}`;
  const used=new Set((r.drafted||[]).flat());
  $('draftRoster').innerHTML=HANDXI_PLAYERS.map(p=>{
   const taken=used.has(p.id),right=p.role===role,canPick=seat===expected&&!taken&&right;
   return `<button class="pick-player ${taken?'selected':''}" data-id="${p.id}" ${canPick?'':'disabled'} style="${taken?'opacity:.35;cursor:not-allowed':''}"><b>${p.name}</b><small>${p.role} · OVR ${p.r}${taken?' · DRAFTED':''}</small></button>`;
  }).join('');
  return;
 }
 if(r.phase==='match-toss'){
  show('tossPanel');$('tossTitle').textContent=`${r.players[r.tossWinner].name} won the match toss!`;
  $('tossInfo').textContent=seat===r.tossWinner?'Choose whether your team bats or bowls first.':'Waiting for the toss winner to choose bat or bowl.';
  $('tossChoices').classList.toggle('hidden',seat!==r.tossWinner);return;
 }
 if(['playing','innings-break','finished','tie'].includes(r.phase)){
  show('matchPanel');const m=r.state;
  $('inningsLabel').textContent=m.part===1?'1ST INNINGS':'2ND INNINGS';$('score').textContent=m.runs;$('wickets').textContent=m.wk;
  $('overText').textContent=`${Math.floor(m.balls/6)}.${m.balls%6} overs · ${m.balls} balls`;
  $('numberPad').innerHTML=[1,2,3,4,5,6].map(n=>`<button data-num="${n}">${n}</button>`).join('');
  $('numberPad').classList.toggle('hidden',r.phase!=='playing');locked=false;
  $('matchStatus').textContent=m.bat===seat?'You are batting. Choose your number.':'You are bowling. Choose a number to challenge the batter.';
  if(m.bowler===null&&m.status==='play')$('matchStatus').textContent+=' Bowler is selected automatically each over.';
  if(r.phase==='innings-break'){$('matchStatus').textContent=`Innings complete. Target: ${m.target}.`;$('continueInn').classList.remove('hidden');}else $('continueInn').classList.add('hidden');
  if(r.lastBall){const b=r.lastBall;$('lastBall').textContent=b.type==='out'?`WICKET — both selected ${b.bat}.`:b.type==='life'?`LIFE LOST — both selected ${b.bat}.`:`${playerName(r,b.batter)} scored ${b.runs}.`;}
  if(r.phase==='finished'){$('matchStatus').textContent=`Match finished. ${r.players[m.winner]?.name||'A team'} won!`;$('numberPad').classList.add('hidden');}
  if(r.phase==='tie'){$('matchStatus').textContent='Scores are tied. Super Over is not yet available in this online build.';$('numberPad').classList.add('hidden');}
 }
}
$('draftRoster').onclick=e=>{const b=e.target.closest('[data-id]');if(!b||b.disabled||!latest)return;socket.emit('draft:pick',Number(b.dataset.id));};
$('tossChoices').onclick=e=>{const b=e.target.closest('[data-toss]');if(b)socket.emit('toss:choose',b.dataset.toss);};
$('numberPad').onclick=e=>{const b=e.target.closest('[data-num]');if(!b||locked)return;socket.emit('number:lock',+b.dataset.num);locked=true;disableNumbers();$('matchStatus').textContent='Number locked. Waiting for your friend…';};
function disableNumbers(){[...$('numberPad').querySelectorAll('button')].forEach(b=>b.disabled=true);}
$('continueInn').onclick=()=>socket.emit('innings:continue');
})();
