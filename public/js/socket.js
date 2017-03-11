(function(window) {
    if (window.Socket) {
        return;
    }
    window.Socket = function(terminal) {
        return {
            io: null,
            connect: function() {
                var self = this;
                if(self.io) {
                    delete self.io;
                    self.io = null;
                }
                self.io = window.io.connect('', {
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax : 5000,
                    reconnectionAttempts: Infinity
                });
                self.io.on( 'connect', function () {
                    terminal.put("<span class='console__text_success'>Соединение установлено</span>");
                });
                self.io.on( 'disconnect', function () {
                    terminal.put("<span class='console__text_error'>Соединение потеряно</span>");
                    window.setTimeout(self.connect, 5000);
                });
                return self;
            }
        }
    };
})(window);