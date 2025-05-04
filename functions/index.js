require('dotenv').config();

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { Pinecone } = require("@pinecone-database/pinecone");
const { OpenAI } = require("openai");

// Initialize Firebase and services
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "fir-openairag"
});
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

exports.askAI = functions.https.onRequest(async (req, res) => {
  // Handle CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { question } = req.body;

    // 1. Generate embedding for the question
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });

    // 2. Query Pinecone for similar documents
    const pineconeIndex = pinecone.Index("openai-rag-index");
    const results = await pineconeIndex.query({
      vector: embedding.data[0].embedding,
      topK: 3,
      includeMetadata: false,
    });

    // 3. Fetch full text from Firestore using Pinecone's matched IDs
    const docs = await Promise.all(
      results.matches.map(async (match) => {
        const doc = await admin.firestore().collection("documents").doc(match.id).get();
        return doc.data().text;
      })
    );

    // 4. Generate AI response with prompt engineering
    const prompt = `Answer based on the following documents:\n${docs.join("\n")}\n\nQuestion: ${question}`;
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ answer: aiResponse.choices[0].message.content });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "AI failed to respond" });
  }
});