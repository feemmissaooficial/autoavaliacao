const groupNameInput = document.querySelector("#groupName");
const createButton = document.querySelector("#createButton");
const formSection = document.querySelector("#formSection");
const linksSection = document.querySelector("#linksSection");
const participantLinkEl = document.querySelector("#participantLink");
const panelLinkEl = document.querySelector("#panelLink");
const resetButton = document.querySelector("#resetButton");

createButton.addEventListener("click", async () => {
  const name = groupNameInput.value.trim();
  if (!name) return;

  createButton.disabled = true;
  createButton.textContent = "Criando...";

  const { data, error } = await supabaseClient.rpc("create_radar_group", { p_name: name });

  createButton.disabled = false;
  createButton.textContent = "Criar turma";

  if (error || !data || data.length === 0) {
    alert("Erro ao criar a turma: " + (error ? error.message : "tente novamente."));
    return;
  }

  const { code, admin_code: adminCode } = data[0];
  const base = window.location.origin + window.location.pathname.replace("criar-turma.html", "");

  participantLinkEl.textContent = `${base}index.html?turma=${code}`;
  panelLinkEl.textContent = `${base}painel.html?admin=${adminCode}`;

  formSection.hidden = true;
  linksSection.hidden = false;
});

document.querySelectorAll(".copy-button").forEach(button => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-target");
    const text = document.querySelector(`#${targetId}`).textContent;
    navigator.clipboard.writeText(text);
    const original = button.textContent;
    button.textContent = "Copiado!";
    setTimeout(() => { button.textContent = original; }, 2000);
  });
});

resetButton.addEventListener("click", () => {
  groupNameInput.value = "";
  formSection.hidden = false;
  linksSection.hidden = true;
});
