const app = document.querySelector("#app");

function renderForm() {
  app.innerHTML = `
    <div class="painel-shell">
      <div class="painel-setup">
        <h1>Novo evento</h1>
        <p style="color:var(--muted);font-size:13px;margin-bottom:20px;line-height:1.6">
          Crie um evento e defina uma senha. Só quem digitar essa senha consegue responder o Radar como parte deste evento.
        </p>
        <div class="field">
          <label for="fNome">Nome do evento</label>
          <input type="text" id="fNome" placeholder="Ex: Talmidim Natal">
        </div>
        <div class="field">
          <label for="fSenha">Senha do evento</label>
          <input type="text" id="fSenha" placeholder="Ex: natal">
        </div>
        <button class="btn btn-primary" id="criarBtn">Criar evento →</button>
        <div id="msgArea" style="margin-top:16px"></div>
      </div>

      <div class="painel-setup" style="margin-top:40px">
        <h1 style="font-size:20px">Eventos já criados</h1>
        <div id="listaEventos" style="margin-top:16px">Carregando...</div>
      </div>
    </div>
  `;

  document.querySelector("#criarBtn").addEventListener("click", criarEvento);
  carregarLista();
}

async function criarEvento() {
  const nome = document.querySelector("#fNome").value.trim();
  const senha = document.querySelector("#fSenha").value.trim();
  const msgArea = document.querySelector("#msgArea");
  const btn = document.querySelector("#criarBtn");

  if (!nome || !senha) {
    msgArea.innerHTML = `<p style="color:var(--red);font-size:13px">Preencha o nome e a senha.</p>`;
    return;
  }

  btn.disabled = true;
  btn.textContent = "Criando...";

  const { data, error } = await supabaseClient.rpc("criar_evento", { p_nome: nome, p_senha: senha });

  btn.disabled = false;
  btn.textContent = "Criar evento →";

  if (error) {
    msgArea.innerHTML = `<p style="color:var(--red);font-size:13px">${error.message}</p>`;
    return;
  }

  msgArea.innerHTML = `
    <div style="padding:16px;background:rgba(59,138,94,0.12);border:1px solid rgba(59,138,94,0.4);border-radius:12px">
      <p style="color:var(--white);font-size:14px;font-weight:700;margin:0 0 8px">Evento criado: ${data[0].nome}</p>
      <p style="color:var(--muted);font-size:13px;margin:0">Diga esta senha para o grupo: <strong style="color:var(--gold)">${data[0].senha}</strong></p>
      <p style="color:var(--muted);font-size:12px;margin:10px 0 0">Link do Radar: feemmissaooficial.github.io/autoavaliacao/</p>
    </div>
  `;

  document.querySelector("#fNome").value = "";
  document.querySelector("#fSenha").value = "";
  carregarLista();
}

async function carregarLista() {
  const { data } = await supabaseClient.rpc("list_radar_eventos");
  const lista = document.querySelector("#listaEventos");
  if (!data || data.length === 0) {
    lista.innerHTML = `<p style="color:var(--muted);font-size:13px">Nenhum evento criado ainda.</p>`;
    return;
  }
  lista.innerHTML = data.map(e => `
    <div style="display:flex;justify-content:space-between;padding:12px;margin-bottom:8px;background:var(--panel-alt);border:1px solid var(--border);border-radius:12px">
      <span style="font-size:14px;color:var(--white)">${e.nome}</span>
      <span style="font-size:12px;color:var(--gold);font-weight:700">${e.participantes} resp.</span>
    </div>
  `).join("");
}

renderForm();
