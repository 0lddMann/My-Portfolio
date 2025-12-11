// Simple Tetris (vanilla JS) - playable, scores, next piece, keyboard controls
const arenaCols = 10;
const arenaRows = 20;
const scale = 24; // pixel size per block

const arenaCanvas = document.getElementById('arena');
arenaCanvas.width = arenaCols * scale;
arenaCanvas.height = arenaRows * scale;
const ctx = arenaCanvas.getContext('2d');

const nextCanvas = document.getElementById('next');
const nctx = nextCanvas.getContext('2d');

const scoreElem = document.getElementById('score');
const restartBtn = document.getElementById('restart');

function createMatrix(w,h){
  const m = [];
  while(h--) m.push(new Array(w).fill(0));
  return m;
}

const pieces = {
  T: [[0,1,0],[1,1,1]],
  O: [[1,1],[1,1]],
  L: [[0,0,1],[1,1,1]],
  J: [[1,0,0],[1,1,1]],
  I: [[1,1,1,1]],
  S: [[0,1,1],[1,1,0]],
  Z: [[1,1,0],[0,1,1]]
};
const colors = {
  0: '#000000',
  1: '#FFB86B',
  2: '#7b61ff',
  3: '#2dd4bf',
  4: '#ff6b6b',
  5: '#ffd76b',
  6: '#4facfe',
  7: '#d96bff'
};

function randomPiece(){
  const keys = Object.keys(pieces);
  return keys[Math.floor(Math.random()*keys.length)];
}

function drawMatrix(matrix, offset, ctxLocal, block=scale){
  for(let y=0;y<matrix.length;y++){
    for(let x=0;x<matrix[y].length;x++){
      const val = matrix[y][x];
      if(val){
        ctxLocal.fillStyle = colors[val];
        ctxLocal.fillRect((x+offset.x)*block, (y+offset.y)*block, block-1, block-1);
      }
    }
  }
}

function merge(arena, player){
  player.matrix.forEach((row,y)=>{
    row.forEach((val,x)=>{
      if(val){
        arena[y + player.pos.y][x + player.pos.x] = val;
      }
    });
  });
}

function collide(arena, player){
  const m = player.matrix;
  for(let y=0;y<m.length;y++){
    for(let x=0;x<m[y].length;x++){
      if(m[y][x] &&
        (arena[y + player.pos.y] && arena[y + player.pos.y][x + player.pos.x]) !== 0){
        return true;
      }
    }
  }
  return false;
}

function rotate(matrix, dir){
  for(let y=0;y<matrix.length;y++){
    for(let x=0;x<y;x++){
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if(dir>0) matrix.forEach(row=>row.reverse());
  else matrix.reverse();
}

function sweepRows(){
  let rowCount = 0;
  outer: for(let y=arena.length-1;y>=0;y--){
    for(let x=0;x<arena[y].length;x++){
      if(arena[y][x] === 0) continue outer;
    }
    const row = arena.splice(y,1)[0].fill(0);
    arena.unshift(row);
    y++;
    rowCount++;
  }
  if(rowCount){
    player.score += rowCount * 100;
  }
}

let arena = createMatrix(arenaCols, arenaRows);

const player = {
  pos: {x:0,y:0},
  matrix: null,
  next: null,
  score: 0
};

function createPieceMatrix(type){
  const shape = pieces[type];
  // map 1s to non-zero ids so we can color by id
  const id = Object.keys(pieces).indexOf(type) + 1;
  return shape.map(row => row.map(v => v ? id : 0));
}

function playerReset(){
  const type = player.next || randomPiece();
  player.matrix = createPieceMatrix(type);
  player.next = randomPiece();
  player.pos.y = 0;
  player.pos.x = Math.floor(arenaCols/2) - Math.floor(player.matrix[0].length/2);
  if(collide(arena, player)){
    arena.forEach(row => row.fill(0));
    player.score = 0;
  }
}

function playerDrop(){
  player.pos.y++;
  if(collide(arena, player)){
    player.pos.y--;
    merge(arena, player);
    sweepRows();
    playerReset();
    updateScore();
  }
  dropCounter = 0;
}

function playerMove(dir){
  player.pos.x += dir;
  if(collide(arena, player)){
    player.pos.x -= dir;
  }
}

function playerRotate(dir){
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while(collide(arena, player)){
    player.pos.x += offset;
    offset = -(offset + (offset>0?1:-1));
    if(offset > player.matrix[0].length){
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let paused = false;

function update(time=0){
  if(!paused){
    const delta = time - lastTime;
    lastTime = time;
    dropCounter += delta;
    if(dropCounter > dropInterval){
      playerDrop();
    }
    draw();
  }
  requestAnimationFrame(update);
}

function draw(){
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,arenaCanvas.width, arenaCanvas.height);

  // draw arena blocks
  for(let y=0;y<arena.length;y++){
    for(let x=0;x<arena[y].length;x++){
      const val = arena[y][x];
      if(val){
        ctx.fillStyle = colors[val];
        ctx.fillRect(x*scale, y*scale, scale-1, scale-1);
      } else {
        // subtle grid
        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        ctx.strokeRect(x*scale, y*scale, scale, scale);
      }
    }
  }
  // draw player piece
  drawMatrix(player.matrix, player.pos, ctx);
  // next piece
  nctx.fillStyle = '#000';
  nctx.fillRect(0,0,nextCanvas.width,nextCanvas.height);
  const nextScale = 20;
  const nx = {x:1,y:1};
  const m = createPieceMatrix(player.next);
  // center next piece canvas by offset
  const offset = { x: Math.floor((nextCanvas.width/nextScale - m[0].length)/2), y: Math.floor((nextCanvas.height/nextScale - m.length)/2) };
  drawMatrix(m, {x: offset.x, y: offset.y}, nctx, nextScale);
}

function updateScore(){
  scoreElem.innerText = player.score;
}

// controls
document.addEventListener('keydown', e=>{
  if(e.keyCode === 37) playerMove(-1);
  else if(e.keyCode === 39) playerMove(1);
  else if(e.keyCode === 40) { playerDrop(); }
  else if(e.keyCode === 38) { playerRotate(1); }
  else if(e.code === 'Space') {
    // hard drop
    while(!collide(arena, player)){
      player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    sweepRows();
    playerReset();
    updateScore();
  } else if(e.key === 'p' || e.key === 'P'){
    paused = !paused;
  }
});

restartBtn.addEventListener('click', ()=>{
  arena = createMatrix(arenaCols, arenaRows);
  player.score = 0;
  playerReset();
  updateScore();
});

// init
player.next = randomPiece();
playerReset();
updateScore();
update();