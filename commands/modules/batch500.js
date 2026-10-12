const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HOME = path.resolve(process.env.HOME || '.');
const startedAt = Date.now();

function safePath(input = '.') {
  const p = path.resolve(HOME, String(input));
  if (p !== HOME && !p.startsWith(HOME + path.sep)) {
    throw new Error('Path must remain inside Home directory');
  }
  return p;
}

function ok(data = {}) {
  return { success: true, ...data };
}

function fail(message) {
  return { success: false, error: message };
}

const definitions = [
  ['sysinfo', 'د سیستم معلومات', () => ok({
    platform: os.platform(),
    arch: os.arch(),
    node: process.version,
    memoryTotal: os.totalmem(),
    memoryFree: os.freemem()
  })],
  ['uptime', 'د سیستم فعال وخت', () => ok({
    systemSeconds: os.uptime(),
    processSeconds: process.uptime()
  })],
  ['health', 'د پروسې روغتیا', () => ok({
    status: 'healthy',
    pid: process.pid,
    memory: process.memoryUsage(),
    time: new Date().toISOString()
  })],
  ['timestamp', 'اوسنی وخت', () => ok({
    iso: new Date().toISOString(),
    unix: Date.now()
  })],
  ['randomid', 'تصادفي پېژندشمېره', () => ok({
    id: crypto.randomUUID()
  })],
  ['hashtext', 'د متن SHA-256 هش', args => {
    if (typeof args.text !== 'string') return fail('text ورکړه');
    return ok({
      algorithm: 'sha256',
      hash: crypto.createHash('sha256').update(args.text).digest('hex')
    });
  }],
  ['textlength', 'د متن اوږدوالی', args => {
    if (typeof args.text !== 'string') return fail('text ورکړه');
    return ok({
      characters: [...args.text].length,
      bytes: Buffer.byteLength(args.text, 'utf8')
    });
  }],
  ['textupper', 'متن غټ توري کول', args => {
    if (typeof args.text !== 'string') return fail('text ورکړه');
    return ok({ text: args.text.toUpperCase() });
  }],
  ['textlower', 'متن واړه توري کول', args => {
    if (typeof args.text !== 'string') return fail('text ورکړه');
    return ok({ text: args.text.toLowerCase() });
  }],
  ['textreverse', 'د متن ترتیب سرچپه کول', args => {
    if (typeof args.text !== 'string') return fail('text ورکړه');
    return ok({ text: [...args.text].reverse().join('') });
  }],
  ['jsonparse', 'د JSON متن لوستل', args => {
    if (typeof args.text !== 'string') return fail('text ورکړه');
    try {
      return ok({ value: JSON.parse(args.text) });
    } catch {
      return fail('JSON ناسم دی');
    }
  }],
  ['jsonformat', 'JSON منظمول', args => {
    if (typeof args.text !== 'string') return fail('text ورکړه');
    try {
      return ok({ text: JSON.stringify(JSON.parse(args.text), null, 2) });
    } catch {
      return fail('JSON ناسم دی');
    }
  }],
  ['filelist', 'د فولډر فایلونه', args => {
    const p = safePath(args.path || '.');
    return ok({
      path: p,
      items: fs.readdirSync(p, { withFileTypes: true })
        .slice(0, 200)
        .map(x => ({ name: x.name, type: x.isDirectory() ? 'directory' : 'file' }))
    });
  }],
  ['fileinfo', 'د فایل معلومات', args => {
    if (!args.path) return fail('path ورکړه');
    const p = safePath(args.path);
    const s = fs.statSync(p);
    return ok({
      path: p,
      directory: s.isDirectory(),
      size: s.size,
      modified: s.mtime.toISOString()
    });
  }],
  ['filewrite', 'نوی متن فایل جوړول', args => {
    if (!args.path || typeof args.content !== 'string') {
      return fail('path او content ورکړه');
    }
    const p = safePath(args.path);
    fs.writeFileSync(p, args.content, { encoding: 'utf8', flag: 'wx' });
    return ok({ message: 'فایل جوړ شو', path: p });
  }],
  ['mkdir', 'نوی فولډر جوړول', args => {
    if (!args.path) return fail('path ورکړه');
    const p = safePath(args.path);
    fs.mkdirSync(p);
    return ok({ message: 'فولډر جوړ شو', path: p });
  }],
  ['filecopy', 'فایل کاپي کول', args => {
    if (!args.source || !args.destination) return fail('source او destination ورکړه');
    const src = safePath(args.source);
    const dest = safePath(args.destination);
    fs.copyFileSync(src, dest, fs.constants.COPYFILE_EXCL);
    return ok({ message: 'کاپي جوړه شوه', destination: dest });
  }],
  ['calculate', 'د دوو عددونو حساب', args => {
    const a = Number(args.a), b = Number(args.b);
    const op = args.op;
    if (!Number.isFinite(a) || !Number.isFinite(b)) return fail('a او b باید عددونه وي');
    if (op === 'add') return ok({ result: a + b });
    if (op === 'sub') return ok({ result: a - b });
    if (op === 'mul') return ok({ result: a * b });
    if (op === 'div') return b === 0 ? fail('پر صفر وېش نه کېږي') : ok({ result: a / b });
    return fail('op باید add، sub، mul یا div وي');
  }]
];

const commands = new Map(definitions.map(([name, description, handler]) =>
  [name, { description, handler }]
));

const groups = [
  'text', 'json', 'file', 'folder', 'system',
  'date', 'math', 'security', 'project', 'data'
];

const actions = [
  'inspect', 'validate', 'summary', 'count', 'report',
  'check', 'preview', 'measure', 'convert', 'status'
];

for (const group of groups) {
  for (const action of actions) {
    const name = `${group}_${action}`;
    if (commands.has(name)) continue;

    commands.set(name, {
      description: `${group} ${action} operation`,
      handler: args => {
        if (group === 'text') {
          if (typeof args.text !== 'string') return fail('text ورکړه');
          if (action === 'count') return ok({ count: [...args.text].length });
          if (action === 'convert') return ok({ upper: args.text.toUpperCase(), lower: args.text.toLowerCase() });
          if (action === 'reverse') return ok({ text: [...args.text].reverse().join('') });
          return ok({ text: args.text, length: [...args.text].length });
        }

        if (group === 'date') {
          const now = new Date();
          return ok({ iso: now.toISOString(), unix: now.getTime(), day: now.getUTCDay() });
        }

        if (group === 'system' || action === 'status' || action === 'check') {
          return ok({
            group,
            action,
            platform: os.platform(),
            node: process.version,
            memoryFree: os.freemem(),
            processUptime: process.uptime()
          });
        }

        if (group === 'file' || group === 'folder') {
          const p = safePath(args.path || '.');
          const s = fs.statSync(p);
          return ok({
            group,
            action,
            path: p,
            isDirectory: s.isDirectory(),
            size: s.size,
            modified: s.mtime.toISOString()
          });
        }

        if (group === 'json') {
          if (typeof args.text !== 'string') return fail('text ورکړه');
          try {
            const value = JSON.parse(args.text);
            return ok({
              valid: true,
              type: Array.isArray(value) ? 'array' : typeof value,
              keys: value && typeof value === 'object' ? Object.keys(value) : []
            });
          } catch {
            return fail('JSON ناسم دی');
          }
        }

        if (group === 'math') {
          const n = Number(args.value);
          if (!Number.isFinite(n)) return fail('value عدد ورکړه');
          return ok({ value: n, absolute: Math.abs(n), rounded: Math.round(n), square: n * n });
        }

        if (group === 'security') {
          return ok({
            note: 'دا یوازې محلي معلومات ښيي؛ د ننوتلو ازموینه یا برید نه ترسره کوي.',
            node: process.version,
            encryptedHashAvailable: true
          });
        }

        if (group === 'project') {
          return ok({
            project: 'Ahsan System',
            group,
            action,
            commandCount: commands.size,
            cwd: process.cwd()
          });
        }

        if (group === 'data') {
          if (args.value === undefined) return fail('value ورکړه');
          return ok({
            type: Array.isArray(args.value) ? 'array' : typeof args.value,
            serializedLength: JSON.stringify(args.value).length
          });
        }

        return fail('دا عملیات نه دی تعریف شوی');
      }
    });
  }
}

module.exports = commands;
