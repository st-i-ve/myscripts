// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2025-09-13
// @description  try to take over the world!
// @author       You
// @match        https://explore.skillup.org/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const randBetween = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  function dispatchKeyEvents(el, ch) {
    const opts = { key: ch, char: ch, bubbles: true };
    el.dispatchEvent(new KeyboardEvent("keydown", opts));
    el.dispatchEvent(new KeyboardEvent("keypress", opts));
    el.dispatchEvent(new KeyboardEvent("keyup", opts));
  }

  function setNativeValue(el, value) {
    const setter = Object.getOwnPropertyDescriptor(el.__proto__, "value")?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
  }

  function dispatchInput(el) {
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  async function typeInto(el, text, { minDelay = 80, maxDelay = 150 } = {}) {
    el.focus();
    await sleep(100);

    let current = "";
    for (const ch of text) {
      dispatchKeyEvents(el, ch);
      current += ch;
      setNativeValue(el, current);
      try {
        el.setSelectionRange(current.length, current.length);
      } catch {}
      dispatchInput(el);
      await sleep(randBetween(minDelay, maxDelay));
    }
    await sleep(100);
    el.blur();
  }

  async function waitFor(sel, timeout = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const el = document.querySelector(sel);
      if (el) return el;
      await sleep(200);
    }
    return null;
  }

  function addButton() {
    if (document.getElementById("fakefiller-btn")) return;
    const btn = document.createElement("button");
    btn.id = "fakefiller-btn";
    btn.textContent = "Auto Fill Form";
    Object.assign(btn.style, {
      position: "fixed",
      top: "12px",
      right: "12px",
      zIndex: 99999,
      padding: "10px 14px",
      borderRadius: "8px",
      background: "#0ea5a4",
      color: "#fff",
      border: "none",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "600",
    });
    document.body.appendChild(btn);
    return btn;
  }

  async function run() {
    const btn = document.getElementById("fakefiller-btn");
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = "0.6";
      btn.textContent = "Filling...";
    }

    const first = await waitFor('input[data-testid="firstName"]');
    const last = await waitFor('input[data-testid="lastName"]');
    const zip = await waitFor(
      'input[data-testid="locationInput"], #zipcodeLocation, input[name="zipcodeLocation"]'
    );

    if (first) await typeInto(first, "Robert");
    if (last) await typeInto(last, "Harris");
    if (zip) await typeInto(zip, "02124"); // <-- fixed zip typing

    if (btn) {
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.textContent = "Auto Fill Form";
    }
  }

  function init() {
    const btn = addButton();
    btn.addEventListener("click", run);
  }

  init();
})();
