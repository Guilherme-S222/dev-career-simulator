# Dev Career Simulator — Documentação

> Documentação técnica do estado atual do projeto. Para melhorias e funcionalidades planejadas, veja [`ROADMAP.md`](./ROADMAP.md).

## 1. Visão geral

**Dev Career Simulator** (nome interno na UI: **DevLab**) é um aplicativo desktop (Electron) que simula o primeiro emprego de um desenvolvedor. O usuário:

1. Cria um perfil local (só o nome).
2. Recebe uma tarefa (Implementação ou Bug Fix) num projeto fictício chamado **FinanceFlow**, escrito em **C#/.NET**.
3. Resolve a tarefa no editor de código de sua preferência, na própria máquina.
4. Aponta a pasta do projeto dentro do app.
5. Submete o código para revisão de **Bob**, um "analista sênior" simulado pela Claude API, que devolve um code review estruturado (pontos positivos, melhorias, nota e XP).
6. Acumula XP, sobe de nível e destrava tarefas mais difíceis, com menos orientação a cada nível.

A proposta central é treinar dev júnior em condições parecidas com um ambiente de trabalho real: requisito de negócio + requisito técnico, code review honesto, progressão gradual de autonomia.

## 2. Stack tecnológica

| Camada | Tecnologia |
|---|---|
| UI | React 19 + Vite 8 |
| Estilo | Tailwind CSS 3 (+ PostCSS/Autoprefixer) |
| Empacotamento desktop | Electron 42 + electron-builder |
| Persistência local | `sql.js` (SQLite compilado para WASM), arquivo `devlab.db` |
| IA / code review | Claude API (Anthropic), modelo `claude-sonnet-4-5` |

Não há linter, framework de testes, TypeScript, roteador ou state manager — é deliberadamente simples (estado todo em `useState`/`useEffect` no componente raiz).

## 3. Arquitetura

O app segue o modelo padrão de segurança do Electron:

- **Main process** (`electron/main.js`): cria a janela (`BrowserWindow`), inicializa o banco (`src/database/db.js`), registra todos os handlers IPC (`ipcMain.handle`) e é o único lugar que toca Node/filesystem/rede diretamente.
- **Preload** (`electron/preload.js`): usa `contextBridge.exposeInMainWorld('api', …)` para expor um conjunto controlado de funções ao renderer, com `contextIsolation: true` e `nodeIntegration: false`.
- **Renderer** (`src/`): React puro, só enxerga `window.api.*` — nunca importa `electron`, `fs` ou `sql.js` diretamente.

### Por que a chamada à Claude API acontece no main process
`claude:call` é implementado em `electron/main.js` (não em `src/services/claudeApi.js`, que só monta o prompt e delega via `window.api.claudeCall`). O comentário no código (`// Claude API (main process — sem CORS)`) explica o motivo: chamar `api.anthropic.com` diretamente do renderer esbarraria em CORS; rodando no main process (contexto Node, sem navegador) isso não é um problema.

### Fluxo de uma chamada típica (ex.: code review)
```
Tarefa.jsx → fazerCodeReview() [claudeApi.js]
           → window.api.claudeCall(payload) [preload.js]
           → ipcRenderer.invoke('claude:call', payload)
           → ipcMain.handle('claude:call', …) [main.js] → fetch api.anthropic.com
           ← texto de resposta ← JSON.parse (parseJSON) ← objeto de review
```

## 4. Estrutura de pastas

```
dev-career-simulator/
├── electron/
│   ├── main.js         # processo principal: janela, IPC, DB, chamada Claude, leitura de pasta
│   └── preload.js       # ponte contextBridge (window.api)
├── src/
│   ├── main.jsx          # entrypoint React
│   ├── App.jsx            # máquina de estados de telas (loading/cadastro/painel/tarefa/config)
│   ├── index.css            # diretivas @tailwind
│   ├── components/
│   │   ├── Cadastro.jsx       # tela de criação de perfil
│   │   ├── Painel.jsx          # dashboard: XP, tarefa atual, histórico
│   │   ├── Tarefa.jsx           # tela da tarefa em andamento + submissão de review
│   │   └── Configuracoes.jsx     # tela de configuração da API key
│   ├── services/
│   │   └── claudeApi.js          # prompts do "Bob", gerarTarefa/fazerCodeReview/testarApiKey
│   ├── data/
│   │   └── tarefas.js              # banco estático de 35 tarefas (domínio FinanceFlow)
│   ├── utils/
│   │   └── nivel.js                 # faixas de XP → nível
│   └── database/
│       └── db.js                     # schema e acesso SQLite (roda no main process via require)
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── index.html
├── vite.config.js
├── tailwind.config.js / postcss.config.js
├── README.md
├── LICENSE              # MIT
└── package.json
```

## 5. Fluxo de telas

`App.jsx` controla um estado simples `tela` (`'loading' | 'cadastro' | 'painel' | 'tarefa' | 'config'`) — não há roteador.

```
loading ──(sem usuário)──► cadastro ──► painel
loading ──(usuário existe)────────────► painel
painel ──(iniciar/retomar tarefa)──► tarefa ──(concluir)──► painel
painel ──(engrenagem)──► config ──(voltar)──► painel
```

- **`Cadastro.jsx`**: formulário de nome → `window.api.createUser(nome)` → `onCadastro(usuario)`.
- **`Painel.jsx`**: mostra XP/nível (`XPBar`), a tarefa em andamento ou botão "Iniciar Tarefa", e o histórico de tarefas concluídas (com modal de feedback ao clicar). Botão "Nova Tarefa" cancela a tarefa em andamento e já dispara `onIniciarTarefa` de novo.
- **`Tarefa.jsx`**: abas "Análise Negocial" / "Análise Técnica" da tarefa atual; seleção de pasta (`window.api.readFolder()`); botão "Submeter para Review" chama `fazerCodeReview`, grava o resultado (`window.api.updateTask`) e atualiza XP (`window.api.updateXP`); mostra o resultado (`ResultadoReview`) antes de voltar ao painel.
- **`Configuracoes.jsx`**: campo para a Anthropic API key, com "Testar conexão" (`testarApiKey`) e "Salvar" (`window.api.setApiKey`).

## 6. Sistema de XP e níveis

Definido em `src/utils/nivel.js`:

| Nível | Faixa de XP | Dificuldade das tarefas |
|---|---|---|
| Júnior I | 0–9 | Fácil — Bob guia passo a passo |
| Júnior II | 10–24 | Média — Bob dá a direção, dev descobre o "como" |
| Júnior III | 25–44 | Difícil — Bob só aponta o caminho |
| Pleno | 45+ | Desafio — revisão crítica, exige decisão de arquitetura |

Pontuação por code review (definida no system prompt do Bob, `claudeApi.js`):

| Nota | XP | Resultado |
|---|---|---|
| Ruim | 1 | Não passa |
| Médio | 2 | Passa |
| Ótimo | 3 | Passa |

`calcularProgresso(xp)` calcula a % de progresso dentro da faixa atual do nível, usada na barra de XP do Painel.

## 7. Banco de tarefas (`src/data/tarefas.js`)

Array estático `TAREFAS` com **35 tarefas fixas**, todas no domínio fictício **FinanceFlow** (app de finanças pessoais em C#/.NET com Entity Framework). Cada tarefa tem: `id`, `nivel`, `tipo` (`Implementação`/`Bug Fix`), `dificuldade`, `titulo`, `analise_negocial` (contexto de produto/negócio), `analise_tecnica` (orientação técnica, mais ou menos detalhada conforme o nível) e, quando é Bug Fix, `arquivos_bug` (snippets de código C# já com o bug plantado).

Distribuição: 8 tarefas em Júnior I, 8 em Júnior II, 8 em Júnior III, 6 em Pleno (35 no total).

```js
sortearTarefa(nivel, historico) // filtra por nível e exclui ids em `historico`, sorteia uma aleatória
getTarefasPorNivel(nivel)        // todas as tarefas de um nível
```

`historico` vem de `App.jsx`: é a lista de `tarefa_id` das tarefas já concluídas, obtida via `window.api.getTasks()` — que **retorna no máximo as últimas 10** (ver seção 9 e Roadmap).

## 8. Integração com Claude — "Bob" (`src/services/claudeApi.js`)

Um único `BOB_SYSTEM_PROMPT` define a persona (analista sênior de 10 anos de mercado, didático mas rigoroso, socrático, ajusta o nível de detalhe ao XP do dev) e as regras de negócio (nunca entregar a solução pronta, nunca repetir tarefa do histórico, sempre responder em JSON puro).

Três funções exportadas:

- **`gerarTarefa({ nome, xp, nivel, historico })`** — monta um prompt para a IA *gerar* uma tarefa nova em JSON (`titulo`, `tipo`, `dificuldade`, `analise_negocial`, `analise_tecnica`). **Implementada, mas não é chamada em lugar nenhum do app** — o fluxo real usa `sortearTarefa()` do banco estático (ver Roadmap).
- **`fazerCodeReview({ tarefa, arquivos, xp, nivel })`** — envia a tarefa + código-fonte (`arquivos`, lista de `{ nome, conteudo }`) e pede um JSON com `positivos`, `melhorias`, `nota`, `xp_ganho`, `passou`, `comentario_final`. É o único fluxo de IA efetivamente usado hoje, chamado por `Tarefa.jsx`.
- **`testarApiKey(apiKey)`** — chamada mínima ("responda apenas 'ok'") para validar a chave na tela de Configurações.

Todas passam por `callClaude()`, que delega para `window.api.claudeCall`. `parseJSON()` remove eventuais cercas de markdown (` ```json `) antes de fazer `JSON.parse` — se o modelo devolver algo fora do formato esperado, o `JSON.parse` lança e a promise rejeita sem tratamento específico (ver Roadmap).

## 9. Persistência (`src/database/db.js`)

Roda **no main process** (via `require`, não é código de renderer). Usa `sql.js` (SQLite/WASM) com o arquivo salvo em `path.join(userDataPath, 'devlab.db')`, reescrito inteiro a cada `save()` (não há WAL/streaming — é `db.export()` + `fs.writeFileSync` a cada escrita).

### Schema

```sql
users (id, nome, xp, criado_em)
tasks (tarefa_id, id, titulo, tipo, dificuldade, analise_negocial, analise_tecnica,
       nota, xp_ganho, passou, feedback, status, criado_em)
config (key, value)
```

- `users`: hardcoded para um único registro — `getUser()` faz `LIMIT 1`, `updateXP()` faz `WHERE id = 1`. Não há suporte a múltiplos perfis.
- `tasks.status`: `'em_andamento' | 'concluida' | 'cancelada'`. Ao salvar uma nova tarefa (`saveTask`), qualquer tarefa `em_andamento` existente é automaticamente marcada `cancelada` — só pode haver uma tarefa ativa por vez.
- `tasks.feedback`: JSON serializado do resultado do code review (mesmo formato de `fazerCodeReview`).
- `config`: chave/valor genérico; hoje só guarda `api_key` (texto puro, sem criptografia — ver Roadmap).
- Há uma migração defensiva (`ALTER TABLE tasks ADD COLUMN feedback`) para bancos criados antes dessa coluna existir, com `try/catch` silencioso se a coluna já existir.

## 10. Canais IPC (`preload.js` ↔ `main.js`)

| Canal | Direção | Descrição |
|---|---|---|
| `db:getUser` | invoke | usuário atual (ou `null`) |
| `db:createUser` | invoke | cria o usuário local |
| `db:updateXP` | invoke | atualiza XP do usuário |
| `db:getTasks` | invoke | últimas 10 tarefas concluídas |
| `db:getTarefaAndamento` | invoke | tarefa em andamento (se houver) |
| `db:saveTask` | invoke | cria nova tarefa em andamento (cancela a anterior) |
| `db:updateTask` | invoke | grava resultado do review e marca `concluida` |
| `config:getApiKey` / `config:setApiKey` | invoke | ler/gravar a chave da Anthropic |
| `claude:call` | invoke | chamada à API da Anthropic (`api.anthropic.com/v1/messages`) |
| `files:readFolder` | invoke | abre diálogo de pasta, lê recursivamente todos os `.cs` |

## 11. Scripts e build

```json
"dev":     "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\""
"build":   "vite build && electron-builder"
"preview": "vite preview"
```

- `npm run dev`: sobe o Vite dev server e, assim que `localhost:5173` responde, abre o Electron apontando pra lá (`isDev` checa `NODE_ENV === 'development' || !app.isPackaged`).
- `npm run build`: faz o build de produção do Vite (`dist/`) e empacota com `electron-builder` (config em `package.json`: `appId com.devlab.careersimulator`, saída em `release/`). O campo `build.files` inclui `dist/`, `electron/` e `src/database/`, porque o main process faz `require('../src/database/db')` em tempo de execução.
- `vite.config.js` usa `base: './'` (necessário para o `file://` do Electron em produção) e porta fixa `5173` (`strictPort: true`).

## 12. Limitações conhecidas do estado atual

Lista factual (sem prescrever solução — as recomendações estão no [`ROADMAP.md`](./ROADMAP.md)):

- `gerarTarefa()` existe em `claudeApi.js` mas nunca é invocada — as tarefas vêm sempre do array estático de 35 itens.
- `db.getTasks()` tem `LIMIT 10` fixo e é reaproveitado tanto para exibir o histórico no Painel quanto para o cálculo de "não repetir tarefa" em `sortearTarefa` — depois de 10 tarefas concluídas, o histórico usado para evitar repetição fica incompleto.
- Uma vez esgotadas as tarefas de um nível, `sortearTarefa` retorna `null` e o app mostra um `alert()` de "parabéns" sem próximo passo.
- A API key da Anthropic é salva em texto puro na tabela `config` do SQLite local.
- App restrito a um único usuário/perfil por instalação (sem multi-perfil).
- Banco de tarefas cobre só C#/.NET; `files:readFolder` só coleta arquivos `.cs`.
- Sem linter, sem testes automatizados, sem CI configurado.
- Sem tratamento específico para resposta malformada da Claude API (`JSON.parse` pode lançar sem retry).
