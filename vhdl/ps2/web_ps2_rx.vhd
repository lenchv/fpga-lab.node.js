-- Иммитация передачи байта от устройства к хосту по протоколу PS/2
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use ieee.numeric_std.all;
use IEEE.STD_LOGIC_UNSIGNED.ALL;
entity web_ps2_rx is
  generic (
    constant MAIN_FREQ: positive := 50_000_000;
    constant FREQ_DIVIDER: positive := 20_000 -- 10 kHz, clock PS/2 = 10 - 16.7 kHz
  );
  port (
    clk, reset: in std_logic;
    ps2d, ps2c: out std_logic;
    rx_en: in std_logic;
    rx_done: out std_logic;
    data_i: in std_logic_vector(7 downto 0)
  );
end web_ps2_rx;

architecture Behavioral of web_ps2_rx is
  constant max_ps2_counter : natural := MAIN_FREQ / FREQ_DIVIDER; 
  signal ps2_counter: natural range 0 to max_ps2_counter := 0; -- счетчик для генерации частоты устройства  
  
  type state_type is (s_wait, s_data, s_end);
  signal state: state_type := s_wait;
  signal bit_count: unsigned(3 downto 0); -- bit counter - data + parity + stop
  signal buff: std_logic_vector(9 downto 0);

  signal ris_edge, fall_edge, rx_en_edge: std_logic;

  signal rx_en_reg: std_logic_vector(1 downto 0); 
begin
  inst_ps2_clk: entity work.web_ps2_clk
    port map(
      clk => clk,
      reset => reset,
      en => rx_en,
      ps2_clk => ps2c,
      rising => ris_edge,
      falling => fall_edge
    );

  proc_detect_en: process(clk, reset)
  begin
    if reset = '1' then
      rx_en_reg <= (others => '0');
    elsif rising_edge(clk) then
      rx_en_reg <= rx_en_reg(0) & rx_en;
    end if;
  end process;
  rx_en_edge <= '1' when rx_en_reg(1) = '0' and rx_en_reg(0) = '1' else '0';

  proc_rx: process(clk, reset)
  begin
    if reset = '1' then
      state <= s_wait;
      bit_count <= (others => '0');
      rx_done <= '0';
    elsif rising_edge(clk) then
      rx_done <= '0';
      case state is
        when s_wait =>
          -- ждем включения
          if rx_en_edge = '1' then
            state <= s_data;
            buff <= '1' -- stop bit
              & (not (data_i(0) xor data_i(1) xor data_i(2) xor data_i(3)  -- parity
                 xor data_i(4) xor data_i(5) xor data_i(6) xor data_i(7)))
              & data_i; -- data
            ps2d <= '0'; -- start bit
            bit_count <= "1001";
          end if;
        when s_data =>
          -- по фронту клока пс/2 передаем бит данных
          if ris_edge = '1' then
            ps2d <= buff(0); -- data bit
            buff <= '0' & buff(9 downto 1);
            if bit_count = "000" then
              state <= s_end;
            else
              bit_count <= bit_count - 1;  
            end if;
          end if;
        when s_end =>
          if fall_edge = '1' then
            rx_done <= '1';
            state <= s_wait;
          end if;
      end case;
    end if;
  end process;
end Behavioral;
--------------------------------------------------------------------------------------------------------------------------------------------------
--          IDLE           100us                                                                                                     IDLE
--               |      |         |                                                                                                | 
--           ____|______|     ____|     ____      ____      ____      ____      ____      ____      ____      ____      ____      _|___ 
-- CLK           |      |____|    |____|    |____|    |____|    |____|    |____|    |____|    |____|    |____|    |____|    |____| |
--           ____|      |      ___|____  ________  ________  ________  ________  ________  ________  ________  ________  __________|____  
-- DATA          |______| S __<___|D0 _><___ D1 _><___ D2 _><___ D3 _><__ D4 __><__ D5 __><__ D6 __><__ D7 __><___ P __>/    S     |      
--               |      |         |                                                                                                |
--                _________________________________________________________________________________________________________________
-- TX_EN     ____|                                                                                                                 |___
---------------------------------------------------------------------------------------------------------------------------------------------------