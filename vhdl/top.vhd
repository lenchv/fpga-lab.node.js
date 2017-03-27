----------------------------------------------------------------------------------
-- Company: 
-- Engineer: 
-- 
-- Create Date:    14:44:38 06/25/2016 
-- Design Name: 
-- Module Name:    top - Behavioral 
-- Project Name: 
-- Target Devices: 
-- Tool versions: 
-- Description: 
--
-- Dependencies: 
--
-- Revision: 
-- Revision 0.01 - File Created
-- Additional Comments: 
--
----------------------------------------------------------------------------------
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use ieee.numeric_std.all;

-- Uncomment the following library declaration if using
-- arithmetic functions with Signed or Unsigned values
--use IEEE.NUMERIC_STD.ALL;

-- Uncomment the following library declaration if instantiating
-- any Xilinx primitives in this code.
--library UNISIM;
--use UNISIM.VComponents.all;

entity top is
  port(
    clk_50mhz: in std_logic;
	 reset: in std_logic;
    rs232_dce_txd: out std_logic;
    rs232_dce_rxd: in std_logic;
    led: out unsigned(7 downto 0));
end top;

architecture Behavioral of top is
	constant system_speed: natural := 11538500;
	constant baudrate: natural := 9600;

	signal rs232_receiver_ack: std_logic := '0';
	signal rs232_receiver_dat: unsigned(7 downto 0) := (others => '0');
	signal rs232_receiver_stb: std_logic := '0';

	signal rs232_sender_ack: std_logic := '0';
	signal rs232_sender_dat: unsigned(7 downto 0);
	signal rs232_sender_stb: std_logic := '0';

	signal counter: natural range 0 to (system_speed / 2) := 0;
	-- Тип состояний для КОМ порта
	type rs232_state_type is (
		wait_for_command,
		wait_for_strobe
	);
	-- Тип состояний для парсера
	type parser_state_type is (
		waitAA,
		wait55,
		lengthHigh,
		lengthLow,
		deviceCode,
		data
	);

	signal rs232_sender_state: rs232_state_type := wait_for_command;
	signal parse_sender_state: parser_state_type := waitAA;

	signal rs232_receiver_state: rs232_state_type := wait_for_command;
	signal parse_receiver_state: parser_state_type := waitAA;

	signal RECEIVE_DEVICE_CODE: unsigned(7 downto 0); -- код устройства для идентификации
	signal RECEIVE_PACKAGE_LENGTH: unsigned(15 downto 0) := (others => '0'); -- дллина пакета
	signal RECEIVE_PACKAGE_DONE: std_logic := '0'; -- флаг принятия пакета
	
	signal SEND_DATA: unsigned(7 downto 0);
	signal SEND_ACK: std_logic := '0';
	signal SEND_STROBE: std_logic := '0';
	
	-- Сигналы для устройств
	-- echo
	signal echo_strobe: std_logic := '0';

	signal clk_main: std_logic;
	signal rst_main: std_logic;
	signal PLL_LOCKED_OUT: std_logic;
	COMPONENT coregen
		PORT(
			CLKIN_IN : IN std_logic;
			RST_IN : IN std_logic;          
			CLKFX_OUT : OUT std_logic;
			CLKIN_IBUFG_OUT : OUT std_logic;
			CLK0_OUT : OUT std_logic;
			LOCKED_OUT : OUT std_logic
		);
	END COMPONENT;
  
begin
	-- CLK
	Inst_coregen: coregen PORT MAP(
		CLKIN_IN => clk_50mhz,
		RST_IN => reset,
		CLKFX_OUT => clk_main,
		CLKIN_IBUFG_OUT => open,
		CLK0_OUT => open,
		LOCKED_OUT => PLL_LOCKED_OUT
	);
	rst_main <= not PLL_LOCKED_OUT;
	-- Отправляет байт по com порту
	sender: entity work.rs232_sender
    generic map(system_speed, baudrate)
    port map(
      ack_o => rs232_sender_ack,
      clk_i => clk_main,
      dat_i => rs232_sender_dat,
      rst_i => rst_main,
      stb_i => rs232_sender_stb,
      tx => rs232_dce_txd);
    -- Принимает байт с com порта
  	receiver: entity work.rs232_receiver
    generic map(system_speed, baudrate)
    port map(
      ack_i => rs232_receiver_ack,
      clk_i => clk_main,
      dat_o => rs232_receiver_dat,
      rst_i => rst_main,
      stb_o => rs232_receiver_stb,
      rx => rs232_dce_rxd);
	
	echo_dev: entity work.echo
	  generic map(16, 1)
	  port map(
			strobe_i => echo_strobe,
			data_i => rs232_receiver_dat,
			done_i => RECEIVE_PACKAGE_DONE,
			strobe_o => SEND_STROBE,
			data_o => SEND_DATA,
			ack_o => SEND_ACK
	  );
	  
	  echo_strobe <= '0';
	 -- Принимает пакет данных и передает на коммутатор
    receive_data_proc: process(clk_main)
    begin
    	if rising_edge(clk_main) then
    		case rs232_receiver_state is
    			-- ожидаем взвода strobe
    			when wait_for_command =>
    				if rs232_receiver_stb = '1' then
						rs232_receiver_state <= wait_for_strobe; -- переход к ожиданию окончания считывания байта
						rs232_receiver_ack <= '1';
					end if;
				-- ожидаем окончание принятия байта
    			when wait_for_strobe =>
    				if rs232_receiver_stb <= '0' then
						rs232_receiver_ack <= '0';
						rs232_receiver_state <= wait_for_command; -- ожидаем следующий байт
						-- парсим принятый пакет данных 0xAA 0x55 <length> <code> <data>
						case parse_receiver_state is
							when waitAA =>
								if rs232_receiver_dat = X"AA" then 
									RECEIVE_PACKAGE_DONE <= '0';
									parse_receiver_state <= wait55;
								end if;
							when wait55 =>
								if rs232_receiver_dat = X"55" then 
									parse_receiver_state <= lengthHigh;
								else
									parse_receiver_state <= waitAA;
								end if;
							when lengthHigh =>
								RECEIVE_PACKAGE_LENGTH <= rs232_receiver_dat & RECEIVE_PACKAGE_LENGTH(7 downto 0);
								parse_receiver_state <= lengthLow;
							when lengthLow =>
								RECEIVE_PACKAGE_LENGTH <= rs232_receiver_dat & RECEIVE_PACKAGE_LENGTH(15 downto 8);
								parse_receiver_state <= deviceCode;
							when deviceCode =>
								parse_receiver_state <= data;
								RECEIVE_DEVICE_CODE <= rs232_receiver_dat;
							when data =>

								-- здесь взвод смена строба устройства
								case RECEIVE_DEVICE_CODE is
									when X"01" =>
										echo_strobe <= not echo_strobe;
									when others =>
								end case;
								rs232_receiver_ack <= '0';
								rs232_receiver_state <= wait_for_command;

								RECEIVE_PACKAGE_LENGTH <= RECEIVE_PACKAGE_LENGTH - X"0001";
								if RECEIVE_PACKAGE_LENGTH = X"0000" then
									parse_receiver_state <= waitAA;
									RECEIVE_PACKAGE_DONE <= '1';
								end if;
						end case;							
					end if;
    		end case;
    	end if;
    end process receive_data_proc;

    -- Отправляет пакет данных
    -- доделать
    send_data_proc: process(clk_main)
    begin
    	if rising_edge(clk_main) then
    		case rs232_sender_state is
    			when wait_for_command =>
    				if SEND_ACK = '0' and rs232_sender_ack = '0' then
						rs232_sender_state <= wait_for_strobe;
						rs232_sender_stb <= '1';
						rs232_sender_dat <= SEND_DATA;
					end if;
    			when wait_for_strobe =>
    				if rs232_sender_ack = '1' then
						rs232_sender_stb <= '0';
						rs232_sender_state <= wait_for_command;
						SEND_STROBE <= '1';
					end if;
    		end case;
    	end if;
    end process;
end Behavioral;