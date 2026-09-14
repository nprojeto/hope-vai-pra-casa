(function () {
// ============================================================
// Painel da escola (admin)
// ============================================================
const { estado: Es, api: Ap, lerImagem: lerIm, dataBR: brD } = window.App;
window.Telas = window.Telas || {};

window.Telas.escola = {
  data: () => ({
    secao: "aprovacoes",
    erro: "", ok: "", carregando: false,
    resumo: {}, usuarios: [], turmas: [], turnos: [],
    hopes: [], criancas: [], visitas: [],
    novaTurma: "", novoTurno: "",
    novoHope: { nome: "", turma_id: "", turno_id: "", foto: null },
    novaVisita: { hope_id: "", crianca_id: "", data_inicio: "", data_fim: "", observacao: "", avisar: true },
    filtroTurma: "",
  }),
  computed: {
    MARCA() { return window.MARCA; },
    turmasG() { return Es.turmas; },
    criancasFiltradas() {
      return this.filtroTurma ? this.criancas.filter((c) => c.turma_id === this.filtroTurma) : this.criancas;
    },
    hopeEscolhido() { return this.hopes.find((h) => h.id === this.novaVisita.hope_id) || null; },
    criancasDoHope() {
      const h = this.hopeEscolhido;
      if (!h) return [];
      return this.criancas.filter((c) =>
        (!h.turma_id || c.turma_id === h.turma_id) &&
        (!h.turno_id || c.turno_id === h.turno_id));
    },
    pendentes() { return this.usuarios.filter((u) => !u.aprovado && u.email_confirmado); },
    aprovados() { return this.usuarios.filter((u) => u.aprovado); },
  },
  watch: { "novaVisita.hope_id"() { this.novaVisita.crianca_id = ""; } },
  async created() { await this.tudo(); },
  methods: {
    brD,
    async tudo() {
      this.carregando = true;
      try {
        const [re, us, tm, tn, hp, cr, vi] = await Promise.all([
          Ap.get("/admin/resumo"), Ap.get("/admin/usuarios"),
          Ap.get("/admin/turmas"), Ap.get("/admin/turnos"),
          Ap.get("/admin/hopes"), Ap.get("/admin/criancas"), Ap.get("/admin/visitas"),
        ]);
        this.resumo = re; this.usuarios = us; this.turmas = tm; this.turnos = tn;
        this.hopes = hp; this.criancas = cr; this.visitas = vi;
      } catch (e) { this.erro = e.message; }
      this.carregando = false;
    },
    aviso(msg) { this.ok = msg; setTimeout(() => (this.ok = ""), 3500); },

    async aprovar(u, valor) {
      try { await Ap.post("/admin/aprovar", { usuario_id: u.id, aprovado: valor });
        await this.tudo(); this.aviso(valor ? "Cadastro aprovado." : "Aprovação retirada."); }
      catch (e) { this.erro = e.message; }
    },
    async tornarAdmin(u) {
      if (!confirm("Dar acesso de administrador para " + u.nome + "?")) return;
      await Ap.post("/admin/usuario-papel", { usuario_id: u.id, papel: "admin" });
      await this.tudo();
    },

    async addTurma() {
      if (!this.novaTurma.trim()) return;
      try { await Ap.post("/admin/turmas", { nome: this.novaTurma, ordem: this.turmas.length + 1 });
        this.novaTurma = ""; await this.tudo(); await Ap.carregarListas(); }
      catch (e) { this.erro = e.message; }
    },
    async addTurno() {
      if (!this.novoTurno.trim()) return;
      try { await Ap.post("/admin/turnos", { nome: this.novoTurno, ordem: this.turnos.length + 1 });
        this.novoTurno = ""; await this.tudo(); await Ap.carregarListas(); }
      catch (e) { this.erro = e.message; }
    },
    async excluir(tipo, item) {
      if (!confirm("Excluir " + item.nome + "?")) return;
      await Ap.del("/admin/" + tipo + "/" + item.id);
      await this.tudo(); await Ap.carregarListas();
    },

    async fotoHope(ev) {
      try { this.novoHope.foto = await lerIm(ev.target.files[0], 800); }
      catch (e) { this.erro = e.message; }
    },
    async addHope() {
      try { await Ap.post("/admin/hopes", this.novoHope);
        this.novoHope = { nome: "", turma_id: "", turno_id: "", foto: null };
        await this.tudo(); this.aviso("Hope cadastrado."); }
      catch (e) { this.erro = e.message; }
    },
    async excluirHope(h) {
      if (!confirm("Excluir o " + h.nome + "? As visitas dele também somem.")) return;
      await Ap.del("/admin/hopes/" + h.id); await this.tudo();
    },

    async agendar() {
      this.erro = "";
      try { await Ap.post("/admin/visitas", this.novaVisita);
        this.novaVisita = { hope_id: "", crianca_id: "", data_inicio: "", data_fim: "", observacao: "", avisar: true };
        await this.tudo(); this.aviso("Visita agendada e senha gerada."); }
      catch (e) { this.erro = e.message; }
    },
    async reenviarSenha(v) {
      try { await Ap.post("/admin/visitas/" + v.id + "/reenviar", {}); this.aviso("Senha reenviada por e-mail."); }
      catch (e) { this.erro = e.message; }
    },
    async novaSenha(v) {
      await Ap.put("/admin/visitas/" + v.id, { nova_senha: true });
      await this.tudo(); this.aviso("Senha trocada.");
    },
    async concluir(v) {
      await Ap.put("/admin/visitas/" + v.id, { status: "concluida" });
      await this.tudo();
    },
    async excluirVisita(v) {
      if (!confirm("Excluir esta visita?")) return;
      await Ap.del("/admin/visitas/" + v.id); await this.tudo();
    },
  },
  template: `
  <div class="env" style="padding-top:22px">
    <div v-if="erro" class="aviso erro">{{ erro }}</div>
    <div v-if="ok" class="aviso ok">{{ ok }}</div>

    <div class="chips">
      <button class="chip" :class="{on: secao==='aprovacoes'}" @click="secao='aprovacoes'">
        Aprovações<template v-if="pendentes.length"> ({{ pendentes.length }})</template></button>
      <button class="chip" :class="{on: secao==='visitas'}" @click="secao='visitas'">Visitas do Hope</button>
      <button class="chip" :class="{on: secao==='hopes'}" @click="secao='hopes'">Mascotes</button>
      <button class="chip" :class="{on: secao==='turmas'}" @click="secao='turmas'">Turmas e turnos</button>
      <button class="chip" :class="{on: secao==='criancas'}" @click="secao='criancas'">Crianças</button>
    </div>

    <!-- APROVAÇÕES -->
    <template v-if="secao === 'aprovacoes'">
      <div class="cartao">
        <h2>Esperando aprovação</h2>
        <p class="ajuda">Enquanto não são aprovados, esses adultos só veem os próprios cadastros.</p>
        <div v-if="!pendentes.length" class="vazio"><span class="emoji">✅</span>Nada pendente.</div>
        <div class="item" v-for="u in pendentes" :key="u.id">
          <img class="retrato" :src="u.foto_url || 'assets/adulto.svg'">
          <div class="cresce">
            <div class="titulo">{{ u.nome }}</div>
            <div class="sub">{{ u.email }} · {{ u.familias ? u.familias.nome : 'Sem família' }}
              <span v-if="u.parentesco === 'Administrador'" class="fita amarelo">Pediu acesso de admin</span>
            </div>
          </div>
          <div class="acoes">
            <button class="btn verde mini" @click="aprovar(u, true)">Aprovar</button>
            <button class="btn risco mini" v-if="u.parentesco === 'Administrador'"
                    @click="tornarAdmin(u)">Tornar admin</button>
          </div>
        </div>
      </div>
      <div class="cartao">
        <h2>Já aprovados</h2>
        <div class="item" v-for="u in aprovados" :key="u.id">
          <img class="retrato" :src="u.foto_url || 'assets/adulto.svg'">
          <div class="cresce">
            <div class="titulo">{{ u.nome }} <span v-if="u.papel==='admin'" class="fita azul">Admin</span></div>
            <div class="sub">{{ u.email }} · {{ u.familias ? u.familias.nome : '—' }}</div>
          </div>
          <div class="acoes">
            <button v-if="u.papel!=='admin'" class="btn risco mini" @click="tornarAdmin(u)">Tornar admin</button>
            <button class="btn risco mini" @click="aprovar(u, false)">Retirar</button>
          </div>
        </div>
      </div>
    </template>

    <!-- VISITAS -->
    <template v-if="secao === 'visitas'">
      <div class="cartao">
        <h2>Agendar uma visita</h2>
        <div class="dupla">
          <div><label>Hope</label>
            <select v-model="novaVisita.hope_id"><option value="">Escolher</option>
              <option v-for="h in hopes" :value="h.id">
                {{ h.nome }} — {{ h.turmas ? h.turmas.nome : 'sem turma' }} / {{ h.turnos ? h.turnos.nome : '—' }}
              </option></select></div>
          <div><label>Criança</label>
            <select v-model="novaVisita.crianca_id" :disabled="!hopeEscolhido">
              <option value="">{{ hopeEscolhido ? 'Escolher' : 'Escolha o Hope primeiro' }}</option>
              <option v-for="c in criancasDoHope" :value="c.id">
                {{ c.nome }} — {{ c.turnos ? c.turnos.nome : '' }}
              </option></select>
            <p v-if="hopeEscolhido && !criancasDoHope.length" class="ajuda">
              Nenhuma criança cadastrada nessa turma e turno ainda.</p></div>
        </div>
        <div class="dupla" style="margin-top:13px">
          <div><label>Primeiro dia</label><input v-model="novaVisita.data_inicio" type="date"></div>
          <div><label>Último dia</label><input v-model="novaVisita.data_fim" type="date"></div>
        </div>
        <div class="campo"><label>Observação (opcional)</label><input v-model="novaVisita.observacao"></div>
        <label style="margin-top:13px;font-weight:600">
          <input type="checkbox" v-model="novaVisita.avisar" style="width:auto;margin-right:8px">
          Avisar a família por e-mail com a senha
        </label>
        <div style="margin-top:16px"><button class="btn" @click="agendar">Agendar e gerar senha</button></div>
      </div>

      <div class="cartao">
        <h2>Visitas</h2>
        <div v-if="!visitas.length" class="vazio"><span class="emoji">📅</span>Nenhuma visita agendada.</div>
        <div class="item" v-for="v in visitas" :key="v.id">
          <img class="retrato" :src="v.criancas && v.criancas.foto_url || 'assets/crianca.svg'">
          <div class="cresce">
            <div class="titulo">{{ v.criancas ? v.criancas.nome : '—' }}
              <span class="fita" :class="v.status==='concluida' ? 'verde' : 'amarelo'">{{ v.status }}</span></div>
            <div class="sub">{{ v.hopes ? v.hopes.nome : 'Hope' }} ·
              {{ brD(v.data_inicio) }} a {{ brD(v.data_fim) }} · senha <b>{{ v.senha }}</b></div>
          </div>
          <div class="acoes">
            <button class="btn risco mini" @click="reenviarSenha(v)">Reenviar</button>
            <button class="btn risco mini" @click="novaSenha(v)">Nova senha</button>
            <button class="btn risco mini" v-if="v.status!=='concluida'" @click="concluir(v)">Concluir</button>
            <button class="btn risco mini" @click="excluirVisita(v)">Excluir</button>
          </div>
        </div>
      </div>
    </template>

    <!-- MASCOTES -->
    <template v-if="secao === 'hopes'">
      <div class="cartao">
        <h2>Cadastrar um Hope</h2>
        <p class="ajuda">A escola pode ter um Hope para cada turma e turno.</p>
        <div class="campo"><label>Nome</label><input v-model="novoHope.nome" placeholder="Hope do Jardim I Tarde"></div>
        <div class="dupla" style="margin-top:13px">
          <div><label>Turma</label>
            <select v-model="novoHope.turma_id"><option value="">Escolher</option>
              <option v-for="t in turmas" :value="t.id">{{ t.nome }}</option></select></div>
          <div><label>Turno</label>
            <select v-model="novoHope.turno_id"><option value="">Escolher</option>
              <option v-for="t in turnos" :value="t.id">{{ t.nome }}</option></select></div>
        </div>
        <div class="campo"><label>Foto (opcional)</label><input type="file" accept="image/*" @change="fotoHope"></div>
        <div style="margin-top:16px"><button class="btn" @click="addHope">Cadastrar Hope</button></div>
      </div>
      <div class="cartao">
        <h2>Mascotes cadastrados</h2>
        <div v-if="!hopes.length" class="vazio"><span class="emoji">🐑</span>Nenhum Hope cadastrado ainda.</div>
        <div class="item" v-for="h in hopes" :key="h.id">
          <img class="retrato mascote" :src="h.foto_url || MARCA.hope">
          <div class="cresce">
            <div class="titulo">{{ h.nome }}</div>
            <div class="sub">{{ h.turmas ? h.turmas.nome : 'Sem turma' }} · {{ h.turnos ? h.turnos.nome : 'Sem turno' }}</div>
          </div>
          <button class="btn risco mini" @click="excluirHope(h)">Excluir</button>
        </div>
      </div>
    </template>

    <!-- TURMAS E TURNOS -->
    <template v-if="secao === 'turmas'">
      <div class="cartao">
        <h2>Turmas</h2>
        <div style="display:flex;gap:9px;flex-wrap:wrap">
          <input v-model="novaTurma" placeholder="Nome da turma" style="flex:1;min-width:200px" @keyup.enter="addTurma">
          <button class="btn" @click="addTurma">Incluir</button>
        </div>
        <div class="item" v-for="t in turmas" :key="t.id">
          <div class="cresce"><div class="titulo">{{ t.nome }}</div>
            <div class="sub">{{ t.ativo ? 'Ativa' : 'Desativada' }}</div></div>
          <button class="btn risco mini" @click="excluir('turmas', t)">Excluir</button>
        </div>
      </div>
      <div class="cartao">
        <h2>Turnos</h2>
        <div style="display:flex;gap:9px;flex-wrap:wrap">
          <input v-model="novoTurno" placeholder="Nome do turno" style="flex:1;min-width:200px" @keyup.enter="addTurno">
          <button class="btn" @click="addTurno">Incluir</button>
        </div>
        <div class="item" v-for="t in turnos" :key="t.id">
          <div class="cresce"><div class="titulo">{{ t.nome }}</div>
            <div class="sub">{{ t.ativo ? 'Ativo' : 'Desativado' }}</div></div>
          <button class="btn risco mini" @click="excluir('turnos', t)">Excluir</button>
        </div>
      </div>
    </template>

    <!-- CRIANÇAS -->
    <template v-if="secao === 'criancas'">
      <div class="cartao">
        <h2>Crianças cadastradas</h2>
        <div class="chips">
          <button class="chip" :class="{on: !filtroTurma}" @click="filtroTurma=''">Todas</button>
          <button class="chip" v-for="t in turmas" :key="t.id"
                  :class="{on: filtroTurma===t.id}" @click="filtroTurma=t.id">{{ t.nome }}</button>
        </div>
        <div v-if="!criancasFiltradas.length" class="vazio"><span class="emoji">🧒</span>Nenhuma criança nesta turma.</div>
        <div class="item" v-for="c in criancasFiltradas" :key="c.id">
          <img class="retrato" :src="c.foto_url || 'assets/crianca.svg'">
          <div class="cresce">
            <div class="titulo">{{ c.nome }}</div>
            <div class="sub">{{ c.turmas ? c.turmas.nome : '—' }} · {{ c.turnos ? c.turnos.nome : '—' }}
              · {{ c.familias ? c.familias.nome : '—' }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>`,
};
})();
