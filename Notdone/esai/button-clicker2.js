// ==UserScript==
// @name         ESAI Send Button Auto Clicker
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically clicks Send button on ESAI platform
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
            const hesitationDelay = Math.random() * 600 + 400; // 400-1000ms delay
            
            setTimeout(() => {
                console.log('🎯 preparing to click Send button:', button.textContent.trim());
                
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
                            
                            // i also trigger focus and submit events for forms
                            button.dispatchEvent(new Event('focus', { bubbles: true }));
                            
                            // i check if this button is in a form and trigger submit
                            const form = button.closest('form');
                            if (form) {
                                setTimeout(() => {
                                    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                                }, 50);
                            }
                            
                            // i add a mouseout event for completeness
                            setTimeout(() => {
                                button.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, cancelable: true }));
                            }, 100);
                            
                            console.log('✅ clicked Send button successfully');
                            resolve();
                        }, 90); // realistic mouse press duration
                    }, 60);
                }, 250); // time for scroll to complete
            }, hesitationDelay);
        });
    }

    // i check if prerequisites are met before clicking Send
    function checkPrerequisites() {
        // i check if there's content in textarea before sending
        const textarea = document.querySelector('.EsaiInput_input__YT6Di');
        if (textarea && textarea.value.trim().length > 0) {
            console.log('✅ textarea has content, ready to send');
            return true;
        }
        
        // i also check for any other input fields that might need content
        const inputs = document.querySelectorAll('input[type="text"], textarea');
        for (const input of inputs) {
            if (input.value.trim().length > 0) {
                console.log('✅ found input with content, ready to send');
                return true;
            }
        }
        
        console.log('⚠️ no content found in inputs, waiting before sending');
        return false;
    }

    // i handle send button clicks with improved detection and prerequisites
    async function clickSendButton() {
        try {
            // i first check if there's content in the textarea (prerequisite)
            const textareaSelectors = [
                '.EsaiInput_input__YT6Di',
                'textarea.EsaiInput_input__YT6Di.TextAreaDynamicHeight_textArea__xWaBa',
                'textarea[class*="EsaiInput_input"]',
                'textarea[class*="TextAreaDynamicHeight_textArea"]'
            ];
            
            let textarea = null;
            for (const selector of textareaSelectors) {
                textarea = document.querySelector(selector);
                if (textarea) break;
            }
            
            if (!textarea || !textarea.value.trim()) {
                console.log('⚠️ no content in textarea, skipping send button click');
                return;
            }
            
            console.log('✅ textarea has content, looking for send button...');
            
            // i look for the send button with comprehensive strategies
            const sendSelectors = [
                '.EsaiButton_button__Ey_Ql[type="submit"]',
                'button.EsaiButton_button__Ey_Ql.EsaiButton_primary__Ey_Ql',
                'button[class*="EsaiButton_button"][type="submit"]',
                'button[type="submit"]',
                '.EsaiButton_button__Ey_Ql',
                'button[class*="EsaiButton_button"]',
                'button[class*="primary"]'
            ];
            
            let sendButton = null;
            
            // i try each selector
            for (const selector of sendSelectors) {
                sendButton = document.querySelector(selector);
                if (sendButton) {
                    console.log(`📤 found send button using: ${selector}`);
                    break;
                }
            }
            
            // i also try finding by text content as fallback
            if (!sendButton) {
                const buttons = document.querySelectorAll('button');
                sendButton = Array.from(buttons).find(btn => {
                    const text = btn.textContent.toLowerCase().trim();
                    return text.includes('send') || text.includes('submit');
                });
                
                if (sendButton) {
                    console.log('📤 found send button by text content');
                }
            }
            
            if (!sendButton) {
                console.log('⚠️ send button not found with any strategy');
                return;
            }
            
            // i check if button is already clicked or disabled
            if (sendButton.disabled || sendButton.dataset.clicked) {
                console.log('ℹ️ send button already clicked or disabled');
                return;
            }
            
            // i verify the button is visible and clickable
            const rect = sendButton.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                console.log('⚠️ send button is not visible');
                return;
            }
            
            console.log('📤 clicking send button...');
            
            // i mark as clicked to prevent duplicate clicks
            sendButton.dataset.clicked = 'true';
            
            // i simulate human-like interaction
            await simulateHumanClick(sendButton);
            
            console.log('✅ send button clicked successfully');
            
        } catch (error) {
            console.log('⚠️ error in clickSendButton:', error.message);
        }
    }

    // i start the button clicking process
    function init() {
        console.log('🚀 ESAI Send Button Auto Clicker initialized');
        
        // i wait longer for content to be filled first
        setTimeout(() => {
            clickSendButton();
        }, 5000);
        
        // i set up periodic checks for dynamically loaded buttons and content
        const intervalId = setInterval(() => {
            // i check if textarea has content first
            const textareaSelectors = [
                '.EsaiInput_input__YT6Di',
                'textarea[class*="EsaiInput_input"]',
                'textarea[class*="TextAreaDynamicHeight_textArea"]'
            ];
            
            let hasContent = false;
            for (const selector of textareaSelectors) {
                const textarea = document.querySelector(selector);
                if (textarea && textarea.value.trim()) {
                    hasContent = true;
                    break;
                }
            }
            
            if (hasContent) {
                // i look for send button that hasn't been clicked
                const sendSelectors = [
                    '.EsaiButton_button__Ey_Ql[type="submit"]',
                    'button[class*="EsaiButton_button"]',
                    'button[type="submit"]'
                ];
                
                for (const selector of sendSelectors) {
                    const sendButton = document.querySelector(selector);
                    if (sendButton && !sendButton.dataset.clicked && !sendButton.disabled) {
                        clickSendButton();
                        break;
                    }
                }
            }
        }, 4000);
        
        // i clean up after 45 seconds (longer than other scripts since this waits for content)
        setTimeout(() => {
            clearInterval(intervalId);
            console.log('🛑 Send button auto clicker stopped');
        }, 45000);
    }

    // i start when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();