// ==UserScript==
// @name         ESAI Let's Go Button Clicker
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically clicks the "Let's Go" button on ESAI platform
// @author       Assistant
// @match        *://esai.com/*
// @match        *://*.esai.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // i wait for elements to appear on the page
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

    // i simulate realistic human clicking with proper event sequence
    function simulateHumanClick(button) {
        return new Promise((resolve) => {
            // i add realistic human hesitation before clicking
            const hesitationDelay = Math.random() * 800 + 300; // 300-1100ms delay
            
            setTimeout(() => {
                console.log('🎯 preparing to click button:', button.textContent.trim());
                
                // i scroll the button into view first
                button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(() => {
                    // i focus the button first
                    button.focus();
                    
                    // i trigger the complete mouse event sequence
                    button.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));
                    
                    setTimeout(() => {
                        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                        
                        setTimeout(() => {
                            button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                            button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                            
                            // i also trigger focus and change events
                            button.dispatchEvent(new Event('focus', { bubbles: true }));
                            
                            // i add a mouseout event for completeness
                            setTimeout(() => {
                                button.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, cancelable: true }));
                            }, 100);
                            
                            console.log('✅ clicked Let\'s Go button successfully');
                            resolve();
                        }, 80); // realistic mouse press duration
                    }, 50);
                }, 200); // time for scroll to complete
            }, hesitationDelay);
        });
    }

    // i look for the Let's Go button using the actual ESAI structure
    async function clickLetsGoButton() {
        try {
            // i use multiple selectors based on the actual HTML structure
            const selectors = [
                'button.EsaiButton_esaiButton__NzcU8.AiChatClientComponent_buttonNext__LBtb3',
                'button.EsaiButton_esaiButton__NzcU8',
                'button[class*="EsaiButton_esaiButton"]',
                'button[class*="AiChatClientComponent_buttonNext"]'
            ];
            
            let letsGoButton = null;
            
            // i try each selector to find the Let's Go button
            for (const selector of selectors) {
                const buttons = document.querySelectorAll(selector);
                for (const btn of buttons) {
                    const buttonText = btn.textContent || btn.innerText || '';
                    if (buttonText.includes("Let's Go") && !btn.dataset.clicked) {
                        letsGoButton = btn;
                        break;
                    }
                }
                if (letsGoButton) break;
            }
            
            // i also check for buttons containing the specific text structure
            if (!letsGoButton) {
                const allButtons = document.querySelectorAll('button');
                for (const btn of allButtons) {
                    const pElement = btn.querySelector('p.EsaiButtonText_esaiButtonText__Mlit0');
                    if (pElement && pElement.textContent.includes("Let's Go") && !btn.dataset.clicked) {
                        letsGoButton = btn;
                        break;
                    }
                }
            }
            
            if (!letsGoButton) {
                console.log('⚠️ Let\'s Go button not found with any selector');
                return;
            }
            
            console.log('🎯 found Let\'s Go button, preparing to click...');
            
            // i mark it as clicked to prevent duplicate clicks
            letsGoButton.dataset.clicked = 'true';
            
            // i check if button is visible and clickable
            const rect = letsGoButton.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;
            const isEnabled = !letsGoButton.disabled && !letsGoButton.hasAttribute('disabled');
            
            if (isVisible && isEnabled) {
                await simulateHumanClick(letsGoButton);
            } else {
                console.log('⚠️ button found but not clickable (disabled or hidden)');
            }
        } catch (error) {
            console.log('❌ error clicking Let\'s Go button:', error.message);
        }
    }

    // i start the button clicking process
    function init() {
        console.log('🚀 ESAI Let\'s Go Button Auto Clicker initialized');
        
        // i wait for the page to fully render
        setTimeout(() => {
            clickLetsGoButton();
        }, 2000);
        
        // i set up periodic checks for dynamically loaded buttons
        const intervalId = setInterval(() => {
            const buttons = document.querySelectorAll('button');
            let foundLetsGo = false;
            
            for (const button of buttons) {
                if (button.textContent.includes("Let's Go") && !button.dataset.clicked) {
                    button.dataset.clicked = 'true';
                    foundLetsGo = true;
                    clickLetsGoButton();
                    break;
                }
            }
        }, 3000);
        
        // i clean up after 30 seconds
        setTimeout(() => {
            clearInterval(intervalId);
            console.log('🛑 Let\'s Go button auto clicker stopped');
        }, 30000);
    }

    // i start when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();