import * as utils from './policy.js';

export class Stats {

    constructor(fetcher, average) {
        this.fetcher = fetcher
        this.average = average
    }

    async init() {
        // at the moment take the first block - this is ok since parent tipset
        // is the same for all the blocks
        console.log("Fetching head to initialize...")
        const head = await this.fetcher.head()
        const height = head.Height
        console.log("latest head: ", head)
        console.log("latest head height: ", height)
        this.cids = [head.Cids[0]]
        this.heights = {}
        this.heights[head.Cids[0]["/"]] = height
        var lastTs = head.Cids
        for (var i= 1; i < this.average; i++) {
            const tipset = await this.fetcher.tipset(height - i,lastTs)
            lastTs = tipset.Cids
            this.cids.push(tipset.Cids[0])
            this.heights[tipset.Cids[0]["/"]] = tipset.Height
            console.log(i,"/",this.average,": init fetched tipset at height ", tipset.Height, " with [0] = ",tipset.Cids[0])
        }
        console.log("Stats: got " + this.cids.length + " tipset CIDs to make stats from")
        console.log(this.heights)
    }

    /// Giving no methods returns for all methods
    /// XXX Do that for all the rest of the methods
    async maxGasUsedPerHeight(...methods) {
        var max = 0
        for (var cidx in this.cids) {
            const lmax = await this.fetcher.parentAndReceiptsMessages(this.cids[cidx],...methods)
            if (lmax > max) {
                max = lmax
            }
        }
        return max
    }

    async avgGasUsedPerHeight() {
        var avg = 0
        for (var cidx in this.cids) {
            avg += await this.fetcher.totalGasUsed(this.cids[cidx])
        }
        return avg/this.cids.length
    }


    async avgGasUsedPerHeightFor(...methods) {
        var avg = 0
        for (var cid in this.cids) { 
            const msgs = await this.fetcher.parentAndReceiptsMessages(this.cids[cid],...methods)
            avg += msgs.reduce((total,v) => total + v[1].GasUsed, 0)
        }
        return avg/this.cids.length
    }

    async avgGasOfMethod(method) {
        var avg = 0
        var nboftx = 0
        for (var cid in this.cids) {
            const msgs = await this.fetcher.parentAndReceiptsMessages(this.cids[cid],method)
            avg += msgs.reduce((total,v) => total + v[1].GasUsed,0)
            nboftx += msgs.length
        }
        return avg/nboftx
    }

    async avgTxPerHeightFor(...methods) {
        var avg = 0 
        for (var cid in this.cids) {
            const msgs = await this.fetcher.parentAndReceiptsMessages(this.cids[cid],...methods)
            avg += msgs.length
        }
        return avg / this.cids.length
    }

    async biggestGasUserFor(...methods) {
        var datas = {}
        for (var cid in this.cids) {
            const msgs = await this.fetcher.parentAndReceiptsMessages(this.cids[cid],...methods)
            var users = msgs.reduce((acc, tuple) => {
                if (acc[tuple[0].Message.To] == undefined) {
                    acc[tuple[0].Message.To] = 0
                }
                acc[tuple[0].Message.To] += tuple[1].GasUsed
                return acc
            },{})
            // combinatio of mapping over dict
            // https://stackoverflow.com/questions/14810506/map-function-for-objects-instead-of-arrays
            // and sorting in decreasing order
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
            var sorted = utils.objectMap(users, (gas,user) => [user,gas]).sort((a,b) => b[1] - a[1])
            datas[this.heights[this.cids[cid]["/"]]] = sorted
        }
        console.log("biggests user gas: ",datas)
        return datas
    }

    async avgGasFeeCap(...methods) {
        var avg = 0
        for (var cid in this.cids) { 
            const msgs = await this.fetcher.parentAndReceiptsMessages(this.cids[cid],...methods)
            avg += msgs.reduce((total,v) => total + v[0].Message.GasFeeCap, BigInt(0)) / msgs.length
        }
        return avg/this.cids.length
    }

    async minerEstimates(miner) {
        let mif = await this.fetcher.getMinerPower(window.head.Cids,window.head.Height,miner)
        let gas = await this.avgGasOfMethod(5)         
        let nbSectors = utils.sizeToSectors(mif.TotalPower.RawBytePower)
        let dailyGas = utils.sectorsToPost(nbSectors) * gas
        let dailyPrice = utils.sectorsToPost(nbSectors) * gas 
        dailyPrice = dailyPrice * (await this.avgGasFeeCap(5))
        return {
            size: utils.sizeToString(mif.TotalPower.RawBytePower),
            nbSectors: nbSectors,
            dailyGas: dailyGas,
            dailyPrice: dailyPrice,
        }
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


