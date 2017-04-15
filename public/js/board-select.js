(function(window) {
    if (window.BoardSelect) {
        return;
    }
    window.BoardSelect = (function() {
        var _ = {},
            that = null;
        return {
            init: function() {
                that = this;
                _.select = $(".choose-board__select");
                that.fillSelect();
                _.select.on('change', that.changeSelect);
                $(".choose-board__leave").on("click", that.leave);
                $(".choose-board__update").on("click", that.fillSelect);
                return this;
            },
            fillSelect: function() {
                $.get("/board", function(data) {
                    if (data instanceof Array) {
                        var options = "<option value='' disabled='disabled' selected='selected'></option>",
                            selectState = {
                                "busyAll": "choose-board__select_busy-all",
                                "haveBusy": "choose-board__select_have-busy",
                                "freeAll": "choose-board__select_free-all"
                            },
                            currentState = "freeAll",
                            busyAll = true;
                        _.select.html("");
                        $.each(data, function(i, board) {
                            busyAll = busyAll && (board.busy === true);
                            if (board.busy) {
                                currentState = "haveBusy";
                            }
                            options += "<option "+
                                "value='"+board._id+"' "+
                                (board.busy === true ? "disabled='disabled' " : "")+
                                (board.select === true ? "selected='selected'" : "")+
                                ">"+
                                board.name+
                                "</option>";
                        });
                        if (busyAll) {
                            currentState = "busyAll";
                        }
                        _.select.append(options);
                        $.each(selectState, function(i, state) {
                            _.select.removeClass(state);
                        });
                        _.select.addClass(selectState[currentState]);
                    }
                });
            },
            changeSelect: function() {
                $.post("/board/"+$(this).val(), function(data) {
                    if (data.success) {
                        that.fillSelect();
                        window.AlertNotice.success("Плата выбрана успешно");
                    } else {
                        window.AlertNotice.error("Плата не выбрана");
                    }
                });
            },
            leave: function() {
                $.post("/board/leave", function(data) {
                    if (data.success) {
                        that.fillSelect();
                    }
                });
            }
        };
    })();
})(window);