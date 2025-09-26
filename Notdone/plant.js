// ==UserScript==
// @name         Auto Refresh ASA Plant Page
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Refresh the ASA plant page every 30 seconds
// @match        https://evolveme.asa.org/plant
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Refresh the page every 30 seconds (30,000 milliseconds)
    setTimeout(() => {
        location.reload();
    }, 60000);
})();
