// ==UserScript==
// @name         Video near-end autoseek (-1s) - Always Listening
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Automatically seek to 1 second before the end on pages with HTML5/video.js players, always watching for new videos
// @match        https://evolveme.asa.org/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  const NEAR_END_OFFSET_SECONDS = 1;

  function getEndTime(video) {
    if (video.seekable && video.seekable.length > 0) {
      return video.seekable.end(video.seekable.length - 1);
    }
    return video.duration || 0;
  }

  function whenMetaReady(video, cb) {
    if (!video) return;
    if (video.readyState >= 1) {
      cb();
    } else {
      video.addEventListener("loadedmetadata", cb, { once: true });
    }
  }

  function seekNearEnd(video) {
    if (!video) return;
    whenMetaReady(video, () => {
      const end = getEndTime(video);
      if (!Number.isFinite(end) || end <= 0) return;
      const target = Math.max(0, end - NEAR_END_OFFSET_SECONDS);
      try {
        video.currentTime = target;
      } catch (_) {
        // ignore errors from protected players
      }
    });
  }

  function processAllVideos() {
    document.querySelectorAll("video").forEach(seekNearEnd);
  }

  // Always check existing videos periodically
  setInterval(processAllVideos, 2000);

  // Also watch DOM for new videos
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node && node.nodeType === 1) {
          if (node.tagName === "VIDEO") {
            seekNearEnd(node);
          }
          const nested = node.querySelectorAll
            ? node.querySelectorAll("video")
            : [];
          nested.forEach(seekNearEnd);
        }
      }
    }
  });

  mo.observe(document.documentElement, { childList: true, subtree: true });

  // Initial run
  processAllVideos();
})();
