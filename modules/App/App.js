// @ts-check
import { AugustComponent, renderer } from "../lib/August.mjs"

const getHeader = async () => await (await import("./Header.js")).Header

/** @type {AugustFunctionalComponent} */
function SampleComponent(state) {
	// Business logic

	state.setState({
		random: Math.random(),
	})

	return {
		html: /*html*/ `
        <div class="line" [prop.text-content]="random"></div>
        `,
		css: ``,
	}
}

/** @type {AugustFunctionalComponent} */
function App(state) {
	// Business logic

	state.watch(["header.clicked"], () => {
		console.log("clicked")
		state.set("searchText", null)
		state.set("user", null)
	})

	state.setState({
		user: {
			name: "Chandler",
		},
		header: new AugustComponent(getHeader),
		sampleComponents: [
			new AugustComponent(() => SampleComponent),
			new AugustComponent(() => SampleComponent),
			new AugustComponent(() => SampleComponent),
			new AugustComponent(() => SampleComponent),
			new AugustComponent(() => SampleComponent),
		],
	})

	setTimeout(() => {
		state.setState({
			user: {
				name: "Chandler",
			},
			header: new AugustComponent(getHeader),
			sampleComponents: [
				new AugustComponent(() => SampleComponent),
				new AugustComponent(() => SampleComponent),
				new AugustComponent(() => SampleComponent),
				new AugustComponent(() => SampleComponent),
				new AugustComponent(() => SampleComponent),
			],
		})
	}, 2000)

	state.setState({
		"header.something": 10,
	})

	return {
		html: /*html*/ `
        <div class="start">
            <header [component]="header"></header>
            <span [prop.text-content]="user.name"></span>
            <br>
            <input [prop.value]="searchText" (event.input.target.value)="searchText" />
            <span [prop.text-content]="searchText" ></span>
            <div [components]="sampleComponents"></div>
        </div>
        `,
		css: `.start {color:red}`,
	}
}

export let AppComponent = new AugustComponent(() => App)
AppComponent.render(document.body)
