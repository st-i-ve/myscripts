// ==UserScript==
// @name         Quiz Answer Revealer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Reveal correct quiz answers before submitting
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let originalSubmitFunction = null;
    let isPreviewMode = false;

    function createRevealButton() {
        const button = document.createElement('button');
        button.textContent = '🔍 Preview Answers';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            font-size: 14px;
        `;

        button.addEventListener('mouseenter', handleButtonHover);
        button.addEventListener('mouseleave', handleButtonLeave);
        button.addEventListener('click', handlePreviewClick);

        document.body.appendChild(button);
        return button;
    }

    function handleButtonHover() {
        this.style.transform = 'scale(1.05)';
        this.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    }

    function handleButtonLeave() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    }

    function handlePreviewClick() {
        if (isPreviewMode) {
            restoreOriginalState();
            this.textContent = '🔍 Preview Answers';
            this.style.background = 'linear-gradient(45deg, #ff6b6b, #4ecdc4)';
            isPreviewMode = false;
        } else {
            interceptAndPreview();
            this.textContent = '↩️ Restore Original';
            this.style.background = 'linear-gradient(45deg, #95e1d3, #fce38a)';
            isPreviewMode = true;
        }
    }

    function interceptAndPreview() {
        console.log('🔍 Intercepting quiz submission to preview answers...');
        
        // Store original form submission handlers
        storeOriginalSubmitHandlers();
        
        // Find and temporarily override submit buttons
        const submitButtons = findSubmitButtons();
        submitButtons.forEach(overrideSubmitButton);
        
        // Simulate form submission to get response
        simulateSubmission();
    }

    function storeOriginalSubmitHandlers() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            if (!form._originalSubmit) {
                form._originalSubmit = form.onsubmit;
                form._originalAction = form.action;
            }
        });
    }

    function findSubmitButtons() {
        // Use proper CSS selectors and add specific quiz button selectors
        const selectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            '.quiz-card__button',  // Based on your HTML structure
            '[data-continue-btn]',
            '.submit-btn',
            '.continue-btn'
        ];
        
        const buttons = [];
        
        // Collect buttons from all selectors
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            buttons.push(...elements);
        });
        
        // Also find buttons by text content (manual approach since :contains() doesn't work)
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(button => {
            const text = button.textContent.toLowerCase().trim();
            if (text.includes('submit') || text.includes('continue') || text.includes('next')) {
                if (!buttons.includes(button)) {
                    buttons.push(button);
                }
            }
        });
        
        return buttons;
    }

    function overrideSubmitButton(button) {
        if (!button._originalClick) {
            button._originalClick = button.onclick;
            button.onclick = function(e) {
                e.preventDefault();
                console.log('Submit button clicked - intercepted!');
                return false;
            };
        }
    }

    function simulateSubmission() {
        // Method 1: Try to find the form and get its data
        const quizForm = document.querySelector('form');
        if (quizForm) {
            const formData = new FormData(quizForm);
            
            // Create a hidden iframe to submit the form and capture response
            createHiddenSubmission(quizForm, formData);
        } else {
            // Method 2: Try to trigger any existing submission logic
            triggerExistingSubmissionLogic();
        }
    }

    function createHiddenSubmission(form, formData) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.name = 'quiz-preview-frame';
        document.body.appendChild(iframe);

        // Clone the form for hidden submission
        const hiddenForm = form.cloneNode(true);
        hiddenForm.target = 'quiz-preview-frame';
        hiddenForm.style.display = 'none';
        document.body.appendChild(hiddenForm);

        // Listen for iframe load to capture response
        iframe.addEventListener('load', function() {
            handlePreviewResponse(iframe);
        });

        // Submit the hidden form
        setTimeout(() => {
            hiddenForm.submit();
        }, 100);
    }

    function triggerExistingSubmissionLogic() {
        // Look for quiz-specific submission patterns
        const quizOptions = document.querySelectorAll('.quiz-multiple-response-option');
        
        if (quizOptions.length > 0) {
            console.log('Found quiz options, analyzing structure...');
            analyzeQuizStructure(quizOptions);
        }
    }

    function analyzeQuizStructure(options) {
        console.log('📊 Quiz Analysis:');
        
        options.forEach((option, index) => {
            const text = option.querySelector('.quiz-multiple-response-option__text')?.textContent?.trim();
            const isSelected = option.classList.contains('quiz-multiple-response-option--selected');
            const hasCheck = option.querySelector('.quiz-multiple-response-option__check');
            const hasX = option.querySelector('.quiz-multiple-response-option__x');
            
            console.log(`Option ${index + 1}: ${text}`);
            console.log(`  Selected: ${isSelected}`);
            console.log(`  Has check mark: ${!!hasCheck}`);
            console.log(`  Has X mark: ${!!hasX}`);
        });

        // Try to make an AJAX request to get the correct answers
        attemptAjaxPreview();
    }

    function attemptAjaxPreview() {
        // Look for any existing AJAX endpoints or form actions
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            if (form.action) {
                console.log('🌐 Attempting AJAX preview to:', form.action);
                
                const formData = new FormData(form);
                
                fetch(form.action, {
                    method: form.method || 'POST',
                    body: formData,
                    headers: {
                        'X-Preview-Mode': 'true'
                    }
                })
                .then(response => response.text())
                .then(html => {
                    parseResponseForAnswers(html);
                })
                .catch(error => {
                    console.log('AJAX preview failed:', error);
                    showFallbackAnalysis();
                });
            }
        });
    }

    function handlePreviewResponse(iframe) {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const responseHtml = iframeDoc.documentElement.innerHTML;
            parseResponseForAnswers(responseHtml);
        } catch (error) {
            console.log('Could not access iframe content:', error);
            showFallbackAnalysis();
        }
    }

    function parseResponseForAnswers(html) {
        console.log('📋 Parsing response for correct answers...');
        
        // Create a temporary div to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Look for common patterns that indicate correct/incorrect answers
        const patterns = [
            '.correct', '.incorrect', '.right', '.wrong',
            '[data-correct="true"]', '[data-correct="false"]',
            '.quiz-option--correct', '.quiz-option--incorrect'
        ];
        
        let foundAnswers = false;
        
        patterns.forEach(pattern => {
            const elements = tempDiv.querySelectorAll(pattern);
            if (elements.length > 0) {
                console.log(`Found answer indicators with pattern: ${pattern}`);
                displayAnswerResults(elements, pattern);
                foundAnswers = true;
            }
        });
        
        if (!foundAnswers) {
            showFallbackAnalysis();
        }
    }

    function displayAnswerResults(elements, pattern) {
        const resultsDiv = createResultsDisplay();
        
        elements.forEach((element, index) => {
            const text = element.textContent?.trim() || `Option ${index + 1}`;
            const isCorrect = pattern.includes('correct') || pattern.includes('right');
            
            const resultItem = document.createElement('div');
            resultItem.style.cssText = `
                padding: 10px;
                margin: 5px 0;
                border-radius: 5px;
                background: ${isCorrect ? '#d4edda' : '#f8d7da'};
                border: 1px solid ${isCorrect ? '#c3e6cb' : '#f5c6cb'};
                color: ${isCorrect ? '#155724' : '#721c24'};
            `;
            
            resultItem.innerHTML = `
                <strong>${isCorrect ? '✅' : '❌'} ${text}</strong>
                <br><small>${isCorrect ? 'Correct Answer' : 'Incorrect Answer'}</small>
            `;
            
            resultsDiv.appendChild(resultItem);
        });
    }

    function showFallbackAnalysis() {
        const resultsDiv = createResultsDisplay();
        
        resultsDiv.innerHTML = `
            <div style="padding: 15px; text-align: center; color: #856404; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
                <h3>⚠️ Preview Mode Active</h3>
                <p>Could not automatically detect correct answers from server response.</p>
                <p><strong>Manual Analysis Required:</strong></p>
                <ul style="text-align: left; margin: 10px 0;">
                    <li>Check browser network tab for submission responses</li>
                    <li>Look for any visual changes after clicking submit</li>
                    <li>Monitor console for any answer-related data</li>
                </ul>
                <p><em>Your original form submission is still blocked. Click "Restore Original" to enable normal submission.</em></p>
            </div>
        `;
    }

    function createResultsDisplay() {
        let resultsDiv = document.getElementById('quiz-preview-results');
        
        if (!resultsDiv) {
            resultsDiv = document.createElement('div');
            resultsDiv.id = 'quiz-preview-results';
            resultsDiv.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                width: 350px;
                max-height: 400px;
                overflow-y: auto;
                background: white;
                border: 2px solid #007bff;
                border-radius: 10px;
                padding: 15px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.2);
                z-index: 10001;
                font-family: Arial, sans-serif;
            `;
            
            document.body.appendChild(resultsDiv);
        }
        
        resultsDiv.innerHTML = '<h3 style="margin-top: 0; color: #007bff;">🔍 Quiz Preview Results</h3>';
        return resultsDiv;
    }

    function restoreOriginalState() {
        console.log('↩️ Restoring original quiz state...');
        
        // Restore form submission handlers
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            if (form._originalSubmit !== undefined) {
                form.onsubmit = form._originalSubmit;
            }
            if (form._originalAction) {
                form.action = form._originalAction;
            }
        });
        
        // Restore button click handlers
        const buttons = findSubmitButtons();
        buttons.forEach(button => {
            if (button._originalClick !== undefined) {
                button.onclick = button._originalClick;
            }
        });
        
        // Remove results display
        const resultsDiv = document.getElementById('quiz-preview-results');
        if (resultsDiv) {
            resultsDiv.remove();
        }
        
        // Remove any hidden iframes
        const hiddenIframes = document.querySelectorAll('iframe[name="quiz-preview-frame"]');
        hiddenIframes.forEach(iframe => iframe.remove());
        
        console.log('✅ Original state restored. You can now submit normally.');
    }

    function initializeScript() {
        console.log('🚀 Quiz Answer Revealer initialized');
        createRevealButton();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeScript);
    } else {
        initializeScript();
    }

})();