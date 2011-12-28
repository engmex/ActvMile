var clientId = "TGvDSuLUiT2Sl5m5Skz04yHBQi9NtFyCG29gY6Rt";
var workoutId = "23t3eoKlRcm6WbobHNJmRQ==";
var detailsUrl = "https://motoactv.com/data/workoutDetail.json?workoutActivityId=";
var authUrl = "https://api.dailymile.com/oauth/authorize?response_type=token";
var redirectUrl = "http://localhost/~wspaetzel/actvmile/auth.html";
var oauthToken;
var tokenCookie = "dailymile_token";

/*
var ipv_activityType="1";
var ipv_activityName="Run";
var ipv_workoutActivityID="23t3eoKlRcm6WbobHNJmRQ==";


https://motoactv.com/data/workoutDetail.json?workoutActivityId=23t3eoKlRcm6WbobHNJmRQ%3D%3D&activity=1&r=0.8102906856220216

		*/
		
function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}
		
function authorizeDailymile(){
	

	var url = authUrl + "&client_id=" + clientId + "&redirect_uri=" + encodeURI(document.location);
	
	window.location = url;
	
}

function formatTime(timestamp){
	// create a new javascript Date object based on the timestamp
	
	var date = new Date(timestamp);

	
	var formattedTime =  date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate() + "T" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "Z";
	
	return formattedTime;
}		
		
function getShareUrl(id, callback) {

	var postData = {
		workoutActivityId: id
	};
	
	$.ajax({
		url: "/sharing/shareWorkout.json",
		type: 'POST',
		data: postData,
		dataType: 'json',
		success: function(json) {
			if (json && ((typeof json.code == "undefined") || (json.code > -1))) {
				var urlToShare = json.short_url;
			
				
				callback(urlToShare);
				
				
			}
			else {
				alert("Error getting share url");
			}
		}
	});
};

function postWorkout( entry ){

	$.ajax({
		url: "https://api.dailymile.com/entries.json?oauth_token=" + oauthToken,
		type: 'POST',
		data: entry,
		dataType: 'json',
		success: function(json) {
			alert(json)
		},
		error: function(j,m,e){
			alert("error posting working");
		}
	});
}


function doPost(){
	
	var url = detailsUrl + encodeURI( workoutId );
	//alert(url);
	try{
	$.ajax({
		url: url,
		data: { username: encodeURI('motorola@redune.com') },
		success: function(data){

			var startTime = data.summary.STARTTIME;
			var endTime = data.summary.ENDTIME;

			var notes =  data.journaldata.journalnotes;
			
			getShareUrl(workoutId, function(shareUrl){
			
				var message;
				if( notes)		
				{
					message = data.journaldata.journalnotes + " " + shareUrl;
				}else{
					message = shareUrl;
				}
				
				var entry = {
					lat: data.route[0].LATITUDE,
					lon: data.route[0].LONGITUDE,
					message: message,
					workout: {
						activity_type: "running",
						completed_at: formatTime( endTime ),
						distance: {
							value: endTime, 
							units: "kilometers"
						},
						duration: ( endTime - startTime ) / 1000,
						calories: data.summary.CALORIEBURN,
						title: data.journaldata.journalname
					}
				};
				
				postWorkout( entry );
			});
			
		},
		error: function(data, status, errorThrown){
			alert(data);
		}
	});
	}catch(ex){
		alert(ex);
	}
}

oauthToken = readCookie(tokenCookie);

if( oauthToken ){

	doPost();
}else{
	var searchString = "access_token=";
	
	var loc = window.location.toString();
	
	var tokenLocation = loc.indexOf(searchString);
	
	if( tokenLocation > 0 ){
		oauthToken = loc.substring(tokenLocation + searchString.length );
		createCookie(tokenCookie, oauthToken, 365);
		
		doPost();
	}else{
		authorizeDailymile();
	}
		
}
