// ==UserScript==
// @name         Media-Embed Extractor + Auto Open in Tabs
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Clicks carousel fast, finds /media-embed/ links, shows them in UI, and auto-opens each in a new tab (50 clicks, 300ms delay). Works with dynamic content too.
// @author       You
// @match        https://evolveme.asa.org/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const baseURL = window.location.origin;
  const loggedLinks = new Set();
  const maxClicks = 50;
  const clickDelay = 300; // 300ms delay for faster execution

  // === Floating UI Box ===
  const box = document.createElement("div");
  box.id = "media-embed-box";
  box.style.position = "fixed";
  box.style.top = "10px";
  box.style.right = "10px";
  box.style.width = "300px";
  box.style.maxHeight = "80vh";
  box.style.overflowY = "auto";
  box.style.background = "white";
  box.style.border = "2px solid #000";
  box.style.padding = "10px";
  box.style.fontSize = "12px";
  box.style.zIndex = "99999";
  box.innerHTML =
    '<strong>🎥 Media Embed Links Found:</strong><ul id="media-embed-list" style="padding-left: 18px;"></ul>';
  document.body.appendChild(box);

  const list = document.getElementById("media-embed-list");

  function addLinkToBoxAndOpen(fullURL) {
    if (!loggedLinks.has(fullURL)) {
      loggedLinks.add(fullURL);

      // Add to floating box
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = fullURL;
      a.textContent = fullURL;
      a.target = "_blank";
      li.appendChild(a);
      list.appendChild(li);

      // Open in new tab
      const newTab = window.open(fullURL, "_blank");
      if (newTab) {
        console.log(`🆕 Opened in new tab: ${fullURL}`);
      } else {
        console.warn(`❌ Failed to open tab (may be blocked): ${fullURL}`);
      }
    }
  }

  function logMediaEmbedLinks(root = document) {
    const links = root.querySelectorAll('a[href*="/media-embed/"]');
    links.forEach((link) => {
      const fullURL = new URL(link.getAttribute("href"), baseURL).href;
      addLinkToBoxAndOpen(fullURL);
      console.log(fullURL);
    });
  }

  // === MutationObserver for dynamic content ===
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          logMediaEmbedLinks(node);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // === Fast Carousel Clicking ===
  async function autoClickCarouselButton() {
    for (let i = 0; i < maxClicks; i++) {
      const btn = document.querySelector(".desktop-carousel__button--next");
      if (btn && !btn.disabled) {
        btn.click();
        console.log(`✅ Clicked carousel button (${i + 1}/${maxClicks})`);
      } else {
        console.log(
          `⏳ Button disabled or not found (${
            i + 1
          }/${maxClicks}), will retry...`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, clickDelay));
    }
  }

  // === Start on Load ===
  window.addEventListener("load", () => {
    logMediaEmbedLinks(); // Initial scan
    autoClickCarouselButton();
  });
})();
