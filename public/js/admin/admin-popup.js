(function(window) {
    if(window.AdminPopup) {
        return
    }
    window.AdminPopup = (function($) {
        var _ = {},
            inputTpl =
                '<div class="row">'+
                '    <div class="form-group">'+
                '        <label for="#name#">#title#</label>'+
                '        <input type="text" id="#name#" name="#name#" class="form-control">'+
                '    </div>'+
                '</div>',
            selectTpl =
                '<div class="row">'+
                '    <div class="form-group">'+
                '        <label for="#name#">#title#</label>'+
                '        <select id="#name#" name="#name#" class="form-control">'+
                '           #option#'+
                '        </select>'+
                '    </div>'+
                '</div>';
        return {
            /**
             {
                url: string,
                title: string,
                fields: [{
                    name: string,
                    title: string,
                    type: string,
                    disabled: bool,
                    [options: Array]
                }],
                callbacks: {
                    successUpdate: function,
                    failUpdate:
                }
             }
             */
            init: function(params) {
                _.that = this;
                _.url = params.url;
                _.fields = params.fields;
                _.title = params.title;
                _.cb = params.callbacks || {};
                _.modal = $("#admin_popup");
                _.content = _.modal.find(".modal-form__content");
                _.btnSave = _.modal.find(".btn-save");
                _.form = _.modal.find("form");

                $(".item-list__add").on('click', _.that.addClickHandler);
                $(".item-list__row").on('click', _.that.rowClickHandler);
                $(".item-list__delete").on('click', _.that.removeHandler);
                return _.that;
            },
            rowClickHandler: function() {
                var that = $(this),
                    id = that.data("id");
                _.modal.modal("show");
                _.modal.find(".modal-title").html(_.title + ": " + $(this).find("[data-name='name']").html());

                _.that.renderFields();
                $.get(_.url + id, function(data) {
                    if(data.data) {
                        $.each(data.data, function(name, value) {
                            var field = _.content.find("[name='"+name+"']");
                            switch(field.attr('type')) {
                                case 'checkbox':
                                    field.prop("checked", value);
                                    break;
                                case "text":
                                case "select":
                                default:
                                    field.val(value);
                            }
                        });
                    }
                });
                var btnSaveHandler = function() {
                    $.post(_.url+id, _.form.serialize())
                        .done(_.that.successUpdate)
                        .fail(_.that.failUpdate);
                };
                _.btnSave.on("click", btnSaveHandler);
                var closeModalHandler = function() {
                    _.btnSave.off("click", btnSaveHandler);
                    _.modal.off("hidden.bs.modal", closeModalHandler);
                };
                _.modal.on("hidden.bs.modal", closeModalHandler);
            },
            addClickHandler: function() {
                var that = $(this);
                _.modal.modal("show");
                _.modal.find(".modal-title").html(_.title);

                _.that.renderFields();
                var btnSaveHandler = function() {
                    $.post(_.url, _.form.serialize())
                        .done(_.that.successAdd)
                        .fail(_.that.failAdd);
                };
                _.btnSave.on("click", btnSaveHandler);
                var closeModalHandler = function() {
                    _.btnSave.off("click", btnSaveHandler);
                    _.modal.off("hidden.bs.modal", closeModalHandler);
                };
                _.modal.on("hidden.bs.modal", closeModalHandler);
            },
            renderFields: function() {
                _.content.html("");
                _.fields.forEach(function(field) {
                    var f = "";
                    switch(field.type) {
                        case "checkbox":
                            f = $(inputTpl
                                .replace(/type=\"text\"/g, "type='checkbox'")
                                .replace(/\#name\#/g, field.name)
                                .replace(/\#title\#/g, field.title));
                            break;
                        case "select":
                            var options = "";
                            if (field.options instanceof Array) {
                                field.options.forEach(function(r) {
                                    options += "<option value='"+r+"'>"+r+"</option>";
                                });
                            } else {
                                options = field.options;
                            }
                            f = $(selectTpl
                                    .replace(/\#option\#/g, options)
                                    .replace(/\#name\#/g, field.name)
                                    .replace(/\#title\#/g, field.title));
                            break;
                        case "text":
                        default:
                            f = $(inputTpl
                                    .replace(/\#name\#/g, field.name)
                                    .replace(/\#title\#/g, field.title));
                    }
                    if (field.disabled) {
                        f.find("[name='"+field.name+"']").prop("disabled", field.disabled);
                    }
                    _.content.append(f);
                });

            },
            successUpdate: function(data) {
                if (data.success) {
                    if (_.cb.successUpdate) {
                        _.cb.successUpdate({_:_, data: data});
                    }
                    window.AlertNotice.success("Данные успешно сохранены");
                    _.modal.modal('hide');
                }
            },
            failUpdate: function(error) {
                try {
                    if (_.cb.failUpdate) {
                        _.cb.failUpdate({_:_, data: error});
                    }
                    window.AlertNotice.error(JSON.parse(error.responseText).message);
                } catch(e) {}
            },
            successAdd: function(data) {
                if (data.success) {
                    if (_.cb.successAdd) {
                        _.cb.successAdd({_:_, data: data});
                    }
                    window.AlertNotice.success("Данные успешно сохранены");
                    _.modal.modal('hide');
                }
            },
            failAdd: function(error) {
                try {
                    if (_.cb.failAdd) {
                        _.cb.failAdd({_:_, data: error});
                    }
                    window.AlertNotice.error(JSON.parse(error.responseText).message);
                } catch(e) {}
            },
            removeHandler: function(e) {
                e = e || window.event;
                (e.preventDefault ? e.preventDefault() : e.returnValue = false);
                (e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true);
                var row = $(this).closest(".item-list__row"),
                    id = row.data('id');
                $.post(_.url+"delete/"+id)
                    .done(function(data) {
                        if (data.success) {
                            row.remove();
                            window.AlertNotice.success("Удаление прошло успешно");
                        }
                    })
                    .fail(function(error) {
                        try {
                            window.AlertNotice.error(JSON.parse(error.responseText).message);
                        } catch(e) {}
                    });
            },
            set: function(param, value) {
                _[param] = value;
            }
        };
    })(window.jQuery);
})(window);