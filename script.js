import { db } from './firebaseConfig.js'; 
import { toggleTheme, initializeTheme } from './themeManager.js';
import { versiculosAmor } from './versiculos.js';
import {
  doc, setDoc, onSnapshot, collection, addDoc, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

initializeTheme();
window.toggleTheme = toggleTheme;

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1459529125558620286/uO-xs7kyACYVNmNGPEsCP8KPgIRMVfeVczRykaf3NiXmOBm389OHNeRSrxPgBXlPdAJ5';

async function enviarParaDiscord(embed) {
    if (!WEBHOOK_URL || WEBHOOK_URL.includes('SUA_URL')) return;
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [embed]
            })
        });
    } catch (e) {}
}

const txtElement = document.getElementById('versiculo-texto');
const refElement = document.getElementById('versiculo-ref');

function mudarVersiculo() {
    txtElement.classList.add('fade-out');
    setTimeout(() => {
        const index = Math.floor(Math.random() * versiculosAmor.length);
        const v = versiculosAmor[index];
        txtElement.innerText = `"${v.texto}"`;
        refElement.innerText = v.referencia;
        txtElement.classList.remove('fade-out');
    }, 500);
}
mudarVersiculo();
setInterval(mudarVersiculo, 30000); 

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
  
  const statusTexto = quer ? "Quero conversar" : "Não quero conversar";
  const corEmbed = quer ? 3066993 : 15158332;

  enviarParaDiscord({
    title: "😉 Atualização de Humor",
    description: `No momento Ana quer: **${statusTexto}**`,
    color: corEmbed,
    timestamp: new Date().toISOString()
  });
};

onSnapshot(doc(db, "status", "atual"), (snap) => {
  if (!snap.exists()) return;
  const data = snap.data();
  amorRange.value = data.amor || 0;
  incodomoRange.value = data.incodomo || 0;
  amorValor.innerText = data.amor || 0;
  incodomoValor.innerText = data.incodomo || 0;
  document.getElementById("statusConversa").innerText = data.conversa ? "Status: Quero conversar" : "Status: Não quero conversar";
  if (data.atualizadoEm) {
    document.getElementById("horaStatus").innerText = "Última atualização: " + data.atualizadoEm.toDate().toLocaleTimeString("pt-BR");
  }
});

let metaNotificada = 0;

window.clicarCoracao = async () => {
  const som = document.getElementById('heartSound');
  if (som) { som.currentTime = 0; som.play().catch(()=>{}); }
  await setDoc(doc(db, "status", "contadorAmor"), { total: increment(1) }, { merge: true });
};

onSnapshot(doc(db, "status", "contadorAmor"), (snap) => {
  if (!snap.exists()) return;
  const total = snap.data().total || 0;
  document.getElementById("contadorAmor").innerText = total;

  if (!snap.metadata.hasPendingWrites) {
    if (total > 0 && total % 50 === 0 && total !== metaNotificada) {
      metaNotificada = total;
      enviarParaDiscord({
        title: "💖 Metas de Amor",
        description: `Escolhemos nos amar **${total}** vezes`,
        color: 15418782,
        timestamp: new Date().toISOString()
      });
    }
  }
});

window.enviarSaudade = () => {
    enviarParaDiscord({
      title: "🥺 Botão da Saudades",
      description: "Ir dar atenção imediatamente",
      color: 15418782,
      timestamp: new Date().toISOString()
    });
    
    const container = document.getElementById('chuva-coracoes');
    for (let i = 0; i < 15; i++) {
        const c = document.createElement('div');
        c.innerHTML = '❤️';
        c.className = 'coracao-queda';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.animationDuration = (Math.random() * 2 + 1) + 's';
        container.appendChild(c);
        setTimeout(() => c.remove(), 3000);
    }
};

const musica = document.getElementById('musicaPrincipal');
const volRange = document.getElementById('volumeMusica');

window.revelarFrase = () => {
  const frase = document.getElementById('fraseTexto');
  const botao = document.getElementById('btnRevelarFrase');
  const controles = document.getElementById('musica-controls');
  
  if (frase.style.display === 'block') {
    frase.style.display = 'none';
    controles.style.display = 'none';
    botao.innerText = 'Revelar frase';
    musica.pause();
    musica.currentTime = 0;
  } else {
    frase.style.display = 'block';
    controles.style.display = 'flex';
    botao.innerText = 'Esconder frase';
    musica.play().catch(() => {});
  }
};

window.toggleMute = () => {
  musica.muted = !musica.muted;
  document.getElementById('btnMute').innerText = musica.muted ? "🔊 Ativar" : "🔇 Mutar";
};

volRange.addEventListener('input', (e) => {
  musica.volume = e.target.value;
});

window.salvarMensagem = async (pessoa) => {
  const input = document.getElementById(pessoa + "Input");
  const texto = input.value.trim();
  if (!texto) return;
  
  await addDoc(collection(db, "mensagens", pessoa, "lista"), { texto, hora: serverTimestamp() });
  
  enviarParaDiscord({
    title: "💬 Nova Mensagem",
    description: `**${pessoa.toUpperCase()}** enviou uma nova mensagem no site`,
    color: 10181046,
    timestamp: new Date().toISOString()
  });
  
  input.value = "";
};

["ana", "marcos"].forEach((pessoa) => {
  const lista = document.getElementById(pessoa + "Lista");
  onSnapshot(collection(db, "mensagens", pessoa, "lista"), (snap) => {
    lista.innerHTML = ""; 
    snap.docs.map(doc => ({ ...doc.data() }))
      .sort((a, b) => b.hora?.toDate() - a.hora?.toDate())
      .forEach((data) => {
        const li = document.createElement("li");
        const hora = data.hora ? data.hora.toDate().toLocaleTimeString("pt-BR") : "...";
        li.innerHTML = `<span>${data.texto}</span><div class="hora">${hora}</div>`;
        lista.appendChild(li);
      });
  });
});
