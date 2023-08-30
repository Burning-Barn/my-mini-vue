function isObject$1(value) {
    return value !== null && typeof value === 'object';
}

const targetMap = new Map();
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
    '$el': (i) => i.vnode.el
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

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        render: null,
        setupState: {},
        emit: () => { }
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // todo
    initProps(instance, instance.vnode.props);
    // initSlots()
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
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function Object
    // todo function
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}

function render(vnode, container) {
    // 调用patch
    patch(vnode, container);
}
function patch(vonde, container) {
    // 处理组件，
    // 判断vnode是不是element还是component
    console.log('vnode', vonde);
    if (2 /* ShapeFlags.STATEFUL_COMPONENT */ & vonde.shapeFlags) {
        // if(isObject(type)) {
        // 是对象就是component
        processComponent(vonde, container);
    }
    else if (1 /* ShapeFlags.ELEMENT */ & vonde.shapeFlags) {
        // } else if(typeof type === 'string') {
        // 是字符串就是element
        processElemnet(vonde, container);
    }
}
function processElemnet(vonde, container) {
    mountElement(vonde, container);
}
function mountElement(vonde, container) {
    const { type, children, props } = vonde;
    const el = (vonde.el = document.createElement(type));
    const isOn = (key) => /^on[A-Z]/.test(key);
    for (const key in props) {
        const _val = props[key];
        if (isOn(key)) {
            el.addEventListener(key.slice(2).toLocaleLowerCase(), _val);
        }
        else {
            el.setAttribute(key, _val);
        }
    }
    if (vonde.shapeFlags & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        // if(Array.isArray(children)) {
        children.forEach(child => {
            patch(child, el);
        });
        // moutChildren(vnode, el)
    }
    else if (vonde.shapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        // } else if(typeof children === 'string') {
        el.textContent = children;
    }
    container.append(el);
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(initialVnode, container) {
    const instance = createComponentInstance(initialVnode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(instance, initialVnode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    // vnode  ---> patch
    // vnode  ---> element --> mountElemnt
    patch(subTree, container);
    initialVnode.el = subTree.el;
}

function createVnode(type, props, children) {
    const _vnode = {
        type,
        props,
        children,
        shapeFlags: getShapeFlags(type),
        el: null
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
    return _vnode;
}
function getShapeFlags(type) {
    if (typeof type === 'string') {
        return 1 /* ShapeFlags.ELEMENT */;
    }
    else if (isObject(type)) {
        return 2 /* ShapeFlags.STATEFUL_COMPONENT */;
    }
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 先转化为 vnode，后续所有操作基于vonde处理
            // component ————> vonde
            const vnode = createVnode(rootComponent);
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVnode(type, props, children);
}

export { createApp, h };
