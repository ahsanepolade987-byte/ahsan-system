const reactions = new Map();
const logs = [];

function result(success, message, data = {}) {
  return { success, message, ...data };
}

const commands = {
  react: {
    description: 'د غبرګون سیستم معلومات',
    run: () => result(true, 'Reaction System فعال دی')
  },

  autoreact: {
    description: 'د اتومات غبرګون حالت',
    run: () => result(true, 'AutoReact تنظیماتو ته اړتیا لري')
  },

  reactlist: {
    description: 'د ثبت شوو غبرګونونو لېست',
    run: () => result(true, 'د غبرګونونو لېست', {
      reactions: [...reactions.values()]
    })
  },

  reactadd: {
    description: 'نوی غبرګون ثبتول',
    run: args => {
      if (!args.id) {
        return result(false, 'د غبرګون لپاره id ورکړه');
      }

      reactions.set(String(args.id), {
        id: String(args.id),
        target: args.target || '',
        emoji: args.emoji || '❤️',
        mode: args.mode || 'manual',
        status: 'registered'
      });

      logs.push({
        action: 'add',
        id: String(args.id),
        time: new Date().toISOString()
      });

      return result(true, 'غبرګون ثبت شو');
    }
  },

  reactremove: {
    description: 'ثبت شوی غبرګون لرې کول',
    run: args => {
      const removed = reactions.delete(String(args.id || ''));

      return result(
        removed,
        removed ? 'غبرګون لرې شو' : 'غبرګون پیدا نه شو'
      );
    }
  },

  reactstatus: {
    description: 'د غبرګون سیستم حالت',
    run: () => result(true, 'فعال', {
      total: reactions.size
    })
  },

  reactstats: {
    description: 'د غبرګونونو شمېر',
    run: () => result(true, 'احصایې', {
      total: reactions.size
    })
  },

  reactlog: {
    description: 'د غبرګونونو ثبت شوي لاګونه',
    run: () => result(true, 'لاګونه', { logs })
  },

  reactmode: {
    description: 'د غبرګون طریقه',
    run: args => result(true, 'د طریقې غوښتنه ترلاسه شوه', {
      mode: args.mode || 'manual'
    })
  },

  reactemoji: {
    description: 'د غبرګون ایموجي',
    run: args => result(true, 'ایموجي ټاکل شوی', {
      emoji: args.emoji || '❤️'
    })
  },

  reactlimit: {
    description: 'د غبرګون حد',
    run: args => result(true, 'د حد غوښتنه ترلاسه شوه', {
      limit: Number(args.limit) || 10
    })
  },

  reactstop: {
    description: 'د اتومات غبرګون درول',
    run: () => result(true, 'د درولو غوښتنه ترلاسه شوه')
  },

  reactstart: {
    description: 'د اتومات غبرګون پیل',
    run: () => result(true, 'د پیل غوښتنه ترلاسه شوه')
  },

  postreact: {
    description: 'د پوسټ غبرګون تنظیم',
    run: args => result(true, 'پوسټ تنظیماتو ته اړتیا لري', {
      target: args.target || null
    })
  },

  groupreact: {
    description: 'د ګروپ غبرګون تنظیم',
    run: () => result(true, 'د ګروپ تنظیماتو ته اړتیا لري')
  },

  channelreact: {
    description: 'د چینل غبرګون تنظیم',
    run: () => result(true, 'د چینل API او اجازو ته اړتیا لري')
  },

  reactionreport: {
    description: 'د غبرګون راپور',
    run: () => result(true, 'راپور', {
      total: reactions.size,
      logs: logs.length
    })
  },

  reactionhistory: {
    description: 'د غبرګون تاریخچه',
    run: () => result(true, 'تاریخچه', { logs })
  },

  reactpermission: {
    description: 'د غبرګون اجازه',
    run: () => result(true, 'د اجازو تنظیم ته اړتیا لري')
  },

  chreact: {
    description: 'د چینل غبرګون',
    run: () => result(true, 'د چینل API او اجازو ته اړتیا لري')
  }
};

module.exports = { commands };
