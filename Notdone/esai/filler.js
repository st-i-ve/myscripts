// ==UserScript==
// @name         ESAI Textarea Auto Filler
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically fills textarea with 40 words on ESAI platform
// @author       Assistant
// @match        *://esai.com/*
// @match        *://*.esai.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // i generate realistic 40-word responses for different contexts
    const sampleResponses = [
        "When I'm organizing things and in charge, I feel confident and capable. I enjoy creating structure and helping others understand their roles. Leadership comes naturally to me when I can see the bigger picture and guide teams toward success. I thrive in environments where clear communication and strategic thinking are valued.",
        "I excel at organizing tasks and taking charge when needed. My natural leadership style focuses on collaboration and clear communication. I believe in empowering team members while maintaining focus on our shared goals. This approach helps create productive environments where everyone can contribute their best work effectively.",
        "Taking charge feels natural when I can organize processes effectively. I enjoy creating systems that help teams work more efficiently together. My leadership approach emphasizes clear expectations, open communication, and supporting others to achieve their potential. I find satisfaction in seeing projects come together successfully through good organization.",
        "I'm most effective when organizing projects and leading collaborative efforts. My strength lies in seeing the big picture while managing important details. I enjoy helping others understand their roles and contributions to our shared success. Clear communication and structured approaches help me guide teams toward achieving meaningful results.",
        "Organizing and leading comes easily when I can establish clear processes. I believe in creating environments where everyone understands expectations and feels supported. My leadership style focuses on collaboration, transparency, and helping others develop their skills. I find fulfillment in seeing teams achieve goals through effective organization and communication."
    ];

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

    // i simulate realistic human typing with natural variations
    function simulateHumanTyping(textarea, text) {
        return new Promise((resolve) => {
            // i clear the textarea first
            textarea.value = '';
            textarea.focus();
            
            // i trigger focus event
            textarea.dispatchEvent(new Event('focus', { bubbles: true }));
            
            let index = 0;
            const typeChar = () => {
                if (index < text.length) {
                    textarea.value += text[index];
                    
                    // i trigger input events for each character
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.dispatchEvent(new Event('keyup', { bubbles: true }));
                    
                    index++;
                    
                    // i add realistic typing speed variations
                    let delay = 50 + Math.random() * 100; // 50-150ms between characters
                    
                    // i pause longer at punctuation for realism
                    if (text[index - 1] === '.' || text[index - 1] === ',' || text[index - 1] === '!') {
                        delay += Math.random() * 200 + 100; // extra 100-300ms pause
                    }
                    
                    // i pause at spaces for natural rhythm
                    if (text[index - 1] === ' ') {
                        delay += Math.random() * 50 + 25; // extra 25-75ms pause
                    }
                    
                    setTimeout(typeChar, delay);
                } else {
                    // i trigger final events after typing is complete
                    textarea.dispatchEvent(new Event('change', { bubbles: true }));
                    textarea.dispatchEvent(new Event('blur', { bubbles: true }));
                    
                    // i also trigger the height adjustment for dynamic textareas
                    if (textarea.classList.contains('TextAreaDynamicHeight_textArea__xWaBa')) {
                        textarea.style.height = 'auto';
                        textarea.style.height = textarea.scrollHeight + 'px';
                    }
                    
                    console.log('✅ finished typing 40-word response');
                    resolve();
                }
            };
            
            // i start typing after a brief human-like delay
            setTimeout(typeChar, Math.random() * 500 + 200);
        });
    }

    // i handle textarea filling with improved detection
    async function fillTextarea() {
        try {
            // i use multiple selectors to find the ESAI textarea
            const selectors = [
                '.EsaiInput_input__YT6Di',
                'textarea.EsaiInput_input__YT6Di.TextAreaDynamicHeight_textArea__xWaBa',
                'textarea[class*="EsaiInput_input"]',
                'textarea[class*="TextAreaDynamicHeight_textArea"]',
                '.EsaiInputContainer_container__l9X0I textarea',
                '.EsaiInputContainer_inputContainer__r0N2T textarea'
            ];
            
            let textarea = null;
            
            // i try each selector to find the textarea
            for (const selector of selectors) {
                textarea = document.querySelector(selector);
                if (textarea) {
                    console.log(`📝 found textarea using selector: ${selector}`);
                    break;
                }
            }
            
            if (!textarea) {
                console.log('⚠️ no textarea found with any selector');
                return;
            }
            
            // i check if textarea is empty and not already filled
            if (textarea.value.trim() || textarea.dataset.filled) {
                console.log('ℹ️ textarea already has content or was already filled, skipping');
                return;
            }
            
            console.log('📝 found empty textarea, starting to fill...');
            
            // i mark it as being filled to prevent duplicate fills
            textarea.dataset.filled = 'true';
            
            // i select a random response from the samples
            const randomResponse = sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
            
            // i ensure the response is exactly 40 words
            const words = randomResponse.split(' ');
            const fortyWords = words.slice(0, 40).join(' ');
            
            console.log(`🎯 filling with ${fortyWords.split(' ').length} words`);
            await simulateHumanTyping(textarea, fortyWords);
            
        } catch (error) {
            console.log('⚠️ error in fillTextarea:', error.message);
        }
    }

    // i start the filling process
    function init() {
        console.log('🚀 ESAI Textarea Auto Filler initialized');
        
        // i wait for the page to fully render
        setTimeout(() => {
            fillTextarea();
        }, 2000);
        
        // i also set up periodic checks for dynamically loaded textareas
        const intervalId = setInterval(() => {
            const selectors = [
                '.EsaiInput_input__YT6Di',
                'textarea.EsaiInput_input__YT6Di.TextAreaDynamicHeight_textArea__xWaBa',
                'textarea[class*="EsaiInput_input"]',
                'textarea[class*="TextAreaDynamicHeight_textArea"]'
            ];
            
            for (const selector of selectors) {
                const textarea = document.querySelector(selector);
                if (textarea && !textarea.value.trim() && !textarea.dataset.filled) {
                    fillTextarea();
                    break;
                }
            }
        }, 3000);
        
        // i clean up after 30 seconds
        setTimeout(() => {
            clearInterval(intervalId);
            console.log('🛑 textarea auto filler stopped');
        }, 30000);
    }

    // i start when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();