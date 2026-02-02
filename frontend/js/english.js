// english.js
import { api } from './api.js';

export async function initEnglish() {
    loadWord();
    loadQuiz();

    document.getElementById('next-word-btn').addEventListener('click', loadWord);
    document.getElementById('next-quiz-btn').addEventListener('click', loadQuiz);
}

async function loadWord() {
    try {
        const word = await api.getEnglishWord();
        renderWord(word);
    } catch (e) {
        console.error("Word load failed", e);
    }
}

function renderWord(data) {
    if (!data) return;

    document.getElementById('english-word').textContent = data.word;
    document.getElementById('english-phonetic').textContent = data.phonetic || "";
    document.getElementById('english-meaning').textContent = data.meaning_ja;
    document.getElementById('english-example').textContent = data.example || "No example available.";
    document.getElementById('english-definition').textContent = data.definition || "No definition available.";

    const audioBtn = document.getElementById('play-audio-btn');
    if (data.audio) {
        audioBtn.classList.remove('hidden');
        audioBtn.onclick = () => {
            const audio = new Audio(data.audio);
            audio.play();
        };
    } else {
        audioBtn.classList.add('hidden');
    }
}

async function loadQuiz() {
    try {
        const quiz = await api.getEnglishQuiz();
        renderQuiz(quiz);
    } catch (e) {
        console.error("Quiz load failed", e);
    }
}

function renderQuiz(data) {
    if (!data) return;

    document.getElementById('quiz-question').textContent = data.question;

    const exampleEl = document.getElementById('quiz-example');
    if (data.example) {
        exampleEl.textContent = `"${data.example}"`;
        exampleEl.classList.remove('hidden');
    } else {
        exampleEl.classList.add('hidden');
    }

    const container = document.getElementById('quiz-options');
    container.innerHTML = '';

    data.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left px-3 py-2 bg-white rounded border border-gray-200 text-sm hover:border-indigo-400 transition-colors';
        // A, B, C, D labels
        const labelPrefix = String.fromCharCode(65 + index); // 65 is 'A'
        btn.textContent = `${labelPrefix}. ${opt.label}`; // label is meaning_ja

        btn.onclick = () => {
            // Disable all buttons
            Array.from(container.children).forEach(b => b.disabled = true);

            if (opt.is_correct) {
                btn.classList.remove('bg-white', 'border-gray-200');
                btn.classList.add('bg-green-100', 'border-green-500', 'text-green-800');
                btn.innerHTML += ' <i class="fa-solid fa-check ml-2"></i>';
            } else {
                btn.classList.remove('bg-white', 'border-gray-200');
                btn.classList.add('bg-red-100', 'border-red-500', 'text-red-800');
                btn.innerHTML += ' <i class="fa-solid fa-xmark ml-2"></i>';

                // Highlight correct one
                const correctBtn = Array.from(container.children).find(b => b.textContent.includes(data.correct_word) || data.options.find(o => o.is_correct && b.textContent.includes(o.label)));
                // Finding correct button by index is safer
                const correctIndex = data.options.findIndex(o => o.is_correct);
                if (correctIndex !== -1) {
                    const cBtn = container.children[correctIndex];
                    cBtn.classList.remove('bg-white', 'border-gray-200');
                    cBtn.classList.add('bg-green-100', 'border-green-500', 'text-green-800');
                }
            }
        };

        container.appendChild(btn);
    });
}
