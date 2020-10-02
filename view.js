import * as utils from './policy.js';

export class Drawer  {

    constructor(estimator) {
        this.estimator = estimator
        this.simulData = undefined
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
        var n = document.getElementById("simul-status")
        var strs = [
            "<p>Final emboarding rate of sectors per epoch: " + Math.round(data.commits) + " sectors/rounds</p>",
            "<p>Initial emboarding rate in PB per day: " + utils.growthRate(fullData[0].commits).toFixed(2) + "</p>",
            '<p class="font-weight-bold">Final emboarding rate in PB per day: ' + utils.growthRate(data.commits).toFixed(2) + ' PB/day</p>',
            "<p>Percentage of gas used for window post per height: " + (100*wgas/(wgas+pregas+provegas+leftgas)).toFixed(2) + "% </p>",
            '<p class="font-weight-bold">Days before reaching this rate: ' + (data.round / utils.roundsPerDay).toFixed(2) + " days</p>",
        ]
         
        n.innerHTML = strs.join("") 
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
        window.pieGasUser1 = drawPie("pieGasUsers1",sortedHeight[0],dataset[sortedHeight[0]])
        window.pieGasUser2 = drawPie("pieGasUsers2",sortedHeight[1],dataset[sortedHeight[1]])
    }
}
