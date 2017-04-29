library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.STD_LOGIC_UNSIGNED.ALL;
use IEEE.NUMERIC_STD.all;
use std.textio.all;
use ieee.std_logic_textio.all;

entity top is
  port(
    clk_50mhz: in std_logic;
    rs232_dce_txd: out std_logic;
    rs232_dce_rxd: in std_logic;
    led: out std_logic_vector(7 downto 0);
    buttons: in std_logic_vector(7 downto 0);
    -- ROTARY
    rot_a: in std_logic;
    rot_b: in std_logic;
    rot_center: in std_logic;
    -- PS/2
    PS2_CLK1: inout std_logic;
    PS2_DATA1: inout std_logic;
    PS2_CLK2: inout std_logic;
    PS2_DATA2: inout std_logic
  );
end top;

architecture Behavioral of top is
  -- [ TYPES ] --
  -- [ TYPES ] - [Общий тип состояний] --
  type STATE_TYPE is (
    S_DOIT,
    S_WAIT
  );
  -- [ TYPES ] - [Тип состояний для парсера] - [Формат 0xAA 0x55 <длина 2 байта> <код устройства> <данные>] --
  type PARSER_STATE_TYPE is (
    S_AA,
    S_55,
    S_LENGTH_HIGH,
    S_LENGTH_LOW,
    S_CODE,
    S_DATA
  );
  -- [TYPES] - [Тип состояний для считывания с буфера] --
  type BUFFER_READ_STATE_TYPE is (
    S_WAIT_BYTE,
    S_BYTE_READY,
    S_READ_BYTE
  );
  -- [ RESET ] -- [ Инициализирует устройства ]
  signal reset: std_logic := '1';
  -- [ RS232 ] --
  constant system_speed: natural := 11538500;
  constant baudrate: natural := 9600;
  -- [ RS232 ] - [ receiver ] --
  signal rs232_receiver_ack: std_logic := '0';
  signal rs232_receiver_dat: unsigned(7 downto 0) := (others => '0');
  signal rs232_receiver_stb: std_logic := '0';
  -- [ RS232 ] - [ sender ] --
  signal rs232_sender_ack: std_logic := '0';
  signal rs232_sender_dat: unsigned(7 downto 0);
  signal rs232_sender_stb: std_logic := '0';
  -- [ CLK ] --
  signal clk_main: std_logic;
  -- [ FIFO ] - [ IN ] --
  signal fifo_WriteEn : STD_LOGIC;
  signal fifo_DataIn : STD_LOGIC_VECTOR (7 downto 0);
  signal fifo_ReadEn : STD_LOGIC;
  signal fifo_DataOut : STD_LOGIC_VECTOR (7 downto 0);
  signal fifo_Empty : STD_LOGIC;
  signal fifo_Full : STD_LOGIC;
  -- [ FIFO ] - [ OUT ] --
  signal fifo_out_WriteEn : STD_LOGIC;
  signal fifo_out_DataIn : STD_LOGIC_VECTOR (7 downto 0);
  signal fifo_out_ReadEn : STD_LOGIC;
  signal fifo_out_DataOut : STD_LOGIC_VECTOR (7 downto 0);
  signal fifo_out_Empty : STD_LOGIC;
  signal fifo_out_Full : STD_LOGIC;
  -- [ USER DEVICES ] --
  -- [ ECHO ] --
--  signal echo_data_i : std_logic_vector(7 downto 0) := (others => '0');
--  signal echo_stb_i : std_logic := '0';
--  signal echo_ack_send_i : std_logic := '0';
--  signal echo_done_i : std_logic := '0';
--  signal echo_ready_receive_o : std_logic;
--  signal echo_ack_rec_o : std_logic;
--  signal echo_data_o : std_logic_vector(7 downto 0);
--  signal echo_stb_o : std_logic;
--  signal echo_package_length_o : std_logic_vector(15 downto 0);
--  signal echo_ready_send_o : std_logic;
  signal echo_data_i : std_logic_vector(7 downto 0) := (others => '0');
  signal echo_data_o : std_logic_vector(7 downto 0);
  signal echo_package_length_o : std_logic_vector(3 downto 0);
  signal echo_read_i : std_logic := '0';
  signal echo_write_i : std_logic := '0';
  signal echo_full_o : std_logic := '0';
  signal echo_empty_o : std_logic := '0';
  signal echo_read_state: BUFFER_READ_STATE_TYPE := S_WAIT_BYTE;
  -- [ WEB_LED ] --
  signal led_o: std_logic_vector(7 downto 0) := (others => '0');
  signal led_i: std_logic_vector(7 downto 0) := (others => '0');
  signal led_ack: std_logic := '0';
  signal led_strobe: std_logic := '0';
  -- [ WEB_BUTTON ] -- [ реализован только одним сигналом, который связывает переданный байт от сервера с пользовательским кодом ]
  signal button_data_o: std_logic_vector(7 downto 0) := (others => '0');
  signal button_rs232_data_i: std_logic_vector(7 downto 0) := (others => '0');
  -- [ WEB_ROTARY ] -- [] -- 
  signal web_rotary_rot_a_i: std_logic := '0';
  signal web_rotary_rot_b_i: std_logic := '0';
  signal web_rotary_rot_center_i: std_logic := '0';
  signal web_rotary_rot_a_o: std_logic := '0';
  signal web_rotary_rot_b_o: std_logic := '0';
  signal web_rotary_rot_center_o: std_logic := '0';
  -- [ WEB_OUTPUT ] -- [  ] --
  signal web_output_write_i: std_logic := '0';
  signal web_output_data_i: std_logic_vector(7 downto 0) := (others => '0');
  signal web_output_read_i: std_logic := '0';
  signal web_output_data_o: std_logic_vector(7 downto 0) := (others => '0');
  signal web_output_empty_o: std_logic := '0';
  signal web_output_full_o: std_logic := '0';
  signal web_output_ready_i: std_logic := '0';
  signal web_output_read_state: BUFFER_READ_STATE_TYPE := S_WAIT_BYTE;
  -- [ WEB_KEYBOARD ] -- [] --
  signal web_kbd_busy: std_logic := '0';
  signal web_kbd_data_i: std_logic_vector(7 downto 0) := (others => '0');
  signal web_kbd_rx_en: std_logic := '0';
  signal web_kbd_rx_done: std_logic := '0';
  signal web_kbd_data_o: std_logic_vector(7 downto 0) := (others => '0');
  signal web_kbd_tx_done: std_logic := '0';
  signal web_kbd_ps2d: std_logic := 'Z';
  signal web_kbd_ps2c: std_logic := 'Z';
  -- [ /USER DEVICES ] --

  -- [STATES] --
  signal rs232_sender_state: STATE_TYPE := S_WAIT;
  signal rs232_receiver_state: STATE_TYPE := S_WAIT;
  signal device_parser_send: PARSER_STATE_TYPE := S_AA;
  signal device_parser_receive: PARSER_STATE_TYPE := S_AA;
  signal device_send: STATE_TYPE := S_DOIT; 
  signal device_receive: STATE_TYPE := S_WAIT; 

  signal buffer_in_read_state: BUFFER_READ_STATE_TYPE := S_WAIT_BYTE;
  signal buffer_out_read_state: BUFFER_READ_STATE_TYPE := S_WAIT_BYTE;
  -- [COMPONENTS] --
  -- [COMPONENTS] - [ Clock generator ] --
  component coregen
    PORT(
      CLKIN_IN : IN std_logic;
      RST_IN : IN std_logic;          
      CLKFX_OUT : OUT std_logic;
      CLKIN_IBUFG_OUT : OUT std_logic;
      CLK0_OUT : OUT std_logic;
      LOCKED_OUT : OUT std_logic
    );
  end component;
  signal PLL_LOCKED_OUT: std_logic;
begin
  -- [COMPNENT INSTANCE] --
  -- [ CLK ] --
  inst_coregen: coregen port map(
    CLKIN_IN => clk_50mhz,
    RST_IN => '0',
    CLKFX_OUT => clk_main,
    CLKIN_IBUFG_OUT => open,
    CLK0_OUT => open,
    LOCKED_OUT => PLL_LOCKED_OUT
  );
  --clk_main <= clk_50mhz;
  -- [ RS232 ] - [sender] - [ Отправляет байт на com порт ] --
  inst_rs232_sender: entity work.rs232_sender
    generic map(system_speed, baudrate)
    port map(
      ack_o => rs232_sender_ack,
      clk_i => clk_main,
      dat_i => rs232_sender_dat,
      rst_i => reset,
      stb_i => rs232_sender_stb,
      tx => rs232_dce_txd
    );
  -- [ RS232 ] - [receiver] - [ Принимает байт с com порта ] --
  inst_rs232_receiver: entity work.rs232_receiver
    generic map(system_speed, baudrate)
    port map(
      ack_i => rs232_receiver_ack,
      clk_i => clk_main,
      dat_o => rs232_receiver_dat,
      rst_i => reset,
      stb_o => rs232_receiver_stb,
      rx => rs232_dce_rxd
    );
  -- [ FIFO ] --
  -- [ Буферизирует принятые данные с com порта ] --
  inst_fifo_in: entity work.fifo
    generic map (64, 8)
    port map ( 
      CLK => clk_main,
      RST => reset,
      WriteEn => fifo_WriteEn,
      DataIn => fifo_DataIn,
      ReadEn => fifo_ReadEn,
      DataOut => fifo_DataOut,
      Empty => fifo_Empty,
      Full  => fifo_Full
    );
  -- [ Буферизирует данные для отправки на com порт ] --
  inst_fifo_out: entity work.fifo
    generic map (64, 8)
    port map ( 
      CLK => clk_main,
      RST => reset,
      WriteEn => fifo_out_WriteEn,
      DataIn => fifo_out_DataIn,
      ReadEn => fifo_out_ReadEn,
      DataOut => fifo_out_DataOut,
      Empty => fifo_out_Empty,
      Full  => fifo_out_Full
    );
  -- [USER DEVICES] --
  -- [ECHO] - [0x01] --
  inst_echo: entity work.echo
    port map (
      clk => clk_main,
      reset => reset,

      data_i => echo_data_i,
      data_o => echo_data_o,
      length_o => echo_package_length_o,
      read_i => echo_read_i,
      write_i => echo_write_i,
      full_o => echo_full_o,
      empty_o => echo_empty_o
    );
  -- [ WEB_LED ] - [0x02]  --
  inst_web_led: entity work.web_led
    port map (
      data_o => led_o,
      data_i => led_i,
      ack_i => led_ack,
      strobe_o => led_strobe,
      rst_i => reset,
      clk => clk_main
    );
  led <= led_o; -- физические светодиоды
  -- [ WEB_BUTTON ] - [0x03] --
  inst_web_button: entity work.web_button
    port map (
      data_o => button_data_o,
      rs232_data_i => button_rs232_data_i,
      physical_data_i => buttons,
      rst_i => reset,
      clk => clk_main
    );
  -- [ WEB_ROTARY ] -- [0x04] --
  inst_web_rotary: entity work.web_rotary
    port map (
      rot_a_o => web_rotary_rot_a_o,
      rot_b_o => web_rotary_rot_b_o,
      rot_center_o => web_rotary_rot_center_o,
      rot_a_i => rot_a,
      rot_b_i => rot_b,
      rot_center_i => rot_center,
      rot_a_rs232_i => web_rotary_rot_a_i,
      rot_b_rs232_i => web_rotary_rot_b_i,
      rot_center_rs232_i => web_rotary_rot_center_i,
      rst_i => reset,
      clk => clk_main
    );
  -- [ WEB_OUTPUT ] - [0x05] -- [ Вывод данных в консоль браузера ] --
  inst_web_output: entity work.fifo
    generic map (8, 8)
    port map ( 
      CLK => clk_main,
      RST => reset,

      WriteEn => web_output_write_i,
      DataIn => web_output_data_i,
      ReadEn => web_output_read_i,
      DataOut => web_output_data_o,
      Empty => web_output_empty_o,
      Full  => web_output_full_o
    );
  -- [ WEB_KEYBOARD ] - [ 0x06 ] - [ Иммитатор клавиатуры ]
  inst_web_keyboard: entity work.web_keyboard
  port map(
    clk => clk_main,
    rst => reset,
    busy => web_kbd_busy,
    data_i => web_kbd_data_i,
    rx_en => web_kbd_rx_en,
    rx_done => web_kbd_rx_done,
    data_o => web_kbd_data_o,
    tx_done => web_kbd_tx_done,
    ps2d => web_kbd_ps2d,
    ps2c => web_kbd_ps2c
  );
  -- [PROCESS STATEMENTS] --

  -- [ Обработчик принятия байта с COM порта] --
  rs232_receive_proc: process(clk_main)
  begin
    if rising_edge(clk_main) then
      case rs232_receiver_state is
        -- ожидаем взвода strobe
        when S_WAIT =>
          fifo_WriteEn <= '0';  
          if rs232_receiver_stb = '1' then
             -- переход к ожиданию окончания считывания байта
            rs232_receiver_state <= S_DOIT;
            rs232_receiver_ack <= '1';
          end if;
        -- ожидаем окончание принятия байта
        when S_DOIT => 
        if rs232_receiver_stb <= '0' then
          rs232_receiver_ack <= '0';
          -- Если буффер не полон, то записываем туда принятый байт
          if fifo_Full /= '1' then
            fifo_DataIn <= std_logic_vector(rs232_receiver_dat);
            fifo_WriteEn <= '1';
          end if;
          -- ожидаем следующий байт
          rs232_receiver_state <= S_WAIT;
        end if;
      end case;
    end if;
  end process;

  -- [ Обработчик передачи байта на COM порт] --
  rs232_send_proc: process(clk_main)
    variable byte: std_logic_vector(7 downto 0) := (others => '0');
    variable has_byte: boolean := false;
  begin
    if rising_edge(clk_main) then
      case buffer_out_read_state is
        when S_WAIT_BYTE =>
          if fifo_out_Empty /= '1' and has_byte = false then
            fifo_out_ReadEn <= '1';
            buffer_out_read_state <= S_BYTE_READY;
          end if;
        when S_BYTE_READY =>
          buffer_out_read_state <= S_READ_BYTE;
          fifo_out_ReadEn <= '0';
        when S_READ_BYTE =>
          has_byte := true;
          byte := fifo_out_DataOut;
          buffer_out_read_state <= S_WAIT_BYTE;
      end case;

      case rs232_sender_state is
        when S_WAIT => 
          if rs232_sender_ack = '0' and has_byte then
            has_byte := false;
            rs232_sender_dat <= unsigned(byte);
            rs232_sender_stb <= '1';
            rs232_sender_state <= S_DOIT;
          end if;
        when S_DOIT => 
          if rs232_sender_ack = '1' then
            rs232_sender_stb <= '0';
            rs232_sender_state <= S_WAIT;
          end if;
      end case;
    end if;
  end process;
  -- [ Парсер отправки данных в устройство ] --
  parser_send_proc: process(clk_main) 
    -- variable i: integer := 0;
    variable code: std_logic_vector(7 downto 0) := (others => '0');
    variable len: std_logic_vector(15 downto 0) := (others => '0');
    variable byte: std_logic_vector(7 downto 0) := (others => '0');
    variable flag: boolean;

    variable has_byte: boolean := false;
  begin
    if rising_edge(clk_main) then
      -- Считываем данные с буфера
      case buffer_in_read_state is
        -- если есть байт для считывания, то указываем на считывание
        when S_WAIT_BYTE =>
          if fifo_Empty /= '1' and has_byte = false then
            fifo_ReadEn <= '1';
            buffer_in_read_state <= S_BYTE_READY;
          end if;
        -- такт считывания
        when S_BYTE_READY =>
          fifo_ReadEn <= '0';
          buffer_in_read_state <= S_READ_BYTE;
        -- забираем байт
        when S_READ_BYTE =>
          byte := fifo_DataOut; 
          has_byte := true;
          buffer_in_read_state <= S_WAIT_BYTE;
      end case;
      -- Парсим пакет данных  
      case device_parser_send is
        -- Первый байт 0xAA
        when S_AA =>
          if has_byte then
            has_byte := false;
            if byte = X"AA"  then
              device_parser_send <= S_55;
            end if;
          end if;
        -- Второй байт 0x55
        when S_55 =>
          if has_byte then
            has_byte := false;
            if byte = X"55" then
              device_parser_send <= S_LENGTH_HIGH;
            else
              device_parser_send <= S_AA;
            end if;
          end if;
        -- Старший байт длины пакета
        when S_LENGTH_HIGH =>
          if has_byte then
            has_byte := false;
            len(15 downto 8) := byte;
            device_parser_send <= S_LENGTH_LOW;
          end if;
        -- Младший байт длины пакета
        when S_LENGTH_LOW =>
          if has_byte then
            has_byte := false;
            len(7 downto 0) := byte;
            device_parser_send <= S_CODE;
          end if;
        -- Код устройства
        when S_CODE =>
          if has_byte then
            has_byte := false;
            code := byte;
            device_parser_send <= S_DATA;
          end if;
        -- Данные
        when S_DATA =>
          -- Если длина обнулилась, значит пакет данных принят полностью
          if len = X"0000" then
            -- обнуляем состояния, и запрещаем считывание данных с буфера
            device_parser_send <= S_AA;
            device_send <= S_DOIT;
          else
            -- Передача данных устройствам
            case device_send is
              -- Передаем данные к устройству
              when S_DOIT =>
                -- [ Выбираем устройство, которому передаем данные ] --
                  case code is
                    -- Эхо устройство
                    when X"01" =>
                      if 
                        echo_full_o = '0'
                        and
                        has_byte
                      then
                        has_byte := false;
                        echo_data_i <= byte;
                        echo_write_i <= '1';
                        device_send <= S_WAIT;
                      end if;
                    -- Buttons
                    when X"03" =>
                      if has_byte then
                        has_byte := false;
                        button_rs232_data_i <= byte;
                        device_send <= S_WAIT;
                      end if;
                    when X"04" =>
                      if has_byte then
                        has_byte := false;
                        web_rotary_rot_a_i <= byte(0);
                        web_rotary_rot_b_i <= byte(1);
                        web_rotary_rot_center_i <= byte(2);
                        device_send <= S_WAIT;
                      end if;
                    -- Keyboard
                    when X"06" =>
                      if has_byte and web_kbd_busy = '0' then
                        has_byte := false;
                        web_kbd_data_i <= byte;
                        web_kbd_rx_en <= '1';
                        device_send <= S_WAIT;
                      end if;
                    -- Если устройство не найдено, то реинициализация    
                    when others =>
                      device_parser_send <= S_AA;
                      device_send <= S_DOIT;
                  end case;
              -- Ждем успешного принятия данных
              when S_WAIT =>
                -- [ Выбираем устройство ] --
                case code is
                  when X"01" =>
                    echo_write_i <= '0';
                    len := len - '1';
                    device_send <= S_DOIT;
                  -- Buttons
                  when X"03" =>
                    len := len - '1';
                    device_send <= S_DOIT;  
                  -- Rotary
                  when X"04" =>
                    len := len - '1';
                    device_send <= S_DOIT;
                  -- Keyboard
                  when X"06" =>
                    if web_kbd_rx_done = '1' then
                      len := len - '1';
                      web_kbd_rx_en <= '0';
                      device_send <= S_DOIT;
                    end if;
                  -- Если устройство не найдено, то реинициализация    
                  when others =>
                    device_parser_send <= S_AA;
                    device_send <= S_DOIT;
                end case;
            end case;
          end if;  
      end case;
    end if;
  end process;

  -- [ Парсер приема данных от устройства ] -- 
  parser_receive_proc: process(clk_main, reset)
    variable code: std_logic_vector(7 downto 0) := (others => '0');
    variable len: std_logic_vector(15 downto 0) := (others => '0'); 
    variable resolve_receive: boolean := false;
    variable was_full: boolean := false;
    variable has_byte: boolean := false;
  begin
    if reset = '1' then
      code := X"00";
      len := X"0000";
      resolve_receive := false;
      fifo_out_WriteEn <= '0';
      device_receive <= S_WAIT;
      device_parser_receive <= S_AA;
      echo_read_state <= S_WAIT_BYTE;
      web_output_read_state <= S_WAIT_BYTE;
      has_byte := false;
    elsif rising_edge(clk_main) then
      fifo_out_WriteEn <= '0';
      if has_byte then
        if fifo_out_Full /= '1' then
          fifo_out_WriteEn <= '1';
          has_byte := false;
        end if;
      else
        case device_receive is
          when S_WAIT =>
            code := X"00";
            -- Выбираем устройство, которое готово передавать данные
            -- [ ECHO ]
            if echo_empty_o = '0' then
              code := X"01";
              len := X"000" & echo_package_length_o;
              echo_read_state <= S_WAIT_BYTE;
              device_receive <= S_DOIT;
            -- [ LED ] --
            elsif led_strobe = '1' then
              code := X"02";
              len := X"0001";
              device_receive <= S_DOIT;
            -- [ WEB_OUTPUT ] --
            elsif web_output_empty_o /= '1' then
              code := X"05";
              len := X"0001";
              device_receive <= S_DOIT;
            -- [ WEB_KEYBOARD ] --
            elsif web_kbd_tx_done = '1' then
              code := X"06";
              len := X"0001";
              device_receive <= S_DOIT;
            end if;
          when S_DOIT =>
            case device_parser_receive is
              when S_AA =>
                fifo_out_DataIn <= X"AA";
                device_parser_receive <= S_55;
                has_byte := true;
              when S_55 =>
                fifo_out_DataIn <= X"55";
                device_parser_receive <= S_LENGTH_HIGH;
                has_byte := true;
              when S_LENGTH_HIGH =>
                fifo_out_DataIn <= len(15 downto 8);
                device_parser_receive <= S_LENGTH_LOW;
                has_byte := true;
              when S_LENGTH_LOW =>
                fifo_out_DataIn <= len(7 downto 0);
                device_parser_receive <= S_CODE;
                has_byte := true;
              when S_CODE =>
                fifo_out_DataIn <= code;
                device_parser_receive <= S_DATA;
                has_byte := true;
              when S_DATA =>
                case code is
                  -- [Эхо устройство]
                  when X"01" =>
                    case echo_read_state is
                      when S_WAIT_BYTE =>
                        echo_read_i <= '1';
                        echo_read_state <= S_BYTE_READY;
                      when S_BYTE_READY =>  
                        echo_read_i <= '0';
                        echo_read_state <= S_READ_BYTE;
                      when S_READ_BYTE =>  
                        fifo_out_DataIn <= echo_data_o;
                        echo_read_state <= S_WAIT_BYTE;
                        has_byte := true;
                        len := len - 1;
                        if unsigned(len) = X"0000" then
                          device_parser_receive <= S_AA;
                          device_receive <= S_WAIT;
                        end if;
                    end case;
                  -- [ LED ] --
                  when X"02" =>
                    if led_strobe = '1' then
                      led_ack <= '1';
                      fifo_out_DataIn <= led_o;
                      has_byte := true;
                    else
                      led_ack <= '0';
                      device_receive <= S_WAIT;
                      device_parser_receive <= S_AA;
                    end if;
                  when X"05" =>
                    case web_output_read_state is
                      when S_WAIT_BYTE =>
                        web_output_read_i <= '1';
                        web_output_read_state <= S_BYTE_READY;
                      when S_BYTE_READY =>  
                        web_output_read_i <= '0';
                        web_output_read_state <= S_READ_BYTE;
                      when S_READ_BYTE =>  
                        fifo_out_DataIn <= web_output_data_o;
                        web_output_read_state <= S_WAIT_BYTE;
                        has_byte := true;
                        len := len - 1;
                        if unsigned(len) = X"0000" then
                          device_parser_receive <= S_AA;
                          device_receive <= S_WAIT;
                        end if;
                    end case;
                  -- [WEB_KEYBOARD] --
                  when X"06" =>
                    fifo_out_DataIn <= web_kbd_data_o;
                    has_byte := true;
                    device_receive <= S_WAIT;
                    device_parser_receive <= S_AA;
                  when others =>
                    device_receive <= S_WAIT;
                    device_parser_receive <= S_AA;
                    fifo_out_WriteEn <= '0';
                end case; -- code
            end case; -- device_parser_receive
        end case; -- device_receive
      end if;
    end if;
  end process;

  web_output_ready_i <= not web_output_full_o;
  -- USER CODE
  inst_user_code: entity work.user_code
    port map(
      -- [ LED ] --
      led => led_i,
      -- [ BUTTONS ] --
      buttons => button_data_o,
      -- [ WEB_OTPUT ] --
      web_output_write_o => web_output_write_i,
      web_output_data_o => web_output_data_i,
      web_output_ready_i => web_output_ready_i,

      rot_a => web_rotary_rot_a_o,
      rot_b => web_rotary_rot_b_o,
      rot_center => web_rotary_rot_center_o, 

      web_ps2_kbd_data => web_kbd_ps2d,
      web_ps2_kbd_clk => web_kbd_ps2c,
      
      ps2_data1 => PS2_DATA1,
      ps2_clk1 => PS2_CLK1,
      ps2_data2 => PS2_DATA2,
      ps2_clk2 => PS2_CLK2,

      reset_o => reset,
      clk => clk_main
    );

end Behavioral;