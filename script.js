// ---------- CONFIG ----------
const MONEY_LADDER = [
  100, 200, 300, 500, 1000,       // easy (5 questions used)
  2000, 4000, 8000, 16000, 32000, // medium (5 questions used)
  64000, 125000, 250000, 500000, 1000000 // hard (5 questions used)
];

const QUESTIONS_PER_DIFFICULTY = 5; // 5 easy + 5 medium + 5 hard = 15 total per playthrough

// ---------- STATE ----------
let allQuestions = [];
let gameQuestions = [];
let currentIndex = 0;
let lifelineUsed = false;

// ---------- DOM ----------
const screens = {
  start: document.getElementById('start-screen'),
  game: document.getElementById('game-screen'),
  end: document.getElementById('end-screen'),
};

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const midRestartBtn = document.getElementById('mid-restart-btn');
const lifelineBtn = document.getElementById('lifeline-btn');
const questionText = document.getElementById('question-text');
const choicesContainer = document.getElementById('choices');
const difficultyBadge = document.getElementById('difficulty-badge');
const ladderEl = document.getElementById('ladder');
const endTitle = document.getElementById('end-title');
const endMessage = document.getElementById('end-message');
const finalAmount = document.getElementById('final-amount');

// ---------- HELPERS ----------
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatMoney(n) {
  return '₱' + n.toLocaleString('en-PH');
}

// ---------- LOAD QUESTIONS ----------
async function loadQuestions() {
  const res = await fetch('questions.json');
  allQuestions = await res.json();
}

// ---------- BUILD A RANDOMIZED GAME SET ----------
// Picks 5 easy + 5 medium + 5 hard questions, then shuffles the ORDER of all 15
// so difficulty is NOT locked to money amount — a hard question can appear
// even at question 1, and an easy one can appear near the end.
function buildGameQuestions() {
  const easy = shuffle(allQuestions.filter(q => q.difficulty === 'easy')).slice(0, QUESTIONS_PER_DIFFICULTY);
  const medium = shuffle(allQuestions.filter(q => q.difficulty === 'medium')).slice(0, QUESTIONS_PER_DIFFICULTY);
  const hard = shuffle(allQuestions.filter(q => q.difficulty === 'hard')).slice(0, QUESTIONS_PER_DIFFICULTY);
  gameQuestions = shuffle([...easy, ...medium, ...hard]);
}

// ---------- LADDER ----------
function renderLadder() {
  ladderEl.innerHTML = '';
  MONEY_LADDER.forEach((amount, i) => {
    const div = document.createElement('div');
    div.className = 'ladder-item';
    if (i === currentIndex) div.classList.add('current');
    else if (i < currentIndex) div.classList.add('passed');
    div.textContent = formatMoney(amount);
    ladderEl.appendChild(div);
  });
}

// ---------- RENDER QUESTION ----------
function renderQuestion() {
  const q = gameQuestions[currentIndex];
  questionText.textContent = q.question;
  difficultyBadge.textContent = q.difficulty.toUpperCase();

  choicesContainer.innerHTML = '';
  q.choices.forEach((choice, idx) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice;
    btn.addEventListener('click', () => handleAnswer(idx, btn));
    choicesContainer.appendChild(btn);
  });

  renderLadder();
}

// ---------- ANSWER HANDLING ----------
function handleAnswer(selectedIdx, btnEl) {
  const q = gameQuestions[currentIndex];
  const buttons = Array.from(choicesContainer.children);
  buttons.forEach(b => b.disabled = true);

  if (selectedIdx === q.correctIndex) {
    btnEl.classList.add('correct');
    setTimeout(() => {
      currentIndex++;
      if (currentIndex >= gameQuestions.length) {
        endGame(true);
      } else {
        renderQuestion();
      }
    }, 700);
  } else {
    btnEl.classList.add('wrong');
    buttons[q.correctIndex].classList.add('correct');
    setTimeout(() => endGame(false), 1200);
  }
}

// ---------- LIFELINE (50/50) ----------
function useLifeline() {
  if (lifelineUsed) return;
  lifelineUsed = true;
  lifelineBtn.disabled = true;

  const q = gameQuestions[currentIndex];
  const buttons = Array.from(choicesContainer.children);
  const wrongIndexes = [0, 1, 2, 3].filter(i => i !== q.correctIndex);
  const toHide = shuffle(wrongIndexes).slice(0, 2);

  toHide.forEach(i => buttons[i].classList.add('disabled-fade'));
}

// ---------- END GAME ----------
function endGame(won) {
  const wonAmount = won ? MONEY_LADDER[MONEY_LADDER.length - 1] : (currentIndex > 0 ? MONEY_LADDER[currentIndex - 1] : 0);

  if (won) {
    endTitle.textContent = '🎉 You are a Millionaire!';
    endMessage.textContent = 'You answered every question correctly!';
  } else {
    endTitle.textContent = '💀 Game Over';
    endMessage.textContent = 'That answer was incorrect. Better luck next time!';
  }

  finalAmount.textContent = formatMoney(wonAmount);
  showScreen('end');
}

// ---------- START / RESTART ----------
function startGame() {
  currentIndex = 0;
  lifelineUsed = false;
  lifelineBtn.disabled = false;
  buildGameQuestions();
  showScreen('game');
  renderQuestion();
}

// ---------- EVENTS ----------
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
lifelineBtn.addEventListener('click', useLifeline);
midRestartBtn.addEventListener('click', () => {
  if (confirm('Restart the game? Your current progress will be lost.')) {
    startGame();
  }
});

// ---------- INIT ----------
loadQuestions();
