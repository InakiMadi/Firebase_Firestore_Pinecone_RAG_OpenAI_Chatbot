require('dotenv').config();

const admin = require("firebase-admin");
const { getFirestore } = require('firebase-admin/firestore');
const { Pinecone } = require('@pinecone-database/pinecone');
const { OpenAI } = require('openai');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "fir-openairag"
});
const db = getFirestore();

// Initialize clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

async function initializePinecone() {
  // Get all documents from Firestore
  const snapshot = await db.collection('documents').get();

  // Process each document
  for (const doc of snapshot.docs) {
    const text = doc.data().text;

    // Generate embedding
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text
    });

    // Upsert to Pinecone
    await pinecone.Index('openai-rag-index').upsert([{
      id: doc.id,
      values: embedding.data[0].embedding,
      metadata: { text } // Store the original text as metadata
    }]);
  }

  console.log(`Successfully indexed ${snapshot.size} documents to Pinecone`);
}

initializePinecone().catch(console.error);