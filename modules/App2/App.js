// @ts-check
import { prop, autoWatch, makeComponent, renderer } from "../lib/August2.mjs"

const getHeader = async () => await (await import("./Header.js")).Header

function SampleComponent() {
	// Business logic

	this.random = prop(Math.random())

	this.renderOptions = {
		html: /*html*/ `
        <div class="line" [prop.text-content]="random.value"></div>
        `,
		css: ``,
	}
}

function App() {
	// Business logic
	this.user = prop({ name: "Chandler" })
	this.searchText = prop("")

	this.header = prop(makeComponent(getHeader))

	autoWatch(() => {
		let clicked = this.header.value?.clicked.value
		if (!clicked) return

		console.log("clicked")
		this.searchText.value = ""
		this.user.value = { name: "Bhaskara" }
	})

	autoWatch(() => {
		console.log("autoWatch -> searchText:", this.searchText.value)
	})

	this.sampleComponents = prop(
		Promise.all([
			makeComponent(() => SampleComponent),
			makeComponent(() => SampleComponent),
			makeComponent(() => SampleComponent),
			makeComponent(() => SampleComponent),
			makeComponent(() => SampleComponent),
			makeComponent(() => SampleComponent),
		])
	)

	this.renderOptions = {
		html: /*html*/ `
        <div class="start">
            <header [component]="header.value"></header>
            <span [prop.text-content]="user.value.name"></span>
            <br>
            <input [prop.value]="searchText.value" (event.input.target.value)="searchText.value" />
            <span [prop.text-content]="searchText.value" ></span>
            <div [components]="sampleComponents.value"></div>
        </div>
        `,
		css: `.start {color:red}`,
	}
}

async function bootstrap() {
	let AppComponent = await makeComponent(() => App)
	renderer({ srcElement: document.body, state: AppComponent })
}
bootstrap()
