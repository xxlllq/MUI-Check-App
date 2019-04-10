mui.init({
	beforeback: function() {
		var current = plus.webview.currentWebview();
		if (current)
			current.close();
		var mainView = plus.webview.getWebviewById('main'); //打开主页
		if (mainView) {
			mui.fire(mainView, 'refresh', {
				needReload: needReload //主页是否执行数据重新加载
			});
			mainView.show();
		}
		return false;
	}
});
// H5 plus事件处理
var testDetailId = null,
	task = null,
	type = null,
	needReload = false;

function plusReady() {
	//获取传递的参数、更改标题
	var self = plus.webview.currentWebview();
	var title = self.title;
	testDetailId = self.testDetailId, type = self.type; ////静态、影音系统工作异响测试、路试、零部件台架、耐久
	needReload = self.needReload;//返回主页面时候，主页面是否需要重新加载
	
	if (title) {
		//更新标题
		mui('#title')[0].innerText = title;
	}

	if (!testDetailId) {
		plus.nativeUI.toast('缺少数据，请重新进入');
		return;
	}

	//设置部分元素是否可见
	if (type == "RT" || type == "DT") {
		$("#road-score-row").show(); //路试的时候，显示道路打分
	}
	if (type == "RT" || type == "FT" || type == "VT" || type == "DT") {
		$("#roadCondition-row").show(); //路试、四立柱、影音系统工作异响测试、耐久，道路工况显示
		if (type == "FT" || type == "DT") {
			$("#temperatureCondition-row").show(); //四立柱、耐久，温度工况显示
		}
		if (type == 'DT') {
			$("#mileageCondition-row").show(); //耐久，里程工况显示
		}
		if (type == 'VT') {
			$("#audioCondition-row").show(); //影音系统工作异响测试，音频工况显示
		}
	}

	var wt = plus.nativeUI.showWaiting();
	sendRequestToServer("/TestTask/GetTestDetail", "", {
		Id: testDetailId,
	}, function(result) {
		if (result && result.type == 1) {
			var data = result.value;
			if (data) {
				$("#code").text(data.Code); //编号
				$("#problem-description").val(data.Description); //问题描述
				$("#problem-category").val(data.Category ? data.Category : 'INT'); //问题分类
				$("#problem-severity").val(data.Severity ? data.Severity : 'C'); //问题严重度
				$("#problem-score").val(data.ProblemScore ? data.ProblemScore : 1); //问题打分
				$("#roadCondition").val(data.RoadCondition); //路面工况
				$("#temperatureCondition").val(data.TemperatureCondition); //温度工况
				$("#audioCondition").val(data.AudioCondition); //音频工况
				$("#mileageCondition").val(data.MileageCondition); //里程工况
				$("#ICA").val(data.ICA); //ICA
				//更新音频列表
				let audio = data.Audio;
				if (audio) {
					audio = JSON.parse(audio);
					for (let i = 0; i < audio.length; i++) {
						createAudioItemServer(audio[i]);
					}
				}

				//更新照片列表
				let picture = data.Picture;
				if (picture) {
					picture = JSON.parse(picture);
					for (let i = 0; i < picture.length; i++) {
						createPhotoServerItem(picture[i]);
					}
				}

				//更新视频列表
				let video = data.Video;
				if (video) {
					video = JSON.parse(video);
					for (let i = 0; i < video.length; i++) {
						createVideoServerItem(video[i]);
					}
				}
			}
		} else {
			plus.nativeUI.toast('获取数据失败');
		}
		wt.close();
	});
}

//上传数据
mui('.mui-bar').on('tap', '#commitData', function(e) {
	//弹出框
	var popover = document.getElementById("show-popover");
	if (task && task.state < 4) {
		mui("#popover-progressbar").popover('show', popover);
		return;
	}

	var count = 0;
	document.activeElement.blur(); //关闭软键盘
	//初始化上传器
	task = plus.uploader.createUpload(serverOperateUrl("/TestTask/UploadTestData"), {
		method: "POST"
	}, function(t, status) {});

	//进度条
	mui("#popover-progressbar").popover('show', popover);
	mui('#progressbar').progressbar().show();
	$("#popover-progressbar #process-num").text("0");

	task.addEventListener("statechanged", function(t, status) {
		if (t.state == 3) {
			//调用隐藏/显示弹出层
			count += 1;
			var num = Math.ceil(10240 * count / t.totalSize * 100);
			num = num > 100 ? 100 : num;
			$("#popover-progressbar #process-num").text(num == 100 ? '正在写入数据，请耐心等待' : (num + "%"));
		}
		if (t.state == 4) {
			if (status == 200) {
				let responseText = t.responseText;
				if (responseText) {
					let responseData = JSON.parse(responseText); //respone
					if (responseData) {
						let audioInserver = JSON.parse(responseData.audio); //服务器返回的音频文件列表
						if (audioInserver && audioInserver.length > 0) {
							$("#audioHistory").empty();
							for (var i = 0; i < audioInserver.length; i++) {
								createAudioItemServer(audioInserver[i]);
							}
						}

						let photoInserver = JSON.parse(responseData.photo); //服务器返回的照片文件列表
						if (photoInserver && photoInserver.length > 0) {
							$("#photoHistroy").empty();
							for (var i = 0; i < photoInserver.length; i++) {
								createPhotoServerItem(photoInserver[i]);
							}
						}

						let videoInserver = JSON.parse(responseData.video); //服务器返回的视频文件列表
						if (videoInserver && videoInserver.length > 0) {
							$("#videoHistroy").empty();
							for (var i = 0; i < videoInserver.length; i++) {
								createVideoServerItem(videoInserver[i]);
							}
						}
					}
				}

				plus.nativeUI.toast('上传完成');
				needReload = true;
				mui("#popover-progressbar").popover('hide', popover);
				//删除临时文件夹目录
				removeFile('camera', function(re) { //删除视频与图片
					if (re) {
						removeFile('audio', function(res) { //删除音频
						});
					}
				});
			} else if (status == 0) {
				plus.nativeUI.toast('上传失败');
				mui("#popover-progressbar").popover('hide', popover);
			}
		} else if (status == 500) {
			mui('#progressbar').progressbar().hide();
		}
	}, false);

	//需要上传的数据
	let user = validateUser();
	let jsonData = {
		Description: $("#problem-description").val(), //问题描述
		Category: $("#problem-category").val(), //问题分类
		Severity: $("#problem-severity").val(), //问题严重度
		ProblemScore: $("#problem-score").val(), //问题打分
		RoadScore: $("#road-score").val(), //路面打分
		RoadCondition: $("#roadCondition").val(), //道路工况
		TemperatureCondition: $("#temperatureCondition").val(), //温度工况
		AudioCondition: $("#audioCondition").val(), //音频工况
		MileageCondition: $("#mileageCondition").val(), //里程工况
		ICA: $("#ICA").val(), //ICA
		// Location: getLocation(), //经纬度
		TestDetailId: testDetailId,
		ModifyUser: user.UserId
	}

	//获取音频
	task.addData("model", JSON.stringify(jsonData).toString());
	getFile('audio', function(audios) {
		addFiles(task, audios, function(tk) { //添加音频
			getFile('camera', function(cameras) { //获取视频、照片
				addFiles(tk, cameras, function(t) { //添加视频、照片
					t.start();
				});
			});
		});
	});
});

//取消上传
function abort() {
	if (task)
		task.abort();
}

//添加文件
function addFiles(task, files, _callback) {
	if (files != null && files.length > 0) {
		for (var i in files) {
			if (files[i].isFile) {
				task.addFile("file://" + files[i].fullPath, {
					key: "file://" + files[i].fullPath
				});
			}
		}
	}
	_callback(task);
}

//获取文件
function getFile(directory, _callback) {
	if (!businessIdInAudio) {
		plus.nativeUI.toast('未获取到主键');
		return;
	}

	plus.io.resolveLocalFileSystemURL('_doc/', function(entry) {
		entry.getDirectory(directory + '/' + businessIdInAudio, {
			create: false
		}, function(dir) {
			var reader = dir.createReader();
			reader.readEntries(function(entries) {
				_callback(entries);
			}, function(e) {
				console.info('读取音频失败');
			});
		}, function(e) {
			console.info('获取目录2错误');
		});
	}, function(e) {
		console.info('获取目录1错误');
	});
}

//移除文件
function removeFile(dic, _callback) {
	plus.io.resolveLocalFileSystemURL('_doc/' + dic + '/' + businessIdInAudio, function(entry) {
		entry.removeRecursively(function() {
			entry.getDirectory(businessIdInAudio, {
				create: true
			});
			_callback(true);
		}, function(e) {
			_callback(false);
		});
	});
}

//获取经纬度
function getLocation() {
	plus.geolocation.getCurrentPosition(function(p) {
			var codns = p.coords; // 获取地理坐标信息；
			if (codns) {
				lat = codns.latitude; //获取到当前位置的纬度；
				longt = codns.longitude; //获取到当前位置的经度
				return "[" + lat + "," + longt + "]";
			}
		},
		function(e) {
			//alert("获取百度定位位置信息失败：" + e.message);
		}, {
			provider: 'baidu'
		});
}

if (window.plus) {
	plusReady();
} else {
	document.addEventListener('plusready', plusReady, false);
}
