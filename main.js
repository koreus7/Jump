

// game resources
var g_resources = [
	//Tile Images
	{name: "area01_level_tiles" , type: "image" , src: "data/area01_tileset/area01_level_tiles.png"},
	//Player sprites
	{name: "gripe_run_right" , type: "image" , src: "data/sprite/gripe_run_right.png"},
	//entity sprites
	{name: "ents64" , type: "image" , src: "data/sprite/ents64.png"},
	
	{name: "ents32" , type: "image" , src: "data/sprite/ents32.png"},
	
	{name: "ents16" , type: "image" , src: "data/sprite/ents16.png"},
	//Paralax Background 1
	{name: "area01_bkg0" , type: "image" , src: "data/area01_parallax/area01_bkg0.png"},	

	//Paralax Background 2
	{name: "area01_bkg1" , type: "image" , src: "data/area01_parallax/area01_bkg1.png"},
	
	{name: "mainMenuBackground" , type: "image" , src: "data/GUI/mainMenuBackground.png"},
	// game font
	{name: "32x32_font" , type: "image" , src: "data/sprite/32x32_font.png"},
	//GUI
	{name: "gui" , type: "image" , src:  "data/GUI/gui.png"},
	
	//Audio.
	{name: "jump",			type: "audio" , src: "data/audio/", channel: 1},
	
	{name: "powerup", 		type: "audio" , src: "data/audio/",	channel: 1},
	
	{name: "explosion",		type: "audio" , src: "data/audio/",	channel: 1},
	
	{name: "fire1", 		type: "audio" , src: "data/audio/", channel: 4},
	
	{name: "fire2", 		type: "audio" , src: "data/audio/", channel: 4},
	
	{name: "fire3", 		type: "audio" , src: "data/audio/", channel: 2},
	
	{name: "footsteps", 	type: "audio" , src: "data/audio/", channel: 1},
	
	{name: "rocketboots", 	type: "audio" , src: "data/audio/", channel: 1},

	{ name: "click", type: "audio", src: "data/audio/", channel: 4 },

    { name: "select", type: "audio", src: "data/audio/", channel: 3 }
];

var jsApp	= 
{	
	/* ---
	
		Initialize the jsApp
		
		---			*/

	onload: function()
	{

	    this.width  = 940;
	    this.height = 680;
	    me.sys.preRender = false

		if (!me.video.init('jsapp', this.width, this.height, false, 1))
		{
			alert("Sorry but your browser does not support html 5 canvas.");
         	return;
		}

		// initialize the "audio"
		me.audio.init("mp3,ogg");
		
		// set all resources to be loaded
		me.loader.onload = this.loaded.bind(this);
		
		// set all resources to be loaded
		me.loadingScreen = new CustomLoadingScreen();

		//Add the levels to the resource list
		g_resources = g_resources.concat(levels)
		g_resources.push()
		
		me.loader.preload(g_resources);

		// load everything & display a loading screen
		me.state.change(me.state.LOADING);
		me.debug.renderHitBox = true;
	},
	
	
	/* ---
	
		callback when everything is loaded
		
		---										*/
	loaded: function ()
	{
		// set the "Play/Ingame" Screen Object
		me.state.set(me.state.PLAY, new PlayScreen);
		me.state.set(me.state.LEVELSELECT, new LevelSelect);
		me.state.transition("fade", "#FFFFFF", 250);
      	
      	me.entityPool.add("mainPlayer",PlayerEntity);
      	me.entityPool.add("crate",CrateEntity);
      	me.entityPool.add("drone",DroneEntity);
		me.entityPool.add("deathZone",DeathZone);
		me.entityPool.add("spawner",EnemySpawner);

      	me.input.bindKey(  me.input.KEY.UP,     	"up");
      	me.input.bindKey(  me.input.KEY.W,     	"up");


      	me.input.bindKey(  me.input.KEY.X,         	"jump", true);
		me.input.bindKey(  me.input.KEY.W,         	"jump", true);

      	me.input.bindKey(  me.input.KEY.Z,         	"dash");
      	me.input.bindKey(  me.input.KEY.Q,         	"dash");
      	
      	me.input.bindKey(  me.input.KEY.E,         	"fire", true);
      	me.input.bindKey(  me.input.KEY.C,         	"fire", true);
                                                 
      	me.input.bindKey(me.input.KEY.ENTER, "enter", true);
      	me.input.bindKey(me.input.KEY.U, "mouse1");
      	me.input.bindKey(  me.input.KEY.P,     		"altenter");
      	me.input.bindKey(  me.input.KEY.CTRL,     	"modifier");
      	
      	me.input.bindKey(  me.input.KEY.ESC,     	"escape", true);
      	me.input.bindKey(  me.input.KEY.ESCAPE,     "escape", true);

		me.input.bindMouse(me.input.mouse.LEFT, me.input.KEY.U);
		me.input.bindMouse(me.input.mouse.RIGHT, me.input.KEY.P);

      	// start the game 
		me.state.change(me.state.LEVELSELECT);

	}

}; // jsApp

/* the in game stuff*/
var PlayScreen = me.ScreenObject.extend(
{

   onResetEvent: function()
   {
		// stuff to reset on state change
		if(currentLevel != null)
		{
			me.levelDirector.loadLevel(currentLevel);
		}
		else
		{
			me.levelDirector.loadLevel("area01");
		}
		// add a default HUD to the game mngr
		me.game.addHUD(0, 0, me.game.viewport.width,  me.game.viewport.height);

		// add a new HUD item
		me.game.HUD.addItem("debug", new InGameDebug(10,25));

		// make sure everyhting is in the right order
		me.game.sort();

		//me.audio.init("mp3,ogg");
		me.audio.setVolume(0.8);
	},
	/* ---
	
		 action to perform when game is finished (state change)
		
		---	*/
	onDestroyEvent: function()
	{
		 me.game.disableHUD();
	}

});


// create a custom loading screen
var CustomLoadingScreen = me.ScreenObject.extend(
{
   // constructor
   init: function()
   {
      // pass true to the parent constructor
      // as we draw our progress bar in the draw function
      this.parent(true);
      // a font logo
      this.logo = new me.Font('century gothic', 32, 'white');
      // flag to know if we need to refresh the display
      this.invalidate = false;
      // load progress in percent
      this.loadPercent = 0;
      // setup a callback
      me.loader.onProgress = this.onProgressUpdate.bind(this);

   },

   // will be fired by the loader each time a resource is loaded
   onProgressUpdate: function(progress)
   {
      this.loadPercent = progress;
      this.invalidate = true;
   },


   // make sure the screen is only refreshed on load progress
   update: function()
   {
      if (this.invalidate===true)
      {
         // clear the flag
         this.invalidate = false;
         // and return true
         return true;
      }
      // else return false
      return false;
   },

   // on destroy event
   onDestroyEvent : function ()
   {
      // "nullify" all fonts
      this.logo = null;
   },

   //	draw function
   draw : function(context)
   {
      // clear the screen
      me.video.clearSurface (context, "black");

      // measure the logo size
      logo_width = this.logo.measureText(context,"awesome loading screen").width;

      // draw our text somewhere in the middle
      this.logo.draw(context,
                     "awesome loading screen",
                     ((me.video.getWidth() - logo_width) / 2),
                     (me.video.getHeight() + 60) / 2);

      // display a progressive loading bar
      var width = Math.floor(this.loadPercent * me.video.getWidth());

      // draw the progress bar
      context.strokeStyle = "silver";
      context.strokeRect(0, (me.video.getHeight() / 2) + 40, me.video.getWidth(), 6);
      context.fillStyle = "#89b002";
      context.fillRect(2, (me.video.getHeight() / 2) + 42, width-4, 2);
   },
});



//bootstrap :)
window.onReady(function ()
{
	jsApp.onload();
});