import { db } from './firebaseConfig.js'; 
import { toggleTheme, initializeTheme } from './themeManager.js';
import { versiculosAmor } from './versiculos.js';
import { versiculosMusicas } from './versiculosMusicas.js';
import {
    doc, setDoc, onSnapshot, collection, addDoc, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

initializeTheme();
window.toggleTheme = toggleTheme;

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1459529125558620286/uO-xs7kyACYVNmNGPEsCP8KPgIRMVfeVczRykaf3NiXmOBm389OHNeRSrxPgBXlPdAJ5';

async function enviarParaDiscord(embed) {
    if (!WEBHOOK_URL) return;
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (e) {}
}

const musicaPrincipal = document.getElementById('musicaPrincipal');
const somMar = document.getElementById('audioRespiracao');
const somPlim = document.getElementById('somPlim');
const somPop = document.getElementById('popSound');
const somCoracao = document.getElementById('heartSound');
const somDestruir = document.getElementById('somDestruir');

window.alternarAreaJogos = () => {
    const principal = document.getElementById('conteudoPrincipal');
    const jogos = document.getElementById('areaJogos');
    const telas = ['telaPlasticoBolha', 'telaRespiracao', 'telaRemoverPensamentos', 'telaMusiquinhas'];

    const algumaTelaAtiva = telas.some(id => {
        const el = document.getElementById(id);
        return el && el.style.display === 'block';
    });

    if (jogos.style.display === 'block' || algumaTelaAtiva) {
        if (document.getElementById('telaMusiquinhas').style.display === 'block') {
            window.fecharMusiquinhas();
        }

        jogos.style.display = 'none';
        telas.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        
        principal.style.display = 'block';
        window.finalizarRespiracao(); 
    } else {
        principal.style.display = 'none';
        jogos.style.display = 'block';
    }
    window.scrollTo(0, 0);
};

let intervaloVersiculoMusica;

window.abrirMusiquinhas = () => {
    document.getElementById('areaJogos').style.display = 'none';
    document.getElementById('telaMusiquinhas').style.display = 'block';
    
    const iframe = document.querySelector('#spotify-container iframe');
    if (iframe) {
        const url = iframe.src;
        iframe.src = url; 
    }

    window.iniciarVersiculosMusica();
};

window.fecharMusiquinhas = () => {
    if (intervaloVersiculoMusica) {
        clearInterval(intervaloVersiculoMusica);
        intervaloVersiculoMusica = null;
    }

    const iframe = document.querySelector('#spotify-container iframe');
    if (iframe) {
        const url = iframe.src;
        iframe.src = '';
        iframe.src = url;
    }

    document.getElementById('telaMusiquinhas').style.display = 'none';
    document.getElementById('areaJogos').style.display = 'block';
};

window.iniciarVersiculosMusica = () => {
    const txtMusica = document.getElementById('v-musica-texto');
    const refMusica = document.getElementById('v-musica-ref');
    
    if (!txtMusica || !versiculosMusicas) return;

    const indexInicial = Math.floor(Math.random() * versiculosMusicas.length);
    const vInicial = versiculosMusicas[indexInicial];
    
    txtMusica.innerText = `"${vInicial.texto}"`;
    refMusica.innerText = vInicial.referencia;
    txtMusica.classList.remove('fade-out');

    const mudarComAnimacao = () => {
        txtMusica.classList.add('fade-out');
        setTimeout(() => {
            const index = Math.floor(Math.random() * versiculosMusicas.length);
            const v = versiculosMusicas[index];
            txtMusica.innerText = `"${v.texto}"`;
            refMusica.innerText = v.referencia;
            txtMusica.classList.remove('fade-out');
        }, 500);
    };

    if (intervaloVersiculoMusica) clearInterval(intervaloVersiculoMusica);
    intervaloVersiculoMusica = setInterval(mudarComAnimacao, 20000); 
};

window.abrirPlasticoBolha = () => {
    document.getElementById('areaJogos').style.display = 'none';
    document.getElementById('telaPlasticoBolha').style.display = 'block';
    window.gerarBolhas();
};

window.fecharJogo = () => {
    document.getElementById('telaPlasticoBolha').style.display = 'none';
    document.getElementById('areaJogos').style.display = 'block';
};

window.gerarBolhas = () => {
    const container = document.getElementById('bubble-container');
    if (!container) return;
    container.innerHTML = ''; 
    const totalBolhas = 45; 
    let bolhasEstouradas = 0;
    for (let i = 0; i < totalBolhas; i++) {
        const bolha = document.createElement('div');
        bolha.className = 'bubble';
        bolha.addEventListener('click', () => {
            if (!bolha.classList.contains('popped')) {
                bolha.classList.add('popped');
                bolhasEstouradas++;
                if (somPop) { somPop.currentTime = 0; somPop.play().catch(()=>{}); }
                if (navigator.vibrate) navigator.vibrate(15);
                if (bolhasEstouradas === totalBolhas) {
                    setTimeout(() => { window.gerarBolhas(); }, 300);
                }
            }
        });
        container.appendChild(bolha);
    }
};

let timerRespiracao;
const tocarPlim = () => {
    if (somPlim) {
        somPlim.currentTime = 0;
        somPlim.volume = 0.2; 
        somPlim.play().catch(()=>{});
    }
};

window.abrirRespiracao = () => {
    document.getElementById('areaJogos').style.display = 'none';
    document.getElementById('telaRespiracao').style.display = 'block';
    if(somMar) { somMar.play().catch(()=>{}); }
    window.iniciarCicloRespiracao();
};

window.fecharRespiracao = () => {
    window.finalizarRespiracao();
    document.getElementById('telaRespiracao').style.display = 'none';
    document.getElementById('areaJogos').style.display = 'block';
};

window.finalizarRespiracao = () => {
    clearTimeout(timerRespiracao);
    if(somMar) { somMar.pause(); somMar.currentTime = 0; }
};

window.iniciarCicloRespiracao = () => {
    const circulo = document.getElementById('circulo-respiracao');
    const texto = document.getElementById('instrucao-respiracao');
    if (!circulo) return;
    circulo.style.transition = "none"; 
    circulo.className = "contrair"; 
    texto.innerText = "Prepare-se...";

    const executarCiclo = () => {
        tocarPlim();
        texto.innerText = "Inspire pelo nariz...";
        circulo.style.transition = "all 4s ease-in-out";
        circulo.className = "expandir";
        timerRespiracao = setTimeout(() => {
            tocarPlim();
            texto.innerText = "Segure o ar...";
            timerRespiracao = setTimeout(() => {
                tocarPlim();
                texto.innerText = "Expire lentamente pela boca...";
                circulo.style.transition = "all 8s ease-in-out";
                circulo.className = "contrair";
                timerRespiracao = setTimeout(() => { executarCiclo(); }, 8000);
            }, 7000);
        }, 4000);
    };
    timerRespiracao = setTimeout(executarCiclo, 1000);
};

window.adicionarPensamento = () => {
    const input = document.getElementById('pensamentoInput');
    const btn = document.getElementById('btnAcaoPensamento');
    const container = document.getElementById('pensamentosAtivos');
    const textoPensamento = input.value.trim();

    if (textoPensamento !== "" && container.children.length > 0) {
        alert("Destrua o pensamento atual antes de enviar um novo! ✨");
        return;
    }

    if (textoPensamento === "" && container.children.length > 0) {
        const itemParaDestruir = container.children[0];
        if (itemParaDestruir && !itemParaDestruir.classList.contains('quebrar-impactante')) {
            btn.disabled = true;
            btn.innerText = "Destruindo...";
            if (somDestruir) { somDestruir.currentTime = 0; somDestruir.play().catch(()=>{}); }
            itemParaDestruir.classList.add('quebrar-impactante');
            setTimeout(() => {
                itemParaDestruir.remove();
                btn.disabled = false;
                btn.innerText = "Enviar Pensamento";
            }, 3000);
        }
        return;
    }

    if (textoPensamento === "") return;
    const pensamentoItem = document.createElement('div');
    pensamentoItem.className = 'pensamento-item';
    pensamentoItem.innerText = textoPensamento;
    container.appendChild(itemParaDestruir);
    btn.innerText = "Destruir Pensamento";
    input.value = ''; 
};

window.abrirRemoverPensamentos = () => {
    document.getElementById('areaJogos').style.display = 'none';
    document.getElementById('telaRemoverPensamentos').style.display = 'block';
};

window.fecharRemoverPensamentos = () => {
    document.getElementById('telaRemoverPensamentos').style.display = 'none';
    document.getElementById('areaJogos').style.display = 'block';
};

window.toggleMute = () => {
    const btn = document.getElementById('btnMute');
    if(musicaPrincipal) {
        musicaPrincipal.muted = !musicaPrincipal.muted;
        btn.innerText = musicaPrincipal.muted ? "🔊 Desmutar" : "🔇 Mutar";
    }
};

window.revelarFrase = () => {
    const frase = document.getElementById('fraseTexto');
    const controles = document.getElementById('musica-controls');
    if (frase.style.display === 'block') {
        frase.style.display = 'none';
        controles.style.display = 'none';
        if(musicaPrincipal) musicaPrincipal.pause();
    } else {
        frase.style.display = 'block';
        controles.style.display = 'flex';
        if(musicaPrincipal) musicaPrincipal.play().catch(() => {});
    }
};

const txtElement = document.getElementById('versiculo-texto');
const refElement = document.getElementById('versiculo-ref');
function mudarVersiculo() {
    if(!txtElement) return;
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

if(amorRange) {
    amorRange.addEventListener("input", (e) => amorValor.innerText = e.target.value);
    amorRange.addEventListener("change", syncNiveis);
}
if(incodomoRange) {
    incodomoRange.addEventListener("input", (e) => incodomoValor.innerText = e.target.value);
    incodomoRange.addEventListener("change", syncNiveis);
}

window.setConversa = async (quer) => {
    await setDoc(doc(db, "status", "atual"), {
        conversa: quer,
        atualizadoEm: serverTimestamp()
    }, { merge: true });
    const statusTexto = quer ? "Quero conversar" : "Não quero conversar";
    enviarParaDiscord({
        title: "⭐ Atualização de Humor",
        description: `No momento Ana: **${statusTexto}**`,
        color: quer ? 3066993 : 15158332, 
        timestamp: new Date().toISOString()
    });
};
onSnapshot(doc(db, "status", "atual"), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    if(amorRange) {
        amorRange.value = data.amor || 0;
        amorValor.innerText = data.amor || 0;
    }
    if(incodomoRange) {
        incodomoRange.value = data.incodomo || 0;
        incodomoValor.innerText = data.incodomo || 0;
    }
    const statusTxt = document.getElementById("statusConversa");
    if(statusTxt) statusTxt.innerText = data.conversa ? "Status: Quero conversar" : "Status: Não quero conversar";
    
    if (data.atualizadoEm && document.getElementById("horaStatus")) {
        document.getElementById("horaStatus").innerText = "Última atualização: " + data.atualizadoEm.toDate().toLocaleTimeString("pt-BR");
    }
});

let metaNotificada = 0;
window.clicarCoracao = async () => {
    if (somCoracao) { somCoracao.currentTime = 0; somCoracao.play().catch(()=>{}); }
    await setDoc(doc(db, "status", "contadorAmor"), { total: increment(1) }, { merge: true });
};

onSnapshot(doc(db, "status", "contadorAmor"), (snap) => {
    if (!snap.exists()) return;
    const total = snap.data().total || 0;
    const cont = document.getElementById("contadorAmor");
    if(cont) cont.innerText = total;

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
        description: "Ir da atenção imediatamente",
        color: 15418782,
        timestamp: new Date().toISOString()
    });

    const container = document.getElementById('chuva-coracoes');
    if(!container) return;
    for (let i = 0; i < 15; i++) {
        const c = document.createElement('div');
        c.innerHTML = '❤️';
        c.className = 'coracao-queda';
        c.style.left = Math.random() * 100 + 'vw';
        container.appendChild(c);
        setTimeout(() => c.remove(), 3000);
    }
};

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
    if(!lista) return;
    onSnapshot(collection(db, "mensagens", pessoa, "lista"), (snap) => {
        lista.innerHTML = ""; 
        snap.docs.map(doc => ({ ...doc.data(), id: doc.id }))
            .sort((a, b) => (b.hora?.toDate() || 0) - (a.hora?.toDate() || 0))
            .forEach((data) => {
                const li = document.createElement("li");
                const hora = data.hora ? data.hora.toDate().toLocaleTimeString("pt-BR") : "...";
                li.innerHTML = `<span>${data.texto}</span><div class="hora">${hora}</div>`;
                lista.appendChild(li);
            });
    });
});


