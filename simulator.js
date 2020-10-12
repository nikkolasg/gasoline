import * as utils from './policy.js';

export class Simulator {
    wpostGas = undefined
    preGas = undefined
    proveGas = undefined
    wpostHeightGas = undefined
    preHeightGas = undefined
    proveHeightGas =  undefined
    totalHeightGas  = undefined

    constructor(stats,fetcher) {
        this.stats = stats
        this.fetcher = fetcher
    }

    /// Estimation works as follow:
    /// * We take the current proportion of pre/prove commit gas used
    /// * We go through time (increase rounds one by one)
    /// * The number of window post increases over time because more and more
    /// storage is being emboarded
    /// * We record the evolution for each day
    /// One question of interest for example is when does the rate diminushes to
    /// a point it's almost 0
    /// stopGrowthRatio is a ratio [0,1] that tells the simulation to stop if 
    /// the percentage of wpost at each height reach this percentage of the
    /// current average,
    /// period represents the period between two dataset insertion. Since the
    /// simulation can hold for many rounds, we only save that many data points.
    /// cb is called at each dataset insertion if provided.
    async simulate({wpostStopPerc=0.9,period=10000,cb=async () => {}} = {}) {
        console.log("running simulation")
        const dataset = []
        // start with sectors already spread in the deadline as it is now
        // i.e. current average of window post per height * number of rounds in
        // deadline
        const toProve = [...Array(utils.deadlines)]
            .map((v) => utils.wpostToSectors(this.wpostHeight) * utils.roundsInDeadline)
        // how much gas do we reserve for non sectors related tx
        const nonSectorsGas = this.totalHeightGas 
            - this.wpostHeightGas
            - this.preHeightGas
            - this.proveHeightGas
        const initRate = utils.growthRate(this.proveHeight)
        //const stopThreshold = utils.growthRate(this.proveHeight) * stopGrowthRatio
        const stopThresholdGas = this.totalHeightGas * wpostStopPerc
        // we start at the first deadline
        let deadline = 0
        let round = 0
        let sectors = 0
        console.log("TOPROVE: ",toProve)
        while (true) {
            // how much wpost must I prove at this current height
            const wpost = utils.sectorsToPost(toProve[deadline] / utils.roundsInDeadline)
            const wpostGas = wpost * this.wpostGas
            const gasLeft = this.totalHeightGas - nonSectorsGas - wpostGas
            // we spread the gas left proportionally so we have as many
            // precommit as provecommits 
            // preGas*x + proveGas*x = gasLeft <=> x = gasLeft/(pre+prove)
            const commits = gasLeft / (this.preGas + this.proveGas)
            //console.log("wpost",wpost, "gasLeft", gasLeft, "commits", commits,"toprove[deadline]",toProve[deadline])
            
            const isFinished = stopThresholdGas < wpostGas
            // time to insert dataset
            if ((round % period) == 0 || isFinished == true) {
                dataset.push({
                    sectors: sectors,
                    round: round,
                    wpost:wpost,
                    commits: commits,
                })
                const ret = await cb(dataset[dataset.length - 1])
                if (ret == false) {
                    console.log("early termination")
                    return dataset
                }
            }
            if (isFinished == true) {
                console.log("simulation stop after ",round, " rounds: ",wpostGas,"<",stopThresholdGas," init rate: ",initRate," -> ", utils.growthRate(commits)," -- toProve array: ",toProve)
                return dataset
            }
            // we add this number of sectors to be proven in ~24h
            toProve[(deadline-1) % utils.deadlines] += commits
            sectors += commits
            round += 1
            if ((round % utils.roundsInDeadline) == 0) {
                deadline = (deadline + 1) % utils.deadlines
            }
        }
    }

    async fetchData() {
        await this.stats.init()
        // how much gas does in average a window post cost costs
        this.wpostGas = await this.stats.avgGasOfMethod(5)
        this.preGas = await this.stats.avgGasOfMethod(6)
        this.proveGas = await this.stats.avgGasOfMethod(7)
        console.log("1/5 individual gas of methods averaged out")
        // how much gas does in average is spend per height
        this.wpostHeightGas = await this.stats.avgGasUsedPerHeightFor(5)
        this.preHeightGas = await this.stats.avgGasUsedPerHeightFor(6)
        this.proveHeightGas = await this.stats.avgGasUsedPerHeightFor(7)
        console.log("2/5 total gas of methods averaged out")
        // how much transactions is there in average per method per height
        this.wpostHeight = await this.stats.avgTxPerHeightFor(5)
        this.preHeight = await this.stats.avgTxPerHeightFor(6)
        this.proveHeight = await this.stats.avgTxPerHeightFor(7)
        console.log("3/5 numbers of tx averaged out")
        // how much gas in average is spent per height in total
        this.totalHeightGas = await this.stats.avgGasUsedPerHeight()
        this.totalHeight = await this.stats.avgTxPerHeightFor()
        console.log("4/5 total gas consumption averaged out")
        // What is the maximum total of gas spent in an epoch 
        this.maxHeightGas = await this.stats.maxGasUsedPerHeight()
        console.log("5/5 stats initialization done")
    }


    describe() {
        console.log("total gas spent per height: ",this.totalHeightGas)
        console.log("gas spent per height on window post: ",this.wpostHeightGas)
        console.log("gas spent per height on precommit: ", this.preHeightGas)
        console.log("gas spent per height on provecommit: ",this.proveHeightGas)
        console.log("gas spent _per window post_: ",this.wpostGas, " - ",Math.log2(this.wpostGas))
        console.log("gas spent _per precommit_: ",this.preGas, " - ",Math.log2(this.preGas))
        console.log("gas spent _per provecommit_: ", this.proveGas," - ",Math.log2(this.proveGas))
        console.log("windowpost in average per height: ",this.wpostHeight)
        console.log("precommit in average per height: ",this.preHeight)
        console.log("provecommit in average per height: ",this.proveHeight)
        console.log("total number of tx in average per height: ",this.totalHeight)
    }

}


