----------------------------------------------------------------------------------
-- Устройство: крутилка
-- Код: 0х04
----------------------------------------------------------------------------------
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use ieee.numeric_std.all;
use IEEE.STD_LOGIC_UNSIGNED.ALL;

entity web_rotary is
  port (
    rot_a_o: out std_logic;
    rot_b_o: out std_logic;
    rot_center_o: out std_logic;

    rot_a_i: in std_logic;
    rot_b_i: in std_logic;
    rot_center_i: in std_logic;
    
    rot_a_rs232_i: in std_logic;
    rot_b_rs232_i: in std_logic;
    rot_center_rs232_i: in std_logic;
    rst_i: in std_logic;
    clk: in std_logic
  );
end web_rotary;

architecture RotaryArch of web_rotary is
begin
  proc: process(clk, rst_i)
    variable store_rot_a_i: std_logic := '0';
    variable store_rot_b_i: std_logic := '0';
    variable store_rot_center_i: std_logic := '0';
    variable store_rot_a_rs232_i: std_logic := '0';
    variable store_rot_b_rs232_i: std_logic := '0';
    variable store_rot_center_rs232_i: std_logic := '0';
  begin
    if rst_i = '1' then
      store_rot_a_i := rot_a_i;
      store_rot_b_i := rot_b_i;
      store_rot_center_i := rot_center_i;
      store_rot_a_rs232_i := rot_a_rs232_i;
      store_rot_b_rs232_i := rot_b_rs232_i;
      store_rot_center_rs232_i := rot_center_rs232_i;
    elsif rising_edge(clk) then
      if store_rot_a_i /= rot_a_i
        or
        store_rot_b_i /= rot_b_i
        or
        store_rot_center_i /= rot_center_i
      then
        store_rot_a_i := rot_a_i;
        store_rot_b_i := rot_b_i;
        store_rot_center_i := rot_center_i;
        
        rot_a_o <= rot_a_i;
        rot_b_o <= rot_b_i;
        rot_center_o <= rot_center_i;
      elsif store_rot_a_rs232_i /= rot_a_rs232_i
        or
        store_rot_b_rs232_i /= rot_b_rs232_i
        or
        store_rot_center_rs232_i /= rot_center_rs232_i
      then
        store_rot_a_rs232_i := rot_a_rs232_i;
        store_rot_b_rs232_i := rot_b_rs232_i;
        store_rot_center_rs232_i := rot_center_rs232_i;
        
        rot_a_o <= rot_a_rs232_i;
        rot_b_o <= rot_b_rs232_i;
        rot_center_o <= rot_center_rs232_i;
      end if;
    end if;
  end process;
end RotaryArch;