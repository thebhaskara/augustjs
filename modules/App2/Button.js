// @ts-check

import { autoWatch, makeComponent, prop, renderer } from "../lib/August2.mjs"

export function Button() {
	this.something = prop()
	this.clicked = prop()
	this.hostClicked = prop()

	autoWatch(() => {
		if (!this.something.value) return

		console.log("autoWatch -> this.something.value:", this.something.value)
	})

	autoWatch(() => {
		console.log(
			"autoWatch -> this.hostClicked.value:",
			this.hostClicked.value
		)
	})

	this.renderOptions = {
		html: /*html*/ `
		<div host (event.click.target)="hostClicked.value">
			<button type="submit" 
				(event.click.prevent-default)
				(event.click)="clicked.value"
			>
				<slot></slot></button>
		</div>
        `,
		css: "button{color:green}",
		shadow: true,
	}
}

class AugButtonElement extends HTMLElement {
	async connectedCallback() {
		let comp = await makeComponent(() => Button)
		renderer({ srcElement: this, state: comp })
	}
}
window.customElements.define("aug-button", AugButtonElement)
