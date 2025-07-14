// ==UserScript==
// @name         Combined Quiz Copy Tools (AI Prompt & Q&A)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Combines two quiz copy functions: AI prompt and visible question/answer text, with no UI duplication
// @match        *://*/*
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
    'use strict';
  
    // Prevent multiple runs
    if (window.hasRunQuizTool) return;
    window.hasRunQuizTool = true;
  
    // Create the floating panel with both buttons
    function createFloatingPanel() {
      if (document.getElementById('quizToolPanel')) return;
  
      const panel = document.createElement('div');
      panel.id = 'quizToolPanel';
      Object.assign(panel.style, {
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: '9999',
        backgroundColor: '#f4f4f4',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
      });
  
      // Create both buttons
      panel.appendChild(createButton('copyActiveBtn', '📋 Copy Active Question', handleCopyActive));
      panel.appendChild(createButton('copyVisibleBtn', '📋 Copy Visible Q&A', handleCopyVisible));
  
      document.body.appendChild(panel);
    }
  
    // Button generator with shared styling
    function createButton(id, text, handler) {
      const button = document.createElement('button');
      button.id = id;
      button.textContent = text;
      Object.assign(button.style, {
        width: '100%',
        marginTop: '6px',
        padding: '8px 12px',
        backgroundColor: '#0043ce',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        cursor: 'pointer',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
      });
      button.addEventListener('click', handler);
      return button;
    }
  
    // Copy active question with AI prompt
    function handleCopyActive() {
      const btn = document.getElementById('copyActiveBtn');
      const activeCard = document.querySelector('.quiz-item__card--active .quiz-card__main');
  
      if (!activeCard) return showError(btn, '❌ No active question');
  
      const questionText = activeCard.querySelector('.quiz-card__title')?.innerText.trim() || '[No Question]';
      const checkboxes = activeCard.querySelectorAll('input[type="checkbox"]');
      const radios = activeCard.querySelectorAll('input[type="radio"]');
      const isMulti = checkboxes.length > 0;
      const inputs = isMulti ? checkboxes : radios;
  
      if (!inputs.length) return showError(btn, '❌ No options found');
  
      const options = Array.from(inputs).map((input, i) => {
        const label = input.closest('label')?.querySelector('.quiz-multiple-choice-option__label, .quiz-multiple-response-option__text');
        const letter = String.fromCharCode(65 + i);
        return label ? `${letter}. ${label.innerText.trim()}` : null;
      }).filter(Boolean);
  
      const prompt = isMulti
        ? `\n\n🤖 AI PROMPT:\nPlease answer with the correct letter(s) (e.g., A and D). Keep it short.`
        : `\n\n🤖 AI PROMPT:\nPlease answer with only the correct letter (A, B, C, or D). Keep it short.`;
  
      const output = `Question:\n${questionText}\n\nOptions:\n${options.join('\n')}${prompt}`;
      GM_setClipboard(output);
      showSuccess(btn, '✅ Copied!');
    }
  
    // Copy visible question and correct answer text
    function handleCopyVisible() {
      const btn = document.getElementById('copyVisibleBtn');
      const cards = Array.from(document.querySelectorAll('.quiz-card__main'));
      const visibleCard = cards.find(card => card.offsetParent !== null);
  
      if (!visibleCard) return showError(btn, '❌ No visible question');
  
      const questionText = visibleCard.querySelector('.quiz-card__title')?.innerText.trim() || '[No Question]';
      const inputs = visibleCard.querySelectorAll('input[type="checkbox"], input[type="radio"]');
  
      const correctAnswers = Array.from(inputs).map(input => {
        const label = input.closest('label');
        const answerText = label?.querySelector('.quiz-multiple-choice-option__label, .quiz-multiple-response-option__text')?.innerText.trim();
        return label?.classList.contains('is-correct') && answerText ? answerText : null;
      }).filter(Boolean);
  
      if (!correctAnswers.length) return showError(btn, '❌ No correct answer');
  
      const output = `Question:\n${questionText}\n\nAnswer:\n${correctAnswers.join(' and ')}`;
      GM_setClipboard(output);
      showSuccess(btn, '✅ Copied!');
    }
  
    // Feedback functions
    function showSuccess(button, message) {
      const original = button.textContent;
      button.textContent = message;
      button.style.backgroundColor = 'green';
      setTimeout(() => {
        button.textContent = original;
        button.style.backgroundColor = '#0043ce';
      }, 1500);
    }
  
    function showError(button, message) {
      const original = button.textContent;
      button.textContent = message;
      button.style.backgroundColor = '#a00';
      setTimeout(() => {
        button.textContent = original;
        button.style.backgroundColor = '#0043ce';
      }, 2000);
    }
  
    // Inject panel when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById('quizToolPanel')) {
          createFloatingPanel();
        }
      });
    } else {
      if (!document.getElementById('quizToolPanel')) {
        createFloatingPanel();
      }
    }
  })();
  