// ==UserScript==
// @name         Auto Form Filler - Nathan Cox
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Fill form fields with saved profile data, including password
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const profile = {
    firstName: "Nathan",
    lastName: "Cox",
    state: "Washington",
    city: "Seattle",
    dob: "2010-11-05", // Use ISO format for <input type="date">
    school: "Ballard High School",
    zip: "98107",
    phone: "5648651107",
    email: "coxn60965@gmail.com",
    password: "Wright10*",
  };

  function fillForm() {
    const map = {
      firstName: ["first name", "fname", "first"],
      lastName: ["last name", "lname", "last"],
      state: ["state"],
      city: ["city", "town"],
      dob: ["dob", "birth", "date of birth"],
      school: ["school"],
      zip: ["zip", "postal"],
      phone: ["phone", "tel"],
      email: ["email"],
      password: ["password", "pass", "pwd"],
    };

    const inputs = document.querySelectorAll("input, textarea, select");

    inputs.forEach((input) => {
      const name = input.name?.toLowerCase() || "";
      const id = input.id?.toLowerCase() || "";
      const placeholder = input.placeholder?.toLowerCase() || "";
      const label = (
        document.querySelector(`label[for="${input.id}"]`)?.innerText || ""
      ).toLowerCase();

      for (let key in map) {
        if (
          map[key].some(
            (keyword) =>
              name.includes(keyword) ||
              id.includes(keyword) ||
              placeholder.includes(keyword) ||
              label.includes(keyword)
          )
        ) {
          input.value = profile[key];
          input.dispatchEvent(new Event("input", { bubbles: true }));
          break;
        }
      }
    });
  }

  function addButton() {
    const btn = document.createElement("button");
    btn.textContent = "Fill Form";
    btn.style.position = "fixed";
    btn.style.top = "10px";
    btn.style.right = "10px";
    btn.style.zIndex = 10000;
    btn.style.padding = "10px 15px";
    btn.style.backgroundColor = "#4CAF50";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.onclick = fillForm;

    document.body.appendChild(btn);
  }

  window.addEventListener("load", () => {
    setTimeout(addButton, 1000); // Wait a bit in case the page loads slowly
  });
})();
SS