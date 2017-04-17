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

	signal rotary_a_i_in : std_logic;
	signal  rotary_b_i_in : std_logic;
	signal  rotary_in : std_logic_vector(1 downto 0);
	signal  rotary_q1 : std_logic;
	signal  rotary_q2 : std_logic;
	signal  delay_rotary_q1 : std_logic;
	signal  rotary_event : std_logic;
	signal  rotary_left : std_logic;
	signal  rotary_value : std_logic_vector(7 downto 0);
begin
  reset_o <= reset;
  proc: process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        reset <= '0';
      end if;
    end if;
  end process;

  rotary_filter: process(clk)
  begin
    if rising_edge(clk) then
      --Synchronise inputs to clock domain using flip-flops in input/output blocks.
      rotary_a_i_in <= rot_a;
      rotary_b_i_in <= rot_b;

      --concatinate rotary input signals to form vector for case construct.
      rotary_in <= rotary_b_i_in & rotary_a_i_in;

      case rotary_in is

        when "00" => rotary_q1 <= '0';         
                     rotary_q2 <= rotary_q2;
 
        when "01" => rotary_q1 <= rotary_q1;
                     rotary_q2 <= '0';

        when "10" => rotary_q1 <= rotary_q1;
                     rotary_q2 <= '1';

        when "11" => rotary_q1 <= '1';
                     rotary_q2 <= rotary_q2; 

        when others => rotary_q1 <= rotary_q1; 
                       rotary_q2 <= rotary_q2; 
      end case;

    end if;
  end process rotary_filter;
  --
  -- The rising edges of 'rotary_q1' indicate that a rotation has occurred and the 
  -- state of 'rotary_q2' at that time will indicate the direction. 
  --
  direction: process(clk)
  begin
    if rising_edge(clk) then

      delay_rotary_q1 <= rotary_q1;
      if rotary_q1='1' and delay_rotary_q1='0' then
        rotary_event <= '1';
        rotary_left <= rotary_q2;
       else
        rotary_event <= '0';
        rotary_left <= rotary_left;
      end if;

    end if;
  end process direction;

  rotary_count: process(clk,reset)
  begin
	if reset='1' then
	rotary_value<=x"00";
	else
    if rising_edge(clk) then
      if rotary_event='1' then
        if rotary_left='1' then 
				rotary_value<=rotary_value-1;
        else
				rotary_value<=rotary_value+1;
        end if;
      end if;
    end if;
	end if;
  end process rotary_count;

  led <= rotary_value; 

end Behavioral;