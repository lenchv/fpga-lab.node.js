----------------------------------------------------------------------------------
-- Устройство: кнопки
-- Код: 0x03
--  --------- ---------- ---------- --------- ------- ------- ------- -------
-- |     7   |    6     |     5    |    4    |   3   |   2   |   1   |   0   |
-- |-------------------------------------------------------------------------|
-- | PB_WEST | PB_SOUTH | PB_NORTH | PB_EAST | SW[3] | SW[2] | SW[1] | SW[0] |
--  --------- ---------- ---------- --------- ------- ------- ------- -------
-- PB - push button; SW - switch button
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use ieee.numeric_std.all;
use IEEE.STD_LOGIC_UNSIGNED.ALL;

entity web_button is
  port (
    data_o: out std_logic_vector(7 downto 0); -- выводит состояния кнопок 
    rs232_data_i: in std_logic_vector(7 downto 0); -- данные, от кнопок с ком порта
    physical_data_i: in std_logic_vector(7 downto 0); -- данные с физических кнопок
    rst_i: in std_logic;
    clk: in std_logic
  );
end web_button;

architecture BtnArch of web_button is
  signal physical_data_r0, physical_data_r1: std_logic_vector(7 downto 0);
begin
  proc: process(clk, rst_i)
    variable store_rs232_data_i: integer := 0;
    variable store_physical_data_i: integer := 0;
    --variable init_flag: boolean := true;
  begin
    if rst_i = '1' then
      --init_flag := false;
      store_rs232_data_i := to_integer(unsigned(rs232_data_i));
      store_physical_data_i := to_integer(unsigned(physical_data_r1));
      physical_data_r0 <= (others =>'0'); 
      physical_data_r1 <= (others =>'0'); 
    elsif rising_edge(clk) then
      physical_data_r0 <= physical_data_i;
      physical_data_r1<=physical_data_r0;
      -- если данные для кнопок пришли с ком порта
      if store_rs232_data_i /= to_integer(unsigned(rs232_data_i)) then
        store_rs232_data_i := to_integer(unsigned(rs232_data_i));
        data_o <= rs232_data_i;
        -- иначе если данные пришли от физических кнопок
      elsif store_physical_data_i /= to_integer(unsigned(physical_data_r1)) then
        store_physical_data_i := to_integer(unsigned(physical_data_r1));
        data_o <= physical_data_r1;
      end if;
    end if;
  end process;
end BtnArch;