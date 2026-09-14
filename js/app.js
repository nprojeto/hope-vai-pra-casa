(function () {
// ============================================================
// Montagem do aplicativo e navegação por # (funciona no GitHub Pages)
// ============================================================
const { createApp, computed, ref, onMounted } = Vue;
const { estado, api } = window.App;

const PUBLICAS = ["entrar", "cadastro", "confirmar", "esqueci"];

createApp({
  setup() {
    const rota = ref("entrar");

    function lerHash() {
      const nome = (location.hash.replace("#/", "").split("?")[0] || "").trim();
      rota.value = nome || (estado.usuario ? "linha" : "entrar");
    }

    onMounted(async () => {
      await api.carregarUsuario();
      await api.carregarListas();
      estado.carregando = false;
      lerHash();
      if (!estado.usuario && !PUBLICAS.includes(rota.value)) location.hash = "#/entrar";
      if (estado.usuario && PUBLICAS.includes(rota.value)) location.hash = "#/linha";
      lerHash();
    });

    window.addEventListener("hashchange", () => {
      lerHash();
      if (!estado.usuario && !PUBLICAS.includes(rota.value)) { location.hash = "#/entrar"; lerHash(); }
      window.scrollTo(0, 0);
    });

    const tela = computed(() => window.Telas[rota.value] || window.Telas.entrar);
    const logado = computed(() => !!estado.usuario);
    const admin = computed(() => estado.usuario && estado.usuario.papel === "admin");

    const ico = document.createElement("link");
    ico.rel = "icon"; ico.href = window.MARCA.icone;
    document.head.appendChild(ico);

    return { estado, rota, tela, logado, admin, sair: api.sair,
             CONFIG: window.CONFIG, MARCA: window.MARCA };
  },
  template: `
  <div class="ceu"></div>

  <header class="topo">
    <a class="marca" :href="logado ? '#/linha' : '#/entrar'">
      <img class="logo-marca" :src="MARCA.logo" :alt="CONFIG.ESCOLA">
      <span class="divisa"></span>
      <b>{{ CONFIG.PROJETO }}</b>
    </a>
    <div class="direita" v-if="logado">
      <span class="fita azul">{{ estado.usuario.nome.split(' ')[0] }}</span>
      <button class="btn risco mini" @click="sair">Sair</button>
    </div>
  </header>

  <nav class="abas" v-if="logado">
    <div class="env-abas">
      <a class="aba" :class="{on: rota==='linha'}"   href="#/linha">Linha do tempo</a>
      <a class="aba" :class="{on: rota==='familia'}" href="#/familia">Minha família</a>
      <a class="aba" v-if="admin" :class="{on: rota==='escola'}" href="#/escola">Painel da escola</a>
    </div>
  </nav>

  <main>
    <div v-if="estado.carregando" class="carregando">Abrindo o caderno do Hope...</div>
    <component v-else :is="tela" :key="rota"></component>
  </main>
  `,
}).mount("#app");
})();
