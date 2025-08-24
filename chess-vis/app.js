// ===== initial setup =====
const game = new Chess();
const board = Chessboard('board', {
  position: 'start',
  draggable: true,
  dropOffBoard: 'snapback',
  onDrop: onDrop,
});

function onDrop(source, target) {
  const move = game.move({ from: source, to: target, promotion: 'q' });
  if (!move) return 'snapback';
  clearColours();  // remove old highlights after every move
  return undefined;
}

// ===== buttons =====
document.getElementById('flipBtn')
        .onclick = () => board.flip();

document.getElementById('resetBtn')
        .onclick = () => { game.reset(); board.position('start'); clearColours(); };

document.getElementById('showCtrlBtn')
        .onclick = () => { colourControl(); this.disabled = true; 
                           document.getElementById('clearCtrlBtn').disabled = false; };

document.getElementById('clearCtrlBtn')
        .onclick = () => clearColours();

// ===== control-map logic =====
function colourControl() {
  const whiteCtrl = new Set(), blackCtrl = new Set();

  game.SQUARES.forEach(sq => {
    const attacksW = game.attacks(sq, 'w');
    const attacksB = game.attacks(sq, 'b');
    attacksW.forEach(t => whiteCtrl.add(t));
    attacksB.forEach(t => blackCtrl.add(t));
  });

  const squares = board.squares(); // all 64 DOM squares

  squares.forEach(domSq => {
    const square = domSq.dataset.square;
    const isW = whiteCtrl.has(square);
    const isB = blackCtrl.has(square);
    domSq.classList.remove('square-blue','square-red','square-purple');

    if (isW && isB)      domSq.classList.add('square-purple');
    else if (isW)        domSq.classList.add('square-blue');
    else if (isB)        domSq.classList.add('square-red');
  });
}

function clearColours() {
  document.querySelectorAll('.square-55d63')
          .forEach(el => el.classList.remove('square-blue','square-red','square-purple'));
  document.getElementById('showCtrlBtn').disabled = false;
  document.getElementById('clearCtrlBtn').disabled = true;
}

// helper: expose Chess.js attack squares
Chess.prototype.attacks = function(square, colour) {
  const moves = this.moves({ square, verbose:true });
  return moves.filter(m => m.color === colour).map(m => m.to);
};
