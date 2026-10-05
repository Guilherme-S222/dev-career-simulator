const BOB_SYSTEM_PROMPT = `
Você é o Bob, analista sênior da DevLab — uma empresa fictícia de desenvolvimento de software.
Você faz parte do Dev Career Simulator: um simulador de carreira onde desenvolvedores evoluem na prática com tarefas reais, feedback honesto e progressão de nível.

## Sobre você — Bob
- 10 anos de mercado, já viu de tudo. Sabe quando um código foi feito com cuidado e quando foi feito na pressa.
- Didático mas rigoroso — não aceita código desleixado, mas nunca humilha. Exige porque acredita no potencial do dev.
- Direto nos code reviews: vai direto ao ponto, sem rodeios, sem meias palavras.
- Honesto: elogia genuinamente o que está bom. Aponta sem filtro o que está errado — e sempre explica o porquê.
- Socrático: faz perguntas que fazem o dev pensar. Raramente dá a resposta pronta. Prefere guiar o raciocínio.
- Humano: profissional, mas com personalidade. Pode usar humor seco ocasionalmente. Não é um robô.

## Contexto do simulador
O usuário é um desenvolvedor contratado pela DevLab. Ele recebe tarefas, desenvolve na própria máquina em C#/.NET Backend, aponta a pasta do projeto e você faz o code review. O objetivo é simular o ambiente de trabalho real.

## Tipos de tarefa
- Implementação: desenvolver uma funcionalidade do zero em C#/.NET Backend
- Bug Fix: código com bug já existente — identificar, entender e corrigir

## Progressão de nível e comportamento do Bob
- Júnior I (0–9 XP) — Fácil: guia passo a passo, explica o conceito antes da técnica, é paciente
- Júnior II (10–24 XP) — Média: dá a direção, o dev descobre o "como", menos detalhes, mais autonomia
- Júnior III (25–44 XP) — Difícil: só aponta o caminho, espera que o dev pesquise e resolva
- Pleno (45+ XP) — Desafio: revisão crítica, pouca orientação, exige decisões de arquitetura

Regra de ouro: quanto menos XP o dev tem, mais detalhado você é. Quanto mais XP, mais você larga na mão dele.

## Sistema de pontuação
- Nota Ruim → 1 XP → tarefa não passa
- Nota Médio → 2 XP → tarefa passa
- Nota Ótimo → 3 XP → tarefa passa

## Regras absolutas
- Nunca entregue a solução pronta — guie o dev a pensar
- Nunca repita tarefas que já constam no histórico
- Sempre retorne JSON válido quando solicitado, sem texto adicional, sem markdown
- Adapte o nível de detalhe sempre ao XP atual do dev
- Mantenha o tom de um ambiente de trabalho real — profissional mas humano
`.trim()

async function callClaude(message, apiKey) {
  return window.api.claudeCall({
    message,
    systemPrompt: BOB_SYSTEM_PROMPT,
    apiKey,
  })
}

function parseJSON(text) {
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export async function gerarTarefa({ nome, xp, nivel, historico = [] }) {
  const apiKey = await window.api.getApiKey()
  if (!apiKey) throw new Error('Chave da API não configurada. Vá em Configurações.')

  const tipo = Math.random() > 0.5 ? 'Implementação' : 'Bug Fix'
  const historicoPart = historico.length
    ? 'Tarefas já realizadas (não repita nenhuma delas): ' + historico.join(', ')
    : 'Nenhuma tarefa realizada ainda.'

  const prompt = `
DEV: ${nome}
XP_ATUAL: ${xp}
NIVEL: ${nivel}
TIPO_DA_TAREFA: ${tipo}
${historicoPart}

Gere uma tarefa nova e adequada ao nível do dev. A tarefa deve ser realista, com contexto de negócio concreto e orientações técnicas no nível certo para o XP dele.

Retorne APENAS o JSON abaixo, sem nenhum texto adicional, sem markdown:

{
  "titulo": "Título curto e descritivo da tarefa",
  "tipo": "${tipo}",
  "dificuldade": "${nivel === 'Júnior I' ? 'Fácil' : nivel === 'Júnior II' ? 'Média' : nivel === 'Júnior III' ? 'Difícil' : 'Desafio'}",
  "analise_negocial": "Contexto do cliente ou produto, o que o usuário final vai ganhar, por que isso importa para o negócio. Tom narrativo e concreto, como um PM explicaria para o time.",
  "analise_tecnica": "O que precisa ser implementado ou corrigido, com orientações técnicas no nível certo para o XP do dev. Para Júnior I, detalhe cada passo. Para Pleno, aponte apenas o caminho."
}
  `.trim()

  const text = await callClaude(prompt, apiKey)
  return parseJSON(text)
}

export async function fazerCodeReview({ tarefa, arquivos, xp, nivel }) {
  const apiKey = await window.api.getApiKey()
  if (!apiKey) throw new Error('Chave da API não configurada. Vá em Configurações.')

  const codigoFormatado = arquivos
    .map((f) => '// ── ' + f.nome + ' ──\n' + f.conteudo)
    .join('\n\n')

  const prompt = `
TAREFA:
  Título: ${tarefa.titulo}
  Tipo: ${tarefa.tipo}
  Análise Negocial: ${tarefa.analise_negocial}
  Análise Técnica: ${tarefa.analise_tecnica}

DEV:
  XP_ATUAL: ${xp}
  NIVEL: ${nivel}

CÓDIGO SUBMETIDO:
${codigoFormatado}

Avalie o código com base em:
- Aderência aos requisitos da tarefa
- Qualidade do código (nomenclatura, responsabilidade única, legibilidade)
- Boas práticas C#/.NET (async/await, tratamento de exceções, injeção de dependência, etc.)
- Completude da entrega

Adapte o tom e o nível de detalhe do feedback ao XP do dev. Júnior I merece mais explicação. Pleno merece exigência.

Retorne APENAS o JSON abaixo, sem nenhum texto adicional, sem markdown:

{
  "positivos": ["ponto positivo 1", "ponto positivo 2"],
  "melhorias": ["ponto de melhoria 1", "ponto de melhoria 2"],
  "nota": "Ruim ou Médio ou Ótimo",
  "xp_ganho": 1,
  "passou": false,
  "comentario_final": "Frase curta e direta do Bob para o dev, no tom certo para o nível dele."
}
  `.trim()

  const text = await callClaude(prompt, apiKey)
  return parseJSON(text)
}

export async function testarApiKey(apiKey) {
  try {
    await window.api.claudeCall({
      message: 'ok',
      systemPrompt: 'Responda apenas com a palavra: ok',
      apiKey,
    })
    return true
  } catch {
    return false
  }
}