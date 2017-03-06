# FPGA лаборатория
<p>
Цель проекта: удаленное управление fpga-стендом.
</p>

###Эмулируемые устройства
клавиатура, мышь, кнопки (switches, buttons, rotary)<br>

###Протокол обмена с платой
<code>
server -> board <br>
0x55 0xAA &lt;len&gt; &lt;addr&gt; &lt;data&gt; <br>
 <br>
board -> server <br>
0x55 0xAA &lt;len&gt; &lt;addr&gt; &lt;data&gt;  <br>
 <br>
&lt;addr&gt; => CODE_DEV <br>
</code> <br>

##План действий

###Неделя 1
<ol>
<li> Видеотрансляция</li>
<li> Загрузка файлов на сервер</li>
<li> Работа с ком-портом</li>
  <ul>
  <li> Формирование пкета</li>
  <li> Прием / передача пакета</li>
  </ul>
<li> additional: Запуск exe</li>
</ol>

###Заметки

Для rotary использовать код Грея

##Установка
Установить <a href="//nodejs.org">nodejs</a><br>
Установить mongodb<br>
Скачать ffmpeg и поместить ffmpeg.exe в директорию /bin/ffmpeg.exe
<code>git clone git@github.com/lenchv/fpga-lab.git</code><br>
<code>npm install</code><br>
Если возникают проблемы с установкой serialport, то выполнить следующие действия<br>
<p>
Install serial port
Make sure you have Python 2.7 installed. If you do, it may be an issue with the C++ compiler. Install Microsoft Build Tools 2015 (https://www.microsoft.com/en-us/download/details.aspx?id=48159) Then, on the cmd line change the default compiler to VS2015 :
</p>
Под администратором<br>
<code>$ npm install --global windows-build-tools</code><br>
<code>$ set VCTargetsPath=C:\Program Files (x86)\MSBuild\Microsoft.Cpp\v4.0\V140</code><br>
<code>$ npm config set msvs_version 2015</code><br>
<code>$ npm i serialport</code><br>

### Заметки на будущее

Сделавть рестарт ффмпег, в случае его падения