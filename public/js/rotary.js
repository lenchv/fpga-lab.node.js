(function(window) {
    if (window.RotaryController) {
        return;
    }

    window.RotaryController = (function() {
        var _this = null,
            stateClick = {
                NO_CLICK: 0,
                FIRST_CLICK: 1,
                DOUBLE_CLICK: 2
            },
            isDblClick = stateClick.NO_CLICK,
            angleState = {
                ANGLE_0: 0,
                ANGLE_90: 1,
                ANGLE_180: 2,
                ANGLE_270: 3
            },
            currentAngle = angleState.ANGLE_0,
            prevAngle = angleState.ANGLE_0,
            dir = {
                LEFT: 0,
                RIGHT: 1
            };

        return {
            init: function(selector) {
                _this = this;
                _this.isDown = false;
                _this.deg = 0;
                _this.controller = $(selector);
                if (_this.controller.length == 0) {
                    throw new Error("Controller undefined");
                }
                _this.center = {
                    x: _this.controller.offset().left+_this.controller.width()/2,
                    y: _this.controller.offset().top+_this.controller.height()/2
                };

                $(document).on("mousemove", _this.mousemoveHandler);
                _this.controller.on("mousedown", _this.mousedownHandler);
                $(document).on("mouseup", _this.mouseupHandler);
                return _this;
            },
            mousemoveHandler: function(e) {
                if(_this.isDown) {
                    var angle = Math.atan2(
                        e.pageX - _this.center.x,
                        -(e.pageY - _this.center.y)
                    )*(180/Math.PI);
                    _this.rotate(angle);
                    _this.controller.css({"-webkit-transform": "rotate("+parseInt(angle)+"deg)"});
                    _this.controller.css({"-moz-transform": "rotate("+parseInt(angle)+"deg)"});
                    _this.controller.css({"transform": "rotate("+parseInt(angle)+"deg)"});
                }
            },
            mouseupHandler: function(e) {
                _this.isDown = false;
                if (isDblClick === stateClick.DOUBLE_CLICK) {
                    isDblClick = stateClick.NO_CLICK;
                    _this.controller.removeClass("rotary_push");
                }
            },
            mousedownHandler: function(e) {
                e.originalEvent.preventDefault();
                _this.isDown = true;
                switch (isDblClick) {
                    case stateClick.NO_CLICK:
                        isDblClick = stateClick.FIRST_CLICK;
                        setTimeout(function() {
                            if (isDblClick === stateClick.FIRST_CLICK) {
                                isDblClick = stateClick.NO_CLICK;
                            } else {
                                _this.isDown = false;
                            }
                        }, 250);
                        break;
                    case stateClick.FIRST_CLICK:
                        isDblClick = stateClick.DOUBLE_CLICK;
                        $(this).addClass("rotary_push");
                        break;
                }
            },
            direction: function() {
                if (
                    prevAngle === angleState.ANGLE_270
                    &&
                    currentAngle === angleState.ANGLE_0
                ) {
                    return dir.RIGHT;
                }
                if (
                    prevAngle === angleState.ANGLE_0
                    &&
                    currentAngle === angleState.ANGLE_270
                ) {
                    return dir.LEFT;
                }
                if (prevAngle > currentAngle) {
                    return dir.LEFT;
                } else {
                    return dir.RIGHT;
                }
            },
            rotate: function(angle) {
                if (angle > 0 && angle < 90) {
                    currentAngle = angleState.ANGLE_0;
                } else if (angle > 90 && angle < 180) {
                    currentAngle = angleState.ANGLE_90;
                } else if (angle < -90 && angle > -180) {
                    currentAngle = angleState.ANGLE_180;
                } else if (angle < 0 && angle > -90) {
                    currentAngle = angleState.ANGLE_270;
                }

                if (prevAngle !== currentAngle) {
                    console.log(_this.direction());
                    prevAngle = currentAngle;
                }
            }
        };
    })();
})(window);