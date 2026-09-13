// ============================================================
// Conversa com a Edge Function do Supabase.
// ============================================================
const { reactive } = Vue;

const estado = reactive({
  usuario: null,
  carregando: true,
  turmas: [],
  turnos: [],
});

const Sessao = {
  get: () => localStorage.getItem("hope_sessao") || "",
  set: (t) => localStorage.setItem("hope_sessao", t),
  limpar: () => localStorage.removeItem("hope_sessao"),
};

async function chamar(metodo, rota, corpo) {
  const r = await fetch(window.CONFIG.API + rota, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + window.CONFIG.ANON_KEY,
      "apikey": window.CONFIG.ANON_KEY,
      "x-sessao": Sessao.get(),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  let dados = {};
  try { dados = await r.json(); } catch (e) { /* sem corpo */ }
  if (!r.ok) {
    if (r.status === 401 && Sessao.get() && rota !== "/auth/login") {
      Sessao.limpar(); estado.usuario = null; location.hash = "#/entrar";
    }
    throw new Error(dados.erro || "Não foi possível concluir. Tente de novo.");
  }
  return dados;
}

const api = {
  get:  (r) => chamar("GET", r),
  post: (r, c) => chamar("POST", r, c),
  put:  (r, c) => chamar("PUT", r, c),
  del:  (r) => chamar("DELETE", r),

  async carregarUsuario() {
    if (!Sessao.get()) { estado.usuario = null; return; }
    try { estado.usuario = await chamar("GET", "/eu"); }
    catch (e) { Sessao.limpar(); estado.usuario = null; }
  },

  async carregarListas() {
    try {
      const [tm, tn] = await Promise.all([chamar("GET", "/turmas"), chamar("GET", "/turnos")]);
      estado.turmas = tm; estado.turnos = tn;
    } catch (e) { /* ignora */ }
  },

  async sair() {
    try { await chamar("POST", "/sair"); } catch (e) {}
    Sessao.limpar(); estado.usuario = null; location.hash = "#/entrar";
  },
};

// ------------------------------------------------------------
// Imagens: encolhe no navegador antes de enviar
// ------------------------------------------------------------
function lerImagem(arquivo, maxLado = 1280, qualidade = 0.82) {
  return new Promise((ok, falhou) => {
    if (!arquivo || !arquivo.type.startsWith("image/")) return falhou(new Error("Escolha uma imagem."));
    const leitor = new FileReader();
    leitor.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        const escala = Math.min(1, maxLado / Math.max(w, h));
        w = Math.round(w * escala); h = Math.round(h * escala);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        ok(c.toDataURL("image/jpeg", qualidade));
      };
      img.onerror = () => falhou(new Error("Não consegui abrir a imagem."));
      img.src = leitor.result;
    };
    leitor.onerror = () => falhou(new Error("Não consegui ler o arquivo."));
    leitor.readAsDataURL(arquivo);
  });
}

const dataBR = (d) => (d ? d.split("T")[0].split("-").reverse().join("/") : "");

window.App = { estado, api, Sessao, lerImagem, dataBR };
