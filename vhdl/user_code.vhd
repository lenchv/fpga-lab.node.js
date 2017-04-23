---------------------------------------------------------
-- Здес код, который может использовать все утсройства --
---------------------------------------------------------
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use ieee.numeric_std.all;
use IEEE.STD_LOGIC_UNSIGNED.ALL;
library UNISIM;
use UNISIM.Vcomponents.ALL;

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

  component IOBUF
    port ( 
      I  : in    std_logic; 
      IO : inout std_logic; 
      O  : out   std_logic; 
      T  : in    std_logic
    );
  end component;
  
  component GND
    port ( 
      G : out std_logic
    );
  end component;

  signal idle: std_logic;
  signal tx_data, rx_data: std_logic_vector(7 downto 0);
  signal tx_wr_ps2: std_logic;
  signal tx_done, rx_done: std_logic;

  type state is (send_ED, rec_ack, send_lock, wait_send);

  signal s : state := send_ED;

  signal XLXN_36, XLXN_35, XLXN_38, XLXN_7, XLXN_32, XLXN_8: std_logic;

  signal led_kbd: std_logic_vector(2 downto 0) := (others => '0');
begin
  reset_o <= reset;
  reset <= '0' after 100 ns;
  
   inst_buf_data : IOBUF
      port map (I=>XLXN_36,
                T=>XLXN_38,
                O=>XLXN_7,
                IO=>ps2_data1);
   
   inst_buf_clk : IOBUF
      port map (I=>XLXN_35,
                T=>XLXN_32,
                O=>XLXN_8,
                IO=>ps2_clk1);
   
   XLXI_15 : GND
      port map (G=>XLXN_35);
   
   XLXI_16 : GND
      port map (G=>XLXN_36);

  inst_ps2_tx: entity ps2_tx
  port map (
    clk => clk, 
    reset => reset,
    ps2d_out => XLXN_38,
    ps2c_out => XLXN_32,
    ps2d_in => XLXN_7,
    ps2c_in => XLXN_8,
    tx_idle => idle,
    
    din => tx_data,
    wr_ps2 => tx_wr_ps2,
    tx_done => tx_done
  );

  inst_ps2_rx: entity ps2_rx
  port map (
    clk => clk, 
    reset => reset,
    ps2d => XLXN_7,
    ps2c => XLXN_8,
    rx_en => idle,

    rx_done => rx_done,
    dout => rx_data
  );

  rec_data_proc: process(clk)
  begin
    if rising_edge(clk) then
      web_output_write_o <= '0';
      if rx_done='1' then
        web_output_write_o <= '1';
        web_output_data_o <= rx_data;
      end if;
    end if;
  end process;

  send_data_proc: process(clk)
    variable realesed: boolean := false;
  begin
	  if rising_edge(clk) then
      tx_wr_ps2 <= '0';
      case s is
        when send_ED =>
          if rot_center = '1' then
            tx_data <= X"F4";
            tx_wr_ps2 <= '1';
            s <= rec_ack;
          elsif rx_done='1' then
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
          led <= "00000" & led_kbd;
          tx_data <= "00000" & led_kbd;
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