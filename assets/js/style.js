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


 