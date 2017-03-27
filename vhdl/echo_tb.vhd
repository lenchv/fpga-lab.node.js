--------------------------------------------------------------------------------
-- Company: 
-- Engineer:
--
-- Create Date:   16:57:41 03/26/2017
-- Design Name:   
-- Module Name:   D:/VHDL/UART_TEST/echo_tb.vhd
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
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use ieee.numeric_std.all;
use IEEE.STD_LOGIC_ARITH.ALL;
use IEEE.STD_LOGIC_UNSIGNED.ALL;
 
-- Uncomment the following library declaration if using
-- arithmetic functions with Signed or Unsigned values
--USE ieee.numeric_std.ALL;
 
ENTITY echo_tb IS
END echo_tb;
 
ARCHITECTURE behavior OF echo_tb IS 
 
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
			clk: in std_logic
        );
    END COMPONENT;
    

   --Inputs
   signal data_i : std_logic_vector(7 downto 0) := (others => '0');
   signal stb_i : std_logic := '0';
   signal ack_send_i : std_logic := '0';
   signal done_i : std_logic := '0';

 	--Outputs
   signal ack_rec_o : std_logic;
   signal data_o : std_logic_vector(7 downto 0);
   signal stb_o : std_logic;
   signal package_length_o : std_logic_vector(15 downto 0);
   -- No clocks detected in port list. Replace <clock> below with 
   -- appropriate port name 
	signal clk: std_logic;
   constant clk_period : time := 10 ns;

   type state_type is (
      doit,
      wait_ack,
      done,
      wait_strobe,
      receive
    );

    type parser_state_type is (
      sendAA,
      send55,
      lengthHigh,
      lengthLow,
      deviceCode,
      data
    );

   signal state_send: state_type := doit;
   signal state_parse: parser_state_type := sendAA;

   type bufer_type is array (0 to 2**15) of std_logic_vector(7 downto 0);

   signal buff: bufer_type := (
      (X"81"),
      (X"18"),
      (X"0F"),
      (X"F0"),
      (X"3C"),
      (X"C3"),
		others => (others => '0')
    );
   signal buff_out: bufer_type := (others => (others => '0'));
   signal ofs: integer := 0;
   signal ofs_out: integer := 0;
   signal length: std_logic_vector(15 downto 0) := (others => '0');
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
 

   send_byte: process(clk)
   begin
    if rising_edge(clk) then
      case state_send is
        when doit =>
          data_i <= buff(ofs);
          ofs <= ofs + 1;
          stb_i <= '1';
          if ofs >= 5 then -- на 1 меньше, потому что сигнал
            ofs <= 0;
            state_send <= done;
            done_i <= '1';
          else
            state_send <= wait_ack;
          end if;
        when wait_ack =>
          if ack_rec_o = '1' then
            stb_i <= '0';
            state_send <= doit;
          end if;
        when done =>
          stb_i <= '0';
          ack_send_i <= '1';
          state_send <= wait_strobe;
        when wait_strobe =>
          if stb_o = '1' then
            done_i <= '0';
            state_send <= receive;
            -- длина
          end if;
        when receive =>
--          case state_parse is
--            sendAA,
--            send55,
--            lengthHigh,
--            lengthLow,
--            deviceCode,
--            data
--          end case;
          if stb_o = '1' then
            buff_out(ofs_out) <= data_o;
            ofs_out <= ofs_out + 1;
          else
            stb_i <= '1';
            ack_send_i <= '0';
            state_send <= doit;
          end if;
      end case;
    end if;
   end process;
	
--  rec_byte: process(clk)
--  begin
--    if rising_edge(clk) then
--      case state_rec is
--        when wait_ack =>
--          ack_send_i <= '1';
--          if stb_o = '1' then
--            state_rec <= doit;
--          end if;
--        when doit =>
--
--        when done =>
--      end case;
--    end if;
--  end process;

   -- Stimulus process
--   stim_proc: process
--   begin		
--      -- hold reset state for 100 ns.
--      wait for 100 ns;	
--
--      wait for clk_period*10;
		--
--		data_i <= X"AA";
--		stb_i <= '1';
--		wait for clk_period; 
--      if ack_rec_o = '1' then
--			stb_i <= '0';
--		end if;
--		data_i <= X"55";
--		done_i <= '1';
--		stb_i <= '1';
--      wait for clk_period*2;
--		done_i <= '0';
--		stb_i <= '0';
--		ack_send_i <= '1';
		--
--      wait for clk_period*3;
--		ack_send_i <= '0';
--		stb_i <= '1';
--		data_i <= X"0F";
		--
--      wait for clk_period*4;
--		data_i <= X"F0";
		--
--      wait for clk_period*5;
--		data_i <= X"3C";
--		done_i <= '1';
		--
--		wait for clk_period*6;
--		done_i <= '0';
--		stb_i <= '0';
--		ack_send_i <= '1';
--      wait;
--   end process;

END;






-- modelSim > v.15
-- набросать ТЗ