// ==UserScript==
// @name         Copy Active Quiz with AI Prompt
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Copy active quiz question with choices and append a short AI prompt requesting an A/B/C/D answer
// @match        *://*/*
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  'use strict';

  function waitForActiveCard() {
    const activeCard = document.querySelector('.quiz-item__card--active .quiz-card__main');
    if (!activeCard) {
      setTimeout(waitForActiveCard, 1000);
    } else {
      injectCopyActiveButton(activeCard);
    }
  }

  function injectCopyActiveButton(activeCard) {
    if (document.getElementById('copyActiveQuizBtn')) return;

    const button = document.createElement('button');
    button.id = 'copyActiveQuizBtn';
    button.textContent = '📋 Copy Active Question';
    Object.assign(button.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: '9999',
      padding: '10px 15px',
      backgroundColor: '#0043ce',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      cursor: 'pointer',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
    });

    button.addEventListener('click', () => {
      const question = activeCard.querySelector('.quiz-card__title')?.innerText.trim() || '[No Question]';
      const inputElements = activeCard.querySelectorAll('input[type="radio"], input[type="checkbox"]');

      const options = [];
      inputElements.forEach((input, i) => {
        const label = input.closest('label')?.querySelector('.quiz-multiple-choice-option__label');
        if (label) {
          const letter = String.fromCharCode(65 + i);
          const text = label.innerText.trim();
          options.push(`${letter}. ${text}`);
        }
      });

      const aiPrompt = `\n\n🤖 AI PROMPT:\nPlease answer this question with only the correct letter (A, B, C, or D). Keep it short.`;
      const output = `Question:\n${question}\n\nOptions:\n${options.join('\n')}${aiPrompt}`;

      GM_setClipboard(output);

      // Visual feedback
      button.textContent = '✅ Copied!';
      button.style.backgroundColor = 'green';

      setTimeout(() => {
        button.textContent = '📋 Copy Active Question';
        button.style.backgroundColor = '#0043ce';
      }, 1500);
    });

    document.body.appendChild(button);
  }

  waitForActiveCard();
})();
