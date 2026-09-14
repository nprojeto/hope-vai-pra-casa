(function () {
// ============================================================
// Minha família: dados, adultos, convite e crianças
// ============================================================
const { estado: E, api: A, lerImagem: lerImg, dataBR: dBR } = window.App;
window.Telas = window.Telas || {};

window.Telas.familia = {
  data: () => ({
    erro: "", ok: "", emailConvite: "", linkConvite: "",
    nova: { nome: "", data_nascimento: "", turma_id: "", turno_id: "", foto: null },
    editando: null, abrindoCrianca: false,
  }),
  computed: {
    eu() { return E.usuario; },
    familia() { return E.usuario && E.usuario.familia; },
    turmas() { return E.turmas; },
    turnos() { return E.turnos; },
  },
  methods: {
    dBR,
    async fotoFamilia(ev) {
      try {
        const foto = await lerImg(ev.target.files[0], 800);
        E.usuario = await A.put("/familia", { foto });
        this.ok = "Foto da família atualizada.";
      } catch (e) { this.erro = e.message; }
    },
    async fotoCrianca(ev) {
      try { this.nova.foto = await lerImg(ev.target.files[0], 800); }
      catch (e) { this.erro = e.message; }
    },
    async salvarCrianca() {
      this.erro = "";
      try {
        if (this.editando) await A.put("/criancas/" + this.editando, this.nova);
        else await A.post("/criancas", this.nova);
        await A.carregarUsuario();
        this.fecharForm();
        this.ok = "Cadastro da criança salvo.";
      } catch (e) { this.erro = e.message; }
    },
    editar(c) {
      this.editando = c.id;
      this.nova = {
        nome: c.nome, data_nascimento: c.data_nascimento || "",
        turma_id: c.turma_id || "", turno_id: c.turno_id || "", foto: null,
      };
      this.abrindoCrianca = true;
    },
    fecharForm() {
      this.abrindoCrianca = false; this.editando = null;
      this.nova = { nome: "", data_nascimento: "", turma_id: "", turno_id: "", foto: null };
    },
    async remover(c) {
      if (!confirm("Remover " + c.nome + " da família?")) return;
      await A.del("/criancas/" + c.id);
      await A.carregarUsuario();
    },
    async convidar() {
      this.erro = ""; this.ok = ""; this.linkConvite = "";
      try {
        const r = await A.post("/familia/convite", { email: this.emailConvite });
        this.linkConvite = r.link; this.emailConvite = "";
        this.ok = "Convite enviado por e-mail.";
      } catch (e) { this.erro = e.message; }
    },
  },
  template: `
  <div class="env" style="padding-top:22px">
    <div v-if="erro" class="aviso erro">{{ erro }}</div>
    <div v-if="ok" class="aviso ok">{{ ok }}</div>

    <div v-if="!eu.aprovado && eu.papel !== 'admin'" class="aviso info">
      Seu cadastro está esperando a aprovação da escola. Enquanto isso você pode completar os dados
      da família e das crianças. A linha do tempo abre assim que a escola liberar.
    </div>

    <div class="cartao">
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <img class="retrato g" :src="familia && familia.foto_url || 'assets/familia.svg'">
        <div style="flex:1;min-width:180px">
          <h2 style="margin:0">{{ familia ? familia.nome : 'Sem família' }}</h2>
          <p class="ajuda" style="margin:2px 0 0">{{ eu.membros.length }} adulto(s) · {{ eu.criancas.length }} criança(s)</p>
        </div>
        <label class="btn claro mini" style="cursor:pointer">
          Trocar foto<input type="file" accept="image/*" hidden @change="fotoFamilia">
        </label>
      </div>
    </div>

    <div class="cartao">
      <h2>Adultos da família</h2>
      <p class="ajuda">Todos os adultos aqui podem ver a linha do tempo depois de aprovados.</p>
      <div class="item" v-for="m in eu.membros" :key="m.id">
        <img class="retrato" :src="m.foto_url || 'assets/adulto.svg'">
        <div class="cresce">
          <div class="titulo">{{ m.nome }}</div>
          <div class="sub">{{ m.parentesco || 'Responsável' }} · {{ m.email }}</div>
        </div>
        <span class="fita" :class="m.aprovado ? 'verde' : 'amarelo'">
          {{ m.aprovado ? 'Aprovado' : 'Em análise' }}</span>
      </div>
      <hr style="border:0;border-top:2px dashed var(--linha);margin:16px 0">
      <label>Convidar outro adulto</label>
      <div style="display:flex;gap:9px;flex-wrap:wrap">
        <input v-model="emailConvite" type="email" placeholder="email@exemplo.com" style="flex:1;min-width:200px">
        <button class="btn verde" @click="convidar">Enviar convite</button>
      </div>
      <p v-if="linkConvite" class="ajuda">Link do convite: <a :href="linkConvite">{{ linkConvite }}</a></p>
    </div>

    <div class="cartao">
      <div style="display:flex;align-items:center;gap:10px">
        <h2 style="margin:0;flex:1">Crianças</h2>
        <button class="btn mini" v-if="!abrindoCrianca" @click="abrindoCrianca = true">Adicionar criança</button>
      </div>

      <div v-if="abrindoCrianca" style="margin-top:16px;padding:16px;background:#FBF6EA;border-radius:16px">
        <div class="campo"><label>Nome da criança</label><input v-model="nova.nome"></div>
        <div class="dupla" style="margin-top:13px">
          <div><label>Data de nascimento</label><input v-model="nova.data_nascimento" type="date"></div>
          <div><label>Turma</label>
            <select v-model="nova.turma_id"><option value="">Escolher</option>
              <option v-for="t in turmas" :value="t.id">{{ t.nome }}</option></select></div>
        </div>
        <div class="dupla" style="margin-top:13px">
          <div><label>Turno</label>
            <select v-model="nova.turno_id"><option value="">Escolher</option>
              <option v-for="t in turnos" :value="t.id">{{ t.nome }}</option></select></div>
          <div><label>Foto (opcional)</label><input type="file" accept="image/*" @change="fotoCrianca"></div>
        </div>
        <div class="acoes" style="margin-top:16px">
          <button class="btn" @click="salvarCrianca">Salvar</button>
          <button class="btn risco" @click="fecharForm">Cancelar</button>
        </div>
      </div>

      <div v-if="!eu.criancas.length && !abrindoCrianca" class="vazio">
        <span class="emoji">🧸</span>Cadastre as crianças para que a escola possa agendar o Hope.
      </div>
      <div class="item" v-for="c in eu.criancas" :key="c.id">
        <img class="retrato" :src="c.foto_url || 'assets/crianca.svg'">
        <div class="cresce">
          <div class="titulo">{{ c.nome }}</div>
          <div class="sub">
            {{ c.turmas ? c.turmas.nome : 'Sem turma' }} ·
            {{ c.turnos ? c.turnos.nome : 'Sem turno' }}
            <template v-if="c.data_nascimento"> · {{ dBR(c.data_nascimento) }}</template>
          </div>
        </div>
        <div class="acoes">
          <button class="btn risco mini" @click="editar(c)">Editar</button>
          <button class="btn risco mini" @click="remover(c)">Remover</button>
        </div>
      </div>
    </div>
  </div>`,
};
})();
