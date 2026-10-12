const os = require('os');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function safePath(input = '.') {
  const root = path.resolve(process.env.HOME || '.');
  const target = path.resolve(root, String(input));

  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error('اجازه نشته: یوازې د Home فولډر دننه فایلونه کارولای شې');
  }

  return { root, target };
}

const tools = {
  sysinfo: {
    description: 'د موبایل او Node.js معلومات',
    handler: () => ({
      success: true,
      platform: os.platform(),
      architecture: os.arch(),
      nodeVersion: process.version,
      hostname: os.hostname(),
      totalMemoryMB: Math.round(os.totalmem() / 1048576),
      freeMemoryMB: Math.round(os.freemem() / 1048576),
      cpuCount: os.cpus().length,
      uptimeSeconds: Math.floor(os.uptime())
    })
  },

  diskinfo: {
    description: 'د ذخیرې واقعي معلومات',
    handler: () => {
      try {
        const output = execFileSync('df', ['-h', process.env.HOME || '.'], {
          encoding: 'utf8',
          timeout: 3000
        });
        return { success: true, output };
      } catch {
        return { success: false, error: 'د ذخیرې معلومات ترلاسه نه شول' };
      }
    }
  },

  uptime: {
    description: 'د Ahsan System د فعال وخت معلومات',
    handler: () => ({
      success: true,
      processUptimeSeconds: Math.floor(process.uptime()),
      systemUptimeSeconds: Math.floor(os.uptime())
    })
  },

  health: {
    description: 'د سرور او حافظې معاینه',
    handler: () => ({
      success: true,
      status: 'healthy',
      memoryUsedMB: Math.round((process.memoryUsage().rss / 1048576) * 10) / 10,
      freeMemoryMB: Math.round(os.freemem() / 1048576),
      pid: process.pid,
      checkedAt: new Date().toISOString()
    })
  },

  filelist: {
    description: 'د Home فولډر د فایلونو لېست',
    handler: args => {
      const { target } = safePath(args.path || '.');
      const items = fs.readdirSync(target, { withFileTypes: true })
        .slice(0, 100)
        .map(item => ({
          name: item.name,
          type: item.isDirectory() ? 'directory' : 'file'
        }));

      return { success: true, path: target, items };
    }
  },

  fileinfo: {
    description: 'د فایل اندازه او معلومات',
    handler: args => {
      if (!args.path) return { success: false, error: 'path ورکړه' };

      const { target } = safePath(args.path);
      const stat = fs.statSync(target);

      return {
        success: true,
        path: target,
        type: stat.isDirectory() ? 'directory' : 'file',
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString()
      };
    }
  },

  mkdir: {
    description: 'په Home فولډر کې نوی فولډر جوړول',
    handler: args => {
      if (!args.path) return { success: false, error: 'د فولډر نوم ورکړه' };

      const { target } = safePath(args.path);
      fs.mkdirSync(target, { recursive: false });

      return { success: true, message: 'فولډر جوړ شو', path: target };
    }
  },

  readfile: {
    description: 'د متن فایل لوستل',
    handler: args => {
      if (!args.path) return { success: false, error: 'د فایل path ورکړه' };

      const { target } = safePath(args.path);
      const stat = fs.statSync(target);

      if (!stat.isFile()) {
        return { success: false, error: 'دا عادي فایل نه دی' };
      }

      if (stat.size > 65536) {
        return { success: false, error: 'فایل تر 64KB لوی دی' };
      }

      return {
        success: true,
        path: target,
        content: fs.readFileSync(target, 'utf8')
      };
    }
  }
};

module.exports = tools;
