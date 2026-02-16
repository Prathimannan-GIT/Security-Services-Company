/*
  Sentinel Secure Services
  main.js
  - Shared navigation behavior and small UI helpers
*/

(function () {
  "use strict";

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function ensureChatbotAssets() {
    // Inject CSS
    if (!document.querySelector('link[data-sss-chatbot="css"]')) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "assets/css/chatbot.css";
      link.setAttribute("data-sss-chatbot", "css");
      document.head.appendChild(link);
    }

    // Inject JS
    if (!document.querySelector('script[data-sss-chatbot="js"]')) {
      var script = document.createElement("script");
      script.src = "assets/js/chatbot.js";
      script.defer = true;
      script.setAttribute("data-sss-chatbot", "js");
      document.head.appendChild(script);
    }
  }

  function setActiveNavLink() {
    var path = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll("[data-nav]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href) return;
      var isActive = href === path;
      if (isActive) a.classList.add("active");
      else a.classList.remove("active");
    });
  }

  function initMobileNav() {
    var toggle = $("[data-mobile-toggle]");
    var panel = $("[data-mobile-panel]");

    if (!toggle || !panel) return;

    toggle.addEventListener("click", function () {
      var isOpen = panel.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
          const newTheme = e.matches ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', newTheme);
          updateThemeIcons(newTheme);
        }
      });
    }

    // Close panel when clicking a link (better UX)
    panel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        panel.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }


  function initTheme() {
    // Check for saved theme preference, otherwise use system preference
    let savedTheme = localStorage.getItem('theme');

    if (!savedTheme) {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        savedTheme = 'dark';
      } else {
        savedTheme = 'light';
      }
    }

    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);

    const toggles = document.querySelectorAll('#themeToggle, #mobileThemeToggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcons(newTheme);
      });
    });
  }

  function updateThemeIcons(theme) {
    const sunIcons = document.querySelectorAll('.sun-icon');
    const moonIcons = document.querySelectorAll('.moon-icon');

    if (theme === 'light') {
      sunIcons.forEach(icon => icon.style.display = 'none');
      moonIcons.forEach(icon => icon.style.display = 'block');
    } else {
      sunIcons.forEach(icon => icon.style.display = 'block');
      moonIcons.forEach(icon => icon.style.display = 'none');
    }
  }

  function initPasswordValidation() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const errorMsg = document.getElementById('confirmError');

    if (!password || !confirmPassword) return;

    form.addEventListener('submit', function (e) {
      if (password.value !== confirmPassword.value) {
        e.preventDefault();
        if (errorMsg) {
          errorMsg.textContent = 'Passwords do not match';
          errorMsg.hidden = false;
        }
        confirmPassword.classList.add('error-input');
      } else {
        if (errorMsg) errorMsg.hidden = true;
        confirmPassword.classList.remove('error-input');
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    ensureChatbotAssets();
    setActiveNavLink();
    initMobileNav();
    initPasswordValidation();
  });
})();
