// import { AugustState } from "../modules/lib/August.mjs"

type isCheck = (test: any) => boolean
type stringCb = (str: string) => string

type splitPath = (path: string) => string[]

type pathLike = string | string[]

type normalizePath = (path: pathLike) => string
type getCb = (obj: any, path: pathLike) => any
type setCb = (obj: any, path: pathLike, value: any) => void

type AugustGetCb = (path: pathLike) => any
type AugustGetStateCb = (...paths: pathLike[]) => any[]
type AugustSetCb = (path: pathLike, value: any) => void
type AugustSetStateCb = (state: any) => void
type AugustTriggerCb = (path: string) => void
type AugustWatchCb = (
	paths: string[],
	callback: Function | null,
	checkCallback?: (
		values: any[],
		paths: string[],
		curentPath: string
	) => boolean
) => Function

interface AugustWatch {
	id: number
	validate: Function
	cb: Function
	callback: Function | null
	path: string
}

interface AugustRendererInput {
	getComponent: () => Promise<Function>
	srcElement: HTMLElement
	state: import("../modules/lib/August.mjs").AugustState
}

type renderer = (
	input: AugustRendererInput
) => Promise<[Element[], HTMLStyleElement]>

interface AugustBinderCallbackInput {
	element: Element
	attribute: Attr
	match: string[]
	state: import("../modules/lib/August.mjs").AugustState
}

interface AugustBinder {
	regex: RegExp
	callback: (input: AugustBinderCallbackInput) => void
}

type AugustComponentRender = (srcElement: HTMLElement) => Promise<void>

type AugustFunctionalComponent = (
	state: import("../modules/lib/August.mjs").AugustState
) => {
	html: string
	css: string
}
