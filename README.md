# Firebase Pinecone RAG OpenAI Chatbot

## App

Hosting URL: https://fir-openairag.web.app

## History

1. Firebase:

```
npm install -g firebase-tools
firebase login
firebase use --add <NAME_PROJECT>
firebase use <NAME_PROJECT>
firebase init firestore
```

And create a Firestore Database as a Cloud Firestore in production mode.

Add a collection named 'Documents'. 

Go to Firebase Console, select your project, Project settings, Service accounts tab, Generate new private key (JSON).

Put the JSON file in your project, and:

```
$env:GOOGLE_APPLICATION_CREDENTIALS="path\to\your-service-account-file.json"
```

Then,

```
node firestore-seed.js
```

And you should see "3 documents added".

Can check the added documents in console.firebase.google.com in Firestore Database section in the left part.

2. Set env. variables:
```
set FUNCTIONS_DISCOVERY_TIMEOUT=100 
```

Save API keys in a .env as:

```
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY
PINECONE_API_KEY=YOUR_PINECOKE_KEY
```

3. Install dependencies:

```
cd functions
npm install
npm install dotenv --save
```

4. Firestore to Pinecone:

Create a Pinecone index called "openai-rag-index", as an OpenAI index that uses text-embedding-3-small.

```
node firestore-to-pinecone.js
```

You should see "Successfully indexed 3 documents to Pinecone".

You can check in app.pinecone.io, going to your project, database, indexes.

5. Deploy:

```
firebase deploy --only hosting,functions
```

If only frontend is desired:

```
firebase deploy --only hosting
```

If only backend is desired:

```
firebase deploy --only functions
```

Hosting URL: https://fir-openairag.web.app

## Details of the project

1. Frontend UI: Firebase Hosting.
   - HTTP POST request to Firebase Function askAI (fetch()).
   - Dynamic UI using DOM manipulation with innerHTML.
2. Backend Logic: Firebase Functions + OpenAI.
   - HTTP Trigger with askAI:
     - Embedding with OpenAI's text-embedding-3-small.
     - Vector Search: Queries Pinecone for the top 3 closest document vectors to the question vector.
     - Firestore Retrieval: Fetches full text of matched documents using docId from Pinecone.
     - AI Completion: Constructs a prompt with retrieved context and sends it to GPT-4.
   - Firestore Trigger with processDoc:
     - Automatically generates embeddings for new Firestore documents and stores them in Pinecone.
3. Configuration (firebase.json).
   - Serves index.html for all routes.
   - Ignores unnecessary files, like node_modules.
   - Functions runtime specified Node.js 18.
4. Dependencies (package.json).
   - @pinecone-database/pinecone: Pinecone SDK for vector operations.
   - openai: OpenAI API client for embeddings and chat completions.
   - firebase-admin/firebase-functions: Interact with Firestore and deploy serverless functions.

### Architecture

User Uploads Doc → Firestore (raw text) → Firebase Function → OpenAI Embeddings → Pinecone (vectors)  

User Asks Question → Pinecone Search → Firestore (get full text) → OpenAI GPT-4 → Response

Firestore -> OpenAI Embeddings -> Pinecone (vector index) -> GPT-4 (generation)