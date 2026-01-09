import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmZ04cz0jw5s1GsycT-RatZEUzJFh_ESw",
  authDomain: "siteparaana.firebaseapp.com",
  projectId: "siteparaana"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);