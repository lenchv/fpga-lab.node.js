----------------------------------------------------------------------------------
-- Устройство: эхо передатчик. Для отладки
-- Код: 0x01
----------------------------------------------------------------------------------
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use ieee.numeric_std.all;
use IEEE.STD_LOGIC_UNSIGNED.ALL;

entity echo is
  port ( 
    -- receive
--    data_i: in std_logic_vector(7 downto 0); -- входной байт
--    stb_i: in std_logic; -- флаг наличия байта на входе
--    ack_rec_o: out std_logic; -- флаг разрешения приема байта
--    ready_receive_o: out std_logic; -- флаг готовности приема
--
--    -- send
--    data_o: out std_logic_vector(7 downto 0); -- выходной байт
--    stb_o: out std_logic; -- флаг наличия байта для передачи
--    ack_send_i: in std_logic; -- флаг разрешения передачи
--    ready_send_o: out std_logic; -- флаг готовности передачи
--
--
--    done_i: in std_logic; -- флаг завершения приема пакета
--    package_length_o: out std_logic_vector(15 downto 0); -- длина возвращаемого пакета данных
    
    data_i: in std_logic_vector(7 downto 0); -- входной байт
    data_o: out std_logic_vector(7 downto 0); -- выходной байт

    read_i: in std_logic;
    write_i: in std_logic;

    length_o: out std_logic_vector(3 downto 0); -- длина возвращаемого пакета данных
    full_o: out std_logic;
    empty_o: out std_logic;
    clk: in std_logic;
    reset: in std_logic
  );
end echo;

architecture Behavioral of echo is
  -- тип буффера для пакета данных
  type bufer_type is array (0 to 15) of std_logic_vector(7 downto 0);
  -- тип состояний компонента
--  type state_type is (
--    ready_rec,
--    receive_byte, -- прием байта
--    middleware, -- промежуточная обработка
--    send_byte -- передача байта
--  );
  -- Тип состояний для парсера
  signal buff : bufer_type:= (others => (others => '0'));
--  signal state: state_type := ready_rec;
--  signal is_first_byte_send: std_logic := '1';

  signal tail, head, length: unsigned(3 downto 0) := (others => '0');
  signal looped, empty, full: std_logic := '0';
--  signal strobe_prev: std_logic := '0';
begin

length_o <= std_logic_vector(length);
empty <= '1' when tail = head and looped /= '1' else '0';
full <= '1' when tail = head and looped = '1' else '0';

full_o <= full;
empty_o <= empty;

main_proc: process(clk, reset)
begin
  if reset = '1' then
    looped <= '0';
    length <= "0000";
    tail <= "0000";
    head <= "0000";
  elsif rising_edge(clk) then
    if read_i = '1' and empty = '0' then
      data_o <= buff(to_integer(tail));
      length <= length - 1;
      if tail = "1111" then
        tail <= "0000";
        looped <= '0';
      else
        tail <= tail + 1;      
      end if;
    end if;

    if write_i = '1' and full = '0' then
      buff(to_integer(head)) <= data_i;
      length <= length + 1;
      if head = "1111" then
        head <= "0000";
        looped <= '1';
      else
        head <= head + 1;
      end if;
    end if;
  end if;
end process;

--e 0
--f 0
--
   --0 1 2 3 4 5 6 7 8 9
--H    ^                
--T    ^    
-- main_proc: process(clk)
--   variable ofs: integer := 0; -- natural
--   variable i: integer := 0; -- natural
-- begin 
--   if rising_edge(clk) then
--     -- 
--     case state is
--       when ready_rec =>
--         ready_send_o <= '0';        
--         ready_receive_o <= '1';
--         stb_o <= '0';
--         ack_rec_o <= '0';
--         -- если есть байт на входе
--         if stb_i = '1' then
--           ready_receive_o <= '0';
--           state <= receive_byte;
--         end if; 
--       -- прием пакета
--       when receive_byte =>
--         -- записываем его в буффер
--         buff(ofs) <= data_i;
--         -- увеличиваем смещение
--         ofs := ofs + 1;
--         -- если пакет принят полностью, переход к следующему состоянию
--         if done_i = '1' then
--           state <= middleware;
--           ack_rec_o <= '0';
--           is_first_byte_send <= '1';  
--           i := 0;
--         else
--           state <= ready_rec;
--           -- сообщаем о приеме байта
--           ack_rec_o <= '1';
--         end if;
--       -- промежуточная обработка
--       when middleware =>
--         state <= send_byte;
--         ready_send_o <= '1';
--       -- передача пакета
--       when send_byte =>
--         -- если пакет можно передавать
--         if ack_send_i = '1' then
--           -- если данных нет
--           if i = ofs then
--             -- переходим к приему пакета
--             state <= ready_rec;
--             ofs := 0;
--             stb_o <= '0';
--           else -- если данные есть
--             if is_first_byte_send = '1' then
--               -- передаем длину
--               package_length_o <= std_logic_vector(to_unsigned(ofs, package_length_o'length));
--               is_first_byte_send <= '0';
--             else
--               -- передаем байт
--               data_o <= buff(i);
--               i := i + 1;
--             end if;
--             stb_o <= '1';
--           end if;
--         end if;
--     end case;
--   end if;
-- end process;

end Behavioral;

