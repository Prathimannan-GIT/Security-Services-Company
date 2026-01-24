/*
  Sentinel Secure Services
  dashboard.js
  - Dashboard UI: routing, rendering, filters, actions
*/

(function () {
  "use strict";

  // ---------- Helpers ----------
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cssEscape(value) {
    var v = String(value || "");
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(v);
    return v.replace(/[^a-zA-Z0-9_-]/g, "\\$");
  }

  function fmtDateTime(iso) {
    var d = new Date(iso);
    if (String(d) === "Invalid Date") return "-";
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function downloadTextFile(filename, content) {
    var blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);

    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 500);
  }

  // ---------- Sample data ----------
  var data = {
    sites: [
      {
        id: "NB-01",
        name: "Northbridge Logistics – DC1",
        location: "Riverside Industrial Zone",
        status: "green",
        lastActivity: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        assignedTeam: "Alpha Response Unit",
        coverage: "24/7 Guarding + Remote CCTV",
        notes: "Perimeter patrol every 60 minutes. Loading dock access requires badge + supervisor approval."
      },
      {
        id: "NB-02",
        name: "Northbridge Corporate HQ",
        location: "Downtown Financial District",
        status: "amber",
        lastActivity: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
        assignedTeam: "Executive Protection Detail",
        coverage: "Front Desk + After-hours Monitoring",
        notes: "Visitor surges expected during quarterly vendor audits. Access logs monitored for anomalies."
      },
      {
        id: "NB-03",
        name: "Northbridge Retail Annex",
        location: "Westgate Commercial Complex",
        status: "red",
        lastActivity: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        assignedTeam: "Rapid Response Team",
        coverage: "Remote Surveillance + Incident Escalation",
        notes: "System malfunction alert in camera cluster C. Technician dispatch initiated."
      }
    ],
    alerts: [
      {
        id: "AL-2049",
        type: "Intrusion",
        priority: "high",
        site: "Northbridge Logistics – DC1",
        time: new Date(Date.now() - 26 * 60 * 1000).toISOString(),
        details: "Motion detection triggered at Gate 3 perimeter. Verified unknown movement; patrol dispatched for confirmation."
      },
      {
        id: "AL-2054",
        type: "System Malfunction",
        priority: "medium",
        site: "Northbridge Retail Annex",
        time: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
        details: "Camera cluster C reporting intermittent feed loss. Remote restart attempted; field technician notified."
      },
      {
        id: "AL-2031",
        type: "Emergency Notification",
        priority: "low",
        site: "Northbridge Corporate HQ",
        time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        details: "Fire panel test completed. No evacuation required. All systems returned to normal monitoring."
      }
    ],
    incidents: [
      {
        id: "IN-7712",
        title: "Perimeter breach verification – Gate 3",
        severity: "High",
        site: "Northbridge Logistics – DC1",
        time: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        summary: "Alarm triage initiated after motion trigger. Patrol verified no forced entry. Incident closed with corrective actions.",
        officerNotes: "No damage observed. Vegetation near sensor cleared; gate camera angle adjusted for improved visibility.",
        resolution: "Closed",
        actions: ["Verified CCTV footage", "Dispatched patrol to Gate 3", "Cleared sensor obstruction", "Updated monitoring rules"]
      },
      {
        id: "IN-7644",
        title: "Visitor access exception – after-hours",
        severity: "Medium",
        site: "Northbridge Corporate HQ",
        time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        summary: "After-hours visitor requested entry for emergency IT maintenance. Access granted after verification and supervisor approval.",
        officerNotes: "Visitor ID verified. Work order confirmed by IT manager. Visitor escorted to server room and signed out.",
        resolution: "Closed",
        actions: ["Verified work order", "Logged visitor entry", "Escorted to restricted area", "Recorded sign-out"]
      },
      {
        id: "IN-7598",
        title: "Camera feed loss – cluster C",
        severity: "High",
        site: "Northbridge Retail Annex",
        time: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
        summary: "Multiple camera feeds reported intermittent loss. Remote remediation attempted; technician dispatch approved.",
        officerNotes: "Restart improved stability temporarily. Recommended on-site inspection of PoE switch and cable terminations.",
        resolution: "In progress",
        actions: ["Identified affected cameras", "Attempted remote restart", "Created service ticket", "Dispatch approved"]
      }
    ],
    accessLogs: [
      {
        id: "AC-9011",
        category: "Employee Entry",
        person: "R. Kumar (EMP-2148)",
        site: "Northbridge Corporate HQ",
        time: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        outcome: "Granted",
        method: "Badge + PIN"
      },
      {
        id: "AC-8992",
        category: "Visitor Access",
        person: "L. Monroe (Vendor)",
        site: "Northbridge Corporate HQ",
        time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        outcome: "Granted",
        method: "ID Verified"
      },
      {
        id: "AC-8960",
        category: "Employee Entry",
        person: "S. Patel (EMP-0921)",
        site: "Northbridge Logistics – DC1",
        time: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
        outcome: "Denied",
        method: "Badge"
      },
      {
        id: "AC-8954",
        category: "Visitor Access",
        person: "K. Chen (Courier)",
        site: "Northbridge Logistics – DC1",
        time: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
        outcome: "Granted",
        method: "Delivery Verification"
      }
    ],
    requests: [
      {
        id: "SR-3021",
        type: "Request additional guards",
        site: "Northbridge Logistics – DC1",
        submitted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: "Under review",
        details: "Temporary increase for month-end inventory cycle: 2 additional guards for 10pm–6am." 
      },
      {
        id: "SR-3007",
        type: "Risk reassessment request",
        site: "Northbridge Corporate HQ",
        submitted: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
        status: "Scheduled",
        details: "Reassess access control and visitor workflow after department relocation to Floor 12." 
      }
    ],
    documents: [
      {
        id: "DOC-INS-2026",
        title: "Insurance Coverage Confirmation",
        category: "Insurance",
        updated: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        summary: "Coverage confirmation letter for active service period with limits and contact references."
      },
      {
        id: "DOC-COMP-ISO",
        title: "Security Compliance Certificate (ISO Processes)",
        category: "Compliance",
        updated: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
        summary: "Certification summary and internal audit statement for operational process compliance."
      },
      {
        id: "DOC-SLA-NB",
        title: "Service Level Agreement – Northbridge Program",
        category: "SLA",
        updated: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
        summary: "SLA outlining monitoring, response, reporting cycles, and escalation procedures." 
      }
    ]
  };

  // ---------- Rendering ----------
  function renderOverview() {
    var activeSites = data.sites.length;
    var liveAlerts = data.alerts.filter(function (a) { return a.priority === "high" || a.priority === "medium"; }).length;
    var incidentsThisMonth = data.incidents.length;

    var compliance = "Compliant";
    var openHigh = data.incidents.filter(function (i) { return i.severity === "High" && i.resolution !== "Closed"; }).length;
    if (openHigh > 0) compliance = "Attention Required";

    setText("kpiActiveSites", String(activeSites));
    setText("kpiLiveAlerts", String(liveAlerts));
    setText("kpiIncidents", String(incidentsThisMonth));
    setText("kpiCompliance", compliance);

    // Quick summary cards
    var summary = $("#overviewSummary");
    if (!summary) return;

    var topSite = data.sites[0];
    summary.innerHTML =
      '<div class="card">' +
        '<div class="kicker">Program Snapshot</div>' +
        '<h2 class="h2">Current monitoring posture</h2>' +
        '<p class="p">Your security program is actively monitored with structured escalation and reporting. Recent activity is consolidated across sites for rapid decision-making.</p>' +
        '<ul class="list">' +
          '<li>Primary monitored site: ' + escapeHtml(topSite.name) + '</li>' +
          '<li>Command center monitoring: continuous, priority-tagged alerts</li>' +
          '<li>Incident reporting: severity classification with downloadable summaries</li>' +
        '</ul>' +
      '</div>';
  }

  function statusTag(status) {
    var label = status === "green" ? "Green" : status === "amber" ? "Amber" : "Red";
    return '<span class="tag ' + status + '"><span class="pill" aria-hidden="true"></span>Status: ' + label + '</span>';
  }

  function renderMonitoring() {
    var host = $("#monitoringGrid");
    if (!host) return;

    host.innerHTML = data.sites
      .map(function (s) {
        return (
          '<article class="card site-card">' +
            '<div class="site-card-header">' +
              '<div>' +
                '<h3 class="site-title">' + escapeHtml(s.name) + '</h3>' +
                '<div class="site-meta">Site ID: ' + escapeHtml(s.id) + ' · ' + escapeHtml(s.location) + '</div>' +
              '</div>' +
              statusTag(s.status) +
            '</div>' +

            '<div class="site-details">' +
              '<div class="detail-row"><span>Last activity</span><span>' + escapeHtml(fmtDateTime(s.lastActivity)) + '</span></div>' +
              '<div class="detail-row"><span>Assigned team</span><span>' + escapeHtml(s.assignedTeam) + '</span></div>' +
              '<div class="detail-row"><span>Coverage</span><span>' + escapeHtml(s.coverage) + '</span></div>' +
            '</div>' +

            '<div class="card soft" style="padding: 12px;">' +
              '<div class="kicker">Operational Notes</div>' +
              '<p class="p">' + escapeHtml(s.notes) + '</p>' +
            '</div>' +
          '</article>'
        );
      })
      .join("");
  }

  function alertIcon(type) {
    // Inline SVG icons to avoid external deps
    if (type === "Intrusion") {
      return '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M12 2L4 6V12C4 16.8 7.4 21.3 12 22C16.6 21.3 20 16.8 20 12V6L12 2Z" stroke="rgba(255,255,255,0.86)" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M12 7V13" stroke="rgba(255,255,255,0.86)" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M12 17H12.01" stroke="rgba(255,255,255,0.86)" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>';
    }

    if (type === "System Malfunction") {
      return '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M12 3V7" stroke="rgba(255,255,255,0.86)" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M12 17V21" stroke="rgba(255,255,255,0.86)" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M4.2 7.2L7 10" stroke="rgba(255,255,255,0.86)" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M17 14L19.8 16.8" stroke="rgba(255,255,255,0.86)" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M3 12H7" stroke="rgba(255,255,255,0.86)" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M17 12H21" stroke="rgba(255,255,255,0.86)" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M4.2 16.8L7 14" stroke="rgba(255,255,255,0.86)" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M17 10L19.8 7.2" stroke="rgba(255,255,255,0.86)" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M12 10.5V13.5" stroke="rgba(255,255,255,0.86)" stroke-width="2" stroke-linecap="round"/>' +
      '</svg>';
    }

    return '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M12 2C8 5 6 8 6 12C6 16 9 20 12 22C15 20 18 16 18 12C18 8 16 5 12 2Z" stroke="rgba(255,255,255,0.86)" stroke-width="2"/>' +
      '<path d="M9 12H15" stroke="rgba(255,255,255,0.86)" stroke-width="2" stroke-linecap="round"/>' +
    '</svg>';
  }

  function renderAlerts() {
    var host = $("#alertsList");
    if (!host) return;

    host.innerHTML = data.alerts
      .slice()
      .sort(function (a, b) { return new Date(b.time) - new Date(a.time); })
      .map(function (a) {
        return (
          '<div class="card" style="padding: 14px;">' +
            '<div style="display:flex; align-items: start; justify-content: space-between; gap: 12px;">' +
              '<div style="display:flex; gap: 10px; align-items: start;">' +
                alertIcon(a.type) +
                '<div>' +
                  '<div style="display:flex; gap: 10px; align-items: center; flex-wrap: wrap;">' +
                    '<strong>' + escapeHtml(a.type) + '</strong>' +
                    '<span class="priority ' + escapeHtml(a.priority) + '">' + escapeHtml(a.priority.toUpperCase()) + '</span>' +
                    '<span class="tag"><span class="pill" aria-hidden="true"></span>' + escapeHtml(a.id) + '</span>' +
                  '</div>' +
                  '<div class="helper">' + escapeHtml(a.site) + ' · ' + escapeHtml(fmtDateTime(a.time)) + '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<p class="p" style="margin-top: 10px;">' + escapeHtml(a.details) + '</p>' +
          '</div>'
        );
      })
      .join("");
  }

  function renderIncidents() {
    var host = $("#incidentTimeline");
    if (!host) return;

    host.innerHTML = data.incidents
      .slice()
      .sort(function (a, b) { return new Date(b.time) - new Date(a.time); })
      .map(function (i) {
        var sev = String(i.severity || "");
        var sevClass = sev === "High" ? "high" : sev === "Medium" ? "medium" : "low";

        var actions = (i.actions || []).map(function (x) {
          return '<li>' + escapeHtml(x) + '</li>';
        }).join("");

        return (
          '<article class="card timeline-item">' +
            '<div class="timeline-top">' +
              '<div>' +
                '<h3 class="timeline-title">' + escapeHtml(i.title) + '</h3>' +
                '<div class="timeline-meta">' + escapeHtml(i.id) + ' · ' + escapeHtml(i.site) + ' · ' + escapeHtml(fmtDateTime(i.time)) + '</div>' +
              '</div>' +
              '<div style="display:flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: flex-end;">' +
                '<span class="priority ' + sevClass + '">Severity: ' + escapeHtml(sev) + '</span>' +
                '<span class="tag"><span class="pill" aria-hidden="true"></span>' + escapeHtml(i.resolution) + '</span>' +
              '</div>' +
            '</div>' +

            '<p class="p">' + escapeHtml(i.summary) + '</p>' +

            '<div class="cards-2">' +
              '<div class="card soft" style="padding: 12px;">' +
                '<div class="kicker">Security Officer Notes</div>' +
                '<p class="p">' + escapeHtml(i.officerNotes) + '</p>' +
              '</div>' +
              '<div class="card soft" style="padding: 12px;">' +
                '<div class="kicker">Actions Taken</div>' +
                '<ul class="list">' + actions + '</ul>' +
              '</div>' +
            '</div>' +

            '<div style="display:flex; gap: 10px; flex-wrap: wrap; margin-top: 6px;">' +
              '<button class="btn small" type="button" data-download-report="' + escapeHtml(i.id) + '">Download Report</button>' +
              '<button class="btn small" type="button" data-add-note="' + escapeHtml(i.id) + '">Add Client Note</button>' +
              '<span class="helper" data-inc-status="' + escapeHtml(i.id) + '" role="status" aria-live="polite"></span>' +
            '</div>' +
          '</article>'
        );
      })
      .join("");

    // Bind buttons
    $all("[data-download-report]", host).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-download-report");
        var incident = data.incidents.find(function (x) { return x.id === id; });
        if (!incident) return;

        var text =
          "Sentinel Secure Services – Incident Report\n" +
          "Incident ID: " + incident.id + "\n" +
          "Title: " + incident.title + "\n" +
          "Site: " + incident.site + "\n" +
          "Severity: " + incident.severity + "\n" +
          "Status: " + incident.resolution + "\n" +
          "Time: " + fmtDateTime(incident.time) + "\n\n" +
          "Summary:\n" + incident.summary + "\n\n" +
          "Officer Notes:\n" + incident.officerNotes + "\n\n" +
          "Actions Taken:\n- " + (incident.actions || []).join("\n- ") + "\n";

        downloadTextFile(incident.id + "_report.txt", text);

        var statusEl = $("[data-inc-status=\"" + cssEscape(id) + "\"]");
        if (statusEl) statusEl.textContent = "Report generated and downloaded.";
      });
    });

    $all("[data-add-note]", host).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-add-note");
        var statusEl = $("[data-inc-status=\"" + cssEscape(id) + "\"]");

        var note = window.prompt("Add a client note for " + id + ":");
        if (!note) {
          if (statusEl) statusEl.textContent = "Client note not added.";
          return;
        }

        if (statusEl) statusEl.textContent = "Client note saved to this session view.";
      });
    });
  }

  function renderAccessLogs() {
    var tbody = $("#accessTbody");
    if (!tbody) return;

    var filters = {
      from: $("#filterFrom"),
      to: $("#filterTo"),
      category: $("#filterCategory"),
      site: $("#filterSite")
    };

    // Populate site filter
    if (filters.site) {
      var uniqueSites = data.accessLogs
        .map(function (x) { return x.site; })
        .filter(function (x, idx, arr) { return arr.indexOf(x) === idx; });

      uniqueSites.forEach(function (s) {
        var opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        filters.site.appendChild(opt);
      });
    }

    function apply() {
      var from = filters.from && filters.from.value ? new Date(filters.from.value) : null;
      var to = filters.to && filters.to.value ? new Date(filters.to.value) : null;
      var category = filters.category ? filters.category.value : "";
      var site = filters.site ? filters.site.value : "";

      var rows = data.accessLogs.filter(function (r) {
        var t = new Date(r.time);
        if (from && t < from) return false;
        if (to) {
          // include whole 'to' date
          var end = new Date(to);
          end.setHours(23, 59, 59, 999);
          if (t > end) return false;
        }
        if (category && r.category !== category) return false;
        if (site && r.site !== site) return false;
        return true;
      });

      tbody.innerHTML = rows
        .slice()
        .sort(function (a, b) { return new Date(b.time) - new Date(a.time); })
        .map(function (r) {
          var outcomeColor = r.outcome === "Granted" ? "var(--success)" : "var(--danger)";
          return (
            "<tr>" +
              "<td>" + escapeHtml(r.id) + "</td>" +
              "<td>" + escapeHtml(r.category) + "</td>" +
              "<td>" + escapeHtml(r.person) + "</td>" +
              "<td>" + escapeHtml(r.site) + "</td>" +
              "<td>" + escapeHtml(fmtDateTime(r.time)) + "</td>" +
              "<td><span style=\"font-weight:900; color:" + outcomeColor + "\">" + escapeHtml(r.outcome) + "</span></td>" +
              "<td>" + escapeHtml(r.method) + "</td>" +
            "</tr>"
          );
        })
        .join("");

      setText("accessCount", String(rows.length));
    }

    [filters.from, filters.to, filters.category, filters.site].forEach(function (el) {
      if (!el) return;
      el.addEventListener("change", apply);
    });

    var resetBtn = $("#resetAccessFilters");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (filters.from) filters.from.value = "";
        if (filters.to) filters.to.value = "";
        if (filters.category) filters.category.value = "";
        if (filters.site) filters.site.value = "";
        apply();
      });
    }

    apply();
  }

  function renderRequests() {
    var host = $("#requestsList");
    if (!host) return;

    host.innerHTML = data.requests
      .slice()
      .sort(function (a, b) { return new Date(b.submitted) - new Date(a.submitted); })
      .map(function (r) {
        return (
          '<div class="card" style="padding: 14px;">' +
            '<div style="display:flex; align-items: start; justify-content: space-between; gap: 12px;">' +
              '<div>' +
                '<strong>' + escapeHtml(r.type) + '</strong>' +
                '<div class="helper">' + escapeHtml(r.id) + ' · ' + escapeHtml(r.site) + ' · Submitted ' + escapeHtml(fmtDateTime(r.submitted)) + '</div>' +
              '</div>' +
              '<span class="tag"><span class="pill" aria-hidden="true"></span>' + escapeHtml(r.status) + '</span>' +
            '</div>' +
            '<p class="p" style="margin-top: 10px;">' + escapeHtml(r.details) + '</p>' +
          '</div>'
        );
      })
      .join("");
  }

  function bindRequestForm() {
    var form = $("#requestForm");
    if (!form) return;

    // Populate sites
    var siteSelect = $("#reqSite");
    if (siteSelect) {
      data.sites.forEach(function (s) {
        var opt = document.createElement("option");
        opt.value = s.name;
        opt.textContent = s.name;
        siteSelect.appendChild(opt);
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var type = form.reqType.value;
      var site = form.reqSite.value;
      var details = form.reqDetails.value.trim();

      var ok = true;
      setHidden("reqTypeError", !!type);
      ok = ok && !!type;

      setHidden("reqSiteError", !!site);
      ok = ok && !!site;

      setHidden("reqDetailsError", details.length >= 20);
      ok = ok && details.length >= 20;

      if (!ok) {
        setText("requestStatus", "Please review the highlighted fields and try again.");
        return;
      }

      var id = "SR-" + Math.floor(3000 + Math.random() * 900);

      data.requests.unshift({
        id: id,
        type: type,
        site: site,
        submitted: new Date().toISOString(),
        status: "Submitted",
        details: details
      });

      form.reset();
      setText("requestStatus", "Request submitted successfully. Tracking ID: " + id);
      renderRequests();
    });
  }

  function renderDocuments() {
    var host = $("#documentsList");
    if (!host) return;

    host.innerHTML = data.documents
      .slice()
      .sort(function (a, b) { return new Date(b.updated) - new Date(a.updated); })
      .map(function (d) {
        return (
          '<div class="card" style="padding: 14px;">' +
            '<div style="display:flex; align-items: start; justify-content: space-between; gap: 12px;">' +
              '<div>' +
                '<strong>' + escapeHtml(d.title) + '</strong>' +
                '<div class="helper">' + escapeHtml(d.category) + ' · Updated ' + escapeHtml(fmtDateTime(d.updated)) + ' · ' + escapeHtml(d.id) + '</div>' +
              '</div>' +
              '<div style="display:flex; gap: 10px; flex-wrap: wrap;">' +
                '<button class="btn small" type="button" data-view-doc="' + escapeHtml(d.id) + '">View</button>' +
                '<button class="btn small" type="button" data-download-doc="' + escapeHtml(d.id) + '">Download</button>' +
              '</div>' +
            '</div>' +
            '<p class="p" style="margin-top: 10px;">' + escapeHtml(d.summary) + '</p>' +
          '</div>'
        );
      })
      .join("");

    $all("[data-view-doc]", host).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-view-doc");
        openDocumentViewer(id);
      });
    });

    $all("[data-download-doc]", host).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-download-doc");
        var d = data.documents.find(function (x) { return x.id === id; });
        if (!d) return;

        var text =
          "Sentinel Secure Services – Document Export\n" +
          "Document ID: " + d.id + "\n" +
          "Title: " + d.title + "\n" +
          "Category: " + d.category + "\n" +
          "Updated: " + fmtDateTime(d.updated) + "\n\n" +
          "Summary:\n" + d.summary + "\n";

        downloadTextFile(d.id + "_document.txt", text);
      });
    });
  }

  function openDocumentViewer(docId) {
    var modal = $("#docModal");
    var title = $("#docModalTitle");
    var body = $("#docModalBody");

    if (!modal || !title || !body) return;

    var d = data.documents.find(function (x) { return x.id === docId; });
    if (!d) return;

    title.textContent = d.title;

    body.innerHTML =
      '<div class="viewer">' +
        '<div class="kicker">Document Viewer</div>' +
        '<p class="p">This secure viewer is a UI demonstration. In production, documents are delivered with access control, audit trails, and time-bound URLs.</p>' +
        '<ul class="list">' +
          '<li><strong>ID:</strong> ' + escapeHtml(d.id) + '</li>' +
          '<li><strong>Category:</strong> ' + escapeHtml(d.category) + '</li>' +
          '<li><strong>Last updated:</strong> ' + escapeHtml(fmtDateTime(d.updated)) + '</li>' +
        '</ul>' +
      '</div>' +
      '<div class="viewer">' +
        '<div class="kicker">Summary</div>' +
        '<p class="p">' + escapeHtml(d.summary) + '</p>' +
        '<ul class="list">' +
          '<li>Access governance: authorized client contacts only</li>' +
          '<li>Audit readiness: download actions recorded with timestamps</li>' +
          '<li>Document integrity: version control and checksum validation</li>' +
        '</ul>' +
      '</div>';

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function bindModal() {
    var modal = $("#docModal");
    if (!modal) return;

    var close = $("[data-modal-close]", modal);
    if (close) {
      close.addEventListener("click", function () {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
      });
    }

    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("open")) {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  }

  function bindProfileForms() {
    var org = $("#profileOrg");
    var contact = $("#profileContact");
    var email = $("#profileEmail");
    var role = $("#profileRole");

    var session = window.SSSAuth && window.SSSAuth.getSession ? window.SSSAuth.getSession() : null;
    if (session) {
      if (org) org.value = session.organization || "";
      if (contact) contact.value = session.contactName || "";
      if (email) email.value = session.email || "";
      if (role) role.value = session.role || "";
    }

    var profileForm = $("#profileForm");
    if (profileForm) {
      profileForm.addEventListener("submit", function (e) {
        e.preventDefault();
        setText("profileStatus", "Profile settings updated for this session view.");
      });
    }

    var securityForm = $("#securityForm");
    if (securityForm) {
      securityForm.addEventListener("submit", function (e) {
        e.preventDefault();

        var cur = securityForm.currentPassword.value;
        var next = securityForm.newPassword.value;
        var confirm = securityForm.confirmNewPassword.value;

        var ok = true;
        setHidden("curPwError", !!cur);
        ok = ok && !!cur;

        setHidden("newPwError", next.length >= 8);
        ok = ok && next.length >= 8;

        setHidden("newPwConfirmError", next && confirm && next === confirm);
        ok = ok && next && confirm && next === confirm;

        if (!ok) {
          setText("securityStatus", "Please review the highlighted fields and try again.");
          return;
        }

        setText("securityStatus", "Password update recorded for this UI demo. In production, password changes require server validation and MFA checks.");
        securityForm.reset();
      });
    }
  }

  // ---------- Routing ----------
  var routes = [
    { id: "overview", title: "Dashboard Overview", subtitle: "Key metrics, program snapshot, and compliance posture" },
    { id: "monitoring", title: "Live Monitoring", subtitle: "Live site status, last activity, and assigned response teams" },
    { id: "alerts", title: "Alert Center", subtitle: "Prioritized alerts, system notifications, and triage details" },
    { id: "incidents", title: "Incident Reports", subtitle: "Incident timeline, severity classification, and report downloads" },
    { id: "access", title: "Access Control Logs", subtitle: "Employee and visitor access records with secure filtering" },
    { id: "requests", title: "Service Requests", subtitle: "Request additional coverage, surveillance, or risk reassessments" },
    { id: "compliance", title: "Compliance & Documents", subtitle: "Certificates, SLAs, and insurance documentation" },
    { id: "profile", title: "Profile & Settings", subtitle: "Organization details, notifications, and security settings" }
  ];

  function activateRoute(routeId) {
    var route = routes.find(function (r) { return r.id === routeId; }) || routes[0];

    $all(".view").forEach(function (v) {
      v.classList.toggle("active", v.getAttribute("data-view") === route.id);
    });

    $all("[data-route]").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-route") === route.id);
    });

    setText("pageTitle", route.title);
    setText("pageSubtitle", route.subtitle);

    // Close sidebar on mobile after navigation
    var sidebar = $("#sidebar");
    if (sidebar) sidebar.classList.remove("open");

    // Persist route (UI convenience)
    try {
      sessionStorage.setItem("sss_route", route.id);
    } catch (e) {
      // ignore
    }
  }

  function initRouting() {
    $all("[data-route]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        activateRoute(btn.getAttribute("data-route"));
      });
    });

    var saved = null;
    try {
      saved = sessionStorage.getItem("sss_route");
    } catch (e) {
      saved = null;
    }

    activateRoute(saved || "overview");
  }

  function bindSidebarToggle() {
    var toggle = $("#sidebarToggle");
    var sidebar = $("#sidebar");
    if (!toggle || !sidebar) return;

    toggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });
  }

  // ---------- Text helpers for id-based updates ----------
  function setText(id, text) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
  }

  function setHidden(id, visible) {
    var el = document.getElementById(id);
    if (!el) return;
    el.hidden = !visible;
  }

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", function () {
    // Session guard handled by auth.js using [data-require-session]
    var session = window.SSSAuth && window.SSSAuth.getSession ? window.SSSAuth.getSession() : null;

    if (session) {
      setText("userOrg", session.organization || "Client Organization");
      setText("userName", session.contactName || "Authorized Contact");
      setText("userRole", session.role || "Client User");
      setText("userEmail", session.email || "");
    }

    bindSidebarToggle();
    initRouting();

    renderOverview();
    renderMonitoring();
    renderAlerts();
    renderIncidents();
    renderAccessLogs();
    bindRequestForm();
    renderRequests();
    renderDocuments();
    bindModal();
    bindProfileForms();
  });
})();
