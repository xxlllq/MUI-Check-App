(function(u) {
	// 格式化时长字符串，格式为"HH:MM:SS"
	u.timeToStr = function(ts) {
		if (isNaN(ts)) {
			return "--:--:--";
		}
		var h = parseInt(ts / 3600);
		var m = parseInt((ts % 3600) / 60);
		var s = parseInt(ts % 60);
		return (ultZeroize(h) + ":" + ultZeroize(m) + ":" + ultZeroize(s));
	};
	// 格式化日期时间字符串，格式为"YYYY-MM-DD HH:MM:SS"
	u.dateToStr = function(d) {
		return (d.getFullYear() + "-" + ultZeroize(d.getMonth() + 1) + "-" + ultZeroize(d.getDate()) + " " + ultZeroize(d.getHours()) +
			":" + ultZeroize(d.getMinutes()) + ":" + ultZeroize(d.getSeconds()));
	};

	/**
	 * zeroize value with length(default is 2).
	 * @param {Object} v
	 * @param {Number} l
	 * @return {String} 
	 */
	u.ultZeroize = function(v, l) {
		var z = "";
		l = l || 2;
		v = String(v);
		for (var i = 0; i < l - v.length; i++) {
			z += "0";
		}
		return z + v;
	};
	u.back = function(hide) {
		if (u.plus) {
			ws || (ws = plus.webview.currentWebview());
			(hide || ws.preate) ? ws.hide('auto'): ws.close('auto');
		} else if (history.length > 1) {
			history.back();
		} else {
			u.close();
		}
	};
})(window);
