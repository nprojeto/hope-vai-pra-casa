# Hope vai pra casa! — Espaço do Saber

Site do projeto do mascote Hope. Não precisa instalar nada nem compilar:
são arquivos prontos que rodam direto no GitHub Pages.

## O que fazer

1. Crie um repositório no GitHub (pode ser público).
2. Arraste **todo o conteúdo desta pasta** para dentro do repositório
   (o `index.html` precisa ficar na raiz, não dentro de outra pasta).
3. No repositório, vá em **Settings → Pages** e escolha:
   - Source: `Deploy from a branch`
   - Branch: `main` / pasta `/ (root)`
4. Abra o arquivo `config.js` pelo próprio GitHub (ícone de lápis) e troque:
   - `API` pelo endereço da sua Edge Function no Supabase
   - `ANON_KEY` pela chave `anon` do projeto

## Estrutura

```
index.html          página única
config.js           o único arquivo que você edita
css/estilo.css      identidade visual
js/api.js           conversa com o Supabase
js/app.js           navegação
js/views/           telas (acesso, família, linha do tempo, escola)
assets/             logo e ícones
```

## Primeiro acesso da escola

O e-mail definido na variável `ADMIN_EMAIL` do Supabase vira administrador
automaticamente ao se cadastrar pelo site.
