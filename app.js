/**
 * @author ayaz
 */
var express = require("express"),
	path = require("path"),
	io = require("socket.io"),
	redis = require("redis"),
	RedisStore = require("connect-redis")(express);
	
var redisClient = redis.createClient();
var sessionStore = new RedisStore({client:redisClient});

var sub = redis.createClient();
var pub = redis.createClient();
	
var app = express(),
	server = require("http").createServer(app),
	io = io.listen(server)
	_ = require("underscore");

var cookieParser = express.cookieParser("topseckret");
app.use(cookieParser);
app.use(express.session({store:sessionStore, key:'jsessionid', secret:'topseckret'}));
app.configure(function(){
	app.set("port", process.env.PORT || "8080");
	app.set("views", __dirname + "/views");
	app.set("view engine", "jade");
	
	
	app.use(express.bodyParser());
	app.use(express.static( path.join(__dirname, "/public") ) );
});

io.set("log level", 1);

/**
 * Particepents list format will be
 * 
 * {
 * 	id: "sessionId",
 * 	name: "particepentName"
 * }
 * 
 **/
var participents = [];

app.get("/", function(req, res){
	res.render("userlogin");
});

app.post("/chat", function(req, res){
	req.session.user = req.body.uname;
	req.session.room = req.body.room;
	sub.subscribe(req.body.room);
	res.render("index", {"name": req.body.uname, "room": req.body.room});
});

app.post("/message", function(req, res){
	var message = req.body.message;
	var name = req.body.name;
	if( _.isUndefined(message) || _.isEmpty(message.trim()) ) {
		return res.json(400, {error : "Message is invalid."});
	}
	
	io.sockets.emit("incommingMessage", {name: name, message: message});
	
	res.json(200, {message: "Message Recived"});
	
});
	
// Socket IO event handling
// this is deprecated
/**io.on("connection", function(){
	console.log("New Connection..!!");
});**/	

// Introducing session socket.io
var SessionSockets = require("session.socket.io");
var sessionSockets = new SessionSockets(io, sessionStore, cookieParser, "jsessionid");

// Session socket listining!!
sessionSockets.on("connection", function(err, socket, session){
	if(!session.user) return;
	
	socket.on("chat", function(data){
		var message = data.msg;
		var pubData = JSON.stringify({user: session.user, msg: message});
		 
		console.log("Pub Data" + session.user+" - "+message);
		pub.publish(session.room, pubData);
	});
	
	
	sub.on("message", function(channel, message){
		socket.emit(channel, message);
	});
});
	
server.listen(8080);

console.log("Server Started on localhost:8080");
