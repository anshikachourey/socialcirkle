// src/firebase.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("service-account.json", "utf8"));

const app = initializeApp({
  credential: cert(serviceAccount),
});

export const adminAuth = getAuth(app);

