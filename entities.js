var Block = Object.extend({
	init : function(id,breakable)
	{
		this.id = id;
		this.breakable = breakable;
	}

})

var collisionBlocks = {breakable : 6, solid: 1}

var blocks = {"dirt": new Block(32,true)}

var HealthBar = me.ObjectEntity.extend({
	init : function(x,y,value, maximum, optional)
	{
		this.padding = 10;

		this.value = value;
		this.maximum = maximum;

		optional.image = "ents32"
		optional.spritewidth = 32;
		optional.spiteheight = 32;

		this.parent(x,y,optional);
		
		this.addAnimation("idle",[25]);
		this.setCurrentAnimation("idle");

		if(optional.colour)
		{
			this.colour = optional.colour;
		}
		else
		{
			this.colour = "#00BF32"
		}

		if(optional.backcolour)
		{
			this.backcolour = optional.backcolour;
		}
		else
		{
			this.backcolour = "#FF1E00"
		}

		if(optional.width)
		{
			this.width = optional.width;
		}
		else
		{
			this.width = 200;
		}

		if(optional.height)
		{
			this.height = optional.height;
		}
		else
		{
			this.height = 20;
		}

		if(optional.paddingColour)
		{
			this.paddingColour = optional.paddingColour;
			if(optional.padding)
			{
				this.padding = optional.padding;
			}
		}


	},
	setData: function(value, optional)
	{
		this.value = value;
		
		if (optional.maximum)
		{
			this.maximum = optional.maximum;
		}

	},

	draw : function (context,rect)
	{
		this.parent(context,rect);
		var percentage = (this.value/this.maximum);

		var width = Math.floor(percentage * this.width);
		
		// draw bar
      	if(this.paddingColour != undefined)
      	{
      		context.fillStyle = this.paddingColour;
      		context.fillRect(this.x - this.padding, this.y - this.padding, this.width + 2*this.padding, this.height+ 2*this.padding);
      	}
      	context.fillStyle = this.backcolour;
      	context.fillRect(this.pos.x ,this.pos.y ,this.width,this.height);
      	
      	context.fillStyle = this.colour;
     	context.fillRect(this.pos.x, this.pos.y, width, this.height);

	}
})

var PlayerEntity = me.ObjectEntity.extend({
	init: function(x, y, settings)
	{
		settings.image = "gripe_run_right";

        settings.spritewidth  = 64;
        settings.spriteheight = 64;
        
		this.parent(x,y,settings);
		
		this.addAnimation ("walk", 
							[0,1,2,3,1,2,3]);
		
		this.addAnimation ("dash", 
							[4,5,6],10);
        
        this.addAnimation ("jump", 
        					[17,18,19,19,19]);
        this.addAnimation("doubleJump",
        					[20,20]);
        
        this.addAnimation ("climb", 
        					[24,25,26,27]);

        this.addAnimation ("hangon", 
        					[24]);

		this.addAnimation ("fall", 
        					[19,19,19,19,18,18,19,19]);
		this.addAnimation( "die",
							[19]);

		this.addAnimation ("idle", 
							[0,0]);
		
		this.runSpeed          = 	3;
		this.canFly            = 	false;
		this.canMove		   =	true;
		this.lastWalkingLeft   = 	false;
		this.lastWalkingRight  = 	false;
		this.walkingLeft       = 	false;
		this.walkingRight      = 	false;
		this.hasDoubleJump     = 	false;

		this.setVelocity(3,15);
		this.updateColRect(14,25,10,50);

		this.collidable        = 	true;
		this.lastPos           = 	this.pos;
		this.rightCollision    = 	false;
		this.leftCollision     = 	false;
		this.topCollision	   =	false;
		this.facingLeft        = 	true;
		this.lastFalling	   = 	false;
		this.notWalkingTime    = 	0;

		this.maxHealth		   =	100;
		this.health 		   =	100;
		this.healthBar         =    new HealthBar(this.pos.x,this.pos.y,this.health,this.maxHealth,{paddingColour: "silver"});
		me.game.add(this.healthBar,this.z);

		this.deathActionStarted= 	false; //have we died and reacted to that
		
		//this.maxVel.y		   =    14.5;
		this.maxVel.y		   =    17;

		this.elapsedTime	= me.timer.getTime();
		this.lastTime		= me.timer.getTime();
		
		this.gunCooldown	   =	700;
		this.gunCooldownTimer  =	0;
		this.type = "player";
		me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH)

		this.reachDistance = 170;
		this.amountBlocks = {"dirt" : 30};
		this.currentBlock = "dirt";
	},

	restartDamage: function()
	{
		this.canMove = true;
		this.canTakeDamage = true;

	},
	takeDamage: function(damageValue)
	{
		this.forceJump();
		this.cantakedamage = false;
		this.canMove = false;
		this.flicker(10,function(){this.restartDamage()});
		this.health -=damageValue;
	},

	draw : function(context,rect)
	{
		this.parent(context,rect);
		this.healthBar.draw(context,rect);

	},

	handleBlocks: function()
	{
		if (me.input.isKeyPressed("mouse1") && this.amountBlocks[this.currentBlock] != 0 && !me.input.isKeyPressed("modifier"))
		{
			var mouseworldx = me.input.mouse.pos.x + me.game.viewport.pos.x
			var mouseworldy = me.input.mouse.pos.y + me.game.viewport.pos.y
			var mousepos = {x:mouseworldx ,y:mouseworldy} 
			var mouseloc = {pos:mousepos}
			if (util.distance(this,mouseloc) < this.reachDistance)
			{
				var layer = me.game.currentLevel.getLayerByName("foreground");
				var tile = layer.getTile(mouseworldx,mouseworldy);


				if(tile == undefined )
				{
					layer.setTile(~~(mouseworldx / layer.tilewidth),~~(mouseworldy / layer.tilewidth),blocks[this.currentBlock].id);
					var layer = me.game.currentLevel.getLayerByName("collision");
					{
						var tile = layer.getTile(mouseworldx,mouseworldy);	
						layer.setTile(~~(mouseworldx / layer.tilewidth),~~(mouseworldy / layer.tilewidth),blocks[this.currentBlock].breakable ? 6 : 1);
					}
					this.amountBlocks[this.currentBlock] -=1
				}
				me.game.sort();
			}			

			
		}
		else if (me.input.isKeyPressed("mouse1") && me.input.isKeyPressed("modifier"))
		{
			var mouseworldx = me.input.mouse.pos.x + me.game.viewport.pos.x
			var mouseworldy = me.input.mouse.pos.y + me.game.viewport.pos.y

			var mousepos = {x:mouseworldx ,y:mouseworldy} 
			var mouseloc = {pos:mousepos}

			if (util.distance(this,mouseloc) < this.reachDistance)
			{
				var layer = me.game.currentLevel.getLayerByName("collision");
				var tile = layer.getTile(mouseworldx,mouseworldy);
				if(tile != undefined && tile.tileId == 6)
				{
					layer.clearTile(~~(mouseworldx / layer.tilewidth),~~(mouseworldy / layer.tilewidth))
				
					var layer = me.game.currentLevel.getLayerByName("foreground");
					var tile = layer.getTile(mouseworldx,mouseworldy);

					if(tile != undefined)
					{
						layer.clearTile(~~(mouseworldx / layer.tilewidth),~~(mouseworldy / layer.tilewidth))
					}

				}
			}
		}

	},


	update: function()
	{
		//Not the best place for this but it works for now
		if(me.input.isKeyPressed("escape"))
		{
			me.state.change(me.state.LEVELSELECT);
		}

		this.lastTime = this.elapsedTime;
		this.elapsedTime = me.timer.getTime();
		
		this.gunCooldownTimer += this.elapsedTime - this.lastTime;
		
		this.handleBlocks();

		this.healthBar.pos.x = me.game.viewport.pos.x;
		this.healthBar.pos.y = me.game.viewport.pos.y;
		this.healthBar.setData(this.health,{maximum: this.maxHealth});

		if(me.input.isKeyPressed("left") && this.canMove)
		{
			this.facingLeft = true;
			if(!this.rightCollision)
			{
				if (this.dashing)
				{				
					this.vel.x    -= this.accel.x *me.timer.tick;
					this.maxVel.x =  2*this.runSpeed;
					if(!this.falling)
					{
						this.setCurrentAnimation("dash");
					}

				}
				else
				{
					this.vel.x    -= this.accel.x *me.timer.tick;
					this.maxVel.x =  this.runSpeed;
					if(!this.falling && !this.jumping)
					{
						this.setCurrentAnimation("walk");
					}

				}
				this.notWalkingTime = 0;
				this.walkingLeft = true;
				this.walking = true;
			}
			this.flipX(true);

			
			
		}
		else if (me.input.isKeyPressed("right") && this.canMove)
		{
			this.facingLeft = false;
			if(!this.leftCollision)
			{
				if (this.dashing)
				{
					this.vel.x    += this.accel.x *me.timer.tick;
					this.maxVel.x =  2*this.runSpeed;
					
					if(!this.falling)
					{
						this.setCurrentAnimation("dash");
					}
				}
				else
				{
					this.vel.x    += this.accel.x *me.timer.tick;
					this.maxVel.x =  this.runSpeed;
					
					if(!this.falling && !this.jumping)
					{
						this.setCurrentAnimation("walk");
					}

				}
				this.notWalkingTime = 0;

				this.walking      = 	true;
				this.walkingRight = 	true;
			}
			this.flipX(false);
		}
		else
		{
			this.notWalkingTime +=me.timer.tick;
			this.dashing      = 	false;
			this.walking      = 	false;
			this.vel.x        = 	0;
		}
		
		if(me.input.isKeyPressed("jump") && this.canMove)
		{
			if(((this.jumping || this.falling) && hasDoubleJump) || this.canFly)
			{

				me.audio.play("rocketboots",false,null,0.05);
				this.setCurrentAnimation("doubleJump")
				this.maxVel.y		   =    17;
				this.forceJump();
				hasDoubleJump   = 	false;
			}
			else if(!this.jumping && !this.falling)
			{
				me.audio.play("jump",false,null,0.2);
				hasDoubleJump   = 	true;

				this.setCurrentAnimation("jump","idle")

				this.vel.y      = 	-this.maxVel.y *me.timer.tick;
				this.jumping    = 	true;

			}
		}
		if(this.falling)
		{
			this.maxVel.y		   =    10;
		}
		else
		{
			this.maxVel.y		   =    17;

		}
		if(!this.jumping && !this.walking)
		{
			this.setCurrentAnimation("idle");
		}

		if(me.input.isKeyPressed("fire") && this.gunCooldownTimer > this.gunCooldown)
		{
			this.gunCooldownTimer = 0;

			clip = "fire" + util.randint(1,3).toString();
			me.audio.play(clip,false,null,0.3);
			if(this.facingLeft)
			{
				_velx = -10;
			}
			else
			{
				_velx = 10;
			}
			var bullet = new ProjectileEntity(this.pos.x + this.width/2, this.pos.y+10,{velx: _velx, vely:1, image :"projectile", damage: 32});
			me.game.add(bullet, this.z);
			me.game.sort();
		}
		this.lastPos = this.pos;
		var res = me.game.collide(this);
		if(res != null)
		{
			/*
			if(res.obj.type == "c") //if it is a crate collider
			{
				box_centerx = res.obj.pos.x + res.obj.width/2;
				box_centery = res.obj.pos.y + res.obj.height/2;

				this.rightCollision	 =  false;
				this.leftCollision	 =  false;


				//Check for top collsion
				if(this.pos.y + this.height > res.obj.pos.y )
				{
					//now resolve
					//this.topCollision = true;
					if(this.falling)
					{
						this.vel.y = -(this.pos.y + this.height) + res.obj.pos.y;
					}
				}

				//Check Left collision

				if(this.pos.x + this.width < box_centerx)
				{
					//this.leftCollision = true;
					//now resolve
					this.pos.x -=  (this.pos.x + this.width) - res.obj.pos.x;
					if(this.walkingRight)
					{
						this.vel.x =  -(this.pos.x + this.width) + res.obj.pos.x;
					}
				}

				//right collision
				if(this.pos.x > box_centerx && !this.topCollision)
				{
					//this.rightCollision = true;
					this.pos.x += (res.obj.pos.x + res.obj.width) - this.pos.x;
					this.vel.x =  0;
				}
			}
			*/

		}
		this.lastPos = this.pos;
		col = this.updateMovement();

		if(col.yprop.type == "death")
		{
			this.takeDamage(10000);
		}
		
		var deltaX = this.pos.x - this.lastPos.x;
		if(col.x != 0 || this.vel.x == 0 || -1<deltaX<1 )
		{
			this.dashing = false;
			if (!this.falling && !this.jumping && !this.dashing)
			{
				me.audio.pause("rocketboots");	
			}
		}
		
		/*if (this.notWalkingTime > 2 && this.notWalkingTime < 6 && this.walkingLeft == this.lastWalkingLeft)
		{
			this.dashing = true;
		} */
		if(me.input.isKeyPressed("dash"))
		{
			this.dashing = true;
		}


		if(this.isCurrentAnimation("dash"))
		{
			me.game.HUD.setItemValue("debug", "DASH");
		}
		else
		{
			me.game.HUD.setItemValue("debug", "WALK");	
		}

		//walking sounds
		if(this.walking && !this.falling)
		{
			if(!this.wasWalking  || this.lastFalling || (this.lastWalkingLeft && this.walkingRight)  || (this.lastWalkingRight && this.walkingLeft))
			{
				if(this.dashing)
				{
					me.audio.play("rocketboots",true,null,0.05);
					me.audio.pause("footsteps");

				}
				else if (!this.jumping)
				{
					me.audio.play("footsteps",true,null,0.05);
					me.audio.pause("rocketboots");
				}
			}
		}
		else
		{
			me.audio.pause("footsteps");
			if(this.hasDoubleJump && !this.dashing)
			{
				me.audio.pause("rocketboots");
			}
		}

		if(this.falling)
		{
			this.setCurrentAnimation("fall")
			me.audio.pause("rocketboots");
		}

		if(me.input.isKeyPressed("up"))
		{
			if (this.doClimb(true))
			{
				this.setCurrentAnimation("climb");
			}
		}
		else if(this.onLadder)
		{
			this.setCurrentAnimation("hangon");
		}

		this.wasWalking 		=	this.walking;
		this.lastWalkingLeft  	= 	this.walkingLeft;
		this.lastWalkingRight 	= 	this.walkingRight;
		this.walkingLeft      	= 	false;
		this.walkingRight     	= 	false;
		this.lastFalling		= 	this.falling;

		if(this.health <= 0 && !this.deathActionStarted)
		{
			var explosion = new ExplosionEntity(this.pos.x + this.width/2 , this.pos.y+this.height/2 ,{spritewidth: 64, callback: function(){me.levelDirector.loadLevel(me.levelDirector.getCurrentLevelId())}});
			me.game.add(explosion, this.z);
			me.game.sort();
			this.deathActionStarted = true;
			this.setCurrentAnimation("die");
		}
		if(this.vel.x != 0 || this.vel.y != 0)
		{
			this.parent();
			return true;
		}

		
		return false;
	},
}
)

var CrateEntity = me.ObjectEntity.extend({
	init: function(x, y, settings)
	{
		settings.spritewidth  = 32;
		settings.spriteheight = 32;

		settings.image = "ents32";
		
		this.parent(x,y,settings);

		this.setMaxVelocity(1000, 1000);
		this.setVelocity(3,15);
		this.setFriction(0.05,0);

		this.addAnimation ("idle",
							[0]);

		this.addAnimation ("explode",
							[5,6,7],1);

		this.setCurrentAnimation("idle");
		this.collidable	=	true;
		this.touchId   	=	null;    
		this.canMove   	=	true;    
		this.type      	=	"c";
		this.selected  	=	false;

		me.input.registerMouseEvent("mousemove", this.collisionBox, this.mouseMove.bind(this), false);
	},
	mouseMove: function()
	{
		if (me.input.isKeyPressed("mouse1"))
		{
			this.selected = true;
		}
		else
		{
			this.selected = false;
		}

	},

	takeDamage: function(damageValue)
	{
		this.setCurrentAnimation("explode", function(){me.game.remove(this)});
		me.audio.play("cratebreak",false,null, 0.5)
	},

	update: function()
	{

		if (me.input.isKeyPressed("mouse1") && this.selected)
		{
			var velx = (me.input.mouse.pos.x + me.game.viewport.pos.x) - (this.pos.x + this.width/2);
			var velx = (me.input.mouse.pos.y + me.game.viewport.pos.y) - (this.pos.y + this.height/2);
			
			this.vel.x = velx*me.timer.tick;
			this.vel.y = vely*me.timer.tick;
		}

		this.updateMovement();

		this.parent();
		return true;
	}
})

var ProjectileEntity = me.ObjectEntity.extend({
	init: function(x, y,settings)
	{
		settings.spritewidth = 16;
        settings.spriteheight = 16;
		
		settings.image = "ents16";
		this.parent(x,y,settings);
		this.damage = settings.damage;
		//get actual positive/negative values of vel
		this.actVelx = settings.velx;
		this.actVely = settings.vely;

		//foce the x positive for the engine
		if(settings.hurtsEnemy != undefined)
		{
			this.hurtsEnemy = settings.hurtsEnemy;
		}
		else
		{
			this.hurtsEnemy = true;
		}

		if(settings.velx < 0)
		{
			settings.velx = - settings.velx;
		}
		
		this.setVelocity(settings.velx,settings.vely);
		this.setFriction(0.05,0);

		this.maxCollisions = 0;
		this.timesCollided  = 0;

		this.addAnimation ("fire",
							[0,1]);
		this.addAnimation ("fly",
							[1,2,3]);

		this.setCurrentAnimation("fire");

		this.collidable = true;

		this.area = 2;

		this.canBreakTile = true;

		this.type = "p";	


		this.startTime = me.timer.getTime();
		this.elapsedTime = 0;
		this.changedAnimation = false;
	},
	update: function()
	{
		this.elapsedTime = me.timer.getTime() - this.startTime;
		
		if (this.elapsedTime <40 && this.changedAnimation == false)
		{
			this.changedAnimation = true;
			this.setCurrentAnimation("fly");
		}

		if(this.actVelx > 0)
		{
			this.vel.x += this.accel.x *me.timer.tick;
		}
		else
		{
			this.vel.x -= this.accel.x *me.timer.tick;
		}

		this.vel.y += this.accel.x*me.timer.tick;
		//this.vel.x += this.accel.x* (this.actVelx > 0 )? me.timer.tick : -me.timer.tick;
		//this.vel.y += this.accel.x*me.timer.tick;

		var col = this.updateMovement();
		if(col.x!=0 || col.y != 0)
		{
			if (this.timesCollided < this.maxCollisions)
			{
				this.timesCollided += 1
				this.actVelx       =  -this.actVelx;
			}
			else 
			{
				var explosion = new ExplosionEntity(this.pos.x + this.width/2 - 32, this.pos.y+this.height/2 -32,{spritewidth: 64});
				me.game.add(explosion, this.z);
				me.game.sort();
				me.game.remove(this);
			}
		}

		var res = me.game.collide(this);

		if(res !=null)
		{
			if(res.obj.type != "player" && res.obj.type != "explosion" && !(!this.hurtsEnemy && res.obj.type == "enemy"))
			{
				res.obj.takeDamage(32);
				var explosion = new ExplosionEntity(this.pos.x + this.width/2 -32, this.pos.y+this.height/2 -32,{spritewidth: 64});
				me.game.add(explosion, this.z);
				me.game.sort();
				me.game.remove(this);
			}
		}

		if(this.vel.x != 0 || this.vel.y != 0)
		{
			this.parent();
			return true;
		}
		return false;
	}
})

var ExplosionEntity = me.ObjectEntity.extend({

		init : function(x,y,settings )
		{
			if(settings.spritewidth == 32)
			{
				settings.image = "ents32";
			}
			else if(settings.spritewidth == 64)
			{
				settings.image = "ents64"
			}
			this.parent(x,y,settings);

			if(settings.spritewidth == 64)
			{
				this.addAnimation ("explode",
						[0,1,2,3],1);
			}
			else if(settings.spritewidth == 32)
			{
				this.addAnimation("explode",
						[1,2,3,4],1);
			}

			if(settings.callback != null)
			{
				this.setCurrentAnimation("explode", function(){this.externalCallback()});
				this.callback = settings.callback;
			}
			else
			{
				this.setCurrentAnimation("explode", function(){me.game.remove(this)});
			}
			this.setMaxVelocity(0,0)
			this.collidable = true;

			this.canBreakTile = true;
			this.type = "explosion";

			me.audio.play("explosion",false,null, 0.1)

		},
		externalCallback: function()
		{
			this.callback();
			me.game.remove(this);
		},

		update : function()
		{
			me.game.collide(this);
			this.updateMovement();
			this.parent();
			return true
		}

})

var DroneEntity= me.ObjectEntity.extend({
	
	init : function(x,y,settings)
	{
		settings.image 			 = "ents32";
		settings.spritewidth	 = 32;
		settings.spriteheight	 = 32;

		this.parent(x,y,settings)


		this.target = me.game.getEntityByName("mainplayer")[0];

		this.setMaxVelocity(1000, 1000);
		this.setVelocity(3,15);
		
		this.maxVel.x = 1 + Math.random()*1.2
		
		this.addAnimation ("movesideways", 
					[9,10,11]);

		this.addAnimation ("idle", 
					[8]);
		
		this.setCurrentAnimation("idle");

		this.collidable= true;

		this.moveRight = false;

		this.health = 20;
		this.dontMove = false;
		this.range = 512;
		this.type = "enemy";
		
		if(settings.faceright == true)
		{
			this.moveRight = true;
		}
	},

	takeDamage : function(damageValue)
	{
		this.health -=damageValue;
	},
	movement : function()
	{
		var res = me.game.collide(this);
		if(res != null)
		{
			if (res.obj.type =="player")
			{
				res.obj.takeDamage(16);
			}
		}		

		if(this.moveRight && !this.dontMove)
		{
			this.vel.x    += this.accel.x *me.timer.tick;
			
			if(!this.falling && !this.jumping)
			{
				this.setCurrentAnimation("movesideways");
			}
			this.flipX(false);
		}
		else if(!this.dontMove)
		{
			this.vel.x    -= this.accel.x *me.timer.tick;
			
			if(!this.falling && !this.jumping)
			{
				this.setCurrentAnimation("movesideways");
			}
			this.flipX(true);
		}
		else
		{
			this.setCurrentAnimation("idle");
		}
	},
	collision : function()
	{
		col = this.updateMovement();
		
		//if collising with wall then jump
		if(col.x != 0)
		{
			//this.vel.y      = 	-this.maxVel.y *me.timer.tick;
			if(col.xprop.type == "breakable")
			{
				this.health -= 20;
				var bullet = new ProjectileEntity(this.pos.x, this.pos.y,{velx: this.moveRight ? 10:-10, vely:1, image :"projectile", damage: 12});
				me.game.add(bullet, this.z);
				

				/*var  corpse= new DroneCorpseEntity(this.pos.x, this.pos.y,{velx:20,vely:-10});
				me.game.add(corpse, this.z);
				me.game.sort();

				me.game.remove(this);
				*/
			}
			else
			{
				var choice = Math.random();
				if(choice > 0.7)
				{
					this.moveRight = !this.moveRight;
				}
				else
				{
					this.forceJump();
				}
			}
		}
		res = me.game.collide(this);
		if(res != null)
		{
			if(res.obj.type == "c")
			{
				this.health -= 20;
				var bullet = new ProjectileEntity(this.pos.x, this.pos.y,{velx: this.moveRight ? 10:-10, vely:1, image :"projectile", damage: 120});
				me.game.add(bullet, this.z);
			}
		}
	},

	update : function()
	{
		this.movement();
		this.collision();

		if(this.health <= 0)
		{

			var  corpse= new DroneCorpseEntity(this.pos.x, this.pos.y,{velx:20,vely:-10});
			me.game.add(corpse, this.z);
			me.game.sort();

			me.game.remove(this);
		}
		this.parent();
		return true;
	}

})

var JumpingDroneEntity = DroneEntity.extend({
	init : function(x,y,settings)
	{
		settings.image 			 = "ents32";
		settings.spritewidth	 = 32;
		settings.spriteheight	 = 32;
		this.parent(x,y,settings)

	},

	collision : function ()
	{
		col = this.updateMovement();
		
		//if collising with wall then jump
		if(col.x != 0)
		{
			this.forceJump();
		}

		res = me.game.collide(this);
		if(res != null)
		{
			if(res.obj.type == "c")
			{
				var bullet = new ProjectileEntity(this.pos.x, this.pos.y,{velx: this.moveRight ? 10:-10, vely:1, image :"projectile", damage: 120, hurtsEnemy: false});
				me.game.add(bullet, this.z);
			}
		}
	}

})

var DiggingDroneEntity = DroneEntity.extend({
	init : function(x,y,settings)
	{
		settings.image 			 = "ents32";
		settings.spritewidth	 = 32;
		settings.spriteheight	 = 32;
		this.parent(x,y,settings)

		this.elapsedTime	= me.timer.getTime();
		this.lastTime		= me.timer.getTime();
		
		this.digCooldown	   =	500;
		this.digCooldownTimer  =	0;

	},

	collision : function ()
	{
		this.lastTime = this.elapsedTime;
		this.elapsedTime = me.timer.getTime();

		this.digCooldownTimer += this.elapsedTime - this.lastTime;

		col = this.updateMovement();
		if(col.x != 0)
		{
			this.forceJump();
		}
		//if collising with wall then jump
		if(col.y != 0)
		{
			//this.vel.y      = 	-this.maxVel.y *me.timer.tick;
			if(col.yprop.type == "breakable" && this.digCooldownTimer > this.digCooldown)
			{
				this.digCooldownTimer = 0;
				var bullet = new ProjectileEntity(this.pos.x, this.pos.y,{velx: 0, vely:10, image :"projectile", damage: 12});
				me.game.add(bullet, this.z);
			
			}

		}

		res = me.game.collide(this);
		if(res != null)
		{
			if(res.obj.type == "c")
			{
				var bullet = new ProjectileEntity(this.pos.x, this.pos.y,{velx: this.moveRight ? 10:-10, vely:1, image :"projectile", damage: 120});
				me.game.add(bullet, this.z);
			}
		}
	}

})

var DroneCorpseEntity= me.ObjectEntity.extend({
	init : function(x,y,settings)
	{
		settings.image 			 = "ents32";
		settings.spritewidth	 = 32;
		settings.spriteheight	 = 32;


		this.parent(x,y,settings)


		this.target = me.game.getEntityByName("mainplayer")[0];

		this.setMaxVelocity(1000, 1000);
		
		this.actVelx = settings.velx;

		this.setVelocity(settings.velx,settings.vely);
		
		this.addAnimation ("movesideways", 
					[9,10,11]);

		
		this.setCurrentAnimation("movesideways");

		this.collidable= false;

		this.startTime = me.timer.getTime();
		this.elapsedTime = 0;


	},

	update : function()
	{
		this.elapsedTime = me.timer.getTime() - this.startTime;

		col = this.updateMovement()

		if(this.actVelx > 0)
		{
			this.vel.x += this.accel.x *me.timer.tick;
		}
		else 
		{
			this.vel.x -= this.accel.x *me.timer.tick;
		}
		
		this.vel.y -=  this.accel.y *me.timer.tick;
		if((col.x !=0 || col.y !=0) && this.elapsedTime > 200)
		{
			me.game.remove(this);
		}
		this.parent();
	}
})

var DeathZone= me.ObjectEntity.extend({

	init : function(x,y,settings)
	{
		if(settings.image == null)
		{
			settings.image = "ents32";
		}
		this.parent(x,y,settings)
	},
	update : function()
	{
		var res = me.game.collide(this);
		if(res != null)
		{
			if(res.obj.type == "player")
			{
				res.obj.takeDamage(100000);
			}
		}
		this.parent();
		return true;
	}	
})

var EnemySpawner = me.ObjectEntity.extend({
	init : function (x,y,settings)
	{
		settings.image = "ents32";
		settings.spritewidth = 32;
		if(settings.enemyType)
		{
			this.enemyType = settings.enemyType;
		}
		else
		{
			this.enemyType = "exploding"
		}
		this.active = true;
		if(settings.spawndelay != null)
		{
			this.spawnDelay = settings.spawndelay;
		}
		else
		{
			this.spawnDelay = 100;
		}
		if(settings.direction != null)
		{
			if(settings.direction == "left")
			{
				this.spawnRight = false;
			}
			else
			{
				this.spawnRight = true;
			}
		}
		else
		{
			this.spawnRight = false;
		}

		this.parent(x,y,settings)
		this.addAnimation("idle",[15]);
		this.setCurrentAnimation("idle");

		this.elapsedTime =  me.timer.getTime();
		this.lastTime =  me.timer.getTime();
		this.timeSinceSpawn = 0;
	
	},

	spawnEnemy : function()
	{
		if(this.enemyType == "jumping")
		{
			var  enemy = new JumpingDroneEntity(this.pos.x,this.pos.y,{image: "ents32", faceright: this.spawnRight});
		}
		else if(this.enemyType == "exploding")
		{
			var  enemy = new DroneEntity(this.pos.x,this.pos.y,{image: "ents32", faceright: this.spawnRight});	
		}
		else if(this.enemyType == "digging")
		{
			var  enemy = new DiggingDroneEntity(this.pos.x,this.pos.y,{image: "ents32", faceright: this.spawnRight});	
		}
		me.game.add(enemy, this.z);
		me.game.sort();
	},

	update : function ()
	{
		this.lastTime = this.elapsedTime;
		this.elapsedTime = me.timer.getTime();
		this.timeSinceSpawn += this.elapsedTime - this.lastTime;

		if(!this.active)
		{
			return false;
		}

		if(this.timeSinceSpawn >= this.spawnDelay)
		{
			this.spawnEnemy();
			this.timeSinceSpawn = 0;
		}

		this.parent();
		return true;
	}
})
var WaveManager = me.ObjectEntity.extend({

	init: function(x,y,settings)
	{
		this.parent(x,y,settings);
	},
	update:function()
	{
		this.parent();
		return true;
		

	}
})