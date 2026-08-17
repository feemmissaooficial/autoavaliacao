const app = document.querySelector("#app");
let pollTimer = null;

function getTurmaFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("turma") || "";
}

function renderSetup() {
  app.innerHTML = `
    <div class="painel-shell">
      <div class="painel-setup">
        <h1>Painel ao vivo</h1>
        <div class="field">
          <label for="fTurmaPainel">Nome da turma</label>
          <input type="text" id="fTurmaPainel" placeholder="Ex: Convenção Tocantins 17/08">
        </div>
        <button class="btn btn-primary" id="verPainelBtn">Ver painel ao vivo →</button>
      </div>
    </div>
  `;

  document.querySelector("#verPainelBtn").addEventListener("click", () => {
    const turma = document.querySelector("#fTurmaPainel").value.trim();
    if (!turma) return;
    window.location.search = `?turma=${encodeURIComponent(turma)}`;
  });
}

function renderPainelShell(turma) {
  app.innerHTML = `
    <div class="painel-shell">
      <div class="painel-header">
        <span class="painel-eyebrow">Painel ao vivo</span>
        <h1 class="painel-title">${turma}</h1>
      </div>
      <div id="painelBody"></div>
      <div class="painel-live-dot">Atualizando automaticamente</div>
    </div>
  `;
}

function renderBodyWaiting() {
  document.querySelector("#painelBody").innerHTML = `
    <div class="painel-waiting">Aguardando as primeiras respostas da turma...</div>
  `;
}

function renderBodyData(summary) {
  const areas = radarAreas.map(a => a.id);
  const values = areas.map(id => summary.medias[id] || 0);

  const size = 300;
  const center = size / 2;
  const radius = (size / 2) - 42;
  const maxScore = 15;
  const angles = Array.from({ length: 7 }).map((_, i) => (i * 2 * Math.PI) / 7 - Math.PI / 2);
  const getPoint = (angle, r) => ({ x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) });
  const gridLevels = [1, 2, 3, 4, 5];
  const dataPoints = values.map((v, i) => getPoint(angles[i], (v / maxScore) * radius));
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(" ");

  const gridSvg = gridLevels.map(level => {
    const r = (level / 5) * radius;
    const points = angles.map(angle => getPoint(angle, r));
    return `<polygon points="${points.map(p => `${p.x},${p.y}`).join(" ")}" fill="none" stroke="#2a302a" stroke-width="1" />`;
  }).join("");

  const axesSvg = angles.map(angle => {
    const p = getPoint(angle, radius);
    return `<line x1="${center}" y1="${center}" x2="${p.x}" y2="${p.y}" stroke="#2a302a" stroke-width="1" />`;
  }).join("");

  const pointsSvg = dataPoints.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#c69b5c" />`).join("");

  const labelsSvg = angles.map((angle, i) => {
    const p = getPoint(angle, radius + 26);
    const parts = radarAreas[i].name.split(" ");
    const first = parts[0];
    const rest = parts.slice(1).join(" ");
    return `
      <text x="${p.x}" y="${p.y}" text-anchor="middle" fill="#eaddc5" font-size="11" font-weight="bold" opacity="0.9">
        <tspan x="${p.x}" dy="-0.3em">${first}</tspan>
        ${rest ? `<tspan x="${p.x}" dy="1.2em">${rest}</tspan>` : ""}
      </text>`;
  }).join("");

  document.querySelector("#painelBody").innerHTML = `
    <div class="painel-stats">
      <div class="painel-stat">
        <div class="painel-stat-value">${summary.participantes}</div>
        <span class="painel-stat-label">Participantes</span>
      </div>
      <div class="painel-stat">
        <div class="painel-stat-value">${summary.media_total}</div>
        <span class="painel-stat-label">Média / 105</span>
      </div>
    </div>
    <div class="painel-chart-wrap">
      <svg viewBox="0 0 ${size} ${size}" width="100%" height="100%" style="overflow:visible">
        ${gridSvg}
        ${axesSvg}
        <polygon points="${dataPolygon}" fill="#c69b5c" fill-opacity="0.3" stroke="#c69b5c" stroke-width="2" stroke-linejoin="round" />
        ${pointsSvg}
        ${labelsSvg}
      </svg>
    </div>
  `;
}

async function refresh(turma) {
  const { data, error } = await supabaseClient.rpc("get_radar_turma_summary", { p_turma: turma });
  if (error || !data || data.length === 0) return;

  const summary = data[0];
  if (!summary.participantes || summary.participantes === 0) {
    renderBodyWaiting();
    return;
  }
  renderBodyData(summary);
}

function init() {
  const turma = getTurmaFromUrl();
  if (!turma) {
    renderSetup();
    return;
  }

  renderPainelShell(turma);
  renderBodyWaiting();
  refresh(turma);

  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => refresh(turma), 5000);
}

init();
