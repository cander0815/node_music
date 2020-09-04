const fs = require('fs');
const request = require('request');
const musicApi = require('music-api');
const path = require('path');
const ProgressBar = require('./progress');
const config = require('./config');
let searchData = [];
let page = 1;
let maxPage = 1;
let oldName = '';

async function search(name, callback) {
  if (oldName !== name) {
    page = 1;
  }
  oldName = name;
  console.log(`开始搜索第${page}页`, name);
  try {
    const res = await musicApi.searchSong(config.type, {
      key: name,
      limit: 10,
      page
    });

    if (res.success) {
      if (!res.songList.length) {
        console.log('查询到的数据为空, 请从新输入要搜索的内容, 或输入`exit`退出；');
        type = false;
        callback('again');
        return;
      }
      searchData = res.songList.map((v, i) => {
        const names = v.artists.reduce((a, b) => {
          const left = typeof a === 'object' ? a.name : a;
          return `${left}/${b.name}`;
        });
        const obj = {
          album: v.album.name,
          name: v.name,
          id: v.id,
          artists: names.name || names
        };
        console.table(`索引: ${i}, 歌曲名: ${obj.name}, 歌手: ${obj.artists};`);
        return obj;
      });
      fs.writeFile('./data.json', JSON.stringify(searchData), (error) => {
        if (error) {
          console.log('写入失败');
          console.log(error);
          callback(1);
        } else {
          maxPage = Math.ceil(res.total / 10);
          console.log(`当前第${page}页, 共${Math.ceil(res.total / 10)}页`);
          console.log('在索引输入框中输入`w`,并回车,切换下一页, 输入`q`, 并回车, 切换上一页');
          callback();
        }
      });
    } else {
      console.log('搜索歌曲失败');
      console.log(res);
      callback(1);
    }
  } catch (e) {
    callback(1);
  }
}

async function getSongUrl(i, callback) {
  try {
    console.log('开始查询歌曲的地址');
    const item = searchData[i];
    const songID = item.id + '';
    const res = await musicApi.getSong(config.type, {
      id: songID,
      raw: false,
      br: 999000
    });
    if (res.success) {
      console.log('查询歌曲的地址成功');
      const url = res.url;
      const songName = `${item.name.replace(/\//g, '_') + '-' + item.artists.replace(/\//g, '_')}${url.substr(url.lastIndexOf('.'), url.length)}`;
      console.log('开始下载', songName);
      const songStream = fs.createWriteStream(path.join(__dirname, './songs/' + songName));
      // 总共要下载的数量
      let allSize = 0;
      // 已下载的数量
      let toSize = 0;
      const pb = new ProgressBar('下载进度', 50);
      request({
        method: 'GET',
        uri: url
      })
        .on('response', (data) => {
          // 更新总文件字节大小
          allSize = parseInt(data.headers['content-length'], 10);
        })
        .on('data', (chunk) => {
          // 更新下载的文件块字节大小
          toSize += chunk.length;
          pb.render({
            completed: toSize,
            total: allSize
          });
        })
        .on('error', function (err) {
          console.log(songName, '下载失败');
          console.log(err);
          callback(1);
        })
        .pipe(songStream)
        .on('close', () => {
          console.log(songName, ' 下载完成!');
          callback();
        });
    } else {
      console.log('查询歌曲的地址失败');
      console.log(res);
      callback();
    }
  } catch (e) {
    callback(1);
  }
}

function changePage(type, callback) {
  if (type === 'q') {
    if (page > 1) {
      page -= 1;
      callback();
    } else {
      console.log('已经是第一页了');
      callback(1);
    }
  }
  if (type === 'w') {
    page += 1;
    if (page > maxPage) {
      console.log('已经是最后一页');
      callback(1);
      return
    }
    callback();
  }
}

function restart() {
  page = 1;
  maxPage = 1;
  oldName = '';
  searchData = []
}

module.exports = {
  search,
  getSongUrl,
  changePage,
  restart
};
