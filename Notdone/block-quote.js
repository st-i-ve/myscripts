block - quote
class="block-process"



// ==UserScript==
// @name         Block quote + Next Arrow Fallback
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Click carousel start button, then click all slide buttons in order, or click next arrow 20 times if buttons not found
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let processing = false;

    // Function to start carousel and click all slide buttons OR fallback
    function startAndClickSlides(carousel) {
        if (processing) return;
        processing = true;

        // Click the START button



        const startBtn = carousel.querySelector('.block-process-card__start-btn');
        if (startBtn) startBtn.click();

        // Wait a bit for the carousel to initialize
        setTimeout(() => {
            const slideButtons = carousel.querySelectorAll('.carousel-controls-items .carousel-controls-item-btn');

            if (slideButtons.length > 0) {
                // Click each button in order
                slideButtons.forEach((btn, index) => {
                    setTimeout(() => {
                        btn.click();
                    }, index * 100); // 100ms delay between clicks
                });

                // Reset processing
                setTimeout(() => { processing = false; }, slideButtons.length * 100 + 500);

            } else {
                // Fallback: click the "Next" arrow 20 times rapidly
                const nextArrow = carousel.querySelector('button.process-arrow.process-arrow--right');
                if (nextArrow) {
                    for (let i = 0; i < 20; i++) {
                        setTimeout(() => {
                            nextArrow.click();
                        }, i * 50); // 50ms rapid clicks
                    }
                }
                // Reset after fallback
                setTimeout(() => { processing = false; }, 20 * 50 + 500);
            }
        }, 200); // Initial delay for start button effect
    }

    // IntersectionObserver to detect carousel in view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startAndClickSlides(entry.target);
            }
        });
    }, { threshold: 0.5 });

    // Monitor all existing carousels
    function monitorCarousels() {
        const carousels = document.querySelectorAll('.block-process-carousel');
        carousels.forEach(carousel => observer.observe(carousel));
    }

    monitorCarousels();

    // Watch for dynamically added carousels
    const mutationObserver = new MutationObserver(() => {
        monitorCarousels();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

})();


