--------------------------------------------------------------------------------
-- Company: 
-- Engineer:
--
-- Create Date:   20:41:14 03/26/2017
-- Design Name:   
-- Module Name:   D:/VHDL/UART_TEST/echo_testbench.vhd
-- Project Name:  UART_TEST
-- Target Device:  
-- Tool versions:  
-- Description:   
-- 
-- VHDL Test Bench Created by ISE for module: echo
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
--USE ieee.numeric_std.ALL;
 
ENTITY echo_testbench IS
END echo_testbench;
 
ARCHITECTURE behavior OF echo_testbench IS 
 
    -- Component Declaration for the Unit Under Test (UUT)
 
    COMPONENT echo
    PORT(
         data_i : IN  std_logic_vector(7 downto 0);
         stb_i : IN  std_logic;
         ack_rec_o : OUT  std_logic;
         data_o : OUT  std_logic_vector(7 downto 0);
         stb_o : OUT  std_logic;
         ack_send_i : IN  std_logic;
         done_i : IN  std_logic;
         package_length_o : OUT  std_logic_vector(15 downto 0);
         clk : IN  std_logic
        );
    END COMPONENT;
    

   --Inputs
   signal data_i : std_logic_vector(7 downto 0) := (others => '0');
   signal stb_i : std_logic := '0';
   signal ack_send_i : std_logic := '0';
   signal done_i : std_logic := '0';
   signal clk : std_logic := '0';

 	--Outputs
   signal ack_rec_o : std_logic;
   signal data_o : std_logic_vector(7 downto 0);
   signal stb_o : std_logic;
   signal package_length_o : std_logic_vector(15 downto 0);

   -- Clock period definitions
   constant clk_period : time := 10 ns;
 
BEGIN
 
	-- Instantiate the Unit Under Test (UUT)
   uut: echo PORT MAP (
          data_i => data_i,
          stb_i => stb_i,
          ack_rec_o => ack_rec_o,
          data_o => data_o,
          stb_o => stb_o,
          ack_send_i => ack_send_i,
          done_i => done_i,
          package_length_o => package_length_o,
          clk => clk
        );

   -- Clock process definitions
   clk_process :process
   begin
		clk <= '0';
		wait for clk_period/2;
		clk <= '1';
		wait for clk_period/2;
   end process;
 

   -- Stimulus process
   stim_proc: process
   begin		
      -- hold reset state for 100 ns.
      wait for 100 ns;	

      wait for clk_period*10;

      -- insert stimulus here 

      wait;
   end process;

END;
