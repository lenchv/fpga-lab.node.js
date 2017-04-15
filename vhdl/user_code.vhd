---------------------------------------------------------
-- Здес код, который может использовать все утсройства --
---------------------------------------------------------
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use ieee.numeric_std.all;
use IEEE.STD_LOGIC_UNSIGNED.ALL;

entity user_code is
  port(
    buttons: in std_logic_vector(7 downto 0);
    led: out std_logic_vector(7 downto 0);
    clk: in std_logic
  );
end user_code;

architecture Behavioral of user_code is
begin
  proc: process(clk)
  begin
	if rising_edge(clk) then
		led <= buttons;
	end if;
  end process;
end Behavioral;