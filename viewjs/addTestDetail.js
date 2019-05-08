mui.init({
	beforeback: function() {
		//获得父页面的webview
		var mainView = plus.webview.currentWebview().opener();
		if (mainView) {
			//触发父页面的自定义事件(refresh),从而进行刷新
			mui.fire(mainView, 'refresh', {
				needReload: needReload //主页是否执行数据重新加载
			});
		}
		//返回true,继续页面关闭逻辑
		return true;
	}
});

// H5 plus事件处理
var testTaskId = null,
	needReload = false;

function plusReady() {
	//获取传递的参数、更改标题
	var self = plus.webview.currentWebview();
	var carModelName = self.carModelName;
	testTaskId = self.testTaskId;

	if (!testTaskId) {
		plus.nativeUI.toast('缺少数据，请重新进入');
		return;
	}

	if (carModelName) {
		//更新标题
		mui('#addTestDetailTitle')[0].innerText = carModelName;
	}

	var wt = plus.nativeUI.showWaiting();
	sendRequestToServer("/TestTask/GetTestContent", "", null, function(result) {
		if (result && result.type == 1) {
			var data = result.value;
			if (data && data.length > 0) {
				for (var i = 0; i < data.length; i++) {
					$("<option value='" + data[i].Id + "'>" + data[i].Name +
						"</option>").appendTo("#test-content");
				}
				$("#createAndReturn").removeClass('mui-disabled');
				$("#createAndTest").removeClass('mui-disabled');
			}
		} else {
			plus.nativeUI.toast('获取数据失败');
		}
		wt.close();
	});
}

//创建后返回主页
mui(document.body).on('tap', '#createAndReturn', function(e) {
	mui(this).button('loading');
	createTestDetail(true);
});
//创建后直接测试
mui(document.body).on('tap', '#createAndTest', function(e) {
	mui(this).button('loading');
	createTestDetail(false);
});

function createTestDetail(flag) {
	let user = validateUser();
	if (user) {
		var self = plus.webview.currentWebview();
		var type = $("#test-content").val(),
			carModelCode = self.carModelCode,
			createUser = user.UserId;
		if (testTaskId && type && carModelCode && createUser) {
			var commitData = {
				TaskId: testTaskId,
				Type: type,
				CarModelCode: carModelCode,
				CreateUser: user.UserId,
				Description: $("#problem-description").val(), //问题描述
				Category: $("#problem-category").val(), //问题分类
				Severity: $("#problem-severity").val(), //问题严重度
				ProblemScore: $("#problem-score").val(), //问题打分
				ICA: $("#ICA").val(), //ICA
				ProblemReason: $("#problem-reason").val()//问题原因
			}
			sendRequestToServer("/TestTask/CreateTestDetail", "", commitData, function(result) {
				if (result) {
					if (result.type == 1) {
						if (flag) {
							plus.nativeUI.toast("创建成功");
							needReload = true;
							mui.back();
						} else {
							var data = result.value;
							if (data && data.Id && data.Type && data.TaskId) {
								var title = $("#test-content").find("option:selected").text();
								mui.openWindow({
									url: 'info.html',
									id: 'info',
									extras: {
										businessId: data.TaskId, //任务Id
										testDetailId: data.Id, //任务详情（子任务）Id
										type: data.Type, //静态、影音系统工作异响测试、路试、零部件台架、耐久
										title: title ? title : '无', //标题
										needReload: true,
									}
								});
							} else {
								plus.nativeUI.toast("创建成功，但缺少相关数据");
							}
						}
					} else {
						plus.nativeUI.toast(result.message);
					}
				}
				if (flag) {
					mui("#createAndReturn").button('reset');
				} else {
					mui("#createAndTest").button('reset');
				}
			});
		} else {
			plus.nativeUI.toast('缺少相关数据，请重新进入');
		}
	}
}


if (window.plus) {
	plusReady();
} else {
	document.addEventListener('plusready', plusReady, false);
}
