const algosdk = require('algosdk');

class Ticker{

	constructor( pixels, conf ){

		if( !conf )
			conf = CONF_MAINNET;

		this.pixels = pixels;
		this.catchupTime = 0;
		this.max_catchup = parseInt(conf.max_catchup) > 0 ? parseInt(conf.max_catchup) : 30;
		this.min_transaction = parseInt(conf.min_transaction) > 0 ? parseInt(conf.min_transaction) : 1e6;	// Min transaction 1 whole algo
		this.lastRound = 0;	// Last block we've scanned
		this.algodClient = new algosdk.Algodv2(conf.token, conf.server, conf.port);

	}
	begin(){
		this.tick();
	}

	onAsasTransferred( nr ){
		
		console.log("Nr asa transactions", nr);
		this?.pixels?.onAsasTransferred(nr);
		

	}

	onAlgosTransferred( vals ){
		console.log("Whole transferred", vals.map(el => Math.round(el/1e5)/10));
		this?.pixels?.onAlgosTransferred(vals);
	}

	async handleBlock( block ){
		const self = this.constructor;

		let data = await this.algodClient.block(block).do();
		if( !data?.block?.txns )
			return;

		console.log("["+block+"]");
		let transactions = [];
		let asas = 0;	// Track nr asas transferred
		for( let tx of data.block.txns ){

			let txn = tx.txn;
			if( txn.type === 'pay' && txn.amt >= this.min_transaction )
				transactions.push(txn.amt);
			else if( txn.type === 'axfer' )
				++asas;

		}
		
		if( asas )
			this.onAsasTransferred(asas);
				
		if( transactions.length )
			this.onAlgosTransferred(transactions);

	}

	async handleTick(){
		const self = this.constructor;

		let newRound = await this.getActiveRound();
		let start = this.lastRound;
		this.lastRound = newRound;
		
		// Waiting to catch up
		if( this.catchupTime > 1000 ){
			process.stdout.clearLine(0);
			process.stdout.cursorTo(0);
			process.stdout.write("Catching up [block "+newRound+"]");
			return;
		}

		// This is the first block
		if( !start )
			start = newRound-1;

		if( newRound-start > this.max_catchup )
			start = newRound-this.max_catchup;		// Catch up by looping through these blocks
		
		for( let i = start; i < newRound; ++i )
			await this.handleBlock(i);

	}

	// keeps the ticker going
	async tick(){
		
		try{
			await this.handleTick();
		}catch(err){
			console.error(err);
		}

		setTimeout(this.tick.bind(this), 1000);
		
	}

	async getActiveRound(){

		const data = await this.algodClient.status().do();
		if( !data || !data['last-round'] )
			throw 'Unable to get round';

		this.catchupTime = data['catchup-time'];
		return data['last-round'];

	}
	

}


module.exports = Ticker;
