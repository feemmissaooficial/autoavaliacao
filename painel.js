function getAnalysis(total) {
  if (total <= 5) {
    return "Ainda não faz parte da rotina do grupo. Pede cuidado e escolha prática de mudança.";
  }
  if (total <= 10) {
    return "O grupo já deu os primeiros passos, mas falta constância.";
  }
  return "Área que já floresce no grupo. Vale manter e proteger esse hábito.";
}

async function loadPanel() {
  const params = new URLSearchParams(window.location.search);
  const adminCode = params.get("admin");

  const groupNameEl = document.querySelector("#groupName");
  const groupSummaryEl = document.querySelector("#groupSummary");
  const panelContent = document.querySelector("#panelContent");
  const emptyState = document.querySelector("#emptyState");
  const notFoundState = document.querySelector("#notFoundState");
  const detailBreakdown = document.querySelector("#detailBreakdown");
  const participantList = document.querySelector("#participantList");

  if (!adminCode) {
    groupNameEl.textContent = "Painel não encontrado";
    notFoundState.hidden = false;
    return;
  }

  const { data: info, error: infoError } = await supabaseClient.rpc("get_radar_group_info_by_admin", { p_admin_code: adminCode });

  if (infoError || !info || info.length === 0) {
    groupNameEl.textContent = "Painel não encontrado";
    notFoundState.hidden = false;
    return;
  }

  groupNameEl.textContent = info[0].name;

  const { data: responses } = await supabaseClient.rpc("get_radar_group_responses_by_admin", { p_admin_code: adminCode });
  const rows = responses || [];

  groupSummaryEl.textContent = `${rows.length} ${rows.length === 1 ? "resposta" : "respostas"}`;

  if (rows.length === 0) {
    emptyState.hidden = false;
    return;
  }

  const averages = radarAreas.map(area => {
    const sum = rows.reduce((acc, r) => acc + (r.scores[area.id] || 0), 0);
    return Math.round((sum / rows.length) * 10) / 10;
  });

  new Chart(document.querySelector("#radarChart"), {
    type: "radar",
    data: {
      labels: radarAreas.map(a => a.name),
      datasets: [{
        label: "Média da turma",
        data: averages,
        backgroundColor: "rgba(47, 111, 94, 0.24)",
        borderColor: "#2f6f5e",
        pointBackgroundColor: "#c7503f",
        pointBorderColor: "#ffffff",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 15,
          ticks: { stepSize: 5, color: "#5d6773" },
          grid: { color: "#d7d3ca" },
          angleLines: { color: "#d7d3ca" },
          pointLabels: { color: "#1f2933", font: { size: 11, weight: "600" } }
        }
      },
      plugins: {
        legend: { labels: { color: "#1f2933", font: { weight: "600" } } }
      }
    }
  });

  detailBreakdown.innerHTML = radarAreas.map((area, i) => `
    <div class="breakdown-item">
      <div class="breakdown-head">
        <span>${area.name}</span>
        <strong>${averages[i]}/15</strong>
      </div>
      <p>${getAnalysis(averages[i])}</p>
    </div>
  `).join("");

  participantList.innerHTML = rows.map(r => `
    <div class="participant-row">
      <span>${r.participant_name}</span>
      <strong>${r.total_score}/105</strong>
    </div>
  `).join("");

  panelContent.hidden = false;
}

loadPanel();
