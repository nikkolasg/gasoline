// Import ES modules from the npm packages via the unpkg.com CDN
import { LotusRPC } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-rpc?module'
import { BrowserProvider } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-provider-browser?module'
import { testnet } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-schema?module'

export class Fetcher {
    constructor(url) {
      const provider = new BrowserProvider(url)
      this.client = new LotusRPC(provider, { schema: testnet.fullNode })
      // XXX Do this the meta way 
      this.blocks = {}
      this.msgs = {}
      this.receipts = {}
      this.miners = {}
      this.minfo = {}
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

    async parentAndReceiptsMessages(cid, ...methods) {
        const msgs = await this.parentMessages(cid)
        const receipts = await this.receiptParentMessages(cid)
        if (msgs.length != receipts.length) {
            throw new Error("invalid length")
        }
        return zip(msgs,receipts).filter(entry =>  {
            const [tx,r] = entry
            const exit =  r.ExitCode == 0
            var inMethod = true
            if (methods.length > 0) {
                inMethod =  methods.includes(tx.Message.Method)
            }
            return exit && inMethod
        })
    }

    async listMiners(tipset) {
        if (tipset["/"] in this.miners) {
            return this.miners[tipset["/"]]
        }
        let m = await this.client.stateListMiners(tipset)
        this.miners[tipset["/"]] = m
        return m
    }

    async getMinerPower(tipset,height,miner) {
        if (tipset["/"] in this.minfo) {
            return this.minfo[tipset["/"]]
        }
        //let m = await this.client.minerGetBaseInfo(miner,height,tipset)
        let m = await this.client.stateMinerPower(miner,tipset)
        this.minfo[tipset["/"]] = m
        return m
    }
}

const zip = (arr, ...arrs) => {
  return arr.map((val, i) => arrs.reduce((a, arr) => [...a, arr[i]], [val]));
}

export function MultiEndpointFetcher(urls) {
    let fetcher = new Fetcher(urls[0])
    return new Proxy(fetcher, {
        get(target, propKey, receiver) {
            const targetValue = Reflect.get(target, propKey, receiver);
            if (typeof targetValue === 'function') {
                return async function (...args) {
                    for (var i = 0; i < urls.length; i++) {
                        try {
                            return await targetValue.apply(this, args); // (A)
                        } catch (e) {
                            console.log("Error fetching from " + urls[0],":",e)
                            urls = rotate(urls)
                            const provider = new BrowserProvider(urls[0])
                            target.client = new LotusRPC(provider, { schema: testnet.fullNode })
                            console.log("Switched to new endpoint " + urls[0])
                        }
                    }
                    throw new Error("failed to fetch data from all endpoints " + urls)
                }
            } else {
                return targetValue;
            }
        }
    })
}


const rotate = (arr, count = 1) => {
  return [...arr.slice(count, arr.length), ...arr.slice(0, count)];
};
