/***********************************

************************************
***** Let's Make a Typing Game *****
************************************

VERSION:
[major].[minor].[bugfix]
0.2.1

CHANGELOG:
[pre 0.1.0]
Added character
Added ground
Added clouds
Added sky
Added dinero
Buffed dinero to mas dinero
Buffed dinero to mucho mas dinero
Added unit conversion up to 100B
Added furnace T1
Added clouds from furnace
Added for sale signs
Added cactus farm T1, T2, furnace T2
Added floating coin and cost
Added functionality to signs
Reworked costs and added profits
Animated character

[0.1.0]
Added CHANGELOG
Added VERSION
Added TODO
Added Generator (T1 look, stars)
Added stars
Started cost rebalance

[0.2.0]
Changed jump to move background instead of character
Attempted to add fences

[0.2.1]
Fixed issue with coin hovering off the screen
Fixed issue with parallax hiding when groundOffset is changed
<!>Fixed fences

TODO:
FIX FENCES
Make jump move the background instead of the character
Make vertical parallax for jump and whatnot
Electrical Poles from Generator
Add quarry with explorable tunnels with bonus loot
Add showdown (animate)
Come up with other new building ideas
Rebalance cost/profit
Rework Cactus Farm {
	Place cacti along the background scenery, upgrade amounts as cactus farm upgrades
	Make the cactus farm actually grow cacti instead of depending on a timer to give
		Therein make a coin appear and float up and disappear when a cactus finishes
	Make size of growable cactus change based on farm level
	Extend width of cactus farmland in foreground
}
Help Texts Ingame
Port clickable UPGRADES from the other version
Add lights to the power lines
Add more to TODO

***********************************/

//general defs
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var groundOffset = 0;
var groundLevel = 358 + groundOffset;
//background
var backgroundImage = new Image();
var sand = new Image();
var sandTop = new Image();
var cloudImg = new Image();
var activeClouds = [""];
//character
var charSpeed = 5;
var player = new character(280, groundLevel, charSpeed); //3rd option is speed default=2
var characterImage = new Image();
var direction = 1;
var bulletArray;
var isWalking = false;
//gui
var coinCounterGUI = new Image();
var spacedOut = false;
//income
var newTime = new Date();
//signs
var signImage = new Image();
var star = new Image();
//props
var fenceProp = new Image();
var pylonProp = new Image();
/**-----------------------------------
		Balance Controls
-----------------------------------**/
//COST
var furnaceCostControls = [50, 50500, 505050];
var cactusFarmCostControls = [5000, 102500, 4102500];
var generatorCostControls = [100, 10000, 1000000, 100000000, 10000000000]; //starts at 0 as in you make nothing without the generator
//PROFIT
var furnaceProfitControls = [5, 505, 50505];
var cactusFarmProfitControls = [250, 10250, 4010250];
var generatorMultiplierControls = [0.01, 1, 1.25, 1.5, 1.5]; // starts at 0, see above
//furnace
var furnaceLevel = 0;
var furnaceImage = new Image();
var furnaceSign = new sign(510, groundLevel, furnaceCostControls[furnaceLevel], "furnace"); // max X = 816
var furnaceCloud;
//showdown // max X = 544
//quarry - evolves underground too // max X = 272
//cactus farm
var cactusFarmLevel = 0;
var cactusFarmImage = new Image();
var cactusFarmSign = new sign(20, groundLevel, cactusFarmCostControls[cactusFarmLevel], "cactusFarm");
//generator
var generatorLevel = 0;
var generatorState = 10;
var generatorImage = new Image();
var generatorSign = new sign(1020, groundLevel, generatorCostControls[generatorLevel], "generator");
//world
var myWorld = new World();
var camX;
var camY
	//parallax (layerLevel{rendered as 0 closest -> infinity farthest | Note: Is used in division (plr.spd / lvl}, startX, startY, imgName{ex: fence}, doesRepeat, width, height)
var isAbleToParallax = false;
var hasFixedParallax = false;
var paraList = [new paraLayer(6, -200, -240, "sandDunes2", true, 2048, 512), new paraLayer(4, 0, -140, "sandDunes1", true, 1024, 256), new paraLayer(2, 0, -40, "sandDunes2", true, 1024, 128)];
var sandDunes1 = new Image();
var sandDunes2 = new Image();
//nice visual things
	//cactus farm cacti on background parallax

	//power lines between generator and other things


function World() {
	this.minX = -1000;
	this.minY = 0;
	this.maxX = canvas.width;
	this.maxY = canvas.height;
	this.farthestRight = canvas.width - this.minX;
}

function init() {
	for (var ii = 0; ii < 15; ii++) {
		activeClouds[ii] = new cloud(-64 - (Math.random() * 1500), Math.random() * 75, Math.random() + 0.1, Math.floor(Math.random() * (128 - 64 + 1)) + 64);
	}
	characterImage = player.stepRight;
	parallax();
}

function clamp(value, min, max){
    if(value < min) {
		if (!isAbleToParallax && !hasFixedParallax) {
			for (var ii = 0; ii < paraList.length; ii++) {
				/**
				BROKEN: Fixed ish with += 2 / += 3 but still broken
				**/
				paraList[ii].x++;
			}
			hasFixedParallax = true;
		}
		isAbleToParallax = false; 
		return min;
	}
    else if(value > max) {
		if (!isAbleToParallax && !hasFixedParallax) {
			for (var ii = 0; ii < paraList.length; ii++) {
				/**
				BROKEN: Fixed ish with += 2 / += 3 but still broken
				**/
				paraList[ii].x--;
			}
			hasFixedParallax = true;
		}
		isAbleToParallax = false; 
		return max;
	}
	hasFixedParallax = false;
	isAbleToParallax = true;
    return value;
}

function draw() {
	ctx.setTransform(1,0,0,1,0,0);//reset the transform matrix as it is cumulative
    ctx.clearRect(0, 0, canvas.width, canvas.height);//clear the viewport AFTER the matrix is reset

    //Clamp the camera position to the world bounds while centering the camera around the player                                             
    camY = clamp(-player.y + canvas.height/2, myWorld.minY, myWorld.maxY - canvas.height);
	camX = clamp(-player.x + canvas.width/2, myWorld.minX, myWorld.maxX - canvas.width);

   ctx.translate( camX, camY );
	
	//clear();
	background();
	gui();
	jump();
	drawBuildings();
	drawCharacter();
	paintBullets();
	collectIncome();
	requestAnimationFrame(draw);
}

//		Props: Display behind buildings but aren't in parallax		//
function drawProps(propImage, startX, startY, endX, endY, width, height) {
	for (var thisX = startX; thisX < endX; thisX += width) {
		for (var thisY = startY; thisY < endY + 1; thisY += height) {
			ctx.drawImage(propImage, thisX, thisY, width, height);
		}
	}
}

function drawParallax() {
	for(var ii = 0; ii < paraList.length; ii++) {
		if (paraList[ii].repeats == true) {
			for (var si = 0; si < myWorld.farthestRight; si += paraList[ii].width) {
				ctx.drawImage(window[paraList[ii].img], paraList[ii].x + si, paraList[ii].y + groundLevel, paraList[ii].width, paraList[ii].height);
			}
		}
		else {
			ctx.drawImage(window[paraList[ii].img], paraList[ii].x, paraList[ii].y + groundLevel, paraList[ii].width, paraList[ii].height);
		}
	}
}

function parallax() {
	for (var ii = 0; ii < paraList.length; ii++) {
		if (direction == -1 && isAbleToParallax) {
			paraList[ii].x += player.speed / paraList[ii].level;
		}
		else if (direction == 1 && isAbleToParallax) {
			paraList[ii].x -= player.speed / paraList[ii].level;
		}
	}
}

function paraLayer(layerLevel, startX, startY, theImage, doesRepeat, inWidth, inHeight) {
	this.level = layerLevel;
	this.x = startX;
	this.y = startY;
	this.img = theImage;
	this.repeats = doesRepeat;
	this.width = inWidth;
	this.height = inHeight;
}

function gui() {
	ctx.drawImage(coinCounterGUI, -camX + 10, -camY + 10, 32, 32);
	ctx.font = "32px castellar";
	ctx.fillStyle = "gold";
	ctx.fillText(unitConversion(player.gold), -camX + 45, -camY + 36);
}

function collectIncome() {
	newTime = new Date();
	var thisProfit = 0;
	//furnace
	switch(furnaceLevel) {
		case 1:
			if (newTime.getTime() - furnaceSign.oldTime.getTime() >= 1600) {
				thisProfit += furnaceProfitControls[furnaceLevel];
				furnaceSign.oldTime = newTime;
			}
			break;
		case 2:
			if (newTime.getTime() - furnaceSign.oldTime.getTime() >= 800) {
				thisProfit += furnaceProfitControls[furnaceLevel];
				furnaceSign.oldTime = newTime;
			}
			break;
	}
	//cactusFarm
	switch(cactusFarmLevel) {
		case 1:
			if (newTime.getTime() - cactusFarmSign.oldTime.getTime() >= 1600) {
				thisProfit += cactusFarmProfitControls[cactusFarmLevel];
				cactusFarmSign.oldTime = newTime;
			}
			break;
		case 2:
			if (newTime.getTime() - cactusFarmSign.oldTime.getTime() >= 1600) {
				thisProfit += cactusFarmProfitControls[cactusFarmLevel];
				cactusFarmSign.oldTime = newTime;
			}
			break;
	}
	player.gold += (thisProfit * generatorMultiplierControls[generatorLevel])
}

function unitConversion(num) {
	if (num >= 100000000) {
		return (num/100000000).toFixed(2) + "B";
	}
	else if (num >= 1000000) {
		return (num/1000000).toFixed(2) + "M";
	}
	else if (num >= 1000) {
		return (num/1000).toFixed(2) + "K";
	}
	else {
		return num.toFixed(2);
	}
}

function drawBuildings() {
	furnaceSign.y = groundLevel;
	cactusFarmSign.y = groundLevel;
	generatorSign.y = groundLevel;
	drawCactusFarm();
	drawFurnace();
	drawGenerator();
}

function drawCactusFarm() {
	switch(cactusFarmLevel) {
		case 0:
			ctx.drawImage(signImage, cactusFarmSign.x, cactusFarmSign.y, 64, 64);
			coinHover(cactusFarmSign);
			break;
		case 1:
			drawProps(fenceProp, cactusFarmSign.x - 42, cactusFarmSign.y, cactusFarmSign.x + 320, cactusFarmSign.y, 64, 64);
			ctx.drawImage(cactusFarmImage, cactusFarmSign.x - 100, cactusFarmSign.y - 32, 96, 96);
			ctx.drawImage(signImage, cactusFarmSign.x, cactusFarmSign.y, 64, 64);
			coinHover(cactusFarmSign);
			break;
		case 2:
			drawProps(fenceProp, cactusFarmSign.x - 128, cactusFarmSign.y, cactusFarmSign.x + 192, cactusFarmSign.y, 64, 64);
			ctx.drawImage(cactusFarmImage, cactusFarmSign.x - 258, cactusFarmSign.y - 192, 252, 256);
			ctx.drawImage(signImage, cactusFarmSign.x, cactusFarmSign.y, 64, 64);
			coinHover(cactusFarmSign);
			break;
		default:
			ctx.drawImage(cactusFarmImage, cactusFarmSign.x - 112, cactusFarmSign.y - 64, 256, 256);
			break;
	}
}

function drawGenerator() {
	handlePylons();
	switch(true) {
		case (generatorLevel == 0):
			ctx.drawImage(signImage, generatorSign.x, generatorSign.y, 64, 64);
			coinHover(generatorSign);
			break;
		case (generatorLevel < 5):
			generatorImage = window["g" + Math.floor(generatorState / 10)];
			generatorState++;
			if (generatorState > 89) {
				generatorState = 10;
			}
			ctx.drawImage(generatorImage, generatorSign.x - 100, generatorSign.y - 32, 96, 96);
			ctx.drawImage(signImage, generatorSign.x, generatorSign.y, 64, 64);
			coinHover(generatorSign);
			drawStars(generatorSign, -28, -16);
			break;
		case (generatorLevel < 9):
			console.log("GENERATOR OVERLOAD");
		default:
			ctx.drawImage(generatorImage, generatorSign.x - 112, generatorSign.y - 64, 256, 256);
			break;
	}
}

function drawFurnace() {
	switch(furnaceLevel) {
		case 0:
			ctx.drawImage(signImage, furnaceSign.x, furnaceSign.y, 64, 64);
			coinHover(furnaceSign);
			break;
		case 1:
			ctx.drawImage(furnaceImage, furnaceSign.signOffsetX + 64, furnaceSign.y, 64, 64);
			furnaceCloud.x += furnaceCloud.moveSpeed;
			furnaceCloud.y -= furnaceCloud.moveSpeedY;
			furnaceCloud.size++;
			if (furnaceCloud.x >= 1100) {
				furnaceCloud.x = furnaceSign.x + 96;
				furnaceCloud.y = furnaceSign.y + 4;
				furnaceCloud.size = 1;
			}
			if (furnaceCloud.moveSpeedY > 0) {
				furnaceCloud.moveSpeedy -= 0.5;
			}
			ctx.drawImage(cloudImg, furnaceCloud.x, furnaceCloud.y, furnaceCloud.size, furnaceCloud.size);
			ctx.drawImage(signImage, furnaceSign.x, furnaceSign.y, 64, 64);
			coinHover(furnaceSign);
			break;
		case 2:
			ctx.drawImage(furnaceImage, furnaceSign.x + 70, furnaceSign.y - 64, 128, 128);
			furnaceCloud.x += furnaceCloud.moveSpeed;
			furnaceCloud.y -= furnaceCloud.moveSpeedY;
			if (furnaceCloud.size <= 150) {
				furnaceCloud.size+=4;
			}
			if (furnaceCloud.y <= -100) {
				furnaceCloud.x = furnaceSign.x + 187;
				furnaceCloud.y = furnaceSign.y + 4;
				furnaceCloud.size = 2;
			}
			if (furnaceCloud.moveSpeedY > 0) {
				furnaceCloud.moveSpeedy -= 0.5;
			}
			ctx.drawImage(cloudImg, furnaceCloud.x, furnaceCloud.y, furnaceCloud.size, furnaceCloud.size);
			ctx.drawImage(signImage, furnaceSign.x, furnaceSign.y, 64, 64);
			coinHover(furnaceSign);
			break;
		default:
			ctx.drawImage(furnaceImage, furnaceSign.x - 112, furnaceSign.y - 64, 64, 64);
			break;
	}
}

function furnaceLevelUp() {
	furnaceLevel++;
	switch(furnaceLevel) {
		case 1:
			furnaceSign.signOffsetX = furnaceSign.x;
			furnaceSign.x + 64;
			furnaceImage.src = "game/textures/ovenT1.png";
			furnaceCloud = new cloud(furnaceSign.signOffsetX + 96, furnaceSign.signOffsetY + 4, 1, 10, 3);
			break;
		case 2:
			furnaceSign.signOffsetX = furnaceSign.x;
			furnaceImage.src = "game/textures/ovenT2.png";
			furnaceCloud = new cloud(furnaceSign.signOffsetX + 187, furnaceSign.signOffsetY + 4, 2, 10, 9);
			furnaceSign.x -= 20;
			break;
		default:
			furnaceImage.src = "game/textures/ovenT1.png";
			furnaceCloud = new cloud(furnaceSign.x + 96, furnaceSign.y + 4, 1, 10, 3);
			break;
	}
	furnaceSign.cost = furnaceCostControls[furnaceLevel];
}

function generatorLevelUp() {
	generatorLevel++;
	switch(generatorLevel) {
		case 1:
			generatorSign.signOffsetX = generatorSign.x;
			generatorSign.x += 64;
			generatorSign.coinX = generatorSign.x;
			break;
		case 2:
			generatorSign.stars++;
			break;
		case 3:
			generatorSign.stars++;
			break;
		case 4:
			generatorSign.stars++;
			break;
		case 5:
			generatorSign.stars = 0;
			break;
		default:
			generatorImage.src = "game/textures/generatorT1_phase1.png";
			break;
	}
	generatorSign.cost = generatorCostControls[generatorLevel];
}

function cactusFarmLevelUp() {
	cactusFarmLevel++;
	switch(cactusFarmLevel) {
		case 1:
			cactusFarmImage.src = "game/textures/cactusFarmT1.png";
			cactusFarmSign.signOffsetX = cactusFarmSign.x;
			cactusFarmSign.x += 128;
			cactusFarmSign.coinX = cactusFarmSign.x;
			break;
		case 2:
			cactusFarmImage.src = "game/textures/cactusFarmT2.png";
			cactusFarmSign.signOffsetX = cactusFarmSign.x;
			cactusFarmSign.x += 128;
			break;
		default:
			cactusFarmImage.src = "game/textures/cactusFarmT1.png";
			break;
	}
	cactusFarmSign.cost = cactusFarmCostControls[cactusFarmLevel];
}

function handlePylons() {
	/**
		Handles pylon weirdery:
	**/
	//As long as generator above:
	if (generatorLevel) {
		//furnace
		if (furnaceLevel > 0 || cactusFarmLevel > 0) {
			//changed size here - propogate to .net
			wireMath(generatorSign.x - 174, groundLevel - 90, generatorSign.x - 600, groundLevel - 0);
			ctx.drawImage(pylonProp, generatorSign.x - 180, groundLevel - 128, 64, 192);
		}
	}
}

function wireMath(pylonX, pylonY, endX, endY) {
	var sag = (pylonY - endY)/2;
	ctx.beginPath();
	ctx.strokeStyle = "#505050";
	ctx.lineWidth = "2";
	//moveTo - left start position
	ctx.moveTo(pylonX, pylonY); /**END**/
	//curveto - first pair is curve control point | second pair is last point
	ctx.quadraticCurveTo((pylonX + endX)/2, groundLevel - sag, endX, endY);
	ctx.stroke();
}

function sign(myX, myY, amt, givenFunc) {
	this.x = myX;
	this.y = myY;
	this.coinX = this.x;
	this.coinY = 0;
	this.coinOnDown = false;
	this.cost = amt;
	this.levelUp = givenFunc;
	this.oldTime = new Date();
	this.stars = 0;
	this.signOffsetX = myX;
	this.signOffsetY = myY;
}

function drawStars(givenSign, offsetX, offsetY) {
	var signOffX = givenSign.signOffsetX + offsetX;
	//change to + for stars hover with coin -------V
	var signOffY = givenSign.signOffsetY + offsetY - givenSign.coinY;
	switch(givenSign.stars) {
		case 0:
			break;
		case 1:
			ctx.drawImage(star, signOffX, signOffY, 16, 16);
			break;
		case 2:
			ctx.drawImage(star, signOffX, signOffY, 16, 16);
			ctx.drawImage(star, signOffX + 16, signOffY - 8, 16, 16);
			break;
		case 3:
			ctx.drawImage(star, signOffX, signOffY, 16, 16);
			ctx.drawImage(star, signOffX + 16, signOffY - 8, 16, 16);
			ctx.drawImage(star, signOffX + 32, signOffY, 16, 16);
			break;
		default:
			console.log("Error drawing stars: Exceeds max");
	}
}

function coinHover(givenSign) {
	//coin animation
		if (givenSign.coinY == -8) {
			givenSign.coinOnDown = true;
		}
		if (givenSign.coinY == 0) {
			givenSign.coinOnDown = false;
		}
		if (givenSign.coinOnDown == true) {
			givenSign.coinY += 0.25;
		}
		else {
			givenSign.coinY -= 0.25;
		}
	if (player.x >= givenSign.x - 48 && player.x <= givenSign.x + 48) {
		//cost text
		ctx.font = "32px castellar";
		ctx.fillStyle = "gold";
		ctx.textAlign = "center";
		ctx.fillText(unitConversion(givenSign.cost), givenSign.x + 32, givenSign.y - 8);
		ctx.textAlign = "left";
		ctx.drawImage(coinCounterGUI, givenSign.x - 2, givenSign.y + givenSign.coinY - 96, 64, 64);
		if (spacedOut == true && player.gold >= givenSign.cost) {
			player.gold -= givenSign.cost;
			window[givenSign.levelUp + "LevelUp"]();
			spacedOut = false;
		}
		window[givenSign.levelUp + "Sign"].coinY = givenSign.coinY;
	}
}

function background() {
	groundLevel = 358 + groundOffset;
	var ptrn = ctx.createPattern(backgroundImage, 'repeat');
	ctx.fillStyle = ptrn;
	ctx.fillRect(0, 0, myWorld.farthestRight, groundLevel + 64);
	/*
	ctx.fillStyle="#000000";
	ctx.fillRect(0, 0, canvas.width, canvas.height);*/
	drawParallax();
	//tiles
	for(var ii = 0; ii < myWorld.farthestRight; ii += 64) {
		ctx.drawImage(sandTop, ii, groundLevel + 30, 64, 64);
		for(var i = 0; i < 6; i++) {
			ctx.drawImage(sand, ii, groundLevel + 94 + (64 * i), 64, 64);
		}
	}
	//clouds
	for(var ii = 0; ii < activeClouds.length; ii++) {
		activeClouds[ii].x += activeClouds[ii].moveSpeed;
		if (activeClouds[ii].x >= myWorld.farthestRight + 64) {
			activeClouds[ii] = new cloud(-64 - (Math.random() * 1500), Math.random() * 75, Math.random() + 0.1, Math.floor(Math.random() * (128 - 64 + 1)) + 64);
		}
		else {
			ctx.drawImage(cloudImg, activeClouds[ii].x, activeClouds[ii].y, activeClouds[ii].size, activeClouds[ii].size);
		}
	}
}

function cloud(startX, startY, mov, siz, movY) {
	this.x = startX;
	this.y = startY;
	this.moveSpeed = mov;
	this.moveSpeedY = movY || 0;
	this.size = siz;
}

function drawCharacter() {
	if (isWalking) {
		switch(direction) {
			case -1:
				if (player.x >= -14) {
					player.x -= player.speed;
					parallax();
				}
				//animation
				if (player.walkAt <= 10) {
					characterImage = player.stepLeft;
					player.walkAt++;
				}
				else if (player.walkAt <= 20) {
					characterImage = player.unStepLeft;
					player.walkAt++;
				}
				else {
					characterImage = player.stepLeft;
					player.walkAt = 0;
				}
				break;
			case 1:
				if (player.x <= myWorld.farthestRight - 50) {
					player.x += player.speed;
					parallax();
				}
				//animation
				if (player.walkAt <= 10) {
					characterImage = player.stepRight;
					player.walkAt++;
				}
				else if (player.walkAt <= 20) {
					characterImage = player.unStepRight;
					player.walkAt++;
				}
				else {
					characterImage = player.stepRight;
					player.walkAt = 0;
				}
				break;
		}
	}
	ctx.drawImage(characterImage, player.x, player.y, 64, 64);
}

function character(charX, charY, charSpeed) {
	this.x = charX;
	this.y = charY;
	this.speed = charSpeed;
	this.jumping = false;
	this.reachedApex = false;
	this.gold = 50;
	this.goldOffset = 1;
	this.walkAt = 0;
	/** Preload Image **/
	this.stepLeft = new Image;
	this.stepLeft.src = "game/textures/character/characterLeftStep.png";
	this.unStepLeft = new Image;
	this.unStepLeft.src = "game/textures/character/characterLeft.png";
	this.stepRight = new Image;
	this.stepRight.src = "game/textures/character/characterRightStep.png";
	this.unStepRight = new Image;
	this.unStepRight.src = "game/textures/character/characterRight.png";
}

function jump() {
	if (player.jumping == true) {
		if (groundOffset <= 56 && player.reachedApex == false) {
			groundOffset += 8;
		}
		else if (groundOffset == 0 && player.reachedApex == true) {
			player.jumping = false;
			player.reachedApex = false;
			player.gold += player.goldOffset + 1;
		}
		else {
			player.reachedApex = true;
			groundOffset -= 8;
		}
	}
}

function shoot() {
	if (player.gold > 0) {
		player.gold--;
		if (typeof bulletArray == 'undefined') {
			bulletArray = [new bullet()];
		}
		else {
			bulletArray.push(new bullet());
		}
	}
}

function bullet() {
	this.direction = direction;
	if (direction == -1) {
		this.x = player.x;
	}
	else {
		this.x = player.x + 58;
	}
	if (player.walkAt <= 10) {
		this.y = groundLevel + 30;
	}
	else {
		this.y = groundLevel + 32;
	}
}

function paintBullets() {
	if (typeof bulletArray != 'undefined') {
		for (var ii = 0; ii < bulletArray.length; ii++) {
			if (bulletArray[ii].x < myWorld.farthestRight + 10 && bulletArray[ii].x > -20) {
				ctx.beginPath();
				ctx.fillStyle="494949";
				ctx.fillRect(bulletArray[ii].x, bulletArray[ii].y, 8, 4);
				bulletArray[ii].x += bulletArray[ii].direction * 10;
			}
			else {
				bulletArray.splice(ii, 1);
				ii--;
			}
		}
	}
}

//get input
$(document).keydown( function(e)
{
	console.log("keydown: " + e.which);
	if (e.which == 16) {
		player.speed = charSpeed * 2;
	}
});

$(document).keypress( function(e)
{
	console.log("keypress: " + e.which);
	//left
	if (e.which == 97 || e.which == 65) {
		direction = -1;
		isWalking = true;
	}
	//right
	if (e.which == 100 || e.which == 68) {
		direction = 1;
		isWalking = true;
	}
	//up
	if ((e.which == 119 || e.which == 87) && player.jumping == false) {
		player.jumping = true;
	}
	if (e.which == 32) {
		e.preventDefault();
		spacedOut = true;
	}
});

$(document).keyup( function(e)
{
	console.log("keyup: " + e.which);
	//left
	if (e.which == 65 && direction == -1) {
		isWalking = false;
	}
	//right
	if (e.which == 68 && direction == 1) {
		isWalking = false;
	}
	if (e.which == 32) {
		spacedOut = false;
	}
	if (e.which == 83) {
		shoot();
	}
	if (e.which == 16) {
		player.speed = charSpeed;
	}
	//tilda cheats
	if (e.which == 192) {
		player.gold += 10000000000;
	}
});

//images
//background
backgroundImage.src = "game/textures/sky.png";
sand.src = "game/textures/sand.png";
sandTop.src = "game/textures/sandTop.png";
cloudImg.src = "game/textures/cloud.png";
//gui
coinCounterGUI.src = "game/textures/coin.png";
//signs
signImage.src = "game/textures/forSaleSign.png";
star.src = "game/textures/star.png";
//parallax
sandDunes1.src = "game/textures/sandDunes1.png";
sandDunes2.src = "game/textures/sandDunes2.png";
//generator animation
var g1 = new Image;
g1.src = "game/textures/generatorT1_phase1.png";
var g2 = new Image;
g2.src = "game/textures/generatorT1_phase2.png";
var g3 = new Image;
g3.src = "game/textures/generatorT1_phase3.png";
var g4 = new Image;
g4.src = "game/textures/generatorT1_phase4.png";
var g5 = new Image;
g5.src = "game/textures/generatorT1_phase5.png";
var g6 = new Image;
g6.src = "game/textures/generatorT1_phase6.png";
var g7 = new Image;
g7.src = "game/textures/generatorT1_phase7.png";
var g8 = new Image;
g8.src = "game/textures/generatorT1_phase8.png";
//props
fenceProp.src = "game/textures/fence.png";
pylonProp.src = "game/textures/pylon_T1.png";

init();
draw();