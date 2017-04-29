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
  ps2c: inout std_logic
);
end web_keyboard;

architecture Behavioral of web_keyboard is
  signal tx_en, rx_ack, ps2d_o, ps2d_rx_o, ps2d_i, ps2c_o, ps2c_rx_o, ps2c_i: std_logic;
begin
  -- принимает байт и передает на выход в сигналах ps/2
  inst_web_ps2_tx: entity work.web_ps2_tx
    port map (
      clk => clk,
      reset => rst,
      ps2d => ps2d_o, 
      ps2c => ps2c_o,
      tx_en => tx_en,
      tx_done => rx_done,
      din => data_i
    );
  tx_en <= rx_en and not rx_ack;
  -- принимает байт в сигналах ps/2 и формирует байт
  inst_web_ps2_rx: entity work.web_ps2_rx
    port map (
      clk => clk, 
      reset => rst,
      ps2d_i => ps2d, 
      ps2c_i => ps2c,
      ps2d_o => ps2d_rx_o, 
      ps2c_o => ps2c_rx_o,            
      rx_ack => rx_ack,
      rx_done => tx_done,
      dout => data_o
    );
  busy <= rx_ack or rx_en;

  ps2d <= ps2d_rx_o when rx_ack = '1' else 
    ps2d_o when tx_en = '1' else 
    'Z';

  ps2c <= ps2c_rx_o when rx_ack = '1' else 
    ps2c_o when tx_en = '1' else 
    'Z';
end Behavioral;