import * as utils from './policy.js';

export class Drawer  {

    constructor(estimator, stats) {
        this.estimator = estimator
        this.stats = stats
        this.simulData = undefined
        document.getElementById("minerAddressInfo").onclick = async (e) => this.drawMinerPower(e)
    }

    async drawMinerPower(e) {
       let tt = document.getElementById("minerAddress").value
       console.log("drawMinerInfo called -> miner is ",tt)
       let mif = await this.stats.minerEstimates(tt)
       let str = "<p> Raw byte power: " + mif.size + "</p>"
        str += "<p> Number of sectors: " + mif.nbSectors + "</p>"
        str += "<p> Daily gas spent : " + mif.dailyPost + " gas</p>"
        str += "<p> Daily gas price paid: " + mif.dailyPrice + " attoFIL/day</p>"
       document.getElementById("minerInfo").innerHTML = str
       console.log("drawMinerInfo called -> miner is ",tt, " -> ",mif)
        return false
    }

    drawPieGasSectorsUsed() {
        var ctx = document.getElementById("pieGasSectors").getContext('2d');
        const leftGas = this.estimator.totalHeightGas 
            - this.estimator.wpostHeightGas
            - this.estimator.preHeightGas
            - this.estimator.proveHeightGas
        var data = {
            datasets: [{
                data: [
                    this.estimator.wpostHeightGas, 
                    this.estimator.preHeightGas, 
                    this.estimator.proveHeightGas,
                    leftGas,
                ],
                backgroundColor: [
                    window.chartColors.red,
                    window.chartColors.orange,
                    window.chartColors.yellow,
                    window.chartColors.grey,
                ],
                label: "transaction gas",
            }],
            labels: [
                'WindowPost',
                'PreCommit',
                'ProveCommit',
                'Rest of tx'
            ]
        };
        window.pieGasSectorsUsed = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            title: {
                display: true,
                text: 'Gas spent per methods per epoch',
            }
        });
    }

    drawPieTxSectorsUsed() {
        var ctx = document.getElementById("pieTxSectors").getContext('2d');
        const leftTx = this.estimator.totalHeight
            - this.estimator.wpostHeight
            - this.estimator.preHeight
            - this.estimator.proveHeight
        var data = {
            datasets: [{
                data: [
                    this.estimator.wpostHeight, 
                    this.estimator.preHeight, 
                    this.estimator.proveHeight,
                    leftTx,
                ],
                backgroundColor: [
                    window.chartColors.red,
                    window.chartColors.orange,
                    window.chartColors.yellow,
                    window.chartColors.grey,
                ],
                label: "transaction number",
            }],
            labels: [
                'WindowPost tx',
                'PreCommit tx',
                'ProveCommit tx',
                'Rest of tx'
            ]
        };
        window.pieSectorsTxUsed = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            title: {
                display: true,
                text: 'Transactions per methods per epoch',
            }

        });
    }

    // graph requires full dataset of the simulation
    drawGraphGas(data)  {
        var mapToPoint = function(x,y) { return {x:x,y:y} }
        var es = this.estimator
        const wpostGas = data.map((d) => d.wpost*es.wpostGas)
        const pregas = data.map((d) => d.commits*es.preGas)
        const provegas = data.map((d) => d.commits*es.proveGas)
        var ctx = document.getElementById("simulationGraph").getContext('2d');
        let simulData = {
            datasets: [
                {
                    data: wpostGas,
                    borderColor: window.chartColors.red,
                    label: "window post gas",
                    fill: false,
                },
                {
                    data: pregas,
                    borderColor: window.chartColors.orange,
                    label: "precommit gas",
                    fill: false,
                },
                {
                    data: provegas,
                    borderColor: window.chartColors.yellow,
                    label: "provecommit gas",
                    fill: false,
                }
            ],
                labels: data.map((d) => Math.ceil(utils.roundsInDays(d.round))),
            };
            window.graphGas = new Chart(ctx, {
                type: 'line',
                data: simulData,
                options: {
                    title: {
                    display: true,
                    text: 'Gas evolution during simulation per day',
                    }
                }
            });
    }

    // printResult expects all data
    printResult(fullData) {
        const data = fullData[fullData.length - 1]
        const wgas = data.wpost * this.estimator.wpostGas
        const pregas = data.commits * this.estimator.preGas
        const provegas = data.commits * this.estimator.proveGas
        const leftgas = this.estimator.totalHeightGas 
            - wgas
            - pregas
            - provegas

        // update text
        var n = document.getElementById("body-simul")
        const values = [ (100*wgas/(wgas+pregas+provegas+leftgas)).toFixed(2),
            utils.growthRate(fullData[0].commits).toFixed(2),
            utils.growthRate(data.commits).toFixed(2),
            utils.sizeToString(data.sectors * 32 * 1024 * 1024 * 1024),
            (data.round / utils.roundsPerDay).toFixed(2)
        ]
        const rows = values.map((v) => "<td>" + v + "</td>")
        const newRow = document.createElement("tr")
        newRow.innerHTML = rows.join("")
        n.appendChild(newRow)
    }

    drawSimulation(data) {
        if (data.length > 1) {
            // only take the last data if we give everything
            data = data[data.length - 1]
        }
        const wgas = data.wpost * this.estimator.wpostGas
        const pregas = data.commits * this.estimator.preGas
        const provegas = data.commits * this.estimator.proveGas
        const leftgas = this.estimator.totalHeightGas 
            - wgas
            - pregas
            - provegas

                
        // update pie chart
        if (window.pieSimulation == undefined) {
            var ctx = document.getElementById("pieSimulationGas").getContext('2d');
            let simulData = {
                datasets: [{
                    data: [
                        wgas,
                        pregas,
                        provegas,
                        leftgas,
                    ],
                    backgroundColor: [
                        window.chartColors.red,
                        window.chartColors.orange,
                        window.chartColors.yellow,
                        window.chartColors.grey,
                    ],
                    label: "transaction gas",
                }],
                labels: [
                    'WindowPost',
                    'PreCommit',
                    'ProveCommit',
                    'Rest of tx'
                ]
            };
            window.pieSimulation = new Chart(ctx, {
                type: 'doughnut',
                data: simulData,
                options: {
                    title: {
                        display: true,
                        text: 'Gas usage per epoch',
                    },
                     hover: {
                        animationDuration: 0
                    },
                }

            });
        } else {
            //this.simulData.datasets.data = [wgas,pregas,provegas,leftgas]
            window.pieSimulation.data.datasets[0].data = [wgas,pregas,provegas,leftgas]
            window.pieSimulation.update()
        }
    }

    drawGraphGrowth(data)  {
        var mapToPoint = function(x,y) { return {x:x,y:y} }
        var es = this.estimator
        const bandwidth = data.map((d) => utils.growthRate(d.commits))
        var ctx = document.getElementById("simulationGraphGrowth").getContext('2d');
        let simulData = {
            datasets: [
                {
                    data: bandwidth,
                    backgroundColor: window.chartColors.red,
                    label: "grow rate in PB",
                    fill:false,
                },
            ],
                labels: data.map((d) => utils.roundsInDays(d.round)),
            };
            window.pieGraphGrowth = new Chart(ctx, {
                type: 'line',
                data: simulData,
                options: {
                    title: {
                    display: true,
                    text: 'Growth rate evolution per day',
                    }
                }
            });
    }

    drawGasPerUser(dataset,{ maxUser = 5} = {}) {            
        var es = this.estimator
        const drawPie = function(id,height,data) {
            var ctx = document.getElementById(id).getContext('2d');
            let simulData = {
                datasets: [{
                    data: data.slice(0,maxUser).map((d) => d[1]),
                    backgroundColor: utils.objectMap(window.chartColors,(color,name) => color).slice(0,maxUser),
                    label: "transaction gas",
                }],
                labels: data.slice(0,maxUser).map((d) => d[0]),
            };
            return new Chart(ctx, {
                type: 'doughnut',
                data: simulData,
                options: {
                    title: {
                    display: true,
                    text: 'Highest gas users on height ' + height,
                    }
                }
            });
        }
        // sort by decreasing order
        const sortedHeight = Object.keys(dataset).sort((a,b) => b - a)
        console.log("BIGGEST MINERS: ",dataset)
        console.log("BIGGEST SORTED MINERS:",sortedHeight)
        window.pieGasUser1 = drawPie("pieGasUsers1",sortedHeight[0],dataset[sortedHeight[0]])
        window.pieGasUser2 = drawPie("pieGasUsers2",sortedHeight[1],dataset[sortedHeight[1]])
    }
}
