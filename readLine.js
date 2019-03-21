const readline = require('readline');
const questsArr = [];
let rl;
let index = 0;
const funs = {
  exit: close
};

function close() {
  console.log('谢谢使用');
  rl.close();
}

function next(i) {
  index = typeof i === 'undefined' ? index + 1 : i;
  if (index <= questsArr.length) {
    start(index);
  } else {
    close();
  }
}

function start(i = 0) {
  const item = questsArr[i];
  rl.question(item.question, (data) => {
    if (funs[data]) {
      funs[data]();
      return;
    }
    const type = item.fun(data, close, next);
    if (type === 1) {
      return;
    }
    if (type === false || (index + 1) >= questsArr.length) {
      close();
    } else {
      next();
    }
  });
}

function quests(obj) {
  if (!obj || typeof obj !== 'object') {
    console.error('请注意入参');
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach(v => questsArr.push(v));
  }
  if (typeof obj === 'object' && obj.question) {
    questsArr.push(obj);
  }
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  start();
}

module.exports = quests;
