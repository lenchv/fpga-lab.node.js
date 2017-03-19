$(function() {
    var boardPopup = window.AdminPopup.init({
        "url": "/admin/board/",
        "title": "Плата",
        "fields": [
            { "name": "name", "title": "Название" },
            { "name": "firmwareport", "title": "Интерфейс связи с платой" },
            { "name": "comport", "title": "COM-порт" },
            { "name": "baudRate", "title": "Baudrate", "type": "select", "options": [
                300,
                1200,
                2400,
                4800,
                9600,
                14400,
                19200,
                28800,
                38400,
                57600,
                115200,
                230400
            ]},
            { "name": "webcam", "title": "Камера" },
            { "name": "webcamsecret", "title": "Секретный ключ для камеры" },
            { "name": "busy", "title": "Занятость", "type": "checkbox" },
            { "name": "user", "title": "Пользователь", "disabled": true },
            { "name": "active", "title": "Активность", "type": "checkbox" },
            { "name": "sessionTime", "title": "Expires", "disabled": true }
        ],
        "callbacks": {
            "successAdd": function(e) {
                var _ = e._,
                    data = e.data.data,
                    row = $("<tr class='item-list__row' data-id='"+data._id+"'></tr>"),
                    removeBtn = $('<td class="item-list__cell"><button type="button" class="close item-list__delete" aria-label="Close"><span aria-hidden="true">&times;</span></button></td>');
                removeBtn.find(".item-list__delete").on("click", _.that.removeHandler);
                row.on('click', _.that.rowClickHandler);
                row.append(
                    '<td class="item-list__cell" data-name="id">'+data._id+'</td>'
                ).append(
                    '<td class="item-list__cell" data-name="name">'+data.name+'</td>'
                ).append(
                    '<td class="item-list__cell" data-name="firmwareport">'+data.firmwareport+'</td>'
                ).append(
                    '<td class="item-list__cell" data-name="comport">'+data.comport+'</td>'
                ).append(
                    '<td class="item-list__cell" data-name="baudRate">'+data.baudRate+'</td>'
                ).append(
                    '<td class="item-list__cell" data-name="webcam">'+data.webcam+'</td>'
                ).append(
                    '<td class="item-list__cell" data-name="webcamsecret">'+data.webcamsecret+'</td>'
                ).append(
                    '<td class="item-list__cell" data-name="busy">'+data.busy+'</td>'
                ).append(
                    '<td class="item-list__cell" data-name="user">'+data.user+'</td>'
                ).append(
                    '<td class="item-list__cell" data-name="active">'+data.active+'</td>'
                ).append(
                    '<td class="item-list__cell" data-name="sessionTime">'+data.sessionTime+'</td>'
                ).append(removeBtn);
                $(".item-list tbody").append(row);
            },
            "successUpdate": function(e) {
                var _ = e._,
                    data = e.data.data,
                    row = $(".item-list [data-id='"+data._id+"']");
                $.each(data, function(field, value) {
                    row.find("[data-name='"+field+"']").html(value);
                });
            }
        }
    });
});