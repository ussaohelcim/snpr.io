import { jwCL } from "./jwCL"
import { IRect,ICircle,IVec2 } from "./jwf"
import { jwML } from "./jwML"

const mapPositions = require("./maps/map1.json")

export class SniperServer{
	roomNames:string[] = []
	rooms: { [index: string]: Room | undefined } = {}

	createRoom(name:string) {
		this.rooms[name] = new Room(name)
		this.roomNames.push(name)
		console.log((new Date().toISOString()))
		console.log(name,"created")
	}

	joinRoom(player: Player, room:Room) {
		room.addPlayer(player)
		console.log((new Date().toISOString()))
		console.log(player.sniper.name,"joined",room.name)
	}

	deleteRoom(name: string) {
		this.rooms[name] = undefined
		console.log((new Date().toISOString()))
		console.log(name,"deleted")
	}
}
interface IKD{
	kill: number
	death: number
}
class Player{
	sniper:ISniper
	id: string
	rect: IRect
	score:IKD
	constructor(id: string, rect: IRect, size: number) {
		let pos = mapPositions[Math.floor(Math.random() * mapPositions.length)]
		this.sniper = {
			body: {x: pos.x,y: pos.y, r:size},
			name: "anon",
			hide: true, 
			aim: { x: 0, y: 0 },
			scope: 15
		}
		this.score = {
			kill:0,
			death:0
		}
		this.rect = rect
		
		this.id = id
	}
	die() {
		let pos = mapPositions[Math.floor(Math.random() * mapPositions.length)]
		this.sniper.body = { x: pos.x,y: pos.y, r: this.sniper.body.r }
		this.score.death++
	}

}

export interface ISniper{
	name: string
	hide: boolean
	body: ICircle
	aim: IVec2
	scope:number
}

export class Room{

	players: Player[] = []
	rect: IRect
	name:string
	constructor(name:string,w?: number, h?: number) {
		this.name = name
		this.rect = jwML.rect(0, 0, w || 640, h || 480)
	}
	addPlayer(player:Player) {
		this.players.push(player)
	}
	createPlayer(id:string) {
		let p = new Player(id,this.rect,10)
		return p
	}
	getPlayer(id:string) {
		return this.players.find((p) => {
			return p.id === id
		})
	}
	getSnakes() {
		let players = this.players.map((p) => {
			return p.sniper
		})

		return players
	}
	removePlayer(id: string) {
		let p = this.getPlayer(id)
		if (p) {
			this.players.splice(
				this.players.indexOf(p), 1
			)
			console.log((new Date().toISOString()))
			console.log(p.sniper.name,"removed from",this.name,)
		}
	}
	getScore() {
		let sorted = this.players.sort((a, b) => {
			return b.score.kill - a.score.kill
		})
		return sorted
	}
		
	/**
	 * Checks if the player.sniper.AIM its colliding with other players
	 * @param player 
	 * @returns 
	 */
	checkCollisionPlayers(player: Player) {
		let collided:Player|undefined //= undefined

		this.players.forEach((p) => {
			if (p.id !== player.id) {
				if (!p.sniper.hide) {
					let cc = {...player.sniper.aim,r:player.sniper.scope}
					let c = jwCL.checkCollisionCircles(cc, p.sniper.body)
					if (c) {
						collided = p
						return
					}
				}
			} 
		})

		return collided
	}
}