// ==UserScript==
// @name         ESAI Star Highlighter - Third Star Focus
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Highlights the third star in ESAI rating system
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('ESAI Star Highlighter - Third Star Focus loaded');

    // i added this delay to ensure the page loads properly before highlighting
    function waitForElement(selector, callback, maxAttempts = 50) {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(interval);
                callback(element);
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                console.log('Star highlighter: Element not found after maximum attempts');
            }
        }, 200);
    }

    // i added human-like delay function for realistic interactions
    function randomDelay(min = 500, max = 1500) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function simulateMouseClick(element) {
        // i tried using native click first since mouse events weren't working
        element.click();
        console.log('Star highlighter: Clicked third star using native click');
        
        // i also trigger change and input events in case they're needed
        setTimeout(() => {
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }, 100);
    }

    // i implemented this to add highlight styles to the third star
    function highlightThirdStar() {
        // i used multiple selectors to find the star rating container
        const selectors = [
            '.StarRating_rating___pG5Q',
            '.style-module_starRatingWrap__q-lJC',
            '.style-module_simpleStarRating__nWUxf',
            '[class*="StarRating_rating"]',
            '[class*="starRatingWrap"]'
        ];

        let ratingContainer = null;
        for (const selector of selectors) {
            ratingContainer = document.querySelector(selector);
            if (ratingContainer) {
                console.log(`Star highlighter: Found rating container with selector: ${selector}`);
                break;
            }
        }

        if (!ratingContainer) {
            console.log('Star highlighter: Rating container not found');
            return;
        }

        // i targeted the third star specifically (index 2)
        const starSelectors = [
            '.StarRating_customIcon__mzBS9:nth-child(3)',
            '.style-module_emptyIcons__Bg-FZ > div:nth-child(3)',
            '.empty-icons > div:nth-child(3)',
            'div[class*="customIcon"]:nth-child(3)'
        ];

        let thirdStar = null;
        for (const selector of starSelectors) {
            thirdStar = ratingContainer.querySelector(selector);
            if (thirdStar) {
                console.log(`Star highlighter: Found third star with selector: ${selector}`);
                break;
            }
        }

        if (!thirdStar) {
            // i added a fallback to find all star icons and select the third one
            const allStars = ratingContainer.querySelectorAll('div[class*="customIcon"], .StarRating_customIcon__mzBS9');
            if (allStars.length >= 3) {
                thirdStar = allStars[2]; // third star (0-indexed)
                console.log('Star highlighter: Found third star using fallback method');
            }
        }

        if (thirdStar) {
            // i checked if this star was already processed to avoid duplicate actions
            if (thirdStar.dataset.highlighted === 'true') {
                return;
            }

            // i applied highlight styles to make the third star stand out
            thirdStar.style.cssText = `
                border: 3px solid #ff6b35 !important;
                border-radius: 50% !important;
                box-shadow: 0 0 15px rgba(255, 107, 53, 0.8) !important;
                background-color: rgba(255, 107, 53, 0.1) !important;
                transform: scale(1.2) !important;
                transition: all 0.3s ease !important;
                position: relative !important;
                z-index: 1000 !important;
                cursor: pointer !important;
            `;

            // i added a pulsing animation to draw attention
            const pulseKeyframes = `
                @keyframes starPulse {
                    0% { box-shadow: 0 0 15px rgba(255, 107, 53, 0.8); }
                    50% { box-shadow: 0 0 25px rgba(255, 107, 53, 1); }
                    100% { box-shadow: 0 0 15px rgba(255, 107, 53, 0.8); }
                }
            `;

            // i created a style element to inject the animation
            if (!document.querySelector('#star-highlighter-styles')) {
                const styleElement = document.createElement('style');
                styleElement.id = 'star-highlighter-styles';
                styleElement.textContent = pulseKeyframes;
                document.head.appendChild(styleElement);
            }

            thirdStar.style.animation = 'starPulse 2s infinite';

            // i added a tooltip to indicate this is the third star
            thirdStar.title = 'Third Star - Highlighted (Will be clicked automatically)';

            // i marked this star as processed
            thirdStar.dataset.highlighted = 'true';

            console.log('Star highlighter: Successfully highlighted the third star');

            // i added automatic clicking after a human-like delay
            setTimeout(() => {
                console.log('Star highlighter: Attempting to click the third star');
                
                // i scrolled the element into view before clicking
                thirdStar.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(() => {
                    simulateMouseClick(thirdStar);
                    console.log('Star highlighter: Third star clicked successfully');
                }, randomDelay(300, 800));
            }, randomDelay(1000, 2000));
        } else {
            console.log('Star highlighter: Third star not found');
        }
    }

    // i implemented periodic checking for dynamically loaded content
    function startHighlighting() {
        highlightThirdStar();
        
        // i added periodic checks every 3 seconds for dynamic content
        setInterval(() => {
            const existingHighlight = document.querySelector('div[data-highlighted="true"]');
            if (!existingHighlight) {
                highlightThirdStar();
            }
        }, 3000);
    }

    // i used multiple initialization methods to ensure the script works
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startHighlighting);
    } else {
        startHighlighting();
    }

    // i added a fallback initialization after a delay
    setTimeout(startHighlighting, 2000);

    console.log('Star highlighter: Script initialization complete');
})();