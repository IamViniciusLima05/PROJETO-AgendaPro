/* AgendaPro — calendário mensal com compromissos salvos no localStorage */

const CHAVE = 'agendapro_eventos';
const $ = (s) => document.querySelector(s);
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const deIso = (k) => { const [a, m, d] = k.split('-').map(Number); return new Date(a, m - 1, d); };
const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const CATEGORIAS = [
  { id: 'trabalho', nome: 'Trabalho', cor: '#0f5c5a' },
  { id: 'reuniao', nome: 'Reunião', cor: '#2563eb' },
  { id: 'pessoal', nome: 'Pessoal', cor: '#d97706' },
  { id: 'saude', nome: 'Saúde', cor: '#dc2626' },
  { id: 'estudo', nome: 'Estudo', cor: '#7c3aed' }
];
const corDe = (id) => (CATEGORIAS.find((c) => c.id === id) || CATEGORIAS[0]).cor;

const banco = {
  ler() { try { return JSON.parse(localStorage.getItem(CHAVE)); } catch { return null; } },
  salvar(v) { try { localStorage.setItem(CHAVE, JSON.stringify(v)); } catch { /* sem storage */ } }
};

// Exemplos na primeira visita, espalhados pela semana atual
function exemplos() {
  const h = new Date(); const d = (n) => iso(new Date(h.getFullYear(), h.getMonth(), h.getDate() + n));
  return [
    { id: 1, titulo: 'Reunião de alinhamento', data: d(0), inicio: '09:30', fim: '10:30', cat: 'reuniao', local: 'Google Meet', obs: '' },
    { id: 2, titulo: 'Entrega do site do cliente', data: d(2), inicio: '14:00', fim: '', cat: 'trabalho', local: '', obs: 'Enviar link e acessos' },
    { id: 3, titulo: 'Academia', data: d(1), inicio: '18:30', fim: '19:30', cat: 'saude', local: '', obs: '' },
    { id: 4, titulo: 'Aula da faculdade', data: d(3), inicio: '19:00', fim: '22:00', cat: 'estudo', local: 'Campus', obs: '' },
    { id: 5, titulo: 'Almoço em família', data: d(5), inicio: '12:00', fim: '14:00', cat: 'pessoal', local: '', obs: '' }
  ];
}

let eventos = banco.ler() ?? exemplos();
banco.salvar(eventos);

const hoje = new Date();
let mesVisivel = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
let selecionado = iso(hoje);
let editando = null;

const doDia = (k) => eventos.filter((e) => e.data === k).sort((a, b) => a.inicio.localeCompare(b.inicio));

function renderGrade() {
  const nomeMes = mesVisivel.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(' de ', ' ');
  $('#titulo-mes').textContent = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
  const inicio = new Date(mesVisivel); inicio.setDate(1 - inicio.getDay());
  const semanas = Math.ceil((mesVisivel.getDay() + new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + 1, 0).getDate()) / 7);
  let html = '';
  for (let i = 0; i < semanas * 7; i++) {
    const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
    const k = iso(d);
    const lista = doDia(k);
    const classes = ['dia', d.getMonth() !== mesVisivel.getMonth() && 'fora', k === iso(hoje) && 'hoje', k === selecionado && 'selecionado'].filter(Boolean).join(' ');
    html += `<button class="${classes}" data-dia="${k}" role="gridcell" aria-label="${d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}, ${lista.length} compromisso(s)">
      <span class="n">${d.getDate()}</span>
      ${lista.slice(0, 2).map((e) => `<span class="chip" style="--cor:${corDe(e.cat)}">${e.inicio} ${escapar(e.titulo)}</span>`).join('')}
      ${lista.length > 2 ? `<span class="mais">+${lista.length - 2} mais</span>` : ''}
      ${lista.length ? `<span class="pontos">${lista.slice(0, 3).map((e) => `<i style="--cor:${corDe(e.cat)}"></i>`).join('')}</span>` : ''}
    </button>`;
  }
  $('#grade').innerHTML = html;
}

function renderLateral() {
  const d = deIso(selecionado);
  $('#dia-semana').textContent = selecionado === iso(hoje) ? 'Hoje' : d.toLocaleDateString('pt-BR', { weekday: 'long' });
  $('#dia-titulo').textContent = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  const lista = doDia(selecionado);
  $('#eventos').innerHTML = lista.length ? lista.map((e) => `
    <li><button class="evento" data-id="${e.id}" style="--cor:${corDe(e.cat)}">
      <i></i>
      <span><b>${escapar(e.titulo)}</b><small>${e.inicio}${e.fim ? ` – ${e.fim}` : ''}${e.local ? ` · ${escapar(e.local)}` : ''}</small>${e.obs ? `<small>${escapar(e.obs)}</small>` : ''}</span>
    </button></li>`).join('') : '<li class="vazio">Dia livre. Clique em “+ Compromisso” para agendar.</li>';

  const fim = iso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 7));
  const prox = eventos.filter((e) => e.data >= iso(hoje) && e.data <= fim).sort((a, b) => (a.data + a.inicio).localeCompare(b.data + b.inicio)).slice(0, 6);
  $('#proximos').innerHTML = prox.length ? prox.map((e) => `<li><span>${e.data === iso(hoje) ? 'Hoje' : deIso(e.data).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }).replace('.', '')}</span><b>${e.inicio} ${escapar(e.titulo)}</b></li>`).join('') : '<li>Nada nos próximos dias.</li>';
}

const render = () => { renderGrade(); renderLateral(); };

// Navegação
$('#ant').addEventListener('click', () => { mesVisivel.setMonth(mesVisivel.getMonth() - 1); renderGrade(); });
$('#prox').addEventListener('click', () => { mesVisivel.setMonth(mesVisivel.getMonth() + 1); renderGrade(); });
$('#hoje').addEventListener('click', () => { mesVisivel = new Date(hoje.getFullYear(), hoje.getMonth(), 1); selecionado = iso(hoje); render(); });
$('#grade').addEventListener('click', (e) => {
  const b = e.target.closest('.dia'); if (!b) return;
  const novo = b.dataset.dia;
  if (novo === selecionado) return abrirModal(); // segundo clique no mesmo dia cria compromisso
  selecionado = novo;
  const d = deIso(novo);
  if (d.getMonth() !== mesVisivel.getMonth()) mesVisivel = new Date(d.getFullYear(), d.getMonth(), 1);
  render();
});
// Setas do teclado mudam o dia selecionado
document.addEventListener('keydown', (e) => {
  if ($('#modal').open || e.target.matches('input, textarea')) return;
  const passos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
  if (!passos) return;
  e.preventDefault();
  const d = deIso(selecionado); d.setDate(d.getDate() + passos);
  selecionado = iso(d); mesVisivel = new Date(d.getFullYear(), d.getMonth(), 1);
  render();
  document.querySelector(`.dia[data-dia="${selecionado}"]`)?.focus();
});

// Modal
$('#f-cats').innerHTML = CATEGORIAS.map((c, i) => `<label class="cat-op" style="--cor:${c.cor}"><input type="radio" name="cat" value="${c.id}" ${i === 0 ? 'checked' : ''}><span>${c.nome}</span></label>`).join('');

function abrirModal(ev) {
  editando = ev ? ev.id : null;
  $('#modal-titulo').textContent = ev ? 'Editar compromisso' : 'Novo compromisso';
  $('#f-titulo').value = ev?.titulo || '';
  $('#f-data').value = ev?.data || selecionado;
  $('#f-inicio').value = ev?.inicio || '09:00';
  $('#f-fim').value = ev?.fim || '';
  $('#f-local').value = ev?.local || '';
  $('#f-obs').value = ev?.obs || '';
  document.querySelector(`input[name="cat"][value="${ev?.cat || 'trabalho'}"]`).checked = true;
  $('#f-excluir').hidden = !ev; delete $('#f-excluir').dataset.ok; $('#f-excluir').textContent = 'Excluir';
  $('#erro').textContent = '';
  $('#modal').showModal(); $('#f-titulo').focus();
}
$('#novo').addEventListener('click', () => abrirModal());
$('#eventos').addEventListener('click', (e) => {
  const b = e.target.closest('.evento'); if (!b) return;
  abrirModal(eventos.find((x) => x.id === Number(b.dataset.id)));
});
$('#f-cancelar').addEventListener('click', () => $('#modal').close());

$('#form').addEventListener('submit', (e) => {
  e.preventDefault();
  const dados = {
    titulo: $('#f-titulo').value.trim(), data: $('#f-data').value, inicio: $('#f-inicio').value, fim: $('#f-fim').value,
    cat: document.querySelector('input[name="cat"]:checked').value, local: $('#f-local').value.trim(), obs: $('#f-obs').value.trim()
  };
  if (!dados.titulo) return ($('#erro').textContent = 'Dê um título ao compromisso.');
  if (!dados.data || !dados.inicio) return ($('#erro').textContent = 'Informe a data e o horário de início.');
  if (dados.fim && dados.fim <= dados.inicio) return ($('#erro').textContent = 'O horário de fim precisa ser depois do início.');
  const conflito = eventos.find((x) => x.id !== editando && x.data === dados.data && x.inicio === dados.inicio);
  if (conflito && !$('#erro').dataset.aviso) {
    $('#erro').dataset.aviso = '1';
    return ($('#erro').textContent = `Já existe "${conflito.titulo}" nesse horário. Salve de novo para manter os dois.`);
  }
  delete $('#erro').dataset.aviso;
  if (editando) Object.assign(eventos.find((x) => x.id === editando), dados);
  else eventos.push({ id: Date.now(), ...dados });
  banco.salvar(eventos);
  selecionado = dados.data;
  const d = deIso(dados.data); mesVisivel = new Date(d.getFullYear(), d.getMonth(), 1);
  $('#modal').close(); render();
});
$('#form').addEventListener('input', () => { delete $('#erro').dataset.aviso; });

$('#f-excluir').addEventListener('click', (e) => {
  const b = e.currentTarget;
  if (!b.dataset.ok) { b.dataset.ok = '1'; b.textContent = 'Confirmar exclusão'; return; }
  eventos = eventos.filter((x) => x.id !== editando);
  banco.salvar(eventos); $('#modal').close(); render();
});

render();
