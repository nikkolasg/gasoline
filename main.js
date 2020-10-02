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
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
async function run () {
    // wait that stats get all the data necessary
    await sim.fetchData()
    sim.describe()
    drawer.drawPieGasSectorsUsed()
    drawer.drawPieTxSectorsUsed()
    console.log("BIGGEST GAS USER: ",(await stats.biggestGasUserFor()))
    const biggest = await stats.biggestGasUserFor(5,6,7)
    drawer.drawGasPerUser(biggest)
    const dataset = await sim.simulate({
        stopGrowthRatio:0.01,
        period: 10000,
        cb: async (d) => { 
            console.log("simulation peek: ",d);
            drawer.drawSimulation(d);
            await sleep(100)
            //return false;
        },
    });
    drawer.printResult(dataset)
    drawer.drawGraphGas(dataset)
    drawer.drawGraphGrowth(dataset)
}
run()

