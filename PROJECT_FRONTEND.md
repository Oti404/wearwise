# 📱 WearWise - Arhitectura Frontend

Acest document descrie la cel mai adânc nivel detaliile pe care trebuie să le cunoască orice Frontend Developer care lucrează pe WearWise. Aplicația este construită exclusiv în **React Native** folosind arhitectura **Expo**.

## 🛠️ Stack-ul Tehnologic Frontend

*   **Framework**: React Native v0.81.5 prin arhitectura Expo modernă (SDK ~54).
*   **Navigație**: `expo-router` v6 pentru rutare file-based. Transformă o structură de dosare `/app` într-o rețea logică de ecrane.
*   **State Management**: `zustand` pentru gestiunea de stare globală eficientă, simplă și neinterferentă.
*   **Stilizare**: TailwindCSS, integrat prin configurații dedicate (`tailwind.config.js`). Design system-ul preferă clase utilitare.
*   **Autentificare**: Integrare cu pachetul `@supabase/supabase-js`, delegată pentru fluxul principal.
*   **Iconografie**: `lucide-react-native` alături de colecția clasică `@expo/vector-icons`.
*   **Pachete Suplimentare Centrale**: 
    *   `react-native-maps` pentru interacțiuni de locație geocodate (ex: preluare haină din apropiere).
    *   `react-native-deck-swiper` și gesture handlers pentru animatii UI (e.g., mecanisme swipe stil tinder, galerii media).
    *   Fonturi personalizate din `@expo-google-fonts` (`mali`, `outfit`, `quicksand` etc.).

## 📂 Structura Arhitecturală a Codului

Platforma utilizează fișierul `app.json` pentru generarea buildurilor pre-compilate prin EAS Build de la Expo pentru Android/iOS.
Structura de lucru pentru un task de UI interactiv va avea ca root `app/`:

*   **`frontend/app/`**: Aici rezidă logica grafică.
    *   **`(tabs)/`**: Definiția meniului de la baza ecranului. Paginile fundamentale ale aplicației (Home, Explore/Resale etc.).
    *   **`_layout.tsx`**: Punctul de entry unde se face definirea ierarhiei navigationului principal și inițializarea contextelor.
    *   **`add-item.tsx`**: Fluxul (workflow-ul) extrem de complex de inserare și confirmare a unei poze care ulterior va fi comunicată API-ului și apoi AI-ului.
    *   **`resale/`** și **`user/`**: Componente modularizate pentru management de catalog haine și vizualizări pagini utilizatori.
    *   **`login.tsx`** & **`register.tsx`**: Puncte de pornire pentru utilizatori neautentificați, de regulă ascunse o dată ce `token-ul` persistă.
*   **`frontend/components/`**: Pentru componente pur "dumb/UI", butoane particularizate, carduri de haine refolosibile, avatare.
*   **`frontend/store/`**: Definește `slice`-urile de stare pentru Zustand (e.g., Auth Store, Wardrobe Store etc.).

## 🔄 Interacțiunea cu Backend-ul

Aplicația folosește instanțe standard de API Call, fie prin standardul global `fetch`, fie axios. Orice request legat de business data poartă un header de tip `Authorization: Bearer <TOKEN>`, obținut de la instanța locală a Supabase sau din state-ul Zustand.

*   Nu stocați secrete/chei API private în codul de Expo! Totul ajunge în pachetul clientului.
*   Navigarea între rute preia parametri din url-uri de formă expo-router ex: `router.push({ pathname: '/item/[id]', params: { id: item.id } })`.

## ⚙️ Generare Build & Linting

Fisierul `package.json` definește comenzi utile pe care un developer ar trebui sa le foloseasca.
*   Folosind ramura/funcția dev via scriptul `sync.bat`, pornirea standard execută implicit `expo start`.
*   Regulile de formatare cod se execută via `npm run lint`. Recomandăm remedierea erorilor ridicate de `lint_output.txt` vizualizând un standard intern strict.
