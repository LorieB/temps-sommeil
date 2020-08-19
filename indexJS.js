
let nuits = [];
let nuitSelect = null;


$(document).ready(function () {
    $('#menu').load('./menu.html', () => {
        $('#menu .nav-link').removeClass('active');
        $('#accueil').addClass('active');
    });

    // Charge le graph pour les 7 derniers jours
    getnuits(moment().subtract(6, 'days').format("YYYY-MM-DD"), moment().format("YYYY-MM-DD"));




    /* Graphique */
    var ctx = $('#myChart');

    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            datasets: [{
                label: 'User1',
                data: [],
                backgroundColor: 'rgba(98, 61, 227, 0.2)',
                borderColor: 'rgba(98, 61, 227, 1)',
                borderWidth: 1
            }, {
                label: 'User2',
                data: [],
                backgroundColor: 'rgba(16, 227, 144, 0.2)',
                borderColor: 'rgba(16, 227, 144, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    type: 'linear',
                    position: 'left',
                    ticks: {
                        min: moment('1970-02-01 00:00:00').valueOf(),
                        max: moment('1970-02-01 12:00:00').valueOf(),
                        stepSize: 3.6e+6,
                        beginAtZero: false,
                        callback: value => {
                            let date = moment(value);
                            if (date.diff(moment('1970-02-01 23:59:59'), 'minutes') === 0) {
                                return null;
                            }

                            return date.format('H');
                        }
                    }
                }],
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    offset: true
                }]
            }
        }
    });



    /* Selecteur date */
    $('#daterange').daterangepicker({
        "locale": {
            "applyLabel": "Valider",
            "cancelLabel": "Annuler",
        },
        startDate: moment().subtract(6, 'days'),
        endDate: moment(),
        ranges: {
            '7 derniers jours': [moment().subtract(6, 'days'), moment()],
            '30 derniers jours': [moment().subtract(29, 'days'), moment()],
            'Mois': [moment().startOf('month'), moment().endOf('month')],
            'Mois précédent': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
            'Année': [moment().startOf('year'), moment().endOf('year')]
        },
        showCustomRangeLabel: false,
        alwaysShowCalendars: true,
        maxDate: moment()
    });

    $('#daterange').on('apply.daterangepicker', function (ev, picker) {
        getnuits(picker.startDate.format("YYYY-MM-DD"), picker.endDate.format("YYYY-MM-DD"));
    });


    /* Récupère liste des nuits */
    function getnuits(debut, fin) {
        $.ajax({
            url: 'controller.php',
            data: {
                function: 'getNuit',
                debut: debut,
                fin: fin
            }
        })
            .done(function (result) {
                result = JSON.parse(result);
                nuits = result;

                // Converti val y pour être interpreté par chart.js
                for (const user in result) {
                    result[user].forEach(d => {
                        d.y = moment(`1970-02-01 ${d.y}`).valueOf();
                    });
                }

                myChart.config.options.scales.xAxes[0].ticks.min = debut;
                myChart.config.options.scales.xAxes[0].ticks.max = fin;

                myChart.data.datasets[0].data = result['User1'];
                myChart.data.datasets[0].label = 'User1';
                myChart.data.datasets[1].data = result['User2'];
                myChart.data.datasets[1].label = 'User2';

                myChart.update();
            })
            .fail(function () {
                alert("error");
            })
    }





    /* Click sur une valeure du graph pour afficher les détails d'une nuit */
    $('#myChart').click(function (evt) {
        let firstPoint = myChart.getElementAtEvent(evt)[0];

        if (firstPoint) {
            let value = myChart.data.datasets[firstPoint._datasetIndex].data[firstPoint._index];
            let label = myChart.data.datasets[firstPoint._datasetIndex].label;
            let color = myChart.data.datasets[firstPoint._datasetIndex].backgroundColor;
            let borderC = myChart.data.datasets[firstPoint._datasetIndex].borderColor;
            nuitSelect = nuits[label].find(nuit => nuit.x == value.x);

            let detail = `
                    <h5 class="card-header">
                        <button type="button" class="close" id="hideDetail" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        ${moment(nuitSelect.x).format("dddd DD MMMM YYYY")}
                    </h5>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <h5 class="card-title">Temps de sommeil : ${moment(nuitSelect.y).format("hh:mm")}</h5>
            `;
            if (nuitSelect.micro_reveil == 1 || nuitSelect.cauchemard == 1 || nuitSelect.agitation == 1 || nuitSelect.paralysie == 1) {
                detail += `
                    <ul class="list-group list-group-horizontal-md flex-wrap  mb-2">
                        ${nuitSelect.micro_reveil == 1 ? '<li class="list-group-item">micro réveils</li>' : ''}
                        ${nuitSelect.cauchemard == 1 ? '<li class="list-group-item">cauchemard</li>' : ''}
                        ${nuitSelect.agitation == 1 ? '<li class="list-group-item">agitation</li>' : ''}
                        ${nuitSelect.paralysie == 1 ? '<li class="list-group-item">paralysie</li>' : ''}
                    </ul>`;
            }
            if (nuitSelect.commentaire) {
                detail += `<p class="card-text mt-4 mb-2">${nuitSelect.commentaire}</p>`;
            }

            detail += `</div>
                <div class="col-md-4">`;

            detail += `<ul class="list-group">`
            for (let i = 0; i < nuitSelect.endormissement.length; i++) {
                detail += `<li class="list-group-item text-center">${nuitSelect.endormissement[i]} <img src="./icon/arrow.svg" alt="flèche"> ${nuitSelect.reveil[i]}</li>`
            }
            detail += `</ul>
                        </div> 
                    </div> 
                </div> `;



            $('#details .card').empty();
            $('#details .card').append(detail);
            $('#details .card-header').css('background-color', color);
            $('#details .card').css('border-color', borderC);
            $('#details').show();
        }
    });


    /* Cache les détails des nuits */
    $("#details").on("click", "#hideDetail", function () {
        $('#details').hide();
        nuitSelect = null;
    })


    /* Supprime une nuit */
    $(".supprNuit").click( function () {

        $.ajax({
            url: 'controller.php',
            data: {
                function: 'supprNuit',
                id: nuitSelect.id
            }
        })
            .done(function (result) {
                getnuits($('#daterange').data('daterangepicker').startDate.format("YYYY-MM-DD"), $('#daterange').data('daterangepicker').endDate.format("YYYY-MM-DD"));
            })
            .fail(function () {
                alert("error");
            })

        
        $('#details').hide();
        nuitSelect = null;
    })

    /* Modifie une nuit */
    $("#details").on("click", ".modifNuit", function () {
        localStorage.setItem('nuitSelect', JSON.stringify(nuitSelect));
        nuitSelect = null;
        window.location.href = "/sommeil/form_nuit.html";
    })

});