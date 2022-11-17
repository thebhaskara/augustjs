import { AppComponent } from "../../modules/App/App.js"
import { TestSuite } from "../../modules/lib/test.mjs"

async function test() {
    let test = new TestSuite("App/App.js")
    try {
        test.expect("create App element")
        await test.timeout(() => {
            test.assert("create App element", document.querySelector(".start"))
        })
    } catch (e) {
        console.error(e)
    } finally {
        test.finalize()
    }
}
test()
