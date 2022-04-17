const Pixels = require("./Pixels");
const Ticker = require("./Ticker");

// Change this to your own token
const token = '3f572a9873b30cb6c546abc4bdd138d8c8940bf7359e3fbf1f3e02783adf5e0d';

// Begin
const pixels = new Pixels(
	21, 	// IO pin. I don't think all of them work, but 21 is easy to remember since it's bottom right.
	19,		// Total nr pixels
);
pixels.setLanes([	// Lanes of pixels. 
	new Uint16Array([0,1,2,3,4,5,6]),			// In my design I used pixels 0->6 for the backslash of the logo
	new Uint16Array([14,13,12,11,10,9,8,7]),	// I used pixels 7->14 for the leftmost forward slash in the logo, but in reverse
	new Uint16Array([18,17,16,15,4]),			// I used pixels 15-18 in reverse for the mid slash, plus 4 which is shared with the rightmost lane
]);

const ticker = new Ticker(
	pixels,	// nr pixels
	{
		token,
		server : 'http://127.0.0.1',
		port : 8080
	}
);
ticker.begin();
pixels.begin();


