-- Иммитация приема байта от хоста в виде сигналов протокола PS/2 и формирует байт
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
    clk, reset: in std_logic;              -- System clock and reset
    ps2d_i, ps2c_i: in std_logic;
    ps2d_o, ps2c_o: out std_logic;             
    rx_ack: out std_logic;                 -- acknowledge receive signal
    rx_done: out std_logic;
    dout: out std_logic_vector(7 downto 0)   -- Output buffer
  );
end web_ps2_rx;

architecture Behavioral of web_ps2_rx is
  constant max_ps2_counter : natural := MAIN_FREQ / FREQ_DIVIDER; 
  signal ps2_counter: natural range 0 to max_ps2_counter := 0; -- счетчик для генерации частоты устройства 

  signal ack: std_logic := '0';
  signal s_done: std_logic := '0';
  signal ps2_clock: std_logic := 'H'; 

  -- Rising edge detector signals
  signal ris_edge: std_logic;
  signal ps2_edge: std_logic_vector(1 downto 0);

  -- State machine
  type state is (idle, data, done);
  signal state_reg, state_next: state;
  -- Counter from 10 to 0 - 4 bits should be enough
  signal counter_reg, counter_next: unsigned(3 downto 0);

  -- Data buffer
  signal buf_reg, buf_next: std_logic_vector(10 downto 0);
  signal err: std_logic;
  signal counter: natural range 0 to max_ps2_counter * 2 := 0;

begin
  rx_ack <= ack;
  rx_done <= s_done;
  ps2c_o <= ps2_clock;

  -- генерируем частоту, если определено начало приема данных
  clk_gen: process(clk, reset)
  begin
    if reset = '1' then
      --ps2_clock <= 'Z';
      ps2_counter <= 0;
    elsif rising_edge(clk) then
      --if ris_en = '1' then
      --  ps2_clock <= '0';
      --end if;
      --if ack = '1' then        
        if ps2_counter = max_ps2_counter then
          ps2_counter <= 0;
          ps2_clock <= not ps2_clock and ack;
        else
          ps2_counter <= ps2_counter + 1;
        end if;
      --else
        -- ps2_clock <= 'Z';
      --  ps2_counter <= 0;
      --end if;
    end if;
  end process;

  -- определяем начало приема данных
  detect_rx: process(clk, reset)
  begin
    if reset = '1' then
      ack <= '0';
      counter <= 0;
    elsif rising_edge(clk) then
      -- если передача завершилась, то указываем на завершение приема данных
      if s_done = '1' then
        ack <= '0';
      end if;
      -- если 2 такта линия клок в нуле, значит хост передает данные устройству
      if ps2c_i = '0' then
        if counter = max_ps2_counter * 2 then
          ack <= '1';
          counter <= 0;
        else
          counter <= counter + 1;
        end if;
      else
        counter <= 0;
      end if;
    end if;
  end process;

  -- rising edge detector with shift buffer
  edge_detector: process(clk, reset)
  begin
    if reset = '1' then
      ps2_edge <= (others => '0');
    elsif rising_edge(clk) then
      ps2_edge <= ps2_edge(0) & ps2_clock;
    end if;
  end process;
  ris_edge <= '1' when ps2_edge(1) = '0' and ps2_edge(0) = '1' else '0';

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
  -- определяем ошибку приема данных
  err <= not (not buf_reg(0) and buf_reg(10) and ( buf_reg(9) xor 
    buf_reg(8) xor buf_reg(7) xor buf_reg(6) xor buf_reg(5) xor
    buf_reg(4) xor buf_reg(3) xor buf_reg(2) xor buf_reg(1)
  ));

  state_machine: process(ris_edge, ack)
  begin
    -- setting default values
    state_next <= state_reg;
    buf_next <= buf_reg;
    counter_next <= counter_reg;
    s_done <= '0';
    
    if ack='1' then
      case (state_reg) is
        when idle =>
          ps2d_o <= 'Z';
          counter_next <= "1011"; -- 11 bits to go
          state_next <= data;
        when data =>
          --ps2d_o <= 'Z';
          if ris_edge = '1' then
            if counter_reg = 0 then
              ps2d_o <= '0';
              state_next <= done;
            else
              buf_next <= ps2d_i & buf_reg(10 downto 1);
              counter_next <= counter_reg - 1;
            end if;
          end if;
        when done =>
          if ris_edge = '1' then
            ps2d_o <= 'Z';
            state_next <= idle;
            if err = '0' then
              dout <= buf_reg(8 downto 1);
              s_done <= '1';
            end if;
          end if;
      end case;
    else
      --ps2d_o <= 'Z';
      state_next <= idle;
    end if;

  end process;
end Behavioral;