export class Estimator {
    constructor(stats) {
        this.stats = stats
    }

    async fetchData() {
        // how much gas does in average a window post cost costs
        this.wpostGas = this.state.avgGasOfMethod(5)
        this.preGas = this.state.avgGasOfMethod(6)
        this.proveGas = this.state.avgGasOfMethod(7)
        // how much gas does in average is spend per height
        this.wpostHeightGas = this.state.avgGasUsedPerHeightFor(5)
        this.preHeightGas = this.state.avgGasUsedPerHeightFor(6)
        this.proveHeightGas = this.state.avgGasUsedPerHeightFor(7)
        // how much gas in average is spent per height in total
        this.totalHeightGas = this.state.avgGasUsedPerHeight()
    }

    describe() {
        console.log("total gas spent per height: ",this.totalHeightGas)
        console.log("gas spent per height on window post: ",this.wpostHeightGas)
        console.log("gas spent per height on precommit: ", this.preHeightGas)
        console.log("gas spent per height on provecommit: ",this.proveHeightGas)
        console.log("gas spent _per window post_: ",this.wpostGas)
        console.log("gas spent _per precommit_: ",this.preGas)
        console.log("gas spent _per provecommit_: ", this.proveGas)
    }
}
