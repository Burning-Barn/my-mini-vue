const publicPropertiesMap = {
    '$el': (i) => i.vnode.el
};
const PublicInstanceProxyHandlers = {
    // get(target, key) {
    get({ _: instance }, key) {
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
        }
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
        setupState: {}
    };
    return component;
}
function setupComponent(instance) {
    // todo
    // initProps()
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
        const setupResult = setup();
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

function isObject(value) {
    return value !== null && typeof value === 'object';
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
