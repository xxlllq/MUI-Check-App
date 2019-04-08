var i = 1,
	gentry = null,
	w = null;
var photohl = null,
	photole = null,
	videohl = null,
	videole = null;
var unv = true;
var bUpdated = false; //用于兼容可能提前注入导致DOM未解析完更新的问题
var businessIdInCamera = null; //业务Id

// H5 plus事件处理
function plusReady() {
	//获取传递的参数、更改标题
	var self = plus.webview.currentWebview();
	businessIdInCamera = self.businessId;

	// 获取摄像头目录对象
	plus.io.resolveLocalFileSystemURL('_doc/', function(entry) {
		entry.getDirectory('camera/' + businessIdInCamera, {
			create: true
		}, function(dir) {
			gentry = dir;
			if (!mui.os.ios) {
				updatecameraHistroy();
			}
		}, function(e) {
			//console.info('Get directory "camera" failed: ' + e.message);
		});
	}, function(e) {
		//console.info('Resolve "_doc/" failed: ' + e.message);
	});
}
if (window.plus) {
	plusReady();
} else {
	document.addEventListener('plusready', plusReady, false);
}
// 监听DOMContentLoaded事件
document.addEventListener('DOMContentLoaded', function() {
	// 获取DOM元素对象
	photohl = document.getElementById('photoHistroy');
	photole = document.getElementById('photoEmpty');
	videohl = document.getElementById('videoHistroy');
	videole = document.getElementById('videoEmpty');
	// 判断是否支持video标签
	unv = !document.createElement('video').canPlayType;
	updatecameraHistroy();
}, false);

mui('.mui-table-view .mui-navigate-right').on('tap', '#getImage', function(e) {
	e.stopPropagation();
	getImage();
});
mui('.mui-table-view .mui-navigate-right').on('tap', '#selectImage', function(e) {
	e.stopPropagation();
	selectImage();
});
mui('.mui-table-view .mui-navigate-right').on('tap', '#selectVideo', function(e) {
	e.stopPropagation();
	selectVideo();
});
mui('.mui-table-view .mui-navigate-right').on('tap', '#getVideo', function(e) {
	e.stopPropagation();
	getVideo();
});

// 拍照
function getImage() {
	//console.info('开始拍照：');
	var cmr = plus.camera.getCamera();
	cmr.captureImage(function(p) {
		plus.io.resolveLocalFileSystemURL(p, function(entry) {
			plus.zip.compressImage({
				src: entry.fullPath,
				dst: entry.fullPath,
				overwrite: true,
				quality: 50
			}, function() {
				createItem(entry);
			}, function() {
				console.info("压缩失败");
			});
		}, function(e) {
			//console.info('读取拍照文件错误：' + e.message);
		});
	}, function(e) {
		//console.info('失败：' + e.message);
	}, {
		filename: '_doc/camera/' + businessIdInCamera + '/',
		index: 1,
		// optimize: false,
		// resolution: 1
	});
}

//从相册选取照片
function selectImage() {
	plus.gallery.pick(function(e) {
		try {
			for (var i in e.files) {
				plus.io.resolveLocalFileSystemURL(e.files[i], function(fileEntry) {
					plus.io.resolveLocalFileSystemURL('_doc/camera/' + businessIdInCamera, function(root) {
						plus.zip.compressImage({
							src: fileEntry.fullPath,
							dst: root.fullPath + "/" + fileEntry.name,
							overwrite: true,
							quality: 50
						}, function() {
							createItem(fileEntry);
						}, function() {
							console.info("压缩失败");
						});

						// 						root.getFile(fileEntry.name, {}, function(file) {//判断图片是否已经存在
						// 							console.info("sdasdsa")
						// 							
						// 							file.remove(function() {
						// 								fileEntry.copyTo(root, '', function(entry) {
						// 									console.log("copy sucess");
						// 									updatecameraHistroy();
						// 								}, function(e) {
						// 									console.log("copy fail");
						// 								});
						// 							});
						// 						},function(){

						// })
					});
				});
			}
		} catch (e) {
			console.log(e);
		}
	}, function(e) {
		console.log("取消选择图片");
	}, {
		filter: "image",
		multiple: true,
		maximum: 5,
		system: false,
		onmaxed: function() {
			plus.nativeUI.alert('最多只能选择5张图片');
		}
	});
}

//选取视频
function selectVideo() {
	plus.gallery.pick(function(path) {
			if (path) {
				try {
					plus.io.resolveLocalFileSystemURL(path, function(fileEntry) {
						plus.io.resolveLocalFileSystemURL('_doc/camera/' + businessIdInCamera, function(newPath) {
							plus.io.resolveLocalFileSystemURL("file:///" + newPath.fullPath + '/' + fileEntry.name, function(entry) {},
								function() {
									//不存在就移动
									fileEntry.copyTo(newPath, '', function(entry) {
										createItem(entry);
									}, function(e) {
										console.log("复制失败");
									});
								})
						})
					}, function(e) {
						console.info(JSON.stringify(e));
					})
				} catch (e) {
					console.log(e);
				}
			}
		},
		function(e) {
			console.log("取消选择视频");
		}, {
			filter: "video",
			filename: '_doc/gallery/'
		});
}
// 录像
function getVideo() {
	//console.info('开始录像：');
	var cmr = plus.camera.getCamera();
	cmr.startVideoCapture(function(p) {
		//console.info('成功：' + p);
		plus.io.resolveLocalFileSystemURL(p, function(entry) {
			createItem(entry);
		}, function(e) {
			//console.info('读取录像文件错误：' + e.message);
		});
	}, function(e) {
		//console.info('失败：' + e.message);
	}, {
		filename: '_doc/camera/' + businessIdInCamera + '/',
		index: i,
		videoMaximumDuration: 20
	});
}
// 显示文件
function displayFile(li) {
	if (w) {
		//console.info('重复点击！');
		return;
	}
	if (!li || !li.entry) {
		return;
	}
	var name = li.entry.name;
	console.info(name)
	var suffix = name.substr(name.lastIndexOf('.'));
	if (suffix) {
		suffix = suffix.toLowerCase();
	}
	var url = '';
	if (suffix == '.mov' || suffix == '.3gp' || suffix == '.mp4' || suffix == '.avi') {
		//if(unv){plus.runtime.openFile('_doc/camera/'+name);return;}
		url = '/view/plus/camera_video.html';
	} else {
		url = '/view/plus/camera_image.html';
	}
	w = plus.webview.create(url, url, {
		hardwareAccelerated: true,
		scrollIndicator: 'none',
		scalable: true,
		bounce: 'all'
	});
	w.addEventListener('loaded', function() {
		w.evalJS('loadMedia("' + li.entry.toLocalURL() + '")');
		//w.evalJS('loadMedia("'+'http://localhost:13131/_doc/camera/'+name+'")');
	}, false);
	w.addEventListener('close', function() {
		w = null;
	}, false);
	w.show('pop-in');
}

// 显示服务器文件
function displayServerFile(path) {
	path = serverUrlWidthoutApi() + path;
	if (w) {
		//console.info('重复点击！');
		return;
	}

	var suffix = path.substr(path.lastIndexOf('.'));
	if(suffix){
		suffix = suffix.toLowerCase();
	}
	var url = '';
	if (suffix == '.mov' || suffix == '.3gp' || suffix == '.mp4' || suffix == '.avi') {
		//if(unv){plus.runtime.openFile('_doc/camera/'+name);return;}
		url = '/view/plus/camera_video.html';
	} else {
		url = '/view/plus/camera_image.html';
	}
	w = plus.webview.create(url, url, {
		hardwareAccelerated: true,
		scrollIndicator: 'none',
		scalable: true,
		bounce: 'all'
	});
	w.addEventListener('loaded', function() {
		w.evalJS('loadMedia("' + path + '")');
		//w.evalJS('loadMedia("'+'http://localhost:13131/_doc/camera/'+name+'")');
	}, false);
	w.addEventListener('close', function() {
		w = null;
	}, false);
	w.show('pop-in');
}

// 添加播放项
function createItem(entry) {
	var li = document.createElement('li');
	li.className = 'ditem';
	li.innerHTML = '<span class="iplay"><font class="aname"></font><br/><font class="ainf"></font></span>';
	li.setAttribute('onclick', 'displayFile(this)');

	var name = entry.name;
	var suffix = name.substr(name.lastIndexOf('.'));
	if (suffix)
		suffix = suffix.toLowerCase();
	var isVideo = (suffix == '.mov' || suffix == '.3gp' || suffix == '.mp4' || suffix == '.avi');
	if (isVideo) {
		videohl.insertBefore(li, videole.nextSibling);
		// 设置空项不可见
		videole.style.display = 'none';
	} else {
		photohl.insertBefore(li, photole.nextSibling);
		// 设置空项不可见
		photole.style.display = 'none';
	}

	li.querySelector('.aname').innerText = entry.name;
	li.querySelector('.ainf').innerText = '...';
	li.entry = entry;
	updateInformation(li);
}

//添加图片服务器返回的camera项
function createPhotoServerItem(data) {
	var li = document.createElement('li');
	li.className = 'ditem';
	li.innerHTML =
		'<span class="iplay" style="color:#00a65a"><font class="aname"></font><br/><font class="ainf"></font></span>';
	li.setAttribute('onclick', 'displayServerFile("' + data.ServicePath + '")');
	photohl.insertBefore(li, photole.nextSibling);
	// 设置空项不可见
	photole.style.display = 'none';
	let name = data.Name;
	li.querySelector('.aname').innerText = name ? name : '未知';
	li.querySelector('.ainf').innerText = data.CreateTime ? data.CreateTime : '未知';
}

//添加视频服务器返回的camera项
function createVideoServerItem(data) {
	var li = document.createElement('li');
	li.className = 'ditem';
	li.innerHTML =
		'<span class="iplay" style="color:#00a65a"><font class="aname"></font><br/><font class="ainf"></font></span>';
	li.setAttribute('onclick', 'displayServerFile("' + data.ServicePath + '")');
	videohl.insertBefore(li, videole.nextSibling);
	// 设置空项不可见
	videole.style.display = 'none';
	let name = data.Name;
	li.querySelector('.aname').innerText = name ? name : '未知';
	li.querySelector('.ainf').innerText = data.CreateTime ? data.CreateTime : '未知';
}

// 获取Camera文件信息
function updateInformation(li) {
	if (!li || !li.entry) {
		return;
	}
	var entry = li.entry;
	entry.getMetadata(function(metadata) {
		li.querySelector('.ainf').innerText = dateToStr(metadata.modificationTime);
	}, function(e) {
		//console.info('获取文件"' + entry.name + '"信息失败：' + e.message);
	});
}
// 获取Camera历史列表
function updatecameraHistroy() {
	if (bUpdated || !gentry || !document.body) { //兼容可能提前注入导致DOM未解析完更新的问题
		return;
	}
	var reader = gentry.createReader();
	reader.readEntries(function(entries) {
		for (var i in entries) {
			if (entries[i].isFile) {
				createItem(entries[i]);
			}
		}
	}, function(e) {
		//console.info('读取录音列表失败：' + e.message);
	});
	bUpdated = true;
}
