let gebuchteEintraege = [];
let mitarbeiterListe = [];
let feiertage = {}; 
let schulferien = {};
let ausgewähltesIsoDatum = null;

const mitarbeiterFarben = {
    0: { bg: "#dcfce7", text: "#166534", border: "#22c55e" }, 
    1: { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" }, 
    2: { bg: "#dbeafe", text: "#1e40af", border: "#3b82f6" }, 
    3: { bg: "#f3e8ff", text: "#6b21a8", border: "#a855f7" }, 
    4: { bg: "#fae8ff", text: "#86198f", border: "#d946ef" }, 
    5: { bg: "#ffe4e6", text: "#9f1239", border: "#f43f5e" }, 
    6: { bg: "#ffedd5", text: "#9a3412", border: "#f97316" }, 
    7: { bg: "#e0f2fe", text: "#075985", border: "#0ea5e9" }, 
    8: { bg: "#e2e8f0", text: "#1e293b", border: "#64748b" }, 
    9: { bg: "#f0fdf4", text: "#166534", border: "#4ade80" }, 
    10: { bg: "#fef2f2", text: "#991b1b", border: "#f87171" }, 
    11: { bg: "#eff6ff", text: "#1e40af", border: "#60a5fa" }  
};

let startDatum = new Date();

function initialisiereDatum() {
    const heute = new Date();
    
    // Berechne den Montag der AKTUELLEN Woche
    const wochentagHeute = heute.getDay(); // 0 = Sonntag, 1 = Montag, ...
    const diffZumMontag = (wochentagHeute === 0 ? -6 : 1 - wochentagHeute);
    
    startDatum = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() + diffZumMontag); 
    startDatum.setHours(0, 0, 0, 0);
    
    // Datumsfeld (Input) auf HEUTE setzen
    let j = heute.getFullYear();
    let m = String(heute.getMonth() + 1).padStart(2, '0');
    let t = String(heute.getDate()).padStart(2, '0');
    
    const inputFeld = document.getElementById("kpi-startdatum-input");
    if (inputFeld) inputFeld.value = `${j}-${m}-${t}`;
    
    const jahrKpi = document.getElementById("kpi-jahr");
    if (jahrKpi) jahrKpi.innerText = j;
}

document.getElementById("kpi-startdatum-input").addEventListener("change", function(e) {
    if (!e.target.value) return;
    
    let gewähltesDatum = new Date(e.target.value);
    let wochentag = gewähltesDatum.getDay();
    let diff = gewähltesDatum.getDate() - wochentag + (wochentag === 0 ? -6 : 1);
    
    startDatum = new Date(gewähltesDatum.getFullYear(), gewähltesDatum.getMonth(), diff);
    startDatum.setHours(0,0,0,0);
    
    const jahrKpi = document.getElementById("kpi-jahr");
    if (jahrKpi) jahrKpi.innerText = startDatum.getFullYear();
    
    rendereGesamtSystem();
});

function rendereGesamtSystem() {
    const mitteRaster = document.getElementById('kalender-mitte-raster');
    if (!mitteRaster) return;
    mitteRaster.innerHTML = "";

    const datumInputWert = document.getElementById("kpi-startdatum-input").value;
    const zielMonatDate = datumInputWert ? new Date(datumInputWert) : new Date();
    const zielJahr = zielMonatDate.getFullYear();
    const zielMonat = zielMonatDate.getMonth(); 

    const monatKpi = document.getElementById("kpi-monat");
    if (monatKpi) {
        monatKpi.innerText = zielMonatDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    }

    // BERECHNUNG DER NETTOARBEITSTAGE FÜR DEN GANZEN MONAT
    let nettoTageVollerMonat = 0;
    const letzterTagDesMonats = new Date(zielJahr, zielMonat + 1, 0).getDate();
    
    for (let tagIdx = 1; tagIdx <= letzterTagDesMonats; tagIdx++) {
        let pruefDatum = new Date(zielJahr, zielMonat, tagIdx);
        let wochentagIdx = pruefDatum.getDay();
        
        let j = pruefDatum.getFullYear();
        let m = String(pruefDatum.getMonth() + 1).padStart(2, '0');
        let t = String(pruefDatum.getDate()).padStart(2, '0');
        let pruefIso = `${j}-${m}-${t}`;
        
        let istFT = feiertage[pruefIso] ? true : false;
        
        // Zähle nur Tage von Montag bis Freitag, die keine Feiertage in Daten.csv sind
        if (wochentagIdx !== 0 && wochentagIdx !== 6 && !istFT) {
            nettoTageVollerMonat++;
        }
    }

    // 28 KALENDER-KACHELN IM RASTER ZEICHNEN
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
            
            let mIndex = mitarbeiterListe.indexOf(eintrag.name);
            if (mIndex === -1) mIndex = 0;
            let farbSet = mitarbeiterFarben[mIndex % 12];

            b.style.backgroundColor = farbSet.bg;
            b.style.color = farbSet.text;
            b.style.borderLeft = `3px solid ${farbSet.border}`;

            let symbol = "🌴 "; 
            if (eintrag.typ === 'KR') symbol = "🤒 "; 
            if (eintrag.typ === 'UZ') symbol = "⏳ "; 
	        if (eintrag.typ === 'SO') symbol = "❓ ";

            b.innerText = `${symbol}${eintrag.name}`;
            eContainer.appendChild(b);
        });

        kachel.appendChild(eContainer);
        mitteRaster.appendChild(kachel);
    }

    const nettoKpi = document.getElementById("kpi-netto");
    if (nettoKpi) nettoKpi.innerText = nettoTageVollerMonat;

    const stundenKpi = document.getElementById("kpi-stunden");
    if (stundenKpi) stundenKpi.innerText = (nettoTageVollerMonat * 8.24).toFixed(1) + "h";
    
    rendereSeitenInhalte();
}



function rendereSeitenInhalte() {
    const linksSpalte = document.getElementById('mitarbeiter-linke-spalte');
    if (!linksSpalte) return;
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
        let ueberzeitTage = 0;
        let sonstigesTage = 0;

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
                if (!istWochenende && !istFeiertag) ferienNettoTage++;
            }
            if (e.typ === 'KR') krankTage++;
            if (e.typ === 'UZ') ueberzeitTage++;
            
            // ---> HIER GEÄNDERT: Nur zählen, wenn kein Wochenende und kein Feiertag <---
            if (e.typ === 'SO') {
                if (!istWochenende && !istFeiertag) sonstigesTage++;
            }
        });

        let block = document.createElement('div');
        block.className = "mitarbeiter-zeilen-block";
        block.innerHTML = `
            <div class="konto-zeile konto-zeile-header">${mName}</div>
            <div class="konto-zeile">Ferien ${ferienNettoTage} Tage</div>
            <div class="konto-zeile">Krank ${krankTage} Tage</div>
            <div class="konto-zeile">Überzeit ${ueberzeitTage} Tage</div>
            <div class="konto-zeile">sonstige ${sonstigesTage} Tage</div>
        `;
        linksSpalte.appendChild(block);
    });

    const feiertagKpi = document.getElementById('rechts-feiertag');
    if (feiertagKpi) {
        let feiertagAnzeige = "Kein Feiertag im Sichtfeld";
        let ftSortiert = Object.keys(feiertage).sort();
        for(let ftDate of ftSortiert) {
            let dObj = new Date(ftDate);
            if (dObj >= startDatum) {
                feiertagAnzeige = `${dObj.getDate()}.${dObj.getMonth()+1}.: ${feiertage[ftDate]}`;
                break;
            }
        }
        feiertagKpi.innerText = feiertagAnzeige;
    }

    // 1. ANSTEHENDE URLAUBE (Nur FE)
    const rechtsUrlaube = document.getElementById('rechts-urlaube-liste');
    if (rechtsUrlaube) {
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

// 2. ANSTEHENDES SONSTIGES (Nur SO)
    const rechtsSonstiges = document.getElementById('rechts-sonstiges-liste');
    if (rechtsSonstiges) {
        rechtsSonstiges.innerHTML = "";
        let zukunftsSonstiges = gebuchteEintraege.filter(e => e.typ === 'SO' && new Date(e.datumIso) >= startDatum);
        zukunftsSonstiges.sort((a, b) => a.datumIso.localeCompare(b.datumIso));

        if (zukunftsSonstiges.length === 0) {
            rechtsSonstiges.innerHTML = `<span style="color: #9ca3af; font-style: italic;">Keine Einträge im Zeitraum</span>`;
        } else {
            let gezeigteNamenSO = new Set();
            let vorschauListeSO = [];
            for (let u of zukunftsSonstiges) {
                if (!gezeigteNamenSO.has(u.name.toLowerCase())) {
                    gezeigteNamenSO.add(u.name.toLowerCase());
                    vorschauListeSO.push(u);
                }
                if (vorschauListeSO.length >= 5) break;
            }
            vorschauListeSO.forEach(u => {
                let d = new Date(u.datumIso);
                let item = document.createElement('div');
                item.className = "urlaub-item";
                item.innerHTML = `<span>${u.name}</span><span class="datum">${d.getDate()}.${d.getMonth()+1}.</span>`;
                rechtsSonstiges.appendChild(item);
            });
        }
    }
// 3. ANSTEHENDE SCHULFERIEN (FL)
    const rechtsFerien = document.getElementById('rechts-Schulferien-liste');
    if (rechtsFerien) {
        rechtsFerien.innerHTML = "";
        
        // Filtert alle Ferientage heraus, die ab dem startDatum oder in der Zukunft liegen
        let zukunftsFerienKeys = Object.keys(schulferien).filter(iso => new Date(iso) >= startDatum);
        zukunftsFerienKeys.sort();

        if (zukunftsFerienKeys.length === 0) {
            rechtsFerien.innerHTML = `<span style="color: #9ca3af; font-style: italic;">Keine Schulferien im Zeitraum</span>`;
        } else {
            // Gruppiert zusammenhängende Ferientage, damit nicht jeder Einzeltag untereinander steht
            let vorschauFerien = [];
            let letzteFerienEnde = null;

            // Wir wandeln das in eine übersichtliche Vorschau um
            let ferienBloecke = [];
            let aktuellerBlock = null;

            for (let iso of zukunftsFerienKeys) {
                let d = new Date(iso);
                let text = schulferien[iso];

                if (!aktuellerBlock) {
                    aktuellerBlock = { start: d, ende: d, text: text };
                } else {
                    // Prüfen ob der Tag nahtlos anschließt und derselbe Text ist
                    let letztesDatum = new Date(aktuellerBlock.ende);
                    let diffTage = (d - letztesDatum) / (1000 * 60 * 60 * 24);

                    if (diffTage === 1 && aktuellerBlock.text === text) {
                        aktuellerBlock.ende = d;
                    } else {
                        ferienBloecke.push(aktuellerBlock);
                        aktuellerBlock = { start: d, ende: d, text: text };
                    }
                }
            }
            if (aktuellerBlock) ferienBloecke.push(aktuellerBlock);

            // Maximal die nächsten 4 Ferien-Blöcke anzeigen
            let anzeigeBloecke = ferienBloecke.slice(0, 4);

            anzeigeBloecke.forEach(b => {
                let startStr = `${b.start.getDate()}.${b.start.getMonth()+1}.`;
                let endeStr = `${b.ende.getDate()}.${b.ende.getMonth()+1}.`;
                let datumsAnzeige = (startStr === endeStr) ? startStr : `${startStr} - ${endeStr}`;

                let item = document.createElement('div');
                item.className = "urlaub-item";
                item.innerHTML = `<span>${b.text}</span><span class="datum">${datumsAnzeige}</span>`;
                rechtsFerien.appendChild(item);
            });
        }
    }

}

const modal = document.getElementById('edit-modal');
const mitarbeiterSelect = document.getElementById('modal-mitarbeiter-select');

const modalClose = document.getElementById('modal-close');
if (modalClose) {
    modalClose.addEventListener('click', () => { if(modal) modal.classList.add('hidden'); });
}

function öffneEditor(isoDate, aktDatum) {
    ausgewähltesIsoDatum = isoDate;
    if (!document.getElementById('modal-bis-group') && modal) {
        const body = modal.querySelector('.modal-body');
        const saveBtn = document.getElementById('modal-save-btn');
        const div = document.createElement('div');
        div.className = "form-group";
        div.id = "modal-bis-group";
        div.innerHTML = `
            <label style="font-weight: 600; color: #4b5563; margin-top: 4px;">Bis einschließlich:</label>
            <input type="date" id="modal-bis-input" style="padding: 3px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 11px; background-color: #ffffff;">
        `;
        if (body && saveBtn) body.insertBefore(div, saveBtn);
    }

    const modalTitel = document.getElementById('modal-datum-titel');
    if (modalTitel) modalTitel.innerText = `Eintrag ab ${aktDatum.getDate()}.${aktDatum.getMonth()+1}.`;
    
    let inputBis = document.getElementById('modal-bis-input');
    if (inputBis) {
        inputBis.value = isoDate;
        inputBis.min = isoDate;
    }

    if (mitarbeiterSelect) {
        mitarbeiterSelect.innerHTML = "";
        mitarbeiterListe.forEach(m => {
            let opt = document.createElement('option');
            opt.value = m; opt.innerText = m;
            mitarbeiterSelect.appendChild(opt);
        });
    }
    if (modal) modal.classList.remove('hidden');
}

const saveBtn = document.getElementById('modal-save-btn');
if (saveBtn) {
    saveBtn.addEventListener('click', () => {
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
        if (modal) modal.classList.add('hidden');
        rendereGesamtSystem();
    });
}

// KORREKTUR: Exportiert die Zeilen jetzt im stabilen ISO-Format YYYY-MM-DD ohne Vertauschung
const exportBtn = document.getElementById('btn-export');
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
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
}

function parseFlexiblesDatum(datumStr) {
    if (!datumStr) return null;
    let bereinigt = datumStr.trim();
    let zielJahr = startDatum.getFullYear(); // 2026 als Fallback

    // 1. ISO-Format YYYY-MM-DD direkt parsen (behält das echte Jahr bei, z.B. 2027!)
    if (/^\d{4}-\d{2}-\d{2}$/.test(bereinigt)) {
        let d = new Date(bereinigt + "T00:00:00");
        if (!isNaN(d)) return d;
    }

    // 2. Bindestrich-Format (z.B. Tag-Monat-Jahr oder umgekehrt)
    if (bereinigt.includes('-')) {
        let p = bereinigt.split('-');
        if (p.length === 3) {
            let tag = parseInt(p[2], 10);
            let monat = parseInt(p[1], 10) - 1;
            let jahr = parseInt(p[0], 10);
            if (p[0].length === 2 || p[0].length === 1) {
                tag = parseInt(p[0], 10);
                jahr = zielJahr;
            }
            return new Date(jahr, monat, tag);
        }
    }

    // 3. Deutsches Punkt-Format (z.B. DD.MM.YYYY oder DD.MM.)
    if (bereinigt.includes('.')) {
        let p = bereinigt.split('.');
        if (p.length >= 3 && p[2].trim() !== '') {
            let tag = parseInt(p[0], 10);
            let monat = parseInt(p[1], 10) - 1;
            let jahr = parseInt(p[2], 10);
            return new Date(jahr, monat, tag);
        } else if (p.length >= 2) {
            // Falls kein Jahr dabei steht, nimm das aktuelle Kalenderjahr
            let tag = parseInt(p[0], 10);
            let monat = parseInt(p[1], 10) - 1;
            return new Date(zielJahr, monat, tag);
        }
    }
    return null;
}

window.addEventListener('DOMContentLoaded', () => {
    feiertage = {}; 
    schulferien = {};
    initialisiereDatum();
    
    // 1. Feiertage laden (Daten.csv)
    fetch('Daten.csv')
        .then(res => { if (!res.ok) throw new Error(); return res.text(); })
        .then(datenText => {
            let bereinigterFeiertagText = datenText.replace(/^\uFEFF/, "");
            const zeilen = bereinigterFeiertagText.split(/\r?\n/);
            for (let i = 1; i < zeilen.length; i++) {
                let zeile = zeilen[i].trim();
                if (!zeile) continue;
                let spalten = zeile.includes(';') ? zeile.split(';') : zeile.split(',');
                spalten = spalten.map(s => s.trim());
                if (spalten.length >= 2) {
                    let iso = spalten[0];
                    let n = spalten[1];
                    if(iso && n) feiertage[iso] = n;
                }
            }
// 2. Schulferien laden (FerienFL.csv) - Robust und fehlertolerant
return fetch('FerienFL.csv').catch(() => null);
})
.then(res => res ? res.text() : "")
.then(ferienText => {
    if (!ferienText) return fetch('Liste.csv');
    
    // BOM entfernen und Zeilen aufteilen
    let bereinigterFerienText = ferienText.replace(/^\uFEFF/, "");
    const zeilen = bereinigterFerienText.split(/\r?\n/);
    
    for (let i = 1; i < zeilen.length; i++) {
        let zeile = zeilen[i].trim();
        if (!zeile) continue;
        
        // Erkennt automatisch Komma oder Strichpunkt als Trennzeichen
        let spalten = zeile.includes(';') ? zeile.split(';') : zeile.split(',');
        spalten = spalten.map(s => s.trim().replace(/^["']|["']$/g, ''));
        
        if (spalten.length >= 3) {
            let vonStr = spalten[0];
            let bisStr = spalten[1];
            let text = spalten[2]; 
            
            let vonDate = parseFlexiblesDatum(vonStr);
            let bisDate = parseFlexiblesDatum(bisStr);
            
            if (vonDate && bisDate) {
                let loopDate = new Date(vonDate);
                while (loopDate <= bisDate) {
                    let j = loopDate.getFullYear();
                    let m = String(loopDate.getMonth() + 1).padStart(2, '0');
                    let t = String(loopDate.getDate()).padStart(2, '0');
                    let iso = `${j}-${m}-${t}`;
                    
                    schulferien[iso] = text; 
                    loopDate.setDate(loopDate.getDate() + 1);
                }
            }
        }
    }
    
    // Debug-Check in der Browser-Konsole (Drücke F12 im Browser)
    console.log("Geladene Ferientage gesamt:", Object.keys(schulferien).length);

    // 3. Mitarbeiter-Liste / Buchungen laden (Liste.csv)
    return fetch('Liste.csv');
        })
        .then(res => res.text())
        .then(listeText => {
            let bereinigterText = listeText.replace(/^\uFEFF/, "");
            const zeilen = bereinigterText.split(/\r?\n/);
            gebuchteEintraege = [];
            let namenSet = new Set();

            for (let i = 1; i < zeilen.length; i++) {
                let zeile = zeilen[i].trim();
                if (!zeile) continue;
                
                let spalten = zeile.includes(';') ? zeile.split(';') : zeile.split(',');
                spalten = spalten.map(s => s.trim());
                
                if (spalten.length >= 4) {
                    let typ = spalten[0].toUpperCase();
                    let vonStr = spalten[1];
                    let bisStr = spalten[2];
                    let name = spalten[spalten.length - 1]; 
                    
                    if (!name || name.toLowerCase().includes("name")) continue;
                    namenSet.add(name);
                    
                    let vonDate = parseFlexiblesDatum(vonStr);
                    let bisDate = parseFlexiblesDatum(bisStr);

                    if (vonDate && bisDate) {
                        let loopDate = new Date(vonDate);
                        while (loopDate <= bisDate) {
                            let j = loopDate.getFullYear();
                            let m = String(loopDate.getMonth() + 1).padStart(2, '0');
                            let t = String(loopDate.getDate()).padStart(2, '0');
                            gebuchteEintraege.push({ name: name, typ: typ, datumIso: `${j}-${m}-${t}` });
                            loopDate.setDate(loopDate.getDate() + 1);
                        }
                    }
                }
            }
            mitarbeiterListe = Array.from(namenSet).sort((a,b) => a.localeCompare(b));
            rendereGesamtSystem();
        })
        .catch(err => {
            console.error("Fehler beim Laden der CSV-Dateien:", err);
            rendereGesamtSystem();
        });
});