<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## O `.next` corrompido e o falso erro de "Jest worker"

Quando o worker de render do dev server morre, o sintoma que aparece no navegador é enganoso:

```
Jest worker encountered 2 child process exceptions, exceeding retry limit
```

às vezes seguido de `write EPIPE` no log (`.next/dev/logs/next-development.log`). A mensagem não tem relação com Jest nem com testes — é o `jest-worker`, que o Next usa para renderizar em processos filhos, e ela mascara o erro real. Não adianta procurar bug no componente que a URL renderiza.

**A assinatura é o padrão de status, não a mensagem:** as páginas estáticas continuam em 200 e *todas* as rotas dinâmicas (`/[category]/[slug]`) caem para 500 de uma vez. No log vem `⨯ Failed to generate static paths for /[category]/[slug]` logo antes do erro do worker. Se só uma rota falha, aí sim é bug de código — investigue normalmente.

Recuperação: **`npm run dev:reset`** (apaga o `.next` e sobe o dev de novo). O dev server anterior precisa estar encerrado antes — inclusive os processos filhos, que não morrem junto com o `npm`; no Windows, `Get-CimInstance Win32_Process -Filter "Name='node.exe'"` mostra a árvore inteira.

### Causa

Duas coisas escrevendo no mesmo `.next`. A mais fácil de causar sem perceber é rodar `npm run build` com o `npm run dev` no ar: o build sobrescreve artefatos que o dev server tem abertos. **Para verificar um build, pare o dev server antes.**

Mas o build não é a única forma — já aconteceu com o `.next` contendo apenas `dev/` (sem `BUILD_ID`, sem `static/`, ou seja, build nenhum tinha rodado). Um worker morto por outro motivo deixa o mesmo estado. Então: não gaste tempo procurando qual processo foi o culpado — confirme a assinatura acima e rode o `dev:reset`.
