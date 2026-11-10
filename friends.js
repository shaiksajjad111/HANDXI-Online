(()=>{
const $=id=>document.getElementById(id),socket=io();
let seat=null,room=null,latest=null,locked=false,filterRole='ALL',clockLoop=null;
const panels=['connectPanel','lobbyPanel','draftPanel','tossPanel','matchPanel'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function show(id){panels.forEach(x=>$(x).classList.toggle('hidden',x!==id));}
function status(t){$('globalStatus').textContent=t;}
function err(t){status(t);}
function stopClock(){if(clockLoop){clearInterval(clockLoop);clockLoop=null;}}
function startClock(deadline){
 stopClock();const tick=()=>{const left=Math.max(0,(deadline-Date.now())/1000);$('clockNum').textContent=Math.ceil(left);$('clockBar').style.transform=`scaleX(${left/7})`;if(left<=0)stopClock();};
 tick();clockLoop=setInterval(tick,100);
}
function portrait(p){
 const skin=p.skin||'#b77a55',hair=p.hair||'#17120f',kit=p.kit||p.a;
 return `<svg class="portrait" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
 <defs><linearGradient id="k${p.id}" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${kit}"/><stop offset="1" stop-color="#080b16"/></linearGradient><linearGradient id="s${p.id}" x1="0" x2="1"><stop stop-color="#f0c29b"/><stop offset="1" stop-color="${skin}"/></linearGradient></defs>
 <ellipse cx="150" cy="384" rx="115" ry="13" fill="#0008"/>
 <path d="M25 400Q28 285 94 252L206 252Q272 285 275 400Z" fill="url(#k${p.id})" stroke="${p.a}" stroke-width="5"/>
 <path d="M108 234V278Q150 302 192 278V234Z" fill="url(#s${p.id})"/>
 <ellipse cx="150" cy="165" rx="58" ry="78" fill="url(#s${p.id})"/>
 <path d="${p.hs==='spiky'?'M94 145L88 88L119 110L127 68L151 102L175 68L184 111L211 91L206 151Q183 105 150 112Q116 105 94 145Z':p.hs==='long'?'M94 160Q75 65 150 74Q225 65 206 160L196 240L181 165Q150 115 119 165L104 240Z':p.hs==='curly'?'M94 135Q86 76 124 79Q146 53 170 79Q211 70 207 138Q182 112 150 112Q119 112 94 135Z':'M94 145Q91 77 150 78Q209 77 206 145Q181 112 150 112Q119 112 94 145Z'}" fill="${hair}"/>
 <path d="M118 165Q132 155 143 165M157 165Q169 155 183 165" stroke="#211712" stroke-width="6" fill="none" stroke-linecap="round"/>
 <ellipse cx="132" cy="179" rx="7" ry="5" fill="#fff"/><ellipse cx="169" cy="179" rx="7" ry="5" fill="#fff"/><circle cx="133" cy="179" r="3" fill="#211712"/><circle cx="170" cy="179" r="3" fill="#211712"/>
 <path d="M150 181L143 207Q150 212 158 207" stroke="#8c5542" stroke-width="4" fill="none"/><path d="M132 224Q150 235 168 224" stroke="#713c36" stroke-width="5" fill="none"/>
 ${p.beard?`<path d="M111 210Q116 264 150 267Q184 264 189 210Q176 237 150 235Q124 237 111 210Z" fill="${hair}" opacity=".95"/>`:''}
 <path d="M105 285Q150 325 195 285" stroke="#fff" stroke-opacity=".25" stroke-width="8" fill="none"/>
 </svg>`;
}
function card(p,mode='pick',disabled=false,tag=''){
 const role=p.role==='ALL-ROUNDER'?'AR':p.role.slice(0,3);
 return `<article class="fcard ${mode==='taken'?'taken':''} ${mode==='mine'?'mine':''} ${disabled?'disabled':''}" data-id="${p.id}" style="--a:${p.a};--t1:${p.t1};--t2:${p.t2}">
 <div class="frame"><div class="face"><svg class="stadium-art" viewBox="0 0 300 400" preserveAspectRatio="none"><defs><linearGradient id="bg${p.id}" x2="0" y2="1"><stop stop-color="${p.t1}"/><stop offset="1" stop-color="${p.t2}"/></linearGradient></defs><rect width="300" height="400" fill="url(#bg${p.id})"/><circle cx="150" cy="190" r="115" fill="${p.a}" opacity=".18"/><path d="M0 285Q150 235 300 285V400H0Z" fill="#050914" opacity=".75"/><path d="M25 0L100 300H0Z M275 0L200 300H300Z" fill="#fff" opacity=".06"/></svg>
 ${portrait(p)}<div class="rating">${p.r}<small>${role}</small></div><svg class="crest" viewBox="0 0 40 46"><path d="M20 2L38 9V26Q38 38 20 44Q2 38 2 26V9Z" fill="${p.t1}" stroke="${p.a}" stroke-width="3"/><path d="M12 14v18M28 14v18M12 23h16" stroke="#fff" stroke-width="4"/></svg>
 <div class="cardname"><div class="nm">${esc(p.name)}</div><div class="team">${esc(p.team)} · #${esc(p.n)}</div><div class="stats"><span>BAT <b>${p.bat}</b></span><span>BWL <b>${p.bowl}</b></span><span>OVR <b>${p.r}</b></span></div></div>
 </div></div>${tag?`<span class="picktag">${esc(tag)}</span>`:''}</article>`;
}
function playerName(r,id){for(const t of (r.teams||[]))for(const p of t.players)if(p.id===id)return p.name;return 'Batter';}
function teamPlayer(r,id){for(const t of (r.teams||[]))for(const p of t.players)if(p.id===id)return p;return null;}
function seatName(r,i){return r.players?.[i]?.name||`Player ${i+1}`;}
function roleLabel(role){return role==='ALL-ROUNDER'?'ALL-ROUNDER':role+'S';}
socket.on('connect',()=>status('Connected to HANDXI server. Create or join a room.'));
socket.on('connect_error',()=>status('Cannot connect to game server. Refresh and try again.'));
socket.on('room:error',err);
socket.on('room:joined',d=>{room=d.code;seat=d.seat;$('codeView').textContent=room;show('lobbyPanel');status(`Joined room ${room} as Player ${seat+1}.`);});
socket.on('room:update',renderRoom);
socket.on('ball:result',r=>{renderRoom(r);stopClock();if(r.lastBall)showBall(r.lastBall,r);});
socket.on('number:locked',d=>{if(!latest)return;const label=d.seat===seat?'Your choice is locked.':'Opponent has locked their choice.';$('matchStatus').textContent=label;locked=d.seat===seat;if(locked)disableNumbers();});
socket.on('room:opponent-left',()=>{stopClock();status('Your opponent disconnected. The current turn has been paused.');});
$('createRoom').onclick=()=>socket.emit('room:create',{name:$('playerName').value.trim()||'Player'});
$('joinRoom').onclick=()=>socket.emit('room:join',{code:$('roomCode').value.trim().toUpperCase(),name:$('playerName').value.trim()||'Player'});
function renderRoom(r){
 latest=r;
 if(r.phase==='lobby'){
  show('lobbyPanel');$('joinedCount').textContent=`${r.players.filter(Boolean).length}/2`;
  $('lobbyStatus').textContent=`Room ${r.code}: ${r.players.filter(Boolean).length}/2 players connected. Share the code and wait for your friend.`;return;
 }
 if(r.phase==='draft'){
  stopClock();show('draftPanel');
  const first=r.draftFirst,turn=r.draftTurn,expected=turn%2===0?first:1-first,role=r.draftRole;
  $('draftTitle').textContent='Choose your match stars';
  $('draftInfo').textContent=`${seatName(r,first)} won the draft toss · Batters first (2 each), then all-rounders (1 each), then bowlers (2 each).`;
  $('draftTurn').textContent=turn>=10?'Draft complete':`${seatName(r,expected)}'s turn · Pick ${turn+1}/10 · ${roleLabel(role)}${seat===expected?' — YOUR PICK':''}`;
  const mine=(r.drafted?.[seat]||[]).length;$('pickCount').textContent=`${mine}/5`;
  const used=new Set((r.drafted||[]).flat());
  const list=HANDXI_PLAYERS.filter(p=>filterRole==='ALL'||p.role===filterRole);
  $('draftRoster').innerHTML=list.map(p=>{
   const taken=used.has(p.id),right=p.role===role,canPick=seat===expected&&!taken&&right;
   return card(p,taken?(r.drafted?.[seat]||[]).includes(p.id)?'mine':'taken':'pick',!canPick,taken?(r.drafted?.[seat]||[]).includes(p.id)?'YOUR PICK':'DRAFTED':right?'AVAILABLE':`WAIT · ${roleLabel(role)}`);
  }).join('');
  return;
 }
 if(r.phase==='match-toss'){
  stopClock();show('tossPanel');$('tossTitle').textContent=`${seatName(r,r.tossWinner)} won the match toss!`;
  $('tossInfo').textContent=seat===r.tossWinner?'Choose whether your team bats or bowls first.':'Waiting for the toss winner to choose bat or bowl.';
  document.querySelectorAll('[data-toss]').forEach(b=>b.classList.toggle('hidden',seat!==r.tossWinner));return;
 }
 if(['playing','innings-break','finished','tie'].includes(r.phase)){
  show('matchPanel');const m=r.state;
  $('inningsLabel').textContent=m.part===1?'1ST INNINGS':'2ND INNINGS';
  $('myTeam').textContent=seatName(r,seat);$('opTeam').textContent=seatName(r,1-seat);
  $('score').textContent=m.runs;$('wickets').textContent=m.wk;
  $('overText').textContent=`${Math.floor(m.balls/6)}.${m.balls%6} OVERS`;
  const batSeat=m.bat,batter=teamPlayer(r,m.batter),bowler=teamPlayer(r,m.bowler);
  $('batterCard').innerHTML=batter?card(batter,'pick',true,batSeat===seat?'YOUR BATTER':'OPPONENT BATTER'):'';
  $('bowlerCard').innerHTML=bowler?card(bowler,'pick',true,batSeat!==seat?'YOUR BOWLER':'OPPONENT BOWLER'):'';
  const myRole=seat===batSeat?'batting':'bowling';
  $('matchStatus').textContent=r.phase==='playing'?(myRole==='batting'?'You are batting — choose the runs you want to score.':'You are bowling — choose a number to challenge the batter.'):'';
  $('numberPad').innerHTML=[1,2,3,4,5,6].map(n=>`<button data-num="${n}">${n}</button>`).join('');
  const battingTurn=seat===batSeat;
  const legal=battingTurn?HANDXI_PLAYERS.find(p=>p.id===Number(String(m.batter).split('-').pop())):null;
  const sixLimit=legal?({BATTER:8,'ALL-ROUNDER':5,BOWLER:2}[legal.role]):99;
  const stat=m.stats?.[m.batter];
  [...$('numberPad').querySelectorAll('button')].forEach(b=>{if(b.dataset.num==='6'&&battingTurn&&stat&&stat.sixes>=sixLimit)b.disabled=true;});
  locked=!!r.picksLocked?.[seat]||r.phase!=='playing';
  if(locked||r.phase!=='playing')disableNumbers();
  else enableNumbers();
  $('numberPad').classList.toggle('hidden',r.phase!=='playing');
  if(r.phase==='playing'&&r.turnDeadline){startClock(r.turnDeadline);$('clockHint').textContent=r.picksLocked?.[seat]?'Your number is locked — waiting for your opponent.':'Both players have 7 seconds to lock their choice.';}
  else stopClock();
  if(r.phase==='innings-break'){$('matchStatus').textContent=`Innings complete. Target: ${m.target}.`;$('continueInn').classList.remove('hidden');}
  else $('continueInn').classList.add('hidden');
  if(r.phase==='finished'){$('matchStatus').textContent=`Match finished. ${r.players[m.winner]?.name||'A team'} won!`;$('numberPad').classList.add('hidden');}
  if(r.phase==='tie'){$('matchStatus').textContent='Scores are tied. Super Over is not yet available in this online build.';$('numberPad').classList.add('hidden');}
  if(r.lastBall)showBall(r.lastBall,r);
 }
}
function showBall(b,r){
 let text;
 if(b.reason==='batter-timeout'||b.type==='dot')text='TIME OUT — DOT BALL. Batter did not select in 7 seconds.';
 else if(b.reason==='bowler-timeout')text=`BOWLER TIME OUT — ${b.runs} RUN${b.runs===1?'':'S'} AWARDED TO THE BATTER.`;
 else if(b.type==='out')text=`WICKET! Both selected ${b.bat}.`;
 else if(b.type==='life')text=`LIFE LOST — both selected ${b.bat}.`;
 else text=`${playerName(r,b.batter)} scored ${b.runs}.`;
 $('lastBall').textContent=text;
}
function disableNumbers(){[...$('numberPad').querySelectorAll('button')].forEach(b=>b.disabled=true);}
function enableNumbers(){[...$('numberPad').querySelectorAll('button')].forEach(b=>b.disabled=false);}
$('draftFilters').onclick=e=>{const b=e.target.closest('[data-role]');if(!b)return;filterRole=b.dataset.role;document.querySelectorAll('#draftFilters button').forEach(x=>x.classList.toggle('on',x===b));if(latest)renderRoom(latest);};
$('draftRoster').onclick=e=>{const b=e.target.closest('[data-id]');if(!b||b.classList.contains('disabled')||b.classList.contains('taken')||!latest)return;socket.emit('draft:pick',Number(b.dataset.id));};
document.querySelectorAll('[data-toss]').forEach(b=>b.onclick=()=>socket.emit('toss:choose',b.dataset.toss));
$('numberPad').onclick=e=>{const b=e.target.closest('[data-num]');if(!b||b.disabled||locked)return;socket.emit('number:lock',+b.dataset.num);locked=true;disableNumbers();$('matchStatus').textContent='Your number is locked. Waiting for your opponent…';};
$('continueInn').onclick=()=>socket.emit('innings:continue');
})();