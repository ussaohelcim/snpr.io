let canvas = document.querySelector("#ctx");
let gfx = jwf(canvas);
let _canvasRect = {x:0,y:0,w:canvas.clientWidth,h:canvas.clientHeight}
let mouse = { x: 0, y: 0 }

let positions = []
let mapSprite = new Image()
mapSprite.src = "./images/map1.png"

canvas.addEventListener('mousemove', (me) => {
	let rect = canvas.getBoundingClientRect ()
	mouse =	{ x:me.x - rect.x,y: me.y - rect.y }
})

canvas.addEventListener('click', (me) => {
	me.preventDefault()
	positions.push({...mouse})
})

document.addEventListener('keypress', (ke) => {
	if (ke.key === 'e') {
		exportToJson()
	}
})

let _red = {
	r:255, g:0,b: 0, a:255
}

function exportToJson() {
	let blob = new Blob([JSON.stringify(positions)],{type: "application/json"})
	let url = URL.createObjectURL(blob)
	// window.open(url)
	let time = new Date()
	let a = document.createElement('a')
	a.href = url
	a.download = `${time.getTime()}.json`
	document.body.appendChild(a);
	a.click()
	document.body.removeChild(a)
}

setInterval(() => {
	gfx.clearBackground()
	gfx.drawImage(_canvasRect, mapSprite)
	
	positions.forEach((p) => {
		gfx.drawCircle({x:p.x,y:p.y,r:5},_red)
	})
},20)