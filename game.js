// ================================
//  오목 게임 로직 (Gomoku Game)
// ================================

const GRID_SIZE  = 15;         // 15x15 격자
const CELL_SIZE  = 38;         // 셀 크기(px)
const MARGIN     = 20;         // 여백
const STONE_R    = 16;         // 돌 반지름
const BLACK      = 1;
const WHITE      = 2;

let board        = [];         // 2D 배열: 0=empty, 1=black, 2=white
let currentPlayer = BLACK;
let gameOver     = false;
let moveHistory  = [];         // [{row,col,player}]
let scores       = { [BLACK]: 0, [WHITE]: 0 };
let hoverPos     = null;       // 마우스 호버 위치

const canvas  = document.getElementById('omok-board');
const ctx     = canvas.getContext('2d');

// ─────────────────────────────
//  초기화
// ─────────────────────────────
function initBoard() {
  board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
  currentPlayer = BLACK;
  gameOver = false;
  moveHistory = [];
  hoverPos = null;
  updateUI();
  drawBoard();
}

// ─────────────────────────────
//  UI 업데이트
// ─────────────────────────────
function updateUI() {
  const statusEl = document.getElementById('status-text');
  if (!gameOver) {
    statusEl.textContent = currentPlayer === BLACK ? '흑돌 차례입니다' : '백돌 차례입니다';
  }

  const blackCard = document.getElementById('player-black-card');
  const whiteCard = document.getElementById('player-white-card');
  blackCard.classList.toggle('active', currentPlayer === BLACK && !gameOver);
  whiteCard.classList.toggle('active', currentPlayer === WHITE && !gameOver);
}

// ─────────────────────────────
//  캔버스 그리기
// ─────────────────────────────
function drawBoard() {
  const cw = canvas.width;
  const ch = canvas.height;

  // 배경
  ctx.clearRect(0, 0, cw, ch);

  // 격자 그라데이션 배경
  const bgGrad = ctx.createLinearGradient(0, 0, cw, ch);
  bgGrad.addColorStop(0, '#1e1b4b');
  bgGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = bgGrad;
  roundRect(ctx, 0, 0, cw, ch, 12);
  ctx.fill();

  // 격자선
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;

  for (let i = 0; i < GRID_SIZE; i++) {
    const x = MARGIN + i * CELL_SIZE;
    const y = MARGIN + i * CELL_SIZE;
    // 수직선
    ctx.beginPath();
    ctx.moveTo(x, MARGIN);
    ctx.lineTo(x, MARGIN + (GRID_SIZE - 1) * CELL_SIZE);
    ctx.stroke();
    // 수평선
    ctx.beginPath();
    ctx.moveTo(MARGIN, y);
    ctx.lineTo(MARGIN + (GRID_SIZE - 1) * CELL_SIZE, y);
    ctx.stroke();
  }

  // 별점 (star points)
  const starPoints = [
    [3,3],[3,7],[3,11],
    [7,3],[7,7],[7,11],
    [11,3],[11,7],[11,11]
  ];
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (const [r, c] of starPoints) {
    ctx.beginPath();
    ctx.arc(MARGIN + c * CELL_SIZE, MARGIN + r * CELL_SIZE, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 호버 미리보기
  if (hoverPos && !gameOver) {
    const { row, col } = hoverPos;
    if (board[row][col] === 0) {
      const cx = MARGIN + col * CELL_SIZE;
      const cy = MARGIN + row * CELL_SIZE;
      ctx.beginPath();
      ctx.arc(cx, cy, STONE_R, 0, Math.PI * 2);
      ctx.fillStyle = currentPlayer === BLACK
        ? 'rgba(30,30,60,0.45)'
        : 'rgba(240,240,240,0.35)';
      ctx.fill();
    }
  }

  // 돌 그리기
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] !== 0) {
        drawStone(r, c, board[r][c]);
      }
    }
  }

  // 마지막 착수 표시
  if (moveHistory.length > 0) {
    const last = moveHistory[moveHistory.length - 1];
    const lx = MARGIN + last.col * CELL_SIZE;
    const ly = MARGIN + last.row * CELL_SIZE;
    ctx.beginPath();
    ctx.arc(lx, ly, 5, 0, Math.PI * 2);
    ctx.fillStyle = last.player === BLACK ? 'rgba(167,139,250,0.9)' : 'rgba(99,102,241,0.9)';
    ctx.fill();
  }
}

function drawStone(row, col, player) {
  const cx = MARGIN + col * CELL_SIZE;
  const cy = MARGIN + row * CELL_SIZE;
  const r  = STONE_R;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);

  if (player === BLACK) {
    const grad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
    grad.addColorStop(0, '#5a5a8a');
    grad.addColorStop(0.5, '#1c1c36');
    grad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = grad;
  } else {
    const grad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.35, r*0.1, cx, cy, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.6, '#e0e0ef');
    grad.addColorStop(1, '#b0b0c8');
    ctx.fillStyle = grad;
  }

  ctx.fill();

  // 테두리
  ctx.strokeStyle = player === BLACK ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 광택 하이라이트
  ctx.beginPath();
  ctx.arc(cx - r*0.28, cy - r*0.30, r*0.32, 0, Math.PI * 2);
  ctx.fillStyle = player === BLACK
    ? 'rgba(255,255,255,0.12)'
    : 'rgba(255,255,255,0.45)';
  ctx.fill();
}

// ─────────────────────────────
//  승리 체크
// ─────────────────────────────
function checkWin(row, col, player) {
  const directions = [[0,1],[1,0],[1,1],[1,-1]];

  for (const [dr, dc] of directions) {
    let count = 1;
    const cells = [[row, col]];

    // 정방향
    for (let i = 1; i < 5; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE || board[r][c] !== player) break;
      count++;
      cells.push([r, c]);
    }

    // 역방향
    for (let i = 1; i < 5; i++) {
      const r = row - dr * i, c = col - dc * i;
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE || board[r][c] !== player) break;
      count++;
      cells.push([r, c]);
    }

    if (count >= 5) {
      return cells;
    }
  }

  return null;
}

// ─────────────────────────────
//  무승부 체크
// ─────────────────────────────
function checkDraw() {
  return board.every(row => row.every(cell => cell !== 0));
}

// ─────────────────────────────
//  착수
// ─────────────────────────────
function placeStone(row, col) {
  if (gameOver || board[row][col] !== 0) return;

  board[row][col] = currentPlayer;
  moveHistory.push({ row, col, player: currentPlayer });

  drawBoard();

  const winCells = checkWin(row, col, currentPlayer);
  if (winCells) {
    gameOver = true;
    scores[currentPlayer]++;
    document.getElementById('score-black').textContent = scores[BLACK];
    document.getElementById('score-white').textContent = scores[WHITE];
    highlightWin(winCells);
    setTimeout(() => showWinModal(currentPlayer), 500);
    return;
  }

  if (checkDraw()) {
    gameOver = true;
    document.getElementById('status-text').textContent = '무승부입니다!';
    return;
  }

  currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
  updateUI();
}

// ─────────────────────────────
//  승리 돌 하이라이트
// ─────────────────────────────
function highlightWin(cells) {
  for (const [r, c] of cells) {
    const cx = MARGIN + c * CELL_SIZE;
    const cy = MARGIN + r * CELL_SIZE;

    ctx.beginPath();
    ctx.arc(cx, cy, STONE_R + 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, STONE_R + 7, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// ─────────────────────────────
//  승리 모달
// ─────────────────────────────
function showWinModal(player) {
  const overlay  = document.getElementById('win-modal');
  const stoneEl  = document.getElementById('modal-stone');
  const titleEl  = document.getElementById('modal-title');
  const msgEl    = document.getElementById('modal-msg');

  stoneEl.className = 'modal-stone ' + (player === BLACK ? 'black' : 'white');
  titleEl.textContent = '승리!';
  msgEl.textContent   = (player === BLACK ? '흑돌' : '백돌') + '이 승리했습니다! 🎉';

  document.getElementById('status-text').textContent = (player === BLACK ? '흑돌' : '백돌') + ' 승리!';

  overlay.classList.add('show');
}

function closeModalAndRestart() {
  document.getElementById('win-modal').classList.remove('show');
  initBoard();
}

// ─────────────────────────────
//  무르기
// ─────────────────────────────
function undoMove() {
  if (moveHistory.length === 0 || gameOver) return;
  const last = moveHistory.pop();
  board[last.row][last.col] = 0;
  currentPlayer = last.player;
  updateUI();
  drawBoard();
}

// ─────────────────────────────
//  새 게임
// ─────────────────────────────
function restartGame() {
  document.getElementById('win-modal').classList.remove('show');
  initBoard();
}

// ─────────────────────────────
//  마우스 이벤트
// ─────────────────────────────
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top)  * scaleY;

  const col = Math.round((x - MARGIN) / CELL_SIZE);
  const row = Math.round((y - MARGIN) / CELL_SIZE);

  if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
    hoverPos = { row, col };
  } else {
    hoverPos = null;
  }

  drawBoard();
});

canvas.addEventListener('mouseleave', () => {
  hoverPos = null;
  drawBoard();
});

canvas.addEventListener('click', (e) => {
  if (gameOver) return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top)  * scaleY;

  const col = Math.round((x - MARGIN) / CELL_SIZE);
  const row = Math.round((y - MARGIN) / CELL_SIZE);

  if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
    placeStone(row, col);
  }
});

// 터치 지원
canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  if (gameOver) return;
  const touch = e.changedTouches[0];
  const rect  = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (touch.clientX - rect.left) * scaleX;
  const y = (touch.clientY - rect.top)  * scaleY;
  const col = Math.round((x - MARGIN) / CELL_SIZE);
  const row = Math.round((y - MARGIN) / CELL_SIZE);
  if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
    placeStone(row, col);
  }
}, { passive: false });

// ─────────────────────────────
//  유틸
// ─────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─────────────────────────────
//  게임 시작
// ─────────────────────────────
initBoard();
