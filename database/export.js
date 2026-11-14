// Export the same reconstructed data used by the offline database map.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'presentation/database-data.js'), 'utf8'), context);
const database = context.window.DATABASE_DATA;
if (!database || database.tables.length !== 30 || database.relationships.length !== 54) {
  throw new Error('Unexpected database-map data');
}
fs.writeFileSync(path.join(__dirname, 'schema-map.json'), JSON.stringify(database, null, 2) + '\n');
console.log('Exported 30 tables and 54 links with source notes and reported samples.');
