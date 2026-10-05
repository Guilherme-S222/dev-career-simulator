import { useState } from 'react'
import { fazerCodeReview } from '../services/claudeApi'
import { calcularNivel } from '../utils/nivel'

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

function DificuldadeBadge({ dificuldade }) {
  const cores = {
    'Fácil': 'text-[#3ecf8e] bg-[#3ecf8e]/10 border-[#3ecf8e]/20',
    'Média': 'text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20',
    'Difícil': 'text-[#e05c5c] bg-[#e05c5c]/10 border-[#e05c5c]/20',
    'Desafio': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  }
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${cores[dificuldade] || ''}`}>
      {dificuldade}
    </span>
  )
}

function ResultadoReview({ review, onConcluir }) {
  const corNota = {
    Ótimo: 'text-[#3ecf8e]',
    Médio: 'text-[#f5a623]',
    Ruim: 'text-[#e05c5c]',
  }

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Code Review — Bob</h3>
        <div className="flex items-center gap-3">
          <span className={`font-mono font-bold text-lg ${corNota[review.nota]}`}>
            {review.nota}
          </span>
          <span className="text-[#4f8ef7] font-mono font-bold">+{review.xp_ganho} XP</span>
          <span className={`text-xs font-mono px-2 py-0.5 rounded border ${review.passou
              ? 'text-[#3ecf8e] bg-[#3ecf8e]/10 border-[#3ecf8e]/20'
              : 'text-[#e05c5c] bg-[#e05c5c]/10 border-[#e05c5c]/20'
            }`}>
            {review.passou ? 'Aprovado' : 'Reprovado'}
          </span>
        </div>
      </div>

      <div>
        <p className="text-[#3ecf8e] text-xs font-mono font-semibold uppercase tracking-wider mb-3">
          ✓ O que ficou bom
        </p>
        <ul className="space-y-2">
          {review.positivos.map((p, i) => (
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
          {review.melhorias.map((m, i) => (
            <li key={i} className="flex gap-2 text-sm text-[#e2e8f0]">
              <span className="text-[#f5a623] mt-0.5 shrink-0">•</span>
              <span>{m}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg p-4">
        <p className="text-[#64748b] text-xs font-mono mb-1">Bob diz:</p>
        <p className="text-white text-sm italic">"{review.comentario_final}"</p>
      </div>

      <button
        onClick={onConcluir}
        className="w-full py-3 rounded-lg bg-[#4f8ef7] text-white font-semibold text-sm hover:bg-[#3d7de8] active:scale-[0.98] transition-all"
      >
        Voltar ao Painel
      </button>
    </div>
  )
}

export default function Tarefa({ tarefa, usuario, onConcluir, onVoltar }) {
  const [aba, setAba] = useState('negocial')
  const [pasta, setPasta] = useState(null)
  const [arquivos, setArquivos] = useState([])
  const [loadingReview, setLoadingReview] = useState(false)
  const [review, setReview] = useState(null)
  const [xpFinal, setXpFinal] = useState(null)
  const [erro, setErro] = useState('')

  const nivel = calcularNivel(usuario.xp)

  async function handleSelecionarPasta() {
    try {
      const resultado = await window.api.readFolder()
      if (!resultado) return
      setPasta(resultado.pasta)
      setArquivos(resultado.arquivos)
      setErro('')
    } catch (err) {
      setErro('Erro ao ler a pasta. Tente novamente.')
    }
  }

  async function handleSubmeterReview() {
    if (!arquivos.length) {
      setErro('Nenhum arquivo .cs encontrado na pasta selecionada.')
      return
    }

    setLoadingReview(true)
    setErro('')

    try {
      const resultado = await fazerCodeReview({
        tarefa,
        arquivos,
        xp: usuario.xp,
        nivel: nivel.nome,
      })

      await window.api.updateTask(tarefa.id, {
        feedback: resultado,
        nota: resultado.nota,
        xp_ganho: resultado.xp_ganho,
        passou: resultado.passou,
      })

      const novoXP = usuario.xp + resultado.xp_ganho
      await window.api.updateXP(novoXP)

      setXpFinal(novoXP)
      setReview(resultado)
      // Não navega aqui — usuário lê o feedback e clica no botão
    } catch (err) {
      setErro('Erro ao fazer o review: ' + err.message)
    } finally {
      setLoadingReview(false)
    }
  }

  return (
    <div className="h-screen bg-[#0f1117] flex flex-col overflow-hidden">

      <header className="flex items-center justify-between px-8 py-4 border-b border-[#2a2d3a] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4f8ef7] animate-pulse" />
          <span className="text-[#4f8ef7] font-mono text-xs tracking-widest uppercase">DevLab</span>
        </div>
        <button
          onClick={onVoltar}
          className="text-[#64748b] hover:text-white text-sm transition-colors flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Painel
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-white text-xl font-bold mb-2">{tarefa.titulo}</h1>
                <div className="flex items-center gap-2">
                  <TipoBadge tipo={tarefa.tipo} />
                  <DificuldadeBadge dificuldade={tarefa.dificuldade} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
            <div className="flex border-b border-[#2a2d3a]">
              {[
                { id: 'negocial', label: 'Análise Negocial' },
                { id: 'tecnica', label: 'Análise Técnica' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAba(tab.id)}
                  className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${aba === tab.id
                      ? 'text-[#4f8ef7] border-[#4f8ef7]'
                      : 'text-[#64748b] border-transparent hover:text-white'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-6">
              <p className="text-[#e2e8f0] text-sm leading-relaxed whitespace-pre-wrap">
                {aba === 'negocial' ? tarefa.analise_negocial : tarefa.analise_tecnica}
              </p>
            </div>
          </div>

          {!review && (
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6 space-y-4">
              <h3 className="text-white font-semibold">Submeter para Code Review</h3>

              <div
                onClick={handleSelecionarPasta}
                className="flex items-center gap-3 p-4 bg-[#0f1117] border border-dashed border-[#2a2d3a] hover:border-[#4f8ef7] rounded-lg cursor-pointer transition-colors group"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className="text-[#64748b] group-hover:text-[#4f8ef7] transition-colors shrink-0">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <div className="min-w-0 flex-1">
                  {pasta ? (
                    <>
                      <p className="text-white text-sm font-mono truncate">{pasta}</p>
                      <p className="text-[#3ecf8e] text-xs mt-0.5">
                        {arquivos.length} arquivo{arquivos.length !== 1 ? 's' : ''} .cs encontrado{arquivos.length !== 1 ? 's' : ''}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[#64748b] text-sm">Clique para selecionar a pasta do projeto</p>
                      <p className="text-[#2a2d3a] text-xs mt-0.5">Arquivos .cs serão lidos automaticamente</p>
                    </>
                  )}
                </div>
                <span className="text-[#4f8ef7] text-xs font-mono shrink-0">
                  {pasta ? 'Trocar' : 'Selecionar'}
                </span>
              </div>

              {erro && <p className="text-[#e05c5c] text-xs">{erro}</p>}

              <button
                onClick={handleSubmeterReview}
                disabled={!pasta || loadingReview}
                className={`
                  w-full py-3 rounded-lg font-semibold text-sm transition-all
                  ${!pasta || loadingReview
                    ? 'bg-[#2a2d3a] text-[#64748b] cursor-not-allowed'
                    : 'bg-[#4f8ef7] text-white hover:bg-[#3d7de8] active:scale-[0.98]'
                  }
                `}
              >
                {loadingReview ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Bob está revisando...
                  </span>
                ) : (
                  'Submeter para Review'
                )}
              </button>
            </div>
          )}

          {review && (
            <ResultadoReview
              review={review}
              onConcluir={() => onConcluir(xpFinal)}
            />
          )}

        </div>
      </main>
    </div>
  )
}