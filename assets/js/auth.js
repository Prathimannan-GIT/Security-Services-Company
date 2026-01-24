/*
  Sentinel Secure Services
  auth.js
  - Front-end demo authentication using localStorage
  - Provides: registration, login, session checks, logout

  Notes:
  - This is a UI demo only. It is not a replacement for server-side authentication.
*/

(function () {
  "use strict";

  var STORAGE_USERS = "sss_users";
  var STORAGE_SESSION = "sss_session";

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  }

  function getUsers() {
    var raw = localStorage.getItem(STORAGE_USERS);
    var users = safeJsonParse(raw, []);
    return Array.isArray(users) ? users : [];
  }

  function setUsers(users) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  }

  function getSession() {
    var raw = localStorage.getItem(STORAGE_SESSION);
    var sess = safeJsonParse(raw, null);
    return sess && typeof sess === "object" ? sess : null;
  }

  function setSession(session) {
    localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_SESSION);
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  // Simple one-way transform for demo purposes
  function hashPassword(pw) {
    var str = String(pw || "");
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return "h" + Math.abs(hash);
  }

  function passwordStrength(password) {
    var pw = String(password || "");
    var score = 0;

    if (pw.length >= 10) score += 1;
    if (pw.length >= 14) score += 1;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
    if (/\d/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    if (pw.length < 8) return { level: "weak", score: 1, percent: 25 };
    if (score <= 2) return { level: "fair", score: 2, percent: 45 };
    if (score <= 4) return { level: "strong", score: 3, percent: 72 };
    return { level: "excellent", score: 4, percent: 100 };
  }

  function findUserByEmail(email) {
    var users = getUsers();
    var e = normalizeEmail(email);
    for (var i = 0; i < users.length; i++) {
      if (normalizeEmail(users[i].email) === e) return users[i];
    }
    return null;
  }

  function upsertUser(newUser) {
    var users = getUsers();
    var found = false;

    for (var i = 0; i < users.length; i++) {
      if (normalizeEmail(users[i].email) === normalizeEmail(newUser.email)) {
        users[i] = newUser;
        found = true;
        break;
      }
    }

    if (!found) users.push(newUser);
    setUsers(users);
  }

  function ensureSeedDemoUser() {
    // Seed a demo user so the portal works immediately
    var existing = findUserByEmail("client@sentinelsecure.example");
    if (existing) return;

    upsertUser({
      email: "client@sentinelsecure.example",
      passwordHash: hashPassword("Sentinel@2026"),
      organization: "Northbridge Logistics",
      contactName: "Aisha Rahman",
      role: "Client Administrator",
      createdAt: new Date().toISOString()
    });
  }

  function setText(el, text) {
    if (!el) return;
    el.textContent = text;
  }

  function setHidden(el, hidden) {
    if (!el) return;
    el.hidden = !!hidden;
  }

  function bindRegister() {
    var form = document.getElementById("registerForm");
    if (!form) return;

    ensureSeedDemoUser();

    var status = document.getElementById("registerStatus");
    var meterFill = document.getElementById("meterFill");
    var meterLabel = document.getElementById("meterLabel");

    function updateStrength() {
      var s = passwordStrength(form.password.value);
      if (meterFill) meterFill.style.width = s.percent + "%";

      var color = "linear-gradient(135deg, var(--danger), var(--warning))";
      if (s.level === "strong") color = "linear-gradient(135deg, var(--warning), var(--success))";
      if (s.level === "excellent") color = "linear-gradient(135deg, var(--brand), var(--success))";
      if (meterFill) meterFill.style.background = color;

      var label = "Password strength: " + s.level.toUpperCase();
      setText(meterLabel, label);
    }

    form.password.addEventListener("input", updateStrength);
    updateStrength();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setText(status, "");

      var org = form.organization.value.trim();
      var name = form.contactName.value.trim();
      var email = form.email.value.trim();
      var pw = form.password.value;
      var confirm = form.confirmPassword.value;
      var accepted = form.terms.checked;

      var ok = true;

      setHidden(document.getElementById("orgError"), !!org);
      ok = ok && !!org;

      setHidden(document.getElementById("nameError"), !!name);
      ok = ok && !!name;

      setHidden(document.getElementById("emailError"), isEmail(email));
      ok = ok && isEmail(email);

      setHidden(document.getElementById("pwError"), pw.length >= 8);
      ok = ok && pw.length >= 8;

      setHidden(document.getElementById("confirmError"), pw && confirm && pw === confirm);
      ok = ok && pw && confirm && pw === confirm;

      setHidden(document.getElementById("termsError"), accepted);
      ok = ok && accepted;

      if (!ok) {
        setText(status, "Please review the highlighted fields and try again.");
        return;
      }

      var existing = findUserByEmail(email);
      if (existing) {
        setText(status, "An account with this email already exists. Please sign in instead.");
        return;
      }

      upsertUser({
        email: normalizeEmail(email),
        passwordHash: hashPassword(pw),
        organization: org,
        contactName: name,
        role: "Client User",
        createdAt: new Date().toISOString()
      });

      setText(status, "Registration successful. Redirecting to Client Login...");
      window.setTimeout(function () {
        window.location.href = "login.html";
      }, 900);
    });
  }

  function bindLogin() {
    var form = document.getElementById("loginForm");
    if (!form) return;

    ensureSeedDemoUser();

    var status = document.getElementById("loginStatus");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setText(status, "");

      var email = form.email.value.trim();
      var pw = form.password.value;

      var ok = true;

      setHidden(document.getElementById("emailError"), isEmail(email));
      ok = ok && isEmail(email);

      setHidden(document.getElementById("passwordError"), pw.length >= 1);
      ok = ok && pw.length >= 1;

      if (!ok) {
        setText(status, "Please review the highlighted fields and try again.");
        return;
      }

      var user = findUserByEmail(email);
      if (!user || user.passwordHash !== hashPassword(pw)) {
        setText(status, "Invalid credentials. Please verify your email and password.");
        return;
      }

      setSession({
        email: user.email,
        organization: user.organization,
        contactName: user.contactName,
        role: user.role,
        signedInAt: new Date().toISOString()
      });

      setText(status, "Sign-in successful. Loading dashboard...");
      window.setTimeout(function () {
        window.location.href = "dashboard.html";
      }, 650);
    });

    var demoBtn = document.getElementById("fillDemo");
    if (demoBtn) {
      demoBtn.addEventListener("click", function () {
        form.email.value = "client@sentinelsecure.example";
        form.password.value = "Sentinel@2026";
        setText(status, "Demo credentials filled. Click Sign in to continue.");
      });
    }
  }

  function requireSessionOrRedirect() {
    var guard = document.querySelector("[data-require-session]");
    if (!guard) return;

    var s = getSession();
    if (!s) {
      window.location.replace("login.html");
      return;
    }
  }

  function bindLogout() {
    var logoutBtn = document.querySelector("[data-logout]");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      clearSession();
      window.location.href = "login.html";
    });
  }

  // Expose minimal API for dashboard scripts
  window.SSSAuth = {
    getSession: getSession,
    requireSessionOrRedirect: requireSessionOrRedirect,
    clearSession: clearSession,
    bindLogout: bindLogout
  };

  document.addEventListener("DOMContentLoaded", function () {
    bindRegister();
    bindLogin();
    requireSessionOrRedirect();
    bindLogout();
  });
})();
