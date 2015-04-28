var util = {
	randint : function (min,max)
	{
		return Math.floor(min + Math.random()*(max-min));
	},

	distance : function(a,b)
	{
		return Math.sqrt((b.pos.x -a.pos.x)*(b.pos.x -a.pos.x) + (b.pos.y -a.pos.y)*(b.pos.y -a.pos.y))
	}
}
