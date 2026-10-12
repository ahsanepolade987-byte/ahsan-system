const commands = new Map();

function register(name, description, handler) {
  commands.set(name, { name, description, handler });
}

function listCommands() {
  return [...commands.values()].map(({ name, description }) => ({
    name,
    description
  }));
}

function runCommand(name, args = {}) {
  const command = commands.get(name);
  if (!command) return { success: false, error: 'Command not found' };
  try {
    return command.handler(args);
  } catch {
    return { success: false, error: 'Command failed' };
  }
}

register('help', 'Show available commands', () => ({
  success: true,
  commands: listCommands()
}));

register('ping', 'Check system', () => ({
  success: true,
  message: 'Ahsan System is running!'
}));

register('status', 'Show system status', () => ({
  success: true,
  name: 'Ahsan System',
  status: 'running',
  registeredCommands: commands.size
}));

module.exports = { register, listCommands, runCommand };

const reactionModule = require('./reactions');
for (const [name, command] of Object.entries(reactionModule.commands)) {
register(name, command.description, command.run);
}

// عملي System Tools
const systemTools = require('./system-tools');
for (const [name, command] of Object.entries(systemTools)) {
  register(name, command.description, command.handler);
}

// File management commands
const fileTools = require('./file-tools');
for (const [name, command] of Object.entries(fileTools)) {
  register(name, command.description, command.handler);
}

// Batch500 module registration
const batch500 = require('./modules/batch500');
for (const [name, command] of batch500.entries()) {
  if (!commands.has(name)) {
    register(name, command.description, command.handler);
  }
}
