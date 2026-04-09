# 🧠 WearWise - Arhitectura AI Engine

Acest document descrie componenta de Deep Learning creată special pentru a valida, clasifica și eticheta inteligent hainele încărcate de utilizatori.

## 🧬 Tehnologii și Modele utilizate

*   **Limbaj / Runtime**: Python 3 rulate într-un Virtual Environment `.venv` complet izolat.
*   **Web Framework**: **FastAPI** rulat prin `uvicorn`. Un microserviciu rapid, complet documentat (Swagger/OpenAPI out of the box), gata de acceptat request-uri via HTTP REST.
*   **Structura de Deep Learning**: **PyTorch** & ecosistemul **HuggingFace Transformers**.
*   **Modele Specifice Curente (Pipelines)**: Arhitectură logică completată în doua mari etape "2-stage pipeline":
    1.  **Binary Classifier (Custom)**: Rețea mică antrenată binar să discrimineze între `clothing` vs `not_clothing`. Ocupă nivelul "Poarta Principală". Punctele de date / checkpointurile sale locuiesc la adresa `artifacts/binary_clothing/best_binary_clothing.pt`. Astfel blocăm request-urile care conțin mașini, pereți, peisaje direct de la rădăcină.
    2.  **Zero-Shot Type Classifier**: Sistem CLIP masiv (`openai/clip-vit-base-patch32`), ne-supravegheat, care găsește înțelesurile semantice între imagini și o colecție de fraze (textual prompts). De exemplu: diferențiază clar, vizual și matematic un `t-shirt`, o pereche de `jeans` sau `shoes`.

## 🌐 API Endpoints - Web Service

Dacă pornim API-ul prin `serve.py` (Rulează prestabilit pe `127.0.0.1:8000`), el ascultă pe rutele:
-   `GET /health`: Răspunde cu status code-ul și integritatea server-ului, asigurând back-end-ul că poate rula apeluri.
-   `POST /classify/path`: Endpoint folosit predominant local unde backend-ul, folosind un fișier de pe HDD, va transmite un `image_path` (pentru zero latency file transfer) + alți weight tuning params (`binary_threshold`, `top_k`).
-   `POST /classify/file`: Expects multi-part Form Data (`file`). Util pentru momente când serverul AI este distribuit pe infrastructură externă/Docker.

## 🗃️ Output Standardizat
JSON-ul trimis către de Engine către Node.js va avea mereu formatul consistent de mai jos (contract tehnic strict):

```json
{
  "is_clothing": true, // Decizia Stage 1
  "label": "pants",    // Etichetarea curată (Stage 2) dacă is_clothing este true
  "confidence": 0.96,  // Nivelul de certitudine (metrică pentru validare)
  "clothing_confidence": 0.98,
  "non_clothing_confidence": 0.02,
  "top_predictions": ["pants", "jeans"],
  "binary_prediction": "clothing"
}
```
*Notă:* Dacă o imagine e rejectată (`is_clothing: false`), `confidence` reflectă încrederea sistemului că NU este o haină, iar `label` este gol, ajutând back-end-ul de Node să blocheze imediat publicarea greșită pe Wall-ul public de iteme sociale.

## 🎛️ Cum funcționează sistemul de "Sursă de Adevăr Hibridă" (`classifier.py`, `service.py`)

Aplicația instanțiază o data unicul wrapper `hybrid_classifier` in memorie, în faza de initializare a server-ului:
- **`classifier.py`**: Aici se afla nucleul clasei CLIP. E folosit un dicționar de template-uri în NLP pentru ca asamblarea semantică "A photo of a [LABEL]" să potrivească matricial o poză cu labelurile date de domain business-ul nostru (pantofi, blugi, hanorace).
- **`binary_clothing_model.py`**: Modelul minimalist torchvision/resnet folosit pentru eficiență înainte de a aduce greoiul CLIP in peisaj.

## 🚀 Cum repornim sau antrenam acest ecosistem in pipeline
-   Utilizați sistemul complet `main.py` pentru testare individuală din consolă: `python main.py --image "poza.png" --pretty` – util de analizat direct în IDE.
-   Pentru a adăuga categorii noi în viitor, adăugați etichetele textuale în dicționarele interne / mappings din script-ul Python; nu sunt necesare reantrenări scumpe – **Asta face forța modelului Zero-Shot CLIP**.
-   Prima rulare pe o mașină nouă va descarca seturile globale CLIP în propriul cache, un mediu de rulare izolat este mandatoriu !
