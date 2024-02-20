import { Tetris } from "./tetris.js";
import { PLAYFIELD_COLUMNS, PLAYFIELD_ROWS, convertPositionToIndex, SAD } from "./utilities.js";
let hammer;
let requestId;
let timeoutId;
const tetris = new Tetris();
const cells = document.querySelectorAll('.grid>div');
let filterStrength = 20;
let frameTime = 0, lastLoop = new Date, thisLoop;
setInterval(gameLoop, 10)
function gameLoop(){
  // ...
  var thisFrameTime = (thisLoop=new Date) - lastLoop;
  frameTime+= (thisFrameTime - frameTime) / filterStrength;
  lastLoop = thisLoop;
}
setInterval(function() {
  let fps = (1000/frameTime).toFixed(1) + " fps"
  console.log(fps)
}, 1000)
initKeydown();
initTouch();
moveDown();
function initKeydown() {
  document.addEventListener('keydown', onKeydown);
}
function onKeydown(event) {
  switch (event.code) {
    case 'KeyW':
      rotate();
      break;
    case 'KeyS':
      moveDown()
      break;
    case 'KeyA':
      moveLeft()
      break;
    case 'KeyD':
      moveRight();
      break;
    case 'Space':
      dropDown();
      break;
    case "KeyP":
        if (timeoutId) {
            stopLoop()
        } else {
            startLoop()
        }
        break
    case "KeyR":
      location.reload()
      break 
    default:
      return;
  }
}
function initTouch() {
  document.addEventListener('dblclick', (event) => {
    event.preventDefault();
  });
  hammer = new Hammer(document.querySelector('body'));
  hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
  hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
  const threshold = 30;
  let deltaX = 0;
  let deltaY = 0;
  hammer.on('panstart', () => {
    deltaX = 0;
    deltaY = 0;
  });
  hammer.on('panleft', (event) => {
    if (Math.abs(event.deltaX - deltaX) > threshold) {
      moveLeft()
      deltaX = event.deltaX;
      deltaY = event.deltaY;
    }
  });
  hammer.on('panright', (event) => {
    if (Math.abs(event.deltaX - deltaX) > threshold) {
      moveRight();
      deltaX = event.deltaX;
      deltaY = event.deltaY;
    }
  });
  hammer.on('pandown', (event) => {
    if (Math.abs(event.deltaY - deltaY) > threshold) {
      moveDown();
      deltaX = event.deltaX;
      deltaY = event.deltaY;
    }
  });
  hammer.on('swipedown', (event) => {
    dropDown();
  });
  hammer.on('tap', () => {
    rotate();
  });
};
function moveDown() {
  tetris.moveTetrominoDown();
  draw();
  stopLoop();
  startLoop();
  if (tetris.isRemovedLive) {
    tetris.lives -= 1
    console.log(tetris.lives)
    for (let i = 0; i < 20; i++) {
      tetris.dropRowsAbove(i)
    }
    const livesDisplay = document.querySelector('#lives')
    livesDisplay.innerHTML = tetris.lives
    tetris.isRemovedLive = false 
    if (tetris.lives === 0) {
      gameOver()
    }
  }
  setInterval(tetris.timer(), 1000)
  if (tetris.isGameOver) {
    gameOver()
  }
}
function moveLeft() {
  tetris.moveTetrominoLeft();
  draw();
}
function moveRight() {
  tetris.moveTetrominoRight();
  draw();
}
function rotate() {
  tetris.rotateTetromino();
  draw();
}
function dropDown() {
  tetris.dropTetrominoDown();
  draw();
  stopLoop();
  startLoop();
  if (tetris.RemovedLive) {
    tetris.lives -= 1
    console.log(tetris.lives)
    for (let i = 0; i < 20; i++) {
      tetris.dropRowsAbove(i)
    }
    const livesDisplay = document.querySelector('#lives')
    livesDisplay.innerHTML = tetris.lives
    tetris.isRemovedLive = false 
    if (tetris.lives === 0) {
      gameOver()
    }
  }
  tetris.timer()
  if (tetris.isGameOver) {
    gameOver()
  }
}
function startLoop() {
  timeoutId = setTimeout(() => requestId = requestAnimationFrame(moveDown), 700);
}
function stopLoop() {
  cancelAnimationFrame(requestId);
  clearTimeout(timeoutId);
}
function draw() {
  cells.forEach(cell => cell.removeAttribute('class'));
  drawPlayfield();
  drawTetromino();
  drawGhostTetromino();
}
function drawPlayfield() {
  for (let row = 0; row < PLAYFIELD_ROWS; row++) {
    for (let column = 0; column < PLAYFIELD_COLUMNS; column++) {
      if (!tetris.playfield[row][column]) continue;
      const name = tetris.playfield[row][column];
      const cellIndex = convertPositionToIndex(row, column);
      cells[cellIndex].classList.add(name);
    }
  }
}
function drawTetromino() {
  const name = tetris.tetromino.name;
  const tetrominoMatrixSize = tetris.tetromino.matrix.length;
  for (let row = 0; row < tetrominoMatrixSize; row++) {
    for (let column = 0; column < tetrominoMatrixSize; column++) {
      if (!tetris.tetromino.matrix[row][column]) continue;
      if (tetris.tetromino.row + row < 0) continue;
      const cellIndex = convertPositionToIndex(tetris.tetromino.row + row, tetris.tetromino.column + column);
      cells[cellIndex].classList.add(name);
    }
  }
}
function drawGhostTetromino() {
  const tetrominoMatrixSize = tetris.tetromino.matrix.length;
  for (let row = 0; row < tetrominoMatrixSize; row++) {
    for (let column = 0; column < tetrominoMatrixSize; column++) {
      if (!tetris.tetromino.matrix[row][column]) continue;
      if (tetris.tetromino.ghostRow + row < 0) continue;
      const cellIndex = convertPositionToIndex(tetris.tetromino.ghostRow + row, tetris.tetromino.ghostColumn + column);
      cells[cellIndex].classList.add('ghost');
    }
  }
}
function gameOver() {
  stopLoop();
  document.removeEventListener('keydown', onKeydown);
  hammer.off('panstart panleft panright pandown swipedown tap');
  gameOverAnimation();
}
function gameOverAnimation() {
  const filledCells = [...cells].filter(cell => cell.classList.length > 0);
  filledCells.forEach((cell, i) => {
    setTimeout(() => cell.classList.add('hide'), i * 10);
    setTimeout(() => cell.removeAttribute('class'), i * 10 + 500);
  });
  setTimeout(drawSad, filledCells.length * 10 + 1000);
}
function drawSad() {
  const TOP_OFFSET = 5;
  for (let row = 0; row < SAD.length; row++) {
    for (let column = 0; column < SAD[0].length; column++) {
      if (!SAD[row][column]) continue;
      const cellIndex = convertPositionToIndex(TOP_OFFSET + row, column);
      cells[cellIndex].classList.add('sad');
    }
  }
}