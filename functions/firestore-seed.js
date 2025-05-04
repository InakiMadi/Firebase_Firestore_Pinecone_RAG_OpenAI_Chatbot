const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const admin = require("firebase-admin");

// Initialize with explicit configuration
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "fir-openairag"
});
const db = getFirestore();

const knowledgeBase = [
  "Firebase is a Backend-as-a-Service platform by Google",
  "Firestore is Firebase's NoSQL document database",
  "Cloud Functions are serverless functions in Firebase"
];

async function seedDocuments() {
  for (const text of knowledgeBase) {
    await db.collection('documents').add({
      text: text,
      createdAt: FieldValue.serverTimestamp()
    });
  }
  console.log(`${knowledgeBase.length} documents added`);
}

seedDocuments().catch(console.error);