--------------------------------------------------------------------------------
-- Company: 
-- Engineer:
--
-- Create Date:   16:52:07 04/02/2017
-- Design Name:   
-- Module Name:   D:/VHDL/UART_TEST/tb_rs232_rec.vhd
-- Project Name:  UART_TEST
-- Target Device:  
-- Tool versions:  
-- Description:   
-- 
-- VHDL Test Bench Created by ISE for module: rs232_receiver
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
 
ENTITY tb_rs232_rec IS
END tb_rs232_rec;
 
ARCHITECTURE behavior OF tb_rs232_rec IS 
   constant system_speed: natural := 11538500;
  constant baudrate: natural := 9600;
  constant max_counter: natural := (system_speed / baudrate);
    -- Component Declaration for the Unit Under Test (UUT)
 

    

   --Inputs
   signal ack_i : std_logic := '0';
   signal clk_i : std_logic := '0';
   signal rst_i : std_logic := '0';
   signal rx : std_logic := '0';

 	--Outputs
   signal dat_o : unsigned(7 downto 0);
   signal stb_o : std_logic;

   -- Clock period definitions
   constant clk_i_period : time := 10 ns;
   type STATE_TYPE is (
    S_DOIT,
    S_WAIT
  );

  signal rs232_receiver_state: STATE_TYPE := S_WAIT;
type state_type2 is (
    s_start,
    s_data,
    s_stop
  );
   signal state: state_type2 := s_start;
  type bufer_type is array (0 to 64) of std_logic_vector(7 downto 0);

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
   uut: entity work.rs232_receiver 
	generic map (system_speed, baudrate)
	PORT MAP (
          ack_i => ack_i,
          clk_i => clk_i,
          dat_o => dat_o,
          rst_i => rst_i,
          stb_o => stb_o,
          rx => rx
        );

   -- Clock process definitions
   clk_i_process :process
   begin
		clk_i <= '0';
		wait for clk_i_period/2;
		clk_i <= '1';
		wait for clk_i_period/2;
   end process;
 

  rs232_receive_proc: process(clk_i)
  begin
    if rising_edge(clk_i) then
      case rs232_receiver_state is
        -- ожидаем взвода strobe
        when S_WAIT =>
          if stb_o = '1' then
             -- переход к ожиданию окончания считывания байта
            rs232_receiver_state <= S_DOIT;
            ack_i <= '1';
          end if;
        -- ожидаем окончание принятия байта
        when S_DOIT => 
        if stb_o <= '0' then
          ack_i <= '0';
          -- ожидаем следующий байт
          rs232_receiver_state <= S_WAIT;
        end if;
      end case;
    end if;
  end process;

 -- Stimulus process
   stim_proc: process(clk_i)
    variable bit_i: integer := 0;
    variable i: integer := 0;
    variable bit_counter: integer := max_counter;
   begin    
      if rising_edge(clk_i) then
          case state is
            when s_start =>
              rx <= '0';
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
                  rx <= '1';
                else
                  rx <= buff(i)(bit_i);
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
      end if;     
   end process;

END;
