export function createGame(){return {board:Array(9).fill(null),turn:'X',cheats:{X:2,O:2},winner:null,draw:false};}
export function wins(board){const found=new Set();for(const [a,b,c] of [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]])if(board[a]&&board[a]===board[b]&&board[a]===board[c])found.add(board[a]);return [...found];}
export function move(s,action){if(s.winner||s.draw)return false;const {type,index,a,b}=action;const valid=i=>Number.isInteger(i)&&i>=0&&i<9;
if(type==='place'){if(!valid(index)||s.board[index])return false;s.board[index]=s.turn;}
else if(type==='erase'){if(!valid(index)||s.cheats[s.turn]<2||!s.board[index]||s.board[index]===s.turn)return false;s.board[index]=null;s.cheats[s.turn]-=2;}
else if(type==='swap'){if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>2||b>2||a===b||s.cheats[s.turn]<1)return false;for(let r=0;r<3;r++){let i=r*3+a,j=r*3+b;[s.board[i],s.board[j]]=[s.board[j],s.board[i]];}s.cheats[s.turn]--;}
else return false;
const winners=wins(s.board);if(winners.length===1)s.winner=winners[0];else if(winners.length>1)s.draw=true;
// A full board remains playable if the next player can erase an opponent mark.
const next=s.turn==='X'?'O':'X';if(!s.winner&&!s.draw&&s.board.every(Boolean)&&!(s.cheats[next]>=2&&s.board.some(x=>x!==next)))s.draw=true;s.turn=next;return true;}
