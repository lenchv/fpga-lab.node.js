-- Иммитация приема байта от хоста в виде сигналов протокола PS/2 и формирует байт
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use ieee.numeric_std.all;
use IEEE.STD_LOGIC_UNSIGNED.ALL;

entity web_ps2_tx is
  port (
    clk, reset: in std_logic;
    ps2d_i, ps2c_i: in std_logic;
    ps2d_o, ps2c_o: out std_logic;
    tx_ack: out std_logic;
    tx_done: out std_logic;
    dout: out std_logic_vector(7 downto 0)
  );
end web_ps2_tx;

architecture Behavioral of web_ps2_tx is
  constant MAX_DETECT_VALUE: natural := 5000;
  signal detect_counter: natural range 0 to MAX_DETECT_VALUE:= MAX_DETECT_VALUE; -- на частоте 50 MHz 5000 тиков = это 100 мкс 

  type state_type is (s_wait, s_data, s_ack, s_end);
  signal state: state_type := s_wait;

  signal bit_count: unsigned(3 downto 0);
  signal buff: std_logic_vector(10 downto 0);

  signal ack, tx_en, ris_edge, fall_edge, err: std_logic;
begin
  tx_ack <= ack;
  inst_ps2_clk: entity work.web_ps2_clk
    port map(
      clk => clk,
      reset => reset,
      en => ack,
      ps2_clk => ps2c_o,
      rising => ris_edge,
      falling => fall_edge
    );
  -- определение начала передачи
  proc_detect: process(reset, clk)
  begin
    if reset = '1' then
      detect_counter <= MAX_DETECT_VALUE;
      tx_en <= '0';
    elsif falling_edge(clk) then
      tx_en <= '0';
      if ps2c_i = '0' then
        if detect_counter = 0 then
          tx_en <= '1';
          detect_counter <= MAX_DETECT_VALUE;
        else
          detect_counter <= detect_counter - 1;
        end if;
      else
        detect_counter <= MAX_DETECT_VALUE;
      end if;
    end if;
  end process;

  -- определяем ошибку приема данных
  err <= not (not buff(0) and buff(10) and ( buff(9) xor 
    buff(8) xor buff(7) xor buff(6) xor buff(5) xor
    buff(4) xor buff(3) xor buff(2) xor buff(1)
  ));

  proc_tx: process(clk, reset)
    variable skip_tick: boolean;
  begin
    if reset = '1' then
      ack <= '0';
      tx_done <= '0';
      bit_count <= "0000";
      buff <= (others => '0');
    elsif rising_edge(clk) then
      tx_done <= '0';
      case state is
        when s_wait =>
          ps2d_o <= '1';
          ack <= '0';
          if tx_en = '1' then
            state <= s_data;
            ack <= '1';
            bit_count <= "1010";
          end if;
        when s_data =>
          if fall_edge = '1' then
            buff <= ps2d_i & buff(10 downto 1);
            if bit_count = "0000" then
              state <= s_ack;
            else
              bit_count <= bit_count - 1;  
            end if;
          end if;
        when s_ack =>
          if ris_edge = '1' then
            ps2d_o <= '0';
            state <= s_end;
          end if;
        when s_end =>
          if ris_edge = '1' then
            if err = '0' then
              dout <= buff(8 downto 1);
              tx_done <= '1';
            end if;
            ack <= '0';
            ps2d_o <= '1';
            state <= s_wait;
          end if;
      end case;
    end if;
  end process;
end Behavioral;