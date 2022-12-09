import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Link from 'next/link';
import Image from 'next/image';

/**
 * A clickable card that redirects the user to an external link
 *
 * @param param0 Data
 * @returns A clickable card
 */
export default function LinkCard ({ product }) {
  const img = (product && product.img) || null;
  const title = (product && product.title) || null;
  const link = (product && product.link) || null;

  return (
    <Box>
      {link && (
        <Link href={link}>
          <Flex
            w='full'
            h='full'
            alignItems='center'
            justifyContent='center'
            cursor='pointer'
            bg='white'
            rounded='xl'
            shadow='lg'
            borderWidth='1px'
          >
            <Box w='full' h='full'>
              {img && (
                <Box
                  w='100%'
                  height='200px'
                  position='relative'
                  overflow='hidden'
                  roundedTop='lg'
                >
                  <Image
                    src={img}
                    priority
                    alt='image'
                    fill
                    sizes='100vw'
                    style={{
                      objectFit: 'cover'
                    }}
                  />
                </Box>
              )}

              {title && (
                <Box p='6'>
                  <Box fontWeight='semibold' as='h5' lineHeight='tight'>
                    {title}
                  </Box>
                </Box>
              )}
            </Box>
          </Flex>
        </Link>
      )}
    </Box>
  );
}
