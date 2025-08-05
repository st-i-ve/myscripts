// Sequential Section Navigator V9.5 - Popup Script

class PopupController {
    constructor() {
        this.isRunning = false;
        this.currentTab = null;
        this.init();
    }

    async init() {
        // i get the current active tab
        this.currentTab = await this.getCurrentTab();
        
        // i set up event listeners
        this.setupEventListeners();
        
        // i check if we're on skillsline.com
        this.checkDomain();
        
        // i get initial status
        this.updateStatus();
    }

    async getCurrentTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab;
    }

    setupEventListeners() {
        const toggleBtn = document.getElementById('toggleBtn');
        const resetBtn = document.getElementById('resetBtn');

        toggleBtn.addEventListener('click', () => this.toggleExecution());
        resetBtn.addEventListener('click', () => this.resetExecution());

        // i listen for messages from content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'statusUpdate') {
                this.updatePopupStatus(message.data);
            }
        });
    }

    checkDomain() {
        const domainInfo = document.querySelector('.domain-info');
        
        if (!this.currentTab.url.includes('skillsline.com')) {
            domainInfo.innerHTML = '⚠️ This extension only works on <strong>skillsline.com</strong>';
            domainInfo.style.color = '#dc3545';
            
            // i disable controls
            document.getElementById('toggleBtn').disabled = true;
            document.getElementById('resetBtn').disabled = true;
        }
    }

    async toggleExecution() {
        const toggleBtn = document.getElementById('toggleBtn');
        const btnText = toggleBtn.querySelector('.btn-text');
        const btnIcon = toggleBtn.querySelector('.btn-icon');

        if (!this.isRunning) {
            // i start execution
            this.isRunning = true;
            toggleBtn.classList.add('stop');
            btnText.textContent = 'Stop Execution';
            btnIcon.textContent = '⏹️';
            
            // i send message to content script
            chrome.tabs.sendMessage(this.currentTab.id, { action: 'startNavigation' });
            
        } else {
            // i stop execution
            this.isRunning = false;
            toggleBtn.classList.remove('stop');
            btnText.textContent = 'Start Execution';
            btnIcon.textContent = '▶️';
            
            // i send message to content script
            chrome.tabs.sendMessage(this.currentTab.id, { action: 'stopNavigation' });
        }

        this.updateStatusIndicator('ready', 'Ready');
    }

    async resetExecution() {
        // i reset everything
        this.isRunning = false;
        const toggleBtn = document.getElementById('toggleBtn');
        const btnText = toggleBtn.querySelector('.btn-text');
        const btnIcon = toggleBtn.querySelector('.btn-icon');
        
        toggleBtn.classList.remove('stop');
        btnText.textContent = 'Start Execution';
        btnIcon.textContent = '▶️';

        // i send reset message to content script
        chrome.tabs.sendMessage(this.currentTab.id, { action: 'resetNavigation' });

        // i reset display values
        document.getElementById('currentSection').textContent = '-';
        document.getElementById('progress').textContent = '0/0';
        document.getElementById('blockType').textContent = '-';
        
        this.updateStatusIndicator('ready', 'Ready');
    }

    updateStatusIndicator(status, text) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        // i remove all status classes
        statusDot.className = 'status-dot';
        
        // i add appropriate class
        if (status !== 'ready') {
            statusDot.classList.add(status);
        }
        
        statusText.textContent = text;
    }

    updatePopupStatus(data) {
        // i update the popup with data from content script
        if (data.currentSection) {
            document.getElementById('currentSection').textContent = data.currentSection;
        }
        
        if (data.progress) {
            document.getElementById('progress').textContent = data.progress;
        }
        
        if (data.blockType) {
            document.getElementById('blockType').textContent = data.blockType;
        }
        
        if (data.status && data.statusText) {
            this.updateStatusIndicator(data.status, data.statusText);
        }
    }

    async updateStatus() {
        try {
            // i request status from content script
            const response = await chrome.tabs.sendMessage(this.currentTab.id, { action: 'getStatus' });
            
            if (response && response.isRunning) {
                this.isRunning = true;
                const toggleBtn = document.getElementById('toggleBtn');
                const btnText = toggleBtn.querySelector('.btn-text');
                const btnIcon = toggleBtn.querySelector('.btn-icon');
                
                toggleBtn.classList.add('stop');
                btnText.textContent = 'Stop Execution';
                btnIcon.textContent = '⏹️';
                
                this.updateStatusIndicator('waiting', 'Running...');
            }
        } catch (error) {
            // i handle case where content script isn't loaded yet
            console.log('Content script not ready yet');
        }
    }
}

// i initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});