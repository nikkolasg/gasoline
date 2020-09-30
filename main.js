// Import ES modules from the npm packages via the unpkg.com CDN
import { LotusRPC } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-rpc?module'
import { BrowserProvider } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-provider-browser?module'
import { testnet } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-schema?module'
import { Fetcher } from './fetcher.js';
import { Stats } from './stats.js';
import { Estimator } from './estimator.js';
import { drawPieGasSectorsUsed } from './view.js';

const endpointUrl = 'wss://node.glif.io/space07/lotus/rpc/v0'
const provider = new BrowserProvider(endpointUrl)
const client = new LotusRPC(provider, { schema: testnet.fullNode })

const f = new Fetcher(endpointUrl)
const stats = new Stats(f,3) 
const est = new Estimator(stats)
async function run () {
    // wait that stats get all the data necessary
    await est.fetchData()
    est.describe()
    drawPieGasSectorsUsed(est)
}

run()

