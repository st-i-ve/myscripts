// ==UserScript==
// @name         Auto Career Assessment Clicker (Randomized)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Automatically clicks random answers in the career assessment test
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const clickDelay = 100; // milliseconds between clicks (adjust speed)

    function autoClick() {
        // Find all answer buttons
        const buttons = document.querySelectorAll('[data-testid^="career-assessment-answer-"]');

        if (buttons.length > 0) {
            // Pick a random button index (0–4)
            const randomIndex = Math.floor(Math.random() * buttons.length);
            console.log("Clicking:", buttons[randomIndex].innerText);
            buttons[randomIndex].click();

            // Schedule next click
            setTimeout(autoClick, clickDelay);
        } else {
            console.log("No buttons found, waiting...");
            setTimeout(autoClick, 2000); // Retry after 2s
        }
    }

    // Start after page load
    window.addEventListener('load', () => {
        setTimeout(autoClick, 1500);
    });

})();
