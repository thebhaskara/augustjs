// @ts-check
/// <reference path="../../types/August2.d.ts" />

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

/** @type {getCb} */
function get(obj, path) {
	if (isNil(obj)) return obj
	// if (obj instanceof AugustState) return obj.get(path)
	if (!Array.isArray(path)) return get(obj, splitPath(path))
	let [prop, ...rest] = path
	if (rest.length == 0) return obj[prop]
	return get(obj[prop], rest)
}

/** @type {setCb} */
function set(obj, path, value) {
	// if (obj instanceof AugustState) return obj.set(path, value)
	if (!Array.isArray(path)) return set(obj, splitPath(path), value)
	let [prop, ...rest] = path
	if (rest.length == 0) return (obj[prop] = value)
	if (isNil(obj[prop]) || isPrimitive(obj[prop])) {
		obj[prop] = Number.isNaN(+rest[0]) ? {} : []
	}
	return set(obj[prop], rest, value)
}

/**
 *
 *
 * @template Type
 * @param {Promise<Type> | Type} [defaultValue]
 * @return
 */
export function prop(defaultValue) {
	/** @type {Type | undefined} */
	let value
	if (defaultValue instanceof Promise) {
		defaultValue.then((value) => (valueSet.value = value))
	} else {
		value = defaultValue
	}
	/** @type {Set<Function>} */
	let callbacks = new Set()
	let valueSet = {
		get value() {
			autoWatchStack.at(-1)?.(valueSet)
			return value
		},
		set value(val) {
			value = val
			queueCallbacks(callbacks)
		},
		watch(callback, silent) {
			callbacks.add(callback)
			if (!silent) queueCallbacks([callback])
			return () => {
				callbacks.delete(callback)
				callbackQueue.delete(callback)
			}
		},
	}
	return valueSet
}

/** @type {Set<Function>} */
let callbackQueue = new Set()

let processCallbackQueue = () => {
	queueMicrotask(() => {
		if (callbackQueue.size === 0) return
		callbackQueue.forEach((callback) => callback?.())
		callbackQueue = new Set()
	})
}

/**
 * @param {Function[] | Set<Function>} callbacks
 */
export function queueCallbacks(callbacks) {
	let { size } = callbackQueue
	callbacks.forEach((callback) => callbackQueue.add(callback))
	if (callbackQueue.size > size) {
		processCallbackQueue()
	}
}

let autoWatchStack = []
export function autoWatch(callback) {
	let unsubscribeCallbacks = []
	let unsubscribeFromAutoWatch
	let cb = () => {
		unsubscribeFromAutoWatch?.()
		unsubscribeCallbacks.forEach((callback) => callback?.())
		unsubscribeCallbacks = []
		autoWatchStack.push((valueSet) => {
			unsubscribeCallbacks.push(valueSet.watch(cb, true))
		})
		unsubscribeFromAutoWatch = callback()
		autoWatchStack.pop()
	}
	cb()
}

/**
 * @template T
 * @param {() => Promise<{new (): T}> | {new (): T}} getComponent
 * @return
 */
export async function makeComponent(getComponent) {
	let component = await getComponent()
	return new component()
}

/**
 * @param {{srcElement: Element, state: AugustState2}} param0
 * @returns
 */
export function renderer({
	srcElement = document.createElement("div"),
	state,
}) {
	let options = state.renderOptions

	let div = document.createElement("div")
	div.innerHTML = options.html
	let _elements = [...div.children]

	div.querySelectorAll("*").forEach((element) => {
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

	let _styleElement = document.createElement("style")
	_styleElement.textContent = options.css
	div.appendChild(_styleElement)

	let els = [...div.children]
	els.forEach((el) => srcElement.appendChild(el))

	return [_elements, _styleElement]
}

/** @type {AugustBinder2[]} */
let binders = []
/** @type {(binder: AugustBinder2) => void} */
export function addBinder({ regex, callback }) {
	binders.push({ regex, callback })
}

addBinder({
	regex: /\(event\.(.*)\)/g,
	callback: ({ element, attribute, match, state }) => {
		let eventDef = match[1]
		let [eventName, ...rest] = splitPath(camelize(eventDef))

		element.addEventListener(eventName, (ev) => {
			if (rest.length == 0) {
				// let vs = get(state, attribute.value)
				// vs && (vs.value = ev)
				set(state, attribute.value, ev)
				return
			}
			
			let v = get(ev, rest)
			if (isFunction(v)) {
				v.call(ev)
			} else {
				// let vs = get(state, attribute.value)
				// vs && (vs.value = v)
				set(state, attribute.value, v)
			}
		})
	},
})

addBinder({
	regex: /\[prop\.(.*)\]/g,
	callback: ({ element, attribute, match, state }) => {
		let propertyName = camelize(match[1])

		autoWatch(() => {
			let value = get(state, attribute.value)
			// sometimes undefined is printed out for text fields
			// eg. input element value property
			if (typeof element[propertyName] == "string" && isNil(value)) {
				value = ""
			}
			element[propertyName] = value
		})
	},
})

addBinder({
	regex: /\[class\.(.*)\]/g,
	callback: ({ element, attribute, match, state }) => {
		let className = camelize(match[1])
		autoWatch(() => {
			let value = get(state, attribute.value)
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
		autoWatch(() => {
			let value = get(state, attribute.value)
			if (value) {
				element.setAttribute(attributeName, value)
			} else {
				element.removeAttribute(attributeName)
			}
		})
	},
})

addBinder({
	regex: /\[component\]/g,
	callback: ({ element, attribute, match, state }) => {
		let prevComponent
		autoWatch(() => {
			let component = get(state, attribute.value)
			if (prevComponent == component) return
			prevComponent = component
			element.innerHTML = ""
			if (component) {
				renderer({ srcElement: element, state: component })
			}
		})
	},
})

addBinder({
	regex: /\[components\]/g,
	callback: ({ element, attribute, match, state }) => {
		let prevComponents = new Set()
		autoWatch(() => {
			let components = get(state, attribute.value) ?? []
			// Promise.all(componentspr).then((components) => {
			if (!components) components = []
			// prepare prevComponents for removing unwanted components
			// removing all components that are there in current list
			// so that only unwanted ones are left in prevComponents
			for (const component of components) {
				if (!prevComponents.has(component)) {
					prevComponents.delete(component)
				}
			}
			// the unwanted ones are now removed from DOM
			prevComponents.forEach((component) => {
				if (component.elements?.length > 0) {
					component.elements.forEach((el) => element.removeChild(el))
				}
				if (component.styleElement) {
					element.removeChild(component.styleElement)
				}
			})
			// render the current list of components
			for (const component of components) {
				renderer({ srcElement: element, state: component })
			}
			// finally set theem on prevComponents for next cycle
			prevComponents = new Set(components)
			// })
		})
	},
})
