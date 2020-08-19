<?php
$username='tempaxrp_admin';
$password='6)jA6z8XlEW1/xR9*u';
$dbname='tempaxrp_dbsommeil';
$servername='localhost';

if( isset($_POST['formNuit']) ){
    if( isset($_POST['idNuitModif']) ){
        modifNuit();
    }else if(dateOk()){
        ajoutNuit();
    }
}
if( isset($_GET['function'])){
    switch ($_GET['function']){
        case 'getNuit':
            getNuit($_GET['debut'], $_GET['fin']);
            break;
        case 'getUsers':
            getUsers();
            break;
        case 'supprNuit':
            supprNuit($_GET['id']);
            break;
        default :
            print_r('Erreur fonction inexistante');
    }
}

// Test si une date est déjà prise par un utilisateur
function dateOk(){
    global $servername, $username, $password, $dbname;
    $link = new mysqli($servername, $username, $password, $dbname);
    $link->set_charset('utf8');

    if ($link->connect_error){
        die("Connection failed: " . $link->connect_error);
    }

    $dateLibre = false;

    $query = "SELECT nuit.id FROM nuit 
        INNER JOIN sommeil ON nuit.id = sommeil.id_nuit
        WHERE id_utilisateur = ".$_POST['utilisateur']." AND  reveil LIKE '".$_POST['dateReveil'][count($_POST['dateEndormissement'])-1]."%' ";


    /* Exécution de la requête */
    if ($result = $link->query($query)) {
        if($result->num_rows == 0) {
            $dateLibre =  true;
        }else{
            echo "Date déjà prise";
            header('location: /sommeil/form_nuit.html');
            // exit;
        }
        $result->close();

    }else{
        echo "ERREUR : ".$link->error;
    }

    return $dateLibre;
}



function getUsers(){
    global $servername, $username, $password, $dbname;
    $link = new mysqli($servername, $username, $password, $dbname);
    $link->set_charset('utf8');

    if ($link->connect_error){
        die("Connection failed: " . $link->connect_error);
    }

    $query = 'SELECT id, nom FROM utilisateur;';

    
    /* Exécution de la requête */
    if ($result = $link->query($query)) {
        $users = [];
        while ($row = $result->fetch_assoc()) {
            array_push($users, $row);
        }

        print_r(json_encode($users));


        $result->close();
    }else{
        echo "ERREUR : ".$link->error;
    }

}


function ajoutNuit(){
   global $servername, $username, $password, $dbname;
    $link = new mysqli($servername, $username, $password, $dbname);
    $link->set_charset('utf8');

    if ($link->connect_error){
        die("Connection failed: " . $link->connect_error);
    }

   $query = "INSERT INTO nuit (id_utilisateur, micro_reveil, cauchemard, agitation, paralysie, commentaire) 
        VALUES ("
        .$_POST['utilisateur'].", "
        .(isset($_POST['microsReveil'])?1:0).", "
        .(isset($_POST['cauchemard'])?1:0).", "
        .(isset($_POST['agitation'])?1:0).", "
        .(isset($_POST['paralysie'])?1:0).", '"
        .addslashes($_POST['commentaire'])
    ."');";

    $query .= "SET @idNuit = LAST_INSERT_ID();";

    $query .= "INSERT INTO sommeil (id_nuit, endormissement, reveil) VALUES ";

    for($i=0; $i<count($_POST['dateEndormissement']); $i++){
        $query .="( @idNuit, 
            '".$_POST['dateEndormissement'][$i]." ".$_POST['heureEndormissement'][$i]."',
            '".$_POST['dateReveil'][$i]." ".$_POST['heureReveil'][$i]."'
        ),";
    }
    $query = substr($query, 0, -1); //Suprime la ,
        
    print_r($query);


    /* Exécution d'une requête multiple */
    if ($link->multi_query($query)) {
         echo "<br><br>";
        echo "Ajout réussi";
    }else{
        echo "<br><br>";
        echo "ERREUR : ".$link->error;
    }


    $link->close();

    header('location: /sommeil');
    
}


function getNuit($debut, $fin){
    global $servername, $username, $password, $dbname;
    $link = new mysqli($servername, $username, $password, $dbname);
    $link->set_charset('utf8');

    if ($link->connect_error){
        die("Connection failed: " . $link->connect_error);
    }


    // between inclu valeurs limites
    $query = 'SELECT nuit.id, id_utilisateur, micro_reveil, cauchemard, agitation, paralysie, commentaire,
        DATE_FORMAT(MAX(reveil), "%Y-%m-%d") AS x,
        SEC_TO_TIME( SUM( TIME_TO_SEC( TIMEDIFF(reveil, endormissement) ) ) ) AS y,
        GROUP_CONCAT(DATE_FORMAT(endormissement, "%k:%i") ORDER BY endormissement ) AS endormissement, 
        GROUP_CONCAT(DATE_FORMAT(reveil, "%k:%i") ORDER BY reveil ) AS reveil
        FROM nuit
        INNER JOIN sommeil ON nuit.id = sommeil.id_nuit
        INNER JOIN utilisateur ON utilisateur.id = nuit.id_utilisateur
        WHERE reveil BETWEEN "'.$debut.' 00:00:00" AND "'.$fin.' 23:59:59"
        GROUP BY nuit.id
    ';


    /* Exécution de la requête */
    if ($result = $link->query($query)) {
        $nuits = ["User1"=>[], "User2"=>[]];
        while ($row = $result->fetch_assoc()) {
            $row['reveil'] = explode(",", $row['reveil']);
            $row['endormissement'] = explode(",", $row['endormissement']);
            
            $row['id_utilisateur'] == 1 ? array_push($nuits["User1"], $row) : array_push($nuits["User2"], $row) ;
        }

        print_r(json_encode($nuits));

        $result->close();
    }else{
        echo "ERREUR : ".$link->error;
    }

    $link->close();
}

function modifNuit(){
    global $servername, $username, $password, $dbname;
    $link = new mysqli($servername, $username, $password, $dbname);
    $link->set_charset('utf8');

    if ($link->connect_error){
        die("Connection failed: " . $link->connect_error);
    }

    $query = "UPDATE nuit 
        SET micro_reveil = ".(isset($_POST['microsReveil'])?1:0).", cauchemard = ".(isset($_POST['cauchemard'])?1:0).", agitation = ".(isset($_POST['agitation'])?1:0).", paralysie = ".(isset($_POST['paralysie'])?1:0).", commentaire = '".addslashes($_POST['commentaire'])."' 
        WHERE id = ".$_POST['idNuitModif'].";
        
        DELETE FROM sommeil WHERE id_nuit = ".$_POST['idNuitModif'].";";
    
    // insert sommeil
    $query .= "INSERT INTO sommeil (id_nuit, endormissement, reveil) VALUES ";
    for($i=0; $i<count($_POST['dateEndormissement']); $i++){
        $query .="( ".$_POST['idNuitModif'].", 
            '".$_POST['dateEndormissement'][$i]." ".$_POST['heureEndormissement'][$i]."',
            '".$_POST['dateReveil'][$i]." ".$_POST['heureReveil'][$i]."'
        ),";
    }
    $query = substr($query, 0, -1); //Suprime la ,


    print_r($query);
    
    if($link->multi_query($query)){
        echo "Modification réussi";
    }else{
        echo "ERREUR : ".$link->error;
    }

    $link->close();

    header('location: /sommeil');
}


function supprNuit($id){
    global $servername, $username, $password, $dbname;
    $link = new mysqli($servername, $username, $password, $dbname);
    $link->set_charset('utf8');

    if ($link->connect_error){
        die("Connection failed: " . $link->connect_error);
    }

    $query = "DELETE FROM nuit WHERE id = ".$id.";
        DELETE FROM sommeil WHERE id_nuit = ".$id.";";

    if($link->multi_query($query)){
        echo "Suppression réussi";
    }else{
        echo "ERREUR : ".$link->error;
    }
    

    $link->close();
}
?>