import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
  Spinner,
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";

export default function SignIn(props) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [url, setURL] = useState("");

  useEffect(() => {
    async function fetchData(props) {
      const propRes = await props;
      try {
        if (propRes.data) {
          setURL(propRes.data);
        }
      } catch (error) {
        setURL("https://vbs-kevii.vercel.app");
        console.log(error);
      }
    }
    fetchData(props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      await signIn("email", {
        email: email,
        callbackUrl: url + "/",
      });
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  return (
    <Flex
      minH={"100vh"}
      align={"center"}
      justify={"center"}
      bg={useColorModeValue("gray.50", "gray.800")}
    >
      <Stack spacing={8} mx={"auto"} maxW={"lg"} py={12} px={6}>
        <Stack align={"center"}>
          <Heading fontSize={"4xl"}>KEVII VBS</Heading>
          <Text fontSize={"sm"} color={"gray.600"}>
            Please enter your school email ending with @u.nus.edu
          </Text>
        </Stack>
        <Box
          rounded={"lg"}
          bg={useColorModeValue("white", "gray.700")}
          boxShadow={"lg"}
          p={8}
        >
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <FormControl id="email">
                <FormLabel>Email address</FormLabel>
                <Input
                  type="email"
                  placeholder="test@u.nus.edu"
                  size="lg"
                  onChange={(event) => setEmail(event.currentTarget.value)}
                />
              </FormControl>
              <Stack spacing={10}>
                <Button
                  type="submit"
                  bg={"blue.400"}
                  color={"white"}
                  _hover={{
                    bg: "blue.500",
                  }}
                >
                  Sign in
                </Button>
              </Stack>
            </Stack>
          </form>

          {loading && (
            <>
              <Stack spacing={10}>
                <Stack align={"center"}>
                  <Text fontSize={"sm"} color={"gray.600"}>
                    Logging in...
                  </Text>
                  <Spinner />
                </Stack>
              </Stack>
            </>
          )}
        </Box>
      </Stack>
    </Flex>
  );
}

export async function getServerSideProps(_context) {
  return {
    props: (async function () {
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
