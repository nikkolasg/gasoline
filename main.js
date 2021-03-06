// Import ES modules from the npm packages via the unpkg.com CDN
import { LotusRPC } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-rpc?module'
import { BrowserProvider } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-provider-browser?module'
import { testnet } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-schema?module'
import { MultiEndpointFetcher } from './fetcher.js';
import { Stats } from './stats.js';
import { Simulator } from './simulator.js';
import { Drawer } from './view.js';

const endpointUrls = ['wss://lotus.jimpick.com/spacerace_api/1/node/rpc/v0','wss://node.glif.io/space07/lotus/rpc/v0', 'ws://www.border.ninja:12342/node/rpc/v0', 'wss://lotus.jimpick.com/spacerace_api/0/node/rpc/v0']
//const f = new Fetcher(endpointUrl)
const f = MultiEndpointFetcher(endpointUrls)
const stats = new Stats(f,3) 
const sim = new Simulator(stats)
const drawer = new Drawer(sim,stats)
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
async function run () {
    // wait that stats get all the data necessary
    await sim.fetchData()
    const head = await f.head()
    window.head = head
    console.log("HEAD: ",head)
    //const biggest = await stats.biggestGasUserFor(5,6,7)
    //console.log("BIGGEST  ? : ",biggest)
    sim.describe()
    //drawer.drawPieGasSectorsUsed()
    //drawer.drawPieTxSectorsUsed()
    /*drawer.drawGasPerUser(biggest)*/
    document.getElementById("wpostbut").onclick = async () => {
        const perc = parseInt(document.getElementById("wpostperc").value,10) / 100
        console.log("Running simulation with ",perc,"stop threshold")
        const dataset = await sim.simulate({
            wpostStopPerc: perc,
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
    console.log("setup done")
}
run()

