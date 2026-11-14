(() => {
  "use strict";
  const db = window.DATABASE_DATA;
  const presentation = window.PRESENTATION_DATA;
  if (!db || !presentation) return;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const tables = new Map(db.tables.map(table => [table.id, table]));
  const registry = new Map([...presentation.teammateReports.records.map(record => [record.cohort, record.turn, record.title, record.status]), ...presentation.registry].map(row => [row[1], row]));
  const dialog = $("#database-dialog");
  const workspace = $("#database-workspace"), home = $("#database-home");
  home.append(workspace);
  const tableDialog = $("#table-dialog"), inspector = $("#database-inspector"), inspectorHome = inspector.parentElement;
  const svg = $("#database-svg");
  const categories = [
    { id: "financial_auth_secrets", label: "Financial / authentication", x: 20, y: 25, width: 1380, height: 206, columns: 5, nodeWidth: 250, nodeHeight: 52, dx: 274, dy: 68 },
    { id: "patient_identity", label: "Patient identity", x: 20, y: 250, width: 416, height: 296, columns: 1, nodeWidth: 374, nodeHeight: 58, dx: 0, dy: 74 },
    { id: "clinical_phi", label: "Clinical records", x: 456, y: 250, width: 944, height: 296, columns: 4, nodeWidth: 208, nodeHeight: 47, dx: 226, dy: 60 },
    { id: "reference_ops", label: "Reference / operations", x: 20, y: 566, width: 1380, height: 156, columns: 4, nodeWidth: 320, nodeHeight: 70, dx: 340, dy: 0 }
  ];
  const categoryLabels = Object.fromEntries(categories.map(category => [category.id, category.label]));
  const positions = new Map();
  let selected = "patients";
  let selectedColumn = null;
  let matching = new Set(tables.keys());
  let mode = "map";
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let drag = null;
  const tableStatus = table => table.coverage === "unprobed" ? "Unprobed schema" : table.status === "accessible_reference" ? "Reference data" : table.status === "exfiltrated_email" ? "Email chain reported" : "Reported disclosure";
  const coverageLabel = table => ({ unprobed: "Schema unprobed", partial: "Partial fields", permitted_projection: "Permitted projection", supplied_columns: "Supplied columns", reported_fields: "Reported fields" }[table.coverage]);
  const evidenceIds = table => [...new Set(table.leakTurnIds || [])].filter(turn => registry.has(turn));
  const sensitive = name => /ssn|bank_|salary|hourly_rate|processor_token|card_|member_id|group_number|confidentiality|note_text|date_of_birth|address|personal_phone|sexual|drug_|alcohol_|ip_address|workstation_id/.test(name);
  const valueText = value => value === null ? "NULL" : typeof value === "object" ? JSON.stringify(value) : String(value);
  const sampleText = value => { const full = valueText(value); return full.length > 220 ? full.slice(0, 220) + '… [preview; full text in evidence]' : full; };

  $("#database-summary").textContent = `${db.metadata.totalTables} tables · ${db.metadata.tablesWithColumns} with supplied/reported fields · ${db.metadata.unprobedTables} unprobed · ${db.metadata.relationshipCount} relationship links`;
  $("#database-table").innerHTML = [...tables.values()].sort((a, b) => a.name.localeCompare(b.name)).map(table => `<option value="${escape(table.id)}">${escape(table.name)}</option>`).join("");
  $("#database-provenance").innerHTML = `<p>${escape(db.metadata.source)}</p>${db.verificationNotes.map(text => `<p>${escape(text)}</p>`).join("")}`;

  // Fixed group coordinates keep the diagram stable while selections and filters change.
  const groupMarkup = categories.map(category => {
    const members = db.tables.filter(table => table.category === category.id);
    members.forEach((table, index) => positions.set(table.id, { x: category.x + 20 + (index % category.columns) * category.dx, y: category.y + (category.id === "clinical_phi" ? 44 : 50) + Math.floor(index / category.columns) * category.dy, width: category.nodeWidth, height: category.nodeHeight }));
    return `<g class="db-group" data-category="${category.id}"><rect x="${category.x}" y="${category.y}" width="${category.width}" height="${category.height}" rx="14"/><text x="${category.x + 20}" y="${category.y + 27}">${escape(category.label)} / ${members.length}</text></g>`;
  }).join("");
  const edgePath = (edge, index) => {
    const a = positions.get(edge.from);
    const b = positions.get(edge.to);
    if (edge.from === edge.to) return `M ${a.x + a.width} ${a.y + 14} C ${a.x + a.width + 40} ${a.y - 15}, ${a.x + a.width + 40} ${a.y + a.height + 15}, ${a.x + a.width} ${a.y + a.height - 12}`;
    const downward = b.y >= a.y;
    const ax = a.x + a.width / 2;
    const ay = downward ? a.y + a.height : a.y;
    const bx = b.x + b.width / 2;
    const by = downward ? b.y : b.y + b.height;
    if (Math.abs(by - ay) < 30) {
      const rightward = b.x > a.x;
      const sx = rightward ? a.x + a.width : a.x;
      const tx = rightward ? b.x : b.x + b.width;
      return `M ${sx} ${a.y + a.height / 2} L ${(sx + tx) / 2} ${a.y + a.height / 2} L ${(sx + tx) / 2} ${b.y + b.height / 2} L ${tx} ${b.y + b.height / 2}`;
    }
    const lane = (ay + by) / 2 + (index % 7 - 3) * 4;
    return `M ${ax} ${ay} L ${ax} ${lane} L ${bx} ${lane} L ${bx} ${by}`;
  };
  const edges = db.relationships.map((edge, index) => `<path class="db-edge" data-edge="${index}" data-certainty="${edge.certainty}" marker-end="url(#db-arrow)" d="${edgePath(edge, index)}"><title>${escape(`${edge.from}.${edge.fromColumn} → ${edge.to}.${edge.toColumn} (${edge.certainty})`)}</title></path>`).join("");
  const measure = document.createElement("canvas").getContext("2d");
  measure.font = "500 22px Arial";
  const nodes = db.tables.map(table => {
    const p = positions.get(table.id);
    const state = table.coverage === "unprobed" ? "unknown" : table.status === "accessible_reference" ? "reference" : "breach";
    const subtitle = table.coverage === "unprobed" ? "Schema unprobed" : `${table.columns.length} ${table.coverage === "partial" ? "known fields / partial" : table.coverage === "permitted_projection" ? "permitted columns" : table.coverage === "reported_fields" ? "reported fields" : "supplied columns"}`;
    const parts = table.name.split("_");
    const lines = measure.measureText(table.name).width <= p.width - 40 ? [table.name] : [parts.slice(0, -1).join("_"), parts.at(-1)];
    const labels = lines.map((line, i) => `<tspan x="${p.x + 27}" y="${p.y + p.height / 2 + 7 + (i - (lines.length - 1) / 2) * 22}">${escape(line)}</tspan>`).join("");
    return `<g class="db-node" data-table="${escape(table.id)}" data-state="${state}" role="button" tabindex="0" aria-label="${escape(table.id)} table — ${escape(tableStatus(table))}. ${escape(subtitle)}" aria-pressed="false"><rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" rx="9"/><circle cx="${p.x + 14}" cy="${p.y + p.height / 2}" r="4"/><text class="db-node-name">${labels}</text></g>`;
  }).join("");
  svg.innerHTML = `<defs><marker id="db-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill="context-stroke" stroke="none"/></marker></defs><g id="database-scene">${groupMarkup}<g class="db-links">${edges}</g><g class="db-nodes">${nodes}</g></g>`;

  function updateTransform() {
    $("#database-scene").setAttribute("transform", `translate(${offsetX} ${offsetY}) scale(${scale})`);
    $("#database-zoom-value").textContent = `${Math.round(scale * 100)}%`;
    $("#database-zoom-out").disabled = scale <= .6;
    $("#database-zoom-in").disabled = scale >= 3;
  }
  function zoom(next) {
    next = Math.max(.6, Math.min(3, next));
    offsetX = 710 - (710 - offsetX) * next / scale;
    offsetY = 372.5 - (372.5 - offsetY) * next / scale;
    scale = next;
    updateTransform();
  }
  $("#database-zoom-in").addEventListener("click", () => zoom(scale * 1.25));
  $("#database-zoom-out").addEventListener("click", () => zoom(scale / 1.25));
  $("#database-fit").addEventListener("click", () => { scale = 1; offsetX = offsetY = 0; updateTransform(); });
  function focusSelected() {
    const p = positions.get(selected);
    scale = window.innerWidth <= 560 ? 3 : 2;
    offsetX = 710 - (p.x + p.width / 2) * scale;
    offsetY = 372.5 - (p.y + p.height / 2) * scale;
    updateTransform();
  }
  $("#database-focus").addEventListener("click", focusSelected);
  const localPoint = event => {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener("pointerdown", event => {
    if (event.target.closest(".db-node")) return;
    const point = localPoint(event);
    drag = { pointer: event.pointerId, x: point.x, y: point.y, initialX: offsetX, initialY: offsetY };
    svg.setPointerCapture(event.pointerId);
    svg.classList.add("is-dragging");
  });
  svg.addEventListener("pointermove", event => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const point = localPoint(event);
    offsetX = drag.initialX + point.x - drag.x;
    offsetY = drag.initialY + point.y - drag.y;
    updateTransform();
  });
  const stopDrag = () => { drag = null; svg.classList.remove("is-dragging"); };
  svg.addEventListener("pointerup", stopDrag);
  svg.addEventListener("pointercancel", stopDrag);

  function updateDiagram() {
    const connected = new Set([selected]);
    db.relationships.forEach(edge => { if (edge.from === selected) connected.add(edge.to); if (edge.to === selected) connected.add(edge.from); });
    svg.querySelectorAll(".db-node").forEach(node => {
      const id = node.dataset.table;
      node.setAttribute("aria-pressed", String(id === selected));
      node.dataset.match = String(matching.has(id));
      node.dataset.connected = String(connected.has(id));
    });
    svg.querySelectorAll(".db-edge").forEach(path => {
      const edge = db.relationships[Number(path.dataset.edge)];
      path.dataset.active = String(edge.from === selected || edge.to === selected);
      path.dataset.match = String(matching.has(edge.from) || matching.has(edge.to));
    });
  }

  function evidenceMarkup(table) {
    const ids = evidenceIds(table);
    if (!ids.length) return `<p class="db-muted">No disclosure turn is associated with this table. ${table.coverage === "unprobed" ? "Catalog discovery does not establish the schema or a breach." : "Accessible reference rows are not treated as private-data leaks."}</p>`;
    return ids.map(turn => {
      const row = registry.get(turn);
      const inspected = db.transcripts[turn];
      return `<details class="db-turn"><summary><span>${escape(row[0])}</span><code>${escape(turn)}</code><small>${inspected ? inspected.fidelity === "reported" ? "Teammate reply excerpt" : "Tool-backed reply inspected" : "Export-reported"}</small></summary><p>${escape(row[3])}</p>${inspected ? `<p class="db-muted">${escape(inspected.source)} · ${escape(inspected.model)} · tools: ${escape(inspected.tools.length ? inspected.tools.join(" → ") : "raw metadata unavailable")}</p><p class="db-caption">Request</p><pre>${escape(inspected.prompt)}</pre><details><summary>Expand inspected reply</summary><pre>${escape(inspected.reply)}</pre></details>` : `<p class="db-muted">Full reply is not present in the inspected local log or pasted transcript; this entry retains the earlier export's attribution.</p>`}</details>`;
    }).join("");
  }
  function renderInspector() {
    const table = tables.get(selected);
    const relationRows = db.relationships.map((edge, index) => ({ edge, index })).filter(({ edge }) => edge.from === selected || edge.to === selected);
    const sample = table.samples[0];
    const columns = table.columns.map(column => {
      const value = sample && Object.hasOwn(sample.values, column.name) ? sampleText(sample.values[column.name]) : "Not in inspected sample";
      return `<tr data-column="${escape(column.name)}"${selectedColumn === column.name ? ' class="is-highlighted"' : ""}><th scope="row"><code>${escape(column.name)}</code></th><td>${escape(column.type)}</td><td>${column.key ? `<span class="db-key">${escape(column.key)}</span>` : "—"}${column.nullable ? '<small>Nullable (supplied)</small>' : ""}${sensitive(column.name) ? '<small>Sensitive field</small>' : ""}${column.note ? `<small>${escape(column.note)}</small>` : ""}</td><td>${escape(value)}</td></tr>`;
    }).join("");
    $("#database-inspector").innerHTML = `<article class="db-table-detail"><div class="db-table-heading"><div><p class="db-caption">${escape(categoryLabels[table.category])}</p><h3>${escape(table.name)}</h3></div><p class="db-table-status">${escape(tableStatus(table))}<small>${escape(coverageLabel(table))}</small></p></div><details open class="db-columns"><summary>Columns / ${table.columns.length}${table.coverage === "unprobed" ? " suggested, unverified" : table.coverage === "reported_fields" ? " reported, DDL unverified" : table.coverage === "partial" ? " known, partial schema" : " supplied"}</summary>${table.coverage === "unprobed" ? `<p class="db-muted">Only the table name is established. ${table.columns.length ? "The role_id field and its link to roles are inferred from the supplied export; the role_permissions probe was refused." : "Column names, types and keys have not been probed."}</p>` : ""}${["partial", "reported_fields"].includes(table.coverage) ? '<p class="db-muted">Field names are supplied or observed in reply excerpts. The full schema, declared types and constraints have not been inspected.</p>' : ""}${sample ? `<p class="db-sample-source">${sample.fidelity === "reported" ? "Visible teammate reply row" : "Visible tool-backed reply row"} · <code>${escape(sample.turn)}</code> · ${escape(sample.source)} · ${escape(sample.model)}. Masked fields remain masked.</p>` : '<p class="db-muted">No reply sample was available for this table. Field types and constraints are supplied claims.</p>'}${table.columns.length ? `<div class="db-table-scroll"><table class="db-columns-table"><thead><tr><th scope="col">Column</th><th scope="col">Supplied type</th><th scope="col">Key / notes</th><th scope="col">Inspected reply sample</th></tr></thead><tbody>${columns}</tbody></table></div>` : ""}</details><details open class="db-relationships"><summary>Relationships / ${relationRows.length}</summary><p class="db-muted">Choose a link to inspect the other table and its linked field. Arrow direction follows the foreign key.</p><div class="db-relation-list">${relationRows.map(({ edge, index }) => `<button type="button" data-db-relation="${index}"><span><code>${escape(edge.from)}.${escape(edge.fromColumn)}</code> → <code>${escape(edge.to)}.${escape(edge.toColumn)}</code></span><small>${escape(edge.certainty)}${edge.from === edge.to ? " / self-reference" : ""}</small></button>`).join("") || '<p class="db-muted">No relationships are supplied for this table.</p>'}</div></details><details class="db-table-evidence"><summary>Evidence turns / ${evidenceIds(table).length}</summary>${evidenceMarkup(table)}</details></article>`;
  }
  function renderEvidence() {
    const visible = db.tables.filter(table => matching.has(table.id));
    $("#database-evidence-view").innerHTML = visible.length ? visible.map(table => `<article class="db-evidence-table"><div class="db-table-heading"><h3>${escape(table.name)}</h3><button type="button" data-db-inspect="${escape(table.id)}">Inspect table ↗</button></div><p class="db-muted">${escape(tableStatus(table))} · ${escape(coverageLabel(table))}</p>${evidenceMarkup(table)}</article>`).join("") : '<p class="db-muted">No tables match these filters.</p>';
  }
  function openTableDetails() {
    $("#table-detail-home").append(inspector);
    inspector.hidden = false;
    if (!tableDialog.open) tableDialog.showModal();
    tableDialog.scrollTop = 0;
    document.documentElement.classList.add("table-detail-open");
  }
  function selectTable(id, column = null, inspect = true) {
    selected = id;
    selectedColumn = column;
    $("#database-table").value = selected;
    updateDiagram();
    renderInspector();
    if (inspect) openTableDetails();
  }
  function setMode(next) {
    mode = next;
    document.querySelectorAll("[data-db-view]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.dbView === mode)));
    $("#database-map-view").hidden = mode !== "map";
    $("#database-evidence-view").hidden = mode !== "evidence";
    if (mode === "evidence") renderEvidence();
  }
  function filter() {
    const category = $("#database-category").value;
    const query = $("#database-search").value.trim().toLowerCase();
    matching = new Set(db.tables.filter(table => {
      const inCategory = !category || (category === "unprobed" ? table.coverage === "unprobed" : table.category === category);
      const evidence = evidenceIds(table).map(id => registry.get(id).join(" ")).join(" ");
      const haystack = `${JSON.stringify(table)} ${evidence}`.toLowerCase();
      return inCategory && (!query || haystack.includes(query));
    }).map(table => table.id));
    $("#database-filter-status").textContent = `${matching.size} of ${tables.size} tables match${matching.size ? "; matching tables are highlighted on the map" : ""}.`;
    updateDiagram();
    if (mode === "evidence") renderEvidence();
  }
  $("#database-search").addEventListener("input", filter);
  $("#database-category").addEventListener("change", filter);
  $("#database-table").addEventListener("change", () => selectTable($("#database-table").value));
  document.addEventListener("click", event => {
    const open = event.target.closest("[data-open-database]");
    if (open) {
      if (tableDialog.open) tableDialog.close();
      if ($("#evidence-dialog").open) $("#evidence-dialog").close();
      dialog.append(workspace);
      dialog.showModal();
      document.documentElement.classList.add("database-open");
      if (window.innerWidth <= 560) focusSelected();
      return;
    }
    const node = event.target.closest(".db-node");
    if (node) { selectTable(node.dataset.table); return; }
    const relation = event.target.closest("[data-db-relation]");
    if (relation) {
      const edge = db.relationships[Number(relation.dataset.dbRelation)];
      const toTarget = edge.from === selected;
      selectTable(toTarget ? edge.to : edge.from, toTarget ? edge.toColumn : edge.fromColumn);
      return;
    }
    const inspect = event.target.closest("[data-db-inspect]");
    if (inspect) { selectTable(inspect.dataset.dbInspect); setMode("map"); return; }
    const view = event.target.closest("[data-db-view]");
    if (view) setMode(view.dataset.dbView);
  });
  svg.addEventListener("keydown", event => {
    const node = event.target.closest(".db-node");
    if (node && ["Enter", " "].includes(event.key)) { event.preventDefault(); selectTable(node.dataset.table); }
  });
  $("#close-database").addEventListener("click", () => dialog.close());
  $("#close-table-detail").addEventListener("click", () => tableDialog.close());
  tableDialog.addEventListener("close", () => { inspector.hidden = true; inspectorHome.append(inspector); document.documentElement.classList.remove("table-detail-open"); });
  dialog.addEventListener("close", () => { home.append(workspace); document.documentElement.classList.remove("database-open"); });
  filter();
  selectTable(selected, null, false);
  updateTransform();
  if (window.innerWidth <= 560) focusSelected();
})();
