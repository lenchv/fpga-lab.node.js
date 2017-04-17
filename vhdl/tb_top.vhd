--------------------------------------------------------------------------------
-- Company: 
-- Engineer:
--
-- Create Date:   10:58:46 04/02/2017
-- Design Name:   
-- Module Name:   D:/VHDL/UART_TEST/tb_top.vhd
-- Project Name:  UART_TEST
-- Target Device:  
-- Tool versions:  
-- Description:   
-- 
-- VHDL Test Bench Created by ISE for module: top
-- 
-- Dependencies:
-- 
-- Revision:
-- Revision 0.01 - File Created
-- Additional Comments:
--
-- Notes: 
-- This testbench has been automatically generated using types std_logic and
-- std_logic_vector for the ports of the unit under test.  Xilinx recommends
-- that these types always be used for the top-level I/O of a design in order
-- to guarantee that the testbench will bind correctly to the post-implementation 
-- simulation model.
--------------------------------------------------------------------------------
LIBRARY ieee;
USE ieee.std_logic_1164.ALL;
 
-- Uncomment the following library declaration if using
-- arithmetic functions with Signed or Unsigned values
USE ieee.numeric_std.ALL;
 
ENTITY tb_top IS
END tb_top;
 
ARCHITECTURE behavior OF tb_top IS 
  constant max_counter: natural := (11538500 / 9600) - 1;
    -- Component Declaration for the Unit Under Test (UUT)
 
    COMPONENT top
    PORT(
         clk_50mhz : IN  std_logic;
         rs232_dce_txd : OUT  std_logic;
         rs232_dce_rxd : IN  std_logic;
         led : OUT  std_logic_vector(7 downto 0);
         buttons : IN  std_logic_vector(7 downto 0);
			rot_a: in std_logic;
			rot_b: in std_logic;
			rot_center: in std_logic
        );
    END COMPONENT;
    
	
   --Inputs
   signal clk_50mhz : std_logic := '0';
   signal rs232_dce_rxd : std_logic := '0';
   signal buttons : std_logic_vector(7 downto 0) := (others => '0');
   signal rot_center : std_logic := '0';
   signal rot_a : std_logic := '0';
   signal rot_b : std_logic := '1';
 	--Outputs
   signal rs232_dce_txd : std_logic;
   signal led : std_logic_vector(7 downto 0);

   -- Clock period definitions
   constant clk_50mhz_period : time := 10 ns;

   type state_type is (
    s_start,
    s_data,
    s_stop
  );
   signal state: state_type := s_start;
  type bufer_type is array (0 to 2**15) of std_logic_vector(7 downto 0);

   signal buff: bufer_type := (
--      (X"AA"),
--      (X"55"),
--      (X"00"),
--      (X"08"),
--      (X"01"),
--      (X"81"),
--      (X"81"),
--      (X"0F"),
--      (X"F0"),
--      (X"3C"),
--      (X"C3"),
--      (X"7E"),
--      (X"E7"),
--      (X"01"),
--      (X"02"),
--      (X"03"),
      (X"AA"),
      (X"55"),
      (X"00"),
      (X"01"),
      (X"04"),
      (X"07"),
      (X"AA"),
      (X"55"),
      (X"00"),
      (X"01"),
      (X"04"),
      (X"06"),
      (X"AA"),
      (X"55"),
      (X"00"),
      (X"01"),
      (X"04"),
      (X"04"),
      (X"AA"),
      (X"55"),
      (X"00"),
      (X"01"),
      (X"04"),
      (X"05"),
    others => (others => '0')
    );
    signal buff_out: bufer_type := (others => (others => '0'));
BEGIN
 
	-- Instantiate the Unit Under Test (UUT)
   uut: top PORT MAP (
          clk_50mhz => clk_50mhz,
          rs232_dce_txd => rs232_dce_txd,
          rs232_dce_rxd => rs232_dce_rxd,
          led => led,
          buttons => buttons,
          rot_a => rot_a,
          rot_b => rot_b,
          rot_center => rot_center
        );

   -- Clock process definitions
   clk_50mhz_process :process
   begin
		clk_50mhz <= '0';
		wait for clk_50mhz_period/2;
		clk_50mhz <= '1';
		wait for clk_50mhz_period/2;
   end process;
 

   -- Stimulus process
   stim_proc: process(clk_50mhz)
    variable bit_i: integer := 0;
    variable i: integer := 0;
    variable bit_counter: integer := max_counter;
   begin    
      if rising_edge(clk_50mhz) then
        if i < 24 then

          case state is
            when s_start =>
              rs232_dce_rxd <= '0';
              state <= s_data;
              bit_counter := max_counter-1 + ((max_counter-1) / 2) - 1;
              report "bitcounter = "&integer'image(bit_counter);
            when s_data =>
              if bit_counter = 0 then
                bit_counter := max_counter - 2;
                if bit_i = 8 then
                  report "next byte " severity note;
                  bit_i := 0;
                  i := i + 1;
                  state <= s_stop;
                  rs232_dce_rxd <= '1';
                else
                  rs232_dce_rxd <= buff(i)(bit_i);
                  bit_i := bit_i + 1;
                end if;
              else
                bit_counter := bit_counter - 1;
              end if;
            when s_stop =>
              if bit_counter = 0 then
                state <= s_start;
              else
                bit_counter := bit_counter - 1;
              end if;
          end case;
        else
          rot_center <= '0';
        end if;
      end if;     
   end process;
   buttons <= X"F0";
END;
