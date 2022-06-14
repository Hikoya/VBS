import React, { useState, useEffect } from 'react';
import {
  Avatar,
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
} from '@chakra-ui/react';
import { FiChevronDown } from 'react-icons/fi';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function UserProfile({ session }, props) {
  const [admin, setAdmin] = useState(null);
  const [name, setName] = useState(null);
  const [url, setURL] = useState('https://vbs-kevii.vercel.app'); // default
  const router = useRouter();

  useEffect(() => {
    async function fetchData(sessionField, propsField) {
      const adminField = sessionField && sessionField.user.admin ? 'Admin' : '';
      const nameField =
        sessionField && sessionField.user.username
          ? sessionField.user.username
          : '';
      setAdmin(adminField);
      setName(nameField);

      const propRes = await propsField;
      try {
        if (propRes.data) {
          setURL(propRes.data);
        }
      } catch (error) {
        console.log(error);
      }
    }
    fetchData(session, props);
  }, [url, props, session]);

  return (
    <HStack spacing={{ base: '0', md: '6' }}>
      <Flex alignItems='center'>
        <Menu>
          <MenuButton
            py={2}
            transition='all 0.3s'
            _focus={{ boxShadow: 'none' }}
          >
            <HStack spacing='4'>
              <Avatar
                size='md'
                src='https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_960_720.png'
              />
              <VStack
                display={{ base: 'none', md: 'flex' }}
                alignItems='flex-start'
                spacing='1px'
                ml='2'
              >
                <Text fontSize='md'>{name}</Text>
                <Text fontSize='sm' color='gray.600'>
                  {admin}
                </Text>
              </VStack>
              <Box display={{ base: 'none', md: 'flex' }}>
                <FiChevronDown />
              </Box>
            </HStack>
          </MenuButton>
          <MenuList fontSize='lg' bg='white' borderColor='gray.200'>
            <MenuItem onClick={() => router.push('/sys/profile')}>
              Profile
            </MenuItem>
            <MenuDivider />
            <MenuItem
              onClick={() => signOut({ callbackUrl: `${url}/sys/signin` })}
            >
              Sign out
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </HStack>
  );
}

export async function getServerSideProps() {
  return {
    props: (async function Props() {
      try {
        return {
          data: process.env.NEXTAUTH_URL,
        };
      } catch (error) {
        console.error(error);
        return {
          data: null,
        };
      }
    })(),
  };
}
