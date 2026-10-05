# Roadmap — Melhorias e Funcionalidades

> Plano de ação a partir da revisão do estado atual do projeto (ver [`DOCUMENTACAO.md`](./DOCUMENTACAO.md)). Itens organizados por categoria, com esforço estimado (Baixo / Médio / Alto) e referência ao ponto do código envolvido.

## 1. Correções e limpeza (baixo esforço)

- [x] **Remover sobras do template Vite** — `src/App.css` e `src/assets/` removidos.
- [x] **Reescrever `README.md`** — descreve o projeto, como rodar e aponta para `docs/DOCUMENTACAO.md`.
- [ ] **Decidir o destino de `gerarTarefa()`** (`src/services/claudeApi.js`) — está implementada e pronta, mas nunca é chamada (`App.jsx` só usa `sortearTarefa`). Duas saídas: ativar (ver item 3.1) ou remover para não deixar código morto. *(Baixo para remover / Médio para ativar)*
- [ ] **Desacoplar o histórico de "não repetir tarefa" do `LIMIT 10` de exibição** — `db.getTasks()` (`src/database/db.js`) serve tanto o histórico visível no Painel quanto a lista usada por `sortearTarefa` para evitar repetição. Criar uma consulta separada (ex.: `getTarefaIdsConcluidas()` sem limite) para o cálculo de repetição. *(Baixo)*
- [ ] **Tratar o esgotamento de tarefas de um nível** — hoje `sortearTarefa` retorna `null` e o app só mostra `alert('Parabéns! ...')` sem próximo passo claro (`App.jsx:handleIniciarTarefa`). *(Baixo)*

## 2. Segurança

- [ ] **Criptografar a API key em repouso** — hoje fica em texto puro na tabela `config` do SQLite (`src/database/db.js`, `config:setApiKey` em `electron/main.js`). Usar `safeStorage` do próprio Electron (`safeStorage.encryptString`/`decryptString`) para criptografar antes de salvar. *(Médio)*
- [ ] **Validar o path retornado por `readFolder`** — hoje `electron/main.js` lê recursivamente qualquer pasta escolhida pelo usuário sem limite de profundidade/tamanho; um projeto muito grande pode travar a leitura ou estourar o payload enviado à Claude API. Adicionar limite de arquivos/tamanho total com aviso ao usuário. *(Baixo)*

## 3. Funcionalidades novas

### 3.1 Geração dinâmica de tarefas via IA
Reaproveitar `gerarTarefa()` (já escrita) para gerar tarefas sob demanda em vez de depender só das 35 fixas em `src/data/tarefas.js`. Pode ser um modo alternativo ("tarefa gerada pelo Bob" vs. "tarefa do banco"), preservando o banco estático como fallback offline/sem custo de API. *(Alto)*

### 3.2 Suporte a múltiplos stacks/linguagens
Hoje todo o domínio é fixo em C#/.NET: o banco de tarefas (`src/data/tarefas.js`) e o filtro de arquivos em `files:readFolder` (`electron/main.js`, só `.cs`) estão hardcoded. Generalizar para aceitar a extensão/stack escolhido no cadastro ou nas configurações (ex.: JS/TS, Python, Java), com bancos de tarefas por stack e filtro de extensão dinâmico. *(Alto)*

### 3.3 Múltiplos perfis/usuários
`src/database/db.js` assume um único usuário (`LIMIT 1`, `WHERE id = 1`). Dá pra oferecer múltiplos perfis locais (útil pra quem quer recomeçar do zero ou treinar mais de um stack em paralelo). *(Médio)*

### 3.4 Tela de estatísticas/progresso
Histórico hoje é só uma lista (`Painel.jsx`). Uma tela dedicada com evolução de XP ao longo do tempo, taxa de aprovação (Ótimo/Médio/Ruim), tempo médio por tarefa e sequência de tarefas concluídas daria mais sensação de progresso. *(Médio)*

### 3.5 Configurações avançadas do modelo
Modelo (`claude-sonnet-4-5`) e `max_tokens: 2048` estão fixos em `electron/main.js` (`claude:call`). Expor esses campos na tela `Configuracoes.jsx` permitiria trocar de modelo ou ajustar custo/latência sem editar código. *(Baixo)*

## 4. Robustez

- [ ] **Tratar resposta malformada da Claude API** — `parseJSON()` em `src/services/claudeApi.js` faz `JSON.parse` direto após remover cercas de markdown; se o modelo devolver texto fora do formato, a promise rejeita sem uma mensagem amigável nem retry. Adicionar retry com prompt de correção ou mensagem de erro clara na UI. *(Médio)*
- [ ] **Tratar timeouts/falhas de rede na chamada `claude:call`** — hoje um `fetch` sem timeout explícito; em conexão ruim a UI fica presa no estado de loading. *(Baixo)*

## 5. UX / Polish

- [ ] **Repensar o botão "Nova Tarefa"** — no Painel, clicar em "Nova Tarefa" com uma tarefa em andamento cancela a atual e já dispara a geração de outra sem confirmação (`Painel.jsx:handleIniciarTarefa` / `App.jsx:handleIniciarTarefa`). Vale um passo de confirmação. *(Baixo)*
- [ ] **Estados de erro mais informativos** — vários `catch` hoje só logam no console ou mostram `alert()`/texto genérico (ex.: `Cadastro.jsx`, `Tarefa.jsx`). Padronizar um componente de erro/toast. *(Médio)*
- [ ] **Acessibilidade** — revisar foco de teclado e leitura por screen reader nos botões/ícones SVG sem `aria-label` (ex.: botão de engrenagem em `Painel.jsx`). *(Médio)*
- [ ] **Tema claro** — hoje só existe o tema escuro fixo (`#0f1117` etc. hardcoded em cada componente). *(Alto, por ser um redesign de todas as telas)*

## 6. Qualidade / Infraestrutura

- [x] **Inicializar repositório Git** — `.gitignore` cobre `node_modules`, `dist`, `release`, `.env` e `*.db`.
- [ ] **Testes automatizados** — não há nenhum hoje. Prioridades: unitário para `src/utils/nivel.js` (faixas de XP) e `sortearTarefa`/`getTarefasPorNivel` em `src/data/tarefas.js`; teste de integração para `src/database/db.js` (schema, migração, ciclo `em_andamento → concluida/cancelada`). *(Médio)*
- [ ] **CI básico** — build (`vite build`) a cada push no GitHub. O ESLint foi removido por não estar instalado; se for reintroduzido, adicionar as dependências (`eslint`, `@eslint/js`, plugins `react-hooks` e `react-refresh`) e um script `lint`. *(Baixo)*
- [ ] **Revisar empacotamento do `electron-builder`** — `public/icons.svg` existe mas não está referenciado na config de build (`package.json > build`); confirmar se o app final tem ícone correto em todas as plataformas, e avaliar auto-update. *(Médio)*

## Sugestão de ordem de execução

1. **Correções e limpeza** (seção 1) + **Git init** (seção 6) — baixo custo, destrava tudo o resto.
2. **Segurança da API key** (seção 2) — antes de qualquer lançamento mais amplo do app.
3. **Robustez das chamadas de IA** (seção 4) — reduz frustração do usuário no fluxo principal (code review).
4. **Testes + CI** (seção 6) — proteção antes de acelerar novas funcionalidades.
5. **Funcionalidades novas** (seção 3), começando por 3.1 (geração dinâmica) e 3.5 (config do modelo), que reaproveitam código já existente.
6. **UX/Polish e multi-stack/multi-perfil** (seções 5, 3.2, 3.3) — maior esforço, fazem mais sentido depois da base estar sólida.
