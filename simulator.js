export class Simulator {
    wpostGas = undefined
    preGas = undefined
    proveGas = undefined
    wpostHeightGas = undefined
    preHeightGas = undefined
    proveHeightGas =  undefined
    totalHeightGas  = undefined

    static roundsPerDay = 2 * 60 * 24
    static roundsInDeadline = 2 * 30 
    static deadlines = 48
    static maxSectorsPerPost = 2349
    static wpostToSectors = (wpost) => maxSectorsPerPost * wpost
    static sectorsToPost = (sectors) => sectors / maxSectorsPerPost
    static gbToPB = (v) => v/1024/1024
    static pbToGB = (v) => v*1024*1024
    // Returns the estimated growthRate per day assuming this number of prove
    // commits at one height (or an average etc)
    static growthRate = (prove) => gbToPB(proveCommits * 32) * roundsPerDay 

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
    /// the number of prove commits at each height reach this percentage of the
    /// current average,i.e. we reach 10% of the current number of prove commit
    /// inserted on chain and therefore 10% of the growth.
    /// period represents the period between two dataset insertion. Since the
    /// simulation can hold for many rounds, we only save that many data points.
    /// cb is called at each dataset insertion if provided.
    simulate({stopGrowthRatio=0.1,period=1000,cb=undefined} = {}) {
        console.log("running simulation")
        const dataset = []
        // start with windowpost already spread in the deadline as it is now
        // i.e. current average of window post per height * number of rounds in
        // deadline
        const toProve = [...Array(Simulator.deadlines)]
            .map((v) => this.wpostHeight * Simulator.roundsInDeadline)
        // how much gas do we reserve for non sectors related tx
        const nonSectorsGas = this.totalHeightGas 
            - this.wpostHeightGas
            - this.preHeightGas
            - this.proveHeightGas
        const stopThreshold = this.proveHeight * stopGrowthRatio
        // we start at the first deadline
        let deadline = 0
        let round = 0
        console.log("TOPROVE: ",toProve)
        while (true) {
            // how much wpost must I prove at this current height
            const wpost = toProve[deadline] / Simulator.roundsInDeadline  
            const wpostGas = wpost * this.wpostGas
            const gasLeft = this.totalHeightGas - nonSectorsGas - wpostGas
            // we spread the gas left proportionally so we have as many
            // precommit as provecommits 
            // preGas*x + proveGas*x = gasLeft <=> x = gasLeft/(pre+prove)
            const commits = gasLeft / (this.preGas + this.proveGas)
            console.log("wpost",wpost, "gasLeft", gasLeft, "commits", commits,"toprove[deadline]",toProve[deadline])
            if (commits < stopThreshold) {
                console.log("simulation stop after ",round, " rounds",commits,"<",stopThreshold,toProve)
                break
            }

            // time to insert dataset
            if ((round % period) == 0) {
                dataset.push({
                    round: round,
                    wpost:wpost,
                    commits: commits,
                })
                if (cb != undefined) {
                    cb(dataset[dataset.length - 1])
                }
            }
            // we add this number of sectors to be proven in ~24h
            toProve[(deadline-1) % Simulator.deadlines] += commits
            round += 1
            if ((round % Simulator.roundsInDeadline) == 0) {
                deadline = (deadline + 1) % Simulator.deadlines
            }
        }
        return dataset
    }

    /*simulate2({growthRatePB=10,period=1000,cb=undefined} = {}) {*/
        //console.log("running simulation")
        //const dataset = []
        //// start with windowpost already spread in the deadline as it is now
        //// i.e. current average of window post per height * number of rounds in
        //// deadline
        //const toProve = [...Array(Simulator.deadlines)]
            //.map((v) => 0)
        //const growthRateSectors = Simulator.pbToGB(growthRatePB)
        //// how mch prove commit gas i need to spend to attain that growth
        //const growthGas = this.growthRateSectors * this.proveGas
        //// how much gas do we reserve for non sectors related tx
        //const nonSectorsGas = this.totalHeightGas 
            //- this.wpostHeightGas
            //- this.preHeightGas
            //- this.proveHeightGas
        //const stopThreshold = this.proveHeight * stopGrowthRatio
        //// we start at the first deadline
        //let deadline = 0
        //let round = 0
        //console.log("TOPROVE: ",toProve)
        //while (true) {
            //// how much wpost must I prove at this current height
            //const wpost = toProve[deadline] / Simulator.roundsInDeadline  
            //const wpostGas = wpost * this.wpostGas
            //const gasLeft = this.totalHeightGas - nonSectorsGas - wpostGas
            //// we spread the gas left proportionally so we have as many
            //// precommit as provecommits 
            //// preGas*x + proveGas*x = gasLeft <=> x = gasLeft/(pre+prove)
            //const commits = gasLeft / (this.preGas + this.proveGas)
            //console.log("wpost",wpost, "gasLeft", gasLeft, "commits", commits,"toprove[deadline]",toProve[deadline])
            //if (commits < stopThreshold) {
                //console.log("simulation stop after ",round, " rounds",commits,"<",stopThreshold,toProve)
                //break
            //}

            //// time to insert dataset
            //if ((round % period) == 0) {
                //dataset.push({
                    //round: round,
                    //wpost:wpost,
                    //commits: commits,
                //})
                //if (cb != undefined) {
                    //cb(dataset[dataset.length - 1])
                //}
            //}
            //// we add this number of sectors to be proven in ~24h
            //toProve[(deadline-1) % Simulator.deadlines] += commits
            //round += 1
            //if ((round % Simulator.roundsInDeadline) == 0) {
                //deadline = (deadline + 1) % Simulator.deadlines
            //}
        //}
        //return dataset

    //}


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
        // how much transactions is there in average per method per height
        this.wpostHeight = await this.stats.avgTxPerHeightFor(5)
        this.preHeight = await this.stats.avgTxPerHeightFor(6)
        this.proveHeight = await this.stats.avgTxPerHeightFor(7)
        // how much gas in average is spent per height in total
        this.totalHeightGas = await this.stats.avgGasUsedPerHeight()
        this.totalHeight = await this.stats.avgTxPerHeightFor()
        // What is the maximum total of gas spent in an epoch 
        this.maxHeightGas = await this.stats.maxGasUsedPerHeight()
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

function defaultHandler(defaultValue) {
  return { 
      get: function(obj, prop) {
        return prop in obj ?
        obj[prop] :
        defaultvalue;
    }
  }
}
