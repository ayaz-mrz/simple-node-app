function init() {
	var serverBaseUrl = document.domain;
	
	// making connection to server
	var socket = io.connect(serverBaseUrl);
	
	var sessionId = '';
	
	// when connection is successfully connected from server
	// server emit event "connect" and we listen it
	
	socket.on("connect", function(){
		// now we get session ID
		sessionId = socket.socket.sessionid;
		
		console.log("New connection made "+sessionId);
		socket.on(room, function(data){
			var msgObj = JSON.parse(data);
			alert(msgObj.msg);
		})
		
		$("#send").click(function() {
			var message = $("#outgoingMessage").val();
			if(message.trim().length > 0) {
				socket.emit("chat", {"msg": message});
			}
		})
	});
	
	
		 	 
}

$(function(){
	// We have initlized our socket connection function 
	init();
})