$(function () {
    $("[data-control='state']").on("click", function() {
        var state = $(this).data("state");
        if (state) {
            $("body").toggleClass(state);
        }
    });
});

