import { useState } from 'react'

export default function Cadastro({ onCadastro }) {
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit() {
    const nomeLimpo = nome.trim()
    if (!nomeLimpo) {
      setErro('Digite seu nome para continuar.')
      return
    }

    setLoading(true)
    setErro('')

    try {
      const usuario = await window.api.createUser(nomeLimpo)
      onCadastro(usuario)
    } catch (err) {
      setErro('Erro ao criar perfil. Tente novamente.')
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="w-full max-w-md px-8">

        {/* Logo / Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#4f8ef7] animate-pulse" />
            <span className="text-[#4f8ef7] font-mono text-xs tracking-[0.3em] uppercase">
              DevLab
            </span>
            <div className="w-2 h-2 rounded-full bg-[#4f8ef7] animate-pulse" />
          </div>
          <h1 className="text-white text-3xl font-bold tracking-tight mb-2">
            Dev Career Simulator
          </h1>
          <p className="text-[#64748b] text-sm">
            Evolua na prática. Tarefas reais, feedback honesto.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-8">
          <h2 className="text-white text-lg font-semibold mb-1">
            Bem-vindo à DevLab
          </h2>
          <p className="text-[#64748b] text-sm mb-6">
            Como você quer ser chamado?
          </p>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value)
                  if (erro) setErro('')
                }}
                onKeyDown={handleKeyDown}
                placeholder="Seu nome"
                maxLength={32}
                autoFocus
                className={`
                  w-full bg-[#0f1117] border rounded-lg px-4 py-3
                  text-white placeholder-[#64748b] font-mono text-sm
                  outline-none transition-colors
                  ${erro
                    ? 'border-[#e05c5c] focus:border-[#e05c5c]'
                    : 'border-[#2a2d3a] focus:border-[#4f8ef7]'
                  }
                `}
              />
              {erro && (
                <p className="text-[#e05c5c] text-xs mt-2">{erro}</p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !nome.trim()}
              className={`
                w-full py-3 rounded-lg font-semibold text-sm transition-all
                ${loading || !nome.trim()
                  ? 'bg-[#2a2d3a] text-[#64748b] cursor-not-allowed'
                  : 'bg-[#4f8ef7] text-white hover:bg-[#3d7de8] active:scale-[0.98]'
                }
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar na DevLab'
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[#2a2d3a] text-xs mt-8 font-mono">
          v1.0.0
        </p>

      </div>
    </div>
  )
}