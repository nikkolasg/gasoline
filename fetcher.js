// Import ES modules from the npm packages via the unpkg.com CDN
import { LotusRPC } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-rpc?module'
import { BrowserProvider } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-provider-browser?module'
import { testnet } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-schema?module'

export class Fetcher {
    constructor(url) {
      const provider = new BrowserProvider(url)
      this.client = new LotusRPC(provider, { schema: testnet.fullNode })
      this.blocks = {}
      this.msgs = {}
      this.receipts = {}
    }

    async head() {
        return await this.client.chainHead()
    }

    async tipset(height,lastTs) {
        // XXX doesn't care about forks at the moment
        if (height in this.tipset) {
            return this.tipset[height]
        }
        const ts = await this.client.chainGetTipSetByHeight(height,lastTs)
        this.tipset[height] = ts
        return ts
    }

    async parentMessages(cid) {
        if (cid["/"] in this.msgs) {
            return this.msgs[cid["/"]]
        }
        const msgs = await this.client.chainGetParentMessages(cid)
        this.msgs[cid["/"]] = msgs
        return msgs
    }

    async receiptParentMessages(cid) {
        if (cid["/"] in this.receipts) {
            return this.receipts[cid["/"]]
        }
        const receipts = await this.client.chainGetParentReceipts(cid)
        this.receipts[cid["/"]] = receipts
        return receipts
    }

    async totalGasUsed(cid) {
        const msgs = await this.receiptParentMessages(cid)
        return msgs.filter(v => v.ExitCode == 0)
            .reduce((total,v) => total + v.GasUsed, 0)
    }

    async parentMessages(cid) {
        return await this.client.chainGetParentMessages(cid)
    }

    async parentMessagesForMethod(cid, methods) {
        const msgs = await this.parentMessages(cid)
        const receipts = await this.receiptParentMessages(cid)
        if (msgs.length != receipts.length) {
            throw new Error("invalid length")
        }
        const allMsgs = zip(msgs,receipts)
        console.log(cid["/"],": all messages: ", allMsgs)
        const filtered = allMsgs.filter(entry => {
            const tx = entry[0]
            const r = entry[1]
            const exit = r.ExitCode == 0 
            const method = methods.includes(tx.Message.Method)
            return exit && method
        })
        return filtered
    }

}

const zip = (arr, ...arrs) => {
  return arr.map((val, i) => arrs.reduce((a, arr) => [...a, arr[i]], [val]));
}
