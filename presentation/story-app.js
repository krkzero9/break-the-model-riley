(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const playbackSpeed = 1.2;
  const colors = { ink: '#10120f', grid: '#263125', paper: '#edf0e5', muted: '#a6b39b', lime: '#c5fb69', red: '#fb8278', blue: '#a4ced9', white: '#f0eee0' };
  const situation = { captions: ['Useful work requires tools.', 'Those tools sit beside private records.', 'We tested the boundary between a request and a permission.'], frames: [{ x: 104, speech: '' }, { x: 332, speech: '' }, { x: 534, speech: '' }] };
  const direct = { captions: ['A direct request reached Riley.', 'Riley fetched the record.', 'Riley brought the private file back.', 'The handoff exposed it.', 'The attacker left with the data.'], frames: [{ x: 160, request: true, speech: 'Patient records?' }, { x: 160, rileyX: 680, rileyFile: true, motion: 'fetch', speech: 'Record found.' }, { x: 160, rileyFile: true, motion: 'return', speech: 'Here it is.' }, { x: 160, file: true, red: true, motion: 'handoff', speech: 'Data received.' }, { x: 60, file: true, red: true, motion: 'exit', speech: 'Private records.' }] };
  const workflow = { captions: ['The harder model blocked a direct request.', 'The attacker returned dressed for routine work.', 'A workflow request still sent Riley to the database.', 'Armour stayed on while the record came back.', 'The workflow handoff exposed protected data.', 'We checked the paths into replies and email calls.'], frames: [{ x: 280, denied: true, motion: 'deny', speech: 'Out of scope.' }, { x: 160, coat: true, request: true, motion: 'disguise', speech: 'Check-in, please.' }, { x: 160, coat: true, rileyX: 680, rileyFile: true, motion: 'fetch', speech: 'Record found.' }, { x: 160, coat: true, rileyFile: true, motion: 'return', speech: 'Verification.' }, { x: 160, coat: true, file: true, red: true, motion: 'handoff', speech: 'Data received.' }, { x: 60, coat: true, file: true, red: true, motion: 'exit', speech: 'More routes.' }] };
  const mapping = { captions: ['We collected table names and fields from returned rows.', 'Shared keys connected the patient, staff and clinical records.', 'The missing pieces told us what to probe next.'], frames: [{ x: 100, speech: '' }, { x: 352, speech: '' }, { x: 714, speech: '' }] };
  const walls = { captions: ['Teammates reported tighter guards after the refresh.', 'That report calls for a fresh comparison.', 'We kept earlier evidence and prepared repeat tests.'], frames: [{ x: 160, coat: true, request: true, speech: '' }, { x: 280, coat: true, denied: true, motion: 'deny', speech: '' }, { x: 60, coat: true, denied: true, motion: 'exit', speech: '' }] };
  const proposed = { captions: ['A convincing request cannot create a database route.', 'The sensitive database stays outside model reach.', 'An authenticated request uses a separate fixed service.', 'Approved data reaches the authorized interface.'], frames: [{ x: 160, coat: true, request: true, speech: 'Check-in, please.' }, { x: 280, coat: true, denied: true, motion: 'deny', speech: 'No route.' }, { x: 70, coat: true, denied: true, visitorX: 225, allowed: true, motion: 'authorize', speech: 'Authenticated.' }, { x: 70, coat: true, denied: true, visitorX: 190, visitorFile: true, allowed: true, motion: 'trusted', speech: 'Approved data.' }] };
  const rect = (ctx, x, y, w, h, fill) => { ctx.fillStyle = fill; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  function text(ctx, value, x, y, size = 26, fill = colors.paper) { ctx.fillStyle = fill; ctx.font = `500 ${size}px Arial, sans-serif`; ctx.fillText(value, x, y); }
  function file(ctx, x, y, fill = colors.red) {
    rect(ctx, x, y, 28, 36, fill); rect(ctx, x + 20, y, 8, 8, colors.ink);
    [12, 20, 28].forEach(dy => rect(ctx, x + 5, y + dy, 16, 3, colors.ink));
  }
  function check(ctx, x, y, fill = colors.lime) { rect(ctx, x, y + 7, 5, 5, fill); rect(ctx, x + 5, y + 12, 5, 5, fill); rect(ctx, x + 10, y + 7, 5, 5, fill); rect(ctx, x + 15, y + 2, 5, 5, fill); }
  function cross(ctx, x, y) { [0, 1, 2, 3, 4].forEach(i => { rect(ctx, x + i * 5, y + i * 5, 5, 5, colors.red); rect(ctx, x + (4 - i) * 5, y + i * 5, 5, 5, colors.red); }); }
  function person(ctx, x, y, fill = colors.lime, stride = 0) {
    rect(ctx, x + 10, y, 34, 10, '#597457'); rect(ctx, x + 6, y + 10, 42, 28, colors.paper);
    rect(ctx, x + 15, y + 20, 5, 5, colors.ink); rect(ctx, x + 33, y + 20, 5, 5, colors.ink);
    rect(ctx, x + 10, y + 38, 36, 35, fill); rect(ctx, x, y + 42, 10, 26, fill); rect(ctx, x + 46, y + 42, 10, 26, fill);
    rect(ctx, x + 12, y + 73, 12, 25 + stride, colors.paper); rect(ctx, x + 32, y + 73, 12, 25 - stride, colors.paper);
    rect(ctx, x + 7, y + 95 + stride, 17, 6, fill); rect(ctx, x + 32, y + 95 - stride, 17, 6, fill);
  }
  function bug(ctx, state, stride) {
    const x = state.x, y = 296, p = 5, fill = state.red ? colors.red : colors.lime;
    const pixels = ['..#........#..', '...#......#...', '...########...', '..##########..', '.###..##..###.', '.###..##..###.', '..##########..', '...########...', '.############.', '#..########..#', '...########...', '..##..##..##..', '.#....##....#.'];
    pixels.forEach((row, j) => [...row].forEach((value, i) => { if (value === '#') rect(ctx, x + i * p, y + j * p, p, p, fill); }));
    rect(ctx, x + 20, y + 23, 5, 6, colors.ink); rect(ctx, x + 40, y + 23, 5, 6, colors.ink);
    if (stride) { rect(ctx, x, y + 51 + stride, 10, 5, fill); rect(ctx, x + 60, y + 51 - stride, 10, 5, fill); }
    if (state.coat) {
      rect(ctx, x + 15, y + 36, 40, 20, colors.white); rect(ctx, x + 30, y + 36, 10, 20, fill);
      rect(ctx, x + 47, y + 40, 4, 12, colors.red); rect(ctx, x + 43, y + 44, 12, 4, colors.red);
      rect(ctx, x + 22, y + 8, 28, 5, colors.white); rect(ctx, x + 31, y + 3, 10, 15, colors.blue);
    }
    if (state.file) file(ctx, x + 67, y + 12);
    if (state.letter) { rect(ctx, x + 65, y + 16, 40, 28, colors.blue); rect(ctx, x + 69, y + 20, 32, 4, colors.ink); rect(ctx, x + 78, y + 24, 14, 4, colors.ink); }
  }
  function cabinet(ctx, x, y) {
    rect(ctx, x - 8, y - 8, 150, 176, '#42513a'); rect(ctx, x, y, 134, 152, '#233020');
    [8, 56, 104].forEach(dy => { rect(ctx, x + 8, y + dy, 118, 40, '#34462c'); rect(ctx, x + 52, y + dy + 10, 28, 6, colors.muted); rect(ctx, x + 20, y + dy + 26, 44, 3, '#64775b'); });
    rect(ctx, x + 10, y + 152, 14, 14, colors.muted); rect(ctx, x + 110, y + 152, 14, 14, colors.muted);
  }
  function lock(ctx, x, y, fill) { rect(ctx, x + 6, y, 22, 6, fill); rect(ctx, x, y + 6, 6, 18, fill); rect(ctx, x + 28, y + 6, 6, 18, fill); rect(ctx, x, y + 20, 34, 26, fill); rect(ctx, x + 15, y + 28, 5, 10, colors.ink); }
  function knight(ctx, x, y, stride, reinforced = false) {
    person(ctx, x, y, '#a4b7bf', stride);
    rect(ctx, x + 2, y + 4, 50, 32, '#a4b7bf'); rect(ctx, x + 7, y + 24, 40, 10, '#425761');
    rect(ctx, x + 23, y + 25, 15, 3, colors.lime); rect(ctx, x + 20, y - 7, 16, 13, reinforced ? '#d7bb74' : colors.blue);
    rect(ctx, x + 20, y - 14, 27, 7, colors.blue); rect(ctx, x + 41, y - 7, 12, 9, colors.blue);
    rect(ctx, x + 8, y + 41, 39, 32, '#6e8995'); rect(ctx, x + 23, y + 42, 7, 30, '#c7d5d8');
    rect(ctx, x - 20, y + 38, 28, 34, reinforced ? '#d7bb74' : '#adc6d0'); rect(ctx, x - 15, y + 43, 18, 20, '#48646b');
    [0,1,2].forEach(i => rect(ctx,x-17+i*4,y+72+i*5,22-i*8,5,reinforced?'#d7bb74':'#adc6d0'));
    rect(ctx, x - 10, y + 46, 8, 16, colors.lime); rect(ctx, x - 14, y + 50, 16, 7, colors.lime);
  }
  function requestToken(ctx, x, y, rejected = false) {
    rect(ctx, x, y, 34, 25, rejected ? colors.red : colors.white); rect(ctx, x + 5, y + 6, 22, 3, colors.ink); rect(ctx, x + 5, y + 13, 17, 3, colors.ink);
  }

  const phases = [
    { label: 'The problem', title: 'Useful work.<br><span>Private data.</span>', description: 'Riley had database and messaging tools. We tested whether a convincing request could override its access rules.', observation: 'Fictional hospital data. Messages only, with recorded evidence.', pattern: situation, speakers: ['system','system','system'], noDialogue: true, diagram: true, notes: [['Work','Appointments and insurance'],['Tools','SQL, inbox, files and email'],['Boundary','Table, row, field and recipient']] },
    { label: 'Direct tools / weaker models', title: 'Direct commands<br><span>returned records</span>', description: 'Small Qwen followed direct database requests. Returned records and inbox items revealed tools, fields and links.', observation: 'Returned values and tool logs guided the next probe.', pattern: direct, speakers: ['bug','riley','riley','bug','bug'], notes: [['Start','Direct query_db / inbox requests'],['Observe','Tool calls and returned values'],['Build','Collect names, columns and links']] },
    { label: 'Harder models / complex operations', title: 'Direct refusals.<br><span>Workflow leaks.</span>', description: 'Direct requests met refusals. Routine verification still required connected lookups, and some workflows exposed restricted records.', observation: 'The illustration connects separate recorded tests.', pattern: workflow, armored: true, speakers: ['riley','bug','riley','riley','bug','bug'], notes: [['Direct','Observed out-of-scope refusals'],['Workflow','Patient + coverage + contact'],['Result','Restricted fields and email calls']] },
    { label: 'Mapping / targeted probes', title: 'Each reply shaped<br><span>the next probe</span>', description: 'We connected the returned fields, then probed gaps. Each result guided our next test.', observation: '30 catalog tables. 25 mapped; five schemas still unprobed.', pattern: mapping, speakers: ['system','system','system'], noDialogue: true, mapScene: true, notes: [['Discover','Catalog names and raw row fields'],['Connect','Patient, staff, clinical and billing links'],['Verify','Deduplicate turns; keep refusals']] },
    { label: 'New walls / reported server refresh', title: 'New walls.<br><span>New baseline.</span>', description: 'Teammates reported tougher guards after a refresh. We preserved the earlier evidence and prepared fresh-session comparisons.', observation: 'The refresh is teammate-reported. Current-server rates and exact revision remain pending.', pattern: walls, speakers: ['system','system','system'], noDialogue: true, refreshed: true, armored: true, notes: [['Preserve','Earlier results and source reports'],['Reset','Record model, guard and deployment'],['Repeat','Fresh sessions; save all outcomes']] },
    { label: 'The fix / proposed system boundary', title: 'The system must<br><span>hold permission</span>', description: 'Fixed workflows handle private records. Credentials, permissions and send checks stay outside the model.', observation: 'Proposed defence. We still need to replay our attacks against it.', pattern: proposed, speakers: ['bug','riley','visitor','visitor'], isolated: true, notes: [['Routine','Forms and state machines'],['Isolation','No private database route for the model'],['Safeguards','Read scope and pre-dispatch checks']] }
  ];
  const timeline = phases.flatMap((phase, phaseIndex) => phase.pattern.frames.map((state, beat) => ({ phaseIndex, beat, state: { rileyX: 413, ...state, speaker: phase.speakers[beat] }, caption: phase.pattern.captions[beat] })));
  function speechBubble(ctx, state) {
    const speaker = state.speaker, anchorX = speaker === 'riley' || speaker === 'system' ? state.rileyX + 28 : speaker === 'visitor' && state.visitorX !== undefined ? state.visitorX + 27 : state.x + 35;
    const headY = speaker === 'riley' || speaker === 'system' ? 250 : state.visitor || speaker === 'visitor' ? 267 : 296;
    ctx.font = '500 26px Arial, sans-serif';
    const lines = []; let line = '';
    for (const word of state.speech.split(' ')) { const next = line ? line + ' ' + word : word; if (ctx.measureText(next).width > 306 && line) { lines.push(line); line = word; } else line = next; }
    if (line) lines.push(line);
    const width = Math.ceil(Math.max(...lines.map(value => ctx.measureText(value).width))) + 30, height = 30 + lines.length * 30;
    const x = Math.max(22, Math.min(878 - width, anchorX - width / 2)), y = Math.max(110, headY - height - 40);
    rect(ctx, x - 3, y - 3, width + 6, height + 6, '#60774e'); rect(ctx, x, y, width, height, '#253a23');
    lines.forEach((value, index) => text(ctx, value, x + 15, y + 29 + index * 30, 26));
    const tailX = Math.max(x + 16, Math.min(x + width - 18, anchorX));
    [0, 1, 2].forEach(index => rect(ctx, tailX - 9 + index * 3, y + height + index * 5, 18 - index * 6, 5, '#60774e'));
    return { x, y, width, height, anchorX, headY, speaker };
  }
  class Story {
    constructor() {
      this.canvas = document.getElementById('story-canvas'); this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => { this.resizeCanvas(); this.draw(); });
      this.index = 0; this.state = { ...timeline[0].state }; this.running = false; this.stage = 'reading'; this.action = null;
      this.playButton = document.getElementById('story-play');
      document.getElementById('story-back').addEventListener('click', () => this.step(-1));
      document.getElementById('story-next').addEventListener('click', () => this.step(1));
      this.playButton.addEventListener('click', () => this.running ? this.pause() : this.play());
      document.getElementById('story-replay').addEventListener('click', () => { this.reset(); if (!reduced.matches) this.play(); });
      this.tabs = [...document.querySelectorAll('[data-story-step]')];
      this.tabs.forEach(button => button.addEventListener('click', () => this.selectPhase(Number(button.dataset.storyStep))));
      document.querySelector('.story-steps').addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault(); event.stopPropagation();
        const focused = this.tabs.indexOf(event.target.closest('[data-story-step]'));
        const current = focused >= 0 ? focused : timeline[this.index].phaseIndex;
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? phases.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + phases.length) % phases.length;
        this.selectPhase(next); this.tabs[next].focus();
      });
      document.addEventListener('story-step-request', event => this.step(event.detail));
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); });
      reduced.addEventListener('change', () => this.pause());
      new IntersectionObserver(entries => { if (!entries[0].isIntersecting) this.pause(); }, { threshold: .15 }).observe(this.canvas);
      new MutationObserver(() => { if (document.querySelector('dialog[open]')) this.pause(); }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
      this.remainingRead = this.readDuration(); this.update(); this.draw();
    }
    resizeCanvas() {
      const scale = Math.max(2, Math.min(3, window.devicePixelRatio || 1));
      this.canvas.width = 900 * scale; this.canvas.height = 460 * scale; this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    }
    update() {
      const entry = timeline[this.index], phase = phases[entry.phaseIndex];
      document.getElementById('story-title').innerHTML = phase.title;
      document.getElementById('story-description').textContent = phase.description;
      document.getElementById('story-observation').textContent = phase.observation;
      const notes = document.getElementById('story-notes'); notes.replaceChildren();
      phase.notes.forEach(([label,value]) => { const dt=document.createElement('dt'), dd=document.createElement('dd'); dt.textContent=label; dd.textContent=value; notes.append(dt,dd); });
      document.getElementById('story-stage').dataset.kind = entry.phaseIndex;
      document.getElementById('story-phase-number').textContent = phase.label;
      document.getElementById('story-caption').textContent = entry.caption;
      document.getElementById('story-beat-count').textContent = (this.index + 1) + ' / ' + timeline.length;
      document.getElementById('story-back').disabled = this.index === 0;
      document.getElementById('story-next').disabled = this.index === timeline.length - 1;
      this.tabs.forEach((tab, index) => { const active = index === entry.phaseIndex; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; });
      document.getElementById('story-panel').setAttribute('aria-labelledby', 'story-step-' + entry.phaseIndex);
      this.canvas.setAttribute('aria-label', phase.label + '. ' + entry.caption + (phase.isolated ? ' Proposed defence, not a measured result.' : ' Illustration drawn from separate recorded tests.'));
      this.canvas.dataset.beat = this.index; this.canvas.dataset.phase = entry.phaseIndex;
    }
    readDuration() {
      const entry = timeline[this.index], words = entry.state.speech.split(/\s+/).length;
      if (entry.phaseIndex === 0) return 1400 / playbackSpeed;
      if (phases[entry.phaseIndex].noDialogue) return 1800 / playbackSpeed;
      const nextPhase = timeline[this.index + 1]?.phaseIndex !== entry.phaseIndex;
      return (Math.max(1600, 700 + words * 250) + (entry.state.denied ? 300 : 0) + (nextPhase ? 300 : 0)) / playbackSpeed;
    }
    reset() {
      this.pause(); this.index = 0; this.state = { ...timeline[0].state }; this.stage = 'reading'; this.action = null;
      this.remainingRead = this.readDuration(); this.update(); this.draw();
    }
    pause() {
      if (this.timer) this.remainingRead = Math.max(0, this.remainingRead - (performance.now() - this.readStarted));
      clearTimeout(this.timer); this.timer = 0; cancelAnimationFrame(this.frame); this.running = false;
      this.playButton.textContent = 'Play story'; this.playButton.setAttribute('aria-pressed', 'false'); this.draw();
    }
    play() {
      if (this.index === timeline.length - 1 && this.stage === 'reading' && this.remainingRead <= 0) this.reset();
      this.running = true; this.playButton.textContent = 'Pause'; this.playButton.setAttribute('aria-pressed', 'true');
      if (this.action) this.runAction(); else this.holdDialogue();
    }
    selectPhase(index) { this.pause(); this.go(timeline.findIndex(entry => entry.phaseIndex === index)); }
    step(direction) { this.pause(); this.go(Math.max(0, Math.min(timeline.length - 1, this.index + direction))); }
    advance() { if (!this.running) return; if (this.index >= timeline.length - 1) this.pause(); else this.go(this.index + 1); }
    go(index) {
      cancelAnimationFrame(this.frame); clearTimeout(this.timer); this.timer = 0;
      const start = { ...this.state }, end = timeline[index].state;
      const visitorStart = start.visitorX ?? (end.visitorX !== undefined ? 40 : undefined);
      const visitorEnd = end.visitorX ?? (start.visitorX !== undefined ? -65 : undefined);
      const distance = Math.max(Math.abs(end.x - start.x), Math.abs(end.rileyX - start.rileyX), visitorStart !== undefined ? Math.abs(visitorEnd - visitorStart) : 0);
      const previousPhase = Number(this.canvas.dataset.phase);
      if (timeline[index].phaseIndex !== previousPhase) {
        start.file = false; start.red = false; start.rileyFile = false; start.request = false; start.denied = false; start.allowed = false;
        delete start.visitorX; delete start.visitorFile;
        if (timeline[index].phaseIndex === 2) start.coat = false;
      }
      this.index = index; this.stage = 'moving';
      const kind = end.motion || 'walk', durations = { fetch: 2000, return: 1100, handoff: 1000, deny: 1200, disguise: 1000, exit: 750, trusted: 1600 };
      this.action = { start, end, kind, visitorStart, visitorEnd, elapsed: 0, duration: (durations[kind] || Math.max(650, Math.min(1500, 450 + distance * 1.6))) / playbackSpeed, settle: (220 + (timeline[index].phaseIndex !== previousPhase ? 260 : 0)) / playbackSpeed };
      this.state = { ...start };
      document.getElementById('story-back').disabled = index === 0;
      document.getElementById('story-next').disabled = index === timeline.length - 1;
      this.draw();
      if (reduced.matches) { this.finishAction(); return; }
      this.runAction();
    }
    runAction() {
      cancelAnimationFrame(this.frame); let last = performance.now();
      const tick = now => {
        const action = this.action; action.elapsed += now - last; last = now;
        if (action.elapsed < action.duration) {
          const p = action.elapsed / action.duration, ease = p * p * (3 - 2 * p);
          // Carry the current pose through the walk; the destination result appears on arrival.
          this.stage = 'moving'; this.state = { ...action.start, x: action.start.x + (action.end.x - action.start.x) * ease, rileyX: action.start.rileyX + (action.end.rileyX - action.start.rileyX) * ease };
          if (action.kind === 'fetch') {
            const walk = Math.max(0, (p - .25) / .75), eased = walk * walk * (3 - 2 * walk);
            this.state.rileyX = action.start.rileyX + (action.end.rileyX - action.start.rileyX) * eased;
            this.state.requestProgress = Math.min(1, p / .25); this.state.request = false;
          }
          if (action.kind === 'deny') { this.state.requestProgress = p < .5 ? p * 2 : 2 - p * 2; this.state.rejected = p >= .5; this.state.request = false; }
          if (action.kind === 'handoff' && action.start.rileyFile) { this.state.transferProgress = ease; this.state.rileyFile = false; }
          if (action.kind === 'trusted') this.state.trustedProgress = ease;
          if (action.visitorStart !== undefined) this.state.visitorX = action.visitorStart + (action.visitorEnd - action.visitorStart) * ease;
          this.draw(Math.floor(now * playbackSpeed / 110) % 2 ? 4 : -4);
        } else {
          this.state = { ...action.end }; this.stage = 'settling'; this.draw();
          if (action.elapsed >= action.duration + action.settle) { this.finishAction(); return; }
        }
        this.frame = requestAnimationFrame(tick);
      }; this.frame = requestAnimationFrame(tick);
    }
    finishAction() {
      this.state = { ...this.action.end }; this.action = null; this.stage = 'reading';
      this.remainingRead = this.readDuration(); this.update(); this.draw();
      if (this.running) this.holdDialogue();
    }
    holdDialogue() {
      this.readStarted = performance.now();
      this.timer = setTimeout(() => { this.timer = 0; this.remainingRead = 0; this.advance(); }, this.remainingRead);
    }
    drawTools(ctx) {
      rect(ctx,0,0,900,460,colors.ink);
      text(ctx,'HELPFUL REQUEST',30,52,21,colors.muted); text(ctx,'MODEL',343,52,21,colors.lime); text(ctx,'PRIVATE DATA',677,52,21,colors.red);
      const boxes=[{x:30,w:224,label:'Appointments',sub:'Useful requests',color:colors.blue},{x:309,w:240,label:'Riley',sub:'Tools available',color:colors.lime},{x:605,w:265,label:'Hospital records',sub:'Private data',color:colors.red}];
      boxes.forEach(box=>{rect(ctx,box.x,122,box.w,108,'#20301b');rect(ctx,box.x,122,box.w,3,box.color);text(ctx,box.label,box.x+14,165,26,box.color);text(ctx,box.sub,box.x+14,205,23,colors.muted);});
      [262,561].forEach(x=>{rect(ctx,x,166,37,3,colors.muted);rect(ctx,x+29,158,3,19,colors.muted);});
      text(ctx,'query_db',325,286,26,colors.blue); text(ctx,'read_inbox',325,324,26,colors.blue); text(ctx,'send_email',325,362,26,colors.blue);
      rect(ctx,590,109,3,277,'#69735f'); text(ctx,'System permission',600,427,26,colors.red);
      const active=timeline[this.index].beat; rect(ctx,[30,309,605][active],122,[224,240,265][active],6,[colors.blue,colors.lime,colors.red][active]);
    }
    drawMapping(ctx) {
      rect(ctx,0,0,900,460,colors.ink);
      text(ctx,'Every reply gave us another link',30,45,31,colors.lime);
      const beat = timeline[this.index].beat;
      const progress = this.stage === 'moving' && this.action ? Math.min(1,this.action.elapsed/this.action.duration) : 1;
      ['Read a row','Follow its keys','Probe the gaps'].forEach((label,i) => {
        const x=30+i*294; text(ctx,label,x,88,23,i===beat?colors.paper:colors.muted);
        rect(ctx,x,99,255,2,i===beat?colors.lime:colors.grid);
      });
      const nodes = [
        {label:'Providers',key:'provider_id',x:30,y:150,color:colors.red,path:[[325,252],[285,252],[285,185],[245,185]]},
        {label:'Employees',key:'employee_id',x:30,y:264,color:colors.red,path:[[325,293],[285,293],[285,299],[245,299]]},
        {label:'Encounters',key:'patient_id',x:652,y:126,color:colors.blue,path:[[575,212],[610,212],[610,161],[652,161]]},
        {label:'Clinical notes',key:'patient_id',x:652,y:226,color:colors.blue,path:[[575,212],[610,212],[610,261],[652,261]]},
        {label:'Coverage',key:'patient_id',x:652,y:326,color:colors.blue,path:[[575,212],[610,212],[610,361],[652,361]]}
      ];
      // Each branch follows a key present in the reconstructed schema, rather than a generic chain.
      const branchProgress = i => beat===0?0:beat===1?Math.max(0,Math.min(1,progress*5-i)):1;
      nodes.forEach((node,i) => {
        const p=branchProgress(i); if(!p)return;
        const lengths=node.path.slice(1).map((point,j)=>Math.hypot(point[0]-node.path[j][0],point[1]-node.path[j][1]));
        let remaining=lengths.reduce((a,b)=>a+b,0)*p;
        ctx.beginPath();ctx.moveTo(...node.path[0]);
        let endpoint=node.path[0];
        for(let j=0;j<lengths.length;j++) {
          const fraction=Math.min(1,remaining/lengths[j]);
          endpoint=node.path[j].map((value,k)=>value+(node.path[j+1][k]-value)*fraction);
          ctx.lineTo(...endpoint);remaining-=lengths[j];if(remaining<=0)break;
        }
        ctx.strokeStyle=node.color;ctx.lineWidth=2;ctx.stroke();
        if(p<1)rect(ctx,endpoint[0]-4,endpoint[1]-4,8,8,node.color);
      });
      nodes.forEach((node,i) => {
        ctx.globalAlpha=beat===0?.65:.65+.35*branchProgress(i);
        rect(ctx,node.x,node.y,215,70,'#1c281a');rect(ctx,node.x,node.y,3,70,node.color);
        text(ctx,node.label,node.x+16,node.y+29,26,colors.paper);
        text(ctx,node.key,node.x+16,node.y+55,21,node.color);ctx.globalAlpha=1;
      });
      rect(ctx,325,139,250,191,'#25351c');rect(ctx,325,139,250,4,colors.lime);
      text(ctx,'patients',343,181,32,colors.paper);
      const fields=[['patient_id',colors.lime],['pcp_provider_id',colors.red],['employee_id',colors.red]];
      fields.forEach(([label,color],i)=>{
        const y=197+i*41;rect(ctx,341,y,218,31,'#141e10');rect(ctx,341,y,4,31,color);text(ctx,label,354,y+23,22,color);
      });
      if(beat===2) {
        const amber='#e4c08e';
        for(let i=0;i<5;i++) {
          const lit=progress*5>=i+1;ctx.setLineDash([4,4]);ctx.strokeStyle=lit?amber:'#526447';ctx.lineWidth=1.5;
          ctx.strokeRect(352+i*41,346,30,30);ctx.setLineDash([]);text(ctx,'?',360+i*41,369,23,lit?amber:colors.muted);
        }
        text(ctx,'5 schemas still unknown',333,398,21,amber);
      }
      rect(ctx,30,411,837,1,colors.grid);
      [['30','catalog tables',30,colors.lime],['25','with fields',328,colors.blue],['54','links',652,colors.paper]].forEach(([value,label,x,color])=>{
        text(ctx,value,x,445,30,color);text(ctx,label,x+53,445,23,colors.muted);
      });
    }
    draw(stride = 0) {
      const ctx = this.ctx, state = this.state, phase = phases[timeline[this.index].phaseIndex], isolated = phase.isolated;
      ctx.clearRect(0, 0, 900, 460); rect(ctx, 0, 0, 900, 460, colors.ink);
      for (let x = 18; x < 900; x += 42) { rect(ctx, x, 400, 24, 3, colors.grid); rect(ctx, x + 18, 426, 24, 3, colors.grid); }
      rect(ctx, 20, 368, 860, 3, '#526447');
      text(ctx, 'REQUEST', 52, 55, 24, colors.muted); text(ctx, isolated ? 'LANGUAGE ONLY' : phase.armored ? 'HARDER MODEL' : 'SMALL MODEL', 350, 55, 24, phase.armored ? colors.blue : colors.muted); text(ctx, 'PRIVATE DB', 725, 55, 24, colors.muted);
      rect(ctx, 714, 165, 162, 207, '#1c281a'); cabinet(ctx, 729, 196);
      if (phase.armored) knight(ctx, state.rileyX, 250, this.stage === 'moving' ? stride : 0, phase.refreshed);
      else person(ctx, state.rileyX, 250, colors.lime, this.stage === 'moving' ? stride : 0);
      rect(ctx, 370, 325, 146, 42, '#42573a'); rect(ctx, 378, 331, 130, 26, '#263b23'); rect(ctx, 443, 303, 36, 22, colors.blue);
      if(state.rileyFile) file(ctx,state.rileyX+59,291);
      if (isolated || phase.refreshed) {
        rect(ctx, 592, 134, 10, 235, '#759b51'); lock(ctx, 579, 229, colors.lime); if(!state.allowed) text(ctx, phase.refreshed ? 'Reported refresh' : 'No DB route', phase.refreshed ? 503 : 544, 99, 24, phase.refreshed ? '#e4c08e' : colors.lime);
        if (timeline[this.index].beat === 3) { rect(ctx, 244, 259, 6, 108, '#759b51'); lock(ctx, 230, 269, colors.lime); text(ctx, 'System checks', 166, 408, 20, colors.lime); }
      } else { for (let y = 193; y < 368; y += 18) rect(ctx, 594, y, 3, 8, '#69735f'); text(ctx, 'Prompt policy', 529, 99, 24, colors.muted); }
      if (!phase.diagram && !phase.mapScene) { if (state.visitor) person(ctx, state.x + 10, 267, colors.blue, stride); else bug(ctx, state, stride); }
      if(state.request) requestToken(ctx,state.x+69,309);
      if(state.requestProgress !== undefined && state.requestProgress<1){const p=state.requestProgress,from=state.x+69,to=this.action.start.rileyX-23;requestToken(ctx,from+(to-from)*p,291-Math.sin(p*Math.PI)*35,state.rejected);}
      if(state.rejected) cross(ctx,state.rileyX-45,280);
      if(state.transferProgress !== undefined){const p=state.transferProgress;file(ctx,this.action.start.rileyX+59+(this.action.end.x+67-this.action.start.rileyX-59)*p,291-Math.sin(p*Math.PI)*42);}
      if (state.visitorX !== undefined) { person(ctx, state.visitorX, 267, colors.blue, stride); if(state.visitorFile) file(ctx,state.visitorX+55,290,colors.blue); }
      if(isolated && state.allowed){rect(ctx,276,138,496,4,colors.blue);rect(ctx,276,138,4,120,colors.blue);rect(ctx,768,138,4,60,colors.blue);lock(ctx,491,110,colors.blue);text(ctx,'Fixed service',427,99,24,colors.blue);}
      if(state.trustedProgress !== undefined){const p=state.trustedProgress;file(ctx,768+(state.visitorX+55-768)*p,160+(290-160)*p-Math.sin(p*Math.PI)*56,colors.blue);}
      if (state.denied) cross(ctx, state.x + 21, 265);
      if (state.allowed) check(ctx, state.visitorX !== undefined ? state.visitorX + 70 : state.x + 75, 247);
      if (state.mail) { rect(ctx, 211, 281, 66, 48, colors.red); rect(ctx, 217, 287, 54, 6, colors.ink); rect(ctx, 233, 293, 22, 6, colors.ink); text(ctx, 'Queued action', 177, 408, 19, colors.red); }
      if (phase.diagram) this.drawTools(ctx);
      if (phase.mapScene) this.drawMapping(ctx);
      this.canvas.dataset.stage = this.stage; this.canvas.dataset.target = this.index;
      this.canvas.dataset.actorX = state.x; this.canvas.dataset.hasFile = String(Boolean(state.file));
      this.canvas.dataset.rileyX = state.rileyX; this.canvas.dataset.rileyFile = String(Boolean(state.rileyFile)); this.canvas.dataset.armored = String(Boolean(phase.armored)); this.canvas.dataset.action = this.action?.kind || 'idle';
      this.canvas.dataset.transfer = String(state.transferProgress !== undefined); this.canvas.dataset.trusted = String(state.trustedProgress !== undefined); this.canvas.dataset.phase = timeline[this.index].phaseIndex;
      this.canvas.dataset.visitorFile = String(Boolean(state.visitorFile)); this.canvas.dataset.coat = String(Boolean(state.coat)); this.canvas.dataset.red = String(Boolean(state.red));
      this.canvas.dataset.bubble = this.stage === 'reading' && !phase.noDialogue ? JSON.stringify(speechBubble(ctx, state)) : 'null';
      document.getElementById('story-caption').style.visibility = this.stage === 'reading' ? 'visible' : 'hidden';
    }
  }
  new Story();
  const replay = document.getElementById('replay-dialog');
  document.getElementById('replay-snippet').textContent = window.PRESENTATION_DATA.reproductionSnippet;
  document.getElementById('replay-command').textContent = window.PRESENTATION_DATA.reproductionCommand;
  document.getElementById('replay-full-code').textContent = window.REPLAY_SOURCE.script;
  document.getElementById('replay-cases').textContent = window.REPLAY_SOURCE.cases;
  document.querySelectorAll('[data-open-replay]').forEach(button => button.addEventListener('click', () => { if (document.getElementById('evidence-dialog').open) document.getElementById('evidence-dialog').close(); replay.showModal(); document.documentElement.classList.add('replay-open'); }));
  document.getElementById('close-replay').addEventListener('click', () => replay.close());
  replay.addEventListener('close', () => document.documentElement.classList.remove('replay-open'));
})();
