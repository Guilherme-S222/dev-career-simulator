const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // Usuário
  getUser: () => ipcRenderer.invoke('db:getUser'),
  createUser: (nome) => ipcRenderer.invoke('db:createUser', nome),
  updateXP: (xp) => ipcRenderer.invoke('db:updateXP', xp),

  // Tarefas
  getTasks: () => ipcRenderer.invoke('db:getTasks'),
  getTarefaAndamento: () => ipcRenderer.invoke('db:getTarefaAndamento'),
  saveTask: (task) => ipcRenderer.invoke('db:saveTask', task),
  updateTask: (id, updates) => ipcRenderer.invoke('db:updateTask', id, updates),

  // Config
  getApiKey: () => ipcRenderer.invoke('config:getApiKey'),
  setApiKey: (key) => ipcRenderer.invoke('config:setApiKey', key),

  // Claude (via main process — sem CORS)
  claudeCall: (payload) => ipcRenderer.invoke('claude:call', payload),

  // Arquivos
  readFolder: () => ipcRenderer.invoke('files:readFolder'),
})