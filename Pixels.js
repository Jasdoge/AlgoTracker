const ws281x = require("@gbkwiatt/node-rpi-ws281x-native");

class Pixels{

	constructor( ioPin = 21, numPixels = 19 ){

		this.channel = ws281x(numPixels, {
			gpio : ioPin,
			//invert : true,
			stripType: ws281x.stripType.WS2812
		});
		this.pixels = this.channel.array;
		this.numPixels = numPixels;
		this.maxTransactions = 40;
		this.setAllPixels();

		this.streaks = [];
		this.lanes = [];
		this.lanePixels = null;	// Becomes a uint16 array with all lane pixels in order
		this.delta = Date.now();	// Updates each tick
		// Set default lanes
		this.setLanes([	// Lanes of pixels
			new Uint16Array([0,1,2,3,4,5,6]),
			new Uint16Array([14,13,12,11,10,9,8,7]),
			new Uint16Array([18,17,16,15,4]),	
		]);

		this.animOrder;			// Holds an array of 
		this.animOrderIndex = 0;

		console.log("Channel setup with ", this.numPixels, "pixels on IO", ioPin);

	}

	setLanes( lanes ){

		this.lanes = lanes;
		let pixels = [];
		for( let lane of this.lanes )
			pixels = pixels.concat(lane);
		this.lanePixels = new Uint16Array(pixels);
		this.animOrder = [];
		for(let i = 0 ; i < this.lanes.length; ++i )
			this.animOrder.push(i);

	}

	begin(){
		setInterval(this.tick.bind(this), 33);
	}

	onAsasTransferred( numAsas ){
		// Red
		this.addRandomStreak(Math.min(1.0, numAsas/200)**2, 0, 0, 500, Math.ceil(Math.random()*3000));
	}

	onAlgosTransferred( transactions = [] ){

		transactions = transactions.slice(0, this.maxTransactions);

		let dur = 4600 / transactions.length;	// Spit everything out over a 4 sec period 

		for( let i = 0; i < transactions.length; ++i ){

			const microAlgos = transactions[i];

			// first 3 are color, 4th is duration
			let props = [1,0.5,0, 1750];			// Orange for the highest transactions
			if( microAlgos < 10e6 )			// Less than 10 bucks = green
				props = [0,.5,0, 750];
			else if( microAlgos < 100e6 )	// Less than 100 bucks = blue
				props = [0,0.1,0.5, 1000];
			else if( microAlgos < 1000e6 )	// Less than 1k bucks = purple
				props = [0.3,0.0,0.5, 1250];
			else if( microAlgos < 10000e6 )	// Less than 10k = yellow
				props = [0.5,0.5,0, 1500];
			
			props.push(Math.floor(dur*i));	// Add predelay
			this.addRandomStreak(...props);

		}

		this.shuffleAnimOrder();
		
	}

	shuffleAnimOrder(){
		this.animOrderIndex = 0;
		this.constructor.shuffleArray(this.animOrder);
	}

	// Adds a "streak" to a random block
	addRandomStreak( r = 0.0, g = 0.0, b = 0.0, dur = 1000, predelay = 0 ){

		++this.animOrderIndex;
		let lane = this.animOrder[this.animOrderIndex%3];
		let streak = this.getStreak();
		streak.configure(this.lanes[lane], r, g, b, dur, predelay);

	}

	// Gets an unused streak, or makes a new one if we don't have enough
	getStreak(){
		for( let streak of this.streaks ){
			if( streak.expired() )
				return streak;
		}
		let streak = new Streak();
		this.streaks.push(streak);
		return streak;
	}

	setAllPixels( color = 0 ){

		for( let i = 0; i < this.numPixels; ++i )
			this.pixels[i] = color;

	}

	buildPixelBrightness( pixel ){

		let r = 0.0, g = 0.0, b = 0.0;
		for( let streak of this.streaks ){
			let color = streak.getColorAt(pixel, this.delta);
			r += color.r;
			g += color.g;
			b += color.b;
		}
		
		let out = 
			(Math.round(Math.max(0, Math.min(1, r))*255) << 16) |
			(Math.round(Math.max(0, Math.min(1, g))*255) << 8) |
			Math.round(Math.max(0, Math.min(1, b))*255)
		;

		this.pixels[pixel] = out;

	}

	tick(){

		this.delta = Date.now();

		for( let i = 0; i < this.numPixels; ++i )
			this.buildPixelBrightness(i);

		this.draw();

	}

	draw(){
		ws281x.render();
	}

	static shuffleArray(array){
		for( let i = array.length - 1; i > 0; i-- ){
			const j = Math.floor(Math.random() * (i + 1));
			const temp = array[i];
			array[i] = array[j];
			array[j] = temp;
		}
	}

}


class Streak{

	// Setup in configure
	constructor(){}

	configure( lane, r = 0.0, g = 0.0, b = 0.0, dur = 1000, predelay = 0 ){

		this.dur = dur;
		this.r = r;
		this.g = g;
		this.b = b;
		this.lane = lane || new Uint16Array();		// 16 bit array
		this.started = Date.now();
		this.predelay = predelay;

	}

	// returns an object with {r, g, b}
	getColorAt( pixel, delta ){

		let out = {r:0, g:0, b:0};
		const lIdx = this.lane.indexOf(pixel);
		if( lIdx === -1 || this.expired() || delta < this.predelay+this.started )
			return out;

		// How far has the animation gone?
		const animPerc = (delta-(this.started+this.predelay))/this.dur;
		// What pixel is the animation at (float)
		const pixelAt = this.lane.length*animPerc;
		
		if( lIdx >= pixelAt-1 && lIdx <= pixelAt+1 ){

			let fade = 1.0;
			if( animPerc < 0.2 )
				fade = (animPerc*5)**2;
			
			const multi = 1.0-Math.abs(lIdx-pixelAt);
			out.r = (this.r*multi)*fade;
			out.g = (this.g*multi)*fade;
			out.b = (this.b*multi)*fade;

		}
		
		return out;

	}

	expired(){
		return Date.now() > this.started+this.dur+this.predelay;
	}
	
}

module.exports = Pixels;

