(function () {
    'use strict';

    const c = window.CONVITE;
    const $ = (sel) => document.querySelector(sel);
    const html = document.documentElement;
    const movimentoReduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
    html.classList.add('pronto');

    // ---- Dados do evento ----

    // A data vem como AAAA-MM-DD; formatar em UTC evita exibir o dia anterior.
    const dataExtenso = new Intl.DateTimeFormat('pt-BR', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
    }).format(new Date(c.data + 'T00:00:00Z'));

    const textos = {
        homenageada: c.homenageada,
        dataExtenso,
        horario: c.horario,
        cidade: c.cidade,
        local: c.local || 'Local a ser revelado aos convidados confirmados',
        endereco: c.endereco,
    };
    document.querySelectorAll('[data-campo]').forEach((el) => {
        const valor = textos[el.dataset.campo];
        if (valor !== undefined) el.textContent = valor;
    });

    if (c.endereco) {
        $('[data-campo="endereco"]').hidden = false;
        const mapa = $('[data-campo="mapa"]');
        const busca = [c.local, c.endereco, c.cidade].filter(Boolean).join(', ');
        mapa.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(busca);
        mapa.hidden = false;
    }

    // ---- Música ----
    // Navegadores só tocam som depois de um gesto do visitante: o toque nos portões é esse gesto.

    const musica = $('#musica');
    const botaoSom = $('.som');
    const VOLUME = 0.35;
    let silenciada = false;
    try { silenciada = localStorage.getItem('musica-silenciada') === '1'; } catch (e) { /* armazenamento bloqueado */ }
    let rampa = 0;

    // Timer comum (e não requestAnimationFrame) para a rampa terminar mesmo com a aba em segundo plano.
    // O iPhone ignora mudanças de volume; lá a música toca no volume do próprio arquivo.
    function rampaVolume(alvo, ms, depois) {
        clearInterval(rampa);
        const inicio = Date.now();
        const de = musica.volume;
        rampa = setInterval(() => {
            const k = Math.min(1, (Date.now() - inicio) / ms);
            musica.volume = de + (alvo - de) * k;
            if (k < 1) return;
            clearInterval(rampa);
            if (depois) depois();
        }, 40);
    }

    function atualizarBotaoSom() {
        const tocando = !musica.paused;
        botaoSom.classList.toggle('mudo', !tocando);
        botaoSom.setAttribute('aria-label', tocando ? 'Silenciar música' : 'Tocar música');
    }

    function tocarMusica() {
        musica.volume = 0;
        const tentativa = musica.play();
        if (tentativa) tentativa.catch(atualizarBotaoSom);
        rampaVolume(VOLUME, 2500);
        atualizarBotaoSom();
    }

    function pausarMusica() {
        rampaVolume(0, 400, () => {
            musica.pause();
            atualizarBotaoSom();
        });
    }

    if (c.musica) {
        // '1:15' -> 75 segundos. O fragmento #t= faz o navegador já começar nesse ponto.
        const [min, seg] = String(c.musicaInicio || '0:00').split(':').map(Number);
        const inicio = (min || 0) * 60 + (seg || 0);
        musica.src = inicio ? `${c.musica}#t=${inicio}` : c.musica;
        // Repetição manual (sem o atributo loop) para voltar ao ponto escolhido, e não ao começo
        // da faixa: o volume some nos últimos segundos e reaparece ao recomeçar.
        const FADE_SAIDA = 3;
        let saindo = false;
        musica.addEventListener('timeupdate', () => {
            const resta = musica.duration - musica.currentTime;
            if (saindo || musica.paused || !(resta <= FADE_SAIDA)) return;
            saindo = true;
            rampaVolume(0, resta * 1000);
        });
        musica.addEventListener('ended', () => {
            saindo = false;
            musica.currentTime = inicio;
            tocarMusica();
        });
        botaoSom.hidden = false;
        atualizarBotaoSom();
        botaoSom.addEventListener('click', () => {
            silenciada = !musica.paused;
            try { localStorage.setItem('musica-silenciada', silenciada ? '1' : '0'); } catch (e) { /* idem */ }
            if (silenciada) pausarMusica();
            else tocarMusica();
        });
        musica.addEventListener('error', () => { botaoSom.hidden = true; });
        // Pausa ao trocar de aba e retoma ao voltar.
        document.addEventListener('visibilitychange', () => {
            if (silenciada || !html.classList.contains('aberto')) return;
            if (document.hidden) musica.pause();
            else tocarMusica();
        });
    }

    // ---- Portões e entrada ----

    // Os elementos são observados desde já; o CSS só os revela depois de .aberto.
    observarRevelacoes();
    const revelarConvite = () => html.classList.add('aberto');

    if (html.classList.contains('com-portoes')) {
        html.classList.add('travado');
        let abertos = false;
        const abrir = () => {
            if (abertos) return;
            abertos = true;
            if (c.musica && !silenciada) tocarMusica();
            html.classList.add('abrindo');
            setTimeout(revelarConvite, 900);
            setTimeout(() => html.classList.remove('com-portoes', 'abrindo', 'travado'), 2100);
        };
        $('.portoes').addEventListener('click', abrir);
        addEventListener('keydown', abrir, { once: true });
    } else {
        setTimeout(revelarConvite, 100);
    }

    function observarRevelacoes() {
        const alvos = document.querySelectorAll('.revelar, .revelar-linha, .ornamento');
        if (!('IntersectionObserver' in window)) {
            alvos.forEach((el) => el.classList.add('visivel'));
            return;
        }
        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                if (!entrada.isIntersecting) return;
                entrada.target.classList.add('visivel');
                observador.unobserve(entrada.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
        alvos.forEach((el) => observador.observe(el));
    }

    // ---- Barra e menu ----

    const barra = $('.barra');
    const atualizarBarra = () => barra.classList.toggle('rolada', scrollY > 40);
    addEventListener('scroll', atualizarBarra, { passive: true });
    atualizarBarra();

    const menu = $('#menu');
    const pilula = $('.barra-pilula');
    const hamburguer = $('.hamburguer');
    let quemAbriu = null;

    function definirMenu(aberto) {
        html.classList.toggle('menu-aberto', aberto);
        html.classList.toggle('travado', aberto);
        menu.inert = !aberto;
        [pilula, hamburguer].forEach((b) => b.setAttribute('aria-expanded', String(aberto)));
        pilula.querySelector('.pilula-rotulo').textContent = aberto ? 'Fechar' : 'Navegar';
        hamburguer.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
        if (aberto) {
            quemAbriu = document.activeElement;
            menu.querySelector('a').focus({ preventScroll: true });
        } else if (quemAbriu) {
            quemAbriu.focus({ preventScroll: true });
            quemAbriu = null;
        }
    }
    const alternarMenu = () => definirMenu(!html.classList.contains('menu-aberto'));
    pilula.addEventListener('click', alternarMenu);
    hamburguer.addEventListener('click', alternarMenu);
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
        quemAbriu = null;
        definirMenu(false);
    }));
    addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && html.classList.contains('menu-aberto')) definirMenu(false);
    });

    // ---- Poeira dourada flutuando na capa ----

    function iniciarPoeira() {
        const canvas = $('.poeira');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let largura = 0, altura = 0, rodando = false, visivel = false;
        let particulas = [];

        function nova(emQualquerAltura) {
            return {
                x: Math.random() * largura,
                y: emQualquerAltura ? Math.random() * altura : altura + 5,
                raio: 0.6 + Math.random() * 1.8,
                sobe: 0.15 + Math.random() * 0.35,
                deriva: (Math.random() - 0.5) * 0.15,
                fase: Math.random() * Math.PI * 2,
                alfa: 0.25 + Math.random() * 0.45,
            };
        }

        function medir() {
            const dpr = Math.min(devicePixelRatio || 1, 2);
            largura = canvas.clientWidth;
            altura = canvas.clientHeight;
            canvas.width = largura * dpr;
            canvas.height = altura * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const total = largura < 600 ? 22 : 40;
            particulas = Array.from({ length: total }, () => nova(true));
        }

        function quadro(t) {
            if (!visivel || document.hidden) { rodando = false; return; }
            ctx.clearRect(0, 0, largura, altura);
            for (const p of particulas) {
                p.y -= p.sobe;
                p.x += p.deriva + Math.sin(t / 1000 + p.fase) * 0.15;
                if (p.y < -5) Object.assign(p, nova(false));
                const brilho = p.alfa * (0.6 + 0.4 * Math.sin(t / 600 + p.fase));
                ctx.fillStyle = `rgba(176, 128, 52, ${brilho})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
                ctx.fill();
            }
            requestAnimationFrame(quadro);
        }

        function retomar() {
            if (rodando || !visivel || document.hidden) return;
            rodando = true;
            requestAnimationFrame(quadro);
        }

        new ResizeObserver(medir).observe(canvas);
        new IntersectionObserver(([entrada]) => {
            visivel = entrada.isIntersecting;
            retomar();
        }).observe(canvas);
        document.addEventListener('visibilitychange', retomar);
    }
    if (!movimentoReduzido && 'IntersectionObserver' in window && 'ResizeObserver' in window) iniciarPoeira();

    // ---- Visor das fotos de inspiração ----

    const itens = [...document.querySelectorAll('.galeria-item')];
    const visor = $('.visor');
    if (itens.length && visor && typeof visor.showModal === 'function') {
        const visorImg = visor.querySelector('.visor-img');
        const visorLegenda = visor.querySelector('.visor-legenda');
        const visorContador = visor.querySelector('.visor-contador');
        let atual = 0;

        function mostrar(indice) {
            atual = (indice + itens.length) % itens.length;
            const item = itens[atual];
            const src = item.querySelector('img').getAttribute('src');
            const legenda = item.querySelector('.galeria-legenda').textContent;
            if (visorImg.getAttribute('src') !== src) {
                visorImg.classList.add('trocando');
                visorImg.onload = () => visorImg.classList.remove('trocando');
                visorImg.src = src;
            }
            visorImg.alt = legenda;
            visorLegenda.textContent = legenda;
            visorContador.textContent = `${atual + 1} / ${itens.length}`;
        }

        itens.forEach((item, i) => item.addEventListener('click', () => {
            mostrar(i);
            visor.showModal();
            html.classList.add('travado');
        }));
        visor.addEventListener('close', () => html.classList.remove('travado'));
        visor.querySelector('.visor-fechar').addEventListener('click', () => visor.close());
        visor.querySelector('.visor-anterior').addEventListener('click', () => mostrar(atual - 1));
        visor.querySelector('.visor-proxima').addEventListener('click', () => mostrar(atual + 1));
        // Tocar fora da foto fecha (mas não ao terminar um deslize).
        let deslizou = false;
        visor.addEventListener('click', (e) => {
            if (e.target === visor && !deslizou) visor.close();
            deslizou = false;
        });
        visor.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') mostrar(atual - 1);
            if (e.key === 'ArrowRight') mostrar(atual + 1);
        });
        // Deslizar para os lados troca de foto.
        let inicioX = null;
        visor.addEventListener('pointerdown', (e) => { inicioX = e.clientX; });
        visor.addEventListener('pointerup', (e) => {
            if (inicioX === null) return;
            const dx = e.clientX - inicioX;
            inicioX = null;
            deslizou = Math.abs(dx) > 50;
            if (deslizou) mostrar(atual + (dx < 0 ? 1 : -1));
        });
    }

    // ---- Formulário de confirmação ----

    const form = $('#formulario');
    const nome = $('#nome');
    const nomeErro = $('#nome-erro');
    const acompanhantes = $('#acompanhantes');
    const nomes = $('#nomes');
    const observacoes = $('#observacoes');
    const blocoAcompanhantes = $('#bloco-acompanhantes');
    const blocoNomes = $('#bloco-nomes');

    const maxAcompanhantes = Math.max(0, Number(c.maxAcompanhantes) || 0);
    for (let i = 0; i <= maxAcompanhantes; i++) {
        acompanhantes.add(new Option(i === 0 ? 'Somente eu' : i === 1 ? '1 acompanhante' : `${i} acompanhantes`, String(i)));
    }

    const presenca = () => form.elements.presenca.value;
    const qtd = () => Number(acompanhantes.value);

    function atualizarCampos() {
        blocoAcompanhantes.hidden = presenca() !== 'sim' || maxAcompanhantes === 0;
        blocoNomes.hidden = qtd() === 0;
    }
    form.addEventListener('change', atualizarCampos);
    atualizarCampos();

    const whatsapp = String(c.whatsapp || '').replace(/\D/g, '');
    if (!whatsapp) {
        $('#enviar').hidden = true;
        $('#aviso-whatsapp').hidden = false;
    }

    function mensagem() {
        const vai = presenca() === 'sim';
        const linhas = [
            // Só símbolos simples: emojis como 🏰 chegam como "�" em alguns aplicativos do WhatsApp.
            '⚜ Saudações, Casa Cardoso! ⚜',
            '',
            'Minha resposta à Convocação Real:',
            `Nome: ${nome.value.trim()}`,
            `Presença: ${vai ? 'Confirmo minha presença' : 'Não poderei comparecer'}`,
        ];
        if (vai && maxAcompanhantes > 0) {
            linhas.push(`Acompanhantes: ${qtd()}`);
            if (qtd() > 0) linhas.push(`Nomes dos acompanhantes: ${nomes.value.trim() || 'A informar'}`);
        }
        if (observacoes.value.trim()) linhas.push(`Observações: ${observacoes.value.trim()}`);
        linhas.push('', `Celebração dos 30 anos de ${c.homenageada}`, dataExtenso);
        return linhas.join('\n');
    }

    nome.addEventListener('input', () => {
        nomeErro.hidden = true;
        nome.removeAttribute('aria-invalid');
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!whatsapp) return;
        if (!nome.value.trim()) {
            nomeErro.hidden = false;
            nome.setAttribute('aria-invalid', 'true');
            nome.setAttribute('aria-describedby', 'nome-erro');
            nome.focus();
            return;
        }
        const destino = `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagem())}`;
        if (movimentoReduzido) {
            location.href = destino;
            return;
        }
        // O selo de cera é pressionado antes de o mensageiro partir.
        form.classList.add('selando');
        setTimeout(() => {
            form.classList.remove('selando');
            location.href = destino;
        }, 650);
    });
})();
