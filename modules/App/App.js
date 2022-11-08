import { AugustComponent, renderer } from "../lib/August.mjs"

const getHeader = async () => await (await import("./Header.js")).Header

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
    })

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
        </div>
        `,
        css: `.start {color:red}`,
    }
}

renderer({ getComponent: () => App, srcElement: document.body })
