/*
  Sentinel Secure Services
  chatbot.js
  - Offline FAQ assistant (no API key)
  - Uses a curated knowledge base + keyword scoring to act like a small "AI".
*/

(function () {
  "use strict";

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function nowTime() {
    var d = new Date();
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  // Curated FAQ knowledge base
  var KB = [
    {
      id: "services-overview",
      q: "What services do you provide?",
      keywords: ["services", "provide", "offer", "capabilities", "solutions"],
      a:
        "Sentinel Secure Services provides integrated security programs including physical guarding, access control management, patrol and perimeter security, CCTV monitoring, remote surveillance, alarm management, risk assessments, compliance consulting, and coordinated emergency response."
    },
    {
      id: "monitoring-247",
      q: "Do you offer 24/7 monitoring?",
      keywords: ["24/7", "monitoring", "command", "control", "soc", "after hours"],
      a:
        "Yes. Our command & control operations support 24/7 monitoring options, including after-hours escalation workflows, event triage, and documented incident handling. Coverage is tailored based on your site risk and operating hours."
    },
    {
      id: "industries",
      q: "Which industries do you serve?",
      keywords: ["industries", "corporate", "manufacturing", "warehouse", "hospital", "clinic", "education", "residential", "retail"],
      a:
        "We serve commercial, industrial, residential, and institutional clients. Typical coverage includes corporate offices, manufacturing and warehousing, hospitals and clinics, educational institutions, residential communities, and retail or shopping centers."
    },
    {
      id: "guards",
      q: "Are your guards licensed and trained?",
      keywords: ["guards", "licensed", "trained", "personnel", "uniformed", "background"],
      a:
        "Yes. Our security personnel are licensed and trained for site SOPs, access governance, de-escalation, patrol discipline, incident documentation, and escalation protocols. Training plans are aligned to your operating environment."
    },
    {
      id: "incident-reporting",
      q: "How do you handle incident reporting?",
      keywords: ["incident", "report", "reporting", "analytics", "timeline", "severity"],
      a:
        "Incidents are recorded with timestamps, severity classification, officer notes, actions taken, and closure status. The client dashboard demonstrates downloadable report summaries and structured analytics for service reviews and audits."
    },
    {
      id: "access-logs",
      q: "Do you maintain access control logs?",
      keywords: ["access", "logs", "visitor", "employee", "entry", "badge"],
      a:
        "Yes. We maintain structured access logs for employee entry and visitor access (date/time, site, outcome, and method). In production deployments, logs are governed by role-based access and audit trails."
    },
    {
      id: "compliance",
      q: "Do you support compliance and documentation?",
      keywords: ["compliance", "iso", "privacy", "audit", "sla", "documents", "insurance"],
      a:
        "Yes. Our programs are designed to be compliance-ready with structured documentation. The portal includes compliance certificates, SLA agreements, and insurance documents with secure viewing and download controls (demo)."
    },
    {
      id: "emergency",
      q: "Can you support emergency response and liaison?",
      keywords: ["emergency", "evacuation", "liaison", "law", "enforcement", "incident handling"],
      a:
        "Yes. We coordinate incident handling, emergency evacuation support, and law-enforcement liaison when required. Response workflows follow predefined escalation playbooks and are documented for post-incident review."
    },
    {
      id: "consultation",
      q: "How do I request a security consultation?",
      keywords: ["consultation", "request", "assessment", "audit", "site"],
      a:
        "You can request a security consultation directly on the Home page. We typically start with a risk assessment and site audit, then deliver a customized security plan with coverage and reporting recommendations."
    },
    {
      id: "client-login",
      q: "How do I access the client dashboard?",
      keywords: ["login", "client", "dashboard", "portal", "register"],
      a:
        "Use Client Login to access the dashboard. If you don’t have an account, register first. For this demo site, you can use the provided demo credentials on the Login page to sign in instantly."
    }
  ];

  var DEFAULT_SUGGESTIONS = [
    "What services do you provide?",
    "Do you offer 24/7 monitoring?",
    "Are your guards licensed and trained?",
    "How do I request a security consultation?",
    "How do I access the client dashboard?"
  ];

  function scoreMatch(userText, item) {
    var u = normalize(userText);
    if (!u) return 0;

    var score = 0;

    // Direct question similarity
    var q = normalize(item.q);
    if (u === q) score += 8;

    // Keyword hits
    (item.keywords || []).forEach(function (kw) {
      var k = normalize(kw);
      if (!k) return;
      if (u.indexOf(k) !== -1) score += 3;
    });

    // Soft overlaps: shared tokens
    var tokens = u.split(" ").filter(Boolean);
    var qTokens = q.split(" ").filter(Boolean);

    tokens.forEach(function (t) {
      if (qTokens.indexOf(t) !== -1) score += 1;
    });

    return score;
  }

  function answer(userText) {
    var best = null;
    var bestScore = 0;

    KB.forEach(function (item) {
      var s = scoreMatch(userText, item);
      if (s > bestScore) {
        bestScore = s;
        best = item;
      }
    });

    if (best && bestScore >= 4) {
      return {
        text: best.a,
        source: "Matched FAQ: " + best.q
      };
    }

    // Fallback response
    return {
      text:
        "I can help with services, monitoring, incident reporting, access logs, compliance documents, and consultation requests. Ask a specific question (for example: ‘Do you offer 24/7 monitoring?’).",
      source: "Suggested topics"
    };
  }

  function createWidget() {
    // Avoid duplicate injection
    if ($("#sssChatbotPanel")) return;

    var launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "chatbot-launcher";
    launcher.id = "sssChatbotLauncher";
    launcher.setAttribute("aria-controls", "sssChatbotPanel");
    launcher.setAttribute("aria-expanded", "false");
    launcher.innerHTML =
      '<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M4 5H20V16H8L4 20V5Z" stroke="#08101c" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M8 9H16" stroke="#08101c" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M8 12H14" stroke="#08101c" stroke-width="2" stroke-linecap="round"/>' +
      "</svg>" +
      "FAQ Assistant";

    var panel = document.createElement("section");
    panel.className = "chatbot-panel";
    panel.id = "sssChatbotPanel";
    panel.setAttribute("aria-label", "FAQ assistant");

    panel.innerHTML =
      '<div class="chatbot-head">' +
        '<div class="chatbot-title">' +
          '<strong>Sentinel FAQ Assistant</strong>' +
          '<span>Fast answers for services, monitoring, and portal help</span>' +
        "</div>" +
        '<div class="chatbot-actions">' +
          '<button class="chatbot-btn" type="button" id="sssChatbotReset">Reset</button>' +
          '<button class="chatbot-btn" type="button" id="sssChatbotClose" aria-label="Close chat">Close</button>' +
        "</div>" +
      "</div>" +
      '<div class="chatbot-body" id="sssChatbotBody"></div>' +
      '<div class="chatbot-foot">' +
        '<div class="chatbot-suggestions" id="sssChatbotSuggestions"></div>' +
        '<div class="chatbot-inputrow">' +
          '<input class="chatbot-input" id="sssChatbotInput" type="text" placeholder="Ask a question (e.g., Do you offer 24/7 monitoring?)" autocomplete="off" />' +
          '<button class="btn primary" id="sssChatbotSend" type="button">Send</button>' +
        "</div>" +
        '<div class="chatbot-disclaimer">This is an on-site FAQ assistant (offline). For confidential matters, contact Sentinel support.</div>' +
      "</div>";

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    var body = $("#sssChatbotBody");
    var input = $("#sssChatbotInput");
    var send = $("#sssChatbotSend");
    var close = $("#sssChatbotClose");
    var reset = $("#sssChatbotReset");
    var suggestions = $("#sssChatbotSuggestions");

    function addMsg(role, text, meta) {
      var el = document.createElement("div");
      el.className = "chatbot-msg " + role;
      el.innerHTML =
        '<div>' +
          String(text || "").replace(/\n/g, "<br>") +
        '</div>' +
        '<div class="chatbot-meta">' + meta + " · " + nowTime() + "</div>";

      body.appendChild(el);
      body.scrollTop = body.scrollHeight;
    }

    function setSuggestions(items) {
      suggestions.innerHTML = "";
      items.forEach(function (q) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "suggestion";
        b.textContent = q;
        b.addEventListener("click", function () {
          input.value = q;
          doSend();
        });
        suggestions.appendChild(b);
      });
    }

    function open() {
      panel.classList.add("open");
      launcher.setAttribute("aria-expanded", "true");
      window.setTimeout(function () {
        input.focus();
      }, 30);
    }

    function closePanel() {
      panel.classList.remove("open");
      launcher.setAttribute("aria-expanded", "false");
    }

    function doReset() {
      body.innerHTML = "";
      addMsg(
        "bot",
        "Welcome to Sentinel Secure Services. Ask me about services, monitoring, incident reporting, compliance documents, or the client portal.",
        "Assistant"
      );
      setSuggestions(DEFAULT_SUGGESTIONS);
    }

    function doSend() {
      var q = String(input.value || "").trim();
      if (!q) return;

      addMsg("user", q, "You");
      input.value = "";

      var res = answer(q);
      addMsg("bot", res.text, res.source);

      // Offer follow-up suggestions based on top topics
      setSuggestions(DEFAULT_SUGGESTIONS);
    }

    launcher.addEventListener("click", function () {
      if (panel.classList.contains("open")) closePanel();
      else open();
    });

    close.addEventListener("click", closePanel);
    reset.addEventListener("click", doReset);

    send.addEventListener("click", doSend);

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        doSend();
      }
      if (e.key === "Escape") {
        closePanel();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) {
        closePanel();
      }
    });

    doReset();
  }

  document.addEventListener("DOMContentLoaded", function () {
    createWidget();
  });
})();
