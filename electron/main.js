const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(async () => {
  const db = require('../src/database/db')
  await db.init(app.getPath('userData'))

  createWindow()

  // ── Usuário ──────────────────────────────────────────────
  ipcMain.handle('db:getUser', () => db.getUser())
  ipcMain.handle('db:createUser', (_, nome) => db.createUser(nome))
  ipcMain.handle('db:updateXP', (_, xp) => db.updateXP(xp))

  // ── Tarefas ──────────────────────────────────────────────
  ipcMain.handle('db:getTasks', () => db.getTasks())
  ipcMain.handle('db:getTarefaAndamento', () => db.getTarefaAndamento())
  ipcMain.handle('db:saveTask', (_, task) => db.saveTask(task))
  ipcMain.handle('db:updateTask', (_, id, updates) => db.updateTask(id, updates))

  // ── Configurações ────────────────────────────────────────
  ipcMain.handle('config:getApiKey', () => db.getConfig('api_key'))
  ipcMain.handle('config:setApiKey', (_, key) => db.setConfig('api_key', key))

  // ── Claude API (main process — sem CORS) ─────────────────
  ipcMain.handle('claude:call', async (_, { message, systemPrompt, apiKey }) => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message || 'Erro na API: ' + response.status)
    }

    const data = await response.json()
    return data.content[0].text
  })

  // ── Leitura de pasta ─────────────────────────────────────
  ipcMain.handle('files:readFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Selecione a pasta do seu projeto',
    })

    if (result.canceled || !result.filePaths.length) return null

    const folderPath = result.filePaths[0]
    const csFiles = []

    function readRecursive(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          const skip = ['bin', 'obj', 'node_modules', '.git', '.vs']
          if (!skip.includes(entry.name)) readRecursive(fullPath)
        } else if (entry.name.endsWith('.cs')) {
          csFiles.push({
            nome: path.relative(folderPath, fullPath),
            conteudo: fs.readFileSync(fullPath, 'utf-8'),
          })
        }
      }
    }

    readRecursive(folderPath)
    return { pasta: folderPath, arquivos: csFiles }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})