(function(window) {
    if (window.Auth) return;

    window.Auth = function () {
        return {
            show: function (popup) {
                var $popup = $(popup),
                    $body = $popup.find(".modal-body"),
                    $registerForm = $body.find(".register-form__container form"),
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
                    this.auth($registerForm, "/auth/register")
                );
                $authForm.on("submit", this.auth($authForm, "/auth/login"));
                this.validate($registerForm);
                this.validate($authForm);
            },
            auth: function (form, url) {
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
            logout: function () {
                $.post("/auth/logout", {}, function(data) {
                    if (data.url) {
                        location.href = data.url;
                    }
                });
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
