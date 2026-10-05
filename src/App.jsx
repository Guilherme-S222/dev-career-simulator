import { useState, useEffect } from 'react'
import Cadastro from './components/Cadastro'
import Painel from './components/Painel'
import Tarefa from './components/Tarefa'
import Configuracoes from './components/Configuracoes'
import { sortearTarefa } from './data/tarefas'
import { calcularNivel } from './utils/nivel'

export default function App() {
  const [tela, setTela] = useState('loading')
  const [usuario, setUsuario] = useState(null)
  const [tarefaAtual, setTarefaAtual] = useState(null)

  useEffect(() => {
    async function init() {
      try {
        const user = await window.api.getUser()
        if (user) {
          setUsuario(user)
          const tarefaAndamento = await window.api.getTarefaAndamento()
          if (tarefaAndamento) {
            setTarefaAtual(tarefaAndamento)
          }
          setTela('painel')
        } else {
          setTela('cadastro')
        }
      } catch (err) {
        console.error('Erro ao inicializar:', err)
        setTela('cadastro')
      }
    }
    init()
  }, [])

  function handleCadastro(user) {
    setUsuario(user)
    setTela('painel')
  }

  async function handleIniciarTarefa() {
    try {
      const tarefasConcluidas = await window.api.getTasks()
      const historico = tarefasConcluidas.map((t) => t.tarefa_id).filter(Boolean)
      const nivel = calcularNivel(usuario.xp)

      const tarefa = sortearTarefa(nivel.nome, historico)

      if (!tarefa) {
        alert('Parabéns! Você completou todas as tarefas deste nível.')
        return
      }

      const id = await window.api.saveTask({
        ...tarefa,
        tarefa_id: tarefa.id,
      })

      setTarefaAtual({ ...tarefa, id })
      setTela('tarefa')
    } catch (err) {
      console.error('Erro ao iniciar tarefa:', err)
      alert('Erro ao iniciar tarefa: ' + err.message)
    }
  }

  function handleConcluirTarefa(novoXP) {
    setUsuario((u) => ({ ...u, xp: novoXP }))
    setTarefaAtual(null)
    setTela('painel')
  }

  function handleVoltarAoPainel() {
    setTela('painel')
  }

  function handleRetomarTarefa() {
    setTela('tarefa')
  }

  if (tela === 'loading') {
    return (
      <div className="h-screen bg-[#0f1117] flex items-center justify-center">
        <span className="text-[#64748b] font-mono text-sm animate-pulse">
          Iniciando DevLab...
        </span>
      </div>
    )
  }

  if (tela === 'cadastro') return <Cadastro onCadastro={handleCadastro} />
  if (tela === 'config') return <Configuracoes onVoltar={() => setTela('painel')} />

  if (tela === 'tarefa' && tarefaAtual) {
    return (
      <Tarefa
        tarefa={tarefaAtual}
        usuario={usuario}
        onConcluir={handleConcluirTarefa}
        onVoltar={handleVoltarAoPainel}
      />
    )
  }

  return (
    <Painel
      usuario={usuario}
      tarefaAndamento={tarefaAtual}
      onIniciarTarefa={handleIniciarTarefa}
      onRetomarTarefa={handleRetomarTarefa}
      onConfiguracoes={() => setTela('config')}
    />
  )
}