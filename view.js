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
            type: 'pie',
            data: data,
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
            type: 'pie',
            data: data,
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
                },
                {
                    data: pregas,
                    borderColor: window.chartColors.orange,
                    label: "precommit gas",
                },
                {
                    data: provegas,
                    borderColor: window.chartColors.yellow,
                    label: "provecommit gas",
                }
            ],
                labels: data.map((d) => d.round),
            };
            window.pieSimulation = new Chart(ctx, {
                type: 'line',
                data: simulData,
                options: {
                    title: {
                    display: true,
                    text: 'Gas evolution during simulation',
                    }
                }
            });
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

        // update text
        var n = document.getElementById("simul-status")
        var strs = [
            "Emboarding rate in sectors per height: " + data.commits,
            "Emboarding rate in PB per day: " + utils.growthRate(data.commits),
            "Percentage of gas used for window post per height: " + 100*wgas/(pregas+provegas+leftgas),
            "Days in the simulation: " + data.round / utils.roundsPerDay
        ]
         
        n.innerHTML = strs.join("<br>") 
        
        // update pie chart
        if (window.pieSimulation == undefined) {
            var ctx = document.getElementById("simulation").getContext('2d');
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
                type: 'pie',
                data: simulData,
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
                    label: "bandwdith in PB per days",
                    fill:false,
                },
            ],
                labels: data.map((d) => utils.roundsInDays(d.round)),
            };
            window.pieSimulation = new Chart(ctx, {
                type: 'line',
                data: simulData,
                options: {
                    title: {
                    display: true,
                    text: 'Bandwidth evolution during simulation',
                    }
                }
            });
    }


}
