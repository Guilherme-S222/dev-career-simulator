const initSqlJs = require('sql.js')
const path = require('path')
const fs = require('fs')

let db = null
let dbPath = null

async function init(userDataPath) {
  const SQL = await initSqlJs()
  dbPath = path.join(userDataPath, 'devlab.db')

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      criado_em TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      tarefa_id TEXT,
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      tipo TEXT NOT NULL,
      dificuldade TEXT NOT NULL,
      analise_negocial TEXT,
      analise_tecnica TEXT,
      nota TEXT,
      xp_ganho INTEGER,
      passou INTEGER,
      feedback TEXT,
      status TEXT DEFAULT 'em_andamento',
      criado_em TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)

  // Migração: adiciona coluna feedback se não existir (banco já criado antes)
  try {
    db.run(`ALTER TABLE tasks ADD COLUMN feedback TEXT`)
  } catch (e) {
    // Coluna já existe — ignora
  }

  save()
}

function save() {
  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

function queryOne(sql, params = []) {
  return queryAll(sql, params)[0] || null
}

function run(sql, params = []) {
  db.run(sql, params)
  save()
}

module.exports = {
  init,

  getUser: () => queryOne('SELECT * FROM users LIMIT 1'),

  createUser: (nome) => {
    run('INSERT INTO users (nome, xp) VALUES (?, ?)', [nome, 0])
    return queryOne('SELECT * FROM users LIMIT 1')
  },

  updateXP: (xp) => {
    run('UPDATE users SET xp = ? WHERE id = 1', [xp])
  },

  getTasks: () =>
    queryAll(`
      SELECT * FROM tasks
      WHERE status = 'concluida'
      ORDER BY criado_em DESC
      LIMIT 10
    `),

  getTarefaAndamento: () =>
    queryOne(`
      SELECT * FROM tasks
      WHERE status = 'em_andamento'
      ORDER BY criado_em DESC
      LIMIT 1
    `),

  saveTask: (task) => {
    // Cancela qualquer tarefa em andamento antes de criar nova
    run(`UPDATE tasks SET status = 'cancelada' WHERE status = 'em_andamento'`)
    run(
      `INSERT INTO tasks (tarefa_id, titulo, tipo, dificuldade, analise_negocial, analise_tecnica, status)
       VALUES (?, ?, ?, ?, ?, ?, 'em_andamento')`,
      [task.tarefa_id || null, task.titulo, task.tipo, task.dificuldade, task.analise_negocial, task.analise_tecnica]
    )
    return queryOne('SELECT last_insert_rowid() as id').id
  },

  updateTask: (id, { nota, xp_ganho, passou, feedback }) => {
    run(
      `UPDATE tasks SET nota = ?, xp_ganho = ?, passou = ?, feedback = ?, status = 'concluida' WHERE id = ?`,
      [nota, xp_ganho, passou ? 1 : 0, feedback ? JSON.stringify(feedback) : null, id]
    )
  },

  getConfig: (key) => {
    const row = queryOne('SELECT value FROM config WHERE key = ?', [key])
    return row ? row.value : null
  },

  setConfig: (key, value) => {
    run('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', [key, value])
  },
}