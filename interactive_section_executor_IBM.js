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
        currentIndex = 0;
        processedElements.clear();
        
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
        toggleButton.textContent = 'Start Executor';
        toggleButton.style.background = '#0066cc';
        updateStatus('Execution stopped');
    }
    
    // Update status display
    function updateStatus(message) {
        statusDisplay.textContent = message;
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
        
        // Skip if already processed
        if (processedElements.has(elementId)) {
            currentIndex++;
            setTimeout(processNextElement, 100);
            return;
        }
        
        // Mark as processed
        processedElements.add(elementId);
        
        // Scroll to element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Determine action and execute
        const actionType = determineActionType(element);
        updateStatus(`${currentIndex + 1}/${noOutlineElements.length}: ${actionType}`);
        
        // Execute appropriate action
        executeActionForElement(element, actionType);
        
        // Move to next element after delay
        currentIndex++;
        setTimeout(processNextElement, 1000);
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
    
    // Execute knowledge check answering
    function executeKnowledgeCheck(element, doc) {
        const wrappers = element.querySelectorAll('.block-knowledge__wrapper');
        
        wrappers.forEach(wrapper => {
            const quizCard = wrapper.querySelector('.quiz-card__main');
            if (!quizCard) return;
            
            // Handle radio buttons (multiple choice)
            const alreadySelected = quizCard.querySelector('[role="radio"][aria-checked="true"]');
            if (!alreadySelected) {
                const options = quizCard.querySelectorAll('[role="radio"][aria-checked="false"]');
                if (options.length > 0) {
                    const randomIndex = Math.floor(Math.random() * options.length);
                    const chosen = options[randomIndex];
                    chosen.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                    console.log('🧠 Selected random radio option');
                }
            }
            
            // Handle checkboxes (multiple response)
            const checkboxOptions = quizCard.querySelectorAll('[role="checkbox"][aria-checked="false"]');
            if (checkboxOptions.length > 0) {
                const shuffled = [...checkboxOptions].sort(() => 0.5 - Math.random());
                const pickCount = Math.min(2, shuffled.length);
                const picked = shuffled.slice(0, pickCount);
                picked.forEach(checkbox => {
                    checkbox.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                });
                console.log(`🧠 Selected ${picked.length} checkbox options`);
            }
            
            // Submit after delay
            setTimeout(() => {
                const submitBtn = wrapper.querySelector('button.quiz-card__button:not(.quiz-card__button--disabled)');
                if (submitBtn) {
                    submitBtn.click();
                    console.log('🧠 Submitted quiz answer');
                }
            }, 300);
        });
        
        // Handle next button after additional delay
        setTimeout(() => {
            const iframe = document.querySelector('iframe');
            const iframeDoc = iframe ? iframe.contentDocument : null;
            if (!iframeDoc) return;
            
            const nextButton = iframeDoc.querySelector('button[data-testid="arrow-next"]:not([disabled])');
            if (nextButton && nextButton.offsetParent !== null) {
                // Click multiple times to ensure it registers
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        nextButton.click();
                    }, i * 100);
                }
                console.log('➡️ Clicked next button after quiz submission');
            }
        }, 1000);
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