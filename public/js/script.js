$(function () {
    $("[data-control='state']").on("click", function() {
        var state = $(this).data("state");
        if (state) {
            $("body").toggleClass(state);
        }
    });

    $(".user-info__exit-link").on("click", function () {
        $.post("/logout", {}, function(data) {
            if (data.url) {
                location.href = data.url;
            }
        });
    });
});

