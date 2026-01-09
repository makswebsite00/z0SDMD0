import { db } from './firebaseConfig.js'; 
import { toggleTheme, initializeTheme } from './themeManager.js';
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

initializeTheme();

window.toggleTheme = toggleTheme;

const amorRange = document.getElementById("amorRange");
const incodomoRange = document.getElementById("incodomoRange"); 
const amorValor = document.getElementById("amorValor");
const incodomoValor = document.getElementById("incodomoValor"); 

const syncNiveis = async () => {
  await setDoc(doc(db, "status", "atual"), {
    amor: Number(amorRange.value),
    incodomo: Number(incodomoRange.value),
    atualizadoEm: serverTimestamp()
  }, { merge: true });
};

amorRange.addEventListener("input", (e) => amorValor.innerText = e.target.value);
incodomoRange.addEventListener("input", (e) => incodomoValor.innerText = e.target.value);
amorRange.addEventListener("change", syncNiveis);
incodomoRange.addEventListener("change", syncNiveis);

window.setConversa = async (quer) => {
  await setDoc(doc(db, "status", "atual"), {
    conversa: quer,
    atualizadoEm: serverTimestamp()
  }, { merge: true });
};

onSnapshot(doc(db, "status", "atual"), (snap) => {
  if (!snap.exists()) return;
  const data = snap.data();

  amorRange.value = data.amor || 0;
  incodomoRange.value = data.incodomo || 0;
  amorValor.innerText = data.amor || 0;
  incodomoValor.innerText = data.incodomo || 0;

  document.getElementById("statusConversa").innerText =
    data.conversa ? "Status: Quero conversar" : "Status: Não quero conversar";

  if (data.atualizadoEm) {
    document.getElementById("horaStatus").innerText =
      "Última atualização: " + data.atualizadoEm.toDate().toLocaleTimeString("pt-BR");
  }
});

const contadorRef = doc(db, "status", "contadorAmor");

window.clicarCoracao = async () => {
  await setDoc(contadorRef, { total: increment(1) }, { merge: true });
};

onSnapshot(contadorRef, (snap) => {
  if (!snap.exists()) {
    setDoc(contadorRef, { total: 0 }, { merge: true });
    document.getElementById("contadorAmor").innerText = 0;
    return;
  }
  document.getElementById("contadorAmor").innerText = snap.data().total || 0;
});

window.salvarMensagem = async (pessoa) => {
  const input = document.getElementById(pessoa + "Input");
  const texto = input.value.trim();
  if (!texto) return;

  await addDoc(collection(db, "mensagens", pessoa, "lista"), {
    texto,
    hora: serverTimestamp()
  });

  input.value = "";
};

["ana", "marcos"].forEach((pessoa) => {
  const lista = document.getElementById(pessoa + "Lista");
  onSnapshot(collection(db, "mensagens", pessoa, "lista"), (snap) => {
    lista.innerHTML = ""; 
    const mensagensOrdenadas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                                    .sort((a, b) => b.hora?.toDate() - a.hora?.toDate());

    mensagensOrdenadas.forEach((data) => {
      const li = document.createElement("li");
      const hora = data.hora ? data.hora.toDate().toLocaleTimeString("pt-BR") : "Aguardando...";
      li.innerHTML = `
        <span>${data.texto}</span>
        <div class="hora">${hora}</div>
      `;
      lista.appendChild(li);
    });
  });
});