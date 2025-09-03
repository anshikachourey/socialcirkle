import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyAAXZw8dSnhAh4OTrC1hpGssvkddn0QDfU",
  authDomain: "socialcirkle-42d8b.firebaseapp.com",
  projectId: "socialcirkle-42d8b",
  storageBucket: "socialcirkle-42d8b.appspot.com",
  messagingSenderId: "896069729535",
  appId: "1:896069729535:web:f88b8e547ab7b8dc9a60ca",};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
