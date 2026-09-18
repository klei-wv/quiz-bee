// ---------- CONFIG ----------
const MONEY_LADDER = [
  100, 200, 300, 500, 1000,       // easy (5 questions used)
  2000, 4000, 8000, 16000, 32000, // medium (5 questions used)
  64000, 125000, 250000, 500000, 1000000 // hard (5 questions used)
];

const QUESTIONS_PER_DIFFICULTY = 5; // 5 easy + 5 medium + 5 hard = 15 total per playthrough

const TIME_LIMITS = {
  easy: 20,
  medium: 40,
  hard: 60,
};

// ---------- STATE ----------
let allQuestions = [];
let gameQuestions = [];
let currentIndex = 0;
let timerInterval = null;
let timeLeft = 0;

// Lifelines: each usable ONCE per playthrough
let fiftyFiftyUsed = false;
let hintUsed = false;
let answerBoostUsed = false;
let answerBoostActive = false; // true only while armed for the CURRENT hard question

// ---------- DOM ----------
const screens = {
  start: document.getElementById('start-screen'),
  game: document.getElementById('game-screen'),
  end: document.getElementById('end-screen'),
};

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const midRestartBtn = document.getElementById('mid-restart-btn');
const midHomeBtn = document.getElementById('mid-home-btn');
const homeBtn = document.getElementById('home-btn');
const fiftyFiftyBtn = document.getElementById('fifty-fifty-btn');
const hintBtn = document.getElementById('hint-btn');
const answerBoostBtn = document.getElementById('answer-boost-btn');
const hintBox = document.getElementById('hint-box');
const questionText = document.getElementById('question-text');
const choicesContainer = document.getElementById('choices');
const difficultyBadge = document.getElementById('difficulty-badge');
const timerDisplay = document.getElementById('timer-display');
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

// ---------- TIMER ----------
function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTimer(difficulty) {
  clearTimer();
  timeLeft = TIME_LIMITS[difficulty];
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearTimer();
      handleTimeUp();
    }
  }, 1000);
}

function updateTimerDisplay() {
  timerDisplay.textContent = '⏱ ' + timeLeft;
  timerDisplay.classList.toggle('low', timeLeft <= 5);
}

function handleTimeUp() {
  const q = gameQuestions[currentIndex];
  const buttons = Array.from(choicesContainer.children);
  buttons.forEach(b => b.disabled = true);
  buttons[q.correctIndex].classList.add('correct');
  setTimeout(() => endGame(false), 1200);
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

  // Reset the hint box for the new question
  hintBox.textContent = '';
  hintBox.classList.remove('visible');

  // Answer Boost can only be armed on a HARD question, and only once per game
  answerBoostActive = false;
  answerBoostBtn.classList.remove('active');
  answerBoostBtn.disabled = answerBoostUsed || q.difficulty !== 'hard';

  renderLadder();
  startTimer(q.difficulty);
}

// ---------- ANSWER HANDLING ----------
function handleAnswer(selectedIdx, btnEl) {
  clearTimer();
  const q = gameQuestions[currentIndex];
  const buttons = Array.from(choicesContainer.children);
  buttons.forEach(b => b.disabled = true);

  if (selectedIdx === q.correctIndex) {
    btnEl.classList.add('correct');

    // If Answer Boost was armed on this hard question and it was answered
    // correctly, skip the next question entirely and keep moving.
    const boostTriggered = answerBoostActive;
    if (boostTriggered) {
      answerBoostUsed = true;
      answerBoostActive = false;
    }

    setTimeout(() => {
      currentIndex += boostTriggered ? 2 : 1;
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

// ---------- LIFELINE 1: 50/50 ----------
function useFiftyFifty() {
  if (fiftyFiftyUsed) return;
  fiftyFiftyUsed = true;
  fiftyFiftyBtn.disabled = true;

  const q = gameQuestions[currentIndex];
  const buttons = Array.from(choicesContainer.children);
  const wrongIndexes = [0, 1, 2, 3].filter(i => i !== q.correctIndex);
  const toHide = shuffle(wrongIndexes).slice(0, 2);

  toHide.forEach(i => buttons[i].classList.add('disabled-fade'));
}

// ---------- LIFELINE 2: HINT RESCUE ----------
// Gives a SUBTLE clue — never the answer itself. Reveals the first letter
// and word count of the correct choice so the player still has to think.
function useHint() {
  if (hintUsed) return;
  hintUsed = true;
  hintBtn.disabled = true;

  const q = gameQuestions[currentIndex];
  const correctText = q.choices[q.correctIndex];
  const firstLetter = correctText.trim().charAt(0).toUpperCase();
  const wordCount = correctText.trim().split(/\s+/).length;
  const wordLabel = wordCount === 1 ? 'one word' : `${wordCount} words`;

  hintBox.textContent = `💡 Hint: The correct answer starts with "${firstLetter}" and has ${wordLabel}.`;
  hintBox.classList.add('visible');
}

// ---------- LIFELINE 3: ANSWER BOOST ----------
// Only usable while the CURRENT question is HARD. Once armed, answering
// that hard question correctly lets you skip the next question for free.
function useAnswerBoost() {
  const q = gameQuestions[currentIndex];
  if (answerBoostUsed || q.difficulty !== 'hard' || answerBoostActive) return;

  answerBoostActive = true;
  answerBoostBtn.classList.add('active');
  answerBoostBtn.disabled = true;
}

// ---------- END GAME ----------
function endGame(won) {
  clearTimer();
  const wonAmount = won ? MONEY_LADDER[MONEY_LADDER.length - 1] : (currentIndex > 0 ? MONEY_LADDER[currentIndex - 1] : 0);

  if (won) {
    endTitle.textContent = 'Hail, Champion of the Quest';
    endMessage.textContent = 'A fortune fit for a monarch awaits thee!';
  } else {
    endTitle.textContent = 'The Quest Has Ended';
    endMessage.textContent = 'Return when thy wits are sharper, brave soul.';
  }

  finalAmount.textContent = formatMoney(wonAmount);
  showScreen('end');
}

// ---------- START / RESTART ----------
function startGame() {
  clearTimer();
  currentIndex = 0;

  fiftyFiftyUsed = false;
  hintUsed = false;
  answerBoostUsed = false;
  answerBoostActive = false;
  fiftyFiftyBtn.disabled = false;
  hintBtn.disabled = false;
  answerBoostBtn.disabled = true; // re-enabled per question if it's hard
  answerBoostBtn.classList.remove('active');

  buildGameQuestions();
  showScreen('game');
  renderQuestion();
}

// ---------- GO TO HOME ----------
function goToHome() {
  clearTimer();
  showScreen('start');
}

// ---------- EVENTS ----------
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
fiftyFiftyBtn.addEventListener('click', useFiftyFifty);
hintBtn.addEventListener('click', useHint);
answerBoostBtn.addEventListener('click', useAnswerBoost);
midRestartBtn.addEventListener('click', () => {
  if (confirm('Restart the game? Your current progress will be lost.')) {
    startGame();
  }
});
midHomeBtn.addEventListener('click', () => {
  if (confirm('Go to Home? Your current progress will be lost.')) {
    goToHome();
  }
});
homeBtn.addEventListener('click', goToHome);

// ---------- INIT ----------
loadQuestions();