function baseParse(content) {
    const _context = createParseContext(content);
    return createRoot(parseChildren(_context, []));
}
// function isEnd(tagType, _context) {
//   if(_context.source.startsWith(`</${tagType}>`)) {
//     return true
//   }
//   if(!_context.source) {
//     return true
//   }
// }
function isEnd(ancestors, _context) {
    // if(_context.source.startsWith(`</${tagType}>`)) {
    //   return true
    // }
    if (_context.source.startsWith(`</`)) {
        for (let i = ancestors.length - 1; i >= 0; i -= 1) {
            // const _ = ancestors[i];
            // if(`</${ancestors[i].tag}>` === _context.source) {
            const _tag = ancestors[i].tag;
            if (_context.source.slice(2, 2 + _tag.length) === _tag) {
                return true;
            }
        }
    }
    if (!_context.source) {
        return true;
    }
}
function parseChildren(_context, ancestors) {
    const _nodes = [];
    let _node;
    while (!isEnd(ancestors, _context)) {
        if (_context.source.startsWith('{{')) {
            _node = parseInterpolation(_context);
        }
        else if (_context.source[0] === '<') {
            if (/[a-z]/i.test(_context.source[1])) {
                _node = parseElement(_context, ancestors);
            }
        }
        if (!_node) {
            _node = parseText(_context);
        }
        _nodes.push(_node);
    }
    return _nodes;
}
function advanceBy(_context, length) {
    _context.source = _context.source.slice(length);
}
function parseTextData(context, length) {
    const _content = context.source.slice(0, length);
    advanceBy(context, length);
    return _content;
}
function parseText(_context) {
    const _s = _context.source;
    let _endIndex = _s.length;
    // let _endIndex = _context.source.length
    const _endFlags = ['<', '{{'];
    for (let i = 0; i < _endFlags.length; i++) {
        const _index = _s.indexOf(_endFlags[i]);
        if (_index !== -1 && _index < _endIndex) {
            _endIndex = _s.indexOf(_endFlags[i]);
        }
    }
    const _content = parseTextData(_context, _endIndex);
    return {
        type: 3 /* NodeTypes.TEXT */,
        content: _content
    };
}
function startsWithEndTagOpen(source, tag) {
    return (source.startsWith("</") &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function parseElement(_context, ancestors) {
    const _ele = parseTag(_context, 0 /* TagType.Start */);
    // ancestors
    ancestors.push(_ele);
    _ele.children = parseChildren(_context, ancestors);
    // if(ancestors.pop() === _context.source) {
    ancestors.pop();
    if (startsWithEndTagOpen(_context.source, _ele.tag)) {
        parseTag(_context, 1 /* TagType.End */);
    }
    else {
        throw (`缺少结束标签:${_ele.tag}`);
    }
    return _ele;
}
function parseTag(_context, type) {
    const _exg = /^<\/?([a-z]+)/.exec(_context.source);
    console.log('_exg--->', _exg);
    const _tag = _exg[1];
    advanceBy(_context, _exg[0].length);
    advanceBy(_context, 1);
    console.log('_context', _context);
    if (type === 1 /* TagType.End */) {
        return;
    }
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag: _tag,
    };
}
function parseInterpolation(_context) {
    const _openDelimiter = '{{';
    const _closeDelimiter = '}}';
    // {{message}}
    const _closeIndex = _context.source.indexOf(_closeDelimiter, _openDelimiter.length);
    // 推进
    // _context.source = _context.source.slice(_openDelimiter.length)
    advanceBy(_context, _openDelimiter.length);
    const _rawContentLength = _closeIndex - _openDelimiter.length;
    const rawContent = _context.source.slice(0, _rawContentLength);
    const content = rawContent.trim();
    // 推进
    _context.source = _context.source.slice(_rawContentLength + _closeDelimiter.length);
    return {
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
            content
        }
    };
}
function createRoot(children) {
    return {
        children,
        type: 4 /* NodeTypes.ROOT */
    };
}
function createParseContext(content) {
    return {
        source: content,
        type: 4 /* NodeTypes.ROOT */
    };
}

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode",
};

// export function generate(ast) {
//     return  {
//         code: `return function render(_ctx, _cache, $props, $setup, $data, $options) {return "hi"}`
//     }
// }
function generate(ast) {
    const _context = createCodegenContext();
    const { push } = _context;
    const _functionName = 'render';
    // const _args = ['_ctx', '_cache', '$props', '$setup', '$data', '$options']
    const _args = ['_ctx', '_cache'];
    const _signature = _args.join(', ');
    getfunctionPreamble(ast, _context);
    push(`function ${_functionName}(${_signature}) {`);
    push(`return `);
    getNode(ast.codegenNode, _context);
    // console.log('ast.codegenNode ===>', ast.codegenNode)
    push(`}`);
    return {
        code: _context.code
    };
}
function getfunctionPreamble(ast, _context) {
    const { push } = _context;
    const _VueBinging = 'Vue';
    // const _fucPreFix = `const { ${toDisplayString}:${_toDisplayString} } = _VueBinging`
    const _aliasHelps = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
    if (ast.helps.length > 0) {
        // ${ast.helps.map(_aliasHelps).join(',')} 转化为 { toDisplayString:_toDisplayString }
        const _fucPreFix = `const { ${ast.helps.map(_aliasHelps).join(',')} } = ${_VueBinging}`;
        push(_fucPreFix);
        push('\n');
    }
    push('return ');
}
function getNode(node, _context) {
    switch (node.type) {
        case 3 /* NodeTypes.TEXT */:
            // push(`"${node.content}"`)
            genText(node, _context);
            break;
        case 0 /* NodeTypes.INTERPOLATION */:
            // push(`_toDisplayString(_ctx.message)`)
            genInterpolation(node, _context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            genSimpleExpression(node, _context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, _context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            COMPOUND_EXPRESSION(node, _context);
            break;
    }
}
function COMPOUND_EXPRESSION(node, context) {
    const { push } = context;
    const { tag, children } = node;
    for (let i = 0; i < children.length; i++) {
        const _child = children[i];
        if (typeof _child === 'string') {
            push(_child);
        }
        else {
            getNode(_child, context);
        }
    }
}
function genElement(node, context) {
    const { push } = context;
    const { tag, children, props } = node;
    // push(`${context.help(CREATE_ELEMENT_VNODE)}("${tag}"), null, "hi, " + _toDisplayString(_ctx.message)`)
    push(`${context.help(CREATE_ELEMENT_VNODE)}('${tag}', ${props || null}, `);
    // console.log('!!node ===>', node)
    // console.log('!!children ===>', children)
    // 适配当前"<div>hi,{{message}}</div>" 简写
    // for (let i = 0; i < children.length; i++) {
    //     const _child = children[i];
    //     getNode(_child, context)
    // }
    // const _child = children[0]
    // getNode(_child, context)
    getNode(children, context);
    push(')');
}
function genSimpleExpression(node, context) {
    const { push } = context;
    // push(`_ctx.${node.content}`);
    // 转化 _toDisplayString(_ctx.message)}" 中的 _ctx.${node.content}
    // 使用插件nodeTransforms: [transformExpression], 把node.content 转为_ctx.${node.content}
    push(`${node.content}`);
}
function genInterpolation(node, context) {
    const { push } = context;
    // 转化 _toDisplayString(_ctx.message)}" 中的  _toDisplayString(
    push(`${context.help(TO_DISPLAY_STRING)}(`);
    // console.log('node', node)
    // { type: 0, content: { type: 1, content: 'message' } }
    getNode(node.content, context);
    push(`)`);
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function createCodegenContext(ast) {
    const context = {
        code: '',
        push(str) {
            context.code += str;
        },
        help(key) {
            return `_${helperMapName[key]}`;
        }
    };
    return context;
}

function transformExpression(node) {
    return () => {
        switch (node.type) {
            case 0 /* NodeTypes.INTERPOLATION */:
                // _ctx.${node.content}
                node.content.content = `_ctx.${node.content.content}`;
                // node.content = processExpression(node.content)
                break;
        }
    };
}

function transformElement(node, context) {
    return () => {
        console.log('??ndoe', node);
        console.log('context', context);
        if (node.type === 2 /* NodeTypes.ELEMENT */) {
            context.help(CREATE_ELEMENT_VNODE);
            // 以下这些只是为了，codegen里只拼数据不写逻辑，把element节点chilren[0]提取出来，封装在这里，在codegen里直接用，
            // genElement函数   === 》     // const _child = children[0]
            // getNode(_child, context)
            const vNodeTag = node.tag;
            let vNodeProps;
            const vNodeChilren = node.children[0];
            const vNodeElement = {
                type: 2 /* NodeTypes.ELEMENT */,
                tag: vNodeTag,
                props: vNodeProps,
                children: vNodeChilren
            };
            node.codegenNode = vNodeElement;
        }
    };
}

function isText(node) {
    return (node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTERPOLATION */);
}

// 处理文本节点 用 + 号连接
function transformText(node, context) {
    const { children } = node;
    return () => {
        if (node.type === 2 /* NodeTypes.ELEMENT */) {
            let _currentContainer;
            for (let i = 0; i < children.length; i++) {
                const _child = children[i];
                if (isText(_child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const nextChild = children[j];
                        if (isText(nextChild)) {
                            if (!_currentContainer) {
                                _currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [_child]
                                };
                            }
                            _currentContainer.children.push('+');
                            _currentContainer.children.push(nextChild);
                            children.splice(j, 1);
                            j -= 1;
                        }
                        else {
                            _currentContainer = null;
                            break;
                        }
                    }
                }
            }
            console.log('!!!node.type === NodeTypes.ELEMENT', node);
            console.log('!!!node.type === NodeTypes.ELEMENT', children);
        }
    };
}

function transform(root, options = {}) {
    const _context = createTransformContext(root, options);
    // 树结构遍历，1、深度优先搜索，---》递归   2、广度优先搜索
    traverseNode(root, _context);
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
    root.helps = [..._context.helps.keys()];
}
function traverseNode(root, context) {
    var _a;
    console.log('root', root);
    // 插件体系
    let _handleFuc = [];
    const _nodeTransforms = context.nodeTransforms;
    if (_nodeTransforms) {
        for (let i = 0; i < _nodeTransforms.length; i++) {
            const _nodeTransform = _nodeTransforms[i];
            let onExit = _nodeTransform(root, context);
            _handleFuc.push(onExit);
        }
    }
    switch (root.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            context.help(TO_DISPLAY_STRING);
            break;
        case 2 /* NodeTypes.ELEMENT */:
        case 4 /* NodeTypes.ROOT */:
            // 变动点与稳定点分离，将稳定点分离成单独函数，保证可测试性。
            traverseChildren(root, context);
            break;
    }
    let _len = _handleFuc.length;
    while (_len--) {
        (_a = _handleFuc[_len]) === null || _a === void 0 ? void 0 : _a.call(_handleFuc);
    }
}
function traverseChildren(root, context) {
    const _chilren = root.children;
    if (_chilren) {
        for (let i = 0; i < _chilren.length; i++) {
            const element = _chilren[i];
            traverseNode(element, context);
        }
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helps: new Map(),
        help(key) {
            context.helps.set(key, 1);
        }
    };
    return context;
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    const { code } = generate(ast);
    return code;
}

function extend(a, b) {
    return Object.assign(a, b);
}
function isObject$1(value) {
    return value !== null && typeof value === 'object';
}
function isChange(value, newValue) {
    return value !== newValue;
}

let activeEffect;
let sholdTrack = false;
// class ReactiveEffect 
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        if (!this.active) {
            return this._fn();
        }
        // effect.spec.ts it("stop", () => { obj.prop++ })
        // 当使用obj.prop++ 会出发obj.prop的get,又会收集依赖，但是stop之后不应该再次收集依赖，如果收集就会在SET时候出发依赖，也就是只有在effect中的Fn执行时，才要收集依赖，
        // 当执行run方法才把收集依赖开关打开，即sholdTrack=true，收集完依赖就关掉，这样就实现只在run方法调用get操作才收集依赖
        activeEffect = this;
        sholdTrack = true;
        const _res = this._fn();
        sholdTrack = false;
        return _res;
    }
    stop() {
        // 优化stop功能，多次stop，只出发一次
        if (this.active) {
            cleanupEffect(this);
            this.active = false;
            if (this.onStop) {
                this.onStop();
            }
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
}
const targetMap = new Map();
function trackking() {
    return activeEffect !== undefined && sholdTrack;
}
function track(target, key) {
    // if(!trackking()) return 
    if (!activeEffect)
        return;
    if (!sholdTrack)
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let depMap = depsMap.get(key);
    if (!depMap) {
        depMap = new Set();
        depsMap.set(key, depMap);
    }
    // depMap.add(activeEffect)
    // 反向记录，如stop的时候，用activeEffect删除depMap里的它
    // activeEffect.deps.push(depMap)
    trackEffect(depMap);
}
function trackEffect(depMap) {
    depMap.add(activeEffect);
    // 反向记录，如stop的时候，用activeEffect删除depMap里的它
    activeEffect.deps.push(depMap);
}
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    const depMap = depsMap.get(key);
    // for (const dep of depMap) {
    //     if (dep.scheduler) {
    //         dep.scheduler()
    //     } else {
    //         dep.run()
    //     }
    // }
    triggerEffect(depMap);
}
function triggerEffect(depMap) {
    for (const dep of depMap) {
        if (dep.scheduler) {
            dep.scheduler();
        }
        else {
            dep.run();
        }
    }
}
function effect(fn, options = {}) {
    const scheduler = options.scheduler;
    const _effect = new ReactiveEffect(fn, scheduler);
    // options
    // Object.assign(_effect, options)
    extend(_effect, options);
    _effect.onStop = options.onStop;
    _effect.run();
    const _runner = _effect.run.bind(_effect);
    _runner.effect = _effect;
    return _runner;
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, isShollow = false) {
    return function get(target, key) {
        const _vlaue = Reflect.get(target, key);
        if (!isReadonly && key === "__v_isReactive" /* reactiveFlags.IS_REACTIVE */) {
            return true;
            // return !isReadonly   
        }
        else if (isReadonly && key === "__v_isReadonly" /* reactiveFlags.IS_READONLY */) {
            return true;
        }
        if (isShollow) {
            return _vlaue;
        }
        if (isObject$1(_vlaue)) {
            return isReadonly ? readonly(_vlaue) : reactive(_vlaue);
        }
        if (!isReadonly) {
            // track
            track(target, key);
        }
        return _vlaue;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const _vlaue = Reflect.set(target, key, value);
        // trigger
        trigger(target, key);
        return _vlaue;
    };
}
function mutableHandlers() {
    return {
        get,
        set,
    };
}
function readonlyHandlers() {
    return {
        get: readonlyGet,
        set(target, key, value) {
            console.warn(`${String(key)}不可更改，因为${target}是只读的。`);
            return true;
        }
    };
}
function shallowReadonlyHandlers() {
    return {
        get: shallowReadonlyGet,
        set(target, key, value) {
            console.warn(`${String(key)}不可更改，因为${target}是只读的。`);
            return true;
        }
    };
}

function createActiveObject(raw, baseHandler) {
    if (typeof raw !== 'object') {
        console.warn('proxy is object');
    }
    return new Proxy(raw, baseHandler);
}
function reactive(raw) {
    // const proxy = new Proxy(raw, mutableHandlers())
    // return proxy
    return createActiveObject(raw, mutableHandlers());
}
function readonly(raw) {
    // const proxy = new Proxy(raw, readonlyHandlers())
    // return proxy
    return createActiveObject(raw, readonlyHandlers());
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers());
}

class RefImply {
    constructor(raw) {
        this.IS_REF = true;
        this._rawValue = raw;
        this._value = convert(raw);
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if (isChange(this._rawValue, newValue)) {
            this._value = convert(newValue);
            this._rawValue = newValue;
            triggerEffect(this.dep);
        }
    }
}
function trackRefValue(ref) {
    if (trackking()) {
        trackEffect(ref.dep);
    }
}
function convert(raw) {
    // 如果是对象就reactive它
    return isObject$1(raw) ? reactive(raw) : raw;
}
function ref(raw) {
    return new RefImply(raw);
}
function isRef(value) {
    return !!value.IS_REF;
}
function unRef(value) {
    return isRef(value) ? value.value : value;
}
// const user = {
//     age: ref(10),
//     name: "xiaohong",
//   };
//   const proxyUser = proxyRefs(user);
//   expect(user.age.value).toBe(10);
//   expect(proxyUser.age).toBe(10);
// return 出来的ref 在模板中解开
function proxyRefs(raw) {
    return new Proxy(raw, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

function add(a, b) {
    return a + b;
}

function emit(instance, event, ...args) {
    // tpp思想
    // 先实现特定  ---》 再扩展为通用
    // 特定，只实现当前onAdd
    // instance.props['onAdd'] && instance.props['onAdd']()
    // 扩展
    // on-add-foo  ==> onAddFoo
    function camelize(str) {
        return str.replace(/-(\w)/g, (...args) => {
            console.log('args', args);
            return args[1] ? args[1].toLocaleUpperCase() : "";
        });
    }
    function capitalize(str) {
        return str ? str.charAt(0).toLocaleUpperCase() + str.slice(1) : '';
    }
    function toHandlerKey(str) {
        return str ? 'on' + capitalize(str) : '';
    }
    const _eventName = toHandlerKey(camelize(event));
    const _handler = instance.props[_eventName];
    _handler && _handler(...args);
}

function initProps(instance, props) {
    instance.props = props || {};
}

function isObject(value) {
    return value !== null && typeof value === 'object';
}
function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

const publicPropertiesMap = {
    '$el': (i) => i.vnode.el,
    "$slots": (i) => i.slots,
    "$props": (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    // get(target, key) {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        // if(key in setupState) {
        //     return setupState[key]
        // }
        // if(key === '$el') {
        //     return instance.vnode.el
        // }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initSlots(instance, children) {
    const { vnode } = instance;
    // 初始，h函数插槽
    // instance.slots = Array.isArray(children) ? children : [children]
    // 优化前--具名插槽
    // let slots = {}
    // for (const name in children) {
    //     slots[name] = Array.isArray(children[name]) ? children[name] : [children[name]]
    // }
    // instance.slots = slots
    // 优化前--作用域插槽（完成）
    // let slots = {}
    // for (const name in children) {
    //     slots[name] = (props) => Array.isArray(children[name](props)) ? children[name](props) : [children[name](props)]
    // }
    // instance.slots = slots
    // 优化
    if (vnode.shapeFlags & 16 /* ShapeFlags.SLOT */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const name in children) {
        slots[name] = (props) => normalizeSloteValue(children[name](props));
    }
}
function normalizeSloteValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        render: null,
        setupState: {},
        emit: () => { },
        props: {},
        slots: {},
        parent,
        provider: parent ? parent.provider : {},
        isMounted: false,
        subTree: null,
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // todo
    initProps(instance, instance.vnode.props);
    instance.vnode.children && initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    //代理render中的属性加入setup返回值
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers
    // {
    //     get(target, key) {
    //         const { setupState } = instance
    //         if(key in setupState) {
    //             return setupState[key]
    //         }
    //         if(key === '$el') {
    //             return instance.vnode.el
    //         }
    //     },
    // }
    );
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function Object
    // todo function
    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    instance.render = Component.render;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(val) {
    currentInstance = val;
}
let compiler;
function registerCompiler(render) {
    compiler = render;
}

function shouldComponentUpdate(n1, n2) {
    for (const key in n1) {
        if (n2[key] !== n1[key]) {
            return true;
        }
    }
    return false;
}

const Fragment = Symbol('fragment');
const Text = Symbol('textNode');
function createVnode(type, props, children) {
    const _vnode = {
        type,
        props,
        children,
        shapeFlags: getShapeFlags(type),
        el: null,
        component: null,
        key: props === null || props === void 0 ? void 0 : props.key,
    };
    if (typeof children === 'string') {
        // 用位运算 | 设置值，& 读取值
        // | 对比 都是0才为0
        // & 对比 都是1才为1
        _vnode.shapeFlags = 4 /* ShapeFlags.TEXT_CHILDREN */ | _vnode.shapeFlags;
    }
    else if (Array.isArray(children)) {
        _vnode.shapeFlags = 8 /* ShapeFlags.ARRAY_CHILDREN */ | _vnode.shapeFlags;
    }
    if (_vnode.shapeFlags & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (isObject(children)) {
            _vnode.shapeFlags = _vnode.shapeFlags | 16 /* ShapeFlags.SLOT */;
        }
    }
    return _vnode;
}
function createTextNode(text) {
    return createVnode(Text, null, text);
}
function getShapeFlags(type) {
    if (typeof type === 'string') {
        return 1 /* ShapeFlags.ELEMENT */;
    }
    else if (isObject(type)) {
        return 2 /* ShapeFlags.STATEFUL_COMPONENT */;
    }
}

// import { _render } from "../runtime-dom/index"
function createAppApi(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 先转化为 vnode，后续所有操作基于vonde处理
                // component ————> vonde
                const vnode = createVnode(rootComponent);
                render(vnode, rootContainer);
            }
        };
    };
}

const queue = [];
let isFlushPending = false;
function nextTick(fn) {
    return fn ? Promise.resolve().then(fn) : Promise.resolve();
}
function queueJobs(jobs) {
    if (!queue.includes(jobs)) {
        queue.push(jobs);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending) {
        return;
    }
    isFlushPending = true;
    Promise.resolve().then(() => {
        isFlushPending = false;
        let job;
        while (job = queue.shift()) {
            job && job();
        }
    });
}

function createRenderer(option) {
    const { createElement: hostCreateElement, patchProps: hostPatchProps, insert: hostInsert, unmountChilren: hostUnmountChilren, setElementText: hostSetElementText, } = option;
    function render(vnode, container) {
        // 调用patch
        patch(null, vnode, container, null, null);
    }
    // n1 上一次的vonde，旧的
    // n2 这次的vonde，新的
    function patch(n1, n2, container, parent, anchor) {
        // 处理组件，
        // 判断vnode是不是element还是component
        console.log('vnode', n2);
        const { type } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parent, anchor);
                break;
            case Text:
                processTextNode(n1, n2, container);
                break;
            default:
                if (2 /* ShapeFlags.STATEFUL_COMPONENT */ & n2.shapeFlags) {
                    // if(isObject(type)) {
                    // 是对象就是component
                    processComponent(n1, n2, container, parent, anchor);
                }
                else if (1 /* ShapeFlags.ELEMENT */ & n2.shapeFlags) {
                    // } else if(typeof type === 'string') {
                    // 是字符串就是element
                    processElemnet(n1, n2, container, parent, anchor);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parent, anchor) {
        children(n2, container, parent, anchor);
    }
    function processTextNode(n1, n2, container, parent) {
        const { children } = n2;
        const _children = (n2.el = document.createTextNode(children));
        container.append(_children);
    }
    function processElemnet(n1, n2, container, parent, anchor) {
        if (!n1) {
            mountElement(n2, container, parent, anchor);
        }
        else {
            patchElement(n1, n2, container, parent, anchor);
        }
    }
    function patchElement(n1, n2, container, parent, anchor) {
        console.log('n1', n1);
        console.log('n2', n2);
        const { props: prevProps } = n1 || {};
        const { props: nextProps } = n2 || {};
        const _el = (n2.el = n1.el);
        // patchChilren
        patchChilren(n1, n2, _el, parent, anchor);
        // patchProps
        patchProps(_el, prevProps, nextProps);
    }
    function unmountChilren(childrens) {
        for (const child of childrens) {
            hostUnmountChilren(child.el);
        }
    }
    function patchChilren(n1, n2, container, parent, anchor) {
        // debugger
        const { shapeFlags: preShapeFlags, children: preChildren } = n1;
        const { shapeFlags, children } = n2;
        if (shapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // 新的是文本节点
            if (preShapeFlags & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // Array --> text
                unmountChilren(preChildren);
                hostSetElementText(children, container);
            }
            else {
                // text --> text
                hostSetElementText(children, container);
            }
        }
        else {
            // 新的是数组节点
            if (preShapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                // text --> Array
                hostSetElementText('', container);
                children.forEach(child => {
                    patch(null, child, container, parent, anchor);
                });
            }
            else {
                // Array --> Array
                patchKeyedChild(preChildren, children, container, parent, anchor);
            }
        }
    }
    function patchKeyedChild(preChildren, children, container, parent, parentAnchor) {
        let i = 0;
        let e1 = preChildren.length - 1;
        let e2 = children.length - 1;
        function compareVnode(v1, v2) {
            return v1.type === v2.type && v1.key === v2.key;
        }
        // 1、左侧对比
        // (a b) c
        // (a b) d e
        while (i <= e1 && i <= e2) {
            if (compareVnode(preChildren[i], children[i])) {
                patch(preChildren[i], children[i], container, parent, parentAnchor);
            }
            else {
                break;
            }
            i += 1;
        }
        // 2、右侧对比
        // a (b c)
        // d e (b c)
        while (i <= e1 && i <= e2) {
            if (compareVnode(preChildren[e1], children[e2])) {
                patch(preChildren[e1], children[e2], container, parent, parentAnchor);
            }
            else {
                break;
            }
            e1 -= 1;
            e2 -= 1;
        }
        if (i > e1) {
            // 3、新增  i > e1
            if (i <= e2) {
                // 1）左侧对比，右侧新增
                // (a b)         e1
                // (a b) c       e2
                //  -----------------------------------   i=2 e1=1 e2=2
                // (a b)
                // (a b) c d
                //  -----------------------------------   i=2 e1=1 e2=3
                // 2）右侧对比，左侧新增
                //   (a b)
                // c (a b)
                // -----------------------------------   i=0 e1=-1 e2=0
                //     (a b)
                // d c (a b)
                // -----------------------------------   i=0 e1=-1 e2=1
                const nextPos = e2 + 1;
                const anchor = nextPos < children.length ? children[nextPos].el : null;
                while (i <= e2) {
                    patch(null, children[i], container, parent, anchor);
                    i += 1;
                }
            }
        }
        else if (i > e2) {
            // 4、删除 i > e2
            // 1）左侧对比，右侧删除
            // (a b) c
            // (a b)
            // -----------------------------------   i=2 e1=2 e2=1
            // (a b) c d
            // (a b)
            // -----------------------------------   i=2 e1=3 e2=1  
            // 2）右侧对比，左侧删除
            // a (b c)
            //   (b c)
            // -----------------------------------   i=0 e1=0 e2=-1
            // d a (b c)
            //     (b c)
            // -----------------------------------   i=0 e1=1 e2=-1
            while (i <= e1) {
                const _children = preChildren[i];
                hostUnmountChilren(_children.el);
                i += 1;
            }
        }
        else {
            const _nextMiddleStart = e2 - i;
            const _keyToNewIndexMap = new Map();
            // 0 1  2 3 4  5 6
            //      
            // a,b,(c,d,e),f,g
            // a,b,(e,c,d),f,g
            //index 0 1 2
            //value 0 0 0     
            //     [4 2 3]  --------------> _newIndexToOldIndexMap
            // 老节点索引在新节点中的映射 
            const _newIndexToOldIndexMap = new Array(_nextMiddleStart + 1);
            // for (let index = i; index <= e2; index++) {
            //     _newIndexToOldIndexMap[index] = 0
            // }
            for (let index = 0; index <= e2 - i; index++) {
                _newIndexToOldIndexMap[index] = 0;
            }
            // 优化 引入变量，解决
            // a,b,(c,e,d),f,g
            // a,b,(e,c),f,g
            // 当c,e,对比patch完成后，patch数量大于等于新节点middle中间值时，剩下的都是要删除的节点，直接删除，优化性能
            let _patched = 0;
            let _middleCount = _nextMiddleStart + 1;
            for (let n = i; n <= e2; n++) {
                _keyToNewIndexMap.set(children[n].key, n);
            }
            for (let p = i; p <= e1; p++) {
                if (_patched >= _middleCount) {
                    // 删除
                    hostUnmountChilren(preChildren[p].el);
                    continue;
                }
                const _preC = preChildren[p];
                let _newIndex;
                if (_preC.key !== null) {
                    _newIndex = _keyToNewIndexMap.get(_preC.key);
                }
                else {
                    for (let j = i; j < e2; j++) {
                        if (compareVnode(children[j], _preC)) {
                            _newIndex = j;
                            break;
                        }
                    }
                }
                if (_newIndex === undefined) {
                    // 删除
                    hostUnmountChilren(_preC.el);
                }
                else {
                    // 相同的patch，处理props
                    patch(_preC, children[_newIndex], container, parent, null);
                    _patched += 1;
                }
                // 遍历老节点为_newIndexToOldIndexMap赋值     p+1是为了避免p=0的情况，应为初始化为0
                _newIndexToOldIndexMap[_newIndex - i] = p + 1;
            }
            // 0 1  2 3 4  5 6
            // a,b,(c,d,e),f,g
            // a,b,(e,c,d),f,g            
            //     [4 2 3]  --------------> _newIndexToOldIndexMap
            //        23为稳定序列
            // 最长子序列： [1,2]
            const _increasingNewIndexSequence = getSequence(_newIndexToOldIndexMap);
            console.log('_increasingNewIndexSequence', _increasingNewIndexSequence);
            // let _sequenceIndex = 0
            // for (let s = i; s < _increasingNewIndexSequence.length + 1; s+=1) {
            //     if(s - i !== _increasingNewIndexSequence[_sequenceIndex]) {
            //         // 不等于稳定序列索引值，移动
            //         const _anthor = 
            //     } else {
            //         _sequenceIndex+=1
            //     }
            // }
            // 反向循环，因为insert需要插入anthor前面，所以从后面稳定的元素，开始循环，插入稳定元素前面。
            let _sequenceIndex = _increasingNewIndexSequence.length - 1;
            for (let s = e2; s >= i; s -= 1) {
                const _anthor = s + 1 < children.length ? children[s + 1] : null;
                if (_newIndexToOldIndexMap[s - i] === 0) {
                    // 等于0 即 初始化的0，即 遍历旧节点没有赋值，即，为新增节点
                    patch(null, children[s], container, parent, _anthor.el);
                }
                else {
                    // 不等于0，看是不是为稳定序列，不是稳定序列移动
                    if (s - i !== _increasingNewIndexSequence[_sequenceIndex]) {
                        // 不等于稳定序列索引值，移动
                        hostInsert(children[s].el, container, _anthor.el);
                    }
                    else {
                        _sequenceIndex -= 1;
                    }
                }
            }
        }
    }
    function patchProps(el, prevProps, nextProps) {
        if (prevProps === nextProps)
            return;
        // 1、props 值变了（就包括了增加新值的情况，因为新值为undefind）
        // 2、props 值变为undefind null，在hostPatchProps处理删除
        for (const key in nextProps) {
            const _nextVal = nextProps[key];
            const _prevVal = prevProps[key];
            if (_nextVal !== _prevVal) {
                hostPatchProps(el, key, _prevVal, _nextVal);
            }
        }
        // 3、props 值没有了
        for (const key in prevProps) {
            if (!(key in nextProps)) {
                hostPatchProps(el, key, prevProps[key], null);
            }
        }
    }
    function mountElement(vonde, container, parent, anchor) {
        const { type, children, props } = vonde;
        // 1、createElement
        // const el = (vonde.el = document.createElement(type))
        const el = (vonde.el = hostCreateElement(type));
        // 2、patchProps
        // const isOn = (key:string) => /^on[A-Z]/.test(key) 
        // for (const key in props) {
        //     const _val = props[key]
        //     if(isOn(key)) {
        //         el.addEventListener(key.slice(2).toLocaleLowerCase(), _val)
        //     } else {
        //         el.setAttribute(key, _val)
        //     }
        // }
        for (const key in props) {
            const _val = props[key];
            hostPatchProps(el, key, null, _val);
        }
        // 3、handle children
        if (vonde.shapeFlags & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            // if(Array.isArray(children)) {
            children.forEach(child => {
                patch(null, child, el, parent, anchor);
            });
            // moutChildren(vnode, el)
        }
        else if (vonde.shapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // } else if(typeof children === 'string') {
            el.textContent = children;
        }
        // 4、insert
        // container.append(el)
        hostInsert(el, container, anchor);
    }
    function children(vonde, container, parent, anchor) {
        vonde.children.forEach(child => {
            patch(null, child, container, parent, anchor);
        });
    }
    function processComponent(n1, n2, container, parent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parent, anchor);
        }
        else {
            patchComponent(n1, n2);
        }
    }
    function patchComponent(n1, n2, container, parent, anchor) {
        const instance = (n2.component = n1.component);
        if (shouldComponentUpdate(n1.props, n2.props)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVnode, container, parent, anchor) {
        const instance = createComponentInstance(initialVnode, parent);
        initialVnode.component = instance;
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container, anchor);
    }
    function setupRenderEffect(instance, initialVnode, container, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                console.log('init');
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                patch(null, subTree, container, instance, anchor);
                instance.isMounted = true;
                initialVnode.el = subTree.el;
            }
            else {
                console.log('update');
                const { proxy, subTree: prevSubTree, next, vnode } = instance;
                if (next) {
                    // 组件更新逻辑
                    next.el = vnode.el;
                    instance.vnode = next;
                    instance.next = null;
                    instance.props = next.props;
                }
                const subTree = instance.render.call(proxy, proxy);
                console.log('prevSubTree', prevSubTree);
                console.log('subTree', subTree);
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                queueJobs(instance.update);
            }
        });
    }
    return {
        createApp: createAppApi(render)
    };
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function h(type, props, children) {
    return createVnode(type, props, children);
}

function renderSlots(slot, name, props) {
    const _slot = slot[name];
    if (_slot) {
        if (typeof _slot === 'function') {
            return createVnode(Fragment, {}, _slot(props));
        }
    }
}

function provide(key, value) {
    const _currentInstance = getCurrentInstance();
    if (_currentInstance) {
        let { provider } = _currentInstance;
        const { provider: parentProvider } = _currentInstance.parent;
        // init 当子组件第一次调用provide时初始化provider，当多次调用不触发，防止把已经设置值的provide再次清空为空对象
        if (provider === parentProvider) {
            provider = _currentInstance.provider = Object.create(parentProvider);
        }
        provider[key] = value;
    }
}
function inject(key, defaultVal) {
    const _currentInstance = getCurrentInstance();
    if (_currentInstance) {
        // const { parent } = _currentInstance
        const { provider: parentProvider } = _currentInstance.parent;
        if (key in parentProvider) {
            return parentProvider[key];
        }
        else if (defaultVal) {
            if (typeof defaultVal === 'function') {
                return defaultVal();
            }
            return defaultVal;
        }
    }
}

function toDisplayString(str) {
    return String(str);
}

function createElement(type) {
    return document.createElement(type);
}
function patchProps(el, key, preVal, val) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        el.addEventListener(key.slice(2).toLocaleLowerCase(), val);
    }
    else {
        if (val === null || val === undefined) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, val);
        }
    }
}
function insert(el, parent, anchor) {
    // parent.append(el)
    parent.insertBefore(el, anchor || null);
}
function unmountChilren(children) {
    if (children.parentNode) {
        children.parentNode.removeChild(children);
    }
}
function setElementText(text, container) {
    container.textContent = text;
}
const renderer = createRenderer({ createElement, patchProps, insert, unmountChilren, setElementText });
function createApp(...args) {
    return renderer.createApp(...args);
}

var runtime_core = /*#__PURE__*/Object.freeze({
    __proto__: null,
    add: add,
    createApp: createApp,
    createElement: createElement,
    createElementVNode: createVnode,
    createRenderer: createRenderer,
    createTextNode: createTextNode,
    effect: effect,
    getCurrentInstance: getCurrentInstance,
    h: h,
    inject: inject,
    insert: insert,
    nextTick: nextTick,
    patchProps: patchProps,
    provide: provide,
    proxyRefs: proxyRefs,
    ref: ref,
    renderSlots: renderSlots,
    renderer: renderer,
    setElementText: setElementText,
    toDisplayString: toDisplayString,
    unmountChilren: unmountChilren
});

// mini-vue出口
// export * from './reactivity/index'
function compileToFunction(template) {
    const _code = baseCompile(template);
    return new Function('Vue', _code)(runtime_core);
}
// 使用registerCompiler解耦
// 因为Vue 模块性，不建议runtime-dom里面直接引入compiler-dom,所以，使用registerCompiler注入，进行解耦。
registerCompiler(compileToFunction);

export { add, createApp, createElement, createVnode as createElementVNode, createRenderer, createTextNode, effect, getCurrentInstance, h, inject, insert, nextTick, patchProps, provide, proxyRefs, ref, renderSlots, renderer, setElementText, toDisplayString, unmountChilren };
