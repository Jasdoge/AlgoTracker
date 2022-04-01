# Warnings

### These instructions are for the pi 4 model B
### Do not plug in your circuit on a running pi, turn it off before doing any wiring
### Driving the pixels directly from the 5V supply of the pi is fine for a small amount of pixels not driven at max intensity.
### Using 19 pixels, like in the 3D print I made, may draw up to 1.14A if all are at max intensity, which should be fine in short bursts. Most of the time it's drawing much less power. But make sure your power supply is large enough (3A+)
### For anything larger you'll generally want a separate power supply for the pixels.

# Hardware

* A raspberry pi 4, 4+ GB ram recommended.
* A neopixel (ws2812b) strip (I use 60/m). See the warnings above about length.
* Wires, to hook everything up.
* (Optional) A 330 ohm resistor for the data pin to protect your pi.
* (Optional) A logic level shifter. May be needed based on your pixel strip and wire length if you get random flickers.
* (Optional) A large capacitor (1000uF or so, 10V+ rating). Between +5V and GND. 

When building this, it was fine to connect the data pin directly to the pi GPIO 21.
Technically the PI data pin voltage is under the neopixel threshold, which makes it more susceptible to interference, and may cause random flickering. So I suggest having a logic level shifter on hand.

[Adafruit has a great tutorial](https://learn.adafruit.com/neopixels-on-raspberry-pi/raspberry-pi-wiring) on things to consider when connecting neopixels to a pi. I suggest giving that a read before starting to wire if you're new to it.

## Wiring

1. See [pi pinout](https://linuxhint.com/gpio-pinout-raspberry-pi/) for a reference of which pin is which
2. 5V pin (such as either of the top right pins) to neopixel 5V
3. GND pin (such as third pin from the top on the right side) to neopixel GND
4. GPIO21 (bottom right pin) to neopixel data in (there should be arrows or numbering on your strip, it won't work if you plug it in backwards)


# Installing

* Install your algorand node first, using the [Official algorand installation guide](https://developer.algorand.org/docs/run-a-node/setup/install/).
* Make sure to install git on your pi through `apt install git`
* Install nodejs on your pi. There's tons of good guides on how to install it (https://www.golinuxcloud.com/install-nodejs-and-npm-on-raspberry-pi/)
* Clone this repository to wherever you want to run it from, such as `cd ~/ && git clone <TODO>`
* Go to the new directory `cd AlgoTracker <TODO>`
* Run `npm install`

At the time of writing, the neopixel library doesn't support pi 4 yet, but it can be fixed with the following steps. This may be fixed in the future. You can try skipping these two steps and if you get errors that your pi isn't supported, go back and do them.

### Option A

* I wrote a small shell script that automatically modifies the library to support the pi 4.
* First make it so you can run it `chmod +x updateLibrary.sh`
* Then run it `./updateLibrary.sh`

### Option B

* Assuming you're still in the AlgoTracker directory, run `git clone https://github.com/jgarff/rpi_ws281x.git`
* Then go to the old library source `cd node_modules/@gbkwiatt/node-rpi-ws281x-native/src`
* Then remove it `rm -rf rpi_ws281x`
* Then copy the new one `cp -r ../../../../rpi_ws281x ./`
* Then go back to the library `cd ../`
* Then recompile `npm recompile`
* Go back to the project directory `cd ../../../`

* If you don't already have your algorand node token, you'll need to look for the algod.token file in your algorand node data directory. It contains your api token.
* Finally you'll need to edit the index file `nano index.js`
* Replace the token value on line with your token ex `const token = '23aa641607900ff2754518ce14259bd595508666c972b6a286f6f7892e4fbb90';`
* You may also need to change the total nr of pixels value and the lanes unless you use the same setup as I did in the video.
* You can now run it! Note that GPIO requires root permissions. `sudo node index`
* Note that unless your node is synced with the algorand network, it will output a syncing message.


# Auto starting with systemd

* Create a new service file `sudo nano /etc/systemd/system/algotracker.service`
	Example content, replace path etc to point towards where you installed it:
	```
	[Unit]
	Description=Algorand Node Light Display
	After=network.target

	[Service]
	Type=simple
	User=root
	ExecStart=/usr/bin/node /home/yourUserName/AlgoTracker/index.js
	Restart=on-failure

	[Install]
	WantedBy=multi-user.target
	```
* Enable the tracker by running `sudo systemctl enable algotracker`
* Start it with sudo service algotracker start


