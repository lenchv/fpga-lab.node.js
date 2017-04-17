# FPGA лаборатория
<p>
Цель проекта: удаленное управление fpga-стендом.
</p>

### Эмулируемые устройства
клавиатура, мышь, кнопки (switches, buttons, rotary)<br>
<table>
<tr>
<th>Устройство</th>
<th>Код</th> 
</tr>
<tr>
<td>Эхо</td>
<td>01</td> 
</tr>
<tr>
<td>Светодиоды</td>
<td>02</td> 
</tr>
<tr>
<td>Кнопки</td>
<td>03</td> 
</tr>
<tr>
<td>Крутилка (Rotary, knob)</td>
<td>04</td> 
</tr>
<tr>
<td>Вывод в терминал</td>
<td>05</td> 
</tr>
</table>

### Протокол обмена с платой
````
server -> board
0x55 0xAA <len> <addr> <data>

board -> server
0x55 0xAA <len> <addr> <data>

<addr> => CODE_DEV
````
## План действий

### Неделя 1
<ol>
<li> Видеотрансляция</li>
<li> Загрузка файлов на сервер</li>
</ol>

### Неделя 2
<ol>
<li> Работа с ком-портом</li>
  <ul>
  <li> Формирование пакета</li>
  <li> Прием / передача пакета</li>
  </ul>
   <li> additional: Запуск exe</li>
</ol>

### Заметки

Для rotary использовать код Грея
<p>
PS/2 - 4х байтный формат<br>
<a href="http://www.computer-engineering.org/ps2mouse/">Spec. PS/2</a>
</p>

## Установка
Установить <a href="//nodejs.org">nodejs</a><br>
Установить mongodb<br>
Скачать ffmpeg и поместить ffmpeg.exe в директорию /bin/ffmpeg.exe

````
git clone git@github.com/lenchv/fpga-lab.git
npm install
````
Если возникают проблемы с установкой serialport, то выполнить следующие действия<br>
<p>
Install serial port
Make sure you have Python 2.7 installed. If you do, it may be an issue with the C++ compiler. Install Microsoft Build Tools 2015 (https://www.microsoft.com/en-us/download/details.aspx?id=48159) Then, on the cmd line change the default compiler to VS2015 :
</p>
Под администратором<br>

````
$ npm install --global windows-build-tools
$ set VCTargetsPath=C:\Program Files (x86)\MSBuild\Microsoft.Cpp\v4.0\V140
$ npm config set msvs_version 2015
$ npm i serialport
````

### Литература

Инфа по PS/2
<ul>
<li><a href="http://www.computer-engineering.org/ps2protocol/">протокол</a></li>
<li><a href="http://www.computer-engineering.org/ps2keyboard/">Клавиатура</a></li>
<li><a href="http://www.computer-engineering.org/ps2mouse/">Мышь</a></li>
<li><a href="http://www.computer-engineering.org/ps2keyboard/scancodes2.html">Скан-коды</a></li>
<li><a href="https://www.gta.ufrj.br/ensino/EEL480/spartan3/ug334.pdf">Spartan 3AN user guide</a></li>
<li><a href="http://www.xess.com/static/media/projects/ps2_ctrl.pdf">Simple PS/2</a></li>
<li><a href="https://eewiki.net/pages/viewpage.action?pageId=28278929">Keyboard VHDL example</a></li>
<li><a href="https://www.youtube.com/watch?v=A1YSbLnm4_o">Mouse VHDL example (video)</a></li>
</ul>