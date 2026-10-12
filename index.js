const express = require('express');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');

require('dotenv').config();

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));

if (!process.env.ADMIN_PASSWORD) {
  console.error('ERROR: ADMIN_PASSWORD په .env فایل کې نشته.');
  process.exit(1);
}

app.use(session({
  name: 'ahsan.sid',
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: false,
    maxAge: 2 * 60 * 60 * 1000
  }
}));

function requireAdmin(req, res, next) {
  if (req.session && req.session.authenticated) return next();

  if (req.path.startsWith('/api/')) {
    return res.status(401).json({
      success: false,
      error: 'لومړی Login وکړه'
    });
  }

  return res.redirect('/login');
}

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/api/login', (req, res, next) => {
  const supplied = String(req.body?.password || '');
  const expected = String(process.env.ADMIN_PASSWORD || '');

  if (!supplied || supplied !== expected) {
    return res.status(401).json({
      success: false,
      error: 'پاسورډ ناسم دی'
    });
  }

  req.session.regenerate(err => {
    if (err) return next(err);

    req.session.authenticated = true;

    req.session.save(err => {
      if (err) return next(err);
      res.json({ success: true });
    });
  });
});

app.post('/api/logout', requireAdmin, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('ahsan.sid');
    res.json({ success: true });
  });
});

app.use('/api', (req, res, next) => {
  if (req.path === '/login') return next();
  requireAdmin(req, res, next);
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/status', (req, res) => {
  res.json({ success: true, status: 'online' });
});

app.get('/api/commands', (req, res) => {
  res.json({
    success: true,
    commands: require('./commands').listCommands()
  });
});

app.post('/api/commands/:name', (req, res) => {
  const { runCommand } = require('./commands');
  const result = runCommand(req.params.name, req.body || {});

  if (!result.success && result.error === 'Command not found') {
    return res.status(404).json(result);
  }

  res.json(result);
});

const reactionModule = require('./commands/reactions');

app.get('/api/reactions', (req, res) => {
  res.json({
    success: true,
    commands: Object.entries(reactionModule.commands).map(([name, cmd]) => ({
      name: '.' + name,
      description: cmd.description
    }))
  });
});

app.post('/api/reactions/:name', (req, res) => {
  const name = req.params.name.replace(/^\./, '');
  const cmd = reactionModule.commands[name];

  if (!cmd) {
    return res.status(404).json({
      success: false,
      error: 'Command not found'
    });
  }

  res.json(cmd.run(req.body || {}));
});

app.get('/', (req, res) => res.redirect('/admin'));


app.get("/profile.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});

app.listen(3000, '127.0.0.1', () => {
  console.log('Ahsan System: http://127.0.0.1:3000');
  console.log('Login: http://127.0.0.1:3000/login');
});
