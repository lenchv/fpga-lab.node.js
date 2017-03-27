----------------------------------------------------------------------------------
-- Echo устройство
----------------------------------------------------------------------------------
library STD;
use STD.textio.all; 
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use ieee.numeric_std.all;
use IEEE.STD_LOGIC_ARITH.ALL;
use IEEE.STD_LOGIC_UNSIGNED.ALL;

use ieee.std_logic_textio.all; 

-- Uncomment the following library declaration if using
-- arithmetic functions with Signed or Unsigned values
--use IEEE.NUMERIC_STD.ALL;

-- Uncomment the following library declaration if instantiating
-- any Xilinx primitives in this code.
--library UNISIM;
--use UNISIM.VComponents.all;

entity echo is
	port ( 
		data_i: in std_logic_vector(7 downto 0); -- входной байт
		stb_i: in std_logic; -- флаг наличия байта на входе
		ack_rec_o: out std_logic; -- флаг разрешения приема байта

		data_o: out std_logic_vector(7 downto 0); -- выходной байт
		stb_o: out std_logic; -- флаг наличия байта для передачи
		ack_send_i: in std_logic; -- флаг разрешения передачи

		done_i: in std_logic; -- флаг завершения приема пакета
		package_length_o: out std_logic_vector(15 downto 0); -- длина возвращаемого пакета данных
		clk: in std_logic
		-- rst: todo add
	);
end echo;

architecture Behavioral of echo is
	-- тип буффера для пакета данных
	type bufer_type is array (0 to 2**15) of std_logic_vector(7 downto 0);
	-- тип состояний компонента
	type state_type is (
		receive_byte, -- прием байта
		middleware, -- промежуточная обработка
		send_byte -- передача байта
	);
	-- Тип состояний для парсера
--	type parser_state_type is (
--		sendAA,
--		send55,
--		lengthHigh,
--		lengthLow,
--		deviceCode,
--		data
--	);

	signal buff : bufer_type:= (others => (others => '0'));
	signal ofs : std_logic_vector(15 downto 0) := (others => '0'); -- natural
	signal state: state_type := receive_byte;
--	signal parser_state: parser_state_type := sendAA;
	signal is_first_byte_send: std_logic := '1';
	signal rec_byte_ok: std_logic := '0';

	signal strobe_prev: std_logic := '0';
begin
main_proc: process(clk)
variable i: std_logic_vector(15 downto 0) := (others => '0'); -- natural
variable l: line;
begin 
	if rising_edge(clk) then
		-- 
		case state is 
			-- прием пакета
			when receive_byte =>
				-- если есть байт на входе
				if stb_i /= strobe_prev then
					-- записываем его в буффер
					buff(conv_integer(ofs)) <= data_i;
					-- увеличиваем смещение
					ofs <= ofs + '1';
					strobe_prev <= stb_i;
					-- если пакет принят полностью, переход к следующему состоянию
					if done_i = '1' then
						state <= middleware;
						rec_byte_ok <= '0';
						is_first_byte_send <= '1';	
						i := X"0000";
					else
						-- сообщаем о приеме байта
						rec_byte_ok <= '1';
					end if;
				end if;
			-- промежуточная обработка
			when middleware =>
				state <= send_byte;
			-- передача пакета
			when send_byte =>
				-- если пакет можно передавать
				if ack_send_i = '1' then
					-- если данных нет
					if i = ofs - '1' then
						-- переходим к приему пакета
						state <= receive_byte;
						ofs <= X"0000";
						stb_o <= '0';
					else -- если данные есть
						if is_first_byte_send = '1' then
							-- передаем длину
							package_length_o <= ofs - '1';
							is_first_byte_send <= '0';
						else
							-- передаем байт
							data_o <= buff(conv_integer(i));
							i := i + '1';
						end if;
						stb_o <= '1';
					end if;
				end if;
		end case;
	end if;
end process;

ack_rec_o <= stb_i and rec_byte_ok;
--	case state is
--		when receive_byte =>
--			if rising_edge(strobe_i) then
--				if done_i = '0' then
--					buff(conv_integer(ofs)) <= data_i;
--					ofs <= ofs + '1';
--				else
--					state <= send_byte;
--				end if;
--			end if;
--		when send_byte =>
--			if strobe_o = '1' then
--				ack_o <= '1';
--				case parser_state is
--					when sendAA =>
--						data_o <= X"AA";
--						parser_state <= send55;
--					when send55 =>
--						data_o <= X"55";
--						parser_state <= lengthHigh;	
--					when lengthHigh =>
--						data_o <= unsigned(ofs(address_width - 1 downto address_width / 2));
--						parser_state <= lengthLow;
--					when lengthLow =>
--						data_o <= unsigned(ofs(address_width / 2 - 1 downto 0));
--						parser_state <= deviceCode;
--					when deviceCode =>
--						data_o <= X"01";
--						parser_state <= data;
--					when data =>
--						if conv_integer(ofs) = 0 then
--							parser_state <= sendAA;
--							state <= receive_byte;
--							ack_o <= '0';
--						else							
--							ofs <= ofs - '1';
--							data_o <= buff(conv_integer(ofs));
--						end if;
--				end case;
--			end if;
--	end case;

end Behavioral;

