'use strict';

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
    "$slots": (i) => i.slots
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
    instance.render = Component.render;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(val) {
    currentInstance = val;
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
        debugger;
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
        debugger;
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
        else ;
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
        mountComponent(n2, container, parent, anchor);
    }
    function mountComponent(initialVnode, container, parent, anchor) {
        const instance = createComponentInstance(initialVnode, parent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container, anchor);
    }
    function setupRenderEffect(instance, initialVnode, container, anchor) {
        effect(() => {
            if (!instance.isMounted) {
                console.log('init');
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance, anchor);
                instance.isMounted = true;
                initialVnode.el = subTree.el;
            }
            else {
                console.log('update');
                const { proxy, subTree: prevSubTree } = instance;
                const subTree = instance.render.call(proxy);
                console.log('prevSubTree', prevSubTree);
                console.log('subTree', subTree);
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        });
    }
    return {
        createApp: createAppApi(render)
    };
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

exports.add = add;
exports.createApp = createApp;
exports.createElement = createElement;
exports.createRenderer = createRenderer;
exports.createTextNode = createTextNode;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.insert = insert;
exports.patchProps = patchProps;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.renderSlots = renderSlots;
exports.renderer = renderer;
exports.setElementText = setElementText;
exports.unmountChilren = unmountChilren;
