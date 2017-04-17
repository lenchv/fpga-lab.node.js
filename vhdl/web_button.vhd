----------------------------------------------------------------------------------
-- ����������: ������
-- ���: 0x03
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
    data_o: out std_logic_vector(7 downto 0); -- ������� ��������� ������ 
    rs232_data_i: in std_logic_vector(7 downto 0); -- ������, �� ������ � ��� �����
    physical_data_i: in std_logic_vector(7 downto 0); -- ������ � ���������� ������
    rst_i: std_logic;
    clk: in std_logic
  );
end web_button;

architecture BtnArch of web_button is
begin
  proc: process(clk, rst_i)
    variable store_rs232_data_i: integer := 0;
    variable store_physical_data_i: integer := 0;
    --variable init_flag: boolean := true;
  begin
    if rst_i = '1' then
      --init_flag := false;
      store_rs232_data_i := to_integer(unsigned(rs232_data_i));
      store_physical_data_i := to_integer(unsigned(physical_data_i));
    elsif rising_edge(clk) then
      -- ���� ������ ��� ������ ������ � ��� �����
      if store_rs232_data_i /= to_integer(unsigned(rs232_data_i)) then
        store_rs232_data_i := to_integer(unsigned(rs232_data_i));
        data_o <= rs232_data_i;
        -- ����� ���� ������ ������ �� ���������� ������
      elsif store_physical_data_i /= to_integer(unsigned(physical_data_i)) then
        store_physical_data_i := to_integer(unsigned(physical_data_i));
        data_o <= physical_data_i;
      end if;
    end if;
  end process;
end BtnArch;