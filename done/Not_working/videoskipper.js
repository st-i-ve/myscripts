// ==UserScript==
// @name         Video Skipper Pro
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Detects video players and forwards to 99% or increases speed by 10000%
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let isActive = false; // Start inactive to prevent page unresponsiveness
  let processedVideos = new Set();
  let observer = null;
  let scanInterval = null;
  let urlCheckInterval = null;

  // Wait for page to load completely before initializing
  function waitForPageLoad() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });
  }

  // Create control panel
  function createControlPanel() {
    const controlPanel = document.createElement("div");
    controlPanel.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; z-index: 99999; background: #1a1a1a; color: white; padding: 15px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: Arial, sans-serif; min-width: 220px;">
        <h4 style="margin: 0 0 10px 0; color: #ff6b6b;">🎬 Video Skipper Pro</h4>
        <div style="display: flex; gap: 5px; margin-bottom: 8px;">
          <button id="activateSkipper" style="flex: 1; padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🟢 ON</button>
          <button id="deactivateSkipper" style="flex: 1; padding: 8px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🔴 OFF</button>
        </div>
        <div id="statusIndicator" style="text-align: center; padding: 5px; margin-bottom: 8px; background: #f44336; border-radius: 4px; font-size: 12px; font-weight: bold;">
          ❌ INACTIVE
        </div>
        <button id="skipAllVideos" style="width: 100%; padding: 8px; margin-bottom: 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; opacity: 0.5;" disabled>⏭️ Skip All Videos</button>
        <button id="speedUpVideos" style="width: 100%; padding: 8px; margin-bottom: 8px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer; opacity: 0.5;" disabled>⚡ Speed Up All</button>
        <div style="margin-top: 10px; font-size: 12px; color: #ccc;">
          Page Status: <span id="pageStatus">Loading...</span><br>
          Videos found: <span id="videoCount">0</span>
        </div>
      </div>
    `;
    document.body.appendChild(controlPanel);
    return controlPanel;
  }

  // Setup event handlers
  function setupEventHandlers() {
    const activateBtn = document.getElementById("activateSkipper");
    const deactivateBtn = document.getElementById("deactivateSkipper");
    const skipBtn = document.getElementById("skipAllVideos");
    const speedBtn = document.getElementById("speedUpVideos");
    const statusIndicator = document.getElementById("statusIndicator");
    const videoCountSpan = document.getElementById("videoCount");
    const pageStatusSpan = document.getElementById("pageStatus");

    // Update page status
    pageStatusSpan.textContent = "Ready";

    // Activate script
    activateBtn.addEventListener("click", () => {
      isActive = true;
      statusIndicator.textContent = "✅ ACTIVE";
      statusIndicator.style.background = "#4CAF50";
      skipBtn.disabled = false;
      speedBtn.disabled = false;
      skipBtn.style.opacity = "1";
      speedBtn.style.opacity = "1";
      
      startVideoDetection();
      console.log("🎬 Video Skipper Pro activated!");
    });

    // Deactivate script
    deactivateBtn.addEventListener("click", () => {
      isActive = false;
      statusIndicator.textContent = "❌ INACTIVE";
      statusIndicator.style.background = "#f44336";
      skipBtn.disabled = true;
      speedBtn.disabled = true;
      skipBtn.style.opacity = "0.5";
      speedBtn.style.opacity = "0.5";
      
      stopVideoDetection();
      console.log("🎬 Video Skipper Pro deactivated!");
    });

    // Skip all videos to 99%
    skipBtn.addEventListener("click", () => {
      if (!isActive) return;
      const videos = getAllVideos();
      videos.forEach(video => skipVideoToEnd(video));
      console.log(`Skipped ${videos.length} videos to 99%`);
    });

    // Speed up all videos
    speedBtn.addEventListener("click", () => {
      if (!isActive) return;
      const videos = getAllVideos();
      videos.forEach(video => speedUpVideo(video));
      console.log(`Sped up ${videos.length} videos`);
    });

    return { videoCountSpan };
  }

  // Start video detection and monitoring
  function startVideoDetection() {
    if (observer || scanInterval || urlCheckInterval) {
      stopVideoDetection(); // Clean up existing intervals/observers
    }

    // Auto-detect new videos with MutationObserver
    observer = new MutationObserver((mutations) => {
      if (!isActive) return;
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Check if the added node is a video
            if (node.tagName === "VIDEO") {
              setTimeout(() => processVideo(node), 500); // Small delay to let video initialize
            }
            
            // Check if the added node contains videos
            const videos = node.querySelectorAll ? node.querySelectorAll("video") : [];
            videos.forEach(video => setTimeout(() => processVideo(video), 500));
          }
        });
      });
      
      // Update video count
      updateVideoCount();
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial scan after a delay
    setTimeout(() => {
      if (isActive) detectAndProcessVideos();
    }, 2000);
    
    // Periodic scan for videos that might be dynamically loaded (less frequent to reduce load)
    scanInterval = setInterval(() => {
      if (isActive) detectAndProcessVideos();
    }, 5000);

    // Handle page navigation (for SPAs)
    let currentUrl = window.location.href;
    urlCheckInterval = setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        processedVideos.clear();
        setTimeout(() => {
          if (isActive) detectAndProcessVideos();
        }, 3000);
      }
    }, 2000);
  }

  // Stop video detection and monitoring
  function stopVideoDetection() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (scanInterval) {
      clearInterval(scanInterval);
      scanInterval = null;
    }
    if (urlCheckInterval) {
      clearInterval(urlCheckInterval);
      urlCheckInterval = null;
    }
  }

  // Update video count display
  function updateVideoCount() {
    const videoCountSpan = document.getElementById("videoCount");
    if (videoCountSpan) {
      const videos = getAllVideos();
      videoCountSpan.textContent = videos.length;
    }
  }

  // Get all video elements on the page
  function getAllVideos() {
    const videos = [];
    
    // Standard HTML5 video elements
    const htmlVideos = document.querySelectorAll("video");
    videos.push(...htmlVideos);
    
    // YouTube videos
    const youtubeVideos = document.querySelectorAll("video.html5-main-video");
    videos.push(...youtubeVideos);
    
    // Vimeo videos
    const vimeoVideos = document.querySelectorAll("video[data-player-id]");
    videos.push(...vimeoVideos);
    
    // Generic video containers that might contain videos
    const videoContainers = document.querySelectorAll(
      ".video-player video, .player video, .video-container video, " +
      "[class*='video'] video, [id*='video'] video, [class*='player'] video"
    );
    videos.push(...videoContainers);
    
    // Remove duplicates
    return [...new Set(videos)];
  }

  // Skip video to 99% of its duration
  function skipVideoToEnd(video) {
    try {
      if (video.duration && video.duration > 0) {
        const targetTime = video.duration * 0.99; // 99% of video
        video.currentTime = targetTime;
        console.log(`Skipped video to ${targetTime.toFixed(2)}s (99% of ${video.duration.toFixed(2)}s)`);
        return true;
      } else if (video.duration === 0 || isNaN(video.duration)) {
        // For live streams or videos without duration, skip to a large time value
        video.currentTime = video.currentTime + 3600; // Skip 1 hour ahead
        console.log("Skipped live/unknown duration video by 1 hour");
        return true;
      }
    } catch (error) {
      console.log("Could not skip video, trying speed increase instead:", error.message);
      return false;
    }
    return false;
  }

  // Increase video speed dramatically
  function speedUpVideo(video) {
    try {
      // Try extreme speed first
      video.playbackRate = 10000;
      
      // If that doesn't work, try progressively lower speeds
      if (video.playbackRate !== 10000) {
        const speeds = [1000, 100, 50, 16, 8, 4];
        for (const speed of speeds) {
          video.playbackRate = speed;
          if (video.playbackRate === speed) {
            break;
          }
        }
      }
      
      console.log(`Set video speed to ${video.playbackRate}x`);
      
      // Also try to play the video if it's paused
      if (video.paused) {
        video.play().catch(() => {});
      }
      
      return true;
    } catch (error) {
      console.log("Could not change video speed:", error.message);
      return false;
    }
  }

  // Process a single video
  function processVideo(video) {
    if (processedVideos.has(video) || !isActive) return;
    
    processedVideos.add(video);
    
    // Wait for video metadata to load
    const processWhenReady = () => {
      if (video.readyState >= 1) { // HAVE_METADATA
        // Try to skip first, if that fails, speed up
        if (!skipVideoToEnd(video)) {
          speedUpVideo(video);
        }
      } else {
        // If metadata not ready, set up event listener
        video.addEventListener("loadedmetadata", () => {
          if (!skipVideoToEnd(video)) {
            speedUpVideo(video);
          }
        }, { once: true });
        
        // Fallback: just speed up immediately
        setTimeout(() => speedUpVideo(video), 1000);
      }
    };

    processWhenReady();
  }

  // Main video detection and processing
  function detectAndProcessVideos() {
    if (!isActive) return;
    
    const videos = getAllVideos();
    updateVideoCount();
    
    videos.forEach(video => {
      // Add small delay to prevent overwhelming the page
      setTimeout(() => processVideo(video), Math.random() * 1000);
    });
  }

  // Initialize the script after page loads
  async function initializeScript() {
    try {
      // Wait for page to load completely
      await waitForPageLoad();
      
      // Wait a bit more to ensure DOM is stable
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create control panel
      createControlPanel();
      
      // Setup event handlers
      setupEventHandlers();
      
      console.log("🎬 Video Skipper Pro loaded! Click 'ON' to activate video detection.");
      
    } catch (error) {
      console.error("Failed to initialize Video Skipper Pro:", error);
    }
  }

  // Start initialization
  initializeScript();
})();