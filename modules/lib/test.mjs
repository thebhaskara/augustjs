export class TestSuite {
    #testName
    constructor(testName) {
        this.#testName = testName
        console.log(`Test Suite: ${testName}`)
    }
    #expected = []
    expect(message) {
        this.#expected.push(message)
    }
    assert(message, isPassed) {
        let expected = this.#expected.shift()
        if (message != expected) {
            console.log(`%c ✖ ${message} failed!`, "color: red")
            console.log(`%c Expected: ${expected} to resolve`, "color: red")
            return
        }
        if (!isPassed) {
            console.log(`%c ✖ ${message} failed!`, "color: red")
            return
        }
        console.log(`%c ✔ ${message} success!`, "color: green")
    }
    finalize() {
        if (this.#expected.length > 0) {
            while (this.#expected.length > 0) {
                this.assert(this.#expected[0], false)
            }
            // console.log(`%c ✖ Some test cases failed!`, "color: red")
        }

        // console.log(`%c ✔ ALL PASSED!`, "color: green")
    }
    timeout(callback, time) {
        return new Promise((resolve) => {
            setTimeout(async () => {
                await callback()
                resolve(true)
            }, time ?? 0)
        })
    }
}
