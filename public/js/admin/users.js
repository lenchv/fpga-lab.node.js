$(function() {
    // изменение пользователя
    $(".item-list__row").on("click", function() {
        var $modal = $("#admin_popup"),
            that = $(this),
            id = that.data("id"),
            content = $modal.find(".modal-form__content"),
            btnSave = $modal.find(".btn-save"),
            form = $modal.find("form");
        $modal.modal("show");
        $modal.find(".modal-title").html("Изменение пользователя : " + $(this).find("[data-name='name']").html());
        // заполненеие формы редактирования пользователя
        $.get("/admin/users/"+id, function(data) {
            var inputTpl =
                '<div class="row">'+
                '    <div class="form-group">'+
                '        <label for="#name#">#title#</label>'+
                '        <input type="text" id="#name#" name="#name#" value="#value#" class="form-control">'+
                '    </div>'+
                '</div>';
            if (data.user) {
                content.html("");
                var selectTpl =
                    '<div class="row">'+
                    '    <div class="form-group">'+
                    '        <label for="#name#">#title#</label>'+
                    '        <select id="#name#" name="#name#" class="form-control">'+
                    '           #option#'+
                    '        </select>'+
                    '    </div>'+
                    '</div>';
                var tplName = inputTpl
                    .replace(/\#name\#/g, "name")
                    .replace(/\#title\#/g, "Имя")
                    .replace(/\#value\#/g, data.user.name);
                var tplEmail = inputTpl
                    .replace(/\#name\#/g, "email")
                    .replace(/\#title\#/g, "E-mail")
                    .replace(/\#value\#/g, data.user.email);
                var tplGroup = inputTpl
                    .replace(/\#name\#/g, "group")
                    .replace(/\#title\#/g, "Группа")
                    .replace(/\#value\#/g, data.user.group);
                var options = "";
                data.right.forEach(function(r) {
                    options += "<option value='"+r+"' ";
                    options += (data.user.right === r ? "selected='selected'" : "");
                    options += ">"+r+"</option>"
                });
                var tplRight = selectTpl
                    .replace(/\#option\#/g, options)
                    .replace(/\#name\#/g, "right")
                    .replace(/\#title\#/g, "Права доступа");
                var tplPassword = inputTpl
                    .replace(/type=\"text\"/g, "type='password'")
                    .replace(/\#name\#/g, "password")
                    .replace(/\#title\#/g, "Пароль")
                    .replace(/\#value\#/g, "");
                var tplPasswordRepeat = inputTpl
                    .replace(/type=\"text\"/g, "type='password'")
                    .replace(/\#name\#/g, "confirm_password")
                    .replace(/\#title\#/g, "Повторите пароль")
                    .replace(/\#value\#/g, "");

                content.append(tplName)
                    .append(tplEmail)
                    .append(tplGroup)
                    .append(tplRight)
                    .append(tplPassword)
                    .append(tplPasswordRepeat)
                    .append("<input type='hidden' name='user_id' value='"+id+"'>");
            }
            if (data.userSpace) {
                var tplSize = inputTpl
                    .replace(/\#name\#/g, "spacesize")
                    .replace(/\#title\#/g, "Дисковое пространство (байт)")
                    .replace(/\#value\#/g, data.userSpace.spacesize);
                content.append(tplSize)
                    .append("<div>Директория пользователя:<br>"+data.userSpace.directory+"</div>");
            }
        });
        //
        var btnSaveHandler = function() {
            $.post("/admin/users/"+id, form.serialize())
                .done(function(data) {
                    if (data.success) {
                        $.each(data.user, function(field, value) {
                            that.find("[data-name='"+field+"']").html(value);
                        });
                        window.AlertNotice.success("Данные успешно сохранены");
                        $modal.close();
                    }
                })
                .fail(function(error) {
                    try {
                        window.AlertNotice.error(JSON.parse(error.responseText).message);
                    } catch(e) {}
                });
        };
        btnSave.on("click", btnSaveHandler);
        var closeModalHandler = function() {
            btnSave.off("click", btnSaveHandler);
            $modal.off("hidden.bs.modal", closeModalHandler);
        };
        $modal.on("hidden.bs.modal", closeModalHandler);
    });
    // удаление пользователя
    $(".item-list__delete").on('click', function(e) {
        e = e || window.event;
        (e.preventDefault ? e.preventDefault() : e.returnValue = false);
        (e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true);
        var row = $(this).closest(".item-list__row"),
            id = row.data('id');
        $.post("/admin/users/delete/"+id)
            .done(function(data) {
                if (data.success) {
                    row.remove();
                    window.AlertNotice.success("Пользователь успешно удален");
                }
            })
            .fail(function(error) {
                try {
                    window.AlertNotice.error(JSON.parse(error.responseText).message);
                } catch(e) {}
            });
    });
});