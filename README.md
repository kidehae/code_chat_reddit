Markdown
# Reddit Tech Intel AI 🚀 (RAG System)

An advanced, end-to-end Retrieval-Augmented Generation (RAG) platform that monitors developer discussions across high-signal programming communities, vectorizes insights, and answers technical inquiries with zero hallucinations using contextual source citations.

🌐 **Live API Engine:** [https://code-chat-reddit-1.onrender.com](https://code-chat-reddit-1.onrender.com)

---

## 🏗️ System Architecture & Data Flow

The platform relies on two completely decoupled processing timelines: an automated background data worker and a live query execution gateway.

BACKGROUND PIPELINE (Every 6 Hours):
[Reddit RSS Feeds] ──> [Text Chunker] ──> [Hugging Face (Embeddings)] ──> [Supabase pgvector]

LIVE REQ INTERACTION:
[User Input] ──> [NestJS Validation Pipe (XSS Block)] ──> [Supabase Vector Search (Cosine Distance)]
│
[Frontend UI] <── [Groq Llama-3 Contextual Completion] <─────────────┘


### 1. The Autonomous Ingestion Loop (The "R" in RAG)
* **Target Syncing:** Every 6 hours, a NestJS Cron service targets configured tech-focused subreddits (`reactjs`, `typescript`, `nestjs`, `python`, etc.) via sanitized XML Atom streams.
* **Granular Chunking:** Text bodies are stripped of tracking tags and parsed into semantic blocks of 500 characters with an intentional 50-character sliding overlap to maintain conversational context.
* **Vector Vectorization:** Chunks are dispatched to the Hugging Face Inference API running `sentence-transformers/all-MiniLM-L6-v2` to compile text layouts into 384-dimensional coordinate maps.
* **Database Retention:** Coordinates are loaded into a PostgreSQL instance managed by Supabase, utilizing the `pgvector` index extension. At midnight, an automated housekeeping script drops elements older than 30 days to optimize cache storage.

### 2. Live Query Execution (The "AG" in RAG)
* **Gateway Security Filters:** Requests undergo strong checking via NestJS `ValidationPipe` custom input filters. Payloads containing standard XSS markers or injection tags (`<script>`, `<h1>`) are thrown out instantly with a `400 Bad Request`.
* **Cosine Distance Calculation:** Clean questions are mirrored into query vectors via Hugging Face. The system runs an RPC database procedure (`match_documents`) executing native cosine math (`<=>`) to sort and extract the top 5 closest matching community threads.
* **Injected Generation:** Groq Cloud Services running hyper-fast `llama-3.1-8b-instant` processors consume the unified prompt context to format a cohesive, accurate response packaged with full citations.

---

## 🛠️ The Tech Stack

* **Backend Framework:** NestJS (TypeScript Node.js Framework)
* **Vector Database:** Supabase Engine (PostgreSQL + `pgvector`)
* **Embedding Model:** Hugging Face Inference API (`all-MiniLM-L6-v2`)
* **Inference LLM:** Groq API Cloud Engine (`llama-3.1-8b-instant`)
* **Frontend Layer:** React (Vite, Tailwind CSS, Lucide Architecture)
* **Cloud Platform:** Hosted via Render Web Services

---

## 🚀 Local Installation & Setup

### 1. Prerequisites
Ensure you have Node.js (v18 or newer) and npm installed.

### 2. Environment Variables Configuration
Create a `.env` file in your root folder and supply the following authorization keys:
```env
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
HF_TOKEN=your_huggingface_inference_token
GROQ_API_KEY=your_groq_dashboard_api_key
3. Execution Commands
Bash
# 1. Install structural node modules
$ npm install

# 2. Start the local server environment in watch/reload mode
$ npm run start:dev

# 3. Compile optimized production assets (Build check)
$ npm run build
🧪 Real-World API Test Signatures
Standard Context Search Request
Plaintext
GET /chat?question=What is the difference between types and interfaces in typescript?
Expected Blueprint Status (200 OK):

JSON
{
  "question": "What is the difference between types and interfaces in typescript?",
  "answer": "Based on provided Reddit discussions... Types focus on values while interfaces act as a shape blueprint... [Source: r/typescript]"
}
Input Injection Protection Check
Plaintext
GET /chat?question=<h1>Hacked Code Execution Test</h1>
Expected Firewall Rejection (400 Bad Request):

JSON
{
  "statusCode": 400,
  "message": "HTML tags and angle brackets are not allowed in the question.",
  "error": "Bad Request"
}

