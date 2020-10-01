// Import ES modules from the npm packages via the unpkg.com CDN
import { LotusRPC } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-rpc?module'
import { BrowserProvider } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-provider-browser?module'
import { testnet } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-schema?module'
import { Fetcher } from './fetcher.js';
import { Stats } from './stats.js';
import { Simulator } from './simulator.js';
import { Drawer } from './view.js';

const endpointUrl = 'wss://node.glif.io/space07/lotus/rpc/v0'
const provider = new BrowserProvider(endpointUrl)
const client = new LotusRPC(provider, { schema: testnet.fullNode })

const f = new Fetcher(endpointUrl)
const stats = new Stats(f,3) 
const sim = new Simulator(stats)
const drawer = new Drawer(sim)
async function run () {
    // wait that stats get all the data necessary
    await sim.fetchData()
    sim.describe()
    drawer.drawPieGasSectorsUsed()
    drawer.drawPieTxSectorsUsed()
    /*console.log("HELLO WORLD")*/
    //console.log("rounds in deadline: ",Simulator.roundsInDeadline)
    //console.log("wpostHeight: ",sim.wpostHeight)
    //const dataset = sim.simulate({
        //period: 100,
        //cb: (d) => { 
            //console.log("simulation peek: ",d);
            //drawer.drawSimulation(d);
        //},
    /*});*/
    /*console.log("simulation finished ",dataset[dataset.length-1].round, "rounds")*/
}
run()

