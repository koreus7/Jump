
var PlayButton = me.GUI_Object.extend({
	
	init:function(x, y)
	{
		settings = {};
		settings.image = "gui";

		settings.spritewidth = 128;
		settings.spriteheight = 32;

		this.text = "Play";

        this.font = new me.Font('arial bold', 20, '#fff', 'middle');
		// parent constructor
		this.parent(x, y, settings);
 	},
 	update:function()
 	{
 		this.parent();
 		return true;
 	},

	onClick:function()
	{
		// don't propagate the event
		me.state.change(me.state.PLAY);
		return true;
	},

	draw: function(context) 
	{
		this.parent(context);
		this.font.draw(context, this.text , this.pos.x + this.width/3, this.pos.y + 16);
    }

});

var Label = Object.extend({
	init:function(text,x,y)
	{
		this.text = text;
		this.pos = {};
		this.pos.x = x;
		this.pos.y = y;
		this.font = new me.Font('arial bold', 50, '#0000', 'middle');
	},

	draw:function(context)
	{
		this.font.draw(context,this.text,this.pos.x,this.pos.y);
	}

})

var SlidingSelect = Object.extend({
	init: function(things,x,y,options)
	{
		//the things to slide between
		this.things = things
		this.pos = {}
		this.pos.x = x;
		this.pos.y = y;
		this.width  = options.width;
		this.height = options.height;
		this.objectWidth = options.objectWidth;
		this.indexOfSelected = 0;
	},
	update: function()
	{

	},
	draw: function(context)
	{
		var min = -this.objectWidth*this.things.length/2;
		for(var index = 0; index < this.things.length; index++)
		{
			this.things[index].pos.y = this.pos.y;
			this.things[index].pos.x = this.pos.x + index*this.objectWidth + min;
			this.things[index].draw(context);
		}
	}

})

LabelSelect = SlidingSelect.extend({
	init: function(things,x,y,options)
	{
		this.parent(things,x,y,options)
		this.indexOfSelected = Math.round(this.things.length/2);
		this.font = options.font;
		this.selectedFont = options.selectedFont;
		this.offsetx = 0;
		this.padding = 40;

	},
	update: function()
	{
		if(me.input.isKeyPressed("left"))
		{
			//me.state.change(me.state.PLAY);
			if(this.indexOfSelected -1 >= 0)
			{
				me.audio.play("click",false,null,0.2);
				TweenLite.to(this,0.2,{offsetx:this.offsetx + this.objectWidth})
				this.indexOfSelected -=1;
			}
		}
		else if(me.input.isKeyPressed("right"))
		{
			if(this.indexOfSelected +1 < this.things.length)
			{
				me.audio.play("click",false,null,0.2);
				TweenLite.to(this,0.2,{offsetx:this.offsetx - this.objectWidth})
				this.indexOfSelected +=1;
			}
			
		}
		if(me.input.isKeyPressed("enter"))
		{
		    me.audio.play("select", false, null, 1);
			TweenLite.to(this.pos,0.9,{x: -500});
      		currentLevel = this.things[this.indexOfSelected].text;
			me.state.change(me.state.PLAY);
		}
	},

	draw: function(context)
	{
		/*var min = -this.objectWidth*this.things.length/2 + this.offsetx;
		for(var index = 0; index < this.things.length; index++)
		{
			this.things[index].pos.y = this.pos.y;
			this.things[index].pos.x = this.pos.x + index*this.objectWidth + min;

			if(index == this.indexOfSelected)
			{
				this.things[index].font = this.selectedFont;
			}
			else
			{
				this.things[index].font = this.font;
			}
			this.things[index].draw(context)
		}*/
		var xpos = this.offsetx;
		for(var index = 0; index < this.things.length; index++)
		{
			xpos -= this.font.measureText(context,this.things[index].text).width;

		}
		xpos += this.things.length* this.padding;

		for(var index = 0; index < this.things.length; index++)
		{
			this.things[index].pos.y = this.pos.y;
			this.things[index].pos.x = this.pos.x + xpos;

			this.things[index]
			xpos+= this.font.measureText(context,this.things[index].text).width + this.padding;

			if(index == this.indexOfSelected)
			{
				this.things[index].font = this.selectedFont;
			}
			else
			{
				this.things[index].font = this.font;
			}
			
			this.things[index].draw(context);
		}
	}
});

var LevelSelect = me.ScreenObject.extend({
	init: function()
 	{
 		this.parent(true);
 		this.background = me.loader.getImage("mainMenuBackground");
 		this.levels = levels;
 		

	},
	onResetEvent: function()
	{
		labels = new Array()

 		for(var index = 0; index < this.levels.length; index++)
 		{
 			labels[index] = new Label(this.levels[index].name);
 		}
 		selector = new LabelSelect	(		
 										labels,
 										-1000,
 										me.game.viewport.height/2,
 										{
 											width:1000,
 											height:1000,
 											objectWidth:200,
 											font:  new me.Font('arial bold', 50, '#222', 'middle'),
 											selectedFont: new me.Font('arial bold', 50, '#ff9702', 'middle')
 										}
 									)
 		me.game.sort();
 		TweenLite.to(selector.pos,1.5,{x: me.game.viewport.width/2, ease:Power2.easeInOut });
 		this.backgroundy = 400;
 		TweenLite.to(this,1,{backgroundy : 0, ease:Power2.easeInOut});
		//TweenLite.to(selector.font.color,1.5,{"#"});
		me.input.bindKey(  me.input.KEY.LEFT,      "left" , true );
  		me.input.bindKey(  me.input.KEY.RIGHT,     "right" , true);

  		me.input.bindKey(  me.input.KEY.A,      "left" , true);
  		me.input.bindKey(  me.input.KEY.D,     "right" , true);
		//this.parent(true);
	},
	update: function()
	{
		selector.update();
		this.draw(me.video.getScreenContext());
	},
	draw: function(context)
	{
		me.video.clearSurface (context, "white");
		context.drawImage(this.background,0,this.backgroundy , me.game.viewport.width,me.game.viewport.height);
		selector.draw(context);
	},
	onDestroyEvent: function()
	{
		TweenLite.to(this,0.2,{backgroundy: 500})
	    me.input.bindKey(  me.input.KEY.LEFT,      "left" );
  		me.input.bindKey(  me.input.KEY.RIGHT,     "right");

  		me.input.bindKey(  me.input.KEY.A,      "left");
  		me.input.bindKey(  me.input.KEY.D,     "right");

	}
})