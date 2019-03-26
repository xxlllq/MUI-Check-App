//获取后端接口URL
function serverUrl() {
	// return "http://116.62.173.115:8081/api";
	// return "https://xxlllq.xyz/api";
	return serverUrlWidthoutApi() + "/api";
}

function serverUrlWidthoutApi() {
	// return "https://xxlllq.xyz/";
	return "http://192.168.0.132:1982";
}
//获取后端接口URL
function serverOperateUrl(url) {
	var user = validateUser();
	if (user) {
		return serverUrl() + url + "?token=" + user.Token;
	}
}
//分页--每页数量
function getPageRow() {
	return 6;
}

//验证用户信息
function validateUser() {
	var user = myStorage.getItem('currentUser');
	// 无用户信息跳转到login界面
	if (!user) {
		plus.nativeUI.toast('请重新登录已保持登录状态');
		return null;
	}
	return user;
}

function sendRequestToServer(url, method, data, _callback) {
	var user = validateUser();
	if (user) {
		mui.ajax(serverUrl() + url + "?token=" + user.Token, {
			data: data,
			dataType: 'json', //服务器返回json格式数据
			type: method ? method : 'POST', //HTTP请求类型
			success: function(data) {
				if (data) {
					if (data.type == 1)
						_callback(data);
					else
						plus.nativeUI.toast(data.message);
				}
			},
			error: function(xhr, type, errorThrown) {
				plus.nativeUI.toast('获取数据失败');
				_callback(null);
			}
		});
	}
}
