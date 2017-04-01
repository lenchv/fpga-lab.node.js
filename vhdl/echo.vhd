----------------------------------------------------------------------------------
-- Echo ����������
----------------------------------------------------------------------------------
library STD;
use STD.textio.all; 
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use ieee.numeric_std.all;
use IEEE.STD_LOGIC_ARITH.ALL;
use IEEE.STD_LOGIC_UNSIGNED.ALL;

-- Uncomment the following library declaration if using
-- arithmetic functions with Signed or Unsigned values
--use IEEE.NUMERIC_STD.ALL;

-- Uncomment the following library declaration if instantiating
-- any Xilinx primitives in this code.
--library UNISIM;
--use UNISIM.VComponents.all;

entity echo is
  port ( 
    -- receive
    data_i: in std_logic_vector(7 downto 0); -- ������� ����
    stb_i: in std_logic; -- ���� ������� ����� �� �����
    ack_rec_o: out std_logic; -- ���� ���������� ������ �����
    ready_receive_o: out std_logic; -- ���� ���������� ������

    -- send
    data_o: out std_logic_vector(7 downto 0); -- �������� ����
    stb_o: out std_logic; -- ���� ������� ����� ��� ��������
    ack_send_i: in std_logic; -- ���� ���������� ��������
    ready_send_o: out std_logic; -- ���� ���������� ��������


    done_i: in std_logic; -- ���� ���������� ������ ������
    package_length_o: out std_logic_vector(15 downto 0); -- ����� ������������� ������ ������
    clk: in std_logic
    -- rst: todo add
  );
end echo;

architecture Behavioral of echo is
  -- ��� ������� ��� ������ ������
  type bufer_type is array (0 to 2**15) of std_logic_vector(7 downto 0);
  -- ��� ��������� ����������
  type state_type is (
    ready_rec,
    receive_byte, -- ����� �����
    middleware, -- ������������� ���������
    send_byte -- �������� �����
  );
  -- ��� ��������� ��� �������
  signal buff : bufer_type:= (others => (others => '0'));
  signal state: state_type := ready_rec;
  signal is_first_byte_send: std_logic := '1';
  signal rec_byte_ok: std_logic := '0';

--  signal strobe_prev: std_logic := '0';
begin
main_proc: process(clk)
  variable ofs: integer := 0; -- natural
  variable i: integer := 0; -- natural
begin 
  if rising_edge(clk) then
    -- 
    case state is
      when ready_rec =>
        ready_send_o <= '0';        
        ready_receive_o <= '1';
        stb_o <= '0';
        ack_rec_o <= '0';
        -- ���� ���� ���� �� �����
        if stb_i = '1' then
          ready_receive_o <= '0';
          state <= receive_byte;
          rec_byte_ok <= '0';
        end if; 
      -- ����� ������
      when receive_byte =>
        -- ���������� ��� � ������
        buff(ofs) <= data_i;
        -- ����������� ��������
        ofs := ofs + 1;
        -- ���� ����� ������ ���������, ������� � ���������� ���������
        if done_i = '1' then
          state <= middleware;
          ack_rec_o <= '0';
          is_first_byte_send <= '1';  
          i := 0;
        else
          state <= ready_rec;
          -- �������� � ������ �����
          ack_rec_o <= '1';
        end if;
      -- ������������� ���������
      when middleware =>
        state <= send_byte;
        ready_send_o <= '1';
      -- �������� ������
      when send_byte =>
        -- ���� ����� ����� ����������
        if ack_send_i = '1' then
          -- ���� ������ ���
          if i = ofs then
            -- ��������� � ������ ������
            state <= ready_rec;
            ofs := 0;
            stb_o <= '0';
          else -- ���� ������ ����
            if is_first_byte_send = '1' then
              -- �������� �����
              package_length_o <= std_logic_vector(to_unsigned(ofs, package_length_o'length));
              is_first_byte_send <= '0';
            else
              -- �������� ����
              data_o <= buff(i);
              i := i + 1;
            end if;
            stb_o <= '1';
          end if;
        end if;
    end case;
  end if;
end process;

end Behavioral;

