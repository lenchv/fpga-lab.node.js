library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use ieee.numeric_std.all;
use IEEE.STD_LOGIC_UNSIGNED.ALL;

entity web_ps2_clk is
  port(
    clk, reset: in std_logic;
    en: in std_logic;
    ps2_clk: out std_logic;
    rising: out std_logic;
    falling: out std_logic
  );
end web_ps2_clk;

architecture Behavioral of web_ps2_clk is
  constant max_ps2_counter : natural := 50_000_000 / 20_000; -- 10 kHz, clock PS/2 = 10 - 16.7 kHz
  signal ps2_counter: natural range 0 to max_ps2_counter := 0; -- счетчик для генерации частоты устройства  
  signal ps2_clock: std_logic;
begin
  ps2_clk <= ps2_clock;
  clk_gen: process(reset, clk)
  begin
    if reset = '1' then
      ps2_clock <= '1';
      ps2_counter <= 0;
      rising <= '0';
      falling <= '0';
    elsif rising_edge(clk) then
      rising <= '0';
      falling <= '0';
      if en = '1' then
        if ps2_counter = max_ps2_counter then
          ps2_counter <= 0;
          if ps2_clock = '1' then
            ps2_clock <= '0';
            falling <= '1';
          else
            ps2_clock <= '1';
            rising <= '1';
          end if;
        else
          ps2_counter <= ps2_counter + 1;
        end if;
      else
        ps2_clock <= '1';
        ps2_counter <= 0;
      end if;
    end if;
  end process;

end Behavioral;