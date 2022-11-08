/** @type {AugustFunctionalComponent} */
export function Header(state) {
    state.watch(["something"], ([something]) => {
        console.log("🚀 ~ state.watch ~ something", something)
    })

    return {
        html: /*html*/ `
        <form>
        <button type="submit" 
            (event.click.prevent-default)
            (event.click)="clicked"
        >
            btn click</button>
        </form>
        `,
    }
}
