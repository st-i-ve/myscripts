// ==UserScript==
// @name         Interactive Section Executor (IBM)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Executes specific functions for interactive elements in noOutline sections
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    let isRunning = false;
    let currentIndex = 0;
    let noOutlineElements = [];
    let processedElements = new Set(); // track processed elements to ensure "once only"
    let retryCount = 0;
    let maxRetries = 4;
    let lastFailedIndex = -1;
    
    // Answer pool from AutoAnswerFast+nextV2.js for knowledge checks
    const answerPool = [
        "Check whether the tools used for collecting data give stable results over time.",
        "Commercial transaction records",
        "Surveys and questionnaires",
        "Web scraping technologies",
        "Use visualizations to show patterns, trends, and key insights.",
        "Check her information by comparing it with data from different methods or sources.",
        "Sensors and IoT devices",
    ];
    
    // UI Elements
    let toggleButton, statusDisplay;
    
    // Create UI
    function createUI() {
        // Toggle Button
        toggleButton = document.createElement('button');
        toggleButton.textContent = 'Start Executor';
        toggleButton.style.cssText = `
            position: fixed;
            bottom: 70px;
            right: 20px;
            z-index: 9999;
            padding: 10px 15px;
            background: #0066cc;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
        `;
        
        // Status Display
        statusDisplay = document.createElement('div');
        statusDisplay.textContent = 'Ready to execute';
        statusDisplay.style.cssText = `
            position: fixed;
            bottom: 120px;
            right: 20px;
            z-index: 9999;
            padding: 8px 12px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 5px;
            font-size: 12px;
            max-width: 300px;
        `;
        
        document.body.appendChild(toggleButton);
        document.body.appendChild(statusDisplay);
        
        toggleButton.addEventListener('click', toggleExecution);
    }
    
    // Toggle execution
    function toggleExecution() {
        if (isRunning) {
            stopExecution();
        } else {
            startExecution();
        }
    }
    
    // Start execution
    function startExecution() {
        isRunning = true;
        // Don't reset currentIndex if we're retrying from a failed position
        if (lastFailedIndex === -1) {
            currentIndex = 0;
            processedElements.clear();
        } else {
            // Resume from failed position or one above it
            currentIndex = Math.max(0, lastFailedIndex - 1);
            lastFailedIndex = -1;
        }
        
        toggleButton.textContent = 'Stop Executor';
        toggleButton.style.background = '#cc0000';
        
        // Find all noOutline elements in iframe
        const iframe = document.querySelector('iframe');
        if (iframe && iframe.contentDocument) {
            const iframeDoc = iframe.contentDocument;
            noOutlineElements = Array.from(iframeDoc.querySelectorAll('.noOutline'));
            
            if (noOutlineElements.length > 0) {
                updateStatus(`Found ${noOutlineElements.length} sections. Starting execution...`);
                processNextElement();
            } else {
                updateStatus('No noOutline elements found');
                stopExecution();
            }
        } else {
            updateStatus('No iframe found or cannot access iframe content');
            stopExecution();
        }
    }
    
    // Stop execution
    function stopExecution() {
        isRunning = false;
        retryCount = 0; // Reset retry count when manually stopped
        toggleButton.textContent = 'Start Executor';
        toggleButton.style.background = '#0066cc';
        updateStatus('Execution stopped');
    }
    
    // Show retry failed message
    function showRetryFailedMessage() {
        const failureMessage = document.createElement('div');
        failureMessage.textContent = 'Retry failed after the 4th, stop executing';
        failureMessage.style.cssText = `
            position: fixed;
            bottom: 170px;
            right: 20px;
            z-index: 9999;
            padding: 8px 12px;
            background: rgba(255, 0, 0, 0.9);
            color: white;
            border-radius: 5px;
            font-size: 12px;
            max-width: 300px;
            font-weight: bold;
        `;
        
        document.body.appendChild(failureMessage);
        
        // Remove message after 10 seconds
        setTimeout(() => {
            if (failureMessage.parentNode) {
                failureMessage.parentNode.removeChild(failureMessage);
            }
        }, 10000);
        
        stopExecution();
    }
    
    // Update status display
    function updateStatus(message) {
        statusDisplay.textContent = message;
    }
    
    // Check if element has interactive content (for speed optimization)
    function hasInteractiveContent(element) {
        return element.querySelector('.block-flashcards') ||
               element.querySelector('.blocks-accordion') ||
               element.querySelector('.block-labeled-graphic') ||
               element.querySelector('.continue-btn.brand--ui') ||
               element.querySelector('.block-knowledge');
    }
    
    // Process next element
    function processNextElement() {
        if (!isRunning || currentIndex >= noOutlineElements.length) {
            if (isRunning) {
                updateStatus('All sections processed!');
                stopExecution();
            }
            return;
        }
        
        const element = noOutlineElements[currentIndex];
        const elementId = element.dataset.blockId || `element-${currentIndex}`;
        
        // Skip if already processed (unless we're retrying)
        if (processedElements.has(elementId) && lastFailedIndex === -1) {
            currentIndex++;
            setTimeout(processNextElement, 100);
            return;
        }
        
        try {
            // Mark as processed
            processedElements.add(elementId);
            
            // Scroll to element
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Determine action and execute
            const actionType = determineActionType(element);
            const isInteractive = hasInteractiveContent(element);
            
            updateStatus(`${currentIndex + 1}/${noOutlineElements.length}: ${actionType} ${retryCount > 0 ? `(retry ${retryCount})` : ''}`);
            
            // Execute appropriate action
            executeActionForElement(element, actionType);
            
            // Reset retry count on successful execution
            retryCount = 0;
            
            // Move to next element after delay (fast for non-interactive, normal for interactive)
            currentIndex++;
            const delay = isInteractive ? 1000 : 200; // i made this faster for non-interactive elements
            setTimeout(processNextElement, delay);
            
        } catch (error) {
            console.error('Error processing element:', error);
            handleExecutionError();
        }
    }
    
    // Handle execution errors with retry logic
    function handleExecutionError() {
        retryCount++;
        
        if (retryCount >= maxRetries) {
            lastFailedIndex = currentIndex;
            showRetryFailedMessage();
            return;
        }
        
        // Retry from current position after short delay
        updateStatus(`Error occurred. Retrying... (${retryCount}/${maxRetries})`);
        setTimeout(() => {
            // Don't increment currentIndex, retry same element
            processNextElement();
        }, 500);
    }
    
    // Determine what action to take based on element content
    function determineActionType(element) {
        if (element.querySelector('.block-flashcards')) {
            return 'flashcards - flipping cards';
        }
        if (element.querySelector('.blocks-accordion')) {
            return 'accordion - opening sections';
        }
        if (element.querySelector('.block-labeled-graphic')) {
            return 'labeled-graphic - opening labels';
        }
        if (element.querySelector('.continue-btn.brand--ui')) {
            return 'continue-btn - clicking continue';
        }
        if (element.querySelector('.block-knowledge')) {
            const knowledgeBlock = element.querySelector('.block-knowledge');
            const ariaLabel = knowledgeBlock.getAttribute('aria-label') || '';
            if (ariaLabel.includes('Multiple choice')) {
                return 'knowledge - answering multiple choice';
            } else if (ariaLabel.includes('Multiple response')) {
                return 'knowledge - answering multiple response';
            }
            return 'knowledge - answering quiz';
        }
        return 'unknown - no action';
    }
    
    // Execute action for specific element
    function executeActionForElement(element, actionType) {
        const iframe = document.querySelector('iframe');
        const iframeDoc = iframe ? iframe.contentDocument : null;
        
        if (!iframeDoc) return;
        
        if (actionType.includes('flashcards')) {
            executeFlashcards(element, iframeDoc);
        } else if (actionType.includes('accordion')) {
            executeAccordions(element, iframeDoc);
        } else if (actionType.includes('labeled-graphic')) {
            executeLabeledGraphics(element, iframeDoc);
        } else if (actionType.includes('continue-btn')) {
            executeContinueButton(element, iframeDoc);
        } else if (actionType.includes('knowledge')) {
            executeKnowledgeCheck(element, iframeDoc);
        }
    }
    
    // Execute flashcard flipping
    function executeFlashcards(element, doc) {
        // Unhide all slides within this element
        const allSlides = element.querySelectorAll('.carousel-slide');
        allSlides.forEach(slide => {
            slide.removeAttribute('hidden');
            slide.removeAttribute('inert');
        });
        
        // Flip visible flashcards within this element
        const flipButtons = element.querySelectorAll('.flashcard-side-flip__btn');
        let flipped = 0;
        flipButtons.forEach(btn => {
            if (btn.offsetParent !== null) {
                btn.click();
                flipped++;
            }
        });
        
        console.log(`✅ Flipped ${flipped} flashcards in current section`);
    }
    
    // Execute accordion expansion
    function executeAccordions(element, doc) {
        const accordions = element.querySelectorAll('.blocks-accordion__header');
        let expanded = 0;
        accordions.forEach(btn => {
            if (btn.getAttribute('aria-expanded') === 'false') {
                btn.click();
                expanded++;
            }
        });
        
        console.log(`📂 Expanded ${expanded} accordions in current section`);
        
        // Click continue button after delay if present
        setTimeout(() => {
            const continueBtn = element.querySelector('button.continue-btn[data-continue-btn]');
            if (continueBtn) {
                continueBtn.click();
                console.log('✅ Clicked continue button after accordion expansion');
            }
        }, 500);
    }
    
    // Execute labeled graphic markers
    function executeLabeledGraphics(element, doc) {
        const markers = element.querySelectorAll(
            'button.labeled-graphic-marker:not(.labeled-graphic-marker--complete):not(.labeled-graphic-marker--active)'
        );
        let clicked = 0;
        markers.forEach(btn => {
            if (btn.getAttribute('aria-expanded') === 'false') {
                btn.click();
                clicked++;
            }
        });
        
        console.log(`🔘 Clicked ${clicked} labeled graphic markers in current section`);
    }
    
    // Execute continue button click
    function executeContinueButton(element, doc) {
        const iframe = document.querySelector('iframe');
        const iframeWin = iframe ? iframe.contentWindow : null;
        
        if (!iframeWin) return;
        
        // Check if element is visible in viewport
        function isInViewport(el) {
            const rect = el.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (iframeWin.innerHeight || iframeWin.document.documentElement.clientHeight) &&
                rect.right <= (iframeWin.innerWidth || iframeWin.document.documentElement.clientWidth)
            );
        }
        
        const btn = element.querySelector('button.continue-btn.brand--ui');
        if (btn && isInViewport(btn)) {
            btn.click();
            console.log('✅ Clicked continue button in current section');
        }
    }
    
    // Execute knowledge check answering (enhanced with AutoAnswerFast+nextV2.js logic)
    function executeKnowledgeCheck(element, doc) {
        // Text normalization function from AutoAnswerFast+nextV2.js
        const normalizeText = (text) => text.trim().replace(/\s+/g, ' ').toLowerCase();
        
        const wrappers = element.querySelectorAll('.block-knowledge__wrapper');
        
        wrappers.forEach(wrapper => {
            const quizCard = wrapper.querySelector('.quiz-card__main');
            if (!quizCard) return;
            
            // Enhanced answer selection using answer pool
            const labels = quizCard.querySelectorAll(
                'label.quiz-multiple-choice-option, label.quiz-multiple-response-option'
            );
            
            let matchedAny = false;
            
            if (labels.length > 0) {
                labels.forEach(label => {
                    const input = label.querySelector('input');
                    const textEl = label.querySelector(
                        '.quiz-multiple-choice-option__label, .quiz-multiple-response-option__text'
                    );
                    const rawText = textEl?.innerText || '';
                    const normalized = normalizeText(rawText);
                    
                    const isMatch = answerPool.some(ans => normalizeText(ans) === normalized);
                    if (isMatch) {
                        matchedAny = true;
                        input.click();
                        console.log('✅ Selected matched answer:', rawText);
                    }
                });
                
                // Fallback to random selection if no matches found
                if (!matchedAny) {
                    console.warn('⚠️ No match found in answer pool. Selecting random...');
                    const inputs = quizCard.querySelectorAll('input[type="radio"], input[type="checkbox"]');
                    if (inputs.length > 0) {
                        // For multiple response, select 1-2 random options
                        const isMultipleResponse = inputs[0].type === 'checkbox';
                        if (isMultipleResponse) {
                            const shuffled = [...inputs].sort(() => 0.5 - Math.random());
                            const pickCount = Math.min(2, shuffled.length);
                            const picked = shuffled.slice(0, pickCount);
                            picked.forEach(input => input.click());
                            console.log(`🧠 Selected ${picked.length} random checkbox options`);
                        } else {
                            // For multiple choice, select one random option
                            const randomIndex = Math.floor(Math.random() * inputs.length);
                            inputs[randomIndex].click();
                            console.log('🧠 Selected random radio option');
                        }
                    }
                }
            } else {
                // Fallback to original logic for older quiz formats
                const alreadySelected = quizCard.querySelector('[role="radio"][aria-checked="true"]');
                if (!alreadySelected) {
                    const options = quizCard.querySelectorAll('[role="radio"][aria-checked="false"]');
                    if (options.length > 0) {
                        const randomIndex = Math.floor(Math.random() * options.length);
                        const chosen = options[randomIndex];
                        chosen.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                        console.log('🧠 Selected random radio option (fallback)');
                    }
                }
                
                const checkboxOptions = quizCard.querySelectorAll('[role="checkbox"][aria-checked="false"]');
                if (checkboxOptions.length > 0) {
                    const shuffled = [...checkboxOptions].sort(() => 0.5 - Math.random());
                    const pickCount = Math.min(2, shuffled.length);
                    const picked = shuffled.slice(0, pickCount);
                    picked.forEach(checkbox => {
                        checkbox.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                    });
                    console.log(`🧠 Selected ${picked.length} checkbox options (fallback)`);
                }
            }
            
            // Fast submit (from AutoAnswerFast+nextV2.js timing)
            setTimeout(() => {
                const submitBtn = wrapper.querySelector('button.quiz-card__button:not(.quiz-card__button--disabled)');
                if (submitBtn) {
                    submitBtn.click();
                    console.log('🧠 Submitted quiz answer (fast mode)');
                }
            }, 100); // i reduced delay for faster execution
        });
        
        // Handle next button with fast timing and multiple clicks
        setTimeout(() => {
            const iframe = document.querySelector('iframe');
            const iframeDoc = iframe ? iframe.contentDocument : null;
            if (!iframeDoc) return;
            
            // Wait for next button to become available
            const checkForNextButton = () => {
                const nextButton = iframeDoc.querySelector('button[data-testid="arrow-next"]:not([disabled])');
                if (nextButton && nextButton.offsetParent !== null) {
                    // Multiple clicks to ensure it registers (from AutoAnswerFast+nextV2.js)
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            nextButton.click();
                        }, i * 50); // i made this faster with 50ms intervals
                    }
                    console.log('➡️ Clicked next button after quiz submission (fast mode)');
                } else {
                    // Keep checking for next button
                    setTimeout(checkForNextButton, 50);
                }
            };
            
            checkForNextButton();
        }, 200); // i reduced initial delay for faster execution
    }
    
    // Initialize when page loads
    function init() {
        // Wait for page to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createUI);
        } else {
            createUI();
        }
    }
    
    init();
})();