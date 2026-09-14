(function () {
// ============================================================
// Entrar, criar conta, confirmar e-mail, nova senha
// ============================================================
const { estado, api, Sessao, lerImagem, mascaraTelefone } = window.App;
window.Telas = window.Telas || {};

// ------------------------------------------------------------
window.Telas.entrar = {
  data: () => ({ email: "", senha: "", erro: "", indo: false }),
  computed: { MARCA() { return window.MARCA; } },
  methods: {
    async entrar() {
      this.erro = ""; this.indo = true;
      try {
        const r = await api.post("/auth/login", { email: this.email, senha: this.senha });
        if (r.confirmar) { location.hash = "#/confirmar?email=" + encodeURIComponent(r.email); return; }
        Sessao.set(r.sessao); estado.usuario = r.usuario; location.hash = "#/linha";
      } catch (e) { this.erro = e.message; }
      this.indo = false;
    },
  },
  template: `
  <div class="env" style="max-width:440px;padding-top:28px">
    <div class="cartao" style="text-align:left">
      <img :src="MARCA.hope" class="hope-hero" alt="Hope">
      <h1>Bem-vindo de volta</h1>
      <p class="ajuda" style="margin-bottom:18px">Entre para ver o que o Hope andou aprontando.</p>
      <div v-if="erro" class="aviso erro">{{ erro }}</div>
      <div class="campo"><label>E-mail</label>
        <input v-model="email" type="email" autocomplete="email" @keyup.enter="entrar"></div>
      <div class="campo"><label>Senha</label>
        <input v-model="senha" type="password" autocomplete="current-password" @keyup.enter="entrar"></div>
      <div class="campo"><button class="btn largo" :disabled="indo" @click="entrar">
        {{ indo ? 'Entrando...' : 'Entrar' }}</button></div>
      <p class="ajuda" style="text-align:center;margin-top:16px">
        <a href="#/esqueci">Esqueci minha senha</a> &nbsp;·&nbsp;
        <a href="#/cadastro">Criar minha conta</a>
      </p>
    </div>
  </div>`,
};

// ------------------------------------------------------------
window.Telas.cadastro = {
  data: () => ({
    f: { nome: "", email: "", senha: "", senha2: "", telefone: "", parentesco: "",
         familia_nome: "", familia_foto: null, convite: "" },
    familiaConvite: null, jaCadastrado: false, erro: "", indo: false,
  }),
  computed: { MARCA() { return window.MARCA; } },
  watch: { "f.telefone"(v) { this.f.telefone = mascaraTelefone(v); } },
  async created() {
    const c = new URLSearchParams(location.hash.split("?")[1] || "").get("convite");
    if (c) {
      this.f.convite = c;
      try {
        const r = await api.get("/auth/convite?codigo=" + encodeURIComponent(c));
        this.familiaConvite = r.familia; this.f.email = r.email;
        this.jaCadastrado = !!r.ja_cadastrado;
      } catch (e) { this.erro = e.message; this.f.convite = ""; }
    }
  },
  methods: {
    async foto(ev) {
      try { this.f.familia_foto = await lerImagem(ev.target.files[0], 800); }
      catch (e) { this.erro = e.message; }
    },
    async criar() {
      this.erro = "";
      if (this.f.senha !== this.f.senha2) { this.erro = "As duas senhas não são iguais."; return; }
      this.indo = true;
      try {
        await api.post("/auth/cadastro", this.f);
        location.hash = "#/confirmar?email=" + encodeURIComponent(this.f.email);
      } catch (e) { this.erro = e.message; }
      this.indo = false;
    },
  },
  template: `
  <div class="env" style="max-width:520px;padding-top:24px">
    <div class="cartao">
      <img :src="MARCA.hope" class="hope-hero pequeno" alt="Hope">
      <h1>Criar minha conta</h1>
      <p class="ajuda" style="margin-bottom:18px">
        Cada adulto tem um acesso próprio. As crianças são cadastradas dentro da família.
      </p>
      <div v-if="erro" class="aviso erro">{{ erro }}</div>
      <div v-if="familiaConvite && !jaCadastrado" class="aviso ok">
        Você foi convidado para a família <b>{{ familiaConvite.nome }}</b>.
      </div>
      <div v-if="jaCadastrado" class="aviso info">
        Este e-mail já tem conta. Entre normalmente e aceite o convite da família
        <b>{{ familiaConvite ? familiaConvite.nome : '' }}</b> na aba Minha família.
        <div style="margin-top:10px"><a class="btn azul mini" href="#/entrar">Ir para o login</a></div>
      </div>

      <div class="campo"><label>Seu nome completo</label><input v-model="f.nome"></div>
      <div class="campo"><label>E-mail</label>
        <input v-model="f.email" type="email" :disabled="!!familiaConvite"></div>
      <div class="dupla" style="margin-top:13px">
        <div><label>Telefone</label><input v-model="f.telefone" inputmode="tel" maxlength="15" placeholder="(00) 00000-0000"></div>
        <div><label>Sou</label>
          <select v-model="f.parentesco">
            <option value="">Escolher</option>
            <option>Mãe</option><option>Pai</option><option>Avó</option><option>Avô</option>
            <option>Tia</option><option>Tio</option><option>Responsável</option>
          </select></div>
      </div>
      <div class="dupla" style="margin-top:13px">
        <div><label>Senha</label><input v-model="f.senha" type="password"></div>
        <div><label>Repita a senha</label><input v-model="f.senha2" type="password"></div>
      </div>

      <template v-if="!familiaConvite">
        <hr style="border:0;border-top:2px dashed var(--linha);margin:22px 0">
        <div class="campo"><label>Nome da família</label>
          <input v-model="f.familia_nome" placeholder="Família Souza">
          <p class="ajuda">É assim que vocês aparecem na linha do tempo.</p></div>
        <div class="campo"><label>Foto da família (opcional)</label>
          <input type="file" accept="image/*" @change="foto">
          <img v-if="f.familia_foto" :src="f.familia_foto" class="retrato g" style="margin-top:10px"></div>
      </template>

      <div class="campo" style="margin-top:20px" v-if="!jaCadastrado">
        <button class="btn largo" :disabled="indo" @click="criar">
          {{ indo ? 'Enviando...' : 'Criar conta e receber o código' }}</button>
      </div>
      <p class="ajuda" style="text-align:center"><a href="#/entrar">Já tenho conta</a></p>
    </div>
  </div>`,
};

// ------------------------------------------------------------
window.Telas.confirmar = {
  data: () => ({ email: "", codigo: "", erro: "", ok: "", indo: false }),
  created() {
    this.email = new URLSearchParams(location.hash.split("?")[1] || "").get("email") || "";
  },
  methods: {
    async confirmar() {
      this.erro = ""; this.indo = true;
      try {
        const r = await api.post("/auth/confirmar", { email: this.email, codigo: this.codigo });
        Sessao.set(r.sessao); estado.usuario = r.usuario; location.hash = "#/familia";
      } catch (e) { this.erro = e.message; }
      this.indo = false;
    },
    async reenviar() {
      this.erro = ""; this.ok = "";
      try { await api.post("/auth/reenviar", { email: this.email }); this.ok = "Código novo enviado."; }
      catch (e) { this.erro = e.message; }
    },
  },
  template: `
  <div class="env" style="max-width:440px;padding-top:28px">
    <div class="cartao">
      <h1>Confirme seu e-mail</h1>
      <p class="ajuda" style="margin-bottom:18px">
        Enviamos um código de 6 números para <b>{{ email }}</b>. Cole ele aqui.
      </p>
      <div v-if="erro" class="aviso erro">{{ erro }}</div>
      <div v-if="ok" class="aviso ok">{{ ok }}</div>
      <div class="campo">
        <input v-model="codigo" class="codigo-input" maxlength="6" inputmode="numeric"
               placeholder="000000" @keyup.enter="confirmar">
      </div>
      <button class="btn largo" :disabled="indo || codigo.length < 6" @click="confirmar">
        {{ indo ? 'Conferindo...' : 'Confirmar' }}</button>
      <p class="ajuda" style="text-align:center;margin-top:16px">
        Não chegou? <a href="#" @click.prevent="reenviar">Enviar outro código</a>
      </p>
    </div>
  </div>`,
};

// ------------------------------------------------------------
window.Telas.esqueci = {
  data: () => ({ etapa: 1, email: "", codigo: "", senha: "", erro: "", indo: false }),
  methods: {
    async pedir() {
      this.erro = ""; this.indo = true;
      try { await api.post("/auth/esqueci", { email: this.email }); this.etapa = 2; }
      catch (e) { this.erro = e.message; }
      this.indo = false;
    },
    async trocar() {
      this.erro = ""; this.indo = true;
      try {
        await api.post("/auth/redefinir", { email: this.email, codigo: this.codigo, senha: this.senha });
        this.etapa = 3;
      } catch (e) { this.erro = e.message; }
      this.indo = false;
    },
  },
  template: `
  <div class="env" style="max-width:440px;padding-top:28px">
    <div class="cartao">
      <h1>Nova senha</h1>
      <div v-if="erro" class="aviso erro">{{ erro }}</div>

      <template v-if="etapa === 1">
        <p class="ajuda" style="margin-bottom:18px">Digite seu e-mail e enviamos um código.</p>
        <div class="campo"><input v-model="email" type="email" placeholder="seu@email.com"></div>
        <button class="btn largo" :disabled="indo" @click="pedir">Enviar código</button>
      </template>

      <template v-else-if="etapa === 2">
        <p class="ajuda" style="margin-bottom:18px">Cole o código que chegou em {{ email }}.</p>
        <div class="campo"><input v-model="codigo" class="codigo-input" maxlength="6" placeholder="000000"></div>
        <div class="campo"><label>Senha nova</label><input v-model="senha" type="password"></div>
        <button class="btn largo" :disabled="indo" @click="trocar">Salvar senha nova</button>
      </template>

      <template v-else>
        <div class="aviso ok">Senha trocada. Agora é só entrar.</div>
        <a class="btn largo azul" href="#/entrar">Ir para o login</a>
      </template>
    </div>
  </div>`,
};
})();
