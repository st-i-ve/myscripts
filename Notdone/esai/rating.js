// ==UserScript==
// @name         ESAI Star Rating Auto Clicker
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically clicks star ratings on ESAI platform
// @author       Assistant
// @match        *://esai.com/*
// @match        *://*.esai.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // i wait for page to load before starting
    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error('Element not found within timeout'));
            }, timeout);
        });
    }

    // i simulate human-like clicking with realistic delays
    function simulateHumanClick(element) {
        return new Promise((resolve) => {
            // i add a small random delay to mimic human hesitation
            const delay = Math.random() * 500 + 200; // 200-700ms delay
            
            setTimeout(() => {
                // i trigger multiple events to ensure proper interaction
                element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                
                setTimeout(() => {
                    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                    
                    // i also trigger focus and change events for form elements
                    if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
                        element.dispatchEvent(new Event('focus', { bubbles: true }));
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    
                    console.log('✅ clicked star rating element');
                    resolve();
                }, 50); // small delay between mousedown and mouseup
            }, delay);
        });
    }

    // i handle star rating clicks with improved SVG detection
    async function clickStarRating() {
        try {
            // i use multiple selectors to find the star rating container
            const selectors = [
                '.EsaiStarRating_container__Ey_Ql',
                '[class*="EsaiStarRating_container"]',
                '.star-rating-container',
                '[data-testid="star-rating"]',
                '.style-module_simpleStarRating__nWUxf'
            ];
            
            let ratingContainer = null;
            
            // i try each selector to find the container
            for (const selector of selectors) {
                ratingContainer = document.querySelector(selector);
                if (ratingContainer) {
                    console.log(`⭐ found rating container using: ${selector}`);
                    break;
                }
            }
            
            if (!ratingContainer) {
                console.log('⚠️ no star rating container found');
                return;
            }
            
            // i look for star elements with multiple approaches
            let stars = [];
            
            // i try different star selectors
            const starSelectors = [
                '.EsaiStarRating_star__Ey_Ql',
                '[class*="EsaiStarRating_star"]',
                '.StarRating_customIcon__mzBS9',
                'svg[class*="star"]',
                'button[class*="star"]',
                '.star',
                'svg'
            ];
            
            for (const starSelector of starSelectors) {
                stars = ratingContainer.querySelectorAll(starSelector);
                if (stars.length > 0) {
                    console.log(`⭐ found ${stars.length} stars using: ${starSelector}`);
                    break;
                }
            }
            
            if (stars.length === 0) {
                console.log('⚠️ no star elements found in container');
                return;
            }
            
            // i select a random rating between 3-5 stars (positive ratings)
            const rating = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
            const targetIndex = Math.min(rating - 1, stars.length - 1); // ensure we don't exceed array bounds
            const targetStar = stars[targetIndex];
            
            if (targetStar) {
                console.log(`⭐ clicking ${rating} star rating (index ${targetIndex})`);
                
                // i simulate human-like interaction
                await simulateHumanClick(targetStar);
                
                // i also try clicking the rating container itself as backup
                setTimeout(async () => {
                    await simulateHumanClick(ratingContainer);
                }, 100);
                
                console.log(`✅ successfully clicked ${rating} stars`);
            }
        } catch (error) {
            console.log('⚠️ error in clickStarRating:', error.message);
        }
    }

    // i start the rating process after page loads
    function init() {
        console.log('🚀 ESAI Star Rating Auto Clicker initialized');
        
        // i wait a bit for the page to fully render
        setTimeout(() => {
            clickStarRating();
        }, 2000);
        
        // i also set up a periodic check in case elements load dynamically
        const intervalId = setInterval(() => {
            const ratingElement = document.querySelector('.style-module_simpleStarRating__nWUxf, .EsaiStarRating_container__Ey_Ql');
            if (ratingElement && !ratingElement.dataset.clicked) {
                ratingElement.dataset.clicked = 'true';
                clickStarRating();
            }
        }, 3000);
        
        // i clean up the interval after 30 seconds to avoid infinite running
        setTimeout(() => {
            clearInterval(intervalId);
            console.log('🛑 star rating auto clicker stopped');
        }, 30000);
    }

    // i start when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();