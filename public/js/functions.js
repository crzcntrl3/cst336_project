$(document).ready(function(){
    /*global $*/
    /*global fetch*/
    let usernameAvailable = false;
    let zipCodeFound = true;
    
    displayStates();
    //display states
    async function displayStates(){
        let url = `https://cst336.herokuapp.com/projects/api/state_abbrAPI.php`;
        let response = await fetch(url);
        let data = await response.json();
        for (let i = 0; i < data.length; i++){
            $("#state").append(`<option value = "${data[i].usps}"> ${data[i].state} </option>`);
        }
    }
        
    $("#state").on("change", async function(){
        //alert($("#state").val()); 
        let state = $("#state").val();
        let url = `https://cst336.herokuapp.com/projects/api/countyListAPI.php?state=${state}`;
        let response = await fetch(url);
        let data = await response.json();
        //consol.log(data)
        $("#county").html("<option> Select one  </option>");
        for(let i = 0; i < data.length; i++){
            $("#county").append(`<option> ${data[i].county} </option>`);
        }
        
    });//state
    
    $("#username").on("change",async function(){
        //alert($("#username").val());
        let username = $("#username").val();
        let url = `https://cst336.herokuapp.com/projects/api/usernamesAPI.php?username=${username}`;
        let response = await fetch(url);
        let data = await response.json();
            
        if(data.available){
            $("#usernameError").html("Userame available!");
            $("#usernameError").css("color","green");
            usernameAvailable = true;
        } else {
            $("usernameError").html("Username not available!");
            $("#usernameError").css("color","red");
            usernameAvailable = false;
        }
        
    });//username
        
    $("#signupForm").on("submit", function(event) {
        //alert("Submitting form...");
        if(!isFormValid()){
            event.preventDefault();
        }
        
    });
    
    function isFormValid(){
        let isValid = true;
        if(!usernameAvailable){
            isValid = false;
        }
        
        //if zip code not found
        if(!zipCodeFound){
            isValid = false;
        }
        //check if username is not blank
        if($("#username").val().length== 0 && $("#username").val().typeof != "string"){
            isValid = false;
            $("#usernameError").html("Username is required");
            $("#usernameError").css("color","red");
        }
        //check if password is blank
        if($("#password").val().length == 0 || $("#passwordAgain").val().length == 0){
            isValid = false;
            $("#passwordLengthError").html("No input detected. Please try again!");
            $("#passwordLengthError").css("color","red");
        }
        //check password entries for matching value
        if($("#password").val() != $("#passwordAgain").val()){
            $("#passwordAgainError").html("Retype Password!");
            $("#passwordAgainError").css("color","red");
            isValid = false;
        }
        
        if($("#password").val().length && $("#passwordAgain").val().length < 6){
            $("#passwordLengthError").html("Password requires minimum of 6 characters, try again!")
            $("#passwordLengthError").css("color","red");
            isValid = false;
        }
        return isValid;
    }
    
});