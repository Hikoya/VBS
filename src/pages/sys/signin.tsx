import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { signIn } from 'next-auth/react';

import { checkerString } from '@constants/sys/helper';

export default function SignIn(props) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const emailDB = useRef('');
  const [errorMsg, setError] = useState(null);

  const [url, setURL] = useState('https://vbs-kevii.vercel.app'); // default

  useEffect(() => {
    async function fetchData(propsField) {
      const propRes = await propsField;
      if (checkerString(propRes.data)) {
        setURL(propRes.data);
      }
    }
    fetchData(props);
  }, [url, props]);

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (checkerString(emailDB.current) && emailDB.current.includes('@')) {
      try {
        setError(null);
        setLoading(true);
        await signIn('email', {
          email: email,
          callbackUrl: `${url}/sys`,
        });
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    } else {
      setError('Please enter a valid email');
    }
  };

  return (
    <Flex minH='100vh' align='center' justify='center' bg='gray.50'>
      <Stack spacing={8} mx='auto' maxW='lg' py={12} px={6}>
        <Stack align='center'>
          <Heading fontSize='4xl'>KEVII</Heading>
          <Text fontSize='sm' color='gray.600'>
            Please enter your school email ending with @u.nus.edu
          </Text>
        </Stack>

        {errorMsg && (
          <Stack align='center'>
            <Text>{errorMsg}</Text>
          </Stack>
        )}

        <Box rounded='lg' bg='white' boxShadow='lg' p={8}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <FormControl id='email'>
                <FormLabel>Email address</FormLabel>
                <Input
                  type='email'
                  placeholder='test@u.nus.edu'
                  size='lg'
                  onChange={(event) => {
                    setEmail(event.currentTarget.value);
                    emailDB.current = event.currentTarget.value;
                  }}
                />
              </FormControl>
              <Stack spacing={10}>
                <Button
                  type='submit'
                  bg='blue.400'
                  color='white'
                  _hover={{
                    bg: 'blue.500',
                  }}
                >
                  Sign in
                </Button>
              </Stack>
            </Stack>
          </form>

          {loading && (
            <Stack spacing={10} mt={5}>
              <Stack align='center'>
                <Text fontSize='sm' color='gray.600'>
                  Logging in...
                </Text>
                <Spinner />
              </Stack>
            </Stack>
          )}
        </Box>
      </Stack>
    </Flex>
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
