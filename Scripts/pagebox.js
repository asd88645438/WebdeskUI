﻿/*!
 * 主 题：《Pagebox.js 页面窗体》
 * 说 明：
 * 1、可拖放，可缩放，模拟windows桌面窗体
 * 2、可上溯父级，遍历下级，父子窗体可互动
 * 3、自定义事件，多播，可追加、可去除
 * 4、属性支持双向绑定，可监听
 *
 * 作 者：微厦科技_宋雷鸣_10522779@qq.com
 * 开发时间: 2020年1月1日
 * 最后修订：2020年2月4日
 * github开源地址:https://github.com/weishakeji/WebdeskUI
 */
(function(win) {
    //窗体最小化时所处位置区域
    window.$pageboxcollect = '#pageboxcollect';
    //param: 初始化时的参数
    var box = function(param) {
        if (param == null || typeof(param) != 'object') param = {};
        //默认参数，
        this.attrs = {
            width: 100,
            height: 200,
            top: null,
            left: null,
            bottom: null,
            right: null,
            level: null,
            title: '默认标题',
            ico: '&#xe77c', //图标
            url: '',
            id: 0,
            pid: '', //父级窗体名称
            resize: true, //是否允许缩放大小
            move: true, //是否允许移动
            min: true, //是否允许最小化按钮
            max: true, //是否允许最大化按钮            
            close: true, //是否允许关闭按钮
            fresh: true, //是否允许刷新
            full: false, //打开后是否全屏，默认是false
            mini: false, //是否处于最小化状态
            dropmenu: false //下拉菜单是否显示
        };
        for (var t in param) this.attrs[t] = param[t];
        eval($ctrl.attr_generate(this.attrs));        
        /* 自定义事件 */
        //shown打开，shut关闭，load加载，fail加载失败，
        //click点击，drag拖动,focus得到焦点，blur失去焦点
        //min最小化，full全屏，restore还原，resize缩放
        var customEvents = ['shown', 'shut', 'load', 'fail',
            'click', 'drag', 'focus', 'blur',
            'mini', 'full', 'restore', 'resize'
        ];
        eval($ctrl.event_generate(customEvents));  
        //以下不支持双向绑定
        this.parent = null; //父窗体对象
        this.childs = new Array(); //子级窗体
        this.dom = null; //html对象  
        this._watchlist = new Array(); //自定义监听  
        this._isinit = false; //是否初始化      
    };
    var fn = box.prototype;
    //初始化相关参数
    fn._initialization = function() {
        this.id = 'pagebox_' + new Date().getTime();
        //是否有父级窗体
        var parent = $ctrls.get(this.pid);
        if (parent != null) {
            this.parent = parent.obj;
            parent.obj.childs.push(this);
        }
        //如果位置没有设置
        if (!this.top && this.bottom) this.top = document.documentElement.clientHeight - this.height - this.bottom;
        if (!this.top && !this.bottom) {
            if (this.parent == null)
                this.top = (document.documentElement.clientHeight - document.body.scrollTop - this.height) / 2;
            else
                this.top = this.parent.dom.offset().top + 30;
        }
        if (!this.left && this.right) this.left = document.documentElement.clientWidth - this.width - this.right;
        if (!this.left && !this.right) {
            if (this.parent == null)
                this.left = (document.documentElement.clientWidth - document.body.scrollLeft - this.width) / 2;
            else
                this.left = this.parent.dom.offset().left + 30;
        }
        //
        $ctrls.add({
            id: this.id,
            obj: this,
            type: 'pagebox'
        });
        this._isinit = true;
        return this;
    };
    //当属性更改时触发相应动作
    fn._watch = {
        //参数：
        //box:pagebox对象，val：传入的值，old:原值
        'title': function(box, val, old) {
            if (box.dom) {
                box.dom.find('pagebox_title pb-text').html(val);
                box.domin.find('pb-text').html(val);
            }
        },
        'url': function(box, val, old) {
            if (box.dom) box.dom.find('iframe').attr('src', val);
        },
        'width': function(box, val, old) {
            if (box.dom) box.dom.width(val);
        },
        'height': function(box, val, old) {
            if (box.dom) box.dom.height(val);
        },
        'left': function(box, val, old) {
            if (box.dom) box.dom.left(val);
        },
        'top': function(box, val, old) {
            if (box.dom) box.dom.top(val);
        },
        'right': function(box, val, old) {
            box.left = document.documentElement.clientWidth - box._width - val;
        },
        'bottom': function(box, val, old) {
            box.top = document.documentElement.clientHeight - box._height - val;
        },
        'level': function(box, val, old) {
            if (box.dom) box.dom.level(val);
        },
        'full': function(box, val, old) {
            if (val == old) return;
            if (val) box.toFull();
            if (!val) box.toWindow();
        },
        'mini': function(box, val, old) {
            if (val == old) return;
            if (val) box.toMinimize();
            if (!val) box.toWindow();
        },
        'min': function(box, val, old) {
            box._builder.buttonbox(box);
            var menubtn = box.dom.find('dropmenu menu_min');
            menubtn.attr('class', val ? 'enable' : 'disable');
        },
        'max': function(box, val, old) {
            box._builder.buttonbox(box);
            var menubtn = box.dom.find('dropmenu menu_max');
            menubtn.attr('class', val ? 'enable' : 'disable');
        },
        'close': function(box, val, old) {
            box._builder.buttonbox(box);
            //左上角菜单的关闭按钮
            var menubtn = box.dom.find('dropmenu menu_close');
            menubtn.attr('class', val ? 'enable' : 'disable');
            //最小化区域中的关闭按钮         
            var minbtn = $dom('pagebox-min[boxid=\'' + box.id + '\'] btn_close');
            minbtn.attr('class', val ? 'enable' : 'disable');
        },
        'resize': function(box, val, old) {
            box.dom.find('margin *').each(function() {
                $dom(this).css({
                    'cursor': val ? this.tagName + '-resize' : 'default'
                });
            });
        },
        'fresh': function(box, val, old) {
            var menubtn = box.dom.find('dropmenu menu_fresh');
            menubtn.attr('class', val ? 'enable' : 'disable');
        },
        //下拉菜单是否显示
        'dropmenu': function(obj, val, old) {
            if (obj.dom) {
                if (val) obj.domdrop.show();
                if (!val) obj.domdrop.hide();
            }
        }
    };
    //打开pagebox窗体，并触发shown事件 
    fn.open = function() {
        if (!this._isinit) this._initialization();
        //如果窗体已经存在
        var ctrl = $ctrls.get(this.id);
        if (ctrl != null && ctrl.dom != null) return ctrl.obj.focus();
        //创建窗体
        for (var t in this._builder) this._builder[t](this);
        //添加事件（基础事件，例如移动、拖放等，并不包括自定义事件）
        var boxele = document.querySelector('.pagebox[boxid=\'' + this.id + '\']');
        for (var t in this._baseEvents) this._baseEvents[t](boxele);
        //构建最小化的区域
        var area = $dom('pagebox-minarea');
        if (area.length < 1) {
            area = $dom('body').append('pagebox-minarea').find('pagebox-minarea');
            area.css('opacity', 0).hide();
        }

        for (var t in this._builder_min) this._builder_min[t](this, area);
        //更新dom
        //this.dom = $dom(boxele);
        $ctrls.update({
            id: this.id,
            dom: $dom(boxele)
        });
        //设置层深
        var maxlevel = $dom('.pagebox').level();
        this.level = maxlevel < 1 ? 10000 : maxlevel + 1;
        //设置一些初始值
        this.min = this._min;
        this.max = this._max;
        this.close = this._close;
        this.resize = this._resize;
        this.left = this._left;
        this.top = this._top;
        this.width = this._width - 2;
        this.height = this._height - 2;
        this.trigger('shown');
        return this.focus();
    };
    //构建pagebox窗体
    fn._builder = {
        //生成外壳
        shell: function(obj) {
            var div = $dom(document.body).append('div').childs().last();
            div.attr({
                'boxid': obj.id,
                'class': 'pagebox',
                'pid': obj.pid
            });
            obj.dom = div;
        },
        //边缘部分，主要是用于控制缩放
        margin: function(obj) {
            var margin = obj.dom.append('margin').find('margin');
            var arr = ['nw', 'w', 'sw', 'n', 's', 'ne', 'e', 'se'];
            for (var i = 0; i < arr.length; i++)
                margin.append(arr[i]);
        },
        //标题栏，包括图标、标题文字、关闭按钮，有拖放功能
        title: function(obj) {
            //图标和标题文字
            var title = obj.dom.append('pagebox_title').find('pagebox_title');
            title.append('pb-ico').find('pb-ico').html(obj.ico);
            if (obj.url != '') {
                title.find('pb-ico').hide();
                title.append('pb-ico').find('pb-ico').last().addClass('pb-loading').html('&#xe621');
            }
            title.append('pb-text').find('pb-text').html(obj.title);
            //移动窗体的响应条
            obj.dom.append('pagebox_dragbar');
        },
        //右上角的最小化，最大化，关闭按钮
        buttonbox: function(obj) {
            var btnbox = obj.dom.find('btnbox');
            if (btnbox.length < 1) btnbox = obj.dom.append('btnbox').find('btnbox');
            btnbox.childs().remove();
            if (obj._min || obj._max) {
                btnbox.append('btn_min').append('btn_max');
                if (!obj._min) btnbox.find('btn_min').addClass('btndisable');
                if (!obj._max) btnbox.find('btn_max').addClass('btndisable');
                obj._baseEvents.min_max(obj.dom[0]);
            }
            if (obj._close) {
                btnbox.append('btn_close');
                obj._baseEvents.close(obj.dom[0]);
            }
        },
        //主体内容区
        body: function(obj) {
            var iframe = $dom(document.createElement('iframe'));
            iframe.attr({
                'name': obj.id,
                'id': obj.id,
                'frameborder': 0,
                'border': 0,
                'marginwidth': 0,
                'marginheight': 0,
                'src': obj.url
            });
            obj.dom.append(iframe);
        },
        //左上角图标的下拉菜单
        dropmenu: function(obj) {
            var menu = obj.dom.append('dropmenu').find('dropmenu');
            menu.append('menu_fresh').find('menu_fresh').html('刷新');
            menu.append('hr');
            menu.append('menu_min').find('menu_min').html('最小化');
            menu.append('menu_max').find('menu_max').html('最大化');
            menu.append('menu_win').find('menu_win').html('还原');
            menu.append('hr');
            menu.append('menu_close').find('menu_close').html('关闭');
            obj.domdrop = menu;
        },
        //遮罩
        mask: function(obj) {
            obj.dom.append('pagebox_mask');
        }
    };
    //添加pagebox自身事件，例如拖放、缩放、关闭等
    fn._baseEvents = {
        click: function(elem) {
            //窗体点击事件，主要是为了设置焦点
            $dom(elem).click(function(e) {
                var obj = box._getObj(e);
                obj.focus().trigger('click');
                obj.dropmenu = false;
            });
        },
        load: function(elem) {
            var src = $dom(elem).find('iframe').attr('src');
            if (src == '') return;
            $dom(elem).find('iframe').bind('load', function(e) {
                var obj = box._getObj(e);
                var eventArgs = {
                    url: obj.url,
                    target: obj.document()
                };
                if (obj.events('fail').length > 0) {
                    try {
                        var ifDoc = obj.dom.find('iframe')[0].contentWindow.document;
                        var ifTitle = ifDoc.title;
                        if (ifTitle.indexOf("404") >= 0 || ifTitle.indexOf("错误") >= 0) {
                            //加载失败的事件
                            obj.trigger('fail', eventArgs);
                        }
                    } catch (e) {
                        var msg = '当iframe的src与当前页面不同源时，无法触发onfail事件';
                        console.log('pagebox onfail event error : ' + msg + '，' + e.message);
                    }
                }
                //加载完成的事件，不管是否失败
                obj.trigger('load', eventArgs);
                //操作图标
                obj.dom.find('pb-ico').last().hide();
                obj.dom.find('pb-ico').first().show();
            });
        },
        //拖动事件的起始，当鼠标点下时
        drag: function(elem) {
            var boxdom = $dom(elem);
            var dragbar = boxdom.find('pagebox_dragbar');
            dragbar = dragbar.merge(boxdom.find('margin>*'));
            dragbar.mousedown(function(e) {
                //鼠标点中的对象
                var node = event.target ? event.target : event.srcElement;
                var tagname = node.tagName.toLowerCase(); //点中的节点名称                   
                //获取窗体对象
                while (!node.getAttribute('boxid')) node = node.parentNode;
                var ctrl = $ctrls.get(node.getAttribute('boxid'));
                //记录当鼠标点下时的数据
                ctrl.mousedown = {
                    target: tagname, //鼠标点下时的Html元素
                    mouse: $dom.mouse(e), //鼠标坐标：x，y值
                    offset: ctrl.dom.offset(), //窗体位置：left,top
                    width: ctrl.dom.width(), //窗体宽高
                    height: ctrl.dom.height()
                }
                ctrl.dom.addClass('pagebox_drag');
                //设置当前窗体为焦点窗
                box.focus(ctrl.id);
            });
        },
        //关闭，最大化，最小化
        button: function(elem) {
            var boxdom = $dom(elem);
            //双击左侧图标关闭
            boxdom.find('pagebox_title pb-ico').dblclick(function(e) {
                var obj = box._getObj(e);
                if (obj.close) obj.shut();
            });
            //双击标题栏，最大化或还原
            boxdom.find('pagebox_dragbar').dblclick(function(e) {
                var obj = box._getObj(e);
                if (obj.max) obj.full = !obj.full;
            });
        },
        min_max: function(elem) {
            //最大化或还原
            $dom(elem).find('btnbox btn_max').click(function(e) {
                var obj = box._getObj(e);
                obj.full = !obj.full;
            });
            $dom(elem).find('btnbox btn_min').click(function(e) {
                var obj = box._getObj(e);
                if (obj.min) obj.mini = true;
            });
        },
        close: function(elem) {
            //关闭窗体，点击右上角关闭按钮
            $dom(elem).find('btnbox btn_close').click(function(e) {
                box._getObj(e).shut();
            });
        },
        //左上角下拉菜单
        dropmenu: function(elem) {
            var boxdom = $dom(elem);
            //点击左上角图标，显示下拉菜单
            boxdom.find('pagebox_title pb-ico').click(function(e) {
                var obj = box._getObj(e);
                obj.dropmenu = true;
                obj.domdrop.top(29).left(6);
            });
            //标题栏右键，显示下拉菜单
            boxdom.find('pagebox_dragbar').bind('contextmenu', function(e) {
                var obj = box._getObj(e);
                obj.dropmenu = true;
                var mouse = $dom.mouse(e);
                var offset = obj.dom.offset();
                obj.domdrop.top(mouse.y - offset.top - 5).left(mouse.x - offset.left - 5);
            });
            boxdom.find('dropmenu').bind('mouseover', function(e) {
                box._getObj(e).dropmenu = true;
            });
            boxdom.find('dropmenu').bind('mouseleave', function(e) {
                var obj = box._getObj(e);
                obj._dropmenu = false;
                window.setTimeout(function() {
                    if (!obj._dropmenu) obj.dropmenu = false;
                }, 500);
            });
            //下拉菜单中各项事件
            boxdom.find('dropmenu>*').click(function(e) {
                //识别按钮，获取事件动作             
                var node = event.target ? event.target : event.srcElement;
                if (node.tagName.indexOf('_') < 0) return;
                var action = node.tagName.substring(node.tagName.indexOf('_') + 1).toLowerCase();
                //当前pagebox.js对象
                var obj = box._getObj(e);
                obj.dropmenu = false;
                //最大化
                if (action == 'max' && !obj.full) obj.full = true;
                //最小化
                if (action == 'min' && obj.min) obj.mini = true;
                //还原，从最大化还原
                if (action == 'win') obj.full = false;
                //刷新
                if (action == 'fresh') obj.url = obj._url;
                //关闭
                if (action == 'close' && obj.close) obj.shut();
            });
        }
    };
    //构建最小化的状态，每一个窗体都会有，不管是否最小化
    fn._builder_min = {
        //target:pagebox对象
        //area:最小化的管理区域
        shell: function(target, area) {
            var min = area.append('pagebox-min').childs().last();
            min.attr({
                'boxid': target.id
            });
            box.pageboxcollect_boxsize();
            target.domin = min;
        },
        title: function(target, area) {
            var min = area.find('pagebox-min[boxid=\'' + target.id + '\']');
            //图标和标题文字           
            min.append('pb-ico').find('pb-ico').html(target.ico);
            min.append('pb-text').find('pb-text').html(target.title);
            min.find('pb-ico,pb-text').click(function(e) {
                var obj = box._getObj(e);
                //如果窗体不处于焦点，则设置为焦点；如果已经是焦点，则最小化
                if (!obj.mini) {
                    if (!obj.dom.hasClass('pagebox_focus')) obj.focus();
                    else
                        obj.mini = true;
                } else {
                    obj.mini = false;
                    box.focus(obj.id);
                }
            });
            //关闭窗体
            min.append('btn_close');
            min.find('btn_close').click(function(e) {
                box._getObj(e).shut();
            });
        }
    }
    //窗体中的iframe文档对象
    fn.document = function() {
        if (this.dom) {
            var iframe = this.dom.find('iframe');
            return iframe[0].contentWindow;
        }
        return null;
    };
    //获取所有子级窗体
    fn.getChilds = function() {
        var arr = gchild(this);
        //按层深level排序
        for (var j = 0; j < arr.length - 1; j++) {
            for (var i = 0; i < arr.length - 1; i++) {
                if (arr[i].level > arr[i + 1].level) {
                    var temp = arr[i];
                    arr[i] = arr[i + 1];
                    arr[i + 1] = temp;
                }
            }
        }

        function gchild(box) {
            var arr = new Array();
            for (var i = 0; i < box.childs.length; i++) {
                var c = box.childs[i];
                arr.push(c);
                if (c.childs.length > 0) {
                    var tm = gchild(c);
                    for (var j = 0; j < tm.length; j++) arr.push(tm[j]);
                }
            }
            return arr;
        }
        return arr;
    };
    //设置当前窗体为焦点
    fn.focus = function() {
        return box.focus(this.id);
    };
    fn.shut = function() {
        box.shut(this.id);
        return this;
    };
    fn.toFull = function() {
        return box.toFull(this.id);
    };
    fn.toWindow = function() {
        return box.toWindow(this.id);
    };
    fn.toMinimize = function() {
        return box.toMinimize(this.id);
    };
    /*** 
    以下是静态方法
    *****/
    //创建一个窗体对象
    box.create = function(param) {
        if (param == null) param = {};
        if (typeof(param.pid) == 'undefined') param.pid = window.name;
        var pbox = new box(param);
        pbox._initialization();
        return pbox;
    };
    //创建窗体对象并打开
    box.open = function(param) {
        var pbox = box.create(param);
        return pbox.open();
    };
    //获取上级窗体对象
    box.parent = function(boxid) {
        var ctrl = $ctrls.get(boxid);
        return ctrl.obj.parent;
    };
    //用于事件中，取点击的pagebox的对象
    box._getObj = function(e) {
        var node = event.target ? event.target : event.srcElement;
        while (!node.getAttribute('boxid')) node = node.parentNode;
        var ctrl = $ctrls.get(node.getAttribute('boxid'));
        return ctrl.obj;
    };
    //设置某个窗体为焦点
    box.focus = function(boxid) {
        var ctrl = $ctrls.get(boxid);
        if (ctrl == null) return;
        if (!ctrl.dom.hasClass('pagebox_focus')) {
            //之前的焦点窗体，触发失去焦点事件
            var focusbox = $dom('.pagebox_focus');
            if (focusbox.length > 0 && focusbox.attr('boxid') != boxid) {
                var ctr = $ctrls.get(focusbox.attr('boxid'));
                ctr.obj.trigger('blur');
            }
            var boxs = $dom('.pagebox');
            boxs.removeClass('pagebox_focus');
            ctrl.dom.addClass('pagebox_focus');
            var level = boxs.level();
            ctrl.obj.level = level < 1 ? 10000 : level + 1;
            //如果是最大化，则子窗体要浮于上面
            if (ctrl.obj.full) {
                var childs = ctrl.obj.getChilds();
                for (var i = 0; i < childs.length; i++) {
                    childs[i].level = childs[i].level - 10000 + ctrl.obj.level;
                }
            }
            //激活当前窗体的焦点事件
            ctrl.obj.trigger('focus');
        }
        return ctrl.obj;
    };
    //关闭窗体
    box.shut = function(boxid) {
        var ctrl = $ctrls.get(boxid);
        if (!ctrl) return;
        //触发关闭事件,如果返回false,则不再关闭
        var t = ctrl.obj.trigger('shut');
        if (!t) return;
        //执行关闭窗体的一系列代码
        ctrl.dom.css('transition', 'opacity 0.3s');
        ctrl.dom.css('opacity', 0);
        ctrl.obj.domin.css('opacity', 0);
        setTimeout(function() {
            ctrl.remove();
            ctrl.obj.domin.remove();
            //如果存在父级窗体
            if (ctrl.obj.parent && $dom('.pagebox[boxid=\'' + ctrl.obj.parent.id + '\']').length > 0) {
                //父级的子级，即兄弟
                var siblings = ctrl.obj.parent.childs;
                for (var i = 0; i < siblings.length; i++) {
                    if (siblings[i].id == ctrl.obj.id) {
                        ctrl.obj.parent.childs.splice(i, 1);
                    }
                }
                ctrl.obj.parent.focus();
            } else {
                var last = $dom('.pagebox').last();
                if (last != null) box.focus(last.attr('boxid'));
            }
            //子级
            var childs = ctrl.obj.getChilds();
            for (var i = 0; i < childs.length; i++) {
                box.shut(childs[i].id);
            }
            box.pageboxcollect_boxsize();
        }, 300);
    };
    //最大化
    box.toFull = function(boxid) {
        var ctrl = $ctrls.get(boxid);
        if (!ctrl.obj.max) return;
        if (!ctrl.obj.trigger('full')) return;
        //记录放大前的数据，用于还原
        ctrl.win_offset = ctrl.dom.offset();
        ctrl.win_size = {
            width: ctrl.obj.width,
            height: ctrl.obj.height
        };
        ctrl.win_state = {
            move: ctrl.obj.move,
            resize: ctrl.obj.resize
        };
        ctrl.obj.move = ctrl.obj.resize = false;
        //开始全屏放大        
        ctrl.dom.css('transition', 'width 0.3s,height 0.3s,left 0.3s,top 0.3s').addClass('pagebox_full');
        ctrl.obj.width = window.innerWidth - 3;
        ctrl.obj.height = window.innerHeight - 2;
        ctrl.obj.left = 1;
        ctrl.obj.top = 0;
        ctrl.obj.resize = false;
        ctrl.obj._full = true;
        //如果是最大化，则子窗体要浮于上面      
        var childs = ctrl.obj.getChilds();
        for (var i = 0; i < childs.length; i++) {
            childs[i].level = childs[i].level - 10000 + ctrl.obj.level;
        }
    };
    //最小化
    box.toMinimize = function(boxid) {
        var ctrl = $ctrls.get(boxid);
        if (!ctrl.obj.min) return;
        if (!ctrl.obj.trigger('mini')) return;
        //记录之前的数据，用于还原
        if (!ctrl.obj.full) {
            ctrl.win_offset = ctrl.dom.offset();
            ctrl.win_size = {
                width: ctrl.obj.width,
                height: ctrl.obj.height
            };
            ctrl.win_state = {
                move: ctrl.obj.move,
                resize: ctrl.obj.resize
            };
        }
        if (ctrl.obj.full) {
            ctrl.obj._full = false;
            ctrl.dom.removeClass('pagebox_full');
        }
        var obj = ctrl.obj;
        obj.dom.css('transition', 'width 0.3s,height 0.3s,left 0.3s,top 0.3s,opacity 0.3s').addClass('pagebox_min');;
        //最小化后的所在区域
        var collect = $dom('.pagebox-collect');
        var offset = collect.offset();
        obj.left = offset.left + collect.width() / 3;
        obj.top = offset.top + collect.height() / 3;
        obj.width = 10;
        obj.height = 10;
        window.setTimeout(function() {
            obj.dom.css('opacity', 0);
            collect.addClass('pagebox-collect-action');
            window.setTimeout(function() {
                collect.removeClass('pagebox-collect-action');
            }, 150);
        }, 300);
    };
    //恢复窗体状态
    box.toWindow = function(boxid) {
        var ctrl = $ctrls.get(boxid);
        if (ctrl == null) return;
        if (!(ctrl.dom.hasClass('pagebox_full') || ctrl.dom.hasClass('pagebox_min'))) return;
        //从最大化还原
        if (ctrl.dom.hasClass('pagebox_full')) {
            ctrl.dom.removeClass('pagebox_full');
            ctrl.obj.trigger('restore', {
                'action': 'from-full'
            });
            ctrl.obj.level = $dom('.pagebox').level() + 1;
            ctrl.obj.resize = true;
            ctrl.obj._full = false;
        } else {
            //从最小化还原
            ctrl.dom.removeClass('pagebox_min');
            ctrl.obj.trigger('restore', {
                'action': 'from-min'
            });
        }
        ctrl.dom.css('opacity', 1);
        ctrl.obj.left = ctrl.win_offset.left;
        ctrl.obj.top = ctrl.win_offset.top;
        ctrl.obj.width = ctrl.win_size.width;
        ctrl.obj.height = ctrl.win_size.height;
        ctrl.obj.move = ctrl.win_state.move;
        ctrl.obj.resize = ctrl.win_state.resize;
        window.setTimeout(function() {
            ctrl.dom.css('transition', '');
        }, 300);
    };
    //拖动窗体所需的事件
    box.dragRealize = function() {
        //var addevent = document.attachEvent || document.addEventListener;
        document.addEventListener('mousemove', function(e) {
            var node = event.target ? event.target : event.srcElement;
            var boxdom = $dom('div.pagebox_drag');
            if (boxdom.length < 1) return;
            var ctrl = $ctrls.get(boxdom.attr('boxid'));
            var box = ctrl.obj;
            //当鼠标点下时的历史信息，例如位置、宽高    
            var ago = ctrl.mousedown;
            //获取移动距离
            var mouse = $dom.mouse(e);
            mouse.x = mouse.x < 0 ? 0 : (mouse.x > window.innerWidth ? window.innerWidth : mouse.x);
            mouse.y = mouse.y < 0 ? 0 : (mouse.y > window.innerHeight ? window.innerHeight : mouse.y);
            //事件参数
            var eargs = {
                'mouse': mouse,
                'move': {
                    x: mouse.x - ago.mouse.x,
                    y: mouse.y - ago.mouse.y
                },
                target: node
            };
            //移动窗体   
            if (ago.target == 'pagebox_dragbar') {
                if (box.move) {
                    box.left = ago.offset.left + eargs.move.x;
                    box.top = ago.offset.top + eargs.move.y;
                    //触发拖动事件
                    eargs.offset = ctrl.dom.offset();
                    box.trigger('drag', eargs);
                }
            } else {
                //缩放窗体
                if (box.resize) {
                    var minWidth = 200,
                        minHeight = 150;
                    if (ctrl.dom.attr('resize') != 'false') {
                        if (ago.target.indexOf('e') > -1) box.width = ago.width + eargs.move.x < minWidth ? minWidth : ago.width + eargs.move.x;
                        if (ago.target.indexOf('s') > -1) box.height = ago.height + eargs.move.y < minHeight ? minHeight : ago.height + eargs.move.y;
                        if (ago.target.indexOf('w') > -1) {
                            box.width = ago.width - eargs.move.x < minWidth ? minWidth : ago.width - eargs.move.x;
                            if (box.width > minWidth) box.left = ago.offset.left + eargs.move.x;
                        }
                        if (ago.target.indexOf('n') > -1) {
                            box.height = ago.height - eargs.move.y < minHeight ? minHeight : ago.height - eargs.move.y;
                            if (box.height > minHeight) box.top = ago.offset.top + eargs.move.y;
                        }
                        //触发resize事件                     
                        eargs.offset = ctrl.dom.offset();
                        eargs.width = box.width;
                        eargs.height = box.height;
                        eargs.action = eargs.target.tagName;
                        ctrl.obj.trigger('resize', eargs);
                    }
                }
            }
            //
        });
        document.addEventListener('mouseup', function(e) {
            var mouse = $dom.mouse(e);
            $ctrls.removeAttr('mousedown');
            var page = $dom('.pagebox_focus');
            page.removeClass('pagebox_drag');
        });
        window.addEventListener('blur', function(e) {
            //document.onmouseup();
        });
        window.addEventListener('resize', function(e) {
            $dom('div.pagebox_full')
                .width(window.innerWidth - 3).height(innerHeight - 2)
                .left(1).top(0);
        });
        document.addEventListener('mousedown', function(e) {
            //如果点在最小化管理区，则不隐藏最小管理面板
            var node = event.target ? event.target : event.srcElement;
            var tagname = '';
            do {
                tagname = node.tagName ? node.tagName.toLowerCase() : '';
                node = node.parentNode;
            } while (!(tagname == 'pagebox-minarea' || tagname == 'html'));
            if (tagname != 'pagebox-minarea') {
                $dom('pagebox-minarea').css('opacity', 0);
                window.setTimeout(function() {
                    var area = $dom('pagebox-minarea');
                    if (parseInt(area.css('opacity')) == 0) {
                        $dom('pagebox-minarea').hide();
                        $dom('.pagebox-collect').attr('state', 'close');
                    }
                }, 300);
            }
        });
    };
    /* 最小化的所在区域的管理 */
    //最小化管理区的盒子图标
    box.pageboxcollect = function() {
        window.addEventListener('load', function(e) {
            var collect = $dom(window.$pageboxcollect);
            collect.addClass('pagebox-collect').click(function() {
                var state = collect.attr('state');
                collect.attr('state', state == 'open' ? 'close' : 'open');
                if (collect.attr('state') == 'open')
                    box.pageboxcollect_boxcreate();
            });
        });

    };
    //生成窗体最小化的管理区
    box.pageboxcollect_boxcreate = function() {
        var area = $dom('pagebox-minarea');
        if (area.length < 1) area = $dom('body').append('pagebox-minarea').find('pagebox-minarea');
        area.show().css('opacity', 1);
        //设置大小      
        box.pageboxcollect_boxsize();
        //计算最小化管理区的按钮所在方位
        var collect = $dom('.pagebox-collect');
        var offset = collect.offset();
        var region = '';
        region += document.documentElement.clientWidth / 2 < offset.left + collect.width() / 2 ? 'right' : 'left';
        region += document.documentElement.clientHeight / 2 < offset.top + collect.height() / 2 ? 'bottom' : 'top';
        //设置"最小化的管理区"的位置
        if (region.indexOf('right') > -1) area.css('right', (document.documentElement.clientWidth - offset.left) + 'px');
        if (region.indexOf('left') > -1) area.left(offset.left + collect.width());
        if (region.indexOf('top') > -1) area.top(offset.top);
        if (region.indexOf('bottom') > -1) area.css('bottom', (document.documentElement.clientHeight - offset.top - collect.height()) + 'px');
    };
    //自动设置最小化管理的宽高
    box.pageboxcollect_boxsize = function() {
        var area = $dom('pagebox-minarea');
        var size = area.find('pagebox-min').length;
        if (size < 1) {
            $dom('pagebox-minarea').hide();
            $dom('.pagebox-collect').attr('state', 'close');
        }
        if (size <= 4) area.width(320 + 8).height(80 + 8);
        if (size > 4 && size <= 8) area.width(320 + 8).height(160 + 8);
        if (size > 8 && size <= 12) area.width(320 + 8).height(240 + 8);
        if (size > 12 && size <= 18) area.width(480 + 8).height(240 + 8);
        if (size > 18) area.width(480 + 8 + 20).height(240 + 8).css('overflow', 'auto');
        else
            area.css('overflow', 'hidden');
    };
    win.$pagebox = box;
    win.$pagebox.dragRealize();
    win.$pagebox.pageboxcollect();
})(window);