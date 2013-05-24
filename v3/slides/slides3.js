var Slides = {
	modules: {
		keyboard: 1,
		url: 1,
/*		skin: "",
		language: "en",
		overview: 1,
		progress: 1,
		syntax: 1,
		title: 1,
		touch: 1 */
	},
	slides: [],
	current: null,

	_path: [].slice.call(document.querySelectorAll("script")).pop().src.split("/").slice(0, -1).join("/"),
	_listeners: {
		key: [],
		change: []
	},

	next: function() {
		var result = this.current.next();
		if (!result) {
			var index = this.slides.indexOf(this.current) + 1;
			if (index == this.slides.length) { return; }
			this.show(this.slides[index]);
		}
	},

	prev: function() {
		var result = this.current.prev();
		if (!result) { 
			var index = this.slides.indexOf(this.current) - 1;
			if (index == -1) { return; }
			this.show(this.slides[index], true); 
		}

	},

	show: function(slide, expandAll) {
		this.current = slide;

		for (var i=0;i<this.slides.length;i++) {
			var slide = this.slides[i];
			if (this.current == slide) {
				slide.show(expandAll);
			} else {
				slide.hide();
			}
		}

		var event = {type:"change"};
		for (var i=0;i<this._listeners.change.length;i++) { this._listeners.change[i](event); }
	},

	addStylesheet: function(path) {
		var link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = this._path + "/" + path;
		document.body.appendChild(link);
	},

	addKeyListener: function(listener, keys, label) {
		this._listeners.key.push({
			listener: listener,
			keys: [].concat(keys),
			label: label
		});
	},

	addChangeListener: function(listener) {
		this._listeners.change.push(listener);
	},

	getKeyListeners: function() {
		return this._listeners.key;
	},

	handleEvent: function(e) {
		switch (e.type) {
			case "load":
				this.addStylesheet("slides3.css");

				var nodes = document.querySelectorAll(".slide");
				for (var i=0;i<nodes.length;i++) {
					this.slides.push(new Slide(nodes[i]));
				}

				this.show(this.slides[0]);

				for (var id in this.modules) {
					var script = document.createElement("script");
					script.src = this._path + "/" + id + "/module.js";
					document.body.appendChild(script);
				}
			break;

			case "keydown":
				for (var i=0;i<this._listeners.key.length;i++) {
					var item = this._listeners.key[i];
					if (item.keys.indexOf(e.keyCode) != -1) { item.listener(); }
				}
			break;
		}

	}
};
window.addEventListener("load", Slides);
document.addEventListener("keydown", Slides);


var Slide = function(node) {
	this._node = node;

	this._sections = [];
	this._index = -1;
	
	this._findSections(node);
	this.next(); /* show first section */
}

Slide.prototype._prefixes = ["", "Moz", "Webkit", "O", "ms"];

Slide.prototype.getNode = function() {
	return this._node;
}

Slide.prototype._findSections = function(node) {
	if (node.classList.contains("section")) { 
		this._sections.push(node);
	}

	var hasSections = node.classList.contains("sections");
	node.classList.remove("sections");
	
	for (var i=0;i<node.children.length;i++) {
		var child = node.children[i];
		if (hasSections) { child.classList.add("section"); }
		this._findSections(child);
	}
}

Slide.prototype.hide = function() {
	this._node.classList.remove("current");
}

Slide.prototype.show = function(expandAll) {
	this._node.classList.add("current");

	var sectionIndex = (expandAll ? this._sections.length-1 : 0);
	for (var i=0;i<this._sections.length;i++) {
		var section = this._sections[i];
		if (i == sectionIndex) {
			section.classList.add("current");
		} else {
			section.classList.remove("current");
		}
	}
}

Slide.prototype.next = function() {
	if (this._index+1 >= this._sections.length) { return false; }

	if (this._index != -1) { this._sections[this._index].classList.remove("current"); }
	this._sections[++this._index].classList.add("current");

	return true;
}

Slide.prototype.prev = function() {
	if (this._index <= 0) { return false; }

	this._sections[this._index].classList.remove("current");
	this._sections[--this._index].classList.add("current");

	return true;
}

Slide.prototype.beginOverview = function(scale, x, y) {
	x = Math.round(x*100) + "%";
	y = Math.round(y*100) + "%";
	this._css3prop("transform", "scale(" + scale + ") translate(" + x + ", " + y + ")");
	
	var border = OZ.Style.get(this._elm, "borderLeftWidth");
	border = parseInt(border) || 0;
	border = Math.round(border/scale);
	this._elm.style.borderWidth = border+"px";
	
	this._event = OZ.Event.add(this._elm, "click", this._click.bind(this));
}

Slide.prototype.endOverview = function(scale, x, y) {
	this._css3prop("transform", "");
	this._elm.style.borderWidth = "";
	OZ.Event.remove(this._event);
}

Slide.prototype._css3prop = function(name, value) {
	for (var i=0;i<this._prefixes.length;i++) {
		var n = this._prefixes[i];
		if (n) {
			n += name.charAt(0).toUpperCase() + name.substring(1);
		} else {
			n += name;
		}
		this._elm.style[n] = value;
	}
}

Slide.prototype._click = function(e) {
	this._presentation.goSlide(this);
}
