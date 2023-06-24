"use strict"
var BaklavaJS = (() => {
	var ds = Object.defineProperty
	var wl = Object.getOwnPropertyDescriptor
	var Nl = Object.getOwnPropertyNames
	var Ol = Object.prototype.hasOwnProperty
	var xn = (e, t) => {
			for (var n in t) ds(e, n, { get: t[n], enumerable: !0 })
		},
		Cl = (e, t, n, o) => {
			if ((t && typeof t == "object") || typeof t == "function") for (const s of Nl(t)) !Ol.call(e, s) && s !== n && ds(e, s, { get: () => t[s], enumerable: !(o = wl(t, s)) || o.enumerable })
			return e
		}
	var xl = (e) => Cl(ds({}, "__esModule", { value: !0 }), e)
	var om = {}
	xn(om, { Core: () => hs, Engine: () => vs, InterfaceTypes: () => bs, RendererVue: () => Ur, createBaklava: () => nm })
	var hs = {}
	xn(hs, {
		AbstractNode: () => on,
		Connection: () => nn,
		DummyConnection: () => Rt,
		Editor: () => $n,
		GRAPH_NODE_TYPE_PREFIX: () => At,
		Graph: () => qe,
		GraphTemplate: () => ft,
		Node: () => Dn,
		NodeInterface: () => xe,
		createGraphNodeType: () => ps,
		defineNode: () => po,
		getGraphNodeTypeString: () => ot
	})
	var co,
		kl = new Uint8Array(16)
	function fs() {
		if (
			!co &&
			((co =
				(typeof crypto < "u" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
				(typeof msCrypto < "u" && typeof msCrypto.getRandomValues == "function" && msCrypto.getRandomValues.bind(msCrypto))),
			!co)
		)
			throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported")
		return co(kl)
	}
	var Gr = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i
	function Tl(e) {
		return typeof e == "string" && Gr.test(e)
	}
	var Yr = Tl
	var Oe = []
	for (uo = 0; uo < 256; ++uo) Oe.push((uo + 256).toString(16).substr(1))
	var uo
	function Dl(e) {
		var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0,
			n = (
				Oe[e[t + 0]] +
				Oe[e[t + 1]] +
				Oe[e[t + 2]] +
				Oe[e[t + 3]] +
				"-" +
				Oe[e[t + 4]] +
				Oe[e[t + 5]] +
				"-" +
				Oe[e[t + 6]] +
				Oe[e[t + 7]] +
				"-" +
				Oe[e[t + 8]] +
				Oe[e[t + 9]] +
				"-" +
				Oe[e[t + 10]] +
				Oe[e[t + 11]] +
				Oe[e[t + 12]] +
				Oe[e[t + 13]] +
				Oe[e[t + 14]] +
				Oe[e[t + 15]]
			).toLowerCase()
		if (!Yr(n)) throw TypeError("Stringified UUID is invalid")
		return n
	}
	var Xr = Dl
	function $l(e, t, n) {
		e = e || {}
		var o = e.random || (e.rng || fs)()
		if (((o[6] = (o[6] & 15) | 64), (o[8] = (o[8] & 63) | 128), t)) {
			n = n || 0
			for (var s = 0; s < 16; ++s) t[n + s] = o[s]
			return t
		}
		return Xr(o)
	}
	var Se = $l
	var Ke = class {
		constructor() {
			(this.listenerMap = new Map()), (this._listeners = []), (this.proxyMap = new Map()), (this.proxies = [])
		}
		get listeners() {
			return this._listeners.concat(this.proxies.flatMap((t) => t()))
		}
		subscribe(t, n) {
			this.listenerMap.has(t) &&
				(console.warn(`Already subscribed. Unsubscribing for you.
Please check that you don't accidentally use the same token twice to register two different handlers for the same event/hook.`),
				this.unsubscribe(t)),
			this.listenerMap.set(t, n),
			this._listeners.push(n)
		}
		unsubscribe(t) {
			if (this.listenerMap.has(t)) {
				const n = this.listenerMap.get(t)
				this.listenerMap.delete(t)
				const o = this._listeners.indexOf(n)
				o >= 0 && this._listeners.splice(o, 1)
			}
		}
		registerProxy(t, n) {
			this.proxyMap.has(t) &&
				(console.warn(`Already subscribed. Unsubscribing for you.
Please check that you don't accidentally use the same token twice to register two different proxies for the same event/hook.`),
				this.unregisterProxy(t)),
			this.proxyMap.set(t, n),
			this.proxies.push(n)
		}
		unregisterProxy(t) {
			if (!this.proxyMap.has(t)) return
			const n = this.proxyMap.get(t)
			this.proxyMap.delete(t)
			const o = this.proxies.indexOf(n)
			o >= 0 && this.proxies.splice(o, 1)
		}
	}
	var J = class extends Ke {
			constructor(t) {
				super(), (this.entity = t)
			}
			emit(t) {
				this.listeners.forEach((n) => n(t, this.entity))
			}
		},
		he = class extends Ke {
			constructor(t) {
				super(), (this.entity = t)
			}
			emit(t) {
				let n = !1,
					o = () => [(n = !0)]
				for (const s of Array.from(this.listeners.values())) if ((s(t, o, this.entity), n)) return { prevented: !0 }
				return { prevented: !1 }
			}
		}
	var kn = class extends Ke {
			execute(t, n) {
				let o = t
				for (const s of this.listeners) o = s(o, n)
				return o
			}
		},
		me = class extends kn {
			constructor(t) {
				super(), (this.entity = t)
			}
			execute(t) {
				return super.execute(t, this.entity)
			}
		},
		fo = class extends Ke {
			constructor(t) {
				super(), (this.entity = t)
			}
			execute(t) {
				const n = []
				for (const o of this.listeners) n.push(o(t, this.entity))
				return n
			}
		}
	function ze() {
		const e = Symbol(),
			t = new Map(),
			n = new Set(),
			o = (l, c) => {
				c instanceof Ke &&
					c.registerProxy(e, () => {
						var u, d
						return (d = (u = t.get(l)) === null || u === void 0 ? void 0 : u.listeners) !== null && d !== void 0 ? d : []
					})
			},
			s = (l) => {
				const c = new Ke()
				t.set(l, c), n.forEach((u) => o(l, u[l]))
			},
			r = (l) => {
				n.add(l)
				for (const c of t.keys()) o(c, l[c])
			},
			i = (l) => {
				for (const c of t.keys()) l[c] instanceof Ke && l[c].unregisterProxy(e)
				n.delete(l)
			},
			a = () => {
				n.forEach((l) => i(l)), t.clear()
			}
		return new Proxy(
			{},
			{
				get(l, c) {
					return c === "addTarget" ? r : c === "removeTarget" ? i : c === "destroy" ? a : typeof c != "string" || c.startsWith("_") ? l[c] : (t.has(c) || s(c), t.get(c))
				}
			}
		)
	}
	var nn = class {
			constructor(t, n) {
				if (((this.destructed = !1), (this.events = { destruct: new J(this) }), !t || !n)) throw new Error("Cannot initialize connection with null/undefined for 'from' or 'to' values")
				;(this.id = Se()), (this.from = t), (this.to = n), this.from.connectionCount++, this.to.connectionCount++
			}
			destruct() {
				this.events.destruct.emit(), this.from.connectionCount--, this.to.connectionCount--, (this.destructed = !0)
			}
		},
		Rt = class {
			constructor(t, n) {
				if (!t || !n) throw new Error("Cannot initialize connection with null/undefined for 'from' or 'to' values")
				;(this.id = Se()), (this.from = t), (this.to = n)
			}
		}
	function Tn(e, t) {
		return Object.fromEntries(Object.entries(e).map(([n, o]) => [n, t(o)]))
	}
	var on = class {
			constructor() {
				(this.id = Se()),
				(this.events = {
					loaded: new J(this),
					beforeAddInput: new he(this),
					addInput: new J(this),
					beforeRemoveInput: new he(this),
					removeInput: new J(this),
					beforeAddOutput: new he(this),
					addOutput: new J(this),
					beforeRemoveOutput: new he(this),
					removeOutput: new J(this),
					update: new J(this)
				}),
				(this.hooks = { beforeLoad: new me(this), afterSave: new me(this) })
			}
			get graph() {
				return this.graphInstance
			}
			addInput(t, n) {
				return this.addInterface("input", t, n)
			}
			addOutput(t, n) {
				return this.addInterface("output", t, n)
			}
			removeInput(t) {
				return this.removeInterface("input", t)
			}
			removeOutput(t) {
				return this.removeInterface("output", t)
			}
			registerGraph(t) {
				this.graphInstance = t
			}
			load(t) {
				this.hooks.beforeLoad.execute(t),
				(this.id = t.id),
				(this.title = t.title),
				Object.entries(t.inputs).forEach(([n, o]) => {
					this.inputs[n] && (this.inputs[n].load(o), (this.inputs[n].nodeId = this.id))
				}),
				Object.entries(t.outputs).forEach(([n, o]) => {
					this.outputs[n] && (this.outputs[n].load(o), (this.outputs[n].nodeId = this.id))
				}),
				this.events.loaded.emit(this)
			}
			save() {
				const t = Tn(this.inputs, (s) => s.save()),
					n = Tn(this.outputs, (s) => s.save()),
					o = { type: this.type, id: this.id, title: this.title, inputs: t, outputs: n }
				return this.hooks.afterSave.execute(o)
			}
			onPlaced() {}
			onDestroy() {}
			initializeIo() {
				Object.entries(this.inputs).forEach(([t, n]) => this.initializeIntf("input", t, n)), Object.entries(this.outputs).forEach(([t, n]) => this.initializeIntf("output", t, n))
			}
			initializeIntf(t, n, o) {
				(o.isInput = t === "input"), (o.nodeId = this.id), o.events.setValue.subscribe(this, () => this.events.update.emit({ type: t, name: n, intf: o }))
			}
			addInterface(t, n, o) {
				const s = t === "input" ? this.events.beforeAddInput : this.events.beforeAddOutput,
					r = t === "input" ? this.events.addInput : this.events.addOutput,
					i = t === "input" ? this.inputs : this.outputs
				return s.emit(o).prevented ? !1 : ((i[n] = o), this.initializeIntf(t, n, o), r.emit(o), !0)
			}
			removeInterface(t, n) {
				const o = t === "input" ? this.events.beforeRemoveInput : this.events.beforeRemoveOutput,
					s = t === "input" ? this.events.removeInput : this.events.removeOutput,
					r = t === "input" ? this.inputs[n] : this.outputs[n]
				if (!r || o.emit(r).prevented) return !1
				if (r.connectionCount > 0)
					if (this.graphInstance)
						this.graphInstance.connections
							.filter((a) => a.from === r || a.to === r)
							.forEach((a) => {
								this.graphInstance.removeConnection(a)
							})
					else throw new Error("Interface is connected, but no graph instance is specified. Unable to delete interface")
				return r.events.setValue.unsubscribe(this), t === "input" ? delete this.inputs[n] : delete this.outputs[n], s.emit(r), !0
			}
		},
		Dn = class extends on {
			load(t) {
				super.load(t)
			}
			save() {
				return super.save()
			}
		}
	function po(e) {
		return class extends Dn {
			constructor() {
				var t, n
				super(),
				(this.type = e.type),
				(this.title = (t = e.title) !== null && t !== void 0 ? t : e.type),
				(this.inputs = {}),
				(this.outputs = {}),
				(this.calculate = e.calculate ? (o, s) => e.calculate.call(this, o, s) : void 0),
				this.executeFactory("input", e.inputs),
				this.executeFactory("output", e.outputs),
				(n = e.onCreate) === null || n === void 0 || n.call(this)
			}
			onPlaced() {
				var t
				;(t = e.onPlaced) === null || t === void 0 || t.call(this)
			}
			onDestroy() {
				var t
				;(t = e.onDestroy) === null || t === void 0 || t.call(this)
			}
			executeFactory(t, n) {
				Object.keys(n || {}).forEach((o) => {
					const s = n[o]()
					t === "input" ? this.addInput(o, s) : this.addOutput(o, s)
				})
			}
		}
	}
	var qe = class {
		constructor(t, n) {
			(this.id = Se()),
			(this.inputs = []),
			(this.outputs = []),
			(this._nodes = []),
			(this._connections = []),
			(this._loading = !1),
			(this._destroying = !1),
			(this.events = {
				beforeAddNode: new he(this),
				addNode: new J(this),
				beforeRemoveNode: new he(this),
				removeNode: new J(this),
				beforeAddConnection: new he(this),
				addConnection: new J(this),
				checkConnection: new he(this),
				beforeRemoveConnection: new he(this),
				removeConnection: new J(this)
			}),
			(this.hooks = { save: new me(this), load: new me(this), checkConnection: new fo(this) }),
			(this.nodeEvents = ze()),
			(this.nodeHooks = ze()),
			(this.connectionEvents = ze()),
			(this.editor = t),
			(this.template = n),
			t.registerGraph(this)
		}
		get nodes() {
			return this._nodes
		}
		get connections() {
			return this._connections
		}
		get loading() {
			return this._loading
		}
		get destroying() {
			return this._destroying
		}
		addNode(t) {
			if (!this.events.beforeAddNode.emit(t).prevented)
				return (
					this.nodeEvents.addTarget(t.events),
					this.nodeHooks.addTarget(t.hooks),
					t.registerGraph(this),
					this._nodes.push(t),
					(t = this.nodes.find((n) => n.id === t.id)),
					t.onPlaced(),
					this.events.addNode.emit(t),
					t
				)
		}
		removeNode(t) {
			if (this.nodes.includes(t)) {
				if (this.events.beforeRemoveNode.emit(t).prevented) return
				const n = [...Object.values(t.inputs), ...Object.values(t.outputs)]
				this.connections.filter((o) => n.includes(o.from) || n.includes(o.to)).forEach((o) => this.removeConnection(o)),
				this._nodes.splice(this.nodes.indexOf(t), 1),
				this.events.removeNode.emit(t),
				t.onDestroy(),
				this.nodeEvents.removeTarget(t.events),
				this.nodeHooks.removeTarget(t.hooks)
			}
		}
		addConnection(t, n) {
			const o = this.checkConnection(t, n)
			if (!o.connectionAllowed || this.events.beforeAddConnection.emit({ from: t, to: n }).prevented) return
			for (const r of o.connectionsInDanger) {
				const i = this.connections.find((a) => a.id === r.id)
				i && this.removeConnection(i)
			}
			const s = new nn(o.dummyConnection.from, o.dummyConnection.to)
			return this.internalAddConnection(s), s
		}
		removeConnection(t) {
			if (this.connections.includes(t)) {
				if (this.events.beforeRemoveConnection.emit(t).prevented) return
				t.destruct(), this._connections.splice(this.connections.indexOf(t), 1), this.events.removeConnection.emit(t), this.connectionEvents.removeTarget(t.events)
			}
		}
		checkConnection(t, n) {
			if (!t || !n) return { connectionAllowed: !1 }
			const o = this.findNodeById(t.nodeId),
				s = this.findNodeById(n.nodeId)
			if (o && s && o === s) return { connectionAllowed: !1 }
			if (t.isInput && !n.isInput) {
				const a = t
				;(t = n), (n = a)
			}
			if (t.isInput || !n.isInput) return { connectionAllowed: !1 }
			if (this.connections.some((a) => a.from === t && a.to === n)) return { connectionAllowed: !1 }
			if (this.events.checkConnection.emit({ from: t, to: n }).prevented) return { connectionAllowed: !1 }
			const r = this.hooks.checkConnection.execute({ from: t, to: n })
			if (r.some((a) => !a.connectionAllowed)) return { connectionAllowed: !1 }
			const i = Array.from(new Set(r.flatMap((a) => a.connectionsInDanger)))
			return { connectionAllowed: !0, dummyConnection: new Rt(t, n), connectionsInDanger: i }
		}
		findNodeInterface(t) {
			for (const n of this.nodes) {
				for (const o in n.inputs) {
					const s = n.inputs[o]
					if (s.id === t) return s
				}
				for (const o in n.outputs) {
					const s = n.outputs[o]
					if (s.id === t) return s
				}
			}
		}
		findNodeById(t) {
			return this.nodes.find((n) => n.id === t)
		}
		load(t) {
			try {
				this._loading = !0
				const n = []
				for (let o = this.connections.length - 1; o >= 0; o--) this.removeConnection(this.connections[o])
				for (let o = this.nodes.length - 1; o >= 0; o--) this.removeNode(this.nodes[o])
				;(this.id = t.id), (this.inputs = t.inputs), (this.outputs = t.outputs)
				for (const o of t.nodes) {
					const s = this.editor.nodeTypes.get(o.type)
					if (!s) {
						n.push(`Node type ${o.type} is not registered`)
						continue
					}
					const r = new s.type()
					this.addNode(r), r.load(o)
				}
				for (const o of t.connections) {
					const s = this.findNodeInterface(o.from),
						r = this.findNodeInterface(o.to)
					if (s)
						if (r) {
							const i = new nn(s, r)
							;(i.id = o.id), this.internalAddConnection(i)
						} else {
							n.push(`Could not find interface with id ${o.to}`)
							continue
						}
					else {
						n.push(`Could not find interface with id ${o.from}`)
						continue
					}
				}
				return this.hooks.load.execute(t), n
			} finally {
				this._loading = !1
			}
		}
		save() {
			const t = {
				id: this.id,
				nodes: this.nodes.map((n) => n.save()),
				connections: this.connections.map((n) => ({ id: n.id, from: n.from.id, to: n.to.id })),
				inputs: this.inputs,
				outputs: this.outputs
			}
			return this.hooks.save.execute(t)
		}
		destroy() {
			this._destroying = !0
			for (const t of this.nodes) this.removeNode(t)
			this.editor.unregisterGraph(this)
		}
		internalAddConnection(t) {
			this.connectionEvents.addTarget(t.events), this._connections.push(t), this.events.addConnection.emit(t)
		}
	}
	var xe = class {
		constructor(t, n) {
			(this.id = Se()),
			(this.nodeId = ""),
			(this.port = !0),
			(this.hidden = !1),
			(this.events = { setConnectionCount: new J(this), beforeSetValue: new he(this), setValue: new J(this), updated: new J(this) }),
			(this.hooks = { load: new me(this), save: new me(this) }),
			(this._connectionCount = 0),
			(this.name = t),
			(this._value = n)
		}
		set connectionCount(t) {
			(this._connectionCount = t), this.events.setConnectionCount.emit(t)
		}
		get connectionCount() {
			return this._connectionCount
		}
		set value(t) {
			this.events.beforeSetValue.emit(t).prevented || ((this._value = t), this.events.setValue.emit(t))
		}
		get value() {
			return this._value
		}
		load(t) {
			(this.id = t.id), (this.templateId = t.templateId), (this.value = t.value), this.hooks.load.execute(t)
		}
		save() {
			const t = { id: this.id, templateId: this.templateId, value: this.value }
			return this.hooks.save.execute(t)
		}
		setComponent(t) {
			return (this.component = t), this
		}
		setPort(t) {
			return (this.port = t), this
		}
		setHidden(t) {
			return (this.hidden = t), this
		}
		use(t, ...n) {
			return t(this, ...n), this
		}
	}
	var At = "__baklava_GraphNode-"
	function ot(e) {
		return At + e.id
	}
	function ps(e) {
		return class extends on {
			constructor() {
				super(...arguments),
				(this.type = ot(e)),
				(this._title = "GraphNode"),
				(this.inputs = {}),
				(this.outputs = {}),
				(this.template = e),
				(this.calculate = async (n, o) => {
					if (!this.subgraph) throw new Error(`GraphNode ${this.id}: calculate called without subgraph being initialized`)
					if (typeof o.engine == "object" && !!o.engine && typeof o.engine.runGraph == "function") {
						const s = new Map()
						for (const l of this.subgraph.nodes)
							Object.values(l.inputs).forEach((c) => {
								c.connectionCount === 0 && s.set(c.id, c.value)
							})
						Object.entries(n).forEach(([l, c]) => {
							const u = this.subgraph.inputs.find((d) => d.id === l)
							s.set(u.nodeInterfaceId, c)
						})
						const r = await o.engine.runGraph(this.subgraph, s, o.globalValues),
							i = new Map()
						r.forEach((l, c) => {
							const u = this.subgraph.nodes.find((d) => d.id === c)
							l.forEach((d, p) => {
								i.set(u.outputs[p].id, d)
							})
						})
						const a = {}
						return (
							this.subgraph.outputs.forEach((l) => {
								a[l.id] = i.get(l.nodeInterfaceId)
							}),
							(a._calculationResults = r),
							a
						)
					}
				})
			}
			get title() {
				return this._title
			}
			set title(n) {
				this.template.name = n
			}
			load(n) {
				if (!this.subgraph) throw new Error("Cannot load a graph node without a graph")
				if (!this.template) throw new Error("Unable to load graph node without graph template")
				this.subgraph.load(n.graphState), super.load(n)
			}
			save() {
				if (!this.subgraph) throw new Error("Cannot save a graph node without a graph")
				return { ...super.save(), graphState: this.subgraph.save() }
			}
			onPlaced() {
				this.template.events.updated.subscribe(this, () => this.initialize()),
				this.template.events.nameChanged.subscribe(this, (n) => {
					this._title = n
				}),
				this.initialize()
			}
			onDestroy() {
				var n
				this.template.events.updated.unsubscribe(this), this.template.events.nameChanged.unsubscribe(this), (n = this.subgraph) === null || n === void 0 || n.destroy()
			}
			initialize() {
				this.subgraph && this.subgraph.destroy(), (this.subgraph = this.template.createGraph()), (this._title = this.template.name), this.updateInterfaces(), this.events.update.emit(null)
			}
			updateInterfaces() {
				if (!this.subgraph) throw new Error("Trying to update interfaces without graph instance")
				for (const n of this.subgraph.inputs) n.id in this.inputs ? (this.inputs[n.id].name = n.name) : this.addInput(n.id, new xe(n.name, void 0))
				for (const n of Object.keys(this.inputs)) this.subgraph.inputs.some((o) => o.id === n) || this.removeInput(n)
				for (const n of this.subgraph.outputs) n.id in this.outputs ? (this.outputs[n.id].name = n.name) : this.addOutput(n.id, new xe(n.name, void 0))
				for (const n of Object.keys(this.outputs)) this.subgraph.outputs.some((o) => o.id === n) || this.removeOutput(n)
				this.addOutput("_calculationResults", new xe("_calculationResults", void 0).setHidden(!0))
			}
		}
	}
	var ft = class {
		constructor(t, n) {
			(this.id = Se()),
			(this._name = "Subgraph"),
			(this.events = { nameChanged: new J(this), updated: new J(this) }),
			(this.hooks = { beforeLoad: new me(this), afterSave: new me(this) }),
			(this.editor = n),
			t.id && (this.id = t.id),
			t.name && (this._name = t.name),
			this.update(t)
		}
		static fromGraph(t, n) {
			return new ft(t.save(), n)
		}
		get name() {
			return this._name
		}
		set name(t) {
			(this._name = t), this.events.nameChanged.emit(t)
			const n = this.editor.nodeTypes.get(ot(this))
			n && (n.title = t)
		}
		update(t) {
			(this.nodes = t.nodes), (this.connections = t.connections), (this.inputs = t.inputs), (this.outputs = t.outputs), this.events.updated.emit()
		}
		save() {
			return { id: this.id, name: this.name, nodes: this.nodes, connections: this.connections, inputs: this.inputs, outputs: this.outputs }
		}
		createGraph(t) {
			const n = new Map(),
				o = (d) => {
					const p = Se()
					return n.set(d, p), p
				},
				s = (d) => {
					const p = n.get(d)
					if (!p) throw new Error(`Unable to create graph from template: Could not map old id ${d} to new id`)
					return p
				},
				r = (d) => Tn(d, (p) => ({ id: o(p.id), templateId: p.id, value: p.value })),
				i = this.nodes.map((d) => ({ ...d, id: o(d.id), inputs: r(d.inputs), outputs: r(d.outputs) })),
				a = this.connections.map((d) => ({ id: o(d.id), from: s(d.from), to: s(d.to) })),
				l = this.inputs.map((d) => ({ id: d.id, name: d.name, nodeInterfaceId: s(d.nodeInterfaceId) })),
				c = this.outputs.map((d) => ({ id: d.id, name: d.name, nodeInterfaceId: s(d.nodeInterfaceId) })),
				u = { id: Se(), nodes: i, connections: a, inputs: l, outputs: c }
			return t || (t = new qe(this.editor)), t.load(u), (t.template = this), t
		}
	}
	var $n = class {
		constructor() {
			(this.events = {
				loaded: new J(this),
				beforeRegisterNodeType: new he(this),
				registerNodeType: new J(this),
				beforeUnregisterNodeType: new he(this),
				unregisterNodeType: new J(this),
				beforeAddGraphTemplate: new he(this),
				addGraphTemplate: new J(this),
				beforeRemoveGraphTemplate: new he(this),
				removeGraphTemplate: new J(this),
				registerGraph: new J(this),
				unregisterGraph: new J(this)
			}),
			(this.hooks = { save: new me(this), load: new me(this) }),
			(this.graphTemplateEvents = ze()),
			(this.graphTemplateHooks = ze()),
			(this.graphEvents = ze()),
			(this.graphHooks = ze()),
			(this.nodeEvents = ze()),
			(this.nodeHooks = ze()),
			(this.connectionEvents = ze()),
			(this._graphs = new Set()),
			(this._nodeTypes = new Map()),
			(this._graph = new qe(this)),
			(this._graphTemplates = []),
			(this._loading = !1)
		}
		get nodeTypes() {
			return this._nodeTypes
		}
		get graph() {
			return this._graph
		}
		get graphTemplates() {
			return this._graphTemplates
		}
		get graphs() {
			return this._graphs
		}
		get loading() {
			return this._loading
		}
		registerNodeType(t, n) {
			var o, s
			if (this.events.beforeRegisterNodeType.emit({ type: t, options: n }).prevented) return
			const r = new t()
			this._nodeTypes.set(r.type, {
				type: t,
				category: (o = n == null ? void 0 : n.category) !== null && o !== void 0 ? o : "default",
				title: (s = n == null ? void 0 : n.title) !== null && s !== void 0 ? s : r.title
			}),
			this.events.registerNodeType.emit({ type: t, options: n })
		}
		unregisterNodeType(t) {
			const n = typeof t == "string" ? t : new t().type
			if (this.nodeTypes.has(n)) {
				if (this.events.beforeUnregisterNodeType.emit(n).prevented) return
				this._nodeTypes.delete(n), this.events.unregisterNodeType.emit(n)
			}
		}
		addGraphTemplate(t) {
			if (this.events.beforeAddGraphTemplate.emit(t).prevented) return
			this._graphTemplates.push(t), this.graphTemplateEvents.addTarget(t.events), this.graphTemplateHooks.addTarget(t.hooks)
			const n = ps(t)
			this.registerNodeType(n, { category: "Subgraphs", title: t.name }), this.events.addGraphTemplate.emit(t)
		}
		removeGraphTemplate(t) {
			if (this.graphTemplates.includes(t)) {
				if (this.events.beforeRemoveGraphTemplate.emit(t).prevented) return
				const n = ot(t)
				for (const o of [this.graph, ...this.graphs.values()]) {
					const s = o.nodes.filter((r) => r.type === n)
					for (const r of s) o.removeNode(r)
				}
				this.unregisterNodeType(n),
				this._graphTemplates.splice(this._graphTemplates.indexOf(t), 1),
				this.graphTemplateEvents.removeTarget(t.events),
				this.graphTemplateHooks.removeTarget(t.hooks),
				this.events.removeGraphTemplate.emit(t)
			}
		}
		registerGraph(t) {
			this.graphEvents.addTarget(t.events),
			this.graphHooks.addTarget(t.hooks),
			this.nodeEvents.addTarget(t.nodeEvents),
			this.nodeHooks.addTarget(t.nodeHooks),
			this.connectionEvents.addTarget(t.connectionEvents),
			this.events.registerGraph.emit(t),
			this._graphs.add(t)
		}
		unregisterGraph(t) {
			this.graphEvents.removeTarget(t.events),
			this.graphHooks.removeTarget(t.hooks),
			this.nodeEvents.removeTarget(t.nodeEvents),
			this.nodeHooks.removeTarget(t.nodeHooks),
			this.connectionEvents.removeTarget(t.connectionEvents),
			this.events.unregisterGraph.emit(t),
			this._graphs.delete(t)
		}
		load(t) {
			try {
				(this._loading = !0),
				(t = this.hooks.load.execute(t)),
				t.graphTemplates.forEach((o) => {
					const s = new ft(o, this)
					this.addGraphTemplate(s)
				})
				const n = this._graph.load(t.graph)
				return this.events.loaded.emit(), n.forEach((o) => console.warn(o)), n
			} finally {
				this._loading = !1
			}
		}
		save() {
			const t = { graph: this.graph.save(), graphTemplates: this.graphTemplates.map((n) => n.save()) }
			return this.hooks.save.execute(t)
		}
	}
	var vs = {}
	xn(vs, {
		BaseEngine: () => In,
		CycleError: () => Sn,
		DependencyEngine: () => gs,
		EngineStatus: () => Te,
		allowMultipleConnections: () => Ml,
		applyResult: () => Sl,
		containsCycle: () => ms,
		sortTopologically: () => ho
	})
	function Sl(e, t) {
		const n = new Map()
		t.graphs.forEach((o) => {
			o.nodes.forEach((s) => n.set(s.id, s))
		}),
		e.forEach((o, s) => {
			const r = n.get(s)
			!r ||
					o.forEach((i, a) => {
						const l = r.outputs[a]
						!l || (l.value = i)
					})
		})
	}
	var Sn = class extends Error {
		constructor() {
			super("Cycle detected")
		}
	}
	function Il(e) {
		return typeof e == "string"
	}
	function ho(e, t) {
		let n = new Map(),
			o = new Map(),
			s = new Map(),
			r,
			i
		if (e instanceof qe) (r = e.nodes), (i = e.connections)
		else {
			if (!t) throw new Error("Invalid argument value: expected array of connections")
			;(r = e), (i = t)
		}
		r.forEach((c) => {
			Object.values(c.inputs).forEach((u) => n.set(u.id, c.id)), Object.values(c.outputs).forEach((u) => n.set(u.id, c.id))
		}),
		r.forEach((c) => {
			const u = i.filter((p) => p.from && n.get(p.from.id) === c.id),
				d = new Set(u.map((p) => n.get(p.to.id)).filter(Il))
			o.set(c.id, d), s.set(c, u)
		})
		const a = r.slice()
		i.forEach((c) => {
			const u = a.findIndex((d) => n.get(c.to.id) === d.id)
			u >= 0 && a.splice(u, 1)
		})
		const l = []
		for (; a.length > 0; ) {
			const c = a.pop()
			l.push(c)
			const u = o.get(c.id)
			for (; u.size > 0; ) {
				const d = u.values().next().value
				if ((u.delete(d), Array.from(o.values()).every((p) => !p.has(d)))) {
					const p = r.find((m) => m.id === d)
					a.push(p)
				}
			}
		}
		if (Array.from(o.values()).some((c) => c.size > 0)) throw new Sn()
		return { calculationOrder: l, connectionsFromNode: s, interfaceIdToNodeId: n }
	}
	function ms(e, t) {
		try {
			return ho(e, t), !1
		} catch (n) {
			if (n instanceof Sn) return !0
			throw n
		}
	}
	var Te
	;(function (e) {
		(e.Running = "Running"), (e.Idle = "Idle"), (e.Paused = "Paused"), (e.Stopped = "Stopped")
	})(Te || (Te = {}))
	var In = class {
		constructor(t) {
			(this.editor = t),
			(this.events = { beforeRun: new he(this), afterRun: new J(this), statusChange: new J(this) }),
			(this.hooks = { gatherCalculationData: new me(this), transferData: new kn() }),
			(this.recalculateOrder = !0),
			(this.internalStatus = Te.Stopped),
			(this.isRunning = !1),
			this.editor.nodeEvents.update.subscribe(this, (n, o) => {
				o.graph && !o.graph.loading && this.internalOnChange(o, n != null ? n : void 0)
			}),
			this.editor.graphEvents.addNode.subscribe(this, (n, o) => {
				(this.recalculateOrder = !0), o.loading || this.internalOnChange()
			}),
			this.editor.graphEvents.removeNode.subscribe(this, (n, o) => {
				(this.recalculateOrder = !0), o.loading || this.internalOnChange()
			}),
			this.editor.graphEvents.addConnection.subscribe(this, (n, o) => {
				(this.recalculateOrder = !0), o.loading || this.internalOnChange()
			}),
			this.editor.graphEvents.removeConnection.subscribe(this, (n, o) => {
				(this.recalculateOrder = !0), o.loading || this.internalOnChange()
			}),
			this.editor.graphHooks.checkConnection.subscribe(this, (n) => this.checkConnection(n.from, n.to))
		}
		get status() {
			return this.isRunning ? Te.Running : this.internalStatus
		}
		start() {
			this.internalStatus === Te.Stopped && ((this.internalStatus = Te.Idle), this.events.statusChange.emit(this.status))
		}
		pause() {
			this.internalStatus === Te.Idle && ((this.internalStatus = Te.Paused), this.events.statusChange.emit(this.status))
		}
		resume() {
			this.internalStatus === Te.Paused && ((this.internalStatus = Te.Idle), this.events.statusChange.emit(this.status))
		}
		stop() {
			(this.internalStatus === Te.Idle || this.internalStatus === Te.Paused) && ((this.internalStatus = Te.Stopped), this.events.statusChange.emit(this.status))
		}
		async runOnce(t, ...n) {
			if (this.events.beforeRun.emit(t).prevented) return null
			try {
				(this.isRunning = !0), this.events.statusChange.emit(this.status), this.recalculateOrder && this.calculateOrder()
				const o = await this.execute(t, ...n)
				return this.events.afterRun.emit(o), o
			} finally {
				(this.isRunning = !1), this.events.statusChange.emit(this.status)
			}
		}
		checkConnection(t, n) {
			if (t.templateId) {
				const r = this.findInterfaceByTemplateId(this.editor.graph.nodes, t.templateId)
				if (!r) return { connectionAllowed: !0, connectionsInDanger: [] }
				t = r
			}
			if (n.templateId) {
				const r = this.findInterfaceByTemplateId(this.editor.graph.nodes, n.templateId)
				if (!r) return { connectionAllowed: !0, connectionsInDanger: [] }
				n = r
			}
			let o = new Rt(t, n),
				s = this.editor.graph.connections.slice()
			return (
				n.allowMultipleConnections || (s = s.filter((r) => r.to !== n)),
				s.push(o),
				ms(this.editor.graph.nodes, s)
					? { connectionAllowed: !1, connectionsInDanger: [] }
					: { connectionAllowed: !0, connectionsInDanger: n.allowMultipleConnections ? [] : this.editor.graph.connections.filter((r) => r.to === n) }
			)
		}
		calculateOrder() {
			this.recalculateOrder = !0
		}
		async calculateWithoutData(...t) {
			const n = this.hooks.gatherCalculationData.execute(void 0)
			return await this.runOnce(n, ...t)
		}
		validateNodeCalculationOutput(t, n) {
			if (typeof n != "object") throw new Error(`Invalid calculation return value from node ${t.id} (type ${t.type})`)
			Object.keys(t.outputs).forEach((o) => {
				if (!(o in n)) throw new Error(`Calculation return value from node ${t.id} (type ${t.type}) is missing key "${o}"`)
			})
		}
		internalOnChange(t, n) {
			this.internalStatus === Te.Idle && this.onChange(this.recalculateOrder, t, n)
		}
		findInterfaceByTemplateId(t, n) {
			for (const o of t) for (const s of [...Object.values(o.inputs), ...Object.values(o.outputs)]) if (s.templateId === n) return s
			return null
		}
	}
	var Ml = (e) => {
			e.allowMultipleConnections = !0
		},
		gs = class extends In {
			constructor(t) {
				super(t), (this.order = new Map())
			}
			start() {
				super.start(), (this.recalculateOrder = !0), this.calculateWithoutData()
			}
			async runGraph(t, n, o) {
				this.order.has(t.id) || this.order.set(t.id, ho(t))
				const { calculationOrder: s, connectionsFromNode: r } = this.order.get(t.id),
					i = new Map()
				for (const a of s) {
					if (!a.calculate) continue
					const l = {}
					Object.entries(a.inputs).forEach(([u, d]) => {
						if (!n.has(d.id))
							throw new Error(`Could not find value for interface ${d.id}
This is likely a Baklava internal issue. Please report it on GitHub.`)
						l[u] = n.get(d.id)
					})
					const c = await a.calculate(l, { globalValues: o, engine: this })
					this.validateNodeCalculationOutput(a, c),
					i.set(a.id, new Map(Object.entries(c))),
					r.has(a) &&
							r.get(a).forEach((u) => {
								var d
								const p = (d = Object.entries(a.outputs).find(([, g]) => g.id === u.from.id)) === null || d === void 0 ? void 0 : d[0]
								if (!p)
									throw new Error(`Could not find key for interface ${u.from.id}
This is likely a Baklava internal issue. Please report it on GitHub.`)
								const m = this.hooks.transferData.execute(c[p], u)
								u.to.allowMultipleConnections ? (n.has(u.to.id) ? n.get(u.to.id).push(m) : n.set(u.to.id, [m])) : n.set(u.to.id, m)
							})
				}
				return i
			}
			async execute(t) {
				this.recalculateOrder && (this.order.clear(), (this.recalculateOrder = !1))
				const n = new Map()
				for (const o of this.editor.graph.nodes)
					Object.values(o.inputs).forEach((s) => {
						s.connectionCount === 0 && n.set(s.id, s.value)
					})
				return await this.runGraph(this.editor.graph, n, t)
			}
			onChange(t) {
				(this.recalculateOrder = t || this.recalculateOrder), this.calculateWithoutData()
			}
		}
	var bs = {}
	xn(bs, { BaklavaInterfaceTypes: () => _s, NodeInterfaceType: () => ys, setType: () => Vl })
	var ys = class {
			constructor(t) {
				(this.name = t), (this.conversions = [])
			}
			addConversion(t, n = (o) => o) {
				return this.conversions.push({ targetType: t.name, transformationFunction: n }), this
			}
		},
		Vl = (e, t) => {
			e.type = t.name
		},
		_s = class {
			constructor(t, n) {
				(this.types = new Map()),
				(this.editor = t),
				this.editor.graphEvents.checkConnection.subscribe(this, ({ from: o, to: s }, r) => {
					const i = o.type,
						a = s.type
					if (!(!i || !a) && !this.canConvert(i, a)) return r()
				}),
				n?.engine &&
						n.engine.hooks.transferData.subscribe(this, (o, s) => {
							const r = s.from.type,
								i = s.to.type
							return !r || !i ? o : this.convert(r, i, o)
						}),
				n?.viewPlugin && n.viewPlugin.hooks.renderInterface.subscribe(this, ({ intf: o, el: s }) => (o.type && s.setAttribute("data-interface-type", o.type), { intf: o, el: s }))
			}
			addTypes(...t) {
				return (
					t.forEach((n) => {
						this.types.set(n.name, n)
					}),
					this
				)
			}
			getConversion(t, n) {
				var o, s
				return (s = (o = this.types.get(t)) === null || o === void 0 ? void 0 : o.conversions.find((r) => r.targetType === n)) !== null && s !== void 0 ? s : null
			}
			canConvert(t, n) {
				return t === n || (this.types.has(t) && this.types.get(t).conversions.some((o) => o.targetType === n))
			}
			convert(t, n, o) {
				if (t === n) return o
				{
					const s = this.getConversion(t, n)
					if (s) return s.transformationFunction(o)
					throw Error(`Can not convert from "${t}" to "${n}"`)
				}
			}
		}
	var Ur = {}
	xn(Ur, {
		ButtonInterface: () => Er,
		ButtonInterfaceComponent: () => al,
		CheckboxInterface: () => wr,
		CheckboxInterfaceComponent: () => ll,
		Commands: () => Hp,
		Components: () => tm,
		EditorComponent: () => jr,
		IntegerInterface: () => Nr,
		IntegerInterfaceComponent: () => cl,
		NumberInterface: () => Or,
		NumberInterfaceComponent: () => ul,
		SelectInterface: () => Cr,
		SelectInterfaceComponent: () => dl,
		SliderInterface: () => xr,
		SliderInterfaceComponent: () => fl,
		TextInputInterface: () => no,
		TextInputInterfaceComponent: () => pl,
		TextInterface: () => kr,
		providePlugin: () => Ja,
		useBaklava: () => Lr,
		useCommandHandler: () => _l,
		useDragMove: () => $r,
		useGraph: () => Je,
		useTransform: () => Za,
		useViewModel: () => tt
	})
	function sn(e, t) {
		const n = Object.create(null),
			o = e.split(",")
		for (let s = 0; s < o.length; s++) n[o[s]] = !0
		return t ? (s) => !!n[s.toLowerCase()] : (s) => !!n[s]
	}
	var Zr = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly",
		Qr = sn(Zr),
		Sg = sn(Zr + ",async,autofocus,autoplay,controls,default,defer,disabled,hidden,loop,open,required,reversed,scoped,seamless,checked,muted,multiple,selected")
	function Es(e) {
		return !!e || e === ""
	}
	function He(e) {
		if (L(e)) {
			const t = {}
			for (let n = 0; n < e.length; n++) {
				const o = e[n],
					s = ge(o) ? Al(o) : He(o)
				if (s) for (const r in s) t[r] = s[r]
			}
			return t
		} else {
			if (ge(e)) return e
			if (fe(e)) return e
		}
	}
	var Pl = /;(?![^(]*\))/g,
		Rl = /:(.+)/
	function Al(e) {
		const t = {}
		return (
			e.split(Pl).forEach((n) => {
				if (n) {
					const o = n.split(Rl)
					o.length > 1 && (t[o[0].trim()] = o[1].trim())
				}
			}),
			t
		)
	}
	function Ee(e) {
		let t = ""
		if (ge(e)) t = e
		else if (L(e))
			for (let n = 0; n < e.length; n++) {
				const o = Ee(e[n])
				o && (t += o + " ")
			}
		else if (fe(e)) for (const n in e) e[n] && (t += n + " ")
		return t.trim()
	}
	var be = (e) => (ge(e) ? e : e == null ? "" : L(e) || (fe(e) && (e.toString === ni || !B(e.toString))) ? JSON.stringify(e, ei, 2) : String(e)),
		ei = (e, t) =>
			t && t.__v_isRef
				? ei(e, t.value)
				: Et(t)
					? { [`Map(${t.size})`]: [...t.entries()].reduce((n, [o, s]) => ((n[`${o} =>`] = s), n), {}) }
					: go(t)
						? { [`Set(${t.size})`]: [...t.values()] }
						: fe(t) && !L(t) && !Os(t)
							? String(t)
							: t,
		se = {},
		Ft = [],
		Ie = () => {},
		ti = () => !1,
		Fl = /^on[^a-z]/,
		rn = (e) => Fl.test(e),
		Mn = (e) => e.startsWith("onUpdate:"),
		ve = Object.assign,
		mo = (e, t) => {
			const n = e.indexOf(t)
			n > -1 && e.splice(n, 1)
		},
		Hl = Object.prototype.hasOwnProperty,
		Y = (e, t) => Hl.call(e, t),
		L = Array.isArray,
		Et = (e) => yo(e) === "[object Map]",
		go = (e) => yo(e) === "[object Set]"
	var B = (e) => typeof e == "function",
		ge = (e) => typeof e == "string",
		vo = (e) => typeof e == "symbol",
		fe = (e) => e !== null && typeof e == "object",
		ws = (e) => fe(e) && B(e.then) && B(e.catch),
		ni = Object.prototype.toString,
		yo = (e) => ni.call(e),
		Ns = (e) => yo(e).slice(8, -1),
		Os = (e) => yo(e) === "[object Object]",
		_o = (e) => ge(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e,
		Vn = sn(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted")
	var bo = (e) => {
			const t = Object.create(null)
			return (n) => t[n] || (t[n] = e(n))
		},
		jl = /-(\w)/g,
		Me = bo((e) => e.replace(jl, (t, n) => (n ? n.toUpperCase() : ""))),
		Ll = /\B([A-Z])/g,
		pt = bo((e) => e.replace(Ll, "-$1").toLowerCase()),
		Ht = bo((e) => e.charAt(0).toUpperCase() + e.slice(1)),
		Pn = bo((e) => (e ? `on${Ht(e)}` : "")),
		jt = (e, t) => !Object.is(e, t),
		an = (e, t) => {
			for (let n = 0; n < e.length; n++) e[n](t)
		},
		ln = (e, t, n) => {
			Object.defineProperty(e, t, { configurable: !0, enumerable: !1, value: n })
		},
		cn = (e) => {
			const t = parseFloat(e)
			return isNaN(t) ? e : t
		},
		Jr,
		Eo = () => Jr || (Jr = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {})
	var je,
		An = class {
			constructor(t = !1) {
				(this.active = !0), (this.effects = []), (this.cleanups = []), !t && je && ((this.parent = je), (this.index = (je.scopes || (je.scopes = [])).push(this) - 1))
			}
			run(t) {
				if (this.active) {
					const n = je
					try {
						return (je = this), t()
					} finally {
						je = n
					}
				}
			}
			on() {
				je = this
			}
			off() {
				je = this.parent
			}
			stop(t) {
				if (this.active) {
					let n, o
					for (n = 0, o = this.effects.length; n < o; n++) this.effects[n].stop()
					for (n = 0, o = this.cleanups.length; n < o; n++) this.cleanups[n]()
					if (this.scopes) for (n = 0, o = this.scopes.length; n < o; n++) this.scopes[n].stop(!0)
					if (this.parent && !t) {
						const s = this.parent.scopes.pop()
						s && s !== this && ((this.parent.scopes[this.index] = s), (s.index = this.index))
					}
					this.active = !1
				}
			}
		}
	function Ul(e, t = je) {
		t && t.active && t.effects.push(e)
	}
	function Ms() {
		return je
	}
	function Vs(e) {
		je && je.cleanups.push(e)
	}
	var Ps = (e) => {
			const t = new Set(e)
			return (t.w = 0), (t.n = 0), t
		},
		ui = (e) => (e.w & Ot) > 0,
		di = (e) => (e.n & Ot) > 0,
		Bl = ({ deps: e }) => {
			if (e.length) for (let t = 0; t < e.length; t++) e[t].w |= Ot
		},
		Wl = (e) => {
			const { deps: t } = e
			if (t.length) {
				let n = 0
				for (let o = 0; o < t.length; o++) {
					const s = t[o]
					ui(s) && !di(s) ? s.delete(e) : (t[n++] = s), (s.w &= ~Ot), (s.n &= ~Ot)
				}
				t.length = n
			}
		},
		Cs = new WeakMap(),
		Rn = 0,
		Ot = 1,
		xs = 30,
		Qe,
		Lt = Symbol(""),
		ks = Symbol(""),
		Ut = class {
			constructor(t, n = null, o) {
				(this.fn = t), (this.scheduler = n), (this.active = !0), (this.deps = []), (this.parent = void 0), Ul(this, o)
			}
			run() {
				if (!this.active) return this.fn()
				let t = Qe,
					n = Nt
				for (; t; ) {
					if (t === this) return
					t = t.parent
				}
				try {
					return (this.parent = Qe), (Qe = this), (Nt = !0), (Ot = 1 << ++Rn), Rn <= xs ? Bl(this) : oi(this), this.fn()
				} finally {
					Rn <= xs && Wl(this), (Ot = 1 << --Rn), (Qe = this.parent), (Nt = n), (this.parent = void 0), this.deferStop && this.stop()
				}
			}
			stop() {
				Qe === this ? (this.deferStop = !0) : this.active && (oi(this), this.onStop && this.onStop(), (this.active = !1))
			}
		}
	function oi(e) {
		const { deps: t } = e
		if (t.length) {
			for (let n = 0; n < t.length; n++) t[n].delete(e)
			t.length = 0
		}
	}
	var Nt = !0,
		fi = []
	function Ct() {
		fi.push(Nt), (Nt = !1)
	}
	function xt() {
		const e = fi.pop()
		Nt = e === void 0 ? !0 : e
	}
	function Ve(e, t, n) {
		if (Nt && Qe) {
			let o = Cs.get(e)
			o || Cs.set(e, (o = new Map()))
			let s = o.get(n)
			s || o.set(n, (s = Ps())), pi(s, void 0)
		}
	}
	function pi(e, t) {
		let n = !1
		Rn <= xs ? di(e) || ((e.n |= Ot), (n = !ui(e))) : (n = !e.has(Qe)), n && (e.add(Qe), Qe.deps.push(e))
	}
	function st(e, t, n, o, s, r) {
		const i = Cs.get(e)
		if (!i) return
		let a = []
		if (t === "clear") a = [...i.values()]
		else if (n === "length" && L(e))
			i.forEach((c, u) => {
				(u === "length" || u >= o) && a.push(c)
			})
		else
			switch ((n !== void 0 && a.push(i.get(n)), t)) {
				case "add":
					L(e) ? _o(n) && a.push(i.get("length")) : (a.push(i.get(Lt)), Et(e) && a.push(i.get(ks)))
					break
				case "delete":
					L(e) || (a.push(i.get(Lt)), Et(e) && a.push(i.get(ks)))
					break
				case "set":
					Et(e) && a.push(i.get(Lt))
					break
			}
		const l = void 0
		if (a.length === 1) a[0] && Ts(a[0])
		else {
			const c = []
			for (const u of a) u && c.push(...u)
			Ts(Ps(c))
		}
	}
	function Ts(e, t) {
		const n = L(e) ? e : [...e]
		for (const o of n) o.computed && si(o, t)
		for (const o of n) o.computed || si(o, t)
	}
	function si(e, t) {
		(e !== Qe || e.allowRecurse) && (e.scheduler ? e.scheduler() : e.run())
	}
	var Kl = sn("__proto__,__v_isRef,__isVue"),
		hi = new Set(
			Object.getOwnPropertyNames(Symbol)
				.filter((e) => e !== "arguments" && e !== "caller")
				.map((e) => Symbol[e])
				.filter(vo)
		),
		zl = ko(),
		ql = ko(!1, !0),
		Gl = ko(!0),
		Yl = ko(!0, !0),
		ri = Xl()
	function Xl() {
		const e = {}
		return (
			["includes", "indexOf", "lastIndexOf"].forEach((t) => {
				e[t] = function (...n) {
					const o = G(this)
					for (let r = 0, i = this.length; r < i; r++) Ve(o, "get", r + "")
					const s = o[t](...n)
					return s === -1 || s === !1 ? o[t](...n.map(G)) : s
				}
			}),
			["push", "pop", "shift", "unshift", "splice"].forEach((t) => {
				e[t] = function (...n) {
					Ct()
					const o = G(this)[t].apply(this, n)
					return xt(), o
				}
			}),
			e
		)
	}
	function ko(e = !1, t = !1) {
		return function (o, s, r) {
			if (s === "__v_isReactive") return !e
			if (s === "__v_isReadonly") return e
			if (s === "__v_isShallow") return t
			if (s === "__v_raw" && r === (e ? (t ? Ei : bi) : t ? _i : yi).get(o)) return o
			const i = L(o)
			if (!e && i && Y(ri, s)) return Reflect.get(ri, s, r)
			const a = Reflect.get(o, s, r)
			return (vo(s) ? hi.has(s) : Kl(s)) || (e || Ve(o, "get", s), t) ? a : ye(a) ? (i && _o(s) ? a : a.value) : fe(a) ? (e ? Fs(a) : Pe(a)) : a
		}
	}
	var Jl = mi(),
		Zl = mi(!0)
	function mi(e = !1) {
		return function (n, o, s, r) {
			let i = n[o]
			if (Bt(i) && ye(i) && !ye(s)) return !1
			if (!e && !Bt(s) && (Hn(s) || ((s = G(s)), (i = G(i))), !L(n) && ye(i) && !ye(s))) return (i.value = s), !0
			const a = L(n) && _o(o) ? Number(o) < n.length : Y(n, o),
				l = Reflect.set(n, o, s, r)
			return n === G(r) && (a ? jt(s, i) && st(n, "set", o, s, i) : st(n, "add", o, s)), l
		}
	}
	function Ql(e, t) {
		const n = Y(e, t),
			o = e[t],
			s = Reflect.deleteProperty(e, t)
		return s && n && st(e, "delete", t, void 0, o), s
	}
	function ec(e, t) {
		const n = Reflect.has(e, t)
		return (!vo(t) || !hi.has(t)) && Ve(e, "has", t), n
	}
	function tc(e) {
		return Ve(e, "iterate", L(e) ? "length" : Lt), Reflect.ownKeys(e)
	}
	var gi = { get: zl, set: Jl, deleteProperty: Ql, has: ec, ownKeys: tc },
		vi = {
			get: Gl,
			set(e, t) {
				return !0
			},
			deleteProperty(e, t) {
				return !0
			}
		},
		nc = ve({}, gi, { get: ql, set: Zl }),
		oc = ve({}, vi, { get: Yl }),
		Rs = (e) => e,
		To = (e) => Reflect.getPrototypeOf(e)
	function wo(e, t, n = !1, o = !1) {
		e = e.__v_raw
		const s = G(e),
			r = G(t)
		n || (t !== r && Ve(s, "get", t), Ve(s, "get", r))
		const { has: i } = To(s),
			a = o ? Rs : n ? js : Fn
		if (i.call(s, t)) return a(e.get(t))
		if (i.call(s, r)) return a(e.get(r))
		e !== s && e.get(t)
	}
	function No(e, t = !1) {
		const n = this.__v_raw,
			o = G(n),
			s = G(e)
		return t || (e !== s && Ve(o, "has", e), Ve(o, "has", s)), e === s ? n.has(e) : n.has(e) || n.has(s)
	}
	function Oo(e, t = !1) {
		return (e = e.__v_raw), !t && Ve(G(e), "iterate", Lt), Reflect.get(e, "size", e)
	}
	function ii(e) {
		e = G(e)
		const t = G(this)
		return To(t).has.call(t, e) || (t.add(e), st(t, "add", e, e)), this
	}
	function ai(e, t) {
		t = G(t)
		let n = G(this),
			{ has: o, get: s } = To(n),
			r = o.call(n, e)
		r || ((e = G(e)), (r = o.call(n, e)))
		const i = s.call(n, e)
		return n.set(e, t), r ? jt(t, i) && st(n, "set", e, t, i) : st(n, "add", e, t), this
	}
	function li(e) {
		let t = G(this),
			{ has: n, get: o } = To(t),
			s = n.call(t, e)
		s || ((e = G(e)), (s = n.call(t, e)))
		const r = o ? o.call(t, e) : void 0,
			i = t.delete(e)
		return s && st(t, "delete", e, void 0, r), i
	}
	function ci() {
		const e = G(this),
			t = e.size !== 0,
			n = void 0,
			o = e.clear()
		return t && st(e, "clear", void 0, void 0, n), o
	}
	function Co(e, t) {
		return function (o, s) {
			const r = this,
				i = r.__v_raw,
				a = G(i),
				l = t ? Rs : e ? js : Fn
			return !e && Ve(a, "iterate", Lt), i.forEach((c, u) => o.call(s, l(c), l(u), r))
		}
	}
	function xo(e, t, n) {
		return function (...o) {
			const s = this.__v_raw,
				r = G(s),
				i = Et(r),
				a = e === "entries" || (e === Symbol.iterator && i),
				l = e === "keys" && i,
				c = s[e](...o),
				u = n ? Rs : t ? js : Fn
			return (
				!t && Ve(r, "iterate", l ? ks : Lt),
				{
					next() {
						const { value: d, done: p } = c.next()
						return p ? { value: d, done: p } : { value: a ? [u(d[0]), u(d[1])] : u(d), done: p }
					},
					[Symbol.iterator]() {
						return this
					}
				}
			)
		}
	}
	function wt(e) {
		return function (...t) {
			return e === "delete" ? !1 : this
		}
	}
	function sc() {
		const e = {
				get(r) {
					return wo(this, r)
				},
				get size() {
					return Oo(this)
				},
				has: No,
				add: ii,
				set: ai,
				delete: li,
				clear: ci,
				forEach: Co(!1, !1)
			},
			t = {
				get(r) {
					return wo(this, r, !1, !0)
				},
				get size() {
					return Oo(this)
				},
				has: No,
				add: ii,
				set: ai,
				delete: li,
				clear: ci,
				forEach: Co(!1, !0)
			},
			n = {
				get(r) {
					return wo(this, r, !0)
				},
				get size() {
					return Oo(this, !0)
				},
				has(r) {
					return No.call(this, r, !0)
				},
				add: wt("add"),
				set: wt("set"),
				delete: wt("delete"),
				clear: wt("clear"),
				forEach: Co(!0, !1)
			},
			o = {
				get(r) {
					return wo(this, r, !0, !0)
				},
				get size() {
					return Oo(this, !0)
				},
				has(r) {
					return No.call(this, r, !0)
				},
				add: wt("add"),
				set: wt("set"),
				delete: wt("delete"),
				clear: wt("clear"),
				forEach: Co(!0, !0)
			}
		return (
			["keys", "values", "entries", Symbol.iterator].forEach((r) => {
				(e[r] = xo(r, !1, !1)), (n[r] = xo(r, !0, !1)), (t[r] = xo(r, !1, !0)), (o[r] = xo(r, !0, !0))
			}),
			[e, n, t, o]
		)
	}
	var [rc, ic, ac, lc] = sc()
	function Do(e, t) {
		const n = t ? (e ? lc : ac) : e ? ic : rc
		return (o, s, r) => (s === "__v_isReactive" ? !e : s === "__v_isReadonly" ? e : s === "__v_raw" ? o : Reflect.get(Y(n, s) && s in o ? n : o, s, r))
	}
	var cc = { get: Do(!1, !1) },
		uc = { get: Do(!1, !0) },
		dc = { get: Do(!0, !1) },
		fc = { get: Do(!0, !0) }
	var yi = new WeakMap(),
		_i = new WeakMap(),
		bi = new WeakMap(),
		Ei = new WeakMap()
	function pc(e) {
		switch (e) {
			case "Object":
			case "Array":
				return 1
			case "Map":
			case "Set":
			case "WeakMap":
			case "WeakSet":
				return 2
			default:
				return 0
		}
	}
	function hc(e) {
		return e.__v_skip || !Object.isExtensible(e) ? 0 : pc(Ns(e))
	}
	function Pe(e) {
		return Bt(e) ? e : $o(e, !1, gi, cc, yi)
	}
	function As(e) {
		return $o(e, !1, nc, uc, _i)
	}
	function Fs(e) {
		return $o(e, !0, vi, dc, bi)
	}
	function Hs(e) {
		return $o(e, !0, oc, fc, Ei)
	}
	function $o(e, t, n, o, s) {
		if (!fe(e) || (e.__v_raw && !(t && e.__v_isReactive))) return e
		const r = s.get(e)
		if (r) return r
		const i = hc(e)
		if (i === 0) return e
		const a = new Proxy(e, i === 2 ? o : n)
		return s.set(e, a), a
	}
	function kt(e) {
		return Bt(e) ? kt(e.__v_raw) : !!(e && e.__v_isReactive)
	}
	function Bt(e) {
		return !!(e && e.__v_isReadonly)
	}
	function Hn(e) {
		return !!(e && e.__v_isShallow)
	}
	function So(e) {
		return kt(e) || Bt(e)
	}
	function G(e) {
		const t = e && e.__v_raw
		return t ? G(t) : e
	}
	function Le(e) {
		return ln(e, "__v_skip", !0), e
	}
	var Fn = (e) => (fe(e) ? Pe(e) : e),
		js = (e) => (fe(e) ? Fs(e) : e)
	function Ls(e) {
		Nt && Qe && ((e = G(e)), pi(e.dep || (e.dep = Ps())))
	}
	function Us(e, t) {
		(e = G(e)), e.dep && Ts(e.dep)
	}
	function ye(e) {
		return !!(e && e.__v_isRef === !0)
	}
	function j(e) {
		return mc(e, !1)
	}
	function mc(e, t) {
		return ye(e) ? e : new Ds(e, t)
	}
	var Ds = class {
		constructor(t, n) {
			(this.__v_isShallow = n), (this.dep = void 0), (this.__v_isRef = !0), (this._rawValue = n ? t : G(t)), (this._value = n ? t : Fn(t))
		}
		get value() {
			return Ls(this), this._value
		}
		set value(t) {
			(t = this.__v_isShallow ? t : G(t)), jt(t, this._rawValue) && ((this._rawValue = t), (this._value = this.__v_isShallow ? t : Fn(t)), Us(this, t))
		}
	}
	function Io(e) {
		return ye(e) ? e.value : e
	}
	var gc = {
		get: (e, t, n) => Io(Reflect.get(e, t, n)),
		set: (e, t, n, o) => {
			const s = e[t]
			return ye(s) && !ye(n) ? ((s.value = n), !0) : Reflect.set(e, t, n, o)
		}
	}
	function Mo(e) {
		return kt(e) ? e : new Proxy(e, gc)
	}
	var $s = class {
		constructor(t) {
			(this.dep = void 0), (this.__v_isRef = !0)
			const { get: n, set: o } = t(
				() => Ls(this),
				() => Us(this)
			)
			;(this._get = n), (this._set = o)
		}
		get value() {
			return this._get()
		}
		set value(t) {
			this._set(t)
		}
	}
	function Bs(e) {
		return new $s(e)
	}
	function Ws(e) {
		const t = L(e) ? new Array(e.length) : {}
		for (const n in e) t[n] = ht(e, n)
		return t
	}
	var Ss = class {
		constructor(t, n, o) {
			(this._object = t), (this._key = n), (this._defaultValue = o), (this.__v_isRef = !0)
		}
		get value() {
			const t = this._object[this._key]
			return t === void 0 ? this._defaultValue : t
		}
		set value(t) {
			this._object[this._key] = t
		}
	}
	function ht(e, t, n) {
		const o = e[t]
		return ye(o) ? o : new Ss(e, t, n)
	}
	var Is = class {
		constructor(t, n, o, s) {
			(this._setter = n),
			(this.dep = void 0),
			(this.__v_isRef = !0),
			(this._dirty = !0),
			(this.effect = new Ut(t, () => {
				this._dirty || ((this._dirty = !0), Us(this))
			})),
			(this.effect.computed = this),
			(this.effect.active = this._cacheable = !s),
			(this.__v_isReadonly = o)
		}
		get value() {
			const t = G(this)
			return Ls(t), (t._dirty || !t._cacheable) && ((t._dirty = !1), (t._value = t.effect.run())), t._value
		}
		set value(t) {
			this._setter(t)
		}
	}
	function wi(e, t, n = !1) {
		let o,
			s,
			r = B(e)
		return r ? ((o = e), (s = Ie)) : ((o = e.get), (s = e.set)), new Is(o, s, r || !s, n)
	}
	var vc
	vc = "__v_isReadonly"
	var Un = []
	function Fi(e, ...t) {
		Ct()
		const n = Un.length ? Un[Un.length - 1].component : null,
			o = n && n.appContext.config.warnHandler,
			s = yc()
		if (o)
			gt(o, n, 11, [
				e + t.join(""),
				n && n.proxy,
				s.map(({ vnode: r }) => `at <${_a(n, r.type)}>`).join(`
`),
				s
			])
		else {
			const r = [`[Vue warn]: ${e}`, ...t]
			s.length &&
				r.push(
					`
`,
					..._c(s)
				),
			console.warn(...r)
		}
		xt()
	}
	function yc() {
		let e = Un[Un.length - 1]
		if (!e) return []
		const t = []
		for (; e; ) {
			const n = t[0]
			n && n.vnode === e ? n.recurseCount++ : t.push({ vnode: e, recurseCount: 0 })
			const o = e.component && e.component.parent
			e = o && o.vnode
		}
		return t
	}
	function _c(e) {
		const t = []
		return (
			e.forEach((n, o) => {
				t.push(
					...(o === 0
						? []
						: [
							`
`
						  ]),
					...bc(n)
				)
			}),
			t
		)
	}
	function bc({ vnode: e, recurseCount: t }) {
		const n = t > 0 ? `... (${t} recursive calls)` : "",
			o = e.component ? e.component.parent == null : !1,
			s = ` at <${_a(e.component, e.type, o)}`,
			r = ">" + n
		return e.props ? [s, ...Ec(e.props), r] : [s + r]
	}
	function Ec(e) {
		const t = [],
			n = Object.keys(e)
		return (
			n.slice(0, 3).forEach((o) => {
				t.push(...Hi(o, e[o]))
			}),
			n.length > 3 && t.push(" ..."),
			t
		)
	}
	function Hi(e, t, n) {
		return ge(t)
			? ((t = JSON.stringify(t)), n ? t : [`${e}=${t}`])
			: typeof t == "number" || typeof t == "boolean" || t == null
				? n
					? t
					: [`${e}=${t}`]
				: ye(t)
					? ((t = Hi(e, G(t.value), !0)), n ? t : [`${e}=Ref<`, t, ">"])
					: B(t)
						? [`${e}=fn${t.name ? `<${t.name}>` : ""}`]
						: ((t = G(t)), n ? t : [`${e}=`, t])
	}
	function gt(e, t, n, o) {
		let s
		try {
			s = o ? e(...o) : e()
		} catch (r) {
			jo(r, t, n)
		}
		return s
	}
	function Be(e, t, n, o) {
		if (B(e)) {
			const r = gt(e, t, n, o)
			return (
				r &&
					ws(r) &&
					r.catch((i) => {
						jo(i, t, n)
					}),
				r
			)
		}
		const s = []
		for (let r = 0; r < e.length; r++) s.push(Be(e[r], t, n, o))
		return s
	}
	function jo(e, t, n, o = !0) {
		const s = t ? t.vnode : null
		if (t) {
			let r = t.parent,
				i = t.proxy,
				a = n
			for (; r; ) {
				const c = r.ec
				if (c) {
					for (let u = 0; u < c.length; u++) if (c[u](e, i, a) === !1) return
				}
				r = r.parent
			}
			const l = t.appContext.config.errorHandler
			if (l) {
				gt(l, null, 10, [e, i, a])
				return
			}
		}
		wc(e, n, s, o)
	}
	function wc(e, t, n, o = !0) {
		console.error(e)
	}
	var Po = !1,
		qs = !1,
		Ue = [],
		mt = 0,
		Bn = [],
		jn = null,
		un = 0,
		Wn = [],
		Tt = null,
		dn = 0,
		ji = Promise.resolve(),
		tr = null,
		Gs = null
	function vn(e) {
		const t = tr || ji
		return e ? t.then(this ? e.bind(this) : e) : t
	}
	function Nc(e) {
		let t = mt + 1,
			n = Ue.length
		for (; t < n; ) {
			const o = (t + n) >>> 1
			qn(Ue[o]) < e ? (t = o + 1) : (n = o)
		}
		return t
	}
	function Li(e) {
		(!Ue.length || !Ue.includes(e, Po && e.allowRecurse ? mt + 1 : mt)) && e !== Gs && (e.id == null ? Ue.push(e) : Ue.splice(Nc(e.id), 0, e), Ui())
	}
	function Ui() {
		!Po && !qs && ((qs = !0), (tr = ji.then(Ki)))
	}
	function Oc(e) {
		const t = Ue.indexOf(e)
		t > mt && Ue.splice(t, 1)
	}
	function Bi(e, t, n, o) {
		L(e) ? n.push(...e) : (!t || !t.includes(e, e.allowRecurse ? o + 1 : o)) && n.push(e), Ui()
	}
	function Cc(e) {
		Bi(e, jn, Bn, un)
	}
	function xc(e) {
		Bi(e, Tt, Wn, dn)
	}
	function Lo(e, t = null) {
		if (Bn.length) {
			for (Gs = t, jn = [...new Set(Bn)], Bn.length = 0, un = 0; un < jn.length; un++) jn[un]()
			;(jn = null), (un = 0), (Gs = null), Lo(e, t)
		}
	}
	function Wi(e) {
		if ((Lo(), Wn.length)) {
			const t = [...new Set(Wn)]
			if (((Wn.length = 0), Tt)) {
				Tt.push(...t)
				return
			}
			for (Tt = t, Tt.sort((n, o) => qn(n) - qn(o)), dn = 0; dn < Tt.length; dn++) Tt[dn]()
			;(Tt = null), (dn = 0)
		}
	}
	var qn = (e) => (e.id == null ? 1 / 0 : e.id)
	function Ki(e) {
		(qs = !1), (Po = !0), Lo(e), Ue.sort((n, o) => qn(n) - qn(o))
		const t = Ie
		try {
			for (mt = 0; mt < Ue.length; mt++) {
				const n = Ue[mt]
				n && n.active !== !1 && gt(n, null, 14)
			}
		} finally {
			(mt = 0), (Ue.length = 0), Wi(e), (Po = !1), (tr = null), (Ue.length || Bn.length || Wn.length) && Ki(e)
		}
	}
	var qt,
		Ln = [],
		Ys = !1
	function Uo(e, ...t) {
		qt ? qt.emit(e, ...t) : Ys || Ln.push({ event: e, args: t })
	}
	function zi(e, t) {
		var n, o
		;(qt = e),
		qt
			? ((qt.enabled = !0), Ln.forEach(({ event: s, args: r }) => qt.emit(s, ...r)), (Ln = []))
			: typeof window < "u" && window.HTMLElement && !(!((o = (n = window.navigator) === null || n === void 0 ? void 0 : n.userAgent) === null || o === void 0) && o.includes("jsdom"))
				? ((t.__VUE_DEVTOOLS_HOOK_REPLAY__ = t.__VUE_DEVTOOLS_HOOK_REPLAY__ || []).push((r) => {
					zi(r, t)
				  }),
				  setTimeout(() => {
					qt || ((t.__VUE_DEVTOOLS_HOOK_REPLAY__ = null), (Ys = !0), (Ln = []))
				  }, 3e3))
				: ((Ys = !0), (Ln = []))
	}
	function kc(e, t) {
		Uo("app:init", e, t, { Fragment: te, Text: Xo, Comment: We, Static: pn })
	}
	function Tc(e) {
		Uo("app:unmount", e)
	}
	var Dc = nr("component:added"),
		qi = nr("component:updated"),
		$c = nr("component:removed")
	function nr(e) {
		return (t) => {
			Uo(e, t.appContext.app, t.uid, t.parent ? t.parent.uid : void 0, t)
		}
	}
	function Sc(e, t, n) {
		Uo("component:emit", e.appContext.app, e, t, n)
	}
	function Ic(e, t, ...n) {
		if (e.isUnmounted) return
		let o = e.vnode.props || se,
			s = n,
			r = t.startsWith("update:"),
			i = r && t.slice(7)
		if (i && i in o) {
			const u = `${i === "modelValue" ? "model" : i}Modifiers`,
				{ number: d, trim: p } = o[u] || se
			p && (s = n.map((m) => m.trim())), d && (s = n.map(cn))
		}
		__VUE_PROD_DEVTOOLS__ && Sc(e, t, s)
		let a,
			l = o[(a = Pn(t))] || o[(a = Pn(Me(t)))]
		!l && r && (l = o[(a = Pn(pt(t)))]), l && Be(l, e, 6, s)
		const c = o[a + "Once"]
		if (c) {
			if (!e.emitted) e.emitted = {}
			else if (e.emitted[a]) return
			;(e.emitted[a] = !0), Be(c, e, 6, s)
		}
	}
	function Gi(e, t, n = !1) {
		const o = t.emitsCache,
			s = o.get(e)
		if (s !== void 0) return s
		let r = e.emits,
			i = {},
			a = !1
		if (__VUE_OPTIONS_API__ && !B(e)) {
			const l = (c) => {
				const u = Gi(c, t, !0)
				u && ((a = !0), ve(i, u))
			}
			!n && t.mixins.length && t.mixins.forEach(l), e.extends && l(e.extends), e.mixins && e.mixins.forEach(l)
		}
		return !r && !a ? (o.set(e, null), null) : (L(r) ? r.forEach((l) => (i[l] = null)) : ve(i, r), o.set(e, i), i)
	}
	function Bo(e, t) {
		return !e || !rn(t) ? !1 : ((t = t.slice(2).replace(/Once$/, "")), Y(e, t[0].toLowerCase() + t.slice(1)) || Y(e, pt(t)) || Y(e, t))
	}
	var ke = null,
		Yi = null
	function Ro(e) {
		const t = ke
		return (ke = e), (Yi = (e && e.type.__scopeId) || null), t
	}
	function yn(e, t = ke, n) {
		if (!t || e._n) return e
		const o = (...s) => {
			o._d && Mi(-1)
			const r = Ro(t),
				i = e(...s)
			return Ro(r), o._d && Mi(1), __VUE_PROD_DEVTOOLS__ && qi(t), i
		}
		return (o._n = !0), (o._c = !0), (o._d = !0), o
	}
	function Ks(e) {
		let {
				type: t,
				vnode: n,
				proxy: o,
				withProxy: s,
				props: r,
				propsOptions: [i],
				slots: a,
				attrs: l,
				emit: c,
				render: u,
				renderCache: d,
				data: p,
				setupState: m,
				ctx: g,
				inheritAttrs: O
			} = e,
			w,
			S,
			y = Ro(e)
		try {
			if (n.shapeFlag & 4) {
				const H = s || o
				;(w = it(u.call(H, H, d, r, m, p, g))), (S = l)
			} else {
				const H = t
				;(w = it(H.length > 1 ? H(r, { attrs: l, slots: a, emit: c }) : H(r, null))), (S = t.props ? l : Mc(l))
			}
		} catch (H) {
			(zn.length = 0), jo(H, e, 1), (w = X(We))
		}
		let M = w,
			z
		if (S && O !== !1) {
			const H = Object.keys(S),
				{ shapeFlag: re } = M
			H.length && re & 7 && (i && H.some(Mn) && (S = Vc(S, i)), (M = $t(M, S)))
		}
		return n.dirs && ((M = $t(M)), (M.dirs = M.dirs ? M.dirs.concat(n.dirs) : n.dirs)), n.transition && (M.transition = n.transition), (w = M), Ro(y), w
	}
	var Mc = (e) => {
			let t
			for (const n in e) (n === "class" || n === "style" || rn(n)) && ((t || (t = {}))[n] = e[n])
			return t
		},
		Vc = (e, t) => {
			const n = {}
			for (const o in e) (!Mn(o) || !(o.slice(9) in t)) && (n[o] = e[o])
			return n
		}
	function Pc(e, t, n) {
		let { props: o, children: s, component: r } = e,
			{ props: i, children: a, patchFlag: l } = t,
			c = r.emitsOptions
		if (t.dirs || t.transition) return !0
		if (n && l >= 0) {
			if (l & 1024) return !0
			if (l & 16) return o ? Ni(o, i, c) : !!i
			if (l & 8) {
				const u = t.dynamicProps
				for (let d = 0; d < u.length; d++) {
					const p = u[d]
					if (i[p] !== o[p] && !Bo(c, p)) return !0
				}
			}
		} else return (s || a) && (!a || !a.$stable) ? !0 : o === i ? !1 : o ? (i ? Ni(o, i, c) : !0) : !!i
		return !1
	}
	function Ni(e, t, n) {
		const o = Object.keys(t)
		if (o.length !== Object.keys(e).length) return !0
		for (let s = 0; s < o.length; s++) {
			const r = o[s]
			if (t[r] !== e[r] && !Bo(n, r)) return !0
		}
		return !1
	}
	function Rc({ vnode: e, parent: t }, n) {
		for (; t && t.subTree === e; ) ((e = t.vnode).el = n), (t = t.parent)
	}
	var Ac = (e) => e.__isSuspense
	function Fc(e, t) {
		t && t.pendingBranch ? (L(e) ? t.effects.push(...e) : t.effects.push(e)) : xc(e)
	}
	function Wo(e, t) {
		if (we) {
			let n = we.provides,
				o = we.parent && we.parent.provides
			o === n && (n = we.provides = Object.create(o)), (n[e] = t)
		}
	}
	function fn(e, t, n = !1) {
		const o = we || ke
		if (o) {
			const s = o.parent == null ? o.vnode.appContext && o.vnode.appContext.provides : o.parent.provides
			if (s && e in s) return s[e]
			if (arguments.length > 1) return n && B(t) ? t.call(o.proxy) : t
		}
	}
	var Oi = {}
	function at(e, t, n) {
		return Xi(e, t, n)
	}
	function Xi(e, t, { immediate: n, deep: o, flush: s, onTrack: r, onTrigger: i } = se) {
		let a = (y) => {
				Fi("Invalid watch source: ", y, "A watch source can only be a getter/effect function, a ref, a reactive object, or an array of these types.")
			},
			l = we,
			c,
			u = !1,
			d = !1
		if (
			(ye(e)
				? ((c = () => e.value), (u = Hn(e)))
				: kt(e)
					? ((c = () => e), (o = !0))
					: L(e)
						? ((d = !0),
				  (u = e.some((y) => kt(y) || Hn(y))),
				  (c = () =>
							e.map((y) => {
								if (ye(y)) return y.value
								if (kt(y)) return Yt(y)
								if (B(y)) return gt(y, l, 2)
							})))
						: B(e)
							? t
								? (c = () => gt(e, l, 2))
								: (c = () => {
									if (!(l && l.isUnmounted)) return p && p(), Be(e, l, 3, [m])
					  })
							: (c = Ie),
			t && o)
		) {
			const y = c
			c = () => Yt(y())
		}
		let p,
			m = (y) => {
				p = S.onStop = () => {
					gt(y, l, 4)
				}
			}
		if (Yn) return (m = Ie), t ? n && Be(t, l, 3, [c(), d ? [] : void 0, m]) : c(), Ie
		let g = d ? [] : Oi,
			O = () => {
				if (S.active)
					if (t) {
						const y = S.run()
						;(o || u || (d ? y.some((M, z) => jt(M, g[z])) : jt(y, g))) && (p && p(), Be(t, l, 3, [y, g === Oi ? void 0 : g, m]), (g = y))
					} else S.run()
			}
		O.allowRecurse = !!t
		let w
		s === "sync" ? (w = O) : s === "post" ? (w = () => Re(O, l && l.suspense)) : (w = () => Cc(O))
		const S = new Ut(c, w)
		return (
			t ? (n ? O() : (g = S.run())) : s === "post" ? Re(S.run.bind(S), l && l.suspense) : S.run(),
			() => {
				S.stop(), l && l.scope && mo(l.scope.effects, S)
			}
		)
	}
	function Hc(e, t, n) {
		let o = this.proxy,
			s = ge(e) ? (e.includes(".") ? Ji(o, e) : () => o[e]) : e.bind(o, o),
			r
		B(t) ? (r = t) : ((r = t.handler), (n = t))
		const i = we
		gn(this)
		const a = Xi(s, r.bind(o), n)
		return i ? gn(i) : Xt(), a
	}
	function Ji(e, t) {
		const n = t.split(".")
		return () => {
			let o = e
			for (let s = 0; s < n.length && o; s++) o = o[n[s]]
			return o
		}
	}
	function Yt(e, t) {
		if (!fe(e) || e.__v_skip || ((t = t || new Set()), t.has(e))) return e
		if ((t.add(e), ye(e))) Yt(e.value, t)
		else if (L(e)) for (let n = 0; n < e.length; n++) Yt(e[n], t)
		else if (go(e) || Et(e))
			e.forEach((n) => {
				Yt(n, t)
			})
		else if (Os(e)) for (const n in e) Yt(e[n], t)
		return e
	}
	function or() {
		const e = { isMounted: !1, isLeaving: !1, isUnmounting: !1, leavingVNodes: new Map() }
		return (
			St(() => {
				e.isMounted = !0
			}),
			Go(() => {
				e.isUnmounting = !0
			}),
			e
		)
	}
	var Ge = [Function, Array],
		jc = {
			name: "BaseTransition",
			props: {
				mode: String,
				appear: Boolean,
				persisted: Boolean,
				onBeforeEnter: Ge,
				onEnter: Ge,
				onAfterEnter: Ge,
				onEnterCancelled: Ge,
				onBeforeLeave: Ge,
				onLeave: Ge,
				onAfterLeave: Ge,
				onLeaveCancelled: Ge,
				onBeforeAppear: Ge,
				onAppear: Ge,
				onAfterAppear: Ge,
				onAppearCancelled: Ge
			},
			setup(e, { slots: t }) {
				let n = ur(),
					o = or(),
					s
				return () => {
					const r = t.default && Ko(t.default(), !0)
					if (!r || !r.length) return
					let i = r[0]
					if (r.length > 1) {
						let O = !1
						for (const w of r)
							if (w.type !== We) {
								(i = w), (O = !0)
								break
							}
					}
					const a = G(e),
						{ mode: l } = a
					if (o.isLeaving) return zs(i)
					const c = Ci(i)
					if (!c) return zs(i)
					const u = hn(c, a, o, n)
					mn(c, u)
					let d = n.subTree,
						p = d && Ci(d),
						m = !1,
						{ getTransitionKey: g } = c.type
					if (g) {
						const O = g()
						s === void 0 ? (s = O) : O !== s && ((s = O), (m = !0))
					}
					if (p && p.type !== We && (!Gt(c, p) || m)) {
						const O = hn(p, a, o, n)
						if ((mn(p, O), l === "out-in"))
							return (
								(o.isLeaving = !0),
								(O.afterLeave = () => {
									(o.isLeaving = !1), n.update()
								}),
								zs(i)
							)
						l === "in-out" &&
							c.type !== We &&
							(O.delayLeave = (w, S, y) => {
								const M = Zi(o, p)
								;(M[String(p.key)] = p),
								(w._leaveCb = () => {
									S(), (w._leaveCb = void 0), delete u.delayedLeave
								}),
								(u.delayedLeave = y)
							})
					}
					return i
				}
			}
		},
		sr = jc
	function Zi(e, t) {
		let { leavingVNodes: n } = e,
			o = n.get(t.type)
		return o || ((o = Object.create(null)), n.set(t.type, o)), o
	}
	function hn(e, t, n, o) {
		let {
				appear: s,
				mode: r,
				persisted: i = !1,
				onBeforeEnter: a,
				onEnter: l,
				onAfterEnter: c,
				onEnterCancelled: u,
				onBeforeLeave: d,
				onLeave: p,
				onAfterLeave: m,
				onLeaveCancelled: g,
				onBeforeAppear: O,
				onAppear: w,
				onAfterAppear: S,
				onAppearCancelled: y
			} = t,
			M = String(e.key),
			z = Zi(n, e),
			H = (R, Z) => {
				R && Be(R, o, 9, Z)
			},
			re = (R, Z) => {
				const U = Z[1]
				H(R, Z), L(R) ? R.every((ue) => ue.length <= 1) && U() : R.length <= 1 && U()
			},
			N = {
				mode: r,
				persisted: i,
				beforeEnter(R) {
					let Z = a
					if (!n.isMounted)
						if (s) Z = O || a
						else return
					R._leaveCb && R._leaveCb(!0)
					const U = z[M]
					U && Gt(e, U) && U.el._leaveCb && U.el._leaveCb(), H(Z, [R])
				},
				enter(R) {
					let Z = l,
						U = c,
						ue = u
					if (!n.isMounted)
						if (s) (Z = w || l), (U = S || c), (ue = y || u)
						else return
					let x = !1,
						q = (R._enterCb = (pe) => {
							x || ((x = !0), pe ? H(ue, [R]) : H(U, [R]), N.delayedLeave && N.delayedLeave(), (R._enterCb = void 0))
						})
					Z ? re(Z, [R, q]) : q()
				},
				leave(R, Z) {
					const U = String(e.key)
					if ((R._enterCb && R._enterCb(!0), n.isUnmounting)) return Z()
					H(d, [R])
					let ue = !1,
						x = (R._leaveCb = (q) => {
							ue || ((ue = !0), Z(), q ? H(g, [R]) : H(m, [R]), (R._leaveCb = void 0), z[U] === e && delete z[U])
						})
					;(z[U] = e), p ? re(p, [R, x]) : x()
				},
				clone(R) {
					return hn(R, t, n, o)
				}
			}
		return N
	}
	function zs(e) {
		if (zo(e)) return (e = $t(e)), (e.children = null), e
	}
	function Ci(e) {
		return zo(e) ? (e.children ? e.children[0] : void 0) : e
	}
	function mn(e, t) {
		e.shapeFlag & 6 && e.component
			? mn(e.component.subTree, t)
			: e.shapeFlag & 128
				? ((e.ssContent.transition = t.clone(e.ssContent)), (e.ssFallback.transition = t.clone(e.ssFallback)))
				: (e.transition = t)
	}
	function Ko(e, t = !1, n) {
		let o = [],
			s = 0
		for (let r = 0; r < e.length; r++) {
			const i = e[r],
				a = n == null ? i.key : String(n) + String(i.key != null ? i.key : r)
			i.type === te ? (i.patchFlag & 128 && s++, (o = o.concat(Ko(i.children, t, a)))) : (t || i.type !== We) && o.push(a != null ? $t(i, { key: a }) : i)
		}
		if (s > 1) for (let r = 0; r < o.length; r++) o[r].patchFlag = -2
		return o
	}
	function de(e) {
		return B(e) ? { setup: e, name: e.name } : e
	}
	var Kn = (e) => !!e.type.__asyncLoader
	var zo = (e) => e.type.__isKeepAlive
	function Lc(e, t) {
		Qi(e, "a", t)
	}
	function Uc(e, t) {
		Qi(e, "da", t)
	}
	function Qi(e, t, n = we) {
		const o =
			e.__wdc ||
			(e.__wdc = () => {
				let s = n
				for (; s; ) {
					if (s.isDeactivated) return
					s = s.parent
				}
				return e()
			})
		if ((qo(t, o, n), n)) {
			let s = n.parent
			for (; s && s.parent; ) zo(s.parent.vnode) && Bc(o, t, n, s), (s = s.parent)
		}
	}
	function Bc(e, t, n, o) {
		const s = qo(t, e, o, !0)
		rr(() => {
			mo(o[t], s)
		}, n)
	}
	function qo(e, t, n = we, o = !1) {
		if (n) {
			const s = n[e] || (n[e] = []),
				r =
					t.__weh ||
					(t.__weh = (...i) => {
						if (n.isUnmounted) return
						Ct(), gn(n)
						const a = Be(t, n, e, i)
						return Xt(), xt(), a
					})
			return o ? s.unshift(r) : s.push(r), r
		}
	}
	var vt =
			(e) =>
				(t, n = we) =>
					(!Yn || e === "sp") && qo(e, t, n),
		Wc = vt("bm"),
		St = vt("m"),
		Kc = vt("bu"),
		_n = vt("u"),
		Go = vt("bum"),
		rr = vt("um"),
		zc = vt("sp"),
		qc = vt("rtg"),
		Gc = vt("rtc")
	function Yc(e, t = we) {
		qo("ec", e, t)
	}
	function It(e, t) {
		const n = ke
		if (n === null) return e
		const o = Zo(n) || n.proxy,
			s = e.dirs || (e.dirs = [])
		for (let r = 0; r < t.length; r++) {
			let [i, a, l, c = se] = t[r]
			B(i) && (i = { mounted: i, updated: i }), i.deep && Yt(a), s.push({ dir: i, instance: o, value: a, oldValue: void 0, arg: l, modifiers: c })
		}
		return e
	}
	function Wt(e, t, n, o) {
		const s = e.dirs,
			r = t && t.dirs
		for (let i = 0; i < s.length; i++) {
			const a = s[i]
			r && (a.oldValue = r[i].value)
			const l = a.dir[o]
			l && (Ct(), Be(l, n, 8, [e.el, a, e, t]), xt())
		}
	}
	var ir = "components"
	function _e(e, t) {
		return ta(ir, e, !0, t) || e
	}
	var ea = Symbol()
	function Yo(e) {
		return ge(e) ? ta(ir, e, !1) || e : e || ea
	}
	function ta(e, t, n = !0, o = !1) {
		const s = ke || we
		if (s) {
			const r = s.type
			if (e === ir) {
				const a = ya(r, !1)
				if (a && (a === t || a === Me(t) || a === Ht(Me(t)))) return r
			}
			const i = xi(s[e] || r[e], t) || xi(s.appContext[e], t)
			return !i && o ? r : i
		}
	}
	function xi(e, t) {
		return e && (e[t] || e[Me(t)] || e[Ht(Me(t))])
	}
	function Ye(e, t, n, o) {
		let s,
			r = n && n[o]
		if (L(e) || ge(e)) {
			s = new Array(e.length)
			for (let i = 0, a = e.length; i < a; i++) s[i] = t(e[i], i, void 0, r && r[i])
		} else if (typeof e == "number") {
			s = new Array(e)
			for (let i = 0; i < e; i++) s[i] = t(i + 1, i, void 0, r && r[i])
		} else if (fe(e))
			if (e[Symbol.iterator]) s = Array.from(e, (i, a) => t(i, a, void 0, r && r[a]))
			else {
				const i = Object.keys(e)
				s = new Array(i.length)
				for (let a = 0, l = i.length; a < l; a++) {
					const c = i[a]
					s[a] = t(e[c], c, a, r && r[a])
				}
			}
		else s = []
		return n && (n[o] = s), s
	}
	function yt(e, t, n = {}, o, s) {
		if (ke.isCE || (ke.parent && Kn(ke.parent) && ke.parent.isCE)) return X("slot", t === "default" ? null : { name: t }, o && o())
		const r = e[t]
		r && r._c && (r._d = !1), D()
		const i = r && na(r(n)),
			a = Ne(te, { key: n.key || `_${t}` }, i || (o ? o() : []), i && e._ === 1 ? 64 : -2)
		return !s && a.scopeId && (a.slotScopeIds = [a.scopeId + "-s"]), r && r._c && (r._d = !0), a
	}
	function na(e) {
		return e.some((t) => (Ho(t) ? !(t.type === We || (t.type === te && !na(t.children))) : !0)) ? e : null
	}
	var Xs = (e) => (e ? (ga(e) ? Zo(e) || e.proxy : Xs(e.parent)) : null),
		Ao = ve(Object.create(null), {
			$: (e) => e,
			$el: (e) => e.vnode.el,
			$data: (e) => e.data,
			$props: (e) => e.props,
			$attrs: (e) => e.attrs,
			$slots: (e) => e.slots,
			$refs: (e) => e.refs,
			$parent: (e) => Xs(e.parent),
			$root: (e) => Xs(e.root),
			$emit: (e) => e.emit,
			$options: (e) => (__VUE_OPTIONS_API__ ? sa(e) : e.type),
			$forceUpdate: (e) => e.f || (e.f = () => Li(e.update)),
			$nextTick: (e) => e.n || (e.n = vn.bind(e.proxy)),
			$watch: (e) => (__VUE_OPTIONS_API__ ? Hc.bind(e) : Ie)
		})
	var Xc = {
		get({ _: e }, t) {
			let { ctx: n, setupState: o, data: s, props: r, accessCache: i, type: a, appContext: l } = e,
				c
			if (t[0] !== "$") {
				const m = i[t]
				if (m !== void 0)
					switch (m) {
						case 1:
							return o[t]
						case 2:
							return s[t]
						case 4:
							return n[t]
						case 3:
							return r[t]
					}
				else {
					if (o !== se && Y(o, t)) return (i[t] = 1), o[t]
					if (s !== se && Y(s, t)) return (i[t] = 2), s[t]
					if ((c = e.propsOptions[0]) && Y(c, t)) return (i[t] = 3), r[t]
					if (n !== se && Y(n, t)) return (i[t] = 4), n[t]
					;(!__VUE_OPTIONS_API__ || Js) && (i[t] = 0)
				}
			}
			let u = Ao[t],
				d,
				p
			if (u) return t === "$attrs" && Ve(e, "get", t), u(e)
			if ((d = a.__cssModules) && (d = d[t])) return d
			if (n !== se && Y(n, t)) return (i[t] = 4), n[t]
			if (((p = l.config.globalProperties), Y(p, t))) return p[t]
		},
		set({ _: e }, t, n) {
			const { data: o, setupState: s, ctx: r } = e
			return s !== se && Y(s, t) ? ((s[t] = n), !0) : o !== se && Y(o, t) ? ((o[t] = n), !0) : Y(e.props, t) || (t[0] === "$" && t.slice(1) in e) ? !1 : ((r[t] = n), !0)
		},
		has({ _: { data: e, setupState: t, accessCache: n, ctx: o, appContext: s, propsOptions: r } }, i) {
			let a
			return !!n[i] || (e !== se && Y(e, i)) || (t !== se && Y(t, i)) || ((a = r[0]) && Y(a, i)) || Y(o, i) || Y(Ao, i) || Y(s.config.globalProperties, i)
		},
		defineProperty(e, t, n) {
			return n.get != null ? (e._.accessCache[t] = 0) : Y(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n)
		}
	}
	var Js = !0
	function Jc(e) {
		const t = sa(e),
			n = e.proxy,
			o = e.ctx
		;(Js = !1), t.beforeCreate && ki(t.beforeCreate, e, "bc")
		const {
			data: s,
			computed: r,
			methods: i,
			watch: a,
			provide: l,
			inject: c,
			created: u,
			beforeMount: d,
			mounted: p,
			beforeUpdate: m,
			updated: g,
			activated: O,
			deactivated: w,
			beforeDestroy: S,
			beforeUnmount: y,
			destroyed: M,
			unmounted: z,
			render: H,
			renderTracked: re,
			renderTriggered: N,
			errorCaptured: R,
			serverPrefetch: Z,
			expose: U,
			inheritAttrs: ue,
			components: x,
			directives: q,
			filters: pe
		} = t
		if ((c && Zc(c, o, null, e.appContext.config.unwrapInjectedRef), i))
			for (const ee in i) {
				const oe = i[ee]
				B(oe) && (o[ee] = oe.bind(n))
			}
		if (s) {
			const ee = s.call(n, n)
			fe(ee) && (e.data = Pe(ee))
		}
		if (((Js = !0), r))
			for (const ee in r) {
				const oe = r[ee],
					Ae = B(oe) ? oe.bind(n, n) : B(oe.get) ? oe.get.bind(n, n) : Ie,
					ut = !B(oe) && B(oe.set) ? oe.set.bind(n) : Ie,
					Pt = K({ get: Ae, set: ut })
				Object.defineProperty(o, ee, { enumerable: !0, configurable: !0, get: () => Pt.value, set: (io) => (Pt.value = io) })
			}
		if (a) for (const ee in a) oa(a[ee], o, n, ee)
		if (l) {
			const ee = B(l) ? l.call(n) : l
			Reflect.ownKeys(ee).forEach((oe) => {
				Wo(oe, ee[oe])
			})
		}
		u && ki(u, e, "c")
		function ie(ee, oe) {
			L(oe) ? oe.forEach((Ae) => ee(Ae.bind(n))) : oe && ee(oe.bind(n))
		}
		if ((ie(Wc, d), ie(St, p), ie(Kc, m), ie(_n, g), ie(Lc, O), ie(Uc, w), ie(Yc, R), ie(Gc, re), ie(qc, N), ie(Go, y), ie(rr, z), ie(zc, Z), L(U)))
			if (U.length) {
				const ee = e.exposed || (e.exposed = {})
				U.forEach((oe) => {
					Object.defineProperty(ee, oe, { get: () => n[oe], set: (Ae) => (n[oe] = Ae) })
				})
			} else e.exposed || (e.exposed = {})
		H && e.render === Ie && (e.render = H), ue != null && (e.inheritAttrs = ue), x && (e.components = x), q && (e.directives = q)
	}
	function Zc(e, t, n = Ie, o = !1) {
		L(e) && (e = Zs(e))
		for (const s in e) {
			let r = e[s],
				i
			fe(r) ? ("default" in r ? (i = fn(r.from || s, r.default, !0)) : (i = fn(r.from || s))) : (i = fn(r)),
			ye(i) && o ? Object.defineProperty(t, s, { enumerable: !0, configurable: !0, get: () => i.value, set: (a) => (i.value = a) }) : (t[s] = i)
		}
	}
	function ki(e, t, n) {
		Be(L(e) ? e.map((o) => o.bind(t.proxy)) : e.bind(t.proxy), t, n)
	}
	function oa(e, t, n, o) {
		const s = o.includes(".") ? Ji(n, o) : () => n[o]
		if (ge(e)) {
			const r = t[e]
			B(r) && at(s, r)
		} else if (B(e)) at(s, e.bind(n))
		else if (fe(e))
			if (L(e)) e.forEach((r) => oa(r, t, n, o))
			else {
				const r = B(e.handler) ? e.handler.bind(n) : t[e.handler]
				B(r) && at(s, r, e)
			}
	}
	function sa(e) {
		let t = e.type,
			{ mixins: n, extends: o } = t,
			{
				mixins: s,
				optionsCache: r,
				config: { optionMergeStrategies: i }
			} = e.appContext,
			a = r.get(t),
			l
		return a ? (l = a) : !s.length && !n && !o ? (l = t) : ((l = {}), s.length && s.forEach((c) => Fo(l, c, i, !0)), Fo(l, t, i)), r.set(t, l), l
	}
	function Fo(e, t, n, o = !1) {
		const { mixins: s, extends: r } = t
		r && Fo(e, r, n, !0), s && s.forEach((i) => Fo(e, i, n, !0))
		for (const i in t)
			if (!(o && i === "expose")) {
				const a = Qc[i] || (n && n[i])
				e[i] = a ? a(e[i], t[i]) : t[i]
			}
		return e
	}
	var Qc = {
		data: Ti,
		props: zt,
		emits: zt,
		methods: zt,
		computed: zt,
		beforeCreate: De,
		created: De,
		beforeMount: De,
		mounted: De,
		beforeUpdate: De,
		updated: De,
		beforeDestroy: De,
		beforeUnmount: De,
		destroyed: De,
		unmounted: De,
		activated: De,
		deactivated: De,
		errorCaptured: De,
		serverPrefetch: De,
		components: zt,
		directives: zt,
		watch: tu,
		provide: Ti,
		inject: eu
	}
	function Ti(e, t) {
		return t
			? e
				? function () {
					return ve(B(e) ? e.call(this, this) : e, B(t) ? t.call(this, this) : t)
				  }
				: t
			: e
	}
	function eu(e, t) {
		return zt(Zs(e), Zs(t))
	}
	function Zs(e) {
		if (L(e)) {
			const t = {}
			for (let n = 0; n < e.length; n++) t[e[n]] = e[n]
			return t
		}
		return e
	}
	function De(e, t) {
		return e ? [...new Set([].concat(e, t))] : t
	}
	function zt(e, t) {
		return e ? ve(ve(Object.create(null), e), t) : t
	}
	function tu(e, t) {
		if (!e) return t
		if (!t) return e
		const n = ve(Object.create(null), e)
		for (const o in t) n[o] = De(e[o], t[o])
		return n
	}
	function nu(e, t, n, o = !1) {
		const s = {},
			r = {}
		ln(r, Jo, 1), (e.propsDefaults = Object.create(null)), ra(e, t, s, r)
		for (const i in e.propsOptions[0]) i in s || (s[i] = void 0)
		n ? (e.props = o ? s : As(s)) : e.type.props ? (e.props = s) : (e.props = r), (e.attrs = r)
	}
	function ou(e, t, n, o) {
		let {
				props: s,
				attrs: r,
				vnode: { patchFlag: i }
			} = e,
			a = G(s),
			[l] = e.propsOptions,
			c = !1
		if ((o || i > 0) && !(i & 16)) {
			if (i & 8) {
				const u = e.vnode.dynamicProps
				for (let d = 0; d < u.length; d++) {
					const p = u[d]
					if (Bo(e.emitsOptions, p)) continue
					const m = t[p]
					if (l)
						if (Y(r, p)) m !== r[p] && ((r[p] = m), (c = !0))
						else {
							const g = Me(p)
							s[g] = Qs(l, a, g, m, e, !1)
						}
					else m !== r[p] && ((r[p] = m), (c = !0))
				}
			}
		} else {
			ra(e, t, s, r) && (c = !0)
			let u
			for (const d in a) (!t || (!Y(t, d) && ((u = pt(d)) === d || !Y(t, u)))) && (l ? n && (n[d] !== void 0 || n[u] !== void 0) && (s[d] = Qs(l, a, d, void 0, e, !0)) : delete s[d])
			if (r !== a) for (const d in r) (!t || (!Y(t, d) && !0)) && (delete r[d], (c = !0))
		}
		c && st(e, "set", "$attrs")
	}
	function ra(e, t, n, o) {
		let [s, r] = e.propsOptions,
			i = !1,
			a
		if (t)
			for (const l in t) {
				if (Vn(l)) continue
				let c = t[l],
					u
				s && Y(s, (u = Me(l))) ? (!r || !r.includes(u) ? (n[u] = c) : ((a || (a = {}))[u] = c)) : Bo(e.emitsOptions, l) || ((!(l in o) || c !== o[l]) && ((o[l] = c), (i = !0)))
			}
		if (r) {
			const l = G(n),
				c = a || se
			for (let u = 0; u < r.length; u++) {
				const d = r[u]
				n[d] = Qs(s, l, d, c[d], e, !Y(c, d))
			}
		}
		return i
	}
	function Qs(e, t, n, o, s, r) {
		const i = e[n]
		if (i != null) {
			const a = Y(i, "default")
			if (a && o === void 0) {
				const l = i.default
				if (i.type !== Function && B(l)) {
					const { propsDefaults: c } = s
					n in c ? (o = c[n]) : (gn(s), (o = c[n] = l.call(null, t)), Xt())
				} else o = l
			}
			i[0] && (r && !a ? (o = !1) : i[1] && (o === "" || o === pt(n)) && (o = !0))
		}
		return o
	}
	function ia(e, t, n = !1) {
		const o = t.propsCache,
			s = o.get(e)
		if (s) return s
		let r = e.props,
			i = {},
			a = [],
			l = !1
		if (__VUE_OPTIONS_API__ && !B(e)) {
			const u = (d) => {
				l = !0
				const [p, m] = ia(d, t, !0)
				ve(i, p), m && a.push(...m)
			}
			!n && t.mixins.length && t.mixins.forEach(u), e.extends && u(e.extends), e.mixins && e.mixins.forEach(u)
		}
		if (!r && !l) return o.set(e, Ft), Ft
		if (L(r))
			for (let u = 0; u < r.length; u++) {
				const d = Me(r[u])
				Di(d) && (i[d] = se)
			}
		else if (r)
			for (const u in r) {
				const d = Me(u)
				if (Di(d)) {
					const p = r[u],
						m = (i[d] = L(p) || B(p) ? { type: p } : p)
					if (m) {
						const g = Ii(Boolean, m.type),
							O = Ii(String, m.type)
						;(m[0] = g > -1), (m[1] = O < 0 || g < O), (g > -1 || Y(m, "default")) && a.push(d)
					}
				}
			}
		const c = [i, a]
		return o.set(e, c), c
	}
	function Di(e) {
		return e[0] !== "$"
	}
	function $i(e) {
		const t = e && e.toString().match(/^\s*function (\w+)/)
		return t ? t[1] : e === null ? "null" : ""
	}
	function Si(e, t) {
		return $i(e) === $i(t)
	}
	function Ii(e, t) {
		return L(t) ? t.findIndex((n) => Si(n, e)) : B(t) && Si(t, e) ? 0 : -1
	}
	var aa = (e) => e[0] === "_" || e === "$stable",
		ar = (e) => (L(e) ? e.map(it) : [it(e)]),
		su = (e, t, n) => {
			if (t._n) return t
			const o = yn((...s) => ar(t(...s)), n)
			return (o._c = !1), o
		},
		la = (e, t, n) => {
			const o = e._ctx
			for (const s in e) {
				if (aa(s)) continue
				const r = e[s]
				if (B(r)) t[s] = su(s, r, o)
				else if (r != null) {
					const i = ar(r)
					t[s] = () => i
				}
			}
		},
		ca = (e, t) => {
			const n = ar(t)
			e.slots.default = () => n
		},
		ru = (e, t) => {
			if (e.vnode.shapeFlag & 32) {
				const n = t._
				n ? ((e.slots = G(t)), ln(t, "_", n)) : la(t, (e.slots = {}))
			} else (e.slots = {}), t && ca(e, t)
			ln(e.slots, Jo, 1)
		},
		iu = (e, t, n) => {
			let { vnode: o, slots: s } = e,
				r = !0,
				i = se
			if (o.shapeFlag & 32) {
				const a = t._
				a ? (n && a === 1 ? (r = !1) : (ve(s, t), !n && a === 1 && delete s._)) : ((r = !t.$stable), la(t, s)), (i = t)
			} else t && (ca(e, t), (i = { default: 1 }))
			if (r) for (const a in s) !aa(a) && !(a in i) && delete s[a]
		}
	function ua() {
		return {
			app: null,
			config: { isNativeTag: ti, performance: !1, globalProperties: {}, optionMergeStrategies: {}, errorHandler: void 0, warnHandler: void 0, compilerOptions: {} },
			mixins: [],
			components: {},
			directives: {},
			provides: Object.create(null),
			optionsCache: new WeakMap(),
			propsCache: new WeakMap(),
			emitsCache: new WeakMap()
		}
	}
	var au = 0
	function lu(e, t) {
		return function (o, s = null) {
			B(o) || (o = Object.assign({}, o)), s != null && !fe(s) && (s = null)
			let r = ua(),
				i = new Set(),
				a = !1,
				l = (r.app = {
					_uid: au++,
					_component: o,
					_props: s,
					_container: null,
					_context: r,
					_instance: null,
					version: Ai,
					get config() {
						return r.config
					},
					set config(c) {},
					use(c, ...u) {
						return i.has(c) || (c && B(c.install) ? (i.add(c), c.install(l, ...u)) : B(c) && (i.add(c), c(l, ...u))), l
					},
					mixin(c) {
						return __VUE_OPTIONS_API__ && (r.mixins.includes(c) || r.mixins.push(c)), l
					},
					component(c, u) {
						return u ? ((r.components[c] = u), l) : r.components[c]
					},
					directive(c, u) {
						return u ? ((r.directives[c] = u), l) : r.directives[c]
					},
					mount(c, u, d) {
						if (!a) {
							const p = X(o, s)
							return (
								(p.appContext = r),
								u && t ? t(p, c) : e(p, c, d),
								(a = !0),
								(l._container = c),
								(c.__vue_app__ = l),
								__VUE_PROD_DEVTOOLS__ && ((l._instance = p.component), kc(l, Ai)),
								Zo(p.component) || p.component.proxy
							)
						}
					},
					unmount() {
						a && (e(null, l._container), __VUE_PROD_DEVTOOLS__ && ((l._instance = null), Tc(l)), delete l._container.__vue_app__)
					},
					provide(c, u) {
						return (r.provides[c] = u), l
					}
				})
			return l
		}
	}
	function er(e, t, n, o, s = !1) {
		if (L(e)) {
			e.forEach((p, m) => er(p, t && (L(t) ? t[m] : t), n, o, s))
			return
		}
		if (Kn(o) && !s) return
		const r = o.shapeFlag & 4 ? Zo(o.component) || o.component.proxy : o.el,
			i = s ? null : r,
			{ i: a, r: l } = e,
			c = t && t.r,
			u = a.refs === se ? (a.refs = {}) : a.refs,
			d = a.setupState
		if ((c != null && c !== l && (ge(c) ? ((u[c] = null), Y(d, c) && (d[c] = null)) : ye(c) && (c.value = null)), B(l))) gt(l, a, 12, [i, u])
		else {
			const p = ge(l),
				m = ye(l)
			if (p || m) {
				const g = () => {
					if (e.f) {
						const O = p ? u[l] : l.value
						s ? L(O) && mo(O, r) : L(O) ? O.includes(r) || O.push(r) : p ? ((u[l] = [r]), Y(d, l) && (d[l] = u[l])) : ((l.value = [r]), e.k && (u[e.k] = l.value))
					} else p ? ((u[l] = i), Y(d, l) && (d[l] = i)) : m && ((l.value = i), e.k && (u[e.k] = i))
				}
				i ? ((g.id = -1), Re(g, n)) : g()
			}
		}
	}
	function cu() {
		const e = []
		typeof __VUE_OPTIONS_API__ != "boolean" && (Eo().__VUE_OPTIONS_API__ = !0), typeof __VUE_PROD_DEVTOOLS__ != "boolean" && (Eo().__VUE_PROD_DEVTOOLS__ = !1)
	}
	var Re = Fc
	function da(e) {
		return uu(e)
	}
	function uu(e, t) {
		cu()
		const n = Eo()
		;(n.__VUE__ = !0), __VUE_PROD_DEVTOOLS__ && zi(n.__VUE_DEVTOOLS_GLOBAL_HOOK__, n)
		let {
				insert: o,
				remove: s,
				patchProp: r,
				createElement: i,
				createText: a,
				createComment: l,
				setText: c,
				setElementText: u,
				parentNode: d,
				nextSibling: p,
				setScopeId: m = Ie,
				cloneNode: g,
				insertStaticContent: O
			} = e,
			w = (f, h, v, _ = null, b = null, k = null, $ = !1, C = null, T = !!h.dynamicChildren) => {
				if (f === h) return
				f && !Gt(f, h) && ((_ = lo(f)), bt(f, b, k, !0), (f = null)), h.patchFlag === -2 && ((T = !1), (h.dynamicChildren = null))
				const { type: E, ref: A, shapeFlag: P } = h
				switch (E) {
					case Xo:
						S(f, h, v, _)
						break
					case We:
						y(f, h, v, _)
						break
					case pn:
						f == null && M(h, v, _, $)
						break
					case te:
						pe(f, h, v, _, b, k, $, C, T)
						break
					default:
						P & 1 ? N(f, h, v, _, b, k, $, C, T) : P & 6 ? $e(f, h, v, _, b, k, $, C, T) : (P & 64 || P & 128) && E.process(f, h, v, _, b, k, $, C, T, en)
				}
				A != null && b && er(A, f && f.ref, k, h || f, !h)
			},
			S = (f, h, v, _) => {
				if (f == null) o((h.el = a(h.children)), v, _)
				else {
					const b = (h.el = f.el)
					h.children !== f.children && c(b, h.children)
				}
			},
			y = (f, h, v, _) => {
				f == null ? o((h.el = l(h.children || "")), v, _) : (h.el = f.el)
			},
			M = (f, h, v, _) => {
				[f.el, f.anchor] = O(f.children, h, v, _, f.el, f.anchor)
			},
			z = (f, h, v, _) => {
				if (h.children !== f.children) {
					const b = p(f.anchor)
					re(f), ([h.el, h.anchor] = O(h.children, v, b, _))
				} else (h.el = f.el), (h.anchor = f.anchor)
			},
			H = ({ el: f, anchor: h }, v, _) => {
				let b
				for (; f && f !== h; ) (b = p(f)), o(f, v, _), (f = b)
				o(h, v, _)
			},
			re = ({ el: f, anchor: h }) => {
				let v
				for (; f && f !== h; ) (v = p(f)), s(f), (f = v)
				s(h)
			},
			N = (f, h, v, _, b, k, $, C, T) => {
				($ = $ || h.type === "svg"), f == null ? R(h, v, _, b, k, $, C, T) : ue(f, h, b, k, $, C, T)
			},
			R = (f, h, v, _, b, k, $, C) => {
				let T,
					E,
					{ type: A, props: P, shapeFlag: F, transition: W, patchFlag: Q, dirs: ae } = f
				if (f.el && g !== void 0 && Q === -1) T = f.el = g(f.el)
				else {
					if (
						((T = f.el = i(f.type, k, P && P.is, P)),
						F & 8 ? u(T, f.children) : F & 16 && U(f.children, T, null, _, b, k && A !== "foreignObject", $, C),
						ae && Wt(f, null, _, "created"),
						P)
					) {
						for (const ce in P) ce !== "value" && !Vn(ce) && r(T, ce, null, P[ce], k, f.children, _, b, dt)
						"value" in P && r(T, "value", null, P.value), (E = P.onVnodeBeforeMount) && rt(E, _, f)
					}
					Z(T, f, f.scopeId, $, _)
				}
				__VUE_PROD_DEVTOOLS__ && (Object.defineProperty(T, "__vnode", { value: f, enumerable: !1 }), Object.defineProperty(T, "__vueParentComponent", { value: _, enumerable: !1 })),
				ae && Wt(f, null, _, "beforeMount")
				const le = (!b || (b && !b.pendingBranch)) && W && !W.persisted
				le && W.beforeEnter(T),
				o(T, h, v),
				((E = P && P.onVnodeMounted) || le || ae) &&
						Re(() => {
							E && rt(E, _, f), le && W.enter(T), ae && Wt(f, null, _, "mounted")
						}, b)
			},
			Z = (f, h, v, _, b) => {
				if ((v && m(f, v), _)) for (let k = 0; k < _.length; k++) m(f, _[k])
				if (b) {
					const k = b.subTree
					if (h === k) {
						const $ = b.vnode
						Z(f, $, $.scopeId, $.slotScopeIds, b.parent)
					}
				}
			},
			U = (f, h, v, _, b, k, $, C, T = 0) => {
				for (let E = T; E < f.length; E++) {
					const A = (f[E] = C ? Dt(f[E]) : it(f[E]))
					w(null, A, h, v, _, b, k, $, C)
				}
			},
			ue = (f, h, v, _, b, k, $) => {
				let C = (h.el = f.el),
					{ patchFlag: T, dynamicChildren: E, dirs: A } = h
				T |= f.patchFlag & 16
				let P = f.props || se,
					F = h.props || se,
					W
				v && Kt(v, !1), (W = F.onVnodeBeforeUpdate) && rt(W, v, h, f), A && Wt(h, f, v, "beforeUpdate"), v && Kt(v, !0)
				const Q = b && h.type !== "foreignObject"
				if ((E ? x(f.dynamicChildren, E, C, v, _, Q, k) : $ || ut(f, h, C, null, v, _, Q, k, !1), T > 0)) {
					if (T & 16) q(C, h, P, F, v, _, b)
					else if ((T & 2 && P.class !== F.class && r(C, "class", null, F.class, b), T & 4 && r(C, "style", P.style, F.style, b), T & 8)) {
						const ae = h.dynamicProps
						for (let le = 0; le < ae.length; le++) {
							const ce = ae[le],
								Ze = P[ce],
								tn = F[ce]
							;(tn !== Ze || ce === "value") && r(C, ce, Ze, tn, b, f.children, v, _, dt)
						}
					}
					T & 1 && f.children !== h.children && u(C, h.children)
				} else !$ && E == null && q(C, h, P, F, v, _, b)
				;((W = F.onVnodeUpdated) || A) &&
					Re(() => {
						W && rt(W, v, h, f), A && Wt(h, f, v, "updated")
					}, _)
			},
			x = (f, h, v, _, b, k, $) => {
				for (let C = 0; C < h.length; C++) {
					const T = f[C],
						E = h[C],
						A = T.el && (T.type === te || !Gt(T, E) || T.shapeFlag & 70) ? d(T.el) : v
					w(T, E, A, null, _, b, k, $, !0)
				}
			},
			q = (f, h, v, _, b, k, $) => {
				if (v !== _) {
					for (const C in _) {
						if (Vn(C)) continue
						const T = _[C],
							E = v[C]
						T !== E && C !== "value" && r(f, C, E, T, $, h.children, b, k, dt)
					}
					if (v !== se) for (const C in v) !Vn(C) && !(C in _) && r(f, C, v[C], null, $, h.children, b, k, dt)
					"value" in _ && r(f, "value", v.value, _.value)
				}
			},
			pe = (f, h, v, _, b, k, $, C, T) => {
				const E = (h.el = f ? f.el : a("")),
					A = (h.anchor = f ? f.anchor : a("")),
					{ patchFlag: P, dynamicChildren: F, slotScopeIds: W } = h
				W && (C = C ? C.concat(W) : W),
				f == null
					? (o(E, v, _), o(A, v, _), U(h.children, v, A, b, k, $, C, T))
					: P > 0 && P & 64 && F && f.dynamicChildren
						? (x(f.dynamicChildren, F, v, b, k, $, C), (h.key != null || (b && h === b.subTree)) && fa(f, h, !0))
						: ut(f, h, v, A, b, k, $, C, T)
			},
			$e = (f, h, v, _, b, k, $, C, T) => {
				(h.slotScopeIds = C), f == null ? (h.shapeFlag & 512 ? b.ctx.activate(h, v, _, $, T) : ie(h, v, _, b, k, $, T)) : ee(f, h, T)
			},
			ie = (f, h, v, _, b, k, $) => {
				const C = (f.component = _u(f, _, b))
				if ((zo(f) && (C.ctx.renderer = en), bu(C), C.asyncDep)) {
					if ((b && b.registerDep(C, oe), !f.el)) {
						const T = (C.subTree = X(We))
						y(null, T, h, v)
					}
					return
				}
				oe(C, f, h, v, b, k, $)
			},
			ee = (f, h, v) => {
				const _ = (h.component = f.component)
				if (Pc(f, h, v))
					if (_.asyncDep && !_.asyncResolved) {
						Ae(_, h, v)
						return
					} else (_.next = h), Oc(_.update), _.update()
				else (h.el = f.el), (_.vnode = h)
			},
			oe = (f, h, v, _, b, k, $) => {
				const C = () => {
						if (f.isMounted) {
							let { next: A, bu: P, u: F, parent: W, vnode: Q } = f,
								ae = A,
								le
							Kt(f, !1), A ? ((A.el = Q.el), Ae(f, A, $)) : (A = Q), P && an(P), (le = A.props && A.props.onVnodeBeforeUpdate) && rt(le, W, A, Q), Kt(f, !0)
							const ce = Ks(f),
								Ze = f.subTree
							;(f.subTree = ce),
							w(Ze, ce, d(Ze.el), lo(Ze), f, b, k),
							(A.el = ce.el),
							ae === null && Rc(f, ce.el),
							F && Re(F, b),
							(le = A.props && A.props.onVnodeUpdated) && Re(() => rt(le, W, A, Q), b),
							__VUE_PROD_DEVTOOLS__ && qi(f)
						} else {
							let A,
								{ el: P, props: F } = h,
								{ bm: W, m: Q, parent: ae } = f,
								le = Kn(h)
							if ((Kt(f, !1), W && an(W), !le && (A = F && F.onVnodeBeforeMount) && rt(A, ae, h), Kt(f, !0), P && us)) {
								const ce = () => {
									(f.subTree = Ks(f)), us(P, f.subTree, f, b, null)
								}
								le ? h.type.__asyncLoader().then(() => !f.isUnmounted && ce()) : ce()
							} else {
								const ce = (f.subTree = Ks(f))
								w(null, ce, v, _, f, b, k), (h.el = ce.el)
							}
							if ((Q && Re(Q, b), !le && (A = F && F.onVnodeMounted))) {
								const ce = h
								Re(() => rt(A, ae, ce), b)
							}
							(h.shapeFlag & 256 || (ae && Kn(ae.vnode) && ae.vnode.shapeFlag & 256)) && f.a && Re(f.a, b), (f.isMounted = !0), __VUE_PROD_DEVTOOLS__ && Dc(f), (h = v = _ = null)
						}
					},
					T = (f.effect = new Ut(C, () => Li(E), f.scope)),
					E = (f.update = () => T.run())
				;(E.id = f.uid), Kt(f, !0), E()
			},
			Ae = (f, h, v) => {
				h.component = f
				const _ = f.vnode.props
				;(f.vnode = h), (f.next = null), ou(f, h.props, _, v), iu(f, h.children, v), Ct(), Lo(void 0, f.update), xt()
			},
			ut = (f, h, v, _, b, k, $, C, T = !1) => {
				const E = f && f.children,
					A = f ? f.shapeFlag : 0,
					P = h.children,
					{ patchFlag: F, shapeFlag: W } = h
				if (F > 0) {
					if (F & 128) {
						io(E, P, v, _, b, k, $, C, T)
						return
					} else if (F & 256) {
						Pt(E, P, v, _, b, k, $, C, T)
						return
					}
				}
				W & 8 ? (A & 16 && dt(E, b, k), P !== E && u(v, P)) : A & 16 ? (W & 16 ? io(E, P, v, _, b, k, $, C, T) : dt(E, b, k, !0)) : (A & 8 && u(v, ""), W & 16 && U(P, v, _, b, k, $, C, T))
			},
			Pt = (f, h, v, _, b, k, $, C, T) => {
				(f = f || Ft), (h = h || Ft)
				let E = f.length,
					A = h.length,
					P = Math.min(E, A),
					F
				for (F = 0; F < P; F++) {
					const W = (h[F] = T ? Dt(h[F]) : it(h[F]))
					w(f[F], W, v, null, b, k, $, C, T)
				}
				E > A ? dt(f, b, k, !0, !1, P) : U(h, v, _, b, k, $, C, T, P)
			},
			io = (f, h, v, _, b, k, $, C, T) => {
				let E = 0,
					A = h.length,
					P = f.length - 1,
					F = A - 1
				for (; E <= P && E <= F; ) {
					const W = f[E],
						Q = (h[E] = T ? Dt(h[E]) : it(h[E]))
					if (Gt(W, Q)) w(W, Q, v, null, b, k, $, C, T)
					else break
					E++
				}
				for (; E <= P && E <= F; ) {
					const W = f[P],
						Q = (h[F] = T ? Dt(h[F]) : it(h[F]))
					if (Gt(W, Q)) w(W, Q, v, null, b, k, $, C, T)
					else break
					P--, F--
				}
				if (E > P) {
					if (E <= F) {
						const W = F + 1,
							Q = W < A ? h[W].el : _
						for (; E <= F; ) w(null, (h[E] = T ? Dt(h[E]) : it(h[E])), v, Q, b, k, $, C, T), E++
					}
				} else if (E > F) for (; E <= P; ) bt(f[E], b, k, !0), E++
				else {
					const W = E,
						Q = E,
						ae = new Map()
					for (E = Q; E <= F; E++) {
						const Fe = (h[E] = T ? Dt(h[E]) : it(h[E]))
						Fe.key != null && ae.set(Fe.key, E)
					}
					let le,
						ce = 0,
						Ze = F - Q + 1,
						tn = !1,
						Kr = 0,
						Cn = new Array(Ze)
					for (E = 0; E < Ze; E++) Cn[E] = 0
					for (E = W; E <= P; E++) {
						const Fe = f[E]
						if (ce >= Ze) {
							bt(Fe, b, k, !0)
							continue
						}
						let nt
						if (Fe.key != null) nt = ae.get(Fe.key)
						else
							for (le = Q; le <= F; le++)
								if (Cn[le - Q] === 0 && Gt(Fe, h[le])) {
									nt = le
									break
								}
						nt === void 0 ? bt(Fe, b, k, !0) : ((Cn[nt - Q] = E + 1), nt >= Kr ? (Kr = nt) : (tn = !0), w(Fe, h[nt], v, null, b, k, $, C, T), ce++)
					}
					const zr = tn ? du(Cn) : Ft
					for (le = zr.length - 1, E = Ze - 1; E >= 0; E--) {
						const Fe = Q + E,
							nt = h[Fe],
							qr = Fe + 1 < A ? h[Fe + 1].el : _
						Cn[E] === 0 ? w(null, nt, v, qr, b, k, $, C, T) : tn && (le < 0 || E !== zr[le] ? ao(nt, v, qr, 2) : le--)
					}
				}
			},
			ao = (f, h, v, _, b = null) => {
				const { el: k, type: $, transition: C, children: T, shapeFlag: E } = f
				if (E & 6) {
					ao(f.component.subTree, h, v, _)
					return
				}
				if (E & 128) {
					f.suspense.move(h, v, _)
					return
				}
				if (E & 64) {
					$.move(f, h, v, en)
					return
				}
				if ($ === te) {
					o(k, h, v)
					for (let P = 0; P < T.length; P++) ao(T[P], h, v, _)
					o(f.anchor, h, v)
					return
				}
				if ($ === pn) {
					H(f, h, v)
					return
				}
				if (_ !== 2 && E & 1 && C)
					if (_ === 0) C.beforeEnter(k), o(k, h, v), Re(() => C.enter(k), b)
					else {
						let { leave: P, delayLeave: F, afterLeave: W } = C,
							Q = () => o(k, h, v),
							ae = () => {
								P(k, () => {
									Q(), W && W()
								})
							}
						F ? F(k, Q, ae) : ae()
					}
				else o(k, h, v)
			},
			bt = (f, h, v, _ = !1, b = !1) => {
				const { type: k, props: $, ref: C, children: T, dynamicChildren: E, shapeFlag: A, patchFlag: P, dirs: F } = f
				if ((C != null && er(C, null, v, f, !0), A & 256)) {
					h.ctx.deactivate(f)
					return
				}
				let W = A & 1 && F,
					Q = !Kn(f),
					ae
				if ((Q && (ae = $ && $.onVnodeBeforeUnmount) && rt(ae, h, f), A & 6)) El(f.component, v, _)
				else {
					if (A & 128) {
						f.suspense.unmount(v, _)
						return
					}
					W && Wt(f, null, h, "beforeUnmount"),
					A & 64 ? f.type.remove(f, h, v, b, en, _) : E && (k !== te || (P > 0 && P & 64)) ? dt(E, h, v, !1, !0) : ((k === te && P & 384) || (!b && A & 16)) && dt(T, h, v),
					_ && Br(f)
				}
				((Q && (ae = $ && $.onVnodeUnmounted)) || W) &&
					Re(() => {
						ae && rt(ae, h, f), W && Wt(f, null, h, "unmounted")
					}, v)
			},
			Br = (f) => {
				const { type: h, el: v, anchor: _, transition: b } = f
				if (h === te) {
					bl(v, _)
					return
				}
				if (h === pn) {
					re(f)
					return
				}
				const k = () => {
					s(v), b && !b.persisted && b.afterLeave && b.afterLeave()
				}
				if (f.shapeFlag & 1 && b && !b.persisted) {
					let { leave: $, delayLeave: C } = b,
						T = () => $(v, k)
					C ? C(f.el, k, T) : T()
				} else k()
			},
			bl = (f, h) => {
				let v
				for (; f !== h; ) (v = p(f)), s(f), (f = v)
				s(h)
			},
			El = (f, h, v) => {
				const { bum: _, scope: b, update: k, subTree: $, um: C } = f
				_ && an(_),
				b.stop(),
				k && ((k.active = !1), bt($, f, h, v)),
				C && Re(C, h),
				Re(() => {
					f.isUnmounted = !0
				}, h),
				h && h.pendingBranch && !h.isUnmounted && f.asyncDep && !f.asyncResolved && f.suspenseId === h.pendingId && (h.deps--, h.deps === 0 && h.resolve()),
				__VUE_PROD_DEVTOOLS__ && $c(f)
			},
			dt = (f, h, v, _ = !1, b = !1, k = 0) => {
				for (let $ = k; $ < f.length; $++) bt(f[$], h, v, _, b)
			},
			lo = (f) => (f.shapeFlag & 6 ? lo(f.component.subTree) : f.shapeFlag & 128 ? f.suspense.next() : p(f.anchor || f.el)),
			Wr = (f, h, v) => {
				f == null ? h._vnode && bt(h._vnode, null, null, !0) : w(h._vnode || null, f, h, null, null, null, v), Wi(), (h._vnode = f)
			},
			en = { p: w, um: bt, m: ao, r: Br, mt: ie, mc: U, pc: ut, pbc: x, n: lo, o: e },
			cs,
			us
		return t && ([cs, us] = t(en)), { render: Wr, hydrate: cs, createApp: lu(Wr, cs) }
	}
	function Kt({ effect: e, update: t }, n) {
		e.allowRecurse = t.allowRecurse = n
	}
	function fa(e, t, n = !1) {
		const o = e.children,
			s = t.children
		if (L(o) && L(s))
			for (let r = 0; r < o.length; r++) {
				let i = o[r],
					a = s[r]
				a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && ((a = s[r] = Dt(s[r])), (a.el = i.el)), n || fa(i, a))
			}
	}
	function du(e) {
		let t = e.slice(),
			n = [0],
			o,
			s,
			r,
			i,
			a,
			l = e.length
		for (o = 0; o < l; o++) {
			const c = e[o]
			if (c !== 0) {
				if (((s = n[n.length - 1]), e[s] < c)) {
					(t[o] = s), n.push(o)
					continue
				}
				for (r = 0, i = n.length - 1; r < i; ) (a = (r + i) >> 1), e[n[a]] < c ? (r = a + 1) : (i = a)
				c < e[n[r]] && (r > 0 && (t[o] = n[r - 1]), (n[r] = o))
			}
		}
		for (r = n.length, i = n[r - 1]; r-- > 0; ) (n[r] = i), (i = t[i])
		return n
	}
	var fu = (e) => e.__isTeleport
	var te = Symbol(void 0),
		Xo = Symbol(void 0),
		We = Symbol(void 0),
		pn = Symbol(void 0),
		zn = [],
		et = null
	function D(e = !1) {
		zn.push((et = e ? null : []))
	}
	function pu() {
		zn.pop(), (et = zn[zn.length - 1] || null)
	}
	var Gn = 1
	function Mi(e) {
		Gn += e
	}
	function pa(e) {
		return (e.dynamicChildren = Gn > 0 ? et || Ft : null), pu(), Gn > 0 && et && et.push(e), e
	}
	function V(e, t, n, o, s, r) {
		return pa(I(e, t, n, o, s, r, !0))
	}
	function Ne(e, t, n, o, s) {
		return pa(X(e, t, n, o, s, !0))
	}
	function Ho(e) {
		return e ? e.__v_isVNode === !0 : !1
	}
	function Gt(e, t) {
		return e.type === t.type && e.key === t.key
	}
	var Jo = "__vInternal",
		ha = ({ key: e }) => e ?? null,
		Vo = ({ ref: e, ref_key: t, ref_for: n }) => (e != null ? (ge(e) || ye(e) || B(e) ? { i: ke, r: e, k: t, f: !!n } : e) : null)
	function I(e, t = null, n = null, o = 0, s = null, r = e === te ? 0 : 1, i = !1, a = !1) {
		const l = {
			__v_isVNode: !0,
			__v_skip: !0,
			type: e,
			props: t,
			key: t && ha(t),
			ref: t && Vo(t),
			scopeId: Yi,
			slotScopeIds: null,
			children: n,
			component: null,
			suspense: null,
			ssContent: null,
			ssFallback: null,
			dirs: null,
			transition: null,
			el: null,
			anchor: null,
			target: null,
			targetAnchor: null,
			staticCount: 0,
			shapeFlag: r,
			patchFlag: o,
			dynamicProps: s,
			dynamicChildren: null,
			appContext: null
		}
		return a ? (cr(l, n), r & 128 && e.normalize(l)) : n && (l.shapeFlag |= ge(n) ? 8 : 16), Gn > 0 && !i && et && (l.patchFlag > 0 || r & 6) && l.patchFlag !== 32 && et.push(l), l
	}
	var X = hu
	function hu(e, t = null, n = null, o = 0, s = null, r = !1) {
		if (((!e || e === ea) && (e = We), Ho(e))) {
			const a = $t(e, t, !0)
			return n && cr(a, n), Gn > 0 && !r && et && (a.shapeFlag & 6 ? (et[et.indexOf(e)] = a) : et.push(a)), (a.patchFlag |= -2), a
		}
		if ((xu(e) && (e = e.__vccOpts), t)) {
			t = mu(t)
			let { class: a, style: l } = t
			a && !ge(a) && (t.class = Ee(a)), fe(l) && (So(l) && !L(l) && (l = ve({}, l)), (t.style = He(l)))
		}
		const i = ge(e) ? 1 : Ac(e) ? 128 : fu(e) ? 64 : fe(e) ? 4 : B(e) ? 2 : 0
		return I(e, t, n, o, s, i, r, !0)
	}
	function mu(e) {
		return e ? (So(e) || Jo in e ? ve({}, e) : e) : null
	}
	function $t(e, t, n = !1) {
		let { props: o, ref: s, patchFlag: r, children: i } = e,
			a = t ? gu(o || {}, t) : o
		return {
			__v_isVNode: !0,
			__v_skip: !0,
			type: e.type,
			props: a,
			key: a && ha(a),
			ref: t && t.ref ? (n && s ? (L(s) ? s.concat(Vo(t)) : [s, Vo(t)]) : Vo(t)) : s,
			scopeId: e.scopeId,
			slotScopeIds: e.slotScopeIds,
			children: i,
			target: e.target,
			targetAnchor: e.targetAnchor,
			staticCount: e.staticCount,
			shapeFlag: e.shapeFlag,
			patchFlag: t && e.type !== te ? (r === -1 ? 16 : r | 16) : r,
			dynamicProps: e.dynamicProps,
			dynamicChildren: e.dynamicChildren,
			appContext: e.appContext,
			dirs: e.dirs,
			transition: e.transition,
			component: e.component,
			suspense: e.suspense,
			ssContent: e.ssContent && $t(e.ssContent),
			ssFallback: e.ssFallback && $t(e.ssFallback),
			el: e.el,
			anchor: e.anchor
		}
	}
	function lr(e = " ", t = 0) {
		return X(Xo, null, e, t)
	}
	function ma(e, t) {
		const n = X(pn, null, e)
		return (n.staticCount = t), n
	}
	function lt(e = "", t = !1) {
		return t ? (D(), Ne(We, null, e)) : X(We, null, e)
	}
	function it(e) {
		return e == null || typeof e == "boolean" ? X(We) : L(e) ? X(te, null, e.slice()) : typeof e == "object" ? Dt(e) : X(Xo, null, String(e))
	}
	function Dt(e) {
		return e.el === null || e.memo ? e : $t(e)
	}
	function cr(e, t) {
		let n = 0,
			{ shapeFlag: o } = e
		if (t == null) t = null
		else if (L(t)) n = 16
		else if (typeof t == "object")
			if (o & 65) {
				const s = t.default
				s && (s._c && (s._d = !1), cr(e, s()), s._c && (s._d = !0))
				return
			} else {
				n = 32
				const s = t._
				!s && !(Jo in t) ? (t._ctx = ke) : s === 3 && ke && (ke.slots._ === 1 ? (t._ = 1) : ((t._ = 2), (e.patchFlag |= 1024)))
			}
		else B(t) ? ((t = { default: t, _ctx: ke }), (n = 32)) : ((t = String(t)), o & 64 ? ((n = 16), (t = [lr(t)])) : (n = 8))
		;(e.children = t), (e.shapeFlag |= n)
	}
	function gu(...e) {
		const t = {}
		for (let n = 0; n < e.length; n++) {
			const o = e[n]
			for (const s in o)
				if (s === "class") t.class !== o.class && (t.class = Ee([t.class, o.class]))
				else if (s === "style") t.style = He([t.style, o.style])
				else if (rn(s)) {
					const r = t[s],
						i = o[s]
					i && r !== i && !(L(r) && r.includes(i)) && (t[s] = r ? [].concat(r, i) : i)
				} else s !== "" && (t[s] = o[s])
		}
		return t
	}
	function rt(e, t, n, o = null) {
		Be(e, t, 7, [n, o])
	}
	var vu = ua(),
		yu = 0
	function _u(e, t, n) {
		const o = e.type,
			s = (t ? t.appContext : e.appContext) || vu,
			r = {
				uid: yu++,
				vnode: e,
				type: o,
				parent: t,
				appContext: s,
				root: null,
				next: null,
				subTree: null,
				effect: null,
				update: null,
				scope: new An(!0),
				render: null,
				proxy: null,
				exposed: null,
				exposeProxy: null,
				withProxy: null,
				provides: t ? t.provides : Object.create(s.provides),
				accessCache: null,
				renderCache: [],
				components: null,
				directives: null,
				propsOptions: ia(o, s),
				emitsOptions: Gi(o, s),
				emit: null,
				emitted: null,
				propsDefaults: se,
				inheritAttrs: o.inheritAttrs,
				ctx: se,
				data: se,
				props: se,
				attrs: se,
				slots: se,
				refs: se,
				setupState: se,
				setupContext: null,
				suspense: n,
				suspenseId: n ? n.pendingId : 0,
				asyncDep: null,
				asyncResolved: !1,
				isMounted: !1,
				isUnmounted: !1,
				isDeactivated: !1,
				bc: null,
				c: null,
				bm: null,
				m: null,
				bu: null,
				u: null,
				um: null,
				bum: null,
				da: null,
				a: null,
				rtg: null,
				rtc: null,
				ec: null,
				sp: null
			}
		return (r.ctx = { _: r }), (r.root = t ? t.root : r), (r.emit = Ic.bind(null, r)), e.ce && e.ce(r), r
	}
	var we = null,
		ur = () => we || ke,
		gn = (e) => {
			(we = e), e.scope.on()
		},
		Xt = () => {
			we && we.scope.off(), (we = null)
		}
	function ga(e) {
		return e.vnode.shapeFlag & 4
	}
	var Yn = !1
	function bu(e, t = !1) {
		Yn = t
		const { props: n, children: o } = e.vnode,
			s = ga(e)
		nu(e, n, s, t), ru(e, o)
		const r = s ? Eu(e, t) : void 0
		return (Yn = !1), r
	}
	function Eu(e, t) {
		var n
		const o = e.type
		;(e.accessCache = Object.create(null)), (e.proxy = Le(new Proxy(e.ctx, Xc)))
		const { setup: s } = o
		if (s) {
			const r = (e.setupContext = s.length > 1 ? Nu(e) : null)
			gn(e), Ct()
			const i = gt(s, e, 0, [e.props, r])
			if ((xt(), Xt(), ws(i))) {
				if ((i.then(Xt, Xt), t))
					return i
						.then((a) => {
							Vi(e, a, t)
						})
						.catch((a) => {
							jo(a, e, 0)
						})
				e.asyncDep = i
			} else Vi(e, i, t)
		} else va(e, t)
	}
	function Vi(e, t, n) {
		B(t) ? (e.type.__ssrInlineRender ? (e.ssrRender = t) : (e.render = t)) : fe(t) && (__VUE_PROD_DEVTOOLS__ && (e.devtoolsRawSetupState = t), (e.setupState = Mo(t))), va(e, n)
	}
	var Pi, Ri
	function va(e, t, n) {
		const o = e.type
		if (!e.render) {
			if (!t && Pi && !o.render) {
				const s = o.template
				if (s) {
					const { isCustomElement: r, compilerOptions: i } = e.appContext.config,
						{ delimiters: a, compilerOptions: l } = o,
						c = ve(ve({ isCustomElement: r, delimiters: a }, i), l)
					o.render = Pi(s, c)
				}
			}
			(e.render = o.render || Ie), Ri && Ri(e)
		}
		__VUE_OPTIONS_API__ && (gn(e), Ct(), Jc(e), xt(), Xt())
	}
	function wu(e) {
		return new Proxy(e.attrs, {
			get(t, n) {
				return Ve(e, "get", "$attrs"), t[n]
			}
		})
	}
	function Nu(e) {
		let t = (o) => {
				e.exposed = o || {}
			},
			n
		return {
			get attrs() {
				return n || (n = wu(e))
			},
			slots: e.slots,
			emit: e.emit,
			expose: t
		}
	}
	function Zo(e) {
		if (e.exposed)
			return (
				e.exposeProxy ||
				(e.exposeProxy = new Proxy(Mo(Le(e.exposed)), {
					get(t, n) {
						if (n in t) return t[n]
						if (n in Ao) return Ao[n](e)
					}
				}))
			)
	}
	var Ou = /(?:^|[-_])(\w)/g,
		Cu = (e) => e.replace(Ou, (t) => t.toUpperCase()).replace(/[-_]/g, "")
	function ya(e, t = !0) {
		return B(e) ? e.displayName || e.name : e.name || (t && e.__name)
	}
	function _a(e, t, n = !1) {
		let o = ya(t)
		if (!o && t.__file) {
			const s = t.__file.match(/([^/\\]+)\.\w+$/)
			s && (o = s[1])
		}
		if (!o && e && e.parent) {
			const s = (r) => {
				for (const i in r) if (r[i] === t) return i
			}
			o = s(e.components || e.parent.type.components) || s(e.appContext.components)
		}
		return o ? Cu(o) : n ? "App" : "Anonymous"
	}
	function xu(e) {
		return B(e) && "__vccOpts" in e
	}
	var K = (e, t) => wi(e, t, Yn)
	function Qo(e, t, n) {
		const o = arguments.length
		return o === 2 ? (fe(t) && !L(t) ? (Ho(t) ? X(e, null, [t]) : X(e, t)) : X(e, null, t)) : (o > 3 ? (n = Array.prototype.slice.call(arguments, 2)) : o === 3 && Ho(n) && (n = [n]), X(e, t, n))
	}
	var qg = Symbol("")
	var Ai = "3.2.37"
	var ku = "http://www.w3.org/2000/svg",
		Zt = typeof document < "u" ? document : null,
		ba = Zt && Zt.createElement("template"),
		Tu = {
			insert: (e, t, n) => {
				t.insertBefore(e, n || null)
			},
			remove: (e) => {
				const t = e.parentNode
				t && t.removeChild(e)
			},
			createElement: (e, t, n, o) => {
				const s = t ? Zt.createElementNS(ku, e) : Zt.createElement(e, n ? { is: n } : void 0)
				return e === "select" && o && o.multiple != null && s.setAttribute("multiple", o.multiple), s
			},
			createText: (e) => Zt.createTextNode(e),
			createComment: (e) => Zt.createComment(e),
			setText: (e, t) => {
				e.nodeValue = t
			},
			setElementText: (e, t) => {
				e.innerHTML = t
			},
			parentNode: (e) => e.parentNode,
			nextSibling: (e) => e.nextSibling,
			querySelector: (e) => Zt.querySelector(e),
			setScopeId(e, t) {
				e.setAttribute(t, "")
			},
			cloneNode(e) {
				const t = e.cloneNode(!0)
				return "_value" in e && (t._value = e._value), t
			},
			insertStaticContent(e, t, n, o, s, r) {
				const i = n ? n.previousSibling : t.lastChild
				if (s && (s === r || s.nextSibling)) for (; t.insertBefore(s.cloneNode(!0), n), !(s === r || !(s = s.nextSibling)); );
				else {
					ba.innerHTML = o ? `<svg>${e}</svg>` : e
					const a = ba.content
					if (o) {
						const l = a.firstChild
						for (; l.firstChild; ) a.appendChild(l.firstChild)
						a.removeChild(l)
					}
					t.insertBefore(a, n)
				}
				return [i ? i.nextSibling : t.firstChild, n ? n.previousSibling : t.lastChild]
			}
		}
	function Du(e, t, n) {
		const o = e._vtc
		o && (t = (t ? [t, ...o] : [...o]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : (e.className = t)
	}
	function $u(e, t, n) {
		const o = e.style,
			s = ge(n)
		if (n && !s) {
			for (const r in n) pr(o, r, n[r])
			if (t && !ge(t)) for (const r in t) n[r] == null && pr(o, r, "")
		} else {
			const r = o.display
			s ? t !== n && (o.cssText = n) : t && e.removeAttribute("style"), "_vod" in e && (o.display = r)
		}
	}
	var Ea = /\s*!important$/
	function pr(e, t, n) {
		if (L(n)) n.forEach((o) => pr(e, t, o))
		else if ((n == null && (n = ""), t.startsWith("--"))) e.setProperty(t, n)
		else {
			const o = Su(e, t)
			Ea.test(n) ? e.setProperty(pt(o), n.replace(Ea, ""), "important") : (e[o] = n)
		}
	}
	var wa = ["Webkit", "Moz", "ms"],
		dr = {}
	function Su(e, t) {
		const n = dr[t]
		if (n) return n
		let o = Me(t)
		if (o !== "filter" && o in e) return (dr[t] = o)
		o = Ht(o)
		for (let s = 0; s < wa.length; s++) {
			const r = wa[s] + o
			if (r in e) return (dr[t] = r)
		}
		return t
	}
	var Na = "http://www.w3.org/1999/xlink"
	function Iu(e, t, n, o, s) {
		if (o && t.startsWith("xlink:")) n == null ? e.removeAttributeNS(Na, t.slice(6, t.length)) : e.setAttributeNS(Na, t, n)
		else {
			const r = Qr(t)
			n == null || (r && !Es(n)) ? e.removeAttribute(t) : e.setAttribute(t, r ? "" : n)
		}
	}
	function Mu(e, t, n, o, s, r, i) {
		if (t === "innerHTML" || t === "textContent") {
			o && i(o, s, r), (e[t] = n ?? "")
			return
		}
		if (t === "value" && e.tagName !== "PROGRESS" && !e.tagName.includes("-")) {
			e._value = n
			const l = n ?? ""
			;(e.value !== l || e.tagName === "OPTION") && (e.value = l), n == null && e.removeAttribute(t)
			return
		}
		let a = !1
		if (n === "" || n == null) {
			const l = typeof e[t]
			l === "boolean" ? (n = Es(n)) : n == null && l === "string" ? ((n = ""), (a = !0)) : l === "number" && ((n = 0), (a = !0))
		}
		try {
			e[t] = n
		} catch {}
		a && e.removeAttribute(t)
	}
	var [Va, Vu] = (() => {
			let e = Date.now,
				t = !1
			if (typeof window < "u") {
				Date.now() > document.createEvent("Event").timeStamp && (e = performance.now.bind(performance))
				const n = navigator.userAgent.match(/firefox\/(\d+)/i)
				t = !!(n && Number(n[1]) <= 53)
			}
			return [e, t]
		})(),
		hr = 0,
		Pu = Promise.resolve(),
		Ru = () => {
			hr = 0
		},
		Au = () => hr || (Pu.then(Ru), (hr = Va()))
	function bn(e, t, n, o) {
		e.addEventListener(t, n, o)
	}
	function Fu(e, t, n, o) {
		e.removeEventListener(t, n, o)
	}
	function Hu(e, t, n, o, s = null) {
		const r = e._vei || (e._vei = {}),
			i = r[t]
		if (o && i) i.value = o
		else {
			const [a, l] = ju(t)
			if (o) {
				const c = (r[t] = Lu(o, s))
				bn(e, a, c, l)
			} else i && (Fu(e, a, i, l), (r[t] = void 0))
		}
	}
	var Oa = /(?:Once|Passive|Capture)$/
	function ju(e) {
		let t
		if (Oa.test(e)) {
			t = {}
			let n
			for (; (n = e.match(Oa)); ) (e = e.slice(0, e.length - n[0].length)), (t[n[0].toLowerCase()] = !0)
		}
		return [pt(e.slice(2)), t]
	}
	function Lu(e, t) {
		const n = (o) => {
			const s = o.timeStamp || Va()
			;(Vu || s >= n.attached - 1) && Be(Uu(o, n.value), t, 5, [o])
		}
		return (n.value = e), (n.attached = Au()), n
	}
	function Uu(e, t) {
		if (L(t)) {
			const n = e.stopImmediatePropagation
			return (
				(e.stopImmediatePropagation = () => {
					n.call(e), (e._stopped = !0)
				}),
				t.map((o) => (s) => !s._stopped && o && o(s))
			)
		} else return t
	}
	var Ca = /^on[a-z]/,
		Bu = (e, t, n, o, s = !1, r, i, a, l) => {
			t === "class"
				? Du(e, o, s)
				: t === "style"
					? $u(e, n, o)
					: rn(t)
						? Mn(t) || Hu(e, t, n, o, i)
						: (t[0] === "." ? ((t = t.slice(1)), !0) : t[0] === "^" ? ((t = t.slice(1)), !1) : Wu(e, t, o, s))
							? Mu(e, t, o, r, i, a, l)
							: (t === "true-value" ? (e._trueValue = o) : t === "false-value" && (e._falseValue = o), Iu(e, t, o, s))
		}
	function Wu(e, t, n, o) {
		return o
			? !!(t === "innerHTML" || t === "textContent" || (t in e && Ca.test(t) && B(n)))
			: t === "spellcheck" ||
			  t === "draggable" ||
			  t === "translate" ||
			  t === "form" ||
			  (t === "list" && e.tagName === "INPUT") ||
			  (t === "type" && e.tagName === "TEXTAREA") ||
			  (Ca.test(t) && ge(n))
				? !1
				: t in e
	}
	var Mt = "transition",
		Xn = "animation",
		En = (e, { slots: t }) => Qo(sr, Ra(e), t)
	En.displayName = "Transition"
	var Pa = {
			name: String,
			type: String,
			css: { type: Boolean, default: !0 },
			duration: [String, Number, Object],
			enterFromClass: String,
			enterActiveClass: String,
			enterToClass: String,
			appearFromClass: String,
			appearActiveClass: String,
			appearToClass: String,
			leaveFromClass: String,
			leaveActiveClass: String,
			leaveToClass: String
		},
		Ku = (En.props = ve({}, sr.props, Pa)),
		Jt = (e, t = []) => {
			L(e) ? e.forEach((n) => n(...t)) : e && e(...t)
		},
		xa = (e) => (e ? (L(e) ? e.some((t) => t.length > 1) : e.length > 1) : !1)
	function Ra(e) {
		const t = {}
		for (const x in e) x in Pa || (t[x] = e[x])
		if (e.css === !1) return t
		let {
				name: n = "v",
				type: o,
				duration: s,
				enterFromClass: r = `${n}-enter-from`,
				enterActiveClass: i = `${n}-enter-active`,
				enterToClass: a = `${n}-enter-to`,
				appearFromClass: l = r,
				appearActiveClass: c = i,
				appearToClass: u = a,
				leaveFromClass: d = `${n}-leave-from`,
				leaveActiveClass: p = `${n}-leave-active`,
				leaveToClass: m = `${n}-leave-to`
			} = e,
			g = zu(s),
			O = g && g[0],
			w = g && g[1],
			{ onBeforeEnter: S, onEnter: y, onEnterCancelled: M, onLeave: z, onLeaveCancelled: H, onBeforeAppear: re = S, onAppear: N = y, onAppearCancelled: R = M } = t,
			Z = (x, q, pe) => {
				Vt(x, q ? u : a), Vt(x, q ? c : i), pe && pe()
			},
			U = (x, q) => {
				(x._isLeaving = !1), Vt(x, d), Vt(x, m), Vt(x, p), q && q()
			},
			ue = (x) => (q, pe) => {
				const $e = x ? N : y,
					ie = () => Z(q, x, pe)
				Jt($e, [q, ie]),
				ka(() => {
					Vt(q, x ? l : r), _t(q, x ? u : a), xa($e) || Ta(q, o, O, ie)
				})
			}
		return ve(t, {
			onBeforeEnter(x) {
				Jt(S, [x]), _t(x, r), _t(x, i)
			},
			onBeforeAppear(x) {
				Jt(re, [x]), _t(x, l), _t(x, c)
			},
			onEnter: ue(!1),
			onAppear: ue(!0),
			onLeave(x, q) {
				x._isLeaving = !0
				const pe = () => U(x, q)
				_t(x, d),
				Fa(),
				_t(x, p),
				ka(() => {
					!x._isLeaving || (Vt(x, d), _t(x, m), xa(z) || Ta(x, o, w, pe))
				}),
				Jt(z, [x, pe])
			},
			onEnterCancelled(x) {
				Z(x, !1), Jt(M, [x])
			},
			onAppearCancelled(x) {
				Z(x, !0), Jt(R, [x])
			},
			onLeaveCancelled(x) {
				U(x), Jt(H, [x])
			}
		})
	}
	function zu(e) {
		if (e == null) return null
		if (fe(e)) return [fr(e.enter), fr(e.leave)]
		{
			const t = fr(e)
			return [t, t]
		}
	}
	function fr(e) {
		return cn(e)
	}
	function _t(e, t) {
		t.split(/\s+/).forEach((n) => n && e.classList.add(n)), (e._vtc || (e._vtc = new Set())).add(t)
	}
	function Vt(e, t) {
		t.split(/\s+/).forEach((o) => o && e.classList.remove(o))
		const { _vtc: n } = e
		n && (n.delete(t), n.size || (e._vtc = void 0))
	}
	function ka(e) {
		requestAnimationFrame(() => {
			requestAnimationFrame(e)
		})
	}
	var qu = 0
	function Ta(e, t, n, o) {
		const s = (e._endId = ++qu),
			r = () => {
				s === e._endId && o()
			}
		if (n) return setTimeout(r, n)
		const { type: i, timeout: a, propCount: l } = Aa(e, t)
		if (!i) return o()
		let c = i + "end",
			u = 0,
			d = () => {
				e.removeEventListener(c, p), r()
			},
			p = (m) => {
				m.target === e && ++u >= l && d()
			}
		setTimeout(() => {
			u < l && d()
		}, a + 1),
		e.addEventListener(c, p)
	}
	function Aa(e, t) {
		let n = window.getComputedStyle(e),
			o = (g) => (n[g] || "").split(", "),
			s = o(Mt + "Delay"),
			r = o(Mt + "Duration"),
			i = Da(s, r),
			a = o(Xn + "Delay"),
			l = o(Xn + "Duration"),
			c = Da(a, l),
			u = null,
			d = 0,
			p = 0
		t === Mt
			? i > 0 && ((u = Mt), (d = i), (p = r.length))
			: t === Xn
				? c > 0 && ((u = Xn), (d = c), (p = l.length))
				: ((d = Math.max(i, c)), (u = d > 0 ? (i > c ? Mt : Xn) : null), (p = u ? (u === Mt ? r.length : l.length) : 0))
		const m = u === Mt && /\b(transform|all)(,|$)/.test(n[Mt + "Property"])
		return { type: u, timeout: d, propCount: p, hasTransform: m }
	}
	function Da(e, t) {
		for (; e.length < t.length; ) e = e.concat(e)
		return Math.max(...t.map((n, o) => $a(n) + $a(e[o])))
	}
	function $a(e) {
		return Number(e.slice(0, -1).replace(",", ".")) * 1e3
	}
	function Fa() {
		return document.body.offsetHeight
	}
	var Ha = new WeakMap(),
		ja = new WeakMap(),
		Gu = {
			name: "TransitionGroup",
			props: ve({}, Ku, { tag: String, moveClass: String }),
			setup(e, { slots: t }) {
				let n = ur(),
					o = or(),
					s,
					r
				return (
					_n(() => {
						if (!s.length) return
						const i = e.moveClass || `${e.name || "v"}-move`
						if (!Zu(s[0].el, n.vnode.el, i)) return
						s.forEach(Yu), s.forEach(Xu)
						const a = s.filter(Ju)
						Fa(),
						a.forEach((l) => {
							const c = l.el,
								u = c.style
							_t(c, i), (u.transform = u.webkitTransform = u.transitionDuration = "")
							const d = (c._moveCb = (p) => {
								(p && p.target !== c) || ((!p || /transform$/.test(p.propertyName)) && (c.removeEventListener("transitionend", d), (c._moveCb = null), Vt(c, i)))
							})
							c.addEventListener("transitionend", d)
						})
					}),
					() => {
						const i = G(e),
							a = Ra(i),
							l = i.tag || te
						;(s = r), (r = t.default ? Ko(t.default()) : [])
						for (let c = 0; c < r.length; c++) {
							const u = r[c]
							u.key != null && mn(u, hn(u, a, o, n))
						}
						if (s)
							for (let c = 0; c < s.length; c++) {
								const u = s[c]
								mn(u, hn(u, a, o, n)), Ha.set(u, u.el.getBoundingClientRect())
							}
						return X(l, null, r)
					}
				)
			}
		},
		La = Gu
	function Yu(e) {
		const t = e.el
		t._moveCb && t._moveCb(), t._enterCb && t._enterCb()
	}
	function Xu(e) {
		ja.set(e, e.el.getBoundingClientRect())
	}
	function Ju(e) {
		const t = Ha.get(e),
			n = ja.get(e),
			o = t.left - n.left,
			s = t.top - n.top
		if (o || s) {
			const r = e.el.style
			return (r.transform = r.webkitTransform = `translate(${o}px,${s}px)`), (r.transitionDuration = "0s"), e
		}
	}
	function Zu(e, t, n) {
		const o = e.cloneNode()
		e._vtc &&
			e._vtc.forEach((i) => {
				i.split(/\s+/).forEach((a) => a && o.classList.remove(a))
			}),
		n.split(/\s+/).forEach((i) => i && o.classList.add(i)),
		(o.style.display = "none")
		const s = t.nodeType === 1 ? t : t.parentNode
		s.appendChild(o)
		const { hasTransform: r } = Aa(o)
		return s.removeChild(o), r
	}
	var Sa = (e) => {
		const t = e.props["onUpdate:modelValue"] || !1
		return L(t) ? (n) => an(t, n) : t
	}
	function Qu(e) {
		e.target.composing = !0
	}
	function Ia(e) {
		const t = e.target
		t.composing && ((t.composing = !1), t.dispatchEvent(new Event("input")))
	}
	var wn = {
		created(e, { modifiers: { lazy: t, trim: n, number: o } }, s) {
			e._assign = Sa(s)
			const r = o || (s.props && s.props.type === "number")
			bn(e, t ? "change" : "input", (i) => {
				if (i.target.composing) return
				let a = e.value
				n && (a = a.trim()), r && (a = cn(a)), e._assign(a)
			}),
			n &&
					bn(e, "change", () => {
						e.value = e.value.trim()
					}),
			t || (bn(e, "compositionstart", Qu), bn(e, "compositionend", Ia), bn(e, "change", Ia))
		},
		mounted(e, { value: t }) {
			e.value = t ?? ""
		},
		beforeUpdate(e, { value: t, modifiers: { lazy: n, trim: o, number: s } }, r) {
			if (((e._assign = Sa(r)), e.composing || (document.activeElement === e && e.type !== "range" && (n || (o && e.value.trim() === t) || ((s || e.type === "number") && cn(e.value) === t)))))
				return
			const i = t ?? ""
			e.value !== i && (e.value = i)
		}
	}
	var ed = ["ctrl", "shift", "alt", "meta"],
		td = {
			stop: (e) => e.stopPropagation(),
			prevent: (e) => e.preventDefault(),
			self: (e) => e.target !== e.currentTarget,
			ctrl: (e) => !e.ctrlKey,
			shift: (e) => !e.shiftKey,
			alt: (e) => !e.altKey,
			meta: (e) => !e.metaKey,
			left: (e) => "button" in e && e.button !== 0,
			middle: (e) => "button" in e && e.button !== 1,
			right: (e) => "button" in e && e.button !== 2,
			exact: (e, t) => ed.some((n) => e[`${n}Key`] && !t.includes(n))
		},
		ct =
			(e, t) =>
				(n, ...o) => {
					for (let s = 0; s < t.length; s++) {
						const r = td[t[s]]
						if (r && r(n, t)) return
					}
					return e(n, ...o)
				},
		nd = { esc: "escape", space: " ", up: "arrow-up", left: "arrow-left", right: "arrow-right", down: "arrow-down", delete: "backspace" },
		Zn = (e, t) => (n) => {
			if (!("key" in n)) return
			const o = pt(n.key)
			if (t.some((s) => s === o || nd[s] === o)) return e(n)
		},
		mr = {
			beforeMount(e, { value: t }, { transition: n }) {
				(e._vod = e.style.display === "none" ? "" : e.style.display), n && t ? n.beforeEnter(e) : Jn(e, t)
			},
			mounted(e, { value: t }, { transition: n }) {
				n && t && n.enter(e)
			},
			updated(e, { value: t, oldValue: n }, { transition: o }) {
				!t != !n &&
					(o
						? t
							? (o.beforeEnter(e), Jn(e, !0), o.enter(e))
							: o.leave(e, () => {
								Jn(e, !1)
							  })
						: Jn(e, t))
			},
			beforeUnmount(e, { value: t }) {
				Jn(e, t)
			}
		}
	function Jn(e, t) {
		e.style.display = t ? e._vod : "none"
	}
	var od = ve({ patchProp: Bu }, Tu),
		Ma
	function sd() {
		return Ma || (Ma = da(od))
	}
	var Ua = (...e) => {
		const t = sd().createApp(...e),
			{ mount: n } = t
		return (
			(t.mount = (o) => {
				const s = rd(o)
				if (!s) return
				const r = t._component
				!B(r) && !r.render && !r.template && (r.template = s.innerHTML), (s.innerHTML = "")
				const i = n(s, !1, s instanceof SVGElement)
				return s instanceof Element && (s.removeAttribute("v-cloak"), s.setAttribute("data-v-app", "")), i
			}),
			t
		)
	}
	function rd(e) {
		return ge(e) ? document.querySelector(e) : e
	}
	var vr = null
	function Ja(e) {
		vr = e
	}
	function tt() {
		if (!vr) throw new Error("providePlugin() must be called before usePlugin()")
		return { viewModel: vr }
	}
	function Je() {
		const { viewModel: e } = tt()
		return { graph: ht(e.value, "displayedGraph"), switchGraph: e.value.switchGraph }
	}
	function $r(e) {
		const { graph: t } = Je(),
			n = j(null),
			o = j(null)
		return {
			dragging: K(() => !!n.value),
			onPointerDown: (l) => {
				(n.value = { x: l.pageX, y: l.pageY }), (o.value = { x: e.value.x, y: e.value.y })
			},
			onPointerMove: (l) => {
				if (n.value) {
					const c = l.pageX - n.value.x,
						u = l.pageY - n.value.y
					;(e.value.x = o.value.x + c / t.value.scaling), (e.value.y = o.value.y + u / t.value.scaling)
				}
			},
			onPointerUp: () => {
				(n.value = null), (o.value = null)
			}
		}
	}
	function Za() {
		const { graph: e } = Je()
		return {
			transform: (n, o) => {
				const s = n / e.value.scaling - e.value.panning.x,
					r = o / e.value.scaling - e.value.panning.y
				return [s, r]
			}
		}
	}
	function id() {
		let { graph: e } = Je(),
			t = [],
			n = -1,
			o = { x: 0, y: 0 },
			s = K(() => e.value.panning),
			r = $r(s),
			i = K(() => ({ "transform-origin": "0 0", transform: `scale(${e.value.scaling}) translate(${e.value.panning.x}px, ${e.value.panning.y}px)` })),
			a = (m, g, O) => {
				const w = [m / e.value.scaling - e.value.panning.x, g / e.value.scaling - e.value.panning.y],
					S = [m / O - e.value.panning.x, g / O - e.value.panning.y],
					y = [S[0] - w[0], S[1] - w[1]]
				;(e.value.panning.x += y[0]), (e.value.panning.y += y[1]), (e.value.scaling = O)
			},
			l = (m) => {
				m.preventDefault()
				let g = m.deltaY
				m.deltaMode === 1 && (g *= 32)
				const O = e.value.scaling * (1 - g / 3e3)
				a(m.offsetX, m.offsetY, O)
			},
			c = () => ({ ax: t[0].clientX, ay: t[0].clientY, bx: t[1].clientX, by: t[1].clientY })
		return {
			styles: i,
			...r,
			onPointerDown: (m) => {
				if ((t.push(m), r.onPointerDown(m), t.length === 2)) {
					const { ax: g, ay: O, bx: w, by: S } = c()
					o = { x: g + (w - g) / 2, y: O + (S - O) / 2 }
				}
			},
			onPointerMove: (m) => {
				for (let g = 0; g < t.length; g++)
					if (m.pointerId == t[g].pointerId) {
						t[g] = m
						break
					}
				if (t.length == 2) {
					const { ax: g, ay: O, bx: w, by: S } = c(),
						y = g - w,
						M = O - S,
						z = Math.sqrt(y * y + M * M)
					if (n > 0) {
						const H = e.value.scaling * (1 + (z - n) / 500)
						a(o.x, o.y, H)
					}
					n = z
				} else r.onPointerMove(m)
			},
			onPointerUp: (m) => {
				(t = t.filter((g) => g.pointerId !== m.pointerId)), (n = -1), r.onPointerUp()
			},
			onMouseWheel: l
		}
	}
	var Xe = ((e) => ((e[(e.NONE = 0)] = "NONE"), (e[(e.ALLOWED = 1)] = "ALLOWED"), (e[(e.FORBIDDEN = 2)] = "FORBIDDEN"), e))(Xe || {})
	function ad() {
		const { graph: e } = Je(),
			t = j(null),
			n = j(null),
			o = (a) => {
				t.value && ((t.value.mx = a.offsetX / e.value.scaling - e.value.panning.x), (t.value.my = a.offsetY / e.value.scaling - e.value.panning.y))
			},
			s = () => {
				if (n.value) {
					const a = e.value.connections.find((l) => l.to === n.value)
					n.value.isInput && a ? ((t.value = { status: Xe.NONE, from: a.from }), e.value.removeConnection(a)) : (t.value = { status: Xe.NONE, from: n.value }),
					(t.value.mx = void 0),
					(t.value.my = void 0)
				}
			},
			r = () => {
				t.value && n.value && e.value.addConnection(t.value.from, t.value.to), (t.value = null)
			}
		return (
			Wo("hoveredOver", (a) => {
				if (((n.value = a ?? null), a && t.value)) {
					t.value.to = a
					const l = e.value.checkConnection(t.value.from, t.value.to)
					if (((t.value.status = l.connectionAllowed ? Xe.ALLOWED : Xe.FORBIDDEN), l.connectionAllowed)) {
						const c = l.connectionsInDanger.map((u) => u.id)
						e.value.connections.forEach((u) => {
							c.includes(u.id) && (u.isInDanger = !0)
						})
					}
				} else
					!a &&
						t.value &&
						((t.value.to = void 0),
						(t.value.status = Xe.NONE),
						e.value.connections.forEach((l) => {
							l.isInDanger = !1
						}))
			}),
			{ temporaryConnection: t, onMouseMove: o, onMouseDown: s, onMouseUp: r }
		)
	}
	var ld = de({
			setup() {
				const { viewModel: e } = tt(),
					{ graph: t } = Je()
				return {
					styles: K(() => {
						const o = e.value.settings.background,
							s = t.value.panning.x * t.value.scaling,
							r = t.value.panning.y * t.value.scaling,
							i = t.value.scaling * o.gridSize,
							a = i / o.gridDivision,
							l = `${i}px ${i}px, ${i}px ${i}px`,
							c = t.value.scaling > o.subGridVisibleThreshold ? `, ${a}px ${a}px, ${a}px ${a}px` : ""
						return { backgroundPosition: `left ${s}px top ${r}px`, backgroundSize: `${l} ${c}` }
					})
				}
			}
		}),
		ne = (e, t) => {
			const n = e.__vccOpts || e
			for (const [o, s] of t) n[o] = s
			return n
		}
	function cd(e, t, n, o, s, r) {
		return D(), V("div", { class: "background", style: He(e.styles) }, null, 4)
	}
	var ud = ne(ld, [["render", cd]]),
		Ba,
		ro = typeof window < "u",
		dd = (e) => typeof e == "string",
		gr = () => {}
	ro && ((Ba = window?.navigator) == null ? void 0 : Ba.userAgent) && /iP(ad|hone|od)/.test(window.navigator.userAgent)
	function fd(e) {
		return typeof e == "function" ? e() : Io(e)
	}
	function pd(e, t, n = !1) {
		return t.reduce((o, s) => (s in e && (!n || e[s] !== void 0) && (o[s] = e[s]), o), {})
	}
	function hd(e) {
		return Ms() ? (Vs(e), !0) : !1
	}
	var md = Object.defineProperty,
		gd = Object.defineProperties,
		vd = Object.getOwnPropertyDescriptors,
		Wa = Object.getOwnPropertySymbols,
		yd = Object.prototype.hasOwnProperty,
		_d = Object.prototype.propertyIsEnumerable,
		Ka = (e, t, n) => (t in e ? md(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : (e[t] = n)),
		bd = (e, t) => {
			for (var n in t || (t = {})) yd.call(t, n) && Ka(e, n, t[n])
			if (Wa) for (var n of Wa(t)) _d.call(t, n) && Ka(e, n, t[n])
			return e
		},
		Ed = (e, t) => gd(e, vd(t))
	function wd(e) {
		if (!ye(e)) return Ws(e)
		const t = Array.isArray(e.value) ? new Array(e.value.length) : {}
		for (const n in e.value)
			t[n] = Bs(() => ({
				get() {
					return e.value[n]
				},
				set(o) {
					if (Array.isArray(e.value)) {
						const s = [...e.value]
						;(s[n] = o), (e.value = s)
					} else {
						const s = Ed(bd({}, e.value), { [n]: o })
						Object.setPrototypeOf(s, e.value), (e.value = s)
					}
				}
			}))
		return t
	}
	function Qn(e) {
		var t
		const n = fd(e)
		return (t = n?.$el) != null ? t : n
	}
	var Sr = ro ? window : void 0
	ro && window.document
	ro && window.navigator
	ro && window.location
	function Qt(...e) {
		let t, n, o, s
		if ((dd(e[0]) ? (([n, o, s] = e), (t = Sr)) : ([t, n, o, s] = e), !t)) return gr
		let r = gr,
			i = at(
				() => Qn(t),
				(l) => {
					r(),
					l &&
							(l.addEventListener(n, o, s),
							(r = () => {
								l.removeEventListener(n, o, s), (r = gr)
							}))
				},
				{ immediate: !0, flush: "post" }
			),
			a = () => {
				i(), r()
			}
		return hd(a), a
	}
	function yr(e, t, n = {}) {
		const { window: o = Sr, ignore: s, capture: r = !0, detectIframe: i = !1 } = n
		if (!o) return
		let a = j(!0),
			l,
			c = (p) => {
				o.clearTimeout(l)
				const m = Qn(e),
					g = p.composedPath()
				!m ||
					m === p.target ||
					g.includes(m) ||
					!a.value ||
					(s &&
						s.length > 0 &&
						s.some((O) => {
							const w = Qn(O)
							return w && (p.target === w || g.includes(w))
						})) ||
					t(p)
			},
			u = [
				Qt(o, "click", c, { passive: !0, capture: r }),
				Qt(
					o,
					"pointerdown",
					(p) => {
						const m = Qn(e)
						a.value = !!m && !p.composedPath().includes(m)
					},
					{ passive: !0 }
				),
				Qt(
					o,
					"pointerup",
					(p) => {
						if (p.button === 0) {
							const m = p.composedPath()
							;(p.composedPath = () => m), (l = o.setTimeout(() => c(p), 50))
						}
					},
					{ passive: !0 }
				),
				i &&
					Qt(o, "blur", (p) => {
						var m
						const g = Qn(e)
						;((m = document.activeElement) == null ? void 0 : m.tagName) === "IFRAME" && !g?.contains(document.activeElement) && t(p)
					})
			].filter(Boolean)
		return () => u.forEach((p) => p())
	}
	var _r = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {},
		br = "__vueuse_ssr_handlers__"
	_r[br] = _r[br] || {}
	_r[br]
	var Nd = Object.defineProperty,
		Od = Object.defineProperties,
		Cd = Object.getOwnPropertyDescriptors,
		za = Object.getOwnPropertySymbols,
		xd = Object.prototype.hasOwnProperty,
		kd = Object.prototype.propertyIsEnumerable,
		qa = (e, t, n) => (t in e ? Nd(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : (e[t] = n)),
		Td = (e, t) => {
			for (var n in t || (t = {})) xd.call(t, n) && qa(e, n, t[n])
			if (za) for (var n of za(t)) kd.call(t, n) && qa(e, n, t[n])
			return e
		},
		Dd = (e, t) => Od(e, Cd(t)),
		Qa = { x: 0, y: 0, pointerId: 0, pressure: 0, tiltX: 0, tiltY: 0, width: 0, height: 0, twist: 0, pointerType: null },
		$d = Object.keys(Qa)
	function Sd(e = {}) {
		let { target: t = Sr } = e,
			n = j(!1),
			o = j(e.initialValue || {})
		Object.assign(o.value, Qa, o.value)
		const s = (r) => {
			(n.value = !0), !(e.pointerTypes && !e.pointerTypes.includes(r.pointerType)) && (o.value = pd(r, $d, !1))
		}
		return (
			t && (Qt(t, "pointerdown", s, { passive: !0 }), Qt(t, "pointermove", s, { passive: !0 }), Qt(t, "pointerleave", () => (n.value = !1), { passive: !0 })), Dd(Td({}, wd(o)), { isInside: n })
		)
	}
	var Ga
	;(function (e) {
		(e.UP = "UP"), (e.RIGHT = "RIGHT"), (e.DOWN = "DOWN"), (e.LEFT = "LEFT"), (e.NONE = "NONE")
	})(Ga || (Ga = {}))
	var Id = de({
			props: {
				modelValue: { type: Boolean, default: !1 },
				items: { type: Array, required: !0 },
				x: { type: Number, default: 0 },
				y: { type: Number, default: 0 },
				isNested: { type: Boolean, default: !1 },
				isFlipped: { type: Object, default: () => ({ x: !1, y: !1 }) },
				flippable: { type: Boolean, default: !1 }
			},
			emits: ["click", "update:modelValue"],
			setup(e, { emit: t }) {
				let n = null,
					o = j(null),
					s = j(-1),
					r = j(0),
					i = j({ x: !1, y: !1 }),
					a = K(() => e.flippable && (i.value.x || e.isFlipped.x)),
					l = K(() => e.flippable && (i.value.y || e.isFlipped.y)),
					c = K(() => {
						const w = {}
						return e.isNested || ((w.top = (l.value ? e.y - r.value : e.y) + "px"), (w.left = e.x + "px")), w
					}),
					u = K(() => ({ "--flipped-x": a.value, "--flipped-y": l.value, "--nested": e.isNested })),
					d = K(() => e.items.map((w) => ({ ...w, hover: !1 })))
				return (
					at([() => e.y, () => e.items], () => {
						var w, S, y, M, z, H
						r.value = e.items.length * 30
						const re = (y = (S = (w = o.value) == null ? void 0 : w.parentElement) == null ? void 0 : S.offsetWidth) != null ? y : 0,
							N = (H = (z = (M = o.value) == null ? void 0 : M.parentElement) == null ? void 0 : z.offsetHeight) != null ? H : 0
						;(i.value.x = !e.isNested && e.x > re * 0.75), (i.value.y = !e.isNested && e.y + r.value > N - 20)
					}),
					yr(o, () => {
						e.modelValue && t("update:modelValue", !1)
					}),
					{
						el: o,
						activeMenu: s,
						flippedX: a,
						flippedY: l,
						styles: c,
						classes: u,
						itemsWithHoverProperty: d,
						onClick: (w) => {
							!w.submenu && w.value && (t("click", w.value), t("update:modelValue", !1))
						},
						onChildClick: (w) => {
							t("click", w), (s.value = -1), e.isNested || t("update:modelValue", !1)
						},
						onClickOutside: yr,
						onMouseEnter: (w, S) => {
							e.items[S].submenu && ((s.value = S), n !== null && (clearTimeout(n), (n = null)))
						},
						onMouseLeave: (w, S) => {
							e.items[S].submenu &&
								(n = window.setTimeout(() => {
									(s.value = -1), (n = null)
								}, 200))
						}
					}
				)
			}
		}),
		Md = ["onMouseenter", "onMouseleave", "onClick"],
		Vd = { class: "flex-fill" },
		Pd = { key: 0, class: "__submenu-icon", style: { "line-height": "1em" } },
		Rd = I(
			"svg",
			{ width: "13", height: "13", viewBox: "-60 120 250 250" },
			[I("path", { d: "M160.875 279.5625 L70.875 369.5625 L70.875 189.5625 L160.875 279.5625 Z", stroke: "none", fill: "white" })],
			-1
		),
		Ad = [Rd]
	function Fd(e, t, n, o, s, r) {
		const i = _e("context-menu", !0)
		return (
			D(),
			Ne(
				En,
				{ name: "slide-fade" },
				{
					default: yn(() => [
						It(
							I(
								"div",
								{ ref: "el", class: Ee(["baklava-context-menu", e.classes]), style: He(e.styles) },
								[
									(D(!0),
									V(
										te,
										null,
										Ye(
											e.itemsWithHoverProperty,
											(a, l) => (
												D(),
												V(
													te,
													null,
													[
														a.isDivider
															? (D(), V("div", { key: `d-${l}`, class: "divider" }))
															: (D(),
															  V(
																"div",
																{
																	key: `i-${l}`,
																	class: Ee(["item", { submenu: !!a.submenu, "--disabled": !!a.disabled }]),
																	onMouseenter: (c) => e.onMouseEnter(c, l),
																	onMouseleave: (c) => e.onMouseLeave(c, l),
																	onClick: ct((c) => e.onClick(a), ["stop", "prevent"])
																},
																[
																	I("div", Vd, be(a.label), 1),
																	a.submenu ? (D(), V("div", Pd, Ad)) : lt("", !0),
																	a.submenu
																		? (D(),
																			  Ne(
																			i,
																			{
																				key: 1,
																				value: e.activeMenu === l,
																				items: a.submenu,
																				"is-nested": !0,
																				"is-flipped": { x: e.flippedX, y: e.flippedY },
																				flippable: e.flippable,
																				onClick: e.onChildClick
																			},
																			null,
																			8,
																			["value", "items", "is-flipped", "flippable", "onClick"]
																			  ))
																		: lt("", !0)
																],
																42,
																Md
															  ))
													],
													64
												)
											)
										),
										256
									))
								],
								6
							),
							[[mr, e.modelValue]]
						)
					]),
					_: 1
				}
			)
		)
	}
	var Ir = ne(Id, [["render", Fd]]),
		Hd = {},
		jd = {
			xmlns: "http://www.w3.org/2000/svg",
			class: "baklava-icon",
			width: "16",
			height: "16",
			viewBox: "0 0 24 24",
			"stroke-width": "2",
			stroke: "currentColor",
			fill: "none",
			"stroke-linecap": "round",
			"stroke-linejoin": "round"
		},
		Ld = I("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }, null, -1),
		Ud = I("circle", { cx: "12", cy: "12", r: "1" }, null, -1),
		Bd = I("circle", { cx: "12", cy: "19", r: "1" }, null, -1),
		Wd = I("circle", { cx: "12", cy: "5", r: "1" }, null, -1),
		Kd = [Ld, Ud, Bd, Wd]
	function zd(e, t) {
		return D(), V("svg", jd, Kd)
	}
	var el = ne(Hd, [["render", zd]]),
		qd = de({
			props: { node: { type: Object, required: !0 }, intf: { type: Object, required: !0 } },
			setup(e) {
				const { viewModel: t } = tt(),
					n = fn("hoveredOver"),
					o = j(null),
					s = K(() => e.intf.connectionCount > 0),
					r = K(() => ({ "--input": e.intf.isInput, "--output": !e.intf.isInput, "--connected": s.value })),
					i = K(() => e.intf.component && e.intf.connectionCount === 0 && (e.intf.isInput || !e.intf.port)),
					a = () => {
						n(e.intf)
					},
					l = () => {
						n(void 0)
					},
					c = () => {
						o.value && t.value.hooks.renderInterface.execute({ intf: e.intf, el: o.value })
					},
					u = () => {
						const d = t.value.displayedGraph.sidebar
						;(d.nodeId = e.node.id), (d.optionName = e.intf.name), (d.visible = !0)
					}
				return St(c), _n(c), { el: o, isConnected: s, classes: r, showComponent: i, startHover: a, endHover: l, openSidebar: u }
			}
		}),
		Gd = ["id"],
		Yd = { key: 2, class: "align-middle" }
	function Xd(e, t, n, o, s, r) {
		return (
			D(),
			V(
				"div",
				{ id: e.intf.id, ref: "el", class: Ee(["baklava-node-interface", e.classes]) },
				[
					e.intf.port
						? (D(),
						  V(
							"div",
							{
								key: 0,
								class: "__port",
								onPointerover: t[0] || (t[0] = (...i) => e.startHover && e.startHover(...i)),
								onPointerout: t[1] || (t[1] = (...i) => e.endHover && e.endHover(...i))
							},
							null,
							32
						  ))
						: lt("", !0),
					e.showComponent
						? (D(),
						  Ne(
							Yo(e.intf.component),
							{ key: 1, modelValue: e.intf.value, "onUpdate:modelValue": t[2] || (t[2] = (i) => (e.intf.value = i)), node: e.node, intf: e.intf, onOpenSidebar: e.openSidebar },
							null,
							40,
							["modelValue", "node", "intf", "onOpenSidebar"]
						  ))
						: (D(), V("span", Yd, be(e.intf.name), 1))
				],
				10,
				Gd
			)
		)
	}
	var tl = ne(qd, [["render", Xd]]),
		Jd = de({
			components: { ContextMenu: Ir, NodeInterface: tl, VerticalDots: el },
			props: { node: { type: Object, required: !0 }, selected: { type: Boolean, default: !1 } },
			emits: ["select"],
			setup(e, { emit: t }) {
				const { viewModel: n } = tt(),
					{ graph: o, switchGraph: s } = Je(),
					r = $r(ht(e.node, "position")),
					i = j(null),
					a = j(!1),
					l = j(""),
					c = j(null),
					u = j(!1),
					d = K(() => {
						const N = [
							{ value: "rename", label: "Rename" },
							{ value: "delete", label: "Delete" }
						]
						return e.node.type.startsWith(At) && N.push({ value: "editSubgraph", label: "Edit Subgraph" }), N
					}),
					p = K(() => ({ "--selected": e.selected, "--dragging": r.dragging.value, "--two-column": !!e.node.twoColumn })),
					m = K(() => {
						var N, R, Z, U, ue
						return {
							top: `${(R = (N = e.node.position) == null ? void 0 : N.y) != null ? R : 0}px`,
							left: `${(U = (Z = e.node.position) == null ? void 0 : Z.x) != null ? U : 0}px`,
							width: `${(ue = e.node.width) != null ? ue : 200}px`
						}
					}),
					g = K(() => Object.values(e.node.inputs).filter((N) => !N.hidden)),
					O = K(() => Object.values(e.node.outputs).filter((N) => !N.hidden)),
					w = () => {
						t("select", e.node)
					},
					S = (N) => {
						r.onPointerDown(N), document.addEventListener("pointermove", r.onPointerMove), document.addEventListener("pointerup", y), w()
					},
					y = () => {
						r.onPointerUp(), document.removeEventListener("pointermove", r.onPointerMove), document.removeEventListener("pointerup", y)
					},
					M = () => {
						u.value = !0
					},
					z = async (N) => {
						var R
						switch (N) {
							case "delete":
								o.value.removeNode(e.node)
								break
							case "rename":
								(l.value = e.node.title), (a.value = !0), await vn(), (R = c.value) == null || R.focus()
								break
							case "editSubgraph":
								s(e.node.template)
								break
						}
					},
					H = () => {
						(e.node.title = l.value), (a.value = !1)
					},
					re = () => {
						i.value && n.value.hooks.renderNode.execute({ node: e.node, el: i.value })
					}
				return (
					St(re),
					_n(re),
					{
						el: i,
						renaming: a,
						tempName: l,
						renameInputEl: c,
						showContextMenu: u,
						contextMenuItems: d,
						classes: p,
						styles: m,
						displayedInputs: g,
						displayedOutputs: O,
						select: w,
						startDrag: S,
						openContextMenu: M,
						onContextMenuClick: z,
						doneRenaming: H
					}
				)
			}
		}),
		Zd = ["id", "data-node-type"],
		Qd = { class: "__title-label" },
		ef = { class: "__menu" },
		tf = { class: "__content" },
		nf = { class: "__outputs" },
		of = { class: "__inputs" }
	function sf(e, t, n, o, s, r) {
		const i = _e("vertical-dots"),
			a = _e("context-menu"),
			l = _e("NodeInterface")
		return (
			D(),
			V(
				"div",
				{
					id: e.node.id,
					ref: "el",
					class: Ee(["baklava-node", e.classes]),
					style: He(e.styles),
					"data-node-type": e.node.type,
					onPointerdown: t[5] || (t[5] = (...c) => e.select && e.select(...c))
				},
				[
					I(
						"div",
						{ class: "__title", onPointerdown: t[4] || (t[4] = ct((...c) => e.startDrag && e.startDrag(...c), ["self", "stop"])) },
						[
							e.renaming
								? It(
									(D(),
									V(
										"input",
										{
											key: 1,
											ref: "renameInputEl",
											"onUpdate:modelValue": t[1] || (t[1] = (c) => (e.tempName = c)),
											type: "text",
											class: "baklava-input",
											placeholder: "Node Name",
											onBlur: t[2] || (t[2] = (...c) => e.doneRenaming && e.doneRenaming(...c)),
											onKeydown: t[3] || (t[3] = Zn((...c) => e.doneRenaming && e.doneRenaming(...c), ["enter"]))
										},
										null,
										544
									)),
									[[wn, e.tempName]]
								  )
								: (D(),
								  V(
									te,
									{ key: 0 },
									[
										I("div", Qd, be(e.node.title), 1),
										I("div", ef, [
											X(i, { class: "--clickable", onClick: e.openContextMenu }, null, 8, ["onClick"]),
											X(
												a,
												{
													modelValue: e.showContextMenu,
													"onUpdate:modelValue": t[0] || (t[0] = (c) => (e.showContextMenu = c)),
													x: 0,
													y: 0,
													items: e.contextMenuItems,
													onClick: e.onContextMenuClick
												},
												null,
												8,
												["modelValue", "items", "onClick"]
											)
										])
									],
									64
								  ))
						],
						32
					),
					I("div", tf, [
						I("div", nf, [
							(D(!0),
							V(
								te,
								null,
								Ye(e.displayedOutputs, (c) => (D(), Ne(l, { key: c.id, node: e.node, intf: c }, null, 8, ["node", "intf"]))),
								128
							))
						]),
						I("div", of, [
							(D(!0),
							V(
								te,
								null,
								Ye(e.displayedInputs, (c) => (D(), Ne(l, { key: c.id, node: e.node, intf: c }, null, 8, ["node", "intf"]))),
								128
							))
						])
					])
				],
				46,
				Zd
			)
		)
	}
	var nl = ne(Jd, [["render", sf]]),
		rf = de({
			props: {
				x1: { type: Number, required: !0 },
				y1: { type: Number, required: !0 },
				x2: { type: Number, required: !0 },
				y2: { type: Number, required: !0 },
				state: { type: Number, default: Xe.NONE },
				isTemporary: { type: Boolean, default: !1 }
			},
			setup(e) {
				const { viewModel: t } = tt(),
					{ graph: n } = Je(),
					o = (i, a) => {
						const l = (i + n.value.panning.x) * n.value.scaling,
							c = (a + n.value.panning.y) * n.value.scaling
						return [l, c]
					},
					s = K(() => {
						const [i, a] = o(e.x1, e.y1),
							[l, c] = o(e.x2, e.y2)
						if (t.value.settings.useStraightConnections) return `M ${i} ${a} L ${l} ${c}`
						{
							const u = 0.3 * Math.abs(i - l)
							return `M ${i} ${a} C ${i + u} ${a}, ${l - u} ${c}, ${l} ${c}`
						}
					}),
					r = K(() => ({ "--temporary": e.isTemporary, "--allowed": e.state === Xe.ALLOWED, "--forbidden": e.state === Xe.FORBIDDEN }))
				return { d: s, classes: r }
			}
		}),
		af = ["d"]
	function lf(e, t, n, o, s, r) {
		return D(), V("path", { class: Ee(["baklava-connection", e.classes]), d: e.d }, null, 10, af)
	}
	var Mr = ne(rf, [["render", lf]])
	function cf(e) {
		return document.getElementById(e.id)
	}
	function Nn(e) {
		var t
		const n = document.getElementById(e.id),
			o = n?.getElementsByClassName("__port")
		return { node: (t = n?.closest(".baklava-node")) != null ? t : null, interface: n, port: o && o.length > 0 ? o[0] : null }
	}
	var uf = de({
		components: { "connection-view": Mr },
		props: { connection: { type: Object, required: !0 } },
		setup(e) {
			let { graph: t } = Je(),
				n,
				o = j({ x1: 0, y1: 0, x2: 0, y2: 0 }),
				s = K(() => (e.connection.isInDanger ? Xe.FORBIDDEN : Xe.NONE)),
				r = K(() => {
					var c
					return (c = t.value.findNodeById(e.connection.from.nodeId)) == null ? void 0 : c.position
				}),
				i = K(() => {
					var c
					return (c = t.value.findNodeById(e.connection.to.nodeId)) == null ? void 0 : c.position
				}),
				a = (c) =>
					c.node && c.interface && c.port
						? [
							c.node.offsetLeft + c.interface.offsetLeft + c.port.offsetLeft + c.port.clientWidth / 2,
							c.node.offsetTop + c.interface.offsetTop + c.port.offsetTop + c.port.clientHeight / 2
						  ]
						: [0, 0],
				l = () => {
					const c = Nn(e.connection.from),
						u = Nn(e.connection.to)
					c.node &&
						u.node &&
						(n ||
							((n = new ResizeObserver(() => {
								l()
							})),
							n.observe(c.node),
							n.observe(u.node)))
					const [d, p] = a(c),
						[m, g] = a(u)
					o.value = { x1: d, y1: p, x2: m, y2: g }
				}
			return (
				St(async () => {
					await vn(), l()
				}),
				Go(() => {
					n && n.disconnect()
				}),
				at([r, i], () => l(), { deep: !0 }),
				{ d: o, state: s }
			)
		}
	})
	function df(e, t, n, o, s, r) {
		const i = _e("connection-view")
		return D(), Ne(i, { x1: e.d.x1, y1: e.d.y1, x2: e.d.x2, y2: e.d.y2, state: e.state }, null, 8, ["x1", "y1", "x2", "y2", "state"])
	}
	var ol = ne(uf, [["render", df]])
	function ns(e) {
		return e.node && e.interface && e.port
			? [e.node.offsetLeft + e.interface.offsetLeft + e.port.offsetLeft + e.port.clientWidth / 2, e.node.offsetTop + e.interface.offsetTop + e.port.offsetTop + e.port.clientHeight / 2]
			: [0, 0]
	}
	var ff = de({
		components: { "connection-view": Mr },
		props: { connection: { type: Object, required: !0 } },
		setup(e) {
			const t = K(() => (e.connection ? e.connection.status : Xe.NONE))
			return {
				d: K(() => {
					if (!e.connection) return { input: [0, 0], output: [0, 0] }
					const o = ns(Nn(e.connection.from)),
						s = e.connection.to ? ns(Nn(e.connection.to)) : [e.connection.mx || o[0], e.connection.my || o[1]]
					return e.connection.from.isInput ? { input: s, output: o } : { input: o, output: s }
				}),
				status: t
			}
		}
	})
	function pf(e, t, n, o, s, r) {
		const i = _e("connection-view")
		return D(), Ne(i, { x1: e.d.input[0], y1: e.d.input[1], x2: e.d.output[0], y2: e.d.output[1], state: e.status, "is-temporary": "" }, null, 8, ["x1", "y1", "x2", "y2", "state"])
	}
	var sl = ne(ff, [["render", pf]]),
		hf = de({
			setup() {
				const { graph: e } = Je(),
					t = j(null),
					n = j(300),
					o = K(() => {
						const c = e.value.sidebar.nodeId
						return e.value.nodes.find((u) => u.id === c)
					}),
					s = K(() => ({ width: `${n.value}px` })),
					r = K(() => (o.value ? [...Object.values(o.value.inputs), ...Object.values(o.value.outputs)].filter((u) => u.displayInSidebar && u.component) : [])),
					i = () => {
						e.value.sidebar.visible = !1
					},
					a = () => {
						window.addEventListener("mousemove", l),
						window.addEventListener(
							"mouseup",
							() => {
								window.removeEventListener("mousemove", l)
							},
							{ once: !0 }
						)
					},
					l = (c) => {
						var u, d, p
						const m = (p = (d = (u = t.value) == null ? void 0 : u.parentElement) == null ? void 0 : d.getBoundingClientRect().width) != null ? p : 500
						;(n.value -= c.movementX), n.value < 300 ? (n.value = 300) : n.value > 0.9 * m && (n.value = 0.9 * m)
					}
				return { el: t, graph: e, node: o, styles: s, displayedInterfaces: r, startResize: a, close: i }
			}
		}),
		mf = { class: "__header" },
		gf = { class: "__node-name" }
	function vf(e, t, n, o, s, r) {
		return (
			D(),
			V(
				"div",
				{ ref: "el", class: Ee(["baklava-sidebar", { "--open": e.graph.sidebar.visible }]), style: He(e.styles) },
				[
					I("div", { class: "__resizer", onMousedown: t[0] || (t[0] = (...i) => e.startResize && e.startResize(...i)) }, null, 32),
					I("div", mf, [
						I("button", { tabindex: "-1", class: "__close", onClick: t[1] || (t[1] = (...i) => e.close && e.close(...i)) }, " \xD7 "),
						I("div", gf, [I("b", null, be(e.node ? e.node.title : ""), 1)])
					]),
					(D(!0),
					V(
						te,
						null,
						Ye(
							e.displayedInterfaces,
							(i) => (
								D(),
								V("div", { key: i.id, class: "__interface" }, [
									(D(),
									Ne(Yo(i.component), { modelValue: i.value, "onUpdate:modelValue": (a) => (i.value = a), node: e.node, intf: i }, null, 8, [
										"modelValue",
										"onUpdate:modelValue",
										"node",
										"intf"
									]))
								])
							)
						),
						128
					))
				],
				6
			)
		)
	}
	var rl = ne(hf, [["render", vf]]),
		yf = de({
			setup() {
				let { viewModel: e } = tt(),
					{ graph: t } = Je(),
					n = j(null),
					o = j(!1),
					s,
					r = !1,
					i = { x1: 0, y1: 0, x2: 0, y2: 0 },
					a = () => {
						var y, M, z, H, re, N
						if (!s) return
						const R = new Map(),
							Z = new Map()
						for (const x of t.value.nodes) {
							const q = cf(x),
								pe = (y = q?.clientWidth) != null ? y : 0,
								$e = (M = q?.clientHeight) != null ? M : 0,
								ie = (H = (z = x.position) == null ? void 0 : z.x) != null ? H : 0,
								ee = (N = (re = x.position) == null ? void 0 : re.y) != null ? N : 0
							R.set(x, { x1: ie, y1: ee, x2: ie + pe, y2: ee + $e }), Z.set(x, q)
						}
						const U = { x1: Number.MAX_SAFE_INTEGER, y1: Number.MAX_SAFE_INTEGER, x2: Number.MIN_SAFE_INTEGER, y2: Number.MIN_SAFE_INTEGER }
						for (const x of R.values()) x.x1 < U.x1 && (U.x1 = x.x1), x.y1 < U.y1 && (U.y1 = x.y1), x.x2 > U.x2 && (U.x2 = x.x2), x.y2 > U.y2 && (U.y2 = x.y2)
						const ue = 50
						;(U.x1 -= ue), (U.y1 -= ue), (U.x2 += ue), (U.y2 += ue), (i = U), s.clearRect(0, 0, s.canvas.width, s.canvas.height), (s.strokeStyle = "white")
						for (const x of t.value.connections) {
							const [q, pe] = ns(Nn(x.from)),
								[$e, ie] = ns(Nn(x.to)),
								[ee, oe] = l(q, pe),
								[Ae, ut] = l($e, ie)
							if ((s.beginPath(), s.moveTo(ee, oe), e.value.settings.useStraightConnections)) s.lineTo(Ae, ut)
							else {
								const Pt = 0.3 * Math.abs(ee - Ae)
								s.bezierCurveTo(ee + Pt, oe, Ae - Pt, ut, Ae, ut)
							}
							s.stroke()
						}
						s.strokeStyle = "lightgray"
						for (const [x, q] of R.entries()) {
							const [pe, $e] = l(q.x1, q.y1),
								[ie, ee] = l(q.x2, q.y2)
							;(s.fillStyle = u(Z.get(x))), s.beginPath(), s.rect(pe, $e, ie - pe, ee - $e), s.fill(), s.stroke()
						}
						if (o.value) {
							const x = p(),
								[q, pe] = l(x.x1, x.y1),
								[$e, ie] = l(x.x2, x.y2)
							;(s.fillStyle = "rgba(255, 255, 255, 0.2)"), s.fillRect(q, pe, $e - q, ie - pe)
						}
					},
					l = (y, M) => [((y - i.x1) / (i.x2 - i.x1)) * s.canvas.clientWidth, ((M - i.y1) / (i.y2 - i.y1)) * s.canvas.clientHeight],
					c = (y, M) => [(y * (i.x2 - i.x1)) / s.canvas.clientWidth + i.x1, (M * (i.y2 - i.y1)) / s.canvas.clientHeight + i.y1],
					u = (y) => {
						if (y) {
							const M = y.querySelector(".__content")
							if (M) {
								const H = d(M)
								if (H) return H
							}
							const z = d(y)
							if (z) return z
						}
						return "gray"
					},
					d = (y) => {
						const M = getComputedStyle(y).backgroundColor
						if (M && M !== "rgba(0, 0, 0, 0)") return M
					},
					p = () => {
						const y = n.value.parentElement.offsetWidth,
							M = n.value.parentElement.offsetHeight,
							z = y / t.value.scaling - t.value.panning.x,
							H = M / t.value.scaling - t.value.panning.y
						return { x1: -t.value.panning.x, y1: -t.value.panning.y, x2: z, y2: H }
					},
					m = (y) => {
						y.button === 0 && ((r = !0), g(y))
					},
					g = (y) => {
						if (r) {
							const [M, z] = c(y.offsetX, y.offsetY),
								H = p(),
								re = (H.x1 - H.x2) / 2,
								N = (H.y1 - H.y2) / 2
							;(t.value.panning.x = -(M + re)), (t.value.panning.y = -(z + N))
						}
					},
					O = () => {
						r = !1
					},
					w = () => {
						o.value = !0
					},
					S = () => {
						(o.value = !1), O()
					}
				return (
					St(() => {
						(s = n.value.getContext("2d")), (s.imageSmoothingQuality = "high"), a()
					}),
					{ canvas: n, showViewBounds: o, mousedown: m, mousemove: g, mouseup: O, mouseenter: w, mouseleave: S }
				)
			}
		})
	function _f(e, t, n, o, s, r) {
		return (
			D(),
			V(
				"canvas",
				{
					ref: "canvas",
					class: "baklava-minimap",
					onMouseenter: t[0] || (t[0] = (...i) => e.mouseenter && e.mouseenter(...i)),
					onMouseleave: t[1] || (t[1] = (...i) => e.mouseleave && e.mouseleave(...i)),
					onMousedown: t[2] || (t[2] = ct((...i) => e.mousedown && e.mousedown(...i), ["self"])),
					onMousemove: t[3] || (t[3] = ct((...i) => e.mousemove && e.mousemove(...i), ["self"])),
					onMouseup: t[4] || (t[4] = (...i) => e.mouseup && e.mouseup(...i))
				},
				null,
				544
			)
		)
	}
	var il = ne(yf, [["render", _f]]),
		bf = de({
			components: { ContextMenu: Ir, VerticalDots: el },
			props: { type: { type: String, required: !0 }, title: { type: String, required: !0 } },
			setup(e) {
				const { viewModel: t } = tt(),
					{ switchGraph: n } = Je(),
					o = j(!1),
					s = K(() => e.type.startsWith(At))
				return {
					showContextMenu: o,
					hasContextMenu: s,
					contextMenuItems: [
						{ label: "Edit Subgraph", value: "editSubgraph" },
						{ label: "Delete Subgraph", value: "deleteSubgraph" }
					],
					openContextMenu: () => {
						o.value = !0
					},
					onContextMenuClick: (l) => {
						const c = e.type.substring(At.length),
							u = t.value.editor.graphTemplates.find((d) => d.id === c)
						if (u)
							switch (l) {
								case "editSubgraph":
									n(u)
									break
								case "deleteSubgraph":
									t.value.editor.removeGraphTemplate(u)
									break
							}
					}
				}
			}
		}),
		Ef = ["data-node-type"],
		wf = { class: "__title" },
		Nf = { class: "__title-label" },
		Of = { key: 0, class: "__menu" }
	function Cf(e, t, n, o, s, r) {
		const i = _e("vertical-dots"),
			a = _e("context-menu")
		return (
			D(),
			V(
				"div",
				{ class: "baklava-node --palette", "data-node-type": e.type },
				[
					I("div", wf, [
						I("div", Nf, be(e.title), 1),
						e.hasContextMenu
							? (D(),
							  V("div", Of, [
								X(i, { class: "--clickable", onPointerdown: t[0] || (t[0] = ct(() => {}, ["stop", "prevent"])), onClick: ct(e.openContextMenu, ["stop", "prevent"]) }, null, 8, [
									"onClick"
								]),
								X(
									a,
									{
										modelValue: e.showContextMenu,
										"onUpdate:modelValue": t[1] || (t[1] = (l) => (e.showContextMenu = l)),
										x: -100,
										y: 0,
										items: e.contextMenuItems,
										onClick: e.onContextMenuClick,
										onPointerdown: t[2] || (t[2] = ct(() => {}, ["stop", "prevent"]))
									},
									null,
									8,
									["modelValue", "items", "onClick"]
								)
							  ]))
							: lt("", !0)
					])
				],
				8,
				Ef
			)
		)
	}
	var xf = ne(bf, [["render", Cf]]),
		es,
		kf = new Uint8Array(16)
	function Tf() {
		if (
			!es &&
			((es =
				(typeof crypto < "u" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
				(typeof msCrypto < "u" && typeof msCrypto.getRandomValues == "function" && msCrypto.getRandomValues.bind(msCrypto))),
			!es)
		)
			throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported")
		return es(kf)
	}
	var Df = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i
	function $f(e) {
		return typeof e == "string" && Df.test(e)
	}
	var Ce = []
	for (ts = 0; ts < 256; ++ts) Ce.push((ts + 256).toString(16).substr(1))
	var ts
	function Sf(e) {
		var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0,
			n = (
				Ce[e[t + 0]] +
				Ce[e[t + 1]] +
				Ce[e[t + 2]] +
				Ce[e[t + 3]] +
				"-" +
				Ce[e[t + 4]] +
				Ce[e[t + 5]] +
				"-" +
				Ce[e[t + 6]] +
				Ce[e[t + 7]] +
				"-" +
				Ce[e[t + 8]] +
				Ce[e[t + 9]] +
				"-" +
				Ce[e[t + 10]] +
				Ce[e[t + 11]] +
				Ce[e[t + 12]] +
				Ce[e[t + 13]] +
				Ce[e[t + 14]] +
				Ce[e[t + 15]]
			).toLowerCase()
		if (!$f(n)) throw TypeError("Stringified UUID is invalid")
		return n
	}
	function eo(e, t, n) {
		e = e || {}
		var o = e.random || (e.rng || Tf)()
		if (((o[6] = (o[6] & 15) | 64), (o[8] = (o[8] & 63) | 128), t)) {
			n = n || 0
			for (var s = 0; s < 16; ++s) t[n + s] = o[s]
			return t
		}
		return Sf(o)
	}
	var If = de({
			props: { intf: { type: Object, required: !0 } },
			setup(e) {
				return {
					onClick: () => {
						e.intf.callback && e.intf.callback()
					}
				}
			}
		}),
		Mf = ["title"]
	function Vf(e, t, n, o, s, r) {
		return D(), V("button", { class: "baklava-button --block", title: e.intf.name, onClick: t[0] || (t[0] = (...i) => e.onClick && e.onClick(...i)) }, be(e.intf.name), 9, Mf)
	}
	var al = ne(If, [["render", Vf]]),
		Er = class extends xe {
			constructor(t, n) {
				super(t, void 0), (this.component = Le(al)), (this.callback = n), this.setPort(!1)
			}
		},
		Pf = de({ props: { intf: { type: Object, required: !0 } } }),
		Rf = ["title"],
		Af = I(
			"div",
			{ class: "__checkmark-container" },
			[
				I("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 18 18" }, [
					I("path", { class: "__checkmark", d: "M 6 5 L 6 10 L 16 10", transform: "rotate(-45 10 10)" })
				])
			],
			-1
		),
		Ff = { class: "__label" }
	function Hf(e, t, n, o, s, r) {
		return (
			D(),
			V(
				"div",
				{ class: Ee(["baklava-checkbox", { "--checked": e.intf.value }]), title: e.intf.name, onClick: t[0] || (t[0] = (i) => (e.intf.value = !e.intf.value)) },
				[Af, I("div", Ff, be(e.intf.name), 1)],
				10,
				Rf
			)
		)
	}
	var ll = ne(Pf, [["render", Hf]]),
		wr = class extends xe {
			constructor() {
				super(...arguments), (this.component = Le(ll))
			}
		},
		Ya = 9
	function jf(e) {
		return "validate" in e
	}
	var to = class extends xe {
			constructor(t, n, o, s) {
				super(t, n), (this.min = o), (this.max = s)
			}
			validate(t) {
				return (!this.min || t >= this.min) && (!this.max || t <= this.max)
			}
		},
		Vr = (e, t = 3) => {
			const n = j(null),
				o = j(!1),
				s = j(!1),
				r = j("0"),
				i = K(() => {
					const d = e.value.value.toFixed(t)
					return d.length > Ya ? e.value.value.toExponential(Ya - 5) : d
				}),
				a = (d) => (Number.isNaN(d) ? !1 : jf(e.value) ? e.value.validate(d) : !0),
				l = (d) => {
					a(d) && (e.value.value = d)
				}
			return (
				at(r, () => {
					s.value = !1
				}),
				{
					editMode: o,
					invalid: s,
					tempValue: r,
					inputEl: n,
					stringRepresentation: i,
					validate: a,
					setValue: l,
					enterEditMode: async () => {
						(r.value = e.value.value.toFixed(t)), (o.value = !0), await vn(), n.value && n.value.focus()
					},
					leaveEditMode: () => {
						const d = parseFloat(r.value)
						a(d) ? (l(d), (o.value = !1)) : (s.value = !0)
					}
				}
			)
		},
		Lf = {},
		Uf = {
			xmlns: "http://www.w3.org/2000/svg",
			class: "baklava-icon",
			width: "24",
			height: "24",
			viewBox: "0 0 24 24",
			"stroke-width": "2",
			stroke: "currentColor",
			fill: "none",
			"stroke-linecap": "round",
			"stroke-linejoin": "round"
		},
		Bf = I("polyline", { points: "6 9 12 15 18 9" }, null, -1),
		Wf = [Bf]
	function Kf(e, t) {
		return D(), V("svg", Uf, Wf)
	}
	var Pr = ne(Lf, [["render", Kf]]),
		zf = de({
			components: { "i-arrow": Pr },
			props: { intf: { type: Object, required: !0 } },
			setup(e) {
				const t = Vr(ht(e, "intf"), 0)
				return {
					...t,
					increment: () => {
						t.setValue(e.intf.value + 1)
					},
					decrement: () => {
						t.setValue(e.intf.value - 1)
					}
				}
			}
		}),
		qf = { class: "baklava-num-input" },
		Gf = ["title"],
		Yf = { class: "__value" },
		Xf = { key: 1, class: "__content" }
	function Jf(e, t, n, o, s, r) {
		const i = _e("i-arrow")
		return (
			D(),
			V("div", qf, [
				I("div", { class: "__button --dec", onClick: t[0] || (t[0] = (...a) => e.decrement && e.decrement(...a)) }, [X(i)]),
				e.editMode
					? (D(),
					  V("div", Xf, [
						It(
							I(
								"input",
								{
									ref: "inputEl",
									"onUpdate:modelValue": t[2] || (t[2] = (a) => (e.tempValue = a)),
									type: "number",
									class: Ee(["baklava-input", { "--invalid": e.invalid }]),
									style: { "text-align": "right" },
									onBlur: t[3] || (t[3] = (...a) => e.leaveEditMode && e.leaveEditMode(...a)),
									onKeydown: t[4] || (t[4] = Zn((...a) => e.leaveEditMode && e.leaveEditMode(...a), ["enter"]))
								},
								null,
								34
							),
							[[wn, e.tempValue]]
						)
					  ]))
					: (D(),
					  V("div", { key: 0, class: "__content", onClick: t[1] || (t[1] = (...a) => e.enterEditMode && e.enterEditMode(...a)) }, [
						I("div", { class: "__label", title: e.intf.name }, be(e.intf.name), 9, Gf),
						I("div", Yf, be(e.stringRepresentation), 1)
					  ])),
				I("div", { class: "__button --inc", onClick: t[5] || (t[5] = (...a) => e.increment && e.increment(...a)) }, [X(i)])
			])
		)
	}
	var cl = ne(zf, [["render", Jf]]),
		Nr = class extends to {
			constructor() {
				super(...arguments), (this.component = Le(cl))
			}
			validate(t) {
				return Number.isInteger(t) && super.validate(t)
			}
		},
		Zf = de({
			components: { "i-arrow": Pr },
			props: { intf: { type: Object, required: !0 } },
			setup(e) {
				const t = Vr(ht(e, "intf"))
				return {
					...t,
					increment: () => {
						t.setValue(e.intf.value + 0.1)
					},
					decrement: () => {
						t.setValue(e.intf.value - 0.1)
					}
				}
			}
		}),
		Qf = { class: "baklava-num-input" },
		ep = ["title"],
		tp = { class: "__value" },
		np = { key: 1, class: "__content" }
	function op(e, t, n, o, s, r) {
		const i = _e("i-arrow")
		return (
			D(),
			V("div", Qf, [
				I("div", { class: "__button --dec", onClick: t[0] || (t[0] = (...a) => e.decrement && e.decrement(...a)) }, [X(i)]),
				e.editMode
					? (D(),
					  V("div", np, [
						It(
							I(
								"input",
								{
									ref: "inputEl",
									"onUpdate:modelValue": t[2] || (t[2] = (a) => (e.tempValue = a)),
									type: "number",
									class: Ee(["baklava-input", { "--invalid": e.invalid }]),
									style: { "text-align": "right" },
									onBlur: t[3] || (t[3] = (...a) => e.leaveEditMode && e.leaveEditMode(...a)),
									onKeydown: t[4] || (t[4] = Zn((...a) => e.leaveEditMode && e.leaveEditMode(...a), ["enter"]))
								},
								null,
								34
							),
							[[wn, e.tempValue]]
						)
					  ]))
					: (D(),
					  V("div", { key: 0, class: "__content", onClick: t[1] || (t[1] = (...a) => e.enterEditMode && e.enterEditMode(...a)) }, [
						I("div", { class: "__label", title: e.intf.name }, be(e.intf.name), 9, ep),
						I("div", tp, be(e.stringRepresentation), 1)
					  ])),
				I("div", { class: "__button --inc", onClick: t[5] || (t[5] = (...a) => e.increment && e.increment(...a)) }, [X(i)])
			])
		)
	}
	var ul = ne(Zf, [["render", op]]),
		Or = class extends to {
			constructor() {
				super(...arguments), (this.component = Le(ul))
			}
		},
		sp = de({
			components: { "i-arrow": Pr },
			props: { intf: { type: Object, required: !0 } },
			setup(e) {
				const t = j(null),
					n = j(!1),
					o = K(() => e.intf.items.find((i) => (typeof i == "string" ? i === e.intf.value : i.value === e.intf.value))),
					s = K(() => (o.value ? (typeof o.value == "string" ? o.value : o.value.text) : "")),
					r = (i) => {
						e.intf.value = typeof i == "string" ? i : i.value
					}
				return (
					yr(t, () => {
						n.value = !1
					}),
					{ el: t, open: n, selectedItem: o, selectedText: s, setSelected: r }
				)
			}
		}),
		rp = ["title"],
		ip = { class: "__selected" },
		ap = { class: "__text" },
		lp = { class: "__icon" },
		cp = { class: "__dropdown" },
		up = { class: "item --header" },
		dp = ["onClick"]
	function fp(e, t, n, o, s, r) {
		const i = _e("i-arrow")
		return (
			D(),
			V(
				"div",
				{ ref: "el", class: Ee(["baklava-select", { "--open": e.open }]), title: e.intf.name, onClick: t[0] || (t[0] = (a) => (e.open = !e.open)) },
				[
					I("div", ip, [I("div", ap, be(e.selectedText), 1), I("div", lp, [X(i)])]),
					X(
						En,
						{ name: "slide-fade" },
						{
							default: yn(() => [
								It(
									I(
										"div",
										cp,
										[
											I("div", up, be(e.intf.name), 1),
											(D(!0),
											V(
												te,
												null,
												Ye(
													e.intf.items,
													(a, l) => (
														D(),
														V(
															"div",
															{ key: l, class: Ee(["item", { "--active": a === e.selectedItem }]), onClick: (c) => e.setSelected(a) },
															be(typeof a == "string" ? a : a.text),
															11,
															dp
														)
													)
												),
												128
											))
										],
										512
									),
									[[mr, e.open]]
								)
							]),
							_: 1
						}
					)
				],
				10,
				rp
			)
		)
	}
	var dl = ne(sp, [["render", fp]]),
		Cr = class extends xe {
			constructor(t, n, o) {
				super(t, n), (this.component = Le(dl)), (this.items = o)
			}
		},
		pp = de({
			props: { intf: { type: Object, required: !0 } },
			setup(e) {
				const t = j(null),
					n = Vr(ht(e, "intf")),
					o = j(!1),
					s = j(!1),
					r = K(() => Math.min(100, Math.max(0, (e.intf.value * 100) / (e.intf.max - e.intf.min))))
				return {
					...n,
					el: t,
					percentage: r,
					mousedown: () => {
						n.editMode.value || (s.value = !0)
					},
					mouseup: () => {
						n.editMode.value || (o.value || n.enterEditMode(), (s.value = !1), (o.value = !1))
					},
					mousemove: (u) => {
						if (n.editMode.value) return
						const d = Math.max(e.intf.min, Math.min(e.intf.max, (e.intf.max - e.intf.min) * (u.offsetX / t.value.clientWidth) + e.intf.min))
						s.value && (n.setValue(d), (o.value = !0))
					},
					mouseleave: (u) => {
						n.editMode.value || (s.value && (u.offsetX >= t.value.clientWidth ? n.setValue(e.intf.max) : u.offsetX <= 0 && n.setValue(e.intf.min)), (s.value = !1), (o.value = !1))
					}
				}
			}
		}),
		hp = { key: 0, class: "__content" },
		mp = { class: "__label" },
		gp = { class: "__value" },
		vp = { key: 1, class: "__content" }
	function yp(e, t, n, o, s, r) {
		return (
			D(),
			V(
				"div",
				{
					ref: "el",
					class: Ee(["baklava-slider", { "baklava-ignore-mouse": !e.editMode }]),
					onPointerdown: t[3] || (t[3] = (...i) => e.mousedown && e.mousedown(...i)),
					onPointerup: t[4] || (t[4] = (...i) => e.mouseup && e.mouseup(...i)),
					onPointermove: t[5] || (t[5] = (...i) => e.mousemove && e.mousemove(...i)),
					onPointerleave: t[6] || (t[6] = (...i) => e.mouseleave && e.mouseleave(...i))
				},
				[
					I("div", { class: "__slider", style: He({ width: e.percentage + "%" }) }, null, 4),
					e.editMode
						? (D(),
						  V("div", vp, [
							It(
								I(
									"input",
									{
										ref: "inputEl",
										"onUpdate:modelValue": t[0] || (t[0] = (i) => (e.tempValue = i)),
										type: "number",
										class: Ee(["baklava-input", { "--invalid": e.invalid }]),
										style: { "text-align": "right" },
										onBlur: t[1] || (t[1] = (...i) => e.leaveEditMode && e.leaveEditMode(...i)),
										onKeydown: t[2] || (t[2] = Zn((...i) => e.leaveEditMode && e.leaveEditMode(...i), ["enter"]))
									},
									null,
									34
								),
								[[wn, e.tempValue]]
							)
						  ]))
						: (D(), V("div", hp, [I("div", mp, be(e.intf.name), 1), I("div", gp, be(e.stringRepresentation), 1)]))
				],
				34
			)
		)
	}
	var fl = ne(pp, [["render", yp]]),
		xr = class extends to {
			constructor(t, n, o, s) {
				super(t, n, o, s), (this.component = Le(fl)), (this.min = o), (this.max = s)
			}
		},
		_p = de({ props: { intf: { type: Object, required: !0 } } })
	function bp(e, t, n, o, s, r) {
		return D(), V("div", null, be(e.intf.value), 1)
	}
	var Ep = ne(_p, [["render", bp]]),
		kr = class extends xe {
			constructor(t, n) {
				super(t, n), (this.component = Le(Ep)), this.setPort(!1)
			}
		},
		wp = de({
			props: { intf: { type: Object, required: !0 }, modelValue: { type: String, required: !0 } },
			emits: ["update:modelValue"],
			setup(e, { emit: t }) {
				return {
					v: K({
						get: () => e.modelValue,
						set: (o) => {
							t("update:modelValue", o)
						}
					})
				}
			}
		}),
		Np = ["placeholder", "title"]
	function Op(e, t, n, o, s, r) {
		return (
			D(),
			V("div", null, [
				It(I("input", { "onUpdate:modelValue": t[0] || (t[0] = (i) => (e.v = i)), type: "text", class: "baklava-input", placeholder: e.intf.name, title: e.intf.name }, null, 8, Np), [
					[wn, e.v]
				])
			])
		)
	}
	var pl = ne(wp, [["render", Op]]),
		no = class extends xe {
			constructor() {
				super(...arguments), (this.component = Le(pl))
			}
		},
		oo = "__baklava_SubgraphInputNode",
		so = "__baklava_SubgraphOutputNode",
		hl = po({
			type: oo,
			title: "Subgraph Input",
			inputs: { name: () => new no("Name", "Input").setPort(!1) },
			outputs: { placeholder: () => new xe("Connection", void 0) },
			onCreate() {
				this.graphInterfaceId = eo()
			}
		}),
		ml = po({
			type: so,
			title: "Subgraph Output",
			inputs: { name: () => new no("Name", "Output").setPort(!1), placeholder: () => new xe("Connection", void 0) },
			onCreate() {
				this.graphInterfaceId = eo()
			}
		})
	function gl(e, t, n) {
		if (!t.template) return !1
		if (ot(t.template) === n) return !0
		const o = e.graphTemplates.find((r) => ot(r) === n)
		return o ? o.nodes.filter((r) => r.type.startsWith(At)).some((r) => gl(e, t, r.type)) : !1
	}
	var Cp = de({
			components: { PaletteEntry: xf },
			setup() {
				const { viewModel: e } = tt(),
					{ x: t, y: n } = Sd(),
					{ transform: o } = Za(),
					s = fn("editorEl"),
					r = j(null),
					i = K(() => {
						const c = Array.from(e.value.editor.nodeTypes.entries()),
							u = new Set(c.map(([, p]) => p.category)),
							d = []
						for (const p of u.values()) {
							let m = c.filter(([, g]) => g.category === p)
							e.value.displayedGraph.template ? (m = m.filter(([g]) => !gl(e.value.editor, e.value.displayedGraph, g))) : (m = m.filter(([g]) => ![oo, so].includes(g))),
							m.length > 0 && d.push({ name: p, nodeTypes: Object.fromEntries(m) })
						}
						return d.sort((p, m) => (p.name === "default" ? -1 : m.name === "default" || p.name > m.name ? 1 : -1)), d
					}),
					a = K(() => {
						if (!r.value || !s?.value) return {}
						const { left: c, top: u } = s.value.getBoundingClientRect()
						return { top: `${n.value - u}px`, left: `${t.value - c}px` }
					})
				return {
					draggedNode: r,
					categories: i,
					draggedNodeStyles: a,
					onDragStart: (c, u) => {
						r.value = { type: c, nodeInformation: u }
						const d = () => {
							const p = Pe(new u.type())
							e.value.displayedGraph.addNode(p)
							const m = s.value.getBoundingClientRect(),
								[g, O] = o(t.value - m.left, n.value - m.top)
							;(p.position.x = g), (p.position.y = O), (r.value = null), document.removeEventListener("pointerup", d)
						}
						document.addEventListener("pointerup", d)
					},
					mouseX: t,
					mouseY: n
				}
			}
		}),
		xp = { class: "baklava-node-palette" },
		kp = { key: 0 }
	function Tp(e, t, n, o, s, r) {
		const i = _e("PaletteEntry")
		return (
			D(),
			V(
				te,
				null,
				[
					I("div", xp, [
						(D(!0),
						V(
							te,
							null,
							Ye(
								e.categories,
								(a) => (
									D(),
									V("section", { key: a.name }, [
										a.name !== "default" ? (D(), V("h1", kp, be(a.name), 1)) : lt("", !0),
										(D(!0),
										V(
											te,
											null,
											Ye(
												a.nodeTypes,
												(l, c) => (D(), Ne(i, { key: c, type: c, title: l.title, onPointerdown: (u) => e.onDragStart(c, l) }, null, 8, ["type", "title", "onPointerdown"]))
											),
											128
										))
									])
								)
							),
							128
						))
					]),
					X(
						En,
						{ name: "fade" },
						{
							default: yn(() => [
								e.draggedNode
									? (D(),
									  V(
										"div",
										{ key: 0, class: "baklava-dragged-node", style: He(e.draggedNodeStyles) },
										[X(i, { type: e.draggedNode.type, title: e.draggedNode.nodeInformation.title }, null, 8, ["type", "title"])],
										4
									  ))
									: lt("", !0)
							]),
							_: 1
						}
					)
				],
				64
			)
		)
	}
	var Dp = ne(Cp, [["render", Tp]]),
		On = "SAVE_SUBGRAPH"
	function $p(e, t) {
		const n = () => {
			const o = e.value
			if (!o.template) throw new Error("Graph template property not set")
			const s = [],
				r = [],
				i = o.nodes.filter((d) => d.type === oo)
			for (const d of i) {
				const p = o.connections.filter((m) => m.from === d.outputs.placeholder)
				p.forEach((m) => {
					r.push({ id: d.graphInterfaceId, name: d.inputs.name.value, nodeInterfaceId: m.to.id })
				}),
				s.push(...p)
			}
			const a = [],
				l = o.nodes.filter((d) => d.type === so)
			for (const d of l) {
				const p = o.connections.filter((m) => m.to === d.inputs.placeholder)
				p.forEach((m) => {
					a.push({ id: d.graphInterfaceId, name: d.inputs.name.value, nodeInterfaceId: m.from.id })
				}),
				s.push(...p)
			}
			const c = o.connections.filter((d) => !s.includes(d)),
				u = o.nodes.filter((d) => d.type !== oo && d.type !== so)
			o.template.update({ inputs: r, outputs: a, connections: c.map((d) => ({ id: d.id, from: d.from.id, to: d.to.id })), nodes: u.map((d) => d.save()) }),
			(o.template.panning = o.panning),
			(o.template.scaling = o.scaling)
		}
		t.registerCommand(On, {
			canExecute: () => {
				var o
				return e.value !== ((o = e.value.editor) == null ? void 0 : o.graph)
			},
			execute: n
		})
	}
	var Rr = "CREATE_SUBGRAPH",
		Xa = [oo, so]
	function Sp(e, t, n) {
		const o = () => e.value.selectedNodes.filter((r) => !Xa.includes(r.type)).length > 0,
			s = () => {
				const r = e.value,
					i = e.value.editor
				if (r.selectedNodes.length === 0) return
				const a = r.selectedNodes.filter((N) => !Xa.includes(N.type)),
					l = a.flatMap((N) => Object.values(N.inputs)),
					c = a.flatMap((N) => Object.values(N.outputs)),
					u = r.connections.filter((N) => !c.includes(N.from) && l.includes(N.to)),
					d = r.connections.filter((N) => c.includes(N.from) && !l.includes(N.to)),
					p = r.connections.filter((N) => c.includes(N.from) && l.includes(N.to)),
					m = u.map((N) => N.to),
					g = d.map((N) => N.from),
					O = new Map(),
					w = []
				for (const N of m) {
					const R = eo()
					O.set(N.id, R), w.push({ id: R, nodeInterfaceId: N.id, name: N.name })
				}
				const S = []
				for (const N of g) {
					const R = eo()
					O.set(N.id, R), S.push({ id: R, nodeInterfaceId: N.id, name: N.name })
				}
				const y = Pe(new ft({ connections: p.map((N) => ({ id: N.id, from: N.from.id, to: N.to.id })), inputs: w, outputs: S, nodes: a.map((N) => N.save()) }, i))
				i.addGraphTemplate(y)
				const M = i.nodeTypes.get(ot(y))
				if (!M) throw new Error("Unable to create subgraph: Could not find corresponding graph node type")
				const z = Pe(new M.type())
				r.addNode(z)
				const H = Math.round(a.map((N) => N.position.x).reduce((N, R) => N + R, 0) / a.length),
					re = Math.round(a.map((N) => N.position.y).reduce((N, R) => N + R, 0) / a.length)
				;(z.position.x = H),
				(z.position.y = re),
				u.forEach((N) => {
					r.removeConnection(N), r.addConnection(N.from, z.inputs[O.get(N.to.id)])
				}),
				d.forEach((N) => {
					r.removeConnection(N), r.addConnection(z.outputs[O.get(N.from.id)], N.to)
				}),
				a.forEach((N) => r.removeNode(N)),
				t.canExecuteCommand(On) && t.executeCommand(On),
				n(y),
				(e.value.panning = { ...r.panning }),
				(e.value.scaling = r.scaling)
			}
		t.registerCommand(Rr, { canExecute: o, execute: s })
	}
	var Tr = "DELETE_NODES"
	function Ip(e, t) {
		t.registerCommand(Tr, {
			canExecute: () => e.value.selectedNodes.length > 0,
			execute() {
				e.value.selectedNodes.forEach((n) => e.value.removeNode(n))
			}
		}),
		t.registerHotkey(["Delete"], Tr)
	}
	var Ar = "SWITCH_TO_MAIN_GRAPH"
	function Mp(e, t, n) {
		t.registerCommand(Ar, {
			canExecute: () => e.value !== e.value.editor.graph,
			execute: () => {
				t.executeCommand(On), n(e.value.editor.graph)
			}
		})
	}
	function Vp(e, t, n) {
		Ip(e, t), Sp(e, t, n), $p(e, t), Mp(e, t, n)
	}
	var os = class {
			constructor(t, n) {
				(this.type = t), t === "addNode" ? (this.nodeId = n) : (this.nodeState = n)
			}
			undo(t) {
				this.type === "addNode" ? this.removeNode(t) : this.addNode(t)
			}
			redo(t) {
				this.type === "addNode" && this.nodeState ? this.addNode(t) : this.type === "removeNode" && this.nodeId && this.removeNode(t)
			}
			addNode(t) {
				const n = t.editor.nodeTypes.get(this.nodeState.type)
				if (!n) return
				const o = new n.type()
				t.addNode(o), o.load(this.nodeState), (this.nodeId = o.id)
			}
			removeNode(t) {
				const n = t.nodes.find((o) => o.id === this.nodeId)
				!n || ((this.nodeState = n.save()), t.removeNode(n))
			}
		},
		ss = class {
			constructor(t, n) {
				if (((this.type = t), t === "addConnection")) this.connectionId = n
				else {
					const o = n
					this.connectionState = { id: o.id, from: o.from.id, to: o.to.id }
				}
			}
			undo(t) {
				this.type === "addConnection" ? this.removeConnection(t) : this.addConnection(t)
			}
			redo(t) {
				this.type === "addConnection" && this.connectionState ? this.addConnection(t) : this.type === "removeConnection" && this.connectionId && this.removeConnection(t)
			}
			addConnection(t) {
				const n = t.findNodeInterface(this.connectionState.from),
					o = t.findNodeInterface(this.connectionState.to)
				!n || !o || t.addConnection(n, o)
			}
			removeConnection(t) {
				const n = t.connections.find((o) => o.id === this.connectionId)
				!n || ((this.connectionState = { id: n.id, from: n.from.id, to: n.to.id }), t.removeConnection(n))
			}
		},
		Dr = class {
			constructor(t) {
				if (((this.type = "transaction"), t.length === 0)) throw new Error("Can't create a transaction with no steps")
				this.steps = t
			}
			undo(t) {
				for (let n = this.steps.length - 1; n >= 0; n--) this.steps[n].undo(t)
			}
			redo(t) {
				for (let n = 0; n < this.steps.length; n++) this.steps[n].redo(t)
			}
		},
		rs = "UNDO",
		is = "REDO",
		Fr = "START_TRANSACTION",
		Hr = "COMMIT_TRANSACTION"
	function Pp(e, t) {
		const n = Symbol("HistoryToken"),
			o = j(200),
			s = j([]),
			r = j(!1),
			i = j(-1),
			a = j(!1),
			l = j([]),
			c = (w) => {
				if (!r.value)
					if (a.value) l.value.push(w)
					else for (i.value !== s.value.length - 1 && (s.value = s.value.slice(0, i.value + 1)), s.value.push(w), i.value++; s.value.length > o.value; ) s.value.shift()
			},
			u = () => {
				a.value = !0
			},
			d = () => {
				(a.value = !1), l.value.length > 0 && (c(new Dr(l.value)), (l.value = []))
			},
			p = () => s.value.length !== 0 && i.value !== -1,
			m = () => {
				!p() || ((r.value = !0), s.value[i.value--].undo(e.value), (r.value = !1))
			},
			g = () => s.value.length !== 0 && i.value < s.value.length - 1,
			O = () => {
				!g() || ((r.value = !0), s.value[++i.value].redo(e.value), (r.value = !1))
			}
		return (
			at(
				e,
				(w, S) => {
					S && (S.events.addNode.unsubscribe(n), S.events.removeNode.unsubscribe(n), S.events.addConnection.unsubscribe(n), S.events.removeConnection.unsubscribe(n)),
					w &&
							(w.events.addNode.subscribe(n, (y) => {
								c(new os("addNode", y.id))
							}),
							w.events.removeNode.subscribe(n, (y) => {
								c(new os("removeNode", y.save()))
							}),
							w.events.addConnection.subscribe(n, (y) => {
								c(new ss("addConnection", y.id))
							}),
							w.events.removeConnection.subscribe(n, (y) => {
								c(new ss("removeConnection", y))
							}))
				},
				{ immediate: !0 }
			),
			t.registerCommand(rs, { canExecute: p, execute: m }),
			t.registerCommand(is, { canExecute: g, execute: O }),
			t.registerCommand(Fr, { canExecute: () => !a.value, execute: u }),
			t.registerCommand(Hr, { canExecute: () => a.value, execute: d }),
			t.registerHotkey(["Control", "z"], rs),
			t.registerHotkey(["Control", "y"], is),
			Pe({ maxSteps: o })
		)
	}
	var as = "COPY",
		ls = "PASTE",
		vl = "CLEAR_CLIPBOARD"
	function Rp(e, t, n) {
		const o = Symbol("ClipboardToken"),
			s = j(""),
			r = j(""),
			i = K(() => !s.value),
			a = () => {
				(s.value = ""), (r.value = "")
			},
			l = () => {
				const d = e.value.selectedNodes.flatMap((m) => [...Object.values(m.inputs), ...Object.values(m.outputs)]),
					p = e.value.connections.filter((m) => d.includes(m.from) || d.includes(m.to)).map((m) => ({ from: m.from.id, to: m.to.id }))
				;(r.value = JSON.stringify(p)), (s.value = JSON.stringify(e.value.selectedNodes.map((m) => m.save())))
			},
			c = (d, p, m) => {
				for (const g of d) {
					let O
					if (((!m || m === "input") && (O = Object.values(g.inputs).find((w) => w.id === p)), !O && (!m || m === "output") && (O = Object.values(g.outputs).find((w) => w.id === p)), O))
						return O
				}
			},
			u = () => {
				if (i.value) return
				const d = new Map(),
					p = JSON.parse(s.value),
					m = JSON.parse(r.value),
					g = [],
					O = [],
					w = e.value
				n.executeCommand(Fr)
				for (const S of p) {
					const y = t.value.nodeTypes.get(S.type)
					if (!y) {
						console.warn(`Node type ${S.type} not registered`)
						return
					}
					const M = new y.type(),
						z = M.id
					g.push(M)
					const H = (re) => {
						Object.values(re).forEach((N) => {
							N.hooks.load.subscribe(o, (R) => {
								const Z = eo()
								return d.set(R.id, Z), (N.id = Z), N.hooks.load.unsubscribe(o), R
							})
						})
					}
					H(M.inputs),
					H(M.outputs),
					M.hooks.beforeLoad.subscribe(o, (re) => {
						const N = re
						return N.position && ((N.position.x += 10), (N.position.y += 10)), M.hooks.beforeLoad.unsubscribe(o), N
					}),
					w.addNode(M),
					M.load(S),
					(M.id = z),
					d.set(S.id, z)
				}
				for (const S of m) {
					const y = c(g, d.get(S.from), "output"),
						M = c(g, d.get(S.to), "input")
					if (!y || !M) continue
					const z = w.addConnection(y, M)
					z && O.push(z)
				}
				return n.executeCommand(Hr), { newNodes: g, newConnections: O }
			}
		return (
			n.registerCommand(as, { canExecute: () => !0, execute: l }),
			n.registerHotkey(["Control", "c"], as),
			n.registerCommand(ls, { canExecute: () => !i.value, execute: u }),
			n.registerHotkey(["Control", "v"], ls),
			n.registerCommand(vl, { canExecute: () => !0, execute: a }),
			Pe({ isEmpty: i })
		)
	}
	var yl = "OPEN_SIDEBAR"
	function Ap(e, t) {
		t.registerCommand(yl, {
			execute: (n) => {
				(e.value.sidebar.nodeId = n), (e.value.sidebar.visible = !0)
			},
			canExecute: () => !0
		})
	}
	function Fp(e, t) {
		Ap(e, t)
	}
	var Hp = Object.freeze(
			Object.defineProperty(
				{
					__proto__: null,
					CREATE_SUBGRAPH_COMMAND: Rr,
					DELETE_NODES_COMMAND: Tr,
					SAVE_SUBGRAPH_COMMAND: On,
					SWITCH_TO_MAIN_GRAPH_COMMAND: Ar,
					COMMIT_TRANSACTION_COMMAND: Hr,
					START_TRANSACTION_COMMAND: Fr,
					UNDO_COMMAND: rs,
					REDO_COMMAND: is,
					CLEAR_CLIPBOARD_COMMAND: vl,
					COPY_COMMAND: as,
					PASTE_COMMAND: ls,
					OPEN_SIDEBAR_COMMAND: yl
				},
				Symbol.toStringTag,
				{ value: "Module" }
			)
		),
		jp = {},
		Lp = {
			xmlns: "http://www.w3.org/2000/svg",
			class: "baklava-icon",
			width: "24",
			height: "24",
			viewBox: "0 0 24 24",
			"stroke-width": "2",
			stroke: "currentColor",
			fill: "none",
			"stroke-linecap": "round",
			"stroke-linejoin": "round"
		},
		Up = I("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }, null, -1),
		Bp = I("path", { d: "M9 13l-4 -4l4 -4m-4 4h11a4 4 0 0 1 0 8h-1" }, null, -1),
		Wp = [Up, Bp]
	function Kp(e, t) {
		return D(), V("svg", Lp, Wp)
	}
	var zp = ne(jp, [["render", Kp]]),
		qp = {},
		Gp = {
			xmlns: "http://www.w3.org/2000/svg",
			class: "baklava-icon",
			width: "24",
			height: "24",
			viewBox: "0 0 24 24",
			"stroke-width": "2",
			stroke: "currentColor",
			fill: "none",
			"stroke-linecap": "round",
			"stroke-linejoin": "round"
		},
		Yp = I("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }, null, -1),
		Xp = I("path", { d: "M15 13l4 -4l-4 -4m4 4h-11a4 4 0 0 0 0 8h1" }, null, -1),
		Jp = [Yp, Xp]
	function Zp(e, t) {
		return D(), V("svg", Gp, Jp)
	}
	var Qp = ne(qp, [["render", Zp]]),
		eh = {},
		th = {
			xmlns: "http://www.w3.org/2000/svg",
			class: "baklava-icon",
			width: "24",
			height: "24",
			viewBox: "0 0 24 24",
			"stroke-width": "2",
			stroke: "currentColor",
			fill: "none",
			"stroke-linecap": "round",
			"stroke-linejoin": "round"
		},
		nh = I("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }, null, -1),
		oh = I("line", { x1: "5", y1: "12", x2: "19", y2: "12" }, null, -1),
		sh = I("line", { x1: "5", y1: "12", x2: "11", y2: "18" }, null, -1),
		rh = I("line", { x1: "5", y1: "12", x2: "11", y2: "6" }, null, -1),
		ih = [nh, oh, sh, rh]
	function ah(e, t) {
		return D(), V("svg", th, ih)
	}
	var lh = ne(eh, [["render", ah]]),
		ch = {},
		uh = {
			xmlns: "http://www.w3.org/2000/svg",
			class: "baklava-icon",
			width: "24",
			height: "24",
			viewBox: "0 0 24 24",
			"stroke-width": "2",
			stroke: "currentColor",
			fill: "none",
			"stroke-linecap": "round",
			"stroke-linejoin": "round"
		},
		dh = I("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }, null, -1),
		fh = I("path", { d: "M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" }, null, -1),
		ph = I("rect", { x: "9", y: "3", width: "6", height: "4", rx: "2" }, null, -1),
		hh = [dh, fh, ph]
	function mh(e, t) {
		return D(), V("svg", uh, hh)
	}
	var gh = ne(ch, [["render", mh]]),
		vh = {},
		yh = {
			xmlns: "http://www.w3.org/2000/svg",
			class: "baklava-icon",
			width: "24",
			height: "24",
			viewBox: "0 0 24 24",
			"stroke-width": "2",
			stroke: "currentColor",
			fill: "none",
			"stroke-linecap": "round",
			"stroke-linejoin": "round"
		},
		_h = I("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }, null, -1),
		bh = I("rect", { x: "8", y: "8", width: "12", height: "12", rx: "2" }, null, -1),
		Eh = I("path", { d: "M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" }, null, -1),
		wh = [_h, bh, Eh]
	function Nh(e, t) {
		return D(), V("svg", yh, wh)
	}
	var Oh = ne(vh, [["render", Nh]]),
		Ch = {},
		xh = {
			xmlns: "http://www.w3.org/2000/svg",
			class: "baklava-icon",
			width: "24",
			height: "24",
			viewBox: "0 0 24 24",
			"stroke-width": "2",
			stroke: "currentColor",
			fill: "none",
			"stroke-linecap": "round",
			"stroke-linejoin": "round"
		},
		kh = I("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }, null, -1),
		Th = I("path", { d: "M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2" }, null, -1),
		Dh = I("circle", { cx: "12", cy: "14", r: "2" }, null, -1),
		$h = I("polyline", { points: "14 4 14 8 8 8 8 4" }, null, -1),
		Sh = [kh, Th, Dh, $h]
	function Ih(e, t) {
		return D(), V("svg", xh, Sh)
	}
	var Mh = ne(Ch, [["render", Ih]]),
		Vh = {},
		Ph = {
			xmlns: "http://www.w3.org/2000/svg",
			class: "baklava-icon",
			width: "24",
			height: "24",
			viewBox: "0 0 24 24",
			"stroke-width": "2",
			stroke: "currentColor",
			fill: "none",
			"stroke-linecap": "round",
			"stroke-linejoin": "round"
		},
		Rh = ma(
			"<path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\"></path><path d=\"M10 3h4v4h-4z\"></path><path d=\"M3 17h4v4h-4z\"></path><path d=\"M17 17h4v4h-4z\"></path><path d=\"M7 17l5 -4l5 4\"></path><line x1=\"12\" y1=\"7\" x2=\"12\" y2=\"13\"></line>",
			6
		),
		Ah = [Rh]
	function Fh(e, t) {
		return D(), V("svg", Ph, Ah)
	}
	var Hh = ne(Vh, [["render", Fh]]),
		jh = de({
			props: { command: { type: String, required: !0 }, title: { type: String, required: !0 }, icon: { type: Object, required: !1, default: void 0 } },
			setup() {
				const { viewModel: e } = tt()
				return { viewModel: e }
			}
		}),
		Lh = ["disabled", "title"]
	function Uh(e, t, n, o, s, r) {
		return (
			D(),
			V(
				"button",
				{
					class: "baklava-toolbar-entry baklava-toolbar-button",
					disabled: !e.viewModel.commandHandler.canExecuteCommand(e.command),
					title: e.title,
					onClick: t[0] || (t[0] = (i) => e.viewModel.commandHandler.executeCommand(e.command))
				},
				[e.icon ? (D(), Ne(Yo(e.icon), { key: 0 })) : (D(), V(te, { key: 1 }, [lr(be(e.title), 1)], 64))],
				8,
				Lh
			)
		)
	}
	var Bh = ne(jh, [["render", Uh]]),
		Wh = de({
			components: { ToolbarButton: Bh },
			setup() {
				const { viewModel: e } = tt()
				return {
					isSubgraph: K(() => e.value.displayedGraph !== e.value.editor.graph),
					commands: [
						{ command: as, title: "Copy", icon: Oh },
						{ command: ls, title: "Paste", icon: gh },
						{ command: rs, title: "Undo", icon: zp },
						{ command: is, title: "Redo", icon: Qp },
						{ command: Rr, title: "Create Subgraph", icon: Hh }
					],
					subgraphCommands: [
						{ command: On, title: "Save Subgraph", icon: Mh },
						{ command: Ar, title: "Back to Main Graph", icon: lh }
					]
				}
			}
		}),
		Kh = { class: "baklava-toolbar" }
	function zh(e, t, n, o, s, r) {
		const i = _e("toolbar-button")
		return (
			D(),
			V("div", Kh, [
				(D(!0),
				V(
					te,
					null,
					Ye(e.commands, (a) => (D(), Ne(i, { key: a.command, command: a.command, title: a.title, icon: a.icon }, null, 8, ["command", "title", "icon"]))),
					128
				)),
				e.isSubgraph
					? (D(!0),
					  V(
						te,
						{ key: 0 },
						Ye(e.subgraphCommands, (a) => (D(), Ne(i, { key: a.command, command: a.command, title: a.title, icon: a.icon }, null, 8, ["command", "title", "icon"]))),
						128
					  ))
					: lt("", !0)
			])
		)
	}
	var qh = ne(Wh, [["render", zh]]),
		Gh = de({
			components: { Background: ud, Node: nl, ConnectionWrapper: ol, TemporaryConnection: sl, Sidebar: rl, Minimap: il, NodePalette: Dp, Toolbar: qh },
			props: { viewModel: { type: Object, required: !0 } },
			setup(e) {
				const t = Symbol("EditorToken"),
					n = ht(e, "viewModel")
				Ja(n)
				const o = j(null)
				Wo("editorEl", o)
				const s = K(() => e.viewModel.displayedGraph.nodes),
					r = K(() => e.viewModel.displayedGraph.connections),
					i = K(() => e.viewModel.displayedGraph.selectedNodes),
					a = id(),
					l = ad(),
					c = K(() => ({ ...a.styles.value })),
					u = j(0)
				e.viewModel.editor.hooks.load.subscribe(t, (y) => (u.value++, y))
				const d = (y) => {
						a.onPointerMove(y), l.onMouseMove(y)
					},
					p = (y) => {
						y.button === 0 && (y.target === o.value && (S(), a.onPointerDown(y)), l.onMouseDown())
					},
					m = (y) => {
						a.onPointerUp(y), l.onMouseUp()
					},
					g = (y) => {
						y.key === "Tab" && y.preventDefault(), e.viewModel.commandHandler.handleKeyDown(y)
					},
					O = (y) => {
						e.viewModel.commandHandler.handleKeyUp(y)
					},
					w = (y) => {
						e.viewModel.commandHandler.pressedKeys.includes("Control") || S(), e.viewModel.displayedGraph.selectedNodes.push(y)
					},
					S = () => {
						e.viewModel.displayedGraph.selectedNodes = []
					}
				return {
					el: o,
					counter: u,
					nodes: s,
					connections: r,
					selectedNodes: i,
					nodeContainerStyle: c,
					onPointerMove: d,
					onPointerDown: p,
					onPointerUp: m,
					keyDown: g,
					keyUp: O,
					selectNode: w,
					temporaryConnection: l.temporaryConnection,
					mouseWheel: a.onMouseWheel,
					dragging: a.dragging
				}
			}
		}),
		Yh = { class: "connections-container" }
	function Xh(e, t, n, o, s, r) {
		const i = _e("background"),
			a = _e("toolbar"),
			l = _e("node-palette"),
			c = _e("connection-wrapper"),
			u = _e("temporary-connection"),
			d = _e("node"),
			p = _e("sidebar"),
			m = _e("minimap")
		return (
			D(),
			V(
				"div",
				{
					ref: "el",
					tabindex: "-1",
					class: Ee(["baklava-editor", { "baklava-ignore-mouse": !!e.temporaryConnection || e.dragging, "--temporary-connection": !!e.temporaryConnection }]),
					onPointermove: t[0] || (t[0] = ct((...g) => e.onPointerMove && e.onPointerMove(...g), ["self"])),
					onPointerdown: t[1] || (t[1] = (...g) => e.onPointerDown && e.onPointerDown(...g)),
					onPointerup: t[2] || (t[2] = (...g) => e.onPointerUp && e.onPointerUp(...g)),
					onWheel: t[3] || (t[3] = ct((...g) => e.mouseWheel && e.mouseWheel(...g), ["self"])),
					onKeydown: t[4] || (t[4] = (...g) => e.keyDown && e.keyDown(...g)),
					onKeyup: t[5] || (t[5] = (...g) => e.keyUp && e.keyUp(...g))
				},
				[
					yt(e.$slots, "background", {}, () => [X(i)]),
					yt(e.$slots, "toolbar", {}, () => [X(a)]),
					yt(e.$slots, "palette", {}, () => [X(l)]),
					(D(),
					V("svg", Yh, [
						(D(!0),
						V(
							te,
							null,
							Ye(
								e.connections,
								(g) => (D(), V("g", { key: g.id + e.counter.toString() }, [yt(e.$slots, "connections", { connection: g }, () => [X(c, { connection: g }, null, 8, ["connection"])])]))
							),
							128
						)),
						yt(e.$slots, "temporaryConnection", { temporaryConnection: e.temporaryConnection }, () => [
							e.temporaryConnection ? (D(), Ne(u, { key: 0, connection: e.temporaryConnection }, null, 8, ["connection"])) : lt("", !0)
						])
					])),
					I(
						"div",
						{ class: "node-container", style: He(e.nodeContainerStyle) },
						[
							X(
								La,
								{ name: "fade" },
								{
									default: yn(() => [
										(D(!0),
										V(
											te,
											null,
											Ye(e.nodes, (g) =>
												yt(e.$slots, "node", { node: g, selected: e.selectedNodes.includes(g), onSelect: (O) => e.selectNode(g) }, () => [
													(D(),
													Ne(d, { key: g.id + e.counter.toString(), node: g, selected: e.selectedNodes.includes(g), onSelect: (O) => e.selectNode(g) }, null, 8, [
														"node",
														"selected",
														"onSelect"
													]))
												])
											),
											256
										))
									]),
									_: 3
								}
							)
						],
						4
					),
					yt(e.$slots, "sidebar", {}, () => [X(p)]),
					yt(e.$slots, "minimap", {}, () => [e.viewModel.settings.enableMinimap ? (D(), Ne(m, { key: 0 })) : lt("", !0)])
				],
				34
			)
		)
	}
	var jr = ne(Gh, [["render", Xh]])
	function Jh(e) {
		const t = j([]),
			n = j([])
		return {
			pressedKeys: t,
			handleKeyDown: (i) => {
				t.value.includes(i.key) || t.value.push(i.key),
				n.value.forEach((a) => {
					a.keys.every((l) => t.value.includes(l)) && e(a.commandName)
				})
			},
			handleKeyUp: (i) => {
				const a = t.value.indexOf(i.key)
				a >= 0 && t.value.splice(a, 1)
			},
			registerHotkey: (i, a) => {
				n.value.push({ keys: i, commandName: a })
			}
		}
	}
	var _l = () => {
			const e = j(new Map()),
				t = (r, i) => {
					if (e.value.has(r)) throw new Error(`Command "${r}" already exists`)
					e.value.set(r, i)
				},
				n = (r, i = !1, ...a) => {
					if (!e.value.has(r)) {
						if (i) throw new Error(`[CommandHandler] Command ${r} not registered`)
						return
					}
					return e.value.get(r).execute(...a)
				},
				o = (r, i = !1, ...a) => {
					if (!e.value.has(r)) {
						if (i) throw new Error(`[CommandHandler] Command ${r} not registered`)
						return !1
					}
					return e.value.get(r).canExecute(a)
				},
				s = Jh(n)
			return Pe({ registerCommand: t, executeCommand: n, canExecuteCommand: o, ...s })
		},
		Zh = (e) => !(e instanceof qe)
	function Qh(e, t) {
		return {
			switchGraph: (o) => {
				var s, r, i, a, l, c
				let u
				if (Zh(o))
					(u = new qe(e.value)),
					o.createGraph(u),
					u.inputs.forEach((d) => {
						const p = new hl()
							;(p.inputs.name.value = d.name), (p.graphInterfaceId = d.id), u.addNode(p)
						const m = u.findNodeInterface(d.nodeInterfaceId)
						if (!m) {
							console.warn(`Could not find target interface ${d.nodeInterfaceId} for subgraph input node`)
							return
						}
						u.addConnection(p.outputs.placeholder, m)
					}),
					u.outputs.forEach((d) => {
						const p = new ml()
							;(p.inputs.name.value = d.name), (p.graphInterfaceId = d.id), u.addNode(p)
						const m = u.findNodeInterface(d.nodeInterfaceId)
						if (!m) {
							console.warn(`Could not find target interface ${d.nodeInterfaceId} for subgraph input node`)
							return
						}
						u.addConnection(m, p.inputs.placeholder)
					})
				else {
					if (o !== e.value.graph) throw new Error("Can only switch using 'Graph' instance when it is the root graph. Otherwise a 'GraphTemplate' must be used.")
					u = o
				}
				t.value && t.value !== e.value.graph && t.value.destroy(),
				(u.panning = (r = (s = u.panning) != null ? s : o.panning) != null ? r : { x: 0, y: 0 }),
				(u.scaling = (a = (i = u.scaling) != null ? i : o.scaling) != null ? a : 1),
				(u.selectedNodes = (l = u.selectedNodes) != null ? l : []),
				(u.sidebar = (c = u.sidebar) != null ? c : { visible: !1, nodeId: "", optionName: "" }),
				(t.value = u)
			}
		}
	}
	function em(e) {
		var t, n, o
		;(e.position = (t = e.position) != null ? t : { x: 0, y: 0 }), (e.disablePointerEvents = !1), (e.twoColumn = (n = e.twoColumn) != null ? n : !1), (e.width = (o = e.width) != null ? o : 200)
	}
	function Lr(e) {
		const t = j(e ?? new $n()),
			n = Symbol("ViewModelToken"),
			o = j(null),
			s = Hs(o),
			{ switchGraph: r } = Qh(t, o),
			i = K(() => s.value && s.value !== t.value.graph),
			a = Pe({ useStraightConnections: !1, enableMinimap: !1, background: { gridSize: 100, gridDivision: 5, subGridVisibleThreshold: 0.6 } }),
			l = _l(),
			c = Pp(s, l),
			u = Rp(s, t, l),
			d = { renderNode: new me(null), renderInterface: new me(null) }
		return (
			Vp(s, l, r),
			Fp(s, l),
			at(
				t,
				(p, m) => {
					m &&
						(m.events.registerGraph.unsubscribe(n),
						m.graphEvents.beforeAddNode.unsubscribe(n),
						p.nodeHooks.beforeLoad.unsubscribe(n),
						p.nodeHooks.afterSave.unsubscribe(n),
						p.graphTemplateHooks.beforeLoad.unsubscribe(n),
						p.graphTemplateHooks.afterSave.unsubscribe(n)),
					p &&
							(p.nodeHooks.beforeLoad.subscribe(n, (g, O) => {
								var w, S, y
								return (O.position = (w = g.position) != null ? w : { x: 0, y: 0 }), (O.width = (S = g.width) != null ? S : 200), (O.twoColumn = (y = g.twoColumn) != null ? y : !1), g
							}),
							p.nodeHooks.afterSave.subscribe(n, (g, O) => ((g.position = O.position), (g.width = O.width), (g.twoColumn = O.twoColumn), g)),
							p.graphTemplateHooks.beforeLoad.subscribe(n, (g, O) => ((O.panning = g.panning), (O.scaling = g.scaling), g)),
							p.graphTemplateHooks.afterSave.subscribe(n, (g, O) => ((g.panning = O.panning), (g.scaling = O.scaling), g)),
							p.graphEvents.beforeAddNode.subscribe(n, (g) => em(g)),
							t.value.registerNodeType(hl, { category: "Subgraphs" }),
							t.value.registerNodeType(ml, { category: "Subgraphs" }),
							r(p.graph))
				},
				{ immediate: !0 }
			),
			Pe({ editor: t, displayedGraph: s, isSubgraph: i, settings: a, commandHandler: l, history: c, clipboard: u, hooks: d, switchGraph: r })
		)
	}
	var tm = Object.freeze(
		Object.defineProperty(
			{ __proto__: null, Connection: Mr, ConnectionWrapper: ol, TemporaryConnection: sl, Node: nl, NodeInterface: tl, ContextMenu: Ir, Minimap: il, Sidebar: rl },
			Symbol.toStringTag,
			{ value: "Module" }
		)
	)
	function nm(e) {
		let t
		return (
			Ua({
				setup() {
					const n = Lr()
					return (t = n), { viewModel: n }
				},
				render() {
					return Qo(jr, { viewModel: this.viewModel })
				}
			}).mount(e),
			t
		)
	}
	return xl(om)
})()
//# sourceMappingURL=bundle.js.map
