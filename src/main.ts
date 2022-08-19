import { Server, ServerOptions } from "socket.io";
import express from "express"
import {createServer} from "http"
import path from "path";
import { ISniper, SniperServer } from "./GameServer";
import { jwML } from "./jwML";

const app = express();

const server = createServer(app);

const io = new Server(server,{});
app.use(express.static(path.join(__dirname, '..', 'dist')))

const sniperServer = new SniperServer();

io.on('connection', (socket) => {
	socket.on('player-join', (playerName,roomName, mousePos, sendToClient) => {
		socket.data.playername = playerName
		socket.data.room = roomName

		let room = sniperServer.rooms[socket.data.room]

		if (!room) {
			sniperServer.createRoom(roomName)

			room = sniperServer.rooms[socket.data.room]
		}

		if (room) {

			let player = room.createPlayer(socket.id)
			player.sniper.name = playerName
			player.sniper.aim = mousePos

			sniperServer.joinRoom(player,room)
			socket.join(roomName)

			sendToClient({
				position: player.sniper.body,
				
			})
		}
		
	})

	socket.on('update', (data, sendToClient) => {
		let room = sniperServer.rooms[socket.data.room]

		if (room) {
			let s = room.getScore().map((p) => {
				return `${p.sniper.name} k:${p.score.kill} / d:${p.score.death}`
			})

			let p = room.getPlayer(socket.id)

			p!.sniper.aim = {
				x: data.mouse.x,
				y: data.mouse.y
			} 

			p!.sniper.hide = data.hide
						
			if (!p!.sniper.hide) {
				let col = room.checkCollisionPlayers(p!)
				
				sendToClient({
					enemy: col?.sniper.body,
					pos: p?.sniper.body,
					score: s
				})
			}
			

			sendToClient({
				score: s
			})
		}
	})

	socket.on('shoot', (position, sendToClient) => {
		let room = sniperServer.rooms[socket.data.room]

		if (room) {
			let p = room.getPlayer(socket.id)
			p!.sniper.aim = position
			
			
			if (!p!.sniper.hide) {
				let dir = jwML.vector2Angle(p!.sniper.body, position)

				io.to(room!.name).emit('muzzle-flash', {					
					position: p?.sniper.body,
					arc: {
						min: dir + jwML.DEG2RAD(5),
						max: dir - jwML.DEG2RAD(5),
					}
				})

				let player = room.checkCollisionPlayers(p!)
	
				if (player) {
					player.die()
					p!.score.kill++
					
					io.to(room!.name).emit('death', {
						position: position,
						arc: {
							min: dir + jwML.DEG2RAD(20),
							max: dir - jwML.DEG2RAD(20),
						},
						msg: `${p?.sniper.name} killed ${player.sniper.name}!`
					})
					
				}
				else {
					io.to(room!.name).emit('miss', position)
				}
			}
		}

	})

	socket.on("disconnect", (reason) => {
		let room = sniperServer.rooms[socket.data.room]
		console.log(reason)
		if (room) {
			room.removePlayer(socket.id)
			if (room.players.length === 0) {
				sniperServer.deleteRoom(socket.data.room)
				let idx = sniperServer.roomNames.indexOf(socket.data.room)
				sniperServer.roomNames.splice(idx,1)
			}
		}
  });
})

server.listen(process.env.PORT || 9999, async () => {
	console.log("running at",server.address())
})
