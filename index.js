const song = require('./song');
const readLine = require('./readLine');
const request = require('request');
const config = require('./config');
let searchName;
console.log('欢迎使用');
console.log('在使用过程中输入‘exit’, 或使用键盘‘ctrl+c’, 退出该程序');
console.log(`已选择数据源: ${config.type}-${config.typeName[config.type]}`);

function checkNetwork() {
  console.log('检查网络连接');
  const res = request({
    url: 'http://www.baidu.com',
    method: 'get'
  });
  res.on('error', (error) => {
    console.log('网络连接失败, 请确认网络后在运行');
    console.log('谢谢使用');
  });
  res.on('close', () => {
    console.log('网络已连接');
    readLine([
      {
        question: '请输入要下载的歌曲名称>  ',
        fun(data, close, next) {
          searchName = data;
          song.search(data, (err) => {
            if (err === 'again') {
              next(0);
              return 1;
            }
            if (err) {
              return false;
            }
            next();
          });
          return 1;
        }
      },
      {
        question: '请输入要下载的索引或`e`重新搜索歌名`q`(上一页)`w`(下一页)>    ',
        isNumber: true,
        fun(data, close, next) {
          if (data === 'e') {
            song.restart();
            next(0);
            return 1;
          }
          if (data === 'q' || data === 'w') {
            song.changePage(data, (err) => {
              if (err) {
                next(1);
                return;
              }
              song.search(searchName, (err) => {
                if (err === 'again') {
                  next(0);
                  return 1;
                }
                if (err) {
                  return false;
                }
                next(1);
              });
            });
            return 1;
          }
          if (isNaN(Number(data))) {
            console.log('请输入数字');
            next(1);
            return 1;
          }
          song.getSongUrl(data, (err) => {
            if (err) {
              close();
              return 1;
            }
            next(0);
          });
          return 1;
        }
      }
    ]);
  });
}

checkNetwork();
