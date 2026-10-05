# Dev Career Simulator

Aplicativo desktop que simula o primeiro emprego de um desenvolvedor na **DevLab**, uma empresa fictícia. Você recebe tarefas reais (implementação ou bug fix) num projeto C#/.NET, resolve no seu editor, e o **Bob** — um analista sênior simulado pela Claude API — faz o code review do seu código. Cada review rende XP, e o XP destrava níveis mais difíceis, com menos orientação a cada nível.

| Nível | XP | Como o Bob se comporta |
|---|---|---|
| Júnior I | 0–9 | Guia passo a passo |
| Júnior II | 10–24 | Dá a direção, você descobre o "como" |
| Júnior III | 25–44 | Só aponta o caminho |
| Pleno | 45+ | Revisão crítica, exige decisões de arquitetura |

## Stack

React 19 + Vite · Tailwind CSS · Electron · SQLite (`sql.js`) · Claude API (Anthropic)

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20.19 ou superior
- Uma chave da API da Anthropic, criada em [console.anthropic.com](https://console.anthropic.com/) (menu **API Keys**)

## Como rodar

```bash
npm install
npm run dev
```

O comando sobe o Vite em `localhost:5173` e abre a janela do Electron. No primeiro uso:

1. Crie seu perfil informando seu nome.
2. Clique na engrenagem do painel e cole sua API key em **Configurações**.
3. Inicie uma tarefa, resolva na sua máquina e aponte a pasta do projeto para submeter ao review.

A API key e o progresso ficam salvos só no seu computador, num banco SQLite na pasta de dados do aplicativo. Nada disso fica dentro da pasta do projeto.

## Build

```bash
npm run build
```

Gera o build do Vite em `dist/` e o instalador do Electron em `release/`.

## Documentação

- [Documentação técnica](docs/DOCUMENTACAO.md): arquitetura, fluxo de telas, banco de dados e canais IPC
- [Roadmap](docs/ROADMAP.md): melhorias e funcionalidades planejadas

## Licença

[MIT](LICENSE)
