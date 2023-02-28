// @ts-check

import { autoWatch, prop } from "../lib/August2.mjs"

export function Header() {
	this.something = prop()
	this.clicked = prop()

	autoWatch(() => {
		if (!this.something.value) return

		console.log("autoWatch -> this.something.value:", this.something.value)
	})

	this.renderOptions = {
		html: /*html*/ `
        <form>
        <button type="submit" 
            (event.click.prevent-default)
            (event.click)="clicked.value"
        >
            btn click</button>
			<aug-button>
				Hi There
			</aug-button>
        </form>
        `,
		css: "",
	}
}
