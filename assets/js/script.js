// ─── UTILITY ─────────────────────────────────────────────────────────────────

// Svuota un elemento rimuovendo i figli uno ad uno — più sicuro di innerHTML = ""
function svuota(elemento) {
  while (elemento.firstChild) {
    elemento.removeChild(elemento.firstChild);
  }
}

// Tiene traccia del filtro sport attivo — stringa vuota = tutti gli sport
let filtroAttivo = "";

// ─── CLASSI ──────────────────────────────────────────────────────────────────
 
// Ho testato gli endpoint con Postman prima di scrivere le classi,
// così sapevo esattamente quali campi restituisce l'API
 
// Modella una squadra con i campi che ci servono dall'API
class Squadra {
  constructor(datiApi) {
    this.id = datiApi.idTeam;
    this.nome = datiApi.strTeam;
    this.logo = datiApi.strBadge;
    this.lega = datiApi.strLeague;
    this.paese = datiApi.strCountry;
    // Campo sport per i filtri — es. "Soccer", "Basketball", "American Football"
    this.sport = datiApi.strSport || "";
  }
}
 
// Modella un evento (partita) con i campi che ci servono dall'API
class Evento {
  constructor(datiApi) {
    this.id = datiApi.idEvent;
    this.data = datiApi.dateEvent;
    this.casa = datiApi.strHomeTeam;
    this.trasferta = datiApi.strAwayTeam;
    this.golCasa = datiApi.intHomeScore;
    this.golTrasferta = datiApi.intAwayScore;
  }
 
  // Converte la data in formato italiano (es. 18/07/2026)
  dataFormattata() {
    const d = new Date(this.data);
    return d.toLocaleDateString("it-IT");
  }
 
  // Restituisce il punteggio come stringa, null se la partita non è ancora giocata
  punteggio() {
    if (this.golCasa === null || this.golTrasferta === null) return null;
    return `${this.golCasa} - ${this.golTrasferta}`;
  }
}

// ─── FETCH ───────────────────────────────────────────────────────────────────
 
// Cerca squadre per nome e restituisce un array di oggetti Squadra
// Uso encodeURIComponent per gestire spazi e caratteri speciali nell'URL
// Se c'è un filtro sport attivo lo aggiungo come parametro &s= all'URL
async function cercaSquadre(query) {
  const url = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(query)}`;

  // Primo .then equivalente: controllo che la risposta HTTP sia ok
  //fetch(url) — manda la richiesta HTTP all'URL e restituisce una Promise|||||||await — mette in pausa la funzione finché la Promise non si risolve, e quando si risolve estrae il valore (in questo caso la response)|||||throw new Error(...) — lancia un errore che interrompe l'esecuzione della funzione e viene "catturato" dal try/catch che chiamerà cercaSquadre — lo gestiremo lì quando faremo il DOM
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Errore HTTP: ${response.status}`);

  // Secondo .then equivalente: converto la risposta in JSON
  const dati = await response.json();
 
  // L'API restituisce { teams: null } se non trova nessuna squadra
  if (!dati.teams) return [];
  // Creo un oggetto Squadra per ogni elemento dell'array restituito dall'API
  return dati.teams.map((t) => new Squadra(t));
}

// Carica prossimi eventi e ultimi risultati di una squadra
// Uso Promise.all per lanciare le due fetch in parallelo invece di aspettarle in sequenza
async function caricaDettagliSquadra(idSquadra) {
  const urlProssimi = `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${idSquadra}`;
  const urlUltimi = `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${idSquadra}`;
 
  // Lancio entrambe le fetch nello stesso momento
  const [resProssimi, resUltimi] = await Promise.all([
    fetch(urlProssimi),
    fetch(urlUltimi),
  ]);
  //Promise.all è un metodo statico della classe Promise che accetta un array di Promise e restituisce una nuova Promise che si risolve solo quando tutte le Promise dell'array si sono risolte.

  if (!resProssimi.ok || !resUltimi.ok) throw new Error("Errore nel caricamento degli eventi");
 
  // Aspetto che entrambe le risposte vengano convertite in JSON
  const [datiProssimi, datiUltimi] = await Promise.all([
    resProssimi.json(),
    resUltimi.json(),
  ]);
 
  // Nota: per i prossimi eventi la chiave è "events", per gli ultimi è "results"
  const prossimi = datiProssimi.events ? datiProssimi.events.map((e) => new Evento(e)) : [];
  const ultimi = datiUltimi.results ? datiUltimi.results.map((e) => new Evento(e)) : [];
 
  return { prossimi, ultimi };
}

// ─── RIFERIMENTI AL DOM ───────────────────────────────────────────────────────

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsGrid = document.getElementById("resultsGrid");
const resultsEmpty = document.getElementById("resultsEmpty");
const spinner = document.getElementById("spinner");
const errorMsg = document.getElementById("errorMsg");
const errorText = document.getElementById("errorText");

// Tiene in memoria le ultime squadre cercate, serve per l'event delegation
let ultimiRisultati = [];

// Cache dei risultati grezzi dell'ultima ricerca — serve per applicare/togliere i filtri senza rifare la fetch
let risultatiCacheati = [];

// ─── DOM ─────────────────────────────────────────────────────────────────────

// Crea e restituisce una card squadra come elemento DOM
// uso createElement invece di innerHTML per sicurezza
function creaCardSquadra(squadra, isFavourite) {
  // Colonna Bootstrap per la griglia responsive
  /*squadra.logo(e sintassi simili) contiene l'URL del logo che l'API ci ha restituito nel campo strBadge, che nel costruttore di Squadra abbiamo mappato come this.logo = datiApi.strBadge.*/
  const col = document.createElement("div");
col.className = "col-12"; 
  const card = document.createElement("div");
  card.className = "sh-card";
  card.dataset.id = squadra.id;
 
  // Logo della squadra
  const logo = document.createElement("img");
  logo.src = squadra.logo;
  logo.alt = `Logo ${squadra.nome}`;
  logo.className = "sh-card-logo";
 
  // Nome della squadra
  const nome = document.createElement("p");
  nome.className = "sh-card-name";
  nome.textContent = squadra.nome;
 
  // Lega
  const lega = document.createElement("p");
  lega.className = "sh-card-league";
  lega.textContent = squadra.lega;
 
  // Paese
  const paese = document.createElement("p");
  paese.className = "sh-card-country";
  paese.textContent = squadra.paese;
 
  // Bottone: cambia in base allo stato preferita
  const btn = document.createElement("button");
  if (isFavourite) {
    btn.className = "sh-btn-already";
    btn.textContent = "✓ Già nei preferiti";
    btn.disabled = true;
  } else {
    btn.className = "sh-btn-add";
    btn.textContent = "★ Aggiungi ai preferiti";
  }
 
  card.appendChild(logo);
  card.appendChild(nome);
  card.appendChild(lega);
  card.appendChild(paese);
  card.appendChild(btn);
  col.appendChild(card);
 
  return col;
}

// Crea il bottone Rimuovi con icona Bootstrap Icons senza innerHTML
function creaBtnRimuovi(idSquadra) {
  const btn = document.createElement("button");
  btn.className = "sh-btn-remove";

  // Icona trash con createElement invece di innerHTML
  const icona = document.createElement("i");
  icona.className = "bi bi-trash";

  const testo = document.createTextNode(" Rimuovi");

  btn.appendChild(icona);
  btn.appendChild(testo);
  btn.addEventListener("click", () => rimuoviPreferita(idSquadra));

  return btn;
}

// ─── PREFERITI (localStorage) ─────────────────────────────────────────────────

// Legge i preferiti dal localStorage, restituisce array vuoto se non ce ne sono
function leggiPreferiti() {
  const dati = localStorage.getItem("sportshub_preferiti");
  return dati ? JSON.parse(dati) : [];
}

// Salva l'array dei preferiti nel localStorage
function salvaPreferiti(preferiti) {
  localStorage.setItem("sportshub_preferiti", JSON.stringify(preferiti));
}

// Controlla se una squadra è già nei preferiti tramite il suo id
function isPreferita(idSquadra) {
  return leggiPreferiti().some((s) => s.id === idSquadra);
}

// Aggiunge una squadra ai preferiti se non è già presente
function aggiungiPreferita(squadra) {
  const preferiti = leggiPreferiti();
  if (!isPreferita(squadra.id)) {
    preferiti.push(squadra);
    salvaPreferiti(preferiti);
  }
  mostraPreferiti();
}

// Rimuove una squadra dai preferiti tramite il suo id
function rimuoviPreferita(idSquadra) {
  const preferiti = leggiPreferiti().filter((s) => s.id !== idSquadra);
  salvaPreferiti(preferiti);
  mostraPreferiti();

  // Aggiorno il bottone nella griglia risultati se la card e ancora visibile
  const card = resultsGrid.querySelector(`[data-id="${idSquadra}"]`);
  if (card) {
    const btn = card.querySelector('.sh-btn-already');
    if (btn) {
      btn.className = 'sh-btn-add';
      btn.textContent = '★ Aggiungi ai preferiti';
      btn.disabled = false;
    }
  }
}

// Renderizza le card nella sezione preferiti
function mostraPreferiti() {
  const favouritesGrid = document.getElementById("favouritesGrid");
  const favouritesEmpty = document.getElementById("favouritesEmpty");
  const preferiti = leggiPreferiti();

  // Svuoto la griglia con removeChild invece di innerHTML
  svuota(favouritesGrid);

  if (preferiti.length === 0) {
    favouritesEmpty.classList.remove("d-none");
    return;
  }

  favouritesEmpty.classList.add("d-none");

  preferiti.forEach((squadra, index) => {
  const col = document.createElement("div");

  const ultimo = index === preferiti.length - 1;
  const numeroDispari = preferiti.length % 2 !== 0;

  if (numeroDispari && ultimo) {
    col.className = "col-12";
  } else {
    col.className = "col-12 col-md-6 col-lg-3";
  }

  const card = document.createElement("div");
    card.className = "sh-card";
    card.dataset.id = squadra.id;

    const logo = document.createElement("img");
    logo.src = squadra.logo;
    logo.alt = `Logo ${squadra.nome}`;
    logo.className = "sh-card-logo";

    const nome = document.createElement("p");
    nome.className = "sh-card-name";
    nome.textContent = squadra.nome;

    const lega = document.createElement("p");
    lega.className = "sh-card-league";
    lega.textContent = squadra.lega;

    const paese = document.createElement("p");
    paese.className = "sh-card-country";
    paese.textContent = squadra.paese;

    card.appendChild(logo);
    card.appendChild(nome);
    card.appendChild(lega);
    card.appendChild(paese);
    card.appendChild(creaBtnRimuovi(squadra.id));
    col.appendChild(card);
    favouritesGrid.appendChild(col);
  });
}

// ─── RENDERING ───────────────────────────────────────────────────────────────
 
// Filtra i risultati cacheati per sport e li mostra
function applicaFiltro() {
  const filtrate = filtroAttivo
    ? risultatiCacheati.filter((s) => s.sport === filtroAttivo)
    : risultatiCacheati;
  mostraRisultati(filtrate);
}

// Mostra le card dei risultati di ricerca nella griglia
function mostraRisultati(squadre) {
  // Salvo i risultati per poterli recuperare al click del bottone aggiungi
  ultimiRisultati = squadre;

  // Svuoto la griglia con removeChild invece di innerHTML
  svuota(resultsGrid);
 
  // Se non ci sono risultati mostro il messaggio e mi fermo
  if (squadre.length === 0) {
    const msg = document.createElement("p");
    msg.className = "sh-empty-text";
    msg.textContent = "Nessuna squadra trovata.";
    resultsGrid.appendChild(msg);
    return;
  }
 
  // Creo una card per ogni squadra, segnalandola se è già nei preferiti
  squadre.forEach((squadra) => {
    const card = creaCardSquadra(squadra, isPreferita(squadra.id));
    resultsGrid.appendChild(card);
  });
}

// ─── LISTENER ────────────────────────────────────────────────────────────────
 
// Gestisce il click sul bottone Cerca
searchBtn.addEventListener("click", async () => {
  const query = searchInput.value.trim();
 
  // Non faccio nulla se il campo è vuoto
  if (!query) return;
 
  // Mostro lo spinner e nascondo eventuali errori precedenti
  spinner.classList.remove("d-none");
  errorMsg.classList.add("d-none");
  resultsEmpty.classList.add("d-none");
 
  try {
    risultatiCacheati = await cercaSquadre(query);
    applicaFiltro();
  } catch (err) {
    // Mostro il messaggio di errore rosso
    errorText.textContent = err.message;
    errorMsg.classList.remove("d-none");
  } finally {
    // finally viene eseguito sempre, sia in caso di successo che di errore
    spinner.classList.add("d-none");
  }
});

// Event delegation sulla griglia risultati per il bottone aggiungi
// così non devo aggiungere un listener su ogni singolo bottone
resultsGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".sh-btn-add");
  if (!btn) return;

  // Risalgo alla card per prendere l'id della squadra
  const card = btn.closest("[data-id]");
  const idSquadra = card.dataset.id;

  // Trovo la squadra nell'array e la aggiungo ai preferiti
  const squadra = ultimiRisultati.find((s) => s.id === idSquadra);
  if (squadra) aggiungiPreferita(squadra);

  // Aggiorno il bottone senza rifare la ricerca
  btn.className = "sh-btn-already";
  btn.textContent = "✓ Già nei preferiti";
  btn.disabled = true;
});

// ─── INIT ─────────────────────────────────────────────────────────────────────

// Carico i preferiti salvati al refresh della pagina
mostraPreferiti();

// ─── DETTAGLI SQUADRA ────────────────────────────────────────────────────────

// Crea un elemento lista per un evento (partita futura o risultato passato)
function creaElementoEvento(evento) {
  const li = document.createElement("li");

  // Data in formato italiano
  const data = document.createElement("span");
  data.className = "sh-event-date";
  data.textContent = evento.dataFormattata();

  // Nome della partita (casa vs trasferta)
  const match = document.createElement("span");
  match.className = "sh-event-match";
  match.textContent = `${evento.casa} vs ${evento.trasferta}`;

  li.appendChild(data);
  li.appendChild(match);

  // Se c'è un punteggio (partita già giocata) aggiungo il badge verde
  const score = evento.punteggio();
  if (score) {
    const badge = document.createElement("span");
    badge.className = "sh-badge-score";
    badge.textContent = score;
    match.appendChild(badge);
  }

  // Al click sull'evento apro la modal con i dettagli completi
  li.style.cursor = "pointer";
  li.addEventListener("click", () => apriModalEvento(evento));

  return li;
}

// Apre la modal Bootstrap con i dettagli dell'evento cliccato
function apriModalEvento(evento) {
  const modalBody = document.getElementById("eventModalBody");
  const modalLabel = document.getElementById("eventModalLabel");

  svuota(modalBody);

  modalLabel.textContent = `${evento.casa} vs ${evento.trasferta}`;

  // Riga data
  const rigaData = creaRigaModal("Data", evento.dataFormattata());
  modalBody.appendChild(rigaData);

  // Riga casa
  const rigaCasa = creaRigaModal("Casa", evento.casa);
  modalBody.appendChild(rigaCasa);

  // Riga trasferta
  const rigaTrasferta = creaRigaModal("Trasferta", evento.trasferta);
  modalBody.appendChild(rigaTrasferta);

  // Riga punteggio (solo se disponibile)
  const score = evento.punteggio();
  if (score) {
    const rigaScore = creaRigaModal("Risultato", score);
    modalBody.appendChild(rigaScore);
  }

  // Apro la modal con Bootstrap
  const modal = new bootstrap.Modal(document.getElementById("eventModal"));
  modal.show();
}

// Crea una riga label + valore per la modal
function creaRigaModal(label, valore) {
  const riga = document.createElement("div");
  riga.className = "sh-modal-row";

  const lbl = document.createElement("span");
  lbl.className = "sh-modal-label";
  lbl.textContent = label;

  const val = document.createElement("span");
  val.textContent = valore;

  riga.appendChild(lbl);
  riga.appendChild(val);

  return riga;
}

// Mostra la sezione dettagli con prossimi eventi e ultimi risultati
function mostraDettagli(squadra, prossimi, ultimi) {
  const detailsSection = document.getElementById("detailsSection");
  const detailsTeamName = document.getElementById("detailsTeamName");
  const nextEventsList = document.getElementById("nextEventsList");
  const lastResultsList = document.getElementById("lastResultsList");

  // Imposto il nome della squadra come titolo
  detailsTeamName.textContent = squadra.nome;

  // Svuoto le liste con removeChild
  svuota(nextEventsList);
  svuota(lastResultsList);

  // Prossimi eventi
  if (prossimi.length === 0) {
    const msg = document.createElement("p");
    msg.className = "sh-empty-text";
    msg.textContent = "Nessun evento in programma";
    nextEventsList.appendChild(msg);
  } else {
    prossimi.forEach((e) => nextEventsList.appendChild(creaElementoEvento(e)));
  }

  // Ultimi risultati
  if (ultimi.length === 0) {
    const msg = document.createElement("p");
    msg.className = "sh-empty-text";
    msg.textContent = "Nessun risultato disponibile";
    lastResultsList.appendChild(msg);
  } else {
    ultimi.forEach((e) => lastResultsList.appendChild(creaElementoEvento(e)));
  }

  // Mostro la sezione (era nascosta con d-none)
  detailsSection.classList.remove("d-none");

  // Scorro la pagina fino ai dettagli
  detailsSection.scrollIntoView({ behavior: "smooth" });
}

// Listener sul click delle card risultati per caricare i dettagli
// Uso event delegation sulla griglia invece di un listener per ogni card
resultsGrid.addEventListener("click", async (e) => {
  // Ignoro i click sul bottone aggiungi (gestito dall'altro listener)
  if (e.target.closest(".sh-btn-add") || e.target.closest(".sh-btn-already")) return;

  // Risalgo alla card cliccata
  const card = e.target.closest("[data-id]");
  if (!card) return;

  const idSquadra = card.dataset.id;
  const squadra = ultimiRisultati.find((s) => s.id === idSquadra);
  if (!squadra) return;

  try {
    const { prossimi, ultimi } = await caricaDettagliSquadra(idSquadra);
    mostraDettagli(squadra, prossimi, ultimi);
  } catch (err) {
    errorText.textContent = err.message;
    errorMsg.classList.remove("d-none");
  }
});

// ─── DEBOUNCE ─────────────────────────────────────────────────────────────────

// Il debounce evita di chiamare l'API ad ogni tasto premuto —
// aspetto 400ms di pausa prima di lanciare la ricerca
let debounceTimer;

searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);

  // Se il campo è vuoto svuoto subito la griglia e rimetto il placeholder
  if (!searchInput.value.trim()) {
    risultatiCacheati = [];
    svuota(resultsGrid);
    const msg = document.createElement("p");
    msg.className = "sh-empty-text";
    msg.textContent = "Inizia cercando una squadra qui sopra.";
    resultsGrid.appendChild(msg);
    return;
  }

  debounceTimer = setTimeout(async () => {
    const query = searchInput.value.trim();
    if (!query) return;

    spinner.classList.remove("d-none");
    errorMsg.classList.add("d-none");

    try {
      risultatiCacheati = await cercaSquadre(query);
      applicaFiltro();
    } catch (err) {
      errorText.textContent = err.message;
      errorMsg.classList.remove("d-none");
    } finally {
      spinner.classList.add("d-none");
    }
  }, 400);
});

// Event delegation sulla griglia preferiti per caricare i dettagli al click
// stesso comportamento della griglia risultati
document.getElementById("favouritesGrid").addEventListener("click", async (e) => {
  // Ignoro i click sul bottone rimuovi
  if (e.target.closest(".sh-btn-remove")) return;

  const card = e.target.closest("[data-id]");
  if (!card) return;

  const idSquadra = card.dataset.id;
  const preferiti = leggiPreferiti();
  const squadra = preferiti.find((s) => s.id === idSquadra);
  if (!squadra) return;

  try {
    const { prossimi, ultimi } = await caricaDettagliSquadra(idSquadra);
    mostraDettagli(squadra, prossimi, ultimi);
  } catch (err) {
    errorText.textContent = err.message;
    errorMsg.classList.remove("d-none");
  }
});

// ─── FILTRI SPORT ─────────────────────────────────────────────────────────────

// Gestisce il click sui bottoni filtro con event delegation
document.getElementById("sportFilters").addEventListener("click", (e) => {
  const btn = e.target.closest(".sh-filter-btn");
  if (!btn) return;

  // Rimuovo active da tutti i bottoni e lo metto su quello cliccato
  document.querySelectorAll(".sh-filter-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  filtroAttivo = btn.dataset.sport;

  // Riapplico il filtro sui risultati già in memoria
  applicaFiltro();
});

// ─── CARICAMENTO PARALLELO PREFERITE ALL'AVVIO ───────────────────────────────

// All'avvio carico i dettagli di tutte le preferite in parallelo con Promise.all
// così ho subito i prossimi appuntamenti senza dover cliccare su ogni squadra
async function caricaDettagliPreferite() {
  const preferiti = leggiPreferiti();
  if (preferiti.length === 0) return;

  try {
    // Lancio tutte le fetch in parallelo
    const risultati = await Promise.all(
      preferiti.map((s) => caricaDettagliSquadra(s.id))
    );

    // Mostro i prossimi eventi della prima squadra che ha eventi in programma
    for (let i = 0; i < preferiti.length; i++) {
      if (risultati[i].prossimi.length > 0) {
        mostraDettagli(preferiti[i], risultati[i].prossimi, risultati[i].ultimi);
        break;
      }
    }
  } catch (err) {
    // Errore silenzioso all'avvio — non blocco l'utente
    console.warn("Errore nel caricamento dettagli preferite:", err.message);
  }
}

// Avvio il caricamento parallelo delle preferite
caricaDettagliPreferite();