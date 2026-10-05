import { useState, useEffect } from 'react'
import { testarApiKey } from '../services/claudeApi'

export default function Configuracoes({ onVoltar }) {
  const [apiKey, setApiKey] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [testando, setTestando] = useState(false)
  const [status, setStatus] = useState(null) // 'ok' | 'erro' | null

  useEffect(() => {
    async function carregar() {
      const key = await window.api.getApiKey()
      if (key) setApiKey(key)
    }
    carregar()
  }, [])

  async function handleSalvar() {
    if (!apiKey.trim()) return
    setSalvando(true)
    setStatus(null)
    try {
      await window.api.setApiKey(apiKey.trim())
      setStatus('salvo')
    } catch {
      setStatus('erro')
    } finally {
      setSalvando(false)
    }
  }

  async function handleTestar() {
    if (!apiKey.trim()) return
    setTestando(true)
    setStatus(null)
    try {
      const ok = await testarApiKey(apiKey.trim())
      setStatus(ok ? 'ok' : 'erro')
    } catch {
      setStatus('erro')
    } finally {
      setTestando(false)
    }
  }

  return (
    <div className="h-screen bg-[#0f1117] flex flex-col overflow-hidden">

      {/* Topbar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#2a2d3a]">
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
          Voltar ao painel
        </button>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-lg">
          <h1 className="text-white text-xl font-bold mb-1">Configurações</h1>
          <p className="text-[#64748b] text-sm mb-8">
            Configure sua chave da API para o Bob funcionar.
          </p>

          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6 space-y-6">

            {/* API Key */}
            <div>
              <label className="block text-white text-sm font-semibold mb-1">
                Anthropic API Key
              </label>
              <p className="text-[#64748b] text-xs mb-3">
                Encontre sua chave em{' '}
                <span className="text-[#4f8ef7] font-mono">console.anthropic.com → API Keys</span>
              </p>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  setStatus(null)
                }}
                placeholder="sk-ant-..."
                className="w-full bg-[#0f1117] border border-[#2a2d3a] focus:border-[#4f8ef7] rounded-lg px-4 py-3 text-white placeholder-[#64748b] font-mono text-sm outline-none transition-colors"
              />

              {/* Status */}
              {status === 'ok' && (
                <p className="text-[#3ecf8e] text-xs mt-2 flex items-center gap-1">
                  <span>✓</span> Chave válida — tudo funcionando
                </p>
              )}
              {status === 'erro' && (
                <p className="text-[#e05c5c] text-xs mt-2 flex items-center gap-1">
                  <span>✗</span> Chave inválida ou sem conexão
                </p>
              )}
              {status === 'salvo' && (
                <p className="text-[#3ecf8e] text-xs mt-2 flex items-center gap-1">
                  <span>✓</span> Chave salva com sucesso
                </p>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={handleTestar}
                disabled={testando || !apiKey.trim()}
                className={`
                  flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all
                  ${testando || !apiKey.trim()
                    ? 'border-[#2a2d3a] text-[#64748b] cursor-not-allowed'
                    : 'border-[#4f8ef7] text-[#4f8ef7] hover:bg-[#4f8ef7]/10'
                  }
                `}
              >
                {testando ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-[#4f8ef7]/30 border-t-[#4f8ef7] rounded-full animate-spin" />
                    Testando...
                  </span>
                ) : (
                  'Testar conexão'
                )}
              </button>

              <button
                onClick={handleSalvar}
                disabled={salvando || !apiKey.trim()}
                className={`
                  flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
                  ${salvando || !apiKey.trim()
                    ? 'bg-[#2a2d3a] text-[#64748b] cursor-not-allowed'
                    : 'bg-[#4f8ef7] text-white hover:bg-[#3d7de8] active:scale-[0.98]'
                  }
                `}
              >
                {salvando ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  'Salvar'
                )}
              </button>
            </div>

          </div>

          {/* Info */}
          <div className="mt-4 p-4 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl">
            <p className="text-[#64748b] text-xs leading-relaxed">
              A chave fica salva localmente no seu computador e é usada apenas para as chamadas ao Bob.
              Nunca é enviada para nenhum outro servidor.
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}