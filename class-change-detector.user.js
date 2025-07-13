// ==UserScript==
// @name         Class Change Detector
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Detects and logs class changes when clicking on elements
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let isMonitoring = false;
    let clickedElement = null;
    let originalClasses = new Map();
    let observer = null;

    // Function to start monitoring class changes
    function startMonitoring() {
        if (isMonitoring) return;
        
        isMonitoring = true;
        console.log('🔍 Class change monitoring started');
        
        // Store original classes of all elements
        function storeOriginalClasses(element) {
            if (element.className) {
                originalClasses.set(element, element.className.toString());
            }
        }
        document.querySelectorAll('*').forEach(storeOriginalClasses);
        
        // Named mutation handler function
        function handleMutations(mutations) {
            function processMutation(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const element = mutation.target;
                    const oldClass = mutation.oldValue || '';
                    const newClass = element.className || '';
                    
                    if (oldClass !== newClass) {
                        console.log('📝 Class change detected:');
                        console.log('  Element:', element);
                        console.log('  Old class:', oldClass);
                        console.log('  New class:', newClass);
                        console.log('  Changes:', getClassDifferences(oldClass, newClass));
                        console.log('  Time:', new Date().toLocaleTimeString());
                        console.log('---');
                    }
                }
            }
            mutations.forEach(processMutation);
        }
        
        // Set up mutation observer to watch for class changes
        observer = new MutationObserver(handleMutations);
        
        observer.observe(document.body, {
            attributes: true,
            attributeOldValue: true,
            attributeFilter: ['class'],
            subtree: true
        });
        
        // Add click listener to track which element was clicked
        document.addEventListener('click', handleClick, true);
        
        updateButtonText('Stop Monitoring');
    }
    
    // Function to stop monitoring
    function stopMonitoring() {
        if (!isMonitoring) return;
        
        isMonitoring = false;
        console.log('⏹️ Class change monitoring stopped');
        
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        
        document.removeEventListener('click', handleClick, true);
        originalClasses.clear();
        
        updateButtonText('Start Monitoring');
    }
    
    // Handle click events
    function handleClick(event) {
        clickedElement = event.target;
        console.log('🖱️ Click detected on:', clickedElement);
        console.log('  Element tag:', clickedElement.tagName);
        console.log('  Element class:', clickedElement.className);
        console.log('  Element ID:', clickedElement.id || 'No ID');
        
        // Named timeout handler function
        function clearClickedElement() {
            clickedElement = null;
        }
        
        // Set a timeout to capture changes that might happen after the click
        setTimeout(clearClickedElement, 1000);
    }
    
    // Function to get differences between old and new classes
    function getClassDifferences(oldClasses, newClasses) {
        const oldSet = new Set(oldClasses.split(' ').filter(c => c.trim()));
        const newSet = new Set(newClasses.split(' ').filter(c => c.trim()));
        
        const added = [...newSet].filter(c => !oldSet.has(c));
        const removed = [...oldSet].filter(c => !newSet.has(c));
        
        return {
            added: added.length > 0 ? added : 'None',
            removed: removed.length > 0 ? removed : 'None'
        };
    }
    
    // Function to update button text
    function updateButtonText(text) {
        const button = document.getElementById('class-monitor-btn');
        if (button) {
            button.textContent = text;
        }
    }
    
    // Function to create the monitoring button
    function createMonitorButton() {
        const button = document.createElement('button');
        button.id = 'class-monitor-btn';
        button.textContent = 'Start Monitoring';
        
        // Style the button
        button.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            z-index: 10000;
            padding: 10px 15px;
            background-color: #2196F3;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: background-color 0.3s;
        `;
        
        // Named event handler functions
        function handleMonitorButtonMouseEnter() {
            button.style.backgroundColor = isMonitoring ? '#d32f2f' : '#1976D2';
        }
        
        function handleMonitorButtonMouseLeave() {
            button.style.backgroundColor = isMonitoring ? '#f44336' : '#2196F3';
        }
        
        function handleMonitorButtonClick() {
            if (isMonitoring) {
                stopMonitoring();
                button.style.backgroundColor = '#2196F3';
            } else {
                startMonitoring();
                button.style.backgroundColor = '#f44336';
            }
        }
        
        // Add hover effect
        button.addEventListener('mouseenter', handleMonitorButtonMouseEnter);
        button.addEventListener('mouseleave', handleMonitorButtonMouseLeave);
        
        // Add click event
        button.addEventListener('click', handleMonitorButtonClick);
        
        // Add button to page
        document.body.appendChild(button);
        
        console.log('🔘 Class monitor button added to page');
    }
    
    // Function to create a clear console button
    function createClearButton() {
        const button = document.createElement('button');
        button.id = 'clear-console-btn';
        button.textContent = 'Clear Console';
        
        // Style the button
        button.style.cssText = `
            position: fixed;
            top: 120px;
            right: 20px;
            z-index: 10000;
            padding: 8px 12px;
            background-color: #FF9800;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: background-color 0.3s;
        `;
        
        // Named event handler functions
        function handleClearButtonMouseEnter() {
            button.style.backgroundColor = '#F57C00';
        }
        
        function handleClearButtonMouseLeave() {
            button.style.backgroundColor = '#FF9800';
        }
        
        function handleClearButtonClick() {
            console.clear();
            console.log('🧹 Console cleared');
        }
        
        // Add hover effect
        button.addEventListener('mouseenter', handleClearButtonMouseEnter);
        button.addEventListener('mouseleave', handleClearButtonMouseLeave);
        
        // Add click event
        button.addEventListener('click', handleClearButtonClick);
        
        // Add button to page
        document.body.appendChild(button);
    }
    
    // Initialize the script
    function init() {
        if (document.body) {
            createMonitorButton();
            createClearButton();
            console.log('🚀 Class Change Detector initialized');
            console.log('📋 Instructions:');
            console.log('  1. Click "Start Monitoring" to begin tracking class changes');
            console.log('  2. Click on any element on the page');
            console.log('  3. Watch the console for class change logs');
            console.log('  4. Click "Stop Monitoring" when done');
        } else {
            setTimeout(init, 100);
        }
    }
    
    // Named initialization function
    function initializeScript() {
        init();
    }
    
    // Start when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeScript);
    } else {
        init();
    }
    
})();