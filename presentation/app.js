(() => {
  "use strict";
  const data = window.PRESENTATION_DATA;
  if (!data) return;
  document.documentElement.classList.add("js");
  const $ = (selector) => document.querySelector(selector);
  const all = (selector) => [...document.querySelectorAll(selector)];
  const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const sections = all(".chapter");
  const navLinks = all(".chapter-nav a");
  const labels = ["Story", "Map", "Results", "Replay", "Fixes", "Team"];
  let currentChapter = 0;
  let resultAnimationStarted = false;
  let scrollFrame = 0;
  let evidenceIndex = 0;

  document.title = `${data.project} — Security findings`;
  $("#event-name").textContent = data.event;
  if (!data.demo) all(".demo-label, .demo-stamp").forEach((element) => element.remove());


  $("#main-replay-code").textContent = data.reproductionSnippet;
  const metrics = [{ value: data.exploratoryRecords, label: "Logged records" }, { value: data.incomingReview.referenceCounts.unique_combined, label: "Referenced turns" }, { value: data.stage3.models.length, label: "Claude 5.5 models" }];
  $("#metrics").innerHTML = metrics.map(metric => `<div class="metric"><span class="metric-value" data-counter="${metric.value}">0</span><span class="metric-label">${escape(metric.label)}</span></div>`).join("");
  const outcomeLabel = { breach: "Disclosed", blocked: "Refused", unreported: "\u2014", none: "No content", inferred: "Inferred", returned: "Returned", appended: "Appended" };
  let evidenceEntries = data.stage3.evidence;
  function selectEvidence(index, focus = false) {
    evidenceIndex = index;
    const entry = evidenceEntries[index];
    all("#evidence-tabs button").forEach((button, i) => { button.setAttribute("aria-selected", String(i === index)); button.tabIndex = i === index ? 0 : -1; });
    $("#evidence-content").setAttribute("aria-labelledby", `evidence-tab-${index}`);
    $("#evidence-content").innerHTML = `<div class="evidence-body" data-outcome="${escape(entry.outcome)}"><div class="evidence-model"><span>${escape(entry.model)}</span><span class="outcome-label">${escape(entry.status)}</span></div><p class="evidence-caption">${escape(entry.promptSource || 'Recorded request / attack pattern')}</p><pre class="evidence-prompt">${escape(entry.prompt)}</pre><p class="evidence-caption">Selected reply / tool-call evidence</p><pre class="response-block">${escape(entry.response)}</pre><p class="turn-id">turn_id: ${escape(entry.turn)}</p></div>`;
    if (focus) all("#evidence-tabs button")[index].focus();
  }
  function selectRound(key) {
    const round = key === 'stage3' ? data.stage3 : data.results;
    evidenceEntries = round.evidence;
    $("#results-title").innerHTML = round.title;
    $("#results-takeaway").textContent = round.takeaway;
    $(".matrix-note").textContent = round.roundNote;
    all('[data-result-round]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.resultRound === key)));
    const third = all('#metrics .metric')[2];
    third.querySelector('.metric-value').dataset.counter = round.models.length;
    third.querySelector('.metric-value').textContent = round.models.length;
    third.querySelector('.metric-label').textContent = key === 'stage3' ? 'Claude 5.5 models' : 'Nebius tiers';
    $("#model-matrix").innerHTML = `<table class="boundary-matrix"><caption class="sr-only">Observed outcomes for the selected round; a dash means unreported. Public output and private disclosure are distinguished.</caption><thead><tr><th scope="col">Boundary</th>${round.models.map(model => `<th scope="col"><abbr title="${escape(model.fullName)}">${escape(key === 'stage3' ? model.name : model.tier === 'very large' ? 'V.large' : model.tier)}</abbr></th>`).join('')}</tr></thead><tbody>${round.matrix.map(row => `<tr><th scope="row">${escape(row.boundary)}</th>${row.outcomes.map(outcome => `<td data-outcome="${outcome}">${row.boundary === 'Database / email tool use' && outcome === 'breach' ? 'Invoked' : outcomeLabel[outcome]}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    $("#evidence-tabs").innerHTML = evidenceEntries.map((entry,index) => `<button type="button" role="tab" id="evidence-tab-${index}" aria-selected="${index === 0}" aria-controls="evidence-content" tabindex="${index === 0 ? 0 : -1}" data-evidence="${index}">${escape(entry.label)}</button>`).join('');
    $(".findings-overview").innerHTML = round.overview.map(([label,text]) => `<span><strong>${escape(label)}</strong> ${escape(text)}</span>`).join('');
    selectEvidence(0);
  }
  all('[data-result-round]').forEach(button => button.addEventListener('click',()=>selectRound(button.dataset.resultRound)));
  $("#evidence-tabs").addEventListener('click',event => { const button=event.target.closest('[data-evidence]'); if(button)selectEvidence(Number(button.dataset.evidence)); });
  $("#evidence-tabs").addEventListener("keydown", event => {
    if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
    event.preventDefault();
    let next=evidenceIndex;
    if(event.key==='ArrowRight')next=(next+1)%evidenceEntries.length;
    if(event.key==='ArrowLeft')next=(next-1+evidenceEntries.length)%evidenceEntries.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=evidenceEntries.length-1;
    selectEvidence(next,true);
  });
  selectRound('stage3');

  $("#team-grid").innerHTML = data.team.map((member) => `<article class="team-card"><div class="member-art"><img class="member-photo" src="${escape(member.photo)}" alt="${escape(member.name)}" width="240" height="240"></div>${member.role ? `<p class="member-role">${escape(member.role)}</p>` : ''}<h3>${escape(member.name)}</h3>${member.contribution ? `<p class="member-contribution">${escape(member.contribution)}</p>` : ''}</article>`).join("");

  // The appendix keeps the complete export available without changing pitch pacing.
  const detail = (title, content, open = false) => `<details class="appendix-section"${open ? " open" : ""}><summary>${escape(title)}</summary><div class="appendix-section-body">${content}</div></details>`;
  const definitionRows = rows => `<dl class="export-definitions">${rows.map(([term, text]) => `<dt>${escape(term)}</dt><dd>${escape(text)}</dd>`).join("")}</dl>`;
  const reports = data.teammateReports;
  const teammateReview = `<p>Four preserved reports reference ${reports.referencedIds} unique IDs. Four overlap the earlier registry. The ${reports.newReferences} new references include controls, refusals and summary-only claims, so they remain separate from the earlier 45-ID registry.</p>${reports.corrections.map(note => `<p>${escape(note)}</p>`).join('')}<h3>Original sources</h3>${reports.sources.map(source => `<details><summary>${escape(source.contributor)} / ${escape(source.path.split('/').at(-1))}</summary><p>${escape(source.cohort)}</p><p>${escape(source.fidelity)}</p><p>${source.bytes} bytes / SHA-256 <code>${escape(source.sha256)}</code></p><p>Preserved at <code>${escape(source.path)}</code></p></details>`).join('')}<h3>Referenced turns / reported evidence and controls</h3>${reports.records.map(record => `<details class="teammate-record"><summary><code>${escape(record.turn)}</code> / ${escape(record.status)}</summary><p>${escape(record.contributor)} / ${escape(record.cohort)} / ${escape(record.model)}</p><p>${record.originalRegistry ? 'Already in the earlier registry; counted once.' : 'Separate teammate reference; not counted in the earlier registry.'} Matching raw traces, where available, are indexed in logs/evidence-index.json; outcome review remains separate.</p>${record.visibleRows ? `<p>${record.completeRows} complete delimited records visible${record.completeRows !== record.visibleRows ? ' plus a partial line' : ''}. This is an excerpt count, not a success rate.</p>` : ''}<p>${record.sources.map(source => `${escape(source.path)}:${source.line}`).join('<br>')}</p><pre class="reference-code">${escape(record.body)}</pre></details>`).join('')}`;
  const modelRows = data.results.models.map(model => `<tr><th scope="row">Nebius / ${escape(model.tier)}</th><td><code>${escape(model.fullName)}</code></td><td>${data.registry.filter(row => row[0] === model.tier).length}</td></tr>`).join("") + `<tr><th scope="row">Groq / large</th><td><code>groq/openai/gpt-oss-120b</code></td><td>${data.registry.filter(row => row[0] === "Groq 120B").length}</td></tr>`;
  const allIds = data.registry.map(row => row[1]).join("\n");
  const registry = `<p>${data.registry.length} earlier evidence turns: 43 in the four-tier Nebius cohort and 2 separately attributed Groq 120B turns. Includes catalog discovery and payload extraction; this is not an attack success rate. The merged archive now provides raw trace locations for ${data.incomingReview.referenceCounts.with_raw_trace} of ${data.incomingReview.referenceCounts.unique_combined} combined references; the earlier registry remains distinct.</p><div class="registry-filters"><label>Model / cohort<select id="registry-tier"><option value="">All cohorts</option>${data.results.models.map(model => `<option>${escape(model.tier)}</option>`).join("")}<option>Groq 120B</option></select></label><label>Search evidence<input id="registry-search" type="search" placeholder="Table, turn ID, patient or finding"></label></div><p id="registry-count" role="status"></p><div class="table-scroll"><table class="export-table"><thead><tr><th scope="col">Cohort / tier</th><th scope="col">turn_id</th><th scope="col">Finding / evidence</th></tr></thead><tbody id="registry-rows"></tbody></table></div><details><summary>Earlier registry IDs / ${data.registry.length} unique</summary><p>Excluded IDs are omitted. Review the separately attributed cohorts before submitting.</p><textarea id="submission-ids" aria-label="Earlier evidence turn IDs" readonly rows="8">${escape(allIds)}</textarea><button type="button" id="select-ids">Select all turn IDs</button></details>`;
  const schema = `<p>${escape(data.schemaNote)}</p><div class="table-scroll"><table class="export-table schema-table"><thead><tr><th scope="col">Table / status</th><th scope="col">Supplied fields</th></tr></thead><tbody>${data.schema.map(row => `<tr><th scope="row"><code>${escape(row.table)}</code><small>${escape(row.status)}</small>${row.count === null ? "" : `<small>${row.count} supplied columns</small>`}</th><td>${escape(row.columns)}${row.note ? `<small>${escape(row.note)}</small>` : ""}</td></tr>`).join("")}</tbody></table></div>`;
  const excluded = Object.entries(data.excluded).map(([type, ids]) => `<h3>${escape(type)} / ${ids.length}</h3><p>${type === "hallucinated" ? "Small Qwen3 turns without [Riley used tool: query_db]." : type === "duplicate" ? "Exact duplicate of c38a628d12d24209a9bc31757c50be67; submit only that canonical ID." : type === "unverified" ? "No fresh tool invocation; includes cached replies and fabricated schema/encoding claims. Not independent tool-backed evidence." : "Refused or non-disclosing replies. Some call tools, but the visible reply does not establish a leak."}</p><pre class="id-list">${escape(ids.join("\n"))}</pre>`).join("");
  $("#source-note").textContent = data.source;
  const incoming = data.incomingReview;
  const incomingReview = `<p>${data.exploratoryRecords} records across four preserved logs. ${incoming.referenceCounts.with_raw_trace} of ${incoming.referenceCounts.unique_combined} referenced IDs match raw traces. Counts include retries, errors and controls.</p><div class="table-scroll"><table class="export-table"><thead><tr><th>Preserved log</th><th>Records</th><th>Unique turn IDs</th></tr></thead><tbody>${incoming.sessions.map(session => `<tr><td><code>${escape(session.path)}</code></td><td>${session.records}</td><td>${session.unique_turn_ids}</td></tr>`).join('')}</tbody></table></div>${incoming.corrections.map(note => `<p>${escape(note)}</p>`).join('')}<h3>References without raw matches</h3><p>These ${incoming.unmatched.length} remain reported excerpts.</p><pre class="id-list">${escape(incoming.unmatched.join('\n'))}</pre><p>Current submission claims and selected proof: docs/FINAL_SUBMISSION.md. Exact trace paths and source hashes: logs/evidence-index.json.</p>`;
  $("#appendix-content").innerHTML =
    detail("Interactive database map", `<p>30 tables, expandable columns, reply samples and supplied/inferred relationship links.</p><button type="button" data-open-database>Open database map ↗</button>`) +
    detail("Merged evidence / latest team review", incomingReview) +
    detail("Stage 3 / Claude 5.5 evidence and controls", `<p>Exact recorded hosts: claude-opus-5-5 and claude-haiku-5-5. Opus is the strongest model in the supplied three-model Claude lineup; no Sonnet run was supplied.</p>${data.stage3.review.notes.map(note => `<p>${escape(note)}</p>`).join('')}<p>Original survey: docs/OBSERVATIONS.md. Haiku excerpt: leaks/umair-claude-haiku-5-leak.md. Sparsh controls: logs/stage3/sparsh-haiku-5-5.jsonl. Review and hashes: logs/stage3/review.json.</p>`) +
    detail("Transcript verification & corrections", data.verificationNotes.map(text => `<p>${escape(text)}</p>`).join("")) +
    detail("Teammate reports / rounds, evidence and corrections", teammateReview) +
    detail("Environment, model lineup & reproducibility", `${definitionRows(data.environment)}<div class="table-scroll"><table class="export-table"><thead><tr><th scope="col">Tier</th><th scope="col">Target model</th><th scope="col">Verified turns</th></tr></thead><tbody>${modelRows}</tbody></table></div>`, true) +
    detail("Cross-model findings & delta", data.findings.map(text => `<p>${escape(text)}</p>`).join("") + `<h3>Optional probes completed in the delta</h3>${definitionRows(data.completedProbes)}<details><summary>Source probe prompts</summary>${data.probePrompts.map(text => `<p>${escape(text)}</p>`).join("")}</details>`) +
    detail("Earlier evidence registry / 45 turns", registry) +
    detail("All 30 discovered SQLite tables", schema) +
    detail("Do not submit / hallucinated, refused & duplicate turns", excluded) +
    detail("Immediate deliverables & validation status", data.actions.map(action => `<h3>${escape(action.title)}</h3><p class="action-status">${escape(action.status)}</p><p>${escape(action.detail)}</p>`).join("")) +
    detail("Proposed safeguards / implementation choices", definitionRows(data.solutionDetails)) +
    detail("Deterministic mitigation / supplied reference code", `<p class="reference-warning">${escape(data.referenceLimitations)}</p><pre class="reference-code"><code>${escape(data.referenceCode)}</code></pre>`) +
    detail("Judging rubric / coverage and open work", `<p>${escape(data.rubric.source)}</p><div class="table-scroll"><table class="export-table"><thead><tr><th>Criterion</th><th>Weight</th><th>Coverage and remaining work</th></tr></thead><tbody>${data.rubric.criteria.map(([name, weight, coverage]) => `<tr><th scope="row">${escape(name)}</th><td>${weight}%</td><td>${escape(coverage)}</td></tr>`).join('')}</tbody></table></div>`) +
    detail("Reproducibility / fresh-session skeleton", '<p>Choose models, reset each conversation, repeat each case 2–3 times, check expected values and tool calls, and save raw records.</p><button type="button" data-open-replay>Open replay skeleton ↗</button>') +
    detail("Three-minute story / speaker notes", definitionRows(data.pitch));
  function filterRegistry() {
    const tier = $("#registry-tier").value;
    const query = $("#registry-search").value.trim().toLowerCase();
    const rows = data.registry.filter(row => (!tier || row[0] === tier) && (!query || row.join(" ").toLowerCase().includes(query)));
    $("#registry-rows").innerHTML = rows.map(([model, turn, title, text]) => `<tr><td>${escape(model)}</td><td><code>${escape(turn)}</code></td><td><strong>${escape(title)}</strong><p>${escape(text)}</p></td></tr>`).join("");
    $("#registry-count").textContent = `${rows.length} of ${data.registry.length} evidence turns`;
  }
  $("#registry-tier").addEventListener("change", filterRegistry);
  $("#registry-search").addEventListener("input", filterRegistry);
  $("#select-ids").addEventListener("click", () => { $("#submission-ids").focus(); $("#submission-ids").select(); });
  filterRegistry();
  const appendix = $("#evidence-dialog");
  all("[data-open-appendix]").forEach(button => button.addEventListener("click", () => { appendix.showModal(); document.documentElement.classList.add("appendix-open"); }));
  $("#close-appendix").addEventListener("click", () => appendix.close());
  appendix.addEventListener("close", () => document.documentElement.classList.remove("appendix-open"));

  function animateResults() {
    if (resultAnimationStarted) return;
    resultAnimationStarted = true;
    all("[data-counter]").forEach((counter) => {
      const target = Number(counter.dataset.counter);
      if (reducedMotion.matches) { counter.textContent = target; return; }
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / 1000, 1);
        counter.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  all(".reveal").forEach((element) => revealObserver.observe(element));

  function updateScroll() {
    scrollFrame = 0;
    const midpoint = window.innerHeight * .48;
    let nearest = 0;
    let nearestDistance = Infinity;
    sections.forEach((section, index) => {
      const bounds = section.getBoundingClientRect();
      const distance = midpoint >= bounds.top && midpoint <= bounds.bottom ? 0 : Math.min(Math.abs(midpoint - bounds.top), Math.abs(midpoint - bounds.bottom));
      if (distance < nearestDistance) { nearest = index; nearestDistance = distance; }
      const progress = Math.max(-1, Math.min(1, -bounds.top / window.innerHeight));
      section.style.setProperty("--chapter-progress", progress.toFixed(3));
      if (section.id === "results" && bounds.top < window.innerHeight * .7 && bounds.bottom > 0) animateResults();
    });
    currentChapter = nearest;
    navLinks.forEach((link, index) => {
      if (index === nearest) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    const theme = sections[nearest].dataset.theme;
    $(".site-header").dataset.theme = theme;
    $(".presentation-controls").dataset.theme = theme;
    $("#active-number").textContent = String(nearest + 1).padStart(2, "0");
    $("#active-label").textContent = labels[nearest];
    $("#previous-chapter").disabled = nearest === 0;
    $("#next-chapter").disabled = nearest === sections.length - 1;
    const range = document.documentElement.scrollHeight - window.innerHeight;
    $(".reading-progress i").style.transform = `scaleX(${range > 0 ? Math.min(window.scrollY / range, 1) : 0})`;
  }
  function scheduleScroll() { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }
  window.addEventListener("scroll", scheduleScroll, { passive: true });
  window.addEventListener("resize", scheduleScroll);
  function goToChapter(index) {
    const next = Math.max(0, Math.min(sections.length - 1, index));
    sections[next].scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "start" });
  }
  $("#previous-chapter").addEventListener("click", () => goToChapter(currentChapter - 1));
  $("#next-chapter").addEventListener("click", () => goToChapter(currentChapter + 1));
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { $("#fullscreen").title = "Use your browser's fullscreen shortcut (F11)"; }
  }
  $("#fullscreen").addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", () => $("#fullscreen").setAttribute("aria-label", document.fullscreenElement ? "Exit fullscreen" : "Enter fullscreen"));
  document.addEventListener("keydown", (event) => {
    if (document.querySelector("dialog[open]")) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest("button, a, input, textarea, select, [contenteditable]")) return;
    if (currentChapter === 0 && ["ArrowRight", "ArrowLeft", " "].includes(event.key)) { event.preventDefault(); document.dispatchEvent(new CustomEvent("story-step-request", { detail: event.key === "ArrowLeft" ? -1 : 1 })); return; }
    if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(event.key)) { event.preventDefault(); goToChapter(currentChapter + 1); }
    if (["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); goToChapter(currentChapter - 1); }
    if (event.key === "Home") { event.preventDefault(); goToChapter(0); }
    if (event.key === "End") { event.preventDefault(); goToChapter(sections.length - 1); }
    if (event.key.toLowerCase() === "f") toggleFullscreen();
  });
  updateScroll();
})();
