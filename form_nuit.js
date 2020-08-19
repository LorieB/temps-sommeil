$(document).ready(function () {
    $('#menu').load('./menu.html', () => {
        $('#menu .nav-link').removeClass('active');
        $('#nouveau').addClass('active')
    });

    dateMinMax();

    getUsers();

    if (localStorage.getItem('nuitSelect')) {
        rempliForm(JSON.parse(localStorage.getItem('nuitSelect')));
        localStorage.removeItem('nuitSelect');
    } else {
        autoRempliDate();
    }

    



    function getUsers() {
        $.ajax({
            url: 'controller.php',
            data: {
                function: 'getUsers'
            },
            async: false
        })
            .done(function (result) {
                result = JSON.parse(result);

                for (const res of result) {
                    $('#utilisateur').append(`
                        <option value="${res.id}">${res.nom}</option>
                    `);
                }

            })
            .fail(function () {
                alert("error");
            })
    }


    // Ajoute groupe heures sommeil 
    $('#btnPlusSommeil').click(() => {addSommeil()});



    // Supprime groupe heures sommeil 
    $("#heuresSommeil").on("click", ".supprSommeil", function () {
        $(this).parent().parent().remove();
    });
});


// Ajoute groupe heures sommeil 
function addSommeil() {
    $('#heuresSommeil .row').append(`
        <div class="col-md-4 mb-2 px-1 groupHeure">
            <div class="border rounded p-2">
                <button type="button" class="supprSommeil close" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <div class="form-group">
                    <label for="endormissement">Endormissement</label>
                    <div class="form-inline" id="endormissement">
                        <input name="dateEndormissement[]" type="date"
                            class="dateEndormissement form-control" required>
                        <input name="heureEndormissement[]" type="time"
                            class="heureEndormissement form-control" required>
                    </div>
                </div>

                <div class="form-group">
                    <label for="reveil">Réveil</label>
                    <div class="form-inline" id="reveil">
                        <input name="dateReveil[]" type="date" class="dateReveil form-control" required>
                        <input name="heureReveil[]" type="time" class="heureReveil form-control" required>
                    </div>
                </div>
            </div>
        </div>
    `);
    dateMinMax();
}

/* Prérempli le formulaire avec les dates du jour */
function autoRempliDate() {
    let date = moment();

    $('.dateReveil').val(date.format('YYYY-MM-DD'));
    $('.heureReveil').val('08:00');

    $('.dateEndormissement').val(date.subtract(1, 'days').format('YYYY-MM-DD'));
    $('.heureEndormissement').val('23:30');
}


function dateMinMax() {
    let date = moment();

    $('.dateReveil').attr({ "max": date.format('YYYY-MM-DD') });
    $('.dateEndormissement').attr({ "max": date.format('YYYY-MM-DD') });
}



function rempliForm(nuit) {
    $('form').append(`<input name="idNuitModif" value="${nuit.id}" class="form-control" readonly style="display:none">`);

    // Utilisateur ne peut pas être changé
    $('#utilisateur').val(nuit.id_utilisateur);
    $('#utilisateur').prop('disabled', true);

    $('#heuresSommeil .row').empty();
    for(let i=0; i<nuit.endormissement.length; i++){
        addSommeil();

        // Si length < 5 alors il manque un 0 au début. Ex: 8:00
        nuit.endormissement[i] = nuit.endormissement[i].length < 5 ? '0'+nuit.endormissement[i] : nuit.endormissement[i]

        // Si endormissement entre 12:00 et 23:59 alors c'est le jour précédent
        $(`.groupHeure:nth-child(${i+1}) .dateEndormissement`).val(nuit.endormissement[i] > '12:00' ? moment(nuit.x).subtract(1, 'days').format('YYYY-MM-DD') : moment(nuit.x).format('YYYY-MM-DD'));
        $(`.groupHeure:nth-child(${i+1}) .heureEndormissement`).val(nuit.endormissement[i].length < 5 ? '0'+nuit.endormissement[i] : nuit.endormissement[i]);


        nuit.reveil[i] = nuit.reveil[i].length < 5 ? '0'+nuit.reveil[i] : nuit.reveil[i];

        $(`.groupHeure:nth-child(${i+1}) .dateReveil`).val( nuit.reveil[i] > '12:00' ? moment(nuit.x).subtract(1, 'days').format('YYYY-MM-DD') : moment(nuit.x).format('YYYY-MM-DD'));
        $(`.groupHeure:nth-child(${i+1}) .heureReveil`).val( nuit.reveil[i] );
    }


    $('#microsReveil').prop("checked", +nuit.micro_reveil);
    $('#cauchemard').prop("checked", +nuit.cauchemard);
    $('#agitation').prop("checked", +nuit.agitation);
    $('#paralysie').prop("checked", +nuit.paralysie);

    $('#commentaire').val(nuit.commentaire);
}