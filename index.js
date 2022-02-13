// Copied from socket.io website, rest is original


const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
var Filter = require('bad-words')
const fs = require("fs")
filter = new Filter();

bots = JSON.parse(fs.readFileSync("bots.json", "utf-8"))

BOT_STATUS = new Map()

HISTORY = new Map()
/*
format of HISTORY
{
	"room1":{
		"msg1":"msg1",
		"coolio":"coolio"
	},
	"room2":{
    "room2msg":"room2msg"
	}
}
and so on
*/

var ONLINE = new Map()
var nodeleteuserlist = []
var banned = new Map()

function choose(choices) {
	var index = Math.floor(Math.random() * choices.length);
	return choices[index];
}

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/start.html');
});

app.get('/chat', (req, res) => {
	if (banned.has(req.query.username)) {
		res.redirect("https://socketio-chat.wwwthew.repl.co/ban")
	} else {
		username = req.query.username
		console.log(username)
		ONLINE.set(username, username)
		nodeleteuserlist.push(username)
		console.log(ONLINE)
		res.sendFile(__dirname + "/index.html");
	}
});
app.get('/admin', (req, res) => {
	res.sendFile(__dirname + '/host.html')
});
app.get('/annoying.mp3', (req, res) => {
	res.sendFile(__dirname + '/annoying.mp3')
});
app.get('/atnotification.mp3', (req, res) => {
	res.sendFile(__dirname + '/notification @.mp3')
});
app.get('/validation-fail', (req, res) => {
	res.send("<title>Error! Error!</title><style>html{background-color:red;position:absolute;text-align:center;}</style><h1>Your password was incorrect</h1>")
});

app.get('/kick', (req, res) => {
	res.send("<title>Error! Error!</title><style>html{background-color:red;position:absolute;text-align:center;}</style><h1>You were kicked by the host.</h1>")
});

app.get('/ban', (req, res) => {
	res.send("<title>Error! Error!</title><style>html{background-color:red;position:absolute;text-align:center;}</style><h1>You were banned by the host.</h1>")
});
app.use((req, res) => {
	res.send(req.pathname)
})
io.on('connection', (socket) => {
	//io.emit("online", ONLINE)
	jsonified = {}
	origHistory = Object.fromEntries(HISTORY)
	for (i in origHistory) {
		jsonified[i] = Object.fromEntries(origHistory[i])
	}
	io.emit("chat history", jsonified)
	console.log('a user connected');
	socket.on('disconnect', () => {
		console.log('user disconnected');
	});
	socket.on('chat message', (msg, roomname) => {
		if (msg !== "e") {
			date = new Date()
			realdate = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear() + ", " + (date.getHours() + 5) + ":" + date.getMinutes() + ":" + date.getSeconds()
			msgg = msg
			//Hard hat area: commands

			msgg = msgg.replace(/\/shruggie/g, "¯\\_(ツ)_/¯")
			msgg = msgg.replace(/:\)/g, "😊")
			msgg = msgg.replace(/:\(/g, "☹️")
			msgg = msgg.replace(/:\|/g, "😐")
			msgg = msgg.replace(/:D/g, "😄")
			msgg = msgg.replace(/:P/g, "😛")
			msgg = msgg.replace(/:dog:/g, "🐶")
			msgg = msgg.replace(/:grr:/g, "😡")
			msgg = msgg.replace(/:rofl:/g, "🤣")
			msgg = msgg.replace(/:sleep:/g, "😴")
			msgg = msgg.replace(/:cool:/g, "😎")
			msgg = msgg.replace(/:ice cream:/g, "🍦")
			msgg = msgg.replace(/:sundae:/g, "🍨")
			msgg = msgg.replace(/:donut:/g, "🍩")
			msgg = msgg.replace(/:cat:/g, "🐱")
			msgg = msgg.replace(/:party:/g, "🥳")
			msgg = msgg.replace(/;\)/g, "😉")
			msgg = msgg.replace(/:O/g, "😲")
			if ((msgg.includes("@[") === true)) {
				startindex = msgg.indexOf("@[")
				endindex = msgg.indexOf("]")
				person = msgg.substring(startindex + 2, endindex)
				msgg2 = msgg.slice(endindex + 1)
				msgg1 = msgg.slice(0, startindex)
				msgg = msgg1 + "<span style='color:blue;'><u>@" + person + "</u></span>" + msgg2
				io.emit('notification @', person)
			}
			msgg += '<span style="float:right">' + realdate + "</span>"
			msgg = filter.clean(msgg)
			io.to(roomname).emit('chat message', msgg);
			try {
				orig_msg = msg.match(/<.*>.*\:(.*)<\/.*>/)[1]
			} catch (err) {
				orig_msg = ""
			}
			if (!HISTORY.get(roomname)) {
				HISTORY.set(roomname, new Map())
			}
			HISTORY.get(roomname).set(msgg, msgg)
			for (bot of bots) {
				for (action in bot.actions) {
          try{
            BOT_STATUS.get(roomname)
          } catch (err){
            console.log("something went wrong")
          }
					if (!BOT_STATUS.get(roomname)) {
						BOT_STATUS.set(roomname, new Map())
					}
					if (!BOT_STATUS.get(roomname).get(bot.name)) {
						BOT_STATUS.get(roomname).set(bot.name, true)
					}
					if (orig_msg.trim() === action && BOT_STATUS.get(roomname).get(bot.name)) {
						botmsg = `<span style='color:blue'><b>${bot.name} (Bot)</b></span>: ${choose(bot.actions[action])}<span style="float:right">${realdate}</span>`
						io.to(roomname).emit('chat message', botmsg);
						HISTORY.get(roomname).set(botmsg, botmsg)
					}
				}
			}
		}
	});
	socket.on('user disconnect', (username, roomname) => {
		ONLINE.delete(username, username)
		io.emit("online", Array.from(ONLINE.keys()))
		date = new Date()
		realdate = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear() + ", " + (date.getHours() + 5) + ":" + date.getMinutes() + ":" + date.getSeconds()
		io.to(roomname).emit("chat message", "<b>System: " + username + " disconnected</b>" + "<span style='float:right'>" + realdate + "</span>")
		try {
			HISTORY.get(roomname).set("<b>System: " + username + " disconnected</b>" + "<span style='float:right'>" + realdate + "</span>", "chat message", "<b>System: " + username + " disconnected</b>" + "<span style='float:right'>" + realdate + "</span>")
		} catch {
			console.log("something happened")
		}
		setTimeout(() => {
			io.emit("confirm disconnect", "")
		}, 1000)
	});
	socket.on("send online list", (lst) => {
		console.log(lst, ONLINE)
		mapaasarray = Array.from(ONLINE.keys())
		console.log(mapaasarray)
		io.emit("online", Array.from(ONLINE.keys()))
	});
	socket.on("eval", (data) => {
		eval(data)
	});
	socket.on("kick", (user) => {
		io.emit("kick", user)
	});
	socket.on("ev", (user) => {
		io.emit("ev", user)
	});
	socket.on("delete msg history", (msg, room) => {
		if (HISTORY.get(room).delete(msg)) {
			console.log("removed from history")
		} else {
			console.log("delete not successful")
		}
	});
	socket.on("delete msg", (id, room) => {
		io.emit("delete msg", id, room)
		io.emit("admin delete msg", id, room)
		console.log("sent to deletion")
	});
	socket.on("clear history", (room) => {
		HISTORY.delete(room)
	});
	socket.on("join room", (roomname) => {
		socket.join(roomname)
	});
	socket.on("send bot list", (username) => {
		socket.emit("send bot list", username, bots)
	});
	socket.on("toggle bot", (roomname, botname) => {
		if (!BOT_STATUS.get(roomname)) {
			BOT_STATUS.set(roomname, new Map())
		}
		if (!BOT_STATUS.get(roomname).get(botname)) {
			BOT_STATUS.get(roomname).set(botname, true)
		}
		BOT_STATUS.get(roomname).set(botname, !BOT_STATUS.get(roomname).get(botname))
    console.log(BOT_STATUS)
	})
});

server.listen(3000, () => {
	console.log('listening on *:3000');
});

// io.emit('some event', { someProperty: 'some value', otherProperty: 'other value' });