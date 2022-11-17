import { AugustState } from "../../modules/lib/August.mjs"
import { TestSuite } from "../../modules/lib/test.mjs"

let test = new TestSuite("AugustState")
try {
    test.expect("Make instance")
    let state = new AugustState()
    test.assert("Make instance", true)

    test.expect("Calling get and set - a")
    state.set("a", 10)
    test.assert("Calling get and set - a", state.get("a") === 10)

    test.expect("Calling get and set - a.b")
    state.set("a.b", 10)
    test.assert("Calling get and set - a.b", state.get("a.b") === 10)
} catch (e) {
    console.error(e)
} finally {
    test.finalize()
}
