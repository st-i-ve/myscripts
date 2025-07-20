// ==UserScript==
// @name         Smart Card Sorter (Iframe Aware)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Automatically sorts cards into correct piles using pattern matching - Works with iframes
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let isActive = false;
    let sortingInProgress = false;
    let currentSortingActivity = null;
    let iframeDocument = null; // Store reference to iframe document

    // Get the correct document context (iframe or main document)
    function getDocumentContext() {
        // First try to access iframe content
        const iframe = document.querySelector('iframe');
        
        if (iframe && iframe.contentDocument) {
            try {
                // Test if we can access the iframe content
                const testAccess = iframe.contentDocument.querySelector('*');
                console.log('✅ DEBUG: Successfully accessing iframe content');
                iframeDocument = iframe.contentDocument;
                return iframe.contentDocument;
            } catch (err) {
                console.warn('⚠️ DEBUG: Cross-origin iframe detected, using main document');
                iframeDocument = null;
                return document;
            }
        } else {
            console.log('📄 DEBUG: No iframe found, using main document');
            iframeDocument = null;
            return document;
        }
    }

    // Get current working context
    function getCurrentContext() {
        return iframeDocument || document;
    }

    // Test function to manually focus, click, and drag a specific card
    function testCardInteraction(cardId) {
        console.log('🧪 DEBUG: Testing card interaction for ID:', cardId);
        
        const doc = getCurrentContext();
        const card = doc.getElementById(cardId);
        
        if (!card) {
            console.error('❌ Card not found with ID:', cardId);
            return;
        }
        
        console.log('🧪 DEBUG: Found card:', card);
        console.log('🧪 DEBUG: Card classes:', card.className);
        console.log('🧪 DEBUG: Card transform:', card.style.transform);
        
        // Step 1: Focus the card
        console.log('🧪 DEBUG: Step 1 - Focusing card');
        card.focus();
        card.style.outline = '3px solid red'; // Visual indicator
        
        setTimeout(() => {
            // Step 2: Click the card
            console.log('🧪 DEBUG: Step 2 - Clicking card');
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: doc.defaultView || window,
                button: 0,
                buttons: 1,
                clientX: card.getBoundingClientRect().left + card.offsetWidth / 2,
                clientY: card.getBoundingClientRect().top + card.offsetHeight / 2
            });
            card.dispatchEvent(clickEvent);
            
            // Add visual feedback
            card.style.backgroundColor = 'yellow';
            
            setTimeout(() => {
                // Step 3: Simulate drag start
                console.log('🧪 DEBUG: Step 3 - Simulating drag start');
                card.classList.add('playing-card--moving');
                card.style.backgroundColor = 'lightblue';
                
                // Find a target pile for testing
                const piles = getAllPiles();
                if (piles.length > 0) {
                    console.log('🧪 DEBUG: Found', piles.length, 'piles for testing');
                    const targetPile = piles[0]; // Use first pile for testing
                    
                    setTimeout(() => {
                        // Attempt actual drag and drop
                        console.log('🧪 DEBUG: Step 4 - Attempting drag and drop to first pile');
                        simulateDragAndDrop(card, targetPile).then(() => {
                            // Reset visual indicators
                            card.style.outline = '';
                            card.style.backgroundColor = '';
                            console.log('🧪 DEBUG: Test completed');
                        });
                    }, 1000);
                } else {
                    console.log('🧪 DEBUG: No piles found for testing');
                    // Reset visual indicators
                    card.style.outline = '';
                    card.style.backgroundColor = '';
                    card.classList.remove('playing-card--moving');
                }
            }, 500);
        }, 500);
    }

    // Create control panel
    function createControlPanel() {
        if (document.getElementById('cardSorterPanel')) return;

        const panel = document.createElement('div');
        panel.id = 'cardSorterPanel';
        panel.innerHTML = `
            <div style="position: fixed; bottom: 10px; right: 10px; z-index: 99999; background: #2c3e50; color: white; padding: 15px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: Arial, sans-serif; min-width: 220px;">
                <h4 style="margin: 0 0 10px 0; color: #3498db; text-align: center;">🧠 Smart Card Sorter</h4>
                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <button id="activateCardSorter" style="flex: 1; padding: 8px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🟢 ON</button>
                    <button id="deactivateCardSorter" style="flex: 1; padding: 8px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🔴 OFF</button>
                </div>
                <div id="cardSorterStatus" style="text-align: center; padding: 5px; margin-bottom: 8px; background: #e74c3c; border-radius: 4px; font-size: 12px; font-weight: bold;">
                    ❌ INACTIVE
                </div>
                <button id="scanForSorting" style="width: 100%; padding: 8px; margin-bottom: 5px; background: #9b59b6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🔍 Scan for Sorting</button>
                <button id="sortCardsNow" style="width: 100%; padding: 8px; margin-bottom: 8px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; opacity: 0.5;" disabled>🚀 Sort Cards Now</button>
                <div style="margin-bottom: 8px;">
                    <input type="text" id="testCardId" placeholder="Card ID for testing" style="width: 100%; padding: 5px; border: none; border-radius: 3px; font-size: 11px; margin-bottom: 5px; color: black;">
                    <button id="testCardBtn" style="width: 100%; padding: 8px; background: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🧪 Test Card</button>
                </div>
                <div style="margin-top: 10px; font-size: 11px; color: #bdc3c7; text-align: center;">
                    Context: <span id="contextType">Main</span><br>
                    Sorting found: <span id="sortingFound">No</span><br>
                    Cards: <span id="cardCount">0</span> | Piles: <span id="pileCount">0</span><br>
                    Status: <span id="sortStatus">Ready</span>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        setupEventHandlers();
    }

    // Setup event handlers
    function setupEventHandlers() {
        const activateBtn = document.getElementById('activateCardSorter');
        const deactivateBtn = document.getElementById('deactivateCardSorter');
        const scanBtn = document.getElementById('scanForSorting');
        const sortBtn = document.getElementById('sortCardsNow');
        const testBtn = document.getElementById('testCardBtn');
        const statusDiv = document.getElementById('cardSorterStatus');

        activateBtn.addEventListener('click', () => {
            isActive = true;
            statusDiv.textContent = '✅ ACTIVE';
            statusDiv.style.background = '#27ae60';
            sortBtn.disabled = false;
            sortBtn.style.opacity = '1';
            
            // Detect iframe context when activating
            getDocumentContext();
            updateContextDisplay();
            scanForSortingActivity();
            console.log('🧠 Smart Card Sorter activated!');
        });

        deactivateBtn.addEventListener('click', () => {
            isActive = false;
            statusDiv.textContent = '❌ INACTIVE';
            statusDiv.style.background = '#e74c3c';
            sortBtn.disabled = true;
            sortBtn.style.opacity = '0.5';
            currentSortingActivity = null;
            updateDisplay();
            console.log('🧠 Smart Card Sorter deactivated!');
        });

        scanBtn.addEventListener('click', () => {
            // Re-detect iframe context on each scan
            getDocumentContext();
            updateContextDisplay();
            scanForSortingActivity();
        });

        sortBtn.addEventListener('click', () => {
            if (isActive && !sortingInProgress && currentSortingActivity) {
                sortAllCards();
            }
        });

        testBtn.addEventListener('click', () => {
            const cardId = document.getElementById('testCardId').value.trim();
            if (cardId) {
                testCardInteraction(cardId);
            } else {
                alert('Please enter a card ID to test');
            }
        });
    }

    // Update context display to show if we're using iframe or main document
    function updateContextDisplay() {
        const contextSpan = document.getElementById('contextType');
        if (contextSpan) {
            contextSpan.textContent = iframeDocument ? 'Iframe' : 'Main';
            contextSpan.style.color = iframeDocument ? '#2ecc71' : '#e74c3c';
        }
    }

    // Scan for sorting activities under lesson-main
    function scanForSortingActivity() {
        const statusSpan = document.getElementById('sortStatus');
        statusSpan.textContent = 'Scanning...';

        console.log('🔍 DEBUG: Starting scan for sorting activity...');
        
        // Get the correct document context (iframe or main)
        const context = getCurrentContext();
        console.log('🔍 DEBUG: Using context:', iframeDocument ? 'iframe' : 'main document');
        
        // Try multiple approaches to find sorting activities
        let sortingActivities = [];
        
        // Method 1: Look for .sorting class directly
        sortingActivities = context.querySelectorAll('.sorting');
        console.log('🔍 DEBUG: Method 1 - Direct .sorting search found:', sortingActivities.length);
        
        // Method 2: Look for elements with data-ba="blocks.blockSortingActivity"
        if (sortingActivities.length === 0) {
            sortingActivities = context.querySelectorAll('[data-ba="blocks.blockSortingActivity"]');
            console.log('🔍 DEBUG: Method 2 - data-ba attribute search found:', sortingActivities.length);
        }
        
        // Method 3: Look for elements with aria-label="Sorting Activity"
        if (sortingActivities.length === 0) {
            sortingActivities = context.querySelectorAll('[aria-label="Sorting Activity"]');
            console.log('🔍 DEBUG: Method 3 - aria-label search found:', sortingActivities.length);
        }
        
        // Method 4: Look for containers with both .deck and .pile elements
        if (sortingActivities.length === 0) {
            const potentialContainers = context.querySelectorAll('*');
            for (const container of potentialContainers) {
                const hasDecks = container.querySelectorAll('.deck').length > 0;
                const hasPiles = container.querySelectorAll('.pile').length > 0;
                if (hasDecks && hasPiles) {
                    sortingActivities = [container];
                    console.log('🔍 DEBUG: Method 4 - Found container with decks and piles:', container);
                    break;
                }
            }
            console.log('🔍 DEBUG: Method 4 - Container search found:', sortingActivities.length);
        }

        // Debug: Show all elements with relevant classes
        const debugElements = {
            sorting: context.querySelectorAll('.sorting'),
            deck: context.querySelectorAll('.deck'),
            pile: context.querySelectorAll('.pile'),
            playingCard: context.querySelectorAll('.playing-card'),
            draggable: context.querySelectorAll('[draggable="true"]'),
            sortingData: context.querySelectorAll('[data-ba*="sorting"]'),
            sortingAria: context.querySelectorAll('[aria-label*="Sorting"]')
        };
        
        console.log('🔍 DEBUG: Element counts:', debugElements);

        if (sortingActivities.length > 0) {
            currentSortingActivity = sortingActivities[0]; // Use the first one found
            console.log('✅ DEBUG: Selected sorting activity:', currentSortingActivity);
            console.log('✅ DEBUG: Sorting activity classes:', currentSortingActivity.className);
            console.log('✅ DEBUG: Sorting activity HTML preview:', currentSortingActivity.outerHTML.substring(0, 300) + '...');
            updateDisplay();
            statusSpan.textContent = 'Found!';
            setTimeout(() => statusSpan.textContent = 'Ready', 1500);
        } else {
            currentSortingActivity = null;
            console.log('❌ DEBUG: No sorting activities found with any method');
            updateDisplay();
            statusSpan.textContent = 'Not found';
            setTimeout(() => statusSpan.textContent = 'Ready', 1500);
        }
    }

    // Update display with current sorting activity info
    function updateDisplay() {
        console.log('📊 DEBUG: Updating display...');
        
        const sortingFoundSpan = document.getElementById('sortingFound');
        const cardCountSpan = document.getElementById('cardCount');
        const pileCountSpan = document.getElementById('pileCount');

        console.log('📊 DEBUG: Display elements found:', {
            sortingFoundSpan: !!sortingFoundSpan,
            cardCountSpan: !!cardCountSpan,
            pileCountSpan: !!pileCountSpan
        });

        if (currentSortingActivity) {
            console.log('📊 DEBUG: Current sorting activity exists, getting cards and piles...');
            sortingFoundSpan.textContent = 'Yes';
            
            const cards = getAllDraggableCards();
            const piles = getAllPiles();
            
            console.log('📊 DEBUG: Display update results:', {
                cardsFound: cards.length,
                pilesFound: piles.length
            });
            
            cardCountSpan.textContent = cards.length;
            pileCountSpan.textContent = piles.length;
        } else {
            console.log('📊 DEBUG: No current sorting activity');
            sortingFoundSpan.textContent = 'No';
            cardCountSpan.textContent = '0';
            pileCountSpan.textContent = '0';
        }
    }

    // Get all draggable cards from current sorting activity
    function getAllDraggableCards() {
        console.log('🃏 DEBUG: Getting draggable cards...');
        console.log('🃏 DEBUG: Current sorting activity:', currentSortingActivity);
        
        if (!currentSortingActivity) {
            console.log('❌ DEBUG: No current sorting activity');
            return [];
        }

        let cards = [];
        
        // Method 1: Look for .playing-card--draggable elements (most specific)
        cards = currentSortingActivity.querySelectorAll('.playing-card--draggable');
        console.log('🃏 DEBUG: Method 1 - .playing-card--draggable found:', cards.length);
        
        // Method 2: Look for .playing-card elements that are draggable
        if (cards.length === 0) {
            cards = currentSortingActivity.querySelectorAll('.playing-card[draggable="true"]');
            console.log('🃏 DEBUG: Method 2 - .playing-card[draggable="true"] found:', cards.length);
        }
        
        // Method 3: Look for any .playing-card elements
        if (cards.length === 0) {
            cards = currentSortingActivity.querySelectorAll('.playing-card');
            console.log('🃏 DEBUG: Method 3 - .playing-card found:', cards.length);
        }
        
        // Method 4: Look for any draggable elements
        if (cards.length === 0) {
            cards = currentSortingActivity.querySelectorAll('[draggable="true"]');
            console.log('🃏 DEBUG: Method 4 - [draggable="true"] found:', cards.length);
        }
        
        // Method 5: Look for elements with data-ba containing "card"
        if (cards.length === 0) {
            cards = currentSortingActivity.querySelectorAll('[data-ba*="card"]');
            console.log('🃏 DEBUG: Method 5 - [data-ba*="card"] found:', cards.length);
        }

        // Filter out cards that are already moving (have --moving class)
        const availableCards = Array.from(cards).filter(card => 
            !card.classList.contains('playing-card--moving')
        );
        
        console.log(`🃏 DEBUG: Total cards found: ${cards.length}, Available (not moving): ${availableCards.length}`);

        // Debug: Show all potential card elements
        const debugElements = {
            playingCard: currentSortingActivity.querySelectorAll('.playing-card'),
            playingCardDraggable: currentSortingActivity.querySelectorAll('.playing-card--draggable'),
            playingCardMoving: currentSortingActivity.querySelectorAll('.playing-card--moving'),
            draggable: currentSortingActivity.querySelectorAll('[draggable="true"]'),
            cardData: currentSortingActivity.querySelectorAll('[data-ba*="card"]'),
            allChildren: currentSortingActivity.children
        };
        
        console.log('🃏 DEBUG: Card element counts:', debugElements);
        
        // Log details of found cards
        if (availableCards.length > 0) {
            console.log('🃏 DEBUG: Found available cards details:');
            availableCards.forEach((card, index) => {
                const title = card.getAttribute('title') || card.textContent?.trim() || 'No title';
                const id = card.id || 'No ID';
                const transform = card.style.transform || 'No transform';
                console.log(`🃏 DEBUG: Card ${index}: ID="${id}", Title="${title}", Transform="${transform}", Classes="${card.className}"`);
            });
        } else {
            console.log('🃏 DEBUG: No available cards found. Showing all children of sorting activity:');
            Array.from(currentSortingActivity.children).forEach((child, index) => {
                console.log(`🃏 DEBUG: Child ${index}:`, child.tagName, child.className, child.textContent?.substring(0, 50));
            });
        }

        return availableCards;
    }

    // Get all piles from current sorting activity
    function getAllPiles() {
        console.log('🗂️ DEBUG: Getting piles...');
        console.log('🗂️ DEBUG: Current sorting activity:', currentSortingActivity);
        
        if (!currentSortingActivity) {
            console.log('❌ DEBUG: No current sorting activity');
            return [];
        }

        let piles = [];
        
        // Method 1: Look for .pile elements
        piles = currentSortingActivity.querySelectorAll('.pile');
        console.log('🗂️ DEBUG: Method 1 - .pile found:', piles.length);
        
        // Method 2: Look for elements with data-ba containing "pile"
        if (piles.length === 0) {
            piles = currentSortingActivity.querySelectorAll('[data-ba*="pile"]');
            console.log('🗂️ DEBUG: Method 2 - [data-ba*="pile"] found:', piles.length);
        }
        
        // Method 3: Look for drop zones or containers
        if (piles.length === 0) {
            piles = currentSortingActivity.querySelectorAll('.drop-zone, .container, .target');
            console.log('🗂️ DEBUG: Method 3 - drop zones/containers found:', piles.length);
        }
        
        // Method 4: Look for elements with role="button" that might be piles
        if (piles.length === 0) {
            piles = currentSortingActivity.querySelectorAll('[role="button"]');
            console.log('🗂️ DEBUG: Method 4 - [role="button"] found:', piles.length);
        }

        // Debug: Show all potential pile elements
        const debugElements = {
            pile: currentSortingActivity.querySelectorAll('.pile'),
            pileData: currentSortingActivity.querySelectorAll('[data-ba*="pile"]'),
            dropZone: currentSortingActivity.querySelectorAll('.drop-zone'),
            container: currentSortingActivity.querySelectorAll('.container'),
            target: currentSortingActivity.querySelectorAll('.target'),
            roleButton: currentSortingActivity.querySelectorAll('[role="button"]'),
            allChildren: currentSortingActivity.children
        };
        
        console.log('🗂️ DEBUG: Pile element counts:', debugElements);
        
        // Log details of found piles
        if (piles.length > 0) {
            console.log('🗂️ DEBUG: Found piles details:');
            Array.from(piles).forEach((pile, index) => {
                const title = pile.getAttribute('title') || pile.getAttribute('aria-label') || pile.textContent?.trim() || 'No title';
                console.log(`🗂️ DEBUG: Pile ${index}: "${title}" - Classes: ${pile.className}`);
            });
        } else {
            console.log('🗂️ DEBUG: No piles found. Showing all children of sorting activity:');
            Array.from(currentSortingActivity.children).forEach((child, index) => {
                const title = child.getAttribute('title') || child.getAttribute('aria-label') || child.textContent?.substring(0, 50) || 'No title';
                console.log(`🗂️ DEBUG: Child ${index}:`, child.tagName, child.className, `"${title}"`);
            });
        }

        return Array.from(piles);
    }

    // Smart pattern matching to determine which pile a card belongs to
    function determineCardCategory(cardText, pileOptions) {
        const text = cardText.toLowerCase().trim();
        
        // Try different matching strategies
        const strategies = [
            // Strategy 1: Exact keyword matching
            (text, piles) => {
                for (const pile of piles) {
                    const pileTitle = getPileTitle(pile).toLowerCase();
                    const pileKeywords = extractKeywords(pileTitle);
                    
                    for (const keyword of pileKeywords) {
                        if (text.includes(keyword) && keyword.length > 2) {
                            return pile;
                        }
                    }
                }
                return null;
            },
            
            // Strategy 2: Semantic similarity (positive/negative sentiment)
            (text, piles) => {
                const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'win', 'achieve', 'accomplish', 'strong', 'confident', 'capable', 'smart', 'talented', 'worthy', 'deserve', 'can', 'will', 'able', 'possible', 'easy', 'simple'];
                const negativeWords = ['bad', 'terrible', 'awful', 'negative', 'failure', 'lose', 'fail', 'wrong', 'weak', 'stupid', 'worthless', 'can\'t', 'won\'t', 'unable', 'impossible', 'hard', 'difficult', 'never', 'always'];
                
                const hasPositive = positiveWords.some(word => text.includes(word));
                const hasNegative = negativeWords.some(word => text.includes(word));
                
                for (const pile of piles) {
                    const pileTitle = getPileTitle(pile).toLowerCase();
                    
                    if (hasPositive && (pileTitle.includes('positive') || pileTitle.includes('good') || pileTitle.includes('correct') || pileTitle.includes('yes') || !pileTitle.includes('not'))) {
                        return pile;
                    }
                    if (hasNegative && (pileTitle.includes('negative') || pileTitle.includes('bad') || pileTitle.includes('wrong') || pileTitle.includes('not') || pileTitle.includes('limit'))) {
                        return pile;
                    }
                }
                return null;
            },
            
            // Strategy 3: Length-based categorization (sometimes short vs long)
            (text, piles) => {
                if (piles.length === 2) {
                    const pile1Title = getPileTitle(piles[0]).toLowerCase();
                    const pile2Title = getPileTitle(piles[1]).toLowerCase();
                    
                    if ((pile1Title.includes('short') || pile1Title.includes('brief')) && text.length < 20) {
                        return piles[0];
                    }
                    if ((pile2Title.includes('short') || pile2Title.includes('brief')) && text.length < 20) {
                        return piles[1];
                    }
                    if ((pile1Title.includes('long') || pile1Title.includes('detailed')) && text.length > 20) {
                        return piles[0];
                    }
                    if ((pile2Title.includes('long') || pile2Title.includes('detailed')) && text.length > 20) {
                        return piles[1];
                    }
                }
                return null;
            },
            
            // Strategy 4: Category-specific patterns
            (text, piles) => {
                // Try to match based on common educational categories
                const categories = {
                    'fact': ['is', 'are', 'was', 'were', 'has', 'have', 'will', 'can', 'does', 'did'],
                    'opinion': ['think', 'believe', 'feel', 'should', 'might', 'could', 'probably', 'maybe', 'seems', 'appears'],
                    'cause': ['because', 'due to', 'caused by', 'results from', 'leads to', 'since'],
                    'effect': ['therefore', 'thus', 'consequently', 'as a result', 'so', 'then'],
                    'example': ['for example', 'such as', 'like', 'including', 'for instance'],
                    'definition': ['means', 'is defined as', 'refers to', 'is called', 'known as']
                };
                
                for (const pile of piles) {
                    const pileTitle = getPileTitle(pile).toLowerCase();
                    
                    for (const [category, patterns] of Object.entries(categories)) {
                        if (pileTitle.includes(category)) {
                            const hasPattern = patterns.some(pattern => text.includes(pattern));
                            if (hasPattern) {
                                return pile;
                            }
                        }
                    }
                }
                return null;
            }
        ];
        
        // Try each strategy until one returns a result
        for (const strategy of strategies) {
            const result = strategy(text, pileOptions);
            if (result) {
                return result;
            }
        }
        
        // Fallback: random assignment or first pile
        return pileOptions[0] || null;
    }
    
    // Extract keywords from pile title
    function extractKeywords(title) {
        // Remove common words and split
        const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        return title.split(/\s+/)
            .filter(word => word.length > 2 && !commonWords.includes(word))
            .map(word => word.replace(/[^\w]/g, ''));
    }

    // Get card text content
    function getCardText(card) {
        const titleElement = card.querySelector('.playing-card__title .fr-view');
        return titleElement ? titleElement.textContent.trim() : '';
    }

    // Get pile title
    function getPileTitle(pile) {
        const pileContainer = pile.closest('.pile');
        const titleElement = pileContainer.querySelector('.pile__title .fr-view');
        return titleElement ? titleElement.textContent.trim() : '';
    }

    // Enhanced drag and drop simulation with focus and click handling
    function simulateDragAndDrop(card, targetPile) {
        return new Promise((resolve) => {
            const doc = getCurrentContext();
            console.log('🎯 DEBUG: Starting enhanced drag simulation for card:', card.id || card.className);
            
            try {
                // Step 1: Focus on the card
                console.log('🎯 DEBUG: Step 1 - Focusing card');
                card.focus();
                
                // Step 2: Click the card to activate it
                console.log('🎯 DEBUG: Step 2 - Clicking card');
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: doc.defaultView || window,
                    button: 0,
                    buttons: 1,
                    clientX: card.getBoundingClientRect().left + card.offsetWidth / 2,
                    clientY: card.getBoundingClientRect().top + card.offsetHeight / 2
                });
                card.dispatchEvent(clickEvent);
                
                // Small delay to allow click processing
                setTimeout(() => {
                    // Step 3: Start drag operation
                    console.log('🎯 DEBUG: Step 3 - Starting drag');
                    const cardRect = card.getBoundingClientRect();
                    const targetRect = targetPile.getBoundingClientRect();
                    
                    // Create drag start event
                    const dragStartEvent = new DragEvent('dragstart', {
                        bubbles: true,
                        cancelable: true,
                        view: doc.defaultView || window,
                        clientX: cardRect.left + cardRect.width / 2,
                        clientY: cardRect.top + cardRect.height / 2
                    });
                    
                    // Set drag data if dataTransfer is available
                    if (dragStartEvent.dataTransfer) {
                        dragStartEvent.dataTransfer.setData('text/plain', card.id || 'card');
                        dragStartEvent.dataTransfer.effectAllowed = 'move';
                    }
                    
                    card.dispatchEvent(dragStartEvent);
                    console.log('🎯 DEBUG: Drag start event dispatched');
                    
                    // Add moving class to simulate the dragging state
                    card.classList.add('playing-card--moving');
                    
                    setTimeout(() => {
                        // Step 4: Drag over target
                        console.log('🎯 DEBUG: Step 4 - Drag over target');
                        const dragOverEvent = new DragEvent('dragover', {
                            bubbles: true,
                            cancelable: true,
                            view: doc.defaultView || window,
                            clientX: targetRect.left + targetRect.width / 2,
                            clientY: targetRect.top + targetRect.height / 2
                        });
                        
                        targetPile.dispatchEvent(dragOverEvent);
                        
                        setTimeout(() => {
                            // Step 5: Drop on target
                            console.log('🎯 DEBUG: Step 5 - Dropping on target');
                            const dropEvent = new DragEvent('drop', {
                                bubbles: true,
                                cancelable: true,
                                view: doc.defaultView || window,
                                clientX: targetRect.left + targetRect.width / 2,
                                clientY: targetRect.top + targetRect.height / 2
                            });
                            
                            targetPile.dispatchEvent(dropEvent);
                            
                            // Step 6: End drag operation
                            const dragEndEvent = new DragEvent('dragend', {
                                bubbles: true,
                                cancelable: true,
                                view: doc.defaultView || window,
                                clientX: targetRect.left + targetRect.width / 2,
                                clientY: targetRect.top + targetRect.height / 2
                            });
                            
                            card.dispatchEvent(dragEndEvent);
                            
                            // Remove moving class after drag completes
                            setTimeout(() => {
                                card.classList.remove('playing-card--moving');
                                console.log('🎯 DEBUG: Enhanced drag simulation completed');
                                resolve();
                            }, 100);
                        }, 100);
                    }, 100);
                }, 50);
                
            } catch (error) {
                console.error('❌ Enhanced drag simulation failed:', error);
                // Fallback to mouse simulation
                simulateMouseDragAndDrop(card, targetPile).then(resolve);
            }
        });
    }

    // Enhanced mouse-based drag and drop simulation
    function simulateMouseDragAndDrop(card, targetPile) {
        return new Promise((resolve) => {
            const doc = getCurrentContext();
            console.log('🖱️ DEBUG: Starting enhanced mouse drag simulation for card:', card.id || card.className);
            
            try {
                const cardRect = card.getBoundingClientRect();
                const targetRect = targetPile.getBoundingClientRect();
                
                // Step 1: Focus the card
                console.log('🖱️ DEBUG: Step 1 - Focusing card');
                card.focus();
                
                // Step 2: Mouse down on card (with focus)
                console.log('🖱️ DEBUG: Step 2 - Mouse down on card');
                const mouseDownEvent = new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                    view: doc.defaultView || window,
                    button: 0,
                    buttons: 1,
                    clientX: cardRect.left + cardRect.width / 2,
                    clientY: cardRect.top + cardRect.height / 2
                });
                
                card.dispatchEvent(mouseDownEvent);
                
                // Add moving class to simulate dragging state
                card.classList.add('playing-card--moving');
                
                setTimeout(() => {
                    // Step 3: Mouse move to target (simulating drag)
                    console.log('🖱️ DEBUG: Step 3 - Mouse move to target');
                    const mouseMoveEvent = new MouseEvent('mousemove', {
                        bubbles: true,
                        cancelable: true,
                        view: doc.defaultView || window,
                        button: 0,
                        buttons: 1,
                        clientX: targetRect.left + targetRect.width / 2,
                        clientY: targetRect.top + targetRect.height / 2
                    });
                    
                    doc.dispatchEvent(mouseMoveEvent);
                    
                    setTimeout(() => {
                        // Step 4: Mouse up on target (drop)
                        console.log('🖱️ DEBUG: Step 4 - Mouse up on target');
                        const mouseUpEvent = new MouseEvent('mouseup', {
                            bubbles: true,
                            cancelable: true,
                            view: doc.defaultView || window,
                            button: 0,
                            buttons: 0,
                            clientX: targetRect.left + targetRect.width / 2,
                            clientY: targetRect.top + targetRect.height / 2
                        });
                        
                        targetPile.dispatchEvent(mouseUpEvent);
                        
                        // Step 5: Click on target to confirm drop
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: doc.defaultView || window,
                            button: 0,
                            buttons: 0,
                            clientX: targetRect.left + targetRect.width / 2,
                            clientY: targetRect.top + targetRect.height / 2
                        });
                        
                        targetPile.dispatchEvent(clickEvent);
                        
                        // Remove moving class after operation completes
                        setTimeout(() => {
                            card.classList.remove('playing-card--moving');
                            console.log('🖱️ DEBUG: Enhanced mouse drag simulation completed');
                            resolve();
                        }, 100);
                    }, 100);
                }, 100);
                
            } catch (error) {
                console.error('❌ Enhanced mouse drag simulation failed:', error);
                resolve();
            }
        });
    }

    // Sort a single card using smart pattern matching
    async function sortCard(card) {
        const cardText = getCardText(card);
        const piles = getAllPiles();
        
        if (piles.length === 0) {
            console.log('No piles found');
            return false;
        }

        // Use smart pattern matching to determine the target pile
        const targetPile = determineCardCategory(cardText, piles);

        if (targetPile) {
            const targetPileTitle = getPileTitle(targetPile);
            console.log(`Sorting "${cardText}" to "${targetPileTitle}"`);
            
            // Try both drag methods
            try {
                await simulateDragAndDrop(card, targetPile);
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // If drag didn't work, try mouse events
                if (card.parentElement && card.parentElement.contains(card)) {
                    await simulateMouseDragAndDrop(card, targetPile);
                }
                
                return true;
            } catch (error) {
                console.log('Drag simulation failed:', error);
                return false;
            }
        } else {
            console.log(`Could not determine category for: "${cardText}"`);
            return false;
        }
    }

    // Sort all cards in the current sorting activity
    async function sortAllCards() {
        if (sortingInProgress || !currentSortingActivity) return;
        
        sortingInProgress = true;
        const statusSpan = document.getElementById('sortStatus');
        
        try {
            statusSpan.textContent = 'Sorting...';
            
            const cards = getAllDraggableCards();
            const piles = getAllPiles();
            
            console.log(`Found ${cards.length} cards and ${piles.length} piles`);
            console.log('Pile titles:', Array.from(piles).map(pile => getPileTitle(pile)));
            
            if (cards.length === 0) {
                statusSpan.textContent = 'No cards found';
                setTimeout(() => statusSpan.textContent = 'Ready', 2000);
                return;
            }
            
            if (piles.length === 0) {
                statusSpan.textContent = 'No piles found';
                setTimeout(() => statusSpan.textContent = 'Ready', 2000);
                return;
            }
            
            let successCount = 0;
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                statusSpan.textContent = `Sorting ${i + 1}/${cards.length}`;
                
                const success = await sortCard(card);
                if (success) successCount++;
                
                await new Promise(resolve => setTimeout(resolve, 400)); // Delay between cards
                
                // Update display after each sort
                updateDisplay();
            }
            
            statusSpan.textContent = `Complete! (${successCount}/${cards.length})`;
            setTimeout(() => {
                statusSpan.textContent = 'Ready';
            }, 3000);
            
        } catch (error) {
            console.error('Error during sorting:', error);
            statusSpan.textContent = 'Error!';
            setTimeout(() => {
                statusSpan.textContent = 'Ready';
            }, 2000);
        } finally {
            sortingInProgress = false;
        }
    }

    // Initialize when page loads
    function initialize() {
        // Wait for page to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initialize);
            return;
        }

        // Wait a bit more for dynamic content and iframes
        setTimeout(() => {
            createControlPanel();
            
            // Initial iframe detection
            getDocumentContext();
            updateContextDisplay();
            
            console.log('🃏 Auto Card Sorter loaded! Click ON to activate.');
            console.log('🔍 Context detected:', iframeDocument ? 'iframe' : 'main document');
            
            // Monitor for iframe changes
            monitorIframeChanges();
        }, 1500); // Increased delay for iframe loading
    }

    // Monitor iframe changes and content loading
    function monitorIframeChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Check if new iframes were added
                    const addedNodes = Array.from(mutation.addedNodes);
                    const hasNewIframe = addedNodes.some(node => 
                        node.nodeType === Node.ELEMENT_NODE && 
                        (node.tagName === 'IFRAME' || node.querySelector('iframe'))
                    );
                    
                    if (hasNewIframe) {
                        console.log('🔍 New iframe detected, updating context...');
                        setTimeout(() => {
                            getDocumentContext();
                            updateContextDisplay();
                        }, 1000);
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Auto-sort when activated (optional)
    function startAutoSorting() {
        if (!isActive) return;
        
        const observer = new MutationObserver((mutations) => {
            if (!isActive || sortingInProgress) return;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    updateDisplay();
                }
            });
        });

        // Monitor both main document and iframe if available
        const context = getCurrentContext();
        const sortingContainer = context.querySelector('.sorting');
        if (sortingContainer) {
            observer.observe(sortingContainer, {
                childList: true,
                subtree: true
            });
            console.log('🔍 Monitoring sorting container in:', iframeDocument ? 'iframe' : 'main document');
        }
    }

    // Start initialization
    initialize();
    startAutoSorting();

})();