# Flow de Lucru Git Automatizat (GIT_WORKFLOW)

Pentru a ne accelera viteza de dezvoltare, în loc să folosim mereu CLI-ul standard de Git, am integrat câteva scripturi de bază în `scripts/git/`.

## Scripturi Disponibile
Acestea se pot accesa fie rulând direct scriptul corespondent, fie folosind fișierul `sync.bat` general din main root dacă există shortcut-uri configurate.

- **`sync_universal.bat`**: Script avansat și interactiv pentru a lucra cu git. Rulându-l vei avea un meniu în linia de comandă.
- **`sync_main.bat`**: De regulă utilizat pentru a aduce branchul actual la zi cu master-ul sau pentru o trimitere rapidă fără configurare (în funcție de alias-uri).

## Meniul din sync_universal.bat
1. **Nou Task**: Automatizează procesul de `git checkout main`, `git pull`, urmat de crearea și mutarea pe un branch nou (`git checkout -b nume-branch`). Prevăzuți cu siguranță să nu editezi pe `main` direct!
2. **Continua Task Vechi**: Revine pe ramura ta locală existentă și o actualizează cu `.git fetch` și `.merge` din main automat.
4. **Trimitere Cod**: Acesta face un `git add .`, îți cere numele commitului și face automat `git push -u origin branch_curent`.
5. **Creare PR**: Deschide un tab automat în browser pentru a cere unirea ramurii tare către master.

Snapback Feature: Automat îți va re-configura remotes-urile la repo-ul tău în conformitate cu fișierul ascuns `.git_remote` ca să nu trimiți peripeții în afara serverului agreat.

## Pentru Asistenți AI
Când vi se cere să "salvați munca" pe GitHub în acest sistem, **este recomandat fie să sugerați folosirea `sync_universal.bat` de către utilizator, fie să oferiți comanda doar cu aprobare.** E de datoria utilizatorului să aleagă ramura sau mesajul commit-ului în mod corespunzător scriptului interactiv.
