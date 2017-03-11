(function(window) {
    if(window.ViewState)
        return;
    window.ViewState = function() {
        return {
            init: function($) {
                $ = $ || window.jQuery;
                // Переключение состояний страницы (например, скрытие шапки)
                $("[data-control='state']").on("click", function() {
                    var state = $(this).data("state");
                    if (state) {
                        $("body").toggleClass(state);
                    }
                });
            }
        };
    };
})(window);