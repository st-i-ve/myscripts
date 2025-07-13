// ==UserScript==
// @name         Quiz Network Interceptor
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Intercept quiz network requests to find answers
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let originalFetch = window.fetch;
    let originalXHR = window.XMLHttpRequest;
    let interceptedData = [];

    function createInterceptorButton() {
        const button = document.createElement('button');
        button.textContent = '🕵️ Start Network Monitoring';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 10000;
            background: linear-gradient(45deg, #667eea, #764ba2);
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

        button.addEventListener('click', function() {
            if (this.textContent.includes('Start')) {
                startNetworkInterception();
                this.textContent = '📊 View Captured Data';
                this.style.background = 'linear-gradient(45deg, #f093fb, #f5576c)';
            } else {
                showCapturedData();
            }
        });

        document.body.appendChild(button);
        return button;
    }

    function startNetworkInterception() {
        console.log('🕵️ Starting network interception...');
        interceptedData = [];

        // Intercept fetch requests
        window.fetch = function(...args) {
            console.log('🌐 Fetch intercepted:', args[0]);
            
            return originalFetch.apply(this, args)
                .then(response => {
                    // Clone the response to read it
                    const clonedResponse = response.clone();
                    
                    clonedResponse.text().then(text => {
                        interceptedData.push({
                            type: 'fetch',
                            url: args[0],
                            method: args[1]?.method || 'GET',
                            response: text,
                            timestamp: new Date().toISOString()
                        });
                        
                        console.log('📥 Response captured:', text.substring(0, 200) + '...');
                        analyzeResponseForAnswers(text);
                    });
                    
                    return response;
                })
                .catch(error => {
                    console.log('❌ Fetch error:', error);
                    return Promise.reject(error);
                });
        };

        // Intercept XMLHttpRequest
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalSend = xhr.send;
            const originalOpen = xhr.open;
            
            let requestData = {};
            
            xhr.open = function(method, url, ...args) {
                requestData.method = method;
                requestData.url = url;
                console.log('🌐 XHR opened:', method, url);
                return originalOpen.apply(this, [method, url, ...args]);
            };
            
            xhr.send = function(data) {
                requestData.data = data;
                
                xhr.addEventListener('load', function() {
                    interceptedData.push({
                        type: 'xhr',
                        url: requestData.url,
                        method: requestData.method,
                        requestData: requestData.data,
                        response: xhr.responseText,
                        status: xhr.status,
                        timestamp: new Date().toISOString()
                    });
                    
                    console.log('📥 XHR Response captured:', xhr.responseText.substring(0, 200) + '...');
                    analyzeResponseForAnswers(xhr.responseText);
                });
                
                return originalSend.apply(this, [data]);
            };
            
            return xhr;
        };
        
        // Copy original properties
        Object.setPrototypeOf(window.XMLHttpRequest.prototype, originalXHR.prototype);
        Object.setPrototypeOf(window.XMLHttpRequest, originalXHR);
        
        showMonitoringStatus();
    }

    function analyzeResponseForAnswers(responseText) {
        try {
            // Try to parse as JSON first
            const jsonData = JSON.parse(responseText);
            
            // Look for common answer patterns in JSON
            const answerPatterns = [
                'correct', 'incorrect', 'right', 'wrong', 'answer', 'solution',
                'isCorrect', 'correctAnswer', 'rightAnswer', 'score', 'result'
            ];
            
            function searchObject(obj, path = '') {
                for (const key in obj) {
                    const currentPath = path ? `${path}.${key}` : key;
                    const value = obj[key];
                    
                    // Check if key matches answer patterns
                    if (answerPatterns.some(pattern => 
                        key.toLowerCase().includes(pattern.toLowerCase())
                    )) {
                        console.log(`🎯 Potential answer data found at ${currentPath}:`, value);
                    }
                    
                    // Recursively search nested objects
                    if (typeof value === 'object' && value !== null) {
                        searchObject(value, currentPath);
                    }
                }
            }
            
            searchObject(jsonData);
            
        } catch (e) {
            // Not JSON, search for patterns in HTML/text
            const answerIndicators = [
                /class=["'].*correct.*["']/gi,
                /class=["'].*incorrect.*["']/gi,
                /data-correct=["']true["']/gi,
                /data-correct=["']false["']/gi,
                /<.*correct.*>/gi,
                /<.*incorrect.*>/gi
            ];
            
            answerIndicators.forEach((pattern, index) => {
                const matches = responseText.match(pattern);
                if (matches) {
                    console.log(`🎯 Answer pattern ${index + 1} found:`, matches);
                }
            });
        }
    }

    function showMonitoringStatus() {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'network-monitor-status';
        statusDiv.style.cssText = `
            position: fixed;
            top: 80px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 10px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10001;
        `;
        statusDiv.innerHTML = '🕵️ Network monitoring active...';
        document.body.appendChild(statusDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            statusDiv.remove();
        }, 3000);
    }

    function showCapturedData() {
        const dataDiv = document.createElement('div');
        dataDiv.style.cssText = `
            position: fixed;
            top: 50px;
            left: 50px;
            width: 80%;
            height: 70%;
            background: white;
            border: 2px solid #333;
            border-radius: 10px;
            padding: 20px;
            overflow-y: auto;
            z-index: 10002;
            font-family: monospace;
            font-size: 12px;
        `;
        
        let html = '<h2>📊 Captured Network Data</h2>';
        html += `<p>Total requests captured: ${interceptedData.length}</p>`;
        html += '<button onclick="this.parentElement.remove()" style="float: right; margin-bottom: 10px;">❌ Close</button>';
        
        interceptedData.forEach((data, index) => {
            html += `
                <div style="border: 1px solid #ccc; margin: 10px 0; padding: 10px; border-radius: 5px;">
                    <h4>Request ${index + 1} (${data.type.toUpperCase()})</h4>
                    <p><strong>URL:</strong> ${data.url}</p>
                    <p><strong>Method:</strong> ${data.method}</p>
                    <p><strong>Time:</strong> ${data.timestamp}</p>
                    <details>
                        <summary>Response Data (click to expand)</summary>
                        <pre style="background: #f5f5f5; padding: 10px; border-radius: 3px; white-space: pre-wrap; word-wrap: break-word;">${data.response}</pre>
                    </details>
                </div>
            `;
        });
        
        if (interceptedData.length === 0) {
            html += '<p style="color: orange;">⚠️ No network requests captured yet. Try submitting the quiz while monitoring is active.</p>';
        }
        
        dataDiv.innerHTML = html;
        document.body.appendChild(dataDiv);
    }

    function initializeNetworkInterceptor() {
        console.log('🚀 Quiz Network Interceptor initialized');
        createInterceptorButton();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeNetworkInterceptor);
    } else {
        initializeNetworkInterceptor();
    }

})();