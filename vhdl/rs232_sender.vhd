-- RS232 sender with Wishbone slave interface and fixed, but generic,
-- baudrate and 8N1 mode.
--
-- The master sends data to this slave by setting dat_i to the byte to send
-- and stb_i to 1 at the rising edge of clk_i. This slave acknowledge the
-- request with ack_o = 1 at the next rising edge of clk_i. Then the master
-- resets stb_i to 0 and the slave acknowledges this by setting ack_o to 0.
-- The slave acknowledges the next stb_i signal after the current byte is
-- sent to the RS232 port.
--
-- Supported Whishbone cycles: SLAVE, WRITE

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity rs232_sender is
  generic(
    system_speed,  -- clk_i speed, in hz
    baudrate: integer);  -- baudrate, in bps
  port(
    ack_o: out std_logic;  -- Wishbone ACK_O signal
    clk_i: in std_logic;  -- Wishbone CLK_i signal
    dat_i: in unsigned(7 downto 0);  -- Wishbone DAT_i signal
    rst_i: in std_logic;  -- Wishbone RST_i signal
    stb_i: in std_logic;  -- Wishbone STB_i signal
    tx: out std_logic);  -- RS232 transmit pin
end entity rs232_sender;

architecture rtl of rs232_sender is
  constant max_counter: natural := system_speed / baudrate;
  
  type state_type is (
    wait_for_strobe,
    send_start_bit,
    send_bits,
    send_stop_bit);

  signal state: state_type := wait_for_strobe;

  signal baudrate_counter: natural range 0 to max_counter := 0;
  
  signal bit_counter: natural range 0 to 7 := 0;
  signal shift_register: unsigned(7 downto 0) := (others => '0');
  signal data_sending_started: std_logic := '0';

begin

  -- acknowledge, when sending process was started
  ack_o <= data_sending_started and stb_i;

  update: process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        tx <= '1';
        data_sending_started <= '0';
        state <= wait_for_strobe;
      else
        case state is
          -- wait until the master asserts valid data
          when wait_for_strobe =>
            if stb_i = '1' then
              state <= send_start_bit;
              baudrate_counter <= max_counter - 1;
              tx <= '0';
              shift_register <= dat_i;
              data_sending_started <= '1';
            else
              tx <= '1';
            end if;

          when send_start_bit =>
            if baudrate_counter = 0 then
              state <= send_bits;
              baudrate_counter <= max_counter - 1;
              tx <= shift_register(0);
              bit_counter <= 7;
            else
              baudrate_counter <= baudrate_counter - 1;
            end if;

          when send_bits =>
            if baudrate_counter = 0 then
              if bit_counter = 0 then
                state <= send_stop_bit;
                tx <= '1';
              else
                tx <= shift_register(1);
                shift_register <= shift_right(shift_register, 1);
                bit_counter <= bit_counter - 1;
              end if;
              baudrate_counter <= max_counter - 1;
            else
              baudrate_counter <= baudrate_counter - 1;
            end if;

          when send_stop_bit =>
            if baudrate_counter = 0 then
              state <= wait_for_strobe;
            else
              baudrate_counter <= baudrate_counter - 1;
            end if;
        end case;

        -- this resets acknowledge until all bits are sent
        if stb_i = '0' and data_sending_started = '1' then
          data_sending_started <= '0';
        end if;
      end if;
    end if;
  end process;
end architecture rtl;