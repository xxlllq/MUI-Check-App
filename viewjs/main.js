mui.init({
	gestureConfig: {
		doubletap: true
	},
	pullRefresh: {
		swipeBack: false, //关闭左滑关闭功能
		container: "#tabbar-home", //下拉刷新容器标识，querySelector能定位的css选择器均可，比如：id、.class等
		down: {
			style: 'circle', //必选，下拉刷新样式，目前支持原生5+ ‘circle’ 样式
			color: '#0A81E9', //可选，默认“#0A81E9” 下拉刷新控件颜色
			height: '50px', //可选,默认50px.下拉刷新控件的高度,
			range: '100px', //可选 默认100px,控件可下拉拖拽的范围
			offset: '0px', //可选 默认0px,下拉刷新控件的起始位置
			auto: true, //可选,默认false.首次加载自动上拉刷新一次
			contentdown: "下拉可以刷新", //可选，在下拉可刷新状态时，下拉刷新控件上显示的标题内容
			contentover: "释放立即刷新", //可选，在释放可刷新状态时，下拉刷新控件上显示的标题内容
			contentrefresh: "正在刷新...", //可选，正在刷新状态时，下拉刷新控件上显示的标题内容
			callback: pulldownRefresh //必选，刷新函数，根据具体业务来编写，比如通过ajax从服务器获取新数据；
		},
		up: {
			contentrefresh: '正在加载...',
			contentnomore: '没有更多数据了',
			callback: pulluploading //上拉加载下一页
		}
	}
});

//下拉刷新
function pulldownRefresh() {
	let user = myStorage.getItem('currentUser');
	if (!user)
		return;
	sendRequestToServer("/TestTask/GetList", "", {
		pager: {
			page: 1,
			rows: getPageRow()
		},
		user: {
			userId: user.UserId
		}
	}, function(result) {
		mui('#tabbar-home').pullRefresh().enablePullupToRefresh();
		if (result) {
			var data = result.value;
			if (data && data.rows) {
				if (data.rows.length > 0) {
					var str = template($('#generate-task-row').html(), {
						"rows": data.rows
					});
					$("#generatelist").html(str);
					mui("#tabbar-home").pullRefresh().endPulldown();
					page = 1;
					plus.nativeUI.toast('数据刷新成功');
				} else {
					mui("#tabbar-home").pullRefresh().endPullupToRefresh(true); //没有数据
					mui("#tabbar-home").pullRefresh().endPulldown();
					return;
				}
			} else {
				mui("#tabbar-home").pullRefresh().endPulldown();
			}
		} else {
			mui("#tabbar-home").pullRefresh().endPulldown();
		}
	})
}

//上拉加载
function pulluploading() {
	let user = myStorage.getItem('currentUser');
	// 无用户信息跳转到login界面
	if (!user)
		return;

	page += 1; //页码+1
	sendRequestToServer("/TestTask/GetList", "", {
		pager: {
			page: page,
			rows: getPageRow()
		},
		user: {
			userId: user.UserId
		}
	}, function(result) {
		if (result) {
			var data = result.value;
			if (data && data.rows && data.rows.length > 0) {
				var str = template($('#generate-task-row').html(), {
					"rows": data.rows
				});
				$("#generatelist").append(str);
				if (data.rows.length < getPageRow()) {
					mui('#tabbar-home').pullRefresh().endPullupToRefresh(true);
				} else {
					mui('#tabbar-home').pullRefresh().endPullupToRefresh();
				}
			} else {
				mui('#tabbar-home').pullRefresh().endPullupToRefresh(true);
			}
		} else {
			mui("#tabbar-home").pullRefresh().endPullupToRefresh(true);
		}
	})
}
// H5 plus事件处理
var page = 1;

function plusReady() {
	document.activeElement.blur(); //关闭软键盘 
	// 根据用户信息的有无,控制页面跳转.
	var user = myStorage.getItem('currentUser');
	// 	var loginPage = plus.webview.getWebviewById("login");
	// 	console.info(loginPage)
	// 	if (!loginPage) {
	// 		loginPage = mui.preload({
	// 			id: 'login',
	// 			url: 'login.html'
	// 		});
	// 	}
	// 无用户信息跳转到login界面
	if (!user || user.OverTime == null || new Date(user.OverTime).getTime() < new Date().getTime()) {
		mui.openWindow({
			url: "login.html",
			id: "login"
		});
		return;
	}
	
	$("#username").text(user.TrueName ? user.TrueName : '未知');
	$("#usercode").text(user.UserName ? user.UserName : 'UnKnown');
	// 处理返回键
	dealBackBtn();
}

//点击列表所在行触发的事件
function turnToTaskDetail(id, testDetailId, type, title) {
	if (id) {
		mui.openWindow({
			url: 'info.html',
			id: 'info',
			extras: {
				businessId: testDetailId, //任务详情（子任务）Id
				testDetailId: testDetailId,
				type: type, //静态、影音系统工作异响测试、路试、零部件台架、耐久
				title: title //标题
			}
		});
	}
}

//双击展开
mui('#tabbar-home').on('doubletap', '.task-row', function(e) {
	var detail = $(this).find('.task-detail');
	if (detail && detail.length > 0)
		detail.slideToggle(100);
});

//退出APP
document.getElementById('exit').addEventListener('tap', function() {
	if (mui.os.ios) {
		myStorage.clear();
		$("#generatelist").empty(); //清空数据
		$("#username").text('');
		$("#usercode").text('');
		mui.openWindow({
			url: 'login.html',
			id: 'login'
		})

		var id = setInterval(function() {
			clearInterval(id);
			plus.webview.currentWebview().hide();
			plus.webview.currentWebview().close();
		}, 200);
		return;
	}
	var btnArray = [{
		title: "注销当前账号"
	}, {
		title: "直接关闭应用"
	}];
	plus.nativeUI.actionSheet({
		cancel: "取消",
		buttons: btnArray
	}, function(event) {
		var index = event.index;
		switch (index) {
			case 1:
				//注销账号
				myStorage.clear();
				user = null;
				$("#generatelist").empty(); //清空数据
				$("#username").text('');
				$("#usercode").text('');
				var id = setInterval(function() {
					clearInterval(id);
					plus.webview.currentWebview().hide();
					plus.webview.currentWebview().close();
				}, 200);
				// plus.webview.getLaunchWebview().show("pop-in");
				//若启动页不是登录页，则需通过如下方式打开登录页
				mui.openWindow({
					url: 'login.html',
					id: 'login',
// 					show: {
// 						aniShow: 'pop-in'
// 					}
				});
				break;
			case 2:
				plus.runtime.quit();
				break;
		}
	});
}, false);

//处理返回按钮
function dealBackBtn() {
	var old_back = mui.back;
	mui.back = function() {}
	var first = null;
	plus.key.addEventListener('backbutton', function() {
		//首次按键，提示‘再按一次退出应用’
		if (!first) {
			first = new Date().getTime();
			mui.toast('再按一次退出应用');
			setTimeout(function() {
				first = null;
			}, 2000);
		} else {
			if (new Date().getTime() - first < 2000) {
				plus.runtime.quit();
			}
		}
	}, false);
}

if (window.plus) {
	plusReady();
} else {
	document.addEventListener('plusready', plusReady, false);
}
