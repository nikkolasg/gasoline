export class Estimator {
    wpostGas = undefined
    preGas = undefined
    proveGas = undefined
    wpostHeightGas = undefined
    preHeightGas = undefined
    proveHeightGas =  undefined
    totalHeightGas  = undefined

    constructor(stats) {
        this.stats = stats
    }

    async fetchData() {
        await this.stats.init()
        // how much gas does in average a window post cost costs
        this.wpostGas = await this.stats.avgGasOfMethod(5)
        this.preGas = await this.stats.avgGasOfMethod(6)
        this.proveGas = await this.stats.avgGasOfMethod(7)
        // how much gas does in average is spend per height
        this.wpostHeightGas = await this.stats.avgGasUsedPerHeightFor(5)
        this.preHeightGas = await this.stats.avgGasUsedPerHeightFor(6)
        this.proveHeightGas = await this.stats.avgGasUsedPerHeightFor(7)
        // how much gas in average is spent per height in total
        this.totalHeightGas = await this.stats.avgGasUsedPerHeight()
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
