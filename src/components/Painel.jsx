import { useState, useEffect } from 'react'
import { calcularNivel, calcularProgresso, NIVEIS } from '../utils/nivel'

function XPBar({ xp }) {
  const nivel = calcularNivel(xp)
  const progresso = calcularProgresso(xp)
  const proximo = NIVEIS.find((n) => n.xpMin > xp)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#4f8ef7] font-mono font-semibold">{nivel.nome}</span>
        <span className="text-[#64748b] font-mono">
          {xp} XP {proximo ? `/ ${proximo.xpMin} XP` : '— Nível máximo'}
        </span>
      </div>
      <div className="h-2 bg-[#2a2d3a] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#4f8ef7] rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progresso}%` }}
        />
      </div>
      <div className="flex justify-between">
        {NIVEIS.map((n) => (
          <span key={n.nome} className={`text-[10px] font-mono ${nivel.nome === n.nome ? 'text-[#4f8ef7]' : 'text-[#2a2d3a]'}`}>
            {n.nome}
          </span>
        ))}
      </div>
    </div>
  )
}

function NotaBadge({ nota }) {
  const cores = {
    Ótimo: 'text-[#3ecf8e] bg-[#3ecf8e]/10 border-[#3ecf8e]/20',
    Médio: 'text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20',
    Ruim: 'text-[#e05c5c] bg-[#e05c5c]/10 border-[#e05c5c]/20',
  }
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${cores[nota] || cores.Médio}`}>
      {nota}
    </span>
  )
}

function TipoBadge({ tipo }) {
  const cores = {
    'Implementação': 'text-[#4f8ef7] bg-[#4f8ef7]/10 border-[#4f8ef7]/20',
    'Bug Fix': 'text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20',
  }
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${cores[tipo] || ''}`}>
      {tipo}
    </span>
  )
}

function ModalFeedback({ tarefa, onFechar }) {
  const feedback = tarefa.feedback ? JSON.parse(tarefa.feedback) : null
  if (!feedback) return null

  const corNota = {
    Ótimo: 'text-[#3ecf8e]',
    Médio: 'text-[#f5a623]',
    Ruim: 'text-[#e05c5c]',
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b border-[#2a2d3a]">
          <div>
            <h3 className="text-white font-semibold">Code Review — Bob</h3>
            <p className="text-[#64748b] text-xs mt-0.5 truncate max-w-xs">{tarefa.titulo}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`font-mono font-bold ${corNota[feedback.nota]}`}>{feedback.nota}</span>
            <span className="text-[#4f8ef7] font-mono font-bold">+{feedback.xp_ganho} XP</span>
            <button onClick={onFechar} className="text-[#64748b] hover:text-white transition-colors ml-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-[#3ecf8e] text-xs font-mono font-semibold uppercase tracking-wider mb-3">
              ✓ O que ficou bom
            </p>
            <ul className="space-y-2">
              {feedback.positivos.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#e2e8f0]">
                  <span className="text-[#3ecf8e] mt-0.5 shrink-0">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[#f5a623] text-xs font-mono font-semibold uppercase tracking-wider mb-3">
              ⚠ O que precisa melhorar
            </p>
            <ul className="space-y-2">
              {feedback.melhorias.map((m, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#e2e8f0]">
                  <span className="text-[#f5a623] mt-0.5 shrink-0">•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg p-4">
            <p className="text-[#64748b] text-xs font-mono mb-1">Bob diz:</p>
            <p className="text-white text-sm italic">"{feedback.comentario_final}"</p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function Painel({ usuario, tarefaAndamento, onIniciarTarefa, onRetomarTarefa, onConfiguracoes }) {
  const [tarefas, setTarefas] = useState([])
  const [loadingTarefa, setLoadingTarefa] = useState(false)
  const [tarefaSelecionada, setTarefaSelecionada] = useState(null)

  useEffect(() => {
    async function carregarTarefas() {
      try {
        const lista = await window.api.getTasks()
        setTarefas(lista)
      } catch (err) {
        console.error('Erro ao carregar tarefas:', err)
      }
    }
    carregarTarefas()
  }, [])

  const nivel = calcularNivel(usuario.xp)

  async function handleIniciarTarefa() {
    setLoadingTarefa(true)
    try {
      await onIniciarTarefa()
    } catch (err) {
      console.error('Erro ao iniciar tarefa:', err)
    } finally {
      setLoadingTarefa(false)
    }
  }

  return (
    <div className="h-screen bg-[#0f1117] flex flex-col overflow-hidden">

      {tarefaSelecionada && (
        <ModalFeedback
          tarefa={tarefaSelecionada}
          onFechar={() => setTarefaSelecionada(null)}
        />
      )}

      <header className="flex items-center justify-between px-8 py-4 border-b border-[#2a2d3a]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4f8ef7] animate-pulse" />
          <span className="text-[#4f8ef7] font-mono text-xs tracking-widest uppercase">DevLab</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#64748b] text-sm">
            Olá, <span className="text-white font-semibold">{usuario.nome}</span>
          </span>
          <button onClick={onConfiguracoes} className="text-[#64748b] hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#2a2d3a]" title="Configurações">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-8">

          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-white text-xl font-bold">{usuario.nome}</h2>
                <p className="text-[#64748b] text-sm mt-0.5">{nivel.nome} · DevLab</p>
              </div>
              <div className="text-right">
                <p className="text-[#4f8ef7] font-mono text-2xl font-bold">{usuario.xp}</p>
                <p className="text-[#64748b] text-xs">XP total</p>
              </div>
            </div>
            <XPBar xp={usuario.xp} />
          </div>

          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">
                {tarefaAndamento ? 'Tarefa em Andamento' : 'Próxima Tarefa'}
              </h3>
              <span className="text-[#64748b] text-xs font-mono">{nivel.nome}</span>
            </div>

            {tarefaAndamento ? (
              <div>
                <div className="bg-[#0f1117] border border-[#f5a623]/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f5a623] animate-pulse" />
                    <span className="text-[#f5a623] text-xs font-mono">Em andamento</span>
                  </div>
                  <p className="text-white text-sm font-semibold">{tarefaAndamento.titulo}</p>
                  <p className="text-[#64748b] text-xs mt-1">{tarefaAndamento.tipo} · {tarefaAndamento.dificuldade}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onRetomarTarefa}
                    className="flex-1 py-3 rounded-lg bg-[#f5a623] text-white font-semibold text-sm hover:bg-[#e09510] active:scale-[0.98] transition-all"
                  >
                    Retomar Tarefa
                  </button>
                  <button
                    onClick={handleIniciarTarefa}
                    disabled={loadingTarefa}
                    className="px-4 py-3 rounded-lg border border-[#2a2d3a] text-[#64748b] hover:text-white hover:border-[#64748b] text-sm transition-all"
                    title="Abandonar e gerar nova tarefa"
                  >
                    {loadingTarefa
                      ? <span className="w-4 h-4 border-2 border-[#64748b]/30 border-t-[#64748b] rounded-full animate-spin block" />
                      : 'Nova Tarefa'
                    }
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-[#0f1117] border border-dashed border-[#2a2d3a] rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e] animate-pulse" />
                    <span className="text-[#64748b] text-xs font-mono">Disponível agora</span>
                  </div>
                  <p className="text-white text-sm">Uma nova tarefa será gerada pelo Bob com base no seu nível atual.</p>
                  <p className="text-[#64748b] text-xs mt-1">Nível: {nivel.nome} · Clique em iniciar para começar</p>
                </div>
                <button
                  onClick={handleIniciarTarefa}
                  disabled={loadingTarefa}
                  className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${loadingTarefa
                      ? 'bg-[#2a2d3a] text-[#64748b] cursor-not-allowed'
                      : 'bg-[#4f8ef7] text-white hover:bg-[#3d7de8] active:scale-[0.98]'
                    }`}
                >
                  {loadingTarefa ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Gerando tarefa...
                    </span>
                  ) : 'Iniciar Tarefa'}
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Histórico</h3>
            {tarefas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#2a2d3a] font-mono text-sm">Nenhuma tarefa concluída ainda.</p>
                <p className="text-[#2a2d3a] text-xs mt-1">Complete sua primeira tarefa para ver o histórico.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tarefas.map((tarefa) => (
                  <div
                    key={tarefa.id}
                    onClick={() => tarefa.feedback && setTarefaSelecionada(tarefa)}
                    className={`flex items-center justify-between p-3 bg-[#0f1117] border border-[#2a2d3a] rounded-lg transition-colors ${tarefa.feedback ? 'cursor-pointer hover:border-[#4f8ef7]/50' : ''
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-sm ${tarefa.passou ? 'text-[#3ecf8e]' : 'text-[#e05c5c]'}`}>
                        {tarefa.passou ? '✓' : '✗'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-white text-sm truncate">{tarefa.titulo}</p>
                        <p className="text-[#64748b] text-xs">
                          {tarefa.criado_em?.slice(0, 10)}
                          {tarefa.feedback && <span className="text-[#4f8ef7] ml-2">· Ver feedback</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <TipoBadge tipo={tarefa.tipo} />
                      <NotaBadge nota={tarefa.nota} />
                      <span className="text-[#4f8ef7] font-mono text-xs">+{tarefa.xp_ganho} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}