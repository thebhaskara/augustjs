// @ts-check
/// <reference path="../../types/August.d.ts" />

//https://stackoverflow.com/questions/2559318/how-to-check-for-an-undefined-or-null-variable-in-javascript
/** @type {isCheck} */
const isNil = (test) => test == null

//https://stackoverflow.com/questions/31538010/test-if-a-variable-is-a-primitive-rather-than-an-object
/** @type {isCheck} */
const isPrimitive = (test) => test !== Object(test)

//https://stackoverflow.com/questions/5999998/check-if-a-variable-is-of-function-type
/** @type {isCheck} */
function isFunction(functionToCheck) {
    return (
        functionToCheck &&
        {}.toString.call(functionToCheck) === "[object Function]"
    )
}

//https://stackoverflow.com/questions/57556471/convert-kebab-case-to-camelcase-with-javascript
/** @type {stringCb} */
const camelize = (s) => s.replace(/-./g, (x) => x[1].toUpperCase())

/** @type {splitPath} */
const splitPath = (path) => path.split(/[\.\[\]'"\?]/).filter((a) => a.trim())

/** @type {normalizePath} */
const normalizePath = (path) =>
    (Array.isArray(path) ? path : splitPath(path)).join(".")

/** @type {getCb} */
function get(obj, path) {
    if (isNil(obj)) return obj
    if (obj instanceof AugustState) return obj.get(path)
    if (!Array.isArray(path)) return get(obj, splitPath(path))
    let [prop, ...rest] = path
    if (rest.length == 0) return obj[prop]
    return get(obj[prop], rest)
}

/** @type {setCb} */
function set(obj, path, value) {
    if (obj instanceof AugustState) return obj.set(path, value)
    if (!Array.isArray(path)) return set(obj, splitPath(path), value)
    let [prop, ...rest] = path
    if (rest.length == 0) return (obj[prop] = value)
    if (isNil(obj[prop]) || isPrimitive(obj[prop])) {
        obj[prop] = Number.isNaN(+rest[0]) ? {} : []
    }
    return set(obj[prop], rest, value)
}

/** @type {Set<Function>} */
let watchCallbacks = new Set()
let isMicrotaskAdded = false
function addCb(cb) {
    watchCallbacks.add(cb)
    if (isMicrotaskAdded) return
    isMicrotaskAdded = true
    queueMicrotask(() => {
        isMicrotaskAdded = false
        let temp = watchCallbacks
        watchCallbacks = new Set()
        temp.forEach((cb) => cb())
    })
}

let idc = 0
export class AugustState {
    #state = {}

    /** @type {Map<number, AugustWatch>} */
    #watches = new Map()

    /** @type {AugustGetCb} */
    get = (path) => get(this.#state, path)

    /** @type {AugustGetStateCb} */
    getState = (...paths) => paths.map((path) => this.get(path))

    /** @type {AugustSetCb} */
    set(path, value) {
        set(this.#state, path, value)
        if (value instanceof AugustState) {
            value.watch([""], (p2) => {
                this.#trigger(normalizePath(`${path}.${p2}`))
            })
        }
        this.#trigger(normalizePath(path))
    }

    /** @type {AugustSetStateCb} */
    setState = (obj) =>
        Object.keys(obj).forEach((path) => this.set(path, obj[path]))

    /** @type {AugustTriggerCb} */
    #trigger = (path) => {
        this.#watches.forEach((watch) => {
            if (watch.path == "") return watch.callback(path)
            if (path == watch.path) return addCb(watch.cb)
            if (path.startsWith(watch.path + ".")) return addCb(watch.cb)
            if (watch.path.startsWith(path + ".")) return addCb(watch.cb)
        })
    }

    /** @type {AugustWatchCb} */
    watch([...paths], callback) {
        let controller = new AbortController()
        let cb = async () => {
            let values = this.getState(...paths)
            let isValid = (val, i) => paths[i].endsWith("?") || !isNil(val)
            if (values.every(isValid)) {
                controller.abort()
                controller = new AbortController()
                let result = await callback(values, controller.signal)
                if (result) {
                    this.setState(result)
                }
            }
        }
        let watches = paths.map((path) => {
            let watch = { id: idc++, cb, callback, path: normalizePath(path) }
            this.#watches.set(watch.id, watch)
            return watch
        })
        addCb(cb)

        return () => {
            controller.abort()
            watches.forEach((watch) => this.#watches.delete(watch.id))
        }
    }
}

/** @type {renderer} */
export async function renderer({
    getComponent,
    srcElement = document.createElement("div"),
    state = new AugustState(),
}) {
    let component = await getComponent()
    let options = await component(state)

    srcElement.innerHTML = options.html

    srcElement.querySelectorAll("*").forEach((element) => {
        let attributes = [...element.attributes]
        attributes.forEach((attribute) => {
            binders.forEach((binder) => {
                let matches = [...attribute.name.matchAll(binder.regex)]
                if (matches.length > 0) {
                    binder.callback({
                        element,
                        attribute,
                        match: matches[0],
                        state,
                    })
                }
            })
        })
    })

    let style = document.createElement("style")
    style.textContent = options.css

    srcElement.appendChild(style)
}

/** @type {AugustBinder[]} */
let binders = []
/** @type {(binder: AugustBinder) => void} */
export function addBinder({ regex, callback }) {
    binders.push({ regex, callback })
}

addBinder({
    regex: /\(event\.(.*)\)/g,
    callback: ({ element, attribute, match, state }) => {
        let eventDef = match[1]
        let [eventName, ...rest] = splitPath(camelize(eventDef))

        element.addEventListener(eventName, (ev) => {
            if (rest.length == 0) return state.set(attribute.value, ev)

            let v = get(ev, rest)
            if (isFunction(v)) {
                v.call(ev)
            } else {
                state.set(attribute.value, v)
            }
        })
    },
})

addBinder({
    regex: /\[prop\.(.*)\]/g,
    callback: ({ element, attribute, match, state }) => {
        let propertyName = camelize(match[1])
        state.watch([`${attribute.value}?`], ([value]) => {
            element[propertyName] = value
        })
    },
})

addBinder({
    regex: /\[class\.(.*)\]/g,
    callback: ({ element, attribute, match, state }) => {
        let className = camelize(match[1])
        state.watch([`${attribute.value}?`], ([value]) => {
            if (value) {
                element.classList.add(className)
            } else {
                element.classList.remove(className)
            }
        })
    },
})

addBinder({
    regex: /\[attr\.(.*)\]/g,
    callback: ({ element, attribute, match, state }) => {
        let attributeName = match[1]
        state.watch([`${attribute.value}?`], ([value]) => {
            if (value) {
                element.setAttribute(attributeName, value)
            } else {
                element.removeAttribute(attributeName)
            }
        })
    },
})

export class AugustComponent extends AugustState {
    #getComponent
    constructor(getComponent) {
        super()
        this.#getComponent = getComponent
    }

    /** @type {AugustComponentRender} */
    async render(srcElement) {
        renderer({
            getComponent: this.#getComponent,
            srcElement,
            state: this,
        })
    }
}

addBinder({
    regex: /\[component\]/g,
    callback: ({ element, attribute, match, state }) => {
        let prevComponent
        state.watch([`${attribute.value}?`], async ([component]) => {
            if (prevComponent == component) return
            prevComponent = component
            element.innerHTML = ""
            if (component) {
                await component.render(element)
            }
        })
    },
})
