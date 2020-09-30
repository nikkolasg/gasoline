// Import ES modules from the npm packages via the unpkg.com CDN
import { LotusRPC } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-rpc?module'
import { BrowserProvider } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-provider-browser?module'
import { testnet } from 'https://unpkg.com/@filecoin-shipyard/lotus-client-schema?module'
import { Fetcher } from './fetcher.js';
import { Stats } from './stats.js';

// Public endpoint for demos
//const endpointUrl = 'wss://lotus.testground.ipfs.team/api/0/node/rpc/v0'
const endpointUrl = 'wss://node.glif.io/space07/lotus/rpc/v0'
//  <!--const endpointUrl = 'http://localhost:1234/rpc/v0'-->
// To connect to your local Lotus node, try using:
// const endpointUrl = 'ws://localhost:1234/rpc/v0'

// Instantiate a provider for the endpoint -- wraps the http and
// websockets transports for use in a web browser
// const provider = new BrowserProvider(endpointUrl, { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.fc7Nb9UFOZteVVBSdPHOvZAlXSishu5jXLr8oagByYQ' })

const provider = new BrowserProvider(endpointUrl)
// Create a client object with callable methods using a schema and
// our provider. Calling methods on this object will send JSON-RPC
// requests over the websocket.
const client = new LotusRPC(provider, { schema: testnet.fullNode })

const f = new Fetcher(endpointUrl)
// Using the client and the "ChainHead" method, every second,
// retrieve the chain height and update the web page
async function run () {
  const chainHeightEl = document.getElementById('chainHeight')
  const s = new Stats(f,10) 
  await s.init()
  console.log("stats initialized")
  const gasUsed = await s.avgGasUsedPerHeight()
  console.log("average total gas used: " + gasUsed)
  const sectorsGas = await s.avgGasUsedPerHeightFor(5,6,7)
  console.log("sectors gas : ", sectorsGas)
  console.log("average price of window post: ", await s.avgGasOfMethod(5))
}

run()

