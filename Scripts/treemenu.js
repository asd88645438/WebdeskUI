(function(win) {
	var treemenu = function(param) {
		if (param == null || typeof(param) != 'object') param = {};
		this.attrs = {
			target: '', //所在Html区域			
			width: 100,
			height: 200,
			id: ''
		};
		for (var t in param) this.attrs[t] = param[t];
		eval($ctrl.attr_generate(this.attrs));
		/* 自定义事件 */
		//shut,菜单条合起来;pull，菜单区域打开；add，增加菜单项; change，切换根菜单
		eval($ctrl.event_generate(['shut', 'pull', 'add', 'change', 'resize']));

		this.childs = new Array(); //子级		
		this.dom = null; //控件的html对象
		this.domtit = null; //控件标签栏部分的html对象
		this.dombody = null; //控件内容区
		this._generate();
		this.width = this._width;
		this.height = this._height;
		//
		$ctrls.add({
			id: this.id,
			obj: this,
			dom: this.dom,
			type: 'treemenu'
		});
	};
	var fn = treemenu.prototype;
	//当属性更改时触发相应动作
	fn._watch = {
		'width': function(obj, val, old) {
			if (obj.dom) {
				obj.dom.width(val);
				obj.trigger('resize', {
					width: val,
					height: obj._height
				});
			}
		},
		'height': function(obj, val, old) {
			if (obj.dom) {
				obj.dom.height(val);
				obj.trigger('resize', {
					width: obj._width,
					height: val
				});
			}
		}
	};
	//生成实始的构造
	fn._generate = function() {
		for (var t in this._builder) this._builder[t](this);
	};
	fn._builder = {
		shell: function(obj) {
			var area = $dom(obj.target);
			if (area.length < 1) {
				console.log('treemenu所在区域不存在');
				return;
			}
			area.addClass('treemenu').attr('ctrid', obj.id);
			obj.dom = area;
		},
		//左侧标题区
		title: function(obj) {
			var tagarea = obj.dom.append('treemenu_tagarea').find('treemenu_tagarea');
			obj.domtit = treemenu;			
		},
		//右侧内容区
		body: function(obj) {
			var body = obj.dom.append('tabs_body').find('tabs_body');
			obj.dombody = body;
		}
	};
	//添加菜单项
	fn.add=function(items){

	};
	/*treemenu的静态方法*/
	treemenu.create = function(param) {
		if (param == null) param = {};
		var tobj = new treemenu(param);
		return tobj;
	};
	win.$treemenu = treemenu;
})(window);