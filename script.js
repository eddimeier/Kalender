let gebuchteEintraege = [];
let mitarbeiterListe = [];
let feiertage = {}; 
let ausgewähltesIsoDatum = null;

// Festes Farb-Verzeichnis für bis zu 12 Mitarbeiter (Schöne, dezente Pastelltöne)
const mitarbeiterFarben = {
    0: { bg: "#dcfce7", text: "#166534", border: "#22c55e" }, // Soft-Grün
    1: { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" }, // Soft-Gelb
    2: { bg: "#dbeafe", text: "#1e40af", border: "#3b82f6" }, // Soft-Blau
    3: { bg: "#f3e8ff", text: "#6b21a8", border: "#a855f7" }, // Soft-Violett
    4: { bg: "#fae8ff", text: "#86198f", border: "#d946ef" }, // Soft-Pink
    5: { bg: "#ffe4e6", text: "#9f1239", border: "#f43f5e" }, // Soft-Rot
    6: { bg: "#ffedd5", text: "#9a3412", border: "#f97316" }, // Soft-Orange
    7: { bg: "#e0f2fe", text: "#075985", border: "#0ea5e9" }, // Soft-Cyan
    8: { bg: "#e2e8f0", text: "#1e293b", border: "#64748b" }, // Soft-Grau
    9: { bg: "#f0fdf4", text: "#166534", border: "#4ade80" }, // Mint
    10: { bg: "#fef2f2", text: "#991b1b", border: "#f87171" }, // Lachs
    11: { bg: "#eff6ff", text: "#1e40af", border: "#60a5fa" }  // Hellblau
};

// Dynamische Zeitberechnung ab aktuellem Montag (KW 38 / 2026)
const heute = new Date();
const aktuellerWochentag = heute.getDay();
const diffZumMontag = heute.getDate() - aktuellerWochentag + (aktuellerWochentag === 0 ? -6 : 1);
const startDatum = new Date(heute.getFullYear(), heute.getMonth(), diffZumMontag); 
startDatum.setHours(0,0,0,0);

document.getElementById("kpi-jahr").innerText = startDatum.getFullYear();
document.getElementById("kpi-monat").innerText = startDatum.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

function rendereGesamtSystem() {
    let nettoTage = 0;
    const mitteRaster = document.getElementById('kalender-mitte-raster');
    mitteRaster.innerHTML = "";

    for (let i = 0; i < 28; i++) {
        let aktDatum = new Date(startDatum);
        aktDatum.setDate(startDatum.getDate() + i);
        
        let tag = aktDatum.getDate();
        let monat = aktDatum.toLocaleDateString('de-DE', { month: 'short' });
        let wochentagIndex = aktDatum.getDay();
        
        let j = aktDatum.getFullYear();
        let m = String(aktDatum.getMonth() + 1).padStart(2, '0');
        let t = String(aktDatum.getDate()).padStart(2, '0');
        let isoDate = `${j}-${m}-${t}`;
        
        let istWE = (wochentagIndex === 0 || wochentagIndex === 6);
        let istFT = feiertage[isoDate] ? true : false;
        if (!istWE && !istFT) nettoTage++;

        let kachel = document.createElement('div');
        kachel.className = "kalender-tag-kachel";
        if (istWE) kachel.classList.add('bg-wochenende');
        if (istFT) kachel.classList.add('bg-feiertag');

        if (!istFT) {
            kachel.addEventListener('click', () => öffneEditor(isoDate, aktDatum));
        }

        let dHeader = document.createElement('div');
        dHeader.className = "kachel-header";
        dHeader.innerHTML = `<span>${tag}. ${monat}</span>`;
        if (istFT) dHeader.innerHTML += `<span class="feiertag-label" title="${feiertage[isoDate]}">${feiertage[isoDate]}</span>`;
        kachel.appendChild(dHeader);

        let eContainer = document.createElement('div');
        eContainer.className = "badge-container";

        let treffer = gebuchteEintraege.filter(e => e.datumIso === isoDate);
        treffer.forEach(eintrag => {
            let b = document.createElement('div');
            b.className = "badge";
            
            // 1. Finde den alphabetischen Listenplatz des Mitarbeiters für seine feste Farbe
            let mIndex = mitarbeiterListe.indexOf(eintrag.name);
            if (mIndex === -1) mIndex = 0;
            let farbSet = mitarbeiterFarben[mIndex % 12]; // % 12 falls mehr als 12 Mitarbeiter existieren

            // 2. Weise dem Namensblock die feste Mitarbeiterfarbe zu
            b.style.backgroundColor = farbSet.bg;
            b.style.color = farbSet.text;
            b.style.borderLeft = `3px solid ${farbSet.border}`;

            // 3. Setze das passende Symbol je nach Abwesenheitstyp vor den Namen
            let symbol = "🌴 "; // Standard: Ferien (FE)
            if (eintrag.typ === 'KR') symbol = "🤒 "; // Krank (KR)
            if (eintrag.typ === 'UZ') symbol = "⏳ "; // Überzeit (UZ)

            b.innerText = `${symbol}${eintrag.name}`;
            eContainer.appendChild(b);
        });

        kachel.appendChild(eContainer);
        mitteRaster.appendChild(kachel);
    }

    document.getElementById("kpi-netto").innerText = nettoTage;
    document.getElementById("kpi-stunden").innerText = (nettoTage * 8.24).toFixed(1) + "h";
    
    rendereSeitenInhalte();
}

function rendereSeitenInhalte() {
    const linksSpalte = document.getElementById('mitarbeiter-linke-spalte');
    linksSpalte.innerHTML = "";

    const aktuellesJahr = startDatum.getFullYear();

    mitarbeiterListe.forEach(mName => {
        let jahresEintraege = gebuchteEintraege.filter(e => {
            if (e.name.toLowerCase() !== mName.toLowerCase()) return false;
            let eDate = new Date(e.datumIso);
            return eDate.getFullYear() === aktuellesJahr;
        });

        let ferienNettoTage = 0;
        let krankTage = 0;
        let ueberzeitTage = 0; // NEU: Zähler für die Überzeit-Tage

        jahresEintraege.forEach(e => {
            let eDate = new Date(e.datumIso);
            let wochentag = eDate.getDay(); 
            
            let j = eDate.getFullYear();
            let m = String(eDate.getMonth() + 1).padStart(2, '0');
            let t = String(eDate.getDate()).padStart(2, '0');
            let isoCheck = `${j}-${m}-${t}`;

            let istWochenende = (wochentag === 0 || wochentag === 6);
            let istFeiertag = feiertage[isoCheck] ? true : false;

            if (e.typ === 'FE') {
                if (!istWochenende && !istFeiertag) {
                    ferienNettoTage++;
                }
            }

            if (e.typ === 'KR') {
                krankTage++;
            }

            // NEU: Rechnet alle Überzeit-Einträge (UZ) für die Jahresübersicht zusammen
            if (e.typ === 'UZ') {
                ueberzeitTage++;
            }
        });

        let block = document.createElement('div');
        block.className = "mitarbeiter-zeilen-block";
        block.innerHTML = `
            <div class="konto-zeile konto-zeile-header">${mName}</div>
            <div class="konto-zeile">Ferien ${ferienNettoTage} Tage</div>
            <div class="konto-zeile">Krank ${krankTage} Tage</div>
            <div class="konto-zeile">Überzeit ${ueberzeitTage} Tage</div>
        `;
        linksSpalte.appendChild(block);
    });

    let feiertagAnzeige = "Kein Feiertag im Sichtfeld";
    let ftSortiert = Object.keys(feiertage).sort();
    
    for(let ftDate of ftSortiert) {
        let dObj = new Date(ftDate);
        if (dObj >= startDatum) {
            feiertagAnzeige = `${dObj.getDate()}.${dObj.getMonth()+1}.: ${feiertage[ftDate]}`;
            break;
        }
    }
    document.getElementById('rechts-feiertag').innerText = feiertagAnzeige;

    const rechtsUrlaube = document.getElementById('rechts-urlaube-liste');
    rechtsUrlaube.innerHTML = "";
    let zukunftsUrlaube = gebuchteEintraege.filter(e => e.typ === 'FE' && new Date(e.datumIso) >= startDatum);
    zukunftsUrlaube.sort((a, b) => a.datumIso.localeCompare(b.datumIso));

    if (zukunftsUrlaube.length === 0) {
        rechtsUrlaube.innerHTML = `<span style="color: #9ca3af; font-style: italic;">Keine Urlaube im Zeitraum</span>`;
    } else {
        let gezeigteNamen = new Set();
        let vorschauListe = [];
        for (let u of zukunftsUrlaube) {
            if (!gezeigteNamen.has(u.name.toLowerCase())) {
                gezeigteNamen.add(u.name.toLowerCase());
                vorschauListe.push(u);
            }
            if (vorschauListe.length >= 5) break;
        }
        vorschauListe.forEach(u => {
            let d = new Date(u.datumIso);
            let item = document.createElement('div');
            item.className = "urlaub-item";
            item.innerHTML = `<span>${u.name}</span><span class="datum">${d.getDate()}.${d.getMonth()+1}.</span>`;
            rechtsUrlaube.appendChild(item);
        });
    }
}

const modal = document.getElementById('edit-modal');
const mitarbeiterSelect = document.getElementById('modal-mitarbeiter-select');

function öffneEditor(isoDate, aktDatum) {
    ausgewähltesIsoDatum = isoDate;
    if (!document.getElementById('modal-bis-group')) {
        const body = document.querySelector('.modal-body');
        const saveBtn = document.getElementById('modal-save-btn');
        const div = document.createElement('div');
        div.className = "form-group";
        div.id = "modal-bis-group";
        div.innerHTML = `
            <label style="font-weight: 600; color: #4b5563; margin-top: 4px;">Bis einschließlich:</label>
            <input type="date" id="modal-bis-input" style="padding: 3px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 11px; background-color: #ffffff;">
        `;
        body.insertBefore(div, saveBtn);
    }

    document.getElementById('modal-datum-titel').innerText = `Eintrag ab ${aktDatum.getDate()}.${aktDatum.getMonth()+1}.`;
    let inputBis = document.getElementById('modal-bis-input');
    inputBis.value = isoDate;
    inputBis.min = isoDate;

    mitarbeiterSelect.innerHTML = "";
    mitarbeiterListe.forEach(m => {
        let opt = document.createElement('option');
        opt.value = m; opt.innerText = m;
        mitarbeiterSelect.appendChild(opt);
    });
    modal.classList.remove('hidden');
}

document.getElementById('modal-close').addEventListener('click', () => modal.classList.add('hidden'));

document.getElementById('modal-save-btn').addEventListener('click', () => {
    const name = mitarbeiterSelect.value;
    const typ = document.getElementById('modal-typ-select').value;
    const bisDatumStr = document.getElementById('modal-bis-input').value;

    let startLoop = new Date(ausgewähltesIsoDatum);
    let endLoop = new Date(bisDatumStr);

    while (startLoop <= endLoop) {
        let j = startLoop.getFullYear();
        let m = String(startLoop.getMonth() + 1).padStart(2, '0');
        let t = String(startLoop.getDate()).padStart(2, '0');
        let loopIso = `${j}-${m}-${t}`;

        gebuchteEintraege = gebuchteEintraege.filter(e => !(e.name.toLowerCase() === name.toLowerCase() && e.datumIso === loopIso));
        if (typ !== 'DELETE') {
            gebuchteEintraege.push({ name: name, typ: typ, datumIso: loopIso });
        }
        startLoop.setDate(startLoop.getDate() + 1);
    }
    modal.classList.add('hidden');
    rendereGesamtSystem();
});

document.getElementById('btn-export').addEventListener('click', () => {
    let csvInhalt = "Info,von,bis,Tage,Name\n";
    let verarbeitet = new Set();

    gebuchteEintraege.sort((a, b) => a.datumIso.localeCompare(b.datumIso));

    gebuchteEintraege.forEach((eintrag) => {
        let key = `${eintrag.name}-${eintrag.typ}-${eintrag.datumIso}`;
        if (verarbeitet.has(key)) return;

        let startD = new Date(eintrag.datumIso);
        let endD = new Date(eintrag.datumIso);
        let tageZaehler = 1;

        verarbeitet.add(key);

        let weiterlaufend = true;
        while (weiterlaufend) {
            let naechsterTag = new Date(endD);
            naechsterTag.setDate(naechsterTag.getDate() + 1);
            let nJ = naechsterTag.getFullYear();
            let nM = String(naechsterTag.getMonth() + 1).padStart(2, '0');
            let nT = String(naechsterTag.getDate()).padStart(2, '0');
            let naechsterIso = `${nJ}-${nM}-${nT}`;

            let anschlussTreffer = gebuchteEintraege.find(g => g.name === eintrag.name && g.typ === eintrag.typ && g.datumIso === naechsterIso);
            
            if (anschlussTreffer) {
                endD = naechsterTag;
                tageZaehler++;
                verarbeitet.add(`${anschlussTreffer.name}-${anschlussTreffer.typ}-${anschlussTreffer.datumIso}`);
            } else {
                weiterlaufend = false;
            }
        }

        let fVon = `${startD.getFullYear()}-${String(startD.getMonth()+1).padStart(2,'0')}-${String(startD.getDate()).padStart(2,'0')}`;
        let fBis = `${endD.getFullYear()}-${String(endD.getMonth()+1).padStart(2,'0')}-${String(endD.getDate()).padStart(2,'0')}`;

        csvInhalt += `${eintrag.typ},${fVon},${fBis},${tageZaehler},${eintrag.name}\n`;
    });

    const blob = new Blob([csvInhalt], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Liste.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

function parseFlexiblesDatum(datumStr) {
    if (!datumStr) return null;
    let bereinigt = datumStr.trim();

    if (bereinigt.includes('-')) {
        let p = bereinigt.split('-');
        if (p.length === 3) {
            let jahr = parseInt(p[0], 10);
            let monat = parseInt(p[1], 10) - 1;
            let tag = parseInt(p[2], 10);
            return new Date(jahr, monat, tag);
        }
    }

    if (bereinigt.includes('.')) {
        let p = bereinigt.split('.');
        if (p.length === 3) {
            let tag = parseInt(p[0], 10);
            let monat = parseInt(p[1], 10) - 1;
            let jahr = parseInt(p[2], 10);
            return new Date(jahr, monat, tag);
        }
    }
    return null;
}

window.addEventListener('DOMContentLoaded', () => {
    feiertage = {}; 
    
    fetch('Daten.csv')
        .then(res => {
            if (!res.ok) throw new Error();
            return res.text();
        })
        .then(datenText => {
            const zeilen = datenText.split(/\r?\n/);
            for (let i = 1; i < zeilen.length; i++) {
                let zeile = zeilen[i].trim();
                if (!zeile) continue;
                let spalten = zeile.split(',');
                if (spalten.length >= 2) {
                    let iso = spalten[0].trim();
                    let n = spalten[1].trim();
                    if(iso && n) feiertage[iso] = n;
                }
            }
            return fetch('Liste.csv');
        })
        .then(res => res.text())
        .then(listeText => {
            const zeilen = listeText.split(/\r?\n/);
            gebuchteEintraege = [];
            let namenSet = new Set();

            for (let i = 1; i < zeilen.length; i++) {
                let zeile = zeilen[i].trim();
                if (!zeile) continue;
                let spalten = zeile.split(',');
                if (spalten.length >= 5) {
                    let typ = spalten[0].trim().toUpperCase();
                    let vonStr = spalten[1].trim();
                    let bisStr = spalten[2].trim();
                    let name = spalten[4].trim();
                    if (!name) continue;
                    namenSet.add(name);
                    
                    let vonDate = parseFlexiblesDatum(vonStr);
                    let bisDate = parseFlexiblesDatum(bisStr);

                    if (vonDate && bisDate) {
                        let loopDate = new Date(vonDate);
                        while (loopDate <= bisDate) {
                            let j = loopDate.getFullYear();
                            let m = String(loopDate.getMonth() + 1).padStart(2, '0');
                            let t = String(loopDate.getDate()).padStart(2, '0');
                            gebuchteEintraege.push({
                                name: name,
                                typ: typ,
                                datumIso: `${j}-${m}-${t}`
                            });
                            loopDate.setDate(loopDate.getDate() + 1);
                        }
                    }
                }
            }
            mitarbeiterListe = Array.from(namenSet).sort((a,b) => a.localeCompare(b));
            rendereGesamtSystem();
        })
        .catch(() => {
            rendereGesamtSystem();
        });
});