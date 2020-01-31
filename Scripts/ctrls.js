﻿/*!
 * 主 题：控件管理，
 * 说 明：
 * 1、主要目的是用于对控件的集中管理；
 */
(function() {
	/* 用于记录对象时所需的一些属性 */
	var control = function(param) {
		this.id = 0; //控件的id
		this.type = null; //控件的类型，例如pagebox
		this.dom = null; //控件的html文档对象
		this.obj = null; //控件的对象
		//将传入的参数赋给相应的属性
		if (typeof(param) == 'object') {
			for (var t in param)
				this[t] = param[t];
		}
		//从controls中删除自身
		this.remove = function() {
			this.dom.remove();
			window.$ctrls.remove(this.id);
		}
	};
	/*control的静态方法*/

	//实现对象属性的双向绑定
	control.def = function(t) {
		var str = 'Object.defineProperty(this, t, {\
                        get: function() {return this._' + t + ';},\
                        set: function(newValue) {\
                            var old = this._' + t + ';\
                            this._' + t + '= newValue;\
                            for (var wat in this._watch) {\
                                if (\'' + t + '\' == wat) {\
                                	if(this._watch)this._watch[wat](this,newValue,old);\
                                }\
                            }\
                            if(!this._watchlist)this._watchlist=new Array();\
                            for (var i=0;i<this._watchlist.length;i++) {\
                                if (\'' + t + '\' == this._watchlist[i].key) {\
                                    if(this._watchlist)this._watchlist[i].func(this,newValue,old);\
                                }\
                            }\
                        }\
                    });';
		return str;
	};
	//添加事件
	control.event_generate = function(entArr) {
		var str = '';
		//生成事件方法
		for (var i = 0; i < entArr.length; i++) {
			str += 'this.on' + entArr[i] + '=function(f){\
                return arguments.length > 0 ?  \
                $ctrl.event.bind.call(this,\'' + entArr[i] + '\', f) :  \
                $ctrl.event.trigger.call(this,\'' + entArr[i] + '\');};';
		}
		//触发事件的方法
		str += 'this.trigger = function(eventName, eventArgs) {\
				return $ctrl.event.trigger.call(this, eventName, eventArgs);\
				};';
		//移除事件的方法
		str += 'this.unbind=function(eventName,func){\
				return $ctrl.event.remove.call(this, eventName, func);\
				};';
		return str;
	};
	//控件的自定义事件管理，分别是绑定、触发、移除、事件列表
	control.event = {
		//绑定事件
		//eventName：事件名称
		//func:事件方法
		bind: function(eventName, func) {
			if (typeof(func) == "function") {
				if (!this._eventlist) this._eventlist = new Array();
				this._eventlist.push({
					'name': eventName,
					'event': func
				});
			}
			return this;
		},
		//触发事件
		trigger: function(eventName, eventArgs) {
			var arrEvent = control.event.list.call(this, eventName);
			if (arrEvent.length < 1) return true;
			//事件参数处理，增加事件名称与形为
			if (!eventArgs) eventArgs = {};
			if (!eventArgs['event']) eventArgs['event'] = eventName;
			if (!eventArgs['action']) eventArgs['action'] = eventName;
			if (!eventArgs['target']) eventArgs['target'] = this.dom[0];
			//执行事件，当事件中有任一事件返回false，则不再继续执行后续事件
			var results = [];
			for (var i = 0; i < arrEvent.length; i++) {
				var res = arrEvent[i](this, eventArgs);
				//不管返回结果是什么类型的值，都转为bool型
				res = (typeof(res) == 'undefined' ? true : (typeof(res) == 'boolean' ? res : true));
				results.push(res);
				if (!res) break;
			}
			for (var i = 0; i < results.length; i++)
				if (!results[i]) return false;
			return true;
		},
		//移除事件
		remove: function(eventName, func) {
			if (!this._eventlist) return this;
			//如果没有指定事件方法，则全部删除
			for (var i = 0; i < this._eventlist.length; i++) {
				if (this._eventlist[i].name != eventName) continue;
				//如果没有指定事件方法，直接删除
				if (func == null) this._eventlist.splice(i, 1);
				if (func != null && this._eventlist[i].event.toString() == func.toString()) {
					this._eventlist.splice(i, 1);
				}
			}
		},
		//获取某一类事件的集体，用于事件多播
		list: function(eventName) {
			var arrEvent = new Array();
			if (!this._eventlist) return arrEvent;
			for (var i = 0; i < this._eventlist.length; i++) {
				if (this._eventlist[i].name == eventName)
					arrEvent.push(this._eventlist[i].event);
			}
			return arrEvent;
		}
	};

	/*  储存对象方法的键值对   */
	var controls = function() {
		this.muster = {}; //控件的集合
		this.add = function(param) {
			if (typeof(param) == 'object') {
				if (!(!!param['id'])) param.id = "random_" + new Date().getTime() + parseInt(Math.random() * 100);
				this.muster[param['id']] = new control(param);
			} else {
				this.muster[param] = arguments.length > 1 ? arguments[1] : null;
			}
			return this;
		};
		this.update = function(param) {
			if (!!this.muster[param['id']]) {
				var old = this.muster[param['id']];
				for (var key in param) {
					if (!!param[key])
						old[key] = param[key];
				}
			} else {
				return this.add(param);
			}
		};
		this.remove = function(key) {
			if (!!this.muster[key]) delete(this.muster[key]);
			return this;
		};
		this.clear = function() {
			for (var key in this.muster) delete(this.muster[key]);
			return this;
		};
		this.all = function() {
			return this.muster;
		};
		//返回control对象
		this.get = function(key) {
			if (!!this.muster[key]) return this.muster[key];
			return null;
		};
		this.index = function(index) {
			var i = 1;
			for (var key in this.muster) {
				if (i++ == index) return this.muster[key];
			}
			return null;
		};
		//返回控件对象，例如pagebox对象
		this.obj = function(key) {
			var val = null;
			if (!!this.muster[key]) val = this.muster[key];
			if (val instanceof control) return val.obj;
			return null;
		};
		this.size = function() {
			var i = 0;
			for (var key in this.muster) i++;
			return i;
		};
		//批量清除控件对象的某个属性
		this.removeAttr = function(attr) {
			for (var key in this.muster) {
				var ctr = this.muster[key];
				if (!!ctr[attr]) delete(ctr[attr]);
			}
		};
		//批量设置控件的事件
		this.each = function(f) {
			if (typeof(f) != "function") return;
			for (var key in this.muster) {
				var ctr = this.muster[key];
				f.call(ctr.obj);
			}
		}
	};
	window.$ctrl = control;
	window.$ctrls = new controls();
})();
/*
var t = window.$ctrls.add('ttt', new $contrl({ id: 5899, type: 'pagebox' }));
console.log(t.size());
$ctrls.remove('ttt');
console.log(t.size());
*/