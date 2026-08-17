const estadosBR = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"],
  ["BA", "Bahia"], ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"],
  ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"],
  ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"],
  ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"]
];

const scoreOptions = [
  { val: 0, label: "0 - nunca fiz" },
  { val: 1, label: "1 - já fiz, mas hoje não" },
  { val: 2, label: "2 - faço de vez em quando" },
  { val: 3, label: "3 - sempre" }
];

const NOTIFY_URL = "https://kxbyaasoejtrmkiwawzz.supabase.co/functions/v1/notify-telegram";

const app = document.querySelector("#app");

const municipiosCache = {}; // { UF: [nomes ordenados] }

async function getMunicipios(uf) {
  if (municipiosCache[uf]) return municipiosCache[uf];
  const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
  const data = await res.json();
  const nomes = data.map(m => m.nome).sort((a, b) => a.localeCompare(b, "pt-BR"));
  municipiosCache[uf] = nomes;
  return nomes;
}

const state = {
  stage: "intro", // intro | identify | quiz | submitting | result | error
  name: "",
  igreja: "",
  pastorIgreja: "",
  turma: "",
  estado: "",
  municipio: "",
  areaIndex: 0,
  answers: {}, // { areaId: [scores] }
  finalScores: [],
  totalScore: 0
};

radarAreas.forEach(area => {
  state.answers[area.id] = new Array(area.questions.length).fill(-1);
});

function render() {
  window.scrollTo(0, 0);
  if (state.stage === "intro") return renderIntro();
  if (state.stage === "identify") return renderIdentify();
  if (state.stage === "quiz") return renderQuiz();
  if (state.stage === "submitting") return renderSubmitting();
  if (state.stage === "result") return renderResult();
  if (state.stage === "error") return renderError();
}

function renderIntro() {
  app.innerHTML = `
    <div class="shell">
      <div class="hero">
        <div class="hero-icon">🎯</div>
        <span class="eyebrow">Autoavaliação</span>
        <h1>Radar Discipular</h1>
        <div class="intro-card">
          <p>O Radar Discipular não é uma prova espiritual, nem um instrumento de comparação com outras pessoas. Ele é, antes de tudo, um <strong>retrato</strong> — uma fotografia do seu momento atual na caminhada com Deus.</p>
          <p>A autoavaliação será fiel na medida em que pontuar levando em consideração seu <strong>comportamento real e não o ideal</strong>.</p>
          <p>Para responder, tome como base os <strong>últimos dois anos</strong> da sua caminhada.</p>
          <p>Ao final, seu resultado será enviado automaticamente ao Fé em Missão.</p>
        </div>
      </div>
      <div class="field-group">
        <button class="btn btn-primary" id="startBtn">Estou pronto →</button>
      </div>
    </div>
  `;
  document.querySelector("#startBtn").addEventListener("click", () => {
    state.stage = "identify";
    render();
  });
}

function renderIdentify() {
  app.innerHTML = `
    <div class="shell">
      <div class="hero">
        <span class="eyebrow">Antes de começar</span>
        <h1 style="font-size:24px">Quem está respondendo?</h1>
      </div>
      <div class="field-group">
        <div class="field">
          <label for="fName">Nome completo</label>
          <input type="text" id="fName" placeholder="Seu nome completo" value="${state.name}">
        </div>
        <div class="field">
          <label for="fIgreja">Igreja</label>
          <input type="text" id="fIgreja" placeholder="Nome da sua igreja" value="${state.igreja}">
        </div>
        <div class="field">
          <label for="fPastor">Pastor da igreja</label>
          <input type="text" id="fPastor" placeholder="Nome do pastor da sua igreja" value="${state.pastorIgreja}">
        </div>
        <div class="field">
          <label for="fTurma">Turma (se você foi orientado a preencher isso agora, em grupo)</label>
          <input type="text" id="fTurma" placeholder="Ex: Tocantins 17/08 (deixe em branco se não souber)" value="${state.turma}">
        </div>
        <div class="field-row">
          <div class="field">
            <label for="fEstado">Estado</label>
            <select id="fEstado">
              <option value="">Selecione</option>
              ${estadosBR.map(([sigla, nome]) => `<option value="${sigla}" ${state.estado === sigla ? "selected" : ""}>${nome}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="fMunicipio">Município</label>
            <select id="fMunicipio" ${state.estado ? "" : "disabled"}>
              <option value="">${state.estado ? "Carregando..." : "Selecione o estado primeiro"}</option>
            </select>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn btn-secondary" id="backBtn">Voltar</button>
          <button class="btn btn-primary" id="nextBtn">Continuar →</button>
        </div>
      </div>
    </div>
  `;

  const municipioSelect = document.querySelector("#fMunicipio");

  async function loadMunicipios(uf, preselect) {
    municipioSelect.disabled = true;
    municipioSelect.innerHTML = `<option value="">Carregando...</option>`;
    try {
      const nomes = await getMunicipios(uf);
      municipioSelect.innerHTML = `<option value="">Selecione</option>` +
        nomes.map(n => `<option value="${n}" ${preselect === n ? "selected" : ""}>${n}</option>`).join("");
      municipioSelect.disabled = false;
    } catch (err) {
      municipioSelect.innerHTML = `<option value="">Erro ao carregar — tente trocar o estado</option>`;
    }
  }

  if (state.estado) {
    loadMunicipios(state.estado, state.municipio);
  }

  document.querySelector("#fEstado").addEventListener("change", (e) => {
    const uf = e.target.value;
    state.municipio = "";
    if (uf) {
      loadMunicipios(uf, "");
    } else {
      municipioSelect.disabled = true;
      municipioSelect.innerHTML = `<option value="">Selecione o estado primeiro</option>`;
    }
  });

  document.querySelector("#backBtn").addEventListener("click", () => {
    state.stage = "intro";
    render();
  });

  document.querySelector("#nextBtn").addEventListener("click", () => {
    state.name = document.querySelector("#fName").value.trim();
    state.igreja = document.querySelector("#fIgreja").value.trim();
    state.pastorIgreja = document.querySelector("#fPastor").value.trim();
    state.turma = document.querySelector("#fTurma").value.trim();
    state.estado = document.querySelector("#fEstado").value;
    state.municipio = document.querySelector("#fMunicipio").value.trim();

    if (!state.name || !state.igreja || !state.estado || !state.municipio) {
      alert("Preencha nome, igreja, estado e município para continuar.");
      return;
    }

    state.stage = "quiz";
    state.areaIndex = 0;
    render();
  });
}

function renderQuiz() {
  const area = radarAreas[state.areaIndex];
  const answers = state.answers[area.id];
  const isComplete = answers.every(a => a !== -1);
  const progress = (state.areaIndex / radarAreas.length) * 100;

  app.innerHTML = `
    <div class="shell">
      <div class="quiz-header">
        <div class="quiz-header-top">
          <h2>Radar Discipular</h2>
          <span class="quiz-area-count">Área ${state.areaIndex + 1} de ${radarAreas.length}</span>
        </div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
        <h3 class="quiz-area-title">${area.name}</h3>
      </div>

      <div class="honesty-note">
        ⚠️ Seja extremamente honesto. Avalie cada afirmação considerando seu <strong>comportamento atual</strong> e não o seu desejo.
      </div>

      <div id="questionsWrap"></div>

      <div class="bottom-nav">
        <div class="btn-row">
          ${state.areaIndex > 0 ? '<button class="btn btn-secondary" id="quizBackBtn">Voltar</button>' : ""}
          <button class="btn btn-primary" id="quizNextBtn" ${isComplete ? "" : "disabled"}>
            ${state.areaIndex < radarAreas.length - 1 ? "Próxima Área →" : "Ver Meu Resultado →"}
          </button>
        </div>
      </div>
    </div>
  `;

  const wrap = document.querySelector("#questionsWrap");
  area.questions.forEach((question, qIndex) => {
    const block = document.createElement("div");
    block.className = "question-block";
    const p = document.createElement("p");
    p.textContent = `${qIndex + 1}. ${question}`;
    block.appendChild(p);

    const list = document.createElement("div");
    list.className = "option-list";
    scoreOptions.forEach(option => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-btn" + (answers[qIndex] === option.val ? " selected" : "");
      btn.textContent = option.label;
      btn.addEventListener("click", () => {
        state.answers[area.id][qIndex] = option.val;
        renderQuiz();
      });
      list.appendChild(btn);
    });
    block.appendChild(list);
    wrap.appendChild(block);
  });

  if (state.areaIndex > 0) {
    document.querySelector("#quizBackBtn").addEventListener("click", () => {
      state.areaIndex -= 1;
      render();
    });
  }

  document.querySelector("#quizNextBtn").addEventListener("click", async () => {
    if (!isComplete) return;
    if (state.areaIndex < radarAreas.length - 1) {
      state.areaIndex += 1;
      render();
    } else {
      await submitRadar();
    }
  });
}

function renderSubmitting() {
  app.innerHTML = `
    <div class="loading-screen">
      <div class="spinner spinner-light"></div>
    </div>
  `;
}

async function submitRadar() {
  state.stage = "submitting";
  render();

  const scoresPayload = {};
  const orderedScores = [];
  radarAreas.forEach(area => {
    const sum = state.answers[area.id].reduce((a, b) => a + b, 0);
    scoresPayload[area.id] = sum;
    orderedScores.push(sum);
  });
  const total = orderedScores.reduce((a, b) => a + b, 0);

  const { error } = await supabaseClient.rpc("submit_radar_response", {
    p_name: state.name,
    p_igreja: state.igreja,
    p_estado: state.estado,
    p_municipio: state.municipio,
    p_scores: scoresPayload,
    p_total: total,
    p_turma: state.turma,
    p_pastor_igreja: state.pastorIgreja
  });

  if (error) {
    state.stage = "error";
    state.errorMessage = error.message;
    render();
    return;
  }

  // Avisa o Nilton no Telegram. Se isso falhar, não trava o fluxo —
  // o resultado já está salvo no banco de qualquer forma.
  try {
    await fetch(NOTIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: state.name,
        igreja: state.igreja,
        pastorIgreja: state.pastorIgreja,
        turma: state.turma || "Avulso",
        estado: state.estado,
        municipio: state.municipio,
        total,
        scores: scoresPayload
      })
    });
  } catch (notifyErr) {
    console.error("Falha ao notificar Telegram:", notifyErr);
  }

  state.finalScores = orderedScores;
  state.totalScore = total;
  state.stage = "result";
  render();
}

function renderError() {
  app.innerHTML = `
    <div class="shell">
      <div class="hero">
        <h1 style="font-size:22px">Não foi possível enviar</h1>
      </div>
      <div class="error-box">
        Houve um erro ao enviar seu resultado. Verifique sua internet e tente novamente.<br><br>
        ${state.errorMessage || ""}
      </div>
      <div class="field-group">
        <button class="btn btn-primary" id="retryBtn">Tentar novamente</button>
      </div>
    </div>
  `;
  document.querySelector("#retryBtn").addEventListener("click", submitRadar);
}

function renderResult() {
  const size = 300;
  const center = size / 2;
  const radius = (size / 2) - 42;
  const maxScore = 15;
  const angles = Array.from({ length: 7 }).map((_, i) => (i * 2 * Math.PI) / 7 - Math.PI / 2);
  const getPoint = (angle, r) => ({ x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) });
  const gridLevels = [1, 2, 3, 4, 5];
  const dataPoints = state.finalScores.map((score, i) => getPoint(angles[i], (score / maxScore) * radius));
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
      <text x="${p.x}" y="${p.y}" text-anchor="middle" fill="#eaddc5" font-size="10" font-weight="bold" opacity="0.9">
        <tspan x="${p.x}" dy="-0.3em">${first}</tspan>
        ${rest ? `<tspan x="${p.x}" dy="1.2em">${rest}</tspan>` : ""}
      </text>`;
  }).join("");

  app.innerHTML = `
    <div class="shell">
      <div class="result-header">
        <h1>Seu Radar</h1>
        <p class="subtitle">${state.name} · ${state.igreja}</p>
        <div class="score-badge">
          <span class="score-badge-label">Pontuação Total</span>
          <span class="score-badge-value">${state.totalScore}</span>
          <span class="score-badge-max">de 105 possíveis</span>
        </div>
      </div>

      <div class="chart-section">
        <div class="chart-wrap">
          <svg viewBox="0 0 ${size} ${size}" width="100%" height="100%" style="overflow:visible">
            ${gridSvg}
            ${axesSvg}
            <polygon points="${dataPolygon}" fill="#c69b5c" fill-opacity="0.3" stroke="#c69b5c" stroke-width="2" stroke-linejoin="round" />
            ${pointsSvg}
            ${labelsSvg}
          </svg>
        </div>
      </div>

      <div class="detail-card">
        <h3>Detalhamento</h3>
        ${radarAreas.map((area, i) => {
          const score = state.finalScores[i];
          const pct = (score / maxScore) * 100;
          return `
            <div class="detail-row">
              <div class="detail-row-head">
                <span>${area.name}</span>
                <strong>${score}/15</strong>
              </div>
              <div class="detail-track"><div class="detail-fill" style="width:${pct}%"></div></div>
            </div>`;
        }).join("")}
      </div>

      <div class="confirm-note">
        ✓ Seu resultado foi enviado com sucesso para o <strong>Fé em Missão</strong>.<br>
        Pode fechar esta página.
      </div>
    </div>
  `;
}

render();
