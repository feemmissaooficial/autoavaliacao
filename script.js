const form = document.querySelector("#assessmentForm");
const resultBox = document.querySelector("#result");
const chartCanvas = document.querySelector("#radarChart");
const downloadPdfButton = document.querySelector("#downloadPdf");
const questionsContainer = document.querySelector("#questionsContainer");
const detailBreakdown = document.querySelector("#detailBreakdown");
const turmaBanner = document.querySelector("#turmaBanner");
const turmaBannerName = document.querySelector("#turmaBannerName");
const turmaInvalid = document.querySelector("#turmaInvalid");

const scoreOptions = [
  { val: 0, label: "0", sub: "Nunca" },
  { val: 1, label: "1", sub: "Já fiz, mas hoje não" },
  { val: 2, label: "2", sub: "Faço de vez em quando" },
  { val: 3, label: "3", sub: "Sempre" }
];

let radarChart = null;
let turmaCode = null;
let submitting = false;

function getAnalysis(total) {
  if (total <= 5) {
    return "Identificamos que este pilar ainda não faz parte do seu caminhar como discípulo. Existe uma fragilidade que pede cuidado imediato e uma escolha prática de mudança.";
  }
  if (total <= 10) {
    return "Você já deu os primeiros passos e tem consciência dessa necessidade, mas falta constância. Para avançar, será preciso agir com mais intenção e disciplina diária.";
  }
  return "Parabéns, esta área já floresce em sua vida cristã. O próximo passo é manter o que foi conquistado, aprofundar suas raízes e proteger esse hábito com zelo.";
}

function buildQuestions() {
  radarAreas.forEach((area, areaIndex) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "questions";

    const legend = document.createElement("legend");
    legend.textContent = area.name;
    fieldset.appendChild(legend);

    area.questions.forEach((question, qIndex) => {
      const fieldName = `${area.id}_${qIndex}`;
      const wrap = document.createElement("div");
      wrap.className = "question";

      const p = document.createElement("p");
      p.textContent = `${qIndex + 1}. ${question}`;
      wrap.appendChild(p);

      const options = document.createElement("div");
      options.className = "options";
      options.setAttribute("role", "radiogroup");
      options.setAttribute("aria-label", `${area.name} — pergunta ${qIndex + 1}`);

      scoreOptions.forEach(option => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = fieldName;
        input.value = String(option.val);
        if (option.val === 0) input.required = true;
        const span = document.createElement("span");
        span.innerHTML = `${option.label}<br>${option.sub}`;
        label.appendChild(input);
        label.appendChild(span);
        options.appendChild(label);
      });

      wrap.appendChild(options);
      fieldset.appendChild(wrap);
    });

    questionsContainer.appendChild(fieldset);
  });
}

function getAreaScores(formData) {
  return radarAreas.map(area => {
    let sum = 0;
    area.questions.forEach((_, qIndex) => {
      sum += Number(formData.get(`${area.id}_${qIndex}`));
    });
    return sum;
  });
}

function renderResult(name, total) {
  resultBox.classList.remove("result-empty");
  resultBox.innerHTML = `
    <span class="result-kicker">Resultado de ${name}</span>
    <h2>Pontuação total</h2>
    <div class="score-number">${total}<span class="score-max">/105</span></div>
  `;
}

function renderBreakdown(areaScores) {
  detailBreakdown.innerHTML = radarAreas.map((area, i) => `
    <div class="breakdown-item">
      <div class="breakdown-head">
        <span>${area.name}</span>
        <strong>${areaScores[i]}/15</strong>
      </div>
      <p>${getAnalysis(areaScores[i])}</p>
    </div>
  `).join("");
}

function renderChart(areaScores) {
  if (radarChart) {
    radarChart.destroy();
  }

  radarChart = new Chart(chartCanvas, {
    type: "radar",
    data: {
      labels: radarAreas.map(a => a.name),
      datasets: [
        {
          label: "Pontuação por área",
          data: areaScores,
          backgroundColor: "rgba(47, 111, 94, 0.24)",
          borderColor: "#2f6f5e",
          pointBackgroundColor: "#c7503f",
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: "#c7503f",
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 15,
          ticks: {
            stepSize: 5,
            color: "#5d6773"
          },
          grid: { color: "#d7d3ca" },
          angleLines: { color: "#d7d3ca" },
          pointLabels: {
            color: "#1f2933",
            font: { size: 11, weight: "600" }
          }
        }
      },
      plugins: {
        legend: {
          labels: { color: "#1f2933", font: { weight: "600" } }
        }
      }
    }
  });
}

async function checkTurma() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("turma");
  if (!code) return;

  const { data, error } = await supabaseClient.rpc("get_radar_group_by_code", { p_code: code });
  if (error || !data || data.length === 0) {
    turmaInvalid.hidden = false;
    return;
  }

  turmaCode = code;
  turmaBannerName.textContent = data[0].name;
  turmaBanner.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submitting) return;

  const formData = new FormData(form);
  const name = formData.get("name").trim();
  const areaScores = getAreaScores(formData);
  const total = areaScores.reduce((sum, score) => sum + score, 0);

  if (turmaCode) {
    submitting = true;
    const submitButton = form.querySelector("button[type=submit]");
    submitButton.disabled = true;
    submitButton.textContent = "Enviando...";

    const scoresPayload = {};
    radarAreas.forEach((area, i) => { scoresPayload[area.id] = areaScores[i]; });

    const { error } = await supabaseClient.rpc("submit_radar_group_response", {
      p_code: turmaCode,
      p_name: name,
      p_scores: scoresPayload,
      p_total: total
    });

    submitting = false;
    submitButton.disabled = false;
    submitButton.textContent = "Ver meu resultado";

    if (error) {
      alert("Não consegui enviar seu resultado para a turma. Tente novamente: " + error.message);
      return;
    }
  }

  renderResult(name, total);
  renderBreakdown(areaScores);
  renderChart(areaScores);
  detailBreakdown.hidden = false;
  downloadPdfButton.hidden = false;
  window.scrollTo({ top: resultBox.offsetTop - 20, behavior: "smooth" });
});

downloadPdfButton.addEventListener("click", () => {
  window.print();
});

buildQuestions();
checkTurma();
