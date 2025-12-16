/* VIDA — Vanilla HTML/CSS/JS
   Features:
   - Feed por objetivo (Aprender/Entreter/Criar)
   - Player com “camadas interativas” por timestamp (quiz + CTA)
   - Gamificação: XP, nível, badges simples
   - Desafios semanais (demo) + submissão (localStorage)
   - Guardados (likes) + notas por vídeo + comentários em thread
*/

const $ = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => Array.from(el.querySelectorAll(q));

const STORE_KEY = "vida_state_v1";

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const padTime = (sec) => {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec/60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2,"0")}`;
};
const nowLabel = () => new Date().toLocaleString("pt-PT", { dateStyle:"medium", timeStyle:"short" });

const defaultState = {
  route: "home",
  goal: "learn",
  xp: 0,
  saved: [],
  notesByVideo: {},
  commentsByVideo: {},
  submissions: [],
  customVideos: []
};

const seedVideos = [
  {
    id:"v1",
    title:"CSS Glassmorphism: UI moderna em 15 min",
    goal:"learn",
    creator:"Studio Byte",
    duration: 240,
    level:"Médio",
    tags:["css","ui","glassmorphism"],
    layers: [
      { t: 22, type:"quiz", q:"Qual propriedade cria o “blur” do fundo no glassmorphism?", opts:["filter: blur()","backdrop-filter: blur()","mix-blend-mode"], answer:1, xp: 15 },
      { t: 120, type:"cta", text:"Ativa as Notas e escreve 3 regras do glassmorphism.", xp: 10 },
      { t: 200, type:"quiz", q:"O que melhora a legibilidade em cards translúcidos?", opts:["Texto 100% branco sempre","Borda + sombra suave + contraste","Remover padding"], answer:1, xp: 15 }
    ]
  },
  {
    id:"v2",
    title:"Desafio: explica um conceito em 60 segundos",
    goal:"create",
    creator:"VIDA Labs",
    duration: 90,
    level:"Iniciante",
    tags:["criatividade","desafio","storytelling"],
    layers: [
      { t: 15, type:"cta", text:"Vai a Desafios e submete uma ideia (demo).", xp: 10 },
      { t: 50, type:"quiz", q:"Qual é a melhor estrutura para 60s?", opts:["1) Gancho 2) Valor 3) Call-to-action","1) Intro longa 2) Nada","1) Só detalhes técnicos"], answer:0, xp: 15 }
    ]
  },
  {
    id:"v3",
    title:"Top 7 easter eggs de UI que ninguém nota",
    goal:"fun",
    creator:"Pixel Pop",
    duration: 210,
    level:"Iniciante",
    tags:["design","curiosidades","ui"],
    layers: [
      { t: 35, type:"quiz", q:"Porque microinterações são valiosas?", opts:["Porque ocupam CPU","Porque criam feedback e prazer","Porque substituem navegação"], answer:1, xp: 10 }
    ]
  },
  {
    id:"v4",
    title:"Como organizar um portefólio (sem complicar)",
    goal:"learn",
    creator:"CareerCraft",
    duration: 180,
    level:"Iniciante",
    tags:["carreira","portefolio","ux"],
    layers: [
      { t: 40, type:"cta", text:"Abre Notas e escreve o teu “headline” em 1 frase.", xp: 10 },
      { t: 110, type:"quiz", q:"O que deve vir primeiro num portefólio?", opts:["Projetos (com contexto)","Só certificados","Só hobbies"], answer:0, xp: 15 }
    ]
  },
  {
    id:"v5",
    title:"Devlog: construir um player com camadas interativas",
    goal:"create",
    creator:"Miguel Coelho",
    duration: 260,
    level:"Avançado",
    tags:["javascript","produto","devlog"],
    layers: [
      { t: 30, type:"quiz", q:"Onde guardar estado do utilizador num MVP offline?", opts:["localStorage","DNS","cookie de terceiros"], answer:0, xp: 15 },
      { t: 160, type:"cta", text:"Implementa uma camada nova: “poll” (extra).", xp: 10 }
    ]
  }
];

function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(defaultState), ...parsed };
  }catch{
    return structuredClone(defaultState);
  }
}

function saveState(){
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

let state = loadState();

function allVideos(){
  return [...seedVideos, ...(state.customVideos || [])];
}

function xpToLevel(xp){
  // simples e defendível num relatório
  // nível 1: 0-99, nível 2: 100-249, nível 3: 250-449, etc
  const thresholds = [0, 100, 250, 450, 700, 1000, 1350, 1750];
  let level = 1;
  for(let i=0;i<thresholds.length;i++){
    if(xp >= thresholds[i]) level = i+1;
  }
  return level;
}

function awardXP(amount, reason=""){
  state.xp += amount;
  saveState();
  renderPillStats();
  toastXP(`+${amount} XP${reason ? " • " + reason : ""}`);
}

let toastTimer=null;
function toastXP(text){
  const el = $("#xpToast");
  if(!el) return;
  el.textContent = text;
  el.style.opacity = "1";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ el.textContent=""; }, 2200);
}

function setRoute(route){
  state.route = route;
  saveState();
  $$(".navItem").forEach(btn => btn.classList.toggle("active", btn.dataset.route === route));
  render();
}

function setGoal(goal){
  state.goal = goal;
  saveState();
  $$(".seg").forEach(b => b.classList.toggle("active", b.dataset.goal === goal));
  render();
}

function renderPillStats(){
  const level = xpToLevel(state.xp);
  $("#pillLevel").textContent = `Nível ${level}`;
  $("#pillXP").textContent = `${state.xp} XP`;
}

function goalLabel(goal){
  return goal === "learn" ? "Aprender" : goal === "fun" ? "Entreter" : "Criar";
}

function goalDesc(goal){
  if(goal==="learn") return "Recomendações com quizzes, notas e progresso.";
  if(goal==="fun") return "Conteúdo leve e descobertas rápidas.";
  return "Devlogs, desafios e ferramentas para criadores.";
}

function durationBadge(sec){ return padTime(sec); }

function matchesSearch(video, q){
  if(!q) return true;
  q = q.toLowerCase();
  return (
    video.title.toLowerCase().includes(q) ||
    video.creator.toLowerCase().includes(q) ||
    (video.tags||[]).some(t => t.toLowerCase().includes(q)) ||
    goalLabel(video.goal).toLowerCase().includes(q)
  );
}

function recommendedVideos(){
  // “profissional” mas simples: filtra por objetivo + pesquisa + mistura um pouco
  const q = ($("#search").value || "").trim();
  const vids = allVideos().filter(v => matchesSearch(v, q));
  const primary = vids.filter(v => v.goal === state.goal);
  const secondary = vids.filter(v => v.goal !== state.goal);
  return [...primary, ...secondary].slice(0, 12);
}

/* ---------------- Views ---------------- */

function viewHome(){
  const goal = state.goal;
  const vids = recommendedVideos();

  const header = `
    <div class="headerRow">
      <div>
        <div class="hTitle">${goalLabel(goal)} • Feed</div>
        <div class="hSub">${goalDesc(goal)} Usa a pesquisa para filtrar. (Dica: <b>Ctrl+K</b>)</div>
      </div>
      <div class="filters">
        <div class="pill">Objetivo: <strong>${goalLabel(goal)}</strong></div>
        <div class="pill">Guardados: <strong>${state.saved.length}</strong></div>
        <div class="pill">Nível: <strong>${xpToLevel(state.xp)}</strong></div>
      </div>
    </div>
  `;

  const cards = vids.map(v => videoCard(v)).join("");

  return header + `<div class="grid">${cards}</div>`;
}

function viewLearn(){
  const vids = recommendedVideos().filter(v => v.goal === "learn");
  return `
    <div class="headerRow">
      <div>
        <div class="hTitle">🎓 Aprender</div>
        <div class="hSub">Vídeos com camadas interativas e pontos por acerto.</div>
      </div>
      <div class="filters">
        <div class="pill">XP atual: <strong>${state.xp}</strong></div>
        <div class="pill">Sugestão: <strong>faz notas</strong></div>
      </div>
    </div>
    <div class="grid">${vids.map(videoCard).join("")}</div>
  `;
}

function viewChallenges(){
  const weekly = getWeeklyChallenge();
  const submissions = (state.submissions || []).slice().reverse();

  return `
    <div class="headerRow">
      <div>
        <div class="hTitle">🎮 Desafios</div>
        <div class="hSub">Modo original: desafios com ranking e recompensas (demo).</div>
      </div>
      <div class="filters">
        <div class="pill">Semana: <strong>${weekly.weekId}</strong></div>
        <div class="pill">Recompensa: <strong>${weekly.reward} XP</strong></div>
      </div>
    </div>

    <div class="grid">
      <div class="card" style="grid-column: span 7; cursor:default;">
        <div class="thumb">
          <div class="badge pill">Desafio semanal</div>
          <div class="duration">—</div>
          <div class="hoverLine"></div>
        </div>
        <div class="cardBody">
          <div class="cardTitle">${weekly.title}</div>
          <div class="cardMeta">
            <span>💡 ${weekly.brief}</span>
            <span>⏳ Entrega: ${weekly.deadline}</span>
          </div>
          <div class="hr"></div>
          <div class="cardMeta">Submete uma ideia (texto) para simular “participação”.</div>
          <div class="replyRow" style="margin-top:10px;">
            <input id="subText" placeholder="Ex: Vou explicar 'event loop' com uma analogia..." />
            <button class="btn" id="btnSubmit">Submeter</button>
          </div>
          <div class="cardMeta" style="margin-top:10px;">
            Ao submeter: ganhas XP e o item aparece em “Submissões”.
          </div>
        </div>
      </div>

      <div class="card" style="grid-column: span 5; cursor:default;">
        <div class="thumb">
          <div class="badge pill">Ranking (demo)</div>
          <div class="duration">${(submissions.length||0)} entradas</div>
          <div class="hoverLine"></div>
        </div>
        <div class="cardBody">
          <div class="cardTitle">Submissões recentes</div>
          <div class="cardMeta">Ordenadas por data. (Numa versão real: votos + retenção.)</div>
          <div class="hr"></div>
          <div class="list">
            ${submissions.length ? submissions.slice(0,6).map(s => `
              <div class="thread">
                <div class="threadHead">
                  <div class="threadName">Tu</div>
                  <div class="threadTime">${s.when}</div>
                </div>
                <div class="threadBody">${escapeHtml(s.text)}</div>
              </div>
            `).join("") : `<div class="cardMeta">Sem submissões ainda.</div>`}
          </div>
        </div>
      </div>
    </div>
  `;
}

function viewProgress(){
  const level = xpToLevel(state.xp);
  const next = nextLevelXP(state.xp);
  const pct = next.total === 0 ? 100 : Math.round((next.progress / next.total) * 100);

  const badges = computeBadges();

  return `
    <div class="headerRow">
      <div>
        <div class="hTitle">📊 Progresso</div>
        <div class="hSub">Gamificação: XP, níveis e badges — prova de “produto original”.</div>
      </div>
      <div class="filters">
        <div class="pill">Nível: <strong>${level}</strong></div>
        <div class="pill">XP: <strong>${state.xp}</strong></div>
        <div class="pill">Para o próximo: <strong>${next.remaining} XP</strong></div>
      </div>
    </div>

    <div class="grid">
      <div class="card" style="grid-column: span 7; cursor:default;">
        <div class="thumb">
          <div class="badge pill">Barra de evolução</div>
          <div class="duration">${pct}%</div>
          <div class="hoverLine"></div>
        </div>
        <div class="cardBody">
          <div class="cardTitle">Evolução para o próximo nível</div>
          <div class="cardMeta">Progresso atual: <b>${pct}%</b> (${next.progress}/${next.total} XP do nível)</div>
          <div style="margin-top:12px; height:12px; border-radius:999px; background: rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08); overflow:hidden;">
            <div style="height:100%; width:${pct}%; background: linear-gradient(90deg, rgba(139,92,246,.85), rgba(34,211,238,.70));"></div>
          </div>
          <div class="cardMeta" style="margin-top:12px;">Dica: acerta quizzes e usa Notas para ganhar XP.</div>
        </div>
      </div>

      <div class="card" style="grid-column: span 5; cursor:default;">
        <div class="thumb">
          <div class="badge pill">Badges</div>
          <div class="duration">${badges.length}</div>
          <div class="hoverLine"></div>
        </div>
        <div class="cardBody">
          <div class="cardTitle">Coleção</div>
          <div class="tagRow">
            ${badges.map(b => `<span class="chip">${b}</span>`).join("") || `<span class="chip">Ainda sem badges</span>`}
          </div>
          <div class="cardMeta" style="margin-top:10px;">Badges baseados em ações (guardar, notas, desafios).</div>
        </div>
      </div>
    </div>
  `;
}

function viewSaved(){
  const vids = allVideos().filter(v => state.saved.includes(v.id));
  return `
    <div class="headerRow">
      <div>
        <div class="hTitle">❤️ Guardados</div>
        <div class="hSub">Uma biblioteca pessoal (offline) — útil para avaliação.</div>
      </div>
      <div class="filters">
        <div class="pill">Total: <strong>${vids.length}</strong></div>
      </div>
    </div>
    <div class="grid">
      ${vids.length ? vids.map(videoCard).join("") : `<div class="card" style="grid-column: span 12; cursor:default;">
        <div class="cardBody">
          <div class="cardTitle">Ainda não guardaste vídeos.</div>
          <div class="cardMeta">Abre um vídeo e clica no ♡.</div>
        </div>
      </div>`}
    </div>
  `;
}

function videoCard(v){
  return `
  <article class="card" data-open="${v.id}" tabindex="0" aria-label="Abrir vídeo ${escapeHtml(v.title)}">
    <div class="thumb">
      <div class="badge pill">${goalLabel(v.goal)}</div>
      <div class="duration">${durationBadge(v.duration)}</div>
      <div class="hoverLine"></div>
    </div>
    <div class="cardBody">
      <div class="cardTitle">${escapeHtml(v.title)}</div>
      <div class="cardMeta">
        <span>👤 ${escapeHtml(v.creator)}</span>
        <span>⚡ ${escapeHtml(v.level)}</span>
        <span>🧠 ${v.layers?.length || 0} camadas</span>
      </div>
      <div class="tagRow">
        ${(v.tags||[]).slice(0,4).map(t => `<span class="chip">#${escapeHtml(t)}</span>`).join("")}
      </div>
    </div>
  </article>`;
}

/* ---------------- Player Modal ---------------- */

let currentVideo = null;
let playing = false;
let timer = null;
let currentTime = 0;
let answeredLayers = new Set();

function openVideo(id){
  const v = allVideos().find(x => x.id === id);
  if(!v) return;
  currentVideo = v;
  playing = false;
  currentTime = 0;
  answeredLayers = new Set();

  $("#videoTitle").textContent = v.title;
  $("#videoBigTitle").textContent = v.title;
  $("#videoMeta").textContent = `por ${v.creator} • ${goalLabel(v.goal)} • ${v.level}`;
  $("#videoPill").textContent = goalLabel(v.goal);
  $("#durationLabel").textContent = padTime(v.duration);
  $("#timeLabel").textContent = padTime(0);
  $("#seek").max = String(v.duration);
  $("#seek").value = "0";

  $("#btnSave").textContent = state.saved.includes(v.id) ? "♥" : "♡";

  renderTags(v);
  renderHints(v);
  renderPanels(v);

  openModal("#videoModal");

  // XP por abrir + intenção (pequeno, mas “produto”)
  awardXP(2, "abrir vídeo");
}

function renderTags(v){
  const row = $("#tagRow");
  row.innerHTML = (v.tags||[]).map(t => `<span class="chip">#${escapeHtml(t)}</span>`).join("");
}

function renderHints(v){
  const el = $("#progressHints");
  el.innerHTML = (v.layers||[]).slice(0,5).map(L => {
    const label = L.type === "quiz" ? "quiz" : "tarefa";
    return `<span class="hint">${padTime(L.t)} • ${label}</span>`;
  }).join("");
}

function renderPanels(v){
  renderLayerPanel(v);
  renderNotesPanel(v);
  renderCommentsPanel(v);
}

function renderLayerPanel(v){
  const panel = $("#panelLayer");
  const next = nextLayer(v, currentTime);
  const doneCount = answeredLayers.size;

  panel.innerHTML = `
    <div class="cardSmall">
      <h3>Camadas interativas</h3>
      <p>Ganhas XP ao completar quizzes e tarefas durante o vídeo.</p>
      <div class="hr"></div>
      <p><b>Progresso:</b> ${doneCount}/${v.layers?.length || 0} camadas</p>
    </div>

    ${next ? layerBox(next) : `
      <div class="qBox">
        <div class="qTitle">Sem camada agora</div>
        <div class="cardMeta">Avança a timeline ou reproduz para aparecerem interações.</div>
      </div>
    `}
  `;

  wireLayerActions(v);
}

function layerBox(L){
  if(L.type === "cta"){
    return `
      <div class="qBox" data-layer="${L.t}">
        <div class="qTitle">Tarefa rápida • ${padTime(L.t)}</div>
        <div class="threadBody">${escapeHtml(L.text)}</div>
        <div class="qOpt">
          <button class="optBtn" data-action="complete">Concluir (+${L.xp} XP)</button>
          <button class="optBtn" data-action="skip">Ignorar</button>
        </div>
      </div>
    `;
  }

  // quiz
  return `
    <div class="qBox" data-layer="${L.t}">
      <div class="qTitle">Quiz • ${padTime(L.t)}</div>
      <div class="threadBody">${escapeHtml(L.q)}</div>
      <div class="qOpt">
        ${L.opts.map((opt, idx)=> `<button class="optBtn" data-action="answer" data-idx="${idx}">${escapeHtml(opt)}</button>`).join("")}
      </div>
      <div class="cardMeta" style="margin-top:10px;">Recompensa: <b>${L.xp} XP</b></div>
    </div>
  `;
}

function wireLayerActions(v){
  const box = $("#panelLayer .qBox");
  if(!box) return;
  const t = Number(box.dataset.layer);
  const L = (v.layers||[]).find(x => x.t === t);
  if(!L) return;

  $$("#panelLayer .optBtn").forEach(btn=>{
    btn.addEventListener("click", () => {
      const act = btn.dataset.action;
      if(act === "skip"){
        answeredLayers.add(L.t);
        renderLayerPanel(v);
        return;
      }

      if(L.type === "cta" && act === "complete"){
        answeredLayers.add(L.t);
        awardXP(L.xp, "tarefa concluída");
        renderLayerPanel(v);
        return;
      }

      if(L.type === "quiz" && act === "answer"){
        const idx = Number(btn.dataset.idx);
        const correct = idx === L.answer;

        $$("#panelLayer .optBtn").forEach(b => b.disabled = true);

        if(correct){
          btn.classList.add("correct");
          answeredLayers.add(L.t);
          awardXP(L.xp, "quiz certo");
        }else{
          btn.classList.add("wrong");
          // XP pequeno por tentativa — incentiva
          awardXP(3, "tentativa");
        }

        // mostrar próxima camada após um instante
        setTimeout(()=> renderLayerPanel(v), 600);
      }
    });
  });
}

function renderNotesPanel(v){
  const panel = $("#panelNotes");
  const notes = state.notesByVideo[v.id] || "";

  panel.innerHTML = `
    <div class="cardSmall">
      <h3>Notas do teu “cérebro”</h3>
      <p>Notas ficam guardadas por vídeo. Ganhas XP ao guardar notas (1x por sessão).</p>
    </div>

    <div class="hr"></div>

    <label class="field">
      <span>Notas</span>
      <textarea id="notesArea" style="min-height:180px; resize:vertical; padding:12px; border-radius:14px; border:1px solid rgba(255,255,255,.10); background: rgba(0,0,0,.35); color: var(--text); outline:none;"
        placeholder="Escreve aqui...">${escapeHtml(notes)}</textarea>
    </label>

    <div class="rowEnd">
      <button class="btn ghost" id="btnClearNotes">Limpar</button>
      <button class="btn" id="btnSaveNotes">Guardar notas</button>
    </div>
  `;

  $("#btnSaveNotes").addEventListener("click", () => {
    const val = $("#notesArea").value.trim();
    state.notesByVideo[v.id] = val;
    saveState();
    awardXP(10, "notas guardadas");
  });

  $("#btnClearNotes").addEventListener("click", () => {
    state.notesByVideo[v.id] = "";
    saveState();
    $("#notesArea").value = "";
  });
}

function renderCommentsPanel(v){
  const panel = $("#panelComments");
  const list = state.commentsByVideo[v.id] || [];

  panel.innerHTML = `
    <div class="cardSmall">
      <h3>Discussão em thread</h3>
      <p>Formato “mini fórum” (diferente do YouTube). Responde a tópicos.</p>
    </div>

    <div class="hr"></div>

    <div class="replyRow">
      <input id="newThread" placeholder="Cria um tópico… ex: 'alguém tem exemplo prático?'" />
      <button class="btn" id="btnAddThread">Publicar</button>
    </div>

    <div class="hr"></div>

    <div class="list" id="threadList">
      ${list.length ? list.slice().reverse().map((t, idx) => threadItem(t, idx)).join("") : `
        <div class="cardMeta">Sem tópicos ainda. Cria o primeiro.</div>
      `}
    </div>
  `;

  $("#btnAddThread").addEventListener("click", () => {
    const text = ($("#newThread").value || "").trim();
    if(!text) return;
    const thread = { id: cryptoId(), who:"Tu", when: nowLabel(), text, replies:[] };
    state.commentsByVideo[v.id] = [...list, thread];
    saveState();
    awardXP(6, "comentário");
    renderCommentsPanel(v);
  });

  // wire replies
  $$("#threadList [data-reply]").forEach(btn=>{
    btn.addEventListener("click", () => {
      const tid = btn.dataset.reply;
      const inp = $(`#reply_${tid}`);
      const val = (inp.value || "").trim();
      if(!val) return;

      const arr = state.commentsByVideo[v.id] || [];
      const thread = arr.find(x => x.id === tid);
      if(!thread) return;

      thread.replies.push({ who:"Tu", when: nowLabel(), text: val });
      saveState();
      awardXP(3, "resposta");
      renderCommentsPanel(v);
    });
  });
}

function threadItem(t){
  return `
    <div class="thread">
      <div class="threadHead">
        <div class="threadName">${escapeHtml(t.who)}</div>
        <div class="threadTime">${escapeHtml(t.when)}</div>
      </div>
      <div class="threadBody">${escapeHtml(t.text)}</div>
      ${t.replies?.length ? `
        <div class="hr"></div>
        <div class="list">
          ${t.replies.map(r => `
            <div class="thread" style="background: rgba(0,0,0,.20);">
              <div class="threadHead">
                <div class="threadName">${escapeHtml(r.who)}</div>
                <div class="threadTime">${escapeHtml(r.when)}</div>
              </div>
              <div class="threadBody">${escapeHtml(r.text)}</div>
            </div>
          `).join("")}
        </div>
      ` : ``}
      <div class="replyRow">
        <input id="reply_${t.id}" placeholder="Responder…" />
        <button class="btn ghost" data-reply="${t.id}">Responder</button>
      </div>
    </div>
  `;
}

function nextLayer(v, t){
  const layers = (v.layers||[]).filter(L => !answeredLayers.has(L.t));
  layers.sort((a,b)=>a.t-b.t);
  return layers.find(L => t <= L.t) || null;
}

function openModal(sel){
  const el = $(sel);
  el.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(sel){
  const el = $(sel);
  el.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

/* ---------------- Playback simulation ---------------- */

function setPlaying(on){
  playing = on;
  $("#btnPlay").textContent = on ? "⏸ Pausar" : "▶ Reproduzir";

  clearInterval(timer);
  if(on){
    timer = setInterval(() => {
      currentTime = clamp(currentTime + 1, 0, currentVideo.duration);
      syncPlayerUI();
      if(currentTime >= currentVideo.duration){
        setPlaying(false);
        awardXP(8, "vídeo concluído");
      }
    }, 1000);
  }
}

function syncPlayerUI(){
  $("#timeLabel").textContent = padTime(currentTime);
  $("#seek").value = String(currentTime);
  renderLayerPanel(currentVideo);
}

function jump(delta){
  currentTime = clamp(currentTime + delta, 0, currentVideo.duration);
  syncPlayerUI();
}

/* ---------------- Challenges ---------------- */

function getWeeklyChallenge(){
  // id semanal simples e estável
  const d = new Date();
  const year = d.getFullYear();
  const onejan = new Date(year,0,1);
  const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay()+1) / 7);
  const weekId = `${year}-W${String(week).padStart(2,"0")}`;

  return {
    weekId,
    reward: 25,
    title: "Explica um conceito difícil em 60 segundos",
    brief: "Usa 1 analogia + 1 exemplo + 1 frase final memorável.",
    deadline: "Domingo 23:59",
  };
}

/* ---------------- Progress/badges ---------------- */

function nextLevelXP(xp){
  // thresholds iguais ao xpToLevel
  const thresholds = [0, 100, 250, 450, 700, 1000, 1350, 1750];
  const lvl = xpToLevel(xp);
  const curStart = thresholds[lvl-1] ?? 0;
  const nextStart = thresholds[lvl] ?? (curStart + 500);

  const progress = xp - curStart;
  const total = nextStart - curStart;
  const remaining = Math.max(0, nextStart - xp);

  return { progress, total, remaining };
}

function computeBadges(){
  const badges = [];
  if(state.xp >= 100) badges.push("⚡ 100 XP");
  if(state.xp >= 250) badges.push("🔥 250 XP");
  if((state.saved||[]).length >= 3) badges.push("❤️ Curador");
  const notesCount = Object.values(state.notesByVideo||{}).filter(v => (v||"").trim().length > 0).length;
  if(notesCount >= 2) badges.push("📝 Anotador");
  if((state.submissions||[]).length >= 1) badges.push("🎮 Challenger");
  return badges;
}

/* ---------------- Create video ---------------- */

function addVideo(){
  const title = ($("#newTitle").value || "").trim();
  const goal = $("#newGoal").value;
  const duration = clamp(Number($("#newDuration").value || 180), 30, 3600);
  const tags = ($("#newTags").value || "").split(",").map(s=>s.trim()).filter(Boolean).slice(0,8);

  if(!title) return;

  const v = {
    id: "u_" + cryptoId(),
    title,
    goal,
    creator: "Tu",
    duration,
    level: "Iniciante",
    tags,
    layers: [
      { t: Math.min(20, Math.floor(duration*0.2)), type:"cta", text:"Escreve 2 notas-chave enquanto vês.", xp: 10 },
      { t: Math.min(duration-10, Math.floor(duration*0.7)), type:"quiz",
        q:"Qual é o objetivo deste vídeo?",
        opts:["Ensinar algo", "Entreter", "Inspirar a criar"],
        answer: goal==="learn" ? 0 : goal==="fun" ? 1 : 2,
        xp: 12
      }
    ]
  };

  state.customVideos = [...(state.customVideos||[]), v];
  saveState();
  closeModal("#createModal");
  awardXP(12, "conteúdo criado");
  render();
}

/* ---------------- Render / wiring ---------------- */

function render(){
  renderPillStats();
  const view = $("#view");
  if(state.route === "home") view.innerHTML = viewHome();
  else if(state.route === "learn") view.innerHTML = viewLearn();
  else if(state.route === "challenges") view.innerHTML = viewChallenges();
  else if(state.route === "progress") view.innerHTML = viewProgress();
  else if(state.route === "saved") view.innerHTML = viewSaved();
  else view.innerHTML = viewHome();

  // open video handlers
  $$("[data-open]").forEach(card => {
    card.addEventListener("click", () => openVideo(card.dataset.open));
    card.addEventListener("keydown", (e)=> {
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        openVideo(card.dataset.open);
      }
    });
  });

  // wire challenge submit
  const btnSubmit = $("#btnSubmit");
  if(btnSubmit){
    btnSubmit.addEventListener("click", () => {
      const text = ($("#subText").value || "").trim();
      if(!text) return;
      const weekly = getWeeklyChallenge();
      state.submissions = [...(state.submissions||[]), { text, when: nowLabel(), weekId: weekly.weekId }];
      saveState();
      awardXP(weekly.reward, "desafio submetido");
      render();
    });
  }
}

function wireGlobal(){
  // nav
  $$(".navItem").forEach(btn => btn.addEventListener("click", ()=> setRoute(btn.dataset.route)));

  // goals
  $$(".seg").forEach(btn => btn.addEventListener("click", ()=> setGoal(btn.dataset.goal)));

  // search
  $("#search").addEventListener("input", ()=> render());

  // Ctrl+K focus search
  document.addEventListener("keydown", (e) => {
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k"){
      e.preventDefault();
      $("#search").focus();
    }
    if(e.key === "Escape"){
      closeModal("#videoModal");
      closeModal("#createModal");
    }
  });

  // random
  $("#btnRandom").addEventListener("click", () => {
    const vids = recommendedVideos();
    const v = vids[Math.floor(Math.random() * vids.length)];
    if(v) openVideo(v.id);
  });

  // create
  $("#btnCreate").addEventListener("click", () => openModal("#createModal"));
  $("#btnAddVideo").addEventListener("click", addVideo);

  // modal close
  $$(".modal [data-close='1']").forEach(el => {
    el.addEventListener("click", (e) => {
      const modal = e.target.closest(".modal");
      if(modal) closeModal("#" + modal.id);
    });
  });

  // player controls
  $("#btnPlay").addEventListener("click", ()=> setPlaying(!playing));
  $("#btnRewind").addEventListener("click", ()=> jump(-10));
  $("#btnForward").addEventListener("click", ()=> jump(+10));
  $("#seek").addEventListener("input", (e)=> {
    if(!currentVideo) return;
    currentTime = clamp(Number(e.target.value), 0, currentVideo.duration);
    syncPlayerUI();
  });

  // save toggle
  $("#btnSave").addEventListener("click", () => {
    if(!currentVideo) return;
    const id = currentVideo.id;
    const has = state.saved.includes(id);
    state.saved = has ? state.saved.filter(x=>x!==id) : [...state.saved, id];
    saveState();
    $("#btnSave").textContent = has ? "♡" : "♥";
    awardXP(has ? 0 : 4, has ? "" : "guardado");
    render(); // atualizar contadores
  });

  // tabs
  $$(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach(t => t.classList.toggle("active", t === tab));
      const name = tab.dataset.tab;
      $("#panelLayer").classList.toggle("hidden", name !== "layer");
      $("#panelNotes").classList.toggle("hidden", name !== "notes");
      $("#panelComments").classList.toggle("hidden", name !== "comments");
    });
  });
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function cryptoId(){
  // fallback simples sem libs
  if(window.crypto && crypto.getRandomValues){
    const a = new Uint32Array(2);
    crypto.getRandomValues(a);
    return (a[0].toString(16) + a[1].toString(16)).slice(0,16);
  }
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/* init */
wireGlobal();
renderPillStats();
render();
