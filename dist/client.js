let canvas = document.querySelector("#ctx");
let gfx = jwf(canvas);
let _canvasRect = {x:0,y:0,w:canvas.clientWidth,h:canvas.clientHeight}
let keyboard = {}
let _particles = PARTY(gfx.gfx, 2)

let mouse = { x:0,y: 0 }
let _score = 0
let _gameRuning = true
let _pointSound = new Audio('./point.wav')
let _wallColision = false
let playerName = prompt("Player name") || "anon"
let roomName = prompt("Room name") || "random"
let highscore = document.querySelector('#highscore')
let roomNameElement = document.querySelector("#roomname")
let playerSprite = new Image()
playerSprite.src = "./images/player.png"
let enemySprite = new Image()
enemySprite.src = "./images/enemy.png"
let mapSprite = new Image()
mapSprite.src = "./images/map1.png"
let killfeedElement = document.querySelector("#killfeed")
let shootSound = new Audio()
shootSound.src = "./sounds/silenced.ogg"

canvas.addEventListener('mousemove', (me) => {
	let rect = canvas.getBoundingClientRect ()
	mouse =	{ x:me.x - rect.x,y: me.y - rect.y }
})


let _green_background = {
	r:100, g:150,b: 100, a:255
}
let _green = {
	r:0, g:255,b: 0, a:255
}
let _black = {
	r:0, g:0,b: 0, a:255
}
let _red = {
	r:255, g:0,b: 0, a:255
}
let _yellow = {
	r:255, g:255,b: 0, a:255
}

let _bloodParticles = PARTY(gfx.gfx, 2, _red)
let _muzzle = PARTY(gfx.gfx, 2,_yellow)
const serverAdress = `${window.location.host}`  
const SOCKET = io(serverAdress, {})

SOCKET.on("connect", () => {
	console.log(`connect ${SOCKET.id}`);
});

class SniperClient{
	constructor() {
		this.enemy = undefined
		SOCKET.on("error", (error) => {
			console.log(error)
		});
		this.KillFeed = new KillFeed()

		SOCKET.emit('player-join', playerName, roomName, mouse , (res) => {
			this.position = res.position
			this.hide = true

			roomNameElement.textContent = `Room name: ${roomName}`
			
			canvas.width = mapSprite.width
			canvas.height = mapSprite.height
		})

		SOCKET.on('death', (data) => {
			shootSound.pause()
			shootSound.play()

			let pos = data.position
			let arc = data.arc //min & max
			
			this.KillFeed.add(data.msg)

			for (let i = 0; i < 30; i++) {
				_bloodParticles.createParticle(pos ,randBetween(arc.min,arc.max), Math.random() * 5,Math.random() * 200)
			}

			this.updateHud()
		})

		SOCKET.on('miss', (position) => {
			// _pointSound.play()
			shootSound.pause()
			shootSound.play()
			
			for (let i = 0; i < 30; i++) {
				_particles.createParticle(position, undefined, Math.random() * 5, Math.random() * 200)
			}

		})

		SOCKET.on('muzzle-flash', (data) => {
			let pos = data.position
			let arc = data.arc //min & max
			
			for (let i = 0; i < 30; i++) {
				_muzzle.createParticle(pos ,randBetween(arc.min,arc.max), Math.random() * 100,10)
			}
		})
	}

	draw() {
		if (!this.hide) {
			if (this.enemy) {
				gfx.drawImage(jwML.vec2(
					this.enemy.x - (playerSprite.width / 2),
					this.enemy.y - (playerSprite.height / 2)
				), enemySprite)

			}

			gfx.drawImage(jwML.vec2(
				this.position.x - (playerSprite.width / 2),
				this.position.y - (playerSprite.height / 2),
			), playerSprite)
			
			gfx.drawCircleLines({ x: mouse.x, y: mouse.y, r: 15 })
			
			if (this.KillFeed.feed.length > 0) {
				gfx.drawRectangleLines(_canvasRect,_red)
			}
		}
	}

	update() {
		let data = {
			hide: this.hide,
			mouse: mouse
		}

		SOCKET.emit('update', data, (res) => {
			this.position = res.pos
			this.enemy = res.enemy
			this.score = res.score
			this.updateHud()
		})

		this.KillFeed.update()
		
	}
	updateHud() {
		let txt = ""
		this.KillFeed.feed.forEach((f) => {
			txt += `${f.msg}\n`
		})
		
		killfeedElement.textContent = txt

		if (this.score) {
			let t = ""
			this.score.forEach((s) => {
				t += `${s} <br>`
			})
			highscore.innerHTML = t
		}

	}
	shoot() {
		SOCKET.emit('shoot', mouse, (res) => {

		})
	}
	
}

class KillFeed{
	constructor() {
		this.feed = []
	}
	add(str) {
		this.feed.push({
			msg: str,
			ttl: 120
		})
	}
	update() {
		let f = this.feed.filter((v) => {
			v.ttl--
			return v.ttl > 0
		})
		
		this.feed = f
	}
}

function randBetween(min,max){
	return (Math.random() * (max-min)) + min;
}

document.addEventListener('DOMContentLoaded', () => {

	let player = new SniperClient()

	document.addEventListener('click', (me) => {
		me.preventDefault()
		player.shoot()
	})

	document.addEventListener('keypress', (ke) => {
		ke.preventDefault()
		
		if (ke.key === "s") {
			player.hide = !player.hide
		}
	})

	let gameUpdate = setInterval(async () => {
		player.update()

		gfx.clearBackground()
		gfx.drawImage(_canvasRect,mapSprite)
				
		if (player.position) {
			player.draw()
		}
	
		_particles.draw()
		_bloodParticles.draw()
		_muzzle.draw()
	},16)
})

