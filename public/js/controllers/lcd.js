/**
 * Класс для работы с клавиатурой
 */
(function() {
    if (window.BoardControllers.Lcd) {
        return
    }

    var Lcd = function(selector) {
        var _this = this;
        window.BoardControllers.Controller.apply(_this, arguments);
        _this.code = 0x08;
        _this.target = $(selector);

        // private methods
        var context = _this.target[0].getContext("2d");
        setTimeout(function() {
            drawText(context);
        },0);

        var drawText = function(ctx) {
            var text = new LcdText();
            text.add(new CharF());
            text.add(new CharP());
            text.add(new CharG());
            text.add(new CharA());
            text.ofs(new P(0, ctx.canvas.height / (P.h*2) - text.get(0).bound.h/2));
            ctx.fillStyle = "#111";
            text.draw(ctx);
            var move = true;
            var anim = function() {
                if (move) {
                    text.clear(ctx);
                    text.right();
                    text.draw(ctx);
                }
                window.requestAnimFrame(function() {anim();});
            };
            anim();

            _this.target.on('mouseover', function() {
                text.move(ctx, false);
                ctx.fillStyle = "rgba(5, 5, 5, 0.8)";
                //move = false;
            });

            _this.target.on('mouseout', function() {
                text.move(ctx, true);
                move = true;
                ctx.fillStyle = "#111";
            });
        };

    };
    Lcd.prototype = Object.create(window.BoardControllers.Controller.prototype);
    Lcd.prototype.constructor = Lcd;

    Lcd.prototype.getCode = function() {
        return this.code;
    };
    Lcd.prototype.change = function(callback) {
        this.on("change", (function(that) {
            return function(data) {
                callback.apply(that, [data]);
            }
        })(this));
    };

    window.BoardControllers.Lcd = Lcd;
    var P = function(x, y) {
        this.x = x; this.y = y;
        this.ofsX = 0; this.ofsY = 0;
    };
    P.w = 10; P.h = 10;
    P.prototype.ofs = function(p, ctx) {
        var _this = this;
        var dx = p.x;
        var dy = p.y;
        var t = 0;
        var redraw = function() {
            _this.clear(ctx);
            _this.ofsX += dx;
            _this.ofsY += dy;
           if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                window.requestAnimationFrame(function() {
                    t += 1;
                    dx = dx * 0.95;
                    dy = dy * 0.9;
                    redraw();
                });
            }
            _this.draw(ctx);
        };
        redraw();
    };
    P.prototype.sum = function(p) {
        this.x = p.x + this.x;
        this.y = p.y + this.y;
    };
    P.prototype.sub = function(p) {
        this.sum(new P(-p.x, -p.y));
    };
    P.prototype.draw = function(ctx) {
        if (this.x*P.w > ctx.canvas.width) {
            this.x = 0;
        }
        if (this.y*P.h > ctx.canvas.height) {
            this.y = 0;
        }
        ctx.fillRect(this.x*P.w+this.ofsX,this.y*P.h+this.ofsY,P.w-1,P.h-1);
    };
    P.prototype.clear = function(ctx) {
        ctx.clearRect(this.x*P.w + this.ofsX - 1,this.y*P.h + this.ofsY - 1,P.w + 1,P.h + 1);
    };
    var Char = function() {
        this.points = [];
        this.sirop = [];
        this.bound = {
            w: 4.5, h: 4.5
        };
    };
    Char.prototype.draw = function(ctx) {
        for (var i = 0; i < this.points.length; i++) {
            this.points[i].draw(ctx);
        }
    };
    Char.prototype.clear = function(ctx) {
        for (var i = 0; i < this.points.length; i++) {
            this.points[i].clear(ctx);
        }
    };
    Char.prototype.right = function() {
        for (var i = 0; i < this.points.length; i++) {
            this.points[i].sum(new P(0.1, 0));
        }
    };
    Char.prototype.ofs = function(ofs) {
        for (var i = 0; i < this.points.length; i++) {
            this.points[i].x += ofs.x;
            this.points[i].y += ofs.y;
        }
    };

    Char.prototype.move = function(ctx, repare) {
        var p, s;
        for (var i = 0; i < this.points.length; i++) {
            //s = this.sirop[i];

            s = repare ? this.sirop[i] : this.getSirop(i);
            p = (repare ? new P(s.x * 3, s.y * 3) : new P(-3 * s.x,-3 * s.y));
            this.points[i].ofs(p, ctx);
        }
    };
    Char.prototype.getSirop = function(i) {
        this.sirop[i] = new P(Math.round(2 * Math.random() - 1),Math.round(2 * Math.random() - 1));
        return this.sirop[i];
    };
    var CharF = function() {
        Char.apply(this, arguments);
        this.points = [
            new P(0, 0),
            new P(0, 1),
            new P(0, 2),
            new P(0, 3),
            new P(1, 0),
            new P(2, 0),
            new P(3, 0),
            new P(1, 2),
            new P(2, 2)
        ];
        this.sirop = [
            new P(1, 1),
            new P(1, -1),
            new P(-1, 1),
            new P(-1, -1),
            new P(1, -1),
            new P(-1, -1),
            new P(-1, 1),
            new P(1, -1),
            new P(1, 1)
        ]
    };
    CharF.prototype = Object.create(Char.prototype);
    CharF.prototype.constructor = CharF;

    var CharP = function() {
        Char.apply(this, arguments);
        this.points = [
            new P(0, 0),
            new P(0, 1),
            new P(0, 2),
            new P(0, 3),
            new P(1, 0),
            new P(2, 0),
            new P(3, 1),
            new P(1, 2),
            new P(2, 2)
        ];
        this.sirop = [
            new P(-1, 1),
            new P(1, -1),
            new P(-1, 1),
            new P(1, 1),
            new P(1, 0),
            new P(1, -1),
            new P(-1, -1),
            new P(-1, -1),
            new P(-1, 1)
        ];
    };
    CharP.prototype = Object.create(Char.prototype);
    CharP.prototype.constructor = CharP;

    var CharG = function() {
        Char.apply(this, arguments);
        this.points = [
            new P(0, 1),
            new P(1, 0),
            new P(2, 0),
            new P(0, 2),
            new P(1, 3),
            new P(2, 3),
            new P(3, 2),
            new P(2, 2)
        ];
        this.sirop = [
            new P(-1, 1),
            new P(1, -1),
            new P(1, -1),
            new P(-1, -1),
            new P(-1, -1),
            new P(1, 1),
            new P(1, -1),
            new P(1, 1)
        ];
    };
    CharG.prototype = Object.create(Char.prototype);
    CharG.prototype.constructor = CharG;

    var CharA = function() {
        Char.apply(this, arguments);
        this.points = [
            new P(2, 0),
            new P(1, 1),
            new P(3, 1),
            new P(0, 2),
            new P(3, 2),
            new P(0, 3),
            new P(3, 3),
            new P(1, 2),
            new P(2, 2)
        ];
        this.sirop = [
            new P(-1, -1),
            new P(-1, -1),
            new P(2, -1),
            new P(1, 1),
            new P(1.5, 1),
            new P(1, -1),
            new P(-1, 1),
            new P(-1, 1),
            new P(1, -1)
        ];
    };
    CharA.prototype = Object.create(Char.prototype);
    CharA.prototype.constructor = CharA;

    var LcdText = function(chars) {
        this.chars = chars || [];
    };
    LcdText.prototype.get = function(i) {
        return this.chars[i];
    };
    LcdText.prototype.add = function(char) {
        if (this.chars.length > 0) {
            var last = this.chars[this.chars.length - 1];
            char.ofs(new P(last.bound.w * this.chars.length, 0));
        }
        this.chars.push(char);
    };
    LcdText.prototype.draw = function(ctx) {
        for (var i = 0; i < this.chars.length; i++) {
            this.chars[i].draw(ctx);
        }
    };
    LcdText.prototype.clear = function(ctx) {
        for (var i = 0; i < this.chars.length; i++) {
            this.chars[i].clear(ctx);
        }
    };
    LcdText.prototype.right = function() {
        for (var i = 0; i < this.chars.length; i++) {
            this.chars[i].right();
        }
    };
    LcdText.prototype.ofs = function(ofs) {
        for (var i = 0; i < this.chars.length; i++) {
            this.chars[i].ofs(ofs);
        }
    };
    LcdText.prototype.move = function(ctx, repare) {
        for (var i = 0; i < this.chars.length; i++) {
            this.chars[i].move(ctx, repare);
        }
    };

    window.requestAnimFrame = (function() {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();
})(window.BoardControllers);

