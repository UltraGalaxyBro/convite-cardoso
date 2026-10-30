# Convite Real — Casa Cardoso (site estático)

Site de uma página, sem dependências: abra `index.html` no navegador para ver.

## Editar os dados do evento

Tudo fica em `js/config.js`: homenageada, data, horário, cidade, local, endereço, WhatsApp e limite de acompanhantes.

- `whatsapp`: número internacional, só dígitos (ex.: `5562999999999`). Enquanto estiver vazio, o formulário mostra um aviso no lugar do botão de envio.
- `endereco`: quando preenchido, aparece na capa com um link "Ver no mapa".
- `maxAcompanhantes`: com `0`, o campo de acompanhantes some.

**Atenção:** a prévia do link no WhatsApp (título, descrição e imagem) fica nas tags `og:` do `<head>` do `index.html`, porque o WhatsApp não executa JavaScript. Se mudar nome, data ou cidade, altere ali também.

## Publicação

Hospedado no GitHub Pages: https://ultragalaxybro.github.io/convite-cardoso/

Para atualizar, basta enviar as alterações para a branch `main`; o site se atualiza em 1 a 2 minutos.
As tags `og:image` e `og:url` do `index.html` já apontam para esse endereço. Se o repositório mudar de nome, atualize-as.

Para testar a prévia, cole o link numa conversa do WhatsApp: deve aparecer o brasão.

## Como funciona a confirmação

O convidado preenche o formulário e o WhatsApp abre com a mensagem pronta. Ele ainda precisa tocar em **Enviar**. Nada é gravado no site.

## Música

1. Coloque o arquivo em `audio/` (ex.: `audio/musica.mp3`). Prefira MP3 de até ~3 MB: ele só é baixado quando o convidado abre os portões.
2. Em `js/config.js`, preencha `musica: 'audio/musica.mp3'`.
3. Para começar num trecho específico, preencha `musicaInicio` em `'min:seg'` (ex.: `'1:15'`). Ao terminar, a música volta para esse mesmo ponto.

A música começa no toque que abre os portões (os navegadores não permitem som antes de um gesto do visitante)
e pode ser silenciada pelo botão de som na barra do topo; o site lembra a escolha.
Ela entra e sai com fade (sobe ao começar, desce nos últimos 3 segundos antes de repetir).
No iPhone o volume do site não pode ser ajustado por código, então lá não há fade; deixe o próprio arquivo com volume moderado.
Use apenas músicas com licença de uso: o site é público.
