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