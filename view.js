export function drawPieGasSectorsUsed(estimator) {
    var ctx = document.getElementById("pieGasSectors").getContext('2d');
    const leftGas = estimator.totalHeightGas 
        - estimator.wpostHeightGas
        - estimator.preHeightGas
        - estimator.proveHeightGas
    var data = {
        datasets: [{
            data: [
                estimator.wpostHeightGas, 
                estimator.preHeightGas, 
                estimator.proveHeightGas,
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
