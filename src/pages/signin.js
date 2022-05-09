import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react'
import * as React from 'react'
import { Logo } from '../components/Logo'
import { signIn } from "next-auth/react";

export const App = () => {

  const [email, setEmail] = useState('');

  const handleSubmit = async event => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await signIn("email", { email: email, callbackUrl: `${window.location.origin}/`, });
      setIsLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Container
    maxW="lg"
    py={{
      base: '12',
      md: '24',
    }}
    px={{
      base: '0',
      sm: '8',
    }}
  >
    <Stack spacing="8">
      <Stack spacing="6">
        <Logo />
        <Stack
          spacing={{
            base: '2',
            md: '3',
          }}
          textAlign="center"
        >
          <Heading
            size={useBreakpointValue({
              base: 'xs',
              md: 'sm',
            })}
          >
            Log in to your account
          </Heading>
        </Stack>
      </Stack>
      <Box
        py={{
          base: '0',
          sm: '8',
        }}
        px={{
          base: '4',
          sm: '10',
        }}
        bg={useBreakpointValue({
          base: 'transparent',
          sm: 'bg-surface',
        })}
        boxShadow={{
          base: 'none',
          sm: useColorModeValue('md', 'md-dark'),
        }}
        borderRadius={{
          base: 'none',
          sm: 'xl',
        }}
      >
        <form onSubmit={handleSubmit}>
        <Stack spacing="6">
          <Stack spacing="5">
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input
                    type="email"
                    placeholder="test@u.nus.edu"
                    size="lg"
                    onChange={event => setEmail(event.currentTarget.value)}
                  />
            </FormControl>  
          </Stack>          
          <Stack spacing="6">
            <Button variant="primary">Sign in</Button>
          </Stack>
        </Stack>
        </form>
      </Box>
    </Stack>
  </Container>
  )
}
