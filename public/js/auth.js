(function(window) {
    if (window.AuthPopup) return;

    window.AuthPopup = function (popup) {
        var $popup = $(popup),
            $body = $popup.find(".modal-body");
        return {
            init: function () {
                var $registerForm = $body.find(".register-form__container form"),
                    $authForm = $body.find(".auth-form__container form");
                $popup.modal({
                    backdrop: 'static',
                    keyboard: false
                });
                $body.find(".register-toggle").on("click", function () {
                    $body.toggleClass("register");
                });
                $registerForm.on(
                    "submit",
                    this.login($registerForm, "/register")
                );
                $authForm.on("submit", this.login($authForm, "/auth"));
                this.validate($registerForm);
                this.validate($authForm);
            },
            login: function (form, url) {
                var flag = true;
                return function (e) {
                    e = e || window.event;
                    (e.preventDefault ? e.preventDefault() : e.returnValue = false);
                    if (flag) {
                        form.find(".erorr").removeClass("error");
                        flag = false;
                        $.ajax({
                            url: url,
                            data: $(this).serialize(),
                            method: "POST",
                            complete: function() {
                                flag = true;
                            },
                            success: function (data) {
                                if (data.success) {
                                    console.log(data);
                                    location.href = "/";
                                }
                            },
                            error: function (data) {
                                if (data.responseText) {
                                    try {
                                        var error = JSON.parse(data.responseText);
                                        $.each(error.message.errors, function (key, value) {
                                            var input = form.find("[name='"+key+"']");
                                            if (input) {
                                                input.addClass("error")
                                                    .parent()
                                                    .find(".auth-form__input-notification_alert")
                                                    .attr("data-message", value);
                                            }
                                        });
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }
                            }
                        });
                    }
                }
            },
            validate: function (form) {
                form.find("input, select, textarea").each(function(i, item) {
                    $(item).on("focus", function() {
                        $(this).removeClass("error");
                    });
                });
            }
        };
    };
})(window);
