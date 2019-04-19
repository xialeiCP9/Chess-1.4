/**
 * 棋盘类
 * 1、棋盘初始化
 * 2、棋盘渲染
 * 3、棋盘更新
 */
(function(){
	var Board = window.Board = function(){
		//初始化棋盘的fen串
		this.fen = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1"
		this.pos = new Position();
		//点击的位置
		this.sqSelected = 0;
		//鼠标移动事件中的位置
		this.mousemove = 0;
		//上一步走法
		this.mvLast = 0;
		//电脑代表的数，0 时，电脑执红，先走，1时电脑执黑，后走
		this.computer = -1;
		//电脑是否在思考
		this.busy = false;
	}
	//刷新棋盘
	Board.prototype.flushBoard = function(){
		game.ctx.clearRect(0,0,game.canvas.width,game.canvas.height);
		this.update();
		this.render();
	}
	//渲染棋盘
	Board.prototype.render = function(){
		for(var i = 0 ; i < 256 ; i ++){
			if(IN_BOARD(i)){
				var pc = this.pos.squares[i];
				var img = game.R[PIECE_NAME[pc]];
				var x = RANK_X(i - 51) * 57 + 2;
				var y = RANK_Y(i - 51) * 57 + 2;
				game.ctx.drawImage(img,x,y,57,57);
			}
		}
	}
	//更新棋盘
	Board.prototype.update = function(){
		//当前鼠标指向的位置
		if(this.mousemove > 0){
			var x = RANK_X(this.mousemove - 51) * 57 + 2;
			var y = RANK_Y(this.mousemove - 51) * 57 + 2;
			game.ctx.drawImage(game.R["oos"],x,y);
		}
		//当前点击的位置
		if(this.sqSelected > 0){
			var x = RANK_X(this.sqSelected - 51) * 57 + 2;
			var y = RANK_Y(this.sqSelected - 51) * 57 + 2;
			game.ctx.drawImage(game.R["oos"],x,y);
		}
		//最新一个走法
		if(this.mvLast > 0){
			var sqSrc = SRC(this.mvLast);
			var sqDst = DST(this.mvLast);

			var srcX = RANK_X(sqSrc - 51) * 57 + 2;
			var srcY = RANK_Y(sqSrc - 51) * 57 + 2;

			var dstX = RANK_X(sqDst - 51) * 57 + 2;
			var dstY = RANK_Y(sqDst - 51) * 57 + 2;

			game.ctx.drawImage(game.R["oos"],srcX,srcY);
			game.ctx.drawImage(game.R["oos"],dstX,dstY);
		}
	}
	//实际走棋 computerMove:是否是电脑走棋
	Board.prototype.addMove = function(mv,computerMove){
		if(!this.pos.legalMove(mv)){
			return;
		}

		//判断走这步棋时，是否会发生将军，若将军，就不走这步棋
		if(!this.pos.makeMove(mv)){
			return;
		}

		this.postAddMove(mv,computerMove);
	}
	Board.prototype.postAddMove = function(mv,computerMove){
		//记录最新的走法
		this.mvLast = mv;
		//重置已点击的棋子
		this.sqSelected = 0;
		//刷新界面
		this.flushBoard();
	}
	//悔棋
	Board.prototype.retract = function(){
		if(this.busy){
			return;
		}
		if(this.pos.pcList.length > 1){
			this.pos.undoMakeMove();
			this.mvLast = 0;
			this.sqSelected = 0;
		}
		// 如果走法数组不为空，并且该电脑走棋，那么需要再撤销一步棋
		if (this.pos.mvList.length > 1 && this.computerMove()) {
		  this.pos.undoMakeMove();
		}
		this.flushBoard();
	}
	Board.prototype.computerMove = function(){
		return this.computerMove == this.pos.sdPlayer;
	}
	//棋局重新开始
	Board.prototype.restart = function(){
		if(this.busy){
			return;
		}
		this.busy = false;
		var fen = this.flipped(this.fen);
		this.pos.fromFen(fen);
		this.flushBoard();
	}
	// 翻转棋盘位置（电脑执红，也就是电脑先走的时候，会把红棋显示在棋盘上面，黑棋显示在下面）
	Board.prototype.flipped = function(fen) {
		if(this.computer != 0){
			return this.fen;
		}
		var str = "";
		var index = 0;
		var c = fen.charAt(index);
		while(c != " "){
			if(c >= "A" && c <= "Z"){
				str += c.toLowerCase();
			} else if(c >= "a" && c <= "z"){
				str += c.toUpperCase();
			} else {
				str += c;
			}
			index++;
			c = fen.charAt(index);
		}
		str += c; //空格
		index ++;
		while(index < fen.length){
			str += fen.charAt(index);
			index ++;
		}
		return str;
	}	
})()