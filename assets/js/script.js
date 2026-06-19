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

 // ─── DOM ─────────────────────────────────────────────────────────────────────
 // Crea e restituisce una card squadra come elemento DOM
// solito, u so createElement invece di innerHTML per sicurezza
function creaCardSquadra(squadra, isFavourite) {
  // Colonna Bootstrap per la griglia responsive
  /*squadra.logo(e sintassi simili) contiene l'URL del logo che l'API ci ha restituito nel campo strBadge, che nel costruttore di Squadra abbiamo mappato come this.logo = datiApi.strBadge.*/
  const col = document.createElement("div");
  col.className = "col-12 col-sm-6 col-md-4 col-lg-3";
 
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

// ─── RENDERING ───────────────────────────────────────────────────────────────
 
// Mostra le card dei risultati di ricerca nella griglia
function mostraRisultati(squadre) {
  // Svuoto la griglia prima di aggiungere i nuovi risultati
  resultsGrid.innerHTML = "";
 
  // Se non ci sono risultati mostro il messaggio e mi fermo
  if (squadre.length === 0) {
    const msg = document.createElement("p");
    msg.className = "sh-empty-text";
    msg.textContent = "Nessuna squadra trovata.";
    resultsGrid.appendChild(msg);
    return;
  }
 
  // Creo una card per ogni squadra e la aggiungo alla griglia
  squadre.forEach((squadra) => {
    const card = creaCardSquadra(squadra, false);
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
    const squadre = await cercaSquadre(query);
    mostraRisultati(squadre);
  } catch (err) {
    // Mostro il messaggio di errore rosso
    errorText.textContent = err.message;
    errorMsg.classList.remove("d-none");
  } finally {
    // Nascondo sempre lo spinner, che vada bene o male
    spinner.classList.add("d-none");
  }
});