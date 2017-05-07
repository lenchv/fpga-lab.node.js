----------------------------------------------------------------------------------
-- Устройство: имитатор клавиатуры. Принимает скан код от клиента, 
-- преобразовует его в сигналы ps/2 и передает в пользовательский код.
-- Код: 0x06
----------------------------------------------------------------------------------
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use ieee.numeric_std.all;
use IEEE.STD_LOGIC_UNSIGNED.ALL;

entity web_keyboard is
port (
  clk: in std_logic;
  rst: in std_logic;
  busy: out std_logic;

  data_i: in std_logic_vector(7 downto 0);
  rx_en: in std_logic;
  rx_done: out std_logic;

  data_o: out std_logic_vector(7 downto 0);
  tx_done: out std_logic;

  ps2d: inout std_logic;
  ps2c: inout std_logic;

  led : out std_logic_vector(7 downto 0)
);
end web_keyboard;

architecture Behavioral of web_keyboard is
  signal ps2d_o, 
    ps2c_o, 
    ps2d_tx_o,
    ps2c_tx_o, 
    ps2d_i,
    ps2c_i,
	  tx_ack: std_logic;
begin
  busy <= '1' when tx_ack = '1' or rx_en = '1' or ps2c = '0' else '0';

  inst_rx: entity work.web_ps2_rx
    port map (
      clk => clk, 
      reset => rst,
      ps2d => ps2d_o, 
      ps2c => ps2c_o,
      rx_en => rx_en,
      rx_done => rx_done,
      data_i => data_i
    );

  
  inst_tx: entity work.web_ps2_tx
    port map (
      clk => clk,
      reset => rst,
      ps2d_i => ps2d_i,
      ps2c_i => ps2c_i,
      ps2d_o => ps2d_tx_o,
      ps2c_o => ps2c_tx_o,
      tx_ack => tx_ack,
      tx_done => tx_done,
      dout => data_o
    );
  ps2d_i <= '0' when ps2d = '0' else '1';
  ps2c_i <= '0' when ps2c = '0' else '1';

  ps2d <= '0' when rx_en = '1' and ps2d_o = '0' else
    'H' when rx_en = '1' else
    '0' when tx_ack = '1' and ps2d_tx_o = '0' else
    'Z';

  ps2c <= ps2c_o when rx_en = '1' else
    ps2c_tx_o when tx_ack = '1' else
    'Z';

end Behavioral;


