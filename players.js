// Shared fictional player roster for the browser and multiplayer server.
const HANDXI_PLAYERS=[
{id:1,name:"Virraatt Kolhi",role:"BATTER",r:96,n:"18",team:"RED TITANS",a:"#ff4b5c",t1:"#6a1530",t2:"#1a0914",skin:"#a96e4c",hair:"#15100e",hs:"short",beard:1,kit:"#d8233a",bat:97,bowl:48,sp:"Chase Master",ab:"Chasing a target? His runs count extra in the second innings."},
{id:2,name:"M.S. Dhonix",role:"ALL-ROUNDER",r:94,n:"07",team:"GOLD WARRIORS",a:"#ffc93d",t1:"#6b4a0c",t2:"#1c1507",skin:"#b77c56",hair:"#211b18",hs:"long",beard:0,kit:"#f0b800",bat:93,bowl:62,sp:"Finisher",ab:"Ice-cool under pressure in the final over."},
{id:3,name:"Rohitt Sharm",role:"BATTER",r:92,n:"45",team:"BLUE STORM",a:"#5aa0ff",t1:"#16407f",t2:"#0a1230",skin:"#b77a55",hair:"#191514",hs:"bald",beard:1,kit:"#1f5fd6",bat:95,bowl:35,sp:"Pull Shot",ab:"Sixes arrive in clusters once he settles."},
{id:4,name:"AB de Viller",role:"BATTER",r:93,n:"17",team:"ORANGE FIRE",a:"#ff9a3d",t1:"#7a3d12",t2:"#1f1008",skin:"#c58b67",hair:"#6b4a33",hs:"spiky",beard:0,kit:"#f07a12",bat:96,bowl:42,sp:"360° Vision",ab:"Scores freely to every part of the ground."},
{id:5,name:"Hardikk Pandyar",role:"ALL-ROUNDER",r:91,n:"33",team:"PURPLE KNIGHTS",a:"#c47bff",t1:"#59208a",t2:"#180a2b",skin:"#a86b4b",hair:"#161313",hs:"spiky",beard:1,kit:"#7a2fd0",bat:86,bowl:84,sp:"Power Hitter",ab:"Big hits with bat and big wickets with ball."},
{id:6,name:"Jaspreet Bumrahh",role:"BOWLER",r:95,n:"93",team:"CYAN BLAZE",a:"#3fe0f0",t1:"#0f5568",t2:"#071b26",skin:"#9c6548",hair:"#171312",hs:"long",beard:0,kit:"#0e9fb8",bat:30,bowl:97,sp:"Toe-Crusher",ab:"Deadly yorkers in the death overs."},
{id:7,name:"Ravindar Jadejaa",role:"BOWLER",r:90,n:"08",team:"GREEN FORCE",a:"#5ae38a",t1:"#17583a",t2:"#07201a",skin:"#b47a56",hair:"#201a17",hs:"short",beard:0,kit:"#12a350",bat:68,bowl:90,sp:"Spin Web",ab:"Tight lines choke the run flow."},
{id:8,name:"Surya Kumar Yadavv",role:"BATTER",r:91,n:"63",team:"SCARLET FOXES",a:"#ff7a66",t1:"#7a2a38",t2:"#210e18",skin:"#a66b4e",hair:"#17120f",hs:"short",beard:1,kit:"#e0433a",bat:92,bowl:30,sp:"Scoop Shot",ab:"Inventive strokes behind the wicket."},
{id:9,name:"Rashidd Khan",role:"BOWLER",r:89,n:"19",team:"DESERT FALCONS",a:"#e6c45a",t1:"#5c4a1a",t2:"#1b150a",skin:"#b47c59",hair:"#211a15",hs:"curly",beard:0,kit:"#c99a1e",bat:55,bowl:93,sp:"Googly King",ab:"Wrong'uns that fool even the best."}
,{id:10,name:"Mitchell Starkk",role:"BOWLER",r:92,n:"56",team:"EMERALD STRIKERS",a:"#4ee3b4",t1:"#0f5a4a",t2:"#06201b",skin:"#c58b67",hair:"#6b4a33",hs:"short",beard:1,kit:"#0fa07a",bat:28,bowl:94,sp:"Yorker Rocket",ab:"Left-arm pace that cracks open the stumps."}];

if (typeof module !== "undefined" && module.exports) module.exports = HANDXI_PLAYERS;
if (typeof window !== "undefined") window.HANDXI_PLAYERS = HANDXI_PLAYERS;
