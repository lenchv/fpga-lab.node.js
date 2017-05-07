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
  type state is (s_wait, s_data, s_done);

  signal ps2d_out, ps2c_out, 
    ps2d_i, ps2c_i,
    idle, rx_done,
    tx_wr_ps2, tx_done: std_logic;

  signal rx_data, tx_data: std_logic_vector(7 downto 0);

  type state_type is (send_ED, rec_ack, send_lock, wait_send);
  signal s : state_type := send_ED;

  signal led_kbd, led_shift: std_logic_vector(7 downto 0) := (others => '0');

begin
  reset_o <= reset;

  reset_proc: process(clk)
    variable counter: unsigned(1 downto 0) := (others => '0');
  begin
    if rising_edge(clk) then
      if counter = "11" then
        reset <= '0';
      else
        reset <= '1';
        counter := counter + 1;
      end if;
    end if;
  end process;
  
  web_ps2_kbd_data <= '0' when ps2d_out = '0' else 'Z';
  web_ps2_kbd_clk <= '0' when ps2c_out = '0' else 'Z';

  ps2d_i <= '0' when web_ps2_kbd_data = '0' else '1';
  ps2c_i <= '0' when web_ps2_kbd_clk = '0' else '1';
  ---- ![не проходит один такт, проверить на физ клавиатуре]! --
  inst_ps2_rx: entity work.ps2_rx
  port map (
    clk => clk, 
    reset => reset,
    ps2d => ps2d_i,
    ps2c => ps2c_i,
    rx_en => idle,

    rx_done => rx_done,
    dout => rx_data
  );

  inst_ps2_tx: entity work.ps2_tx
  port map (
    clk => clk, 
    reset => reset,
    ps2d_out => ps2d_out,
    ps2c_out => ps2c_out,
    ps2d_in => ps2d_i,
    ps2c_in => ps2c_i,
    tx_idle => idle,
    
    din => tx_data,
    wr_ps2 => tx_wr_ps2,
    tx_done => tx_done
  );

  proc_out: process(reset, clk)
  begin
    if reset = '1' then
      web_output_write_o <= '0';
    elsif rising_edge(clk) then
      web_output_write_o <= '0';
      if rx_done = '1' then
        web_output_data_o <= rx_data;
        web_output_write_o <= '1';
      end if;
    end if;
  end process;

  led <= led_shift;
  proc_rx: process(reset, clk)
    variable realesed, ext_code: boolean;
  begin
    if reset = '1' then
      led_kbd <= (others => '0');
      realesed := false;
      ext_code := false;
      led_shift <= (others => '0');
    elsif rising_edge(clk) then
      tx_wr_ps2 <= '0';
      case s is
        when send_ED =>
          if rot_center = '1' then
            tx_data <= X"F4";
            tx_wr_ps2 <= '1';
            s <= rec_ack;
          elsif buttons(4) = '1' then
            tx_data <= X"AA";
            tx_wr_ps2 <= '1';
            s <= rec_ack;
          elsif rx_done='1' then
            if realesed then
              realesed := false;
            elsif ext_code then
              case rx_data is
                -- left
                when X"6B" =>
                  led_shift <= led_shift(6 downto 0) & '1';
                -- right
                when X"74" =>
                  led_shift <= '0' & led_shift(7 downto 1);
                when others => null;
              end case;
              ext_code := false;
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
                when X"E0" =>
                  ext_code := true;
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
--  proc_rx: process(reset, ps2c_i)
--    variable counter: unsigned(2 downto 0);
--  begin
--    if reset = '1' then
--      rx_done <= '0';
--      rx_data <= (others => '0');
--    elsif rising_edge(ps2c_i) then
--      rx_done <= '0';
--      if idle = '1' then
--        case s is
--          when s_wait =>
--            if ps2d_i = '0' then
--              s <= s_data;
--              counter := "111";
--            end if;
--          when s_data =>
--            rx_data <= ps2d_i & rx_data(7 downto 1);
--            if counter = "000" then
--              s <= s_done;
--            else
--              counter := counter - "001";
--            end if;
--          when s_done =>
--            rx_done <= '1';
--            --led <= rx_data;
--            s <= s_wait;
--        end case;
--      end if;
--    end if;
--  end process;
--  proc_tx: process(reset, ps2c_i)
--    variable counter: unsigned(3 downto 0);
--  begin
--    if reset = '1' then
--      idle <= '1';
--      s_tx <= s_wait;
--      state_send <= s_wait;
--      ps2d_out <= 'Z';
--      ps2c_out <= 'Z';
--      led <= (others => '0');
--    elsif rising_edge(ps2c_i) then
--      web_output_write_o <= '0';
--      case s_tx is
--        when s_wait =>
--          idle <= '1';
--          if rx_done = '1' then
--            s_tx <= s_data;
--            tx_data <= rx_data;
--            counter := "0000";
--            idle <= '0';
--            ps2c_out <= '0'; 
--            state_send <= s_wait;
--          end if;
--        when s_data =>
--          if counter = "0001" then
--            ps2c_out <= 'Z';
--            ps2d_out <= '0';
--          elsif counter > "0001" and counter < "1010" then       
--            ps2d_out <= tx_data(0);
--            tx_data <= '0' & tx_data(7 downto 1);     
--          elsif counter = "1010" then
--            if ps2d_i = '0' then
--              web_output_data_o <= "00000001";
--              web_output_write_o <= '1';
--            end if;
--            s_tx <= s_done;
--          end if;
--          counter := counter + 1;
--        when s_done =>
--          ps2d_out <= 'Z';
--          ps2c_out <= 'Z';
--          s_tx <= s_wait;      
--      end case;
--    end if;
--  end process;
end Behavioral;