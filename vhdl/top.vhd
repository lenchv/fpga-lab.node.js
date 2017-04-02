library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.STD_LOGIC_UNSIGNED.ALL;
use IEEE.NUMERIC_STD.all;
entity top is
  port(
    clk_50mhz: in std_logic;
    reset: in std_logic;
    rs232_dce_txd: out std_logic;
    rs232_dce_rxd: in std_logic;
    led: out unsigned(7 downto 0)
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
  -- [ RS232 ] --
  constant system_speed: natural := 11538500;
  constant baudrate: natural := 9600;
  signal rs232_reset: std_logic;
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
  signal PLL_LOCKED_OUT: std_logic;
  -- [ FIFO ] - [ IN ] --
  signal fifo_rst : STD_LOGIC;
  signal fifo_WriteEn : STD_LOGIC;
  signal fifo_DataIn : STD_LOGIC_VECTOR (7 downto 0);
  signal fifo_ReadEn : STD_LOGIC;
  signal fifo_DataOut : STD_LOGIC_VECTOR (7 downto 0);
  signal fifo_Empty : STD_LOGIC;
  signal fifo_Full : STD_LOGIC;
  -- [ FIFO ] - [ OUT ] --
  signal fifo_out_rst : STD_LOGIC;
  signal fifo_out_WriteEn : STD_LOGIC;
  signal fifo_out_DataIn : STD_LOGIC_VECTOR (7 downto 0);
  signal fifo_out_ReadEn : STD_LOGIC;
  signal fifo_out_DataOut : STD_LOGIC_VECTOR (7 downto 0);
  signal fifo_out_Empty : STD_LOGIC;
  signal fifo_out_Full : STD_LOGIC;
  -- [ USER DEVICES ] --
  -- [ ECHO ] --
  signal echo_data_i : std_logic_vector(7 downto 0) := (others => '0');
  signal echo_stb_i : std_logic := '0';
  signal echo_ack_send_i : std_logic := '0';
  signal echo_done_i : std_logic := '0';
  signal echo_ready_receive_o : std_logic;
  signal echo_ack_rec_o : std_logic;
  signal echo_data_o : std_logic_vector(7 downto 0);
  signal echo_stb_o : std_logic;
  signal echo_package_length_o : std_logic_vector(15 downto 0);
  signal echo_ready_send_o : std_logic;

  -- [STATES] --
  signal rs232_sender_state: STATE_TYPE := S_WAIT;
  signal rs232_receiver_state: STATE_TYPE := S_WAIT;
  signal device_parser_send: PARSER_STATE_TYPE := S_AA;
  signal device_parser_receive: PARSER_STATE_TYPE := S_AA;
  signal device_send: STATE_TYPE := S_DOIT; 
  signal device_receive: STATE_TYPE := S_WAIT; 
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
begin
  -- [COMPNENT INSTANCE] --
  -- [ CLK ] --
  inst_coregen: coregen port map(
    CLKIN_IN => clk_50mhz,
    RST_IN => reset,
    CLKFX_OUT => clk_main,
    CLKIN_IBUFG_OUT => open,
    CLK0_OUT => open,
    LOCKED_OUT => PLL_LOCKED_OUT
  );
  -- [ RS232 ] - [sender] - [ Отправляет байт на com порт ] --
  inst_rs232_sender: entity work.rs232_sender
    generic map(system_speed, baudrate)
    port map(
      ack_o => rs232_sender_ack,
      clk_i => clk_main,
      dat_i => rs232_sender_dat,
      rst_i => rs232_reset,
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
      rst_i => rs232_reset,
      stb_o => rs232_receiver_stb,
      rx => rs232_dce_rxd
    );
  -- [ FIFO ] --
  -- [ Буферизирует принятые данные с com порта ] --
  inst_fifo_in: entity work.fifo
    generic map (256, 8)
    port map ( 
      CLK => clk_main,
      RST => fifo_rst,
      WriteEn => fifo_WriteEn,
      DataIn => fifo_DataIn,
      ReadEn => fifo_ReadEn,
      DataOut => fifo_DataOut,
      Empty => fifo_Empty,
      Full  => fifo_Full
    );
  -- [ Буферизирует данные для отправки на com порт ] --
  inst_fifo_out: entity work.fifo
    generic map (256, 8)
    port map ( 
      CLK => clk_main,
      RST => fifo_out_rst,
      WriteEn => fifo_out_WriteEn,
      DataIn => fifo_out_DataIn,
      ReadEn => fifo_out_ReadEn,
      DataOut => fifo_out_DataOut,
      Empty => fifo_out_Empty,
      Full  => fifo_out_Full
    );
  -- [USER DEVICES] --
  -- [ECHO] --
  inst_echo: entity work.echo 
    port map (
      data_i => echo_data_i,
      stb_i => echo_stb_i,
      ack_rec_o => echo_ack_rec_o,
      data_o => echo_data_o,
      stb_o => echo_stb_o,
      ack_send_i => echo_ack_send_i,
      done_i => echo_done_i,
      package_length_o => echo_package_length_o,
      ready_send_o => echo_ready_send_o,
      ready_receive_o => echo_ready_receive_o,
      clk => clk_main
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
  begin
    if rising_edge(clk_main) then
      fifo_out_ReadEn <= '0';      
      case rs232_sender_state is
        when S_WAIT => 
          if rs232_sender_ack = '0' and fifo_out_Empty /= '1' then
            rs232_sender_dat <= unsigned(fifo_out_DataOut);
            fifo_out_ReadEn <= '1';
            
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
  led <= unsigned(fifo_out_DataOut);
  -- [ Парсер отправки данных в устройство ] --
  parser_send_proc: process(clk_main) 
    variable i: integer := 0;
    variable code: std_logic_vector(7 downto 0) := (others => '0');
    variable len: std_logic_vector(15 downto 0) := (others => '0');
    variable byte: std_logic_vector(7 downto 0) := (others => '0');
    variable flag: boolean;
  begin
    if rising_edge(clk_main) then
      -- Считываем данные с буфера
      byte := fifo_DataOut;
      -- Сразу включаем считывание с буфера, и там где надо выключаем в дальнейшем
      fifo_ReadEn <= '1';
      -- Парсим пакет данных  
      case device_parser_send is
        -- Первый байт 0xAA
        when S_AA =>
          if fifo_Empty /= '1' then
            if byte = X"AA"  then
              echo_done_i <= '0';
              device_parser_send <= S_55;
            end if;
          end if;
        -- Второй байт 0x55
        when S_55 =>
          if fifo_Empty /= '1' then
            if byte = X"55" then
              device_parser_send <= S_LENGTH_HIGH;
            else
              device_parser_send <= S_AA;
            end if;
          end if;
        -- Старший байт длины пакета
        when S_LENGTH_HIGH =>
          if fifo_Empty /= '1' then
            len(15 downto 8) := byte;
            device_parser_send <= S_LENGTH_LOW;
          end if;
        -- Младший байт длины пакета
        when S_LENGTH_LOW =>
          if fifo_Empty /= '1' then
            len(7 downto 0) := byte;
            device_parser_send <= S_CODE;
          end if;
        -- Код устройства
        when S_CODE =>
          if fifo_Empty /= '1' then
            code := byte;
            device_parser_send <= S_DATA;
            fifo_ReadEn <= '0';
          end if;
        -- Данные
        when S_DATA =>
          -- Если длина обнулилась, значит пакет данных принят полностью
          if len = X"0000" then
            -- [ Выбираем устройство, которому нужно сообщить об успешном приеме данных ] --
            case code is
              -- Эхо устройство
              when X"01" =>
                echo_done_i <= '1';
                echo_stb_i <= '0';
              when others =>
            end case;    
            -- обнуляем состояния, и запрещаем считывание данных с буфера
            device_parser_send <= S_AA;
            device_send <= S_DOIT;
            fifo_ReadEn <= '0';
          else
            -- Передача данных устройствам
            case device_send is
              -- Передаем данные к устройству
              when S_DOIT =>
                -- [ Выбираем устройство, которому передаем данные ] --
                if fifo_Empty /= '1' then
                  case code is
                    -- Эхо устройство
                    when X"01" =>
                      if echo_ack_rec_o = '0' and echo_ready_receive_o = '1' then
                        echo_data_i <= byte;
                        echo_stb_i <= '1';
                        len := len - '1';
                        device_send <= S_WAIT;
                      else
                        fifo_ReadEn <= '0';
                      end if;
                    -- Если устройство не найдено, то реинициализация    
                    when others =>
                      fifo_ReadEn <= '0';
                      device_parser_send <= S_AA;
                      device_send <= S_DOIT;
                  end case;
                end if;
              -- Ждем успешного принятия данных
              when S_WAIT =>
                -- [ Выбираем устройство ] --
                case code is
                  when X"01" =>
                    fifo_ReadEn <= '0';
                    echo_stb_i <= '0';
                    if echo_ack_rec_o = '1' then
                      device_send <= S_DOIT;
                    end if;
                  -- Если устройство не найдено, то реинициализация    
                  when others =>
                    fifo_ReadEn <= '0';
                    device_parser_send <= S_AA;
                    device_send <= S_DOIT;
                end case;
            end case;
          end if;  
      end case;
    end if;
  end process;

  -- [ Парсер приема данных от устройства ] -- 
  parser_receive_proc: process(clk_main)
    variable i: integer := 0;
    variable code: std_logic_vector(7 downto 0) := (others => '0');
    variable len: std_logic_vector(15 downto 0) := (others => '0'); 
    variable resolve_receive: boolean;
   begin
    if rising_edge(clk_main) and fifo_out_Full /= '1' then
      resolve_receive := false;
      -- Выбираем устройство, которое готово передавать данные
      -- [ Эхо устройство ]
      if echo_ready_send_o = '1' then
        resolve_receive := true;
        code := X"01";
      end if;
      --
      if resolve_receive then
        case device_receive is
          when S_WAIT =>
            --   
            case code is
              -- [ Эхо устройство ]
              when X"01" =>
                echo_ack_send_i <= '1';
                if echo_stb_o = '1' then
                  echo_ack_send_i <= '0';
                  len := echo_package_length_o;
                  device_receive <= S_DOIT;
                end if;
              when others =>
            end case;
          when S_DOIT =>
            fifo_out_WriteEn <= '1';
            case device_parser_receive is
              when S_AA =>
                fifo_out_DataIn <= X"AA";
                device_parser_receive <= S_55;
              when S_55 =>
                fifo_out_DataIn <= X"55";
                device_parser_receive <= S_LENGTH_HIGH;
              when S_LENGTH_HIGH =>
                fifo_out_DataIn <= len(15 downto 8);
                device_parser_receive <= S_LENGTH_LOW;
              when S_LENGTH_LOW =>
                fifo_out_DataIn <= len(7 downto 0);
                device_parser_receive <= S_CODE;
              when S_CODE =>
                -- 
                case code is
                  -- [Эхо устройство]
                  when X"01" =>
                    echo_ack_send_i <= '1';
                  when others =>
                      device_receive <= S_WAIT;
                      device_parser_receive <= S_AA;
                      fifo_out_WriteEn <= '0';
                end case;
              
                fifo_out_DataIn <= code;
                device_parser_receive <= S_DATA;
              when S_DATA =>
                -- 
                case code is
                  -- [Эхо устройство]
                  when X"01" =>
                    if echo_stb_o = '1' then
                      fifo_out_DataIn <= echo_data_o;
                    else
                      echo_ack_send_i <= '0';
                      device_receive <= S_WAIT;
                      device_parser_receive <= S_AA;
                      fifo_out_WriteEn <= '0';
                    end if;
                  when others =>
                end case;
            end case;
        end case;
      end if;
    end if;
   end process;
  
end Behavioral;