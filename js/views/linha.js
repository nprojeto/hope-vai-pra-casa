(function () {
// ============================================================
// Linha do tempo + registro do dia com o Hope
// ============================================================
const { estado: St, api: Api, lerImagem: lerFoto, dataBR: brData } = window.App;
window.Telas = window.Telas || {};

window.Telas.linha = {
  data: () => ({
    registros: [], bloqueado: false, motivo: "", carregando: true,
    visitas: [], erro: "", ok: "",
    senhaDigitada: {}, escrevendo: null,
    form: { texto: "", palavra_ingles: "", palavra_traducao: "", data: "", fotos: [] },
    turmaFiltro: "",
  }),
  computed: {
    eu() { return St.usuario; },
    admin() { return St.usuario && St.usuario.papel === "admin"; },
    turmas() { return St.turmas; },
    visitasAtivas() { return this.visitas.filter((v) => v.ativa); },
    lista() {
      if (!this.turmaFiltro) return this.registros;
      return this.registros.filter((r) => r.turma_id === this.turmaFiltro);
    },
  },
  async created() { await this.recarregar(); },
  methods: {
    brData,
    async recarregar() {
      this.carregando = true;
      try {
        const t = await Api.get("/timeline");
        if (t.bloqueado) { this.bloqueado = true; this.motivo = t.motivo; }
        else { this.bloqueado = false; this.registros = t.registros || []; }
        this.visitas = await Api.get("/visitas/minhas");
      } catch (e) { this.erro = e.message; }
      this.carregando = false;
    },
    async liberar(v) {
      this.erro = "";
      try {
        await Api.post("/visitas/" + v.id + "/senha", { senha: this.senhaDigitada[v.id] || "" });
        await this.recarregar();
        this.ok = "Senha aceita! Agora você pode escrever o registro.";
      } catch (e) { this.erro = e.message; }
    },
    abrir(v) {
      this.escrevendo = v;
      this.form = {
        texto: "", palavra_ingles: "", palavra_traducao: "",
        data: new Date().toISOString().slice(0, 10), fotos: [],
      };
    },
    async addFotos(ev) {
      for (const arq of [...ev.target.files].slice(0, 6 - this.form.fotos.length)) {
        try { this.form.fotos.push({ base64: await lerFoto(arq), legenda: "" }); }
        catch (e) { this.erro = e.message; }
      }
      ev.target.value = "";
    },
    async salvar() {
      this.erro = "";
      try {
        await Api.post("/registros", { visita_id: this.escrevendo.id, ...this.form });
        this.escrevendo = null;
        this.ok = "Registro guardado na linha do tempo.";
        await this.recarregar();
      } catch (e) { this.erro = e.message; }
    },
    async apagar(r) {
      if (!confirm("Apagar este registro?")) return;
      await Api.del("/registros/" + r.id);
      await this.recarregar();
    },
    fotosOrdenadas(r) {
      return [...(r.registro_fotos || [])].sort((a, b) => a.ordem - b.ordem);
    },
  },
  template: `
  <div class="env" style="padding-top:22px">
    <div v-if="erro" class="aviso erro">{{ erro }}</div>
    <div v-if="ok" class="aviso ok">{{ ok }}</div>

    <!-- Visitas da família -->
    <div v-for="v in visitasAtivas" :key="v.id" class="cartao" style="border-color:var(--amarelo)">
      <h2>O Hope está com {{ v.criancas.nome }}</h2>
      <p class="ajuda">De {{ brData(v.data_inicio) }} até {{ brData(v.data_fim) }}.
        Devolva o Hope à escola no dia combinado.</p>

      <div v-if="!v.liberada" class="senha-caixa" style="text-align:left">
        <label>Senha desta visita</label>
        <div style="display:flex;gap:9px;flex-wrap:wrap">
          <input v-model="senhaDigitada[v.id]" maxlength="6" placeholder="ABC123"
                 style="flex:1;min-width:160px;text-transform:uppercase">
          <button class="btn" @click="liberar(v)">Liberar registro</button>
        </div>
        <p class="ajuda">A escola entregou essa senha junto com o Hope. Ela vale só nestes dias.</p>
      </div>
      <button v-else class="btn verde" @click="abrir(v)">Escrever o registro de hoje</button>
    </div>

    <!-- Formulário de registro -->
    <div v-if="escrevendo" class="cartao" style="border-color:var(--verde)">
      <h2>Registro do meu dia com o Hope</h2>
      <div class="dupla">
        <div><label>Criança</label><input :value="escrevendo.criancas.nome" disabled></div>
        <div><label>Data</label><input v-model="form.data" type="date"></div>
      </div>
      <div class="campo" style="margin-top:13px">
        <label>Registro escrito</label>
        <textarea v-model="form.texto" placeholder="Conte o que vocês fizeram junto com o Hope..."></textarea>
      </div>
      <div class="dupla" style="margin-top:13px">
        <div><label>Palavra em inglês que aprendi</label>
          <input v-model="form.palavra_ingles" placeholder="Water melon"></div>
        <div><label>O que significa</label>
          <input v-model="form.palavra_traducao" placeholder="Melancia"></div>
      </div>
      <div class="campo" style="margin-top:13px">
        <label>Registro fotográfico (até 6 fotos)</label>
        <input type="file" accept="image/*" multiple @change="addFotos">
      </div>
      <div v-if="form.fotos.length" class="painel-fotos" style="margin-top:13px">
        <figure v-for="(f,i) in form.fotos" :key="i">
          <img :src="f.base64">
          <input v-model="f.legenda" placeholder="Legenda" style="margin-top:6px;padding:6px 10px;font-size:.8rem">
        </figure>
      </div>
      <div class="acoes" style="margin-top:18px">
        <button class="btn verde" @click="salvar">Guardar registro</button>
        <button class="btn risco" @click="escrevendo = null">Cancelar</button>
      </div>
    </div>

    <!-- Bloqueio -->
    <div v-if="bloqueado" class="cartao vazio">
      <span class="emoji">🔒</span>
      <h2>{{ motivo }}</h2>
      <p class="ajuda">Assim que a escola aprovar, a linha do tempo aparece aqui.</p>
      <a class="btn azul" href="#/familia">Completar meu cadastro</a>
    </div>

    <template v-else>
      <div v-if="admin && turmas.length" class="chips">
        <button class="chip" :class="{on: !turmaFiltro}" @click="turmaFiltro = ''">Todas as turmas</button>
        <button class="chip" v-for="t in turmas" :key="t.id"
                :class="{on: turmaFiltro === t.id}" @click="turmaFiltro = t.id">{{ t.nome }}</button>
      </div>

      <div v-if="carregando" class="carregando">Carregando a linha do tempo...</div>

      <div v-else-if="!lista.length" class="cartao vazio">
        <span class="emoji">🐑</span>
        <h2>Ainda não há registros</h2>
        <p class="ajuda">Quando o Hope visitar a primeira casa, as histórias aparecem aqui.</p>
      </div>

      <article v-for="r in lista" :key="r.id" class="ficha">
        <div class="ficha-topo">
          <span class="nome">{{ r.criancas ? r.criancas.nome : 'Criança' }}</span>
          <span class="fita azul" v-if="r.turmas">{{ r.turmas.nome }}</span>
          <span class="fita" v-if="r.turnos">{{ r.turnos.nome }}</span>
          <span class="data">{{ brData(r.data) }}</span>
        </div>
        <div class="ficha-corpo">
          <div>
            <p class="rotulo verde">Registro fotográfico</p>
            <div v-if="fotosOrdenadas(r).length" class="painel-fotos">
              <figure v-for="f in fotosOrdenadas(r)" :key="f.url">
                <img :src="f.url" loading="lazy">
                <figcaption v-if="f.legenda">{{ f.legenda }}</figcaption>
              </figure>
            </div>
            <p v-else class="ajuda">Sem fotos neste dia.</p>
          </div>
          <div>
            <p class="rotulo coral">Registro escrito</p>
            <div class="escrito">{{ r.texto }}</div>
          </div>
        </div>
        <div class="palavra" v-if="r.palavra_ingles">
          <span class="rotulo">Palavra em inglês que aprendi:</span>
          <b>{{ r.palavra_ingles }}</b>
          <span v-if="r.palavra_traducao" class="ajuda" style="margin:0">({{ r.palavra_traducao }})</span>
        </div>
        <div class="acoes" v-if="admin" style="margin-top:14px">
          <span class="fita" v-if="r.editado_por_admin">Editado pela escola</span>
          <button class="btn risco mini" @click="apagar(r)">Apagar</button>
        </div>
      </article>
    </template>
  </div>`,
};
})();
