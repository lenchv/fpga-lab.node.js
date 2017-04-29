-- Иммитация передачи байта от устройства к хосту по протоколу PS/2
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use ieee.numeric_std.all;
use IEEE.STD_LOGIC_UNSIGNED.ALL;
entity web_ps2_tx is
  generic (
    constant MAIN_FREQ: positive := 50_000_000;
    constant FREQ_DIVIDER: positive := 20_000 -- 10 kHz, clock PS/2 = 10 - 16.7 kHz
  );
  port (
    clk, reset: in std_logic;              -- System clock and reset
    ps2d, ps2c: out std_logic;             -- PS/2 data and clock signals
    tx_en: in std_logic;                   -- Receiver enabled/disabled signal
    tx_done: out std_logic;                -- End of transmission signal
    din: in std_logic_vector(7 downto 0)   -- Input buffer
  );
end web_ps2_tx;

architecture Behavioral of web_ps2_tx is
  constant max_ps2_counter : natural := MAIN_FREQ / FREQ_DIVIDER; 
  signal ps2_counter: natural range 0 to max_ps2_counter := 0; -- счетчик для генерации частоты устройства 
  -- State machine
  type state is (idle, data, done);
  signal state_reg, state_next: state;
  -- Counter from 10 to 0 - 4 bits should be enough
  signal counter_reg, counter_next: unsigned(3 downto 0);

  -- Data buffer
  signal buf_reg, buf_next: std_logic_vector(9 downto 0);

  -- Rising edge detector signals
  signal ris_edge, fall_edge, ris_tx_en: std_logic;
  signal ps2_edge, tx_en_edge: std_logic_vector(1 downto 0);

  signal ps2_clock: std_logic := '1';
  signal ps2_data: std_logic := '1';

  signal tx_enable: std_logic;
begin
  ps2d <= ps2_data when tx_enable = '1' else 'Z';
  ps2c <= ps2_clock when tx_enable = '1' else 'Z';

  clk_gen: process(clk, reset, ris_tx_en)
  begin
    if ris_tx_en = '1' then
      ps2_clock <= '1';
    elsif reset = '1' then
      --ps2_clock <= 'Z';
      ps2_counter <= 0;
    elsif rising_edge(clk) then
      if tx_enable = '1' then        
        if ps2_counter = max_ps2_counter then
          ps2_counter <= 0;
          ps2_clock <= not ps2_clock;
        else
          ps2_counter <= ps2_counter + 1;
        end if;
      else
        -- ps2_clock <= 'L';
        ps2_counter <= 0;
      end if;
	 end if;
  end process;
  -- rising edge detector with shift buffer
  edge_detector: process(clk, reset)
  begin
    if reset = '1' then
      ps2_edge <= (others => '0');
      tx_en_edge <= (others => '0');
    elsif rising_edge(clk) then
      ps2_edge <= ps2_edge(0) & ps2_clock;
      tx_en_edge <= tx_en_edge(0) & tx_en;
    end if;
  end process;
  ris_edge <= '1' when ps2_edge(1) = '0' and ps2_edge(0) = '1' else '0';
  fall_edge <= '1' when ps2_edge(1) = '1' and ps2_edge(0) = '0' else '0';
  ris_tx_en <= '1' when tx_en_edge(1) = '0' and tx_en_edge(0) = '1' else '0';
  tx_enable <= '1' when tx_en_edge(1) = '1' and tx_en_edge(0) = '1' else '0';
  
  -- clock based state changer
  clk_process: process(clk, reset)
  begin
    if reset = '1' then
      state_reg <= idle;
      buf_reg <= (others => '0');
      counter_reg <= (others => '0');
    elsif rising_edge(clk) then
      state_reg <= state_next;
      buf_reg <= buf_next;
      counter_reg <= counter_next;
    end if;
  end process;

  state_machine: process(state_reg, ris_edge, fall_edge)
  begin
    -- setting default values
    state_next <= state_reg;
    buf_next <= buf_reg;
    counter_next <= counter_reg;
    tx_done <= '0';
    if tx_en='1' then
      case (state_reg) is
        when idle =>
          ps2_data <= '0';
          counter_next <= "1010"; -- 10 bits to go

          buf_next <= '1' & not (din(0) xor din(1) xor din(2) xor din(3) 
            xor din(4) xor din(5) xor din(6) xor din(7)) & din;
          state_next <= data;
        when data =>
          if ris_edge = '1' then    
            ps2_data <= buf_reg(0);
            buf_next <= '0' & buf_reg(9 downto 1);
            counter_next <= counter_reg - 1;       
          end if;
          if fall_edge = '1' and counter_reg = 0 then
            state_next <= done;
          end if;
        when done =>
          state_next <= idle;
          tx_done <= '1';
      end case;
    else
      --ps2_data <= 'Z';
      state_next <= idle;
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