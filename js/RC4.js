/**
 * 生成32位随机数，提供给zobrist使用
 */
(function(){
	/**
	 * @param {Array} key [description]
	 */
	var RC4 = window.RC4 = function(key){
		this.state = [];
		this.x = this.y = 0;
		this.init();
	}
	RC4.prototype.init = function(){
		var j = 0;
		for(var i = 0; i < 256; i ++){
			this.state.push(i);
		}
		for(var i = 0; i < 256; i++){
			j = (j + this.state[i] + key[i % key.length]) & 255;
			this.swap(i,j);
		}
	}
	RC4.prototype.swap = function(i,j){
		var t = this.state[i];
		this.state[i] = this.state[j];
		this.state[j] = t;
	}
	RC4.prototype.nextByte = function(){
		this.x = (this.x + 1) & 255;
		this.y = (this.y + this.state[this.x]) & 255;
		this.swap(this.x,this.y);
		return this.state[(this.state[this.x] + this.state[this.y]) & 255];
	}
	RC4.prototype.nextLong = function(){
		var n0 = this.nextByte();
		var n1 = this.nextByte();
		var n2 = this.nextByte();
		var n4 = this.nextByte();

		return n0 + (n1 << 8) + (n2 << 16) + ((n3 << 24) & 0xffffffff);
	}
})();