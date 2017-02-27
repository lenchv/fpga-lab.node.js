# fpga-lab.node.js
My master project

protocol обмена с платой
клавиатура
мышь
кнопки
server -> board
0x55 0xAA <len> <addr> <data> 

board -> server
0x55 0xAA <len> <addr> <data> 



addr = CODE_DEV

1) Видеотрансляция
2) Загрузка файлов на сервер
3) Работа с ком-портом
  3.1) Формирование пкета
  3.2) Прием / передача пакета
4) additional: Запуск exe
-----

Код Грея