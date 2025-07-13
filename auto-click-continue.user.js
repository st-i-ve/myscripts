// ==UserScript==
// @name         Manual Expand Elements Button
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a button to manually expand all collapsed elements (false to true)
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to expand all collapsed elements
    function expandAllElements() {
        let changedCount = 0;
        
        // Find all elements with aria-expanded="false"
        const collapsedElements = document.querySelectorAll('[aria-expanded="false"]');
        
        console.log(`Found ${collapsedElements.length} collapsed elements`);
        
        collapsedElements.forEach(element => {
            element.setAttribute('aria-expanded', 'true');
            console.log('Expanded element:', element);
            changedCount++;
        });

        // Also look for any class attributes containing "false" and replace with "true"
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            if (element.className && typeof element.className === 'string') {
                if (element.className.includes('false')) {
                    const oldClassName = element.className;
                    element.className = element.className.replace(/false/g, 'true');
                    console.log('Updated class from false to true:', element);
                    console.log('Old class:', oldClassName, '-> New class:', element.className);
                    changedCount++;
                }
            }
        });
        
        // Update button text to show results
        const expandBtn = document.getElementById('expand-elements-btn');
        if (expandBtn) {
            expandBtn.textContent = `Expand Elements (${changedCount} changed)`;
            setTimeout(() => {
                expandBtn.textContent = 'Expand Elements';
            }, 2000);
        }
        
        console.log(`Total elements changed: ${changedCount}`);
    }

    // Function to create and add the button
    function createExpandButton() {
        // Create button element
        const button = document.createElement('button');
        button.id = 'expand-elements-btn';
        button.textContent = 'Expand Elements';
        
        // Style the button
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 10px 15px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: background-color 0.3s;
        `;
        
        // Add hover effect
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#45a049';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = '#4CAF50';
        });
        
        // Add click event
        button.addEventListener('click', () => {
            console.log('Expand button clicked');
            expandAllElements();
        });
        
        // Add button to page
        document.body.appendChild(button);
        
        console.log('Expand button added to page');
    }

    // Wait for page to load completely
    function init() {
        if (document.body) {
            createExpandButton();
        } else {
            setTimeout(init, 100);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();