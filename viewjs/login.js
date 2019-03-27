mui.init({
	statusBarBackground: '#f7f7f7'
});

// H5 plus事件处理
function plusReady() {
	preventFooterPromote(); //防止底部文字打开软键盘的时候被推动
	//  检测是否有网络，待写

	// 处理返回键
	plus.key.addEventListener('backbutton', function() {
		plus.runtime.quit();
	}, false);

	plus.screen.lockOrientation("portrait-primary");
	
	var loginButton = document.getElementById('loginBtn'); //登录按钮
	var accountBox = document.getElementById('account'); //账号
	var passwordBox = document.getElementById('password'); //密码
	var autoLoginButton = document.getElementById("autoLogin"); //自动登录
	var regButton = document.getElementById('reg'); //注册
	var forgetButton = document.getElementById('forgetPassword'); //忘记密码
	//登录按钮点击
	loginButton.addEventListener('tap', function(event) {

		var loginInfo = {
			account: accountBox.value,
			password: passwordBox.value
		};
		// 登录数据合法性验证
		if (!loginInfo.account || loginInfo.account.length < 0) {
			plus.nativeUI.toast('账号不能为空');
			// loginButton.removeAttribute("disabled");
			return;
		}
		if (!loginInfo.password || loginInfo.password.length < 0) {
			plus.nativeUI.toast('密码不能为空');
			// loginButton.removeAttribute("disabled");
			return;
		}
		//防止重复点击按钮
		loginButton.setAttribute("disabled", true);
		document.activeElement.blur(); //关闭软键盘
		
		//远程登录验证
		var wt = plus.nativeUI.showWaiting();
		mui.ajax(serverUrl() + "/Account/Login", {
			data: {
				userName: loginInfo.account,
				password: loginInfo.password,
				// cidortoken: getCidOrToken(),
			},
			dataType: 'json', //服务器返回json格式数据
			type: 'GET', //HTTP请求类型
			success: function(data) {
				if (data) {
					if (data.type == 1) { 
						myStorage.setItem('currentUser', data.value); //设置本地缓存

						mui.openWindow({
							"id": 'main',
							"url": 'main.html'
						}); //跳转到主页
					} else {
						plus.nativeUI.toast(data.message);
					}
				}
				loginButton.removeAttribute("disabled");
				wt.close();
			},
			error: function(xhr, type, errorThrown) { //异常处理；
				loginButton.removeAttribute("disabled");
				plus.nativeUI.toast('请检查网络是否流畅');
				wt.close();
			}
		})
	});
}


// 获取系统
function getCidOrToken() {
	var cidortoken = "";
	if (plus.os.name == "Android") {
		cidortoken = plus.push.getClientInfo().clientid;
	} else {
		cidortoken = plus.push.getClientInfo().token;
	}
	return cidortoken;
}

//防止底部文字打开软键盘的时候被推动
function preventFooterPromote() {
	//获取原始窗口的高度
	var originalHeight = document.documentElement.clientHeight || document.body.clientHeight;
	window.onresize = function() {
		//软键盘弹起与隐藏  都会引起窗口的高度发生变化
		var resizeHeight = document.documentElement.clientHeight || document.body.clientHeight;
		if (resizeHeight * 1 < originalHeight * 1) { //resizeHeight<originalHeight证明窗口被挤压了
			plus.webview.currentWebview().setStyle({
				height: originalHeight
			});
		}
	}
}

if (window.plus) {
	plusReady();
} else {
	document.addEventListener('plusready', plusReady, false);
}
