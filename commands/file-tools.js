const fs = require('fs');
const path = require('path');

const HOME = path.resolve(process.env.HOME || '.');

function safe(input) {
  const p = path.resolve(HOME, String(input || ''));
  if (p !== HOME && !p.startsWith(HOME + path.sep)) {
    throw new Error('اجازه نشته؛ یوازې د Home فولډر دننه');
  }
  return p;
}

module.exports = {
  filewrite: {
    description: 'فایل جوړول یا متن پکې لیکل',
    handler: args => {
      if (!args.path || typeof args.content !== 'string')
        return { success: false, error: 'path او content ورکړه' };

      const p = safe(args.path);
      fs.writeFileSync(p, args.content, { encoding: 'utf8', flag: 'wx' });
      return { success: true, message: 'فایل جوړ شو', path: p };
    }
  },

  filecopy: {
    description: 'د فایل کاپي جوړول',
    handler: args => {
      if (!args.source || !args.destination)
        return { success: false, error: 'source او destination ورکړه' };

      const src = safe(args.source);
      const dest = safe(args.destination);

      if (!fs.statSync(src).isFile())
        return { success: false, error: 'سرچینه عادي فایل نه دی' };

      fs.copyFileSync(src, dest, fs.constants.COPYFILE_EXCL);
      return { success: true, message: 'کاپي جوړه شوه', destination: dest };
    }
  },

  filerename: {
    description: 'د فایل یا فولډر نوم بدلول',
    handler: args => {
      if (!args.source || !args.destination)
        return { success: false, error: 'source او destination ورکړه' };

      const src = safe(args.source);
      const dest = safe(args.destination);

      if (!fs.existsSync(src))
        return { success: false, error: 'سرچینه پیدا نه شوه' };

      if (fs.existsSync(dest))
        return { success: false, error: 'نوی نوم له مخکې موجود دی' };

      fs.renameSync(src, dest);
      return { success: true, message: 'نوم بدل شو', destination: dest };
    }
  }
};
