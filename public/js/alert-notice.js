/**
 * Вывод ошибок
 */
(function(window) {
    if(window.AlertNotice)
        return;
    window.AlertNotice = (function() {
        var alert = "<div class='alert alert-dismissable alert-popup'>"+
                "<a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a>"+
                "<div class='alert-popup__content'>%content%</div>"+
                "</div>",
            bottom = 20;
        return {
            show: function(error, type) {
                var err = $(alert.replace("%content%", error));
                if (type !== undefined) {
                    err.addClass(type);
                } else {
                    err.addClass("alert-danger");
                }
                err.find(".close").on("click", function() {
                    err.alert('close');
                });
                //"margin-bottom": (bottom+err.outerHeight())+"px"
                err.css({bottom: bottom+"px"});
                $('body').append(err);
                bottom += err.outerHeight();
                setTimeout(function() {
                    err.addClass("alert-popup_show");
                    //err.css({"margin-bottom": 0});
                }, 50);
                setTimeout(function() {
                    err.alert('close');
                }, 5000);
                err.on('close.bs.alert', function () {
                    var height = err.outerHeight();
                    bottom -= height;
                    $(".alert-popup_show").each(function(i, item) {
                        var $item = $(item),
                            bot = parseInt($item.css("bottom"));
                        $item.css({"bottom": bot - height + "px"});
                    });
                    if (bottom < 20) {
                        bottom = 20;
                    }
                });
            },
            success: function(text) {
                this.show(text, "alert-success");
            },
            error: function(text) {
                this.show(text, "alert-danger");
            },
            warning: function(text) {
                this.show(text, "alert-warning");
            }
        };
    })();
})(window);