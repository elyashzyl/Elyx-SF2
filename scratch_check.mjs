import { initDatabase, query } from './db.js'
await initDatabase()
const tables = query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
console.log('TABLES:', tables.map(t => t.name).join(', '))
process.exit(0)
