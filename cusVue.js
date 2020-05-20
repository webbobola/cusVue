(function(gloab, fn) {
	gloab.Vue = fn();
})(window, function() {

	let gloabOption;

	const LIFE_HOOKS = ["created", "mounted", "updated", "destroyed"];
	const NODE_INSTRUCTIONS = ["v-show", "v-cloak"];

	function warn(err) {
		console.error(err);
	}

	function isFunction(fn) {
		return Object.prototype.toString.apply(fn) === "[object Function]";
	}

	function isUnf(target) {
		return target === undefined || target === null;
	}

	function isTrue(target) {
		return target === true;
	}

	function isFalse(target) {
		return target === false;
	}
	
	function isObject(obj){
		return Object.prototype.toString.apply(obj) === "[object Object]";
	}

	function hasOwnProperty(obj, tar) {
		return obj.hasOwnProperty(tar);
	}


	function defineArrayProperty(arr) {
		let arrayProto = Array.prototype;
		let arrayMethods = Object.create(arrayProto); //新生成对象
		let arrayMethodList = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
		arrayMethodList.forEach((method) => {
			Object.defineProperty(arrayMethods, method, {
				value: function() {
					let args = [],
						len = arguments.length;
					while (len--) args[len] = arguments[len];
					let result = arrayProto[method].apply(this, args)
					return result
				},
				writable: true,
				configurable: true
			})
		})
		arr.__proto__ = Object.assign(arrayMethods, arr.__proto__);
		return arr;
	}

	function toProxy(obj, vm) {
		if (typeof obj !== "object")
			return obj
		let proxyObj = Object.create(obj);
		// if (obj instanceof Array) {
		// 	proxyObj = [];
		// } else if (obj instanceof Object) {
		// 	proxyObj = {};
		// }
		for (let i in obj) {
			if (typeof obj[i] === "object") {
				proxyObj[i] = toProxy(obj[i], vm);
			} else {
				proxyObj[i] = obj[i];
			}
		}
		// obj instanceof Array ? defineArrayProperty(obj) : 
		return new Proxy(proxyObj, {
			get(a, b, c) {
				return Reflect.get(a, b, c)
			},
			set(a, b, c, d) {
				updateDom(vm);
				return Reflect.set(a, b, c, d)
			}
		})
	}

	function sameVnode(a, b) {
		return (
			a.key === b.key && a.type === b.type
		)
	}

	function createKeyToOldIdx(children, beginIdx, endIdx) {
		let i, key;
		let map = {};
		for (i = beginIdx; i <= endIdx; ++i) {
			key = children[i].key;
			if (!isUnf(key)) {
				map[key] = i;
			}
		}
		return map
	}

	function findIdxInOld(node, oldCh, start, end) {
		for (let i = start; i < end; i++) {
			let c = oldCh[i];
			if (!isUnf(c) && sameVnode(node, c)) {
				return i
			}
		}
	}



	function updateChildren(parentElm, oldCh, newCh, vm) {
		// console.log(parentElm, oldCh, newCh, vm);
		let oldStartIndex = 0;
		let newStartIndex = 0;
		let oldStartVnode = oldCh[oldStartIndex];
		let oldEndIndex = oldCh.length - 1;
		let newEndIndex = newCh.length - 1;
		let oldEndVnode = oldCh[oldEndIndex];
		let newStartVnode = newCh[newStartIndex];
		let newEndVnode = newCh[newEndIndex];
		let oldKeyToIdx;
		let idxInOld;
		while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
			if (isUnf(oldStartVnode)) {
				oldStartVnode = oldCh[++oldStartIndex];
			} else if (isUnf(oldEndVnode)) {
				oldEndVnode = oldCh[--oldEndIndex];
			} else if (sameVnode(oldStartVnode, newStartVnode)) {
				patchVnode(oldStartVnode, newStartVnode, vm);
				oldStartVnode = oldCh[++oldStartIndex];
				newStartVnode = newCh[++newStartIndex];
			} else if (sameVnode(oldEndVnode, newEndVnode)) {
				patchVnode(oldEndVnode, newEndVnode, vm);
				oldEndVnode = oldCh[--oldEndIndex];
				newEndVnode = newCh[--newEndIndex];
			} else if (sameVnode(oldStartVnode, newEndVnode)) {
				patchVnode(oldStartVnode, newEndVnode, vm);
				nodeOps.insertBefore(parentElm, oldStartVnode.node, nodeOps.nextSibling(oldEndVnode.node))
				oldStartVnode = oldCh[++oldStartIndex];
				newEndVnode = newCh[--newEndIndex];
			} else if (sameVnode(oldEndVnode, newStartVnode)) {
				patchVnode(oldEndVnode, newStartVnode, vm);
				nodeOps.insertBefore(parentElm, oldEndVnode.node, oldStartVnode.node)
				oldEndVnode = oldCh[--oldEndIndex];
				newStartVnode = newCh[++newStartIndex];
			} else {
				if (isUnf(oldKeyToIdx)) {
					oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIndex, oldEndIndex);
				}
				idxInOld = !isUnf(newStartVnode.key) ? oldKeyToIdx[newStartVnode.key] : findIdxInOld(newStartVnode, oldCh,
					oldStartIndex, oldEndIndex);
				if (isUnf(idxInOld)) { //没有对应的key的节点
					// console.log(oldStartVnode,newStartVnode,oldStartIndex,newStartIndex)
					nodeOps.replaceNode(newStartVnode.node, oldStartVnode.node);
					replaceVnode(oldStartVnode, newStartVnode);
				} else { //有对应的key的节点

				}
				newStartVnode = newCh[++newStartIndex];//?为什么要新节点后移一位
			}
		}
		if(oldStartIndex<=oldEndIndex)//旧节点未遍历完，新节点已遍历完
		{
			
		}else if(newStartIndex<=newEndIndex){//新节点未遍历完,旧节点已遍历完
			
		}
	}
	
	let nodeOptions=(()=>{
		function createNode(newNode, oldInx, parentElm, ) {
			let node = document.createElement(type);
			node.innerHTML = text;
			return node;
		}
		
		function createComment(text) {
			return document.createComment(text);
		}
		
		function nextSibling(node) {
			return node.nextSibling;
		}
		
		function removeNode(node) {
			let parent = node.parentNode;
			!isUnf(parent) && parent.removeChild(node);
		}
		
		function removeChild(node, startInx, endInx) {
			let children = node.childNodes;
			for (; startInx <= endInx; startInx++) {
				node.removeChild(children[startInx]);
			}
		}
		
		function appendChild(node, newCh) {
			for (let i = 0, len = newCh.length; i <= len; i++) {
				node.appendChild(newCh[i].node);
			}
		}
		
		function insertBefore(parentNode, newNode, referenceNode) {
			parentNode.insertBefore(newNode, referenceNode);
		}
		
		function getNodeAttrs(node) {
			if (!isUnf(node.attributes) && node.attributes.length > 0)
				return Array.prototype.filter.call(node.attributes, (item) => {
					return NODE_INSTRUCTIONS.indexOf(item.name) === -1;
				}).map((item) => {
					return {
						key: item.name,
						value: item.value
					}
				})
			return null;
		}
		function replaceNode(newNode, oldNode) {
			let parentNode = oldNode.parentNode;
			!isUnf(parentNode) && parentNode.replaceChild(newNode, oldNode);
		}
		return {
			createNode,
			createComment,
			nextSibling,
			removeNode,
			removeChild,
			appendChild,
			insertBefore,
			getNodeAttrs,
			replaceNode
		}
	})()
	
	let nodeOps=Object.create(nodeOptions);//暴露操作节点的方法对象
	
	function replaceVnode(oldVnode, newVnode) {// 合并vnode
		return Object.assign(oldVnode, newVnode);
	}
	


	function patchVnode(oldVnode, vnode, vm) {
		if (isUnf(oldVnode) && !isUnf(vnode)) {
			oldVnode = vnode;
		}
		let oldCh = oldVnode.children;
		let newCh = vnode.children;
		let parentElm = vnode.node = oldVnode.node;
		if (!isUnf(oldCh) && !isUnf(newCh)) {
			updateChildren(parentElm, oldCh, newCh, vm);
		} else if (!isUnf(newCh)) //新节点子节点存在的，旧节点不存在
		{
			console.log("appendChild")
			nodeOps.appendChild(oldVnode.node, newCh);

		} else if (!isUnf(oldCh)) //旧节点子节点存在的，新节点不存在
		{
			// removeDom()	
			// console.log("removeChild")
			nodeOps.removeChild(oldVnode.node, 0, oldCh.length - 1);
		} else {
			// console.log(oldVnode,vnode)
			if (isUnf(vnode.type) || isUnf(oldVnode.type)) {
				nodeOps.replaceNode(vnode.node, oldVnode.node);
			}
			oldVnode = vnode;
			if (oldVnode.node.nodeValue !== vnode.trueNodeValue) {
				oldVnode.node.nodeValue = oldVnode.trueNodeValue;
			}
		}
	}
	let isAsync = true;

	function updateDom(vm) {
		if (isAsync) {
			isAsync = false;
			Promise.resolve().then(() => {
				if (vm._IS_INIT_TEMPLATE) {
					// console.log(vm.vNode,domToVDom(vm.$rootDom, vm))
					patchVnode(vm.vNode, domToVDom(vm.$rootDom, vm), vm);
				} else {
					vm._initTemplate();
				}
				isAsync = true;
				callHook(vm.$updated, vm)
			})
		}
	}
	// let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
	const DOM_REG = new RegExp("(\{{2})([^\{^\}]+)(\}{2})", "gi");
	const SPOT_REG = new RegExp("(.+)(\\[{1})([\'|\"]?)([^\\[^\\]^'^\"]+)([\'|\"]?)(\\]{1})", "gi");
	// function isNoEmptyDom(node){
	// 	console.log(node)
	// 	console.log(IS_NO_EMPTY_DOM.test(node.nodeValue))
	// }
	function dataRegToSpot(val) {
		return val.replace(SPOT_REG, function($, $1, $2, $3, val, $4, $5) {
			return dataRegToSpot($1) + "." + val
		})
	}




	function getNodeIsVif(dom, vm) {
		try {
			with(vm) {
				return !isUnf(dom) && eval(dom.getAttribute("v-if"));
			}
		} catch (e) {
			console.error(e);
		}

	}

	function getNodeInstructions(node) {
		if (!isUnf(node.attributes) && node.attributes.length > 0)
			return Array.prototype.filter.call(node.attributes, (item) => {
				return NODE_INSTRUCTIONS.indexOf(item.name) >= 0;
			}).map((item) => {
				return {
					[item.name]: item.value
				}
			})
		return null;
	}



	function createVNode(node, vm) {
		let vBox = {
			children: null,
			type: node.nodeName,
			node: node
		};
		vBox.trueNodeValue = node.InitialNodeValue.replace(DOM_REG, function($, $1, val, $2) {
			with(this) {
				try {
					return eval(val)
				} catch (e) {
					console.error("method or data " + e.message);
				}
			}
		}.bind(vm))
		// vBox.trueNodeValue = node.InitialNodeValue.replace(DOM_REG, function($, $1, val, $2) {
		// 	return dataRegToSpot(val).split(".").reduce((a, b) => {
		// 		try {
		// 			if (isUnf(a[b]) && a.$isVue === true) {
		// 				throw b;
		// 			}
		// 			return a[b] || "";
		// 		} catch (e) {
		// 			//TODO handle the exception
		// 			warn(`not found <${e}> data or method or prop in vm `)
		// 			return "";
		// 		}
		// 	}, vm)
		// })
		// vBox.trueNodeValue=trueNodeValue;
		// vBox.node = node;
		return vBox;
	}

	

	function domToVDom(dom, vm) {
		let vBox = {
			children: null,
			attrs: null,
			node: dom,
			type: dom.nodeName,
		};

		function analysisChilNode() {
			let domChildren = vBox.node.childNodes;
			for (node of domChildren) {
				vBox.children = vBox.children || [];
				if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.COMMENT_NODE && isUnf(node.replaceTrueNode)) {
					node.InitialNodeValue = (node.InitialNodeValue || node.nodeValue);
					vBox.children.push(createVNode(node, vm));
				} else {
					vBox.children.push(domToVDom(node, vm));
				}
			}
		}
		if (dom.nodeType === Node.COMMENT_NODE && dom.replaceTrueNode) {
			if (isTrue(getNodeIsVif(dom.replaceTrueNode, vm))) {
				vBox.node = dom.replaceTrueNode;
				vBox.type = vBox.node.nodeName;
				analysisChilNode();
				// vBox.children.push(domToVDom(vBox.node, vm));
			}
		} else if (dom.nodeType !== Node.COMMENT_NODE && isFalse(getNodeIsVif(dom, vm))) {
			let commentNode = nodeOps.createComment("");
			commentNode.replaceTrueNode = dom;
			vm._FIRST_RENDER && nodeOps.replaceNode(commentNode, dom);
			vBox.type = null;
			vBox.node = commentNode;
		} else {
			vBox.attrs = nodeOps.getNodeAttrs(dom);
			analysisChilNode();
		}
		return vBox;

	}

	function Vue(options) {
		let option = {
			el: "",
		}
		this.$isVue = true;
		gloabOption = options = Object.assign(option, options);
		if (!options.el) {
			warn("please set root dom <el>");
			return
		} else if (!document.querySelector(options.el)) {
			warn(`not found root dom ${options.el}`);
			return
		} {
			this.$rootDom = document.querySelector(options.el);
			this.$updated = options.updated;
			this.$el = options.el;
		}
		this._initData();
		this._initMethods();
		this._initCreatedHooks();
		this._initTemplate();
		this._initMountedHooks();
	}

	function callHook(fn, context) {
		fn.apply(context);
	}

	function init(Vue) {
		Vue.prototype._initCreatedHooks = function() {
			let vm = this;
			this.$created = gloabOption.created;
			callHook(this.$created, vm);
		}
		Vue.prototype._initMountedHooks = function() {
			let vm = this;
			this.$mounted = gloabOption.mounted;
			callHook(this.$mounted, vm);
		}
		Vue.prototype._initData = function() {
			let vm = this;
			let _data = toProxy(gloabOption.data, vm); //使用Proxy做拦截
			for (let data in _data) {
				Object.defineProperty(vm, data, { //转移访问this指针至vm实例
					get: function() {
						return _data[data];
					},
					//捕获普通改变变量值
					set: function(newVal) {
						_data[data] = newVal;
					}
				})
			}
			this.$data = _data;
		}
		Vue.prototype._initMethods = function() {
			let vm = this;
			let _methods = gloabOption.methods; //使用Proxy做拦截
			if(isObject(_methods))
			{
				for(let method in _methods) {
					Object.defineProperty(vm, method, { //转移访问this指针至vm实例
						get: function() {
							return _methods[method];
						},
						//捕获普通改变变量值
						// set: function(newVal) {
						// }
					})
				}
			}
			this.$methods = _methods;
			
		}
		Vue.prototype._initTemplate = function() {
			let vm = this;
			this._FIRST_RENDER = true;
			this.vNode = domToVDom(this.$rootDom, vm);
			this._FIRST_RENDER = false;
			this._IS_INIT_TEMPLATE = true;
			patchVnode(null, this.vNode, vm);
		}
	}
	init(Vue);

	return Vue
})
