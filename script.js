const form = document.querySelector("#assessmentForm");
const resultBox = document.querySelector("#result");
const chartCanvas = document.querySelector("#radarChart");
const downloadPdfButton = document.querySelector("#downloadPdf");

const questionNames = ["q1", "q2", "q3", "q4", "q5"];
const chartLabels = [
  "Fazer discípulos",
  "Oração por pessoas",
  "Pessoas levadas a Cristo",
  "Acompanhamento",
  "Compartilhar o evangelho"
];

let radarChart = null;

function getAnalysis(total) {
  if (total <= 5) {
    return "Identificamos que este pilar ainda não faz parte do seu caminhar como discípulo. Existe uma fragilidade que pede cuidado imediato e uma escolha prática de mudança.";
  }

  if (total <= 10) {
    return "Você já deu os primeiros passos e tem consciência dessa necessidade, mas falta constância. Para avançar, será preciso agir com mais intenção e disciplina diária.";
  }

  return "Parabéns, esta área já floresce em sua vida cristã. O próximo passo é manter o que foi conquistado, aprofundar suas raízes e proteger esse hábito com zelo.";
}

function getAnswers(formData) {
  return questionNames.map((name) => Number(formData.get(name)));
}

function renderResult(name, total) {
  resultBox.classList.remove("result-empty");
  resultBox.innerHTML = `
    <span class="result-kicker">Resultado de ${name}</span>
    <h2>Pontuação total</h2>
    <div class="score-number">${total}/15</div>
    <p>${getAnalysis(total)}</p>
  `;
}

function renderChart(answers) {
  if (radarChart) {
    radarChart.destroy();
  }

  radarChart = new Chart(chartCanvas, {
    type: "radar",
    data: {
      labels: chartLabels,
      datasets: [
        {
          label: "Pontuação por área",
          data: answers,
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
          max: 3,
          ticks: {
            stepSize: 1,
            color: "#5d6773"
          },
          grid: {
            color: "#d7d3ca"
          },
          angleLines: {
            color: "#d7d3ca"
          },
          pointLabels: {
            color: "#1f2933",
            font: {
              size: 12,
              weight: "600"
            }
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: "#1f2933",
            font: {
              weight: "600"
            }
          }
        }
      }
    }
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const name = formData.get("name").trim();
  const answers = getAnswers(formData);
  const total = answers.reduce((sum, answer) => sum + answer, 0);

  renderResult(name, total);
  renderChart(answers);
  downloadPdfButton.hidden = false;
});

downloadPdfButton.addEventListener("click", () => {
  window.print();
});
