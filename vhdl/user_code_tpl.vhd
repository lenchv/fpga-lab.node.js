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

    web_output_write_o: out std_logic;
    web_output_data_o: out std_logic_vector(7 downto 0);
    web_output_ready_i: in std_logic;

    rot_a: in std_logic;
    rot_b: in std_logic;
    rot_center: in std_logic;

    reset_o: out std_logic;
    clk: in std_logic
  );
end user_code;

architecture Behavioral of user_code is
  signal reset : std_logic := '1';
begin
  reset_o <= reset;
  proc: process(clk)
    variable store_rot_center : std_logic := '0';
    variable store_rot_a : std_logic := '0';
    variable store_rot_b : std_logic := '0';
  begin
    if rising_edge(clk) then
      if reset = '1' then
        reset <= '0';
      end if;
      led <= buttons;
      if rot_center = '1' then
        led <= buttons(7 downto 3) & rot_center & rot_b & rot_a;
        --web_output_write_o <= '1';
        --web_output_data_o <= "00000" & rot_center & rot_b & rot_a;
      else
        web_output_write_o <= '0';
      end if;

--      if rot_center /= store_rot_center or rot_a /= store_rot_a or rot_b /= store_rot_b then
--        store_rot_center := rot_center;
--        store_rot_a := rot_a;
--        store_rot_b := rot_b;
--        web_output_write_o <= '1';
--        web_output_data_o <= "00000" & rot_center & rot_b & rot_a;
--        led <= "00000" & rot_center & rot_b & rot_a;
--      else
--        web_output_write_o <= '0';
--      end if;
    end if;
  end process;

end Behavioral;