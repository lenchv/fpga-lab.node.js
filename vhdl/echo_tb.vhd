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
         ready_receive_o: out std_logic;
         
         data_o : OUT  std_logic_vector(7 downto 0);
         stb_o : OUT  std_logic;
         ack_send_i : IN  std_logic;
         ready_send_o: out std_logic;

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
   signal ready_receive_o : std_logic;

 	--Outputs
   signal ack_rec_o : std_logic;
   signal data_o : std_logic_vector(7 downto 0);
   signal stb_o : std_logic;
   signal package_length_o : std_logic_vector(15 downto 0);
   signal ready_send_o : std_logic;
   -- No clocks detected in port list. Replace <clock> below with 
   -- appropriate port name 
	signal clk: std_logic;
   constant clk_period : time := 10 ns;

   type state_type is (
      doit,
      wait_ack
    );

    type parser_state_type is (
      cAA,
      c55,
      lengthHigh,
      lengthLow,
      deviceCode,
      data
    );

   signal state_parse_send: parser_state_type := cAA;
   signal state_parse_rec: parser_state_type := cAA;
   signal state: state_type := doit;
   signal state_rec: state_type := wait_ack;


   type bufer_type is array (0 to 2**15) of std_logic_vector(7 downto 0);

   signal buff: bufer_type := (
      (X"AA"),
      (X"55"),
      (X"00"),
      (X"08"),
      (X"01"),
      (X"81"),
      (X"18"),
      (X"0F"),
      (X"F0"),
      (X"3C"),
      (X"C3"),
      (X"7E"),
      (X"E7"),
      (X"01"),
      (X"02"),
      (X"03"),
      (X"AA"),
      (X"55"),
      (X"00"),
      (X"05"),
      (X"02"),
      (X"01"),
      (X"02"),
      (X"03"),
      (X"04"),
      (X"05"),
		others => (others => '0')
    );
   signal buff_out: bufer_type := (others => (others => '0'));
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
          ready_send_o => ready_send_o,
          ready_receive_o => ready_receive_o,
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
 

   proc_receive: process(clk)
   variable i: integer := 0;
   variable code: std_logic_vector(7 downto 0) := (others => '0');
   variable len: std_logic_vector(15 downto 0) := (others => '0');
   begin
    if rising_edge(clk) then
      case state_parse_send is
        when cAA =>
          if buff(i) = X"AA" then
            done_i <= '0';
            state_parse_send <= c55;
          end if;
          i := i + 1;
        when c55 =>
          if buff(i) = X"55" then
            state_parse_send <= lengthHigh;
          else
            state_parse_send <= cAA;
          end if;
          i := i + 1;
        when lengthHigh =>
          len(15 downto 8) := buff(i);
          state_parse_send <= lengthLow;
          i := i + 1;
        when lengthLow =>
          len(7 downto 0) := buff(i);
          state_parse_send <= deviceCode;
          i := i + 1;
        when deviceCode =>
          code := buff(i);
          state_parse_send <= data;
          i := i + 1;
        when data =>
          if len = X"0000" then
            done_i <= '1';
            stb_i <= '0';    
            state_parse_send <= cAA;
            state <= doit;
          else
            case state is
              when doit =>
                if ack_rec_o = '0' and ready_receive_o = '1' then
                  data_i <= buff(i);
                  i := i + 1;
                  stb_i <= '1';
                  len := len - '1';
                  state <= wait_ack;
                end if;
              when wait_ack =>
                stb_i <= '0';
                if ack_rec_o = '1' then
                  state <= doit;
                end if;
            end case;
          end if;
      end case;

      if i > 26 then
        i := 0;
      end if;
    end if;
   end process;

   rec_proc: process(clk)
   variable i: integer := 0;
   variable len: std_logic_vector(15 downto 0) := (others => '0');
   begin
    if rising_edge(clk) and ready_send_o = '1' then
      case state_rec is
        when wait_ack =>
          ack_send_i <= '1';
          if stb_o = '1' then
            ack_send_i <= '0';
            len := package_length_o;
            state_rec <= doit;
          end if;
        when doit =>
          case state_parse_rec is
            when cAA =>
              buff_out(i) <= X"AA";
              i := i + 1;
              state_parse_rec <= c55;
            when c55 =>
              buff_out(i) <= X"55";
              i := i + 1;
              state_parse_rec <= lengthHigh;
            when lengthHigh =>
              buff_out(i) <= len(15 downto 8);
              i := i + 1;
              state_parse_rec <= lengthLow;
            when lengthLow =>
              buff_out(i) <= len(7 downto 0);
              i := i + 1;
              state_parse_rec <= deviceCode;
            when deviceCode =>
              ack_send_i <= '1';
              buff_out(i) <= X"01";
              i := i + 1;
              state_parse_rec <= data;
            when data =>
              if stb_o = '1' then
                buff_out(i) <= data_o;
                i := i + 1;
              else
                ack_send_i <= '0';
                state_rec <= wait_ack;
                state_parse_rec <= cAA;
              end if;
          end case;
      end case;
    end if;
   end process;
--   send_byte: process(clk)
--   variable len: integer := 6;
--   begin
--    if rising_edge(clk) then
--      case state_send is
--        when doit =>
--          if ack_rec_o = '0' then
--            data_i <= buff(ofs);
--            ofs <= ofs + 1;
--            stb_i <= '1';
--            if ofs >= len then
--              len := len - 1;
--              if len = 1 then
--                len := 6;
--              end if;
--              ofs <= 0;
--              state_send <= done;
--              done_i <= '1';
--            else
--              state_send <= wait_ack;
--            end if;
--          end if;
--        when wait_ack =>
--          stb_i <= '0';
--          if ack_rec_o = '1' then
--            state_send <= doit;
--          end if;
--        when done =>
--          stb_i <= '0';
--          ack_send_i <= '1';
--          state_send <= wait_strobe;
--        when wait_strobe =>
--          if stb_o = '1' then
--            done_i <= '0';
--            state_send <= receive;
--            -- длина
--          end if;
--        when receive =>
--          if stb_o = '1' then
--            buff_out(ofs_out) <= data_o;
--            ofs_out <= ofs_out + 1;
--          else
--            stb_i <= '1';
--            ack_send_i <= '0';
--            state_send <= doit;
--          end if;
--      end case;
--    end if;
--   end process;
	
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