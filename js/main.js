(function () {
    'use strict';

    const c = window.CONVITE;
    const $ = (sel) => document.querySelector(sel);

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
            '🏰 Saudações, Casa Cardoso!',
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
        linhas.push('', `Celebração em honra a ${c.homenageada}`, dataExtenso);
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
        window.location.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagem())}`;
    });
})();
