----------------------------------------------------------------------------------
-- Устройство: светодиоды
-- Код: 0х02
----------------------------------------------------------------------------------
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use ieee.numeric_std.all;
use IEEE.STD_LOGIC_UNSIGNED.ALL;

entity web_led is
  port (
    data_o: out std_logic_vector(7 downto 0); -- выход 
    data_i: in std_logic_vector(7 downto 0); -- данные на уровне платы
    strobe_o: out std_logic;
    ack_i: in std_logic;
    rst_i: in std_logic;
    clk: in std_logic
  );
end web_led;

architecture LedArch of web_led is
begin
  proc: process(clk, ack_i, rst_i)
    variable prev_data: unsigned(7 downto 0) := (others => '0');
  begin
    if ack_i = '1' then
      strobe_o <= '0';
    elsif rst_i = '1' then
      data_o <= X"00";
      strobe_o <= '0';
    elsif rising_edge(clk) then
      if prev_data /= unsigned(data_i) then
        prev_data := unsigned(data_i);
        strobe_o <= '1';
        data_o <= data_i;
      end if;
    end if;
  end process;  
end LedArch;