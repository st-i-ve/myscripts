// ==UserScript==
// @name         Video near-end autoseek (-1s)
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  automatically seek to 1 second before the end on pages with HTML5/video.js players
// @match        https://evolveme.asa.org/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // i use this offset to jump to 1s before the end
  const NEAR_END_OFFSET_SECONDS = 1;

  // i track processed video elements so i don't seek them more than once
  const processed = new WeakSet();

  function getEndTime(video) {
    // i prefer the end of the seekable range (safer for streaming)
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
      video.addEventListener('loadedmetadata', cb, { once: true });
    }
  }

  function seekNearEnd(video) {
    if (!video || processed.has(video)) return;
    processed.add(video);

    whenMetaReady(video, () => {
      const end = getEndTime(video);
      if (!Number.isFinite(end) || end <= 0) return;
      const target = Math.max(0, end - NEAR_END_OFFSET_SECONDS);
      try {
        video.currentTime = target; // i set currentTime to land right before the end
      } catch (_) {
        // ignore errors from protected players
      }
    });
  }

  function processAllVideos() {
    document.querySelectorAll('video').forEach(seekNearEnd);
  }

  // initial pass for any videos already in the DOM
  processAllVideos();

  // observe for videos added later (spa/async loads)
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node && node.nodeType === 1) {
          if (node.tagName === 'VIDEO') {
            seekNearEnd(node);
          }
          const nested = node.querySelectorAll ? node.querySelectorAll('video') : [];
          nested.forEach(seekNearEnd);
        }
      }
    }
  });

  mo.observe(document.documentElement, { childList: true, subtree: true });
})();