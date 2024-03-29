/**
 * 处理棋子移动
 */
(function(){
	var Position = window.Position = function(){
		
	}
	// 如果bDel为false，则将棋子pc添加进棋局中的sq位置；如果bDel为true，则删除sq位置的棋子。
	Position.prototype.addPiece = function(sq,pc,bDel) {
		this.squares[sq] = bDel ? 0 : pc;
	}
	//尝试走棋
	Position.prototype.makeMove = function(mv){
		this.movePiece(mv);
		this.changeSide();
		this.distance ++;
		return true;
	}
	//取消尝试走的棋
	Position.prototype.undoMakeMove = function(){
		this.changeSide();
		this.undoMovePiece();
		this.distance --;
	}
	//移动棋子
	Position.prototype.movePiece = function(mv){
		var sqSrc = SRC(mv);
		var pcSrc = this.squares[sqSrc];
		var sqDst = DST(mv);
		var pcDst = this.squares[sqDst];

		this.pcList.push(pcDst); //记录被吃掉的子 (没有吃子时，记录 0);
		//删除起点位置棋子
		this.addPiece(sqSrc,pcSrc,DEL_PIECE);
		//将起点位置的棋子添加到终点位置
		this.addPiece(sqDst,pcSrc,ADD_PIECE);
		//记录走法
		this.mvList.push(mv);
	}
	//取消移动棋子
	Position.prototype.undoMovePiece = function(){
		//从走法表中取出最后一个走法
		var mv = this.mvList.pop();
		//获取走法的起点，终点，棋子
		var sqSrc = SRC(mv);
		var sqDst = DST(mv);
		var pcDst = this.squares[sqDst];
		// 删除终点棋子
		this.addPiece(sqDst, pcDst, DEL_PIECE);	
		//将这个棋子添加到起点
		this.addPiece(sqSrc,pcDst,ADD_PIECE);
		//取出吃掉的子
		var pc = this.pcList.pop();
		if(pc > 0){
			this.addPiece(sqDst,pc,ADD_PIECE);
		}
	}
	//改变走棋方
	Position.prototype.changeSide = function(){
		this.sdPlayer = 1 - this.sdPlayer;
	}
	Position.prototype.legalMove = function(mv){
		var sqSrc = SRC(mv);
		var pcSrc = this.squares[sqSrc];
		var pcSelfSide = SIDE_TAG(this.sdPlayer);
		//如果起点为对方棋子，或者为空子，不合法
		if((pcSrc & pcSelfSide) == 0){
			return false;
		}
		var sqDst = DST(mv);
		var pcDst = this.squares[sqDst];
		//终点位置棋子为我方棋子
		if((pcDst & pcSelfSide) != 0){
			return false;
		}
		//根据棋子类型判断
		switch(pcSrc - pcSelfSide){
			case PIECE_KING: //将(帅)
				return IN_FORT(sqDst) && KING_SPAN(sqSrc,sqDst);
			case PIECE_ADVISOR: //士
				return IN_FORT(sqDst) && ADVISOR_SPAN(sqSrc,sqDst);
			case PIECE_BISHOP: //象
				return SAME_HALF(sqSrc,sqDst) && BISHOP_SPAN(sqSrc,sqDst) 
					&& this.squares[BISHOP_PIN(sqSrc,sqDst)] == 0;
			case PIECE_KNIGHT: //马
				var sqPin = KNIGHT_SPAN(sqSrc,sqDst);
				return sqPin != sqSrc && this.squares[sqPin] == 0;
			case PIECE_ROOK: //车
			case PIECE_CANNON: //炮
				//车与炮均是直线走路，判断是否是同一行或者同一列
				var delta;//移动向量
				//同一行 
				if(SAME_RANK(sqSrc,sqDst)){
					delta = sqDst > sqSrc ? 1 : -1;
				} else if(SAME_FILE(sqSrc,sqDst)){
					delta = sqDst > sqSrc ? 16 : -16;
				} else {
					return false;
				}
				var sqPin = sqSrc + delta;
				//沿着终点的方向前进，直到到达终点或者遇到了其它棋子位置
				while(sqPin != sqDst && this.squares[sqPin] == 0){
					sqPin += delta;
				}
				//如果此时到达了终点，说明中途没有遇到一个棋子，此时若终点为空，则车或炮都合法，否则只有车合法
				if(sqPin == sqDst){
					return this.squares[sqDst] == 0 || pcSrc - pcSelfSide == PIECE_ROOK;
				}
				//没有到达终点，此时sqPin对应的位置棋子不为空,此时如果是车，则不合法，如果终点为空，也不合法
				if(pcDst == 0 || pcSrc - pcSelfSide != PIECE_CANNON){
					return false;
				}
				sqPin += delta;
				while(sqPin != sqDst && this.squares[sqPin] == 0){
					sqPin += delta;
				}
				//此时再次碰到棋子，如果该位置是终点，则炮合法，否则都不合法
				return sqPin == sqDst;
			case PIECE_PAWN: //兵(卒)
				//如果已经过河，且是向左向右走的，合法
				if(AWAY_HALF(sqSrc,this.sdPlayer,game.sm.board.computer) && 
					(sqDst - sqSrc == 1 || sqDst - sqSrc == -1)){
					return true;
				}
				var sqPin = SQUARE_FORWARD(sqSrc,this.sdPlayer,game.sm.board.computer);
				return sqPin == sqDst;
			default:
				return false;
		}
	}
	Position.prototype.clearBoard = function() {
		//默认总是红方先走棋 0-红方 1-黑方
		this.sdPlayer = 0;
		this.squares = []; //棋盘数组
		for(var i = 0 ; i < 256 ; i++){
			this.squares.push(0);
		}
		this.vlWhite = this.vlBlack = 0;
	};
	Position.prototype.setIrrev = function(){
		//走法数组，存储每次的走法
		this.mvList = [0];
		//吃子数组，存放每次吃子
		this.pcList = [0];
		//深度，代表每次搜索时进行的深度，配合历史表使用
		this.distance = 0;
	}
	//解析fen
	Position.prototype.fromFen = function(fen){
		this.clearBoard();
		var index = 0;
		if(index == fen.length){
			return ;
		}
		var c = fen.charAt(index);
		var x = 3,y = 3;//x 代表列 y 代表行
		while(c != " "){
			if(c == "/"){//换行
				x = 3;
				y ++;
			} else if(c >= 1 && c <= 9){ // 空格
				x += (c.charCodeAt() - ("0").charCodeAt());
			} else if(c >= "A" && c <= "Z"){
				if(x <= 11){
					var pt = CHAR_TO_PIECE(c);
					if(pt >= 0){
						this.addPiece(COORD_XY(x,y),pt + 8,ADD_PIECE);
					}
					x ++;
				}
			} else if(c >= "a" && c <= "z"){
				if(x <= 11){
					var pt = CHAR_TO_PIECE(c.toUpperCase());
					if(pt >= 0){
						this.addPiece(COORD_XY(x,y),pt + 16,ADD_PIECE);
					}
					x ++;
				}
			}
			index++;
			if(index == fen.length){
				this.setIrrev();
				return ;
			}
			c = fen.charAt(index);			
		}
		this.setIrrev();
	}
})()