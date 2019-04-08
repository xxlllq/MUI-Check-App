// H5 plus事件处理
//录音
var audioGentry = null,
	audioh1 = null,
	audiole = null;
var audioer = null,
	audioep = null;
var audiobUpdated = false; //用于兼容可能提前注入导致DOM未解析完更新的问题
var businessIdInAudio = null; //业务Id

// H5 plus事件处理
function plusReady() {
	//获取传递的参数、更改标题
	var self = plus.webview.currentWebview();
	businessIdInAudio = self.businessId;
	// 获取音频目录对象
	plus.io.resolveLocalFileSystemURL('_doc/', function(entry) {
		entry.getDirectory('audio/' + businessIdInAudio, {
			create: true
		}, function(dir) {
			audioGentry = dir;
			if (!mui.os.ios) {
				updateAudioHistory();
			}
		}, function(e) {
			//'Get directory "audio" failed: ' + e.message);
		});
	}, function(e) {
		//'Resolve "_doc/" failed: ' + e.message);
	});
}
if (window.plus) {
	plusReady();
} else {
	document.addEventListener('plusready', plusReady, false);
}
// DOMContentLoaded事件处理
document.addEventListener('DOMContentLoaded', function() {
	// 获取DOM元素对象
	audioh1 = document.getElementById('audioHistory');
	audiole = document.getElementById('audioEmpty');
	audioer = document.getElementById('record');
	rt = document.getElementById('rtime');
	audioep = document.getElementById('play');
	pt = document.getElementById('ptime');
	pp = document.getElementById('progress');
	ps = document.getElementById('schedule');
	updateAudioHistory();
}, false);
// 添加本地文件播放项
function createAudioItem(entry) {
	var li = document.createElement('li');
	li.className = 'ditem';
	li.innerHTML = '<span class="iplay"><font class="aname"></font><br/><font class="ainf"></font></span>';
	li.setAttribute('onclick', 'playAudio(this)');
	audioh1.insertBefore(li, audiole.nextSibling);
	li.querySelector('.aname').innerText = entry.name;
	li.querySelector('.ainf').innerText = '...';
	li.entry = entry;
	updateAudioInformation(li);
	// 设置空项不可见
	audiole.style.display = 'none';
}
// 添加服务器端返回数据播放项
function createAudioItemServer(data) {
	var li = document.createElement('li');
	li.className = 'ditem';
	li.innerHTML =
		'<span class="iplay server" style="color:#00a65a"><font class="aname"></font><br/><font class="ainf"></font></span>';
	li.setAttribute('onclick', 'playServerAudio("' + data.Id + '",' + '"' + data.Name + '")');
	audioh1.insertBefore(li, audiole.nextSibling);
	let name = data.Name;
	li.querySelector('.aname').innerText = name ? name : '未知';
	li.querySelector('.ainf').innerText = data.CreateTime ? data.CreateTime : '未知';
	// 设置空项不可见
	audiole.style.display = 'none';
}

// 开始录音
var r = null,
	t = 0,
	ri = null,
	rt = null;
mui('.mui-table-view .mui-navigate-right').on('tap', '#startRecord', function(e) {
	e.stopPropagation();
	startRecord();
});

function startRecord() {
	//'开始录音：');
	r = plus.audio.getRecorder();
	if (r == null) {
		//'录音对象未获取');
		return;
	}
	r.record({
		filename: '_doc/audio/' + businessIdInAudio + "/"
	}, function(p) {
		//'录音完成：' + p);
		plus.io.resolveLocalFileSystemURL(p, function(entry) {
			createAudioItem(entry);
		}, function(e) {
			//'读取录音文件错误：' + e.message);
		});
	}, function(e) {
		//'录音失败：' + e.message);
	});
	audioer.style.display = 'block';
	t = 0;
	ri = setInterval(function() {
		t++;
		rt.innerText = timeToStr(t);
	}, 1000);
}
// 停止录音
function stopRecord() {
	audioer.style.display = 'none';
	rt.innerText = '00:00:00';
	clearInterval(ri);
	ri = null;
	r.stop();
	w = null;
	r = null;
	t = 0;
}
// 清除历史记录
function cleanAudioHistory() {
	audioh1.innerHTML = '<li id="audioEmpty" class="ditem-audioEmpty">无历史记录</li>';
	audiole = document.getElementById('audioEmpty');
	// 删除音频文件
	//'清空录音历史记录：');
	audioGentry.removeRecursively(function() {
		// Success
		//'操作成功！');
	}, function(e) {
		ouline('操作失败：' + e.message);
	});
}
// 获取录音历史列表
function updateAudioHistory() {
	if (audiobUpdated || !audioGentry || !document.body) { //兼容可能提前注入导致DOM未解析完更新的问题
		return;
	}
	var reader = audioGentry.createReader();
	reader.readEntries(function(entries) {
		for (var i in entries) {
			if (entries[i].isFile) {
				createAudioItem(entries[i]);
			}
		}
	}, function(e) {
		//'读取录音列表失败：' + e.message);
	});
	audiobUpdated = true;
}
// 获取录音文件信息
function updateAudioInformation(li) {
	if (!li || !li.entry) {
		return;
	}
	var entry = li.entry;
	entry.getMetadata(function(metadata) {
		li.querySelector('.ainf').innerText = dateToStr(metadata.modificationTime);
	}, function(e) {
		//'获取文件"' + entry.name + '"信息失败：' + e.message);
	});
}
// 播放本地音频文件
function playAudio(li) {
	if (!li || !li.entry) {
		//'无效的音频文件');
		return;
	}
	//'播放音频文件：' + li.entry.name);
	startPlay('_doc/audio/' + businessIdInAudio + "/" + li.entry.name);
}

// 播放服务器音频文件
function playServerAudio(id, name) {
	//本地已经下载就直接播放本地，没有就从服务器端下载后播放
	var wt = plus.nativeUI.showWaiting();
	plus.io.resolveLocalFileSystemURL('_downloads/' + id + name, function(entry) {
		wt.close();
		startPlay("file:///"+entry.fullPath);
	}, function() {
		var dtask = plus.downloader.createDownload(serverUrl() + "/FileOperate/GetFileByName?name=" + id + name, {},
			function(d, status) {
				if (status == 200) {
					//下载成功并播放音频
					wt.close();
					startPlay(d.filename);
				} else {
					console.info()("下载失败");
					wt.close();
				}
			});
		//启动下载任务  
		dtask.start();
	});
}
// 播放文件相关对象
var p = null,
	pt = null,
	pp = null,
	ps = null,
	pi = null;
// 开始播放
function startPlay(url) {
	audioep.style.display = 'block';
	var L = pp.clientWidth;
	p = plus.audio.createPlayer(url);
	p.play(function() {
		//'播放完成！');
		// 播放完成
		pt.innerText = timeToStr(d) + '/' + timeToStr(d);
		ps.style.webkitTransition = 'all 0.3s linear';
		ps.style.width = L + 'px';
		stopPlay();
	}, function(e) {
		console.info(JSON.stringify(e));

		//'播放音频文件"' + url + '"失败：' + e.message);
	});
	// 获取总时长
	var d = p.getDuration();
	if (!d) {
		pt.innerText = '00:00:00/' + timeToStr(d);
	}
	pi = setInterval(function() {
		if (!d) { // 兼容无法及时获取总时长的情况
			d = p.getDuration();
		}
		var c = p.getPosition();
		if (!c) { // 兼容无法及时获取当前播放位置的情况
			return;
		}
		pt.innerText = timeToStr(c) + '/' + timeToStr(d);
		var pct = Math.round(L * c / d);
		if (pct < 8) {
			pct = 8;
		}
		ps.style.width = pct + 'px';
	}, 1000);
}
// 停止播放
function stopPlay() {
	clearInterval(pi);
	pi = null;
	setTimeout(resetPlay, 500);
	// 操作播放对象
	if (p) {
		p.stop();
		p = null;
	}
}
// 重置播放页面内容
function resetPlay() {
	audioep.style.display = 'none';
	ps.style.width = '8px';
	ps.style.webkitTransition = 'all 1s linear';
	pt.innerText = '00:00:00/00:00:00';
}
// 重写关闭
var _back = window.back;

function resetback() {
	// 停止播放
	if (audioep.style.display == 'block') {
		stopPlay();
	} else if (audioer.style.display == 'block') {
		stopRecord();
	} else {
		_back();
	}
}
window.back = resetback;


if (window.plus) {
	plusReady();
} else {
	document.addEventListener('plusready', plusReady, false);
}
