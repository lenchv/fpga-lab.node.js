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
    -- PS/2
    web_ps2_kbd_data: inout std_logic;
    web_ps2_kbd_clk: inout std_logic;

    ps2_data1: inout std_logic;
    ps2_clk1: inout std_logic;
    ps2_data2: inout std_logic;
    ps2_clk2: inout std_logic;

    reset_o: out std_logic;
    -- 50 Mhz
    clk: in std_logic
  );
end user_code;

architecture Behavioral of user_code is
  signal reset : std_logic := '1';

  signal idle: std_logic;
  signal tx_data, rx_data: std_logic_vector(7 downto 0);
  signal tx_wr_ps2: std_logic;
  signal tx_done, rx_done: std_logic;

  type state is (send_ED, rec_ack, send_lock, wait_send);

  signal s : state := send_ED;

  signal XLXN_38, XLXN_32: std_logic;

  signal led_kbd: std_logic_vector(7 downto 0) := (others => '0');
begin
  reset_o <= reset;
  reset <= '0' after 40 ns;
  
  web_ps2_kbd_data <= '0' when XLXN_38 = '0' else 'Z';
  web_ps2_kbd_clk <= '0' when XLXN_32 = '0' else 'Z';

  inst_ps2_tx: entity work.ps2_tx
  port map (
    clk => clk, 
    reset => reset,
    ps2d_out => XLXN_38,
    ps2c_out => XLXN_32,
    ps2d_in => web_ps2_kbd_data,
    ps2c_in => web_ps2_kbd_clk,
    tx_idle => idle,
    
    din => tx_data,
    wr_ps2 => tx_wr_ps2,
    tx_done => tx_done
  );

  inst_ps2_rx: entity work.ps2_rx
  port map (
    clk => clk, 
    reset => reset,
    ps2d => web_ps2_kbd_data,
    ps2c => web_ps2_kbd_clk,
    rx_en => idle,

    rx_done => rx_done,
    dout => rx_data
  );


  rec_data_proc: process(clk, reset)
  begin
    if reset = '1' then
      web_output_write_o <= '0';
      web_output_data_o <= (others => '0');
    elsif rising_edge(clk) then
      web_output_write_o <= '0';
      if rot_center = '1' then
        web_output_write_o <= '1';
        web_output_data_o <= rx_data;
      end if;
    end if;
  end process;

  send_data_proc: process(clk, reset)
    variable realesed: boolean := false;
  begin
    if reset = '1' then
	    led_kbd <= (others => '0');
      led <= (others => '0');
    elsif rising_edge(clk) then
      tx_wr_ps2 <= '0';
      if rot_center = '1' then
        led_kbd <= buttons;
      end if;
      case s is
        when send_ED =>
          if rot_center = '1' then
            tx_data <= X"F4";
            tx_wr_ps2 <= '1';
            s <= rec_ack;
          elsif rx_done='1' then
            led <= rx_data;
            if realesed then
              realesed := false;
            else
              case rx_data is
                when X"77" =>
                  led_kbd(1) <= not led_kbd(1);
                  tx_data <= X"ED";
                  tx_wr_ps2 <= '1';
                  s <= rec_ack;
                when X"7E" =>
                  led_kbd(0) <= not led_kbd(0);
                  tx_data <= X"ED";
                  tx_wr_ps2 <= '1';
                  s <= rec_ack;
                when X"58" =>
                  led_kbd(2) <= not led_kbd(2);
                  tx_data <= X"ED";
                  tx_wr_ps2 <= '1';
                  s <= rec_ack;
                when X"5A" =>
                  tx_data <= X"EE";
                  tx_wr_ps2 <= '1';
                  s <= rec_ack;
                when X"76" => 
                  tx_data <= X"FF";
                  tx_wr_ps2 <= '1';
                  s <= rec_ack;

                when X"05" => 
                  tx_data <= X"FE";
                  tx_wr_ps2 <= '1';
                  s <= rec_ack;
                when X"F0" =>
                  realesed := true;
					when others => null;
              end case; 
            end if;
          end if;
        when rec_ack => 
          if rx_done = '1' then
            if tx_data = X"ED" and rx_data = X"FA" then
              s <= send_lock;
            else
              s <= send_ED;
            end if;
          end if;
        when send_lock =>
          tx_data <= led_kbd;
          tx_wr_ps2 <= '1';
          s <= wait_send;
        when wait_send =>
          if tx_done = '1' then
            s <= send_ED;
          end if;
      end case;
    end if;
  end process;


end Behavioral;