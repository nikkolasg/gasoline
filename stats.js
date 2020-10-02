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
        var lastTs = head.Cids
        for (var i= 1; i < this.average; i++) {
            const tipset = await this.fetcher.tipset(height - i,lastTs)
            lastTs = tipset.Cids
            this.cids.push(tipset.Cids[0])
            console.log(i,"/",this.average,": init fetched tipset with [0] = ",tipset.Cids[0])
        }
        console.log("Stats: got " + this.cids.length + " tipset CIDs to make stats from")
    }

    /// Giving no methods returns for all methods
    /// XXX Do that for all the rest of the methods
    async maxGasUsedPerHeight(...methods) {
        var max = 0
        for (var cidx in this.cids) {
            var lmax = 0
            if (methods.length == 0) {
                lmax = await this.fetcher.totalGasUsed(this.cids[cidx])
            } else {
                lmax = await this.fetcher.parentMessagesForMethod(this.cids[cidx],methods)
            }
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
            const msgs = await this.fetcher.parentMessagesForMethod(this.cids[cid],methods)
            avg += msgs.reduce((total,v) => total + v[1].GasUsed, 0)
        }
        return avg/this.cids.length
    }

    async avgGasOfMethod(method) {
        var avg = 0
        var nboftx = 0
        for (var cid in this.cids) {
            const msgs = await this.fetcher.parentMessagesForMethod(this.cids[cid],[method])
            avg += msgs.reduce((total,v) => total + v[1].GasUsed,0)
            nboftx += msgs.length
        }
        return avg/nboftx
    }

    async avgTxPerHeightFor(...methods) {
        var avg = 0 
        for (var cid in this.cids) {
            var msgs = undefined
            if (methods.length == 0) {
                msgs = await this.fetcher.parentMessages(this.cids[cid])
            } else {
                msgs = await this.fetcher.parentMessagesForMethod(this.cids[cid],methods)
            }
            avg += msgs.length
        }
        return avg / this.cids.length
    }

}
